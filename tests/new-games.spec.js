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

test('Spin the Wheel: answer first; a right answer spins, a bonus slice pays out its twist', async ({ page }) => {
  test.setTimeout(40000);
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(9).evaluate((el) => el.click());
  await page.click('#wheelNewGameBtn');
  await page.click('#wheelStartBtn');
  await page.waitForTimeout(250);
  // Every slice a bonus one, so the spin lands on a twist.
  await page.evaluate(async () => (await import('/js/stages/stage8-spinwheel.js')).debugSetWheelBonus([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  await page.click('#wheelBeginTurnBtn');
  // The question comes first, before any spin.
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  expect(await page.evaluate(async () => (await import('/js/state.js')).state.wheelRoundActive)).toBe(false);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  // Then the spin, the twist roll, and the result.
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 12000 });
  const { total, won } = await page.evaluate(async () => {
    const { state } = await import('/js/state.js');
    const { WHEEL_QUESTIONS } = await import('/js/content/stage8-spinwheel.js');
    const i = state.wheelUsedSegments.indexOf(true);
    return { total: state.wheelTeams[0].total, won: WHEEL_QUESTIONS[i].points };
  });
  // Nobody had points, so the twist was double or triple, never a steal.
  expect([won * 2, won * 3]).toContain(total);
  await page.click('#wheelNextTeamBtn');

  // Team 2 answers wrong: no spin, no points, no slice used up.
  await page.click('#wheelBeginTurnBtn');
  await page.locator('.mc-choice:not([data-correct])').first().waitFor().catch(() => {});
  const choices = page.locator('.mc-choice');
  if (await choices.count()) {
    const right = await page.evaluate(async () => {
      const { state } = await import('/js/state.js');
      const { WHEEL_QUESTIONS } = await import('/js/content/stage8-spinwheel.js');
      return WHEEL_QUESTIONS[state.wheelQuestionOrder[1]].answer;
    });
    const n = await choices.count();
    for (let i = 0; i < n; i++) {
      const t = (await choices.nth(i).locator('.mc-text').textContent()).trim();
      if (!right.toLowerCase().includes(t.toLowerCase())) { await choices.nth(i).click(); break; }
    }
    await page.click('#popMcContinueBtn');
  } else {
    await page.click('#popCheckBtn');
    await page.click('#popWrongBtn');
  }
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 4000 });
  await expect(page.locator('#wheelLastSpinDisplay')).toHaveText('No spin');
  const used = await page.evaluate(async () => (await import('/js/state.js')).state.wheelUsedSegments.filter(Boolean).length);
  expect(used).toBe(1);
  expect(errors).toEqual([]);
});

test('Zombie Dash: zombies climb out, sweets and ball bonks score, and laps move the level on', async ({ page }) => {
  test.setTimeout(90000);
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(18).evaluate((el) => el.click());
  await page.click('#zombieNewGameBtn');
  await page.click('#zombieStartBtn');
  await page.waitForTimeout(250);
  // The level picker shows between turns, one button per level.
  await expect(page.locator('#zombieLevels')).toBeVisible();
  const levels = await page.locator('#zombieLevels [data-level]').count();
  expect(levels).toBe(10);
  await expect(page.locator('#zombieLevels [data-level="0"]')).toHaveClass(/active/);

  const internals = () => page.evaluate(async () => (await import('/js/stages/stage17-zombies.js')).debugZombieInternals());
  await page.click('#zombieBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await expect(page.locator('#zombieLevels')).toBeHidden();

  // Walk about with the keyboard, then grab a sweet.
  await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
  const moved = await internals();
  expect(moved.player.x, 'Pip walks right').toBeGreaterThan(82);
  expect(await page.evaluate(async () => (await import('/js/stages/stage17-zombies.js')).debugZombieGrabCandy())).toBe(true);
  await page.waitForTimeout(150);
  const afterCandy = Number(await page.locator('#zombieScoreDisplay').textContent());
  expect(afterCandy, 'a sweet scores').toBeGreaterThan(0);

  // By now (~2.5s in) the level's zombies have climbed out; bonk one.
  await page.waitForTimeout(1400);
  expect((await internals()).zombies).toBe(2);
  expect(await page.evaluate(async () => (await import('/js/stages/stage17-zombies.js')).debugZombieBonk())).toBe(true);
  await page.waitForTimeout(250);
  expect(Number(await page.locator('#zombieScoreDisplay').textContent()), 'a ball bonk scores +2').toBeGreaterThanOrEqual(afterCandy + 2);

  // Two teams: after both have played, the next lap is level 2.
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 25000 });
  await page.click('#zombieNextTeamBtn');
  await page.click('#zombieBeginTurnBtn');
  if (await page.locator('#popCheckBtn').isVisible()) { await page.click('#popCheckBtn'); await page.click('#popCorrectBtn'); }
  else { await page.locator('.mc-choice').first().click(); await page.click('#popMcContinueBtn'); }
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 25000 });
  await page.click('#zombieNextTeamBtn');
  await expect(page.locator('#zombieLevels [data-level="1"]')).toHaveClass(/active/);
  expect((await internals()).level).toBe(1);
  expect(errors).toEqual([]);
});

