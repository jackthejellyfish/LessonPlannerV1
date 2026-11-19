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

   Answer a question, then for 15 seconds jellyfish pop out of holes in
   the reef, whack-a-mole style: three rows of holes in every lane, and
   each jelly comes out of a random one. (The first version had one vent
   per lane, so a class could tap the same spot over and over and catch
   everything - classroom feedback 2026-11-19.) Tap one to bop it (+1). A
   golden jelly is +3 but ducks back sooner; a spiky pufferfish is -2.

   The physics, in world units (the play area is 100 tall):
   - a jellyfish SWIMS out of its hole: its bell contracts in pulses,
     each pulse an upward push sized to how far it still has to go, with
     water drag in between, so it surges up in a beat or two and bobs;
   - when its time is up it stops pulsing and sinks back into the hole;
   - a bopped jelly squashes, goes dizzy and drops back into its hole in
     a burst of bubbles;
   - tentacles wave and stretch with each pulse.
   Each hole's rock lip is drawn OVER the jelly in it, row by row from the
   back, so a jelly genuinely comes up out of the hole.

   Performance: the sea, light rays and the backs of the holes are drawn
   once per canvas size and lane count. Per frame: up to 5 creatures (a
   few fills and one tentacle stroke each), one fill and one stroke per
   row for the hole lips, drifting specks and bubbles.
========================================================= */
const WHACK_ROUND_SECONDS = 15;
const WHACK_DEFAULT_LANES = 4;
// Quicker since 2026-11-19 ("it needs to be a bit challenging"): a jelly
// is out of its hole for about a second (was 1.7s), shoots up faster,
// drops back faster, and the next one comes sooner.
const HOVER_MS = 1000;
const HOVER_MS_GOLDEN = 650;
const SPAWN_GAP_MIN_MS = 180;
const SPAWN_GAP_MAX_MS = 380;
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
    'Jellyfish pop out of holes in the reef. Tap them before they hide again!',
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
// Three rows of holes; this is where each row's hole opens (world units).
// Rows are 25 apart, and a jelly plus its hole's lip is under 3.4 radii
// tall, so the radius is capped at 7.2 to keep rows from overlapping.
const ROWS = 3;
const ROW_MOUTH_Y = [36, 61, 86];
function creatureSize(W){ return Math.min(7.2, (W / lanes()) * 0.27); }
// How many may be out at once: 2 with one lane (3 holes), up to 5.
function maxOut(){ return Math.max(2, Math.min(5, Math.ceil(lanes() * ROWS / 3))); }

