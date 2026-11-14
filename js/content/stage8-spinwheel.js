/* =========================================================
   LESSON CONTENT — Stage 8 (Spin the Wheel)
   10 segments, each a fixed position on the wheel with its own
   question and point value. Point values are deliberately scattered
   (not sorted by difficulty, not monotonically increasing around the
   wheel) for a genuine "wheel of fortune" feel — big jackpots (100, 200)
   and a token, mostly-for-laughs "1" mixed in among modest everyday
   values, per feedback asking for much more variance than the original
   10-30 range. Landing on a big segment is luck, not a harder question.
   Points are pure game mechanic (not lesson content) — kept identical
   across lessons so the wheel's feel doesn't change with the topic.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    WHEEL_QUESTIONS: [
      { prompt: "What is the comparative of 'quick'?", answer: "quicker", points: 10 },
      { prompt: "What is the comparative of 'wise'?", answer: "wiser", points: 100 },
      { prompt: "What is the comparative of 'dark'?", answer: "darker", points: 15 },
      { prompt: "What is the comparative of 'bright'?", answer: "brighter", points: 5 },
      { prompt: "What is the comparative of 'calm'?", answer: "calmer", points: 200 },
      { prompt: "What is the comparative of 'crowded'?", answer: "more crowded", points: 20 },
      { prompt: "What is the comparative of 'beautiful'?", answer: "more beautiful", points: 1 },
      { prompt: "What is the comparative of 'curious'?", answer: "more curious", points: 50 },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther", points: 25 },
      { prompt: "What is the comparative of 'little'? (it's irregular!)", answer: "less", points: 30 }
    ]
  },
  health: {
    WHEEL_QUESTIONS: [
      { prompt: "They've got a headache. What should they do?", answer: "They should take some medicine.", points: 10 },
      { prompt: "You've got a fever. What should you do?", answer: "You should stay in bed.", points: 100 },
      { prompt: "We've got sore throats. What should we do?", answer: "We should drink some hot tea.", points: 15 },
      { prompt: "He's eaten five burgers. What shouldn't he do?", answer: "He shouldn't eat too much.", points: 5 },
      { prompt: "I've got a toothache. What should I do?", answer: "I should see a dentist.", points: 200 },
      { prompt: "She's got a runny nose. What should she do?", answer: "She should blow her nose.", points: 20 },
      { prompt: "You feel tired. What should you do?", answer: "You should get some sleep.", points: 1 },
      { prompt: "They've got a cough. What should they do?", answer: "They should drink some water.", points: 50 },
      { prompt: "He's got a backache. What shouldn't he do?", answer: "He shouldn't carry heavy bags.", points: 25 },
      { prompt: "I've got a stomach ache. What should I do?", answer: "I should see a doctor.", points: 30 }
    ]
  },
  'comparatives-superlatives': {
    WHEEL_QUESTIONS: [
      { prompt: "Compare: an elephant and a mouse. (big)", answer: "An elephant is bigger than a mouse.", points: 10 },
      { prompt: "Which is the best day of the week, and why?", answer: "e.g. Saturday is the best day because...", points: 100 },
      { prompt: "Compare: a car and a bicycle. (fast)", answer: "A car is faster than a bicycle.", points: 15 },
      { prompt: "Compare: winter and summer. (cold)", answer: "Winter is colder than summer.", points: 5 },
      { prompt: "What is the most beautiful place you know?", answer: "e.g. The most beautiful place is...", points: 200 },
      { prompt: "Compare: maths and English. (easy)", answer: "e.g. English is easier than maths.", points: 20 },
      { prompt: "Compare: your bag and your friend's bag. (heavy)", answer: "e.g. My bag is heavier than my friend's.", points: 1 },
      { prompt: "Who is the tallest person in your family?", answer: "e.g. My father is the tallest.", points: 50 },
      { prompt: "Compare: a phone and a laptop. (expensive)", answer: "A laptop is more expensive than a phone.", points: 25 },
      { prompt: "What is the worst film you have ever seen?", answer: "e.g. The worst film I've seen is...", points: 30 }
    ]
  },
  'will-wont': {
    WHEEL_QUESTIONS: [
      { prompt: "What will you do after school today?", answer: "e.g. I will go home and do my homework.", points: 10 },
      { prompt: "What will the weather be like tomorrow?", answer: "e.g. It will be sunny tomorrow.", points: 100 },
      { prompt: "Make it negative: 'He will come to the party.'", answer: "He won't come to the party.", points: 15 },
      { prompt: "What won't you do this weekend?", answer: "e.g. I won't get up early.", points: 5 },
      { prompt: "Where will you be in ten years?", answer: "e.g. I will be at university.", points: 200 },
      { prompt: "Make a question: 'you / help / me'", answer: "Will you help me?", points: 20 },
      { prompt: "What will people use instead of cars in 2100?", answer: "e.g. People will use flying cars.", points: 1 },
      { prompt: "Make it negative: 'They will win the match.'", answer: "They won't win the match.", points: 50 },
      { prompt: "Make a promise using 'won't'.", answer: "e.g. I won't tell anyone.", points: 25 },
      { prompt: "What will you eat for dinner tonight?", answer: "e.g. I will eat rice and chicken.", points: 30 }
    ]
  },
  'present-perfect': {
    WHEEL_QUESTIONS: [
      { prompt: "Have you ever been to another country? Which one?", answer: "e.g. Yes, I have been to Thailand.", points: 10 },
      { prompt: "Name three things you have done today.", answer: "e.g. I have eaten breakfast, I have...", points: 100 },
      { prompt: "Make it negative: 'She has finished her work.'", answer: "She hasn't finished her work.", points: 15 },
      { prompt: "Have you ever eaten something very strange?", answer: "e.g. Yes, I have eaten...", points: 5 },
      { prompt: "What is the best film you have ever seen?", answer: "e.g. The best film I have seen is...", points: 200 },
      { prompt: "Make a question: 'you / ever / ride / a horse'", answer: "Have you ever ridden a horse?", points: 20 },
      { prompt: "Name something you have never done.", answer: "e.g. I have never flown in a helicopter.", points: 1 },
      { prompt: "Make it negative: 'They have eaten lunch.'", answer: "They haven't eaten lunch.", points: 50 },
      { prompt: "Has anyone in your family won a prize?", answer: "e.g. Yes, my sister has won a medal.", points: 25 },
      { prompt: "What have you learned in English this year?", answer: "e.g. I have learned the present perfect.", points: 30 }
    ]
  },
  'amusement-park': {
    WHEEL_QUESTIONS: [
      { prompt: "Imagine you went to an amusement park. What did you do?", answer: "e.g. I went on a roller coaster.", points: 10 },
      { prompt: "Name three things you did at the amusement park.", answer: "e.g. I saw a parade, I rode the merry-go-round and I ate candy floss.", points: 100 },
      { prompt: "How was the roller coaster? How did you feel?", answer: "e.g. It was exciting. I was excited!", points: 15 },
      { prompt: "Which attraction is the scariest? Why?", answer: "e.g. The haunted house. It was scary — I was scared!", points: 5 },
      { prompt: "What was the most boring thing you did last weekend?", answer: "e.g. I watched TV. It was boring. I was bored.", points: 200 },
      { prompt: "Make a question: 'you / do / at the park'", answer: "What did you do at the park?", points: 20 },
      { prompt: "Tell us about an amazing film you watched.", answer: "e.g. I watched ___. It was amazing!", points: 1 },
      { prompt: "Make it past: 'We see a parade.'", answer: "We saw a parade.", points: 50 },
      { prompt: "What did you eat or buy the last time you went out?", answer: "e.g. I ate an ice cream and bought a T-shirt.", points: 25 },
      { prompt: "What is the most popular attraction in your class? Ask!", answer: "e.g. The roller coaster — six people went on it.", points: 30 }
    ]
  }
};

export const WHEEL_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  WHEEL_QUESTIONS.length = 0;
  WHEEL_QUESTIONS.push(...data.WHEEL_QUESTIONS);
}
applyLesson('comparatives');

// One distinct color per segment, fixed position on the wheel — pure
// decoration, not lesson content, so it doesn't vary by lesson.
export const WHEEL_COLORS = [
  "#FF6B6B", "#4C5FD5", "#3DB88D", "#F2B705", "#B266FF",
  "#FF8C42", "#31E6E0", "#FF6B8B", "#8577A8", "#5C9C7C"
];
