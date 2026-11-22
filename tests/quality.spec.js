const { test, expect } = require('@playwright/test');

/* =========================================================
   ADAPTIVE QUALITY, THE FRAME METER, AND RESIZE SAFETY
   js/quality.js (lite mode), js/fpsMeter.js (?fps) and the Billiards
   resize remap. State is read by importing the app's own module from
   the page: the browser hands back the same instance the app uses.
========================================================= */

async function startTurn(page, stepIndex, prefix) {
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(stepIndex).evaluate((el) => el.click());
  await page.click(`#${prefix}NewGameBtn`);
  await page.click(`#${prefix}StartBtn`);
  await page.waitForTimeout(300);
  await page.click(`#${prefix}BeginTurnBtn`);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(300);
}

test('lite mode: off by default, forced on with ?lite=1, and games still run', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/index.html');
  await expect(page.locator('body')).not.toHaveClass(/low-quality/);

  await page.goto('/index.html?lite=1');
  await expect(page.locator('body')).toHaveClass(/low-quality/);
  await startTurn(page, 13, 'fruit');
  await page.waitForTimeout(1500);
  // Smaller canvas buffer in lite mode (70% of the usual 820px cap).
  const w = await page.locator('#fruitCanvas').evaluate((c) => c.width);
  expect(w).toBeLessThanOrEqual(Math.round(820 * 0.7) + 1);
  expect(errors).toEqual([]);
});

test('lite mode switches itself on when a PC cannot keep up', async ({ page }) => {
  await page.goto('/index.html');
  await startTurn(page, 13, 'fruit');
  await expect(page.locator('body')).not.toHaveClass(/low-quality/);
  // A heavy throttle stands in for a weak machine (~30-45fps here).
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 14 });
  await expect(page.locator('body')).toHaveClass(/low-quality/, { timeout: 12000 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});

test('?fps shows the frame meter; without it there is none', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.fps-meter')).toHaveCount(0);
  await page.goto('/index.html?fps');
  await expect(page.locator('.fps-meter')).toHaveText(/\d+ fps · worst \d+ms · lite (on|off)/, { timeout: 4000 });
});

test('billiards: the rack stays on the table when the board is resized mid-turn', async ({ page }) => {
  await page.goto('/index.html');
  await startTurn(page, 11, 'billiards');

  const snapshot = () => page.evaluate(async () => {
    const { state } = await import('/js/state.js');
    const c = document.getElementById('billiardsCanvas');
    const [a, b] = state.billiardsBalls;
    return {
      w: c.width, h: c.height,
      balls: state.billiardsBalls.map((x) => ({ x: x.x, y: x.y, r: x.r })),
      // Scale-free shape of the rack: distance between two balls in
      // units of ball radius. Must survive a resize unchanged.
      shape: Math.hypot(a.x - b.x, a.y - b.y) / a.r,
    };
  });

  const before = await snapshot();
  await page.click('#compactModeBtn');
  await page.waitForTimeout(400);
  const after = await snapshot();

  // The buffer width is capped (820px), so a resize may change only the height.
  expect(after.w !== before.w || after.h !== before.h).toBe(true);
  for (const b of after.balls) {
    expect(b.x).toBeGreaterThan(0);
    expect(b.x).toBeLessThan(after.w);
    expect(b.y).toBeGreaterThan(0);
    expect(b.y).toBeLessThan(after.h);
  }
  expect(after.shape).toBeCloseTo(before.shape, 3);
});
