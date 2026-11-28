/* =========================================================
   QUESTION DECK — which questions a game asks
   Feedback 2026-11-27: "the same questions keep coming up". Every game
   used to ask its whole bank once a game, in a shuffled order, so the
   bank WAS the game: a replay, or a second round, asked the same ten
   questions again.

   Now a game is GAME_TURNS turns long whatever the bank's size, and
   picks its questions from the lesson's questions in this order:
   1. its own bank's questions not asked yet this lesson (any game);
   2. the lesson's other games' questions not asked yet;
   3. only then repeats, the least recently asked first.
   "Asked" is remembered per lesson until the page is reloaded (a
   restart or a lesson switch keeps it), by prompt text, so the same
   question in two games' banks counts once.

   askTeamQuestion() (js/questionChoices.js) records each question as
   it's actually asked, so the turns a class never reached stay fresh.
========================================================= */
import { shuffle } from './utils.js';
import { state } from './state.js';
import { POP_QUESTIONS } from './content/stage6-ballpop.js';
import { INV_QUESTIONS } from './content/stage7-stardefender.js';
import { BILLIARDS_QUESTIONS } from './content/stage10-billiards.js';
import { NEON_QUESTIONS } from './content/stage11-neonarena.js';
import { FRUIT_QUESTIONS } from './content/stage12-fruitninja.js';
import { HOOP_QUESTIONS } from './content/stage13-hoopshot.js';
import { WHACK_QUESTIONS } from './content/stage14-whack.js';
import { MAZE_QUESTIONS } from './content/stage15-maze.js';
import { JUMP_QUESTIONS } from './content/stage16-ninjajump.js';

export const GAME_TURNS = 10;

// The banks a game can borrow from. Spin the Wheel's open speaking
// tasks stay on the wheel (it can still borrow from these).
const BANKS = [POP_QUESTIONS, INV_QUESTIONS, BILLIARDS_QUESTIONS, NEON_QUESTIONS, FRUIT_QUESTIONS,
  HOOP_QUESTIONS, WHACK_QUESTIONS, MAZE_QUESTIONS, JUMP_QUESTIONS];

// lesson id -> Map(prompt -> tick it was last asked)
const askedByLesson = new Map();
let tick = 0;
// question -> the bank it lives in, so a borrowed question's
// multiple-choice options come from its own kind of answers.
const homeOf = new WeakMap();

const key = (q) => String(q.prompt).trim().toLowerCase();
function asked(){
  const id = state.currentLesson;
  if(!askedByLesson.has(id)) askedByLesson.set(id, new Map());
  return askedByLesson.get(id);
}

export function markAsked(q){
  if(q && q.prompt) asked().set(key(q), ++tick);
}
export function homeBank(q){ return homeOf.get(q) || null; }

// `count` questions for a game whose own bank is `bank`.
export function pickQuestions(bank, count = GAME_TURNS){
  for(const b of BANKS) for(const q of b) if(!homeOf.has(q)) homeOf.set(q, b);
  const seen = asked();
  const taken = new Set();
  const out = [];
  const take = (list) => {
    for(const q of list){
      if(out.length >= count) return;
      if(taken.has(key(q))) continue;
      taken.add(key(q));
      out.push(q);
    }
  };
  take(shuffle(bank.filter(q => !seen.has(key(q)))));
  take(shuffle(BANKS.filter(b => b !== bank).flat().filter(q => !seen.has(key(q)))));
  // Everything has been asked: the least recently asked come back first.
  const byAge = (list) => shuffle(list).sort((a, b) => (seen.get(key(a)) || 0) - (seen.get(key(b)) || 0));
  take(byAge(bank));
  take(byAge(BANKS.flat()));
  return out;
}

// Test hook: forget what's been asked.
export function resetAsked(){ askedByLesson.clear(); }
