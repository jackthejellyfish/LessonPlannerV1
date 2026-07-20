/* =========================================================
   LESSON CONTENT — Stage 11 (Sky Slingshot)
   Every pig/block position is a % of the canvas — resolution-
   independent, so a resize (or the compact-mode toggle) never has to
   rescale live game state, just re-read canvas.width/height at
   render/collision time.
========================================================= */
export const BIRDS_QUESTIONS = [
  { prompt: "What is the comparative of 'small'?", answer: "smaller" },
  { prompt: "What is the comparative of 'loud'?", answer: "louder" },
  { prompt: "What is the comparative of 'brave'?", answer: "braver" },
  { prompt: "What is the comparative of 'funny'?", answer: "funnier" },
  { prompt: "What is the comparative of 'high'?", answer: "higher" },
  { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther" },
  { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
  { prompt: "What is the comparative of 'heavy'?", answer: "heavier" },
  { prompt: "What is the comparative of 'thin'?", answer: "thinner" },
  { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" }
];

// Eight layouts, cycling via state.birdsLevelIndex % BIRD_LEVELS.length.
// Blocks are deliberately stacked directly on top of one another (same
// x, touching y edges — each tier's y is exactly one block-height above
// the one below) so the cascading-collapse logic in
// stage11-angrybirds.js (destroying a block topples anything resting on
// it, recursively) reads as an obvious, satisfying tower collapse rather
// than an accidental gap.
//
// Pots carry a `value` field (2026-07-16, per feedback that structures
// felt "boring") — omitted on most pots, which defaults to POINTS_PIG
// (10) in stage11-angrybirds.js, but the hardest-to-reach pot in levels
// 4-6 and the two new levels below (7-8) is a 25-point "chief" pot,
// rendered with a gold band instead of brown so it reads as a bonus
// target worth aiming for specifically, not just more of the same.
export const BIRD_LEVELS = [
  {
    // Intro level: no towers yet, just pots resting on the sand.
    pigs: [{ x: 66, y: 84, r: 2.8 }, { x: 76, y: 84, r: 2.8 }, { x: 86, y: 84, r: 2.8 }, { x: 96, y: 84, r: 2.8 }],
    blocks: []
  },
  {
    // Two 1-block towers + 2 ground pots.
    pigs: [
      { x: 58, y: 76.3, r: 2.7 }, { x: 94, y: 76.3, r: 2.7 },
      { x: 70, y: 84, r: 2.7 }, { x: 82, y: 84, r: 2.7 }
    ],
    blocks: [
      { x: 58, y: 83.5, w: 3.6, h: 9 }, { x: 94, y: 83.5, w: 3.6, h: 9 }
    ]
  },
  {
    // Three 1-block towers + one 2-block tower + 1 ground pot.
    pigs: [
      { x: 55, y: 76.3, r: 2.6 }, { x: 70, y: 76.3, r: 2.6 }, { x: 85, y: 76.3, r: 2.6 },
      { x: 95, y: 67.4, r: 2.5 },
      { x: 45, y: 84, r: 2.6 }
    ],
    blocks: [
      { x: 55, y: 83.5, w: 3.4, h: 9 }, { x: 70, y: 83.5, w: 3.4, h: 9 }, { x: 85, y: 83.5, w: 3.4, h: 9 },
      { x: 95, y: 83.5, w: 3.4, h: 9 }, { x: 95, y: 74.5, w: 3.4, h: 9 }
    ]
  },
  {
    // Two 2-block towers + two 1-block towers + 1 ground pot.
    pigs: [
      { x: 52, y: 67.4, r: 2.5, value: 25 }, { x: 78, y: 67.4, r: 2.5 },
      { x: 65, y: 76.3, r: 2.5 }, { x: 92, y: 76.3, r: 2.5 },
      { x: 40, y: 84, r: 2.5 }
    ],
    blocks: [
      { x: 52, y: 83.5, w: 3.2, h: 9 }, { x: 52, y: 74.5, w: 3.2, h: 9 },
      { x: 78, y: 83.5, w: 3.2, h: 9 }, { x: 78, y: 74.5, w: 3.2, h: 9 },
      { x: 65, y: 83.5, w: 3.2, h: 9 }, { x: 92, y: 83.5, w: 3.2, h: 9 }
    ]
  },
  {
    // One 3-block tower, two 2-block towers, one 1-block tower + 1 ground pot.
    pigs: [
      { x: 75, y: 58.4, r: 2.4, value: 25 },
      { x: 50, y: 67.4, r: 2.4 }, { x: 92, y: 67.4, r: 2.4 },
      { x: 63, y: 76.3, r: 2.4 },
      { x: 40, y: 84, r: 2.4 }
    ],
    blocks: [
      { x: 75, y: 83.5, w: 3, h: 9 }, { x: 75, y: 74.5, w: 3, h: 9 }, { x: 75, y: 65.5, w: 3, h: 9 },
      { x: 50, y: 83.5, w: 3, h: 9 }, { x: 50, y: 74.5, w: 3, h: 9 },
      { x: 92, y: 83.5, w: 3, h: 9 }, { x: 92, y: 74.5, w: 3, h: 9 },
      { x: 63, y: 83.5, w: 3, h: 9 }
    ]
  },
  {
    // Hardest: two 3-block towers + two 2-block towers + 1 ground pot.
    pigs: [
      { x: 55, y: 58.4, r: 2.3, value: 25 }, { x: 88, y: 58.4, r: 2.3 },
      { x: 70, y: 67.4, r: 2.3 }, { x: 98, y: 67.4, r: 2.3 },
      { x: 40, y: 84, r: 2.3 }
    ],
    blocks: [
      { x: 55, y: 83.5, w: 3, h: 9 }, { x: 55, y: 74.5, w: 3, h: 9 }, { x: 55, y: 65.5, w: 3, h: 9 },
      { x: 88, y: 83.5, w: 3, h: 9 }, { x: 88, y: 74.5, w: 3, h: 9 }, { x: 88, y: 65.5, w: 3, h: 9 },
      { x: 70, y: 83.5, w: 3, h: 9 }, { x: 70, y: 74.5, w: 3, h: 9 },
      { x: 98, y: 83.5, w: 3, h: 9 }, { x: 98, y: 74.5, w: 3, h: 9 }
    ]
  },
  {
    // "Bridge": a wide slab lintel spans two single-block support towers,
    // with a chief pot balanced on top of the lintel itself — knocking
    // out EITHER support (not just one specific block) brings the lintel
    // and the pot down together, since the collapse check is a genuine
    // x-overlap test, not a same-x-only stack (see triggerCollapse).
    // Two easy ground pots on the flanks keep a total miss on the bridge
    // from being a total zero.
    pigs: [
      { x: 35, y: 84, r: 2.6 }, { x: 95, y: 84, r: 2.6 },
      { x: 65, y: 69.8, r: 3.2, value: 25 }
    ],
    blocks: [
      { x: 52, y: 83.5, w: 3, h: 9 }, { x: 78, y: 83.5, w: 3, h: 9 },
      { x: 65, y: 77, w: 30, h: 4 }
    ]
  },
  {
    // "Skyline": a row of short pedestals with small pots, one tall
    // 2-block pedestal in the middle topped with a chief pot — a clear
    // "go for the middle" bonus target framed by easier flanking shots,
    // instead of every target being roughly the same height/value.
    pigs: [
      { x: 45, y: 76.6, r: 2.4 }, { x: 58, y: 76.6, r: 2.4 },
      { x: 71, y: 66.8, r: 3.2, value: 25 },
      { x: 84, y: 76.6, r: 2.4 }, { x: 97, y: 76.6, r: 2.4 }
    ],
    blocks: [
      { x: 45, y: 83.5, w: 3, h: 9 }, { x: 58, y: 83.5, w: 3, h: 9 },
      { x: 71, y: 83.5, w: 3.4, h: 9 }, { x: 71, y: 74.5, w: 3.4, h: 9 },
      { x: 84, y: 83.5, w: 3, h: 9 }, { x: 97, y: 83.5, w: 3, h: 9 }
    ]
  }
];
