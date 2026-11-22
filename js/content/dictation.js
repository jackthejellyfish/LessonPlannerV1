/* =========================================================
   LESSON CONTENT — Stage 6 (Running dictation)
   Six sentences per lesson, using the lesson's language. They are
   printed large to cut out and stick round the room, and revealed one
   at a time on the board so pairs can check what they wrote.
   Keep each one to a line or so: a runner has to remember it.
========================================================= */
const LESSON_CONTENT = {
  comparatives: [
    'My brother is taller than my sister.',
    'A cheetah is faster than a horse.',
    'This book is more interesting than that film.',
    'The blue bag is heavier than the red bag.',
    'Summer is hotter than spring in my town.',
    'My dog is bigger than my cat, but it is friendlier.'
  ],
  health: [
    'Tom has got a headache, so he should take some medicine.',
    'You have got a cold. You shouldn’t go swimming.',
    'She has got a toothache. She should see a dentist.',
    'I have got a sore throat, so I should drink some hot tea.',
    'He has got a stomach ache. He shouldn’t eat too much.',
    'We are very tired. We should go to bed early.'
  ],
  'comparatives-superlatives': [
    'The elephant is the biggest animal in the zoo.',
    'My sister is taller than me.',
    'This is the best day of my life!',
    'A plane is faster than a train.',
    'Mount Everest is the highest mountain in the world.',
    'My maths homework is easier than my English homework.'
  ],
  'will-wont': [
    'I will visit my grandma next weekend.',
    'It won’t rain tomorrow, so we will go to the beach.',
    'My friends will play football after school.',
    'She won’t eat the pizza because she doesn’t like cheese.',
    'We will have a party on Saturday.',
    'In the future, robots will clean our houses.'
  ],
  'present-perfect': [
    'I have been to London three times.',
    'She has never eaten sushi.',
    'We have just finished our homework.',
    'Have you ever seen a dolphin?',
    'My dad has lost his keys again.',
    'They have already watched that film.'
  ],
  'amusement-park': [
    'We went to the amusement park on Saturday.',
    'The roller coaster was very exciting.',
    'I was scared on the ghost train.',
    'My brother ate a big ice cream.',
    'The long queue was really boring.',
    'We were tired but happy at the end of the day.'
  ],
  'party-fun': [
    'Who will bring the cake to the party?',
    'Anna will blow up the balloons.',
    'Will Tom play the music? Yes, he will.',
    'We will make a big poster for the wall.',
    'Will you serve the pizza? No, I won’t.',
    'What will you wear to the party?'
  ],
  'at-school': [
    'I have got a red pencil case and two rulers.',
    'She has got a new school bag.',
    'He wants a blue notebook for his birthday.',
    'Have you got a glue stick? Yes, I have.',
    'We want more time to play outside.',
    'My teacher has got a big green book.'
  ],
  'months-weather': [
    'My birthday is in July.',
    'It’s cold and snowy in winter.',
    'Our school trip is on the fifth of May.',
    'It’s hot and sunny in summer.',
    'The leaves fall from the trees in autumn.',
    'It’s windy and rainy today.'
  ]
};

export const DICTATION_SENTENCES = [];

export function applyLesson(id){
  DICTATION_SENTENCES.length = 0;
  DICTATION_SENTENCES.push(...(LESSON_CONTENT[id] || LESSON_CONTENT.comparatives));
}
applyLesson('comparatives');
