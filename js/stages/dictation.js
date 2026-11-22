import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { getCurrentLesson } from '../lessons.js';
import { DICTATION_SENTENCES } from '../content/dictation.js';
import { printActivity } from './activityPrint.js';

/* =========================================================
   STAGE 6 — RUNNING DICTATION (added 2026-11-22)
   The board explains the game; "Print sentences" gives the teacher
   the six sentences in big type on one page, with dashed lines to cut
   along, to stick round the room. Afterwards the teacher reveals the
   sentences one at a time (or all at once) so pairs can check.

   File names for the stages added after Free practice don't carry a
   number (the games that follow kept their old file numbers when
   they moved up two places).
========================================================= */

export function renderDictation(){
  const list = document.getElementById('dictList');
  list.innerHTML = DICTATION_SENTENCES.map((text, i) => {
    const on = state.dictRevealed.has(i);
    return `<li class="dict-item${on ? ' revealed' : ''}" data-i="${i}" tabindex="0" role="button" aria-pressed="${on}">
      <span class="dict-num">${i + 1}</span>
      <span class="dict-text">${escapeHtml(text)}</span>
      <span class="dict-hidden" aria-hidden="true">Tap to show</span>
    </li>`;
  }).join('');
  syncRevealAll();
}

function syncRevealAll(){
  const all = DICTATION_SENTENCES.every((_, i) => state.dictRevealed.has(i));
  document.getElementById('dictRevealAllBtn').textContent = all ? 'Hide all' : 'Show all';
}

function toggle(li){
  const i = Number(li.dataset.i);
  state.dictRevealed.has(i) ? state.dictRevealed.delete(i) : state.dictRevealed.add(i);
  const on = state.dictRevealed.has(i);
  li.classList.toggle('revealed', on);
  li.setAttribute('aria-pressed', String(on));
  syncRevealAll();
}

const list = document.getElementById('dictList');
list.addEventListener('click', (e) => { const li = e.target.closest('.dict-item'); if(li) toggle(li); });
list.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const li = e.target.closest('.dict-item');
  if(li){ e.preventDefault(); toggle(li); }
});
document.getElementById('dictRevealAllBtn').addEventListener('click', () => {
  const all = DICTATION_SENTENCES.every((_, i) => state.dictRevealed.has(i));
  DICTATION_SENTENCES.forEach((_, i) => all ? state.dictRevealed.delete(i) : state.dictRevealed.add(i));
  renderDictation();
});

// One A4 page: six strips of big text with dashed cut lines between.
document.getElementById('dictPrintBtn').addEventListener('click', () => {
  const lesson = getCurrentLesson();
  printActivity(`
    <div class="pa-dictation">
      <p class="pa-small">Running dictation &middot; ${escapeHtml(lesson.title)} &middot; cut along the dashed lines</p>
      ${DICTATION_SENTENCES.map((t, i) => `
        <div class="pa-strip"><span class="pa-strip-num">${i + 1}</span><span class="pa-strip-text">${escapeHtml(t)}</span></div>`).join('')}
    </div>`);
});

document.getElementById('dictBackBtn').addEventListener('click', () => goToStage(5));
document.getElementById('dictNextBtn').addEventListener('click', () => goToStage(7));
