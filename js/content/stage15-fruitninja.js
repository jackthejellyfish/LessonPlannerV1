/* =========================================================
   LESSON CONTENT — Stage 15 (Fruit Ninja)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    FRUIT_QUESTIONS: [
      { prompt: "What is the comparative of 'happy'?", answer: "happier" },
      { prompt: "What is the comparative of 'wide'?", answer: "wider" },
      { prompt: "What is the comparative of 'expensive'?", answer: "more expensive" },
      { prompt: "What is the comparative of 'hot'?", answer: "hotter" },
      { prompt: "What is the comparative of 'young'?", answer: "younger" },
      { prompt: "What is the comparative of 'careful'?", answer: "more careful" },
      { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
      { prompt: "What is the comparative of 'thin'?", answer: "thinner" },
      { prompt: "What is the comparative of 'interesting'?", answer: "more interesting" },
      { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" }
    ]
  },
  health: {
    FRUIT_QUESTIONS: [
      { prompt: "I've got a headache.", answer: "I should take some medicine." },
      { prompt: "He's got a fever.", answer: "He should stay in bed." },
      { prompt: "She's got a runny nose.", answer: "She should blow her nose." },
      { prompt: "I've got a toothache.", answer: "I should see a dentist." },
      { prompt: "We've got a stomach ache.", answer: "We should see a doctor." },
      { prompt: "They've got a sore throat.", answer: "They should drink some hot tea." },
      { prompt: "He's got sunburn.", answer: "He should put on some cream." },
      { prompt: "I've got hiccups.", answer: "I should drink some water." },
      { prompt: "She's got a cough.", answer: "She should drink some water." },
      { prompt: "You're tired.", answer: "You should get some sleep." }
    ]
  }
};

export const FRUIT_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  FRUIT_QUESTIONS.length = 0;
  FRUIT_QUESTIONS.push(...data.FRUIT_QUESTIONS);
}
applyLesson('comparatives');
