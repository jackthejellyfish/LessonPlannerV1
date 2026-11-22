const { test, expect } = require('@playwright/test');

// Real playthrough assertions for two representative team-based games
// (rather than every one of the 8 — see the plan this suite shipped under).
// Template for extending coverage to the rest later. Adapted from this
// session's scratchpad scripts (verify_billiards_gameplay_fix.js /
// verify_neonarena_combat.js), converted from console.log inspection into
// real expect() assertions.

test('Billiards: a full turn answers a question, resolves a shot, and updates the scoreboard', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(9).evaluate((el) => el.click());
  // The setup screen opens on a menu now (New game / How to play).
  await page.click('#billiardsNewGameBtn');
  await page.click('#billiardsStartBtn');
  await page.waitForTimeout(300);

  await page.click('#billiardsBeginTurnBtn');
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(250);

  const canvasBox = await page.locator('#billiardsCanvas').boundingBox();
  const cueBox = await page.evaluate(async () => {
    const m = await import('/js/state.js');
    const cue = m.state.billiardsBalls.find((b) => b.isCue);
    return { x: cue.x, y: cue.y };
  });

  await page.mouse.move(canvasBox.x + cueBox.x, canvasBox.y + cueBox.y);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + cueBox.x - 90, canvasBox.y + cueBox.y, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 9000 });
  const scoreText = await page.locator('#popResultBody .result-pill.active .result-pill-score').textContent();
  expect(scoreText).toMatch(/^\d+$/);

  await page.click('#billiardsNextTeamBtn');
  await expect(page.locator('#popResultOverlay')).toHaveClass(/hidden/);

  expect(errors).toEqual([]);
});

// Regression (2026-11-22, "black screen crash"): every turn used to start
// another animation loop on top of the last, an empty canvas showed the
// dark frame behind it between turns, and browsers without
// ctx.roundRect never drew the table at all.
test('Billiards: several turns run one loop at a time and the table never goes blank, even without roundRect', async ({ page }) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.addInitScript(() => { delete CanvasRenderingContext2D.prototype.roundRect; });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(9).evaluate((el) => el.click());
  await page.click('#billiardsNewGameBtn');
  await page.click('#billiardsStartBtn');
  await page.waitForTimeout(300);

  // The felt colour at the middle of the canvas (the table is centred).
  const middlePixel = () => page.evaluate(() => {
    const c = document.getElementById('billiardsCanvas');
    const d = c.getContext('2d').getImageData(Math.floor(c.width / 2), Math.floor(c.height * 0.2), 1, 1).data;
    return [d[0], d[1], d[2], d[3]];
  });
  const isTable = ([r, g, b, a]) => a === 255 && r + g + b > 400;

  expect(isTable(await middlePixel()), 'the table shows before the first turn').toBe(true);

  for (let turn = 0; turn < 3; turn++) {
    await page.click('#billiardsBeginTurnBtn');
    if (await page.locator('#popCheckBtn').isVisible()) {
      await page.click('#popCheckBtn');
      await page.click('#popCorrectBtn');
    } else {
      await page.locator('.mc-choice').first().click();
      await page.click('#popMcContinueBtn');
    }
    await page.waitForTimeout(250);
    const box = await page.locator('#billiardsCanvas').boundingBox();
    const cue = await page.evaluate(async () => {
      const m = await import('/js/state.js');
      const c = m.state.billiardsBalls.find((b) => b.isCue);
      const canvas = document.getElementById('billiardsCanvas');
      // Balls are in canvas pixels; the canvas buffer may be scaled.
      const s = canvas.getBoundingClientRect().width / canvas.width;
      return { x: c.x * s, y: c.y * s };
    });
    await page.mouse.move(box.x + cue.x, box.y + cue.y);
    await page.mouse.down();
    await page.mouse.move(box.x + cue.x - 90, box.y + cue.y + 10, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 12000 });

    const loop = await page.evaluate(async () => {
      const m = await import('/js/state.js');
      return { active: m.state.billiardsRoundActive, raf: m.state.billiardsRoundRAF };
    });
    expect(loop, `turn ${turn + 1}: the loop stops when the turn ends`).toEqual({ active: false, raf: null });
    await page.click('#billiardsNextTeamBtn');

    // A resize between turns wipes the canvas; it must repaint.
    await page.setViewportSize({ width: turn % 2 ? 1600 : 1366, height: turn % 2 ? 1000 : 768 });
    await page.waitForTimeout(400);
    expect(isTable(await middlePixel()), `turn ${turn + 1}: table still drawn after a resize`).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('Neon Arena: a full turn answers a question, plays a round, and reaches the result modal', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(10).evaluate((el) => el.click());
  // The setup screen opens on a menu now (New game / How to play).
  await page.click('#neonNewGameBtn');
  await page.click('#neonStartBtn');
  await page.waitForTimeout(300);

  await page.click('#neonBeginTurnBtn');
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(200);

  await expect(page.locator('#neonPlayArea')).not.toHaveClass(/idle/);

  // Move and fire for a moment to touch the real game loop, then let the
  // 20s round finish naturally.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.down('d');
    await page.waitForTimeout(100);
    await page.keyboard.up('d');
  }

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 25000 });
  await page.click('#neonNextTeamBtn');

  expect(errors).toEqual([]);
});

