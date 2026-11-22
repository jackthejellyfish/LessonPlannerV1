import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, showQuestionModal } from '../utils.js';
import { beep, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { WHEEL_QUESTIONS, WHEEL_COLORS } from '../content/stage8-spinwheel.js';
import { createCanvasResizer } from '../canvasGame.js';
import { createBackdrop, drawGlow } from '../canvasGlow.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { createShakeState, triggerShake, applyShake } from '../canvasEffects.js';
import { particleCount } from '../quality.js';

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
const SPIN_DURATION_MS = 4600;
const SPIN_EXTRA_TURNS = 6;

/* ---- The fun bits (added 2026-11-22: "add some fun dynamic element") ----
   - Pegs on the rim and a flapper pointer that clicks against them and
     wobbles, so the wheel feels physical as it slows down.
   - A suspense finish: the wheel creeps over the line into the next
     slice, hangs there, then rocks back onto its real slice.
   - Two BONUS slices (a gold star) per game. Landing on one rolls a
     twist before the question: DOUBLE or TRIPLE points, or STEAL (a
     right answer takes the slice's points from the team in the lead).
     The twist only pays out on a correct answer, like the slice itself. */
const BONUS_SLICES = 2;
const OVERSHOOT = 0.62;        // how far past its slice the wheel creeps, in slices
const SETTLE_SHARE = 0.2;      // the last 20% of the spin is the rock back
const TWISTS = [
  { id: 'double', label: 'DOUBLE POINTS', ask: 'Double points!', color: '#49D6A0' },
  { id: 'triple', label: 'TRIPLE POINTS', ask: 'Triple points!', color: '#FFD23F' },
  { id: 'steal', label: 'STEAL!', ask: 'Steal points from the leader!', color: '#FF6B8B' }
];

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
  state.wheelTeams = readTeamsFromSetup('wheel', wheelRowColors);
  state.wheelCurrentTeam = 0;
  state.wheelTurnsPlayed = 0;
  state.wheelQuestionOrder = shuffle(WHEEL_QUESTIONS.map((_, i) => i));
  state.wheelUsedSegments = new Array(SEG_COUNT).fill(false);
  // Two bonus slices, never the first question's (the first spin is a
  // plain one, so the class learns the game before the twists turn up).
  bonusSlices = new Set(shuffle(state.wheelQuestionOrder.slice(1)).slice(0, BONUS_SLICES));
  currentWheelAngle = 0;
  flap = 0; flapVel = 0; twistBanner = null;

  showGameScreen('wheel');
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
  renderTurnBanner('wheel', state.wheelTeams[state.wheelCurrentTeam], state.wheelTurnsPlayed + 1, SEG_COUNT, 'spin');
}

/* =========================================================
   AUDIO
========================================================= */
function sfxTick(){ if(state.muted) return; beep(700 + Math.random() * 80, 0.03, 'square', 0.08); }
function sfxTwistRoll(){ if(state.muted) return; beep(1040, 0.04, 'triangle', 0.08); }
function sfxTwistLand(){ if(state.muted) return; sfxRisingChime([660, 880, 1100, 1320, 1760], { duration: 0.12, volume: 0.15, stagger: 0.06 }); }
function sfxLand(points){
  if(state.muted) return;
  const notes = points >= 25 ? [660, 880, 1100, 1320] : points >= 15 ? [660, 880, 1046] : [520, 660];
  notes.forEach((f, i) => beep(f, 0.16, 'triangle', 0.2, i * 0.07));
}

