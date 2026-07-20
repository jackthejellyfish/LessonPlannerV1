/* =========================================================
   LESSON CONTENT — Stage 13 (Billiards)
========================================================= */
export const BILLIARDS_QUESTIONS = [
  { prompt: "What is the comparative of 'straight'?", answer: "straighter" },
  { prompt: "What is the comparative of 'round'?", answer: "rounder" },
  { prompt: "What is the comparative of 'smooth'?", answer: "smoother" },
  { prompt: "What is the comparative of 'steady'?", answer: "steadier" },
  { prompt: "What is the comparative of 'sharp'?", answer: "sharper" },
  { prompt: "What is the comparative of 'precise'?", answer: "more precise" },
  { prompt: "What is the comparative of 'skilful'?", answer: "more skilful" },
  { prompt: "What is the comparative of 'lucky'?", answer: "luckier" },
  { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
  { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther" }
];

// Point value + color only — position is NOT part of the content anymore.
// Every ball (cue included) gets a fresh random position each turn
// (`placeBallsRandomly()` in stage13-billiards.js), rejection-sampled so
// nothing spawns overlapping, per feedback that a static layout felt stale.
//
// Still deliberately NOT a real triangle rack — balls spread out with clear
// space around each one, like a practice-drill setup rather than an
// authentic break. Tried an actual tight 6-ball rack first and it didn't
// work for this game: confirmed via testing that a tightly packed cluster
// absorbs and redistributes the cue ball's momentum across many glancing
// sub-collisions (realistic — that's what a real break does too), so almost
// none of that energy survives as one clean shot toward a pocket, even with
// generous arcade physics. Spreading the balls out means aiming at any ONE
// of them is a clean, direct hit that keeps most of its transferred speed —
// pocketing something becomes a real, achievable skill-based outcome most
// turns instead of a rare fluke, which matters far more here than rack
// authenticity.
export const BILLIARDS_BALLS = [
  { value: 5,  color: '#FF6B6B' },
  { value: 10, color: '#FF9F43' },
  { value: 15, color: '#FFD23F' },
  { value: 20, color: '#3DB88D' },
  { value: 25, color: '#4C5FD5' },
  { value: 50, color: '#2B2B3A' }
];
