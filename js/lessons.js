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
    freeIntro: 'Think of two people, animals, or things you know. Say or write five sentences comparing them, out loud with a partner.',
    pageTitle: 'Comparative Adjectives — Interactive Lesson',
    printRulesTitle: 'Comparative Adjectives — Rules Reference',
    printRulesSubtitle: 'Spelling rules for forming comparative adjectives',
    printWorksheetTitle: 'Comparative Adjectives — Practice Worksheet',
    printFooter: 'Comparative Adjectives — Interactive Lesson',
    mcQuestionTemplate: (word) => `What is the comparative of '${word}'?`
  },
  {
    id: 'health',
    title: 'Health: Should & Shouldn’t',
    tagline: 'Talk about symptoms and give advice with the modal verb should.',
    objective: 'By the end of this lesson, you will be able to talk about symptoms and give health advice using should and shouldn’t.',
    freeIntro: 'Think of a friend or family member. Say or write five sentences giving them health advice with should and shouldn’t, out loud with a partner.',
    pageTitle: 'Health: Should & Shouldn’t — Interactive Lesson',
    printRulesTitle: 'Health: Should & Shouldn’t — Rules Reference',
    printRulesSubtitle: 'Giving health advice with should / shouldn’t',
    printWorksheetTitle: 'Health: Should & Shouldn’t — Practice Worksheet',
    printFooter: 'Health: Should & Shouldn’t — Interactive Lesson',
    mcQuestionTemplate: (word) => `You've got ${word}. What should you do?`
  },
  {
    id: 'comparatives-superlatives',
    title: 'Comparatives & Superlatives',
    tagline: 'Compare two things \u2014 then say which one is the best of all.',
    objective: 'By the end of this lesson, you will be able to form comparative and superlative adjectives and use them to compare two or more things.',
    freeIntro: 'Think of three people, animals, or things you know. Say or write five sentences comparing them \u2014 use comparatives AND superlatives, out loud with a partner.',
    pageTitle: 'Comparatives & Superlatives \u2014 Interactive Lesson',
    printRulesTitle: 'Comparatives & Superlatives \u2014 Rules Reference',
    printRulesSubtitle: 'Spelling rules for comparative and superlative adjectives',
    printWorksheetTitle: 'Comparatives & Superlatives \u2014 Practice Worksheet',
    printFooter: 'Comparatives & Superlatives \u2014 Interactive Lesson',
    mcQuestionTemplate: (word) => `What are the comparative and superlative of '${word}'?`
  },
  {
    id: 'will-wont',
    title: 'Will & Won\u2019t',
    tagline: 'Talk about the future \u2014 predictions, promises and offers.',
    objective: 'By the end of this lesson, you will be able to talk about the future using will and won\u2019t.',
    freeIntro: 'Think about next year. Say or write five sentences about what you will and won\u2019t do, out loud with a partner.',
    pageTitle: 'Will & Won\u2019t \u2014 Interactive Lesson',
    printRulesTitle: 'Will & Won\u2019t \u2014 Rules Reference',
    printRulesSubtitle: 'Talking about the future with will and won\u2019t',
    printWorksheetTitle: 'Will & Won\u2019t \u2014 Practice Worksheet',
    printFooter: 'Will & Won\u2019t \u2014 Interactive Lesson',
    mcQuestionTemplate: (word) => `Choose the correct answer: ${word}`
  },
  {
    id: 'present-perfect',
    title: 'Present Perfect',
    tagline: 'Talk about your experiences and things that have already happened.',
    objective: 'By the end of this lesson, you will be able to use the present perfect (have/has + past participle) to talk about experiences.',
    freeIntro: 'Think about your life so far. Say or write five sentences about things you have and haven\u2019t done, out loud with a partner.',
    pageTitle: 'Present Perfect \u2014 Interactive Lesson',
    printRulesTitle: 'Present Perfect \u2014 Rules Reference',
    printRulesSubtitle: 'Talking about experience with have/has + past participle',
    printWorksheetTitle: 'Present Perfect \u2014 Practice Worksheet',
    printFooter: 'Present Perfect \u2014 Interactive Lesson',
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
// Five lessons now, and the four --rule accents would make card 5 a
// repeat of card 1 — so the cycle gets a fifth entry. --primary-dark is
// already in the palette (it is the button hover colour), so this adds a
// distinct card colour without inventing a new one for this screen.
const CARD_COLORS = ['var(--rule-a)', 'var(--rule-b)', 'var(--rule-c)', 'var(--rule-d)', 'var(--primary-dark)'];

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
