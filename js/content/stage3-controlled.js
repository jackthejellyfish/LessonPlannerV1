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
  },
  'comparatives-superlatives': {
    // Each option gives BOTH forms, so a student has to get the
    // comparative AND the superlative right to pick correctly — the
    // whole point of teaching the two together.
    MC_QUESTIONS: [
      { word: "tall", correct: "taller / tallest", options: ["taller / tallest", "more tall / most tall", "taller / tallerest"] },
      { word: "big", correct: "bigger / biggest", options: ["biger / bigest", "bigger / biggest", "more big / most big"] },
      { word: "nice", correct: "nicer / nicest", options: ["nicer / nicest", "niceer / niceest", "more nice / most nice"] },
      { word: "happy", correct: "happier / happiest", options: ["happyer / happyest", "happier / happiest", "more happy / most happy"] },
      { word: "hot", correct: "hotter / hottest", options: ["hoter / hotest", "hotter / hottest", "more hot / most hot"] },
      { word: "easy", correct: "easier / easiest", options: ["easier / easiest", "easyer / easyest", "more easy / most easy"] },
      { word: "beautiful", correct: "more beautiful / the most beautiful", options: ["beautifuler / beautifulest", "more beautiful / the most beautiful", "beautifuller / most beautifullest"] },
      { word: "expensive", correct: "more expensive / the most expensive", options: ["more expensive / the most expensive", "expensiver / expensivest", "expensiver / most expensive"] },
      { word: "good", correct: "better / best", options: ["gooder / goodest", "better / best", "more good / most good"] },
      { word: "bad", correct: "worse / worst", options: ["worse / worst", "badder / baddest", "more bad / most bad"] }
    ]
  },
  'will-wont': {
    // `word` is a whole gapped sentence here rather than a single word —
    // the lesson's mcQuestionTemplate just shows it, so the sentence IS
    // the question (no "Choose the correct answer:" lead-in since
    // 2026-11-22).
    MC_QUESTIONS: [
      { word: "Tomorrow it ___ be sunny.", correct: "will", options: ["will", "wills", "will to"] },
      { word: "I ___ go to school on Sunday.", correct: "won\u2019t", options: ["won\u2019t", "will", "don\u2019t will"] },
      { word: "She ___ help you with your homework.", correct: "will", options: ["will to", "wills", "will"] },
      { word: "He never studies, so he ___ pass the test.", correct: "won\u2019t", options: ["won\u2019t", "will", "doesn\u2019t will"] },
      { word: "___ you come to my party?", correct: "Will", options: ["Will", "Do will", "Are will"] },
      { word: "We ___ forget you \u2014 we promise!", correct: "won\u2019t", options: ["won\u2019t", "will", "not will"] },
      { word: "In 2050, people ___ live on Mars.", correct: "will", options: ["will", "are will", "will to"] },
      { word: "It\u2019s freezing, so I ___ wear a T-shirt.", correct: "won\u2019t", options: ["will", "won\u2019t", "amn\u2019t"] },
      { word: "Don\u2019t worry \u2014 I ___ tell anyone.", correct: "won\u2019t", options: ["won\u2019t", "will", "no will"] },
      { word: "The bus is late. We ___ be late for school.", correct: "will", options: ["will", "won\u2019t be not", "will to"] }
    ]
  },
  'present-perfect': {
    MC_QUESTIONS: [
      { word: "I ___ visited Japan twice.", correct: "have", options: ["have", "has", "am"] },
      { word: "She ___ finished her homework.", correct: "has", options: ["has", "have", "is"] },
      { word: "They ___ never eaten sushi.", correct: "have", options: ["have", "has", "are"] },
      { word: "He has ___ to London twice.", correct: "been", options: ["been", "go", "went"] },
      { word: "We ___ seen that film before.", correct: "have", options: ["has", "have", "having"] },
      { word: "___ you ever ridden a horse?", correct: "Have", options: ["Have", "Has", "Are"] },
      { word: "My brother ___ broken his arm.", correct: "has", options: ["has", "have", "is"] },
      { word: "I haven\u2019t ___ my keys anywhere.", correct: "found", options: ["found", "find", "finded"] },
      { word: "She has ___ a new bike.", correct: "bought", options: ["buyed", "bought", "buy"] },
      { word: "The train has already ___.", correct: "arrived", options: ["arrived", "arrive", "arriving"] }
    ]
  },
  'amusement-park': {
    MC_QUESTIONS: [
      { word: "Yesterday I ___ a 3D film.", correct: "watched", options: ["watched", "watch", "watching"] },
      { word: "We ___ a parade at the park.", correct: "saw", options: ["seed", "saw", "see"] },
      { word: "She ___ the merry-go-round.", correct: "rode", options: ["rided", "ride", "rode"] },
      { word: "They ___ on a roller coaster.", correct: "went", options: ["went", "goed", "go"] },
      { word: "He ___ the haunted house.", correct: "entered", options: ["enter", "entered", "entred"] },
      { word: "I ___ a petting zoo with my class.", correct: "visited", options: ["visit", "visitted", "visited"] },
      { word: "The roller coaster was ___!", correct: "exciting", options: ["exciting", "excited", "excite"] },
      { word: "The film was very long. I was ___.", correct: "bored", options: ["boring", "bored", "bore"] },
      { word: "The haunted house was ___.", correct: "scary", options: ["scared", "scaring", "scary"] },
      { word: "The 3D film was great. We were ___!", correct: "amazed", options: ["amazed", "amazing", "amaze"] }
    ]
  },
  'party-fun': {
    MC_QUESTIONS: [
      { word: "I ___ bake biscuits for the party.", correct: "will", options: ["will", "wills", "will to"] },
      { word: "Who ___ set the table?", correct: "will", options: ["does will", "will", "wills"] },
      { word: "He’s on holiday, so he ___ come to the party.", correct: "won’t", options: ["won’t", "will", "doesn’t will"] },
      { word: "___ you bring games?", correct: "Will", options: ["Are will", "Do", "Will"] },
      { word: "Will she choose the music? — Yes, she ___.", correct: "will", options: ["will", "’ll", "does"] },
      { word: "Will they order pizza? — No, they ___.", correct: "won’t", options: ["don’t", "won’t", "aren’t"] },
      { word: "What will you do for the party? — I’ll ___ posters.", correct: "draw", options: ["draws", "drawing", "draw"] },
      { word: "Rosa will ___ the pizza.", correct: "serve", options: ["serve", "serves", "to serve"] },
      { word: "We ___ forget the decorations — we promise!", correct: "won’t", options: ["won’t", "will", "not will"] },
      { word: "‘I’ll’ means…", correct: "I will", options: ["I am", "I will", "I all"] }
    ]
  },
  'at-school': {
    MC_QUESTIONS: [
      { word: "I ___ got a marker pen.", correct: "have", options: ["have", "has", "am"] },
      { word: "She ___ got a stapler.", correct: "has", options: ["have", "has", "is"] },
      { word: "What ___ you got? — I’ve got a glue stick.", correct: "have", options: ["has", "do", "have"] },
      { word: "What has he got? — He ___ a paintbrush.", correct: "’s got", options: ["’s got", "’ve got", "have"] },
      { word: "I ___ pizza.", correct: "want", options: ["want", "wants", "wanting"] },
      { word: "He ___ fish.", correct: "wants", options: ["want", "wants", "is want"] },
      { word: "What ___ she want?", correct: "does", options: ["do", "does", "is"] },
      { word: "What does he want? — He ___ chicken.", correct: "wants", options: ["want", "wants", "does want"] },
      { word: "We ___ got colouring pencils.", correct: "have", options: ["has", "have", "are"] },
      { word: "Which one can you eat?", correct: "steak", options: ["stapler", "steak", "glue stick"] }
    ]
  },
  'months-weather': {
    MC_QUESTIONS: [
      { word: "My birthday is ___ May.", correct: "in", options: ["in", "on", "at"] },
      { word: "Her birthday is ___ the 3rd of June.", correct: "on", options: ["in", "on", "at"] },
      { word: "The month after March is ___.", correct: "April", options: ["May", "February", "April"] },
      { word: "5th = the ___ of May", correct: "fifth", options: ["fiveth", "fifth", "five"] },
      { word: "What’s the weather like? — It’s ___.", correct: "sunny", options: ["sun", "sunny", "suns"] },
      { word: "It’s cold and snowy in ___.", correct: "winter", options: ["summer", "winter", "spring"] },
      { word: "1st = the ___ of January", correct: "first", options: ["oneth", "first", "one"] },
      { word: "It’s very ___ in summer.", correct: "hot", options: ["cold", "snowy", "hot"] },
      { word: "The last month of the year is ___.", correct: "December", options: ["November", "January", "December"] },
      { word: "Leaves fall from the trees in ___.", correct: "autumn", options: ["autumn", "spring", "summer"] }
    ]
  },
  'food-drink': {
    MC_QUESTIONS: [
      { word: "Is there ___ bread?", correct: "any", options: ["a", "any", "some"] },
      { word: "There are ___ cookies on the plate.", correct: "some", options: ["any", "some", "a"] },
      { word: "Is there ___ banana?", correct: "a", options: ["a", "an", "any"] },
      { word: "There’s ___ apple in my bag.", correct: "an", options: ["a", "an", "some"] },
      { word: "There isn’t ___ juice.", correct: "any", options: ["some", "any", "a"] },
      { word: "Water is ___.", correct: "uncountable", options: ["countable", "uncountable", "plural"] },
      { word: "Are there any ___?", correct: "potatoes", options: ["potato", "potatoes", "potatos"] },
      { word: "___ there any carrots?", correct: "Are", options: ["Is", "Are", "Be"] },
      { word: "I’d ___ some water, please.", correct: "like", options: ["like", "likes", "liking"] },
      { word: "Can I ___ a cheese sandwich, please?", correct: "have", options: ["has", "have", "having"] }
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
