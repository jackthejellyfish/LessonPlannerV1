import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, beep, sfxIncorrect, sfxTimeUp } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { POP_QUESTIONS } from '../content/stage6-ballpop.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';

/* =========================================================
   STAGE 6 — BALL POP CHALLENGE
   Teams take turns: answer a question, then pop as many balls
   as possible in 10 seconds. Only one ball lives on screen at
   a time — popping it scores a point, bursts particles, and
   immediately spawns a new one elsewhere. The round itself is
   a plain requestAnimationFrame loop (like the timers in
   Controlled/Guided practice), not a Promise, specifically so
   goToStage() can cancel it cleanly if the teacher navigates
   away mid-round.
========================================================= */
export const POP_BALL_COLORS = ["#FF6B6B", "#4C5FD5", "#3DB88D", "#F2B705", "#B266FF"];
export const POP_ROUND_SECONDS = 10;

// Colors chosen per team row in the setup screen (index-aligned with the
// input rows) — persists across "+ Add team" re-renders and survives
// until "Start game" reads it into state.popTeams.
let popRowColors = [];

export function renderPopTeamInputs(count){
  renderTeamSetupRows('popTeamInputs', 'popAddTeamBtn', count, popRowColors, renderPopTeamInputs);
}
renderPopTeamInputs(2);

wireAddTeamButton('popTeamInputs', 'popAddTeamBtn', renderPopTeamInputs);

document.getElementById('popStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#popTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.popTeams = names.map((name, i) => ({ name, color: popRowColors[i], total: 0 }));
  state.popCurrentTeam = 0;
  state.popTurnsPlayed = 0;
  state.popQuestionOrder = shuffle(POP_QUESTIONS.map((_, i) => i));

  document.getElementById('popSetup').classList.add('hidden');
  document.getElementById('popGame').classList.remove('hidden');
  document.getElementById('popGameOverBanner').classList.add('hidden');
  resizePopCanvas();
  startPopParticleLoop();
  renderPopScoreboard();
  renderPopTurnBanner();
});

function renderPopScoreboard(){
  renderTeamScoreboard('popTeamList', state.popTeams, state.popCurrentTeam);
}

function renderPopTurnBanner(){
  document.getElementById('popTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.popTeams[state.popCurrentTeam].name)}</strong>'s turn — question ${state.popTurnsPlayed + 1} of ${POP_QUESTIONS.length}`;
}

function askPopQuestion(){
  const qIndex = state.popQuestionOrder[state.popTurnsPlayed];
  const q = POP_QUESTIONS[qIndex];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('popBeginTurnBtn').addEventListener('click', beginPopTurn);

async function beginPopTurn(){
  document.getElementById('popBeginTurnBtn').disabled = true;
  await askPopQuestion();
  startPopRound();
}

// A quick rising-pitch blip for each pop — pitch climbs slightly with
// streak length so a fast run of pops sounds like it's "climbing".
function sfxPop(streak){
  if(state.muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  const base = 500 + Math.min(streak, 10) * 25;
  osc.frequency.setValueAtTime(base, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(base * 1.8, ctx.currentTime + 0.08);
  gain.gain.value = 0.18;
  osc.connect(gain).connect(ctx.destination);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// A boom (filtered noise burst, same technique as Plinko's exploding
// ball) layered under a bright rising fanfare — for the special ball's
// mega explosion specifically, distinct from every other pop sound.
function sfxMegaExplosion(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const duration = 0.35;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 1800;
  const gain = ctx.createGain(); gain.gain.value = 0.32;
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
  [660, 880, 1100, 1320].forEach((f, i) => beep(f, 0.2, 'triangle', 0.22, i * 0.07));
}

// A quick sparkly ascending arpeggio for gem pickups — distinct from
// the single-note pop, since a gem is worth 3x and should feel like it.
function sfxGem(){
  if(state.muted) return;
  [880, 1108, 1318, 1568].forEach((f, i) => beep(f, 0.14, 'triangle', 0.16, i * 0.06));
}

// A rising "power surge" sweep, distinct from every other ball's sound —
// this one announces a whole WINDOW of doubled scoring starting, not a
// single point award, so it's given more weight than a normal pop/gem chime.
function sfxMultiplier(){
  if(state.muted) return;
  [520, 660, 830, 1046, 1318].forEach((f, i) => beep(f, 0.1, 'sawtooth', 0.14, i * 0.045));
}

// Expanding ring fired from the click point — colored to match the
// outcome (ball color for a correct pop, red for a bad-ball miss).
function spawnShockwave(container, xPct, yPct, color){
  const ring = document.createElement('div');
  ring.className = 'pop-shockwave';
  ring.style.left = xPct + '%';
  ring.style.top = yPct + '%';
  ring.style.borderColor = color;
  container.appendChild(ring);
  requestAnimationFrame(() => {
    ring.style.transform = 'translate(-50%,-50%) scale(2.6)';
    ring.style.opacity = '0';
  });
  setTimeout(() => ring.remove(), 470);
}

// A gem's signature effect — small sparkle glyphs flying outward from
// the pop point and fading, layered on top of the usual shockwave/
// particles/text every ball type shares. Added 2026-07-16 so a gem pop
// has its own distinct "personality" instead of just being a bigger
// version of a normal pop.
function spawnPopSparkles(container, xPct, yPct, color, count = 6){
  for(let i = 0; i < count; i++){
    const sparkle = document.createElement('div');
    sparkle.className = 'pop-sparkle';
    sparkle.style.left = xPct + '%';
    sparkle.style.top = yPct + '%';
    sparkle.style.setProperty('--spark-color', color);
    container.appendChild(sparkle);

    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.6 - 0.3);
    const dist = 28 + Math.random() * 24;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
    requestAnimationFrame(() => {
      sparkle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${120 + Math.random() * 180}deg)`;
      sparkle.style.opacity = '0';
    });
    setTimeout(() => sparkle.remove(), 600);
  }
}

