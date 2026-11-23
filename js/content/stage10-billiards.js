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
  },
  'amusement-park': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Complete: 'The roller coaster was ___.' (excite)", answer: "exciting" },
      { prompt: "Complete: 'I was very ___ on the roller coaster.' (excite)", answer: "excited" },
      { prompt: "Complete: 'The parade was long and ___.' (bore)", answer: "boring" },
      { prompt: "Complete: 'My little brother was ___.' (bore)", answer: "bored" },
      { prompt: "Complete: 'The 3D film was ___!' (amaze)", answer: "amazing" },
      { prompt: "Complete: 'We were ___ by the fireworks.' (amaze)", answer: "amazed" },
      { prompt: "Complete: 'The haunted house was ___.' (scary / scared)", answer: "scary" },
      { prompt: "Complete: 'She was ___ of the ghost.' (scary / scared)", answer: "scared" },
      { prompt: "Complete: 'We walked all day. It was ___.' (tire)", answer: "tiring" },
      { prompt: "Complete: 'After the park, they were very ___.' (tire)", answer: "tired" }
    ]
  },
  'party-fun': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Short answer, yes: 'Will you bring games?'", answer: "Yes, I will." },
      { prompt: "Short answer, no: 'Will he choose the music?'", answer: "No, he won't." },
      { prompt: "Short answer, yes: 'Will she bake biscuits?'", answer: "Yes, she will." },
      { prompt: "Short answer, no: 'Will they order pizza?'", answer: "No, they won't." },
      { prompt: "Short answer, yes: 'Will Rosa set the table?'", answer: "Yes, she will." },
      { prompt: "Short answer, no: 'Will you blow up the balloons?'", answer: "No, I won't." },
      { prompt: "Short answer, yes: 'Will Dave play the music?'", answer: "Yes, he will." },
      { prompt: "Short answer, no: 'Will Tom and Ann draw the posters?'", answer: "No, they won't." },
      { prompt: "Short answer, yes: 'Will your friends set up the games?'", answer: "Yes, they will." },
      { prompt: "Short answer, no: 'Will Mr Kim serve the pizza?'", answer: "No, he won't." }
    ]
  },
  'at-school': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Answer with I: 'What have you got?' (a marker pen)", answer: "I've got a marker pen." },
      { prompt: "Answer with she: 'What has she got?' (a stapler)", answer: "She's got a stapler." },
      { prompt: "Answer with he: 'What has he got?' (a glue stick)", answer: "He's got a glue stick." },
      { prompt: "Answer with we: 'What have you got?' (a paintbrush)", answer: "We've got a paintbrush." },
      { prompt: "Answer with she: 'What has Mia got?' (a pencil sharpener)", answer: "She's got a pencil sharpener." },
      { prompt: "Answer with I: 'What do you want?' (pizza)", answer: "I want pizza." },
      { prompt: "Answer with he: 'What does he want?' (fish)", answer: "He wants fish." },
      { prompt: "Answer with she: 'What does she want?' (soup)", answer: "She wants soup." },
      { prompt: "Answer with they: 'What do they want?' (chicken)", answer: "They want chicken." },
      { prompt: "Answer with he: 'What does Tom want?' (steak and juice)", answer: "He wants steak and juice." }
    ]
  },
  'months-weather': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Answer: 'When's your birthday?' (May)", answer: "It's in May." },
      { prompt: "Answer: 'When's your birthday?' (the 5th of May)", answer: "It's on the fifth of May." },
      { prompt: "Answer: 'What's the weather like?' (sun)", answer: "It's sunny." },
      { prompt: "Answer: 'What's the weather like?' (rain)", answer: "It's rainy." },
      { prompt: "Answer: 'What's the weather like?' (snow, cold)", answer: "It's snowy and cold." },
      { prompt: "Answer: 'What season is it?' (June)", answer: "It's summer." },
      { prompt: "Answer: 'What season is it?' (October)", answer: "It's autumn." },
      { prompt: "Answer: 'When's Christmas?' (the 25th of December)", answer: "It's on the twenty-fifth of December." },
      { prompt: "Answer: 'What's the weather like?' (wind)", answer: "It's windy." },
      { prompt: "Answer: 'What season is it?' (April)", answer: "It's spring." }
    ]
  },
  'food-drink': {
    BILLIARDS_QUESTIONS: [
      { prompt: "Answer: 'Is there any milk?' (yes)", answer: "Yes, there is." },
      { prompt: "Answer: 'Are there any cookies?' (no)", answer: "No, there aren't." },
      { prompt: "Answer: 'Is there a banana?' (no)", answer: "No, there isn't." },
      { prompt: "Answer: 'Are there any carrots?' (yes)", answer: "Yes, there are." },
      { prompt: "Answer: 'Is there any bread?' (no — rice)", answer: "No, there isn't any bread. But there's some rice." },
      { prompt: "Answer: 'What would you like to drink?' (water)", answer: "I'd like water, please." },
      { prompt: "Answer: 'Are you ready to order?' (a pizza)", answer: "Yes, I'll have a pizza, please." },
      { prompt: "Answer: 'Is there any juice?' (yes)", answer: "Yes, there is." },
      { prompt: "Answer: 'Are there any potatoes?' (no — carrots)", answer: "No, there aren't any potatoes. But there are some carrots." },
      { prompt: "Answer: 'Can I help you?' (a sandwich)", answer: "Can I have a sandwich, please?" }
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
