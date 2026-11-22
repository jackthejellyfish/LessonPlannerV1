import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { beep, sfxIncorrect, sfxTimeUp, sfxImpact, sfxRisingChime, sfxBalloonPop } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { POP_QUESTIONS } from '../content/stage6-ballpop.js';
import { createCanvasResizer } from '../canvasGame.js';
import { createBackdrop, drawGlow } from '../canvasGlow.js';
import { createShakeState, triggerShake, applyShake, frameFactor } from '../canvasEffects.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

/* =========================================================
   STAGE 6 — BALLOON POP
   Rebuilt 2026-11-18 from "Ball Pop" (one DOM ball at a time) into a
   balloon release on a canvas, per classroom feedback asking for balloon
   physics and popping sounds. A team answers a question, then has 10
   seconds to pop as many balloons as they can.

   The physics, in "world units" where the play area is 100 tall and
   100 * aspect wide (so balloons stay round on any screen):
   - buoyancy and air drag: each balloon accelerates upward to its own
     gentle top speed, so they rise at slightly different rates;
   - a breeze: every balloon sways on its own slow sine, and leans the
     way it is drifting;
   - balloons are soft and bump each other apart instead of overlapping;
   - each string is a little damped spring, so it swings and trails
     behind when the balloon changes direction;
   - a pop shoves nearby balloons away (a bomb shoves hard), the
     balloon bursts into rubber shreds that tumble under gravity, and
     its string drops.

   Performance: the sky is drawn once per canvas size and blitted. Each
   balloon is a handful of flat fills (no gradients, no blur, no glow
   except the rare bonus balloons) and every string is in ONE stroke.
   Between turns nothing animates at all.
========================================================= */
export const POP_ROUND_SECONDS = 10;

const BALLOON_COLORS = ['#FF5A5F', '#3D7BFF', '#2EC27E', '#FFC93C', '#FF6FB5', '#FF9142'];
const GOLD = '#FFC21A';
const RAINBOW = ['#FF5A5F', '#FFC93C', '#2EC27E', '#3D7BFF', '#8B5CF6'];
const MULTI_COLOR = '#8B5CF6';
const BOMB_COLOR = '#2B2B3A';

const LIFT = 22;              // upward acceleration, world units / s^2
const DRAG = 1.35;            // so top rise speed is about LIFT / DRAG = 16 / s
const SWAY_ACCEL = 9;
const SIDE_DRAG = 1.6;
const STRING_LEN = 13;
const PUSH_RADIUS = 26;       // how far a pop's shove reaches
const MAX_ON_SCREEN = 9;

const GEM_COUNT = 3, GEM_POINTS = 3;
const MULTIPLIER_MS = 4000;
const BOMB_PENALTY = 1;

// Colors chosen per team row in the setup screen (index-aligned with the
// input rows) — persists across "+ Add team" re-renders and survives
// until "Start game" reads it into state.popTeams.
let popRowColors = [];

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('popSetup', {
  prefix: 'pop',
  title: 'Balloon Pop',
  steps: [
    'One team answers a question.',
    'Balloons float up from the bottom. Tap them to pop them!',
    'You get 10 seconds. Highest score wins.'
  ],
  scoring: [
    { swatch: '<span class="pop-legend-swatch balloon"></span>', label: 'Balloon', points: '+1' },
    { swatch: '<span class="pop-legend-swatch gold"></span>', label: 'Gold star balloon', points: '+3', tone: 'bonus' },
    { swatch: '<span class="pop-legend-swatch rainbow"></span>', label: 'Rainbow balloon', points: 'bursts into 4', tone: 'bonus' },
    { swatch: '<span class="pop-legend-swatch multi">&times;2</span>', label: 'Purple &times;2 balloon', points: 'double for 4s', tone: 'bonus' },
    { swatch: '<span class="pop-legend-swatch bomb"></span>', label: 'Black bomb balloon &mdash; don&rsquo;t pop it!', points: '&minus;1', tone: 'bad' }
  ],
  tip: 'The gold balloons are small and fast &mdash; grab them before they float away!'
});

