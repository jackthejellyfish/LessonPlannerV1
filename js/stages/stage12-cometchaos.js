import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, beep } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { COMET_QUESTIONS, COMET_LEVELS } from '../content/stage12-cometchaos.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';

/* =========================================================
   STAGE 12 — COMET CHAOS
   Team-turn structure identical to the other games: answer a
   question, then get 3 comets to launch (same pull-back-and-
   release drag input as Sky Slingshot). The twist is the physics:
   there's no single downward gravity — instead each level scatters
   a few "planets" across the board that each pull the comet toward
   themselves (inverse-square, same shape as real orbital gravity,
   just tuned for a few-second arcade flight instead of light-years).
   That makes the flight path genuinely unpredictable and curvy
   rather than a fixed parabola, especially once a comet swings
   close past a planet and gets flung off at a new angle. A level
   may also include one "black hole" — get too close and the shot
   is swallowed for zero points, so aiming near a planet for a
   gravity-assist curve is a real risk/reward choice, not just
   decoration. Land inside the glowing target ring to score (a
   tighter bullseye ring scores more); a shot that neither lands nor
   gets swallowed within MAX_FLIGHT_MS is called a miss so a turn
   can never stall forever. Physics is deliberately simplified
   (single-body-at-a-time gravity summed from static planets, not a
   real N-body simulation) — same "simplified but satisfying" spirit
   as every other canvas game here.
========================================================= */
const SHOTS_PER_TURN = 3;
const POINTS_TARGET = 20;
const POINTS_BULLSEYE = 50;
const LAUNCH_X_PCT = 12, LAUNCH_Y_PCT = 50;
// Inverse-square pull strength — tuned in raw px units against typical
// canvas widths (roughly 700-1600px), same "tune against the actual
// runtime size, not a unit-agnostic formula" approach as GRAVITY in
// stage11. GRAV_MIN_DIST_FRAC floors the distance used in the 1/d² falloff
// so a comet passing very close to a planet's center gets a strong but
// still bounded slingshot kick, not a divide-by-near-zero explosion.
const GRAV_STRENGTH = 2.2e7;
const GRAV_MIN_DIST_FRAC = 0.045;
const DRAG = 0.15; // fractional velocity loss per second — keeps orbits from gaining energy indefinitely
const WALL_RESTITUTION = 0.75;
const MAX_LAUNCH_SPEED_FACTOR = 0.85; // × canvas.width, the speed at full pull-back
// A shot that never lands or gets swallowed is called a miss after this
// long — without a cap, a comet caught in a stable-ish orbit between two
// planets could in principle fly for the rest of the lesson.
const MAX_FLIGHT_MS = 6000;
// Same role as Sky Slingshot's TURN_END_PAUSE_MS — long enough to actually
// see the result (landed / swallowed / missed) before moving on.
const TURN_END_PAUSE_MS = 1100;

const PLANET_COLORS = ['#FFD23F', '#43D1FF', '#FF8FA0', '#8B3EFF'];

let cometRowColors = [];

export function renderCometTeamInputs(count){
  renderTeamSetupRows('cometTeamInputs', 'cometAddTeamBtn', count, cometRowColors, renderCometTeamInputs);
}
renderCometTeamInputs(2);
wireAddTeamButton('cometTeamInputs', 'cometAddTeamBtn', renderCometTeamInputs);

document.getElementById('cometStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#cometTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.cometTeams = names.map((name, i) => ({ name, color: cometRowColors[i], total: 0 }));
  state.cometCurrentTeam = 0;
  state.cometTurnsPlayed = 0;
  state.cometLevelIndex = 0;
  state.cometQuestionOrder = shuffle(COMET_QUESTIONS.map((_, i) => i));

  document.getElementById('cometSetup').classList.add('hidden');
  document.getElementById('cometGame').classList.remove('hidden');
  document.getElementById('cometGameOverBanner').classList.add('hidden');
  resizeCometCanvas();
  document.getElementById('cometQDisplay').textContent = `1/${COMET_QUESTIONS.length}`;
  renderCometScoreboard();
  renderCometTurnBanner();
  loadCometLevel(0);
  renderCometCanvas();
});