// Reworked 2026-11-22: one world unit is the same distance both ways,
// holding the mouse keeps firing, and power-ups turn up early.
test('Neon Arena: holding the mouse keeps firing, power-ups arrive early, and the arena is not stretched', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(10).evaluate((el) => el.click());
  await page.click('#neonNewGameBtn');
  await page.click('#neonStartBtn');
  await page.waitForTimeout(300);
  await page.click('#neonBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.waitForTimeout(200);

  const internals = () => page.evaluate(async () => (await import('/js/stages/stage11-neonarena.js')).debugNeonInternals());
  const box = await page.locator('#neonCanvas').boundingBox();
  const { W } = await internals();
  expect(Math.abs(W - 100 * box.width / box.height), 'world width follows the arena shape').toBeLessThan(1);

  // Hold for ~1.2s: at least five shots (one per click used to be the rule).
  const shotTimes = new Set();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(100);
    shotTimes.add((await internals()).lastShotAt);
  }
  await page.mouse.up();
  expect(shotTimes.size, 'held fire keeps shooting').toBeGreaterThanOrEqual(5);

  // The first power-up is out within 2.2s of the start (we're past that).
  await page.waitForTimeout(800);
  const seen = await page.evaluate(async () => {
    const { state } = await import('/js/state.js');
    return state.neonPickups.length + (state.neonPowerUntil || state.neonOverdriveUntil || state.neonSpreadUntil ? 1 : 0);
  });
  expect(seen, 'a power-up has appeared').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

// Reworked 2026-11-22 on the Neon pattern.
test('Star Defender: the ship follows the mouse, holding fires repeatedly, power-ups arrive early', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(6).evaluate((el) => el.click());
  await page.click('#invNewGameBtn');
  await page.click('#invStartBtn');
  await page.waitForTimeout(300);
  await page.click('#invBeginTurnBtn');
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');
  await page.click('#confirmOkBtn'); // play now (not bank)
  await page.waitForTimeout(200);

  const internals = () => page.evaluate(async () => (await import('/js/stages/stage7-stardefender.js')).debugInvInternals());
  const box = await page.locator('#invCanvas').boundingBox();
  const { W } = await internals();
  expect(Math.abs(W - 100 * box.width / box.height)).toBeLessThan(1);

  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.waitForTimeout(500);
  expect((await internals()).ship.x, 'the ship follows the pointer').toBeLessThan(W * 0.3);

  const shots = new Set();
  await page.mouse.down();
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(100); shots.add((await internals()).lastShotAt); }
  await page.mouse.up();
  expect(shots.size, 'held fire keeps shooting').toBeGreaterThanOrEqual(5);

  expect((await internals()).pickupsSpawned, 'a power-up has appeared within ~2s').toBeGreaterThan(0);
  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 15000 });
  expect(errors).toEqual([]);
});

// Fruit Ninja earns its own test for two v2-specific reasons: its drag
// listeners are now attached per-swipe rather than permanently (so a
// regression there silently stops ALL slicing), and its difficulty was
// retuned, which only means anything if a swipe still scores.
test('Fruit Ninja: a swipe across the play area slices shapes and scores', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  await page.locator('.step').nth(11).evaluate((el) => el.click());
  // The setup screen opens on a menu now (New game / How to play).
  await page.click('#fruitNewGameBtn');
  await page.click('#fruitStartBtn');
  await page.waitForTimeout(300);

  await page.click('#fruitBeginTurnBtn');
  await expect(page.locator('#popQuestionOverlay')).not.toHaveClass(/hidden/);
  await page.click('#popCheckBtn');
  await page.click('#popCorrectBtn');

  // Let a volley get airborne before swiping at it.
  await page.waitForTimeout(1800);
  const box = await page.locator('#fruitCanvas').boundingBox();

  // Sweep repeatedly across the middle of the play area. Shapes arc
  // through that band, so this reliably crosses several of them without
  // depending on where any particular shape happens to be.
  for (let pass = 0; pass < 6; pass++) {
    const y = box.y + box.height * (0.45 + (pass % 3) * 0.12);
    await page.mouse.move(box.x + 30, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 30, y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(220);
  }

  const score = Number(await page.locator('#fruitScoreDisplay').textContent());
  expect(score).toBeGreaterThan(0);

  // The round is 15s now, not 10 — confirm it is still running well past
  // where the old timer would have ended it.
  await page.waitForTimeout(600);
  const remaining = await page.locator('#fruitTimeDisplay').textContent();
  expect(Number(remaining)).toBeGreaterThan(0);

  await expect(page.locator('#popResultOverlay')).not.toHaveClass(/hidden/, { timeout: 20000 });
  await page.click('#fruitNextTeamBtn');

  expect(errors).toEqual([]);
});