export function renderPopTeamInputs(count){
  renderTeamSetupRows('popTeamInputs', 'popAddTeamBtn', count, popRowColors, renderPopTeamInputs);
}
renderPopTeamInputs(2);
wireAddTeamButton('popTeamInputs', 'popAddTeamBtn', renderPopTeamInputs);

document.getElementById('popStartBtn').addEventListener('click', () => {
  state.popTeams = readTeamsFromSetup('pop', popRowColors);
  state.popCurrentTeam = 0;
  state.popTurnsPlayed = 0;
  state.popQuestionOrder = shuffle(POP_QUESTIONS.map((_, i) => i));

  showGameScreen('pop');
  renderPopScoreboard();
  renderPopTurnBanner();
  seedIdleBalloons();
  resizePopCanvas();
});

function renderPopScoreboard(){
  renderTeamScoreboard('popTeamList', state.popTeams, state.popCurrentTeam);
}
function renderPopTurnBanner(){
  renderTurnBanner('pop', state.popTeams[state.popCurrentTeam], state.popTurnsPlayed + 1, POP_QUESTIONS.length);
}

function askPopQuestion(){
  const q = POP_QUESTIONS[state.popQuestionOrder[state.popTurnsPlayed]];
  return askTeamQuestion(q, POP_QUESTIONS, state.popTurnsPlayed);
}

document.getElementById('popBeginTurnBtn').addEventListener('click', beginPopTurn);
async function beginPopTurn(){
  document.getElementById('popBeginTurnBtn').disabled = true;
  await askPopQuestion();
  startPopRound();
}

/* =========================================================
   SOUND (the pop itself is sfxBalloonPop in js/audio.js)
========================================================= */
function sfxMultiplier(){
  [520, 660, 830, 1046, 1318].forEach((f, i) => beep(f, 0.1, 'sawtooth', 0.12, i * 0.045));
}

/* =========================================================
   CANVAS (opaque: the sky covers it every frame)
========================================================= */
const popCanvasResizer = createCanvasResizer('popCanvas', 'popPlayArea', () => {
  if(!state.popRoundActive) renderPopCanvas();
}, { contextAttributes: { alpha: false } });
export function resizePopCanvas(){ popCanvasResizer.resize(); }

// World units -> canvas pixels.
function unit(canvas){ return canvas.height / 100; }
function worldWidth(canvas){ return canvas.height > 0 ? 100 * canvas.width / canvas.height : 160; }

// A bright cartoon sky: gradient, a soft sun, a few flat clouds and two
// rolling hills. Static, so it's drawn once per canvas size.
const renderSky = createBackdrop((ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5EB8FF');
  g.addColorStop(0.65, '#A8DBFF');
  g.addColorStop(1, '#E4F5FF');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const u = h / 100;
  const sun = ctx.createRadialGradient(w * 0.86, h * 0.16, 0, w * 0.86, h * 0.16, u * 22);
  sun.addColorStop(0, 'rgba(255,248,214,1)');
  sun.addColorStop(0.35, 'rgba(255,240,180,0.85)');
  sun.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for(const [cx, cy, s] of [[0.14, 0.2, 1], [0.48, 0.12, 0.8], [0.66, 0.34, 0.65], [0.28, 0.46, 0.55]]){
    const x = w * cx, y = h * cy, r = u * 6 * s;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 1.1, y + r * 0.25, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x - r * 1.05, y + r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 0.2, y + r * 0.5, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7FD08A';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.9);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.55, h * 0.92);
  ctx.quadraticCurveTo(w * 0.8, h * 0.84, w, h * 0.9);
  ctx.lineTo(w, h);
  ctx.fill();
  ctx.fillStyle = '#5FBF6E';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.95);
  ctx.quadraticCurveTo(w * 0.4, h * 0.88, w * 0.7, h * 0.97);
  ctx.quadraticCurveTo(w * 0.88, h * 0.93, w, h * 0.96);
  ctx.lineTo(w, h);
  ctx.fill();
});

