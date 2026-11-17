import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { sfxTimeUp } from '../audio.js';
import { WORD_BANK, SCAFFOLD_FRAMES, FREE_TASK } from '../content/stage5-free.js';

/* =========================================================
   STAGE 5 — FREE PRACTICE

   Two slides, one at a time, same idea as Stage 2:
     1. The task  — what to do, big, with an example exchange. Sized
                    to fit the stage without scrolling.
     2. Your turn — the timer and the task restated on the left, the
                    sentence starters and word bank (smaller) on the
                    right.
   This replaced a single page that put the timer, the task, five
   sentence frames and a 14-chip word bank on screen at once, with the
   word bank styled as the most prominent thing — per feedback, the
   TASK has to be the focus and the helper language secondary.

   Both slides stay in the DOM and are only shown/hidden, so a
   timer that is running keeps running if the teacher steps back.
========================================================= */
const FREE_SLIDES = [
  { id: 'freeSlideTask', label: 'The task' },
  { id: 'freeSlideGo', label: 'Your turn' }
];

function renderFreeTask(){
  const { headline, steps, example } = FREE_TASK;
  document.getElementById('freeTask').innerHTML = `
    <p class="free-eyebrow">Your task</p>
    <h3 class="free-headline">${escapeHtml(headline)}</h3>
    <div class="free-task-body">
    <ol class="free-task-steps">
      ${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
    </ol>
    <div class="free-example">
      <p class="free-example-label">Example</p>
      ${example.map(([who, line]) => `
        <div class="free-bubble ${who === 'A' ? 'a' : 'b'}">
          <span class="free-bubble-who">${escapeHtml(who)}</span>
          <span class="free-bubble-text">${escapeHtml(line)}</span>
        </div>`).join('')}
    </div>
    </div>
  `;
  document.getElementById('freeGoTask').textContent = headline;
  document.getElementById('freeGoSteps').innerHTML = steps.map(step => `<li>${escapeHtml(step)}</li>`).join('');
}

function wordBankChips(){
  return WORD_BANK.map(([base, comp]) => `
    <span class="wordbank-chip">${escapeHtml(base)} → <strong>${escapeHtml(comp)}</strong></span>
  `).join('');
}

// Name kept from before the rework: main.js calls this on every lesson
// switch and restart, so it re-renders everything lesson-specific here.
export function renderWordBank(){
  renderFreeTask();
  document.getElementById('wordBank').innerHTML = wordBankChips();
  renderFreeSlide();
}

export function renderScaffoldList(){
  document.getElementById('scaffoldList').innerHTML = SCAFFOLD_FRAMES.map(frame => `
    <div class="frame">${frame}</div>
  `).join('');
}

export function renderFreeSlide(){
  const index = Math.max(0, Math.min(state.freeIndex || 0, FREE_SLIDES.length - 1));
  state.freeIndex = index;
  FREE_SLIDES.forEach((slide, i) => {
    document.getElementById(slide.id).classList.toggle('hidden', i !== index);
  });

  // Named steps rather than anonymous dots: "1 The task · 2 Your
  // turn" tells a class where they are at a glance.
  const steps = document.getElementById('freeSteps');
  steps.innerHTML = FREE_SLIDES.map((slide, i) => `
    <button class="free-step ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}" data-i="${i}" type="button">
      <span class="free-step-num">${i + 1}</span>${slide.label}
    </button>
  `).join('');
  steps.querySelectorAll('.free-step').forEach(btn => {
    btn.addEventListener('click', () => { state.freeIndex = Number(btn.dataset.i); renderFreeSlide(); });
  });

  document.getElementById('freePrevSlideBtn').disabled = index === 0;
  document.getElementById('freeNextSlideBtn').textContent = index < FREE_SLIDES.length - 1
    ? `Next: ${FREE_SLIDES[index + 1].label} →`
    : 'Next: Ball Pop →';
}

