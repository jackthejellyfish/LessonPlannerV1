/* =========================================================
   LESSON CONTENT — Stage 9 (Practice Questions / worksheet)
   Four sets each progressively freer (gap fill → unscramble →
   sentence writing → free writing).
========================================================= */
export const QS_SETS=[
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
];
