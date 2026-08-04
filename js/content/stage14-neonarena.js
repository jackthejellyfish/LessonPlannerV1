/* =========================================================
   LESSON CONTENT — Stage 14 (Neon Arena)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    NEON_QUESTIONS: [
      { prompt: "What is the comparative of 'quick'?", answer: "quicker" },
      { prompt: "What is the comparative of 'bright'?", answer: "brighter" },
      { prompt: "What is the comparative of 'dangerous'?", answer: "more dangerous" },
      { prompt: "What is the comparative of 'tough'?", answer: "tougher" },
      { prompt: "What is the comparative of 'small'?", answer: "smaller" },
      { prompt: "What is the comparative of 'noisy'?", answer: "noisier" },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "further / farther" },
      { prompt: "What is the comparative of 'powerful'?", answer: "more powerful" },
      { prompt: "What is the comparative of 'sharp'?", answer: "sharper" },
      { prompt: "What is the comparative of 'many'? (it's irregular!)", answer: "more" }
    ]
  },
  health: {
    NEON_QUESTIONS: [
      { prompt: "They've got a headache.", answer: "They should take some medicine." },
      { prompt: "They've got a fever.", answer: "They should stay in bed." },
      { prompt: "They've got a toothache.", answer: "They should see a dentist." },
      { prompt: "They've got a runny nose.", answer: "They should blow their noses." },
      { prompt: "They've got a sore throat.", answer: "They should drink some hot tea." },
      { prompt: "They've got a stomach ache.", answer: "They should see a doctor." },
      { prompt: "They've got a cough.", answer: "They should drink some water." },
      { prompt: "They've got a cold.", answer: "They should stay in bed." },
      { prompt: "They've got a backache.", answer: "They should rest." },
      { prompt: "They've got an earache.", answer: "They should see a doctor." }
    ]
  }
};

export const NEON_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  NEON_QUESTIONS.length = 0;
  NEON_QUESTIONS.push(...data.NEON_QUESTIONS);
}
applyLesson('comparatives');
