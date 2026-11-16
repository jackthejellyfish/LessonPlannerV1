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
  },
  'amusement-park': {
    INV_QUESTIONS: [
      { prompt: "Complete: 'Yesterday I ___ (go) on a roller coaster.'", answer: "went" },
      { prompt: "Complete: 'She ___ (watch) a 3D film.'", answer: "watched" },
      { prompt: "Complete: 'We ___ (see) a parade.'", answer: "saw" },
      { prompt: "Complete: 'They ___ (enter) a haunted house.'", answer: "entered" },
      { prompt: "Complete: 'He ___ (ride) the merry-go-round.'", answer: "rode" },
      { prompt: "Complete: 'My class ___ (visit) a petting zoo.'", answer: "visited" },
      { prompt: "Complete: 'I ___ (eat) candy floss.'", answer: "ate" },
      { prompt: "Complete: 'You ___ (win) a big teddy bear!'", answer: "won" },
      { prompt: "Complete: 'My dad ___ (buy) a souvenir.'", answer: "bought" },
      { prompt: "Complete: 'We ___ (take) lots of photos.'", answer: "took" }
    ]
  },
  'party-fun': {
    INV_QUESTIONS: [
      { prompt: "Will or won't? 'My friends love me. They ___ always be on my side.'", answer: "will" },
      { prompt: "Will or won't? 'Sam hasn't got any money. He ___ buy the concert tickets.'", answer: "won't" },
      { prompt: "Will or won't? 'Julie is very tired today. She ___ take a nap at home.'", answer: "will" },
      { prompt: "Will or won't? 'Susan is very shy. She ___ dance in front of her classmates.'", answer: "won't" },
      { prompt: "Will or won't? 'I'm very full. I ___ have dessert.'", answer: "won't" },
      { prompt: "Will or won't? 'Kelly is my best friend. We ___ travel together this holiday.'", answer: "will" },
      { prompt: "Will or won't? 'Mia loves baking. She ___ bake biscuits for the party.'", answer: "will" },
      { prompt: "Will or won't? 'Ben can't draw. He ___ draw the posters.'", answer: "won't" },
      { prompt: "Will or won't? 'The pizza is here! Dad ___ serve it now.'", answer: "will" },
      { prompt: "Will or won't? 'Leo hates loud music. He ___ play the music.'", answer: "won't" }
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
