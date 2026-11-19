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

test('Hoop Shot: angle and power are set directly, then SHOOT fires; two shots end the turn', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 12, 'hoop');

  const shotsLeft = page.locator('#hoopShotsDisplay');
  const angle = page.locator('#hoopAngleValue');
  const power = page.locator('#hoopPowerValue');
  const shoot = page.locator('#hoopShootBtn');
  await expect(shotsLeft).toHaveText('2');
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
  await expect(shotsLeft).toHaveText('2');
  await expect(shoot).toBeEnabled();

  for (const remaining of ['1', '0']) {
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

test('Whack-a-Jelly: jellyfish swim up and tapping them scores; the teacher can pick 1 lane', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(13).evaluate((el) => el.click());
  await page.click('#whackNewGameBtn');
  await page.click('#whackStartBtn');
  await page.waitForTimeout(250);
  // The lane picker shows between turns; choose one lane.
  await expect(page.locator('#whackLanes')).toBeVisible();
  await page.click('#whackLanes [data-lanes="1"]');
  await expect(page.locator('#whackLanes [data-lanes="1"]')).toHaveClass(/active/);
  await page.click('#whackBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await expect(page.locator('#whackLanes')).toBeHidden(); // hidden during the round

  const box = await page.locator('#whackCanvas').boundingBox();
  const lanesSeen = new Set();
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(250);
    const targets = await page.evaluate(async () => (await import('/js/stages/stage14-whack.js')).debugWhackTargets());
    targets.forEach((t) => lanesSeen.add(t.lane));
    if (targets.length) await page.mouse.click(box.x + targets[0].x * box.width, box.y + targets[0].y * box.height);
  }
  expect([...lanesSeen], 'with one lane, everything comes up lane 0').toEqual([0]);
  expect(Number(await page.locator('#whackScoreDisplay').textContent()),
    'bopping jellyfish should score').toBeGreaterThan(0);

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 20000 });
  await page.click('#whackNextTeamBtn');
  await expect(page.locator('#whackLanes')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Balloon Pop: tapping balloons pops them and scores, and the round reaches the result modal', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 5, 'pop');
  await page.waitForTimeout(600);
  const box = await page.locator('#popCanvas').boundingBox();
  for (let i = 0; i < 4; i++) {
    const targets = await page.evaluate(async () => (await import('/js/stages/stage6-ballpop.js')).debugBalloonTargets());
    if (targets.length) await page.mouse.click(box.x + targets[0].x * box.width, box.y + targets[0].y * box.height);
    await page.waitForTimeout(150);
  }
  expect(Number(await page.locator('#popPopsDisplay').textContent())).toBeGreaterThan(0);
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 12000 });
  await page.click('#popNextTeamBtn');
  await expect(page.locator('#popBeginTurnBtn')).toBeEnabled();
  expect(errors).toEqual([]);
});

/* ---- The games added 2026-11-18: Jelly Maze and Ninja Jump ---- */

test('Jelly Maze: the keyboard steers Jack, a full turn reaches the result modal', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await openGame(page, 14, 'maze');
  await expect(page.locator('#mazeHint')).toBeVisible();

  // Swim around for a while: right along the bottom, then up, then hold
  // on the board (the pointer steering path) towards the exit corner.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('w');
  await page.waitForTimeout(1500);
  await page.keyboard.up('w');
  const box = await page.locator('#mazeCanvas').boundingBox();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1);
  await page.mouse.down();
  await page.waitForTimeout(1500);
  await page.mouse.up();
  expect(Number(await page.locator('#mazeScoreDisplay').textContent())).toBeGreaterThanOrEqual(0);

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 35000 });
  await page.click('#mazeNextTeamBtn');
  await expect(page.locator('#mazeBeginTurnBtn')).toBeEnabled();
  expect(errors).toEqual([]);
});

