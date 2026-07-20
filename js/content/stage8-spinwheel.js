/* =========================================================
   LESSON CONTENT — Stage 8 (Spin the Wheel)
   10 segments, each a fixed position on the wheel with its own
   question and point value. Point values are deliberately scattered
   (not sorted by difficulty, not monotonically increasing around the
   wheel) for a genuine "wheel of fortune" feel — big jackpots (100, 200)
   and a token, mostly-for-laughs "1" mixed in among modest everyday
   values, per feedback asking for much more variance than the original
   10-30 range. Landing on a big segment is luck, not a harder question.
========================================================= */
export const WHEEL_QUESTIONS = [
  { prompt: "What is the comparative of 'quick'?", answer: "quicker", points: 10 },
  { prompt: "What is the comparative of 'wise'?", answer: "wiser", points: 100 },
  { prompt: "What is the comparative of 'dark'?", answer: "darker", points: 15 },
  { prompt: "What is the comparative of 'bright'?", answer: "brighter", points: 5 },
  { prompt: "What is the comparative of 'calm'?", answer: "calmer", points: 200 },
  { prompt: "What is the comparative of 'crowded'?", answer: "more crowded", points: 20 },
  { prompt: "What is the comparative of 'beautiful'?", answer: "more beautiful", points: 1 },
  { prompt: "What is the comparative of 'curious'?", answer: "more curious", points: 50 },
  { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther", points: 25 },
  { prompt: "What is the comparative of 'little'? (it's irregular!)", answer: "less", points: 30 }
];

// One distinct color per segment, fixed position on the wheel.
export const WHEEL_COLORS = [
  "#FF6B6B", "#4C5FD5", "#3DB88D", "#F2B705", "#B266FF",
  "#FF8C42", "#31E6E0", "#FF6B8B", "#8577A8", "#5C9C7C"
];
