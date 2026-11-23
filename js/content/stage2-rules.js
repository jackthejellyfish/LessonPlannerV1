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
  },
  'party-fun': {
    // Five sentence shapes for one structure (will), so every rule uses
    // the sentence style: subject on the left, the rest of the sentence
    // as the "suffix". The Wh-question rules show the ANSWER side - the
    // formula line carries the question, so it isn't printed twice.
    RULES: [
      { name: "Positive: will / ’ll", formula: "subject + will + verb · I’ll = I will", color: "var(--rule-a)",
        examples: [["I","’ll bake biscuits."],["He","’ll draw posters."],["We"," will buy balloons."]] },
      { name: "Negative: won’t", formula: "subject + won’t + verb (won’t = will not)", color: "var(--rule-c)",
        examples: [["I"," won’t bake biscuits."],["He"," won’t draw posters."],["They"," won’t order pizza."]] },
      { name: "What will you do?", formula: "What will you do for the party? → I’ll + verb", color: "var(--rule-b)",
        examples: [["I","’ll order pizza."],["She","’ll bake biscuits."],["Tom","’ll bring games."]] },
      { name: "Who will…?", formula: "Who will + verb? → Name + will + verb", color: "var(--rule-d)",
        examples: [["Rosa"," will set the table."],["Dave"," will play the music."],["Ann"," will hang up the decorations."]] },
      { name: "Yes / No questions", formula: "Will + subject + verb? → Yes, I will. / No, I won’t.", color: "var(--rule-a)",
        examples: [["Will you"," bring games? — Yes, I will."],["Will he"," choose music? — No, he won’t."],["Will they"," blow up the balloons? — Yes, they will."]] },
      { name: "Watch out!", formula: "will + verb: no -s, no to · a short answer ends in will, not ’ll", color: "var(--rule-b)",
        examples: [["She will"," bake biscuits. (not bakes)"],["He will"," come. (not will to come)"],["Yes,"," I will. (not Yes, I’ll.)"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "I’ll…", labelB: "Rosa will…", valueA: 75, valueB: 75, iconA: "biscuits", iconB: "balloons",
        caption: 'I<span class="hl">’ll</span> bake biscuits, and Rosa <span class="hl">will</span> buy the balloons.' },
      { labelA: "Will you…?", labelB: "Yes, I will!", valueA: 75, valueB: 75, iconA: "pizza", iconB: "tick",
        caption: '<span class="hl">Will</span> you order the pizza? — Yes, I <span class="hl">will</span>.' },
      { labelA: "Choose music ✗", labelB: "Set up games ✓", valueA: 75, valueB: 75, iconA: "music", iconB: "dice",
        caption: '<span class="hl">Will</span> Dave choose the music? — No, he <span class="hl">won’t</span>. He<span class="hl">’ll</span> set up the games.' },
      { labelA: "Who will…?", labelB: "Sam will!", valueA: 75, valueB: 75, iconA: "poster", iconB: "tick",
        caption: 'Who <span class="hl">will</span> draw the posters? — Sam <span class="hl">will</span> draw the posters.' }
    ],
    COMPARE_ICON_COLORS: {
      biscuits: "var(--rule-c)", pizza: "var(--rule-c)", music: "var(--rule-c)", poster: "var(--rule-c)",
      balloons: "var(--rule-a)", tick: "var(--rule-a)", dice: "var(--rule-a)"
    }
  },
  'at-school': {
    // Two grammar points from Unit 2 (In the Classroom + At the
    // Cafeteria): have got / has got, then want / wants. Sentence-style
    // examples: subject on the left, the rest as the highlighted part.
    RULES: [
      { name: "I’ve got / You’ve got", formula: "I / You / We / They + ’ve got + a + thing (’ve got = have got)", color: "var(--rule-a)",
        examples: [["I","’ve got a marker pen."],["You","’ve got a stapler."],["We","’ve got a glue stick."]] },
      { name: "He’s got / She’s got", formula: "He / She + ’s got + a + thing (’s got = has got)", color: "var(--rule-c)",
        examples: [["He","’s got a paintbrush."],["She","’s got a colouring pencil."],["Tom","’s got a pencil sharpener."]] },
      { name: "What have you got? / What has she got?", formula: "What have you got? → I’ve got… · What has he got? → He’s got…", color: "var(--rule-b)",
        examples: [["I","’ve got a paintbrush."],["She","’s got a stapler."],["He","’s got a marker pen."]] },
      { name: "I want / He wants", formula: "I / You / We / They + want · He / She + wants", color: "var(--rule-d)",
        examples: [["I"," want pizza."],["He"," wants fish."],["She"," wants juice."]] },
      { name: "What do you want? / What does he want?", formula: "What do you want? → I want… · What does she want? → She wants…", color: "var(--rule-a)",
        examples: [["I"," want soup."],["He"," wants chicken."],["She"," wants steak."]] },
      { name: "Watch out!", formula: "a + one classroom thing · no a with food · does + want (not wants)", color: "var(--rule-b)",
        examples: [["I’ve got"," a paintbrush. (one thing: a)"],["She wants"," juice. (not a juice)"],["What does he"," want? (not wants)"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "I’ve got…", labelB: "She’s got…", valueA: 75, valueB: 75, iconA: "pencil", iconB: "glue",
        caption: 'I<span class="hl">’ve got</span> a colouring pencil, and she<span class="hl">’s got</span> a glue stick.' },
      { labelA: "What have you got?", labelB: "A paintbrush!", valueA: 75, valueB: 75, iconA: "brush", iconB: "tick",
        caption: 'What <span class="hl">have</span> you <span class="hl">got</span>? — I<span class="hl">’ve got</span> a paintbrush.' },
      { labelA: "I want…", labelB: "He wants…", valueA: 75, valueB: 75, iconA: "pizza", iconB: "fish",
        caption: 'I <span class="hl">want</span> pizza, but he <span class="hl">wants</span> fish.' },
      { labelA: "What does she want?", labelB: "Soup and juice!", valueA: 75, valueB: 75, iconA: "bowl", iconB: "juice",
        caption: 'What <span class="hl">does</span> she <span class="hl">want</span>? — She <span class="hl">wants</span> soup and juice.' }
    ],
    COMPARE_ICON_COLORS: {
      pencil: "var(--rule-c)", brush: "var(--rule-c)", pizza: "var(--rule-c)", bowl: "var(--rule-c)",
      glue: "var(--rule-a)", tick: "var(--rule-a)", fish: "var(--rule-a)", juice: "var(--rule-a)"
    }
  },
  'months-weather': {
    // Three topics: the months and dates (in + month, on + date), the
    // weather (It’s + adjective) and the seasons (in + season).
    RULES: [
      { name: "The twelve months", formula: "January, February, March, April, May, June, July, August, September, October, November, December — always a capital letter", color: "var(--rule-a)",
        examples: [["My birthday is"," in May."],["It’s cold"," in January."],["We go to the beach"," in August."]] },
      { name: "Dates: add -th", formula: "number + th · four → fourth (4th) · seven → seventh (7th)", color: "var(--rule-c)",
        examples: [["four","th"],["six","th"],["ten","th"]] },
      { name: "Special dates", formula: "1st first · 2nd second · 3rd third · 5th fifth · 12th twelfth · 20th twentieth", color: "var(--rule-b)",
        examples: [["twenty-","first (21st)"],["twenty-","second (22nd)"],["thirty-","first (31st)"]] },
      { name: "in + month · on + date", formula: "When’s your birthday? → It’s in May. / It’s on the fifth of May.", color: "var(--rule-d)",
        examples: [["It’s"," in March."],["It’s"," on the 12th of March."],["Christmas is"," on the 25th of December."]] },
      { name: "The weather", formula: "What’s the weather like? → It’s sunny / rainy / windy / cloudy / snowy / hot / cold.", color: "var(--rule-a)",
        examples: [["It","’s sunny."],["It","’s rainy and cold."],["It","’s windy today."]] },
      { name: "The seasons", formula: "spring · summer · autumn · winter → in + season", color: "var(--rule-c)",
        examples: [["It’s hot"," in summer."],["It’s snowy"," in winter."],["Leaves fall"," in autumn."]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "in May", labelB: "on the 5th", valueA: 75, valueB: 75, iconA: "calendar", iconB: "cake",
        caption: 'My birthday is <span class="hl">in</span> May. It’s <span class="hl">on</span> the fifth of May.' },
      { labelA: "Summer", labelB: "Winter", valueA: 75, valueB: 75, iconA: "sun", iconB: "snowflake",
        caption: 'It’s <span class="hl">hot and sunny</span> in summer, but it’s <span class="hl">cold and snowy</span> in winter.' },
      { labelA: "Spring", labelB: "Autumn", valueA: 75, valueB: 75, iconA: "flower", iconB: "leaf",
        caption: 'Flowers grow <span class="hl">in spring</span>. Leaves fall <span class="hl">in autumn</span>.' },
      { labelA: "What’s the weather like?", labelB: "It’s rainy!", valueA: 75, valueB: 75, iconA: "cloud", iconB: "umbrella",
        caption: 'What’s the weather <span class="hl">like</span>? — It’s <span class="hl">rainy</span>. Take an umbrella!' }
    ],
    COMPARE_ICON_COLORS: {
      calendar: "var(--rule-c)", sun: "var(--rule-d)", flower: "var(--rule-a)", cloud: "var(--rule-b)",
      cake: "var(--rule-a)", snowflake: "var(--rule-b)", leaf: "var(--rule-c)", umbrella: "var(--rule-a)"
    }
  },
  'food-drink': {
    // Countable and uncountable nouns (a / an, some, any, there is / are)
    // and ordering food in a restaurant.
    RULES: [
      { name: "Countable nouns", formula: "You can count them: one cookie, two cookies · a / an for one, -s for more", color: "var(--rule-a)",
        examples: [["banana","s"],["cookie","s"],["potato","es"]] },
      { name: "Uncountable nouns", formula: "You can’t count them: water, bread, rice, juice, sugar, salt · no a / an, no -s", color: "var(--rule-c)",
        examples: [["water"," (not a water)"],["bread"," (not breads)"],["rice"," (not rices)"]] },
      { name: "some in positive sentences", formula: "There are some + plural · There’s some + uncountable", color: "var(--rule-b)",
        examples: [["There are"," some sugar cookies."],["There’s"," some juice too."],["There’s"," some rice."]] },
      { name: "any in questions and negatives", formula: "Are there any…? · Is there any…? · There aren’t any… · There isn’t any…", color: "var(--rule-d)",
        examples: [["Are there"," any cookies?"],["Is there"," any water to drink?"],["There isn’t"," any bread."]] },
      { name: "Is there a…? / Is there an…?", formula: "One countable thing: a + consonant (a banana) · an + vowel (an apple)", color: "var(--rule-a)",
        examples: [["Is there"," a banana?"],["No, there isn’t"," a banana."],["But there is"," an apple."]] },
      { name: "In a restaurant", formula: "Waiter: Can I help you? · Are you ready to order? · What would you like to drink?", color: "var(--rule-c)",
        examples: [["Can I have"," a chicken sandwich, please?"],["I’ll have"," a cheese pizza, please."],["I’d like"," water, please."]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "cookies (countable)", labelB: "bread (uncountable)", valueA: 75, valueB: 75, iconA: "biscuits", iconB: "bread",
        caption: 'There are <span class="hl">some</span> cookies and there’s <span class="hl">some</span> bread.' },
      { labelA: "an apple", labelB: "some apples", valueA: 45, valueB: 85, iconA: "apple", iconB: "apple",
        caption: 'There’s <span class="hl">an</span> apple. There are <span class="hl">some</span> apples.' },
      { labelA: "some juice", labelB: "any water?", valueA: 75, valueB: 75, iconA: "juice", iconB: "water",
        caption: 'There’s <span class="hl">some</span> juice, but there isn’t <span class="hl">any</span> water.' },
      { labelA: "Can I have some soup?", labelB: "I’ll have a pizza!", valueA: 75, valueB: 75, iconA: "bowl", iconB: "pizza",
        caption: 'Can I <span class="hl">have</span> some soup, <span class="hl">please</span>? — <span class="hl">I’ll have</span> a pizza, please.' }
    ],
    COMPARE_ICON_COLORS: {
      // Food colours: a red apple, golden bread, orange juice, and a
      // water blue (the palette has no blue, so it's a literal).
      biscuits: "var(--timer)", bread: "var(--rule-d)", apple: "var(--error)", juice: "var(--timer)",
      water: "#6FA3C7", bowl: "var(--rule-a)", pizza: "var(--rule-d)"
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
