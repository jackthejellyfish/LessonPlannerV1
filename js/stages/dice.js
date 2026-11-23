import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { ensureAudio, audioOut } from '../audio.js';
import { DICE_QUESTIONS } from '../content/dice.js';

/* =========================================================
   STAGE 9 — SPEAKING DICE (added 2026-11-23, reworked the same day:
   "same concept, different UI and dice styling, interesting physics")
   Six questions, one for each face. The teacher clicks the dice tray;
   a chunky colour-per-face dice is thrown across a felt tray, bounces
   off the wooden rim, tips over face by face as it rolls and settles
   on a number. That question opens in the big card on the right with
   two helpful phrases and a small word bank; the class asks and answers
   it, then rolls again.

   Rolling the SAME number as the roll before crosses that question out.

   The physics: each throw is simulated in full up front (fixed 1/120 s
   steps: gravity and bounces in the air, friction on the felt, the rim,
   spin), then played back frame by frame as transforms only. Working
   it out first means the throw always settles within ~2.4 s, the
   landing face is chosen fairly before it starts (the tumbles are
   arranged to finish on it) and a cancelled roll just stops the
   playback. Nothing runs between rolls.

   cancelDiceRoll() (called by goToStage via stopStageActivity) stops
   the playback, its sounds and the landing: leaving mid-roll must not
   land over the next stage.
========================================================= */
const DT = 1 / 120;
const MAX_ROLL_S = 2.4;
const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Faces next to a face (a dice tips onto one of these): not itself and
// not its opposite (opposite faces add up to 7).
const NEXT_TO = (f) => [1, 2, 3, 4, 5, 6].filter(o => o !== f && o !== 7 - f);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Where the dice rests in the tray (as a share of the tray), its turn
// and the face showing.
let pos = { nx: 0.5, ny: 0.45, a: -12, face: 5 };
let rolling = false;
let raf = 0;
let timers = [];
let anims = [];
let D = 100;               // dice size in px (from the tray size)
let shownFace = 0;

const scene = document.getElementById('diceScene');
const felt = document.getElementById('diceFelt');
const body = document.getElementById('diceBody');
const top = document.getElementById('diceTop');
const pips = document.getElementById('dicePips');
const shade = document.getElementById('diceShade');
const shadow = document.getElementById('diceShadow');
const burst = document.getElementById('diceBurst');
const rollBtn = document.getElementById('diceRollBtn');

