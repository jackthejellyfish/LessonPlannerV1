const { test, expect } = require('@playwright/test');

// Committed version of the scratchpad "full regression" script this project
// has hand-written fresh every session — see PROJECT_STATE.md. Sweeps every
// stage via the stepper and asserts zero console/page errors throughout,
// plus a few deeper per-stage smoke checks. Fullscreen game stages hide the
// visible stepper by design (see css/fullscreen-game.css), so steps are
// clicked via locator.evaluate(el => el.click()) to bypass Playwright's
// visibility gate rather than treating that as a bug.
//
// .wrap (stepper + all 21 stages) stays hidden behind the lesson-select
// screen (js/lessons.js) until a lesson card is picked — every test clicks
// the first card right after goto() purely to get past that gate; which
// lesson is picked doesn't matter for these structural assertions.

test('all 21 stages are reachable with zero console/page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');

  const steps = page.locator('.step');
  await expect(steps).toHaveCount(21);

  for (let i = 0; i < 21; i++) {
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

  // On the last slide the arrow stops and the footer's Next takes over
  // (it nudges), so there is one way forward, not two.
  const slides = await page.locator('.learn-dots .demo-dot').count();
  for (let i = 0; i < slides - 1; i++) await page.click('#learnNextSlideBtn');
  await expect(page.locator('#learnNextSlideBtn')).toBeDisabled();
  await expect(page.locator('#learnNextBtn')).toHaveClass(/nudge/);
  await page.click('#learnNextBtn');
  await expect(page.locator('#stage3')).not.toHaveClass(/hidden/);
});

test('stage 6 Balloon Pop starts a round without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(9).evaluate((el) => el.click());
  // The setup screen opens on a menu now (New game / How to play).
  await page.click('#popNewGameBtn');
  await page.click('#popStartBtn');
  await page.waitForTimeout(300);

  expect(errors).toEqual([]);
});

test('stage 9 shows the worksheet on one screen and reveals answers on tap', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(12).evaluate((el) => el.click());
  await page.waitForTimeout(200);
  // Gap fill, unscramble and sentences; free writing is on paper only.
  await expect(page.locator('.ws-col')).toHaveCount(3);
  await expect(page.locator('.ws-item')).toHaveCount(15);
  // Everything fits without scrolling at 1280x720.
  const fits = await page.$eval('#qsQuestionArea', (el) => el.scrollHeight <= el.clientHeight + 1);
  expect(fits).toBe(true);
  // Answers start hidden; a tap shows one, a section button shows five.
  await expect(page.locator('.ws-item.revealed')).toHaveCount(0);
  await page.locator('.ws-item').first().click();
  await expect(page.locator('.ws-item.revealed')).toHaveCount(1);
  await page.locator('.ws-col-reveal').nth(1).click();
  await expect(page.locator('.ws-item.revealed')).toHaveCount(6);
  await page.click('#qsRevealAllBtn');
  await expect(page.locator('.ws-item.revealed')).toHaveCount(15);
  await expect(page.locator('#qsRevealAllBtn')).toHaveText(/Hide all/);
});

test('the last stage has a Finish button that returns to the lesson picker', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  const steps = page.locator('.step');
  await steps.nth(20).evaluate((el) => el.click());
  await page.locator('#zombieFinishBtn').evaluate((el) => el.click());
  await expect(page.locator('#lessonSelect')).not.toHaveClass(/hidden/);
  await expect(page.locator('#wrap')).toHaveClass(/hidden/);
});

test('stage 5 shows the task first, then the timer with the useful language', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(4).evaluate((el) => el.click());

  // The task comes first, on its own, and fits without scrolling.
  await expect(page.locator('#freeSlideTask')).toBeVisible();
  await expect(page.locator('.free-headline')).not.toBeEmpty();
  await expect(page.locator('#stopwatch')).toBeHidden();
  const overflow = await page.locator('#freeSlideTask').evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(overflow, 'task slide should not need scrolling').toBeLessThanOrEqual(1);

  await page.click('#freeNextSlideBtn');
  await expect(page.locator('#stopwatch')).toBeVisible();
  await expect(page.locator('#scaffoldList .frame')).toHaveCount(3);
  await expect(page.locator('#wordBank .wordbank-chip').first()).toBeHidden(); // a tab away
  await page.click('#freeShowWords');
  await expect(page.locator('#wordBank .wordbank-chip').first()).toBeVisible();
  await expect(page.locator('#scaffoldList')).toBeHidden();
  await expect(page.locator('#freeNextSlideBtn')).toBeDisabled();
  await expect(page.locator('#freeNextBtn')).toHaveClass(/nudge/);

  await page.click('#freeNextBtn');
  await expect(page.locator('#stage6')).toBeVisible(); // Running dictation
});

