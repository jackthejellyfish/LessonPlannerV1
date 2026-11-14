/* =========================================================
   LESSON CONTENT — Stage 2 (Learn the Rule)
   Swap or extend the rule cards / presentation demo here;
   js/stages/stage2-rules.js only contains rendering logic.

   RULES: {name, formula, color, examples:[[base, suffix]]} —
   rendered as `base` → `base` + `suffix` (see renderLearnSlide),
   so a suffix with a leading space reads as a full continuation
   ("He" → "He should stay in bed."), not just a word ending.

   COMPARE_DEMOS: {labelA, labelB, valueA, valueB, icon | iconA/
   iconB, caption}. `icon` sizes/colors one shared icon type for
   both sides (the original "magnitude" comparison — two towers,
   one taller); `iconA`/`iconB` (falls back to `icon` if absent)
   let each side use a *different* icon type instead, for demos
   that pair two different things (a symptom and its advice)
   rather than comparing one thing's size.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    RULES: [
      { name: "Add -er", formula: "adjective + er", color: "var(--rule-a)",
        examples: [["tall","er"],["small","er"],["long","er"]] },
      { name: "Add -r", formula: "ends in e, so just + r", color: "var(--rule-b)",
        examples: [["nice","r"],["large","r"],["safe","r"]] },
      { name: "Double + -er", formula: "short vowel + consonant: double it, + er", color: "var(--rule-c)",
        examples: [["big","ger"],["hot","ter"],["thin","ner"]] },
      { name: "y → ier", formula: "consonant + y: change y to i, + er", color: "var(--rule-d)",
        examples: [["happ","ier"],["eas","ier"],["bus","ier"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Tower A", labelB: "Tower B", valueA: 85, valueB: 45, icon: "tower",
        caption: 'Tower A is <span class="hl">taller</span> than Tower B.' },
      { labelA: "Car A", labelB: "Car B", valueA: 55, valueB: 95, icon: "car",
        caption: 'Car B is <span class="hl">faster</span> than Car A.' },
      { labelA: "Bag A", labelB: "Bag B", valueA: 30, valueB: 75, icon: "bag",
        caption: 'Bag B is <span class="hl">heavier</span> than Bag A.' },
      { labelA: "Path A", labelB: "Path B", valueA: 90, valueB: 60, icon: "path",
        caption: 'Path A is <span class="hl">longer</span> than Path B.' }
    ],
    COMPARE_ICON_COLORS: { tower: "var(--rule-a)", car: "var(--rule-b)", bag: "var(--rule-c)", path: "var(--rule-d)" }
  },
  health: {
    RULES: [
      { name: "Positive", formula: "I / He / She / They + should + verb", color: "var(--rule-a)",
        examples: [["I"," should take some medicine."], ["He"," should stay in bed."], ["They"," should see a dentist."]] },
      { name: "Negative", formula: "I / He / She / They + shouldn't + verb", color: "var(--rule-c)",
        examples: [["He"," shouldn't eat too much."], ["She"," shouldn't stay up late."], ["I"," shouldn't skip breakfast."]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "headache", iconB: "medicine",
        caption: 'I’ve got a headache. You should <span class="hl">take some medicine</span>.' },
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "thermometer", iconB: "bed",
        caption: 'I’ve got a fever. I should <span class="hl">stay in bed</span>.' },
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "nose", iconB: "tissue",
        caption: 'He’s got a runny nose. He should <span class="hl">blow his nose</span>.' },
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "tooth", iconB: "dentist",
        caption: 'I’ve got a toothache. I should <span class="hl">see a dentist</span>.' }
    ],
    COMPARE_ICON_COLORS: {
      headache: "var(--rule-c)", thermometer: "var(--rule-c)", nose: "var(--rule-c)", tooth: "var(--rule-c)",
      medicine: "var(--rule-a)", bed: "var(--rule-a)", tissue: "var(--rule-a)", dentist: "var(--rule-a)"
    }
  },
  'comparatives-superlatives': {
    // The suffix column completes the base word, so a single entry can
    // show BOTH forms at once: 'tall' + 'er / tallest' renders as
    // "tall \u2192 taller / tallest", which is exactly the contrast this
    // lesson is about. The last two rules have no suffix form at all, so
    // they use the sentence shape the health lesson established instead.
    RULES: [
      { name: "Add -er / -est", formula: "adjective + er (two things) / + est (three or more)", color: "var(--rule-a)",
        examples: [["tall","er / tallest"],["small","er / smallest"],["long","er / longest"]] },
      { name: "Ends in e: + r / + st", formula: "already ends in e, so just add r / st", color: "var(--rule-b)",
        examples: [["nice","r / nicest"],["large","r / largest"],["safe","r / safest"]] },
      { name: "Double the consonant", formula: "short vowel + consonant: double it, + er / est", color: "var(--rule-c)",
        examples: [["big","ger / biggest"],["hot","ter / hottest"],["thin","ner / thinnest"]] },
      { name: "y \u2192 ier / iest", formula: "consonant + y: change y to i, + er / est", color: "var(--rule-d)",
        examples: [["happ","ier / happiest"],["eas","ier / easiest"],["bus","ier / busiest"]] },
      { name: "Long adjectives: more / the most", formula: "3+ syllables: more + adjective / the most + adjective", color: "var(--rule-b)",
        examples: [["It is"," more beautiful than the other one."],["She is"," the most careful student in the class."],["This is"," more expensive than that one."]] },
      { name: "Irregulars \u2014 learn these!", formula: "good / bad / far don\u2019t follow any rule", color: "var(--rule-c)",
        examples: [["My idea is"," better than yours. (good \u2192 better \u2192 best)"],["That was"," the worst film ever. (bad \u2192 worse \u2192 worst)"],["He ran"," the farthest. (far \u2192 farther \u2192 farthest)"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Tower A", labelB: "Tower B", valueA: 85, valueB: 45, icon: "tower",
        caption: 'Tower A is <span class="hl">taller</span> than Tower B \u2014 it is <span class="hl">the tallest</span>.' },
      { labelA: "Car A", labelB: "Car B", valueA: 55, valueB: 95, icon: "car",
        caption: 'Car B is <span class="hl">faster</span> than Car A \u2014 it is <span class="hl">the fastest</span>.' },
      { labelA: "Bag A", labelB: "Bag B", valueA: 30, valueB: 75, icon: "bag",
        caption: 'Bag B is <span class="hl">heavier</span> than Bag A \u2014 it is <span class="hl">the heaviest</span>.' },
      { labelA: "Path A", labelB: "Path B", valueA: 90, valueB: 60, icon: "path",
        caption: 'Path A is <span class="hl">longer</span> than Path B \u2014 it is <span class="hl">the longest</span>.' }
    ],
    COMPARE_ICON_COLORS: { tower: "var(--rule-a)", car: "var(--rule-b)", bag: "var(--rule-c)", path: "var(--rule-d)" }
  },
  'will-wont': {
    RULES: [
      { name: "Positive: will", formula: "subject + will + verb (no -s, no to)", color: "var(--rule-a)",
        examples: [["I"," will call you tomorrow."],["She"," will be eleven next year."],["They"," will win the match."]] },
      { name: "Negative: won\u2019t", formula: "subject + won\u2019t + verb (won\u2019t = will not)", color: "var(--rule-c)",
        examples: [["He"," won\u2019t be late again."],["I"," won\u2019t forget your birthday."],["We"," won\u2019t go out in the rain."]] },
      { name: "Questions", formula: "Will + subject + verb ?", color: "var(--rule-b)",
        examples: [["Will you"," help me, please?"],["Will it"," rain tomorrow?"],["Will they"," come to the party?"]] },
      { name: "Short forms", formula: "I\u2019ll / you\u2019ll / he\u2019ll / we\u2019ll \u2014 use these when you speak", color: "var(--rule-d)",
        examples: [["I\u2019ll"," see you later. (= I will)"],["She\u2019ll"," be here soon. (= She will)"],["We\u2019ll"," do it together. (= We will)"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Now", labelB: "Later", valueA: 75, valueB: 75, iconA: "cloud", iconB: "umbrella",
        caption: 'Look at those clouds! It <span class="hl">will</span> rain, so I<span class="hl">\u2019ll</span> take an umbrella.' },
      { labelA: "Now", labelB: "The future", valueA: 70, valueB: 80, iconA: "clock", iconB: "rocket",
        caption: 'One day, people <span class="hl">will</span> travel to Mars.' },
      { labelA: "Now", labelB: "Later", valueA: 75, valueB: 75, iconA: "book", iconB: "trophy",
        caption: 'She studies every day, so she <span class="hl">will</span> pass the exam.' },
      { labelA: "Now", labelB: "Later", valueA: 75, valueB: 75, iconA: "cake", iconB: "suitcase",
        caption: 'It\u2019s his birthday, but he <span class="hl">won\u2019t</span> have a party \u2014 he<span class="hl">\u2019ll</span> be on holiday.' }
    ],
    COMPARE_ICON_COLORS: {
      cloud: "var(--rule-c)", clock: "var(--rule-c)", book: "var(--rule-c)", cake: "var(--rule-c)",
      umbrella: "var(--rule-a)", rocket: "var(--rule-a)", trophy: "var(--rule-a)", suitcase: "var(--rule-a)"
    }
  },
  'present-perfect': {
    RULES: [
      { name: "I / You / We / They + have", formula: "subject + have + past participle", color: "var(--rule-a)",
        examples: [["I"," have visited Japan."],["They"," have eaten already."],["We"," have seen that film."]] },
      { name: "He / She / It + has", formula: "subject + has + past participle", color: "var(--rule-b)",
        examples: [["He"," has lost his keys."],["She"," has finished her work."],["It"," has stopped raining."]] },
      { name: "Negative: haven\u2019t / hasn\u2019t", formula: "subject + haven\u2019t / hasn\u2019t + past participle", color: "var(--rule-c)",
        examples: [["I"," haven\u2019t finished yet."],["She"," hasn\u2019t been to Paris."],["We"," haven\u2019t eaten lunch."]] },
      { name: "ever / never", formula: "Have you ever \u2026? / I have never \u2026", color: "var(--rule-d)",
        examples: [["Have you"," ever ridden a horse?"],["I"," have never eaten sushi."],["Has she"," ever been to London?"]] },
      { name: "Irregular participles \u2014 learn these!", formula: "many common verbs don\u2019t just add -ed", color: "var(--rule-b)",
        examples: [["I have"," eaten it all. (eat \u2192 eaten)"],["She has"," gone home. (go \u2192 gone)"],["They have"," seen it twice. (see \u2192 seen)"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Experience", labelB: "Result", valueA: 75, valueB: 75, iconA: "suitcase", iconB: "path",
        caption: 'She <span class="hl">has visited</span> six countries \u2014 she knows the world!' },
      { labelA: "Experience", labelB: "Result", valueA: 75, valueB: 75, iconA: "book", iconB: "tick",
        caption: 'I <span class="hl">have finished</span> my book, so I can start a new one.' },
      { labelA: "Experience", labelB: "Result", valueA: 75, valueB: 75, iconA: "cake", iconB: "tick",
        caption: 'They <span class="hl">have eaten</span> all the cake \u2014 there is none left.' },
      { labelA: "Experience", labelB: "Result", valueA: 75, valueB: 75, iconA: "trophy", iconB: "clock",
        caption: 'He <span class="hl">has won</span> three medals this year.' }
    ],
    COMPARE_ICON_COLORS: {
      suitcase: "var(--rule-c)", book: "var(--rule-c)", cake: "var(--rule-c)", trophy: "var(--rule-c)",
      path: "var(--rule-a)", tick: "var(--rule-a)", clock: "var(--rule-a)"
    }
  },
  'amusement-park': {
    RULES: [
      { name: "Past simple: regular verbs", formula: "verb + -ed", color: "var(--rule-a)",
        examples: [["watch","ed a 3D film"],["visit","ed a petting zoo"],["enter","ed a haunted house"]] },
      { name: "Past simple: irregular verbs", formula: "these change completely — learn them!", color: "var(--rule-b)",
        examples: [["I"," saw a parade. (see → saw)"],["We"," went on a roller coaster. (go → went)"],["He"," rode the merry-go-round. (ride → rode)"]] },
      { name: "What did you do?", formula: "What did you do at the amusement park? → I + past simple", color: "var(--rule-c)",
        examples: [["I"," watched a 3D film."],["My friend"," visited a petting zoo."],["We"," ate candy floss."]] },
      { name: "-ing adjectives: the thing", formula: "How was the ___? → It was + -ing adjective", color: "var(--rule-d)",
        examples: [["The roller coaster"," was exciting."],["The 3D film"," was amazing."],["The merry-go-round"," was boring."]] },
      { name: "-ed adjectives: how you feel", formula: "I was / We were + -ed adjective", color: "var(--rule-a)",
        examples: [["I"," was excited."],["She"," was amazed."],["They"," were bored."]] },
      { name: "Watch out!", formula: "-ing = the thing · -ed = the person · scary → scared", color: "var(--rule-b)",
        examples: [["The haunted house"," was scary. (not scaring)"],["I"," was scared! (not scaried)"],["The parade"," was boring, so I was bored."]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "It was… (-ing)", labelB: "I was… (-ed)", valueA: 75, valueB: 75, iconA: "coaster", iconB: "face-excited",
        caption: 'The roller coaster was <span class="hl">exciting</span>. I was <span class="hl">excited</span>!' },
      { labelA: "It was… (-ing)", labelB: "I was… (-ed)", valueA: 75, valueB: 75, iconA: "carousel", iconB: "face-bored",
        caption: 'The merry-go-round was <span class="hl">boring</span>. I was <span class="hl">bored</span>.' },
      { labelA: "It was… (-ing)", labelB: "I was… (-ed)", valueA: 75, valueB: 75, iconA: "glasses3d", iconB: "face-amazed",
        caption: 'The 3D film was <span class="hl">amazing</span>. I was <span class="hl">amazed</span>!' },
      { labelA: "It was…", labelB: "I was…", valueA: 75, valueB: 75, iconA: "ghost", iconB: "face-scared",
        caption: 'The haunted house was <span class="hl">scary</span>. I was <span class="hl">scared</span>!' }
    ],
    COMPARE_ICON_COLORS: {
      coaster: "var(--rule-c)", carousel: "var(--rule-c)", glasses3d: "var(--rule-c)", ghost: "var(--rule-b)",
      'face-excited': "var(--rule-d)", 'face-bored': "var(--rule-d)", 'face-amazed': "var(--rule-d)", 'face-scared': "var(--rule-d)"
    }
  }
};

export const RULES = [];
export const COMPARE_DEMOS = [];
export const COMPARE_ICON_COLORS = {};

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  RULES.length = 0;
  RULES.push(...data.RULES);
  COMPARE_DEMOS.length = 0;
  COMPARE_DEMOS.push(...data.COMPARE_DEMOS);
  Object.keys(COMPARE_ICON_COLORS).forEach(k => delete COMPARE_ICON_COLORS[k]);
  Object.assign(COMPARE_ICON_COLORS, data.COMPARE_ICON_COLORS);
}
applyLesson('comparatives');
