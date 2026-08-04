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
  }
};

export const QS_SETS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  QS_SETS.length = 0;
  QS_SETS.push(...data.QS_SETS);
}
applyLesson('comparatives');
