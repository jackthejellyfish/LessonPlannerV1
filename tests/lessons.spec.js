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

const STAGE_COUNT = 12;

test('every lesson renders every stage with no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  const lessonCount = await page.locator('.lesson-card').count();
  expect(lessonCount).toBe(5);

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

    await steps.nth(1).evaluate((el) => el.click());
    expect(await page.locator('#ruleGrid .rule-row').count(),
      `${title}: stage 2 rule cards`).toBeGreaterThan(1);
    expect(await page.locator('#compareDemo svg').count(),
      `${title}: stage 2 compare icons`).toBeGreaterThan(1);

    await steps.nth(4).evaluate((el) => el.click());
    expect(await page.locator('#wordBank li, #wordBank .word-pair, #wordBank > *').count(),
      `${title}: stage 5 word bank`).toBeGreaterThan(5);

    await steps.nth(8).evaluate((el) => el.click());
    expect(await page.locator('.qs-tab').count(), `${title}: stage 9 tabs`).toBe(4);
  }

  expect(errors).toEqual([]);
});