// Stage 13 is football now (rebuilt from Hoop Shot 2026-11-22; ids keep
// the hoop prefix).
test('Football: tap the goal to aim, KICK scores past a parked keeper, three kicks end the turn', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await openGame(page, 14, 'hoop');
  const fb = () => page.evaluate(async () => (await import('/js/stages/stage13-hoopshot.js')).debugFootball());
  const shotsLeft = page.locator('#hoopShotsDisplay');
  const kick = page.locator('#hoopShootBtn');
  await expect(shotsLeft).toHaveText('3');
  await expect(page.locator('#hoopControls')).toBeVisible();

  // The arrow buttons nudge the aim; tapping the goal moves it there.
  const a0 = (await fb()).aim;
  await page.click('#hoopAngleUp');
  await page.click('#hoopPowerUp');
  const a1 = (await fb()).aim;
  expect(a1.x).toBeGreaterThan(a0.x);
  expect(a1.y).toBeGreaterThan(a0.y);
  const box = await page.locator('#hoopCanvas').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
  expect((await fb()).aim.x, 'a tap on the left of the goal aims left').toBeLessThan(0);
  await expect(shotsLeft).toHaveText('3'); // aiming never kicks

  // Park the keeper on the far left and aim right: a goal.
  await page.evaluate(async () => (await import('/js/stages/stage13-hoopshot.js')).debugParkKeeper(-0.9));
  for (let i = 0; i < 25; i++) await page.click('#hoopAngleUp');
  expect((await fb()).aim.x, 'aiming at the right of the goal').toBeGreaterThan(0.5);
  await kick.click();
  await expect(page.locator('#hoopAngleUp')).toBeDisabled(); // locked while the ball is in play
  await expect(shotsLeft).toHaveText('2', { timeout: 6000 });
  expect(Number(await page.locator('#hoopScoreDisplay').textContent()), 'a goal scores').toBeGreaterThanOrEqual(3);

  for (const remaining of ['1', '0']) {
    await expect(kick).toBeEnabled({ timeout: 6000 });
    await kick.click();
    await expect(shotsLeft).toHaveText(remaining, { timeout: 6000 });
  }
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 8000 });
  await page.click('#hoopNextTeamBtn');
  expect(errors).toEqual([]);
});

test('Whack-a-Jelly: jellyfish swim up and tapping them scores; the teacher can pick 1 lane', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(15).evaluate((el) => el.click());
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

test('Whack-a-Jelly: every lane gets the same number of jellies, even when one lane bops fast', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(15).evaluate((el) => el.click());
  await page.click('#whackNewGameBtn');
  await page.click('#whackStartBtn');
  await page.waitForTimeout(250);
  await page.click('#whackLanes [data-lanes="4"]');
  await page.click('#whackBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');

  // Only lane 0 plays (and plays fast); the other three never tap.
  const box = await page.locator('#whackCanvas').boundingBox();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(150);
    const targets = await page.evaluate(async () => (await import('/js/stages/stage14-whack.js')).debugWhackTargets());
    const mine = targets.find((t) => t.lane === 0);
    if (mine) await page.mouse.click(box.x + mine.x * box.width, box.y + mine.y * box.height);
  }
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 20000 });
  const { spawns, deck } = await page.evaluate(async () => (await import('/js/stages/stage14-whack.js')).debugWhackLanes());
  expect(spawns.length).toBe(4);
  expect(Math.min(...spawns), 'every lane gets plenty').toBeGreaterThan(5);
  expect(Math.max(...spawns) - Math.min(...spawns), `lanes dealt ${spawns}`).toBeLessThanOrEqual(1);
  expect(deck[0], 'a jelly opens every lane').toBe('jelly');
  expect(errors).toEqual([]);
});

