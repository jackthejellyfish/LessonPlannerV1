import { sfxCorrect, sfxIncorrect } from './audio.js';
import { tickIconSVG, crossIconSVG } from './icons.js';

export function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function shuffle(array){
  const arr = array.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Shared "warm-up question" modal — used by every team-based game (Ball
// Pop, Star Defender, Spin Wheel, Billiards, Neon Arena, Fruit Ninja)
// before a turn. One consistent flow everywhere:
// big readable question -> "Check answer" -> big answer reveal -> a
// large tick/cross pair the student marks themselves with (see icons.js).
// Returns a Promise<boolean> (true = marked correct) — every game except
// Spin Wheel just uses this for self-assessment (the warm-up doesn't gate
// play); Spin Wheel is the one caller that branches its scoring on it.
export function showQuestionModal(prompt, answer, { correctLabel = 'Correct', wrongLabel = 'Incorrect', showFollowup = false } = {}){
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
