import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, beep } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { PLINKO_QUESTIONS, BALL_TYPES, SLOT_VALUES } from '../content/stage10-plinko.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';

/* =========================================================
   STAGE 10 — PLINKO DROP
   Teams take turns: answer a question, pick a ball (more types
   unlock as the game goes on), then click the board to choose a
   drop point. The ball falls through a peg field with real
   (simplified) circle physics — gravity, elastic bounces off
   each peg, a small random "wobble" kick scaled to impact speed
   so two drops never play out identically — and settles into one
   of nine scoring slots. Edge slots pay out far more than the
   center, same risk/reward shape as a real Plinko board, because
   the peg field naturally funnels most balls toward the middle.
   Reuses Ball Pop/Star Defender's question + result modals and
   team-turn structures rather than inventing new ones.
========================================================= */
function ballTypeById(id){ return BALL_TYPES.find(b => b.id === id); }

// Live hover preview while choosing a drop point (see waitForPlinkoDrop)
// — not part of `state` since it's a transient UI hint, not game data.
let plinkoPreviewX = null;
let plinkoPreviewTypeId = null;
// The picker's mousemove/click listeners for the CURRENT drop-in-progress,
// so cancelPlinkoRound() can remove them if the teacher navigates away
// mid-selection (before either listener fires and cleans itself up).
let plinkoDropListeners = null;

// Landing feedback — transient render-only state, same reasoning as the
// hover-preview vars above: not part of `state`, just what the current
// frame should draw. `strength` decays from 1 to 0 each frame, driving
// the winning slot's flash/scale-up; `big` marks a 100-point land for
// the extra full-board glow wash.
let plinkoLandFlash = { slotIndex: -1, strength: 0, big: false };
let plinkoFloatTexts = []; // rising "+N" score text: {x,y,text,color,alpha,vy}

// Screen shake on a big moment (a bonus-peg pop, or a 100+ point land) —
// same small canvas-translate trick as Sky Slingshot's triggerShake.
// Added per feedback that other games' impact moments could use some of
// the same "juice" Sky Slingshot's shake landed well.
let plinkoShakeUntil = 0;
let plinkoShakeMag = 0;
const PLINKO_SHAKE_DURATION_MS = 170;
function triggerPlinkoShake(mag){
  plinkoShakeUntil = performance.now() + PLINKO_SHAKE_DURATION_MS;
  plinkoShakeMag = mag;
}

/* =========================================================
   SETUP
========================================================= */
export function renderPlinkoBallLegend(){
  document.getElementById('plinkoBallLegend').innerHTML = BALL_TYPES.map(b => {
    const unlocked = b.unlockAtTurn === 0;
    return `
      <div class="pop-legend-item plinko-legend-item${unlocked ? '' : ' locked'}">
        <div class="pop-legend-swatch-box"><span class="plinko-legend-swatch ${b.id}"></span></div>
        <span class="pop-legend-points">${escapeHtml(b.name)}</span>
        ${unlocked ? '' : `<span class="plinko-legend-lock">unlocks turn ${b.unlockAtTurn + 1}</span>`}
      </div>
    `;
  }).join('');
}
renderPlinkoBallLegend();

let plinkoRowColors = [];

export function renderPlinkoTeamInputs(count){
  renderTeamSetupRows('plinkoTeamInputs', 'plinkoAddTeamBtn', count, plinkoRowColors, renderPlinkoTeamInputs);
}
renderPlinkoTeamInputs(2);

wireAddTeamButton('plinkoTeamInputs', 'plinkoAddTeamBtn', renderPlinkoTeamInputs);

document.getElementById('plinkoStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#plinkoTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.plinkoTeams = names.map((name, i) => ({ name, color: plinkoRowColors[i], total: 0 }));
  state.plinkoCurrentTeam = 0;
  state.plinkoTurnsPlayed = 0;
  state.plinkoQuestionOrder = shuffle(PLINKO_QUESTIONS.map((_, i) => i));
  state.plinkoUnlockedBalls = ['classic'];
  state.plinkoBalls = [];
  state.plinkoRoundResults = [];

  document.getElementById('plinkoSetup').classList.add('hidden');
  document.getElementById('plinkoGame').classList.remove('hidden');
  document.getElementById('plinkoGameOverBanner').classList.add('hidden');
  resizePlinkoCanvas();
  document.getElementById('plinkoQDisplay').textContent = `1/${PLINKO_QUESTIONS.length}`;
  document.getElementById('plinkoBallDisplay').textContent = '—';
  renderPlinkoScoreboard();
  renderPlinkoTurnBanner();
  renderPlinkoCanvas();
});