/* =========================================================
   BALLOONS
========================================================= */
let balloons = [];
let shreds = [];      // rubber bits and dropped strings
let bursts = [];      // the white "pop" star at each pop
let popFloatTexts = [];
let popShake = createShakeState();
let schedule = [];    // { at (ms into round), type } for the special balloons
let nextNormalAt = 0;

function makeBalloon(type, x, y, opts = {}){
  const b = {
    type, x, y,
    vx: opts.vx ?? (Math.random() - 0.5) * 4,
    vy: opts.vy ?? -(6 + Math.random() * 6),
    r: opts.r ?? (type === 'gold' ? 4.4 : type === 'mini' ? 4.2 : type === 'rainbow' ? 7.6 : type === 'bomb' ? 6.4 : 6 + Math.random() * 1.3),
    // Gold rises fast (catch it!), bombs dawdle in the crowd.
    lift: LIFT * (type === 'gold' ? 1.7 : type === 'bomb' ? 0.75 : 0.82 + Math.random() * 0.36),
    color: type === 'gold' ? GOLD : type === 'multi' ? MULTI_COLOR : type === 'bomb' ? BOMB_COLOR
      : type === 'rainbow' ? '#FFFFFF' : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    phase: Math.random() * Math.PI * 2,
    swayRate: 0.9 + Math.random() * 0.8,
    tilt: 0,
    // Only the rainbow's mini balloons grow in (they burst out of it).
    // Everything else is drawn full size at once: the idle screen is a
    // single still frame, and a balloon caught at scale 0 left its string
    // hanging in the sky on its own.
    born: type === 'mini' ? performance.now() : -1e9
  };
  // The string's free end, as a damped spring hanging under the knot.
  b.tailX = b.x; b.tailY = b.y + b.r * 1.2 + STRING_LEN;
  b.tailVx = 0; b.tailVy = 0;
  balloons.push(b);
  return b;
}

function spawnFromBottom(type, W){
  const r = 7;
  return makeBalloon(type, r + 2 + Math.random() * (W - 2 * r - 4), 100 + r + 4);
}

// A few balloons drifting in the sky when the game is waiting, so the
// play area shows what the game is before the first turn.
function seedIdleBalloons(){
  balloons = []; shreds = []; bursts = []; popFloatTexts = [];
  const W = worldWidth(popCanvasResizer.getCanvas() || { width: 160, height: 100 });
  for(let i = 0; i < 6; i++){
    makeBalloon('normal', W * (0.12 + 0.15 * i) + (Math.random() - 0.5) * 6, 30 + Math.random() * 45);
  }
}

