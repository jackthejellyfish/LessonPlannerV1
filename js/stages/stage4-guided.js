import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml } from '../utils.js';
import { sfxCorrect, sfxIncorrect, sfxCountdownTick, sfxTimeUp } from '../audio.js';
import { burstFromElement } from '../particles.js';
import { setTimerRing, TIMER_RING_CIRCUMFERENCE } from '../timerRing.js';
import { SEMI_ITEMS } from '../content/stage4-guided.js';

/* =========================================================
   STAGE 4 — GUIDED (SEMI-CONTROLLED) PRACTICE
   Students reconstruct a sentence by clicking word chips in
   order. Reliable to auto-check because it's a fixed word
   order, unlike free-typed text. Now also timed and scored.
========================================================= */
export const SEMI_TIME_LIMIT = 30; // seconds per guided-practice sentence

export function startSemiTimer(){
  cancelSemiTimer();
  const arc = document.getElementById('semiTimerArc');
  const num = document.getElementById('semiTimerNum');
  setTimerRing(arc, num, SEMI_TIME_LIMIT, SEMI_TIME_LIMIT);

  const start = performance.now();
  let lastWhole = SEMI_TIME_LIMIT;

  function tick(now){
    const elapsed = (now - start) / 1000;
    const remaining = Math.max(0, SEMI_TIME_LIMIT - elapsed);
    const wholeSecond = Math.ceil(remaining);

    setTimerRing(arc, num, remaining, SEMI_TIME_LIMIT);

    if(wholeSecond !== lastWhole){
      lastWhole = wholeSecond;
      if(wholeSecond > 0 && wholeSecond <= 5) sfxCountdownTick(wholeSecond);
    }

    if(remaining <= 0){
      handleSemiTimeout();
      return;
    }
    state.semiTimerRAF = requestAnimationFrame(tick);
  }
  state.semiTimerRAF = requestAnimationFrame(tick);
}

export function cancelSemiTimer(){
  if(state.semiTimerRAF) cancelAnimationFrame(state.semiTimerRAF);
  state.semiTimerRAF = null;
}

function bumpSemiScore(){
  const el = document.getElementById('semiScoreDisplay');
  el.textContent = `Score: ${state.semiScore}`;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

export function loadSemiItem(){
  const item = SEMI_ITEMS[state.semiIndex];
  state.semiBank = shuffle(item.chips.map((text, i) => ({ text, id: i })));
  state.semiAnswer = [];
  state.semiChecked = false;
  document.getElementById('semiCounter').textContent = `Sentence ${state.semiIndex + 1} of ${SEMI_ITEMS.length}`;
  document.getElementById('semiProgressFill').style.width = (state.semiIndex / SEMI_ITEMS.length * 100) + '%';
  document.getElementById('semiScoreDisplay').textContent = `Score: ${state.semiScore}`;
  document.getElementById('semiFeedback').textContent = '';
  document.getElementById('semiFeedback').className = 'semi-feedback';
  document.getElementById('semiNext').classList.add('hidden');
  document.getElementById('answerStrip').classList.remove('correct', 'incorrect');
  renderSemi();
  startSemiTimer();
}

export function renderSemi(){
  const item = SEMI_ITEMS[state.semiIndex];

  const strip = document.getElementById('answerStrip');
  strip.classList.toggle('empty', state.semiAnswer.length === 0);
  strip.innerHTML = state.semiAnswer.map(chip =>
    `<button class="chip answer-chip" data-id="${chip.id}">${escapeHtml(chip.text)}</button>`
  ).join('');
  strip.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if(state.semiChecked) return;
      const id = Number(btn.dataset.id);
      const chip = state.semiAnswer.find(c => c.id === id);
      state.semiAnswer = state.semiAnswer.filter(c => c.id !== id);
      state.semiBank.push(chip);
      renderSemi();
    });
  });

  const bank = document.getElementById('chipBank');
  bank.innerHTML = state.semiBank.map(chip =>
    `<button class="chip" data-id="${chip.id}">${escapeHtml(chip.text)}</button>`
  ).join('');
  bank.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if(state.semiChecked) return;
      const id = Number(btn.dataset.id);
      const chip = state.semiBank.find(c => c.id === id);
      state.semiBank = state.semiBank.filter(c => c.id !== id);
      state.semiAnswer.push(chip);
      renderSemi();
    });
  });
}

