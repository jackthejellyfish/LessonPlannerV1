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
  }
};

export const AIM_EXAMPLES = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  AIM_EXAMPLES.length = 0;
  AIM_EXAMPLES.push(...data.AIM_EXAMPLES);
}
applyLesson('comparatives');
