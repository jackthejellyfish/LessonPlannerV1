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
  await page.locator('.step').nth(12).evaluate((el) => el.click());
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
  await page.locator('.step').nth(13).evaluate((el) => el.click());
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