// The sea: deep gradient, shafts of light from the surface, and the
// backs of all the reef holes. Static per canvas size AND lane count, so
// it's cached on both.
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
  // The BACK of every hole: a glow from inside, the rock rim behind the
  // opening, and the dark opening itself. The front lip is drawn over
  // the jellies each frame (drawHoleFronts).
  const r = creatureSize(W) * u;
  for(let row = 0; row < ROWS; row++){
    for(let lane = 0; lane < lanes(); lane++){
      const cx = laneCenter(lane, W) * u, cy = ROW_MOUTH_Y[row] * u;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
      glow.addColorStop(0, 'rgba(127,232,255,0.28)');
      glow.addColorStop(1, 'rgba(127,232,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
      ctx.fillStyle = '#244A5E';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.75, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020A16';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.3, r * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// The FRONT of every hole in one row: a rounded rock with the opening's
// lower lip along its top, filled as one path and its lip lit with one
// stroke. Drawn after that row's jellies, so they come up out of it.
function drawHoleFronts(ctx, row, u, W){
  const r = creatureSize(W) * u;
  const cy = ROW_MOUTH_Y[row] * u;
  ctx.fillStyle = '#183447';
  ctx.beginPath();
  for(let lane = 0; lane < lanes(); lane++){
    const cx = laneCenter(lane, W) * u;
    ctx.moveTo(cx - r * 1.75, cy + r * 3.0);
    ctx.lineTo(cx - r * 1.75, cy + r * 0.4);
    ctx.quadraticCurveTo(cx - r * 1.75, cy, cx - r * 1.3, cy);
    ctx.quadraticCurveTo(cx, cy + r * 0.72, cx + r * 1.3, cy);
    ctx.quadraticCurveTo(cx + r * 1.75, cy, cx + r * 1.75, cy + r * 0.4);
    ctx.lineTo(cx + r * 1.75, cy + r * 3.0);
    ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(127,232,255,0.55)';
  ctx.lineWidth = Math.max(1.5, u * 0.35);
  ctx.beginPath();
  for(let lane = 0; lane < lanes(); lane++){
    const cx = laneCenter(lane, W) * u;
    ctx.moveTo(cx - r * 1.3, cy);
    ctx.quadraticCurveTo(cx, cy + r * 0.72, cx + r * 1.3, cy);
  }
  ctx.stroke();
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

// One creature per hole until it has fully gone back down.
function spawnCreature(now, W){
  const out = creatures.filter(c => c.state === 'rise' || c.state === 'hover').length;
  if(out >= maxOut()) return;
  const busy = new Set(creatures.map(c => `${c.lane}:${c.row}`));
  const free = [];
  for(let lane = 0; lane < lanes(); lane++) for(let row = 0; row < ROWS; row++){
    if(!busy.has(`${lane}:${row}`)) free.push({ lane, row });
  }
  if(!free.length) return;
  const { lane, row } = free[Math.floor(Math.random() * free.length)];
  const roll = Math.random();
  const kind = roll < BOMB_CHANCE ? 'puffer' : roll < BOMB_CHANCE + GOLDEN_CHANCE ? 'golden' : 'jelly';
  const r = creatureSize(W) * (kind === 'puffer' ? 0.85 : 1);
  const mouth = ROW_MOUTH_Y[row];
  creatures.push({
    kind, lane, row, mouth, state: 'rise',
    x: laneCenter(lane, W), y: mouth + r * 1.2, vy: 0,
    target: mouth - r * 0.85, r,
    color: kind === 'golden' ? GOLD : kind === 'puffer' ? PUFFER : JELLY_COLORS[Math.floor(Math.random() * JELLY_COLORS.length)],
    nextPulse: now, pulseAt: -1e9, hoverUntil: 0,
    phase: Math.random() * 6, rot: 0, alpha: 1, born: now
  });
  sfxRise();
}

function pulse(c, now, strength){
  c.vy = Math.min(c.vy, 0) - strength;
  c.pulseAt = now;
  if(c.kind !== 'puffer' && Math.random() < 0.5){
    bubbles.push({ x: c.x + (Math.random() - 0.5) * c.r, y: c.y - c.r * 0.6, r: 0.5 + Math.random() * 0.6, vy: -8, life: 1 });
  }
}

// Gone back into its hole far enough to be hidden behind the lip.
function hidden(c){ return c.y > c.mouth + c.r * 1.25; }

function stepCreatures(dt, now, W){
  for(const c of creatures){
    // Stay over its own hole even if the lanes or canvas change, with a
    // tiny side-to-side drift.
    c.x = laneCenter(c.lane, W) + Math.sin(now / 700 + c.phase) * c.r * 0.08;
    if(c.state === 'rise' || c.state === 'hover'){
      const period = c.state === 'rise' ? 220 : 700;
      if(now >= c.nextPulse){
        const dist = Math.max(0, c.y - c.target);
        pulse(c, now, c.state === 'rise' ? dist * 4.4 + 12 : dist * 2.4 + 5);
        c.nextPulse = now + period;
      }
      c.vy += 9 * dt;                       // a jelly sinks a little between beats
      c.vy *= Math.exp(-3 * dt);            // water drag
      c.y += c.vy * dt;
      if(c.y < c.target - c.r * 0.4){ c.y = c.target - c.r * 0.4; c.vy = Math.max(0, c.vy); }
      if(c.state === 'rise' && c.y <= c.target + 1.5){
        c.state = 'hover';
        c.vy *= 0.3; // arriving: the surge settles into a bob
        c.hoverUntil = now + (c.kind === 'golden' ? HOVER_MS_GOLDEN : HOVER_MS);
      } else if(c.state === 'hover' && now >= c.hoverUntil){
        c.state = 'sink';
      }
    } else if(c.state === 'sink'){
      c.vy += 80 * dt;
      c.y += c.vy * dt;
    } else if(c.state === 'bopped'){
      c.vy += 110 * dt;
      c.y += c.vy * dt;
      c.rot = Math.sin((now - c.pulseAt) / 60) * 0.25; // a dizzy wobble
    }
  }
  creatures = creatures.filter(c => !((c.state === 'sink' || c.state === 'bopped') && hidden(c)));

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
  c.vy = -10; // a little bounce, then down the hole
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
    bubbles.push({ x: c.x + Math.cos(a) * c.r * 0.6, y: Math.min(c.mouth, c.y) - c.r * 0.3 + Math.sin(a) * c.r * 0.6, r: 0.5 + Math.random() * 1.1,
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
  // A forgiving oval round the bell, but only the part that's out of the
  // hole: a tap on the rock below the opening doesn't count.
  let best = null, bestD = Infinity;
  for(const c of creatures){
    if(c.state === 'bopped' || wy > c.mouth + c.r * 0.3) continue;
    const dx = (wx - c.x) / (c.r * 1.35), dy = (wy - (c.y - c.r * 0.2)) / (c.r * 1.45);
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
  return creatures.filter(c => c.kind !== 'puffer' && (c.state === 'hover' || c.state === 'rise') && c.y - c.r * 0.4 < c.mouth)
    .map(c => ({ x: c.x / W, y: (c.y - c.r * 0.4) / 100, lane: c.lane, row: c.row }));
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

  // Back row first: each row's jellies, then that row's hole lips over
  // them. Between turns, one friendly jelly peeks out of a hole in each
  // lane, so the lane picker shows exactly what it changed.
  const list = (state.whackRoundActive || creatures.length) ? creatures
    : Array.from({ length: lanes() }, (_, i) => {
      const r = creatureSize(W), row = i % ROWS;
      return { x: laneCenter(i, W), y: ROW_MOUTH_Y[row] - r * 0.85, r, row, mouth: ROW_MOUTH_Y[row],
        color: JELLY_COLORS[i % JELLY_COLORS.length], state: 'hover', kind: 'jelly', alpha: 1, pulseAt: -1e9, phase: i, rot: 0 };
    });
  for(let row = 0; row < ROWS; row++){
    for(const c of list) if(c.row === row) (c.kind === 'puffer' ? drawPuffer : drawJelly)(ctx, c, u, now);
    drawHoleFronts(ctx, row, u, W);
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
