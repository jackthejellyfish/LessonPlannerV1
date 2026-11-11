import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { beep } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { WHEEL_QUESTIONS, WHEEL_COLORS } from '../content/stage8-spinwheel.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { createShakeState, triggerShake, applyShake } from '../canvasEffects.js';

/* =========================================================
   STAGE 8 — SPIN THE WHEEL (replaces the old Bamboozle tile game)
   Team-turn structure: click "Spin", the wheel spins through several
   full rotations with an ease-out deceleration and lands on the next
   question in a shuffled order (state.wheelQuestionOrder — same
   proven "shuffle once, consume one per turn" pattern every other
   game here uses) — the segment it visually lands on IS that
   question's real segment, not just decoration, so the spin is a
   genuine (if simple) mechanic, not only a flourish. Each of the 10
   segments has its own fixed point value; landing reveals that
   question via the shared showQuestionModal, and a self-marked-
   correct answer awards that segment's points. Once used, a segment
   dims and won't be landed on again.
========================================================= */
const SEG_COUNT = WHEEL_QUESTIONS.length;
const SEG_ANGLE = (Math.PI * 2) / SEG_COUNT;
const SPIN_DURATION_MS = 4200;
const SPIN_EXTRA_TURNS = 6;

let wheelRowColors = [];

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('wheelSetup', {
  prefix: 'wheel',
  title: 'Spin the Wheel',
  steps: [
    'Spin the wheel to land on a question.',
    'Answer it out loud with your team.',
    'Answer correctly to win that slice&rsquo;s points.'
  ],
  tip: 'Bigger numbers on the wheel are worth more points &mdash; and this is the one game where a wrong answer scores nothing, so take your time.'
});

export function renderWheelTeamInputs(count){
  renderTeamSetupRows('wheelTeamInputs', 'wheelAddTeamBtn', count, wheelRowColors, renderWheelTeamInputs);
}
renderWheelTeamInputs(2);
wireAddTeamButton('wheelTeamInputs', 'wheelAddTeamBtn', renderWheelTeamInputs);

document.getElementById('wheelStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#wheelTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.wheelTeams = names.map((name, i) => ({ name, color: wheelRowColors[i], total: 0 }));
  state.wheelCurrentTeam = 0;
  state.wheelTurnsPlayed = 0;
  state.wheelQuestionOrder = shuffle(WHEEL_QUESTIONS.map((_, i) => i));
  state.wheelUsedSegments = new Array(SEG_COUNT).fill(false);
  currentWheelAngle = 0;

  document.getElementById('wheelSetup').classList.add('hidden');
  document.getElementById('wheelGame').classList.remove('hidden');
  document.getElementById('wheelGameOverBanner').classList.add('hidden');
  resizeWheelCanvas();
  document.getElementById('wheelQDisplay').textContent = `1/${SEG_COUNT}`;
  document.getElementById('wheelLastSpinDisplay').textContent = '—';
  renderWheelScoreboard();
  renderWheelTurnBanner();
  renderWheelCanvas();
});