// Floating "+1" / "−1" combat-text, rising and fading at the click point.
function showFloatingText(container, xPct, yPct, text, color, extraClass = ''){
  const el = document.createElement('div');
  el.className = 'pop-float-text' + (extraClass ? ' ' + extraClass : '');
  el.textContent = text;
  el.style.left = xPct + '%';
  el.style.top = yPct + '%';
  el.style.color = color;
  container.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = 'translate(-50%, -160%) scale(1.3)';
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 700);
}

/* =========================================================
   PARTICLE SYSTEM (canvas-based)
   Ported from the reference "Tap Game": instead of animating
   individual DOM elements with CSS transitions, particles are
   plain data objects with real physics (gravity, drag, decay)
   updated every frame and painted onto a <canvas> with glow.
   This is a genuinely different technique from the CSS-based
   .particle bursts used elsewhere on this page — canvas suits
   "lots of small moving things" far better, since drawing 40
   circles costs one clear+loop, not 40 separate DOM nodes each
   carrying their own animation.
========================================================= */
const popCanvasResizer = createCanvasResizer('popParticleCanvas', 'popPlayArea');
export function resizePopCanvas(){ popCanvasResizer.resize(); }

function spawnPopParticles(xPx, yPx, count = 40, speedMult = 1, sizeMult = 1){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 12 + 2.5) * speedMult;
    const hue = Math.floor(Math.random() * 360);
    state.popParticles.push({
      x: xPx, y: yPx,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5 * speedMult,
      alpha: 1,
      decay: Math.random() * 0.016 + 0.01,
      size: (Math.random() * 10 + 3) * sizeMult,
      color: `hsl(${hue}, 100%, ${58 + Math.floor(Math.random() * 18)}%)`
    });
  }
}

// How quickly each ball eases toward full size/opacity per frame —
// same technique as the reference game's `ballScale += (1-ballScale)*spd`.
// Higher = snappier settle; lower = slower, more floaty growth.
const POP_BALL_EASE_SPEED = 0.18;

// Chance, each time a normal ball is about to spawn, that a special
// golden ball appears instead — capped at once per round regardless of
// how many times the dice gets rolled (see popSpecialUsedThisRound).
const POP_SPECIAL_CHANCE = 0.18;
const POP_SPECIAL_COLOR = "#FFD23F";

// Bombs spawn independently of the normal ball cycle — 1 or 2 per
// round, at random moments, each ticking down for 3 seconds before
// vanishing on its own if nobody pops it.
const POP_BOMB_FUSE_MS = 3000;
const POP_BOMB_COLOR = "#E4574B";
const POP_BOMB_MIN_GAP_MS = 1400; // minimum time between two bombs spawning in the same round

// Gems: tiny, high-value, fast-expiring bonus balls — exactly 3 per
// round, each worth 3 points, gone after 2 seconds if not popped.
const POP_GEM_COUNT = 3;
const POP_GEM_FUSE_MS = 2000;
const POP_GEM_POINTS = 3;
const POP_GEM_COLOR = "#B266FF";
const POP_GEM_MIN_GAP_MS = 1600;

// Multiplier ball (new, 2026-07-16): same independent-schedule
// architecture as bombs/gems, but only ONE per round — popping it
// doubles EVERY point value (including a bomb's −1) for the next
// POP_MULTIPLIER_DURATION_MS, so it's a single high-stakes moment
// rather than a routine pickup. "Every score doubles, no exceptions"
// was chosen over "only normal pops double" for a simple, memorable
// rule a room full of students can track by ear ("double points!").
const POP_MULTI_COUNT = 1;
const POP_MULTI_FUSE_MS = 2600;
const POP_MULTI_COLOR = "#3EC1FF";
const POP_MULTIPLIER_DURATION_MS = 4000;

function popMultiplierActive(){
  return performance.now() < state.popMultiplierUntil;
}

function updatePopBallAnims(){
  for(const anim of state.popBallAnims){
    anim.scale += (1 - anim.scale) * POP_BALL_EASE_SPEED;
    anim.alpha += (1 - anim.alpha) * POP_BALL_EASE_SPEED;
    anim.el.style.transform = `translate(-50%,-50%) scale(${anim.scale})`;
    anim.el.style.opacity = anim.alpha;
  }
}

