const { test, expect } = require('@playwright/test');

// Committed version of the scratchpad "full regression" script this project
// has hand-written fresh every session — see PROJECT_STATE.md. Sweeps every
// stage via the stepper and asserts zero console/page errors throughout,
// plus a few deeper per-stage smoke checks. Fullscreen game stages hide the
// visible stepper by design (see css/fullscreen-game.css), so steps are
// clicked via locator.evaluate(el => el.click()) to bypass Playwright's
// visibility gate rather than treating that as a bug.
//
// .wrap (stepper + all 16 stages) stays hidden behind the lesson-select
// screen (js/lessons.js) until a lesson card is picked — every test clicks
// the first card right after goto() purely to get past that gate; which
// lesson is picked doesn't matter for these structural assertions.

test('all 16 stages are reachable with zero console/page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');

  const steps = page.locator('.step');
  await expect(steps).toHaveCount(16);

  for (let i = 0; i < 16; i++) {
    await steps.nth(i).evaluate((el) => el.click());
    await page.waitForTimeout(150);
  }

  expect(errors).toEqual([]);
});

test('stage 1 Start lesson button advances to stage 2', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.click('.step >> nth=0');
  await page.click('#stage1 .btn-primary');
  await expect(page.locator('#stage2')).not.toHaveClass(/hidden/);
});

// Stage 2 is a one-rule-at-a-time slideshow now, not an accordion —
// Next advances through the rules and then the worked examples.
test('stage 2 advances one rule at a time', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(1).evaluate((el) => el.click());

  // Exactly one card on screen, and Previous is a dead end on slide 1.
  await expect(page.locator('.learn-card')).toHaveCount(1);
  await expect(page.locator('#learnPrevSlideBtn')).toBeDisabled();

  const firstRule = await page.locator('.learn-rule-name').textContent();
  await page.click('#learnNextSlideBtn');
  await expect(page.locator('.learn-rule-name')).not.toHaveText(firstRule);
  await expect(page.locator('#learnPrevSlideBtn')).toBeEnabled();
  await expect(page.locator('.learn-card')).toHaveCount(1);

  // Back returns to the rule we came from.
  await page.click('#learnPrevSlideBtn');
  await expect(page.locator('.learn-rule-name')).toHaveText(firstRule);

  // The last slide leads out of the stage rather than nowhere.
  const slides = await page.locator('.learn-dots .demo-dot').count();
  for (let i = 0; i < slides - 1; i++) await page.click('#learnNextSlideBtn');
  await expect(page.locator('#learnNextSlideBtn')).toHaveText(/Controlled practice/);
  await page.click('#learnNextSlideBtn');
  await expect(page.locator('#stage3')).not.toHaveClass(/hidden/);
});

test('stage 6 Ball Pop starts a round without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(5).evaluate((el) => el.click());
  // The setup screen opens on a menu now (New game / How to play).
  await page.click('#popNewGameBtn');
  await page.click('#popStartBtn');
  await page.waitForTimeout(300);

  expect(errors).toEqual([]);
});

test('stage 9 practice questions has 4 tabs', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(8).evaluate((el) => el.click());
  await page.waitForTimeout(200);
  await expect(page.locator('.qs-tab')).toHaveCount(4);
});
