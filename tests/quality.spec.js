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
  await startTurn(page, 15, 'fruit');
  await page.waitForTimeout(1500);
  // Smaller canvas buffer in lite mode (70% of the usual 820px cap).
  const w = await page.locator('#fruitCanvas').evaluate((c) => c.width);
  expect(w).toBeLessThanOrEqual(Math.round(820 * 0.7) + 1);
  expect(errors).toEqual([]);
});

test('lite mode switches itself on when a PC cannot keep up', async ({ page }) => {
  await page.goto('/index.html');
  await startTurn(page, 15, 'fruit');
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

// A canvas is wiped whenever its size is assigned. The Spin Wheel had no
// repaint after a window resize (F11, plugging into the board), so the
// wheel went blank until the next spin (2026-11-25).
test('spin wheel: still drawn after the window is resized between turns', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(11).evaluate((el) => el.click());
  await page.click('#wheelNewGameBtn');
  await page.click('#wheelStartBtn');
  await page.waitForTimeout(400);
  const centreAlpha = () => page.locator('#wheelCanvas').evaluate((c) =>
    c.getContext('2d').getImageData(c.width >> 1, c.height >> 1, 1, 1).data[3]);
  expect(await centreAlpha()).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1500, height: 1000 }); // width only: the footer keeps its height
  await page.waitForTimeout(500);
  expect(await centreAlpha()).toBeGreaterThan(0);
});

// Lite mode is remembered on this PC (localStorage), so a slow classroom
// PC starts the next lesson in lite mode instead of stuttering into it
// again; ?lite=0 forgets it. A PC that is still slow in lite mode steps
// down once more (level 2: an even smaller canvas buffer).
test('lite mode: remembered across visits, forgotten with ?lite=0, level 2 shrinks further', async ({ page }) => {
  await page.goto('/index.html?lite=2');
  await expect(page.locator('body')).toHaveClass(/low-quality/);
  await startTurn(page, 15, 'fruit');
  await page.waitForTimeout(800);
  const w = await page.locator('#fruitCanvas').evaluate((c) => c.width);
  expect(w).toBeLessThanOrEqual(Math.round(820 * 0.5) + 1);

  // Simulate a PC that tripped lite mode on its own, then a new visit.
  await page.evaluate(() => localStorage.setItem('lpa-quality', JSON.stringify({ level: 1, at: Date.now() })));
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveClass(/low-quality/);

  // An old record has expired.
  await page.evaluate(() => localStorage.setItem('lpa-quality', JSON.stringify({ level: 1, at: Date.now() - 30 * 864e5 })));
  await page.goto('/index.html');
  await expect(page.locator('body')).not.toHaveClass(/low-quality/);

  await page.evaluate(() => localStorage.setItem('lpa-quality', JSON.stringify({ level: 1, at: Date.now() })));
  await page.goto('/index.html?lite=0');
  await expect(page.locator('body')).not.toHaveClass(/low-quality/);
  expect(await page.evaluate(() => localStorage.getItem('lpa-quality'))).toBeNull();
});

// The teacher's own lite mode button (top right, games only). A choice
// made by hand is remembered on the PC.
test('lite mode button: only in games, switches lite mode both ways, remembered', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await expect(page.locator('#liteModeBtn')).toBeHidden();
  await page.locator('.step').nth(15).evaluate((el) => el.click());
  const btn = page.locator('#liteModeBtn');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');

  await btn.click();
  await expect(page.locator('body')).toHaveClass(/low-quality/);
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await page.click('#fruitNewGameBtn');
  await page.click('#fruitStartBtn');
  await page.waitForTimeout(500);
  expect(await page.locator('#fruitCanvas').evaluate((c) => c.width)).toBeLessThanOrEqual(Math.round(820 * 0.7) + 1);

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/low-quality/);

  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(15).evaluate((el) => el.click());
  await page.click('#liteModeBtn');
  await expect(page.locator('body')).not.toHaveClass(/low-quality/);
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/low-quality/);
});

test('billiards: the rack stays on the table when the board is resized mid-turn', async ({ page }) => {
  await page.goto('/index.html');
  await startTurn(page, 13, 'billiards');

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