function updatePopParticles(){
  for(const p of state.popParticles){
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;      // gravity — a constant downward pull each frame
    p.vx *= 0.983;    // drag — horizontal speed bleeds off gradually
    p.alpha -= p.decay;
    p.size *= 0.974;  // gentle continuous shrink
  }
  state.popParticles = state.popParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

function renderPopCanvas(){
  const canvas = popCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Animated background: slow-floating bokeh blobs — large,
  // semi-transparent, coloured circles that give the canvas visual
  // depth without competing with the actual game content. Seeded from
  // a fixed-length array so they're consistent within a round.
  if(!state.popBgBlobs || state.popBgBlobs.length === 0){
    state.popBgBlobs = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      r: 0.08 + Math.random() * 0.12,
      vx: (Math.random() - 0.5) * 0.00018,
      vy: (Math.random() - 0.5) * 0.00012,
      color: ['rgba(178,102,255,', 'rgba(49,230,224,', 'rgba(255,210,63,', 'rgba(255,107,107,'][i % 4],
      phase: Math.random() * Math.PI * 2
    }));
  }
  for(const b of state.popBgBlobs){
    b.x += b.vx; b.y += b.vy;
    if(b.x < -b.r) b.x = 1 + b.r;
    if(b.x > 1 + b.r) b.x = -b.r;
    if(b.y < -b.r) b.y = 1 + b.r;
    if(b.y > 1 + b.r) b.y = -b.r;
    const alpha = 0.06 + 0.04 * Math.sin(Date.now() / 1800 + b.phase);
    const x = b.x * canvas.width, y = b.y * canvas.height, r = b.r * canvas.width;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, b.color + alpha + ')');
    grad.addColorStop(1, b.color + '0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Pulsing glow ring behind every live ball — same idea as the
  // reference game's canvas-drawn glow (shadowBlur + a sine pulse),
  // rather than a CSS drop-shadow animation. Works for any number of
  // balls at once, which is what the 4-ball swarm needs. Bombs and
  // gems pulse noticeably faster than normal balls — speed itself
  // signals "this one's on a clock".
  for(const anim of state.popBallAnims){
    if(anim.alpha <= 0.01) continue;
    const xPx = (anim.xPct / 100) * canvas.width;
    const yPx = (anim.yPct / 100) * canvas.height;

    // Each factor matches that ball type's real CSS width (radius =
    // half of it) — deliberately derived from the actual size rather
    // than guessed, since a mismatch here is exactly what caused the
    // gem's ring-too-big misclick bug earlier.
    let radiusFactor = 0.055;               // normal ball: 11% wide
    if(anim.special) radiusFactor = 0.045;   // special ball: 9% wide
    if(anim.swarm) radiusFactor = 0.04;      // swarm ball: 8% wide
    if(anim.gem) radiusFactor = 0.025;       // gem: 5% wide
    if(anim.bomb) radiusFactor = 0.03;       // bomb: 6% wide
    if(anim.multi) radiusFactor = 0.035;     // multiplier ball: 7% wide
    const radius = canvas.width * radiusFactor * anim.scale;
    const ringPadding = (anim.gem || anim.special || anim.swarm || anim.multi) ? 1.5 : 5;

    const pulsePeriod = (anim.bomb || anim.gem) ? 120 : 220;
    const glowPulse = 0.7 + 0.3 * Math.sin(Date.now() / pulsePeriod);

    ctx.save();
    ctx.globalAlpha = anim.alpha * glowPulse;
    ctx.shadowColor = anim.color;
    ctx.shadowBlur = anim.special ? 20 : (anim.gem || anim.swarm || anim.multi ? 16 : 26);
    ctx.strokeStyle = anim.color;
    ctx.lineWidth = (anim.gem || anim.special || anim.swarm || anim.multi) ? 2 : 3;
    ctx.beginPath();
    ctx.arc(xPx, yPx, radius + ringPadding, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for(const p of state.popParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function startPopParticleLoop(){
  if(state.popParticleRAF) return; // already running
  function frame(){
    updatePopBallAnims();
    updatePopParticles();
    renderPopCanvas();
    state.popParticleRAF = requestAnimationFrame(frame);
  }
  state.popParticleRAF = requestAnimationFrame(frame);
}

export function stopPopParticleLoop(){
  if(state.popParticleRAF) cancelAnimationFrame(state.popParticleRAF);
  state.popParticleRAF = null;
  state.popParticles = [];
  state.popBallAnims = [];
  clearAllBombs();
  clearAllGems();
  const canvas = popCanvasResizer.getCanvas();
  if(canvas){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Builds one ball element + registers its animation entry. Doesn't wire
// up a click handler itself — callers do that, since normal balls,
// the special ball, and the 4-ball swarm each need different behavior
// when clicked.
// Picks a random spot inside the play area that isn't too close to
// anything already on screen (other balls, the special ball, or a
// live bomb) — plain rejection sampling: try a few random spots, keep
// the first one that clears the minimum distance from everything in
// popBallAnims, or just fall back to the last attempt if unlucky.
function getNonCollidingPosition(minDistancePct = 18){
  for(let attempt = 0; attempt < 20; attempt++){
    const xPct = 10 + Math.random() * 80;
    const yPct = 12 + Math.random() * 76;
    const collides = state.popBallAnims.some(a => {
      const dx = a.xPct - xPct;
      const dy = (a.yPct - yPct) * (4 / 3); // rough correction for the 4:3 play area
      return Math.sqrt(dx * dx + dy * dy) < minDistancePct;
    });
    if(!collides) return { xPct, yPct };
  }
  return { xPct: 10 + Math.random() * 80, yPct: 12 + Math.random() * 76 };
}

// Darkens (negative percent) or lightens (positive) a hex color —
// used to give the ball a subtle shaded edge instead of a bright
// balloon-style highlight.
function shadeColor(hex, percent){
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function createPopBall({ special = false, swarm = false, xPct = null, yPct = null } = {}){
  const ballLayer = document.getElementById('popBallLayer');

  const ball = document.createElement('button');
  ball.className = 'pop-ball' + (special ? ' special' : '') + (swarm ? ' swarm' : '');
  ball.type = 'button';

  // A specific position is passed in when spawning several balls at
  // once (see getSwarmPositions) so they can't land on top of each
  // other — otherwise, find a spot that doesn't collide with anything
  // currently on screen (including any live bomb).
  const pos = (xPct !== null && yPct !== null) ? { xPct, yPct } : getNonCollidingPosition();
  const finalX = pos.xPct;
  const finalY = pos.yPct;
  ball.style.left = finalX + '%';
  ball.style.top = finalY + '%';

  const color = special
    ? POP_SPECIAL_COLOR
    : POP_BALL_COLORS[Math.floor(Math.random() * POP_BALL_COLORS.length)];

  // A light two-stop gradient for a touch of depth without the heavy
  // glossy-bevel "balloon" look — the glow ring (drawn on canvas, see
  // renderPopCanvas) is what carries most of the visual energy now.
  // Special balls skip this — their star gradient lives entirely in
  // CSS (.pop-ball.special), so setting an inline background here
  // would just override it.
  if(!special){
    ball.style.background = `radial-gradient(circle at 38% 32%, ${color} 0%, ${color} 55%, ${shadeColor(color, -18)} 100%)`;
  }

  if(special){
    ball.setAttribute('aria-label', 'Special ball — pops into four more balls!');
  } else {
    ball.setAttribute('aria-label', 'Pop the ball');
  }

  // Start fully shrunk/transparent — the shared per-frame loop eases
  // these toward 1, rather than a fixed-duration CSS animation.
  ball.style.transform = 'translate(-50%,-50%) scale(0)';
  ball.style.opacity = '0';

  const anim = { el: ball, xPct: finalX, yPct: finalY, color, scale: 0, alpha: 0, special, swarm };
  state.popBallAnims.push(anim);
  ballLayer.appendChild(ball);

  return { ball, anim, ballLayer, xPct: finalX, yPct: finalY, color };
}

function removePopBall(ball, anim){
  state.popBallAnims = state.popBallAnims.filter(a => a !== anim);
  ball.remove();
}

// The shared "you popped something" feedback — shockwave, particles,
// floating text, score bump. Used by every ball type. `amount` (default
// 1) is the actual points just awarded — shown directly instead of a
// hardcoded "+1" so a doubled pop (see popMultiplierActive) reads "+2".
function popBallFeedback(ballLayer, xPct, yPct, color, amount = 1){
  spawnShockwave(ballLayer, xPct, yPct, color);

  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY);

  showFloatingText(ballLayer, xPct, yPct, `+${amount}`, color);

  const popsEl = document.getElementById('popPopsDisplay');
  popsEl.textContent = state.popScore;
  popsEl.style.transform = 'scale(1.3)';
  setTimeout(() => { popsEl.style.transform = 'scale(1)'; }, 120);
}

// Normal single-ball cycle: pop one, spawn the next. Each time this
// runs, there's a chance to spawn the special ball instead — unless
// it's already been used this round.
function spawnPopBall(){
  if(!state.popSpecialUsedThisRound && Math.random() < POP_SPECIAL_CHANCE){
    spawnSpecialPopBall();
    return;
  }

  const { ball, anim, ballLayer, xPct, yPct, color } = createPopBall();

  ball.addEventListener('click', () => {
    if(!state.popRoundActive) return;
    const amount = popMultiplierActive() ? 2 : 1;
    state.popScore += amount;
    sfxPop(state.popScore);
    popBallFeedback(ballLayer, xPct, yPct, color, amount);
    removePopBall(ball, anim);
    spawnPopBall();
  });
}

// A much bigger, multi-ring burst for popping the special ball — reads
// as a genuine "mega" event, not just a slightly larger normal pop.
// Three staggered shockwave rings (the middle one flashes white),
// ~4x the particles at higher speed/size, "BONUS!" instead of "+1",
// and a brief warm flash across the whole play area border.
function spawnMegaExplosion(ballLayer, xPct, yPct, color){
  [0, 90, 180].forEach((delay, i) => {
    setTimeout(() => {
      const ring = document.createElement('div');
      ring.className = 'pop-shockwave mega';
      ring.style.left = xPct + '%';
      ring.style.top = yPct + '%';
      ring.style.borderColor = i === 1 ? '#ffffff' : color;
      ballLayer.appendChild(ring);
      requestAnimationFrame(() => {
        ring.style.transform = 'translate(-50%,-50%) scale(3.4)';
        ring.style.opacity = '0';
      });
      setTimeout(() => ring.remove(), 560);
    }, delay);
  });

  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY, 150, 1.8, 1.4);

  showFloatingText(ballLayer, xPct, yPct, 'BONUS!', color, 'mega');

  const playArea = document.getElementById('popPlayArea');
  playArea.classList.add('mega-flash');
  setTimeout(() => playArea.classList.remove('mega-flash'), 380);

  sfxMegaExplosion();

  const popsEl = document.getElementById('popPopsDisplay');
  popsEl.textContent = state.popScore;
  popsEl.style.transform = 'scale(1.3)';
  setTimeout(() => { popsEl.style.transform = 'scale(1)'; }, 120);
}

// The special ball: pops into a 4-ball swarm that must all be cleared
// before normal single-ball spawning resumes. Limited to once per
// round via popSpecialUsedThisRound, set the moment it's clicked.
function spawnSpecialPopBall(){
  const { ball, anim, ballLayer, xPct, yPct, color } = createPopBall({ special: true });

  ball.addEventListener('click', () => {
    if(!state.popRoundActive) return;
    state.popSpecialUsedThisRound = true;
    state.popScore += popMultiplierActive() ? 2 : 1;
    spawnMegaExplosion(ballLayer, xPct, yPct, color);
    removePopBall(ball, anim);
    spawnPopSwarm(4);
  });
}

// Spawns `count` normal balls simultaneously. All of them must be
// popped before the game returns to the usual one-at-a-time spawning.
// Splits the play area into a grid with at least `count` cells, shuffles
// which cell each ball gets, then picks a random point safely inside
// that cell (with margin). This is what stops the 4-ball swarm from
// ever spawning two balls on top of each other — each one is
// guaranteed its own region rather than a fully random, collision-prone
// position.
function getSwarmPositions(count){
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  const cells = [];
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      cells.push({ r, c });
    }
  }
  const shuffledCells = shuffle(cells);

  const positions = [];
  for(let i = 0; i < count; i++){
    const cell = shuffledCells[i];
    const marginX = cellW * 0.22;
    const marginY = cellH * 0.22;
    const rawX = cell.c * cellW + marginX + Math.random() * (cellW - 2 * marginX);
    const rawY = cell.r * cellH + marginY + Math.random() * (cellH - 2 * marginY);
    positions.push({
      xPct: Math.max(10, Math.min(90, rawX)),
      yPct: Math.max(12, Math.min(88, rawY))
    });
  }
  return positions;
}

function spawnPopSwarm(count){
  state.popSwarmRemaining = count;
  const positions = getSwarmPositions(count);
  for(let i = 0; i < count; i++){
    const { ball, anim, ballLayer, xPct, yPct, color } = createPopBall({
      swarm: true,
      xPct: positions[i].xPct,
      yPct: positions[i].yPct
    });
    ball.addEventListener('click', () => {
      if(!state.popRoundActive) return;
      const amount = popMultiplierActive() ? 2 : 1;
      state.popScore += amount;
      sfxPop(state.popScore);
      popBallFeedback(ballLayer, xPct, yPct, color, amount);
      removePopBall(ball, anim);
      state.popSwarmRemaining--;
      if(state.popSwarmRemaining <= 0) spawnPopBall();
    });
  }
}

/* =========================================================
   BOMBS
   Spawn independently of the normal ball cycle — 1 or 2 per
   round, at random moments, alongside whatever ball is already
   on screen. Each ticks down for 3 seconds and disappears on
   its own if left alone; popping one costs a point. Scheduled
   via setTimeout, so — like every other timer on this page —
   anything pending or live MUST be cleared on round end/exit,
   or it'll keep ticking in the background after the round is over.
========================================================= */
function scheduleBombsForRound(){
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 bombs per round — smaller now, so more of them still feels fair
  const roundMs = POP_ROUND_SECONDS * 1000;
  const usedDelays = [];

  for(let i = 0; i < count; i++){
    let delay;
    let attempts = 0;
    do {
      // Keep clear of the very start/end of the round, and space
      // multiple bombs apart so they don't both land at once.
      delay = 1200 + Math.random() * (roundMs - 1200 - POP_BOMB_FUSE_MS - 800);
      attempts++;
    } while(usedDelays.some(d => Math.abs(d - delay) < POP_BOMB_MIN_GAP_MS) && attempts < 10);
    usedDelays.push(delay);

    const timeoutId = setTimeout(spawnPopBomb, delay);
    state.popBombTimeouts.push(timeoutId);
  }
}

function spawnPopBomb(){
  if(!state.popRoundActive) return;
  const ballLayer = document.getElementById('popBallLayer');
  const pos = getNonCollidingPosition(13); // smaller now, but still enough clearance to read as a separate object

  const bomb = document.createElement('button');
  bomb.className = 'pop-ball bomb';
  bomb.type = 'button';
  bomb.setAttribute('aria-label', "Bomb — don't pop this one!");
  bomb.style.left = pos.xPct + '%';
  bomb.style.top = pos.yPct + '%';
  bomb.style.transform = 'translate(-50%,-50%) scale(0)';
  bomb.style.opacity = '0';

  const anim = { el: bomb, xPct: pos.xPct, yPct: pos.yPct, color: POP_BOMB_COLOR, scale: 0, alpha: 0, bomb: true };
  state.popBallAnims.push(anim);
  ballLayer.appendChild(bomb);

  let secondsLeft = Math.ceil(POP_BOMB_FUSE_MS / 1000);
  bomb.textContent = String(secondsLeft);

  const fuseInterval = setInterval(() => {
    secondsLeft--;
    if(secondsLeft > 0) bomb.textContent = String(secondsLeft);
  }, 1000);

  const expireTimeout = setTimeout(() => {
    clearInterval(fuseInterval);
    removeBomb(bomb, anim);
  }, POP_BOMB_FUSE_MS);

  bomb.addEventListener('click', () => {
    if(!state.popRoundActive) return;
    clearInterval(fuseInterval);
    clearTimeout(expireTimeout);
    const penalty = popMultiplierActive() ? 2 : 1;
    state.popScore = Math.max(0, state.popScore - penalty);
    sfxIncorrect();
    popBombFeedback(ballLayer, pos.xPct, pos.yPct, penalty);
    removeBomb(bomb, anim);
  });

  state.popActiveBombs.push({ bomb, anim, fuseInterval, expireTimeout });
}

function removeBomb(bomb, anim){
  state.popBallAnims = state.popBallAnims.filter(a => a !== anim);
  state.popActiveBombs = state.popActiveBombs.filter(b => b.bomb !== bomb);
  bomb.remove();
}

// Distinct from popBallFeedback — a bomb pop is a miss, so it gets a
// red burst, a "−N", and a shake instead of the usual celebration.
// `penalty` doubles to 2 during the multiplier window, same as every
// other scoring event — the multiplier amplifies everything, not just
// the good stuff.
function popBombFeedback(ballLayer, xPct, yPct, penalty = 1){
  spawnShockwave(ballLayer, xPct, yPct, POP_BOMB_COLOR);
  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY);
  showFloatingText(ballLayer, xPct, yPct, `−${penalty}`, POP_BOMB_COLOR);
  shakePlayArea();

  const popsEl = document.getElementById('popPopsDisplay');
  popsEl.textContent = state.popScore;
  popsEl.style.transform = 'scale(1.3)';
  setTimeout(() => { popsEl.style.transform = 'scale(1)'; }, 120);
}

function shakePlayArea(){
  const playArea = document.getElementById('popPlayArea');
  playArea.classList.remove('shake');
  void playArea.offsetWidth; // force reflow so the shake can retrigger on back-to-back bombs
  playArea.classList.add('shake');
  setTimeout(() => playArea.classList.remove('shake'), 400);
}

// Cancels every pending/live bomb — called whenever a round ends,
// gets interrupted, or the stage is left, so nothing keeps ticking
// (or, worse, spawning) once the round is actually over.
function clearAllBombs(){
  state.popBombTimeouts.forEach(id => clearTimeout(id));
  state.popBombTimeouts = [];
  state.popActiveBombs.forEach(b => {
    clearInterval(b.fuseInterval);
    clearTimeout(b.expireTimeout);
    b.bomb.remove();
    state.popBallAnims = state.popBallAnims.filter(a => a !== b.anim);
  });
  state.popActiveBombs = [];
}

/* =========================================================
   GEMS
   Same architecture as bombs — spawn on their own schedule,
   independent of the normal ball cycle, each with its own expiry
   timer — but a gem is a reward, not a hazard: worth 3 points,
   fully vanishes with no penalty if left unclicked. Exactly 3
   spawn per round, each with a 2-second fuse.
========================================================= */
function scheduleGemsForRound(){
  const roundMs = POP_ROUND_SECONDS * 1000;
  const usedDelays = [];

  for(let i = 0; i < POP_GEM_COUNT; i++){
    let delay;
    let attempts = 0;
    do {
      delay = 900 + Math.random() * (roundMs - 900 - POP_GEM_FUSE_MS - 500);
      attempts++;
    } while(usedDelays.some(d => Math.abs(d - delay) < POP_GEM_MIN_GAP_MS) && attempts < 10);
    usedDelays.push(delay);

    const timeoutId = setTimeout(spawnPopGem, delay);
    state.popGemTimeouts.push(timeoutId);
  }
}

function spawnPopGem(){
  if(!state.popRoundActive) return;
  const ballLayer = document.getElementById('popBallLayer');
  const pos = getNonCollidingPosition(14); // smaller footprint, so a tighter clearance is fine

  const gem = document.createElement('button');
  gem.className = 'pop-ball gem';
  gem.type = 'button';
  gem.setAttribute('aria-label', 'Bonus gem — worth 3 points!');
  gem.style.left = pos.xPct + '%';
  gem.style.top = pos.yPct + '%';
  gem.style.transform = 'translate(-50%,-50%) scale(0)';
  gem.style.opacity = '0';

  const anim = { el: gem, xPct: pos.xPct, yPct: pos.yPct, color: POP_GEM_COLOR, scale: 0, alpha: 0, gem: true };
  state.popBallAnims.push(anim);
  ballLayer.appendChild(gem);

  const expireTimeout = setTimeout(() => removeGem(gem, anim), POP_GEM_FUSE_MS);

  gem.addEventListener('click', () => {
    if(!state.popRoundActive) return;
    clearTimeout(expireTimeout);
    const amount = POP_GEM_POINTS * (popMultiplierActive() ? 2 : 1);
    state.popScore += amount;
    sfxGem();
    popGemFeedback(ballLayer, pos.xPct, pos.yPct, amount);
    removeGem(gem, anim);
  });

  state.popActiveGems.push({ gem, anim, expireTimeout });
}

function removeGem(gem, anim){
  state.popBallAnims = state.popBallAnims.filter(a => a !== anim);
  state.popActiveGems = state.popActiveGems.filter(g => g.gem !== gem);
  gem.remove();
}

// A brighter, richer celebration than a normal pop — three colors of
// particle burst plus the actual amount awarded (normally "+3", "+6"
// during a multiplier window) instead of "+1", since this one's worth
// more than a normal pop to begin with.
function popGemFeedback(ballLayer, xPct, yPct, amount = POP_GEM_POINTS){
  spawnShockwave(ballLayer, xPct, yPct, POP_GEM_COLOR);
  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY);
  spawnPopParticles(pxX, pxY); // a second burst — a gem deserves more sparkle than a normal pop
  spawnPopSparkles(ballLayer, xPct, yPct, POP_GEM_COLOR);
  showFloatingText(ballLayer, xPct, yPct, `+${amount}`, POP_GEM_COLOR);

  const popsEl = document.getElementById('popPopsDisplay');
  popsEl.textContent = state.popScore;
  popsEl.style.transform = 'scale(1.3)';
  setTimeout(() => { popsEl.style.transform = 'scale(1)'; }, 120);
}

function clearAllGems(){
  state.popGemTimeouts.forEach(id => clearTimeout(id));
  state.popGemTimeouts = [];
  state.popActiveGems.forEach(g => {
    clearTimeout(g.expireTimeout);
    g.gem.remove();
    state.popBallAnims = state.popBallAnims.filter(a => a !== g.anim);
  });
  state.popActiveGems = [];
}

/* =========================================================
   MULTIPLIER BALL (new, 2026-07-16)
   Same independent-schedule architecture as bombs/gems — spawns on its
   own timer, separate from the normal ball cycle — but exactly ONE per
   round, since popping it doubles every point value (positive AND
   negative) for the next POP_MULTIPLIER_DURATION_MS. A single round-
   defining moment, not a routine pickup like a gem.
========================================================= */
function scheduleMultiForRound(){
  const roundMs = POP_ROUND_SECONDS * 1000;
  // Kept out of the very start/end of the round, same margins bombs/gems
  // use — no min-gap spacing needed since there's only ever one of these.
  const delay = 1500 + Math.random() * (roundMs - 1500 - POP_MULTI_FUSE_MS - 800);
  const timeoutId = setTimeout(spawnPopMulti, delay);
  state.popMultiTimeouts.push(timeoutId);
}

function spawnPopMulti(){
  if(!state.popRoundActive) return;
  const ballLayer = document.getElementById('popBallLayer');
  const pos = getNonCollidingPosition(14);

  const multi = document.createElement('button');
  multi.className = 'pop-ball multi';
  multi.type = 'button';
  multi.setAttribute('aria-label', 'Multiplier ball — doubles every point for a few seconds!');
  multi.style.left = pos.xPct + '%';
  multi.style.top = pos.yPct + '%';
  multi.style.transform = 'translate(-50%,-50%) scale(0)';
  multi.style.opacity = '0';

  const anim = { el: multi, xPct: pos.xPct, yPct: pos.yPct, color: POP_MULTI_COLOR, scale: 0, alpha: 0, multi: true };
  state.popBallAnims.push(anim);
  ballLayer.appendChild(multi);

  const expireTimeout = setTimeout(() => removeMulti(multi, anim), POP_MULTI_FUSE_MS);

  multi.addEventListener('click', () => {
    if(!state.popRoundActive) return;
    clearTimeout(expireTimeout);
    state.popMultiplierUntil = performance.now() + POP_MULTIPLIER_DURATION_MS;
    sfxMultiplier();
    popMultiFeedback(ballLayer, pos.xPct, pos.yPct);
    removeMulti(multi, anim);
  });

  state.popActiveMulti.push({ el: multi, anim, expireTimeout });
}

function removeMulti(multi, anim){
  state.popBallAnims = state.popBallAnims.filter(a => a !== anim);
  state.popActiveMulti = state.popActiveMulti.filter(m => m.el !== multi);
  multi.remove();
}

// A distinct "power surge" celebration — a bright ring flash across the
// whole play area (so a x2 window starting is unmissable even mid-tap),
// on top of the usual shockwave/particles/text.
function popMultiFeedback(ballLayer, xPct, yPct){
  spawnShockwave(ballLayer, xPct, yPct, POP_MULTI_COLOR);
  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY, 60, 1.4, 1.1);
  showFloatingText(ballLayer, xPct, yPct, '×2!', POP_MULTI_COLOR);

  const playArea = document.getElementById('popPlayArea');
  playArea.classList.add('multi-flash');
  setTimeout(() => playArea.classList.remove('multi-flash'), 400);
}

