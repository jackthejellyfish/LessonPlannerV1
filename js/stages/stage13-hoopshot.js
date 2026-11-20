import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { beep, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { HOOP_QUESTIONS } from '../content/stage13-hoopshot.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves, frameFactor } from '../canvasEffects.js';
import { createBackdrop, drawGlow } from '../canvasGlow.js';
import { setTimerFill } from '../hud.js';
import { noteFrame } from '../quality.js';

/* =========================================================
   STAGE 13 — HOOP SHOT

   Answer a question, then take two shots at the hoop (three until
   2026-11-19, cut to two after classroom feedback).

   v3 rework, per classroom feedback:
   - The hoop NEVER moves. A moving hoop turned the game into a
     reaction test; a fixed one makes it about judging the arc.
   - Angle and power are set DIRECTLY — big +/- buttons (hold to
     repeat), tapping the court to point the shot, or the arrow keys —
     and nothing fires until SHOOT is pressed. The previous version
     used two timed sweeps, which made a good shot mostly luck.
   - The only thing that changes is WHERE THE BALL STARTS: every shot
     gets a fresh spot on the court, so a team can't find one setting
     and repeat it, and every play is different.

   Coordinates are percent of the canvas (x of width, y of height),
   like every other game here, so gameplay is identical at any size.
   The launch angle is applied with ASPECT_REF so that the number on
   the button roughly matches the angle you see on a typical
   widescreen board, rather than the distorted %-space angle.

   Tuning: SPEED_MIN/MAX and the ball's x range were chosen by
   simulating every angle x power combination for every start spot
   against this geometry (at 1.97:1 and 1.45:1 aspect): every spot has
   a band of scoring shots, and those bands sit between ~20% and 100%
   power, so the whole meter is live.
========================================================= */
const HOOP_SHOTS_PER_TURN = 2;
const HOOP_GRAVITY = 155;          // %H/second²
const HOOP_FLOOR_Y = 80;           // court line; the control dock sits below it
const HOOP_RIM_Y = 30;             // height of the rim
const HOOP_X = 80;                 // centre of the rim — fixed
const HOOP_RIM_HALF_W = 6.2;       // half the rim's width, % of canvas width
const HOOP_BALL_R = 3.2;           // ball radius, % of canvas width
const HOOP_BALL_X_MIN = 8;         // where a ball may spawn
const HOOP_BALL_X_MAX = 56;
const HOOP_ASPECT_REF = 1.9;
const HOOP_SPEED_MIN = 58;         // %W/second at 0% power
const HOOP_SPEED_MAX = 106;        // ... at 100% power
const HOOP_ANGLE_MIN = 15;
const HOOP_ANGLE_MAX = 85;
const HOOP_DEFAULT_ANGLE = 55;
const HOOP_DEFAULT_POWER = 50;     // percent
// How much of the predicted path is drawn. Up to the top of the arc
// only: enough to aim with, not enough to solve the shot for you.
const HOOP_PREVIEW_TO_APEX = true;
// Backstop for a shot that never settles (a ball wedged bouncing
// between the board and the rim).
const HOOP_SHOT_TIMEOUT_MS = 4200;

const HOOP_BALL_COLOR = '#FF8C3B';
const HOOP_RIM_COLOR = '#FF4D4D';

/* =========================================================
   AUDIO
========================================================= */
function sfxHoopLaunch(){
  beep(320, 0.07, 'triangle', 0.09);
  beep(520, 0.06, 'sine', 0.06, 0.03);
}
// A soft click for every angle/power step, quiet enough to hold down.
function sfxHoopAdjust(up){
  beep(up ? 980 : 760, 0.025, 'triangle', 0.035);
}
function sfxHoopBounce(force){
  // Pitch rises with impact speed, so a hard clang off the rim sounds
  // different from the ball softly settling on the floor.
  beep(180 + Math.min(260, force * 7), 0.07, 'triangle', 0.06 + Math.min(0.07, force * 0.002));
}
function sfxHoopScore(swish){
  if(swish){
    sfxRisingChime([784, 988, 1175, 1568, 1976], { duration: 0.14, volume: 0.15, stagger: 0.05 });
  } else {
    sfxRisingChime([659, 880, 1109], { duration: 0.13, volume: 0.14, stagger: 0.06 });
  }
}

/* =========================================================
   SETUP / TEAMS
========================================================= */
let hoopRowColors = [];
let hoopFloatTexts = [];
let hoopShockwaves = [];
let hoopShake = createShakeState();

renderGameIntro('hoopSetup', {
  prefix: 'hoop',
  title: 'Hoop Shot',
  steps: [
    'One team answers a question.',
    'Set the angle and the power, then press SHOOT.',
    'You get two shots. The ball starts somewhere new every time!'
  ],
  scoring: [
    { swatch: '<span class="hoop-legend-swatch basket"></span>', label: 'In the hoop', points: '+3' },
    { swatch: '<span class="hoop-legend-swatch swish"></span>', label: 'Swish &mdash; straight in, no rim', points: '+5', tone: 'bonus' },
    { swatch: '<span class="hoop-legend-swatch miss"></span>', label: 'Miss', points: '0' }
  ],
  tip: 'Use the &minus; and + buttons (hold them down to go faster), or tap the court to point the shot. The dotted line shows the start of the throw.'
});

export function renderHoopTeamInputs(count){
  renderTeamSetupRows('hoopTeamInputs', 'hoopAddTeamBtn', count, hoopRowColors, renderHoopTeamInputs);
}
renderHoopTeamInputs(2);
wireAddTeamButton('hoopTeamInputs', 'hoopAddTeamBtn', renderHoopTeamInputs);

document.getElementById('hoopStartBtn').addEventListener('click', () => {
  state.hoopTeams = readTeamsFromSetup('hoop', hoopRowColors);
  state.hoopCurrentTeam = 0;
  state.hoopTurnsPlayed = 0;
  state.hoopQuestionOrder = shuffle(HOOP_QUESTIONS.map((_, i) => i));

  showGameScreen('hoop');
  renderHoopScoreboard();
  renderHoopTurnBanner();
  ensureHoopLayout();
});

function renderHoopScoreboard(){
  renderTeamScoreboard('hoopTeamList', state.hoopTeams, state.hoopCurrentTeam);
}
function renderHoopTurnBanner(){
  renderTurnBanner('hoop', state.hoopTeams[state.hoopCurrentTeam], state.hoopTurnsPlayed + 1, HOOP_QUESTIONS.length);
}

/* =========================================================
   CANVAS
========================================================= */
// A resize wipes the canvas buffer; make sure the next frame repaints.
// Opaque canvas — see the note on neonCanvasResizer in stage 11.
const hoopCanvasResizer = createCanvasResizer('hoopCanvas', 'hoopPlayArea', (canvas) => {
  invalidateHoop();
  if(!state.hoopRoundActive) renderHoopBackground(hoopCanvasResizer.getContext(), canvas);
}, { contextAttributes: { alpha: false } });

/* ---- Render on demand ----
   Most of a Hoop Shot turn is a team deciding on an angle and power
   while nothing moves. The loop used to redraw the court 60 times a
   second through all of it. Now it only draws while something is in
   motion (the ball in flight, an effect fading, a shake), plus a couple
   of frames after. Every aim change goes through syncHoopControls(),
   which marks the canvas dirty, so the preview arc still follows the
   controls instantly. */
let hoopDirtyFrames = 2;
function invalidateHoop(){ hoopDirtyFrames = 2; }
function hoopSceneIsMoving(){
  return (hoopBall && hoopBall.flying) || hoopFloatTexts.length > 0 || hoopShockwaves.length > 0
    || performance.now() < hoopShake.until;
}
export function ensureHoopLayout(){
  if(state.hoopTeams.length > 0){ hoopCanvasResizer.resize(); renderHoopCanvas(); }
}

// Ball radius expressed in %-of-HEIGHT, for floor contact. The canvas
// is wider than it is tall, so a radius in %W is bigger in %H.
function ballRadiusY(){
  const c = hoopCanvasResizer.getCanvas();
  return c && c.height ? HOOP_BALL_R * (c.width / c.height) : HOOP_BALL_R * 1.9;
}

const renderHoopBackground = createBackdrop((ctx, w, h) => {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#20143A');
  bg.addColorStop(0.55, '#2C1B4D');
  bg.addColorStop(1, '#140C26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Crowd: three rows of small dim blobs up in the stands.
  const floorY = (HOOP_FLOOR_Y / 100) * h;
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for(let row = 0; row < 3; row++){
    const cy = floorY - h * (0.2 + row * 0.052);
    for(let x = w * 0.015; x < w; x += w * 0.031){
      ctx.globalAlpha = 0.07 + rnd() * 0.07;
      ctx.fillStyle = ['#FFD9A0', '#9FD8FF', '#FFAFC8', '#C8FFB0'][Math.floor(rnd() * 4)];
      ctx.beginPath();
      ctx.arc(x + rnd() * w * 0.014, cy, w * 0.0062, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Court floor: wood, with a three-point-style arc and a darker apron
  // under the control dock.
  const floor = ctx.createLinearGradient(0, floorY, 0, h);
  floor.addColorStop(0, '#9A6532');
  floor.addColorStop(1, '#5C3A18');
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, w, h - floorY);
  ctx.strokeStyle = 'rgba(255,230,190,0.28)';
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
  // Floorboards
  ctx.strokeStyle = 'rgba(60,30,10,0.25)';
  for(let i = 1; i < 4; i++){
    const y = floorY + (h - floorY) * (i / 4);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Fixed hoop furniture — post and backboard never move, so they live
  // in the cached backdrop rather than being redrawn every frame.
  const ry = (HOOP_RIM_Y / 100) * h;
  const boardX = ((HOOP_X + HOOP_RIM_HALF_W + 1.6) / 100) * w;
  ctx.fillStyle = '#4A3A6B';
  ctx.fillRect(boardX + w * 0.012, ry - h * 0.08, w * 0.014, floorY - ry + h * 0.08);
  ctx.fillStyle = 'rgba(244,240,255,0.95)';
  ctx.fillRect(boardX, ry - h * 0.2, w * 0.011, h * 0.235);
  ctx.fillStyle = HOOP_RIM_COLOR;
  ctx.fillRect(boardX, ry + h * 0.012, w * 0.011, h * 0.023);
});

/* =========================================================
   SHOT STATE
   Transient render/aim data lives in module scope (same convention as
   every other game here); the scoring data lives in `state`.
========================================================= */
let hoopBall = null;          // {x, y, vx, vy, flying, touchedRim}
let hoopAngle = HOOP_DEFAULT_ANGLE;   // degrees
let hoopPower = HOOP_DEFAULT_POWER;   // 0..100
let hoopLastSpawnX = null;
let hoopShotStartedAt = 0;
let hoopResolving = false;

// A new spot for every ball, never too close to the last one — two
// near-identical spots in a row would let a team just repeat a shot.
function pickHoopSpawnX(){
  let x;
  for(let tries = 0; tries < 20; tries++){
    x = HOOP_BALL_X_MIN + Math.random() * (HOOP_BALL_X_MAX - HOOP_BALL_X_MIN);
    if(hoopLastSpawnX === null || Math.abs(x - hoopLastSpawnX) > 10) break;
  }
  hoopLastSpawnX = x;
  return x;
}

function resetHoopBall(){
  hoopBall = { x: pickHoopSpawnX(), y: HOOP_FLOOR_Y - ballRadiusY(), vx: 0, vy: 0, flying: false, touchedRim: false };
  setHoopHint('Set the angle and power, then SHOOT!');
  syncHoopControls();
}

function setHoopHint(text){
  const hint = document.getElementById('hoopHint');
  if(hint) hint.textContent = text;
}

function hoopCanAim(){
  return state.hoopRoundActive && !hoopResolving && hoopBall && !hoopBall.flying;
}

/* =========================================================
   CONTROLS — angle, power, shoot
========================================================= */
// The angle shown is what the arrow looks like on screen. Physics runs
// in %-space, so convert through the live canvas shape.
function visualAngle(){
  const c = hoopCanvasResizer.getCanvas();
  const aspect = c && c.height ? c.width / c.height : HOOP_ASPECT_REF;
  const rad = (hoopAngle * Math.PI) / 180;
  return Math.round(Math.atan2(Math.sin(rad) * HOOP_ASPECT_REF / aspect, Math.cos(rad)) * 180 / Math.PI);
}

function syncHoopControls(){
  invalidateHoop();
  const aim = hoopCanAim();
  document.getElementById('hoopAngleValue').textContent = `${visualAngle()}°`;
  document.getElementById('hoopPowerValue').textContent = `${Math.round(hoopPower)}%`;
  document.getElementById('hoopPowerFill').style.width = `${hoopPower}%`;
  document.querySelectorAll('#hoopControls button').forEach(b => { b.disabled = !aim; });
  if(aim){
    document.getElementById('hoopAngleDown').disabled = hoopAngle <= HOOP_ANGLE_MIN;
    document.getElementById('hoopAngleUp').disabled = hoopAngle >= HOOP_ANGLE_MAX;
    document.getElementById('hoopPowerDown').disabled = hoopPower <= 0;
    document.getElementById('hoopPowerUp').disabled = hoopPower >= 100;
  }
}

function adjustHoop(kind, dir){
  if(!hoopCanAim()) return false;
  const before = kind === 'angle' ? hoopAngle : hoopPower;
  if(kind === 'angle') hoopAngle = Math.max(HOOP_ANGLE_MIN, Math.min(HOOP_ANGLE_MAX, hoopAngle + dir));
  else hoopPower = Math.max(0, Math.min(100, hoopPower + dir));
  const after = kind === 'angle' ? hoopAngle : hoopPower;
  if(after === before) return false;
  sfxHoopAdjust(dir > 0);
  syncHoopControls();
  return true;
}

// Hold-to-repeat: one step on press, then after a short pause it keeps
// stepping, faster the longer it's held. Pointer events cover mouse,
// pen and touch alike; pointer capture means a finger sliding off the
// button still releases it properly.
function wireHoldButton(id, kind, dir){
  const btn = document.getElementById(id);
  let timer = null;
  const stop = () => { clearTimeout(timer); timer = null; };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch(_){ /* ignore */ }
    adjustHoop(kind, dir);
    let delay = 320, held = 0;
    const repeat = () => {
      held++;
      if(!adjustHoop(kind, held > 12 ? dir * 2 : dir)) { stop(); return; }
      delay = Math.max(45, delay * 0.8);
      timer = setTimeout(repeat, delay);
    };
    timer = setTimeout(repeat, delay);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
  // Keyboard users: Enter/Space on a focused button steps once.
  btn.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); adjustHoop(kind, dir); }
  });
}
wireHoldButton('hoopAngleDown', 'angle', -1);
wireHoldButton('hoopAngleUp', 'angle', 1);
wireHoldButton('hoopPowerDown', 'power', -1);
wireHoldButton('hoopPowerUp', 'power', 1);

document.getElementById('hoopShootBtn').addEventListener('click', shootHoop);

// Arrow keys and Space, only while Hoop Shot is the open stage and no
// modal is up.
document.addEventListener('keydown', (e) => {
  if(state.currentStage !== 13 || !hoopCanAim()) return;
  if(document.querySelector('.overlay:not(.hidden)')) return;
  if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const map = { ArrowUp: ['angle', 1], ArrowDown: ['angle', -1], ArrowRight: ['power', 1], ArrowLeft: ['power', -1] };
  if(map[e.key]){ e.preventDefault(); adjustHoop(map[e.key][0], map[e.key][1]); return; }
  if(e.key === ' ' || e.key === 'Enter'){
    if(e.target && e.target.tagName === 'BUTTON' && e.target.closest('#hoopControls')) return;
    e.preventDefault(); shootHoop();
  }
});

// Tap (or press and slide) anywhere on the court to POINT the shot:
// the direction from the ball to your finger sets the angle, and the
// distance sets the power. It never fires the ball — that's SHOOT's
// job — so a slip on the board costs nothing.
function aimAtPointer(e){
  if(!hoopCanAim()) return;
  const canvas = hoopCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * 100;
  const py = ((e.clientY - rect.top) / rect.height) * 100;
  const dx = px - hoopBall.x;
  const dy = (hoopBall.y - py) / HOOP_ASPECT_REF;
  if(dx <= 0.5 && dy <= 0.5) return;
  const ang = Math.atan2(Math.max(0, dy), Math.max(0.01, dx)) * 180 / Math.PI;
  hoopAngle = Math.round(Math.max(HOOP_ANGLE_MIN, Math.min(HOOP_ANGLE_MAX, ang)));
  // Distance measured on screen (in % of width), so it feels the same
  // in every direction. 45% of the court's width away = full power.
  const dyOnScreen = (hoopBall.y - py) * (rect.height / rect.width);
  hoopPower = Math.round(Math.max(0, Math.min(100, (Math.hypot(dx, dyOnScreen) / 45) * 100)));
  syncHoopControls();
}
const hoopCanvasEl = hoopCanvasResizer.getCanvas();
let hoopPointerAiming = false;
hoopCanvasEl.addEventListener('pointerdown', (e) => {
  if(!hoopCanAim()) return;
  hoopPointerAiming = true;
  try { hoopCanvasEl.setPointerCapture(e.pointerId); } catch(_){ /* ignore */ }
  aimAtPointer(e);
  e.preventDefault();
});
hoopCanvasEl.addEventListener('pointermove', (e) => { if(hoopPointerAiming) aimAtPointer(e); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev =>
  hoopCanvasEl.addEventListener(ev, () => { hoopPointerAiming = false; }));

function hoopLaunchVector(angleDeg, powerPct){
  const rad = (angleDeg * Math.PI) / 180;
  const speed = HOOP_SPEED_MIN + (powerPct / 100) * (HOOP_SPEED_MAX - HOOP_SPEED_MIN);
  return { vx: Math.cos(rad) * speed, vy: -Math.sin(rad) * speed * HOOP_ASPECT_REF };
}

function shootHoop(){
  if(!hoopCanAim()) return;
  const v = hoopLaunchVector(hoopAngle, hoopPower);
  hoopBall.vx = v.vx;
  hoopBall.vy = v.vy;
  hoopBall.flying = true;
  hoopBall.touchedRim = false;
  hoopShotStartedAt = performance.now();
  setHoopHint('Here it goes...');
  syncHoopControls();
  sfxHoopLaunch();
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askHoopQuestion(){
  const q = HOOP_QUESTIONS[state.hoopQuestionOrder[state.hoopTurnsPlayed]];
  return askTeamQuestion(q, HOOP_QUESTIONS, state.hoopTurnsPlayed);
}

document.getElementById('hoopBeginTurnBtn').addEventListener('click', async () => {
  document.getElementById('hoopBeginTurnBtn').disabled = true;
  await askHoopQuestion();
  startHoopRound();
});

function startHoopRound(){
  cancelHoopRound();
  state.hoopRoundActive = true;
  state.hoopScore = 0;
  state.hoopShotsLeft = HOOP_SHOTS_PER_TURN;
  hoopFloatTexts = [];
  hoopShockwaves = [];
  hoopShake = createShakeState();
  hoopResolving = false;
  hoopAngle = HOOP_DEFAULT_ANGLE;
  hoopPower = HOOP_DEFAULT_POWER;

  document.getElementById('hoopScoreDisplay').textContent = '0';
  document.getElementById('hoopShotsDisplay').textContent = String(HOOP_SHOTS_PER_TURN);
  setTimerFill(document.getElementById('hoopTimerFill'), 1);
  document.getElementById('hoopPlayArea').classList.remove('idle');
  document.getElementById('hoopHint').classList.remove('hidden');
  hoopCanvasResizer.resize();
  resetHoopBall();

  let last = performance.now();
  function tick(now){
    const dt = Math.min(50, now - last) / 1000;
    noteFrame();
    last = now;
    updateHoop(dt);
    if(hoopSceneIsMoving()) hoopDirtyFrames = 2;
    if(hoopDirtyFrames > 0){
      hoopDirtyFrames--;
      renderHoopCanvas();
    }
    state.hoopRoundRAF = requestAnimationFrame(tick);
  }
  state.hoopRoundRAF = requestAnimationFrame(tick);
}

export function cancelHoopRound(){
  if(state.hoopRoundRAF) cancelAnimationFrame(state.hoopRoundRAF);
  state.hoopRoundRAF = null;
  if(state.hoopRoundActive){
    state.hoopRoundActive = false;
    const playArea = document.getElementById('hoopPlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('hoopHint');
    if(hint) hint.classList.add('hidden');
    const canvas = hoopCanvasResizer.getCanvas();
    if(canvas) renderHoopBackground(hoopCanvasResizer.getContext(), canvas);
    const begin = document.getElementById('hoopBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

/* =========================================================
   PHYSICS
========================================================= */
function updateHoop(dt){
  hoopFloatTexts = updateFloatTexts(hoopFloatTexts, frameFactor(dt * 1000));
  hoopShockwaves = updateShockwaves(hoopShockwaves);

  if(!hoopBall || !hoopBall.flying) return;
  const ballRY = ballRadiusY();

  hoopBall.vy += HOOP_GRAVITY * dt;
  const prevY = hoopBall.y;
  hoopBall.x += hoopBall.vx * dt;
  hoopBall.y += hoopBall.vy * dt;

  // Side walls
  if(hoopBall.x < HOOP_BALL_R){ hoopBall.x = HOOP_BALL_R; hoopBall.vx *= -0.62; sfxHoopBounce(Math.abs(hoopBall.vx)); }
  if(hoopBall.x > 100 - HOOP_BALL_R){ hoopBall.x = 100 - HOOP_BALL_R; hoopBall.vx *= -0.62; sfxHoopBounce(Math.abs(hoopBall.vx)); }

  // Backboard: a vertical plate just behind the rim.
  const boardX = HOOP_X + HOOP_RIM_HALF_W + 1.6;
  if(hoopBall.x + HOOP_BALL_R > boardX && hoopBall.y > HOOP_RIM_Y - 20 && hoopBall.y < HOOP_RIM_Y + 3.5 && hoopBall.vx > 0){
    hoopBall.x = boardX - HOOP_BALL_R;
    hoopBall.vx *= -0.55;
    hoopBall.touchedRim = true;
    sfxHoopBounce(Math.abs(hoopBall.vx) + 20);
  }

  // Scoring: the ball's centre crosses the rim plane on the way DOWN,
  // inside the rim. Checking the crossing rather than "is it near the
  // rim" is what stops a ball rising through the hoop from underneath
  // counting as a basket.
  if(!hoopResolving && prevY <= HOOP_RIM_Y && hoopBall.y > HOOP_RIM_Y && hoopBall.vy > 0){
    if(Math.abs(hoopBall.x - HOOP_X) < HOOP_RIM_HALF_W * 0.92){
      scoreHoopBasket();
      return;
    }
  }

  // Rim edges: two small solid posts the ball can clatter off.
  for(const side of [-1, 1]){
    const rx = HOOP_X + side * HOOP_RIM_HALF_W;
    const dx = hoopBall.x - rx, dy = hoopBall.y - HOOP_RIM_Y;
    const dist = Math.hypot(dx, dy);
    if(dist < HOOP_BALL_R + 0.7){
      const nx = dx / (dist || 1), ny = dy / (dist || 1);
      hoopBall.x = rx + nx * (HOOP_BALL_R + 0.7);
      hoopBall.y = HOOP_RIM_Y + ny * (HOOP_BALL_R + 0.7);
      const dot = hoopBall.vx * nx + hoopBall.vy * ny;
      hoopBall.vx = (hoopBall.vx - 2 * dot * nx) * 0.6;
      hoopBall.vy = (hoopBall.vy - 2 * dot * ny) * 0.6;
      hoopBall.touchedRim = true;
      sfxHoopBounce(40);
    }
  }

  // Floor
  if(hoopBall.y > HOOP_FLOOR_Y - ballRY){
    hoopBall.y = HOOP_FLOOR_Y - ballRY;
    if(Math.abs(hoopBall.vy) > 8){
      sfxHoopBounce(Math.abs(hoopBall.vy));
      hoopBall.vy *= -0.52;
      hoopBall.vx *= 0.82;
    } else {
      hoopBall.vy = 0; hoopBall.vx *= 0.9;
    }
  }

  const settled = hoopBall.y >= HOOP_FLOOR_Y - ballRY - 0.2 && Math.abs(hoopBall.vy) < 8 && Math.abs(hoopBall.vx) < 4;
  if(!hoopResolving && (settled || performance.now() - hoopShotStartedAt > HOOP_SHOT_TIMEOUT_MS)){
    setHoopHint('So close!');
    resolveHoopShot(false);
  }
}

function scoreHoopBasket(){
  const swish = !hoopBall.touchedRim;
  const points = swish ? 5 : 3;
  state.hoopScore += points;
  document.getElementById('hoopScoreDisplay').textContent = String(state.hoopScore);

  const canvas = hoopCanvasResizer.getCanvas();
  const px = (hoopBall.x / 100) * canvas.width, py = (hoopBall.y / 100) * canvas.height;
  spawnFloatText(hoopFloatTexts, px, py, swish ? 'SWISH! +5' : '+3', swish ? '#FFD23F' : '#7CFFEA', -1.5);
  spawnShockwave(hoopShockwaves, px, py, swish ? '#FFD23F' : '#7CFFEA', { big: swish });
  triggerShake(hoopShake, swish ? 7 : 4);
  sfxHoopScore(swish);
  setHoopHint(swish ? 'SWISH!' : 'Basket!');
  resolveHoopShot(true);
}

function resolveHoopShot(scored){
  if(hoopResolving) return;
  hoopResolving = true;
  state.hoopShotsLeft--;
  document.getElementById('hoopShotsDisplay').textContent = String(Math.max(0, state.hoopShotsLeft));
  setTimerFill(document.getElementById('hoopTimerFill'), state.hoopShotsLeft / HOOP_SHOTS_PER_TURN);

  // A beat before the next ball so the result registers.
  setTimeout(() => {
    if(!state.hoopRoundActive) return;
    hoopResolving = false;
    if(state.hoopShotsLeft <= 0){ finishHoopRound(); return; }
    resetHoopBall();
  }, scored ? 950 : 600);
}

function finishHoopRound(){
  state.hoopRoundActive = false;
  if(state.hoopRoundRAF) cancelAnimationFrame(state.hoopRoundRAF);
  state.hoopRoundRAF = null;
  document.getElementById('hoopPlayArea').classList.add('idle');
  document.getElementById('hoopHint').classList.add('hidden');
  syncHoopControls();

  state.hoopTeams[state.hoopCurrentTeam].total += state.hoopScore;
  state.hoopTurnsPlayed++;
  renderHoopScoreboard();

  showTurnResultModal('hoopNextTeamBtn', { teams: state.hoopTeams, currentTeamIndex: state.hoopCurrentTeam }).then(() => {
    if(state.hoopTurnsPlayed >= HOOP_QUESTIONS.length){ endHoopGame(); return; }
    state.hoopCurrentTeam = (state.hoopCurrentTeam + 1) % state.hoopTeams.length;
    renderHoopScoreboard();
    renderHoopTurnBanner();
    document.getElementById('hoopBeginTurnBtn').disabled = false;
    document.getElementById('hoopShotsDisplay').textContent = String(HOOP_SHOTS_PER_TURN);
    setTimerFill(document.getElementById('hoopTimerFill'), 1);
  });
}

function endHoopGame(){
  const winnerText = finishTeamGame({ prefix: 'hoop', teams: state.hoopTeams, setPlayAreaIdle: true });
  document.getElementById('hoopTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   RENDERING
========================================================= */
function renderHoopCanvas(){
  const canvas = hoopCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = hoopCanvasResizer.getContext();
  const W = canvas.width, H = canvas.height;
  const toX = (pct) => (pct / 100) * W;
  const toY = (pct) => (pct / 100) * H;
  const ballR = (HOOP_BALL_R / 100) * W;

  ctx.save();
  applyShake(ctx, hoopShake);
  renderHoopBackground(ctx, canvas);

  // ---- Rim + net (post and backboard are in the backdrop) ----
  const hx = toX(HOOP_X), ry = toY(HOOP_RIM_Y);
  const rimHalf = (HOOP_RIM_HALF_W / 100) * W;
  const boardX = toX(HOOP_X + HOOP_RIM_HALF_W + 1.6);
  ctx.fillStyle = HOOP_RIM_COLOR;
  ctx.fillRect(hx + rimHalf, ry - H * 0.006, boardX - (hx + rimHalf), H * 0.012);

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(1, W * 0.0022);
  for(let i = 0; i <= 5; i++){
    const t = i / 5;
    const topX = hx - rimHalf + t * rimHalf * 2;
    const botX = hx - rimHalf * 0.45 + t * rimHalf * 0.9;
    ctx.beginPath(); ctx.moveTo(topX, ry); ctx.lineTo(botX, ry + H * 0.075); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(hx - rimHalf * 0.62, ry + H * 0.038);
  ctx.lineTo(hx + rimHalf * 0.62, ry + H * 0.038); ctx.stroke();

  drawGlow(ctx, hx, ry, rimHalf * 2.1, HOOP_RIM_COLOR, 0.4, 1.7);
  ctx.strokeStyle = HOOP_RIM_COLOR;
  ctx.lineWidth = Math.max(3, W * 0.0075);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx - rimHalf, ry); ctx.lineTo(hx + rimHalf, ry); ctx.stroke();

  // ---- Aim: arrow + the rising half of the predicted arc ----
  if(hoopCanAim()){
    const bx = toX(hoopBall.x), by = toY(hoopBall.y);
    const v = hoopLaunchVector(hoopAngle, hoopPower);

    // Simulated with the SAME gravity the real shot uses, so it is an
    // honest preview. Stops at the top of the arc.
    let sx = hoopBall.x, sy = hoopBall.y, svx = v.vx, svy = v.vy;
    ctx.fillStyle = '#FFFFFF';
    const steps = 40;
    for(let i = 0; i < steps; i++){
      svy += HOOP_GRAVITY * 0.03;
      sx += svx * 0.03;
      sy += svy * 0.03;
      if((HOOP_PREVIEW_TO_APEX && svy > 0) || sy > HOOP_FLOOR_Y || sx > 100) break;
      ctx.globalAlpha = 0.8 * (1 - i / steps) + 0.15;
      ctx.beginPath();
      ctx.arc(toX(sx), toY(sy), Math.max(2, W * 0.0038), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Arrow out of the ball, pointing exactly along the launch
    // direction on screen; its length grows with power.
    const dirX = v.vx / 100 * W, dirY = v.vy / 100 * H;
    const dl = Math.hypot(dirX, dirY) || 1;
    const ux = dirX / dl, uy = dirY / dl;
    const len = ballR * (1.6 + 2.6 * (hoopPower / 100));
    const sx0 = bx + ux * ballR * 1.15, sy0 = by + uy * ballR * 1.15;
    const ax = bx + ux * (ballR * 1.15 + len), ay = by + uy * (ballR * 1.15 + len);
    ctx.strokeStyle = '#7CFFEA';
    ctx.lineWidth = Math.max(4, W * 0.006);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.fillStyle = '#7CFFEA';
    const hs = ballR * 0.75;
    ctx.beginPath();
    ctx.moveTo(ax + ux * hs, ay + uy * hs);
    ctx.lineTo(ax - uy * hs * 0.7, ay + ux * hs * 0.7);
    ctx.lineTo(ax + uy * hs * 0.7, ay - ux * hs * 0.7);
    ctx.closePath(); ctx.fill();

    // A soft marker on the floor so the new spot is obvious.
    ctx.fillStyle = 'rgba(124,255,234,0.25)';
    ctx.beginPath();
    ctx.ellipse(bx, toY(HOOP_FLOOR_Y), ballR * 1.5, ballR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Ball ----
  if(hoopBall){
    const bx = toX(hoopBall.x), by = toY(hoopBall.y);
    drawGlow(ctx, bx, by, ballR * 2.2, HOOP_BALL_COLOR, 0.4, 1.7);
    ctx.fillStyle = HOOP_BALL_COLOR;
    ctx.beginPath(); ctx.arc(bx, by, ballR, 0, Math.PI * 2); ctx.fill();
    // Seams, rotated with travel so the ball visibly spins.
    ctx.strokeStyle = 'rgba(60,20,0,0.65)';
    ctx.lineWidth = Math.max(1, ballR * 0.1);
    const spin = (hoopBall.x + hoopBall.y) * 0.12;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(spin);
    ctx.beginPath(); ctx.moveTo(-ballR, 0); ctx.lineTo(ballR, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, ballR * 0.45, ballR, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  drawShockwaves(ctx, hoopShockwaves, W / 900);
  drawFloatTexts(ctx, hoopFloatTexts, Math.max(18, W * 0.03));
  ctx.restore();
}

/* =========================================================
   TEAM MANAGEMENT + NAVIGATION
========================================================= */
wireTeamManagementButtons({
  prefix: 'hoop',
  getTeams: () => state.hoopTeams,
  renderScoreboard: renderHoopScoreboard,
  cancelRound: cancelHoopRound
});

document.getElementById('hoopBackBtn').addEventListener('click', () => goToStage(12));
// Wired here (the target stage's own file) — the existing convention.
document.getElementById('fruitNextStageBtn').addEventListener('click', () => goToStage(13));
