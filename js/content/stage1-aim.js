/* =========================================================
   LESSON CONTENT — Stage 1 (Aim)
   Header text (title/objective) is plain metadata and lives in
   js/lessons.js instead; these are the 3 illustrated example
   sentences shown underneath it. `icon` selects a draw case in
   buildAimIcon() (js/stages/stage1-aim.js).
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    AIM_EXAMPLES: [
      { icon: 'elephant', sentenceHtml: 'The elephant is <span class="hl">bigger</span> than the mouse.' },
      { icon: 'mountain', sentenceHtml: 'The mountain is <span class="hl">taller</span> than the hill.' },
      { icon: 'speed', sentenceHtml: 'The cheetah is <span class="hl">faster</span> than the tortoise.' }
    ]
  },
  health: {
    AIM_EXAMPLES: [
      { icon: 'thermometer', sentenceHtml: 'I’ve got a fever. I <span class="hl">should</span> stay in bed.' },
      { icon: 'tooth', sentenceHtml: 'He’s got a toothache. He <span class="hl">should</span> see a dentist.' },
      { icon: 'plate', sentenceHtml: 'She’s got a stomach ache. She <span class="hl">shouldn’t</span> eat too much.' }
    ]
  },
  'comparatives-superlatives': {
    AIM_EXAMPLES: [
      { icon: 'elephant', sentenceHtml: 'The elephant is <span class="hl">bigger</span> than the mouse. It is <span class="hl">the biggest</span> animal here.' },
      { icon: 'mountain', sentenceHtml: 'Everest is <span class="hl">taller</span> than Fuji. It is <span class="hl">the tallest</span> mountain in the world.' },
      { icon: 'speed', sentenceHtml: 'A cheetah is <span class="hl">faster</span> than a horse. It is <span class="hl">the fastest</span> animal on land.' }
    ]
  },
  'will-wont': {
    AIM_EXAMPLES: [
      { icon: 'cloud', sentenceHtml: 'Look at those clouds. It <span class="hl">will</span> rain this afternoon.' },
      { icon: 'rocket', sentenceHtml: 'One day, people <span class="hl">will</span> live on Mars.' },
      { icon: 'trophy', sentenceHtml: 'He never practises, so he <span class="hl">won\u2019t</span> win the cup.' }
    ]
  },
  'present-perfect': {
    AIM_EXAMPLES: [
      { icon: 'suitcase', sentenceHtml: 'She <span class="hl">has visited</span> six different countries.' },
      { icon: 'book', sentenceHtml: 'I <span class="hl">have finished</span> my book already.' },
      { icon: 'trophy', sentenceHtml: 'They <span class="hl">have never won</span> a medal before.' }
    ]
  }
};

export const AIM_EXAMPLES = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  AIM_EXAMPLES.length = 0;
  AIM_EXAMPLES.push(...data.AIM_EXAMPLES);
}
applyLesson('comparatives');
