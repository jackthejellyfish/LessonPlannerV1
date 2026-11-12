import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { HOOP_QUESTIONS } from '../content/stage13-hoopshot.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves } from '../canvasEffects.js';
import { createBackdrop, drawGlow } from '../canvasGlow.js';

/* =========================================================
   STAGE 13 — HOOP SHOT

   Answer a question, then take three shots at a moving hoop. Drag back
   from the ball and release, slingshot style: the further back you
   pull, the harder the shot. Everything is in PERCENT of the canvas,
   like every other game here, so it is resolution-independent.

   Why this game exists: of the games before it, Billiards was the only
   one with a single aimed shot, and that shot is flat — you aim across
   a table. Nothing in the set asked a learner to judge an ARC. It is
   also the most universally understood sport on a whiteboard, which
   matters for a game that has to be explained in three lines.

   The hoop slides side to side so a turn can't be solved once and then
   repeated by rote; the speed is deliberately gentle, since the point
   is judging the arc rather than reacting.
========================================================= */
const HOOP_SHOTS_PER_TURN = 3;
const HOOP_GRAVITY = 155;          // %/second²
const HOOP_FLOOR_Y = 93;           // ball rests here
const HOOP_RIM_Y = 34;             // height of the rim
const HOOP_RIM_HALF_W = 6.2;       // half the rim's width, in % of canvas width
const HOOP_BALL_R = 3.4;           // ball radius, % of canvas width
const HOOP_START = { x: 13, y: 84 };
// Backstop for a shot that never settles (a ball wedged bouncing
// between a wall and the rim). Kept fairly tight because a class is
// watching the whole time a shot is in the air.
const HOOP_SHOT_TIMEOUT_MS = 4200;

/* ---- Aim, then power ----
   This replaced a drag-to-aim-and-power slingshot. Dragging was the
   wrong input for the surface this runs on: on a big interactive
   whiteboard the pull needed to reach full power ran off the edge of
   the board, and a mouse drag that leaves the window never gets its
   mouseup, so the shot simply never fired. Two taps have neither
   problem, work identically with a finger or a mouse, and turn the
   shot into a timing game that a class can watch and shout at.

   Sweep 1 sets the angle, sweep 2 sets the power. Both oscillate; a
   tap locks whatever the marker is on. */
// The sweep is narrow on purpose. Swept across the full 22-78 the
// simulation showed nothing below 58 degrees could ever reach the
// hoop at any power — more than half the bar was a guaranteed miss,
// which is just a trap. This range keeps most of the sweep live.
const HOOP_ANGLE_MIN = 46;         // degrees above horizontal
const HOOP_ANGLE_MAX = 80;
const HOOP_ANGLE_SWEEP_MS = 2300;  // one full min->max->min cycle
const HOOP_POWER_SWEEP_MS = 1400;
// Tuned by sweeping the whole angle x power space against the real
// geometry (see tests): with this range the combinations that actually
// reach the hoop sit around the MIDDLE of the power meter rather than
// in its bottom third, so stopping the bar near the centre is the
// right instinct. A first pass used 105-215, where every scoring shot
// needed power below 0.4 and the top half of the meter was dead.
const HOOP_SPEED_MIN = 88;         // %/second
const HOOP_SPEED_MAX = 190;

const HOOP_BALL_COLOR = '#FF8C3B';
const HOOP_RIM_COLOR = '#FF4D4D';

/* =========================================================
   AUDIO
========================================================= */
function sfxHoopLaunch(){
  beep(320, 0.07, 'triangle', 0.09);
  beep(520, 0.06, 'sine', 0.06, 0.03);
}
// Locking the angle: a short, dry click, clearly not a launch — the
// two taps need to sound different or a class can't tell which half of
// the shot they just committed to.
function sfxHoopLock(){
  beep(1150, 0.035, 'square', 0.07);
  beep(820, 0.05, 'triangle', 0.05, 0.02);
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
    'Tap once to set the angle, then tap again to set the power.',
    'You get three shots at the moving hoop.'
  ],
  scoring: [
    { swatch: '<span class="hoop-legend-swatch basket"></span>', label: 'In the hoop', points: '+3' },
    { swatch: '<span class="hoop-legend-swatch swish"></span>', label: 'Swish &mdash; straight in, no rim', points: '+5', tone: 'bonus' },
    { swatch: '<span class="hoop-legend-swatch miss"></span>', label: 'Miss', points: '0' }
  ],
  tip: 'Both bars sweep up and down &mdash; tap to stop them. Aim HIGH: a steep arc drops through the hoop far more easily than a flat one.'
});

