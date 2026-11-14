/* =========================================================
   LESSON CONTENT — Stage 6 (Ball Pop Challenge)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    POP_QUESTIONS: [
      { prompt: "What is the comparative of 'tall'?", answer: "taller" },
      { prompt: "What is the comparative of 'big'?", answer: "bigger" },
      { prompt: "What is the comparative of 'nice'?", answer: "nicer" },
      { prompt: "What is the comparative of 'hot'?", answer: "hotter" },
      { prompt: "What is the comparative of 'happy'?", answer: "happier" },
      { prompt: "What is the comparative of 'safe'?", answer: "safer" },
      { prompt: "What is the comparative of 'easy'?", answer: "easier" },
      { prompt: "What is the comparative of 'busy'?", answer: "busier" },
      { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
      { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" }
    ]
  },
  health: {
    POP_QUESTIONS: [
      { prompt: "I've got a headache. What should you do?", answer: "You should take some medicine." },
      { prompt: "I've got a fever. What should you do?", answer: "You should stay in bed." },
      { prompt: "I've got a runny nose. What should you do?", answer: "You should blow your nose." },
      { prompt: "I've got a toothache. What should you do?", answer: "You should see a dentist." },
      { prompt: "I've got a stomach ache. What should you do?", answer: "You should see a doctor." },
      { prompt: "I've got a sore throat. What should you do?", answer: "You should drink some hot tea." },
      { prompt: "I've got a cough. What should you do?", answer: "You should drink some water." },
      { prompt: "I've got a cold. What should you do?", answer: "You should stay in bed." },
      { prompt: "I've got a backache. What should you do?", answer: "You should rest." },
      { prompt: "I've got an earache. What should you do?", answer: "You should see a doctor." }
    ]
  },
  'comparatives-superlatives': {
    POP_QUESTIONS: [
      { prompt: "What is the superlative of 'tall'?", answer: "the tallest" },
      { prompt: "What is the superlative of 'big'?", answer: "the biggest" },
      { prompt: "What is the superlative of 'nice'?", answer: "the nicest" },
      { prompt: "What is the superlative of 'hot'?", answer: "the hottest" },
      { prompt: "What is the superlative of 'happy'?", answer: "the happiest" },
      { prompt: "What is the superlative of 'safe'?", answer: "the safest" },
      { prompt: "What is the superlative of 'easy'?", answer: "the easiest" },
      { prompt: "What is the superlative of 'busy'?", answer: "the busiest" },
      { prompt: "What is the superlative of 'good'? (it's irregular!)", answer: "the best" },
      { prompt: "What is the superlative of 'bad'? (it's irregular!)", answer: "the worst" }
    ]
  },
  'will-wont': {
    POP_QUESTIONS: [
      { prompt: "What is the short form of 'I will'?", answer: "I'll" },
      { prompt: "What is the short form of 'you will'?", answer: "you'll" },
      { prompt: "What is the short form of 'he will'?", answer: "he'll" },
      { prompt: "What is the short form of 'she will'?", answer: "she'll" },
      { prompt: "What is the short form of 'we will'?", answer: "we'll" },
      { prompt: "What is the short form of 'they will'?", answer: "they'll" },
      { prompt: "What is the short form of 'it will'?", answer: "it'll" },
      { prompt: "What is the short form of 'will not'?", answer: "won't" },
      { prompt: "What is the short form of 'that will'?", answer: "that'll" },
      { prompt: "'I'll' is the short form of which two words?", answer: "I will" }
    ]
  },
  'present-perfect': {
    POP_QUESTIONS: [
      { prompt: "What is the past participle of 'go'?", answer: "gone (or been)" },
      { prompt: "What is the past participle of 'eat'?", answer: "eaten" },
      { prompt: "What is the past participle of 'see'?", answer: "seen" },
      { prompt: "What is the past participle of 'do'?", answer: "done" },
      { prompt: "What is the past participle of 'win'?", answer: "won" },
      { prompt: "What is the past participle of 'write'?", answer: "written" },
      { prompt: "What is the past participle of 'take'?", answer: "taken" },
      { prompt: "What is the past participle of 'break'?", answer: "broken" },
      { prompt: "What is the past participle of 'buy'?", answer: "bought" },
      { prompt: "What is the past participle of 'be'?", answer: "been" }
    ]
  },
  'amusement-park': {
    POP_QUESTIONS: [
      { prompt: "What is the past simple of 'watch'?", answer: "watched" },
      { prompt: "What is the past simple of 'visit'?", answer: "visited" },
      { prompt: "What is the past simple of 'enter'?", answer: "entered" },
      { prompt: "What is the past simple of 'see'? (it's irregular!)", answer: "saw" },
      { prompt: "What is the past simple of 'go'? (it's irregular!)", answer: "went" },
      { prompt: "What is the past simple of 'ride'? (it's irregular!)", answer: "rode" },
      { prompt: "What is the past simple of 'eat'? (it's irregular!)", answer: "ate" },
      { prompt: "What is the past simple of 'buy'? (it's irregular!)", answer: "bought" },
      { prompt: "What is the past simple of 'win'? (it's irregular!)", answer: "won" },
      { prompt: "What is the past simple of 'take'? (it's irregular!)", answer: "took" }
    ]
  }
};

export const POP_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  POP_QUESTIONS.length = 0;
  POP_QUESTIONS.push(...data.POP_QUESTIONS);
}
applyLesson('comparatives');