function renderCometScoreboard(){
  renderTeamScoreboard('cometTeamList', state.cometTeams, state.cometCurrentTeam);
}
function renderCometTurnBanner(){
  document.getElementById('cometTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.cometTeams[state.cometCurrentTeam].name)}</strong>'s turn — question ${state.cometTurnsPlayed + 1} of ${COMET_QUESTIONS.length}`;
}

/* =========================================================
   LEVEL SETUP
========================================================= */
function loadCometLevel(index){
  state.cometShotsLeft = SHOTS_PER_TURN;
  state.cometTurnScore = 0;
  loadNextComet();
  document.getElementById('cometShotsDisplay').textContent = String(state.cometShotsLeft);
  document.getElementById('cometScoreDisplay').textContent = '0';
}

function loadNextComet(){
  const canvas = cometCanvasResizer.getCanvas();
  state.cometComet = {
    x: canvas.width * (LAUNCH_X_PCT / 100), y: canvas.height * (LAUNCH_Y_PCT / 100),
    vx: 0, vy: 0, r: canvas.width * 0.018, launched: false, launchedAt: 0, rotation: 0, spin: 0
  };
  cometTrail = [];
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askCometQuestion(){
  const qIndex = state.cometQuestionOrder[state.cometTurnsPlayed];
  const q = COMET_QUESTIONS[qIndex];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('cometBeginTurnBtn').addEventListener('click', beginCometTurn);
async function beginCometTurn(){
  document.getElementById('cometBeginTurnBtn').disabled = true;
  document.getElementById('cometPlayArea').classList.remove('idle');
  await askCometQuestion();
  loadCometLevel(state.cometLevelIndex);
  document.getElementById('cometHint').classList.remove('hidden');
  startCometRound();
}

function finishCometTurn(){
  const team = state.cometTeams[state.cometCurrentTeam];
  team.total += state.cometTurnScore;
  state.cometTurnsPlayed++;
  state.cometLevelIndex++;
  renderCometScoreboard();

  document.getElementById('cometPlayArea').classList.add('idle');
  document.getElementById('cometHint').classList.add('hidden');

  showCometResult().then(() => {
    if(state.cometTurnsPlayed >= COMET_QUESTIONS.length){
      endCometGame();
    } else {
      state.cometCurrentTeam = (state.cometCurrentTeam + 1) % state.cometTeams.length;
      renderCometScoreboard();
      renderCometTurnBanner();
      document.getElementById('cometQDisplay').textContent = `${state.cometTurnsPlayed + 1}/${COMET_QUESTIONS.length}`;
      document.getElementById('cometBeginTurnBtn').disabled = false;
    }
  });
}

function showCometResult(){
  return showTurnResultModal('cometNextTeamBtn', { teams: state.cometTeams, currentTeamIndex: state.cometCurrentTeam });
}

function endCometGame(){
  const winnerText = finishTeamGame({ prefix: 'comet', teams: state.cometTeams });
  document.getElementById('cometTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   AUDIO
========================================================= */
function sfxLaunch(){ beep(240, 0.09, 'sawtooth', 0.13); beep(380, 0.07, 'sawtooth', 0.1, 0.035); }
function sfxWallPing(){ if(state.muted) return; beep(520, 0.05, 'sine', 0.08); }
function sfxTargetHit(bullseye){
  if(state.muted) return;
  const notes = bullseye ? [660, 880, 1100, 1320] : [560, 740, 920];
  notes.forEach((f, i) => beep(f, 0.16, 'triangle', 0.2, i * 0.07));
}
function sfxMiss(){ if(state.muted) return; beep(180, 0.22, 'sine', 0.12); beep(140, 0.28, 'sine', 0.1, 0.08); }
function sfxSwallow(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const duration = 0.45;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
  const gain = ctx.createGain(); gain.gain.value = 0.28;
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
}

/* =========================================================
   TRAIL + PARTICLES
========================================================= */
let cometTrail = [];
function updateCometTrail(comet){
  cometTrail.unshift({ x: comet.x, y: comet.y, alpha: 1 });
  if(cometTrail.length > 14) cometTrail.pop();
  for(let i = 0; i < cometTrail.length; i++) cometTrail[i].alpha = 1 - i / cometTrail.length;
}

function spawnCometParticles(x, y, color, count = 18, speedMult = 1){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 6 + 1.5) * speedMult;
    state.cometParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.02 + 0.012, size: Math.random() * 5 + 2, color
    });
  }
}
// A "sucked in" burst: particles start with an outward-ish scatter but
// are biased toward spiralling back toward (x,y) as they age, unlike the
// normal outward-only burst — reads as being pulled INTO the point rather
// than exploding away from it.
function spawnSwallowParticles(x, y){
  for(let i = 0; i < 30; i++){
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 40 + 10;
    state.cometParticles.push({
      x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * 3, vy: -Math.sin(angle) * 3,
      alpha: 1, decay: Math.random() * 0.02 + 0.018, size: Math.random() * 4 + 1.5, color: '#B26BFF',
      pullX: x, pullY: y, pulling: true
    });
  }
}
function updateCometParticles(){
  for(const p of state.cometParticles){
    if(p.pulling){
      p.vx += (p.pullX - p.x) * 0.02;
      p.vy += (p.pullY - p.y) * 0.02;
    } else {
      p.vy += 0.06;
    }
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.98; p.vy *= 0.98;
    p.alpha -= p.decay; p.size *= 0.97;
  }
  state.cometParticles = state.cometParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

/* =========================================================
   CANVAS SIZING
========================================================= */
const cometCanvasResizer = createCanvasResizer('cometCanvas', 'cometPlayArea');
export function resizeCometCanvas(){ cometCanvasResizer.resize(); }
// Called on the compact-mode toggle (see main.js) — same role as
// ensureBirdsLayout/ensurePlinkoLayout, since that toggle resizes the
// stage box via a pure CSS class with no native 'resize' event.
export function ensureCometLayout(){
  if(state.cometTeams.length > 0) resizeCometCanvas();
}

function ensureCometStars(canvas){
  if(state.cometStars.length > 0) return;
  const count = 90;
  for(let i = 0; i < count; i++){
    state.cometStars.push({
      xPct: Math.random() * 100, yPct: Math.random() * 100,
      size: Math.random() * 1.6 + 0.4, phase: Math.random() * Math.PI * 2
    });
  }
}

/* =========================================================
   GRAVITY
   The single source of truth for "how hard does gravity pull at this
   point", used by BOTH the live physics step and the trajectory preview
   below — so the dotted preview arc can never disagree with where the
   comet will actually go.
========================================================= */
function gravityAccelAt(canvas, level, x, y){
  const minDist = canvas.width * GRAV_MIN_DIST_FRAC;
  const minDistSq = minDist * minDist;
  let ax = 0, ay = 0;
  for(const planet of level.planets){
    const px = canvas.width * (planet.x / 100), py = canvas.height * (planet.y / 100);
    const dx = px - x, dy = py - y;
    let distSq = dx * dx + dy * dy;
    if(distSq < minDistSq) distSq = minDistSq;
    const dist = Math.sqrt(distSq);
    const accel = GRAV_STRENGTH * planet.mass / distSq;
    ax += accel * dx / dist;
    ay += accel * dy / dist;
  }
  return { ax, ay };
}

/* =========================================================
   AIM / DRAG INPUT — a pull-back slingshot exactly like Sky
   Slingshot's, so the input feel is already familiar; the twist here
   is entirely in what happens to the comet AFTER release.
========================================================= */
let dragging = false;
let dragStart = null;
let dragCurrent = null;

function canvasPoint(canvas, e){
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// Clamped exactly like Sky Slingshot's computePull — the pulled-back
// visual point is kept fully inside the canvas, then the effective
// power/direction is recomputed FROM that clamped point, so aiming can
// never drag the preview (or the eventual launch) off-screen or require
// the cursor to leave the window to reach full power.
function computeCometPull(canvas){
  const anchorX = canvas.width * (LAUNCH_X_PCT / 100), anchorY = canvas.height * (LAUNCH_Y_PCT / 100);
  const r = state.cometComet ? state.cometComet.r : canvas.width * 0.018;
  const maxPull = canvas.width * 0.16;

  const rawDx = dragStart.x - dragCurrent.x, rawDy = dragStart.y - dragCurrent.y;
  const rawDist = Math.hypot(rawDx, rawDy);
  const dist = Math.min(rawDist, maxPull);
  const nx = rawDist > 0 ? rawDx / rawDist : 0, ny = rawDist > 0 ? rawDy / rawDist : 0;

  let x = anchorX - nx * dist, y = anchorY - ny * dist;
  x = Math.max(r * 1.3, Math.min(canvas.width - r * 1.3, x));
  y = Math.max(r * 1.3, Math.min(canvas.height - r * 1.3, y));

  const edx = anchorX - x, edy = anchorY - y;
  const edist = Math.hypot(edx, edy);
  const power = Math.min(edist / maxPull, 1);
  return {
    x, y, power, dist: edist,
    nx: edist > 0 ? edx / edist : 0, ny: edist > 0 ? edy / edist : 0,
    anchorX, anchorY, maxPull
  };
}

function onCometPointerDown(e){
  if(!state.cometRoundActive || !state.cometComet || state.cometComet.launched || state.cometShotsLeft <= 0) return;
  const canvas = cometCanvasResizer.getCanvas();
  dragging = true;
  dragStart = canvasPoint(canvas, e);
  dragCurrent = { ...dragStart };
  document.getElementById('cometHint').classList.add('hidden');
}
function onCometPointerMove(e){
  if(!dragging) return;
  const canvas = cometCanvasResizer.getCanvas();
  dragCurrent = canvasPoint(canvas, e);
  renderCometCanvas();
}
function onCometPointerUp(){
  if(!dragging) return;
  dragging = false;
  const canvas = cometCanvasResizer.getCanvas();
  const pull = computeCometPull(canvas);

  if(pull.dist < 10){ renderCometCanvas(); return; } // too small a drag — not a real launch attempt

  const speed = pull.power * canvas.width * MAX_LAUNCH_SPEED_FACTOR;
  const comet = state.cometComet;
  comet.vx = pull.nx * speed;
  comet.vy = pull.ny * speed;
  comet.launched = true;
  comet.launchedAt = performance.now();
  comet.spin = (Math.random() - 0.5) * 5 + comet.vx * 0.008;
  state.cometShotsLeft--;
  document.getElementById('cometShotsDisplay').textContent = String(state.cometShotsLeft);
  sfxLaunch();
}
function cancelDragIfStuck(){
  if(dragging){ dragging = false; renderCometCanvas(); }
}

const cometCanvasEl = cometCanvasResizer.getCanvas();
cometCanvasEl.addEventListener('mousedown', onCometPointerDown);
window.addEventListener('mousemove', onCometPointerMove);
window.addEventListener('mouseup', onCometPointerUp);
window.addEventListener('blur', cancelDragIfStuck);
cometCanvasEl.addEventListener('touchstart', (e) => { onCometPointerDown(e.touches[0]); e.preventDefault(); }, { passive: false });
cometCanvasEl.addEventListener('touchmove', (e) => { onCometPointerMove(e.touches[0]); e.preventDefault(); }, { passive: false });
cometCanvasEl.addEventListener('touchend', onCometPointerUp);

/* =========================================================
   PHYSICS
========================================================= */
let cometFinishTimeout = null;

// Shared end-of-shot bookkeeping — whether the comet landed, got
// swallowed, or timed out, they all funnel through here: log the points,
// freeze the comet, then pause briefly before either loading the next
// comet or (on the last shot) resolving the whole turn. Same role as
// Sky Slingshot's post-collision setTimeout branching.
function endCometShot(points){
  state.cometTurnScore += points;
  document.getElementById('cometScoreDisplay').textContent = String(state.cometTurnScore);
  const comet = state.cometComet;
  if(comet){ comet.launched = false; comet.vx = 0; comet.vy = 0; }
  clearTimeout(cometFinishTimeout);
  if(state.cometShotsLeft > 0){
    cometFinishTimeout = setTimeout(loadNextComet, TURN_END_PAUSE_MS * 0.5);
  } else {
    cometFinishTimeout = setTimeout(finishCometTurn, TURN_END_PAUSE_MS);
  }
}

function landCometInTarget(comet, tx, ty, bullseye){
  comet.x = tx; comet.y = ty;
  spawnCometParticles(tx, ty, bullseye ? '#FFD23F' : '#43D1FF', bullseye ? 46 : 28, bullseye ? 1.6 : 1.1);
  sfxTargetHit(bullseye);
  endCometShot(bullseye ? POINTS_BULLSEYE : POINTS_TARGET);
}

function swallowComet(comet, bx, by){
  spawnSwallowParticles(comet.x, comet.y);
  sfxSwallow();
  endCometShot(0);
}

function missComet(comet){
  spawnCometParticles(comet.x, comet.y, '#8A8F98', 14, 0.6);
  sfxMiss();
  endCometShot(0);
}

function updateCometPhysics(dt){
  const comet = state.cometComet;
  if(!comet || !comet.launched){ updateCometParticles(); return; }
  const canvas = cometCanvasResizer.getCanvas();
  const dtSec = Math.min(0.032, dt / 1000);
  const level = COMET_LEVELS[state.cometLevelIndex % COMET_LEVELS.length];

  const { ax, ay } = gravityAccelAt(canvas, level, comet.x, comet.y);
  comet.vx += ax * dtSec; comet.vy += ay * dtSec;
  comet.vx *= (1 - DRAG * dtSec); comet.vy *= (1 - DRAG * dtSec);

  const speed = Math.hypot(comet.vx, comet.vy);
  const maxSpeed = canvas.width * 1.3;
  if(speed > maxSpeed){ const k = maxSpeed / speed; comet.vx *= k; comet.vy *= k; }

  comet.x += comet.vx * dtSec; comet.y += comet.vy * dtSec;
  comet.rotation = (comet.rotation || 0) + (comet.spin || 0) * dtSec;
  updateCometTrail(comet);

  const margin = comet.r;
  if(comet.x - margin < 0){ comet.x = margin; comet.vx = Math.abs(comet.vx) * WALL_RESTITUTION; sfxWallPing(); }
  if(comet.x + margin > canvas.width){ comet.x = canvas.width - margin; comet.vx = -Math.abs(comet.vx) * WALL_RESTITUTION; sfxWallPing(); }
  if(comet.y - margin < 0){ comet.y = margin; comet.vy = Math.abs(comet.vy) * WALL_RESTITUTION; sfxWallPing(); }
  if(comet.y + margin > canvas.height){ comet.y = canvas.height - margin; comet.vy = -Math.abs(comet.vy) * WALL_RESTITUTION; sfxWallPing(); }

  if(level.blackHole){
    const bx = canvas.width * (level.blackHole.x / 100), by = canvas.height * (level.blackHole.y / 100);
    const br = canvas.width * (level.blackHole.r / 100);
    if(Math.hypot(comet.x - bx, comet.y - by) < br + comet.r * 0.4){
      swallowComet(comet, bx, by);
      return;
    }
  }

  const tx = canvas.width * (level.target.x / 100), ty = canvas.height * (level.target.y / 100);
  const trOuter = canvas.width * (level.target.r / 100), trBonus = canvas.width * (level.target.rBonus / 100);
  const distToTarget = Math.hypot(comet.x - tx, comet.y - ty);
  if(distToTarget < trOuter){
    landCometInTarget(comet, tx, ty, distToTarget < trBonus);
    return;
  }

  if(performance.now() - comet.launchedAt > MAX_FLIGHT_MS){
    missComet(comet);
    return;
  }

  updateCometParticles();
}

function startCometRound(){
  state.cometRoundActive = true;
  let lastTime = performance.now();
  function tick(now){
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    updateCometPhysics(dt);
    renderCometCanvas();
    if(state.cometRoundActive){
      state.cometRoundRAF = requestAnimationFrame(tick);
    }
  }
  state.cometRoundRAF = requestAnimationFrame(tick);
}

export function cancelCometRound(){
  if(state.cometRoundRAF) cancelAnimationFrame(state.cometRoundRAF);
  state.cometRoundRAF = null;
  state.cometRoundActive = false;
  clearTimeout(cometFinishTimeout);
  dragging = false;
  state.cometComet = null;
  state.cometParticles = [];
  cometTrail = [];
  const playArea = document.getElementById('cometPlayArea');
  if(playArea) playArea.classList.add('idle');
  const hint = document.getElementById('cometHint');
  if(hint) hint.classList.add('hidden');
  const canvas = cometCanvasResizer.getCanvas();
  if(canvas){ const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
  const beginBtn = document.getElementById('cometBeginTurnBtn');
  if(beginBtn) beginBtn.disabled = false;
}

/* =========================================================
   TRAJECTORY PREVIEW
   Simulates forward using the exact same gravityAccelAt() the real
   flight uses, including wall bounces, so the dotted preview line is a
   genuine prediction, not a decorative arc — the whole point of a
   gravity-well game is being able to actually read the curve before
   committing to a shot.
========================================================= */
function computeTrajectoryPreview(canvas, level, pull){
  const speed = pull.power * canvas.width * MAX_LAUNCH_SPEED_FACTOR;
  let x = pull.x, y = pull.y, vx = pull.nx * speed, vy = pull.ny * speed;
  const points = [];
  const stepDt = 0.045;
  const r = state.cometComet ? state.cometComet.r : canvas.width * 0.018;
  let bounces = 0;
  for(let i = 0; i < 80; i++){
    const { ax, ay } = gravityAccelAt(canvas, level, x, y);
    vx += ax * stepDt; vy += ay * stepDt;
    vx *= (1 - DRAG * stepDt); vy *= (1 - DRAG * stepDt);
    x += vx * stepDt; y += vy * stepDt;

    if(x - r < 0){ x = r; vx = Math.abs(vx) * WALL_RESTITUTION; bounces++; }
    if(x + r > canvas.width){ x = canvas.width - r; vx = -Math.abs(vx) * WALL_RESTITUTION; bounces++; }
    if(y - r < 0){ y = r; vy = Math.abs(vy) * WALL_RESTITUTION; bounces++; }
    if(y + r > canvas.height){ y = canvas.height - r; vy = -Math.abs(vy) * WALL_RESTITUTION; bounces++; }
    if(bounces > 2) break;

    points.push({ x, y });

    if(level.blackHole){
      const bx = canvas.width * (level.blackHole.x / 100), by = canvas.height * (level.blackHole.y / 100);
      const br = canvas.width * (level.blackHole.r / 100);
      if(Math.hypot(x - bx, y - by) < br + r * 0.4) break;
    }
    const tx = canvas.width * (level.target.x / 100), ty = canvas.height * (level.target.y / 100);
    const trOuter = canvas.width * (level.target.r / 100);
    if(Math.hypot(x - tx, y - ty) < trOuter) break;
  }
  return points;
}

/* =========================================================
   RENDERING
========================================================= */
function renderCometCanvas(){
  const canvas = cometCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ensureCometStars(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.4, 0, canvas.width * 0.5, canvas.height * 0.4, canvas.height * 1.1);
  bg.addColorStop(0, '#241F4D');
  bg.addColorStop(1, '#08061A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const now = performance.now();
  for(const star of state.cometStars){
    const x = canvas.width * (star.xPct / 100), y = canvas.height * (star.yPct / 100);
    const twinkle = 0.5 + 0.5 * Math.sin(now / 900 + star.phase);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.5 * twinkle;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const level = COMET_LEVELS[state.cometLevelIndex % COMET_LEVELS.length];

  // Planets — glowing sphere + a tilted ring, each a distinct color.
  level.planets.forEach((planet, i) => {
    const px = canvas.width * (planet.x / 100), py = canvas.height * (planet.y / 100);
    const pr = canvas.width * (planet.r / 100);
    const color = PLANET_COLORS[i % PLANET_COLORS.length];
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.35);
    ctx.strokeStyle = color; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(2, pr * 0.12);
    ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.7, pr * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 22;
    const grad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
    grad.addColorStop(0, '#fff'); grad.addColorStop(0.35, color); grad.addColorStop(1, '#4A3A1B');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Black hole — dark core with a rotating dashed accretion ring.
  if(level.blackHole){
    const bx = canvas.width * (level.blackHole.x / 100), by = canvas.height * (level.blackHole.y / 100);
    const br = canvas.width * (level.blackHole.r / 100);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(now / 900);
    ctx.strokeStyle = '#B26BFF'; ctx.globalAlpha = 0.6; ctx.lineWidth = Math.max(2, br * 0.14);
    ctx.setLineDash([br * 0.5, br * 0.35]);
    ctx.beginPath(); ctx.arc(0, 0, br * 1.35, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = '#8B3EFF'; ctx.shadowBlur = 26;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, '#0A0714'); grad.addColorStop(0.7, '#1B1030'); grad.addColorStop(1, '#3A2160');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Target — pulsing outer (cyan) + inner bullseye (gold) rings.
  const tx = canvas.width * (level.target.x / 100), ty = canvas.height * (level.target.y / 100);
  const trOuter = canvas.width * (level.target.r / 100), trBonus = canvas.width * (level.target.rBonus / 100);
  const pulse = 1 + 0.06 * Math.sin(now / 260);
  ctx.save();
  ctx.shadowColor = '#43D1FF'; ctx.shadowBlur = 16;
  ctx.strokeStyle = '#43D1FF'; ctx.lineWidth = Math.max(2, trOuter * 0.08); ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(tx, ty, trOuter * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowColor = '#FFD23F';
  ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = Math.max(2, trBonus * 0.16);
  ctx.beginPath(); ctx.arc(tx, ty, trBonus * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Particles
  for(const p of state.cometParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Slingshot posts + trajectory preview while aiming.
  const anchorX = canvas.width * (LAUNCH_X_PCT / 100), anchorY = canvas.height * (LAUNCH_Y_PCT / 100);
  if(dragging && dragStart && dragCurrent && state.cometComet){
    const pull = computeCometPull(canvas);

    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(2, canvas.width * 0.004);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(pull.x, pull.y);
    ctx.stroke();

    if(pull.dist > 10){
      const preview = computeTrajectoryPreview(canvas, level, pull);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      preview.forEach((pt, i) => {
        if(i % 2 !== 0) return; // every other point — a dashed feel without a dash array on a curved polyline
        ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(1.5, canvas.width * 0.0032), 0, Math.PI * 2); ctx.fill();
      });
    }
    state.cometComet.x = pull.x; state.cometComet.y = pull.y;
  } else if(state.cometComet && !state.cometComet.launched){
    state.cometComet.x = anchorX; state.cometComet.y = anchorY;
  }

  // The comet itself — an icy core with a fading trail while in flight,
  // spinning at a rate roughly proportional to its launch speed.
  const comet = state.cometComet;
  if(comet){
    if(comet.launched){
      for(const t of cometTrail){
        ctx.save();
        ctx.globalAlpha = t.alpha * 0.5;
        ctx.fillStyle = '#9FE8FF';
        ctx.beginPath(); ctx.arc(t.x, t.y, comet.r * 0.55 * t.alpha, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(comet.x, comet.y);
    ctx.rotate(comet.rotation || 0);
    ctx.shadowColor = '#3E8FE0'; ctx.shadowBlur = 16;
    const grad = ctx.createRadialGradient(-comet.r * 0.3, -comet.r * 0.3, 0, 0, 0, comet.r);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.55, '#9FE8FF'); grad.addColorStop(1, '#3E8FE0');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, comet.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'comet',
  getTeams: () => state.cometTeams,
  renderScoreboard: renderCometScoreboard,
  cancelRound: cancelCometRound
});

document.getElementById('cometBackBtn').addEventListener('click', () => goToStage(11));
// Wired here (the target stage's own file), not in stage11 — same
// existing convention as qsNextStageBtn/plinkoNextStageBtn: a "Next"
// button's click handler lives in the file for the stage it goes TO.
document.getElementById('birdsNextStageBtn').addEventListener('click', () => goToStage(12));
