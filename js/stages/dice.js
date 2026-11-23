import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { ensureAudio, audioOut } from '../audio.js';
import { DICE_QUESTIONS } from '../content/dice.js';

/* =========================================================
   STAGE 9 — SPEAKING DICE (added 2026-11-23)
   Six questions, one for each face. The teacher clicks the dice; it
   tumbles (a 3D cube, transform-only animation) and lands on a number.
   That question lights up and opens with two helpful phrases and a
   small word bank; the class asks and answers it, then rolls again.

   Rolling the SAME number as the roll before puts a line through that
   question (it's done).

   The roll's sounds and its landing run on timers, so cancelDiceRoll()
   (called by goToStage via stopStageActivity) clears them: leaving
   mid-roll must not play the landing over the next stage.
========================================================= */
const ROLL_MS = 1500;
// The roll's beats, as fractions of ROLL_MS: it lifts, tumbles through
// the air, lands (IMPACTS[0]), bounces twice and settles.
const IMPACTS = [0.52, 0.74, 0.87];
// Which way to turn the cube so a face points at the class. Faces sit
// as on a real dice: opposite faces add up to 7.
const FACE_TURN = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] };
const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

let rotX = -20, rotY = 25;   // the cube's current turn (it only ever spins forward)
let rolling = false;
let timers = [];
let anims = [];

/* ---- Dice sounds (reworked 2026-11-23: "make the sound more dice
   like") ----
   A dice is a short, sharp plastic CLACK, not a tone: a burst of noise
   through a band-pass filter (the click), a quick high ping (the
   plastic) and, on a landing, a low knock (the table). Each one is a
   few dozen milliseconds. */
