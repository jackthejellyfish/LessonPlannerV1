const { test, expect } = require('@playwright/test');

/* =========================================================
   THE GAMES ADDED IN v2.2
   Each one is played for real — question, input, scoring, turn
   resolution — rather than just loaded. They differ enough in input
   (aim-and-shoot, tap-the-moving-thing) that a
   shared smoke test wouldn't prove much about any of them; what each
   test below pins down is that the game's own interaction produces a
   score and reaches the result modal.
========================================================= */

async function openGame(page, step, prefix) {
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(step).evaluate((el) => el.click());
  // The setup screen opens on a menu (New game / How to play).
  await page.click(`#${prefix}NewGameBtn`);
  await page.click(`#${prefix}StartBtn`);
  await page.waitForTimeout(250);
  await page.click(`#${prefix}BeginTurnBtn`);
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(300);
}

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  return errors;
}

test('Hoop Shot: angle and power are set directly, then SHOOT fires; three shots end the turn', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 12, 'hoop');

  const shotsLeft = page.locator('#hoopShotsDisplay');
  const angle = page.locator('#hoopAngleValue');
  const power = page.locator('#hoopPowerValue');
  const shoot = page.locator('#hoopShootBtn');
  await expect(shotsLeft).toHaveText('3');
  await expect(page.locator('#hoopControls')).toBeVisible();

  // The +/- buttons change the values directly — no timing involved.
  const a0 = await angle.textContent();
  await page.click('#hoopAngleUp');
  await page.click('#hoopAngleUp');
  expect(await angle.textContent()).not.toBe(a0);
  await expect(power).toHaveText('50%');
  await page.click('#hoopPowerUp');
  await expect(power).toHaveText('51%');
  // Keyboard works too.
  await page.keyboard.press('ArrowLeft');
  await expect(power).toHaveText('50%');

  // Tapping the court points the shot but never fires it.
  await page.locator('#hoopCanvas').click({ position: { x: 600, y: 150 } });
  await expect(shotsLeft).toHaveText('3');
  await expect(shoot).toBeEnabled();

  for (const remaining of ['2', '1', '0']) {
    await expect(shoot).toBeEnabled({ timeout: 9000 });
    await shoot.click();
    // Controls lock while the ball is in the air.
    await expect(page.locator('#hoopAngleUp')).toBeDisabled();
    await expect(shotsLeft).toHaveText(remaining, { timeout: 9000 });
  }

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 12000 });
  await page.click('#hoopNextTeamBtn');
  expect(errors).toEqual([]);
});

test('Whack-a-Monster: monsters pop up and whacking them scores', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 13, 'whack');

  await page.waitForTimeout(1200);
  expect(await page.locator('.whack-hole.up').count(),
    'monsters should be popping up').toBeGreaterThan(0);

  // Tap whatever is up, avoiding bombs, for most of the round.
  for (let i = 0; i < 25; i++) {
    const m = page.locator('.whack-hole.up:not(.bomb) .whack-monster').first();
    if (await m.count()) await m.click({ force: true }).catch(() => {});
    await page.waitForTimeout(260);
  }
  expect(Number(await page.locator('#whackScoreDisplay').textContent()),
    'whacking monsters should score').toBeGreaterThan(0);

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 20000 });
  await page.click('#whackNextTeamBtn');
  expect(errors).toEqual([]);
});
