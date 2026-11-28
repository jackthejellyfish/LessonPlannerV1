import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { askTeamQuestion } from '../questionChoices.js';
import { pickQuestions, GAME_TURNS } from '../questionDeck.js';
import { sfxImpact, sfxRisingChime, sfxSlash, sfxCombo } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { FRUIT_QUESTIONS } from '../content/stage12-fruitninja.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves, stepParticles, frameFactor } from '../canvasEffects.js';
import { createBackdrop, drawGlow } from '../canvasGlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

/* =========================================================
   STAGE 12 — FRUIT NINJA
   Team-turn structure identical to every other canvas game: answer a
   question, then play a fixed 10-second round. Placeholder shapes
   (circle/square/triangle, plus bomb/golden — see below) launch up
   from the bottom under gravity and arc back down; swiping (mouse-drag
   or touch) across one slices it — it splits into two halves that fly
   apart and fall/fade on their own, same "real physics, not just a
   disappearing sprite" spirit as every other game's impact feedback
   here. Cut detection is a simple point-to-segment distance test
   against each shape's own radius, run once per new trail point
   against every live shape — with well under 20 shapes on screen at
   once this is trivial, no spatial partitioning needed (same reasoning
   as Billiards' O(n²) ball collisions).

   Combo/bomb/golden-fruit additions (2026-08) use the shared
   js/canvasEffects.js shake+shockwave helpers and audio.js's
   sfxImpact/sfxRisingChime — same shared vocabulary now used across
   every game's "big moment" feedback, rather than reinventing another
   one-off version here.
========================================================= */
// Retuned after classroom feedback that this game was too hard: more
// time, more fruit, and — the main ask — far longer hang time. Gravity
// and launch speed are tuned as a PAIR: cutting gravity alone would
// send shapes off the top of the play area (a bug this file has hit
// before, see spawnFruitShape), so launch speed comes down with it.
// Peak height is therefore about the same as before; what changes is
// how long a shape spends up there, which is what makes it catchable.
const FRUIT_ROUND_SECONDS = 15;
const FRUIT_GRAVITY = 72; // %/second² — was 130; roughly halved for a long, floaty hang
const FRUIT_TRAIL_MAX_AGE_MS = 160;
// Same "scale canvas-drawn effects relative to a reference width" trick
// as Star Defender's canvasScale()/INV_REFERENCE_WIDTH — used only for
// the new shockwave rings below, which came from that file's default
// sizing (tuned against this same reference width).
const FRUIT_REFERENCE_WIDTH = 900;

const FRUIT_SHAPE_TYPES = ['circle', 'square', 'triangle'];
// Bomb/golden are spawned OUTSIDE this rotation (see spawnFruitShape) —
// a fixed per-spawn chance each, not "one more entry in the array,"
// since they need to stay rare rather than as common as the 3 base
// shapes.
// Lowered alongside the higher spawn rate below: at the old 12%, a
// screen with twice as much fruit on it also had twice as many bombs,
// which would have made the game harder rather than easier.
//
// Raised again 2026-11-18 (0.08 -> 0.17) after classroom feedback: with a
// mouse, students scribbled across the whole screen and scored huge,
// because bombs were too rare and too cheap to matter. Wild swiping now
// costs real points, and the mega bomb below punishes it hardest.
//
// The blade never freezes (a later round of feedback, same day: a frozen
// blade felt like the game lagging). The deterrent is points only.
const FRUIT_BOMB_CHANCE = 0.17;
const FRUIT_BOMB_PENALTY = 5;
// The mega bomb: launched twice a round inside a cluster of bait fruit,
// so a careful player slices around it and a scribbler hits it. Slicing
// it halves the score (at least FRUIT_MEGA_MIN_PENALTY).
const FRUIT_MEGA_MIN_PENALTY = 5;
// Combos still reward one clean swipe through a row of fruit, but the
// per-fruit bonus stops growing at +3 so a scribble can't snowball.
const FRUIT_COMBO_MAX_BONUS = 3;
const FRUIT_GOLDEN_CHANCE = 0.09;
// A fast continuous swipe naturally crosses several shapes close
// together in time — this window is what turns that into a recognized
// "combo" instead of just several separate +1s. 220ms comfortably
// covers one swipe gesture without also chaining together two
// deliberately separate slices.
const FRUIT_COMBO_WINDOW_MS = 220;

// Fruit colours, not shape colours: an orange, a berry and a slice of
// watermelon (see drawFruitShape). Each is far enough from the others
// in hue to stay tellable apart at speed on a dark background.
function fruitShapeColor(type){
  if(type === 'bomb') return '#2B2B3A';
  if(type === 'mega') return '#7A1022';
  if(type === 'golden') return '#FFD23F';
  return type === 'circle' ? '#FF9F1C'      // orange
    : type === 'square' ? '#9B5DE5'          // berry
    : '#FF4D6D';                             // watermelon
}

