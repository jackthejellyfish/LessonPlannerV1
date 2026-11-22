import { sfxCorrect, sfxIncorrect } from './audio.js';
import { tickIconSVG, crossIconSVG } from './icons.js';

export function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function shuffle(array, rand = Math.random){
  const arr = array.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A repeatable random number source (mulberry32) seeded from a string, so
// the same sentence always scrambles the same way: the worksheet on the
// board and the printed copy on the desks match, even after a refresh.
export function seededRandom(seedText){
  let h = 1779033703 ^ seedText.length;
  for(let i = 0; i < seedText.length; i++){
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Word chips for an "unscramble" task. A plain shuffle can land on the
// right order (or nearly), which just hands students the answer
// (feedback 2026-11-22), so this keeps shuffling until the words read
// differently, the sentence's first word is not first, and at least half
// the words have moved. `textOf` reads an item's word (chips can be
// objects); compared as text so swapping two identical words ("the" and
// "the") doesn't count as scrambled.
export function scramble(items, { textOf = (x) => x, rand = Math.random } = {}){
  const words = items.map(textOf);
  if(new Set(words).size < 2) return items.slice();
  const target = words.join(' ');
  const need = Math.ceil(items.length / 2);
  let best = null, bestScore = -1;
  for(let tries = 0; tries < 60; tries++){
    const arr = shuffle(items, rand);
    const got = arr.map(textOf);
    if(got.join(' ') === target) continue;
    const moved = got.filter((w, i) => w !== words[i]).length;
    const firstMoved = items.length < 3 || got[0] !== words[0];
    if(moved >= need && firstMoved) return arr;
    const score = moved + (firstMoved ? items.length : 0);
    if(score > bestScore){ best = arr; bestScore = score; }
  }
  return best || items.slice().reverse();
}

// Shared "warm-up question" modal — used by every team-based game (Ball
// Pop, Star Defender, Spin Wheel, Billiards, Neon Arena, Fruit Ninja)
// before a turn. One consistent flow everywhere:
// big readable question -> "Check answer" -> big answer reveal -> a
// large tick/cross pair the student marks themselves with (see icons.js).
// Returns a Promise<boolean> (true = marked correct) — every game except
// Spin Wheel just uses this for self-assessment (the warm-up doesn't gate
// play); Spin Wheel is the one caller that branches its scoring on it.
//
// With `choices` ({ correct, options } from questionChoices.js) it is a
// multiple-choice question instead: the class taps an option, the right
// one lights up green (and a wrong pick red), the full answer shows,
// and Continue carries on. The app marks it, so there's no tick/cross.
export function showQuestionModal(prompt, answer, { correctLabel = 'Correct', wrongLabel = 'Incorrect', showFollowup = false, choices = null } = {}){
  if(choices) return showChoiceModal(prompt, answer, choices, showFollowup);
  return new Promise(resolve => {
    const modalBody = document.getElementById('popQuestionBody');
    modalBody.className = 'modal modal-question';
    modalBody.innerHTML = `
      <div class="modal-q-badge" aria-hidden="true">?</div>
      <h3 class="modal-q-text">${escapeHtml(prompt)}</h3>
      <div class="modal-check-row" id="modalCheckRow">
        <button class="btn btn-primary btn-check-answer" id="popCheckBtn" type="button">Check answer</button>
      </div>
      <div class="modal-answer-block hidden" id="popAnswerBlock">
        <div class="modal-answer-word">${escapeHtml(answer)}</div>
        ${showFollowup ? `<p class="modal-followup-text">Now make a sentence using <strong>${escapeHtml(answer)}</strong>.</p>` : ''}
        <div class="modal-judge-row">
          <button class="judge-btn judge-correct" id="popCorrectBtn" type="button">
            ${tickIconSVG()}<span>${escapeHtml(correctLabel)}</span>
          </button>
          <button class="judge-btn judge-wrong" id="popWrongBtn" type="button">
            ${crossIconSVG()}<span>${escapeHtml(wrongLabel)}</span>
          </button>
        </div>
      </div>
    `;
    document.getElementById('popQuestionOverlay').classList.remove('hidden');

    document.getElementById('popCheckBtn').addEventListener('click', () => {
      document.getElementById('modalCheckRow').classList.add('hidden');
      document.getElementById('popAnswerBlock').classList.remove('hidden');
    });
    const finish = (correct) => {
      document.getElementById('popQuestionOverlay').classList.add('hidden');
      correct ? sfxCorrect() : sfxIncorrect();
      resolve(correct);
    };
    document.getElementById('popCorrectBtn').addEventListener('click', () => finish(true));
    document.getElementById('popWrongBtn').addEventListener('click', () => finish(false));
  });
}

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];
// "Now make a sentence using ..." only makes sense after a word or a
// short phrase, not after a whole sentence or "Yes, it's correct".
const isWordOrPhrase = (t) => t.trim().split(/\s+/).length <= 3 && !/[.?!,]/.test(t);
function showChoiceModal(prompt, answer, { correct, options }, showFollowup){
  return new Promise(resolve => {
    const modalBody = document.getElementById('popQuestionBody');
    modalBody.className = 'modal modal-question';
    // The full answer is only worth showing when it says more than the
    // option did ("No - 'My birthday is in May.'" after "No, it's wrong").
    const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const extra = norm(answer) !== norm(correct);
    modalBody.innerHTML = `
      <div class="modal-q-badge" aria-hidden="true">?</div>
      <h3 class="modal-q-text">${escapeHtml(prompt)}</h3>
      <div class="mc-choices${options.length > 2 ? ' mc-three' : ''}" id="popMcChoices">
        ${options.map((o, i) => `
          <button class="mc-choice" type="button" data-i="${i}">
            <span class="mc-letter">${CHOICE_LETTERS[i]}</span><span class="mc-text">${escapeHtml(o)}</span>
          </button>`).join('')}
      </div>
      <div class="modal-answer-block hidden" id="popAnswerBlock">
        <div class="mc-verdict" id="popMcVerdict"></div>
        ${extra ? `<div class="modal-answer-word">${escapeHtml(answer)}</div>` : ''}
        ${showFollowup && isWordOrPhrase(correct) ? `<p class="modal-followup-text">Now make a sentence using <strong>${escapeHtml(correct)}</strong>.</p>` : ''}
        <div class="modal-check-row">
          <button class="btn btn-primary btn-check-answer" id="popMcContinueBtn" type="button">Continue</button>
        </div>
      </div>
    `;
    document.getElementById('popQuestionOverlay').classList.remove('hidden');

    let picked = null;
    const buttons = Array.from(modalBody.querySelectorAll('.mc-choice'));
    buttons.forEach(btn => btn.addEventListener('click', () => {
      if(picked !== null) return;
      picked = options[Number(btn.dataset.i)];
      const right = picked === correct;
      buttons.forEach(b => {
        b.disabled = true;
        const o = options[Number(b.dataset.i)];
        if(o === correct) b.classList.add('is-correct');
        else if(b === btn) b.classList.add('is-wrong');
        else b.classList.add('is-dim');
      });
      const verdict = document.getElementById('popMcVerdict');
      verdict.textContent = right ? '\u2713 Correct!' : '\u2717 Not quite!';
      verdict.classList.add(right ? 'good' : 'bad');
      document.getElementById('popAnswerBlock').classList.remove('hidden');
      right ? sfxCorrect() : sfxIncorrect();
    }));
    document.getElementById('popMcContinueBtn').addEventListener('click', () => {
      document.getElementById('popQuestionOverlay').classList.add('hidden');
      resolve(picked === correct);
    });
  });
}