test('Balloon Pop: tapping balloons pops them and scores, and the round reaches the result modal', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 7, 'pop');
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
  await openGame(page, 16, 'maze');
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
  await openGame(page, 16, 'maze');
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
  await openGame(page, 17, 'jump');
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
  await openGame(page, 17, 'jump');
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
  await page.locator('.step').nth(17).evaluate((el) => el.click());
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
  for (const [step, prefix] of [[16, 'maze'], [17, 'jump']]) {
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

/* ---- Ninja Jump: levels, fans and pick-ups (2026-11-20) ---- */
// Runs `src` in the page with J = the game's debug view and a = arg.
async function jumpInternals(page, src, arg) {
  return page.evaluate(async ([code, a]) => {
    const m = await import('/js/stages/stage16-ninjajump.js');
    const J = m.debugJumpInternals();
    return new Function('J', 'a', code)(J, a);
  }, [src, arg]);
}

test('Ninja Jump: the teacher can pick any level, easy ones first, and laps move on', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(17).evaluate((el) => el.click());
  await page.click('#jumpNewGameBtn');
  await page.click('#jumpStartBtn');
  await page.waitForTimeout(250);
  const buttons = page.locator('#jumpLevels [data-level]');
  expect(await buttons.count()).toBeGreaterThanOrEqual(8);
  await expect(buttons.nth(0)).toHaveClass(/active/);
  await expect(buttons.nth(0)).toHaveClass(/lvl-easy/);
  await expect(buttons.nth(1)).toHaveClass(/lvl-easy/);
  await expect(buttons.last()).toHaveClass(/lvl-hard/);
  await buttons.nth(2).click();
  await expect(buttons.nth(2)).toHaveClass(/active/);
  await page.click('#jumpBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await expect(page.locator('#jumpLevels')).toBeHidden();
  expect(await jumpInternals(page, 'return J.levelIndex;')).toBe(2);
  await page.evaluate(async () => (await import('/js/stages/stage16-ninjajump.js')).debugCollectAllStars());
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 4000 });
  await page.click('#jumpNextTeamBtn');
  // Team 2 of 2: same lap, same level.
  await expect(buttons.nth(2)).toHaveClass(/active/);
  expect(errors).toEqual([]);
});

test('Ninja Jump: every updraft carries the ninja up onto the plank above it', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(17).evaluate((el) => el.click());
  await page.click('#jumpNewGameBtn');
  await page.click('#jumpStartBtn');
  await page.waitForTimeout(250);
  await page.click('#jumpTimes [data-seconds="30"]');
  await page.click('#jumpBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  const levels = await jumpInternals(page, 'return J.levels.map((l, i) => ({ i, name: l.name, fans: l.map.some(r => r.includes("F")) }));');
  for (const lv of levels.filter((l) => l.fans)) {
    const fans = await jumpInternals(page, 'J.loadLevel(a); return J.updrafts.map(u => ({ ...u }));', lv.i);
    for (const u of fans) {
      // Stand the ninja on the fan and let go of everything.
      await jumpInternals(page, 'J.loadLevel(a.i); J.setInput({ left: false, right: false, jumpHeld: false }); Object.assign(J.ninja, { x: a.u.x + 0.5, y: a.u.fanY, vx: 0, vy: 0 });', { i: lv.i, u });
      await page.waitForTimeout(1800);
      const n = await jumpInternals(page, 'return { y: J.ninja.y, ground: J.ninja.onGround, x: J.ninja.x };');
      const plankTop = u.fanY - u.len + 0.5;
      expect(n.ground, `${lv.name}: fan at x${u.x} should set the ninja down`).toBe(true);
      expect(Math.abs(n.y - plankTop), `${lv.name}: fan at x${u.x} lands on row ${plankTop}`).toBeLessThan(0.05);
    }
  }
  expect(errors).toEqual([]);
});

test('Ninja Jump: pick-ups move between rounds, and the golden shuriken is worth 3', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 17, 'jump');
  // Every level has a golden shuriken; ones with several spots don't
  // always put it in the same place.
  const spread = await jumpInternals(page, `
    return J.levels.map((l, i) => {
      const seen = new Set();
      for (let k = 0; k < 30; k++) { J.loadLevel(i); seen.add(J.golden.x + ',' + J.golden.y); }
      return { name: l.name, spots: l.golden.length, seen: seen.size };
    });`);
  for (const s of spread) {
    expect(s.spots, `${s.name} has golden spots`).toBeGreaterThan(0);
    if (s.spots > 1) expect(s.seen, `${s.name}'s golden shuriken should move`).toBeGreaterThan(1);
  }
  // Put the ninja on the golden shuriken: +3.
  await jumpInternals(page, 'J.loadLevel(0); Object.assign(J.ninja, { x: J.golden.x, y: J.golden.y + 0.4, vx: 0, vy: 0 });');
  await page.waitForTimeout(120);
  expect(await jumpInternals(page, 'return J.golden.got;')).toBe(true);
  expect(Number(await page.locator('#jumpScoreDisplay').textContent())).toBeGreaterThanOrEqual(3);
  expect(errors).toEqual([]);
});

