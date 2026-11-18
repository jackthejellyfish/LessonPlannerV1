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
  },
  'comparatives-superlatives': {
    FRUIT_QUESTIONS: [
      { prompt: "'good' \u2014 give BOTH forms.", answer: "better / the best" },
      { prompt: "'bad' \u2014 give BOTH forms.", answer: "worse / the worst" },
      { prompt: "'far' \u2014 give BOTH forms.", answer: "farther / the farthest" },
      { prompt: "'little' \u2014 give BOTH forms.", answer: "less / the least" },
      { prompt: "'many' \u2014 give BOTH forms.", answer: "more / the most" },
      { prompt: "'beautiful' \u2014 give BOTH forms.", answer: "more beautiful / the most beautiful" },
      { prompt: "'famous' \u2014 give BOTH forms.", answer: "more famous / the most famous" },
      { prompt: "'crowded' \u2014 give BOTH forms.", answer: "more crowded / the most crowded" },
      { prompt: "'thin' \u2014 give BOTH forms.", answer: "thinner / the thinnest" },
      { prompt: "'pretty' \u2014 give BOTH forms.", answer: "prettier / the prettiest" }
    ]
  },
  'will-wont': {
    FRUIT_QUESTIONS: [
      { prompt: "Is this correct? 'I will to go home.'", answer: "No \u2014 'I will go home.' (no 'to')" },
      { prompt: "Is this correct? 'She wills come later.'", answer: "No \u2014 'She will come later.' (no -s)" },
      { prompt: "Is this correct? 'They don't will help.'", answer: "No \u2014 'They won't help.'" },
      { prompt: "Is this correct? 'Will you to help me?'", answer: "No \u2014 'Will you help me?'" },
      { prompt: "Is this correct? 'He will be late.'", answer: "Yes \u2014 that's correct!" },
      { prompt: "Is this correct? 'I amn't will go.'", answer: "No \u2014 'I won't go.'" },
      { prompt: "Is this correct? 'It will rains tomorrow.'", answer: "No \u2014 'It will rain tomorrow.'" },
      { prompt: "Is this correct? 'We won't forget.'", answer: "Yes \u2014 that's correct!" },
      { prompt: "Is this correct? 'Do you will come?'", answer: "No \u2014 'Will you come?'" },
      { prompt: "Is this correct? 'She'll be here soon.'", answer: "Yes \u2014 that's correct!" }
    ]
  },
  'present-perfect': {
    FRUIT_QUESTIONS: [
      { prompt: "Is this correct? 'I have went to Japan.'", answer: "No \u2014 'I have gone to Japan.'" },
      { prompt: "Is this correct? 'She have finished.'", answer: "No \u2014 'She has finished.'" },
      { prompt: "Is this correct? 'They has eaten.'", answer: "No \u2014 'They have eaten.'" },
      { prompt: "Is this correct? 'He has broke his arm.'", answer: "No \u2014 'He has broken his arm.'" },
      { prompt: "Is this correct? 'We have seen that film.'", answer: "Yes \u2014 that's correct!" },
      { prompt: "Is this correct? 'I haven't did my homework.'", answer: "No \u2014 'I haven't done my homework.'" },
      { prompt: "Is this correct? 'Have you ever ride a horse?'", answer: "No \u2014 'Have you ever ridden a horse?'" },
      { prompt: "Is this correct? 'She hasn't been to Paris.'", answer: "Yes \u2014 that's correct!" },
      { prompt: "Is this correct? 'It has stopped raining.'", answer: "Yes \u2014 that's correct!" },
      { prompt: "Is this correct? 'I have buyed a new bike.'", answer: "No \u2014 'I have bought a new bike.'" }
    ]
  },
  'amusement-park': {
    FRUIT_QUESTIONS: [
      { prompt: "Is this correct? 'I goed on a roller coaster.'", answer: "No — 'I went on a roller coaster.'" },
      { prompt: "Is this correct? 'She watched a 3D film.'", answer: "Yes — that's correct!" },
      { prompt: "Is this correct? 'We seed a parade.'", answer: "No — 'We saw a parade.'" },
      { prompt: "Is this correct? 'The roller coaster was excited.'", answer: "No — 'The roller coaster was exciting.'" },
      { prompt: "Is this correct? 'I was boring at the parade.'", answer: "No — 'I was bored at the parade.'" },
      { prompt: "Is this correct? 'He rided the merry-go-round.'", answer: "No — 'He rode the merry-go-round.'" },
      { prompt: "Is this correct? 'The haunted house was scary.'", answer: "Yes — that's correct!" },
      { prompt: "Is this correct? 'They visitted a petting zoo.'", answer: "No — 'They visited a petting zoo.'" },
      { prompt: "Is this correct? 'We were amazed by the film.'", answer: "Yes — that's correct!" },
      { prompt: "Is this correct? 'I was scaring in the haunted house.'", answer: "No — 'I was scared in the haunted house.'" }
    ]
  },
  'party-fun': {
    FRUIT_QUESTIONS: [
      { prompt: "Is this correct? 'I will bakes biscuits.'", answer: "No — 'I will bake biscuits.'" },
      { prompt: "Is this correct? 'Who will set the table?'", answer: "Yes — that's correct!" },
      { prompt: "Is this correct? 'She will to buy balloons.'", answer: "No — 'She will buy balloons.'" },
      { prompt: "Is this correct? 'Will you bring games? — Yes, I won't.'", answer: "No — 'Yes, I will.'" },
      { prompt: "Is this correct? 'He'll draw posters.'", answer: "Yes — that's correct!" },
      { prompt: "Is this correct? 'They willn't order pizza.'", answer: "No — 'They won't order pizza.'" },
      { prompt: "Is this correct? 'Will he choose music? — No, he won't.'", answer: "Yes — that's correct!" },
      { prompt: "Is this correct? 'What you will do for the party?'", answer: "No — 'What will you do for the party?'" },
      { prompt: "Is this correct? 'Dave will playing the music.'", answer: "No — 'Dave will play the music.'" },
      { prompt: "Is this correct? 'Will you blow up the balloons? — Yes, I'll.'", answer: "No — 'Yes, I will.' (never I'll at the end)" }
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