test('stage 5 slides fit without scrolling on a 1280x720 projector, in every lesson', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/index.html');
  const lessons = await page.locator('.lesson-card').count();
  for (let i = 0; i < lessons; i++) {
    await page.goto('/index.html');
    await page.locator('.lesson-card').nth(i).click();
    await page.locator('.step').nth(4).evaluate((el) => el.click());
    for (const slide of ['#freeSlideTask', '#freeSlideGo']) {
      if (slide === '#freeSlideGo') await page.click('#freeNextSlideBtn');
      const overflow = await page.locator(slide).evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(overflow, `lesson ${i + 1} ${slide} overflow`).toBeLessThanOrEqual(1);
    }
  }
});

// index.html preloads every JS module so the browser fetches them all at
// once instead of one import layer at a time. The list is hand-kept, so
// this pins it to the files actually in js/: a new module that isn't
// listed loads a round trip late, and a deleted one left in the list is
// a 404 on every page load.
test('index.html preloads exactly the modules in js/', async ({ page }) => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const onDisk = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.js')) onDisk.push(path.relative(root, full).split(path.sep).join('/'));
    }
  })(path.join(root, 'js'));
  const expected = onDisk.filter((f) => f !== 'js/main.js').sort();

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const listed = [...html.matchAll(/rel="modulepreload" href="([^"]+)"/g)].map((m) => m[1]).sort();
  expect(listed).toEqual(expected);

  // And the page still loads cleanly with them.
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  expect(errors).toEqual([]);
});

// Answering a Stage 3 question starts a ~1s pause before the next one.
// Leaving the stage during that pause used to let it fire anyway, so
// question 2 and its countdown beeps ran on behind Guided practice.
test('stage 3 stops completely when you leave it straight after answering', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(2).evaluate((el) => el.click());
  await page.locator('.mc-option').first().click();
  await page.click('#controlledNextBtn');
  await page.waitForTimeout(2000);
  await expect(page.locator('#mcCounter')).toHaveText(/Question 1 of/);
  await expect(page.locator('#semiTimerNum')).not.toHaveText('');

  // Coming back picks up where it left off: the answered question moves on.
  await page.locator('.step').nth(2).evaluate((el) => el.click());
  await expect(page.locator('#mcCounter')).toHaveText(/Question 2 of/);
});

test('stage 4 Clear puts the words back without restarting the timer', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(3).evaluate((el) => el.click());
  await page.waitForTimeout(2300);
  await page.locator('#chipBank .chip').first().click();
  await expect(page.locator('#answerStrip .chip')).toHaveCount(1);
  await page.click('#semiReset');
  await expect(page.locator('#answerStrip .chip')).toHaveCount(0);
  const left = Number(await page.textContent('#semiTimerNum'));
  expect(left).toBeLessThan(30);
});

test('opening the lesson picker stops a running stage 3 countdown', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(2).evaluate((el) => el.click());
  await page.click('#changeLessonBtn');
  await page.click('#confirmOkBtn');
  const before = await page.textContent('#mcTimerNum');
  await page.waitForTimeout(1500);
  expect(await page.textContent('#mcTimerNum')).toBe(before);
});

test('the stage 9 worksheet keeps revealed answers when you leave and come back', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(12).evaluate((el) => el.click());
  await page.locator('.ws-item').nth(2).click();
  await page.locator('.step').nth(11).evaluate((el) => el.click());
  await page.locator('.step').nth(12).evaluate((el) => el.click());
  await expect(page.locator('.ws-item').nth(2)).toHaveClass(/revealed/);
});

