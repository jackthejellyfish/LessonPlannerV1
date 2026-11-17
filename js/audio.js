/* =========================================================
   SOUND EFFECTS
   Synthesised with the Web Audio API — no audio files to load,
   so it works instantly and offline. The AudioContext is only
   created on first use because browsers block audio until a
   user has interacted with the page at least once.

   Everything routes through ONE master gain (see ensureAudio).
   That matters for more than tidiness: mute used to be checked
   only at the moment a sound was created, so toggling mute left
   every already-scheduled note — a 4-note fanfare, a bomb's decay
   tail — playing to its end. Muting now ducks the master gain, so
   it silences what is already sounding, instantly and for real.
========================================================= */
import { state } from './state.js';

let audioCtx = null;
let masterGain = null;

export function ensureAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = state.muted ? 0 : 1;
    masterGain.connect(audioCtx.destination);
  }
  // Browsers suspend the context if it was created before a real user
  // gesture; without this the first sounds of a lesson are dropped.
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Every voice connects here, never straight to destination. Exported as
// audioOut() because several games build their own bespoke oscillators
// (Ball Pop's mega-explosion, Neon Arena's hit sounds, Star Defender's
// noise bursts); those are tuned and worth keeping as they are, but they
// must still route through this bus or mute cannot stop them mid-sound.
function out(){
  ensureAudio();
  return masterGain;
}
export function audioOut(){ return out(); }

// Called by the mute button. A short ramp rather than a hard set, so
// cutting the sound doesn't itself produce a click.
export function applyMuteState(){
  if(!audioCtx) return;
  const now = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setTargetAtTime(state.muted ? 0 : 1, now, 0.015);
}

/* =========================================================
   PRIMITIVES
========================================================= */