function renderWheelScoreboard(){
  renderTeamScoreboard('wheelTeamList', state.wheelTeams, state.wheelCurrentTeam);
}
function renderWheelTurnBanner(){
  document.getElementById('wheelTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.wheelTeams[state.wheelCurrentTeam].name)}</strong>'s turn — spin ${state.wheelTurnsPlayed + 1} of ${SEG_COUNT}`;
}

/* =========================================================
   AUDIO
========================================================= */
function sfxTick(){ if(state.muted) return; beep(700, 0.03, 'square', 0.08); }
function sfxLand(points){
  if(state.muted) return;
  const notes = points >= 25 ? [660, 880, 1100, 1320] : points >= 15 ? [660, 880, 1046] : [520, 660];
  notes.forEach((f, i) => beep(f, 0.16, 'triangle', 0.2, i * 0.07));
}

/* =========================================================
   PARTICLES (confetti burst on landing)
========================================================= */
function spawnWheelConfetti(x, y, count){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    const hue = Math.floor(Math.random() * 360);
    state.wheelParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
      alpha: 1, decay: Math.random() * 0.015 + 0.01, size: Math.random() * 6 + 3,
      color: `hsl(${hue}, 90%, 62%)`
    });
  }
}
function updateWheelParticles(){
  for(const p of state.wheelParticles){
    p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.98;
    p.alpha -= p.decay; p.size *= 0.97;
  }
  state.wheelParticles = state.wheelParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

/* =========================================================
   CANVAS SIZING
========================================================= */
const wheelCanvasResizer = createCanvasResizer('wheelCanvas', 'wheelPlayArea');
export function resizeWheelCanvas(){ wheelCanvasResizer.resize(); renderWheelCanvas(); }
export function ensureWheelLayout(){
  if(state.wheelTeams.length > 0) resizeWheelCanvas();
}

/* =========================================================
   SPIN ANIMATION
   currentWheelAngle is transient UI/animation state, not core game
   data — kept module-level rather than in `state`, same reasoning as
   Plinko's hover-preview vars and Sky Slingshot's trail array.
========================================================= */
let currentWheelAngle = 0;
let landingFlash = 0; // 0-1, decays after landing — brightens the wheel rim briefly
const wheelShake = createShakeState();

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

// Segment `index`'s center sits at local angle (-90° + index*SEG_ANGLE)
// before rotation (see renderWheelCanvas) — this solves for how far
// forward (in the direction the wheel spins) to rotate from wherever
// it currently sits so that segment ends up centered under the fixed
// top pointer, plus several extra full spins for the flourish.
function computeTargetAngle(startAngle, index){
  const twoPi = Math.PI * 2;
  const landingMod = (((-index * SEG_ANGLE) % twoPi) + twoPi) % twoPi;
  const currentMod = ((startAngle % twoPi) + twoPi) % twoPi;
  let delta = (landingMod - currentMod + twoPi) % twoPi;
  delta += SPIN_EXTRA_TURNS * twoPi;
  return startAngle + delta;
}

function spinWheelTo(index){
  return new Promise(resolve => {
    const startAngle = currentWheelAngle;
    const targetAngle = computeTargetAngle(startAngle, index);
    const startTime = performance.now();
    let prevCrossCount = 0;
    state.wheelRoundActive = true;

    function frame(now){
      const t = Math.min(1, (now - startTime) / SPIN_DURATION_MS);
      const eased = easeOutCubic(t);
      currentWheelAngle = startAngle + (targetAngle - startAngle) * eased;

      const traveled = currentWheelAngle - startAngle;
      const crossCount = Math.floor(traveled / SEG_ANGLE);
      if(crossCount > prevCrossCount){ sfxTick(); prevCrossCount = crossCount; }

      updateWheelParticles();
      renderWheelCanvas();

      if(t >= 1){
        currentWheelAngle = targetAngle;
        state.wheelRoundActive = false;
        landingFlash = 1;
        landOnSegment(index, resolve);
        return;
      }
      state.wheelRoundRAF = requestAnimationFrame(frame);
    }
    state.wheelRoundRAF = requestAnimationFrame(frame);
  });
}

// Landing moment: confetti + shake, then a short settle render loop
// before resolving. Previously the frame loop stopped dead the instant
// the spin finished — confetti spawned right after `spinWheelTo`
// resolved (in the old beginWheelTurn) never got a single animated
// frame, since nothing called renderWheelCanvas again until the NEXT
// spin; only a blind `setTimeout` separated landing from the question
// modal covering the canvas. A shake triggered at the landing moment
// would have suffered the exact same fate. This settle loop is what
// actually makes both visible.
function landOnSegment(index, resolve){
  const canvas = wheelCanvasResizer.getCanvas();
  const points = WHEEL_QUESTIONS[index].points;
  spawnWheelConfetti(canvas.width / 2, canvas.height * 0.12, 40);
  sfxLand(points);
  triggerShake(wheelShake, Math.min(10, 2 + points / 25));

  const settleStart = performance.now();
  function settleFrame(now){
    updateWheelParticles();
    renderWheelCanvas();
    if(now - settleStart < 550){
      state.wheelRoundRAF = requestAnimationFrame(settleFrame);
    } else {
      resolve();
    }
  }
  state.wheelRoundRAF = requestAnimationFrame(settleFrame);
}

export function cancelWheelRound(){
  if(state.wheelRoundRAF) cancelAnimationFrame(state.wheelRoundRAF);
  state.wheelRoundRAF = null;
  state.wheelRoundActive = false;
  state.wheelParticles = [];
  const beginBtn = document.getElementById('wheelBeginTurnBtn');
  if(beginBtn) beginBtn.disabled = false;
}

/* =========================================================
   TURN FLOW
========================================================= */
document.getElementById('wheelBeginTurnBtn').addEventListener('click', beginWheelTurn);
async function beginWheelTurn(){
  document.getElementById('wheelBeginTurnBtn').disabled = true;
  document.getElementById('wheelPlayArea').classList.remove('idle');

  const qIndex = state.wheelQuestionOrder[state.wheelTurnsPlayed];
  // Confetti/sfx/shake + the beat before the modal covers the canvas
  // all now happen inside spinWheelTo's own landOnSegment() settle loop.
  await spinWheelTo(qIndex);

  const q = WHEEL_QUESTIONS[qIndex];
  const correct = await showQuestionModal(q.prompt, q.answer, { showFollowup: true });
  const points = correct ? q.points : 0;
  finishWheelTurn(qIndex, points);
}

function finishWheelTurn(qIndex, points){
  state.wheelUsedSegments[qIndex] = true;
  const team = state.wheelTeams[state.wheelCurrentTeam];
  team.total += points;
  state.wheelTurnsPlayed++;
  document.getElementById('wheelLastSpinDisplay').textContent = `+${points}`;
  renderWheelScoreboard();
  document.getElementById('wheelPlayArea').classList.add('idle');

  showWheelResult().then(() => {
    if(state.wheelTurnsPlayed >= SEG_COUNT){
      endWheelGame();
    } else {
      state.wheelCurrentTeam = (state.wheelCurrentTeam + 1) % state.wheelTeams.length;
      renderWheelScoreboard();
      renderWheelTurnBanner();
      document.getElementById('wheelQDisplay').textContent = `${state.wheelTurnsPlayed + 1}/${SEG_COUNT}`;
      document.getElementById('wheelBeginTurnBtn').disabled = false;
    }
  });
}

function showWheelResult(){
  return showTurnResultModal('wheelNextTeamBtn', { teams: state.wheelTeams, currentTeamIndex: state.wheelCurrentTeam });
}

function endWheelGame(){
  const winnerText = finishTeamGame({ prefix: 'wheel', teams: state.wheelTeams });
  document.getElementById('wheelTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   RENDERING
========================================================= */
function renderWheelCanvas(){
  const canvas = wheelCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer save/restore + applyShake wraps the ENTIRE draw (background,
  // wheel, rim, pointer, confetti) so a landing shake offsets everything
  // together — same pattern every other canvas game's own applyShake
  // call already uses.
  ctx.save();
  applyShake(ctx, wheelShake);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.42;

  const bg = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, Math.max(canvas.width, canvas.height) * 0.75);
  bg.addColorStop(0, '#2E2350'); bg.addColorStop(1, '#12102A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if(landingFlash > 0) landingFlash = Math.max(0, landingFlash - 0.025);

  // Idle shimmer + landing flash — a soft glow ring behind the wheel.
  const shimmer = 0.5 + 0.5 * Math.sin(performance.now() / 600);
  ctx.save();
  ctx.globalAlpha = 0.25 + shimmer * 0.15 + landingFlash * 0.6;
  ctx.shadowColor = '#FFD23F';
  ctx.shadowBlur = radius * (0.15 + landingFlash * 0.35);
  ctx.fillStyle = '#FFD23F';
  ctx.beginPath(); ctx.arc(cx, cy, radius * 1.04, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentWheelAngle);
  for(let i = 0; i < SEG_COUNT; i++){
    const center = -Math.PI / 2 + i * SEG_ANGLE;
    const startA = center - SEG_ANGLE / 2, endA = center + SEG_ANGLE / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startA, endA);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(center);
    ctx.translate(radius * 0.66, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(13, radius * 0.15)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(WHEEL_QUESTIONS[i].points), 0, 0);
    ctx.restore();
  }
  // Hub
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  // Rim
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(3, radius * 0.03);
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Pointer — fixed at top, outside the wheel's own rotation.
  ctx.save();
  ctx.fillStyle = '#3A2E22';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.07, cy - radius - radius * 0.06);
  ctx.lineTo(cx + radius * 0.07, cy - radius - radius * 0.06);
  ctx.lineTo(cx, cy - radius + radius * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  for(const p of state.wheelParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // closes the outer save()/applyShake() from the top of this function
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'wheel',
  getTeams: () => state.wheelTeams,
  renderScoreboard: renderWheelScoreboard,
  cancelRound: cancelWheelRound
});

document.getElementById('wheelBackBtn').addEventListener('click', () => goToStage(7));
document.getElementById('wheelNextBtn').addEventListener('click', () => goToStage(9));
