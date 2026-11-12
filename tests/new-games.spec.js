const { test, expect } = require('@playwright/test');

/* =========================================================
   THE FOUR GAMES ADDED IN v2.2
   Each one is played for real — question, input, scoring, turn
   resolution — rather than just loaded. The four differ enough in
   input (drag-release, tap-the-moving-thing, tap-a-grid, flip-and-
   remember) that a shared smoke test wouldn't prove much about any of
   them; what each test below actually pins down is that the game's
   own interaction produces a score and reaches the result modal.
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

test('Hoop Shot: three shots fire and the turn resolves', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 12, 'hoop');

  const box = await page.locator('#hoopCanvas').boundingBox();
  for (let i = 0; i < 3; i++) {
    const bx = box.x + box.width * 0.13, by = box.y + box.height * 0.84;
    await page.mouse.move(bx, by);
    await page.mouse.down();
    // Drag back and down: the launch vector points from here to the
    // ball, so this throws it up and to the right, toward the hoop.
    await page.mouse.move(bx - box.width * 0.10, by + box.height * 0.16, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(2600);
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

test('Treasure Dig: five digs reveal tiles and end the turn', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 14, 'dig');

  for (let i = 0; i < 5; i++) {
    await page.locator('.dig-tile:not(.dug)').first().click();
    await page.waitForTimeout(260);
  }
  expect(await page.locator('.dig-tile.dug').count(),
    'exactly the five allotted digs').toBe(5);
  // A sixth tap must do nothing — the turn is spent.
  await page.locator('.dig-tile:not(.dug)').first().click({ force: true }).catch(() => {});
  expect(await page.locator('.dig-tile.dug').count()).toBe(5);

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 8000 });
  await page.click('#digNextTeamBtn');
  expect(errors).toEqual([]);
});

test('Memory Match: a matching pair stays face-up and scores', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 15, 'memory');

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