// `when` is an offset in seconds from now, used to build arpeggios.
export function beep(freq, duration = 0.15, type = 'sine', volume = 0.15, when = 0){
  if(state.muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ctx.currentTime + when;
  // A tiny attack ramp instead of starting at full volume: an
  // instantaneous jump from silence is a step discontinuity, which is
  // audible as a click on every single note.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(out());
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// Two oscillators a few cents apart. The slow beating between them is
// what makes a synthesized note sound warm rather than like a test
// tone — the cheapest big upgrade available to this whole sound set.
function beepFat(freq, duration = 0.15, type = 'triangle', volume = 0.15, when = 0, detune = 7){
  if(state.muted) return;
  const ctx = ensureAudio();
  const start = ctx.currentTime + when;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(out());
  for(const cents of [-detune, detune]){
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

// Shared filtered-noise source — the raw material for impacts, whooshes
// and anything percussive.
// One decaying-noise buffer per duration, made on first use and reused.
// Every impact used to fill a fresh buffer sample by sample on the main
// thread (14,000+ random numbers for a 0.3s burst) in the middle of a
// game frame. Some durations scale with an `intensity`, so the length is
// rounded UP to the next 50ms: the cache stays a dozen or so entries, and
// the gain envelope below still ends the sound at the exact duration.
const noiseBuffers = new Map();
function getNoiseBuffer(ctx, rawDuration){
  const duration = Math.ceil(rawDuration * 20) / 20;
  let buffer = noiseBuffers.get(duration);
  if(!buffer){
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < frames; i++){
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    noiseBuffers.set(duration, buffer);
  }
  return buffer;
}

function noiseBurst({ duration, filterType, freqStart, freqEnd, volume, when = 0, q = 1 }){
  if(state.muted) return;
  const ctx = ensureAudio();
  const start = ctx.currentTime + when;
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx, duration);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freqStart, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), start + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  noise.connect(filter).connect(gain).connect(out());
  noise.start(start);
}

/* =========================================================
   THE SOUND SET
========================================================= */

// Answer marked correct. Was two flat beeps; now a rising major triad
// with a little sparkle on top — it should feel like a small reward,
// since in a team game this is the moment the class reacts to.
export function sfxCorrect(){
  [523.25, 659.25, 783.99].forEach((f, i) => beepFat(f, 0.22, 'triangle', 0.17, i * 0.07));
  beep(1567.98, 0.16, 'sine', 0.07, 0.17);
}

// Answer marked wrong. Deliberately short and soft — a harsh buzzer
// aimed at a teenager in front of the whole class is a teaching
// problem, not a sound design one. Falling tone, over quickly.
export function sfxIncorrect(){
  beepFat(220, 0.16, 'triangle', 0.14);
  beepFat(196, 0.22, 'triangle', 0.13, 0.1);
}

export function sfxTick(){ beep(900, 0.045, 'square', 0.05); }

// The last seconds of a timed round. Pitch climbs as time runs out, so
// the urgency is audible without anyone having to watch the clock.
// `remaining` is whole seconds left.
export function sfxCountdownTick(remaining){
  const steps = Math.max(0, Math.min(5, 5 - remaining));
  beep(760 + steps * 110, 0.05 + steps * 0.012, 'square', 0.05 + steps * 0.012);
}

export function sfxTimeUp(){
  beepFat(160, 0.4, 'sawtooth', 0.18);
  noiseBurst({ duration: 0.3, filterType: 'lowpass', freqStart: 900, freqEnd: 120, volume: 0.16 });
}

// End of a whole game. The one moment that should feel like an event:
// a four-chord rise with a noise swell underneath it.
export function sfxFanfare(){
  const chords = [
    [392.00, 493.88, 587.33],
    [440.00, 554.37, 659.25],
    [493.88, 622.25, 739.99],
    [587.33, 739.99, 880.00]
  ];
  chords.forEach((chord, i) => {
    chord.forEach(f => beepFat(f, 0.42, 'triangle', 0.1, i * 0.13));
  });
  noiseBurst({ duration: 0.5, filterType: 'highpass', freqStart: 400, freqEnd: 5000, volume: 0.09, when: 0.36 });
}

// A blade/swipe. Band-passed noise sweeping downward reads as something
// moving fast past the listener.
export function sfxWhoosh({ intensity = 1 } = {}){
  noiseBurst({
    duration: 0.16 + intensity * 0.05,
    filterType: 'bandpass',
    freqStart: 1800 + intensity * 900,
    freqEnd: 400,
    volume: 0.1 + intensity * 0.05,
    q: 1.4
  });
}

// A sword slash through fruit. Three layers, because a slash is three
// things happening at once and any one alone just sounds like static:
//
//   1. the blade cutting air — a TIGHT band of noise (high Q) sweeping
//      down fast. The narrow band is what makes it read as a blade
//      rather than the broad "whoosh" above, which is a thrown object.
//   2. the edge ringing — two detuned high partials with an immediate
//      decay. This is the metallic "shing", and it's the layer that
//      makes it sound like a sword rather than a knife through paper.
//   3. the flesh giving way — a soft low thud a hair later, which is
//      the fruit half of "slicing fruit" rather than the sword half.
//
// `intensity` nudges brightness and length together, so a combo slice
// can sound sharper than a single one.
export function sfxSlash({ intensity = 1 } = {}){
  noiseBurst({
    duration: 0.1 + intensity * 0.05,
    filterType: 'bandpass',
    freqStart: 4200 + intensity * 1800,
    freqEnd: 700,
    volume: 0.13 + intensity * 0.05,
    q: 3.4
  });
  // Detuned pair rather than one tone: the slight beating between them
  // is what reads as metal.
  beep(2650, 0.07, 'triangle', 0.045);
  beep(2680, 0.065, 'triangle', 0.04);
  noiseBurst({
    duration: 0.11,
    filterType: 'lowpass',
    freqStart: 620,
    freqEnd: 130,
    volume: 0.1,
    when: 0.015
  });
}

// Filtered-noise burst — a generic "impact/destroy" sound. `intensity`
// (roughly 0-1.5) scales duration, brightness, and volume together, so a
// bigger hit sounds both louder AND punchier, not just louder. Now with
// a pitched thump underneath, which is what gives an impact its weight.
export function sfxImpact(intensity = 1){
  noiseBurst({
    duration: 0.2 + intensity * 0.15,
    filterType: 'lowpass',
    freqStart: 800 + intensity * 1400,
    freqEnd: 200,
    volume: 0.26 + intensity * 0.1
  });
  if(state.muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const start = ctx.currentTime;
  osc.frequency.setValueAtTime(180 * (0.8 + intensity * 0.4), start);
  osc.frequency.exponentialRampToValueAtTime(45, start + 0.18 + intensity * 0.1);
  gain.gain.setValueAtTime(0.18 + intensity * 0.08, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22 + intensity * 0.12);
  osc.connect(gain).connect(out());
  osc.start(start);
  osc.stop(start + 0.36 + intensity * 0.12);
}

// Ascending arpeggio — a generic "reward/pickup/bonus" sound. `freqs` is
// the note list (low to high reads as "collecting/climbing"); `stagger`
// is the gap between notes in seconds.
export function sfxRisingChime(freqs, { duration = 0.13, type = 'triangle', volume = 0.16, stagger = 0.06 } = {}){
  freqs.forEach((f, i) => beepFat(f, duration, type, volume, i * stagger));
}

// Combo ladder. Each step up the combo transposes the same shape higher,
// so a long chain audibly climbs — the sound itself tells a student
// they're on a streak, which a flat repeated ding never does.
export function sfxCombo(comboCount){
  const step = Math.min(comboCount, 8);
  const root = 523.25 * Math.pow(2, (step - 2) / 6);
  [0, 4, 7].forEach((semi, i) => {
    beepFat(root * Math.pow(2, semi / 12), 0.14, 'triangle', 0.15, i * 0.045);
  });
}
