/* =========================================================
   LESSON CONTENT — Stage 12 (Comet Chaos)
   Every position/radius is a % of the canvas (x and radii of
   canvas.width, y of canvas.height — same convention as Sky
   Slingshot's pigs/blocks).
========================================================= */
export const COMET_QUESTIONS = [
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
];

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
