import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, showQuestionModal } from '../utils.js';
import { ensureAudio, beep, sfxIncorrect, sfxTimeUp, audioOut } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { POP_QUESTIONS } from '../content/stage6-ballpop.js';
import { createCanvasResizer } from '../canvasGame.js';
import { drawGlow } from '../canvasGlow.js';
import { stepParticles, frameFactor } from '../canvasEffects.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame, isLowQuality } from '../quality.js';

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

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('popSetup', {
  prefix: 'pop',
  title: 'Ball Pop',
  steps: [
    'One team answers a question.',
    'Tap every ball you can before the time runs out.',
    'You get 10 seconds. Highest score wins.'
  ],
  scoring: [
    { swatch: '<span class="pop-legend-swatch normal"></span>', label: 'Normal ball', points: '+1' },
    { swatch: '<span class="pop-legend-swatch gem"></span>', label: 'Gem', points: '+3', tone: 'bonus' },
    { swatch: '<span class="pop-legend-swatch special"></span>', label: 'Special ball', points: 'splits into 4', tone: 'bonus' },
    { swatch: '<span class="pop-legend-swatch multi"></span>', label: 'Multiplier', points: 'double for 4s', tone: 'bonus' },
    { swatch: '<span class="pop-legend-swatch bomb"></span>', label: 'Bomb &mdash; do not tap!', points: '&minus;1', tone: 'bad' }
  ],
  tip: 'Go for the gems and the multiplier first &mdash; they are worth far more than racing through the normal balls.'
});

export function renderPopTeamInputs(count){
  renderTeamSetupRows('popTeamInputs', 'popAddTeamBtn', count, popRowColors, renderPopTeamInputs);
}
renderPopTeamInputs(2);

wireAddTeamButton('popTeamInputs', 'popAddTeamBtn', renderPopTeamInputs);

document.getElementById('popStartBtn').addEventListener('click', () => {
  state.popTeams = readTeamsFromSetup('pop', popRowColors);
  state.popCurrentTeam = 0;
  state.popTurnsPlayed = 0;
  state.popQuestionOrder = shuffle(POP_QUESTIONS.map((_, i) => i));

  showGameScreen('pop');
  resizePopCanvas();
  startPopParticleLoop();
  renderPopScoreboard();
  renderPopTurnBanner();
});

function renderPopScoreboard(){
  renderTeamScoreboard('popTeamList', state.popTeams, state.popCurrentTeam);
}

