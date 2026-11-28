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
  },
  'amusement-park': {
    AIM_EXAMPLES: [
      { icon: 'coaster', sentenceHtml: 'I <span class="hl">went</span> on a roller coaster. It was <span class="hl">exciting</span>!' },
      { icon: 'carousel', sentenceHtml: 'She <span class="hl">rode</span> the merry-go-round. She was <span class="hl">bored</span>.' },
      { icon: 'ghost', sentenceHtml: 'We <span class="hl">entered</span> a haunted house. We were <span class="hl">scared</span>!' }
    ]
  },
  'party-fun': {
    AIM_EXAMPLES: [
      { icon: 'balloons', sentenceHtml: 'I<span class="hl">’ll</span> buy the balloons for the party.' },
      { icon: 'pizza', sentenceHtml: 'Who <span class="hl">will</span> order the pizza? Dave <span class="hl">will</span> order the pizza.' },
      { icon: 'music', sentenceHtml: '<span class="hl">Will</span> Rosa choose the music? No, she <span class="hl">won’t</span>.' }
    ]
  },
  'at-school': {
    AIM_EXAMPLES: [
      { icon: 'pencil', sentenceHtml: 'What have you got? I<span class="hl">’ve got</span> a colouring pencil.' },
      { icon: 'gluestick', sentenceHtml: 'What has she got? She<span class="hl">’s got</span> a glue stick.' },
      { icon: 'pizza', sentenceHtml: 'What do you want? I <span class="hl">want</span> pizza. Tom <span class="hl">wants</span> fish.' }
    ]
  },
  'months-weather': {
    AIM_EXAMPLES: [
      { icon: 'calendar', sentenceHtml: 'When’s your birthday? It’s <span class="hl">in</span> May. It’s <span class="hl">on</span> the fifth of May.' },
      { icon: 'sun', sentenceHtml: 'What’s the weather like today? It’s <span class="hl">sunny</span> and <span class="hl">hot</span>.' },
      { icon: 'snowflake', sentenceHtml: 'My favourite season is <span class="hl">winter</span>. It’s cold and snowy in December.' }
    ]
  },
  'food-drink': {
    AIM_EXAMPLES: [
      { icon: 'apple', sentenceHtml: 'Is there <span class="hl">an</span> apple? Yes, there is. And there are <span class="hl">some</span> bananas too.' },
      { icon: 'plate', sentenceHtml: 'Is there <span class="hl">any</span> bread? No, there <span class="hl">isn’t any</span> bread. But there’s <span class="hl">some</span> rice.' },
      { icon: 'pizza', sentenceHtml: 'Are you ready to order? Yes. <span class="hl">I’ll have</span> a cheese pizza, <span class="hl">please</span>.' }
    ]
  },
  'at-the-buffet': {
    AIM_EXAMPLES: [
      { icon: 'plate', sentenceHtml: 'What <span class="hl">did</span> you <span class="hl">have</span> for breakfast? I <span class="hl">had</span> scrambled eggs and grapefruit juice.' },
      { icon: 'apple', sentenceHtml: 'How did the fruit salad <span class="hl">taste</span>? <span class="hl">It tasted</span> sweet.' },
      { icon: 'chili', sentenceHtml: 'How did the chicken wings taste? <span class="hl">They tasted</span> spicy.' }
    ]
  },
  'at-the-market': {
    AIM_EXAMPLES: [
      { icon: 'grapes', sentenceHtml: 'He<span class="hl">’s got some</span> grapes, but he <span class="hl">hasn’t got any</span> mushrooms.' },
      { icon: 'cheese', sentenceHtml: '<span class="hl">Have</span> you <span class="hl">got any</span> cheese? Yes, I <span class="hl">have</span>.' },
      { icon: 'milk', sentenceHtml: '<span class="hl">Has</span> she <span class="hl">got any</span> milk? No, she <span class="hl">hasn’t</span>.' }
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