/* =========================================================
   PARTICLES (confetti burst on landing)
========================================================= */
function spawnWheelConfetti(x, y, count){
  count = particleCount(count); // lite mode: fewer per burst (js/quality.js)
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
// Full resolution, unlike every other game. The shared cap exists for
// soft content where an upscale is invisible; this wheel is fine arcs
// and crisp numbers, and capping it was exactly what made the stage
// look blurry next to the others. It can afford the pixels because it
// only renders while a spin is actually animating — there is no
// continuous loop here — and because the wheel face itself is
// pre-rendered once and then rotated as a single blit (see
// getWheelFace), so a spinning frame costs one drawImage rather than
// ten arc fills plus ten text draws.
const wheelCanvasResizer = createCanvasResizer('wheelCanvas', 'wheelPlayArea', null, { maxBufferWidth: 2200 });
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
let bonusSlices = new Set();
// The flapper: its angle (radians, + = tip swung left) and spin speed.
// A peg passing the top kicks it; a spring pulls it back.
let flap = 0, flapVel = 0;
// The twist roll drawn over the wheel: { twist, settled, at }.
let twistBanner = null;
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

// The spin's shape: ease out to a point just PAST the target slice
// (over the line into the next one), hang, then rock back onto the target.
function spinProgress(t, start, target){
  const over = target + OVERSHOOT * SEG_ANGLE;
  const split = 1 - SETTLE_SHARE;
  if(t < split) return start + (over - start) * easeOutCubic(t / split);
  const u = (t - split) / SETTLE_SHARE;
  // A short hang, then an ease-in-out fall back.
  const back = u < 0.25 ? 0 : (1 - Math.cos(Math.PI * (u - 0.25) / 0.75)) / 2;
  return over - (over - target) * back;
}

// Which peg is under the pointer: pegs sit on slice boundaries, which
// pass the top when the angle is a half slice past a whole one.
function pegIndex(angle){ return Math.floor(angle / SEG_ANGLE + 0.5); }

function kickFlapper(direction){
  // The peg drags the tip the way the rim is moving (right when the
  // wheel turns forward, which swings the tip to negative angles).
  flapVel += -direction * 0.55;
}
function stepFlapper(){
  // A stiff spring with damping, stepped per rendered frame.
  flapVel += -flap * 0.28;
  flapVel *= 0.72;
  flap = Math.max(-0.6, Math.min(0.6, flap + flapVel));
}

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
    let prevPeg = pegIndex(startAngle);
    state.wheelRoundActive = true;

    function frame(now){
      const t = Math.min(1, (now - startTime) / SPIN_DURATION_MS);
      currentWheelAngle = spinProgress(t, startAngle, targetAngle);

      // Every peg that passed the pointer since the last frame clicks
      // and kicks the flapper (forwards, or backwards on the rock back).
      const peg = pegIndex(currentWheelAngle);
      if(peg !== prevPeg){
        sfxTick();
        kickFlapper(Math.sign(peg - prevPeg));
        prevPeg = peg;
      }
      stepFlapper();

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
    stepFlapper();
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

// Rolls the twist on a bonus slice: the banner flicks through the
// twists, slowing down, and settles on one. STEAL needs another team
// with points to steal from, so it's left out until one has some.
function rollTwist(){
  const others = state.wheelTeams.filter((_, i) => i !== state.wheelCurrentTeam);
  const canSteal = others.some(t => t.total > 0);
  const pool = TWISTS.filter(t => t.id !== 'steal' || canSteal);
  const result = pool[Math.floor(Math.random() * pool.length)];
  return new Promise(resolve => {
    const start = performance.now();
    const ROLL_MS = 1500, HOLD_MS = 900;
    let shown = Math.floor(Math.random() * pool.length);
    let nextFlipAt = start;
    function frame(now){
      const el = now - start;
      if(el < ROLL_MS){
        if(now >= nextFlipAt){
          shown = (shown + 1) % pool.length;
          sfxTwistRoll();
          // Flicks slow down as the roll runs out.
          nextFlipAt = now + 60 + 220 * Math.pow(el / ROLL_MS, 2);
        }
        twistBanner = { twist: pool[shown], settled: false, at: now };
      } else if(!twistBanner || !twistBanner.settled){
        twistBanner = { twist: result, settled: true, at: now };
        sfxTwistLand();
        const canvas = wheelCanvasResizer.getCanvas();
        spawnWheelConfetti(canvas.width / 2, canvas.height / 2, 30);
        triggerShake(wheelShake, 5);
      }
      stepFlapper();
      updateWheelParticles();
      renderWheelCanvas();
      if(el < ROLL_MS + HOLD_MS){
        state.wheelRoundRAF = requestAnimationFrame(frame);
      } else {
        state.wheelRoundRAF = null;
        resolve(result);
      }
    }
    state.wheelRoundRAF = requestAnimationFrame(frame);
  });
}

export function cancelWheelRound(){
  if(state.wheelRoundRAF) cancelAnimationFrame(state.wheelRoundRAF);
  state.wheelRoundRAF = null;
  state.wheelRoundActive = false;
  state.wheelParticles = [];
  twistBanner = null; flap = 0; flapVel = 0;
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
  const twist = bonusSlices.has(qIndex) ? await rollTwist() : null;
  const prompt = twist ? `${twist.ask} ${q.prompt}` : q.prompt;
  const correct = await showQuestionModal(prompt, q.answer, { showFollowup: true });
  twistBanner = null;
  renderWheelCanvas();
  finishWheelTurn(qIndex, correct ? q.points : 0, twist);
}

function finishWheelTurn(qIndex, points, twist = null){
  state.wheelUsedSegments[qIndex] = true;
  const team = state.wheelTeams[state.wheelCurrentTeam];
  let label = `+${points}`;
  if(points > 0 && twist && twist.id === 'steal'){
    // From the team in the lead (not counting this one), up to what it has.
    const victim = state.wheelTeams
      .filter(t => t !== team)
      .reduce((best, t) => (!best || t.total > best.total ? t : best), null);
    const taken = victim ? Math.min(points, victim.total) : 0;
    if(victim) victim.total -= taken;
    points += taken;
    label = taken > 0 ? `+${points} (stole ${taken})` : `+${points}`;
  } else if(points > 0 && twist){
    const mult = twist.id === 'triple' ? 3 : 2;
    points *= mult;
    label = `+${points} (\u00d7${mult})`;
  }
  team.total += points;
  state.wheelTurnsPlayed++;
  document.getElementById('wheelLastSpinDisplay').textContent = label;
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
// The arena backdrop never changes between resizes, so it's rasterized
// once and blitted — same treatment as Fruit Ninja's (see
// js/canvasGlow.js). The blit is opaque and full-canvas, so it also
// replaces the frame's clearRect.
const renderWheelBackground = createBackdrop((ctx, w, h) => {
  const bg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.12, w / 2, h / 2, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#2E2350');
  bg.addColorStop(1, '#12102A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
});

/* ---- The wheel face, pre-rendered ----
   The face is identical on every frame of a spin; only its ANGLE
   changes. Drawing ten filled arcs and ten pieces of rotated text every
   frame — at full resolution — would be the most expensive thing in the
   app. Rendering it once into an offscreen canvas and then rotating a
   single drawImage costs a fraction of that, and it's what makes full
   resolution affordable here at all.

   Cached by radius AND by the point values, so it rebuilds on a resize
   or a lesson switch but never mid-spin. */
let wheelFace = null;
let wheelFaceKey = '';

function getWheelFace(radius){
  const pad = Math.ceil(radius * 0.06) + 4;          // room for the rim stroke
  const size = Math.ceil(radius * 2) + pad * 2;
  const key = `${size}|${WHEEL_QUESTIONS.map(q => q.points).join(',')}|${[...bonusSlices].join(',')}`;
  if(wheelFace && wheelFaceKey === key) return wheelFace;

  const face = wheelFace && wheelFace.width === size ? wheelFace : document.createElement('canvas');
  face.width = face.height = size;
  const fx = face.getContext('2d');
  fx.clearRect(0, 0, size, size);
  fx.translate(size / 2, size / 2);

  for(let i = 0; i < SEG_COUNT; i++){
    const center = -Math.PI / 2 + i * SEG_ANGLE;
    const startA = center - SEG_ANGLE / 2, endA = center + SEG_ANGLE / 2;
    fx.beginPath();
    fx.moveTo(0, 0);
    fx.arc(0, 0, radius, startA, endA);
    fx.closePath();
    fx.fillStyle = WHEEL_COLORS[i];
    fx.fill();
    fx.strokeStyle = 'rgba(255,255,255,0.8)';
    fx.lineWidth = Math.max(2, radius * 0.012);
    fx.stroke();

    // Bigger numbers than before, with a dark outline. The point value
    // is the only thing a class actually reads off this wheel, and at
    // the old size against six different segment colours it was the
    // weakest element on screen.
    fx.save();
    fx.rotate(center);
    fx.translate(radius * 0.63, 0);
    fx.rotate(Math.PI / 2);
    fx.font = `800 ${Math.max(15, radius * 0.21)}px ${'Bricolage Grotesque, sans-serif'}`;
    fx.textAlign = 'center';
    fx.textBaseline = 'middle';
    fx.lineJoin = 'round';
    fx.lineWidth = Math.max(3, radius * 0.035);
    fx.strokeStyle = 'rgba(0,0,0,0.45)';
    fx.strokeText(String(WHEEL_QUESTIONS[i].points), 0, 0);
    fx.fillStyle = '#ffffff';
    fx.fillText(String(WHEEL_QUESTIONS[i].points), 0, 0);
    // A bonus slice carries a gold star nearer the hub.
    if(bonusSlices.has(i)){
      fx.translate(0, radius * 0.27);
      drawStar(fx, radius * 0.085, '#FFD23F', 'rgba(0,0,0,0.45)', Math.max(2, radius * 0.014));
    }
    fx.restore();
  }

  // Pegs on every slice boundary, just inside the rim.
  fx.fillStyle = '#FFF4D6';
  fx.strokeStyle = 'rgba(0,0,0,0.3)';
  fx.lineWidth = Math.max(1, radius * 0.008);
  for(let i = 0; i < SEG_COUNT; i++){
    const a = -Math.PI / 2 + (i - 0.5) * SEG_ANGLE;
    fx.beginPath();
    fx.arc(Math.cos(a) * radius * 0.94, Math.sin(a) * radius * 0.94, Math.max(3, radius * 0.028), 0, Math.PI * 2);
    fx.fill(); fx.stroke();
  }

  // Rim, drawn into the face so it rotates with the wheel's own seams.
  fx.strokeStyle = 'rgba(255,255,255,0.9)';
  fx.lineWidth = Math.max(3, radius * 0.035);
  fx.beginPath(); fx.arc(0, 0, radius, 0, Math.PI * 2); fx.stroke();

  // Hub
  fx.beginPath(); fx.arc(0, 0, radius * 0.14, 0, Math.PI * 2);
  fx.fillStyle = '#ffffff'; fx.fill();
  fx.strokeStyle = 'rgba(0,0,0,0.18)';
  fx.lineWidth = Math.max(2, radius * 0.015); fx.stroke();

  wheelFace = face;
  wheelFaceKey = key;
  return face;
}

function drawStar(ctx, r, fill, stroke, lineWidth){
  ctx.beginPath();
  for(let k = 0; k < 10; k++){
    const rr = k % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + k * Math.PI / 5;
    if(k) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}

// The twist banner across the middle of the wheel.
function drawTwistBanner(ctx, cx, cy, radius, now){
  const { twist, settled, at } = twistBanner;
  const pop = settled ? 1 + 0.25 * Math.max(0, 1 - (now - at) / 250) : 1;
  const w = radius * 1.9, h = radius * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pop, pop);
  ctx.fillStyle = '#16132F';
  ctx.strokeStyle = twist.color;
  ctx.lineWidth = Math.max(3, radius * 0.025);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFF4D6';
  ctx.font = `800 ${radius * 0.075}px Bricolage Grotesque, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('BONUS!', 0, -h * 0.26);
  ctx.fillStyle = twist.color;
  ctx.font = `800 ${radius * 0.15}px Bricolage Grotesque, sans-serif`;
  ctx.fillText(twist.label, 0, h * 0.14);
  ctx.restore();
}

function renderWheelCanvas(){
  const canvas = wheelCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = canvas.getContext('2d');

  // Outer save/restore + applyShake wraps the ENTIRE draw (background,
  // wheel, rim, pointer, confetti) so a landing shake offsets everything
  // together — same pattern every other canvas game's own applyShake
  // call already uses.
  ctx.save();
  applyShake(ctx, wheelShake);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.42;

  renderWheelBackground(ctx, canvas);

  if(landingFlash > 0) landingFlash = Math.max(0, landingFlash - 0.025);

  // Idle shimmer + landing flash — a soft glow behind the wheel. Was
  // shadowBlur on a filled circle, which re-blurred a disc the size of
  // the whole wheel every frame; it's a cached sprite blit now.
  const shimmer = 0.5 + 0.5 * Math.sin(performance.now() / 600);
  drawGlow(ctx, cx, cy, radius * (1.3 + landingFlash * 0.35), '#FFD23F',
    0.3 + shimmer * 0.14 + landingFlash * 0.55, 1.5);

  // One rotated blit instead of twenty draw calls.
  const face = getWheelFace(radius);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentWheelAngle);
  ctx.drawImage(face, -face.width / 2, -face.height / 2);
  ctx.restore();

  // Pointer — fixed at the top, outside the wheel's own rotation. Drawn
  // larger and with a light outline so it reads clearly against
  // whichever of the ten segment colours happens to be underneath it.
  // It hangs from a pivot at its top and flaps as pegs hit it.
  ctx.save();
  const pw = radius * 0.095, ptop = cy - radius - radius * 0.1;
  ctx.translate(cx, ptop);
  ctx.rotate(flap);
  ctx.translate(-cx, -ptop);
  ctx.beginPath();
  ctx.moveTo(cx - pw, ptop);
  ctx.lineTo(cx + pw, ptop);
  ctx.lineTo(cx, cy - radius + radius * 0.1);
  ctx.closePath();
  ctx.fillStyle = '#2A2238';
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, radius * 0.022);
  ctx.strokeStyle = '#FFF4D6';
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, ptop, pw * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF4D6'; ctx.fill();
  ctx.restore();

  if(twistBanner) drawTwistBanner(ctx, cx, cy, radius, performance.now());

  // Confetti. No per-particle shadow: a landing can put dozens on
  // screen in the one frame that can least afford them.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(const p of state.wheelParticles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  ctx.restore(); // closes the outer save()/applyShake() from the top of this function
}

// For the automated tests only: make these slices the bonus ones.
export function debugSetWheelBonus(indices){ bonusSlices = new Set(indices); wheelFaceKey = ''; renderWheelCanvas(); }

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
