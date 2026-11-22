import { goToStage } from '../navigation.js';
import { scramble, seededRandom, escapeHtml } from '../utils.js';
import { getCurrentLesson } from '../lessons.js';
import { QS_SETS } from '../content/stage9-questions.js';

/* =========================================================
   STAGE 9 — PRACTICE QUESTIONS (the worksheet on the board)
   Reworked 2026-11-22: the class works on the printed worksheet
   and the board shows the same sheet, every section side by side
   on one screen (no tabs, no scrolling at 1280x720). The teacher
   taps a question to reveal its answer, or a section's Show
   button for all of them. Free writing is on paper only.

   The unscramble words come out in the same order on the board
   and on paper: they are scrambled from a seed (the sentence
   itself), never with a fresh random shuffle.
========================================================= */

// "si:qi" for every revealed answer. Kept while the lesson lasts, so
// leaving the stage and coming back doesn't hide answers already shown.
let revealed = new Set();

// The sets shown on the board. Free writing has no answer to show.
const boardSets = () => QS_SETS.map((set, si) => ({ set, si })).filter(({ set }) => set.type !== 'free');

export function initQs(){
  revealed = new Set();
  renderQsBoard();
}

// The unscramble chips in their worksheet order. Closing punctuation
// stays at the end: a "." or "?" first in the line just looks broken.
export function scrambledChips(q){
  const chips = q.chips.slice();
  const tail = [];
  while(chips.length > 2 && /^[.?!,]$/.test(chips[chips.length - 1])) tail.unshift(chips.pop());
  return scramble(chips, { rand: seededRandom(q.answer) }).concat(tail);
}

// Unscramble answers are stored chip by chip ("Who will set the table ?"),
// which reads oddly; close the gap before punctuation.
function tidyChips(text){ return text.replace(/ ([?.!,])/g, '$1'); }

// A gap-fill prompt with its blank, and its "(word)" cue set apart.
function gapHtml(q){
  const cueMatch = q.prompt.match(/\s*(\([^)]*\))\s*$/);
  const body = cueMatch ? q.prompt.slice(0, cueMatch.index) : q.prompt;
  const parts = body.split('___');
  const html = parts.map((p, i) => escapeHtml(p) + (i < parts.length - 1
    ? `<span class="ws-blank"><span class="ws-ans">${escapeHtml(q.answer)}</span></span>`
    : '')).join('');
  return html + (cueMatch ? ` <span class="ws-cue">${escapeHtml(cueMatch[1])}</span>` : '');
}

function itemHtml(set, si, q, qi){
  let body;
  if(set.type === 'gap'){
    body = `<p class="ws-item-text">${gapHtml(q)}</p>`;
  } else if(set.type === 'scramble'){
    body = `<p class="ws-item-text ws-chunks">${scrambledChips(q).map(escapeHtml).join('<span class="ws-slash"> / </span>')}</p>
      <p class="ws-line"><span class="ws-ans">${escapeHtml(tidyChips(q.answer))}</span></p>`;
  } else {
    // No single right answer: the reveal is the sentence frame to use.
    body = `<p class="ws-item-text">${escapeHtml(q.prompt)}</p>
      <p class="ws-line"><span class="ws-ans"><span class="ws-eg">e.g.</span> ${escapeHtml(q.hint)}</span></p>`;
  }
  const on = revealed.has(`${si}:${qi}`);
  return `<li class="ws-item${on ? ' revealed' : ''}" data-si="${si}" data-qi="${qi}" tabindex="0" role="button" aria-pressed="${on}">
    <span class="ws-item-num">${qi + 1}</span>
    <div class="ws-item-body">${body}</div>
  </li>`;
}

function sectionAllShown(si){
  return QS_SETS[si].questions.every((_, qi) => revealed.has(`${si}:${qi}`));
}

function renderQsBoard(){
  const area = document.getElementById('qsQuestionArea');
  area.innerHTML = boardSets().map(({ set, si }, n) => `
    <section class="ws-col ws-col-${set.type}" data-si="${si}">
      <header class="ws-col-head">
        <span class="ws-col-num">${n + 1}</span>
        <div class="ws-col-titles">
          <h3 class="ws-col-title">${escapeHtml(set.label)}</h3>
          <p class="ws-col-desc">${escapeHtml(set.desc)}</p>
        </div>
        <button class="ws-col-reveal" type="button" data-si="${si}">${sectionAllShown(si) ? 'Hide' : 'Show'}</button>
      </header>
      <ol class="ws-list">${set.questions.map((q, qi) => itemHtml(set, si, q, qi)).join('')}</ol>
    </section>`).join('');
  syncRevealButtons();
}

