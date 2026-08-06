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

/* ---- Shared "families" every canvas game's own noise-burst/arpeggio sfx
   were independently reinventing (Star Defender's sfxEnemyDestroy, Ball
   Pop's sfxMegaExplosion, Neon Arena's sfxNeonDestroy/sfxNeonBomb; Star
   Defender's sfxPickupCollect, Ball Pop's sfxGem/sfxMultiplier, Neon
   Arena's sfxNeonPickup) — same technique, re-typed each time. These two
   generalize the technique for new code; the already-shipped per-game
   versions above are left as-is (see PROJECT_STATE.md — migrating
   working, tuned sound is unnecessary risk for no user-facing benefit). */

// Filtered-noise burst — a generic "impact/destroy" sound. `intensity`
// (roughly 0-1.5) scales duration, brightness, and volume together, so a
// bigger hit sounds both louder AND punchier, not just louder.
export function sfxImpact(intensity = 1){
  if(state.muted) return;
  const ctx = ensureAudio();
  const duration = 0.2 + intensity * 0.15;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++){
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800 + intensity * 1400;
  const gain = ctx.createGain();
  gain.gain.value = 0.28 + intensity * 0.1;
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
}

// Ascending arpeggio — a generic "reward/pickup/bonus" sound. `freqs` is
// the note list (low to high reads as "collecting/climbing"); `stagger`
// is the gap between notes in seconds.
export function sfxRisingChime(freqs, { duration = 0.13, type = 'triangle', volume = 0.16, stagger = 0.06 } = {}){
  freqs.forEach((f, i) => beep(f, duration, type, volume, i * stagger));
}
