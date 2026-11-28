const { test, expect } = require('@playwright/test');

/* =========================================================
   EVERY LESSON, EVERY STAGE
   tests/full-regression.spec.js walks all 12 stages but only ever on
   the FIRST lesson card, so a typo in a newly added lesson's content
   (a missing icon case, a malformed question entry, a stage whose
   content array came out empty) would not show up there at all.

   This walks every lesson in the picker through every stage and
   asserts zero console/page errors, plus that the hand-authored
   stages actually rendered something. Those four — aim, rules, free
   practice, worksheet — are the ones written by hand per lesson, so
   they are where content mistakes land; the game stages are uniform
   {prompt, answer} banks and are covered by the error check alone.
========================================================= */

const STAGE_COUNT = 21;

test('every lesson renders every stage with no console errors', async ({ page }) => {
  // About 2.5s a lesson: past the 30s default once there were 12 lessons.
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  const lessonCount = await page.locator('.lesson-card').count();
  expect(lessonCount).toBe(12);

  for (let lesson = 0; lesson < lessonCount; lesson++) {
    await page.goto('/index.html');
    const title = await page.locator('.lesson-card h2').nth(lesson).textContent();
    await page.locator('.lesson-card').nth(lesson).click();

    const steps = page.locator('.step');
    await expect(steps).toHaveCount(STAGE_COUNT);

    for (let i = 0; i < STAGE_COUNT; i++) {
      // evaluate-click bypasses Playwright's visibility gate: fullscreen
      // game stages hide the stepper by design.
      await steps.nth(i).evaluate((el) => el.click());
      await page.waitForTimeout(60);
    }

    // Back to the hand-authored stages to check they actually have content.
    await steps.nth(0).evaluate((el) => el.click());
    expect(await page.locator('#aimExamples .aim-example').count(),
      `${title}: stage 1 aim examples`).toBe(3);
    // Each aim example must have resolved to a real icon case — a typo in
    // an `icon` name silently renders an empty string, not an error.
    expect(await page.locator('#aimExamples .aim-example svg').count(),
      `${title}: stage 1 icons`).toBe(3);

    // Stage 2 shows one slide at a time: every rule, then every worked
    // example. Checking the deck length catches a lesson whose RULES or
    // COMPARE_DEMOS array didn't load, which a single-slide check can't.
    await steps.nth(1).evaluate((el) => el.click());
    expect(await page.locator('.learn-card').count(),
      `${title}: stage 2 shows exactly one slide`).toBe(1);
    const deck = await page.locator('.learn-dots .demo-dot').count();
    expect(deck, `${title}: stage 2 deck length`).toBeGreaterThan(3);
    // Step to the end so every rule AND every example renders at least
    // once — a bad icon name or malformed rule only shows on its own
    // slide, so a first-slide-only check would miss it.
    for (let d = 1; d < deck; d++) await page.click('#learnNextSlideBtn');
    expect(await page.locator('.learn-card-demo .compare-icon-frame svg').count(),
      `${title}: stage 2 example icons`).toBe(2);

    await steps.nth(4).evaluate((el) => el.click());
    expect(await page.locator('#wordBank li, #wordBank .word-pair, #wordBank > *').count(),
      `${title}: stage 5 word bank`).toBeGreaterThan(5);

    await steps.nth(12).evaluate((el) => el.click());
    expect(await page.locator('.ws-col').count(), `${title}: stage 9 sections`).toBe(3);
    expect(await page.locator('.ws-item').count(), `${title}: stage 9 questions`).toBe(15);
  }

  expect(errors).toEqual([]);
});
