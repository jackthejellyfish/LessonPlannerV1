import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { FRUIT_QUESTIONS } from '../content/stage15-fruitninja.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves } from '../canvasEffects.js';

/* =========================================================
   STAGE 15 — FRUIT NINJA
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
const FRUIT_ROUND_SECONDS = 10;
const FRUIT_GRAVITY = 130; // %/second² — shapes launch up, arc, and fall back under this; lowered from 160 for a gentler, slower fall
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
const FRUIT_BOMB_CHANCE = 0.12;
const FRUIT_GOLDEN_CHANCE = 0.08;
// A fast continuous swipe naturally crosses several shapes close
// together in time — this window is what turns that into a recognized
// "combo" instead of just several separate +1s. 220ms comfortably
// covers one swipe gesture without also chaining together two
// deliberately separate slices.
const FRUIT_COMBO_WINDOW_MS = 220;

function fruitShapeColor(type){
  if(type === 'bomb') return '#2B2B3A';
  if(type === 'golden') return '#FFD23F';
  return type === 'circle' ? '#F2B705' : type === 'square' ? '#3DB88D' : '#FF6B6B';
}

/* =========================================================
   AUDIO — synthesized only, same technique as every other stage
========================================================= */
function sfxFruitSlice(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.09);
  gain.gain.value = 0.14;
  osc.connect(gain).connect(ctx.destination);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
  osc.start();
  osc.stop(ctx.currentTime + 0.11);
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
const FRUIT_FLASH_DURATION_MS = 220;
function triggerFruitFlash(color, durationMs = FRUIT_FLASH_DURATION_MS){
  fruitFlashUntil = performance.now() + durationMs;
  fruitFlashColor = color;
}

export function renderFruitTeamInputs(count){
  renderTeamSetupRows('fruitTeamInputs', 'fruitAddTeamBtn', count, fruitRowColors, renderFruitTeamInputs);
}
renderFruitTeamInputs(2);
wireAddTeamButton('fruitTeamInputs', 'fruitAddTeamBtn', renderFruitTeamInputs);

document.getElementById('fruitStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#fruitTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.fruitTeams = names.map((name, i) => ({ name, color: fruitRowColors[i], total: 0 }));
  state.fruitCurrentTeam = 0;
  state.fruitTurnsPlayed = 0;
  state.fruitQuestionOrder = shuffle(FRUIT_QUESTIONS.map((_, i) => i));

  document.getElementById('fruitSetup').classList.add('hidden');
  document.getElementById('fruitGame').classList.remove('hidden');
  document.getElementById('fruitGameOverBanner').classList.add('hidden');
  renderFruitScoreboard();
  renderFruitTurnBanner();
});

