/* =========================================================
   LESSON CONTENT — Stage 17 (Zombie Dash)
   The last game is a REVIEW round: its questions are drawn from the
   lesson's other games (all of them, as one pool), so it has content
   for every lesson, including any added later, without a block of its own.
   That makes this the one content file that reads other content files,
   and main.js applies it LAST, after their arrays hold the new lesson.

   Each question keeps a note of the bank it came from (bankOf), so a
   multiple-choice turn builds its wrong options from like-for-like
   answers ("bigger" against "taller"), not from a mix of shapes.
========================================================= */
import { POP_QUESTIONS } from './stage6-ballpop.js';
import { INV_QUESTIONS } from './stage7-stardefender.js';
import { BILLIARDS_QUESTIONS } from './stage10-billiards.js';
import { NEON_QUESTIONS } from './stage11-neonarena.js';
import { FRUIT_QUESTIONS } from './stage12-fruitninja.js';
import { HOOP_QUESTIONS } from './stage13-hoopshot.js';
import { WHACK_QUESTIONS } from './stage14-whack.js';
import { MAZE_QUESTIONS } from './stage15-maze.js';
import { JUMP_QUESTIONS } from './stage16-ninjajump.js';

const BANKS = [POP_QUESTIONS, INV_QUESTIONS, BILLIARDS_QUESTIONS, NEON_QUESTIONS, FRUIT_QUESTIONS,
  HOOP_QUESTIONS, WHACK_QUESTIONS, MAZE_QUESTIONS, JUMP_QUESTIONS];
export const ZOMBIE_QUESTIONS = [];
let sourceBank = new Map();

// The bank a review question came from (for multiple-choice options).
export function bankOf(q){ return sourceBank.get(q) || ZOMBIE_QUESTIONS; }

// Every question in the other games' banks (each prompt once). The game
// picks its ten through js/questionDeck.js, which favours the ones the
// class hasn't met yet this lesson.
export function applyLesson(){
  ZOMBIE_QUESTIONS.length = 0;
  sourceBank = new Map();
  const seen = new Set();
  for(const bank of BANKS){
    for(const q of bank){
      if(seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      ZOMBIE_QUESTIONS.push(q);
      sourceBank.set(q, bank);
    }
  }
}
applyLesson();
