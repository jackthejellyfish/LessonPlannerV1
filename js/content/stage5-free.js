/* =========================================================
   LESSON CONTENT — Stage 5 (Free Practice)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    // Reference list shown during free practice — every comparative
    // introduced somewhere earlier in the lesson.
    WORD_BANK: [
      ["tall","taller"], ["small","smaller"], ["big","bigger"], ["hot","hotter"],
      ["nice","nicer"], ["safe","safer"], ["happy","happier"], ["easy","easier"],
      ["busy","busier"], ["good","better"], ["bad","worse"], ["fast","faster"],
      ["heavy","heavier"], ["shiny","shinier"]
    ],
    // Sentence frames for weaker students to lean on during free practice —
    // just fill in the gaps rather than building a sentence from nothing.
    SCAFFOLD_FRAMES: [
      '<span class="blank">___</span> is <span class="blank">___er</span> than <span class="blank">___</span>.',
      'My <span class="blank">___</span> is <span class="blank">___er</span> than my <span class="blank">___</span>.',
      'I think <span class="blank">___</span> is <span class="blank">___er</span> than <span class="blank">___</span>, but my partner disagrees!',
      'In my family, <span class="blank">___</span> is <span class="blank">___er</span> than <span class="blank">___</span>.',
      '<span class="blank">___</span> is <span class="blank">___er</span> than <span class="blank">___</span>, but not as <span class="blank">___</span> as <span class="blank">___</span>.'
    ]
  },
  health: {
    // Reference list shown during free practice — every ailment/advice
    // pair introduced somewhere earlier in the lesson.
    WORD_BANK: [
      ["headache","take some medicine"], ["fever","stay in bed"], ["runny nose","blow your nose"],
      ["toothache","see a dentist"], ["stomach ache","see a doctor"], ["sore throat","drink some hot tea"],
      ["cough","drink some water"], ["cold","stay in bed"], ["backache","rest"],
      ["earache","see a doctor"], ["sunburn","put on some cream"], ["a cut","put on a plaster"],
      ["hiccups","drink some water"], ["tiredness","get some sleep"]
    ],
    // Sentence frames for weaker students to lean on during free practice —
    // just fill in the gaps rather than building a sentence from nothing.
    SCAFFOLD_FRAMES: [
      'I’ve got a <span class="blank">___</span>. I think I <span class="blank">should</span> <span class="blank">___</span>.',
      '<span class="blank">___</span> has got a <span class="blank">___</span>. <span class="blank">___</span> should <span class="blank">___</span>.',
      'What’s the matter? I’ve got a <span class="blank">___</span>, so I <span class="blank">shouldn’t</span> <span class="blank">___</span>.',
      'If you have a <span class="blank">___</span>, you should <span class="blank">___</span>.',
      'My friend has got a <span class="blank">___</span>. In my opinion, they should <span class="blank">___</span>, but they shouldn’t <span class="blank">___</span>.'
    ]
  },
  'comparatives-superlatives': {
    WORD_BANK: [
      ["tall","taller / tallest"], ["big","bigger / biggest"], ["hot","hotter / hottest"],
      ["nice","nicer / nicest"], ["safe","safer / safest"], ["happy","happier / happiest"],
      ["easy","easier / easiest"], ["busy","busier / busiest"], ["long","longer / longest"],
      ["beautiful","more / the most beautiful"], ["expensive","more / the most expensive"],
      ["interesting","more / the most interesting"], ["good","better / best"], ["bad","worse / worst"]
    ],
    SCAFFOLD_FRAMES: [
      '<span class="blank">___</span> is <span class="blank">___er</span> than <span class="blank">___</span>.',
      '<span class="blank">___</span> is <span class="blank">the ___est</span> of all.',
      'My <span class="blank">___</span> is <span class="blank">___er</span> than my <span class="blank">___</span>, but <span class="blank">___</span> is <span class="blank">the ___est</span>.',
      'I think <span class="blank">___</span> is <span class="blank">the most ___</span> <span class="blank">___</span> in the world.',
      'Of my three <span class="blank">___</span>, <span class="blank">___</span> is <span class="blank">the ___est</span> and <span class="blank">___</span> is <span class="blank">the ___est</span>.'
    ]
  },
  'will-wont': {
    WORD_BANK: [
      ["I will","I\u2019ll"], ["you will","you\u2019ll"], ["he will","he\u2019ll"],
      ["she will","she\u2019ll"], ["we will","we\u2019ll"], ["they will","they\u2019ll"],
      ["will not","won\u2019t"], ["tomorrow","\u2026 will \u2026"], ["next week","\u2026 will \u2026"],
      ["next year","\u2026 will \u2026"], ["one day","\u2026 will \u2026"], ["I promise","I won\u2019t \u2026"],
      ["I think","\u2026 will \u2026"], ["I\u2019m sure","\u2026 won\u2019t \u2026"]
    ],
    SCAFFOLD_FRAMES: [
      'Tomorrow I <span class="blank">will</span> <span class="blank">___</span>.',
      'Next year I <span class="blank">won\u2019t</span> <span class="blank">___</span>.',
      'I think <span class="blank">___</span> <span class="blank">will</span> <span class="blank">___</span>, but <span class="blank">___</span> <span class="blank">won\u2019t</span>.',
      '<span class="blank">Will</span> you <span class="blank">___</span> next <span class="blank">___</span>?',
      'In the future, people <span class="blank">will</span> <span class="blank">___</span> and they <span class="blank">won\u2019t</span> <span class="blank">___</span>.'
    ]
  },
  'present-perfect': {
    // Base verb paired with its past participle — the form students
    // actually need to reach for while speaking freely.
    WORD_BANK: [
      ["be","been"], ["go","gone / been"], ["see","seen"], ["eat","eaten"],
      ["do","done"], ["make","made"], ["win","won"], ["lose","lost"],
      ["write","written"], ["read","read"], ["buy","bought"], ["take","taken"],
      ["break","broken"], ["visit","visited"]
    ],
    SCAFFOLD_FRAMES: [
      'I <span class="blank">have</span> <span class="blank">___</span> <span class="blank">___</span>.',
      'I <span class="blank">have never</span> <span class="blank">___</span> <span class="blank">___</span>.',
      '<span class="blank">Have</span> you ever <span class="blank">___</span> <span class="blank">___</span>?',
      'My <span class="blank">___</span> <span class="blank">has</span> <span class="blank">___</span> <span class="blank">___</span>.',
      'I <span class="blank">have</span> <span class="blank">___</span> <span class="blank">___</span>, but I <span class="blank">haven\u2019t</span> <span class="blank">___</span> <span class="blank">___</span> yet.'
    ]
  },
  'amusement-park': {
    // Verbs in the past simple, then the -ing / -ed adjective pairs -
    // everything a student needs to answer "What did you do?" and
    // "How was it?" without having to ask.
    WORD_BANK: [
      ["watch","watched"], ["visit","visited"], ["enter","entered"], ["see","saw"],
      ["go","went"], ["ride","rode"], ["eat","ate"], ["buy","bought"], ["win","won"],
      ["exciting","excited"], ["boring","bored"], ["amazing","amazed"], ["scary","scared"],
      ["tiring","tired"]
    ],
    SCAFFOLD_FRAMES: [
      'At the amusement park, I <span class="blank">___</span> <span class="blank">___</span>.',
      'I <span class="blank">went</span> on the <span class="blank">___</span>. It was <span class="blank">___ing</span>!',
      'The <span class="blank">___</span> was <span class="blank">___ing</span>, so I was <span class="blank">___ed</span>.',
      'What <span class="blank">did</span> you do at the amusement park? — I <span class="blank">___</span> <span class="blank">___</span>.',
      'How <span class="blank">was</span> the <span class="blank">___</span>? — It was <span class="blank">___</span>. I was <span class="blank">___</span>.'
    ]
  }
};

export const WORD_BANK = [];
export const SCAFFOLD_FRAMES = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  WORD_BANK.length = 0;
  WORD_BANK.push(...data.WORD_BANK);
  SCAFFOLD_FRAMES.length = 0;
  SCAFFOLD_FRAMES.push(...data.SCAFFOLD_FRAMES);
}
applyLesson('comparatives');