// Updates the classes and button labels in place, so revealing an answer
// never rebuilds the board (and never replays every answer's fade).
function syncRevealButtons(){
  const area = document.getElementById('qsQuestionArea');
  area.querySelectorAll('.ws-item').forEach(li => {
    const on = revealed.has(`${li.dataset.si}:${li.dataset.qi}`);
    li.classList.toggle('revealed', on);
    li.setAttribute('aria-pressed', String(on));
  });
  area.querySelectorAll('.ws-col-reveal').forEach(btn => {
    btn.textContent = sectionAllShown(Number(btn.dataset.si)) ? 'Hide' : 'Show';
  });
  const all = boardSets().every(({ si }) => sectionAllShown(si));
  document.getElementById('qsRevealAllBtn').textContent = all ? 'Hide all answers' : 'Show all answers';
}

function setSection(si, on){
  QS_SETS[si].questions.forEach((_, qi) => {
    on ? revealed.add(`${si}:${qi}`) : revealed.delete(`${si}:${qi}`);
  });
}

function toggleItem(li){
  const key = `${li.dataset.si}:${li.dataset.qi}`;
  revealed.has(key) ? revealed.delete(key) : revealed.add(key);
  syncRevealButtons();
}

const area = document.getElementById('qsQuestionArea');
area.addEventListener('click', (e) => {
  const sectionBtn = e.target.closest('.ws-col-reveal');
  if(sectionBtn){
    const si = Number(sectionBtn.dataset.si);
    setSection(si, !sectionAllShown(si));
    syncRevealButtons();
    return;
  }
  const li = e.target.closest('.ws-item');
  if(li) toggleItem(li);
});
area.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const li = e.target.closest('.ws-item');
  if(!li) return;
  e.preventDefault();
  toggleItem(li);
});

document.getElementById('qsRevealAllBtn').addEventListener('click', () => {
  const on = !boardSets().every(({ si }) => sectionAllShown(si));
  boardSets().forEach(({ si }) => setSection(si, on));
  syncRevealButtons();
});

document.getElementById('qsPrintBtn').addEventListener('click',()=>{
  renderPrintableWorksheet();
  document.getElementById('printableWorksheet').classList.add('active-print');
  document.getElementById('printableRules').classList.remove('active-print');
  window.print();
  setTimeout(()=>document.getElementById('printableWorksheet').classList.remove('active-print'),500);
});

function renderPrintableWorksheet(){
  const lesson=getCurrentLesson();
  const ws=document.getElementById('printableWorksheet');
  ws.innerHTML=`
    <h1>${lesson.printWorksheetTitle}</h1>
    <p class="print-subtitle">Name: __________________ &nbsp;&nbsp; Class: __________________ &nbsp;&nbsp; Date: __________________</p>
    ${QS_SETS.map((set,si)=>`
      <div class="ws-set-title">Section ${si+1}: ${set.label}</div>
      <div class="ws-set-label">${escapeHtml(set.desc)}</div>
      ${set.questions.map((q,qi)=>`
        <div class="ws-q">
          <div class="ws-q-prompt">${qi+1}. ${escapeHtml(set.type==='scramble'?scrambledChips(q).join(' / '):(q.prompt||''))}</div>
          <div class="ws-answer-line"></div>
          ${set.type==='free'?'<div class="ws-answer-line"></div><div class="ws-answer-line"></div>':''}
        </div>`).join('')}
    `).join('')}
    <div class="answer-key">
      <h3>Answer Key (Gap Fill &amp; Unscramble)</h3>
      <ol>${QS_SETS[0].questions.map(q=>`<li>${escapeHtml(q.answer)}</li>`).join('')}
          ${QS_SETS[1].questions.map(q=>`<li>${escapeHtml(tidyChips(q.answer))}</li>`).join('')}</ol>
    </div>
    <p class="print-footer">${lesson.printFooter}</p>`;
}

document.getElementById('qsBackBtn').addEventListener('click', () => goToStage(8));
