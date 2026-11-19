/* =========================================================
   LESSON REGISTRY
   The one place that knows which grammar topics this app can
   teach and the handful of lesson-specific strings that don't
   belong in any one stage's content array (print titles, the
   Stage 3 question template, the page <title>). Swappable
   question banks/word lists themselves live in js/content/*.js —
   js/main.js's applyLessonContent() calls every content file's
   own applyLesson(id) and reads pageTitle from here.
========================================================= */
import { state } from './state.js';

export const LESSONS = [
  {
    id: 'comparatives',
    title: 'Comparative Adjectives',
    tagline: 'Compare two people, animals, or things — bigger, faster, more interesting.',
    objective: 'By the end of this lesson, you will be able to form comparative adjectives correctly and use them to compare two things.',
    pageTitle: 'Comparative Adjectives — Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Comparative Adjectives — Rules Reference',
    printRulesSubtitle: 'Spelling rules for forming comparative adjectives',
    printWorksheetTitle: 'Comparative Adjectives — Practice Worksheet',
    printFooter: 'Comparative Adjectives — Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `What is the comparative of '${word}'?`
  },
  {
    id: 'health',
    title: 'Health: Should & Shouldn’t',
    tagline: 'Talk about symptoms and give advice with the modal verb should.',
    objective: 'By the end of this lesson, you will be able to talk about symptoms and give health advice using should and shouldn’t.',
    pageTitle: 'Health: Should & Shouldn’t — Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Health: Should & Shouldn’t — Rules Reference',
    printRulesSubtitle: 'Giving health advice with should / shouldn’t',
    printWorksheetTitle: 'Health: Should & Shouldn’t — Practice Worksheet',
    printFooter: 'Health: Should & Shouldn’t — Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `You've got ${word}. What should you do?`
  },
  {
    id: 'comparatives-superlatives',
    title: 'Comparatives & Superlatives',
    tagline: 'Compare two things \u2014 then say which one is the best of all.',
    objective: 'By the end of this lesson, you will be able to form comparative and superlative adjectives and use them to compare two or more things.',
    pageTitle: 'Comparatives & Superlatives \u2014 Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Comparatives & Superlatives \u2014 Rules Reference',
    printRulesSubtitle: 'Spelling rules for comparative and superlative adjectives',
    printWorksheetTitle: 'Comparatives & Superlatives \u2014 Practice Worksheet',
    printFooter: 'Comparatives & Superlatives \u2014 Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `What are the comparative and superlative of '${word}'?`
  },
  {
    id: 'will-wont',
    title: 'Will & Won\u2019t',
    tagline: 'Talk about the future \u2014 predictions, promises and offers.',
    objective: 'By the end of this lesson, you will be able to talk about the future using will and won\u2019t.',
    pageTitle: 'Will & Won\u2019t \u2014 Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Will & Won\u2019t \u2014 Rules Reference',
    printRulesSubtitle: 'Talking about the future with will and won\u2019t',
    printWorksheetTitle: 'Will & Won\u2019t \u2014 Practice Worksheet',
    printFooter: 'Will & Won\u2019t \u2014 Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  },
  {
    id: 'present-perfect',
    title: 'Present Perfect',
    tagline: 'Talk about your experiences and things that have already happened.',
    objective: 'By the end of this lesson, you will be able to use the present perfect (have/has + past participle) to talk about experiences.',
    pageTitle: 'Present Perfect \u2014 Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Present Perfect \u2014 Rules Reference',
    printRulesSubtitle: 'Talking about experience with have/has + past participle',
    printWorksheetTitle: 'Present Perfect \u2014 Practice Worksheet',
    printFooter: 'Present Perfect \u2014 Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  },
  {
    id: 'amusement-park',
    title: 'At the Amusement Park',
    tagline: 'Say what you did with the past simple — and how it was with -ing / -ed adjectives.',
    objective: 'By the end of this lesson, you will be able to say what you did at an amusement park using the past simple, and describe how it was and how you felt with -ing and -ed adjectives.',
    pageTitle: 'At the Amusement Park — Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'At the Amusement Park — Rules Reference',
    printRulesSubtitle: 'Past simple (regular and irregular) and -ing / -ed adjectives',
    printWorksheetTitle: 'At the Amusement Park — Practice Worksheet',
    printFooter: 'At the Amusement Park — Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  },
  {
    id: 'party-fun',
    title: 'Party Fun: Who Will…?',
    tagline: 'Plan a party — who will do each job? Ask and answer with will and won’t.',
    objective: 'By the end of this lesson, you will be able to plan a party and ask and answer questions about it with will, won’t, Who will…? and What will you do…?',
    pageTitle: 'Party Fun: Who Will…? — Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Party Fun: Who Will…? — Rules Reference',
    printRulesSubtitle: 'Future plans with will: positive, negative, Wh- and Yes/No questions',
    printWorksheetTitle: 'Party Fun: Who Will…? — Practice Worksheet',
    printFooter: 'Party Fun: Who Will…? — Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  },
  {
    // From the Unit 2 "At School" pages: In the Classroom (have got /
    // has got) and At the Cafeteria (want / wants).
    id: 'at-school',
    title: 'At School: I’ve Got… / I Want…',
    tagline: 'Classroom things and cafeteria food — say what you’ve got and what you want.',
    objective: 'By the end of this lesson, you will be able to ask and answer What have you got? / What has she got? and What do you want? / What does he want? about classroom things and lunch.',
    pageTitle: 'At School: I’ve Got… / I Want… — Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'At School — Rules Reference',
    printRulesSubtitle: 'have got / has got and want / wants: statements and questions',
    printWorksheetTitle: 'At School — Practice Worksheet',
    printFooter: 'At School: I’ve Got… / I Want… — Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  },
  {
    id: 'months-weather',
    title: 'Months, Weather and Seasons',
    tagline: 'Birthdays, dates and the weather — talk about the months and seasons of the year.',
    objective: 'By the end of this lesson, you will be able to say the months and dates (It’s on the fifth of May), describe the weather (It’s sunny) and talk about the seasons (It’s cold in winter).',
    pageTitle: 'Months, Weather and Seasons — Teacher Jack\u2019s Lesson Planner',
    printRulesTitle: 'Months, Weather and Seasons — Rules Reference',
    printRulesSubtitle: 'Months and dates (in / on), weather words and the four seasons',
    printWorksheetTitle: 'Months, Weather and Seasons — Practice Worksheet',
    printFooter: 'Months, Weather and Seasons — Teacher Jack\u2019s Lesson Planner',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  }
];

export function getLesson(id){
  return LESSONS.find(l => l.id === id) || LESSONS[0];
}

// One accent color per card, cycling through the same 4 rule colors used
// throughout the rest of the app (rule cards, aim-page examples) rather
// than inventing a new palette just for this screen. `onSelect(id)` is
// supplied by main.js, which owns the actual lesson-switch/full-reset
// flow — this module only knows how to list and render lessons.
// Seven lessons now (the seventh reuses card 1's colour, which sits on
// the row above it, so no two neighbours match), and the four --rule accents would make cards 5-6
// repeats of cards 1-2 — so the cycle gets two more entries, both
// already in the palette (--primary-dark is the button hover colour,
// --timer the countdown amber), rather than inventing new colours.
const CARD_COLORS = ['var(--rule-a)', 'var(--rule-b)', 'var(--rule-c)', 'var(--rule-d)', 'var(--primary-dark)', 'var(--timer)'];

export function renderLessonCards(onSelect){
  const container = document.getElementById('lessonCards');
  container.innerHTML = LESSONS.map((lesson, i) => `
    <button class="lesson-card" type="button" style="--card-color:${CARD_COLORS[i % CARD_COLORS.length]}" data-id="${lesson.id}">
      <span class="lesson-card-dot"></span>
      <h2>${lesson.title}</h2>
      <p>${lesson.tagline}</p>
      <span class="lesson-card-cta">Start this lesson →</span>
    </button>
  `).join('');
  container.querySelectorAll('.lesson-card').forEach(btn => {
    btn.addEventListener('click', () => onSelect(btn.dataset.id));
  });
}

export function getCurrentLesson(){
  return getLesson(state.currentLesson);
}
