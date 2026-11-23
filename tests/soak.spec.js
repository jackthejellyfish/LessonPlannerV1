const { test, expect } = require('@playwright/test');

/* =========================================================
   SOAK TEST (slow: several minutes, so it is opt-in)
   Run with:  SOAK=1 npx playwright test soak
   A class plays many turns of many games in one sitting. This plays
   every game for real with 6 teams (random clicks, swipes and keys,
   leaving some rounds half-way through, restarting the lesson) and
   records memory, DOM nodes and event listeners after a forced garbage
   collection between games. Anything that keeps growing is a leak that
   would eventually take the browser down on a weak classroom PC.
========================================================= */
test.skip(!process.env.SOAK, 'set SOAK=1 to run the soak test');
// A click on something hidden must fail, not wait forever.
test.use({ actionTimeout: 15000 });
const fs = require('fs');
const LOG = process.env.SOAK_LOG;
const log = (line) => { console.log(line); if(LOG) fs.appendFileSync(LOG, line + '\n'); };

const GAMES = [
  { step: 9, prefix: 'pop' }, { step: 10, prefix: 'inv' }, { step: 11, prefix: 'wheel' },
  { step: 13, prefix: 'billiards' }, { step: 14, prefix: 'neon' }, { step: 15, prefix: 'fruit' },
  { step: 16, prefix: 'hoop' }, { step: 17, prefix: 'whack' }, { step: 18, prefix: 'maze' },
  { step: 19, prefix: 'jump' }, { step: 20, prefix: 'zombie' }
];
const TURNS = Number(process.env.SOAK_TURNS || 3);

async function metrics(cdp){
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics: m } = await cdp.send('Performance.getMetrics');
  const get = (n) => (m.find(x => x.name === n) || {}).value;
  return {
    heapMB: +(get('JSHeapUsedSize') / 1048576).toFixed(1),
    nodes: get('Nodes'),
    listeners: get('JSEventListeners'),
    docs: get('Documents')
  };
}

async function answerQuestion(page){
  const overlay = page.locator('#popQuestionOverlay');
  await expect(overlay).not.toHaveClass(/hidden/, { timeout: 15000 });
  const choice = page.locator('#popQuestionBody .mc-choice').first();
  if(await choice.count()){
    await choice.click();
    await page.click('#popMcContinueBtn');
  } else {
    await page.click('#popCheckBtn');
    await page.click('#popCorrectBtn');
  }
}

async function playTurn(page, prefix, { abandon = false } = {}){
  await page.click(`#${prefix}BeginTurnBtn`);
  await answerQuestion(page);
  // Star Defender asks "play now or bank it?" after the question.
  const playNow = page.locator('#confirmOverlay:not(.hidden) #confirmOkBtn');
  if(await playNow.isVisible().catch(() => false)) await playNow.click();
  const canvas = page.locator(`#${prefix}Canvas`);
  const box = await canvas.boundingBox();
  const start = Date.now();
  const keys = ['a', 'd', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'w'];
  while(Date.now() - start < 40000){
    if(await page.locator('#popResultOverlay').evaluate(el => !el.classList.contains('hidden'))) break;
    if(abandon && Date.now() - start > 3000) return 'abandoned';
    if(prefix === 'billiards'){
      const cue = await page.evaluate(async () => {
        const m = await import('/js/state.js');
        const c = m.state.billiardsBalls.find(b => b.isCue);
        return c ? { x: c.x, y: c.y } : null;
      });
      if(cue){
        await page.mouse.move(box.x + cue.x, box.y + cue.y);
        await page.mouse.down();
        await page.mouse.move(box.x + cue.x - 80, box.y + cue.y + 20, { steps: 5 });
        await page.mouse.up();
      }
    } else if(prefix === 'hoop'){
      const btn = page.locator('#hoopShootBtn');
      if(await btn.isEnabled()) await btn.click();
    } else if(box){
      // A scribble, a tap and a few keys: the way a class actually plays.
      const y = box.y + box.height * (0.2 + Math.random() * 0.6);
      await page.mouse.move(box.x + 20, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 20, y + 40, { steps: 6 });
      await page.mouse.up();
      await page.mouse.click(box.x + Math.random() * box.width, box.y + Math.random() * box.height);
      const k = keys[Math.floor(Math.random() * keys.length)];
      await page.keyboard.down(k);
      await page.waitForTimeout(120);
      await page.keyboard.up(k);
    }
    await page.waitForTimeout(80);
  }
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 20000 });
  await page.click(`#${prefix}NextTeamBtn`);
  return 'played';
}

test('soak: every game, many turns, memory stays flat', async ({ page }) => {
  test.setTimeout(60 * 60 * 1000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('crash', () => errors.push('PAGE CRASHED'));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');

  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(8).click();
  const samples = [];
  samples.push({ at: 'start', ...(await metrics(cdp)) });

  for(let lap = 0; lap < 2; lap++){
    for(const g of GAMES){
      await page.locator('.step').nth(g.step).evaluate((el) => el.click());
      if(await page.locator(`#${g.prefix}NewGameBtn`).isVisible()){
        await page.click(`#${g.prefix}NewGameBtn`);
        for(let i = 0; i < 4; i++){
          const add = page.locator(`#${g.prefix}AddTeamBtn`);
          if(await add.isVisible() && await add.isEnabled()) await add.click();
        }
        await page.click(`#${g.prefix}StartBtn`);
        await page.waitForTimeout(200);
      }
      for(let t = 0; t < TURNS; t++){
        // On the second lap, walk away from one round half-way through.
        const abandon = lap === 1 && t === TURNS - 1;
        const r = await playTurn(page, g.prefix, { abandon });
        if(r === 'abandoned') break;
      }
      samples.push({ at: `lap${lap}:${g.prefix}`, ...(await metrics(cdp)) });
      log(JSON.stringify(samples[samples.length - 1]));
    }
    // A full restart, the way the teacher starts the next class.
    await page.locator('.stage:not(.hidden) .restart-lesson-btn').first().click({ timeout: 5000 }).catch(() => {});
    await page.locator('#confirmOkBtn').click({ timeout: 3000 }).catch(() => {});
    log('restarted lesson');
  }
  samples.push({ at: 'end', ...(await metrics(cdp)) });
  log(JSON.stringify(samples[samples.length - 1]));

  expect(errors).toEqual([]);
  const first = samples.find(s => s.at.startsWith('lap0:jump')) || samples[1];
  const last = samples[samples.length - 1];
  expect(last.heapMB, 'JS heap after a second lap of every game').toBeLessThan(first.heapMB * 1.5 + 5);
  expect(last.nodes, 'DOM nodes').toBeLessThan(first.nodes * 1.5 + 500);
  expect(last.listeners, 'event listeners').toBeLessThan(first.listeners * 1.5 + 200);
});
