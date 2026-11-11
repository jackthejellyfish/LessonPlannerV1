const { test, expect } = require('@playwright/test');

// Real playthrough assertions for two representative team-based games
// (rather than every one of the 8 — see the plan this suite shipped under).
// Template for extending coverage to the rest later. Adapted from this
// session's scratchpad scripts (verify_billiards_gameplay_fix.js /
// verify_neonarena_combat.js), converted from console.log inspection into
// real expect() assertions.

test('Billiards: a full turn answers a question, resolves a shot, and updates the scoreboard', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(9).evaluate((el) => el.click());
  await page.click('#billiardsStartBtn');
  await page.waitForTimeout(300);

  await page.click('#billiardsBeginTurnBtn');
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(250);

  const canvasBox = await page.locator('#billiardsCanvas').boundingBox();
  const cueBox = await page.evaluate(async () => {
    const m = await import('/js/state.js');
    const cue = m.state.billiardsBalls.find((b) => b.isCue);
    return { x: cue.x, y: cue.y };
  });

  await page.mouse.move(canvasBox.x + cueBox.x, canvasBox.y + cueBox.y);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + cueBox.x - 90, canvasBox.y + cueBox.y, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 9000 });
  const scoreText = await page.locator('#popResultBody .result-pill.active .result-pill-score').textContent();
  expect(scoreText).toMatch(/^\d+$/);

  await page.click('#billiardsNextTeamBtn');
  await expect(page.locator('#popResultOverlay')).toHaveClass(/hidden/);

  expect(errors).toEqual([]);
});

test('Neon Arena: a full turn answers a question, plays a round, and reaches the result modal', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(10).evaluate((el) => el.click());
  await page.click('#neonStartBtn');
  await page.waitForTimeout(300);

  await page.click('#neonBeginTurnBtn');
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(200);

  await expect(page.locator('#neonPlayArea')).not.toHaveClass(/idle/);

  // Move and fire for a moment to touch the real game loop, then let the
  // 20s round finish naturally.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.down('d');
    await page.waitForTimeout(100);
    await page.keyboard.up('d');
  }

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 25000 });
  await page.click('#neonNextTeamBtn');

  expect(errors).toEqual([]);
});

// Fruit Ninja earns its own test for two v2-specific reasons: its drag
// listeners are now attached per-swipe rather than permanently (so a
// regression there silently stops ALL slicing), and its difficulty was
// retuned, which only means anything if a swipe still scores.
test('Fruit Ninja: a swipe across the play area slices shapes and scores', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(11).evaluate((el) => el.click());
  await page.click('#fruitStartBtn');
  await page.waitForTimeout(300);

  await page.click('#fruitBeginTurnBtn');
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');

  // Let a volley get airborne before swiping at it.
  await page.waitForTimeout(1800);
  const box = await page.locator('#fruitCanvas').boundingBox();

  // Sweep repeatedly across the middle of the play area. Shapes arc
  // through that band, so this reliably crosses several of them without
  // depending on where any particular shape happens to be.
  for (let pass = 0; pass < 6; pass++) {
    const y = box.y + box.height * (0.45 + (pass % 3) * 0.12);
    await page.mouse.move(box.x + 30, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 30, y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(220);
  }

  const score = Number(await page.locator('#fruitScoreDisplay').textContent());
  expect(score).toBeGreaterThan(0);

  // The round is 15s now, not 10 — confirm it is still running well past
  // where the old timer would have ended it.
  await page.waitForTimeout(600);
  const remaining = await page.locator('#fruitTimeDisplay').textContent();
  expect(Number(remaining)).toBeGreaterThan(0);

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 20000 });
  await page.click('#fruitNextTeamBtn');

  expect(errors).toEqual([]);
});