function renderPopTurnBanner(){
  renderTurnBanner('pop', state.popTeams[state.popCurrentTeam], state.popTurnsPlayed + 1, POP_QUESTIONS.length);
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
  osc.connect(gain).connect(audioOut());
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
  noise.connect(filter).connect(gain).connect(audioOut());
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

/* ---- One-shot DOM effects (rings, sparkles, "+1" text) ----
   Each used to be: create a div, wait a requestAnimationFrame so the
   browser would register its starting style, set the end style so a
   CSS transition ran, then remove it on a setTimeout. The rAF dance
   forces a style flush per effect, and the timers pile up during a
   burst. Now each effect is one Web Animations call: the start and end
   states are in the keyframes, the compositor runs it (transform and
   opacity only), and the element is recycled when it finishes instead
   of being thrown away — a fast run of pops reuses the same few nodes. */
const popFxPool = [];
const POP_FX_POOL_MAX = 40;

function acquirePopFx(container, className, xPct, yPct){
  const el = popFxPool.pop() || document.createElement('div');
  el.className = className;
  el.style.left = xPct + '%';
  el.style.top = yPct + '%';
  container.appendChild(el);
  return el;
}

function playPopFx(el, keyframes, options){
  const anim = el.animate(keyframes, { fill: 'both', ...options }); // 'both': the first frame also holds during a delay
  anim.onfinish = () => {
    anim.cancel();
    el.remove();
    el.removeAttribute('style');
    el.textContent = '';
    if(popFxPool.length < POP_FX_POOL_MAX) popFxPool.push(el);
  };
}

// Expanding ring fired from the click point — colored to match the
// outcome (ball color for a correct pop, red for a bad-ball miss).
function spawnShockwave(container, xPct, yPct, color, { mega = false, delay = 0 } = {}){
  const ring = acquirePopFx(container, mega ? 'pop-shockwave mega' : 'pop-shockwave', xPct, yPct);
  ring.style.borderColor = color;
  playPopFx(ring, [
    { transform: 'translate(-50%,-50%) scale(0.3)', opacity: 0.9 },
    { transform: `translate(-50%,-50%) scale(${mega ? 3.4 : 2.6})`, opacity: 0 }
  ], { duration: 450, easing: 'ease-out', delay });
}

// The score number's little "bump" whenever it changes.
function bumpPopScore(){
  const popsEl = document.getElementById('popPopsDisplay');
  popsEl.textContent = state.popScore;
  popsEl.animate([
    { transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(1)' }
  ], { duration: 260, easing: 'ease-out' });
}

// A gem's signature effect — small sparkle glyphs flying outward from
// the pop point and fading, layered on top of the usual shockwave/
// particles/text every ball type shares. Added 2026-07-16 so a gem pop
// has its own distinct "personality" instead of just being a bigger
// version of a normal pop.
function spawnPopSparkles(container, xPct, yPct, color, count = 6){
  if(isLowQuality()) return; // decoration on top of the shockwave/particles/text
  for(let i = 0; i < count; i++){
    const sparkle = acquirePopFx(container, 'pop-sparkle', xPct, yPct);
    sparkle.style.setProperty('--spark-color', color);

    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.6 - 0.3);
    const dist = 28 + Math.random() * 24;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
    playPopFx(sparkle, [
      { transform: 'translate(-50%,-50%) scale(0) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${120 + Math.random() * 180}deg)`, opacity: 0 }
    ], { duration: 550, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }
}

// Floating "+1" / "−1" combat-text, rising and fading at the click point.
function showFloatingText(container, xPct, yPct, text, color, extraClass = ''){
  const el = acquirePopFx(container, 'pop-float-text' + (extraClass ? ' ' + extraClass : ''), xPct, yPct);
  el.textContent = text;
  el.style.color = color;
  playPopFx(el, [
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
    { transform: 'translate(-50%,-160%) scale(1.3)', opacity: 0 }
  ], { duration: 600, easing: 'cubic-bezier(.2,.7,.4,1)' });
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
// Half resolution on top of the shared cap: this canvas draws ONLY
// glow rings and particles behind real DOM ball buttons, so there is no
// crisp edge for the upscale to soften.
// A resize wipes the canvas buffer. While the loop is running the next
// frame repaints it anyway; while it's parked (see startPopParticleLoop)
// nothing would, so repaint the one still frame here.
const popCanvasResizer = createCanvasResizer('popParticleCanvas', 'popPlayArea', () => {
  if(!state.popParticleRAF) renderPopCanvas();
}, { renderScale: 0.42 });
export function resizePopCanvas(){ popCanvasResizer.resize(); }

// Cache the 2D context per canvas element instead of calling
// getContext('2d') every single animation frame — getContext on the
// same element always returns the same context instance, so the only
// reason to look it up again is if the canvas element itself changed.
let popCtxCache = null;
let popCtxCanvasEl = null;
function getPopCtx(canvas){
  if(canvas !== popCtxCanvasEl){
    popCtxCanvasEl = canvas;
    popCtxCache = canvas.getContext('2d');
  }
  return popCtxCache;
}

// Above this many live particles (a bomb/mega burst can spawn up to
// 150 at once), stop paying the shadowBlur cost per-particle — a real
// per-shape blur convolution for every one of 150 tiny circles every
// frame is what made bomb/mega moments feel laggy. A handful of normal
// pop particles still get their glow; a big burst trades a bit of glow
// for staying smooth.
const POP_PARTICLE_GLOW_LIMIT = 60;

// Safety net against a stacked-event cascade (e.g. a mega explosion
// landing while a couple of swarm-ball pops are still fading) piling up
// hundreds of simultaneously-alive particles — trims the OLDEST ones
// (already the most faded/least noticeable) rather than the newest.
const POP_PARTICLE_HARD_CAP = 200;

function spawnPopParticles(xPx, yPx, count = 40, speedMult = 1, sizeMult = 1){
  count = particleCount(count); // lite mode: fewer per burst (js/quality.js)
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
  if(state.popParticles.length > POP_PARTICLE_HARD_CAP){
    state.popParticles.splice(0, state.popParticles.length - POP_PARTICLE_HARD_CAP);
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
const POP_MULTI_COLOR = "#A855F7";
const POP_MULTIPLIER_DURATION_MS = 4000;

function popMultiplierActive(){
  return performance.now() < state.popMultiplierUntil;
}

// `k` = 60fps-frames elapsed (frameFactor), so a ball grows in at the
// same real-time speed on a 30fps classroom PC as on a 120Hz panel.
function updatePopBallAnims(k){
  const ease = 1 - Math.pow(1 - POP_BALL_EASE_SPEED, k);
  for(const anim of state.popBallAnims){
    // A ball that has finished growing in is left alone. This used to
    // rewrite every live ball's transform and opacity on every frame for
    // as long as it was on screen — a style invalidation per ball per
    // frame for a value that had stopped changing.
    if(anim.settled) continue;
    anim.scale += (1 - anim.scale) * ease;
    anim.alpha += (1 - anim.alpha) * ease;
    if(anim.scale > 0.995 && anim.alpha > 0.995){
      anim.scale = 1;
      anim.alpha = 1;
      anim.settled = true;
    }
    anim.el.style.transform = `translate(-50%,-50%) scale(${anim.scale})`;
    anim.el.style.opacity = anim.alpha;
  }
}

function updatePopParticles(k){
  // gravity 0.2/frame, horizontal drag 0.983, gentle shrink 0.974
  stepParticles(state.popParticles, k, { gravity: 0.2, dragX: 0.983, shrink: 0.974 });
}


function renderPopCanvas(){
  const canvas = popCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = getPopCtx(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // No animated bokeh any more. Eight drifting glows were redrawn here
  // every frame (a quarter-resolution pass plus a full-canvas upscale),
  // which kept this the slowest game in the app; moving them to a CSS
  // layer just moved the cost to the compositor (measured: worse, an
  // oversized layer re-composited every frame). The play area's own
  // static gradient background (.pop-play-area) carries the colour, and
  // this canvas now draws only what is genuinely dynamic: ball rings
  // and particles.

  // Above POP_PARTICLE_GLOW_LIMIT live particles, a bomb/mega moment is
  // already under load — drop shadowBlur everywhere this frame (both
  // the ring glow below AND the particle glow further down), not just
  // on particles. shadowBlur is the single most expensive thing this
  // canvas draws every frame; computed once here, ahead of the ring
  // loop, instead of only gating the particle loop the way this used to.
  const particleGlowOn = state.popParticles.length <= POP_PARTICLE_GLOW_LIMIT;

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

    // The glow used to be ctx.shadowBlur on the ring stroke. shadowBlur
    // makes the renderer rasterize and blur a copy of the shape every
    // frame, per ball — with the backdrop blobs fixed (above), this was
    // what was left of Ball Pop's frame budget. A pre-rasterized glow
    // sprite blitted behind a plain, unblurred stroke is visually the
    // same bloom for a fraction of the cost.
    const ringRadius = radius + ringPadding;
    if(particleGlowOn){
      const spread = anim.special ? 20 : (anim.gem || anim.swarm || anim.multi ? 16 : 26);
      drawGlow(ctx, xPx, yPx, ringRadius + spread, anim.color, anim.alpha * glowPulse * 0.5, 1.6);
    }
    ctx.save();
    ctx.globalAlpha = anim.alpha * glowPulse;
    ctx.strokeStyle = anim.color;
    ctx.lineWidth = (anim.gem || anim.special || anim.swarm || anim.multi) ? 2 : 3;
    ctx.beginPath();
    ctx.arc(xPx, yPx, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // One save/restore for the whole particle batch instead of one pair
  // per particle — with up to 200 particles alive at once, that's up to
  // 200 fewer save/restore calls per frame. shadowBlur is explicitly
  // reset to 0 when glow is off (rather than relying on restore(), which
  // no longer runs per-iteration) so it can't leak from a previous frame.
  // Particles are drawn as plain solid discs — no per-particle glow of
  // any kind. They previously had shadowBlur, and a cached-sprite halo
  // was tried as the replacement; measurement showed that with up to
  // 200 particles alive during a pop burst, even a cheap blit per
  // particle is 200 extra alpha-blended draws in the one frame that can
  // least afford them. At this size, on this background, the halo was
  // barely perceptible anyway — the glow that actually reads is the
  // ring behind each BALL (above), which is a handful of draws, not
  // hundreds. 'lighter' recovers the bloom for free: overlapping
  // particles add together, which is what a burst should do.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(const p of state.popParticles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// The loop PARKS itself once there is nothing left to animate — no
// round running, no balls, no particles still fading. It used to run
// for as long as Stage 6 was open, including the long stretches a class
// spends between turns, in the question modal, or on the game-over
// screen: a full canvas redraw every frame to drift eight background
// blobs nobody was looking at. Parked, the last frame simply stays on
// screen. startPopRound() restarts it.
export function startPopParticleLoop(){
  if(state.popParticleRAF) return; // already running
  let last = performance.now();
  function frame(now){
    noteFrame();
    const k = frameFactor(now - last);
    last = now;
    updatePopBallAnims(k);
    updatePopParticles(k);
    renderPopCanvas();
    if(!state.popRoundActive && state.popParticles.length === 0 && state.popBallAnims.length === 0){
      state.popParticleRAF = null;
      return;
    }
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
    getPopCtx(canvas).clearRect(0, 0, canvas.width, canvas.height);
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

  // A glossy bubble: a bright specular highlight layered over the body
  // gradient, with a lighter rim light opposite it. Three stacked
  // gradients rather than one, which reads as a real 3D ball instead of
  // a flat disc — these are DOM elements, and isolation testing
  // confirmed the DOM layer costs this game essentially nothing (the
  // frame budget goes on canvas fill-rate, see js/canvasGlow.js), so
  // the extra paint detail here is free. Static gradients only: no
  // blur, no filter, nothing animated, which is what keeps it free.
  //
  // Special balls skip this — their star gradient lives entirely in
  // CSS (.pop-ball.special), so setting an inline background here
  // would just override it.
  if(!special){
    // The highlight is deliberately SMALL. A first pass used a 26%-radius
    // white hotspot, which on a 140px ball covered half its face and
    // left every ball reading as a white blob with a coloured rim
    // rather than as a coloured ball. A tight 13% glint is what reads
    // as gloss; the rim light below does the rest of the 3D work.
    ball.style.background = [
      `radial-gradient(circle at 33% 27%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 5%, rgba(255,255,255,0) 13%)`,
      `radial-gradient(circle at 74% 80%, ${shadeColor(color, 18)} 0%, rgba(255,255,255,0) 30%)`,
      `radial-gradient(circle at 38% 32%, ${shadeColor(color, 6)} 0%, ${color} 55%, ${shadeColor(color, -28)} 100%)`
    ].join(', ');
    ball.style.boxShadow = 'inset 0 -6px 12px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.35), 0 4px 14px rgba(0,0,0,0.25)';
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
// `particleCount` (default 40, the normal-ball burst size) lets a swarm
// pop request a smaller burst — see spawnPopSwarm's click handler.
function popBallFeedback(ballLayer, xPct, yPct, color, amount = 1, particleCount = 40){
  spawnShockwave(ballLayer, xPct, yPct, color);

  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY, particleCount);

  showFloatingText(ballLayer, xPct, yPct, `+${amount}`, color);

  bumpPopScore();
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
// ~1.75x the particles at higher speed/size, "BONUS!" instead of "+1",
// and a brief warm flash across the whole play area border. Particle
// count trimmed from an original 150 (was ~4x a normal burst) — the
// rings/flash/text already carry the "mega" read, and 150 particles
// plus the swarm balls this triggers next was the single biggest
// contributor to Ball Pop's reported lag on lower-powered displays.
function spawnMegaExplosion(ballLayer, xPct, yPct, color){
  (isLowQuality() ? [0] : [0, 90, 180]).forEach((delay, i) => {
    spawnShockwave(ballLayer, xPct, yPct, i === 1 ? '#ffffff' : color, { mega: true, delay });
  });

  const canvas = popCanvasResizer.getCanvas();
  const pxX = (xPct / 100) * canvas.width;
  const pxY = (yPct / 100) * canvas.height;
  spawnPopParticles(pxX, pxY, 70, 1.8, 1.4);

  showFloatingText(ballLayer, xPct, yPct, 'BONUS!', color, 'mega');

  const playArea = document.getElementById('popPlayArea');
  playArea.classList.add('mega-flash');
  setTimeout(() => playArea.classList.remove('mega-flash'), 380);
  // The biggest single moment in this game had no physical shake at
  // all, unlike a bomb pop (see popBombFeedback's shakePlayArea() call)
  // — same reflow-retrigger shake, reused rather than duplicated.
  shakePlayArea();

  sfxMegaExplosion();

  bumpPopScore();
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
      // Smaller burst than a normal pop (16 vs the default 40) — up to
      // 4 of these can fire in quick succession right after the mega
      // explosion's own 70-particle burst, so keeping each one light
      // matters more here than for a single standalone pop.
      popBallFeedback(ballLayer, xPct, yPct, color, amount, 16);
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

  bumpPopScore();
}

// A Web Animation restarts cleanly on back-to-back bombs by itself. The
// class-toggle version needed `void offsetWidth` to retrigger, which
// forces a full synchronous layout at exactly the busiest moment.
function shakePlayArea(){
  document.getElementById('popPlayArea').animate([
    { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' },
    { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
  ], { duration: 400, easing: 'ease' });
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

  bumpPopScore();
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
  setTimerFill(document.getElementById('popTimerFill'), 1);

  const playArea = document.getElementById('popPlayArea');
  playArea.classList.remove('idle');
  document.getElementById('popBallLayer').innerHTML = '';
  startPopParticleLoop(); // may have parked between turns
  spawnPopBall();
  scheduleBombsForRound();
  scheduleGemsForRound();
  scheduleMultiForRound();

  const start = performance.now();
  const timeDisplay = document.getElementById('popTimeDisplay');
  const timerFill = document.getElementById('popTimerFill');
  const updateTimerHud = createTimerHud(timeDisplay, timerFill, POP_ROUND_SECONDS);
  const popsEl = document.getElementById('popPopsDisplay');
  function tick(now){
    const remaining = Math.max(0, POP_ROUND_SECONDS - (now - start) / 1000);
    updateTimerHud(remaining);
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
      setTimerFill(document.getElementById('popTimerFill'), 1);
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