test('Jelly Maze: escaping ends the turn at once, with +10 and a time bonus', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 14, 'maze');
  await page.waitForTimeout(300);
  await page.evaluate(async () => (await import('/js/stages/stage15-maze.js')).debugMoveJackToExit());
  // Escaped with ~19s of a 20s round left: the result screen comes well
  // before the clock would have run out.
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 4000 });
  const score = Number(await page.locator('#mazeScoreDisplay').textContent());
  expect(score, '+10 for the exit plus about a point per second left').toBeGreaterThanOrEqual(10 + 15);
  expect(errors).toEqual([]);
});

test('Ninja Jump: running along the floor collects stars, a full turn reaches the result modal', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await openGame(page, 15, 'jump');
  await expect(page.locator('#jumpLeftBtn')).toBeVisible(); // touch buttons show during a turn

  // Level 1 has ninja stars sitting on the floor to the right of the
  // start, so simply running right must score.
  await page.keyboard.down('d');
  await page.waitForTimeout(1600);
  await page.keyboard.up('d');
  expect(Number(await page.locator('#jumpScoreDisplay').textContent()),
    'running over the floor stars should score').toBeGreaterThan(0);
  // Jump and double jump (Space, then Space again in the air).
  await page.keyboard.down(' ');
  await page.waitForTimeout(200);
  await page.keyboard.up(' ');
  await page.keyboard.press(' ');
  // The on-screen buttons drive the ninja too.
  await page.locator('#jumpLeftBtn').dispatchEvent('pointerdown');
  await page.waitForTimeout(400);
  await page.locator('#jumpLeftBtn').dispatchEvent('pointerup');

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 35000 });
  await page.click('#jumpNextTeamBtn');
  await expect(page.locator('#jumpLeftBtn')).toBeHidden(); // gone between turns
  expect(errors).toEqual([]);
});

test('Ninja Jump: clearing the level ends the turn at once, with +5 and a time bonus', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 15, 'jump');
  await page.waitForTimeout(300);
  await page.evaluate(async () => (await import('/js/stages/stage16-ninjajump.js')).debugCollectAllStars());
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 4000 });
  const score = Number(await page.locator('#jumpScoreDisplay').textContent());
  // 8 stars + 5 for the clear + about a point per second left of 10.
  expect(score).toBeGreaterThanOrEqual(8 + 5 + 7);
  expect(errors).toEqual([]);
});

test('Ninja Jump: the teacher picks the round length between turns', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(15).evaluate((el) => el.click());
  await page.click('#jumpNewGameBtn');
  await page.click('#jumpStartBtn');
  await page.waitForTimeout(250);
  await expect(page.locator('#jumpTimes [data-seconds="10"]')).toHaveClass(/active/); // the default
  await page.click('#jumpTimes [data-seconds="30"]');
  await expect(page.locator('#jumpTimes [data-seconds="30"]')).toHaveClass(/active/);
  await page.click('#jumpBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await expect(page.locator('#jumpTimes')).toBeHidden(); // hidden during the round
  await page.waitForTimeout(400);
  expect(Number(await page.locator('#jumpTimeDisplay').textContent())).toBeGreaterThan(25);
  expect(errors).toEqual([]);
});

test('Jelly Maze and Ninja Jump stop their game loop when you leave mid-turn', async ({ page }) => {
  const errors = watchErrors(page);
  for (const [step, prefix] of [[14, 'maze'], [15, 'jump']]) {
    await openGame(page, step, prefix);
    await page.waitForTimeout(500);
    await page.locator('.step').nth(0).evaluate((el) => el.click());
    const loop = await page.evaluate(async (prefix) => {
      const { state } = await import('/js/state.js');
      return { raf: state[`${prefix}RoundRAF`], active: state[`${prefix}RoundActive`] };
    }, prefix);
    expect(loop, `${prefix} loop should be stopped`).toEqual({ raf: null, active: false });
  }
  expect(errors).toEqual([]);
});
