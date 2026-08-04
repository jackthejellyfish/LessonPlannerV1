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
