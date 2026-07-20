import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { sfxTimeUp } from '../audio.js';
import { WORD_BANK, SCAFFOLD_FRAMES } from '../content/stage5-free.js';

/* =========================================================
   STAGE 5 — FREE PRACTICE
========================================================= */

export function renderWordBank(){
  document.getElementById('wordBank').innerHTML = WORD_BANK.map(([base, comp]) => `
    <span class="wordbank-chip">${escapeHtml(base)} → <strong>${escapeHtml(comp)}</strong></span>
  `).join('');
}

export function renderScaffoldList(){
  document.getElementById('scaffoldList').innerHTML = SCAFFOLD_FRAMES.map(frame => `
    <div class="frame">${frame}</div>
  `).join('');
}

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

document.getElementById('stopwatchToggle').addEventListener('click', () => {
  const btn = document.getElementById('stopwatchToggle');
  if(!stopwatch.running){
    sanitizeStopwatchInputs();
    if(stopwatch.remainingMs <= 0){
      stopwatch.remainingMs = getConfiguredStopwatchMs();
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
    stopwatch.running = false;
    stopwatch.remainingMs = Math.max(0, stopwatch.startRemainingMs - (performance.now() - stopwatch.startTs));
    clearInterval(stopwatch.intervalId);
    btn.textContent = 'Start';
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
