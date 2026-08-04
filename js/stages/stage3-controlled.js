import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml } from '../utils.js';
import { sfxCorrect, sfxIncorrect, sfxTick, sfxTimeUp } from '../audio.js';
import { burstFromElement } from '../particles.js';
import { setTimerRing, TIMER_RING_CIRCUMFERENCE } from '../timerRing.js';
import { getCurrentLesson } from '../lessons.js';
import { MC_QUESTIONS } from '../content/stage3-controlled.js';

/* =========================================================
   STAGE 3 — CONTROLLED PRACTICE (multiple choice)
   Each question now runs against a countdown timer. Running
   out of time counts as a miss (no score), same as a wrong
   answer, and both funnel into finishMcQuestion() to advance.
========================================================= */
export const MC_TIME_LIMIT = 10;   // seconds per controlled-practice question

export function startMcTimer(){
  cancelMcTimer();
  const arc = document.getElementById('mcTimerArc');
  const num = document.getElementById('mcTimerNum');
  setTimerRing(arc, num, MC_TIME_LIMIT, MC_TIME_LIMIT);

  const start = performance.now();
  let lastWhole = MC_TIME_LIMIT;

  function tick(now){
    const elapsed = (now - start) / 1000;
    const remaining = Math.max(0, MC_TIME_LIMIT - elapsed);
    const wholeSecond = Math.ceil(remaining);

    setTimerRing(arc, num, remaining, MC_TIME_LIMIT);

    if(wholeSecond !== lastWhole){
      lastWhole = wholeSecond;
      if(wholeSecond > 0 && wholeSecond <= 5) sfxTick();
    }

    if(remaining <= 0){
      handleMcTimeout();
      return;
    }
    state.mcTimerRAF = requestAnimationFrame(tick);
  }
  state.mcTimerRAF = requestAnimationFrame(tick);
}

export function cancelMcTimer(){
  if(state.mcTimerRAF) cancelAnimationFrame(state.mcTimerRAF);
  state.mcTimerRAF = null;
}

export function renderMcQuestion(){
  state.mcAnswered = false;
  const q = MC_QUESTIONS[state.mcIndex];
  document.getElementById('mcCounter').textContent = `Question ${state.mcIndex + 1} of ${MC_QUESTIONS.length}`;
  document.getElementById('mcScore').textContent = `Score: ${state.mcScore}`;
  document.getElementById('mcProgressFill').style.width = (state.mcIndex / MC_QUESTIONS.length * 100) + '%';
  document.getElementById('mcQuestion').textContent = getCurrentLesson().mcQuestionTemplate(q.word);
  document.getElementById('mcFeedback').textContent = '';
  document.getElementById('mcFeedback').style.color = 'var(--muted)';

  const optionsEl = document.getElementById('mcOptions');
  optionsEl.innerHTML = shuffle(q.options).map(opt => `<button class="mc-option" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join('');
  optionsEl.querySelectorAll('.mc-option').forEach(btn => {
    btn.addEventListener('click', () => handleMcAnswer(btn, q));
  });

  startMcTimer();
}

function bumpMcScore(){
  const el = document.getElementById('mcScore');
  el.textContent = `Score: ${state.mcScore}`;
  el.classList.remove('pop');
  void el.offsetWidth; // force reflow so the animation can retrigger on back-to-back correct answers
  el.classList.add('pop');
}

function handleMcAnswer(btn, q){
  if(state.mcAnswered) return;
  state.mcAnswered = true;
  cancelMcTimer();

  const chosen = btn.dataset.opt;
  const isCorrect = chosen === q.correct;

  if(isCorrect){
    state.mcScore += 10;
    sfxCorrect();
    burstFromElement(btn, document.getElementById('stage3'), '#5C9C7C');
  } else {
    sfxIncorrect();
  }

  document.querySelectorAll('.mc-option').forEach(el => {
    el.disabled = true;
    if(el.dataset.opt === q.correct){
      el.classList.add('correct');
      el.textContent = '✓ ' + el.textContent;
    } else if(el === btn){
      el.classList.add('incorrect');
      el.textContent = '✗ ' + el.textContent;
    }
  });

  const feedback = document.getElementById('mcFeedback');
  feedback.textContent = isCorrect ? '✓ Correct!' : `✗ Not quite — the answer is '${q.correct}'.`;
  feedback.style.color = isCorrect ? 'var(--success)' : 'var(--error)';
  bumpMcScore();

  finishMcQuestion();
}

function handleMcTimeout(){
  if(state.mcAnswered) return;
  state.mcAnswered = true;
  const q = MC_QUESTIONS[state.mcIndex];

  document.querySelectorAll('.mc-option').forEach(el => {
    el.disabled = true;
    if(el.dataset.opt === q.correct){
      el.classList.add('correct');
      el.textContent = '✓ ' + el.textContent;
    }
  });

  const feedback = document.getElementById('mcFeedback');
  feedback.textContent = `⏰ Time's up! The answer was '${q.correct}'.`;
  feedback.style.color = 'var(--error)';
  sfxTimeUp();

  finishMcQuestion();
}

function finishMcQuestion(){
  setTimeout(() => {
    if(state.mcIndex < MC_QUESTIONS.length - 1){
      state.mcIndex++;
      renderMcQuestion();
    } else {
      cancelMcTimer();
      document.getElementById('mcProgressFill').style.width = '100%';
      document.getElementById('mcTimerArc').style.strokeDashoffset = TIMER_RING_CIRCUMFERENCE;
      document.getElementById('mcTimerNum').textContent = '';
      document.getElementById('mcQuestion').textContent = `All done! Final score: ${state.mcScore} points`;
      document.getElementById('mcOptions').innerHTML = '';
      document.getElementById('mcFeedback').style.color = 'var(--muted)';
      document.getElementById('mcFeedback').textContent = 'Click "Next: Guided practice" when you\'re ready.';
    }
  }, 1100);
}

document.getElementById('controlledBackBtn').addEventListener('click', () => goToStage(2));
document.getElementById('controlledNextBtn').addEventListener('click', () => goToStage(4));