function renderFruitScoreboard(){
  renderTeamScoreboard('fruitTeamList', state.fruitTeams, state.fruitCurrentTeam);
}
function renderFruitTurnBanner(){
  document.getElementById('fruitTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.fruitTeams[state.fruitCurrentTeam].name)}</strong>'s turn — question ${state.fruitTurnsPlayed + 1} of ${FRUIT_QUESTIONS.length}`;
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askFruitQuestion(){
  const qIndex = state.fruitQuestionOrder[state.fruitTurnsPlayed];
  const q = FRUIT_QUESTIONS[qIndex];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
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
const fruitCanvasResizer = createCanvasResizer('fruitCanvas', 'fruitPlayArea');
function resizeFruitCanvas(){ fruitCanvasResizer.resize(); }
export function ensureFruitLayout(){
  if(state.fruitTeams.length > 0) resizeFruitCanvas();
}

/* =========================================================
   PARTICLES (same physics formulas used everywhere else here)
========================================================= */
function spawnFruitParticles(x, y, color, count = 16, speedMult = 1){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 8 + 2) * speedMult;
    state.fruitParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.02 + 0.015, size: Math.random() * 5 + 2, color
    });
  }
}
function updateFruitParticles(){
  for(const p of state.fruitParticles){
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.2; p.vx *= 0.98;
    p.alpha -= p.decay; p.size *= 0.97;
  }
  state.fruitParticles = state.fruitParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

/* =========================================================
   SHAPES — launch up from the bottom, arc under gravity, fall away.
   A shape that's never sliced just falls off the bottom with no
   penalty (same "a miss just costs you the point, nothing worse"
   spirit as every other timed mini-game here).
========================================================= */
function spawnFruitShape(){
  const roll = Math.random();
  const type = roll < FRUIT_BOMB_CHANCE ? 'bomb'
    : roll < FRUIT_BOMB_CHANCE + FRUIT_GOLDEN_CHANCE ? 'golden'
    : FRUIT_SHAPE_TYPES[Math.floor(Math.random() * FRUIT_SHAPE_TYPES.length)];
  state.fruitShapes.push({
    half: false,
    x: 15 + Math.random() * 70, y: 108,
    vx: (Math.random() - 0.5) * 40,
    // Dialed back from -(150 + rand*70) — that reached too high (shapes
    // flying off the top of the play area). Still noticeably higher than
    // the original -(75 + rand*35), just landing in the upper-middle
    // instead of grazing/leaving the top edge.
    vy: -(110 + Math.random() * 40),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 4,
    radiusPct: 4.5 + Math.random() * 2,
    type, color: fruitShapeColor(type)
  });
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

  if(shape.type === 'bomb'){
    state.fruitScore = Math.max(0, state.fruitScore - 2);
    document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
    spawnFruitParticles(px, py, '#FF6B5B', 22, 1.3);
    spawnShockwave(fruitShockwaves, px, py, '#FF4444', { big: true });
    spawnFloatText(fruitFloatTexts, px, py, '−2', '#FF4444');
    triggerFruitFlash('#FF4444');
    triggerShake(fruitShake, 7);
    sfxImpact(1.1);
    fruitComboCount = 0; // a bomb is a mistake, not a slice to chain off
  } else {
    const isGolden = shape.type === 'golden';
    const gained = isGolden ? 3 : 1;
    state.fruitScore += gained;
    document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
    spawnFruitParticles(px, py, shape.color, isGolden ? 26 : 16, isGolden ? 1.4 : 1);
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
      const bonus = fruitComboCount - 1;
      state.fruitScore += bonus;
      document.getElementById('fruitScoreDisplay').textContent = String(state.fruitScore);
      const label = fruitComboCount === 2 ? 'DOUBLE!' : fruitComboCount === 3 ? 'TRIPLE!' : `COMBO x${fruitComboCount}!`;
      spawnFloatText(fruitFloatTexts, px, py - 6, label, '#7CFFEA', -1.6);
      spawnShockwave(fruitShockwaves, px, py, '#7CFFEA', { big: fruitComboCount >= 3 });
      triggerShake(fruitShake, Math.min(9, 3 + fruitComboCount));
      sfxRisingChime([700, 900, 1100, 1300].slice(0, Math.min(4, fruitComboCount)), { stagger: 0.045, duration: 0.09 });
    }
  }

  const kick = 32;
  [-1, 1].forEach(side => {
    state.fruitShapes.push({
      half: true, x: shape.x, y: shape.y,
      vx: shape.vx + side * kick, vy: shape.vy - 22,
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
  for(const shape of state.fruitShapes){
    if(shape.half) continue;
    if(distToSegment(shape.x, shape.y, p1.x, p1.y, p2.x, p2.y) < shape.radiusPct){
      cutFruitShape(shape, canvas);
    }
  }
}

function updateFruitShapes(dtSec){
  for(const s of state.fruitShapes){
    s.vy += FRUIT_GRAVITY * dtSec;
    s.x += s.vx * dtSec;
    s.y += s.vy * dtSec;
    s.rotation += s.rotSpeed * dtSec;
    if(s.half) s.alpha -= dtSec * 1.3;
  }
  state.fruitShapes = state.fruitShapes.filter(s => s.y < 112 && (!s.half || s.alpha > 0));
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
}

const fruitCanvasEl = fruitCanvasResizer.getCanvas();
fruitCanvasEl.addEventListener('mousedown', onFruitPointerDown);
window.addEventListener('mousemove', onFruitPointerMove);
window.addEventListener('mouseup', onFruitPointerUp);
fruitCanvasEl.addEventListener('touchstart', (e) => { onFruitPointerDown(e.touches[0]); e.preventDefault(); }, { passive: false });
fruitCanvasEl.addEventListener('touchmove', (e) => { onFruitPointerMove(e.touches[0]); e.preventDefault(); }, { passive: false });
fruitCanvasEl.addEventListener('touchend', onFruitPointerUp);

/* =========================================================
   RENDERING
========================================================= */
function renderFruitBackground(ctx, canvas){
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#0A1A18');
  bg.addColorStop(0.6, '#123028');
  bg.addColorStop(1, '#05100E');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFruitShape(ctx, canvas, s){
  const x = (s.x / 100) * canvas.width, y = (s.y / 100) * canvas.height;
  const r = canvas.width * (s.radiusPct / 100);
  ctx.save();
  ctx.globalAlpha = s.half ? Math.max(0, s.alpha) : 1;
  ctx.translate(x, y);
  ctx.rotate(s.rotation);
  ctx.shadowColor = s.color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = s.color;
  ctx.beginPath();
  if(s.type === 'bomb' && !s.half){
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
  } else if(s.type === 'circle' || s.type === 'golden'){
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if(s.type === 'square'){
    ctx.rect(-r, -r, r * 2, r * 2);
  } else {
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.87, r * 0.6); ctx.lineTo(-r * 0.87, r * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  // A bright, slow-pulsing fuse dot on top marks a bomb as "don't slice
  // this" at a glance, distinct from the 3 flat-colored regular shapes.
  if(s.type === 'bomb' && !s.half){
    ctx.shadowColor = '#FF4444'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#FF6B5B';
    ctx.beginPath();
    ctx.arc(0, -r * 0.9, r * (0.16 + 0.05 * Math.sin(performance.now() / 90)), 0, Math.PI * 2);
    ctx.fill();
  }
  // A thin bright outer ring reads as "special/valuable" for the rare
  // golden fruit, on top of its already-heavier glow above.
  if(s.type === 'golden' && !s.half){
    ctx.strokeStyle = '#FFF6D9';
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 120);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderFruitCanvas(){
  const canvas = fruitCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

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

  const now = performance.now();
  const trail = state.fruitSwipeTrail;
  for(let i = 1; i < trail.length; i++){
    const a = trail[i - 1], b = trail[i];
    const alpha = Math.max(0, 1 - (now - b.createdAt) / FRUIT_TRAIL_MAX_AGE_MS);
    if(alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#E7FFF5';
    ctx.shadowColor = '#7CFFEA';
    ctx.shadowBlur = 10;
    ctx.lineWidth = Math.max(1, 6 * alpha);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo((a.x / 100) * canvas.width, (a.y / 100) * canvas.height);
    ctx.lineTo((b.x / 100) * canvas.width, (b.y / 100) * canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  for(const p of state.fruitParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
  fruitDragging = false;
  fruitLastPoint = null;

  document.getElementById('fruitScoreDisplay').textContent = '0';
  document.getElementById('fruitTimeDisplay').textContent = FRUIT_ROUND_SECONDS;
  document.getElementById('fruitTimerFill').style.width = '100%';

  const playArea = document.getElementById('fruitPlayArea');
  playArea.classList.remove('idle');
  document.getElementById('fruitHint').classList.remove('hidden');
  resizeFruitCanvas();

  let nextSpawnAt = 400;
  const start = performance.now();
  let lastTime = start;
  const timeDisplay = document.getElementById('fruitTimeDisplay');
  const timerFill = document.getElementById('fruitTimerFill');

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    const elapsedMs = now - start;
    const remaining = Math.max(0, FRUIT_ROUND_SECONDS - elapsedMs / 1000);

    timeDisplay.textContent = Math.ceil(remaining);
    timerFill.style.width = (remaining / FRUIT_ROUND_SECONDS * 100) + '%';

    if(elapsedMs >= nextSpawnAt){
      spawnFruitShape();
      nextSpawnAt = elapsedMs + (500 + Math.random() * 450);
    }

    updateFruitShapes(dt / 1000);
    updateFruitTrail();
    updateFruitParticles();
    fruitFloatTexts = updateFloatTexts(fruitFloatTexts);
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
  fruitDragging = false;
  fruitLastPoint = null;
  if(state.fruitRoundActive){
    state.fruitRoundActive = false;
    const playArea = document.getElementById('fruitPlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('fruitHint');
    if(hint) hint.classList.add('hidden');
    const canvas = fruitCanvasResizer.getCanvas();
    if(canvas){ const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
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
    if(state.fruitTurnsPlayed >= FRUIT_QUESTIONS.length){
      endFruitGame();
    } else {
      state.fruitCurrentTeam = (state.fruitCurrentTeam + 1) % state.fruitTeams.length;
      renderFruitScoreboard();
      renderFruitTurnBanner();
      document.getElementById('fruitBeginTurnBtn').disabled = false;
      document.getElementById('fruitTimeDisplay').textContent = '--';
      document.getElementById('fruitTimerFill').style.width = '100%';
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

document.getElementById('fruitBackBtn').addEventListener('click', () => goToStage(14));
// Wired here (the target stage's own file), not in stage14 — same
// existing convention as billiardsNextStageBtn/cometNextStageBtn: a
// "Next" button's click handler lives in the file for the stage it
// goes TO.
document.getElementById('neonNextStageBtn').addEventListener('click', () => goToStage(15));
