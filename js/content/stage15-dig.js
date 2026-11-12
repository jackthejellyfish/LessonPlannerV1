/* =========================================================
   LESSON CONTENT — Stage 15 (Treasure Dig)

   This game's angle is PERSONAL PRODUCTION: say a true sentence about
   your own life using the target language. There is no single right
   answer, so every `answer` here is an EXAMPLE the teacher reveals as
   a model, not a key to mark against — which pairs well with a game
   that is pure luck, since neither half of the turn is about being
   right faster than anyone else.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    DIG_QUESTIONS: [
      { prompt: "Compare yourself and a friend. Use 'taller'.", answer: "e.g. I am taller than my friend." },
      { prompt: "Compare two animals. Use 'faster'.", answer: "e.g. A cheetah is faster than a dog." },
      { prompt: "Compare two school subjects. Use 'easier'.", answer: "e.g. English is easier than maths." },
      { prompt: "Compare two foods you know. Use 'nicer'.", answer: "e.g. Pho is nicer than plain rice." },
      { prompt: "Compare two cities. Use 'bigger'.", answer: "e.g. Hanoi is bigger than Da Nang." },
      { prompt: "Compare summer and winter. Use 'hotter'.", answer: "e.g. Summer is hotter than winter." },
      { prompt: "Compare two films. Use 'better'.", answer: "e.g. This film is better than that one." },
      { prompt: "Compare your bag and a friend's. Use 'heavier'.", answer: "e.g. My bag is heavier than yours." },
      { prompt: "Compare this year and last year. Use 'busier'.", answer: "e.g. I am busier than last year." },
      { prompt: "Compare two sports. Use 'more exciting'.", answer: "e.g. Football is more exciting than golf." }
    ]
  },
  health: {
    DIG_QUESTIONS: [
      { prompt: "Your friend has a headache. Give advice.", answer: "e.g. You should take some medicine." },
      { prompt: "Your friend has a fever. Give advice.", answer: "e.g. You should stay in bed." },
      { prompt: "Your friend has a toothache. Give advice.", answer: "e.g. You should see a dentist." },
      { prompt: "Your friend is very tired. Give advice.", answer: "e.g. You should get some sleep." },
      { prompt: "Your friend has a sore throat. Give advice.", answer: "e.g. You should drink some hot tea." },
      { prompt: "Say one thing you shouldn't do when you are ill.", answer: "e.g. You shouldn't go to school." },
      { prompt: "Your friend has a stomach ache. Give advice.", answer: "e.g. You should see a doctor." },
      { prompt: "Say one thing you should do to stay healthy.", answer: "e.g. I should eat more fruit." },
      { prompt: "Your friend has a cough. Give advice.", answer: "e.g. You should drink some water." },
      { prompt: "Say one thing you shouldn't eat every day.", answer: "e.g. I shouldn't eat sweets every day." }
    ]
  },
  'comparatives-superlatives': {
    DIG_QUESTIONS: [
      { prompt: "Who is the tallest in your family? Say a sentence.", answer: "e.g. My father is the tallest in my family." },
      { prompt: "What is the best film you know? Say a sentence.", answer: "e.g. Spider-Man is the best film I know." },
      { prompt: "Compare three animals. Which is the biggest?", answer: "e.g. The elephant is the biggest of the three." },
      { prompt: "What is the most beautiful place in your country?", answer: "e.g. Ha Long Bay is the most beautiful place." },
      { prompt: "Which subject is the easiest for you?", answer: "e.g. English is the easiest subject for me." },
      { prompt: "Compare two friends. Who is funnier?", answer: "e.g. Nam is funnier than Lan." },
      { prompt: "What is the worst weather? Say a sentence.", answer: "e.g. A storm is the worst weather." },
      { prompt: "What is the most expensive thing you own?", answer: "e.g. My phone is the most expensive thing I own." },
      { prompt: "Compare your school now and your old school.", answer: "e.g. My school now is bigger than my old school." },
      { prompt: "Who is the busiest person you know?", answer: "e.g. My mother is the busiest person I know." }
    ]
  },
  'will-wont': {
    DIG_QUESTIONS: [
      { prompt: "Say what you will do tonight.", answer: "e.g. I will watch TV tonight." },
      { prompt: "Say what you won't do tomorrow.", answer: "e.g. I won't get up early tomorrow." },
      { prompt: "Make a prediction about the weather.", answer: "e.g. It will be sunny tomorrow." },
      { prompt: "Say what you will be when you grow up.", answer: "e.g. I will be a doctor." },
      { prompt: "Make a promise to your teacher.", answer: "e.g. I will always do my homework." },
      { prompt: "Say where you will go on your next holiday.", answer: "e.g. I will go to Hue." },
      { prompt: "Make a prediction about school in 2050.", answer: "e.g. Robots will teach the lessons." },
      { prompt: "Say one food you won't eat.", answer: "e.g. I won't eat insects." },
      { prompt: "Say what your family will do at the weekend.", answer: "e.g. We will visit my grandmother." },
      { prompt: "Make a prediction about a football match.", answer: "e.g. Vietnam will win the match." }
    ]
  },
  'present-perfect': {
    DIG_QUESTIONS: [
      { prompt: "Say a country you have visited.", answer: "e.g. I have visited Thailand." },
      { prompt: "Say something you have never done.", answer: "e.g. I have never flown in a plane." },
      { prompt: "Say something you have done today.", answer: "e.g. I have eaten breakfast." },
      { prompt: "Say a film you have seen.", answer: "e.g. I have seen Frozen twice." },
      { prompt: "Say a food you have never eaten.", answer: "e.g. I have never eaten cheese." },
      { prompt: "Say something a friend of yours has done.", answer: "e.g. My friend has won a prize." },
      { prompt: "Say something you have learned this year.", answer: "e.g. I have learned the present perfect." },
      { prompt: "Say a book you have read.", answer: "e.g. I have read Harry Potter." },
      { prompt: "Say something you haven't finished yet.", answer: "e.g. I haven't finished my project yet." },
      { prompt: "Say a sport you have played.", answer: "e.g. I have played badminton." }
    ]
  }
};

export const DIG_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  DIG_QUESTIONS.length = 0;
  DIG_QUESTIONS.push(...data.DIG_QUESTIONS);
}
applyLesson('comparatives');
