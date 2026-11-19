const { test, expect } = require('@playwright/test');

/* =========================================================
   GAMES FIT ON SMALLER SCREENS
   Classroom feedback (2026-11-18): on a work laptop the Star Defender
   ship and the Hoop Shot ball were hidden. Both sit at the very bottom
   of their play area, and the fullscreen footer bar (team pills, timer,
   Back/Next) had wrapped onto two lines and grown taller than the fixed
   space reserved for it, so it covered the bottom of the game.

   This opens every team game with the maximum 6 teams at common laptop
   viewports (125% Windows scaling turns a 1920x1080 screen into about
   1536x730 of page) and checks that the play area sits wholly between
   the top step bar and the bottom footer bar.
========================================================= */

const GAMES = [
  { step: 5, prefix: 'pop' },
  { step: 6, prefix: 'inv' },
  { step: 7, prefix: 'wheel' },
  { step: 9, prefix: 'billiards' },
  { step: 10, prefix: 'neon' },
  { step: 11, prefix: 'fruit' },
  { step: 12, prefix: 'hoop' },
  { step: 13, prefix: 'whack' },
  { step: 14, prefix: 'maze' },
  { step: 15, prefix: 'jump' },
];

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1536, height: 730 },
];

for (const vp of VIEWPORTS) {
  test(`every game's play area clears the step bar and footer at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/index.html');
    await page.locator('.lesson-card').nth(0).click();
    const problems = [];
    for (const g of GAMES) {
      await page.locator('.step').nth(g.step).evaluate((el) => el.click());
      await page.click(`#${g.prefix}NewGameBtn`);
      // Up to 6 teams: the widest footer the game can produce.
      for (let i = 0; i < 4; i++) {
        const add = page.locator(`#${g.prefix}AddTeamBtn`);
        if (await add.isVisible() && await add.isEnabled()) await add.click();
      }
      await page.click(`#${g.prefix}StartBtn`);
      await page.waitForTimeout(400);
      const box = await page.evaluate((prefix) => {
        const area = document.getElementById(`${prefix}PlayArea`).getBoundingClientRect();
        const stage = document.getElementById(`${prefix}PlayArea`).closest('.stage');
        const footer = stage.querySelector('.stage-footer').getBoundingClientRect();
        const stepper = document.getElementById('stepper').getBoundingClientRect();
        return { top: area.top, bottom: area.bottom, footerTop: footer.top, stepperBottom: stepper.bottom, h: area.height };
      }, g.prefix);
      if (box.bottom > box.footerTop + 1) problems.push(`${g.prefix}: play area runs ${Math.round(box.bottom - box.footerTop)}px under the footer`);
      if (box.top < box.stepperBottom - 1) problems.push(`${g.prefix}: play area runs ${Math.round(box.stepperBottom - box.top)}px under the step bar`);
      if (box.h < 200) problems.push(`${g.prefix}: play area only ${Math.round(box.h)}px tall`);
    }
    expect(problems).toEqual([]);
  });
}

test('compact mode: every game fits above its footer at 1366x768', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  const problems = [];
  for (const g of GAMES) {
    await page.locator('.step').nth(g.step).evaluate((el) => el.click());
    if (!(await page.evaluate(() => document.body.classList.contains('compact-game')))) {
      await page.click('#compactModeBtn');
    }
    await page.click(`#${g.prefix}NewGameBtn`);
    for (let i = 0; i < 4; i++) {
      const add = page.locator(`#${g.prefix}AddTeamBtn`);
      if (await add.isVisible() && await add.isEnabled()) await add.click();
    }
    await page.click(`#${g.prefix}StartBtn`);
    await page.waitForTimeout(400);
    const box = await page.evaluate((prefix) => {
      const area = document.getElementById(`${prefix}PlayArea`).getBoundingClientRect();
      const footer = document.getElementById(`${prefix}PlayArea`).closest('.stage').querySelector('.stage-footer').getBoundingClientRect();
      return { bottom: area.bottom, footerTop: footer.top, h: area.height };
    }, g.prefix);
    if (box.bottom > box.footerTop + 1) problems.push(`${g.prefix}: ${Math.round(box.bottom - box.footerTop)}px under the footer`);
    if (box.h < 200) problems.push(`${g.prefix}: play area only ${Math.round(box.h)}px tall`);
  }
  expect(problems).toEqual([]);
});
