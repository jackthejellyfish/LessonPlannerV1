/* =========================================================
   LESSON CONTENT — Stage 9 (Practice Questions / worksheet)
   Four sets each progressively freer (gap fill → unscramble →
   sentence writing → free writing).
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with the correct comparative.",
        questions:[
          {prompt:"The Nile is ___ than the Thames. (long)", answer:"longer"},
          {prompt:"A cheetah is ___ than a horse. (fast)", answer:"faster"},
          {prompt:"My bag is ___ than yours. (heavy)", answer:"heavier"},
          {prompt:"Summer is ___ than spring. (hot)", answer:"hotter"},
          {prompt:"This exercise is ___ than the last. (easy)", answer:"easier"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Click the words in the correct order to build each sentence.",
        questions:[
          {chips:["My","sister","is","taller","than","me","."],answer:"My sister is taller than me ."},
          {chips:["The","red","car","is","faster","than","the","blue","one","."],answer:"The red car is faster than the blue one ."},
          {chips:["It","is","hotter","in","July","than","in","May","."],answer:"It is hotter in July than in May ."},
          {chips:["This","exercise","is","harder","than","the","first","."],answer:"This exercise is harder than the first ."},
          {chips:["Dogs","are","noisier","than","cats","."],answer:"Dogs are noisier than cats ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full comparative sentence using the word given.",
        questions:[
          {prompt:'Write a sentence using "bigger".',    hint:'___ is bigger than ___.'},
          {prompt:'Write a sentence using "more tired".',hint:'I am more tired than ___.'},
          {prompt:'Write a sentence using "better".',    hint:'___ is better than ___ because…'},
          {prompt:'Write a sentence using "closer".',    hint:'My ___ is closer than ___ to ___.'},
          {prompt:'Write a sentence using "more expensive".',hint:'___ is more expensive than ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences comparing two things. Use as many comparatives as you can.",
        questions:[
          {prompt:"Compare two animals. Write at least 3 sentences."},
          {prompt:"Compare two foods you like. Write at least 3 sentences."},
          {prompt:"Compare two places you know. Write at least 3 sentences."},
        ]},
    ]
  },
  health: {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with should or shouldn't.",
        questions:[
          {prompt:"She's got a fever. She ___ stay in bed. (should)", answer:"should"},
          {prompt:"He's eaten five burgers. He ___ eat so much. (shouldn't)", answer:"shouldn't"},
          {prompt:"I've got a toothache. I ___ see a dentist. (should)", answer:"should"},
          {prompt:"They're tired, but it's a school night. They ___ stay up late. (shouldn't)", answer:"shouldn't"},
          {prompt:"We've got sore throats. We ___ drink some hot tea. (should)", answer:"should"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Click the words in the correct order to build each sentence.",
        questions:[
          {chips:["He","should","take","some","medicine","."],answer:"He should take some medicine ."},
          {chips:["She","shouldn't","eat","too","much","."],answer:"She shouldn't eat too much ."},
          {chips:["I","should","see","a","dentist","."],answer:"I should see a dentist ."},
          {chips:["We","should","drink","some","hot","tea","."],answer:"We should drink some hot tea ."},
          {chips:["They","shouldn't","stay","up","late","."],answer:"They shouldn't stay up late ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence giving advice with the word given.",
        questions:[
          {prompt:'Write a sentence using "should".',      hint:'___ should ___.'},
          {prompt:'Write a sentence using "shouldn’t".', hint:'___ shouldn’t ___.'},
          {prompt:'Write a sentence giving advice for a headache.', hint:'You should ___.'},
          {prompt:'Write a sentence giving advice for a sore throat.', hint:'You should ___.'},
          {prompt:'Write a sentence about something you shouldn’t do when you are ill.', hint:'When you are ill, you shouldn’t ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences using should/shouldn't as much as you can.",
        questions:[
          {prompt:"Write about a time you were ill. What was the matter, and what did you do? Write at least 3 sentences."},
          {prompt:"Give a friend advice about staying healthy. Write at least 3 sentences using should/shouldn't."},
          {prompt:"Compare two illnesses you know. What should you do for each one? Write at least 3 sentences."},
        ]},
    ]
  },
  'comparatives-superlatives': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with the correct comparative or superlative.",
        questions:[
          {prompt:"The Nile is ___ river in the world. (long)", answer:"the longest"},
          {prompt:"A cheetah is ___ than a horse. (fast)", answer:"faster"},
          {prompt:"This is ___ day of the year. (hot)", answer:"the hottest"},
          {prompt:"My bag is ___ than yours. (heavy)", answer:"heavier"},
          {prompt:"She is ___ student in the class. (good)", answer:"the best"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Click the words in the correct order to build each sentence.",
        questions:[
          {chips:["My","sister","is","taller","than","me","."],answer:"My sister is taller than me ."},
          {chips:["Everest","is","the","tallest","mountain","."],answer:"Everest is the tallest mountain ."},
          {chips:["It","is","hotter","in","July","than","in","May","."],answer:"It is hotter in July than in May ."},
          {chips:["That","was","the","worst","film","ever","."],answer:"That was the worst film ever ."},
          {chips:["Gold","is","more","expensive","than","silver","."],answer:"Gold is more expensive than silver ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence using the word given.",
        questions:[
          {prompt:'Write a sentence using "bigger".',               hint:'___ is bigger than ___.'},
          {prompt:'Write a sentence using "the biggest".',          hint:'___ is the biggest ___ in ___.'},
          {prompt:'Write a sentence using "better".',               hint:'___ is better than ___ because\u2026'},
          {prompt:'Write a sentence using "the most beautiful".',   hint:'___ is the most beautiful ___ I know.'},
          {prompt:'Write a sentence using "more expensive".',       hint:'___ is more expensive than ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3\u20135 sentences. Use comparatives AND superlatives.",
        questions:[
          {prompt:"Compare three animals. Which is the biggest? Write at least 3 sentences."},
          {prompt:"Compare three foods you like. Which is the best? Write at least 3 sentences."},
          {prompt:"Compare three places you know. Which is the most beautiful? Write at least 3 sentences."},
        ]},
    ]
  },
  'will-wont': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with will or won\u2019t.",
        questions:[
          {prompt:"It\u2019s very cloudy. I think it ___ rain. (will)", answer:"will"},
          {prompt:"He never studies, so he ___ pass the test. (won\u2019t)", answer:"won\u2019t"},
          {prompt:"Don\u2019t worry \u2014 I ___ tell anyone. (won\u2019t)", answer:"won\u2019t"},
          {prompt:"She ___ be twelve next birthday. (will)", answer:"will"},
          {prompt:"It\u2019s freezing outside. You ___ need a coat. (will)", answer:"will"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Click the words in the correct order to build each sentence.",
        questions:[
          {chips:["I","will","call","you","tomorrow","."],answer:"I will call you tomorrow ."},
          {chips:["She","won't","be","late","again","."],answer:"She won't be late again ."},
          {chips:["Will","you","help","me","please","?"],answer:"Will you help me please ?"},
          {chips:["They","will","win","the","match","."],answer:"They will win the match ."},
          {chips:["We","won't","forget","your","birthday","."],answer:"We won't forget your birthday ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence about the future.",
        questions:[
          {prompt:'Write a sentence using "will".',                  hint:'Tomorrow I will ___.'},
          {prompt:'Write a sentence using "won\u2019t".',            hint:'Next week I won\u2019t ___.'},
          {prompt:'Write a question using "Will".',                  hint:'Will you ___?'},
          {prompt:'Write a promise using "won\u2019t".',             hint:'I promise I won\u2019t ___.'},
          {prompt:'Write a prediction about the year 2100.',         hint:'In 2100, people will ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3\u20135 sentences using will and won\u2019t as much as you can.",
        questions:[
          {prompt:"What will you do next weekend? Write at least 3 sentences."},
          {prompt:"What will your life be like in ten years? Write at least 3 sentences."},
          {prompt:"Make three predictions about the future of your city. Write at least 3 sentences."},
        ]},
    ]
  },
  'present-perfect': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with have or has.",
        questions:[
          {prompt:"I ___ visited Japan twice. (have)", answer:"have"},
          {prompt:"She ___ finished her homework. (has)", answer:"has"},
          {prompt:"They ___ never eaten sushi. (have)", answer:"have"},
          {prompt:"My brother ___ broken his arm. (has)", answer:"has"},
          {prompt:"___ you ever ridden a horse? (Have)", answer:"Have"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Click the words in the correct order to build each sentence.",
        questions:[
          {chips:["I","have","visited","Japan","twice","."],answer:"I have visited Japan twice ."},
          {chips:["She","has","finished","her","homework","."],answer:"She has finished her homework ."},
          {chips:["Have","you","ever","eaten","sushi","?"],answer:"Have you ever eaten sushi ?"},
          {chips:["They","haven't","arrived","yet","."],answer:"They haven't arrived yet ."},
          {chips:["He","has","never","been","to","London","."],answer:"He has never been to London ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence in the present perfect.",
        questions:[
          {prompt:'Write a sentence using "have visited".',      hint:'I have visited ___.'},
          {prompt:'Write a sentence using "has finished".',      hint:'___ has finished ___.'},
          {prompt:'Write a sentence using "have never".',        hint:'I have never ___.'},
          {prompt:'Write a question using "Have you ever".',     hint:'Have you ever ___?'},
          {prompt:'Write a sentence using "hasn\u2019t".',       hint:'___ hasn\u2019t ___ yet.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3\u20135 sentences using the present perfect as much as you can.",
        questions:[
          {prompt:"Write about three things you have done this year. Write at least 3 sentences."},
          {prompt:"Write about three things you have never done, but would like to. Write at least 3 sentences."},
          {prompt:"Interview a partner: what have they done that you haven\u2019t? Write at least 3 sentences."},
        ]},
    ]
  },
  'amusement-park': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with the past simple or the correct -ing / -ed adjective.",
        questions:[
          {prompt:"Yesterday I ___ a 3D film. (watch)", answer:"watched"},
          {prompt:"We ___ on a roller coaster. (go)", answer:"went"},
          {prompt:"She ___ the merry-go-round. (ride)", answer:"rode"},
          {prompt:"The haunted house was ___. (scary / scared)", answer:"scary"},
          {prompt:"The film was great. I was ___. (amazing / amazed)", answer:"amazed"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Click the words in the correct order to build each sentence.",
        questions:[
          {chips:["What","did","you","do","at","the","park","?"],answer:"What did you do at the park ?"},
          {chips:["I","saw","a","parade","."],answer:"I saw a parade ."},
          {chips:["How","was","the","roller","coaster","?"],answer:"How was the roller coaster ?"},
          {chips:["It","was","exciting","and","I","was","excited","."],answer:"It was exciting and I was excited ."},
          {chips:["We","visited","a","petting","zoo","."],answer:"We visited a petting zoo ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence about a day at an amusement park.",
        questions:[
          {prompt:'Write a sentence using "went on".',             hint:'I went on the ___.'},
          {prompt:'Write a sentence using "saw".',                 hint:'We saw ___.'},
          {prompt:'Write a sentence using "It was ___ing".',       hint:'The ___ was ___ing.'},
          {prompt:'Write a sentence using "I was ___ed".',         hint:'I was ___ed because ___.'},
          {prompt:'Write a question using "What did you".',        hint:'What did you ___?'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences using the past simple and -ing / -ed adjectives.",
        questions:[
          {prompt:"Imagine you went to an amusement park. What did you do? How was it? Write at least 3 sentences."},
          {prompt:"Write about the most exciting day out you remember. Where did you go and how did you feel? Write at least 3 sentences."},
          {prompt:"Ask four friends 'What did you do at the amusement park?'. What was the most popular attraction? Write at least 3 sentences."},
        ]},
    ]
  }
};

export const QS_SETS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  QS_SETS.length = 0;
  QS_SETS.push(...data.QS_SETS);
}
applyLesson('comparatives');
