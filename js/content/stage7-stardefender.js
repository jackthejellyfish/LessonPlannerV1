/* =========================================================
   LESSON CONTENT — Stage 7 (Star Defender)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    INV_QUESTIONS: [
      { prompt: "What is the comparative of 'fast'?", answer: "faster" },
      { prompt: "What is the comparative of 'strong'?", answer: "stronger" },
      { prompt: "What is the comparative of 'big'?", answer: "bigger" },
      { prompt: "What is the comparative of 'brave'?", answer: "braver" },
      { prompt: "What is the comparative of 'scary'?", answer: "scarier" },
      { prompt: "What is the comparative of 'loud'?", answer: "louder" },
      { prompt: "What is the comparative of 'hot'?", answer: "hotter" },
      { prompt: "What is the comparative of 'clever'?", answer: "cleverer" },
      { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
      { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" }
    ]
  },
  health: {
    INV_QUESTIONS: [
      { prompt: "He's got a headache. What should he do?", answer: "He should take some medicine." },
      { prompt: "She's got a fever. What should she do?", answer: "She should stay in bed." },
      { prompt: "He's got a runny nose. What should he do?", answer: "He should blow his nose." },
      { prompt: "She's got a toothache. What should she do?", answer: "She should see a dentist." },
      { prompt: "He's got a stomach ache. What should he do?", answer: "He should see a doctor." },
      { prompt: "She's got a sore throat. What should she do?", answer: "She should drink some hot tea." },
      { prompt: "He's got a cough. What should he do?", answer: "He should drink some water." },
      { prompt: "She's got a cold. What should she do?", answer: "She should stay in bed." },
      { prompt: "He's got a backache. What should he do?", answer: "He should rest." },
      { prompt: "She's got an earache. What should she do?", answer: "She should see a doctor." }
    ]
  }
};

export const INV_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  INV_QUESTIONS.length = 0;
  INV_QUESTIONS.push(...data.INV_QUESTIONS);
}
applyLesson('comparatives');
