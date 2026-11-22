const { test, expect } = require('@playwright/test');

/* =========================================================
   PER-GAME FRAME RATE SURVEY
   tests/perf.spec.js guards the two games that were historically the
   heaviest. This one measures ALL of them the same way: live round,
   6x CPU throttle, achieved frame rate over a window (see that file's
   header for why frame rate, and why the worst 2% are trimmed).

   It also measures the moments nobody thinks of as "the game" but a
   class spends most of its time in: a team's turn waiting for input
   (Billiards, Hoop Shot), and a game sitting between turns. Those were
   where a lot of frames were going for nothing.

   Measured at 2560x1440 (a classroom panel), 6x CPU throttle:

                    live round fps        main thread between turns
                    before   after        before   after
     Stage 1 idle     54      60            38%      0%   (no game)
     Ball Pop         21      48-59          7%      0%
     Star Defender    24      59-60         23%      0%
     Billiards        29      60             2%      0%
     Neon Arena       28      55-60          8%      0%
     Fruit Ninja      28      53-60          9%      0%
     Hoop Shot        29      60             2%      0%
     Whack            24      60             3%      0%

   The guards sit well below those numbers so they fail on a real
   regression, not on noise. (They would have caught the one attempt in
   that pass that made things WORSE: moving Ball Pop's bokeh onto an
   oversized GPU layer, which measured 22fps.) Compare builds by running
   `npx playwright test perf` on its own.
========================================================= */

const THROTTLE_RATE = 6;
const SAMPLE_MS = 4000;

async function sampleFps(page, ms) {
  const deltas = await page.evaluate(async (ms) => {
    const frames = [];
    let last = performance.now();
    let on = true;
    const tick = (now) => {
      if (!on) return;
      frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await new Promise((r) => setTimeout(r, ms));
    on = false;
    return frames;
  }, ms);
  const d = deltas.slice(2).sort((a, b) => a - b);
  const keep = d.slice(0, Math.max(5, Math.floor(d.length * 0.98)));
  return +((keep.length / keep.reduce((a, b) => a + b, 0)) * 1000).toFixed(1);
}

// Main-thread load from Chrome's own counters: what share of wall time the
// renderer's main thread was busy (script + style + layout + paint
// recording), and how many layouts / style recalcs it ran per second.
// Frame rate alone can't see these on a fast dev machine — it pins at 60
// — but they are exactly the headroom a weak classroom PC doesn't have.
async function mainThreadLoad(cdp, ms) {
  const read = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const a = await read();
  await new Promise((r) => setTimeout(r, ms));
  const b = await read();
  const secs = b.Timestamp - a.Timestamp;
  return {
    busy: Math.round(((b.TaskDuration - a.TaskDuration) / secs) * 100),
    layouts: Math.round((b.LayoutCount - a.LayoutCount) / secs),
    styles: Math.round((b.RecalcStyleCount - a.RecalcStyleCount) / secs),
  };
}
const fmt = (m) => `busy=${String(m.busy).padStart(3)}% layouts/s=${String(m.layouts).padStart(3)} styles/s=${String(m.styles).padStart(3)}`;

async function openGame(page, stepIndex, prefix) {
  await page.goto('/index.html?lite=0'); // full quality: never measure auto-lite mode
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(stepIndex).evaluate((el) => el.click());
  await page.click(`#${prefix}NewGameBtn`);
  await page.click(`#${prefix}StartBtn`);
  await page.waitForTimeout(300);
}

async function beginTurn(page, prefix) {
  await page.click(`#${prefix}BeginTurnBtn`);
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  // Star Defender asks "play now or bank the time?" before its round.
  if (prefix === 'inv') await page.click('#confirmOkBtn');
  await page.waitForTimeout(250);
}

const GAMES = [
  { name: 'Balloon Pop',   step: 5,  prefix: 'pop' },
  { name: 'Star Defender', step: 6,  prefix: 'inv' },
  { name: 'Billiards',     step: 9,  prefix: 'billiards' },
  { name: 'Neon Arena',    step: 10, prefix: 'neon' },
  { name: 'Fruit Ninja',   step: 11, prefix: 'fruit' },
  { name: 'Hoop Shot',     step: 12, prefix: 'hoop' },
  { name: 'Whack-a-Jelly', step: 13, prefix: 'whack' },
  { name: 'Jelly Maze',    step: 14, prefix: 'maze' },
  { name: 'Ninja Jump',    step: 15, prefix: 'jump' },
  { name: 'Zombie Dash',   step: 16, prefix: 'zombie' },
];

test.describe('at a 4K classroom-panel resolution', () => {
  test.use({ viewport: { width: 2560, height: 1440 } });

  test('perf survey: lesson page (Stage 1, idle)', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.goto('/index.html?lite=0'); // full quality: never measure auto-lite mode
    await page.click('.lesson-card >> nth=0');
    await page.waitForTimeout(500);
    const idle = await mainThreadLoad(cdp, 3000);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE_RATE });
    const fps = await sampleFps(page, 3000);
    console.log(`[perf-survey] ${'Stage 1 idle'.padEnd(14)} @6x=${String(fps).padStart(4)}fps | ${fmt(idle)}`);
    expect(fps).toBeGreaterThan(30);
  });

  for (const g of GAMES) {
    test(`perf survey: ${g.name}`, async ({ page }) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Performance.enable');
      await openGame(page, g.step, g.prefix);
      const between = await mainThreadLoad(cdp, 2500);
      await beginTurn(page, g.prefix);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE_RATE });
      const live = await sampleFps(page, SAMPLE_MS);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const liveLoad = await mainThreadLoad(cdp, 2500);
      console.log(`[perf-survey] ${g.name.padEnd(14)} live@6x=${String(live).padStart(4)}fps | between turns: ${fmt(between)} | live round: ${fmt(liveLoad)}`);
      expect(live).toBeGreaterThan(30);
    });
  }
});
