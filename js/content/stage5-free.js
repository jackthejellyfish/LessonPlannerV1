/* =========================================================
   LESSON CONTENT — Stage 5 (Free Practice)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    FREE_TASK: {
      headline: "Compare two things you know.",
      steps: [
        "Choose two people, animals or things.",
        "Tell your partner five ways they are different.",
        "Swap — now your partner compares two things."
      ],
      example: [
        ["A", "Who is taller, you or your brother?"],
        ["B", "My brother is taller than me, but I’m faster than him!"]
      ]
    },
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
    FREE_TASK: {
      headline: "Give your partner some health advice.",
      steps: [
        "Your partner tells you a problem: “I’ve got a headache.”",
        "Give advice with should and shouldn’t.",
        "Swap. Do it five times each."
      ],
      example: [
        ["A", "I’ve got a sore throat."],
        ["B", "You should drink some hot tea. You shouldn’t shout!"]
      ]
    },
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
    FREE_TASK: {
      headline: "Compare three things — then choose the best.",
      steps: [
        "Choose three people, animals or things.",
        "Compare them: bigger, faster, more interesting…",
        "Say which one is the best of all, and why."
      ],
      example: [
        ["A", "Which is the fastest: a car, a bike or a plane?"],
        ["B", "A car is faster than a bike, but a plane is the fastest!"]
      ]
    },
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
    FREE_TASK: {
      headline: "Make predictions about next year.",
      steps: [
        "Ask your partner: “What will you do next year?”",
        "Answer with will and won’t — five sentences.",
        "Swap and ask again."
      ],
      example: [
        ["A", "What will you do next year?"],
        ["B", "I will learn to swim. I won’t eat so much chocolate!"]
      ]
    },
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
    FREE_TASK: {
      headline: "Find out what your partner has done.",
      steps: [
        "Ask “Have you ever…?” questions.",
        "Answer: “Yes, I have” or “No, I haven’t” — then say more.",
        "Find three things you have BOTH done."
      ],
      example: [
        ["A", "Have you ever ridden a horse?"],
        ["B", "Yes, I have! Have you?"]
      ]
    },
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
    FREE_TASK: {
      headline: "Imagine you went to an amusement park.",
      steps: [
        "Ask your partner: “What did you do?”",
        "Then ask: “How was it?” and “How did you feel?”",
        "Swap. What was the most popular attraction?"
      ],
      example: [
        ["A", "What did you do at the amusement park?"],
        ["B", "I went on a roller coaster."],
        ["A", "How was it?"],
        ["B", "It was exciting. I was excited!"]
      ]
    },
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
  },
  'party-fun': {
    FREE_TASK: {
      headline: "Plan a class party together.",
      steps: [
        "Make a list of six party jobs.",
        "Ask “Who will…?” and “What will you do?” Write a name next to each job.",
        "Tell the class: “Ann will bake biscuits, and I’ll play the music.”"
      ],
      example: [
        ["A", "What will you do for the party?"],
        ["B", "I’ll bake biscuits. Will you bring games?"],
        ["A", "No, I won’t. I’ll choose the music."],
        ["B", "OK! Who will order the pizza?"]
      ]
    },
    // The two short forms, then every party job from both textbook pages
    // as verb → what you do it to, so "What will you do?" always has an
    // answer on the board.
    WORD_BANK: [
      ["I will","I’ll"], ["will not","won’t"], ["buy","balloons"], ["bake","biscuits"],
      ["choose","music"], ["order","pizza"], ["draw","posters"], ["bring","games"],
      ["set","the table"], ["serve","the pizza"], ["blow up","the balloons"], ["play","the music"],
      ["hang up","the decorations"], ["set up","the games"]
    ],
    SCAFFOLD_FRAMES: [
      'What will you do for the party? — I<span class="blank">’ll</span> <span class="blank">___</span> <span class="blank">___</span>.',
      'Who <span class="blank">will</span> <span class="blank">___</span>? — <span class="blank">___</span> will <span class="blank">___</span>.',
      '<span class="blank">Will</span> you <span class="blank">___</span>? — Yes, I <span class="blank">will</span>. / No, I <span class="blank">won’t</span>.',
      'I<span class="blank">’ll</span> <span class="blank">___</span>, but I <span class="blank">won’t</span> <span class="blank">___</span>.',
      '<span class="blank">___</span> will <span class="blank">___</span>, and <span class="blank">___</span> will <span class="blank">___</span>.'
    ]
  },
  'at-school': {
    FREE_TASK: {
      headline: "What have you got? What do you want?",
      steps: [
        "Hide three classroom things in your bag.",
        "Ask “What have you got?” Tell the class.",
        "Order lunch: ask “What do you want?”"
      ],
      example: [
        ["A", "What have you got?"],
        ["B", "I’ve got a paintbrush and a stapler. What do you want for lunch?"],
        ["A", "I want pizza and juice."],
        ["B", "Mia wants pizza and juice!"]
      ]
    },
    // The short forms first, then what you do with each classroom thing,
    // then the food and drink. Kept short: the timer slide has to fit a
    // 1280x720 board (tests/full-regression.spec.js).
    WORD_BANK: [
      ["I have got","I’ve got"], ["she has got","she’s got"], ["I want","she wants"],
      ["draw with","a marker pen"], ["paint with","a paintbrush"], ["stick with","a glue stick"],
      ["colour with","a colouring pencil"], ["sharpen with","a pencil sharpener"], ["staple with","a stapler"],
      ["eat","pizza · fish · chicken"], ["eat","steak · soup"], ["drink","juice"]
    ],
    SCAFFOLD_FRAMES: [
      'What have you got? — I<span class="blank">’ve got</span> a <span class="blank">___</span>.',
      'What <span class="blank">has</span> <span class="blank">___</span> got? — <span class="blank">___</span>’s got a <span class="blank">___</span>.',
      'What do you want? — I <span class="blank">want</span> <span class="blank">___</span> and <span class="blank">___</span>.',
      'What <span class="blank">does</span> <span class="blank">___</span> want? — <span class="blank">___</span> <span class="blank">wants</span> <span class="blank">___</span>.',
      'I<span class="blank">’ve got</span> a <span class="blank">___</span>, but <span class="blank">___</span>’s got a <span class="blank">___</span>.'
    ]
  },
  'months-weather': {
    FREE_TASK: {
      headline: "Make a birthday and weather calendar.",
      steps: [
        "Ask five classmates “When’s your birthday?”",
        "Say the season and weather: “July — it’s summer, so it’s hot!”",
        "Tell the class whose birthday is next!"
      ],
      example: [
        ["A", "When’s your birthday?"],
        ["B", "It’s on the twelfth of March."],
        ["A", "That’s in spring! What’s the weather like in March?"],
        ["B", "It’s windy and rainy."]
      ]
    },
    // Number → date word, season → its months, weather noun → adjective.
    WORD_BANK: [
      ["1st","first"], ["2nd","second"], ["3rd","third"], ["5th","fifth"], ["12th","twelfth"], ["20th","twentieth"],
      ["spring","March · April · May"], ["summer","June · July · August"],
      ["autumn","September · October · November"], ["winter","December · January · February"],
      ["sun","sunny"], ["rain","rainy"], ["wind","windy"], ["snow","snowy"], ["cloud","cloudy"]
    ],
    SCAFFOLD_FRAMES: [
      'When’s your birthday? — It’s <span class="blank">in</span> <span class="blank">___</span>.',
      'It’s <span class="blank">on</span> the <span class="blank">___</span> of <span class="blank">___</span>.',
      'What’s the weather like? — It’s <span class="blank">___</span> and <span class="blank">___</span>.',
      'My favourite season is <span class="blank">___</span>. It’s <span class="blank">___</span> <span class="blank">in</span> <span class="blank">___</span>.',
      'In <span class="blank">___</span>, I like to <span class="blank">___</span> because it’s <span class="blank">___</span>.'
    ]
  }
};

export const WORD_BANK = [];
export const SCAFFOLD_FRAMES = [];
// {headline, steps[], example[[speaker, line]]} — Stage 5's first slide.
export const FREE_TASK = { headline: '', steps: [], example: [] };

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  WORD_BANK.length = 0;
  WORD_BANK.push(...data.WORD_BANK);
  SCAFFOLD_FRAMES.length = 0;
  SCAFFOLD_FRAMES.push(...data.SCAFFOLD_FRAMES);
  Object.assign(FREE_TASK, data.FREE_TASK);
}
applyLesson('comparatives');