function clearAllMulti(){
  state.popMultiTimeouts.forEach(id => clearTimeout(id));
  state.popMultiTimeouts = [];
  state.popActiveMulti.forEach(m => {
    clearTimeout(m.expireTimeout);
    m.el.remove();
    state.popBallAnims = state.popBallAnims.filter(a => a !== m.anim);
  });
  state.popActiveMulti = [];
}

function startPopRound(){
  cancelPopRound();
  state.popRoundActive = true;
  state.popScore = 0;
  state.popSpecialUsedThisRound = false;
  state.popSwarmRemaining = 0;
  state.popMultiplierUntil = 0;

  document.getElementById('popPopsDisplay').textContent = '0';
  document.getElementById('popTimeDisplay').textContent = POP_ROUND_SECONDS;
  document.getElementById('popTimerFill').style.width = '100%';

  const playArea = document.getElementById('popPlayArea');
  playArea.classList.remove('idle');
  document.getElementById('popBallLayer').innerHTML = '';
  spawnPopBall();
  scheduleBombsForRound();
  scheduleGemsForRound();
  scheduleMultiForRound();

  const start = performance.now();
  const timeDisplay = document.getElementById('popTimeDisplay');
  const timerFill = document.getElementById('popTimerFill');
  const popsEl = document.getElementById('popPopsDisplay');
  function tick(now){
    const remaining = Math.max(0, POP_ROUND_SECONDS - (now - start) / 1000);
    timeDisplay.textContent = Math.ceil(remaining);
    timerFill.style.width = (remaining / POP_ROUND_SECONDS * 100) + '%';
    // Live "×2 active" cue on the score number itself for the whole
    // window, not just the instant it's popped — a room full of players
    // needs to keep seeing it, not just catch a one-off flash.
    popsEl.classList.toggle('multi-active', popMultiplierActive());

    if(remaining <= 0){
      finishPopRound();
      return;
    }
    state.popRoundRAF = requestAnimationFrame(tick);
  }
  state.popRoundRAF = requestAnimationFrame(tick);
}

