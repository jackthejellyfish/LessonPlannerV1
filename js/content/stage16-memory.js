/* =========================================================
   LESSON CONTENT — Stage 16 (Memory Match)

   This game's angle is GAP FILL with no options offered — the learner
   has to produce the word from nothing, which is a step harder than
   Whack-a-Monster's two-way pick and a step easier than Treasure Dig's
   free production. Short answers, because the game that follows is a
   quiet, concentration-based one and a long spoken answer would break
   the pace it needs.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    MEMORY_QUESTIONS: [
      { prompt: "Fill the gap: 'A lion is ___ than a cat.' (strong)", answer: "stronger" },
      { prompt: "Fill the gap: 'This box is ___ than that one.' (heavy)", answer: "heavier" },
      { prompt: "Fill the gap: 'My room is ___ than yours.' (tidy)", answer: "tidier" },
      { prompt: "Fill the gap: 'Winter is ___ than autumn.' (cold)", answer: "colder" },
      { prompt: "Fill the gap: 'This game is ___ than that one.' (fun)", answer: "more fun" },
      { prompt: "Fill the gap: 'A diamond is ___ than a stone.' (shiny)", answer: "shinier" },
      { prompt: "Fill the gap: 'He is ___ than his brother.' (young)", answer: "younger" },
      { prompt: "Fill the gap: 'The test was ___ than I thought.' (bad)", answer: "worse" },
      { prompt: "Fill the gap: 'This chair is ___ than that one.' (comfortable)", answer: "more comfortable" },
      { prompt: "Fill the gap: 'The box is ___ than it looks.' (light)", answer: "lighter" }
    ]
  },
  health: {
    MEMORY_QUESTIONS: [
      { prompt: "Fill the gap: 'I've got a cold. I ___ stay at home.'", answer: "should" },
      { prompt: "Fill the gap: 'You ___ eat so many sweets.'", answer: "shouldn't" },
      { prompt: "Fill the gap: 'She's got a fever. She ___ see a doctor.'", answer: "should" },
      { prompt: "Fill the gap: 'We ___ go out in the rain without a coat.'", answer: "shouldn't" },
      { prompt: "Fill the gap: 'He ___ drink more water.'", answer: "should" },
      { prompt: "Fill the gap: 'They ___ stay up late on a school night.'", answer: "shouldn't" },
      { prompt: "Fill the gap: 'What's the ___? You look ill.'", answer: "matter" },
      { prompt: "Fill the gap: 'I've got a ___ throat. It hurts to speak.'", answer: "sore" },
      { prompt: "Fill the gap: 'My head hurts. I've got a ___.'", answer: "headache" },
      { prompt: "Fill the gap: 'You should take some ___ for your headache.'", answer: "medicine" }
    ]
  },
  'comparatives-superlatives': {
    MEMORY_QUESTIONS: [
      { prompt: "Fill the gap: 'The Nile is ___ river in the world.' (long)", answer: "the longest" },
      { prompt: "Fill the gap: 'This is ___ question on the page.' (easy)", answer: "the easiest" },
      { prompt: "Fill the gap: 'A mouse is ___ than a cat.' (small)", answer: "smaller" },
      { prompt: "Fill the gap: 'She is ___ singer in the school.' (good)", answer: "the best" },
      { prompt: "Fill the gap: 'Today is ___ day of the year.' (hot)", answer: "the hottest" },
      { prompt: "Fill the gap: 'My bag is ___ than yours.' (heavy)", answer: "heavier" },
      { prompt: "Fill the gap: 'That was ___ film I've ever seen.' (bad)", answer: "the worst" },
      { prompt: "Fill the gap: 'Gold is ___ than silver.' (expensive)", answer: "more expensive" },
      { prompt: "Fill the gap: 'He is ___ person in the class.' (happy)", answer: "the happiest" },
      { prompt: "Fill the gap: 'This is ___ book of them all.' (interesting)", answer: "the most interesting" }
    ]
  },
  'will-wont': {
    MEMORY_QUESTIONS: [
      { prompt: "Fill the gap: 'I think it ___ rain later.'", answer: "will" },
      { prompt: "Fill the gap: 'He ___ come — he's far too busy.'", answer: "won't" },
      { prompt: "Fill the gap: '___ you help me, please?'", answer: "Will" },
      { prompt: "Fill the gap: 'They ___ be here at six.'", answer: "will" },
      { prompt: "Fill the gap: 'I promise I ___ forget.'", answer: "won't" },
      { prompt: "Fill the gap: 'She ___ be ten next year.'", answer: "will" },
      { prompt: "Fill the gap: 'We ___ need umbrellas — it's sunny.'", answer: "won't" },
      { prompt: "Fill the gap: 'The film ___ start at seven.'", answer: "will" },
      { prompt: "Fill the gap: 'Don't worry, it ___ hurt.'", answer: "won't" },
      { prompt: "What is the short form of 'I will'?", answer: "I'll" }
    ]
  },
  'present-perfect': {
    MEMORY_QUESTIONS: [
      { prompt: "Fill the gap: 'I ___ finished my homework.'", answer: "have" },
      { prompt: "Fill the gap: 'She ___ gone to the shop.'", answer: "has" },
      { prompt: "Fill the gap: 'Have you ___ been to London?'", answer: "ever" },
      { prompt: "Fill the gap: 'They ___ never eaten sushi.'", answer: "have" },
      { prompt: "Fill the gap: 'He has ___ his keys.' (lose)", answer: "lost" },
      { prompt: "Fill the gap: 'We haven't ___ lunch yet.' (eat)", answer: "eaten" },
      { prompt: "Fill the gap: 'It has ___ raining.' (stop)", answer: "stopped" },
      { prompt: "Fill the gap: 'I have ___ that film twice.' (see)", answer: "seen" },
      { prompt: "Fill the gap: '___ she finished yet?'", answer: "Has" },
      { prompt: "Fill the gap: 'They have ___ already.' (arrive)", answer: "arrived" }
    ]
  }
};

export const MEMORY_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  MEMORY_QUESTIONS.length = 0;
  MEMORY_QUESTIONS.push(...data.MEMORY_QUESTIONS);
}
applyLesson('comparatives');