/* =========================================================
   AUDIO — synthesized only, same technique as every other stage
========================================================= */
// The slice sound is the shared three-layer sword slash (see sfxSlash in
// js/audio.js). It replaced a single sine pitch-drop, which read as a
// cartoon "boing" rather than a blade. Intensity rises with the combo so
// a long swipe through several fruit sounds progressively sharper.
function sfxFruitSlice(){
  sfxSlash({ intensity: Math.min(1.4, 0.75 + fruitComboCount * 0.2) });
}

/* =========================================================
   SETUP / TEAMS (same pattern as every other game)
========================================================= */
let fruitRowColors = [];

// Rising "+1" text at each cut point — same shared canvas float-text
// helper every other canvas game now uses, kept as a local module
// variable rather than `state` since it's transient render data, not
// game data (same reasoning as fruitSwipeTrail).
let fruitFloatTexts = [];
// Same "transient render data, not game data" reasoning for the new
// shake/shockwave/combo/flash state below.
let fruitShake = createShakeState();
let fruitShockwaves = [];
let fruitComboCount = 0;
let fruitLastCutAt = 0;
let fruitFlashUntil = 0;
let fruitFlashColor = '#FF4444';
// Round-relative times (ms) at which this round's mega bombs launch.
let fruitMegaTimes = [];
const FRUIT_FLASH_DURATION_MS = 220;
function triggerFruitFlash(color, durationMs = FRUIT_FLASH_DURATION_MS){
  fruitFlashUntil = performance.now() + durationMs;
  fruitFlashColor = color;
}

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('fruitSetup', {
  prefix: 'fruit',
  title: 'Fruit Ninja',
  steps: [
    'One team answers a question.',
    'Swipe or click-drag across a shape to slice it.',
    'Slice as many as you can in 15 seconds - but watch out for bombs!'
  ],
  scoring: [
    { swatch: '<span class="fruit-legend-swatch circle"></span>', label: 'Orange', points: '+1' },
    { swatch: '<span class="fruit-legend-swatch square"></span>', label: 'Berry', points: '+1' },
    { swatch: '<span class="fruit-legend-swatch triangle"></span>', label: 'Watermelon', points: '+1' },
    { swatch: '<span class="fruit-legend-swatch golden"></span>', label: 'Golden star', points: '+3', tone: 'bonus' },
    { swatch: '<span class="fruit-legend-swatch bomb"></span>', label: 'Bomb', points: '&minus;5', tone: 'bad' },
    { swatch: '<span class="fruit-legend-swatch mega"></span>', label: 'MEGA bomb &mdash; halves your score!', points: '&divide;2', tone: 'bad' }
  ],
  tip: 'Careful swipes beat wild ones! Scribbling hits the bombs. One clean swipe through several fruit scores a combo.'
});

export function renderFruitTeamInputs(count){
  renderTeamSetupRows('fruitTeamInputs', 'fruitAddTeamBtn', count, fruitRowColors, renderFruitTeamInputs);
}
renderFruitTeamInputs(2);
wireAddTeamButton('fruitTeamInputs', 'fruitAddTeamBtn', renderFruitTeamInputs);

document.getElementById('fruitStartBtn').addEventListener('click', () => {
  state.fruitTeams = readTeamsFromSetup('fruit', fruitRowColors);
  state.fruitCurrentTeam = 0;
  state.fruitTurnsPlayed = 0;
  state.fruitQuestionOrder = pickQuestions(FRUIT_QUESTIONS);

  showGameScreen('fruit');
  renderFruitScoreboard();
  renderFruitTurnBanner();
});

function renderFruitScoreboard(){
  renderTeamScoreboard('fruitTeamList', state.fruitTeams, state.fruitCurrentTeam);
}
function renderFruitTurnBanner(){
  renderTurnBanner('fruit', state.fruitTeams[state.fruitCurrentTeam], state.fruitTurnsPlayed + 1, GAME_TURNS);
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askFruitQuestion(){
  const q = state.fruitQuestionOrder[state.fruitTurnsPlayed];
  return askTeamQuestion(q, FRUIT_QUESTIONS, state.fruitTurnsPlayed);
}

function showFruitResult(){
  return showTurnResultModal('fruitNextTeamBtn', { teams: state.fruitTeams, currentTeamIndex: state.fruitCurrentTeam });
}

document.getElementById('fruitBeginTurnBtn').addEventListener('click', beginFruitTurn);
async function beginFruitTurn(){
  document.getElementById('fruitBeginTurnBtn').disabled = true;
  await askFruitQuestion();
  startFruitRound();
}

/* =========================================================
   CANVAS SIZING
========================================================= */
// Opaque canvas — see the note on neonCanvasResizer.
const fruitCanvasResizer = createCanvasResizer('fruitCanvas', 'fruitPlayArea', (canvas) => {
  if(!state.fruitRoundActive) renderFruitBackground(fruitCanvasResizer.getContext(), canvas);
}, { contextAttributes: { alpha: false } });
function resizeFruitCanvas(){ fruitCanvasResizer.resize(); }
export function ensureFruitLayout(){
  if(state.fruitTeams.length > 0) resizeFruitCanvas();
}

/* =========================================================
   PARTICLES (same physics formulas used everywhere else here)
========================================================= */
function spawnFruitParticles(x, y, color, count = 16, speedMult = 1){
  count = particleCount(count); // lite mode: fewer per burst (js/quality.js)
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 8 + 2) * speedMult;
    state.fruitParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.02 + 0.015, size: Math.random() * 5 + 2, color
    });
  }
}
function updateFruitParticles(k){
  stepParticles(state.fruitParticles, k, { gravity: 0.2, dragX: 0.98 });
}

