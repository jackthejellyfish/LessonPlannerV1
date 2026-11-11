const { test, expect } = require('@playwright/test');

/* =========================================================
   FRAME-TIME BUDGET
   The v2 brief opened with "animations are causing issues on work
   computers". This spec exists so that claim can be answered with
   measurements instead of impressions: it drives a real round of the
   two heaviest games and records how long each frame actually took.

   The work machines can't be reproduced here, so CPU is throttled via
   CDP (see THROTTLE_RATE) as a stand-in for low-end integrated
   graphics. That makes the ABSOLUTE numbers a proxy, not a prediction —
   but the BEFORE/AFTER delta on the same throttled profile is a fair
   measure of whether an optimization actually did anything.

   WHAT IS MEASURED, AND HOW IT GOT THERE. Two earlier attempts were
   wrong in instructive ways, so they're recorded here rather than
   silently replaced:

   1. Median frame DELTA. Useless for tuning on its own: the browser is
      vsync-locked, so every delta snaps to a multiple of 16.7ms. Real
      improvements vanish and ordinary jitter across the boundary reads
      as a 2x regression. Both were observed.
   2. Time spent inside the rAF CALLBACK. Looks rigorous, measures the
      wrong thing: ctx.fill()/drawImage only RECORD draw commands into
      a display list. Rasterization — which is exactly where a big
      gradient fill costs its time — happens afterwards, off-thread, and
      so doesn't appear in the callback at all. This reported a
      comfortable 0.8ms/frame for a game visibly running at 20fps.

   So: achieved FRAME RATE over a sampling window. It captures the whole
   pipeline including raster, and because it's a count over a fixed
   duration it's continuous — no vsync quantization — which makes it
   usable for comparing one optimization against another.
========================================================= */

const THROTTLE_RATE = 6;      // 6x slowdown — rough stand-in for a weak office PC
const SAMPLE_MS = 5000;       // how long to watch a live round for
// Budgets are set from MEASURED numbers, not from an aspirational 60,
// and deliberately BELOW the best observed run — repeated runs of this
// harness vary by roughly +/-5fps, so a threshold set at the peak would
// fail on noise rather than on regressions.
//
//   before (pre canvasGlow / render-scale)   after        guard
//   Ball Pop      12.9 - 16.6 fps            34 - 41      27
//   Fruit Ninja   ~20 fps                    38 - 52      33
//   Stage 1 idle  60 fps                     60           55
//
// Fruit Ninja's ceiling is lower than it was mid-optimization because
// the difficulty retune (FRUIT_GRAVITY and the spawn volleys) roughly
// tripled how many shapes are airborne — it is drawing far more than
// the "before" column did, and still runs about twice as fast.
//
// The guards sit well under even the low end, because these numbers
// also depend on WHERE in the suite they run: measured alone, Ball Pop
// reads ~32fps; measured after the other ten specs have warmed the
// machine up, the same build reads ~24fps. That is the harness, not the
// app. Run `npx playwright test perf` on its own when comparing builds.
const MIN_FPS = { ballpop: 21, fruit: 28, idle: 50 };

// A self-driving rAF loop running alongside whatever the page is doing.
// It measures the rate the display pipeline actually achieves, so it
// works on an idle page (no game loop) as well as mid-round.
async function sampleFrames(page, ms) {
  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    window.__sampling = true;
    const tick = (now) => {
      if (!window.__sampling) return;
      window.__frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.waitForTimeout(ms);
  return page.evaluate(() => {
    window.__sampling = false;
    return window.__frames;
  });
}

function summarise(label, deltas) {
  // The first couple of frames include the sampler's own startup cost.
  const d = deltas.slice(2);
  if (d.length < 5) throw new Error(`no frames sampled for ${label}`);
  const elapsed = d.reduce((a, b) => a + b, 0);
  const sorted = d.slice().sort((a, b) => a - b);
  const stats = {
    fps: +((d.length / elapsed) * 1000).toFixed(1),
    // Share of frames that made a single vsync interval — "how often did
    // it actually feel smooth", which a mean can hide.
    smoothPct: +((d.filter((x) => x <= 18).length / d.length) * 100).toFixed(0),
    worst: +sorted[sorted.length - 1].toFixed(1),
  };
  console.log(
    `
[perf] ${label} @${THROTTLE_RATE}x CPU throttle — ` +
    `fps=${stats.fps} smooth=${stats.smoothPct}% worstFrame=${stats.worst}ms
`
  );
  return stats;
}

async function throttle(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE_RATE });
  return cdp;
}

// Every game opens the same way: pick a lesson, jump to the stage via the
// stepper (evaluate-click, since fullscreen stages hide the visible
// stepper), start the game, begin a turn, then clear the warm-up question
// modal. Same flow tests/team-games.spec.js already uses.
async function openRound(page, { stepIndex, prefix }) {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(stepIndex).evaluate((el) => el.click());
  // The setup screen opens on a menu now (New game / How to play).
  await page.click(`#${prefix}NewGameBtn`);
  await page.click(`#${prefix}StartBtn`);
  await page.waitForTimeout(300);
  await page.click(`#${prefix}BeginTurnBtn`);
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(250);
}

test('perf: Ball Pop holds its frame budget under CPU throttling', async ({ page }) => {
  await throttle(page);
  await openRound(page, { stepIndex: 5, prefix: 'pop' });

  const stats = summarise('Ball Pop', await sampleFrames(page, SAMPLE_MS));
  expect(stats.fps).toBeGreaterThan(MIN_FPS.ballpop);
});

test('perf: Fruit Ninja holds its frame budget under CPU throttling', async ({ page }) => {
  await throttle(page);
  await openRound(page, { stepIndex: 11, prefix: 'fruit' });

  const stats = summarise('Fruit Ninja', await sampleFrames(page, SAMPLE_MS));
  expect(stats.fps).toBeGreaterThan(MIN_FPS.fruit);
});

test('perf: the idle lesson pages do not animate the whole viewport', async ({ page }) => {
  // Stage 1 is a static page with no game loop at all. If frames are being
  // spent here, it's page chrome (the body background drift) — not gameplay.
  await throttle(page);
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.waitForTimeout(300);

  const stats = summarise('Stage 1 (idle)', await sampleFrames(page, 3000));
  expect(stats.fps).toBeGreaterThan(MIN_FPS.idle);
});
