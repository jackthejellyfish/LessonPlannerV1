const { test, expect } = require('@playwright/test');

/* =========================================================
   QUESTION BANKS AND THE QUESTION DECK
   Feedback 2026-11-27: the same questions kept coming up. Every game
   bank now holds at least 15 questions a lesson, and js/questionDeck.js
   picks a game's ten so nothing repeats until the lesson's questions
   run out. These guard both, for every lesson including new ones.
========================================================= */

const BANKS = [
  ['stage6-ballpop', 'POP_QUESTIONS'], ['stage7-stardefender', 'INV_QUESTIONS'],
  ['stage8-spinwheel', 'WHEEL_QUESTIONS'], ['stage10-billiards', 'BILLIARDS_QUESTIONS'],
  ['stage11-neonarena', 'NEON_QUESTIONS'], ['stage12-fruitninja', 'FRUIT_QUESTIONS'],
  ['stage13-hoopshot', 'HOOP_QUESTIONS'], ['stage14-whack', 'WHACK_QUESTIONS'],
  ['stage15-maze', 'MAZE_QUESTIONS'], ['stage16-ninjajump', 'JUMP_QUESTIONS']
];
const MIN_PER_BANK = 15;

test('every lesson has at least 15 questions in every game, none repeated in a bank', async ({ page }) => {
  await page.goto('/index.html');
  const problems = await page.evaluate(async ({ BANKS, MIN_PER_BANK }) => {
    const { LESSONS } = await import('/js/lessons.js');
    const out = [];
    for (const lesson of LESSONS) {
      for (const [file, name] of BANKS) {
        const mod = await import(`/js/content/${file}.js`);
        mod.applyLesson(lesson.id);
        const bank = mod[name];
        if (bank.length < MIN_PER_BANK) out.push(`${lesson.id} ${name}: ${bank.length}`);
        const prompts = bank.map(q => q.prompt.trim().toLowerCase());
        const dup = prompts.filter((p, i) => prompts.indexOf(p) !== i);
        if (dup.length) out.push(`${lesson.id} ${name}: repeated ${dup.join(' | ')}`);
        if (bank.some(q => !q.prompt || !q.answer)) out.push(`${lesson.id} ${name}: empty prompt/answer`);
      }
    }
    return out;
  }, { BANKS, MIN_PER_BANK });
  expect(problems).toEqual([]);
});

test('replaying a game asks new questions until the lesson runs out', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.lesson-card >> nth=0');
  const result = await page.evaluate(async () => {
    const { pickQuestions, markAsked, resetAsked, GAME_TURNS } = await import('/js/questionDeck.js');
    const { POP_QUESTIONS } = await import('/js/content/stage6-ballpop.js');
    const { ZOMBIE_QUESTIONS } = await import('/js/content/stage17-zombies.js');
    resetAsked();
    const seen = new Set();
    let firstRepeatAt = null;
    // Play Balloon Pop over and over, asking every question picked.
    for (let game = 0; game < 30 && firstRepeatAt === null; game++) {
      const picks = pickQuestions(POP_QUESTIONS);
      if (picks.length !== GAME_TURNS) return { error: `picked ${picks.length}` };
      for (const q of picks) {
        const k = q.prompt.trim().toLowerCase();
        if (seen.has(k) && firstRepeatAt === null) firstRepeatAt = seen.size;
        seen.add(k);
        markAsked(q);
      }
    }
    // The game's own bank comes first: a fresh deck's first game is all Balloon Pop.
    resetAsked();
    const own = new Set(POP_QUESTIONS);
    const firstGame = pickQuestions(POP_QUESTIONS).every(q => own.has(q));
    resetAsked();
    return { firstRepeatAt, pool: ZOMBIE_QUESTIONS.length, firstGame };
  });
  expect(result.error).toBeUndefined();
  expect(result.firstGame).toBe(true);
  // No repeats until every distinct question in the lesson's game banks was asked.
  expect(result.firstRepeatAt).toBe(result.pool);
});
