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
// Pull distance is capped so a huge drag across the whole board doesn't
// simply fire the ball off-screen every time — past this, more drag
// gives no more power, which keeps the skill in the ANGLE.
const HOOP_MAX_PULL = 34;
const HOOP_POWER = 3.5;
const HOOP_SHOT_TIMEOUT_MS = 5200;

const HOOP_BALL_COLOR = '#FF8C3B';
const HOOP_RIM_COLOR = '#FF4D4D';

/* =========================================================
   AUDIO
========================================================= */
function sfxHoopLaunch(){
  beep(320, 0.07, 'triangle', 0.09);
  beep(520, 0.06, 'sine', 0.06, 0.03);
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
    'Drag back from the ball, then let go to shoot.',
    'You get three shots at the moving hoop.'
  ],
  scoring: [
    { swatch: '<span class="hoop-legend-swatch basket"></span>', label: 'In the hoop', points: '+3' },
    { swatch: '<span class="hoop-legend-swatch swish"></span>', label: 'Swish &mdash; straight in, no rim', points: '+5', tone: 'bonus' },
    { swatch: '<span class="hoop-legend-swatch miss"></span>', label: 'Miss', points: '0' }
  ],
  tip: 'Pull back further for more power, and aim HIGH &mdash; a steep arc drops through the hoop far more easily than a flat one.'
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
let hoopAimFrom = null;       // pointer position while dragging, in %
let hoopDragging = false;
let hoopHoopX = 72;           // centre of the rim, in %
let hoopHoopDir = 1;
let hoopHoopSpeed = 9;        // %/second
let hoopShotStartedAt = 0;
let hoopResolving = false;

function resetHoopBall(){
  hoopBall = { x: HOOP_START.x, y: HOOP_START.y, vx: 0, vy: 0, flying: false, touchedRim: false };
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
  endHoopDrag();
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
   INPUT — drag back from the ball, release to shoot
========================================================= */
function hoopPointFromEvent(clientX, clientY){
  const canvas = hoopCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
}

function beginHoopDrag(clientX, clientY){
  if(!state.hoopRoundActive || hoopResolving || !hoopBall || hoopBall.flying) return;
  hoopDragging = true;
  hoopAimFrom = hoopPointFromEvent(clientX, clientY);
  window.addEventListener('mousemove', onHoopMove);
  window.addEventListener('mouseup', onHoopUp);
}
function onHoopMove(e){
  if(!hoopDragging) return;
  hoopAimFrom = hoopPointFromEvent(e.clientX, e.clientY);
}
function onHoopUp(){ releaseHoopShot(); }

function endHoopDrag(){
  hoopDragging = false;
  hoopAimFrom = null;
  window.removeEventListener('mousemove', onHoopMove);
  window.removeEventListener('mouseup', onHoopUp);
}

// The launch vector points from the drag position back to the ball —
// pull down-left, the ball flies up-right, like a catapult. That reads
// more naturally than dragging in the direction of travel, and it's the
// same convention Billiards already uses for the cue.
function currentHoopPull(){
  if(!hoopAimFrom || !hoopBall) return null;
  let dx = hoopBall.x - hoopAimFrom.x;
  let dy = hoopBall.y - hoopAimFrom.y;
  const len = Math.hypot(dx, dy);
  if(len < 0.5) return null;
  const capped = Math.min(len, HOOP_MAX_PULL);
  return { dx: (dx / len) * capped, dy: (dy / len) * capped, len: capped };
}

function releaseHoopShot(){
  const pull = currentHoopPull();
  endHoopDrag();
  if(!pull || !hoopBall || hoopBall.flying || hoopResolving) return;
  hoopBall.vx = pull.dx * HOOP_POWER;
  hoopBall.vy = pull.dy * HOOP_POWER;
  hoopBall.flying = true;
  hoopBall.touchedRim = false;
  hoopShotStartedAt = performance.now();
  sfxHoopLaunch();
}

const hoopCanvasEl = hoopCanvasResizer.getCanvas();
hoopCanvasEl.addEventListener('mousedown', (e) => beginHoopDrag(e.clientX, e.clientY));
hoopCanvasEl.addEventListener('touchstart', (e) => {
  beginHoopDrag(e.touches[0].clientX, e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });
hoopCanvasEl.addEventListener('touchmove', (e) => {
  if(hoopDragging) hoopAimFrom = hoopPointFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });
hoopCanvasEl.addEventListener('touchend', (e) => { releaseHoopShot(); e.preventDefault(); }, { passive: false });

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

  // ---- Aim guide while dragging ----
  const pull = hoopDragging ? currentHoopPull() : null;
  if(pull && hoopBall && !hoopBall.flying){
    const bx = toX(hoopBall.x), by = toY(hoopBall.y);
    // A dotted predicted arc. Simulating a handful of steps is both the
    // clearest way to show where a shot will go and an honest one — it
    // uses the same gravity the real shot will.
    let sx = hoopBall.x, sy = hoopBall.y;
    let svx = pull.dx * HOOP_POWER, svy = pull.dy * HOOP_POWER;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for(let i = 0; i < 26; i++){
      svy += HOOP_GRAVITY * 0.035;
      sx += svx * 0.035;
      sy += svy * 0.035;
      if(sy > HOOP_FLOOR_Y) break;
      ctx.globalAlpha = 0.6 * (1 - i / 26);
      ctx.beginPath();
      ctx.arc(toX(sx), toY(sy), Math.max(1.5, W * 0.0035), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Power bar along the pull itself.
    ctx.strokeStyle = `hsl(${90 - (pull.len / HOOP_MAX_PULL) * 90}, 85%, 58%)`;
    ctx.lineWidth = Math.max(2, W * 0.005);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - toX(pull.dx), by - toY(pull.dy));
    ctx.stroke();
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