document.getElementById('freePrevSlideBtn').addEventListener('click', () => {
  if(state.freeIndex > 0){ state.freeIndex--; renderFreeSlide(); }
});
document.getElementById('freeNextSlideBtn').addEventListener('click', () => {
  if(state.freeIndex >= FREE_SLIDES.length - 1){ goToStage(6); return; }
  state.freeIndex++;
  renderFreeSlide();
});

/* =========================================================
   MINIMALIST COUNTDOWN TIMER (Free practice)
   The minutes/seconds inputs ARE the display — there's no
   separate read-only element. While stopped they're plain
   editable fields; while running they're disabled but still
   show the live countdown, styled identically either way.
   Anchored to a start timestamp and recomputed from real
   elapsed time each tick, like the other timers on this page,
   so it can't drift even if the browser is briefly busy.
========================================================= */
// configuredMs is the duration the teacher last set (by typing or the ±
// minute buttons) while the clock was stopped — Reset always returns to
// this value, independent of however far remainingMs has counted down.
let stopwatch = { running: false, remainingMs: 0, startRemainingMs: 0, startTs: null, intervalId: null, configuredMs: 0 };

function padTwo(n){ return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }

// Reads the two inputs and returns the configured duration in ms.
function getConfiguredStopwatchMs(){
  const min = Math.max(0, Math.min(59, parseInt(document.getElementById('stopwatchMin').value, 10) || 0));
  const sec = Math.max(0, Math.min(59, parseInt(document.getElementById('stopwatchSec').value, 10) || 0));
  return (min * 60 + sec) * 1000;
}

// Forces both inputs into a valid, zero-padded two-digit state —
// called on blur and right before starting, so stray/partial typing
// never breaks the countdown.
function sanitizeStopwatchInputs(){
  const minEl = document.getElementById('stopwatchMin');
  const secEl = document.getElementById('stopwatchSec');
  minEl.value = padTwo(Math.min(59, parseInt(minEl.value, 10) || 0));
  secEl.value = padTwo(Math.min(59, parseInt(secEl.value, 10) || 0));
}

function updateStopwatchDisplay(){
  const remaining = stopwatch.running
    ? Math.max(0, stopwatch.startRemainingMs - (performance.now() - stopwatch.startTs))
    : stopwatch.remainingMs;
  const totalSeconds = Math.ceil(remaining / 1000);
  document.getElementById('stopwatchMin').value = padTwo(Math.floor(totalSeconds / 60));
  document.getElementById('stopwatchSec').value = padTwo(totalSeconds % 60);

  if(stopwatch.running && remaining <= 0){
    stopwatch.remainingMs = 0;
    stopwatch.running = false;
    clearInterval(stopwatch.intervalId);
    document.getElementById('stopwatchToggle').textContent = 'Start';
    document.getElementById('stopwatchMin').disabled = false;
    document.getElementById('stopwatchSec').disabled = false;
    sfxTimeUp();
  }
}

// Leaving Stage 5 pauses the countdown (goToStage calls this), like the
// Stage 3/4 timers - otherwise its time-up sound went off minutes later
// in the middle of a game. Start carries on from where it stopped.
export function pauseStopwatch(){
  if(!stopwatch.running) return;
  stopwatch.running = false;
  stopwatch.remainingMs = Math.max(0, stopwatch.startRemainingMs - (performance.now() - stopwatch.startTs));
  clearInterval(stopwatch.intervalId);
  document.getElementById('stopwatchToggle').textContent = 'Start';
}

document.getElementById('stopwatchToggle').addEventListener('click', () => {
  const btn = document.getElementById('stopwatchToggle');
  if(!stopwatch.running){
    sanitizeStopwatchInputs();
    if(stopwatch.remainingMs <= 0){
      // After a finished countdown the boxes read 00:00, so reading them
      // gave 0 and Start silently did nothing until Reset was pressed.
      // Fall back to the last duration the teacher set instead.
      const typed = getConfiguredStopwatchMs();
      stopwatch.remainingMs = typed > 0 ? typed : stopwatch.configuredMs;
      stopwatch.configuredMs = stopwatch.remainingMs;
    }
    if(stopwatch.remainingMs <= 0) return; // nothing to count down from

    stopwatch.running = true;
    stopwatch.startRemainingMs = stopwatch.remainingMs;
    stopwatch.startTs = performance.now();
    stopwatch.intervalId = setInterval(updateStopwatchDisplay, 200);
    document.getElementById('stopwatchMin').disabled = true;
    document.getElementById('stopwatchSec').disabled = true;
    btn.textContent = 'Pause';
  } else {
    pauseStopwatch();
  }
});