/* =========================================================
   SHAPES — launch up from the bottom, arc under gravity, fall away.
   A shape that's never sliced just falls off the bottom with no
   penalty (same "a miss just costs you the point, nothing worse"
   spirit as every other timed mini-game here).
========================================================= */
/* ---- Where a volley comes from (classroom feedback 2026-11-20) ----
   Everything used to come up from the bottom, so a class learned to
   wait at the bottom of the screen. Now each volley picks an edge:
   up from the bottom (still the most common), dropped from the top,
   thrown in from the left or right, or lobbed from a corner. A volley
   keeps to one edge so it reads as "here they come from the left!".
   Shapes that drop from the top fall on a lighter gravity (`g`), so
   they hang about as long as one thrown up from the bottom. */
const FRUIT_LAUNCH_WEIGHTS = [
  ['bottom', 0.4], ['top', 0.2], ['left', 0.12], ['right', 0.12],
  ['cornerBottom', 0.08], ['cornerTop', 0.08]
];
const FRUIT_DROP_GRAVITY = 0.42;   // x FRUIT_GRAVITY for shapes dropped from the top
function pickFruitLaunch(){
  let r = Math.random();
  for(const [edge, w] of FRUIT_LAUNCH_WEIGHTS){ if((r -= w) < 0) return edge; }
  return 'bottom';
}
// Start position and velocity for one shape from the given edge, in the
// same %-of-play-area units as everything else here.
function fruitLaunchFrom(edge){
  const side = Math.random() < 0.5 ? -1 : 1;   // for the corners: left or right
  switch(edge){
    case 'top':
      return { x: 10 + Math.random() * 80, y: -8, vx: (Math.random() - 0.5) * 16, vy: 4 + Math.random() * 10, g: FRUIT_DROP_GRAVITY };
    case 'left':
    case 'right': {
      const dir = edge === 'left' ? 1 : -1;
      return { x: edge === 'left' ? -7 : 107, y: 55 + Math.random() * 30,
        vx: dir * (30 + Math.random() * 16), vy: -(52 + Math.random() * 20), g: 1 };
    }
    case 'cornerBottom':
      return { x: side < 0 ? -5 : 105, y: 106, vx: -side * (26 + Math.random() * 12), vy: -(84 + Math.random() * 16), g: 1 };
    case 'cornerTop':
      return { x: side < 0 ? -6 : 106, y: -6, vx: -side * (24 + Math.random() * 12), vy: 2 + Math.random() * 6, g: FRUIT_DROP_GRAVITY };
    default:
      return { x: 12 + Math.random() * 76, y: 108, vx: (Math.random() - 0.5) * 34,
        // Paired with the halved FRUIT_GRAVITY above: at the old -(110+r*40)
        // these would now sail off the top. Lower launch speed + lower
        // gravity = same peak height, much longer time spent near it.
        vy: -(82 + Math.random() * 26), g: 1 };
  }
}

function spawnFruitShape(opts = {}){
  const roll = Math.random();
  const type = opts.type || (roll < FRUIT_BOMB_CHANCE ? 'bomb'
    : roll < FRUIT_BOMB_CHANCE + FRUIT_GOLDEN_CHANCE ? 'golden'
    : FRUIT_SHAPE_TYPES[Math.floor(Math.random() * FRUIT_SHAPE_TYPES.length)]);
  const launch = fruitLaunchFrom(opts.edge || 'bottom');
  state.fruitShapes.push({
    half: false,
    x: opts.x ?? launch.x, y: launch.y,
    vx: opts.vx ?? launch.vx,
    vy: opts.vy ?? launch.vy,
    g: launch.g,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: type === 'mega' ? 0.8 : (Math.random() - 0.5) * 3.2,
    // Bigger shapes are easier to hit — the swipe test is a distance
    // check against this radius, so this directly widens the margin.
    radiusPct: type === 'mega' ? 8.5 : 5.2 + Math.random() * 2.3,
    type, color: fruitShapeColor(type)
  });
}

// A mega bomb rises through the middle of the screen with a ring of bait
// fruit travelling alongside it - all launched with the same speed, so
// they stay grouped the whole way up and down. Slicing the fruit around
// it is possible with a careful swipe; a scribble hits the bomb.
function spawnMegaVolley(){
  const x = 32 + Math.random() * 36;
  const vx = (Math.random() - 0.5) * 12;
  const vy = -(92 + Math.random() * 10);
  spawnFruitShape({ type: 'mega', x, vx, vy });
  for(const [dx, dvy] of [[-15, 3], [15, 3], [-8, -9], [8, -9]]){
    spawnFruitShape({
      type: FRUIT_SHAPE_TYPES[Math.floor(Math.random() * FRUIT_SHAPE_TYPES.length)],
      x: x + dx, vx, vy: vy + dvy
    });
  }
}

