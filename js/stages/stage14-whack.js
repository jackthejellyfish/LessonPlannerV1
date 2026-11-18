import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, showQuestionModal } from '../utils.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { WHACK_QUESTIONS } from '../content/stage14-whack.js';
import { createCanvasResizer } from '../canvasGame.js';
import { createBackdrop, drawGlow } from '../canvasGlow.js';
import { createShakeState, triggerShake, applyShake, frameFactor } from '../canvasEffects.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

/* =========================================================
   STAGE 14 — WHACK-A-JELLY
   Rebuilt 2026-11-18 from Whack-a-Monster (a 4x3 grid of DOM holes)
   into a deep-sea game, per classroom feedback: jellyfish characters
   and physics, and the teacher chooses how many LANES (1-5) the
   jellyfish come up in - one lane for the youngest classes, five for a
   frantic board.

   Answer a question, then for 15 seconds jellyfish swim up out of the
   glowing vents at the bottom of each lane. Tap one to bop it (+1). A
   golden jelly is +3 but ducks back sooner; a spiky pufferfish is -2.

   The physics, in world units (the play area is 100 tall):
   - a jellyfish SWIMS: its bell contracts in pulses, each pulse an
     upward push sized to how far it still has to go, with water drag in
     between, so it surges up in a few beats and then bobs in place;
   - when its time is up it stops pulsing and sinks back into the dark,
     tentacles trailing above it (still tappable until it fades);
   - a bopped jelly squashes, spins and tumbles away in a burst of
     bubbles;
   - tentacles wave and stretch with each pulse.

   Lanes: with 1-2 lanes each lane has two "slots" (high and low) so the
   board stays busy; with 3+ lanes each lane has one.

   Performance: the sea, light rays and vents are drawn once per canvas
   size and lane count. Per frame: up to ~10 creatures (a few fills and
   one tentacle stroke each), drifting specks and bubbles.
========================================================= */
const WHACK_ROUND_SECONDS = 15;
const WHACK_DEFAULT_LANES = 4;
const HOVER_MS = 1700;
const HOVER_MS_GOLDEN = 1150;
const SPAWN_GAP_MIN_MS = 260;
const SPAWN_GAP_MAX_MS = 520;
const BOMB_CHANCE = 0.1;
const GOLDEN_CHANCE = 0.13;
const JELLY_COLORS = ['#FF8FD8', '#7FE8FF', '#B9A5E8', '#9CFFB8'];
const GOLD = '#FFD45E';
const PUFFER = '#FFB03B';

/* =========================================================
   AUDIO
========================================================= */
// A soft underwater "bloop": a falling sine with a little bubble on top.
function sfxBop(){
  beep(620, 0.09, 'sine', 0.16);
  beep(310, 0.12, 'sine', 0.12, 0.03);
  beep(1250 + Math.random() * 200, 0.04, 'sine', 0.05, 0.07);
}
function sfxRise(){ beep(500 + Math.random() * 160, 0.05, 'sine', 0.035); }
function sfxGolden(){ sfxRisingChime([880, 1108, 1318, 1760], { duration: 0.1, volume: 0.14, stagger: 0.045 }); }
function sfxPuffer(){ sfxImpact(1.0); beep(140, 0.25, 'sawtooth', 0.06); }

/* =========================================================
   SETUP / TEAMS
========================================================= */
let whackRowColors = [];

renderGameIntro('whackSetup', {
  prefix: 'whack',
  title: 'Whack-a-Jelly',
  steps: [
    'One team answers a question.',
    'Jellyfish swim up from the deep. Tap them before they sink back down!',
    'Bop as many as you can in 15 seconds. The teacher picks 1 to 5 lanes.'
  ],
  scoring: [
    { swatch: '<span class="whack-legend-swatch jelly"></span>', label: 'Jellyfish', points: '+1' },
    { swatch: '<span class="whack-legend-swatch golden"></span>', label: 'Golden jellyfish', points: '+3', tone: 'bonus' },
    { swatch: '<span class="whack-legend-swatch puffer"></span>', label: 'Pufferfish &mdash; don&rsquo;t tap!', points: '&minus;2', tone: 'bad' }
  ],
  tip: 'The golden jellyfish is worth three, but it sinks sooner than the others &mdash; go for it the moment you see it.'
});

