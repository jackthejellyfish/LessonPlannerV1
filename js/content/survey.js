/* =========================================================
   LESSON CONTENT — Stage 7 (Class survey)
   Two questions per lesson that make students use the lesson's
   language, plus one filled-in EXAMPLE row. The example is shown on
   the board only; the printed survey has the questions and empty rows.
   Answers in the example are full sentences about the friend, the way
   students should write them ("Henry will draw a poster.").
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    questions: ['Who is older, you or your best friend?', 'Which is better, summer or winter? Why?'],
    example: { name: 'Mia', answers: ['Mia’s best friend is older than her.', 'Summer is better than winter because it’s hotter.'] }
  },
  health: {
    questions: ['What should you do when you’ve got a cold?', 'What shouldn’t you do when you’ve got a toothache?'],
    example: { name: 'Leo', answers: ['Leo should stay in bed and drink hot tea.', 'Leo shouldn’t eat sweets.'] }
  },
  'comparatives-superlatives': {
    questions: ['Who is the tallest person in your family?', 'What is the best food in the world?'],
    example: { name: 'Ana', answers: ['Ana’s dad is the tallest person in her family.', 'Pizza is the best food in the world.'] }
  },
  'will-wont': {
    questions: ['What will you do this weekend?', 'What won’t you do this weekend?'],
    example: { name: 'Sam', answers: ['Sam will play football with his cousins.', 'Sam won’t go to the shops.'] }
  },
  'present-perfect': {
    questions: ['Have you ever been to another country? Where?', 'What have you never eaten?'],
    example: { name: 'Zoe', answers: ['Zoe has been to Spain and France.', 'Zoe has never eaten snails.'] }
  },
  'amusement-park': {
    questions: ['What did you do at the amusement park?', 'How did you feel? (excited / scared / bored...)'],
    example: { name: 'Ben', answers: ['Ben rode the roller coaster and ate candy floss.', 'Ben was excited. The roller coaster was exciting!'] }
  },
  'party-fun': {
    questions: ['What will you do at the party?', 'What won’t you do at the party?'],
    example: { name: 'Henry', answers: ['Henry will draw a poster and do a TikTok dance.', 'Henry won’t serve the pizza.'] }
  },
  'at-school': {
    questions: ['What have you got in your school bag?', 'What do you want for your birthday?'],
    example: { name: 'Lily', answers: ['Lily has got a pencil case and two books.', 'Lily wants a new bike.'] }
  },
  'months-weather': {
    questions: ['When is your birthday?', 'What’s the weather like in your favourite season?'],
    example: { name: 'Max', answers: ['Max’s birthday is on the third of May.', 'In summer it’s hot and sunny.'] }
  },
  'food-drink': {
    questions: ['What would you like to eat for lunch today?', 'Is there any fruit in your bag?'],
    example: { name: 'Lily', answers: ['Lily would like some pasta and a salad.', 'Yes, there is. There’s an apple.'] }
  }
};

export const SURVEY = { questions: [], example: { name: '', answers: [] } };

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  SURVEY.questions = data.questions.slice();
  SURVEY.example = { name: data.example.name, answers: data.example.answers.slice() };
}
applyLesson('comparatives');