let noiseBuffer = null;
function clack(strength = 1, knock = false){
  if(state.muted) return;
  const ctx = ensureAudio();
  const t0 = ctx.currentTime;
  if(!noiseBuffer){
    noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.playbackRate.value = 0.8 + Math.random() * 0.5;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass'; band.frequency.value = 2400 + Math.random() * 2200; band.Q.value = 2.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5 * strength, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  noise.connect(band).connect(g).connect(audioOut());
  noise.start(t0); noise.stop(t0 + 0.07);
  // The plastic "ping".
  const ping = ctx.createOscillator(), pg = ctx.createGain();
  ping.type = 'triangle'; ping.frequency.value = 1700 + Math.random() * 900;
  pg.gain.setValueAtTime(0.08 * strength, t0);
  pg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
  ping.connect(pg).connect(audioOut());
  ping.start(t0); ping.stop(t0 + 0.04);
  if(knock){
    // The table.
    const low = ctx.createOscillator(), lg = ctx.createGain();
    low.type = 'sine';
    low.frequency.setValueAtTime(170, t0);
    low.frequency.exponentialRampToValueAtTime(80, t0 + 0.08);
    lg.gain.setValueAtTime(0.35 * strength, t0);
    lg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    low.connect(lg).connect(audioOut());
    low.start(t0); low.stop(t0 + 0.12);
  }
}
const at = (fraction, fn) => timers.push(setTimeout(fn, fraction * ROLL_MS));

function pipsHtml(n){
  return Array.from({ length: 9 }, (_, i) => `<span class="pip${PIPS[n].includes(i + 1) ? ' on' : ''}"></span>`).join('');
}

// The cube itself, built once.
const cube = document.getElementById('diceCube');
// Three solid planes through the middle fill the cube's inside: the faces
// have rounded corners, and without a core you could see through the
// corner gaps to the dots on the far side mid-tumble.
cube.innerHTML = ['x', 'y', 'z'].map(axis => `<div class="dice-core ${axis}"></div>`).join('')
  + [1, 2, 3, 4, 5, 6].map(n => `<div class="dice-face f${n}">${pipsHtml(n)}</div>`).join('');
cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(0deg)`;

export function renderDice(){
  document.getElementById('diceList').innerHTML = DICE_QUESTIONS.map((x, i) => {
    const n = i + 1;
    const on = state.diceActive === n;
    const done = state.diceDone.has(n);
    return `<li class="dq${on ? ' active' : ''}${done ? ' done' : ''}" data-n="${n}">
      <span class="dq-face">${pipsHtml(n)}</span>
      <div class="dq-body">
        <p class="dq-question">${escapeHtml(x.question)}</p>
        <div class="dq-help">
          <ul class="dq-phrases">${x.phrases.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
          <div class="dq-words">${x.words.map(w => `<span>${escapeHtml(w)}</span>`).join('')}</div>
        </div>
      </div>
    </li>`;
  }).join('');
}

function setMessage(text){ document.getElementById('diceMessage').textContent = text; }

function restingTransform(){ return `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(0deg)`; }

export function cancelDiceRoll(){
  timers.forEach(clearTimeout);
  timers = [];
  anims.forEach(a => a.cancel());
  anims = [];
  cube.style.transform = restingTransform();
  if(rolling){
    rolling = false;
    document.getElementById('diceScene').classList.remove('rolling');
  }
}

// One choreographed throw rather than a long blurry spin: it lifts and
// tumbles through the air (one or two turns each way, plus a little
// twist), lands, bounces twice and settles on the face it rolled. The
// shadow on the table shrinks and fades as the dice rises. Everything
// animates transform/opacity only, through the Web Animations API, so
// the timing of the sounds can match the landings exactly.
function roll(){
  if(rolling) return;
  rolling = true;
  const n = 1 + Math.floor(Math.random() * 6);
  const [tx, ty] = FACE_TURN[n];
  const fromX = rotX, fromY = rotY;
  rotX = (Math.ceil(fromX / 360) + 1 + (Math.random() < 0.5 ? 1 : 0)) * 360 + tx;
  rotY = (Math.ceil(fromY / 360) + 1 + (Math.random() < 0.5 ? 1 : 0)) * 360 + ty;
  const twist = (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 25);
  const lerp = (k) => `rotateX(${fromX + (rotX - fromX) * k}deg) rotateY(${fromY + (rotY - fromY) * k}deg)`;
  const scene = document.getElementById('diceScene');
  scene.classList.add('rolling');

  anims.forEach(a2 => a2.cancel());
  anims = [
    // The tumble: most of the turning happens in the air, then it rocks
    // into place on the bounces.
    cube.animate([
      { transform: `${lerp(0)} rotateZ(0deg)`, easing: 'cubic-bezier(.3,.1,.5,1)' },
      { transform: `${lerp(0.88)} rotateZ(${twist}deg)`, offset: IMPACTS[0], easing: 'ease-out' },
      { transform: `${lerp(0.98)} rotateZ(${-twist * 0.25}deg)`, offset: IMPACTS[1], easing: 'ease-out' },
      { transform: `${lerp(1)} rotateZ(0deg)` }
    ], { duration: ROLL_MS, fill: 'forwards' }),
    // The hop: up, down (land), two smaller bounces.
    document.getElementById('diceHop').animate([
      { transform: 'translateY(0)', easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translateY(-48%)', offset: 0.26, easing: 'cubic-bezier(.6,0,.9,.5)' },
      { transform: 'translateY(0)', offset: IMPACTS[0], easing: 'ease-out' },
      { transform: 'translateY(-14%)', offset: 0.63, easing: 'ease-in' },
      { transform: 'translateY(0)', offset: IMPACTS[1], easing: 'ease-out' },
      { transform: 'translateY(-4%)', offset: 0.8, easing: 'ease-in' },
      { transform: 'translateY(0)', offset: IMPACTS[2] },
      { transform: 'translateY(0)' }
    ], { duration: ROLL_MS }),
    // Its shadow on the table.
    document.getElementById('diceShadow').animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.55)', opacity: 0.35, offset: 0.26 },
      { transform: 'scale(1)', opacity: 1, offset: IMPACTS[0] },
      { transform: 'scale(0.85)', opacity: 0.8, offset: 0.63 },
      { transform: 'scale(1)', opacity: 1, offset: IMPACTS[1] },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: ROLL_MS })
  ];

  // Sound: a rattle as it's thrown, a clack and a knock on each landing
  // (quieter each time), and little ticks as it rocks to a stop.
  [0, 0.03, 0.07].forEach((f, i) => at(f, () => clack(0.45 - i * 0.08)));
  at(IMPACTS[0], () => clack(1, true));
  at(IMPACTS[0] + 0.05, () => clack(0.4));
  at(IMPACTS[1], () => clack(0.6, true));
  at(IMPACTS[1] + 0.04, () => clack(0.25));
  at(IMPACTS[2], () => clack(0.3, true));
  at(0.93, () => clack(0.15));

  setMessage('Rolling...');
  at(1, () => land(n));
}

function land(n){
  rolling = false;
  timers = [];
  // Settle the resting transform under the finished animation, then drop it.
  cube.style.transform = restingTransform();
  anims.forEach(a => a.cancel());
  anims = [];
  document.getElementById('diceScene').classList.remove('rolling');
  if(state.diceLast === n){
    state.diceDone.add(n);
    setMessage(`${n} again! Question ${n} is crossed out. Roll again!`);
  } else {
    setMessage(state.diceDone.has(n) ? `You rolled ${n}. (That one is crossed out.) Roll again!` : `You rolled ${n}! Ask and answer question ${n}.`);
  }
  state.diceLast = n;
  state.diceActive = n;
  renderDice();
}

const scene = document.getElementById('diceScene');
scene.addEventListener('click', roll);
scene.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); roll(); } });
document.getElementById('diceRollBtn').addEventListener('click', roll);
document.getElementById('diceResetBtn').addEventListener('click', () => {
  state.diceDone = new Set(); state.diceLast = null; state.diceActive = null;
  setMessage('Click the dice to roll!');
  renderDice();
});

document.getElementById('diceBackBtn').addEventListener('click', () => goToStage(8));
document.getElementById('diceNextBtn').addEventListener('click', () => goToStage(10));

// For the automated tests only: what the dice is showing.
export function debugDice(){ return { rolling, last: state.diceLast, active: state.diceActive, done: [...state.diceDone] }; }