test('stage 5 countdown pauses when you leave, and Start works again after time is up', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(4).evaluate((el) => el.click());
  await page.click('#freeNextSlideBtn');
  await page.fill('#stopwatchMin', '00');
  await page.fill('#stopwatchSec', '02');
  await page.click('#stopwatchToggle');
  await page.waitForTimeout(2600);                 // runs out
  await expect(page.locator('#stopwatchSec')).toHaveValue('00');
  await page.click('#stopwatchToggle');            // Start again, no Reset
  await expect(page.locator('#stopwatchToggle')).toHaveText('Pause');

  await page.locator('.step').nth(3).evaluate((el) => el.click());   // leave
  await expect(page.locator('#stopwatchToggle')).toHaveText('Start');
});

// Stages 6 and 7 (added 2026-11-22): running dictation and class survey.
test('running dictation reveals its six sentences one at a time, and prints them for cutting out', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(5).evaluate((el) => el.click());
  await expect(page.locator('.dict-item')).toHaveCount(6);
  await expect(page.locator('.dict-item.revealed')).toHaveCount(0);
  await page.locator('.dict-item').nth(1).click();
  await expect(page.locator('.dict-item.revealed')).toHaveCount(1);
  await page.click('#dictRevealAllBtn');
  await expect(page.locator('.dict-item.revealed')).toHaveCount(6);
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('#dictPrintBtn');
  await expect(page.locator('#printableActivity .pa-strip')).toHaveCount(6);
});

test('the survey shows an example on the board, and the printed survey has no example', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(6).evaluate((el) => el.click());
  const exampleName = await page.locator('#surveyExample .sv-example .sv-name').textContent();
  expect(exampleName.trim().length).toBeGreaterThan(0);
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('#surveyPrintBtn');
  const printed = await page.locator('#printableActivity').innerText();
  expect(printed).not.toContain(exampleName.trim());
  await expect(page.locator('#printableActivity tbody tr')).toHaveCount(7);
  await page.click('#surveyNextBtn');
  await expect(page.locator('#stage8')).toBeVisible(); // Reading
});

// Stages 8 and 9 (added 2026-11-23): reading and speaking dice.
test('reading: each card shows its question, then its answer; two printouts', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(7).evaluate((el) => el.click());
  await expect(page.locator('.rd-q')).toHaveCount(6);
  const first = page.locator('.rd-q').first();
  await expect(first).toHaveAttribute('data-level', '0');
  await first.click();
  await expect(first.locator('.rd-q-text')).toBeVisible();
  await expect(first.locator('.rd-q-answer')).toBeHidden();
  await first.click();
  await expect(first.locator('.rd-q-answer')).toBeVisible();
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('#readingPrintBtn');
  await expect(page.locator('#printableActivity .pa-reading .pa-text p').first()).not.toBeEmpty();
  await expect(page.locator('#printableActivity .pa-answer-list li')).toHaveCount(6);
  // The answer sheet carries numbers and lines only, never the questions.
  const q1 = (await first.locator('.rd-q-text').textContent()).trim();
  expect(await page.locator('#printableActivity .pa-answersheet').innerText()).not.toContain(q1);
  await page.click('#readingQuestionsPrintBtn');
  await expect(page.locator('#printableActivity .pa-strip')).toHaveCount(6);
});

test('speaking dice: a roll opens its question with help; the same number twice crosses it out', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(8).evaluate((el) => el.click());
  await expect(page.locator('.dq')).toHaveCount(6);
  await page.evaluate(() => { Math.random = () => 0.5; }); // always rolls a 4
  await page.click('#diceRollBtn');
  await expect(page.locator('.dq.active')).toHaveAttribute('data-n', '4', { timeout: 3000 });
  await expect(page.locator('.dq.active .dq-phrases li').first()).toBeVisible();
  await expect(page.locator('.dq.done')).toHaveCount(0);
  await page.click('#diceRollBtn');
  await expect(page.locator('.dq.done')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('.dq.done')).toHaveAttribute('data-n', '4');
  // Leaving mid-roll stops it (no landing over the next stage).
  await page.click('#diceRollBtn');
  await page.locator('.step').nth(9).evaluate((el) => el.click());
  const rolling = await page.evaluate(async () => (await import('/js/stages/dice.js')).debugDice().rolling);
  expect(rolling).toBe(false);
});
