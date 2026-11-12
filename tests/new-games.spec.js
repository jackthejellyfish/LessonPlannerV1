const { test, expect } = require('@playwright/test');

/* =========================================================
   THE GAMES ADDED IN v2.2
   Each one is played for real — question, input, scoring, turn
   resolution — rather than just loaded. They differ enough in input
   (aim-then-power, tap-the-moving-thing, flip-and-remember) that a
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

test('Hoop Shot: two taps per shot fire it, and three shots end the turn', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 12, 'hoop');

  const canvas = page.locator('#hoopCanvas');
  const hint = page.locator('#hoopHint');
  const shotsLeft = page.locator('#hoopShotsDisplay');
  await expect(shotsLeft).toHaveText('3');

  for (const remaining of ['2', '1', '0']) {
    // Wait for the next ball to actually be ready. The shots counter
    // ticks down the moment a shot resolves, but the fresh ball only
    // appears a beat later — taps in that gap are ignored, which is
    // exactly what made an earlier version of this test fail.
    await expect(hint).toHaveText('Tap to set the angle!', { timeout: 9000 });

    // Tap once to lock the angle, again to lock the power and launch.
    // Deliberately NO dragging: the drag version of this game could
    // leave the board mid-pull and never fire at all.
    await canvas.click({ position: { x: 300, y: 200 } });
    await expect(hint).toHaveText('Now tap to set the power!');
    await canvas.click({ position: { x: 300, y: 200 } });

    // Then wait for the shot to RESOLVE rather than guessing how long
    // a miss takes — a ball that clatters off the rim stays live for
    // several seconds.
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

test('Memory Match: a matching pair stays face-up and scores', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 14, 'memory');

  // Read the symbols so the pair is matched deliberately rather than by
  // luck — a random-guess test would be flaky by construction.
  const glyphs = await page.locator('.memory-front').allTextContents();
  const first = glyphs.indexOf(glyphs[0]);
  const second = glyphs.indexOf(glyphs[0], first + 1);
  await page.locator('.memory-card').nth(first).click();
  await page.locator('.memory-card').nth(second).click();
  await page.waitForTimeout(400);

  expect(await page.locator('.memory-card.matched').count(),
    'both cards of a matched pair stay up').toBe(2);
  await expect(page.locator('#memoryScoreDisplay')).toHaveText('1/6');

  // A deliberate MISmatch must flip both back down again.
  const other = glyphs.findIndex((g) => g !== glyphs[0]);
  const otherPartner = glyphs.findIndex((g, i) => i !== other && g !== glyphs[0] && g !== glyphs[other]);
  await page.locator('.memory-card').nth(other).click();
  await page.locator('.memory-card').nth(otherPartner).click();
  await page.waitForTimeout(1200);
  expect(await page.locator('.memory-card.flipped:not(.matched)').count(),
    'a mismatched pair turns back over').toBe(0);

  expect(errors).toEqual([]);
});