// Splits a whole shape into two halves that fly apart sideways (and
// slightly upward) before gravity takes back over — the "interesting
// physics" of the cut itself, not just a particle burst standing in
// for it. Halves fade out on their own (see updateFruitShapes) and
// can't be cut again.
//
// Three shape types now score differently: a bomb PENALIZES (and
// breaks any combo in progress — a bomb is a mistake, not part of a
// good swipe), a golden fruit is a rare bonus worth more with its own
// richer fanfare, and slicing 2+ shapes within FRUIT_COMBO_WINDOW_MS of
// each other (the natural result of one fast continuous swipe) stacks
// an escalating combo bonus on top of the normal shapes.
function cutFruitShape(shape, canvas){
  const px = (shape.x / 100) * canvas.width, py = (shape.y / 100) * canvas.height;

  if(shape.type === 'mega'){
    const lost = Math.min(state.fruitScore, Math.max(FRUIT_MEGA_MIN_PENALTY, Math.ceil(state.fruitScore / 2)));
    state.fruitScore -= lost;
    document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
    spawnFruitParticles(px, py, '#FF4444', 40, 1.8);
    spawnFruitParticles(px, py, '#FFD23F', 20, 1.4);
    spawnShockwave(fruitShockwaves, px, py, '#FF4444', { big: true });
    spawnShockwave(fruitShockwaves, px, py, '#FFD23F', { big: true });
    spawnFloatText(fruitFloatTexts, px, py, `MEGA BOMB! −${lost}`, '#FF4444', -1.4);
    triggerFruitFlash('#FF2222', 520);
    triggerShake(fruitShake, 14);
    sfxImpact(1.6);
    fruitComboCount = 0;
  } else if(shape.type === 'bomb'){
    const lost = Math.min(state.fruitScore, FRUIT_BOMB_PENALTY);
    state.fruitScore -= lost;
    document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
    spawnFruitParticles(px, py, '#FF6B5B', 22, 1.3);
    spawnShockwave(fruitShockwaves, px, py, '#FF4444', { big: true });
    spawnFloatText(fruitFloatTexts, px, py, `−${FRUIT_BOMB_PENALTY}`, '#FF4444');
    triggerShake(fruitShake, 7);
    sfxImpact(1.1);
    fruitComboCount = 0; // a bomb breaks any combo in progress
  } else {
    const isGolden = shape.type === 'golden';
    const gained = isGolden ? 3 : 1;
    state.fruitScore += gained;
    document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
    spawnFruitParticles(px, py, shape.color, isGolden ? 22 : 10, isGolden ? 1.4 : 1.1);
    spawnFloatText(fruitFloatTexts, px, py, `+${gained}`, shape.color);
    if(isGolden){
      spawnShockwave(fruitShockwaves, px, py, '#FFD23F', {});
      triggerShake(fruitShake, 3);
      sfxRisingChime([880, 1108, 1318, 1568]);
    } else {
      sfxFruitSlice();
    }

    // Combo — see FRUIT_COMBO_WINDOW_MS above. Evaluated live (right at
    // the cut that crosses the threshold) rather than waiting for the
    // swipe to end, so the "DOUBLE!"/"TRIPLE!" callout lands the instant
    // it happens, matching the real-time feel every other "big moment"
    // in this app has.
    const now = performance.now();
    fruitComboCount = (now - fruitLastCutAt < FRUIT_COMBO_WINDOW_MS) ? fruitComboCount + 1 : 1;
    fruitLastCutAt = now;
    if(fruitComboCount >= 2){
      const bonus = Math.min(FRUIT_COMBO_MAX_BONUS, fruitComboCount - 1);
      state.fruitScore += bonus;
      document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
      const label = fruitComboCount === 2 ? 'DOUBLE!' : fruitComboCount === 3 ? 'TRIPLE!' : `COMBO x${fruitComboCount}!`;
      spawnFloatText(fruitFloatTexts, px, py - 6, label, '#7CFFEA', -1.6);
      spawnShockwave(fruitShockwaves, px, py, '#7CFFEA', { big: fruitComboCount >= 3 });
      triggerShake(fruitShake, Math.min(9, 3 + fruitComboCount));
      sfxCombo(fruitComboCount);
    }
  }

  const kick = 32;
  [-1, 1].forEach(side => {
    state.fruitShapes.push({
      half: true, x: shape.x, y: shape.y, g: 1,
      vx: shape.vx + side * kick, vy: Math.min(shape.vy, 10) - 22,
      rotation: shape.rotation, rotSpeed: shape.rotSpeed * 1.4 * side,
      radiusPct: shape.radiusPct * 0.7, type: shape.type, color: shape.color,
      alpha: 1
    });
  });

  state.fruitShapes = state.fruitShapes.filter(s => s !== shape);
}

