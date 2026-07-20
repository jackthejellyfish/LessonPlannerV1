/* =========================================================
   SOUND EFFECTS
   Synthesised with the Web Audio API — no audio files to load,
   so it works instantly and offline. The AudioContext is only
   created on first use because browsers block audio until a
   user has interacted with the page at least once.
========================================================= */
import { state } from './state.js';

let audioCtx = null;
export function ensureAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function beep(freq, duration = 0.15, type = 'sine', volume = 0.15, when = 0){
  if(state.muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain).connect(ctx.destination);
  const start = ctx.currentTime + when;
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function sfxCorrect(){ [700, 950].forEach((f, i) => beep(f, 0.16, 'triangle', 0.18, i * 0.09)); }
export function sfxIncorrect(){ beep(160, 0.28, 'sawtooth', 0.2); }
export function sfxTick(){ beep(900, 0.045, 'square', 0.05); }
export function sfxTimeUp(){ beep(120, 0.35, 'sawtooth', 0.22); }