/* ---- Dice sounds ----
   A dice is a short, sharp plastic CLACK, not a tone: a burst of noise
   through a band-pass filter (the click), a quick high ping (the
   plastic) and, on a landing, a low knock (the table). */
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
  const ping = ctx.createOscillator(), pg = ctx.createGain();
  ping.type = 'triangle'; ping.frequency.value = 1700 + Math.random() * 900;
  pg.gain.setValueAtTime(0.08 * strength, t0);
  pg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
  ping.connect(pg).connect(audioOut());
  ping.start(t0); ping.stop(t0 + 0.04);
  if(knock){
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

function pipsHtml(n){
  return Array.from({ length: 9 }, (_, i) => `<span class="pip${PIPS[n].includes(i + 1) ? ' on' : ''}"></span>`).join('');
}
function setFace(n){
  if(n === shownFace) return;
  shownFace = n;
  pips.innerHTML = pipsHtml(n);
  top.dataset.face = n;
}

/* ---- Layout: the dice's size comes from the tray's ---- */
function traySize(){ return { w: felt.clientWidth, h: felt.clientHeight }; }
function layout(){
  const { w, h } = traySize();
  if(!w || !h) return false;
  D = Math.round(Math.min(w, h) * 0.24);
  for(const el of [body, shadow]){ el.style.width = `${D}px`; el.style.height = `${D}px`; }
  body.style.fontSize = `${D}px`;    // the dice's edges and pips are sized in em
  const R = D * 0.6;
  draw({ x: clamp(pos.nx * w, R, w - R), y: clamp(pos.ny * h, R, h - R), z: 0, a: pos.a, p: -1 });
  setFace(pos.face);
  return true;
}

// One frame: the dice (raised and bigger when it's in the air), the
// tip-over squash along one of its sides with a shaded edge, and its
// shadow on the felt (further away and fainter the higher it is).
function draw(fr){
  const lift = fr.z / D;
  body.style.transform = `translate3d(${fr.x - D / 2}px, ${fr.y - D / 2 - fr.z * 0.55}px, 0) rotate(${fr.a}deg) scale(${1 + lift * 0.45})`;
  const sq = fr.p >= 0 ? Math.sin(Math.PI * fr.p) : 0;
  top.style.transform = sq ? `scale${fr.ax}(${1 - 0.55 * sq})` : '';
  shade.style.opacity = sq ? (0.55 * sq).toFixed(3) : '0';
  shadow.style.transform = `translate3d(${fr.x - D / 2 + fr.z * 0.12}px, ${fr.y - D / 2 + fr.z * 0.25}px, 0) rotate(${fr.a}deg) scale(${1 - Math.min(0.4, lift * 0.3)})`;
  shadow.style.opacity = (1 - Math.min(0.65, lift * 0.55)).toFixed(3);
}

/* ---- The throw, worked out in full before it plays ---- */
function simulate(w, h, n){
  const rand = Math.random;
  const R = D * 0.6;                       // the dice's reach from its centre (it's turned)
  const minX = R, maxX = w - R, minY = R, maxY = h - R;
  const base = Math.min(w, h);
  let x = clamp(pos.nx * w, minX, maxX), y = clamp(pos.ny * h, minY, maxY), z = 0, a = pos.a;
  const dir = rand() * Math.PI * 2;
  const v0 = base * (2.2 + rand());
  let vx = Math.cos(dir) * v0, vy = Math.sin(dir) * v0;
  let vz = D * (5.5 + rand() * 1.5);
  const g = D * 30;
  let va = (rand() < 0.5 ? -1 : 1) * (420 + rand() * 360);   // spin, degrees/s
  let grounded = false, travel = 0, airClock = 0, tumble = null, tumblesDone = 0;
  const frames = [], events = [{ t: 0, kind: 'throw' }];

  for(let i = 0; i < MAX_ROLL_S / DT; i++){
    const t = i * DT;
    if(!grounded){
      vz -= g * DT; z += vz * DT;
      if(z <= 0){
        // A bounce on the felt: it loses height, speed and some spin.
        z = 0;
        const hit = -vz;
        events.push({ t, kind: 'floor', s: Math.min(1, hit / (D * 6)) });
        if(hit < D * 1.6){ grounded = true; vz = 0; } else vz = hit * 0.42;
        vx *= 0.74; vy *= 0.74;
        va = va * 0.75 + (rand() - 0.5) * 300;
      }
    } else {
      // Rolling on the felt: friction (a share of the speed and a bit more).
      const sp = Math.hypot(vx, vy);
      if(sp > 0){
        const ns = Math.max(0, sp * Math.exp(-3 * DT) - base * 0.9 * DT);
        vx *= ns / sp; vy *= ns / sp;
      }
      va *= Math.exp(-5 * DT);
    }
    if(t > 1.6){ vx *= 0.9; vy *= 0.9; va *= 0.9; }   // never a long crawl
    x += vx * DT; y += vy * DT; a += va * DT;

    // The wooden rim.
    let wall = 0;
    if(x < minX){ x = minX; wall = Math.abs(vx); vx = wall * 0.68; }
    else if(x > maxX){ x = maxX; wall = Math.abs(vx); vx = -wall * 0.68; }
    if(y < minY){ y = minY; wall = Math.max(wall, Math.abs(vy)); vy = Math.abs(vy) * 0.68; }
    else if(y > maxY){ y = maxY; wall = Math.max(wall, Math.abs(vy)); vy = -Math.abs(vy) * 0.68; }
    if(wall > base * 0.15){
      events.push({ t, kind: 'wall', s: Math.min(1, wall / v0) });
      va = -va * 0.7 + (rand() - 0.5) * 240;
    }

    // Tipping over: in the air it tumbles on a clock; on the felt, once
    // for every dice-width it rolls. It tips along whichever of its
    // sides faces the way it's going.
    const sp = Math.hypot(vx, vy);
    if(tumble && t >= tumble.start + tumble.dur){ tumble = null; tumblesDone++; }
    if(!tumble){
      let go = false;
      if(!grounded){ airClock += DT; if(airClock >= 0.1){ airClock = 0; go = true; } }
      else { travel += sp * DT; if(travel >= D * 0.9 && sp > base * 0.12){ travel = 0; go = true; } }
      if(go){
        const local = Math.atan2(vy, vx) - a * Math.PI / 180;
        const ax = Math.abs(Math.cos(local)) > Math.abs(Math.sin(local)) ? 'X' : 'Y';
        const dur = grounded ? clamp(D * 0.9 / sp, 0.06, 0.16) : 0.09;
        tumble = { start: t, dur, ax };
        if(grounded) events.push({ t: t + dur / 2, kind: 'tick', s: clamp(sp / v0, 0.1, 0.4) });
      }
    }
    const p = tumble ? (t - tumble.start) / tumble.dur : -1;
    frames.push({ x, y, z, a, p, ax: tumble ? tumble.ax : 'X', fi: tumblesDone + (p >= 0.5 ? 1 : 0) });
    if(grounded && !tumble && sp < 6 && t > 0.5) break;
  }

  // It settles square (pips the right way round), turning the short way.
  const last = frames[frames.length - 1];
  const K = Math.max(1, frames.reduce((m, f) => Math.max(m, f.fi), 0));
  const target = Math.round(last.a / 90) * 90;
  const SNAP = Math.round(0.2 / DT);
  for(let i = 1; i <= SNAP; i++){
    const k = 1 - Math.pow(1 - i / SNAP, 3);
    frames.push({ x: last.x, y: last.y, z: 0, a: last.a + (target - last.a) * k, p: -1, ax: 'X', fi: K });
  }

  // The faces it shows: from the one showing now, tipping to a
  // neighbouring face each time, and ending on the number rolled.
  const faces = new Array(K + 1);
  faces[0] = pos.face; faces[K] = n;
  for(let i = K - 1; i >= 1; i--){
    const opts = NEXT_TO(faces[i + 1]).filter(o => i !== 1 || o !== pos.face);
    faces[i] = opts[Math.floor(rand() * opts.length)];
  }
  return { frames, events, faces, w, h };
}

/* ---- Rolling ---- */
function stopPlayback(){
  if(raf) cancelAnimationFrame(raf);
  raf = 0;
  timers.forEach(clearTimeout);
  timers = [];
}
function setRolling(on){
  rolling = on;
  scene.classList.toggle('rolling', on);
  rollBtn.disabled = on;
}

export function cancelDiceRoll(){
  stopPlayback();
  anims.forEach(a => a.cancel());
  anims = [];
  if(rolling){
    setRolling(false);
    top.style.transform = '';
    shade.style.opacity = '0';
  }
}

function roll(){
  if(rolling) return;
  if(!layout()) return;
  const n = 1 + Math.floor(Math.random() * 6);
  const { w, h } = traySize();
  const sim = simulate(w, h, n);
  anims.forEach(a => a.cancel());
  anims = [];
  setRolling(true);
  setMessage('Rolling...');

  const start = performance.now();
  let nextEvent = 0;
  const step = (now) => {
    const t = (now - start) / 1000;
    const i = Math.min(sim.frames.length - 1, Math.floor(t / DT));
    const fr = sim.frames[i];
    draw(fr);
    setFace(sim.faces[Math.min(fr.fi, sim.faces.length - 1)]);
    pos = { nx: fr.x / w, ny: fr.y / h, a: fr.a, face: shownFace };
    // Sounds as the throw reaches them (a long-throttled frame plays
    // only the loudest it skipped, not a burst).
    let loudest = null;
    while(nextEvent < sim.events.length && sim.events[nextEvent].t <= t){
      const e = sim.events[nextEvent++];
      if(e.kind === 'throw') [0, 30, 70].forEach((ms, k) => timers.push(setTimeout(() => clack(0.4 - k * 0.08), ms)));
      else if(!loudest || e.s > loudest.s) loudest = e;
    }
    if(loudest) clack(loudest.kind === 'tick' ? loudest.s * 0.5 : loudest.s, loudest.kind === 'floor');
    if(i >= sim.frames.length - 1){ raf = 0; land(n); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  // A safety net: if frames stop coming (a hidden tab), still land.
  timers.push(setTimeout(() => { if(rolling){ stopPlayback(); land(n); } }, sim.frames.length * DT * 1000 + 600));
}

/* ---- Landing: a pop, a ring and confetti in the face's colour ---- */
burst.innerHTML = '<span class="dice-ring"></span>' + '<i></i>'.repeat(14);
function celebrate(crossed){
  const { w, h } = traySize();
  burst.style.transform = `translate3d(${pos.nx * w}px, ${pos.ny * h}px, 0)`;
  burst.dataset.face = pos.face;
  burst.classList.toggle('crossed', crossed);
  anims.push(top.animate([
    { transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.35 }, { transform: 'scale(0.94)', offset: 0.7 }, { transform: 'scale(1)' }
  ], { duration: 420, easing: 'ease-out' }));
  const ring = burst.querySelector('.dice-ring');
  ring.style.width = ring.style.height = `${D * 1.3}px`;
  anims.push(ring.animate([
    { transform: 'translate(-50%,-50%) scale(0.6)', opacity: 0.9 },
    { transform: 'translate(-50%,-50%) scale(2)', opacity: 0 }
  ], { duration: 600, easing: 'cubic-bezier(.2,.7,.3,1)' }));
  if(crossed) return;
  burst.querySelectorAll('i').forEach((el, k) => {
    const ang = (k / 14) * Math.PI * 2 + (k % 2) * 0.3;
    const dist = D * (0.9 + (k % 3) * 0.35);
    anims.push(el.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) rotate(${(k % 2 ? 1 : -1) * 220}deg) scale(0.5)`, opacity: 0 }
    ], { duration: 650 + (k % 4) * 60, easing: 'cubic-bezier(.15,.7,.3,1)' }));
  });
}

function land(n){
  stopPlayback();
  setRolling(false);
  setFace(n);
  pos.face = n;
  top.style.transform = '';
  shade.style.opacity = '0';
  const crossed = state.diceLast === n;
  if(crossed){
    state.diceDone.add(n);
    setMessage(`${n} again! Question ${n} is crossed out.`);
  } else {
    setMessage(state.diceDone.has(n) ? `You rolled ${n}. That one is crossed out. Roll again!` : `You rolled ${n}!`);
  }
  state.diceLast = n;
  state.diceActive = n;
  celebrate(crossed);
  renderDice(crossed ? n : 0);
}

/* ---- The question card and the six tiles ---- */
function setMessage(text){ document.getElementById('diceMessage').textContent = text; }
// "___" in a phrase becomes a drawn gap.
const withGaps = (t) => escapeHtml(t).replace(/_{2,}/g, '<span class="ds-gap"></span>');

function spotHtml(){
  const n = state.diceActive;
  if(!n) return `<div class="ds-card ds-empty">
      <p class="ds-empty-title">Roll the dice!</p>
      <p>The number picks a question. Ask it, answer it, then roll again.</p>
      <p>Roll the same number twice in a row and that question is crossed out.</p>
    </div>`;
  const x = DICE_QUESTIONS[n - 1];
  const done = state.diceDone.has(n);
  return `<div class="ds-card${done ? ' done' : ''}" data-face="${n}">
      <div class="ds-head">
        <span class="ds-num" data-face="${n}">${pipsHtml(n)}</span>
        <p class="ds-question">${escapeHtml(x.question)}</p>
      </div>
      <div class="ds-help">
        <div><p class="ds-label">Helpful phrases</p>
          <ul class="dq-phrases">${x.phrases.map(p => `<li>${withGaps(p)}</li>`).join('')}</ul></div>
        <div><p class="ds-label">Word bank</p>
          <div class="dq-words">${x.words.map(w => `<span>${escapeHtml(w)}</span>`).join('')}</div></div>
      </div>
    </div>`;
}

export function renderDice(justCrossed = 0){
  document.getElementById('diceSpot').innerHTML = spotHtml();
  document.getElementById('diceList').innerHTML = DICE_QUESTIONS.map((x, i) => {
    const n = i + 1;
    const cls = ['dq'];
    if(state.diceActive === n) cls.push('active');
    if(state.diceDone.has(n)) cls.push('done');
    if(justCrossed === n) cls.push('just-done');
    return `<li class="${cls.join(' ')}" data-n="${n}" data-face="${n}" tabindex="0" role="button" aria-label="Question ${n}">
      <span class="dq-face" data-face="${n}">${pipsHtml(n)}</span>
      <p class="dq-question">${escapeHtml(x.question)}</p>
      <span class="dq-strike" aria-hidden="true"></span>
    </li>`;
  }).join('');
  if(!rolling) requestAnimationFrame(layout);   // the tray may have just become visible
}

// A tile can be opened by hand too (it doesn't count as a roll).
function openTile(e){
  const li = e.target.closest('.dq');
  if(!li || rolling) return;
  state.diceActive = Number(li.dataset.n);
  setMessage(`Question ${li.dataset.n}`);
  renderDice();
}
const list = document.getElementById('diceList');
list.addEventListener('click', openTile);
list.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openTile(e); } });

scene.addEventListener('click', roll);
scene.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); roll(); } });
rollBtn.addEventListener('click', roll);
document.getElementById('diceResetBtn').addEventListener('click', () => {
  if(rolling) cancelDiceRoll();
  state.diceDone = new Set(); state.diceLast = null; state.diceActive = null;
  setMessage('Click the tray to roll!');
  renderDice();
});
window.addEventListener('resize', () => { if(!rolling && felt.clientWidth) layout(); });

document.getElementById('diceBackBtn').addEventListener('click', () => goToStage(8));
document.getElementById('diceNextBtn').addEventListener('click', () => goToStage(10));

// For the automated tests only: what the dice is showing.
export function debugDice(){ return { rolling, last: state.diceLast, active: state.diceActive, done: [...state.diceDone], face: shownFace }; }