['stopwatchMin', 'stopwatchSec'].forEach(id => {
  const el = document.getElementById(id);
  // While typing: strip anything non-numeric and cap at 2 digits,
  // and keep remainingMs in sync so Start picks up the new value.
  el.addEventListener('input', () => {
    if(stopwatch.running) return;
    el.value = el.value.replace(/[^0-9]/g, '').slice(0, 2);
    stopwatch.remainingMs = getConfiguredStopwatchMs();
    stopwatch.configuredMs = stopwatch.remainingMs;
  });
  // On leaving the field: snap back to a clean zero-padded value.
  el.addEventListener('blur', () => {
    if(stopwatch.running) return;
    sanitizeStopwatchInputs();
    stopwatch.remainingMs = getConfiguredStopwatchMs();
    stopwatch.configuredMs = stopwatch.remainingMs;
  });
});

document.getElementById('stopwatchReset').addEventListener('click', () => {
  resetStopwatch();
});

export function resetStopwatch(){
  stopwatch.running = false;
  clearInterval(stopwatch.intervalId);
  document.getElementById('stopwatchMin').disabled = false;
  document.getElementById('stopwatchSec').disabled = false;
  // Always return to the last *configured* duration, not whatever the
  // inputs currently show — while running/paused those show live
  // countdown remainder, which is what made Reset look like a no-op.
  stopwatch.remainingMs = stopwatch.configuredMs;
  const totalSeconds = Math.ceil(stopwatch.remainingMs / 1000);
  document.getElementById('stopwatchMin').value = padTwo(Math.floor(totalSeconds / 60));
  document.getElementById('stopwatchSec').value = padTwo(totalSeconds % 60);
  document.getElementById('stopwatchToggle').textContent = 'Start';
}

const STOPWATCH_MAX_MS = (59 * 60 + 59) * 1000; // matches the 2-digit min/sec inputs

// Adds or subtracts one minute — works whether the countdown is running
// (nudges the live remaining time) or stopped (nudges the configured
// starting value and refreshes the two inputs to show it).
function adjustStopwatchMinutes(deltaMinutes){
  const deltaMs = deltaMinutes * 60000;
  if(stopwatch.running){
    stopwatch.startRemainingMs = Math.max(0, Math.min(STOPWATCH_MAX_MS, stopwatch.startRemainingMs + deltaMs));
    updateStopwatchDisplay();
  } else {
    stopwatch.remainingMs = Math.max(0, Math.min(STOPWATCH_MAX_MS, stopwatch.remainingMs + deltaMs));
    stopwatch.configuredMs = stopwatch.remainingMs;
    const totalSeconds = Math.ceil(stopwatch.remainingMs / 1000);
    document.getElementById('stopwatchMin').value = padTwo(Math.floor(totalSeconds / 60));
    document.getElementById('stopwatchSec').value = padTwo(totalSeconds % 60);
  }
}

document.getElementById('stopwatchPlus').addEventListener('click', () => adjustStopwatchMinutes(1));
document.getElementById('stopwatchMinus').addEventListener('click', () => adjustStopwatchMinutes(-1));

document.getElementById('freeBackBtn').addEventListener('click', () => goToStage(4));
document.getElementById('freeNextBtn').addEventListener('click', () => goToStage(6));

// Called once at startup so the inputs reflect the default configured
// duration before the learner ever touches Start.
export function initStopwatchDisplay(){
  stopwatch.remainingMs = getConfiguredStopwatchMs();
  stopwatch.configuredMs = stopwatch.remainingMs;
}