// Cancels an in-progress round cleanly — called both when a round ends
// naturally (time runs out) and when the teacher navigates away from
// this stage mid-round. In the "navigated away" case there's no result
// to show, so the UI just resets back to an idle "Begin turn" state
// for the same team to retry.
export function cancelPopRound(){
  if(state.popRoundRAF) cancelAnimationFrame(state.popRoundRAF);
  state.popRoundRAF = null;
  if(state.popRoundActive){
    state.popRoundActive = false;
    clearAllBombs();
    clearAllGems();
    clearAllMulti();
    document.getElementById('popPopsDisplay').classList.remove('multi-active');
    const playArea = document.getElementById('popPlayArea');
    if(playArea){
      const ballLayer = document.getElementById('popBallLayer');
      if(ballLayer) ballLayer.innerHTML = '';
      state.popBallAnims = [];
      state.popSwarmRemaining = 0;
      playArea.classList.add('idle');
    }
    const beginBtn = document.getElementById('popBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishPopRound(){
  state.popRoundActive = false;
  state.popRoundRAF = null;
  clearAllBombs();
  clearAllGems();
  clearAllMulti();
  document.getElementById('popPopsDisplay').classList.remove('multi-active');
  sfxTimeUp();

  const playArea = document.getElementById('popPlayArea');
  document.getElementById('popBallLayer').innerHTML = '';
  state.popBallAnims = [];
  state.popSwarmRemaining = 0;
  playArea.classList.add('idle');

  const team = state.popTeams[state.popCurrentTeam];
  team.total += state.popScore;
  state.popTurnsPlayed++;
  renderPopScoreboard();

  showPopResult().then(() => {
    if(state.popTurnsPlayed >= POP_QUESTIONS.length){
      endPopGame();
    } else {
      state.popCurrentTeam = (state.popCurrentTeam + 1) % state.popTeams.length;
      renderPopScoreboard();
      renderPopTurnBanner();
      document.getElementById('popBeginTurnBtn').disabled = false;
      document.getElementById('popTimeDisplay').textContent = '--';
      document.getElementById('popTimerFill').style.width = '100%';
    }
  });
}

function showPopResult(){
  return showTurnResultModal('popNextTeamBtn', { teams: state.popTeams, currentTeamIndex: state.popCurrentTeam });
}

function endPopGame(){
  const winnerText = finishTeamGame({ prefix: 'pop', teams: state.popTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('popTurnBanner').innerHTML = `All 10 questions done — ${winnerText}`;
}

wireTeamManagementButtons({
  prefix: 'pop',
  getTeams: () => state.popTeams,
  renderScoreboard: renderPopScoreboard,
  cancelRound: cancelPopRound,
  beforePlayAgain: stopPopParticleLoop
});

document.getElementById('popBackBtn').addEventListener('click', () => goToStage(5));
document.getElementById('popNextBtn').addEventListener('click', () => goToStage(7));
