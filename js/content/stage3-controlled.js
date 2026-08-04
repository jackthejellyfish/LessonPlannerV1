/* =========================================================
   LESSON CONTENT — Stage 3 (Controlled Practice / multiple choice)
   `word` is interpolated into the lesson's question template (see
   js/lessons.js's mcQuestionTemplate) — the health set includes its
   own article ("a headache"/"an earache") since that varies per word.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    MC_QUESTIONS: [
      { word: "tall", correct: "taller", options: ["taller", "more tall", "tallier"] },
      { word: "big", correct: "bigger", options: ["biger", "bigger", "more big"] },
      { word: "nice", correct: "nicer", options: ["nicer", "niceer", "more nice"] },
      { word: "happy", correct: "happier", options: ["happyer", "happier", "more happy"] },
      { word: "hot", correct: "hotter", options: ["hoter", "hotter", "more hot"] },
      { word: "easy", correct: "easier", options: ["easyer", "easier", "more easy"] },
      { word: "safe", correct: "safer", options: ["safeer", "safer", "more safe"] },
      { word: "thin", correct: "thinner", options: ["thiner", "thinner", "more thin"] },
      { word: "good", correct: "better", options: ["gooder", "better", "more good"] },
      { word: "bad", correct: "worse", options: ["badder", "worse", "more bad"] }
    ]
  },
  health: {
    MC_QUESTIONS: [
      { word: "a headache", correct: "take some medicine", options: ["take some medicine", "go swimming", "eat more sugar"] },
      { word: "a fever", correct: "stay in bed", options: ["stay in bed", "go to school", "drink cold water"] },
      { word: "a runny nose", correct: "blow your nose", options: ["blow your nose", "hold your breath", "shout loudly"] },
      { word: "a toothache", correct: "see a dentist", options: ["see a dentist", "eat more sweets", "ignore it"] },
      { word: "a stomach ache", correct: "see a doctor", options: ["see a doctor", "eat a big pizza", "run a marathon"] },
      { word: "a sore throat", correct: "drink some hot tea", options: ["drink some hot tea", "eat spicy chips", "shout and sing"] },
      { word: "a cough", correct: "drink some water", options: ["drink some water", "eat ice cream", "go to the swimming pool"] },
      { word: "a cold", correct: "stay in bed", options: ["stay in bed", "go outside without a coat", "stay up late"] },
      { word: "a backache", correct: "rest", options: ["rest", "carry heavy bags", "do more exercise"] },
      { word: "an earache", correct: "see a doctor", options: ["see a doctor", "listen to loud music", "go swimming"] }
    ]
  }
};

export const MC_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  MC_QUESTIONS.length = 0;
  MC_QUESTIONS.push(...data.MC_QUESTIONS);
}
applyLesson('comparatives');
