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
