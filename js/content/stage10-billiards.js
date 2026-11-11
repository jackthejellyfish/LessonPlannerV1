/* =========================================================
   LESSON CONTENT — Stage 13 (Billiards)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    BILLIARDS_QUESTIONS: [
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
    ]
  },
  health: {
    BILLIARDS_QUESTIONS: [
      { prompt: "We've got sore throats.", answer: "We should drink some hot tea." },
      { prompt: "I've got a headache.", answer: "I should take some medicine." },
      { prompt: "We've got colds.", answer: "We should stay in bed." },
      { prompt: "I've got a toothache.", answer: "I should see a dentist." },
      { prompt: "We're tired.", answer: "We should get some sleep." },
      { prompt: "I've got a runny nose.", answer: "I should blow my nose." },
      { prompt: "We've got a fever.", answer: "We should stay in bed." },
      { prompt: "I've got a stomach ache.", answer: "I should see a doctor." },
      { prompt: "We've got a cough.", answer: "We should drink some water." },
      { prompt: "I've got a backache.", answer: "I should rest." }
    ]
  },
  'comparatives-superlatives': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Complete: 'A plane is ___ than a train.' (fast)", answer: "faster" },
      { prompt: "Complete: 'This is ___ book in the library.' (interesting)", answer: "the most interesting" },
      { prompt: "Complete: 'My room is ___ than yours.' (tidy)", answer: "tidier" },
      { prompt: "Complete: 'He is ___ boy in the class.' (tall)", answer: "the tallest" },
      { prompt: "Complete: 'Gold is ___ than silver.' (expensive)", answer: "more expensive" },
      { prompt: "Complete: 'Today is ___ day of the year.' (hot)", answer: "the hottest" },
      { prompt: "Complete: 'This test was ___ than the last one.' (easy)", answer: "easier" },
      { prompt: "Complete: 'She is ___ runner on the team.' (good)", answer: "the best" },
      { prompt: "Complete: 'A lion is ___ than a cat.' (dangerous)", answer: "more dangerous" },
      { prompt: "Complete: 'That was ___ day of my life.' (bad)", answer: "the worst" }
    ]
  },
  'will-wont': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Complete: 'I ___ see you tomorrow.'", answer: "will" },
      { prompt: "Complete: 'She ___ be late \u2014 she is never late.'", answer: "won't" },
      { prompt: "Complete: '___ you open the window, please?'", answer: "Will" },
      { prompt: "Complete: 'They ___ arrive at eight o'clock.'", answer: "will" },
      { prompt: "Complete: 'We ___ forget this holiday.'", answer: "won't" },
      { prompt: "Complete: 'It ___ snow in Da Nang.'", answer: "won't" },
      { prompt: "Complete: 'He ___ be fifteen next birthday.'", answer: "will" },
      { prompt: "Complete: 'I'm tired, so I ___ go out tonight.'", answer: "won't" },
      { prompt: "Complete: 'The film ___ start at seven.'", answer: "will" },
      { prompt: "Complete: 'Don't worry \u2014 it ___ hurt.'", answer: "won't" }
    ]
  },
  'present-perfect': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Complete: 'I ___ already eaten.'", answer: "have" },
      { prompt: "Complete: 'She ___ just arrived.'", answer: "has" },
      { prompt: "Complete: 'We ___ never been to Paris.'", answer: "have" },
      { prompt: "Complete: 'He ___ not finished yet.'", answer: "has" },
      { prompt: "Complete: '___ they left already?'", answer: "Have" },
      { prompt: "Complete: 'My phone ___ stopped working.'", answer: "has" },
      { prompt: "Complete: 'You ___ grown so tall!'", answer: "have" },
      { prompt: "Complete: 'It ___ been a long day.'", answer: "has" },
      { prompt: "Complete: 'The children ___ gone to bed.'", answer: "have" },
      { prompt: "Complete: '___ your sister ever flown on a plane?'", answer: "Has" }
    ]
  }
};

export const BILLIARDS_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  BILLIARDS_QUESTIONS.length = 0;
  BILLIARDS_QUESTIONS.push(...data.BILLIARDS_QUESTIONS);
}
applyLesson('comparatives');

// Point value + color only — position is NOT part of the content anymore.
// Every ball (cue included) gets a fresh random position each turn
// (`placeBallsRandomly()` in stage12-billiards.js), rejection-sampled so
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
// authenticity. Pure game mechanic — not lesson content.
export const BILLIARDS_BALLS = [
  { value: 5,  color: '#FF6B6B' },
  { value: 10, color: '#FF9F43' },
  { value: 15, color: '#FFD23F' },
  { value: 20, color: '#3DB88D' },
  { value: 25, color: '#4C5FD5' },
  { value: 50, color: '#2B2B3A' }
];