function stepBalloons(dt, now, W){
  const t = now / 1000;
  for(const b of balloons){
    // Buoyancy and drag (exact for any frame time, so a slow PC rises
    // at the same speed), then the breeze.
    b.vy += -b.lift * dt;
    b.vy *= Math.exp(-DRAG * dt);
    b.vx += Math.sin(t * b.swayRate + b.phase) * SWAY_ACCEL * dt;
    b.vx *= Math.exp(-SIDE_DRAG * dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Soft walls at the sides.
    if(b.x < b.r){ b.x = b.r; b.vx = Math.abs(b.vx) * 0.5; }
    else if(b.x > W - b.r){ b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
    // Lean the way it's drifting.
    b.tilt += (Math.max(-0.45, Math.min(0.45, b.vx * 0.035)) - b.tilt) * Math.min(1, dt * 6);
  }

  // Balloons are soft: overlapping pairs push apart.
  for(let i = 0; i < balloons.length; i++){
    const a = balloons[i];
    for(let j = i + 1; j < balloons.length; j++){
      const c = balloons[j];
      const dx = c.x - a.x, dy = (c.y - a.y) * 0.9;
      const min = (a.r + c.r) * 0.95;
      const d2 = dx * dx + dy * dy;
      if(d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2), push = (min - d) * 6;
      const nx = dx / d, ny = dy / d;
      a.vx -= nx * push * dt * 10; a.vy -= ny * push * dt * 10;
      c.vx += nx * push * dt * 10; c.vy += ny * push * dt * 10;
    }
  }

  // Strings: each free end springs toward its rest spot under the knot.
  const k = 60, damp = Math.exp(-6 * dt);
  for(const b of balloons){
    const knotY = knotOf(b).y;
    const tx = b.x - b.tilt * STRING_LEN * 0.6, ty = knotY + STRING_LEN;
    b.tailVx = (b.tailVx + (tx - b.tailX) * k * dt) * damp;
    b.tailVy = (b.tailVy + (ty - b.tailY) * k * dt) * damp;
    b.tailX += b.tailVx * dt;
    b.tailY += b.tailVy * dt;
  }

  // Floated away off the top.
  balloons = balloons.filter(b => !(b.tailY < -4 && b.y + b.r * 1.2 < -2));
}

// Where the string ties on: under the balloon, swung round by its lean.
function knotOf(b){
  const d = b.r * 1.38;
  return { x: b.x - Math.sin(b.tilt) * d, y: b.y + Math.cos(b.tilt) * d };
}

function shove(x, y, strength){
  for(const b of balloons){
    const dx = b.x - x, dy = b.y - y;
    const d = Math.hypot(dx, dy);
    if(d > PUSH_RADIUS || d < 0.01) continue;
    const f = strength * (1 - d / PUSH_RADIUS);
    b.vx += (dx / d) * f;
    b.vy += (dy / d) * f;
  }
}

/* ---- Popping ---- */
function spawnShreds(b){
  const n = particleCount(b.type === 'bomb' ? 14 : 9);
  const colors = b.type === 'rainbow' ? RAINBOW : [b.color];
  for(let i = 0; i < n; i++){
    const a = Math.random() * Math.PI * 2;
    const sp = 22 + Math.random() * 30;
    shreds.push({
      kind: 'rubber', x: b.x + Math.cos(a) * b.r * 0.6, y: b.y + Math.sin(a) * b.r * 0.6,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 8,
      rot: Math.random() * 6, spin: (Math.random() - 0.5) * 18,
      size: b.r * (0.22 + Math.random() * 0.22), color: colors[i % colors.length], life: 1
    });
  }
  if(b.type !== 'bomb'){
    const kn = knotOf(b);
    shreds.push({ kind: 'string', x: kn.x, y: kn.y, tx: b.tailX, ty: b.tailY,
      vx: b.vx * 0.3, vy: 0, life: 1 });
  }
}

function addPopScore(n){
  state.popScore = Math.max(0, state.popScore + n);
  const el = document.getElementById('popPopsDisplay');
  el.textContent = String(state.popScore);
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(1)' }],
    { duration: 260, easing: 'ease-out' });
}

function multiplier(){ return performance.now() < state.popMultiplierUntil ? 2 : 1; }

function popBalloon(b){
  balloons = balloons.filter(x => x !== b);
  const canvas = popCanvasResizer.getCanvas();
  const u = unit(canvas);
  const px = b.x * u, py = b.y * u;
  spawnShreds(b);
  bursts.push({ x: b.x, y: b.y, r: b.r, t0: performance.now(), color: b.type === 'bomb' ? '#FFB347' : '#FFFFFF' });

  if(b.type === 'bomb'){
    const lost = Math.min(state.popScore, BOMB_PENALTY * multiplier());
    addPopScore(-lost);
    spawnFloatText(popFloatTexts, px, py, lost ? `BOOM! −${lost}` : 'BOOM!', '#E4574B', -1.2);
    shove(b.x, b.y, 60);
    triggerShake(popShake, 9);
    sfxImpact(1.1);
    sfxIncorrect();
    return;
  }

  const m = multiplier();
  sfxBalloonPop(b.r / 6.5);
  shove(b.x, b.y, 24);
  if(b.type === 'gold'){
    addPopScore(GEM_POINTS * m);
    spawnFloatText(popFloatTexts, px, py, `+${GEM_POINTS * m}`, '#D99A00', -1.1);
    sfxRisingChime([880, 1108, 1318, 1568]);
  } else if(b.type === 'multi'){
    state.popMultiplierUntil = performance.now() + MULTIPLIER_MS;
    spawnFloatText(popFloatTexts, px, py, 'DOUBLE POINTS!', MULTI_COLOR, -1.0);
    sfxMultiplier();
    flashPlayArea('multi-flash', 400);
  } else if(b.type === 'rainbow'){
    addPopScore(1 * m);
    spawnFloatText(popFloatTexts, px, py, 'SURPRISE!', '#FF6FB5', -1.0);
    sfxRisingChime([660, 880, 1100, 1320]);
    flashPlayArea('mega-flash', 380);
    triggerShake(popShake, 5);
    // Four mini balloons burst out of it and drift up.
    for(let i = 0; i < 4; i++){
      const a = -Math.PI / 2 + (i - 1.5) * 0.7;
      makeBalloon('mini', b.x, b.y, { vx: Math.cos(a) * 26, vy: Math.sin(a) * 18 - 4 })
        .color = RAINBOW[i % RAINBOW.length];
    }
  } else {
    addPopScore(1 * m);
    spawnFloatText(popFloatTexts, px, py, `+${m}`, m > 1 ? MULTI_COLOR : b.color, -1.0);
  }
}

function flashPlayArea(cls, ms){
  const area = document.getElementById('popPlayArea');
  area.classList.add(cls);
  setTimeout(() => area.classList.remove(cls), ms);
}

/* ---- Input: tap / click anywhere on a balloon ---- */
function onPopPointerDown(e){
  if(!state.popRoundActive) return;
  e.preventDefault();
  const canvas = popCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const wx = (e.clientX - rect.left) * 100 / rect.height;
  const wy = (e.clientY - rect.top) * 100 / rect.height;
  // Topmost first (drawn last), and a forgiving hit area.
  for(let i = balloons.length - 1; i >= 0; i--){
    const b = balloons[i];
    const dx = (wx - b.x) / (b.r * 1.15), dy = (wy - b.y) / (b.r * 1.3);
    if(dx * dx + dy * dy <= 1){ popBalloon(b); return; }
  }
}
// For the automated tests only: where the ordinary balloons are, as
// fractions of the play area, so a test can tap real balloons.
export function debugBalloonTargets(){
  const canvas = popCanvasResizer.getCanvas();
  const W = worldWidth(canvas);
  return balloons.filter(b => b.type === 'normal' && b.y > 8 && b.y < 92)
    .map(b => ({ x: b.x / W, y: b.y / 100 }));
}

const popCanvasEl = popCanvasResizer.getCanvas();
popCanvasEl.addEventListener('pointerdown', onPopPointerDown);

/* =========================================================
   DRAWING
========================================================= */
// A darker version of a balloon colour, for its shaded side. Cached:
// there are only a handful of colours.
const shadeCache = new Map();
function shadeOf(hex){
  let c = shadeCache.get(hex);
  if(!c){
    const n = parseInt(hex.slice(1), 16);
    const k = 0.72;
    c = `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`;
    shadeCache.set(hex, c);
  }
  return c;
}

// Body: a rounded top narrowing to the knot, centred on (0,0).
function balloonPath(ctx, r){
  const ry = r * 1.15;
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.bezierCurveTo(r * 1.32, -ry, r * 1.12, ry * 0.55, 0, ry);
  ctx.bezierCurveTo(-r * 1.12, ry * 0.55, -r * 1.32, -ry, 0, -ry);
  ctx.closePath();
}

function drawStarPath(ctx, r, points = 5, inner = 0.45){
  ctx.beginPath();
  for(let i = 0; i < points * 2; i++){
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI / points) * i;
    const x = Math.sin(a) * rad, y = -Math.cos(a) * rad;
    if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBalloon(ctx, b, u, now){
  const r = b.r * u, x = b.x * u, y = b.y * u;
  // A gentle grow-in for the first moments of a balloon's life.
  const grow = Math.min(1, (now - b.born) / 220);
  if(b.type === 'gold' || b.type === 'multi' || b.type === 'rainbow'){
    drawGlow(ctx, x, y, r * 2, b.type === 'gold' ? GOLD : b.type === 'multi' ? MULTI_COLOR : '#FFFFFF', 0.5, 1.6);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(b.tilt);
  if(grow < 1) ctx.scale(grow, grow);
  if(b.type === 'rainbow'){
    // The one balloon that needs a clip (its stripes); there's only ever
    // one of it, and only briefly.
    balloonPath(ctx, r);
    ctx.save();
    ctx.clip();
    const band = (r * 2.6) / RAINBOW.length;
    RAINBOW.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(-r * 1.3 + i * band, -r * 1.3, band + 1, r * 2.8);
    });
    ctx.restore();
  } else {
    // Shading with no clip and no gradient (a clip per balloon measured
    // ~7fps at 1440p with the CPU slowed 6x): the whole outline in a
    // darker shade, then the balloon's colour over a slightly smaller
    // copy nudged up and left. What's left showing is a shaded rim on
    // the lower right, as if lit from the top left.
    ctx.fillStyle = shadeOf(b.color);
    balloonPath(ctx, r);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.save();
    ctx.translate(-r * 0.1, -r * 0.1);
    ctx.scale(0.88, 0.9);
    balloonPath(ctx, r);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(-r * 0.38, -r * 0.48, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-r * 0.6, -r * 0.12, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // The knot.
  ctx.fillStyle = b.type === 'rainbow' ? '#8B5CF6' : b.color;
  const ky = r * 1.15;
  ctx.beginPath();
  ctx.moveTo(0, ky - r * 0.05);
  ctx.lineTo(r * 0.17, ky + r * 0.2);
  ctx.lineTo(-r * 0.17, ky + r * 0.2);
  ctx.closePath();
  ctx.fill();

  // Markings, kept upright-ish with the balloon's lean.
  if(b.type === 'gold'){
    ctx.fillStyle = '#FFFFFF';
    drawStarPath(ctx, r * 0.5);
    ctx.fill();
  } else if(b.type === 'multi'){
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.round(r * 0.9)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×2', 0, r * 0.05);
  } else if(b.type === 'bomb'){
    // A red warning "!" and a fizzing fuse instead of a string.
    ctx.fillStyle = '#FF5A4E';
    ctx.fillRect(-r * 0.11, -r * 0.55, r * 0.22, r * 0.62);
    ctx.beginPath();
    ctx.arc(0, r * 0.32, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderPopCanvas(){
  const canvas = popCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = popCanvasResizer.getContext();
  const u = unit(canvas);
  const now = performance.now();

  ctx.save();
  applyShake(ctx, popShake);
  renderSky(ctx, canvas);

  // Every string in one stroke: knot to the springy free end, with a
  // slight curve that follows the lean.
  ctx.strokeStyle = 'rgba(70,74,90,0.55)';
  ctx.lineWidth = Math.max(1, u * 0.28);
  ctx.beginPath();
  for(const b of balloons){
    if(b.type === 'bomb') continue;
    const kn = knotOf(b);
    ctx.moveTo(kn.x * u, kn.y * u);
    ctx.quadraticCurveTo(((kn.x + b.tailX) / 2 + Math.sin(now / 300 + b.phase) * 1.2) * u, ((kn.y + b.tailY) / 2) * u, b.tailX * u, b.tailY * u);
  }
  for(const s of shreds){
    if(s.kind !== 'string') continue;
    ctx.moveTo(s.x * u, s.y * u);
    ctx.lineTo(s.tx * u, s.ty * u);
  }
  ctx.stroke();
  // Bomb fuses: short and dark, with a flickering spark.
  for(const b of balloons){
    if(b.type !== 'bomb') continue;
    const kn = knotOf(b);
    const kx = kn.x * u, ky = kn.y * u;
    ctx.strokeStyle = '#5A4A3A';
    ctx.lineWidth = Math.max(1.5, u * 0.5);
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.quadraticCurveTo(kx + u * 2, ky + u * 2, kx + u * 1, ky + u * 4);
    ctx.stroke();
    ctx.fillStyle = Math.floor(now / 70) % 2 ? '#FFD23F' : '#FF7A3D';
    ctx.beginPath();
    ctx.arc(kx + u * 1, ky + u * 4, u * (0.8 + Math.random() * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  for(const b of balloons) drawBalloon(ctx, b, u, now);

  // Rubber shreds: small tumbling triangles.
  for(const s of shreds){
    if(s.kind !== 'rubber') continue;
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.fillStyle = s.color;
    const c = Math.cos(s.rot), sn = Math.sin(s.rot), z = s.size * u;
    const x = s.x * u, y = s.y * u;
    ctx.beginPath();
    ctx.moveTo(x + c * z, y + sn * z);
    ctx.lineTo(x - c * z * 0.6 - sn * z * 0.7, y - sn * z * 0.6 + c * z * 0.7);
    ctx.lineTo(x - c * z * 0.4 + sn * z * 0.8, y - sn * z * 0.4 - c * z * 0.8);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The "pop": a jagged star that flashes out and fades in ~0.2s.
  for(const p of bursts){
    const t = (now - p.t0) / 200;
    if(t >= 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.translate(p.x * u, p.y * u);
    ctx.fillStyle = p.color;
    drawStarPath(ctx, p.r * u * (0.8 + t * 0.9), 8, 0.5);
    ctx.fill();
    ctx.restore();
  }

  drawFloatTexts(ctx, popFloatTexts, Math.max(16, canvas.height * 0.06));
  ctx.restore();
}

function stepEffects(dt, k){
  const now = performance.now();
  for(const s of shreds){
    if(s.kind === 'rubber'){
      s.vy += 90 * dt;
      s.vx *= Math.exp(-1.5 * dt);
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.rot += s.spin * dt;
      s.life -= dt * 1.4;
    } else {
      s.vy += 120 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.tx += s.vx * dt; s.ty += s.vy * dt * 1.08;
      s.life -= dt * 1.2;
    }
  }
  shreds = shreds.filter(s => s.life > 0);
  bursts = bursts.filter(p => now - p.t0 < 200);
  popFloatTexts = updateFloatTexts(popFloatTexts, k);
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function buildSchedule(){
  const roundMs = POP_ROUND_SECONDS * 1000;
  const at = (lo, hi) => lo + Math.random() * (hi - lo);
  const list = [];
  for(let i = 0; i < GEM_COUNT; i++) list.push({ at: at(800, roundMs - 1800), type: 'gold' });
  const bombs = 3 + Math.floor(Math.random() * 3);
  for(let i = 0; i < bombs; i++) list.push({ at: at(600, roundMs - 1500), type: 'bomb' });
  list.push({ at: at(1500, roundMs - 3500), type: 'multi' });
  list.push({ at: at(1200, roundMs - 4500), type: 'rainbow' });
  return list.sort((a, b) => a.at - b.at);
}

function startPopRound(){
  cancelPopRound();
  state.popRoundActive = true;
  state.popScore = 0;
  state.popMultiplierUntil = 0;
  balloons = []; shreds = []; bursts = []; popFloatTexts = [];
  popShake = createShakeState();
  schedule = buildSchedule();
  nextNormalAt = 0;

  document.getElementById('popPopsDisplay').textContent = '0';
  document.getElementById('popTimeDisplay').textContent = POP_ROUND_SECONDS;
  setTimerFill(document.getElementById('popTimerFill'), 1);
  document.getElementById('popPlayArea').classList.remove('idle');
  document.getElementById('popHint').classList.remove('hidden');
  resizePopCanvas();

  // A handful already on their way up, so there's something to pop at once.
  const canvas = popCanvasResizer.getCanvas();
  const W = worldWidth(canvas);
  for(let i = 0; i < 5; i++){
    makeBalloon('normal', W * (0.12 + 0.19 * i) + (Math.random() - 0.5) * 6, 70 + Math.random() * 30);
  }

  const start = performance.now();
  let last = start;
  const updateTimerHud = createTimerHud(document.getElementById('popTimeDisplay'), document.getElementById('popTimerFill'), POP_ROUND_SECONDS);
  const popsEl = document.getElementById('popPopsDisplay');

  function tick(now){
    const dtMs = Math.min(50, now - last);
    noteFrame();
    last = now;
    const elapsed = now - start;
    const remaining = Math.max(0, POP_ROUND_SECONDS - elapsed / 1000);
    updateTimerHud(remaining);
    popsEl.classList.toggle('multi-active', multiplier() > 1);

    const W = worldWidth(popCanvasResizer.getCanvas());
    // A steady release of ordinary balloons, a little faster than one
    // every half second, topped up whenever the sky gets sparse.
    if(elapsed >= nextNormalAt && balloons.length < MAX_ON_SCREEN){
      spawnFromBottom('normal', W);
      nextNormalAt = elapsed + 330 + Math.random() * 260;
    }
    while(schedule.length && elapsed >= schedule[0].at){
      spawnFromBottom(schedule.shift().type, W);
    }

    const dt = dtMs / 1000;
    stepBalloons(dt, now, W);
    stepEffects(dt, frameFactor(dtMs));
    renderPopCanvas();

    if(remaining <= 0){ finishPopRound(); return; }
    state.popRoundRAF = requestAnimationFrame(tick);
  }
  state.popRoundRAF = requestAnimationFrame(tick);
}

// Cancels an in-progress round cleanly — when the teacher navigates away
// mid-round there's no result to show, so the same team can retry.
export function cancelPopRound(){
  if(state.popRoundRAF) cancelAnimationFrame(state.popRoundRAF);
  state.popRoundRAF = null;
  if(state.popRoundActive){
    state.popRoundActive = false;
    document.getElementById('popPopsDisplay').classList.remove('multi-active');
    document.getElementById('popPlayArea').classList.add('idle');
    document.getElementById('popHint').classList.add('hidden');
    shreds = []; bursts = []; popFloatTexts = [];
    renderPopCanvas();
    const beginBtn = document.getElementById('popBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishPopRound(){
  state.popRoundActive = false;
  state.popRoundRAF = null;
  sfxTimeUp();
  document.getElementById('popPopsDisplay').classList.remove('multi-active');
  document.getElementById('popPlayArea').classList.add('idle');
  document.getElementById('popHint').classList.add('hidden');
  shreds = []; bursts = []; popFloatTexts = [];
  renderPopCanvas();

  const team = state.popTeams[state.popCurrentTeam];
  team.total += state.popScore;
  state.popTurnsPlayed++;
  renderPopScoreboard();

  showTurnResultModal('popNextTeamBtn', { teams: state.popTeams, currentTeamIndex: state.popCurrentTeam }).then(() => {
    if(state.popTurnsPlayed >= POP_QUESTIONS.length){
      endPopGame();
    } else {
      state.popCurrentTeam = (state.popCurrentTeam + 1) % state.popTeams.length;
      renderPopScoreboard();
      renderPopTurnBanner();
      document.getElementById('popBeginTurnBtn').disabled = false;
      document.getElementById('popTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('popTimerFill'), 1);
    }
  });
}

function endPopGame(){
  const winnerText = finishTeamGame({ prefix: 'pop', teams: state.popTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('popTurnBanner').innerHTML = `All 10 questions done — ${winnerText}`;
}

wireTeamManagementButtons({
  prefix: 'pop',
  getTeams: () => state.popTeams,
  renderScoreboard: renderPopScoreboard,
  cancelRound: cancelPopRound
});

document.getElementById('popBackBtn').addEventListener('click', () => goToStage(7));
document.getElementById('popNextBtn').addEventListener('click', () => goToStage(9));