export function renderWhackTeamInputs(count){
  renderTeamSetupRows('whackTeamInputs', 'whackAddTeamBtn', count, whackRowColors, renderWhackTeamInputs);
}
renderWhackTeamInputs(2);
wireAddTeamButton('whackTeamInputs', 'whackAddTeamBtn', renderWhackTeamInputs);

document.getElementById('whackStartBtn').addEventListener('click', () => {
  state.whackTeams = readTeamsFromSetup('whack', whackRowColors);
  state.whackCurrentTeam = 0;
  state.whackTurnsPlayed = 0;
  state.whackQuestionOrder = shuffle(WHACK_QUESTIONS.map((_, i) => i));

  showGameScreen('whack');
  renderWhackScoreboard();
  renderWhackTurnBanner();
  syncLanePicker();
  resizeWhackCanvas();
});

function renderWhackScoreboard(){
  renderTeamScoreboard('whackTeamList', state.whackTeams, state.whackCurrentTeam);
}
function renderWhackTurnBanner(){
  renderTurnBanner('whack', state.whackTeams[state.whackCurrentTeam], state.whackTurnsPlayed + 1, WHACK_QUESTIONS.length);
}

/* ---- The teacher's lane picker (shown between turns) ---- */
function lanes(){ return state.whackColumns || WHACK_DEFAULT_LANES; }
function syncLanePicker(){
  document.querySelectorAll('#whackLanes [data-lanes]').forEach(btn => {
    const on = Number(btn.dataset.lanes) === lanes();
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
document.querySelectorAll('#whackLanes [data-lanes]').forEach(btn => {
  btn.addEventListener('click', () => {
    if(state.whackRoundActive) return;
    state.whackColumns = Number(btn.dataset.lanes);
    syncLanePicker();
    renderWhackCanvas();
  });
});

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askWhackQuestion(){
  const q = WHACK_QUESTIONS[state.whackQuestionOrder[state.whackTurnsPlayed]];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('whackBeginTurnBtn').addEventListener('click', async () => {
  document.getElementById('whackBeginTurnBtn').disabled = true;
  await askWhackQuestion();
  startWhackRound();
});

/* =========================================================
   CANVAS (opaque: the sea covers it every frame)
========================================================= */
const whackCanvasResizer = createCanvasResizer('whackCanvas', 'whackPlayArea', () => {
  if(!state.whackRoundActive) renderWhackCanvas();
}, { contextAttributes: { alpha: false } });
function resizeWhackCanvas(){ whackCanvasResizer.resize(); }
export function ensureWhackLayout(){
  if(state.whackTeams.length > 0) resizeWhackCanvas();
}

function unitOf(canvas){ return canvas.height / 100; }
function worldW(canvas){ return canvas.height > 0 ? 100 * canvas.width / canvas.height : 160; }
function laneCenter(i, W){ return W * (i + 0.5) / lanes(); }
function creatureSize(W){ return Math.min(9, (W / lanes()) * 0.3); }

// The sea: deep gradient, shafts of light from the surface, a sandy
// floor, and a glowing vent at the foot of each lane. Static per canvas
// size AND lane count, so it's cached on both.
let seaLayer = null, seaKey = '';
function drawSea(ctx, canvas){
  const key = `${canvas.width}x${canvas.height}:${lanes()}`;
  if(!seaLayer || key !== seaKey){
    seaKey = key;
    seaLayer = seaLayer || document.createElement('canvas');
    seaLayer.width = canvas.width;
    seaLayer.height = canvas.height;
    paintSea(seaLayer.getContext('2d'), canvas.width, canvas.height);
  }
  const t = ctx.getTransform();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(seaLayer, 0, 0);
  ctx.restore();
  if(t.e !== 0 || t.f !== 0) ctx.drawImage(seaLayer, 0, 0); // shaken frame: draw under the offset too
}
function paintSea(ctx, w, h){
  const u = h / 100, W = 100 * w / h;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0E4A72');
  g.addColorStop(0.45, '#08284A');
  g.addColorStop(1, '#030C1C');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Light shafts from the surface.
  ctx.fillStyle = 'rgba(160,220,255,0.06)';
  for(const [x0, spread] of [[0.15, 0.08], [0.38, 0.05], [0.62, 0.09], [0.85, 0.06]]){
    ctx.beginPath();
    ctx.moveTo(w * (x0 - 0.03), 0);
    ctx.lineTo(w * (x0 + 0.03), 0);
    ctx.lineTo(w * (x0 + 0.03 + spread + 0.1), h * 0.85);
    ctx.lineTo(w * (x0 - 0.03 + 0.1), h * 0.85);
    ctx.closePath();
    ctx.fill();
  }
  // Faint lane dividers, so the class can see the lanes.
  const n = lanes();
  ctx.strokeStyle = 'rgba(127,232,255,0.08)';
  ctx.lineWidth = Math.max(1, u * 0.3);
  ctx.setLineDash([u * 2, u * 2]);
  for(let i = 1; i < n; i++){
    ctx.beginPath();
    ctx.moveTo(w * i / n, h * 0.05);
    ctx.lineTo(w * i / n, h * 0.88);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Sea floor.
  ctx.fillStyle = '#0A1E2E';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.9);
  for(let x = 0; x <= 10; x++) ctx.lineTo(w * x / 10, h * (0.9 + 0.025 * Math.sin(x * 1.7)));
  ctx.lineTo(w, h);
  ctx.fill();
  // A vent at the foot of each lane: a dark rock mound with a glowing mouth.
  for(let i = 0; i < n; i++){
    const cx = (W * (i + 0.5) / n) * u, cy = h * 0.93;
    const rw = Math.min(w / n * 0.32, u * 14);
    const glow = ctx.createRadialGradient(cx, cy - u * 2, 0, cx, cy - u * 2, rw * 1.6);
    glow.addColorStop(0, 'rgba(127,232,255,0.45)');
    glow.addColorStop(1, 'rgba(127,232,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - rw * 1.6, cy - u * 2 - rw * 1.6, rw * 3.2, rw * 3.2);
    ctx.fillStyle = '#16303F';
    ctx.beginPath();
    ctx.moveTo(cx - rw, h);
    ctx.quadraticCurveTo(cx - rw * 0.9, cy - u * 4, cx - rw * 0.35, cy - u * 3);
    ctx.lineTo(cx + rw * 0.35, cy - u * 3);
    ctx.quadraticCurveTo(cx + rw * 0.9, cy - u * 4, cx + rw, h);
    ctx.fill();
    ctx.fillStyle = '#7FE8FF';
    ctx.beginPath();
    ctx.ellipse(cx, cy - u * 3, rw * 0.36, u * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A little coral on the floor between vents.
  const coral = ['#FF7A8A', '#FFB86B', '#C77DFF'];
  ctx.lineCap = 'round';
  for(let i = 0; i <= n; i++){
    const cx = (W * i / n) * u, base = h * 0.95;
    ctx.strokeStyle = coral[i % coral.length];
    ctx.lineWidth = u * 0.9;
    ctx.beginPath();
    for(const [dx, ht] of [[-1.2, 5], [0, 7], [1.3, 4.5]]){
      ctx.moveTo(cx + dx * u, base);
      ctx.quadraticCurveTo(cx + dx * u * 2, base - ht * u * 0.6, cx + dx * u * 1.4, base - ht * u);
    }
    ctx.stroke();
  }
}

/* =========================================================
   CREATURES
========================================================= */
let creatures = [];
let bubbles = [];
let whackFloatTexts = [];
let whackShake = createShakeState();
// Drifting specks of "marine snow" - positions in world units, wrapped.
const specks = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random() * 100, s: 0.2 + Math.random() * 0.35, v: 0.6 + Math.random() * 1.2 }));

function slotsPerLane(){ return lanes() <= 2 ? 2 : 1; }

// A slot is busy while its creature is rising or hovering; once it sinks
// (or is bopped) the slot is free for the next one.
function freeSlots(){
  const busy = new Set(creatures.filter(c => c.state === 'rise' || c.state === 'hover').map(c => `${c.lane}:${c.slot}`));
  const out = [];
  for(let l = 0; l < lanes(); l++) for(let s = 0; s < slotsPerLane(); s++) if(!busy.has(`${l}:${s}`)) out.push({ lane: l, slot: s });
  return out;
}

function spawnCreature(now, W){
  const free = freeSlots();
  if(!free.length) return;
  const { lane, slot } = free[Math.floor(Math.random() * free.length)];
  const roll = Math.random();
  const kind = roll < BOMB_CHANCE ? 'puffer' : roll < BOMB_CHANCE + GOLDEN_CHANCE ? 'golden' : 'jelly';
  // Two height bands when lanes share slots, one wide band otherwise.
  const target = slotsPerLane() === 2
    ? (slot === 0 ? 20 + Math.random() * 14 : 46 + Math.random() * 14)
    : 22 + Math.random() * 36;
  creatures.push({
    kind, lane, slot, state: 'rise',
    x: laneCenter(lane, W), y: 104, vy: 0,
    target, r: creatureSize(W) * (kind === 'puffer' ? 0.85 : 1),
    color: kind === 'golden' ? GOLD : kind === 'puffer' ? PUFFER : JELLY_COLORS[Math.floor(Math.random() * JELLY_COLORS.length)],
    nextPulse: now, pulseAt: -1e9, hoverUntil: 0,
    phase: Math.random() * 6, spin: 0, rot: 0, alpha: 1, born: now
  });
  sfxRise();
}

function pulse(c, now, strength){
  c.vy = Math.min(c.vy, 0) - strength;
  c.pulseAt = now;
  if(c.kind !== 'puffer' && Math.random() < 0.5){
    bubbles.push({ x: c.x + (Math.random() - 0.5) * c.r, y: c.y + c.r * 0.4, r: 0.5 + Math.random() * 0.6, vy: -8, life: 1 });
  }
}

function stepCreatures(dt, now, W){
  for(const c of creatures){
    // Keep each creature in its lane even if the lane count or canvas
    // changes underneath it, with a gentle side-to-side drift.
    c.x = laneCenter(c.lane, W) + Math.sin(now / 700 + c.phase) * c.r * 0.25;
    if(c.state === 'rise' || c.state === 'hover'){
      const period = c.state === 'rise' ? 420 : 900;
      if(now >= c.nextPulse){
        const dist = Math.max(0, c.y - c.target);
        pulse(c, now, c.state === 'rise' ? dist * 2.1 + 10 : dist * 2.2 + 7);
        c.nextPulse = now + period;
      }
      c.vy += 9 * dt;                       // a jelly sinks a little between beats
      c.vy *= Math.exp(-2.6 * dt);          // water drag
      c.y += c.vy * dt;
      // Never above the top edge (and clear of the hint pill).
      const top = 12 + c.r * 1.2;
      if(c.y < top){ c.y = top; c.vy = Math.max(0, c.vy); }
      if(c.state === 'rise' && c.y <= c.target + 3){
        c.state = 'hover';
        c.vy *= 0.3; // arriving: the surge settles into a bob
        c.hoverUntil = now + (c.kind === 'golden' ? HOVER_MS_GOLDEN : HOVER_MS);
      } else if(c.state === 'hover' && now >= c.hoverUntil){
        c.state = 'sink';
      }
    } else if(c.state === 'sink'){
      c.vy += 16 * dt;
      c.vy *= Math.exp(-1.4 * dt);
      c.y += c.vy * dt;
      c.alpha = Math.max(0, Math.min(1, (96 - c.y) / 18));
    } else if(c.state === 'bopped'){
      c.vy += 70 * dt;
      c.y += c.vy * dt;
      c.rot += c.spin * dt;
      c.alpha -= dt * 2.2;
    }
  }
  creatures = creatures.filter(c => c.alpha > 0.02 && c.y < 120);

  for(const b of bubbles){
    b.vy -= 6 * dt;
    b.y += b.vy * dt;
    b.x += Math.sin(now / 200 + b.y) * dt * 3;
    b.life -= dt * 0.9;
  }
  bubbles = bubbles.filter(b => b.life > 0 && b.y > -5);
}

/* ---- Bopping ---- */
function bop(c){
  const canvas = whackCanvasResizer.getCanvas();
  const u = unitOf(canvas);
  c.state = 'bopped';
  c.vy = -26;
  c.spin = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4);
  c.pulseAt = performance.now(); // the squash

  let delta;
  if(c.kind === 'puffer'){
    delta = -2;
    sfxPuffer();
    triggerShake(whackShake, 8);
    flashBad();
  } else if(c.kind === 'golden'){
    delta = 3;
    sfxGolden();
  } else {
    delta = 1;
    sfxBop();
  }
  const n = particleCount(c.kind === 'golden' ? 12 : 8);
  for(let i = 0; i < n; i++){
    const a = Math.random() * Math.PI * 2;
    bubbles.push({ x: c.x + Math.cos(a) * c.r * 0.6, y: c.y + Math.sin(a) * c.r * 0.6, r: 0.5 + Math.random() * 1.1,
      vy: -6 - Math.random() * 14, life: 1, tint: c.kind === 'puffer' ? '#FF6B5B' : c.color });
  }
  state.whackScore = Math.max(0, state.whackScore + delta);
  document.getElementById('whackScoreDisplay').textContent = String(state.whackScore);
  spawnFloatText(whackFloatTexts, c.x * u, (c.y - c.r) * u, delta > 0 ? `+${delta}` : `−${-delta}`,
    delta < 0 ? '#FF6B5B' : delta > 1 ? GOLD : '#FFFFFF', -1.1);
}

function flashBad(){
  const area = document.getElementById('whackPlayArea');
  area.classList.add('flash-bad');
  setTimeout(() => area.classList.remove('flash-bad'), 220);
}

function onWhackPointerDown(e){
  if(!state.whackRoundActive) return;
  e.preventDefault();
  const canvas = whackCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const wx = (e.clientX - rect.left) * 100 / rect.height;
  const wy = (e.clientY - rect.top) * 100 / rect.height;
  // A forgiving oval covering the bell and the top of the tentacles.
  let best = null, bestD = Infinity;
  for(const c of creatures){
    if(c.state === 'bopped' || c.alpha < 0.35) continue;
    const dx = (wx - c.x) / (c.r * 1.3), dy = (wy - (c.y + c.r * 0.35)) / (c.r * 1.7);
    const d = dx * dx + dy * dy;
    if(d <= 1 && d < bestD){ best = c; bestD = d; }
  }
  if(best) bop(best);
}
whackCanvasResizer.getCanvas().addEventListener('pointerdown', onWhackPointerDown);

// For the automated tests only: where the tappable (non-pufferfish)
// creatures are, as fractions of the play area.
export function debugWhackTargets(){
  const canvas = whackCanvasResizer.getCanvas();
  const W = worldW(canvas);
  return creatures.filter(c => c.kind !== 'puffer' && (c.state === 'hover' || c.state === 'rise') && c.y < 90)
    .map(c => ({ x: c.x / W, y: c.y / 100, lane: c.lane }));
}

/* =========================================================
   DRAWING
========================================================= */
function drawJelly(ctx, c, u, now){
  const r = c.r * u;
  // Bell contraction: a quick squeeze on each pulse, then it relaxes.
  const since = (now - c.pulseAt) / 1000;
  const squeeze = since < 0.12 ? since / 0.12 : Math.max(0, 1 - (since - 0.12) / 0.35);
  const sx = 1 - 0.16 * squeeze, sy = 1 + 0.12 * squeeze;
  const x = c.x * u, y = c.y * u;
  // The bioluminescent halo. Kept tight (a glow's cost is its area):
  // at r*2.2 a busy five-lane board measured 52fps at 1440p with the CPU
  // slowed 6x.
  drawGlow(ctx, x, y - r * 0.3, r * 1.5, c.color, 0.5 * c.alpha, 1.6);
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.translate(x, y);
  if(c.rot) ctx.rotate(c.rot);
  ctx.scale(sx, sy);

  // Tentacles: longer and trailing upward while sinking, stretched on a
  // squeeze. One stroke for all of them.
  const len = r * (c.state === 'sink' ? 1.5 : 1.25 + 0.35 * squeeze);
  const dir = c.state === 'sink' ? 0.6 : 1; // sinking: drawn up shorter, not folded away
  ctx.strokeStyle = c.color;
  ctx.globalAlpha = c.alpha * 0.75;
  // Short straight segments with plain ends, not round-capped curves:
  // stroking is the costly part of drawing a jelly (measured ~3fps on a
  // busy board at 1440p, CPU slowed 6x), and at this size a three-segment
  // zig-zag waves just as convincingly.
  ctx.lineWidth = Math.max(1.2, r * 0.11);
  ctx.beginPath();
  for(let i = 0; i < 4; i++){
    const tx = -r * 0.6 + i * r * 0.4;
    const sway = Math.sin(now / 170 + i * 1.3 + c.phase) * r * 0.2;
    const y0 = r * 0.15;
    ctx.moveTo(tx, y0);
    ctx.lineTo(tx + sway, y0 + len * 0.36 * dir);
    ctx.lineTo(tx - sway * 0.6, y0 + len * 0.7 * dir);
    ctx.lineTo(tx + sway * 0.4, y0 + len * dir);
  }
  ctx.stroke();
  ctx.globalAlpha = c.alpha;

  // Bell, with a scalloped rim.
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.18);
  ctx.bezierCurveTo(-r, -r * 1.25, r, -r * 1.25, r, r * 0.18);
  for(let i = 4; i > 0; i--){
    const x1 = -r + (i - 1) * r * 0.5;
    ctx.quadraticCurveTo(x1 + r * 0.25, r * 0.38, x1, r * 0.18);
  }
  ctx.fill();
  // A shine. (A translucent inner dome was tried too; it was a big
  // blended fill on every jelly every frame for very little look.)
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-r * 0.42, -r * 0.5, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  // Face (Jack's family resemblance): eyes, cheeks, a smile - or dizzy
  // crosses once bopped.
  ctx.fillStyle = '#23263A';
  ctx.strokeStyle = '#23263A';
  ctx.lineWidth = Math.max(1, r * 0.08);
  if(c.state === 'bopped'){
    ctx.beginPath();
    for(const ex of [-0.3, 0.3]){
      ctx.moveTo(r * (ex - 0.1), -r * 0.28); ctx.lineTo(r * (ex + 0.1), -r * 0.08);
      ctx.moveTo(r * (ex + 0.1), -r * 0.28); ctx.lineTo(r * (ex - 0.1), -r * 0.08);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.18, r * 0.11, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.18, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 0.16, 0.25, Math.PI - 0.25);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  ctx.beginPath();
  ctx.arc(-r * 0.56, -r * 0.02, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.56, -r * 0.02, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  if(c.kind === 'golden'){
    // A little crown of sparkles.
    ctx.fillStyle = '#FFFFFF';
    for(let i = 0; i < 3; i++){
      const a = now / 300 + i * 2.1;
      ctx.fillRect(Math.cos(a) * r * 0.9 - r * 0.05, -r * 0.95 + Math.sin(a) * r * 0.2 - r * 0.05, r * 0.1, r * 0.1);
    }
  }
  ctx.restore();
}

// The pufferfish: a round, spiky, cross fish. It swims up with flapping
// fins rather than pulses, and puffs up when it's tapped.
function drawPuffer(ctx, c, u, now){
  const puffed = c.state === 'bopped' ? 1.3 : 1;
  const r = c.r * u * puffed;
  const x = c.x * u, y = c.y * u;
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.translate(x, y);
  if(c.rot) ctx.rotate(c.rot);
  // Spikes, all in one fill.
  ctx.fillStyle = '#C97A16';
  ctx.beginPath();
  for(let i = 0; i < 14; i++){
    const a = (Math.PI * 2 * i) / 14;
    ctx.moveTo(Math.cos(a - 0.12) * r * 0.9, Math.sin(a - 0.12) * r * 0.9);
    ctx.lineTo(Math.cos(a) * r * 1.32, Math.sin(a) * r * 1.32);
    ctx.lineTo(Math.cos(a + 0.12) * r * 0.9, Math.sin(a + 0.12) * r * 0.9);
  }
  ctx.fill();
  // Fins, flapping.
  const flap = Math.sin(now / 60 + c.phase) * r * 0.18;
  ctx.fillStyle = '#FF8A3D';
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, 0); ctx.lineTo(-r * 1.35, -r * 0.3 + flap); ctx.lineTo(-r * 1.35, r * 0.3 - flap);
  ctx.moveTo(r * 0.85, 0); ctx.lineTo(r * 1.35, -r * 0.3 - flap); ctx.lineTo(r * 1.35, r * 0.3 + flap);
  ctx.fill();
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFE3B0';
  ctx.beginPath();
  ctx.arc(0, r * 0.3, r * 0.62, 0, Math.PI);
  ctx.fill();
  // Cross eyes and eyebrows: this one is NOT friendly.
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#23263A';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.16, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.3, -r * 0.16, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#23263A';
  ctx.lineWidth = Math.max(1.2, r * 0.09);
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.55); ctx.lineTo(-r * 0.15, -r * 0.38);
  ctx.moveTo(r * 0.6, -r * 0.55); ctx.lineTo(r * 0.15, -r * 0.38);
  ctx.moveTo(-r * 0.18, r * 0.25); ctx.quadraticCurveTo(0, r * 0.12, r * 0.18, r * 0.25);
  ctx.stroke();
  ctx.restore();
}

function renderWhackCanvas(){
  const canvas = whackCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = whackCanvasResizer.getContext();
  const u = unitOf(canvas), W = worldW(canvas);
  const now = performance.now();

  ctx.save();
  applyShake(ctx, whackShake);
  drawSea(ctx, canvas);

  // Marine snow, drifting slowly down.
  ctx.fillStyle = 'rgba(200,235,255,0.35)';
  for(const s of specks){
    const y = ((s.y + now / 1000 * s.v) % 100) * u;
    ctx.fillRect(s.x * W * u, y, s.s * u, s.s * u);
  }

  if(state.whackRoundActive || creatures.length){
    for(const c of creatures) (c.kind === 'puffer' ? drawPuffer : drawJelly)(ctx, c, u, now);
  } else {
    // Between turns: one friendly jelly bobbing over each vent, so the
    // lane picker shows exactly what it changed.
    for(let i = 0; i < lanes(); i++){
      drawJelly(ctx, { x: laneCenter(i, W), y: 58, r: creatureSize(W), color: JELLY_COLORS[i % JELLY_COLORS.length],
        state: 'hover', kind: 'jelly', alpha: 0.9, pulseAt: -1e9, phase: i, rot: 0 }, u, now);
    }
  }

  // Bubbles: rings, all in one stroke (tinted ones from a bop drawn on top).
  ctx.strokeStyle = 'rgba(190,240,255,0.7)';
  ctx.lineWidth = Math.max(1, u * 0.25);
  ctx.beginPath();
  for(const b of bubbles){
    if(b.tint) continue;
    ctx.moveTo(b.x * u + b.r * u, b.y * u);
    ctx.arc(b.x * u, b.y * u, b.r * u, 0, Math.PI * 2);
  }
  ctx.stroke();
  for(const b of bubbles){
    if(!b.tint) continue;
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.strokeStyle = b.tint;
    ctx.beginPath();
    ctx.arc(b.x * u, b.y * u, b.r * u, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  drawFloatTexts(ctx, whackFloatTexts, Math.max(16, canvas.height * 0.065));
  ctx.restore();
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startWhackRound(){
  cancelWhackRound();
  state.whackRoundActive = true;
  state.whackScore = 0;
  creatures = []; bubbles = []; whackFloatTexts = [];
  whackShake = createShakeState();

  document.getElementById('whackScoreDisplay').textContent = '0';
  document.getElementById('whackTimeDisplay').textContent = String(WHACK_ROUND_SECONDS);
  setTimerFill(document.getElementById('whackTimerFill'), 1);
  document.getElementById('whackPlayArea').classList.remove('idle');
  document.getElementById('whackHint').classList.remove('hidden');
  resizeWhackCanvas();

  const start = performance.now();
  let last = start;
  let nextSpawnAt = 200;
  const updateTimerHud = createTimerHud(document.getElementById('whackTimeDisplay'), document.getElementById('whackTimerFill'), WHACK_ROUND_SECONDS);

  function tick(now){
    const dtMs = Math.min(50, now - last);
    noteFrame();
    last = now;
    const elapsed = now - start;
    const remaining = Math.max(0, WHACK_ROUND_SECONDS - elapsed / 1000);
    updateTimerHud(remaining);
    const W = worldW(whackCanvasResizer.getCanvas());

    if(elapsed >= nextSpawnAt && remaining > 1.2){
      spawnCreature(now, W);
      nextSpawnAt = elapsed + SPAWN_GAP_MIN_MS + Math.random() * (SPAWN_GAP_MAX_MS - SPAWN_GAP_MIN_MS);
    }
    const dt = dtMs / 1000;
    stepCreatures(dt, now, W);
    whackFloatTexts = updateFloatTexts(whackFloatTexts, frameFactor(dtMs));
    renderWhackCanvas();

    if(remaining <= 0){ finishWhackRound(); return; }
    state.whackRoundRAF = requestAnimationFrame(tick);
  }
  state.whackRoundRAF = requestAnimationFrame(tick);
}

function endRoundVisuals(){
  creatures = []; bubbles = []; whackFloatTexts = [];
  const playArea = document.getElementById('whackPlayArea');
  if(playArea){ playArea.classList.add('idle'); playArea.classList.remove('flash-bad'); }
  const hint = document.getElementById('whackHint');
  if(hint) hint.classList.add('hidden');
  renderWhackCanvas();
}

export function cancelWhackRound(){
  if(state.whackRoundRAF) cancelAnimationFrame(state.whackRoundRAF);
  state.whackRoundRAF = null;
  if(state.whackRoundActive){
    state.whackRoundActive = false;
    endRoundVisuals();
    const begin = document.getElementById('whackBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

function finishWhackRound(){
  state.whackRoundActive = false;
  state.whackRoundRAF = null;
  endRoundVisuals();

  state.whackTeams[state.whackCurrentTeam].total += state.whackScore;
  state.whackTurnsPlayed++;
  renderWhackScoreboard();

  showTurnResultModal('whackNextTeamBtn', { teams: state.whackTeams, currentTeamIndex: state.whackCurrentTeam }).then(() => {
    if(state.whackTurnsPlayed >= WHACK_QUESTIONS.length){ endWhackGame(); return; }
    state.whackCurrentTeam = (state.whackCurrentTeam + 1) % state.whackTeams.length;
    renderWhackScoreboard();
    renderWhackTurnBanner();
    document.getElementById('whackBeginTurnBtn').disabled = false;
    document.getElementById('whackTimeDisplay').textContent = '--';
    setTimerFill(document.getElementById('whackTimerFill'), 1);
  });
}

function endWhackGame(){
  const winnerText = finishTeamGame({ prefix: 'whack', teams: state.whackTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('whackTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT + NAVIGATION
========================================================= */
wireTeamManagementButtons({
  prefix: 'whack',
  getTeams: () => state.whackTeams,
  renderScoreboard: renderWhackScoreboard,
  cancelRound: cancelWhackRound
});

document.getElementById('whackBackBtn').addEventListener('click', () => goToStage(13));
// A "Next" button's handler lives in the file for the stage it goes TO.
document.getElementById('hoopNextStageBtn').addEventListener('click', () => goToStage(14));