// Clear puts the words back in the bank and nothing else. It used to
// reload the whole sentence, which also restarted the 30-second timer -
// so Clear doubled as a free "more time" button.
document.getElementById('semiReset').addEventListener('click', () => {
  if(state.semiChecked) return;
  state.semiBank = shuffle(SEMI_ITEMS[state.semiIndex].chips.map((text, i) => ({ text, id: i })));
  state.semiAnswer = [];
  document.getElementById('semiFeedback').textContent = '';
  document.getElementById('semiFeedback').className = 'semi-feedback';
  renderSemi();
});

document.getElementById('semiCheck').addEventListener('click', () => {
  if(state.semiChecked) return;
  const item = SEMI_ITEMS[state.semiIndex];
  const built = state.semiAnswer.map(c => c.text).join(' ');
  const target = item.chips.join(' ');
  const feedback = document.getElementById('semiFeedback');
  const strip = document.getElementById('answerStrip');

  // Retrigger the animation even if the same class was just applied,
  // by removing it, forcing a reflow, then re-adding it.
  strip.classList.remove('correct', 'incorrect');
  void strip.offsetWidth;

  if(built === target){
    cancelSemiTimer();
    state.semiScore += 10;
    sfxCorrect();
    burstFromElement(strip, document.getElementById('stage4'), '#5C9C7C');
    bumpSemiScore();

    feedback.textContent = '✓ Correct — nice work!';
    feedback.className = 'semi-feedback correct';
    strip.classList.add('correct');
    state.semiChecked = true;
    document.getElementById('semiNext').classList.remove('hidden');
  } else {
    sfxIncorrect();
    feedback.textContent = '✗ Not quite the right order yet — keep trying.';
    feedback.className = 'semi-feedback incorrect';
    strip.classList.add('incorrect');
    setTimeout(() => strip.classList.remove('incorrect'), 500);
  }
});

function handleSemiTimeout(){
  if(state.semiChecked) return;
  state.semiChecked = true;
  const item = SEMI_ITEMS[state.semiIndex];
  const strip = document.getElementById('answerStrip');
  const feedback = document.getElementById('semiFeedback');

  strip.classList.add('incorrect');
  feedback.textContent = `⏰ Time's up! The sentence was: "${item.chips.join(' ')}"`;
  feedback.className = 'semi-feedback incorrect';
  sfxTimeUp();
  document.getElementById('semiNext').classList.remove('hidden');
}

document.getElementById('semiNext').addEventListener('click', () => {
  if(state.semiIndex < SEMI_ITEMS.length - 1){
    state.semiIndex++;
    loadSemiItem();
  } else {
    cancelSemiTimer();
    document.getElementById('semiTimerArc').style.strokeDashoffset = TIMER_RING_CIRCUMFERENCE;
    document.getElementById('semiTimerNum').textContent = '';
    document.getElementById('semiProgressFill').style.width = '100%';
    document.getElementById('semiCounter').textContent = 'All sentences complete!';
    document.getElementById('chipBank').innerHTML = '';
    document.getElementById('semiFeedback').textContent = `Final score: ${state.semiScore} points. Click "Next: Free practice" when you're ready.`;
    document.getElementById('semiFeedback').className = 'semi-feedback correct';
    document.querySelector('#stage4 .semi-actions').classList.add('hidden');
  }
});

document.getElementById('guidedBackBtn').addEventListener('click', () => goToStage(3));
document.getElementById('guidedNextBtn').addEventListener('click', () => goToStage(5));