export function renderHoopTeamInputs(count){
  renderTeamSetupRows('hoopTeamInputs', 'hoopAddTeamBtn', count, hoopRowColors, renderHoopTeamInputs);
}
renderHoopTeamInputs(2);
wireAddTeamButton('hoopTeamInputs', 'hoopAddTeamBtn', renderHoopTeamInputs);

document.getElementById('hoopStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#hoopTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.hoopTeams = names.map((name, i) => ({ name, color: hoopRowColors[i], total: 0 }));
  state.hoopCurrentTeam = 0;
  state.hoopTurnsPlayed = 0;
  state.hoopQuestionOrder = shuffle(HOOP_QUESTIONS.map((_, i) => i));

  document.getElementById('hoopSetup').classList.add('hidden');
  document.getElementById('hoopGame').classList.remove('hidden');
  document.getElementById('hoopGameOverBanner').classList.add('hidden');
  renderHoopScoreboard();
  renderHoopTurnBanner();
  ensureHoopLayout();
});

function renderHoopScoreboard(){
  renderTeamScoreboard('hoopTeamList', state.hoopTeams, state.hoopCurrentTeam);
}
function renderHoopTurnBanner(){
  document.getElementById('hoopTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.hoopTeams[state.hoopCurrentTeam].name)}</strong>'s turn — question ${state.hoopTurnsPlayed + 1} of ${HOOP_QUESTIONS.length}`;
}

/* =========================================================
   CANVAS
========================================================= */
const hoopCanvasResizer = createCanvasResizer('hoopCanvas', 'hoopPlayArea');
export function ensureHoopLayout(){
  if(state.hoopTeams.length > 0){ hoopCanvasResizer.resize(); renderHoopCanvas(); }
}

const renderHoopBackground = createBackdrop((ctx, w, h) => {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#20143A');
  bg.addColorStop(0.55, '#2C1B4D');
  bg.addColorStop(1, '#140C26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Court floor with a few receding lines — just enough to read as a
  // court and give the arc somewhere to land.
  const floorY = (HOOP_FLOOR_Y / 100) * h;
  const floor = ctx.createLinearGradient(0, floorY - h * 0.05, 0, h);
  floor.addColorStop(0, '#8A5A2B');
  floor.addColorStop(1, '#5C3A18');
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, w, h - floorY);
  ctx.strokeStyle = 'rgba(255,220,180,0.22)';
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();

  // Crowd: three rows of small dim blobs up in the stands. Kept well
  // above the floor line and small — at the size and height this
  // started at, it read as a row of circles sitting ON the court
  // rather than as an audience behind it.
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for(let row = 0; row < 3; row++){
    const cy = floorY - h * (0.17 + row * 0.052);
    for(let x = w * 0.015; x < w; x += w * 0.031){
      ctx.globalAlpha = 0.07 + rnd() * 0.07;
      ctx.fillStyle = ['#FFD9A0', '#9FD8FF', '#FFAFC8', '#C8FFB0'][Math.floor(rnd() * 4)];
      ctx.beginPath();
      ctx.arc(x + rnd() * w * 0.014, cy, w * 0.0062, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
});

/* =========================================================
   ROUND STATE
   Transient render/aim data lives in module scope (same convention as
   every other game here); the scoring data lives in `state`.
========================================================= */
let hoopBall = null;          // {x, y, vx, vy, flying, touchedRim}
// 'aim' -> 'power' -> 'flying'. resolveHoopShot puts it back to 'aim'
// for the next ball.
let hoopPhase = 'aim';
let hoopPhaseStartedAt = 0;
let hoopAimAngle = 45;        // degrees, live while phase === 'aim'
let hoopPower = 0.5;          // 0..1, live while phase === 'power'
let hoopLockedAngle = 45;
let hoopHoopX = 72;           // centre of the rim, in %
let hoopHoopDir = 1;
let hoopHoopSpeed = 9;        // %/second
let hoopShotStartedAt = 0;
let hoopResolving = false;

function resetHoopBall(){
  hoopBall = { x: HOOP_START.x, y: HOOP_START.y, vx: 0, vy: 0, flying: false, touchedRim: false };
  setHoopPhase('aim');
}

function setHoopPhase(phase){
  hoopPhase = phase;
  hoopPhaseStartedAt = performance.now();
  const hint = document.getElementById('hoopHint');
  if(hint){
    hint.textContent = phase === 'aim' ? 'Tap to set the angle!'
      : phase === 'power' ? 'Now tap to set the power!'
      : 'Nice shot...';
  }
}

// A 0..1 triangle wave — up, then back down, forever. Used for both
// sweeps so the marker always reverses at the ends rather than
// snapping back to the start, which is far easier to time against.
function hoopSweep(periodMs){
  const t = ((performance.now() - hoopPhaseStartedAt) % periodMs) / periodMs;
  return t < 0.5 ? t * 2 : (1 - t) * 2;
}
resetHoopBall();

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askHoopQuestion(){
  const q = HOOP_QUESTIONS[state.hoopQuestionOrder[state.hoopTurnsPlayed]];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
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
  resetHoopBall();

  document.getElementById('hoopScoreDisplay').textContent = '0';
  document.getElementById('hoopShotsDisplay').textContent = String(HOOP_SHOTS_PER_TURN);
  document.getElementById('hoopTimerFill').style.width = '100%';
  document.getElementById('hoopPlayArea').classList.remove('idle');
  document.getElementById('hoopHint').classList.remove('hidden');
  hoopCanvasResizer.resize();

  let last = performance.now();
  function tick(now){
    const dt = Math.min(50, now - last) / 1000;
    last = now;
    updateHoop(dt);
    renderHoopCanvas();
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
    if(canvas){ canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }
    const begin = document.getElementById('hoopBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

/* =========================================================
   PHYSICS
========================================================= */
function updateHoop(dt){
  // The hoop patrols between two bounds whether or not a shot is in
  // the air, so a team has to lead it rather than wait for it.
  hoopHoopX += hoopHoopDir * hoopHoopSpeed * dt;
  if(hoopHoopX > 88){ hoopHoopX = 88; hoopHoopDir = -1; }
  if(hoopHoopX < 46){ hoopHoopX = 46; hoopHoopDir = 1; }

  hoopFloatTexts = updateFloatTexts(hoopFloatTexts);
  hoopShockwaves = updateShockwaves(hoopShockwaves);

  // The two sweeps are driven here rather than in the renderer, so
  // what a team sees and what the shot uses can never disagree.
  if(hoopPhase === 'aim'){
    hoopAimAngle = HOOP_ANGLE_MIN + hoopSweep(HOOP_ANGLE_SWEEP_MS) * (HOOP_ANGLE_MAX - HOOP_ANGLE_MIN);
  } else if(hoopPhase === 'power'){
    hoopPower = hoopSweep(HOOP_POWER_SWEEP_MS);
  }

  if(!hoopBall || !hoopBall.flying) return;

  hoopBall.vy += HOOP_GRAVITY * dt;
  const prevY = hoopBall.y;
  hoopBall.x += hoopBall.vx * dt;
  hoopBall.y += hoopBall.vy * dt;

  // Side walls
  if(hoopBall.x < HOOP_BALL_R){ hoopBall.x = HOOP_BALL_R; hoopBall.vx *= -0.62; sfxHoopBounce(Math.abs(hoopBall.vx)); }
  if(hoopBall.x > 100 - HOOP_BALL_R){ hoopBall.x = 100 - HOOP_BALL_R; hoopBall.vx *= -0.62; sfxHoopBounce(Math.abs(hoopBall.vx)); }

  // Backboard: a vertical plate just behind the rim.
  const boardX = hoopHoopX + HOOP_RIM_HALF_W + 1.6;
  if(hoopBall.x + HOOP_BALL_R > boardX && hoopBall.y > HOOP_RIM_Y - 16 && hoopBall.y < HOOP_RIM_Y + 2 && hoopBall.vx > 0){
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
    if(Math.abs(hoopBall.x - hoopHoopX) < HOOP_RIM_HALF_W * 0.86){
      scoreHoopBasket();
      return;
    }
  }

  // Rim edges: two small solid posts the ball can clatter off.
  for(const side of [-1, 1]){
    const rx = hoopHoopX + side * HOOP_RIM_HALF_W;
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
  if(hoopBall.y > HOOP_FLOOR_Y - HOOP_BALL_R){
    hoopBall.y = HOOP_FLOOR_Y - HOOP_BALL_R;
    if(Math.abs(hoopBall.vy) > 8){
      sfxHoopBounce(Math.abs(hoopBall.vy));
      hoopBall.vy *= -0.52;
      hoopBall.vx *= 0.82;
    } else {
      hoopBall.vy = 0; hoopBall.vx *= 0.9;
    }
  }

  const settled = hoopBall.y >= HOOP_FLOOR_Y - HOOP_BALL_R - 0.2 && Math.abs(hoopBall.vy) < 8 && Math.abs(hoopBall.vx) < 4;
  if(!hoopResolving && (settled || performance.now() - hoopShotStartedAt > HOOP_SHOT_TIMEOUT_MS)){
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
  resolveHoopShot(true);
}

function resolveHoopShot(scored){
  if(hoopResolving) return;
  hoopResolving = true;
  state.hoopShotsLeft--;
  document.getElementById('hoopShotsDisplay').textContent = String(Math.max(0, state.hoopShotsLeft));
  document.getElementById('hoopTimerFill').style.width = `${(state.hoopShotsLeft / HOOP_SHOTS_PER_TURN) * 100}%`;

  // A beat before the next ball so the result registers.
  setTimeout(() => {
    if(!state.hoopRoundActive) return;
    hoopResolving = false;
    if(state.hoopShotsLeft <= 0){ finishHoopRound(); return; }
    resetHoopBall();
  }, scored ? 850 : 500);
}

function finishHoopRound(){
  state.hoopRoundActive = false;
  if(state.hoopRoundRAF) cancelAnimationFrame(state.hoopRoundRAF);
  state.hoopRoundRAF = null;
  document.getElementById('hoopPlayArea').classList.add('idle');
  document.getElementById('hoopHint').classList.add('hidden');

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
    document.getElementById('hoopTimerFill').style.width = '100%';
  });
}

function endHoopGame(){
  const winnerText = finishTeamGame({ prefix: 'hoop', teams: state.hoopTeams, setPlayAreaIdle: true });
  document.getElementById('hoopTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   INPUT — one tap sets the angle, the next sets the power
========================================================= */
function hoopLaunchVector(angleDeg, power){
  const rad = (angleDeg * Math.PI) / 180;
  const speed = HOOP_SPEED_MIN + power * (HOOP_SPEED_MAX - HOOP_SPEED_MIN);
  return { vx: Math.cos(rad) * speed, vy: -Math.sin(rad) * speed };
}

function hoopTap(){
  if(!state.hoopRoundActive || hoopResolving || !hoopBall || hoopBall.flying) return;
  if(hoopPhase === 'aim'){
    hoopLockedAngle = hoopAimAngle;
    setHoopPhase('power');
    sfxHoopLock();
    return;
  }
  if(hoopPhase === 'power'){
    const v = hoopLaunchVector(hoopLockedAngle, hoopPower);
    hoopBall.vx = v.vx;
    hoopBall.vy = v.vy;
    hoopBall.flying = true;
    hoopBall.touchedRim = false;
    hoopShotStartedAt = performance.now();
    setHoopPhase('flying');
    sfxHoopLaunch();
  }
}

// The whole play area is the button, not just the ball — on a board
// being prodded by a child, anything smaller is a miss waiting to
// happen.
const hoopCanvasEl = hoopCanvasResizer.getCanvas();
hoopCanvasEl.addEventListener('click', hoopTap);
hoopCanvasEl.addEventListener('touchstart', (e) => { hoopTap(); e.preventDefault(); }, { passive: false });

/* =========================================================
   RENDERING
========================================================= */
function renderHoopCanvas(){
  const canvas = hoopCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const toX = (pct) => (pct / 100) * W;
  const toY = (pct) => (pct / 100) * H;
  const ballR = (HOOP_BALL_R / 100) * W;

  ctx.save();
  applyShake(ctx, hoopShake);
  renderHoopBackground(ctx, canvas);

  // ---- Hoop: post, backboard, rim, net ----
  const hx = toX(hoopHoopX), ry = toY(HOOP_RIM_Y);
  const rimHalf = (HOOP_RIM_HALF_W / 100) * W;
  const boardX = toX(hoopHoopX + HOOP_RIM_HALF_W + 1.6);

  // Support post, behind everything.
  ctx.fillStyle = '#4A3A6B';
  ctx.fillRect(boardX + W * 0.012, ry - H * 0.08, W * 0.014, H * 0.9);

  // Backboard — seen edge-on, so a tall slim panel, with a padded
  // base and a bracket joining it to the rim.
  ctx.fillStyle = 'rgba(244,240,255,0.95)';
  ctx.fillRect(boardX, ry - H * 0.2, W * 0.011, H * 0.235);
  ctx.fillStyle = HOOP_RIM_COLOR;
  ctx.fillRect(boardX, ry + H * 0.012, W * 0.011, H * 0.023);
  ctx.fillRect(hx + rimHalf, ry - H * 0.006, boardX - (hx + rimHalf), H * 0.012);

  // Net: a few tapering strands, drawn as plain lines.
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

  // Rim itself, as a thick bright bar with solid end posts.
  drawGlow(ctx, hx, ry, rimHalf * 2.1, HOOP_RIM_COLOR, 0.4, 1.7);
  ctx.strokeStyle = HOOP_RIM_COLOR;
  ctx.lineWidth = Math.max(3, W * 0.0075);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx - rimHalf, ry); ctx.lineTo(hx + rimHalf, ry); ctx.stroke();

  // ---- Aim guide and power meter ----
  // The predicted arc is simulated with the SAME gravity the real shot
  // uses, so it is an honest preview rather than a decorative curve.
  // During the aim sweep it is drawn at mid power, which is what makes
  // the angle choice legible before the power is known.
  if(hoopBall && !hoopBall.flying && !hoopResolving){
    const bx = toX(hoopBall.x), by = toY(hoopBall.y);
    const angle = hoopPhase === 'aim' ? hoopAimAngle : hoopLockedAngle;
    const power = hoopPhase === 'aim' ? 0.5 : hoopPower;
    const v = hoopLaunchVector(angle, power);

    let sx = hoopBall.x, sy = hoopBall.y, svx = v.vx, svy = v.vy;
    ctx.fillStyle = '#FFFFFF';
    for(let i = 0; i < 30; i++){
      svy += HOOP_GRAVITY * 0.035;
      sx += svx * 0.035;
      sy += svy * 0.035;
      if(sy > HOOP_FLOOR_Y || sx > 100) break;
      ctx.globalAlpha = 0.55 * (1 - i / 30);
      ctx.beginPath();
      ctx.arc(toX(sx), toY(sy), Math.max(1.5, W * 0.0035), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Aim arrow out of the ball along the chosen angle.
    const rad = (angle * Math.PI) / 180;
    const len = ballR * (hoopPhase === 'aim' ? 3.4 : 3.0);
    const ax = bx + Math.cos(rad) * len, ay = by - Math.sin(rad) * len;
    ctx.strokeStyle = hoopPhase === 'aim' ? '#7CFFEA' : 'rgba(124,255,234,0.5)';
    ctx.lineWidth = Math.max(3, W * 0.0055);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(rad) * ballR * 0.7, ay - Math.sin(rad) * ballR * 0.7);
    ctx.lineTo(ax + Math.cos(rad + 2.5) * ballR * 0.5, ay - Math.sin(rad + 2.5) * ballR * 0.5);
    ctx.lineTo(ax + Math.cos(rad - 2.5) * ballR * 0.5, ay - Math.sin(rad - 2.5) * ballR * 0.5);
    ctx.closePath(); ctx.fill();

    if(hoopPhase === 'power'){
      // Power meter, drawn up the left edge beside the ball so a team's
      // eyes never have to leave the shot to read it. Green through to
      // red, with the marker as a bright bar rather than a fill level —
      // the bar is what you are trying to stop, so it has to be the
      // most visible thing on it.
      const mx = toX(4), my0 = toY(32), my1 = toY(84);
      const mw = W * 0.022;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(mx - mw / 2 - 3, my0 - 3, mw + 6, (my1 - my0) + 6);
      const grad = ctx.createLinearGradient(0, my1, 0, my0);
      grad.addColorStop(0, '#5BD75B');
      grad.addColorStop(0.55, '#FFD23F');
      grad.addColorStop(1, '#FF4D4D');
      ctx.fillStyle = grad;
      ctx.fillRect(mx - mw / 2, my0, mw, my1 - my0);

      const markY = my1 - hoopPower * (my1 - my0);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(mx - mw * 0.95, markY - W * 0.004, mw * 1.9, W * 0.008);
      drawGlow(ctx, mx, markY, mw * 1.6, '#FFFFFF', 0.55, 1.7);
    }
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
