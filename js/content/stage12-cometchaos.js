/* =========================================================
   LESSON CONTENT — Stage 12 (Comet Chaos)
   Every position/radius is a % of the canvas (x and radii of
   canvas.width, y of canvas.height — same convention as Sky
   Slingshot's pigs/blocks).
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    COMET_QUESTIONS: [
      { prompt: "What is the comparative of 'young'?", answer: "younger" },
      { prompt: "What is the comparative of 'clean'?", answer: "cleaner" },
      { prompt: "What is the comparative of 'cheap'?", answer: "cheaper" },
      { prompt: "What is the comparative of 'safe'?", answer: "safer" },
      { prompt: "What is the comparative of 'wide'?", answer: "wider" },
      { prompt: "What is the comparative of 'deep'?", answer: "deeper" },
      { prompt: "What is the comparative of 'gentle'?", answer: "gentler" },
      { prompt: "What is the comparative of 'famous'?", answer: "more famous" },
      { prompt: "What is the comparative of 'little'? (it's irregular!)", answer: "less" },
      { prompt: "What is the comparative of 'many'? (it's irregular!)", answer: "more" }
    ]
  },
  health: {
    COMET_QUESTIONS: [
      { prompt: "He's got a stomach ache, but he keeps eating cake. What shouldn't he do?", answer: "He shouldn't eat too much." },
      { prompt: "She's got a cold, but she wants to go outside without a coat. What shouldn't she do?", answer: "She shouldn't go outside without a coat." },
      { prompt: "He's got a sore throat, but he wants to shout at the match. What shouldn't he do?", answer: "He shouldn't shout." },
      { prompt: "She's tired, but she wants to stay up all night. What shouldn't she do?", answer: "She shouldn't stay up late." },
      { prompt: "He's got a headache, but he wants to play loud music. What shouldn't he do?", answer: "He shouldn't play loud music." },
      { prompt: "They've got backaches, but they keep carrying heavy bags. What shouldn't they do?", answer: "They shouldn't carry heavy bags." },
      { prompt: "She's got a fever, but she wants to go to school. What shouldn't she do?", answer: "She shouldn't go to school." },
      { prompt: "He's got a cough, but he wants to eat ice cream. What shouldn't he do?", answer: "He shouldn't eat ice cream." },
      { prompt: "She's got an earache, but she wants to listen to loud music. What shouldn't she do?", answer: "She shouldn't listen to loud music." },
      { prompt: "He's got a toothache, but he wants to eat sweets. What shouldn't he do?", answer: "He shouldn't eat sweets." }
    ]
  }
};

export const COMET_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  COMET_QUESTIONS.length = 0;
  COMET_QUESTIONS.push(...data.COMET_QUESTIONS);
}
applyLesson('comparatives');

export const COMET_LEVELS = [
  {
    planets: [{ x: 55, y: 50, r: 7, mass: 1.6 }],
    blackHole: null,
    target: { x: 88, y: 50, r: 9, rBonus: 4 }
  },
  {
    planets: [{ x: 40, y: 30, r: 6, mass: 1.3 }, { x: 66, y: 72, r: 6, mass: 1.3 }],
    blackHole: null,
    target: { x: 90, y: 50, r: 8, rBonus: 3.5 }
  },
  {
    planets: [{ x: 35, y: 62, r: 6, mass: 1.4 }, { x: 60, y: 25, r: 5, mass: 1.1 }],
    blackHole: { x: 76, y: 65, r: 6 },
    target: { x: 90, y: 20, r: 7.5, rBonus: 3.2 }
  },
  {
    planets: [{ x: 30, y: 25, r: 5, mass: 1.2 }, { x: 55, y: 78, r: 6, mass: 1.5 }, { x: 78, y: 35, r: 5, mass: 1.1 }],
    blackHole: { x: 65, y: 55, r: 6.5 },
    target: { x: 92, y: 80, r: 7, rBonus: 3 }
  }
];