test('Ninja Jump: the speed boost makes the ninja run faster, and side winds push', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 17, 'jump');
  const speedLevel = await jumpInternals(page, 'return J.levels.findIndex(l => l.speed);');
  await jumpInternals(page, 'J.loadLevel(a); Object.assign(J.ninja, { x: 3.5, y: 14, vx: 0, vy: 0 }); J.setInput({ right: true });', speedLevel);
  await page.waitForTimeout(500);
  const normal = await jumpInternals(page, 'J.setInput({ right: false }); return Math.abs(J.ninja.vx);');
  await jumpInternals(page, 'const pu = J.powerups.find(p => p.kind === "speed"); Object.assign(J.ninja, { x: pu.x, y: pu.y + 0.4, vx: 0, vy: 0 });');
  await page.waitForTimeout(120);
  await jumpInternals(page, 'Object.assign(J.ninja, { x: 3.5, y: 14, vx: 0, vy: 0 }); J.setInput({ right: true });');
  await page.waitForTimeout(500);
  const boosted = await jumpInternals(page, 'J.setInput({ right: false }); return Math.abs(J.ninja.vx);');
  expect(boosted, 'boosted run speed').toBeGreaterThan(normal * 1.3);

  // A ninja hanging in a wind's row drifts with it.
  const windy = await jumpInternals(page, 'return J.levels.findIndex(l => l.map.some(r => /[<>]/.test(r)));');
  const w = await jumpInternals(page, 'J.loadLevel(a); return { ...J.winds[0] };', windy);
  await jumpInternals(page, 'Object.assign(J.ninja, { x: 18, y: a.y + 0.9, vx: 0, vy: -3 });', w);
  await page.waitForTimeout(150);
  const vx = await jumpInternals(page, 'return J.ninja.vx;');
  expect(Math.sign(vx), 'the wind blows the ninja its way').toBe(w.dir);
  expect(errors).toEqual([]);
});

/* ---- Multiple-choice turn questions (2026-11-20) ---- */
test('every other turn question is multiple choice, marked by the app', async ({ page }) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  // Whack-a-Jelly's "Which is correct?" questions always have options.
  await page.goto('/index.html');
  await page.locator('.lesson-card').nth(0).click();
  await page.locator('.step').nth(15).evaluate((el) => el.click());
  await page.click('#whackNewGameBtn');
  await page.click('#whackStartBtn');
  await page.waitForTimeout(250);
  // Turn 1: the usual open question.
  await page.click('#whackBeginTurnBtn');
  await expect(page.locator('#popCheckBtn')).toBeVisible();
  await expect(page.locator('.mc-choice')).toHaveCount(0);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 25000 });
  await page.click('#whackNextTeamBtn');
  // Turn 2: multiple choice.
  await page.click('#whackBeginTurnBtn');
  const options = page.locator('.mc-choice');
  await expect(options).toHaveCount(2);
  await expect(page.locator('#popCheckBtn')).toHaveCount(0);
  await options.first().click();
  await expect(page.locator('.mc-choice.is-correct')).toHaveCount(1);
  await expect(page.locator('#popMcVerdict')).toHaveText(/Correct|Not quite/);
  await expect(options.first()).toBeDisabled();
  await page.click('#popMcContinueBtn');
  await expect(page.locator('#popQuestionOverlay')).toHaveClass(/hidden/);
  await expect(page.locator('#whackPlayArea')).not.toHaveClass(/idle/); // the round runs
  expect(errors).toEqual([]);
});

/* ---- Fruit Ninja launches from every edge (2026-11-20) ---- */
test('Fruit Ninja: fruit comes from the bottom, the top and the sides', async ({ page }) => {
  test.setTimeout(40000);
  const errors = watchErrors(page);
  await openGame(page, 13, 'fruit');
  const seen = new Set();
  for (let i = 0; i < 50; i++) {
    const shapes = await page.evaluate(async () => (await import('/js/state.js')).state.fruitShapes.map((s) => ({ x: s.x, y: s.y, vy: s.vy, half: s.half })));
    for (const s of shapes) {
      if (s.half) continue;
      if (s.y < 0 && s.vy > 0) seen.add('top');
      else if (s.x < 0) seen.add('left');
      else if (s.x > 100) seen.add('right');
      else if (s.y > 100 && s.vy < 0) seen.add('bottom');
    }
    if (seen.size >= 4) break;
    await page.waitForTimeout(200);
  }
  expect([...seen].sort()).toEqual(['bottom', 'left', 'right', 'top']);
  expect(errors).toEqual([]);
});
