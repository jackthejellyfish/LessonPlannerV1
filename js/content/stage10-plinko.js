/* =========================================================
   LESSON CONTENT — Stage 10 (Plinko Drop)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    PLINKO_QUESTIONS: [
      { prompt: "What is the comparative of 'tall'?", answer: "taller" },
      { prompt: "What is the comparative of 'strong'?", answer: "stronger" },
      { prompt: "What is the comparative of 'quiet'?", answer: "quieter" },
      { prompt: "What is the comparative of 'big'?", answer: "bigger" },
      { prompt: "What is the comparative of 'friendly'?", answer: "friendlier" },
      { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther" },
      { prompt: "What is the comparative of 'hot'?", answer: "hotter" },
      { prompt: "What is the comparative of 'careful'?", answer: "more careful" },
      { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" }
    ]
  },
  health: {
    PLINKO_QUESTIONS: [
      { prompt: "I've got a headache.", answer: "I should take some medicine." },
      { prompt: "I've got a fever.", answer: "I should stay in bed." },
      { prompt: "I've got a sore throat.", answer: "I should drink some hot tea." },
      { prompt: "I've got a toothache.", answer: "I should see a dentist." },
      { prompt: "I've got a cold.", answer: "I should stay in bed." },
      { prompt: "I've got a stomach ache.", answer: "I should see a doctor." },
      { prompt: "I've got a runny nose.", answer: "I should blow my nose." },
      { prompt: "I've got a cough.", answer: "I should drink some water." },
      { prompt: "I've got hiccups.", answer: "I should drink some water." },
      { prompt: "I'm tired.", answer: "I should get some sleep." }
    ]
  }
};

export const PLINKO_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  PLINKO_QUESTIONS.length = 0;
  PLINKO_QUESTIONS.push(...data.PLINKO_QUESTIONS);
}
applyLesson('comparatives');

// wobble is a percentage of the ball's current impact speed added as a
// random sideways kick on every peg hit (see updateOnePlinkoBall / peg
// collision logic in stage10-plinko.js). Eight types unlock progressively,
// one per turn (turns 0-7 of the 10-question game). Pure game mechanic —
// not lesson content, so it doesn't vary by lesson.
export const BALL_TYPES = [
  { id: 'classic', name: 'Classic', unlockAtTurn: 0, radiusPct: 1.7, gravity: 680, restitution: 0.55, wobble: 48, colorA: '#ffffff', colorB: '#C7C9D6', glow: '#9C96D8' },
  { id: 'heavy', name: 'Heavy', unlockAtTurn: 1, radiusPct: 2.0, gravity: 950, restitution: 0.35, wobble: 26, colorA: '#E4E7EC', colorB: '#6B7280', glow: '#8A8F98' },
  { id: 'exploding', name: 'Exploding', unlockAtTurn: 2, radiusPct: 1.8, gravity: 700, restitution: 0.5, wobble: 55, colorA: '#FFD9C2', colorB: '#E8432B', glow: '#FF5A2E', explosive: true },
  { id: 'bouncy', name: 'Bouncy', unlockAtTurn: 3, radiusPct: 1.6, gravity: 560, restitution: 0.88, wobble: 72, colorA: '#FFD6F3', colorB: '#FF3E9A', glow: '#FF3E9A' },
  { id: 'splitting', name: 'Splitting', unlockAtTurn: 4, radiusPct: 1.45, gravity: 650, restitution: 0.55, wobble: 48, colorA: '#D6F5FF', colorB: '#2FB5E0', glow: '#43D1FF', splitter: true },
  { id: 'blazing', name: 'Blazing', unlockAtTurn: 5, radiusPct: 1.8, gravity: 720, restitution: 0.6, wobble: 52, colorA: '#FFE1B8', colorB: '#FF6A00', glow: '#FF6A00', fiery: true },
  { id: 'chaos', name: 'Chaos', unlockAtTurn: 6, radiusPct: 1.7, gravity: 680, restitution: 0.6, wobble: 65, colorA: '#EAD9FF', colorB: '#8B3EFF', glow: '#B26BFF', chaotic: true },
  { id: 'golden', name: 'Golden', unlockAtTurn: 7, radiusPct: 1.8, gravity: 680, restitution: 0.55, wobble: 40, colorA: '#FFF9E0', colorB: '#FFD23F', glow: '#FFD23F', jackpot: true }
];

// 9 scoring slots, weighted like a real Plinko board — edges pay far more
// than the center, since the peg field naturally funnels most balls toward
// the middle. Pure game mechanic — not lesson content.
export const SLOT_VALUES = [100, 25, 10, 5, 2, 5, 10, 25, 100];
