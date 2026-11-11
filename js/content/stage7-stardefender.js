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
  },
  'comparatives-superlatives': {
    INV_QUESTIONS: [
      { prompt: "What is the comparative of 'strong'?", answer: "stronger" },
      { prompt: "What is the comparative of 'heavy'?", answer: "heavier" },
      { prompt: "What is the comparative of 'wide'?", answer: "wider" },
      { prompt: "What is the comparative of 'sad'?", answer: "sadder" },
      { prompt: "What is the comparative of 'bright'?", answer: "brighter" },
      { prompt: "What is the comparative of 'funny'?", answer: "funnier" },
      { prompt: "What is the comparative of 'simple'?", answer: "simpler" },
      { prompt: "What is the comparative of 'dangerous'?", answer: "more dangerous" },
      { prompt: "What is the comparative of 'careful'?", answer: "more careful" },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther" }
    ]
  },
  'will-wont': {
    INV_QUESTIONS: [
      { prompt: "Make it future: 'I play football.'", answer: "I will play football." },
      { prompt: "Make it future: 'She helps me.'", answer: "She will help me." },
      { prompt: "Make it future: 'They arrive at six.'", answer: "They will arrive at six." },
      { prompt: "Make it future: 'He is twelve.'", answer: "He will be twelve." },
      { prompt: "Make it future: 'We go to the beach.'", answer: "We will go to the beach." },
      { prompt: "Make it future: 'It rains a lot.'", answer: "It will rain a lot." },
      { prompt: "Make it future: 'You like this film.'", answer: "You will like this film." },
      { prompt: "Make it future: 'The bus is late.'", answer: "The bus will be late." },
      { prompt: "Make it future: 'I see you on Monday.'", answer: "I will see you on Monday." },
      { prompt: "Make it future: 'My sister cooks dinner.'", answer: "My sister will cook dinner." }
    ]
  },
  'present-perfect': {
    INV_QUESTIONS: [
      { prompt: "Complete: 'I ___ (visit) Japan twice.'", answer: "have visited" },
      { prompt: "Complete: 'She ___ (finish) her work.'", answer: "has finished" },
      { prompt: "Complete: 'They ___ (see) that film.'", answer: "have seen" },
      { prompt: "Complete: 'He ___ (lose) his keys.'", answer: "has lost" },
      { prompt: "Complete: 'We ___ (eat) all the cake.'", answer: "have eaten" },
      { prompt: "Complete: 'It ___ (stop) raining.'", answer: "has stopped" },
      { prompt: "Complete: 'You ___ (do) a great job.'", answer: "have done" },
      { prompt: "Complete: 'My team ___ (win) the cup.'", answer: "has won" },
      { prompt: "Complete: 'I ___ (read) that book.'", answer: "have read" },
      { prompt: "Complete: 'She ___ (take) my pen.'", answer: "has taken" }
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
