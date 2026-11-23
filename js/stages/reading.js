import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { getCurrentLesson } from '../lessons.js';
import { READING } from '../content/reading.js';
import { printActivity } from './activityPrint.js';

/* =========================================================
   STAGE 8 — READING (added 2026-11-23)
   The reading on the left; six question cards on the right. The six
   questions are printed big, cut out and stuck round the room for
   students to find; each student has the reading and an answer sheet
   (one double-sided page). On the board the teacher taps a card once
   to show its question and again to show the answer, for checking.

   Two printouts:
   - "Print reading & answer sheet": page 1 the reading, page 2 the
     answer sheet (numbers 1-6 with lines, no questions): print it
     double-sided.
   - "Print questions": the six questions as big strips to cut out.
========================================================= */
// 0 = hidden, 1 = question showing, 2 = question and answer showing.
function level(i){ return state.readingSteps[i] || 0; }

export function renderReading(){
  document.getElementById('readingText').innerHTML = `
    <h3 class="rd-title">${escapeHtml(READING.title)}</h3>
    ${READING.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}`;
  document.getElementById('readingQuestions').innerHTML = READING.questions.map((x, i) => `
    <li class="rd-q" data-i="${i}" data-level="${level(i)}" tabindex="0" role="button">
      <span class="rd-q-num">${i + 1}</span>
      <span class="rd-q-body">
        <span class="rd-q-hidden">Tap to show question ${i + 1}</span>
        <span class="rd-q-text">${escapeHtml(x.q)}</span>
        <span class="rd-q-answer">${escapeHtml(x.a)}</span>
      </span>
    </li>`).join('');
  syncAllButton();
}

function setLevel(i, n){
  state.readingSteps[i] = n;
  const li = document.querySelector(`.rd-q[data-i="${i}"]`);
  if(li) li.dataset.level = String(n);
}

// One button steps the whole set: show the questions, then the answers,
// then hide them all again.
function syncAllButton(){
  const lowest = Math.min(...READING.questions.map((_, i) => level(i)));
  document.getElementById('readingAllBtn').textContent =
    lowest === 0 ? 'Show all questions' : lowest === 1 ? 'Show all answers' : 'Hide all';
}

const list = document.getElementById('readingQuestions');
function step(li){
  const i = Number(li.dataset.i);
  setLevel(i, (level(i) + 1) % 3);
  syncAllButton();
}
list.addEventListener('click', (e) => { const li = e.target.closest('.rd-q'); if(li) step(li); });
list.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const li = e.target.closest('.rd-q');
  if(li){ e.preventDefault(); step(li); }
});
document.getElementById('readingAllBtn').addEventListener('click', () => {
  const lowest = Math.min(...READING.questions.map((_, i) => level(i)));
  const next = lowest === 0 ? 1 : lowest === 1 ? 2 : 0;
  READING.questions.forEach((_, i) => setLevel(i, next));
  syncAllButton();
});

// Page 1: the reading. Page 2: the answer sheet (numbers and lines only).
document.getElementById('readingPrintBtn').addEventListener('click', () => {
  const lesson = getCurrentLesson();
  printActivity(`
    <div class="pa-reading">
      <h1>${escapeHtml(READING.title)}</h1>
      <p class="pa-subtitle">${escapeHtml(lesson.title)} &middot; Reading</p>
      <div class="pa-text">${READING.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>
    </div>
    <div class="pa-answersheet">
      <h1>Answer sheet</h1>
      <p class="pa-subtitle">${escapeHtml(READING.title)}</p>
      <p class="pa-line">My name: ______________________________ &nbsp;&nbsp; Class: __________</p>
      <p class="pa-instructions">Find the questions around the classroom. Write your answers here.</p>
      <ol class="pa-answer-list">
        ${READING.questions.map(() => '<li><div class="pa-answer-line"></div><div class="pa-answer-line"></div></li>').join('')}
      </ol>
    </div>`);
});

// The six questions, big, to cut out and stick round the room.
document.getElementById('readingQuestionsPrintBtn').addEventListener('click', () => {
  printActivity(`
    <div class="pa-dictation">
      <p class="pa-small">${escapeHtml(READING.title)} &middot; reading questions &middot; cut along the dashed lines</p>
      ${READING.questions.map((x, i) => `
        <div class="pa-strip"><span class="pa-strip-num">${i + 1}</span><span class="pa-strip-text">${i + 1}. ${escapeHtml(x.q)}</span></div>`).join('')}
    </div>`);
});

document.getElementById('readingBackBtn').addEventListener('click', () => goToStage(7));
document.getElementById('readingNextBtn').addEventListener('click', () => goToStage(9));