function distToSegment(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function testFruitCutSegment(p1, p2, canvas){
  // Copy: cutting pushes halves onto (and filters) the live array.
  for(const shape of state.fruitShapes.slice()){
    if(shape.half) continue;
    if(distToSegment(shape.x, shape.y, p1.x, p1.y, p2.x, p2.y) < shape.radiusPct){
      cutFruitShape(shape, canvas);
    }
  }
}

function updateFruitShapes(dtSec){
  for(const s of state.fruitShapes){
    s.vy += FRUIT_GRAVITY * (s.g || 1) * dtSec;
    s.x += s.vx * dtSec;
    s.y += s.vy * dtSec;
    s.rotation += s.rotSpeed * dtSec;
    if(s.half) s.alpha -= dtSec * 1.3;
  }
  // Gone once it falls off the bottom, or flies out past either side
  // (a shape thrown in from one side can sail out of the other).
  state.fruitShapes = state.fruitShapes.filter(s => s.y < 112 && s.x > -15 && s.x < 115 && (!s.half || s.alpha > 0));
}

function updateFruitTrail(){
  const now = performance.now();
  state.fruitSwipeTrail = state.fruitSwipeTrail.filter(p => now - p.createdAt < FRUIT_TRAIL_MAX_AGE_MS);
}

/* =========================================================
   INPUT — swipe (mouse-drag or touch) across the canvas. Every new
   point tested against every live shape as a point-to-segment
   distance check, same "cheap enough at this scale" reasoning as
   Billiards' ball-vs-ball collisions.
========================================================= */
let fruitDragging = false;
let fruitLastPoint = null;

function fruitPointFromEvent(canvas, clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
}

function onFruitPointerDown(e){
  if(!state.fruitRoundActive) return;
  const canvas = fruitCanvasResizer.getCanvas();
  const pt = fruitPointFromEvent(canvas, e.clientX, e.clientY);
  fruitDragging = true;
  fruitLastPoint = pt;
  state.fruitSwipeTrail.push({ x: pt.x, y: pt.y, createdAt: performance.now() });
}
function onFruitPointerMove(e){
  if(!fruitDragging || !state.fruitRoundActive) return;
  const canvas = fruitCanvasResizer.getCanvas();
  const pt = fruitPointFromEvent(canvas, e.clientX, e.clientY);
  state.fruitSwipeTrail.push({ x: pt.x, y: pt.y, createdAt: performance.now() });
  if(fruitLastPoint) testFruitCutSegment(fruitLastPoint, pt, canvas);
  fruitLastPoint = pt;
}
function onFruitPointerUp(){
  fruitDragging = false;
  fruitLastPoint = null;
  window.removeEventListener('mousemove', onFruitPointerMove);
  window.removeEventListener('mouseup', onFruitPointerUp);
}

const fruitCanvasEl = fruitCanvasResizer.getCanvas();
// mousemove/mouseup go on WINDOW rather than the canvas so a swipe that
// leaves the play area mid-drag still tracks and still ends cleanly —
// but they're attached only for the duration of an actual drag. They
// used to be registered permanently at module load, which left two
// global listeners firing on every mouse move anywhere in the app, on
// every stage, whether or not Fruit Ninja had ever been opened.
fruitCanvasEl.addEventListener('mousedown', (e) => {
  if(!state.fruitRoundActive) return;
  onFruitPointerDown(e);
  window.addEventListener('mousemove', onFruitPointerMove);
  window.addEventListener('mouseup', onFruitPointerUp);
});
fruitCanvasEl.addEventListener('touchstart', (e) => { onFruitPointerDown(e.touches[0]); e.preventDefault(); }, { passive: false });
fruitCanvasEl.addEventListener('touchmove', (e) => { onFruitPointerMove(e.touches[0]); e.preventDefault(); }, { passive: false });
fruitCanvasEl.addEventListener('touchend', onFruitPointerUp);

/* =========================================================
   RENDERING
========================================================= */
// This backdrop never changes between resizes, but it used to be rebuilt
// AND re-filled across the full ~1544x784 canvas on every single frame —
// measured at a large share of this game's 50ms/frame budget under
// throttling. Now rasterized once per canvas size and blitted (see
// js/canvasGlow.js). The blit is opaque and full-canvas, so it also
// replaces the frame's clearRect.
const renderFruitBackground = createBackdrop((ctx, w, h) => {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0A1A18');
  bg.addColorStop(0.6, '#123028');
  bg.addColorStop(1, '#05100E');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
});

function drawFruitShape(ctx, canvas, s){
  const x = (s.x / 100) * canvas.width, y = (s.y / 100) * canvas.height;
  const r = canvas.width * (s.radiusPct / 100);
  // The soft halo around each shape was ctx.shadowBlur, re-blurred per
  // shape per frame; it's a cached sprite blit now. Kept deliberately
  // tight (1.45x the shape, not 2.1x) because the retune above roughly
  // tripled how many shapes are airborne at once, and a glow's cost is
  // its AREA — at 2.1x the denser screen measured 36fps, at 1.45x it
  // sits back inside budget with no visible difference to the halo.
  // Bombs keep a larger, redder glow: that one needs to be spotted.
  // Only bombs and the golden star glow now. A glow's cost is its AREA,
  // and a halo behind every one of 10-15 airborne fruit was the single
  // biggest per-frame cost in this game (measured 2026-11-18: 43fps at
  // 1440p with the CPU slowed 6x, the slowest game in the app). Bright
  // fruit on a dark backdrop read fine without one; the halo is kept
  // where it carries meaning - "danger" or "bonus".
  if(!s.half){
    if(s.type === 'mega') drawGlow(ctx, x, y, r * 1.5, '#FF2A2A', 0.55 + 0.25 * Math.sin(performance.now() / 110), 1.8);
    else if(s.type === 'bomb') drawGlow(ctx, x, y, r * 1.4, '#FF4444', 0.5, 1.8);
    else if(s.type === 'golden') drawGlow(ctx, x, y, r * 1.5, '#FFD23F', 0.5, 1.8);
  }
  ctx.save();
  ctx.globalAlpha = s.half ? Math.max(0, s.alpha) : 1;
  ctx.translate(x, y);
  ctx.rotate(s.rotation);

  // The three scoring shapes are drawn as actual fruit rather than a
  // flat circle/square/triangle. The detail is all extra PATHS — a few
  // dozen vector ops per shape — which is a different cost entirely
  // from the fill-rate work that was this game's real bottleneck (see
  // js/canvasGlow.js). No extra glow area, no blur, no bigger fills, so
  // the frame budget is untouched; it just looks like fruit now.
  //
  // Cut halves deliberately keep the plain silhouette: a sliced piece
  // shouldn't still have its leaf and highlight sitting on it, and it
  // keeps the per-frame cost of the busiest moment down.
  ctx.fillStyle = s.color;
  ctx.beginPath();
  if((s.type === 'bomb' || s.type === 'mega') && !s.half){
    // 8-point spiky burst — same silhouette language as Ball Pop's bomb
    // ball (clip-path polygon), redrawn as a canvas path since this
    // game has no per-entity DOM nodes.
    const spikes = 8;
    for(let i = 0; i < spikes * 2; i++){
      const rad = i % 2 === 0 ? r : r * 0.55;
      const a = (Math.PI / spikes) * i;
      const px = Math.sin(a) * rad, py = -Math.cos(a) * rad;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if(s.type === 'golden' && !s.half){
    // Five-pointed star — the rare bonus should be a different SHAPE,
    // not just a gold-coloured version of an ordinary fruit.
    for(let i = 0; i < 10; i++){
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i;
      const px = Math.sin(a) * rad, py = -Math.cos(a) * rad;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if(s.type === 'circle' || s.type === 'golden' || s.type === 'bomb' || s.type === 'mega'){
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if(s.type === 'square'){
    // Rounded, slightly squashed — a berry, not a box.
    const k = r * 0.42;
    ctx.moveTo(-r + k, -r);
    ctx.arcTo(r, -r, r, r, k);
    ctx.arcTo(r, r, -r, r, k);
    ctx.arcTo(-r, r, -r, -r, k);
    ctx.arcTo(-r, -r, r, -r, k);
  } else {
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.87, r * 0.6); ctx.lineTo(-r * 0.87, r * 0.6);
  }
  ctx.closePath();
  ctx.fill();

  // Details are plain arcs and short curves, not rotated ellipses, and
  // as few separate fills as possible: measured 2026-11-18, the old
  // ellipse-based details cost about 6fps on their own at 1440p with the
  // CPU slowed 6x. Same look, from a classroom distance.
  if(!s.half){
    if(s.type === 'circle'){
      // Orange: a leaf on the stalk and a soft highlight.
      ctx.fillStyle = '#4CAF6D';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.82);
      ctx.quadraticCurveTo(r * 0.3, -r * 1.22, r * 0.7, -r * 1.0);
      ctx.quadraticCurveTo(r * 0.36, -r * 0.7, 0, -r * 0.82);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.beginPath();
      ctx.arc(-r * 0.36, -r * 0.36, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if(s.type === 'square'){
      // Berry: a glint.
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(-r * 0.4, -r * 0.42, r * 0.17, 0, Math.PI * 2);
      ctx.fill();
    } else if(s.type === 'triangle'){
      // Watermelon slice: a green rind along the long edge, a pale pith
      // line inside it, and two seeds in the flesh.
      ctx.fillStyle = '#2E9E5B';
      ctx.beginPath();
      ctx.moveTo(-r * 0.87, r * 0.6);
      ctx.lineTo(r * 0.87, r * 0.6);
      ctx.lineTo(r * 0.7, r * 0.26);
      ctx.lineTo(-r * 0.7, r * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(-r * 0.72, r * 0.2, r * 1.44, r * 0.08);
      ctx.fillStyle = '#3A2018';
      ctx.beginPath(); // both seeds in one fill
      ctx.arc(-r * 0.28, -r * 0.05, r * 0.1, 0, Math.PI * 2);
      ctx.moveTo(r * 0.38, -r * 0.05);
      ctx.arc(r * 0.28, -r * 0.05, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if(s.type === 'golden'){
      // A bright core so the star reads as lit from within.
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    } else if(s.type === 'bomb'){
      // A bright, slow-pulsing fuse marks a bomb as "don't slice this"
      // at a glance.
      ctx.fillStyle = '#FF6B5B';
      ctx.beginPath();
      ctx.arc(0, -r * 0.9, r * (0.16 + 0.05 * Math.sin(performance.now() / 90)), 0, Math.PI * 2);
      ctx.fill();
    } else if(s.type === 'mega'){
      // A white warning ring and a big "!" - it has to be unmistakable
      // in a crowd of fruit, from the back of the room.
      ctx.rotate(-s.rotation); // keep the "!" upright
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = r * 0.09;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-r * 0.07, -r * 0.33, r * 0.14, r * 0.38);
      ctx.beginPath();
      ctx.arc(0, r * 0.2, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The blade trail. It used to be two strokes plus a save/restore PER
// SEGMENT, each with its own fading alpha - 40+ strokes a frame during a
// fast swipe, which is exactly when frames matter. Now the segments are
// grouped into three age bands and each band is ONE path, stroked twice
// (wide faint glow, then narrow bright core): six strokes at most.
const FRUIT_TRAIL_BANDS = [
  { minAlpha: 0.66, alpha: 1,    width: 1 },
  { minAlpha: 0.33, alpha: 0.6,  width: 0.7 },
  { minAlpha: 0,    alpha: 0.28, width: 0.45 }
];
function drawFruitTrail(ctx, canvas){
  const trail = state.fruitSwipeTrail;
  if(trail.length < 2) return;
  const now = performance.now();
  const w = canvas.width / 100, h = canvas.height / 100;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for(const band of FRUIT_TRAIL_BANDS){
    ctx.beginPath();
    let any = false;
    for(let i = 1; i < trail.length; i++){
      const b = trail[i];
      const alpha = 1 - (now - b.createdAt) / FRUIT_TRAIL_MAX_AGE_MS;
      if(alpha <= band.minAlpha || (band !== FRUIT_TRAIL_BANDS[0] && alpha > band.minAlpha + 0.34)) continue;
      const a = trail[i - 1];
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      any = true;
    }
    if(!any) continue;
    ctx.globalAlpha = band.alpha * 0.35;
    ctx.strokeStyle = '#7CFFEA';
    ctx.lineWidth = 14 * band.width;
    ctx.stroke();
    ctx.globalAlpha = band.alpha;
    ctx.strokeStyle = '#E7FFF5';
    ctx.lineWidth = 6 * band.width;
    ctx.stroke();
  }
  ctx.restore();
}

function renderFruitCanvas(){
  const canvas = fruitCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = fruitCanvasResizer.getContext();

  // Whole render wrapped in the shared shake helper — same technique
  // (and now the same shared function) Star Defender/Sky Slingshot/
  // Plinko use: translate once at the top, everything drawn after
  // inherits the jitter until restore().
  ctx.save();
  applyShake(ctx, fruitShake);

  renderFruitBackground(ctx, canvas);

  // A bomb slice briefly tints the whole scene — same "impact flash"
  // language as Ball Pop's mega-explosion play-area flash, drawn here
  // as a translucent canvas overlay since this game has no DOM chrome
  // over the play area to toggle a CSS class on.
  if(performance.now() < fruitFlashUntil){
    const remaining = Math.max(0, (fruitFlashUntil - performance.now()) / FRUIT_FLASH_DURATION_MS);
    ctx.save();
    ctx.globalAlpha = remaining * 0.35;
    ctx.fillStyle = fruitFlashColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  for(const s of state.fruitShapes) drawFruitShape(ctx, canvas, s);

  drawFruitTrail(ctx, canvas);

  // One save/restore for the whole batch, no per-particle shadow, and
  // squares rather than arcs: at 2-7px nobody can tell, and a rect fill
  // is far cheaper than building and filling a circle path. A juice
  // burst can put dozens of these on screen at once, which is exactly
  // when the frame budget matters most.
  ctx.save();
  for(const p of state.fruitParticles){
    const sz = Math.max(0.5, p.size) * 1.6;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
  }
  ctx.restore();

  // Same "reference width" scaling convention Star Defender's
  // canvasScale() uses, so the shared helper's default ring sizes read
  // at a consistent visual size in fullscreen vs. compact mode here too.
  drawShockwaves(ctx, fruitShockwaves, canvas.width / FRUIT_REFERENCE_WIDTH);
  drawFloatTexts(ctx, fruitFloatTexts, Math.max(16, canvas.width * 0.028));

  ctx.restore();
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startFruitRound(){
  cancelFruitRound();
  state.fruitRoundActive = true;
  state.fruitScore = 0;
  state.fruitShapes = [];
  state.fruitParticles = [];
  state.fruitSwipeTrail = [];
  fruitFloatTexts = [];
  fruitShockwaves = [];
  fruitShake = createShakeState();
  fruitComboCount = 0;
  fruitLastCutAt = 0;
  fruitFlashUntil = 0;
  // Two mega bombs a round: one early-ish, one late. Never in the first
  // 3s (let them warm up) or the last 3s (no time to see it coming).
  fruitMegaTimes = [3000 + Math.random() * 2500, 8500 + Math.random() * 3000];
  fruitDragging = false;
  fruitLastPoint = null;

  document.getElementById('fruitScoreDisplay').textContent = '0';
  document.getElementById('fruitTimeDisplay').textContent = FRUIT_ROUND_SECONDS;
  setTimerFill(document.getElementById('fruitTimerFill'), 1);

  const playArea = document.getElementById('fruitPlayArea');
  playArea.classList.remove('idle');
  document.getElementById('fruitHint').classList.remove('hidden');
  resizeFruitCanvas();

  let nextSpawnAt = 250;
  const start = performance.now();
  let lastTime = start;
  const timeDisplay = document.getElementById('fruitTimeDisplay');
  const timerFill = document.getElementById('fruitTimerFill');
  const updateTimerHud = createTimerHud(timeDisplay, timerFill, FRUIT_ROUND_SECONDS);

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    noteFrame();
    lastTime = now;
    const elapsedMs = now - start;
    const remaining = Math.max(0, FRUIT_ROUND_SECONDS - elapsedMs / 1000);

    updateTimerHud(remaining);

    if(elapsedMs >= nextSpawnAt){
      // Volleys rather than one-at-a-time. "More fruit being thrown up"
      // reads as a handful launching together, which single shapes on a
      // shorter interval never achieves no matter how short it gets.
      const volley = 1 + Math.floor(Math.random() * 3);
      const edge = pickFruitLaunch();
      for(let i = 0; i < volley; i++) spawnFruitShape({ edge });
      nextSpawnAt = elapsedMs + (420 + Math.random() * 320);
    }
    if(fruitMegaTimes.length && elapsedMs >= fruitMegaTimes[0]){
      fruitMegaTimes.shift();
      spawnMegaVolley();
    }

    updateFruitShapes(dt / 1000);
    updateFruitTrail();
    const k = frameFactor(dt);
    updateFruitParticles(k);
    fruitFloatTexts = updateFloatTexts(fruitFloatTexts, k, 0.02); // shorter-lived than the default: a swipe makes lots of these
    fruitShockwaves = updateShockwaves(fruitShockwaves);
    renderFruitCanvas();

    if(remaining <= 0){ finishFruitRound(); return; }
    state.fruitRoundRAF = requestAnimationFrame(tick);
  }
  state.fruitRoundRAF = requestAnimationFrame(tick);
}

export function cancelFruitRound(){
  if(state.fruitRoundRAF) cancelAnimationFrame(state.fruitRoundRAF);
  state.fruitRoundRAF = null;
  // Also detaches the drag listeners — navigating away mid-swipe would
  // otherwise leave them attached with no mouseup ever coming.
  onFruitPointerUp();
  if(state.fruitRoundActive){
    state.fruitRoundActive = false;
    const playArea = document.getElementById('fruitPlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('fruitHint');
    if(hint) hint.classList.add('hidden');
    const canvas = fruitCanvasResizer.getCanvas();
    if(canvas) renderFruitBackground(fruitCanvasResizer.getContext(), canvas);
    const beginBtn = document.getElementById('fruitBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishFruitRound(){
  state.fruitRoundActive = false;
  state.fruitRoundRAF = null;

  const playArea = document.getElementById('fruitPlayArea');
  playArea.classList.add('idle');
  document.getElementById('fruitHint').classList.add('hidden');

  const team = state.fruitTeams[state.fruitCurrentTeam];
  team.total += state.fruitScore;
  state.fruitTurnsPlayed++;
  renderFruitScoreboard();

  showFruitResult().then(() => {
    if(state.fruitTurnsPlayed >= GAME_TURNS){
      endFruitGame();
    } else {
      state.fruitCurrentTeam = (state.fruitCurrentTeam + 1) % state.fruitTeams.length;
      renderFruitScoreboard();
      renderFruitTurnBanner();
      document.getElementById('fruitBeginTurnBtn').disabled = false;
      document.getElementById('fruitTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('fruitTimerFill'), 1);
    }
  });
}

function endFruitGame(){
  const winnerText = finishTeamGame({ prefix: 'fruit', teams: state.fruitTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('fruitTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'fruit',
  getTeams: () => state.fruitTeams,
  renderScoreboard: renderFruitScoreboard,
  cancelRound: cancelFruitRound
});

document.getElementById('fruitBackBtn').addEventListener('click', () => goToStage(15));
// Wired here (the target stage's own file), not in stage11 — same
// existing convention as billiardsNextStageBtn: a "Next" button's
// click handler lives in the file for the stage it goes TO.
document.getElementById('neonNextStageBtn').addEventListener('click', () => goToStage(16));
