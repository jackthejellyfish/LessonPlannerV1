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
  }
};

export const POP_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  POP_QUESTIONS.length = 0;
  POP_QUESTIONS.push(...data.POP_QUESTIONS);
}
applyLesson('comparatives');