function renderPlinkoScoreboard(){
  renderTeamScoreboard('plinkoTeamList', state.plinkoTeams, state.plinkoCurrentTeam);
}
function renderPlinkoTurnBanner(){
  document.getElementById('plinkoTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.plinkoTeams[state.plinkoCurrentTeam].name)}</strong>'s turn — question ${state.plinkoTurnsPlayed + 1} of ${PLINKO_QUESTIONS.length}`;
}

/* =========================================================
   QUESTION + BALL-PICK + DROP FLOW
========================================================= */
function askPlinkoQuestion(){
  const qIndex = state.plinkoQuestionOrder[state.plinkoTurnsPlayed];
  const q = PLINKO_QUESTIONS[qIndex];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

function pickPlinkoBall(){
  return new Promise(resolve => {
    const picker = document.getElementById('plinkoBallPicker');
    picker.classList.remove('drop-hint-mode');
    const unlocked = BALL_TYPES.filter(b => state.plinkoUnlockedBalls.includes(b.id));
    picker.innerHTML = `
      <div class="plinko-ball-picker-title">Choose your ball</div>
      <div class="plinko-ball-options">
        ${unlocked.map(b => `
          <button type="button" class="plinko-ball-option" data-id="${b.id}">
            <span class="plinko-legend-swatch ${b.id}"></span>
            <span class="plinko-ball-option-name">${escapeHtml(b.name)}</span>
          </button>
        `).join('')}
      </div>
    `;
    picker.classList.remove('hidden');
    picker.querySelectorAll('.plinko-ball-option').forEach(btn => {
      btn.addEventListener('click', () => {
        picker.classList.add('hidden');
        resolve(btn.dataset.id);
      });
    });
  });
}

// Full width is droppable — the peg field spans edge to edge (see
// generatePlinkoPegs) — so the only clamp is a small safety margin
// keeping the ball off the very edge of the canvas.
function clampDropX(rectWidth, x){
  return Math.max(rectWidth * 0.05, Math.min(rectWidth * 0.95, x));
}

function waitForPlinkoDrop(typeId){
  return new Promise(resolve => {
    const picker = document.getElementById('plinkoBallPicker');
    picker.innerHTML = `<div class="plinko-drop-hint">Click anywhere along the top to drop your ball — left, right, or center!</div>`;
    picker.classList.remove('hidden');
    picker.classList.add('drop-hint-mode');
    const canvas = plinkoCanvasResizer.getCanvas();

    plinkoPreviewTypeId = typeId;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      plinkoPreviewX = clampDropX(rect.width, e.clientX - rect.left);
      renderPlinkoCanvas();
    };
    picker.addEventListener('mousemove', onMove);

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = clampDropX(rect.width, e.clientX - rect.left);
      picker.removeEventListener('click', onClick);
      picker.removeEventListener('mousemove', onMove);
      plinkoPreviewX = null;
      plinkoPreviewTypeId = null;
      plinkoDropListeners = null;
      picker.classList.add('hidden');
      picker.classList.remove('drop-hint-mode');
      resolve(x);
    };
    plinkoDropListeners = { onClick, onMove };
    // Deferred exactly like the team-color popover's outside-click
    // listener (see teamColorPicker.js) — attaching this synchronously
    // let the SAME click that picked the ball (a descendant of `picker`)
    // also trigger the drop, since the new listener could still catch
    // that click's bubble phase. One tick later, that click is fully done.
    setTimeout(() => picker.addEventListener('click', onClick), 0);
  });
}

document.getElementById('plinkoBeginTurnBtn').addEventListener('click', beginPlinkoTurn);
async function beginPlinkoTurn(){
  document.getElementById('plinkoBeginTurnBtn').disabled = true;
  // Hides the Begin Turn button for the whole question->pick->drop flow,
  // not just once physics starts — it used to just sit there disabled,
  // invisible only because the modals/overlays happened to cover it.
  document.getElementById('plinkoPlayArea').classList.remove('idle');
  await askPlinkoQuestion();
  const typeId = await pickPlinkoBall();
  document.getElementById('plinkoBallDisplay').textContent = ballTypeById(typeId).name;
  const dropX = await waitForPlinkoDrop(typeId);
  spawnPlinkoBall(typeId, dropX);
  startPlinkoRound();
}

/* =========================================================
   AUDIO
========================================================= */
function sfxPegHit(depthFraction){
  if(state.muted) return;
  // Pitch rises slightly the further down the board — a subtle cascading
  // "ping" ladder rather than a flat repeated tick.
  beep(420 + depthFraction * 260 + Math.random() * 40, 0.055, 'sine', 0.09);
}
function sfxWallBounce(){ beep(220, 0.06, 'triangle', 0.08); }
// A bright, quick "ding" for a normal peg's point-scoring destruction —
// distinct from sfxPegHit's plain bounce tick. Bonus pegs reuse the
// existing sfxExplosion() below instead of a new near-duplicate sound.
function sfxPegPoint(){
  if(state.muted) return;
  beep(920, 0.07, 'triangle', 0.12);
  beep(1240, 0.08, 'triangle', 0.09, 0.03);
}
function sfxExplosion(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const duration = 0.3;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 1400;
  const gain = ctx.createGain(); gain.gain.value = 0.3;
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
  beep(140, 0.12, 'sawtooth', 0.18);
}
function sfxSlotLand(points){
  if(state.muted) return;
  const ctx = ensureAudio();
  const notes = points >= 100 ? [660, 880, 1100, 1320] : points >= 25 ? [660, 880, 1046] : [520, 660];
  notes.forEach((f, i) => beep(f, 0.18, 'triangle', 0.2, i * 0.08));
  if(points >= 100){
    const duration = 0.4;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 2200;
    const gain = ctx.createGain(); gain.gain.value = 0.35;
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
  }
}

/* =========================================================
   PEG FIELD + PHYSICS
========================================================= */
const plinkoCanvasResizer = createCanvasResizer('plinkoCanvas', 'plinkoPlayArea',
  canvas => { state.plinkoPegs = generatePlinkoPegs(canvas); });
function resizePlinkoCanvas(){ plinkoCanvasResizer.resize(); }

// A dense, full-width offset (quincunx) lattice — every row spans the
// same width, odd rows shifted half a spacing so pegs interleave like a
// woven grid. This replaces an earlier narrow-at-the-top triangle: with
// that shape, a ball dropped near either edge fell through empty space
// before ever reaching a peg, so "drop anywhere" only really worked
// near the center. A full-width grid means every drop position — far
// left to far right — hits pegs immediately.
const PLINKO_GRID_COLS = 11;
function generatePlinkoPegs(canvas){
  const pegs = [];
  const marginX = canvas.width * 0.06;
  const usableW = canvas.width - marginX * 2;
  const spacing = usableW / (PLINKO_GRID_COLS - 1);
  const topY = canvas.height * 0.15;
  const bottomY = canvas.height * 0.78;
  // Row count is derived from the board's actual aspect ratio, not a
  // fixed constant — #plinkoPlayArea is deliberately narrower and taller
  // than the old full-width board (see stage10-plinko.css), and a taller
  // peg field should mean more ROWS of bounce chances, not just wider
  // gaps between the same 11 rows. Keeping rowGap roughly matched to the
  // horizontal peg spacing gets a genuinely denser field on a taller
  // board instead of a stretched-out sparse one.
  const rows = Math.max(9, Math.min(20, Math.round((bottomY - topY) / spacing) + 1));
  const rowGap = (bottomY - topY) / (rows - 1);
  const pegRadius = Math.max(3, canvas.width * 0.0052);
  // Small random jitter on every peg's position — regenerated fresh each
  // game (see resizePlinkoCanvas, called from the Start button). A
  // perfectly regular lattice let a ball dropped right against a wall
  // ride a clean, near-identical channel down to that wall's slot every
  // time; jitter breaks that up so no drop position has a "solved" path.
  const jitter = spacing * 0.16;
  for(let r = 0; r < rows; r++){
    const y = topY + rowGap * r;
    const offsetRow = r % 2 === 1;
    const rowCols = offsetRow ? PLINKO_GRID_COLS - 1 : PLINKO_GRID_COLS;
    const startX = marginX + (offsetRow ? spacing / 2 : 0);
    for(let c = 0; c < rowCols; c++){
      // Each peg is one of three kinds, assigned at generation time:
      // most are 'normal' (small point + destroyed on hit), some are
      // 'bonus' (bigger point + explodes, also destroyed), the rest are
      // 'neutral' (no points, permanent — just a physics obstacle like
      // every peg used to be). See the ball-vs-peg collision loop below.
      const roll = Math.random();
      const kind = roll < 0.12 ? 'bonus' : roll < 0.78 ? 'normal' : 'neutral';
      const points = kind === 'bonus' ? 5 : kind === 'normal' ? 1 : 0;
      pegs.push({
        x: startX + spacing * c + (Math.random() - 0.5) * jitter,
        y: y + (Math.random() - 0.5) * jitter * 0.5,
        r: pegRadius, flashUntil: 0, disabledUntil: 0,
        kind, points, destroyed: false
      });
    }
  }
  return pegs;
}

function slotBounds(canvas){
  return { left: canvas.width * 0.045, right: canvas.width * 0.955, top: canvas.height * 0.8 };
}

// Point-goal panel colors, one tier per value band — used both for the
// idle board and the landing flash, so a slot's "identity color" stays
// consistent whether it's just sitting there or just been won.
function slotTierStyle(value){
  if(value >= 100) return { top: '#FFF3C2', bottom: '#FFB800', glow: '#FFD23F', text: '#3A2A00' };
  if(value >= 25)  return { top: '#F3D9FF', bottom: '#B26BFF', glow: '#B26BFF', text: '#2B0A45' };
  if(value >= 10)  return { top: '#D6FBFF', bottom: '#2FB5E0', glow: '#43D1FF', text: '#00303D' };
  if(value >= 5)   return { top: '#E4F3FF', bottom: '#6FA8D6', glow: '#8FD3F4', text: '#0A2C42' };
  return             { top: '#DCE3F5', bottom: '#7A88B8', glow: '#8FA0D6', text: '#1A2340' };
}

function spawnPlinkoBall(typeId, xPx){
  const type = ballTypeById(typeId);
  const canvas = plinkoCanvasResizer.getCanvas();
  // Fresh peg field every drop — same "clean slate each turn" spirit as
  // Billiards' rack/Sky Slingshot's level, so destroying pegs on one drop
  // never leaves a sparser board for the next team's turn.
  state.plinkoPegs = generatePlinkoPegs(canvas);
  state.plinkoPegPoints = 0;
  const bonusDisplay = document.getElementById('plinkoBonusDisplay');
  if(bonusDisplay) bonusDisplay.textContent = '0';
  state.plinkoBalls = [{
    typeId, x: xPx, y: canvas.height * 0.08,
    vx: (Math.random() - 0.5) * 140, vy: 0,
    r: canvas.width * (type.radiusPct / 100), angle: 0,
    gravity: type.gravity, restitution: type.restitution, wobble: type.wobble,
    colorA: type.colorA, colorB: type.colorB, glow: type.glow,
    fiery: !!type.fiery, jackpot: !!type.jackpot,
    explosive: !!type.explosive, splitter: !!type.splitter, chaotic: !!type.chaotic,
    hasSplit: false, nextChaosKick: performance.now() + 120 + Math.random() * 100,
    landed: false
  }];
  state.plinkoRoundResults = [];
}

function spawnPlinkoParticles(x, y, color, count, speedMult = 1){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 5 + 1.5) * speedMult;
    state.plinkoParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.025 + 0.015, size: Math.random() * 5 + 2, color
    });
  }
}

function updatePlinkoParticles(){
  for(const p of state.plinkoParticles){
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1; p.vx *= 0.98;
    p.alpha -= p.decay; p.size *= 0.97;
  }
  state.plinkoParticles = state.plinkoParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

function updatePlinkoFloatTexts(){
  for(const t of plinkoFloatTexts){ t.y += t.vy; t.alpha -= 0.013; }
  plinkoFloatTexts = plinkoFloatTexts.filter(t => t.alpha > 0);
}

// A peg blown open by an Exploding ball stops colliding with anything —
// any ball, not just the one that hit it — until disabledUntil passes.
function detonatePlinkoBall(ball, peg){
  peg.disabledUntil = performance.now() + 500;
  ball.vx += (Math.random() - 0.5) * 900;
  ball.vy -= Math.random() * 260 + 60;
  spawnPlinkoParticles(peg.x, peg.y, '#FF5A2E', 26, 2.2);
  sfxExplosion();
}

function updatePlinkoBalls(dt){
  if(state.plinkoBalls.length === 0) return;
  const canvas = plinkoCanvasResizer.getCanvas();
  const bounds = slotBounds(canvas);
  const dtSec = Math.min(0.032, dt / 1000);
  const now = performance.now();
  const spawned = [];   // splits created this tick — appended after the loop
  const landed = [];

  for(const ball of state.plinkoBalls){
    if(ball.landed){
      // Eases into the slot's center over a few frames instead of
      // snapping there instantly — reads as "rolling to a stop", not a
      // teleport. Slowed from an 0.28 lerp factor to 0.09 (2026-07-16,
      // per feedback that it "janks itself into place") — 0.28 converged
      // in ~10 frames (~170ms), fast enough to still read as a snap; 0.09
      // takes closer to 30 frames (~500ms), long enough to actually see
      // as a roll. landSquash (1 at impact, eased to 0) adds a small
      // squash-and-settle pulse on top, on the same timing.
      if(!ball.settled){
        ball.x += (ball.settleX - ball.x) * 0.09;
        ball.y += (ball.settleY - ball.y) * 0.09;
        ball.landSquash = Math.max(0, (ball.landSquash || 0) - 0.05);
        if(Math.abs(ball.x - ball.settleX) < 0.6 && Math.abs(ball.y - ball.settleY) < 0.6){
          ball.x = ball.settleX; ball.y = ball.settleY; ball.settled = true; ball.landSquash = 0;
        }
      }
      continue;
    }

    ball.vy += ball.gravity * dtSec;
    // A small continuous random sideways drift, independent of peg hits.
    // Without it, a ball dropped hard against a wall could ride an almost
    // straight line down purely via wall bounces (fully deterministic:
    // vx flips sign and scales by a fixed restitution), landing in that
    // wall's high-value slot nearly every time — the main "too easy"
    // exploit this rework targets.
    ball.vx += (Math.random() - 0.5) * 110 * dtSec * 60;
    ball.x += ball.vx * dtSec;
    ball.y += ball.vy * dtSec;
    // Faux rolling — same recipe as Billiards'/Sky Slingshot's ball
    // rotation, speed-driven every frame rather than decorative, so the
    // ball visibly spins faster through the open drop and slower as it
    // wobbles through a dense patch of pegs.
    ball.angle = (ball.angle || 0) + (Math.hypot(ball.vx, ball.vy) / ball.r) * dtSec * (ball.vx < 0 ? -1 : 1);

    if(ball.x - ball.r < bounds.left){
      ball.x = bounds.left + ball.r;
      ball.vx = Math.abs(ball.vx) * ball.restitution + Math.random() * 110;
      sfxWallBounce();
    }
    if(ball.x + ball.r > bounds.right){
      ball.x = bounds.right - ball.r;
      ball.vx = -Math.abs(ball.vx) * ball.restitution - Math.random() * 110;
      sfxWallBounce();
    }

    for(const peg of state.plinkoPegs){
      if(peg.destroyed || now < peg.disabledUntil) continue;
      const dx = ball.x - peg.x, dy = ball.y - peg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = ball.r + peg.r;
      if(dist > 0 && dist < minDist){
        const nx = dx / dist, ny = dy / dist;
        ball.x = peg.x + nx * minDist;
        ball.y = peg.y + ny * minDist;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= (1 + ball.restitution) * dot * nx;
        ball.vy -= (1 + ball.restitution) * dot * ny;
        // Floored at a fixed magnitude, not purely proportional to
        // current speed — a still-slow ball fresh off the drop barely
        // deflected off its first couple of hits otherwise, which made
        // the very top rows nearly frictionless for aim.
        const speed = Math.hypot(ball.vx, ball.vy);
        const kick = Math.max(speed, 320) * (ball.wobble / 100);
        ball.vx += (Math.random() - 0.5) * kick;
        // A touch of vertical randomness too, not just sideways — a hit
        // can now shave a little off the bounce or add a little extra
        // pop, so successive hits don't all trade horizontal speed at an
        // identical, guessable vertical rate.
        ball.vy += (Math.random() - 0.5) * kick * 0.35;
        peg.flashUntil = now + 220;
        spawnPlinkoParticles(peg.x, peg.y, ball.glow, 6, 0.8);
        sfxPegHit(peg.y / bounds.top);

        // Normal/bonus pegs score a point and are destroyed on the hit
        // that just bounced the ball off them; neutral pegs stay exactly
        // as every peg used to behave (a permanent, point-less obstacle).
        if(peg.kind !== 'neutral'){
          peg.destroyed = true;
          state.plinkoPegPoints += peg.points;
          const bonusDisplay = document.getElementById('plinkoBonusDisplay');
          if(bonusDisplay) bonusDisplay.textContent = String(state.plinkoPegPoints);
          const burstColor = peg.kind === 'bonus' ? '#FFB800' : '#8FF2E4';
          plinkoFloatTexts.push({ x: peg.x, y: peg.y, text: `+${peg.points}`, color: burstColor, alpha: 1, vy: -0.9 });
          spawnPlinkoParticles(peg.x, peg.y, burstColor, peg.kind === 'bonus' ? 28 : 10, peg.kind === 'bonus' ? 2 : 1);
          if(peg.kind === 'bonus'){
            // A little extra kick on top of the normal bounce — reads as
            // a genuine small explosion, not just a bigger particle burst.
            ball.vx += (Math.random() - 0.5) * 500;
            ball.vy -= Math.random() * 150 + 40;
            sfxExplosion();
            triggerPlinkoShake(6);
          } else {
            sfxPegPoint();
          }
        }

        if(ball.explosive && Math.random() < 0.4) detonatePlinkoBall(ball, peg);
        if(ball.splitter && !ball.hasSplit){
          ball.hasSplit = true;
          spawned.push({ ...ball, hasSplit: true, vx: -ball.vx * 0.7 + (Math.random() - 0.5) * 200 });
          spawnPlinkoParticles(ball.x, ball.y, ball.glow, 14, 1);
        }
        break;
      }
    }

    if(ball.chaotic && now > ball.nextChaosKick){
      ball.vx += (Math.random() - 0.5) * 260;
      ball.vy += Math.random() * 140 - 40;
      ball.nextChaosKick = now + 120 + Math.random() * 140;
      spawnPlinkoParticles(ball.x, ball.y, ball.glow, 5, 0.6);
    }

    // Golden ball: a probabilistic (not guaranteed) lean toward whichever
    // edge it's already closer to — a jackpot nudge, not an autopilot
    // that always delivers the 100-point slot.
    if(ball.jackpot && ball.y > canvas.height * 0.68){
      const center = canvas.width / 2;
      const towardEdge = Math.sign(ball.x - center || (Math.random() < 0.5 ? -1 : 1));
      const leanSign = Math.random() < 0.7 ? towardEdge : -towardEdge;
      ball.vx += leanSign * 30 * dtSec * 60;
    }

    const maxSpeed = canvas.width * 1.6;
    const speed = Math.hypot(ball.vx, ball.vy);
    if(speed > maxSpeed){ const k = maxSpeed / speed; ball.vx *= k; ball.vy *= k; }

    // Fiery balls leave a small trail; every ball leaves a faint glow
    // trail so the drop still reads as fast and alive, not just a moving
    // dot — toned down substantially (2026-07-16, per feedback this made
    // the ball itself "a bit difficult to see"): lower spawn chance,
    // smaller/dimmer particles, so it's a subtle wisp instead of a cloud
    // that competes with the ball for attention.
    if(Math.random() < (ball.fiery ? 0.35 : 0.16)){
      spawnPlinkoParticles(ball.x, ball.y, ball.glow, 1, 0.16);
    }

    if(ball.y + ball.r > bounds.top) landed.push(ball);
  }

  if(spawned.length) state.plinkoBalls.push(...spawned);
  if(landed.length) landed.forEach(ball => landPlinkoBall(ball, bounds));

  updatePlinkoParticles();
  updatePlinkoFloatTexts();
}

// How long a landed ball rests, visible, in its slot before the result
// modal appears — without this, the ball used to vanish (removed from
// state.plinkoBalls, and physics stopped) the instant it landed, so
// there was no way to actually see which slot it settled in.
const PLINKO_LAND_PAUSE_MS = 1200;
let plinkoFinishTimeout = null;

function landPlinkoBall(ball, bounds){
  const slotCount = SLOT_VALUES.length;
  const slotWidth = (bounds.right - bounds.left) / slotCount;
  const slotIndex = Math.max(0, Math.min(slotCount - 1, Math.floor((ball.x - bounds.left) / slotWidth)));
  const points = SLOT_VALUES[slotIndex];
  const canvas = plinkoCanvasResizer.getCanvas();
  const settleX = bounds.left + slotWidth * (slotIndex + 0.5), settleY = canvas.height * 0.865;

  // Marked landed (physics stops simulating it) but NOT teleported to
  // the slot center — updatePlinkoBalls eases it there over the next
  // few frames (see the `ball.landed` branch there) so it reads as
  // rolling to a stop, not snapping into place. landSquash drives a
  // small squash-and-settle pulse over that same easing window.
  ball.landed = true;
  ball.settled = false;
  ball.vx = 0; ball.vy = 0;
  ball.settleX = settleX; ball.settleY = settleY;
  ball.landSquash = 1;

  const style = slotTierStyle(points);
  spawnPlinkoParticles(settleX, settleY, ball.glow, points >= 100 ? 70 : points >= 25 ? 45 : 26, points >= 100 ? 1.8 : 1.2);
  if(points >= 100) triggerPlinkoShake(9);
  sfxSlotLand(points);

  // Drives the winning slot's flash/scale-up in renderPlinkoCanvas, plus
  // a rising "+N" score text and (for a 100-point land) a warm wash
  // across the whole board — the actual "landing payoff" the rework
  // was about, on top of the particle burst/chime that already existed.
  plinkoLandFlash = { slotIndex, strength: 1, big: points >= 100 };
  plinkoFloatTexts.push({ x: settleX, y: settleY - canvas.height * 0.02, text: `+${points}`, color: style.glow, alpha: 1, vy: -1.0 });

  state.plinkoRoundResults.push({ points, slotIndex });

  // A Splitting ball can leave a second ball still in flight — only
  // pause-and-resolve once every ball from this drop has landed.
  if(state.plinkoBalls.every(b => b.landed)){
    clearTimeout(plinkoFinishTimeout);
    plinkoFinishTimeout = setTimeout(() => {
      cancelAnimationFrame(state.plinkoRoundRAF);
      state.plinkoRoundRAF = null;
      state.plinkoRoundActive = false;
      const results = state.plinkoRoundResults;
      state.plinkoBalls = [];
      document.getElementById('plinkoPlayArea').classList.add('idle');
      finishPlinkoTurn(results);
    }, PLINKO_LAND_PAUSE_MS);
  }
}

// Decorative alternating pink/blue diamond bumpers along both side
// walls of the peg field — purely cosmetic (the actual wall bounce
// physics lives in updatePlinkoBalls), matching the reference board's
// zigzag border.
function drawPlinkoSideWalls(ctx, canvas, bounds){
  const topY = canvas.height * 0.13;
  const bottomY = canvas.height * 0.79;
  const count = 14;
  const gap = (bottomY - topY) / count;
  const size = Math.max(6, canvas.width * 0.012);
  const colors = ['#FF3E9A', '#4C5FD5'];
  for(const x of [bounds.left - size * 0.7, bounds.right + size * 0.7]){
    for(let i = 0; i < count; i++){
      const y = topY + gap * (i + 0.5);
      const color = colors[i % 2];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

function renderPlinkoCanvas(){
  const canvas = plinkoCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  const shakeNow = performance.now();
  if(shakeNow < plinkoShakeUntil){
    const remaining = (plinkoShakeUntil - shakeNow) / PLINKO_SHAKE_DURATION_MS;
    const mag = plinkoShakeMag * remaining;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  const bg = ctx.createRadialGradient(canvas.width / 2, 0, 0, canvas.width / 2, canvas.height, canvas.height);
  bg.addColorStop(0, '#241F4D');
  bg.addColorStop(1, '#0A0820');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decay the landing flash once per render (called every frame the
  // round is active, same cadence as the particle/float-text updates).
  if(plinkoLandFlash.strength > 0) plinkoLandFlash.strength = Math.max(0, plinkoLandFlash.strength - 0.022);
  if(plinkoLandFlash.big && plinkoLandFlash.strength > 0){
    ctx.save();
    ctx.globalAlpha = plinkoLandFlash.strength * 0.32;
    ctx.fillStyle = '#FFD23F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const bounds = slotBounds(canvas);

  drawPlinkoSideWalls(ctx, canvas, bounds);

  // Pegs — bright cyan glow, matching the arcade-Plinko reference look.
  // Bonus pegs glow gold (worth more, explode); neutral pegs render dim
  // gray (no points, permanent — the old default look every peg used to
  // have). Destroyed pegs simply stop being drawn — the particle burst at
  // the moment of destruction carries the "impact" visual, same approach
  // Sky Slingshot's directly-hit blocks/pots already use. Pegs blown open
  // by an Exploding ball go dim and shrink while disabled, reading as
  // "temporarily gone" rather than permanently destroyed.
  const nowDraw = performance.now();
  for(const peg of state.plinkoPegs){
    if(peg.destroyed) continue;
    const disabled = nowDraw < peg.disabledUntil;
    const flashing = !disabled && nowDraw < peg.flashUntil;
    ctx.save();
    if(disabled){
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#5A5470';
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const baseColor = peg.kind === 'bonus' ? '#FFD23F' : peg.kind === 'neutral' ? '#6B6F80' : '#8FF2E4';
      const glowColor = peg.kind === 'bonus' ? '#FFB800' : peg.kind === 'neutral' ? '#4A4E5C' : '#6FE3D6';
      ctx.shadowColor = flashing ? '#ffffff' : glowColor;
      ctx.shadowBlur = flashing ? 20 : (peg.kind === 'neutral' ? 5 : 10);
      ctx.fillStyle = flashing ? '#ffffff' : baseColor;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, flashing ? peg.r * 1.6 : peg.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Point-goal board — full-height colored "pockets" (one per slot,
  // tiered by value via slotTierStyle) instead of thin divider pins +
  // plain text, with a slow idle shimmer so the board reads as inviting
  // even before a ball drops, and a bright flash + scale-up on whichever
  // slot a ball just landed in (plinkoLandFlash, set in landPlinkoBall).
  const slotCount = SLOT_VALUES.length;
  const slotWidth = (bounds.right - bounds.left) / slotCount;
  const panelTop = bounds.top;
  const panelBottom = canvas.height * 0.9;
  const panelGap = Math.max(2, slotWidth * 0.06);
  const nowShimmer = performance.now();
  for(let i = 0; i < slotCount; i++){
    const value = SLOT_VALUES[i];
    const style = slotTierStyle(value);
    const x0 = bounds.left + slotWidth * i + panelGap / 2;
    const w = slotWidth - panelGap;
    const cx = x0 + w / 2, midY = (panelTop + panelBottom) / 2;
    const shimmer = 0.5 + 0.5 * Math.sin(nowShimmer / 900 + i * 0.7);
    const flash = i === plinkoLandFlash.slotIndex ? plinkoLandFlash.strength : 0;

    ctx.save();
    ctx.translate(cx, midY);
    ctx.scale(1 + flash * 0.06, 1 + flash * 0.06);
    ctx.translate(-cx, -midY);

    const grad = ctx.createLinearGradient(0, panelTop, 0, panelBottom);
    grad.addColorStop(0, style.top);
    grad.addColorStop(1, style.bottom);
    ctx.globalAlpha = 0.5 + shimmer * 0.15 + flash * 0.35;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 8 + shimmer * 6 + flash * 26;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x0, panelTop, w, panelBottom - panelTop, Math.min(10, w * 0.18));
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = flash > 0 ? '#ffffff' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = flash > 0 ? 3 : 1.5;
    ctx.stroke();

    ctx.fillStyle = style.text;
    ctx.font = `bold ${Math.max(15, canvas.width * 0.02)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(value), cx, panelBottom - (panelBottom - panelTop) * 0.14);
    ctx.restore();
  }

  // Particles (trail + impacts + landing bursts)
  for(const p of state.plinkoParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Rising "+N" score text on a landed ball — canvas-drawn since Plinko
  // has no DOM ball layer to attach a floating element to (unlike Ball
  // Pop's showFloatingText).
  for(const t of plinkoFloatTexts){
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.alpha);
    ctx.fillStyle = t.color;
    ctx.shadowColor = t.color; ctx.shadowBlur = 10;
    ctx.font = `bold ${Math.max(20, canvas.width * 0.036)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }

  // Balls — usually one, but a Splitting ball leaves two in flight at
  // once. The highlight rotates with ball.angle (faux rolling, see
  // updatePlinkoBalls) and a brief squash-and-settle pulse (landSquash,
  // 1 at impact eased to 0) plays on landing instead of the ball just
  // snapping still — both added 2026-07-16 as part of making the drop
  // feel more physical.
  for(const ball of state.plinkoBalls){
    const squash = ball.landSquash || 0;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle || 0);
    ctx.scale(1 + squash * 0.28, 1 - squash * 0.22);
    ctx.shadowColor = ball.glow;
    ctx.shadowBlur = 20;
    const grad = ctx.createRadialGradient(-ball.r * 0.3, -ball.r * 0.3, 0, 0, 0, ball.r);
    grad.addColorStop(0, ball.colorA);
    grad.addColorStop(1, ball.colorB);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Drop-point hover preview — a translucent ghost ball at the cursor's
  // x position plus a dashed guide line down into the peg field, so the
  // teacher can see exactly where a drop will start before committing.
  if(plinkoPreviewX !== null && plinkoPreviewTypeId){
    const type = ballTypeById(plinkoPreviewTypeId);
    const previewY = canvas.height * 0.08;
    const r = canvas.width * (type.radiusPct / 100);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(plinkoPreviewX, previewY + r);
    ctx.lineTo(plinkoPreviewX, canvas.height * 0.78);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = type.glow;
    ctx.shadowBlur = 18;
    const grad = ctx.createRadialGradient(plinkoPreviewX - r * 0.3, previewY - r * 0.3, 0, plinkoPreviewX, previewY, r);
    grad.addColorStop(0, type.colorA);
    grad.addColorStop(1, type.colorB);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(plinkoPreviewX, previewY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // matches the shake ctx.save() at the top of this function
}

function startPlinkoRound(){
  state.plinkoRoundActive = true;
  const playArea = document.getElementById('plinkoPlayArea');
  playArea.classList.remove('idle');
  let lastTime = performance.now();
  function tick(now){
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    updatePlinkoBalls(dt);
    renderPlinkoCanvas();
    if(state.plinkoRoundActive){
      state.plinkoRoundRAF = requestAnimationFrame(tick);
    }
  }
  state.plinkoRoundRAF = requestAnimationFrame(tick);
}

// Cancels an in-progress drop cleanly — called when the teacher
// navigates away mid-drop, same role as cancelPopRound/cancelInvRound.
export function cancelPlinkoRound(){
  if(state.plinkoRoundRAF) cancelAnimationFrame(state.plinkoRoundRAF);
  state.plinkoRoundRAF = null;
  // Also covers navigating away during the post-land pause (see
  // landPlinkoBall/PLINKO_LAND_PAUSE_MS), before it would have fired and
  // tried to open a result modal for a turn nobody's watching anymore.
  clearTimeout(plinkoFinishTimeout);
  // Also covers navigating away mid ball-pick/drop-preview, before either
  // listener below would have fired and cleaned itself up.
  if(plinkoDropListeners){
    const picker = document.getElementById('plinkoBallPicker');
    if(picker){
      picker.removeEventListener('click', plinkoDropListeners.onClick);
      picker.removeEventListener('mousemove', plinkoDropListeners.onMove);
    }
    plinkoDropListeners = null;
  }
  plinkoPreviewX = null;
  plinkoPreviewTypeId = null;
  plinkoLandFlash = { slotIndex: -1, strength: 0, big: false };
  plinkoFloatTexts = [];
  if(state.plinkoRoundActive || state.plinkoBalls.length){
    state.plinkoRoundActive = false;
    state.plinkoBalls = [];
    state.plinkoRoundResults = [];
    state.plinkoPegPoints = 0;
    state.plinkoParticles = [];
    const playArea = document.getElementById('plinkoPlayArea');
    if(playArea) playArea.classList.add('idle');
    const picker = document.getElementById('plinkoBallPicker');
    if(picker) picker.classList.add('hidden');
    const canvas = plinkoCanvasResizer.getCanvas();
    if(canvas){ const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    const beginBtn = document.getElementById('plinkoBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

/* =========================================================
   TURN RESOLUTION
========================================================= */
function showPlinkoResult(){
  return showTurnResultModal('plinkoNextTeamBtn', { teams: state.plinkoTeams, currentTeamIndex: state.plinkoCurrentTeam });
}

function finishPlinkoTurn(results){
  const team = state.plinkoTeams[state.plinkoCurrentTeam];
  const pegPoints = state.plinkoPegPoints;
  const total = results.reduce((sum, r) => sum + r.points, 0) + pegPoints;
  team.total += total;
  state.plinkoTurnsPlayed++;
  renderPlinkoScoreboard();

  const newlyUnlocked = BALL_TYPES.find(b => b.unlockAtTurn === state.plinkoTurnsPlayed && !state.plinkoUnlockedBalls.includes(b.id));
  if(newlyUnlocked) state.plinkoUnlockedBalls.push(newlyUnlocked.id);

  showPlinkoResult().then(() => {
    if(state.plinkoTurnsPlayed >= PLINKO_QUESTIONS.length){
      endPlinkoGame();
    } else {
      state.plinkoCurrentTeam = (state.plinkoCurrentTeam + 1) % state.plinkoTeams.length;
      renderPlinkoScoreboard();
      renderPlinkoTurnBanner();
      document.getElementById('plinkoQDisplay').textContent = `${state.plinkoTurnsPlayed + 1}/${PLINKO_QUESTIONS.length}`;
      document.getElementById('plinkoBeginTurnBtn').disabled = false;
    }
  });
}

function endPlinkoGame(){
  const winnerText = finishTeamGame({ prefix: 'plinko', teams: state.plinkoTeams, setPlayAreaIdle: true });
  document.getElementById('plinkoTurnBanner').innerHTML = `All done — ${winnerText}`;
}

wireTeamManagementButtons({
  prefix: 'plinko',
  getTeams: () => state.plinkoTeams,
  renderScoreboard: renderPlinkoScoreboard,
  cancelRound: cancelPlinkoRound,
  afterPlayAgain: renderPlinkoBallLegend
});

document.getElementById('plinkoBackBtn').addEventListener('click', () => goToStage(9));
document.getElementById('qsNextStageBtn').addEventListener('click', () => goToStage(10));
document.getElementById('plinkoNextStageBtn').addEventListener('click', () => goToStage(11));

// Called by goToStage(10) so pegs are laid out correctly even if the
// browser window was resized while the teacher was on another stage.
export function ensurePlinkoLayout(){
  if(state.plinkoTeams.length > 0) resizePlinkoCanvas();
}
