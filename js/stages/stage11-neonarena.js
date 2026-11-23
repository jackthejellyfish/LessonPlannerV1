import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { ensureAudio, beep, audioOut, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { NEON_QUESTIONS } from '../content/stage11-neonarena.js';
import { createCanvasResizer } from '../canvasGame.js';
import { drawGlow, createBackdrop } from '../canvasGlow.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves, stepParticles, frameFactor } from '../canvasEffects.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

// Rising "+N" text on every kill — same shared canvas float-text helper
// every other canvas game uses.
let neonFloatTexts = [];
// Shake + shockwave on an enemy kill — a Warden (boss) kill originally
// had this and nothing else did (2026-08 consistency pass), mirroring
// Star Defender's own boss-kill treatment; every kill now gets a
// scaled-down version so all hits feel like they land, not just bosses
// — same "scale with severity" convention Star Defender's own
// triggerShake(invShake, ...) call already uses. Only a Warden kill
// still gets the big shockwave ring — that's still this game's single
// biggest moment.
let neonShake = createShakeState();
let neonShockwaves = [];

/* =========================================================
   STAGE 11 — NEON ARENA
   Team-turn structure identical to the other canvas games:
   answer a question, then survive a 20-second round. The new
   ingredient here (this app's first) is free keyboard movement —
   WASD/arrow keys move the player around the arena in any
   direction, fully decoupled from aiming, while a click (or tap)
   fires toward that point. Enemies home in loosely from the
   edges; touching one costs a life exactly like Star Defender's
   `invLives` — a cosmetic warning, not a fail-state, so the round
   always runs the full clock regardless of lives remaining (same
   behavior, just carried over deliberately for consistency).
   Pickups sit in the arena and are collected by walking over them
   (shooting isn't needed since the player already moves freely).
   All audio is synthesized (Web Audio oscillators/noise) — no
   audio files, matching this app's sound system everywhere else.
========================================================= */
/* =========================================================
   WORLD UNITS (reworked 2026-11-22: "feels very squashed")
   Everything used to live in percentages of the arena's width AND
   height separately, so on a wide board one "unit" sideways was twice
   one unit up and down: the ship crossed the screen twice as fast
   sideways, bullets flew off the angle you clicked, and hit circles
   were really ellipses. Now the arena is 100 units tall and as wide as
   the screen's shape makes it (worldW, ~190 on a classroom board), the
   same scheme Balloon Pop and Whack-a-Jelly use. One unit is the same
   distance in every direction.
========================================================= */
const NEON_ROUND_SECONDS = 20;
const NEON_MAX_LIVES = 3;
const NEON_PLAYER_R = 3.2;
const NEON_PLAYER_SPEED = 62;     // units/second

/* ---- Shooting (reworked 2026-11-22) ----
   Hold the mouse (or a finger, or SPACE) to keep firing toward the
   pointer, instead of one shot per click with clicks inside the cooldown
   silently swallowed. Shots are small bright bolts with a short trail,
   a little aim assist pulls a near miss onto the enemy it was meant for
   (these are young players on a big screen), and a hit knocks the enemy
   back so every shot visibly lands. */
const NEON_FIRE_MS = 150;            // held fire cadence
const NEON_FIRE_MS_OVERDRIVE = 90;
const NEON_TAP_MIN_MS = 70;          // a fresh press always fires if this long since the last shot
const NEON_BULLET_SPEED = 190;       // units/second
const NEON_BULLET_SPEED_OVERDRIVE = 270;
const NEON_BULLET_R = 1.1;           // hit radius (a touch forgiving)
const NEON_BULLET_R_POWER = 1.7;
const NEON_POWER_PIERCE = 2;         // a Power Core shot carries on through this many more enemies
const NEON_AIM_ASSIST = 0.17;        // radians (~10 degrees) either side of the aim
const NEON_SPREAD_PELLETS = 5;
const NEON_SPREAD_ARC = 0.5;

/* ---- Power-ups (feedback 2026-11-22: "make power ups more common") ----
   Up to three on the floor at once, the first within two seconds, then
   every 2.5-4s, and a destroyed enemy sometimes drops one. They last
   POWERUP_MS each (collecting the same again tops it back up) rather
   than the whole round, so the extra ones still mean something. */
const NEON_POWERUP_MS = 10000;
const NEON_PICKUP_LIFE_MS = 8000;
const NEON_PICKUP_MAX = 3;
const NEON_PICKUP_FIRST_MS = [1200, 2200];
const NEON_PICKUP_GAP_MS = [2600, 4200];
const NEON_DROP_CHANCE = 0.1;
const NEON_PICKUP_R = 2.6;

const NEON_PLAYER_COLOR = '#B6FF3C';
const NEON_DRIFTER_COLOR = '#FF3EA5';
const NEON_ZAPPER_COLOR = '#00E5FF';
const NEON_JUGGERNAUT_COLOR = '#7B5CFF';
const NEON_WARDEN_COLOR = '#FF7A18';
const NEON_POWER_COLOR = '#FFE94A';
const NEON_OVERDRIVE_COLOR = '#3EC1FF';
const NEON_SPREAD_COLOR = '#FF5CF4';
const NEON_BOMB_COLOR = '#FF3B3B';
// Nova Bomb shrapnel — see triggerNeonNovaBomb.
const NEON_SHRAPNEL_COUNT = 18;
const NEON_SHRAPNEL_SPEED = 190;
const NEON_SHRAPNEL_MAX_DIST = 62;
const NEON_SHRAPNEL_HIT_R = 4.6;

function neonEnemyColor(type){
  return type === 'drifter' ? NEON_DRIFTER_COLOR
       : type === 'zapper' ? NEON_ZAPPER_COLOR
       : type === 'juggernaut' ? NEON_JUGGERNAUT_COLOR
       : NEON_WARDEN_COLOR;
}
function neonPickupColor(type){
  return type === 'power' ? NEON_POWER_COLOR
       : type === 'overdrive' ? NEON_OVERDRIVE_COLOR
       : type === 'spread' ? NEON_SPREAD_COLOR
       : NEON_BOMB_COLOR;
}

/* =========================================================
   AUDIO — synthesized only, same technique as every other stage
========================================================= */
// A synth zap: a saw body sweeping down for grit, a sine sweeping down
// over it for the pitch, and a resonant filter that gives it the rubbery
// "pew" character the arena's whole look is going for. The old version
// was a single square-wave drop, which sounded like a 1980s menu blip
// rather than a weapon.
function sfxNeonShot(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  sub.type = 'sine';
  osc.frequency.setValueAtTime(820, t0);
  osc.frequency.exponentialRampToValueAtTime(170, t0 + 0.1);
  sub.frequency.setValueAtTime(1640, t0);
  sub.frequency.exponentialRampToValueAtTime(320, t0 + 0.09);
  filter.type = 'lowpass';
  filter.Q.value = 7;
  filter.frequency.setValueAtTime(2600, t0);
  filter.frequency.exponentialRampToValueAtTime(420, t0 + 0.11);
  gain.gain.setValueAtTime(0.075, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  osc.connect(filter); sub.connect(filter);
  filter.connect(gain).connect(audioOut());
  osc.start(t0); sub.start(t0);
  osc.stop(t0 + 0.14); sub.stop(t0 + 0.14);
}

// A non-fatal hit: short, bright and clearly separate from a kill, so a
// stream of fire doesn't turn into mush.
function sfxNeonHitEnemy(){
  beep(1180, 0.045, 'square', 0.07);
  beep(1760, 0.03, 'triangle', 0.045, 0.012);
}
// Kills use the shared impact, which carries a pitched thump under the
// noise — the old noise-only burst had no weight to it.
function sfxNeonDestroy(intensity){
  sfxImpact(0.5 + intensity * 0.8);
}

// Pickups climb and then sparkle, so collecting one is unmistakable
// even in the middle of a firefight.
function sfxNeonPickup(){
  sfxRisingChime([740, 932, 1109, 1480], { duration: 0.11, volume: 0.13, stagger: 0.045 });
  beep(2220, 0.09, 'sine', 0.05, 0.18);
}

// Losing a life: a falling alarm over a dull thud. Deliberately brief —
// it should register, not punish.
function sfxNeonHit(){
  beep(400, 0.15, 'sawtooth', 0.13);
  beep(260, 0.25, 'sawtooth', 0.13, 0.11);
  sfxImpact(0.4);
}
function sfxNeonBomb(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const duration = 0.55;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + duration);
  const gain = ctx.createGain();
  gain.gain.value = 0.34;
  noise.connect(filter).connect(gain).connect(audioOut());
  noise.start();
  beep(90, 0.3, 'sine', 0.2);
}

/* =========================================================
   SETUP / TEAMS (same pattern as every other game)
========================================================= */
let neonRowColors = [];

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('neonSetup', {
  prefix: 'neon',
  title: 'Neon Arena',
  steps: [
    'One team answers a question.',
    'Move with WASD or the arrow keys. Hold the mouse (or SPACE) to shoot.',
    'Survive and score for 20 seconds.'
  ],
  scoring: [
    { swatch: '<span class="neon-legend-swatch drifter"></span>', label: 'Drifter', points: '+1' },
    { swatch: '<span class="neon-legend-swatch zapper"></span>', label: 'Zapper', points: '+2' },
    { swatch: '<span class="neon-legend-swatch juggernaut"></span>', label: 'Juggernaut', points: '+3' },
    { swatch: '<span class="neon-legend-swatch warden"></span>', label: 'Warden', points: '+15', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch power"></span>', label: 'Power Core', points: 'shots pierce', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch overdrive"></span>', label: 'Overdrive', points: 'faster shots', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch spread"></span>', label: 'Spread Core', points: '5-way shot', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch bomb"></span>', label: 'Nova Bomb', points: 'clears the screen', tone: 'bonus' }
  ],
  tip: 'Touching an enemy costs a life. Fly over the glowing power-ups to collect them &mdash; each one lasts 10 seconds, and enemies sometimes drop them.'
});

export function renderNeonTeamInputs(count){
  renderTeamSetupRows('neonTeamInputs', 'neonAddTeamBtn', count, neonRowColors, renderNeonTeamInputs);
}
renderNeonTeamInputs(2);
wireAddTeamButton('neonTeamInputs', 'neonAddTeamBtn', renderNeonTeamInputs);

document.getElementById('neonStartBtn').addEventListener('click', () => {
  state.neonTeams = readTeamsFromSetup('neon', neonRowColors);
  state.neonCurrentTeam = 0;
  state.neonTurnsPlayed = 0;
  state.neonQuestionOrder = shuffle(NEON_QUESTIONS.map((_, i) => i));
  state.neonLives = NEON_MAX_LIVES;

  showGameScreen('neon');
  renderNeonScoreboard();
  renderNeonTurnBanner();
  renderNeonLives();
});

function renderNeonScoreboard(){
  renderTeamScoreboard('neonTeamList', state.neonTeams, state.neonCurrentTeam);
}
function renderNeonTurnBanner(){
  renderTurnBanner('neon', state.neonTeams[state.neonCurrentTeam], state.neonTurnsPlayed + 1, NEON_QUESTIONS.length);
}
function renderNeonLives(){
  document.getElementById('neonLivesDisplay').innerHTML = Array.from({ length: NEON_MAX_LIVES }, (_, i) =>
    `<span class="${i < state.neonLives ? '' : 'lost'}">♥</span>`
  ).join('');
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askNeonQuestion(){
  const qIndex = state.neonQuestionOrder[state.neonTurnsPlayed];
  const q = NEON_QUESTIONS[qIndex];
  return askTeamQuestion(q, NEON_QUESTIONS, state.neonTurnsPlayed);
}

function showNeonResult(){
  return showTurnResultModal('neonNextTeamBtn', { teams: state.neonTeams, currentTeamIndex: state.neonCurrentTeam });
}

document.getElementById('neonBeginTurnBtn').addEventListener('click', beginNeonTurn);
async function beginNeonTurn(){
  document.getElementById('neonBeginTurnBtn').disabled = true;
  await askNeonQuestion();
  startNeonRound();
}

/* =========================================================
   CANVAS SIZING
========================================================= */
// A sharper buffer than the shared 820px cap (2026-11-22: the arena was
// an 820x389 picture stretched over a whole board, which read as blurry
// and "squashed"). Measured at 2560x1440 with the CPU slowed 6x: 820px
// 57fps, 1024px 55fps, 1280px 40fps. 1024 it is. Lite mode still drops
// it to 70%.
//
// Opaque canvas (the arena backdrop covers it every frame). Between
// rounds it shows the arena rather than a cleared canvas, which on an
// opaque canvas would be black.
let neonLastW = 0;
const neonCanvasResizer = createCanvasResizer('neonCanvas', 'neonPlayArea', (canvas) => {
  // The arena's width in world units follows the screen's shape, so a
  // resize mid-round stretches everyone's x along with it.
  const W = worldW(canvas);
  if(neonLastW > 0 && Math.abs(W - neonLastW) > 0.01){
    const k = W / neonLastW;
    const scaleX = (o) => { o.x *= k; };
    scaleX(state.neonPlayer);
    state.neonEnemies.forEach(scaleX);
    state.neonPickups.forEach(scaleX);
    state.neonBullets.forEach(scaleX);
    state.neonShrapnel.forEach(s => { s.x *= k; s.originX *= k; });
    if(neonPointer.x != null) neonPointer.x *= k;
    if(neonTouchTarget) neonTouchTarget.x *= k;
  }
  neonLastW = W;
  if(!state.neonRoundActive) renderNeonBackground(neonCanvasResizer.getContext(), canvas);
}, { contextAttributes: { alpha: false }, maxBufferWidth: 1024 });
function resizeNeonCanvas(){ neonCanvasResizer.resize(); }
export function ensureNeonLayout(){
  if(state.neonTeams.length > 0) resizeNeonCanvas();
}
function worldW(canvas){ return canvas && canvas.height > 0 ? 100 * canvas.width / canvas.height : 190; }
function unitPx(canvas){ return canvas.height / 100; }
// Pixel-sized effects (sparks, float text, rings) scale with the buffer,
// relative to the old 820x389 buffer they were tuned on.
function neonScale(canvas){ return canvas.height / 430; }

/* =========================================================
   PARTICLES (in canvas pixels)
========================================================= */
function spawnNeonParticles(x, y, color, count = 18, scale = 1){
  count = particleCount(count); // lite mode: fewer per burst (js/quality.js)
  const s = scale * neonScale(neonCanvasResizer.getCanvas());
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 7 + 2) * s;
    state.neonParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.02 + 0.015, size: (Math.random() * 5 + 2) * s, color
    });
  }
}
function updateNeonParticles(k){
  stepParticles(state.neonParticles, k, { dragX: 0.97, dragY: 0.97 });
}
// World point to canvas pixels, for the pixel-space effects.
function toPx(canvas, x, y){ const u = unitPx(canvas); return { x: x * u, y: y * u }; }

/* =========================================================
   ENEMIES
========================================================= */
function edgeSpawnPoint(W, margin){
  const edge = Math.floor(Math.random() * 4);
  if(edge === 0) return { x: Math.random() * W, y: -margin };
  if(edge === 1) return { x: W + margin, y: Math.random() * 100 };
  if(edge === 2) return { x: Math.random() * W, y: 100 + margin };
  return { x: -margin, y: Math.random() * 100 };
}

function spawnNeonEnemy(W){
  const roll = Math.random();
  let type, r, hp, speed, points;
  if(roll < 0.14){ type = 'zapper'; r = 3.0; hp = 1; speed = 52 + Math.random() * 14; points = 2; }
  else if(roll < 0.36){ type = 'juggernaut'; r = 6.8; hp = 3; speed = 15 + Math.random() * 5; points = 3; }
  else { type = 'drifter'; r = 4.4; hp = 1; speed = 26 + Math.random() * 10; points = 1; }
  const p = edgeSpawnPoint(W, 8);
  state.neonEnemies.push({
    x: p.x, y: p.y, type, hp, maxHp: hp, speed, r, baseR: r,
    points, hitFlash: 0, dead: false, wobble: Math.random() * Math.PI * 2, kx: 0, ky: 0
  });
}

function spawnNeonWarden(){
  if(!state.neonRoundActive || state.neonBossSpawnedThisRound) return;
  state.neonBossSpawnedThisRound = true;
  const hp = 12, r = 11;
  const p = edgeSpawnPoint(worldW(neonCanvasResizer.getCanvas()), 14);
  state.neonEnemies.push({
    x: p.x, y: p.y, type: 'warden', hp, maxHp: hp, speed: 13 + Math.random() * 3,
    r, baseR: r, points: 15, hitFlash: 0, dead: false, wobble: 0, angle: 0, kx: 0, ky: 0
  });
}
function scheduleNeonWarden(){
  // ~40% chance a Warden appears, at a random point in the middle of the
  // round — same probability/timing shape as Star Defender's boss.
  if(Math.random() > 0.40) return;
  const delay = 4000 + Math.random() * (NEON_ROUND_SECONDS * 1000 - 9000);
  state.neonBossTimeout = setTimeout(spawnNeonWarden, delay);
}
function clearNeonBossTimeout(){
  if(state.neonBossTimeout) clearTimeout(state.neonBossTimeout);
  state.neonBossTimeout = null;
}

function updateNeonEnemyMovement(e, dtSec){
  e.wobble += dtSec * 3;
  const dx = state.neonPlayer.x - e.x, dy = state.neonPlayer.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  const px = -ny, py = nx; // perpendicular, for an organic wandering wobble
  const wobbleAmt = Math.sin(e.wobble) * 0.4;
  e.x += (nx + px * wobbleAmt) * e.speed * dtSec + e.kx * dtSec;
  e.y += (ny + py * wobbleAmt) * e.speed * dtSec + e.ky * dtSec;
  // Knockback from a hit fades out over about a fifth of a second.
  const fade = Math.pow(0.0005, dtSec);
  e.kx *= fade; e.ky *= fade;
}

/* =========================================================
   PICKUPS (timed power-ups)
========================================================= */
function spawnNeonPickup(W, at){
  if(state.neonPickups.length >= NEON_PICKUP_MAX) return;
  const r = Math.random();
  const type = r < 0.27 ? 'power' : r < 0.54 ? 'overdrive' : r < 0.81 ? 'spread' : 'bomb';
  const pos = at || { x: W * 0.08 + Math.random() * W * 0.84, y: 10 + Math.random() * 80 };
  state.neonPickups.push({ x: pos.x, y: pos.y, collected: false, type, spawnedAt: performance.now() });
}

function powerLeft(until, now){ return Math.max(0, until - now); }
function hasPower(now){ return now < state.neonPowerUntil; }
function hasOverdrive(now){ return now < state.neonOverdriveUntil; }
function hasSpread(now){ return now < state.neonSpreadUntil; }

// A ring of shrapnel flies outward from the bomb and has to reach an
// enemy to destroy it, piercing through several on the way.
function triggerNeonNovaBomb(x, y, canvas){
  for(let i = 0; i < NEON_SHRAPNEL_COUNT; i++){
    const angle = (Math.PI * 2 * i) / NEON_SHRAPNEL_COUNT + (Math.random() * 0.3 - 0.15);
    state.neonShrapnel.push({
      x, y, originX: x, originY: y,
      vx: Math.cos(angle) * NEON_SHRAPNEL_SPEED,
      vy: Math.sin(angle) * NEON_SHRAPNEL_SPEED
    });
  }
  const p = toPx(canvas, x, y);
  spawnNeonParticles(p.x, p.y, NEON_BOMB_COLOR, 60, 2.2);
  triggerShake(neonShake, 7);
  sfxNeonBomb();
}

function killNeonEnemy(e, canvas){
  e.dead = true;
  state.neonScore += e.points;
  document.getElementById('neonScoreDisplay').textContent = String(state.neonScore);
  const p = toPx(canvas, e.x, e.y);
  const count = e.type === 'warden' ? 50 : e.type === 'juggernaut' ? 34 : 20;
  spawnNeonParticles(p.x, p.y, neonEnemyColor(e.type), count, e.type === 'warden' ? 1.8 : 1);
  spawnFloatText(neonFloatTexts, p.x, p.y, `+${e.points}`, neonEnemyColor(e.type));
  sfxNeonDestroy(e.type === 'warden' ? 1.4 : e.type === 'juggernaut' ? 1 : 0.5);
  triggerShake(neonShake, e.type === 'warden' ? 10 : e.type === 'juggernaut' ? 5 : 2);
  if(e.type === 'warden') spawnShockwave(neonShockwaves, p.x, p.y, neonEnemyColor(e.type), { big: true });
  // Sometimes a power-up drops where it died (a Warden always drops one).
  if(e.type === 'warden' || Math.random() < NEON_DROP_CHANCE){
    const W = worldW(canvas);
    spawnNeonPickup(W, { x: Math.max(4, Math.min(W - 4, e.x)), y: Math.max(6, Math.min(94, e.y)) });
  }
}

function updateNeonShrapnel(dtSec, canvas){
  state.neonShrapnel.forEach(s => { s.x += s.vx * dtSec; s.y += s.vy * dtSec; });
  state.neonShrapnel = state.neonShrapnel.filter(s => Math.hypot(s.x - s.originX, s.y - s.originY) < NEON_SHRAPNEL_MAX_DIST);
  for(const s of state.neonShrapnel){
    for(const e of state.neonEnemies){
      if(e.dead) continue;
      if(Math.hypot(s.x - e.x, s.y - e.y) < NEON_SHRAPNEL_HIT_R + e.r) killNeonEnemy(e, canvas);
    }
  }
  state.neonEnemies = state.neonEnemies.filter(e => !e.dead);
}

function collectNeonPickup(pu, canvas){
  const p = toPx(canvas, pu.x, pu.y);
  spawnNeonParticles(p.x, p.y, neonPickupColor(pu.type), 22, 1);
  sfxNeonPickup();
  const until = performance.now() + NEON_POWERUP_MS;
  if(pu.type === 'power') state.neonPowerUntil = until;
  else if(pu.type === 'overdrive') state.neonOverdriveUntil = until;
  else if(pu.type === 'spread') state.neonSpreadUntil = until;
  else if(pu.type === 'bomb') triggerNeonNovaBomb(pu.x, pu.y, canvas);
  const label = pu.type === 'power' ? 'POWER!' : pu.type === 'overdrive' ? 'OVERDRIVE!' : pu.type === 'spread' ? 'SPREAD!' : 'BOOM!';
  spawnFloatText(neonFloatTexts, p.x, p.y - 20 * neonScale(canvas), label, neonPickupColor(pu.type));
}

/* =========================================================
   LIFE-LOST FEEDBACK — identical technique to Star Defender's
   triggerLifeLostFeedback, plus a canvas shake bigger than any kill.
========================================================= */
function triggerNeonLifeLostFeedback(){
  const playArea = document.getElementById('neonPlayArea');
  const livesEl = document.getElementById('neonLivesDisplay');
  playArea.classList.remove('life-lost');
  void playArea.offsetWidth;
  playArea.classList.add('life-lost');
  setTimeout(() => playArea.classList.remove('life-lost'), 620);
  livesEl.classList.remove('pulse');
  void livesEl.offsetWidth;
  livesEl.classList.add('pulse');
  setTimeout(() => livesEl.classList.remove('pulse'), 720);
  triggerShake(neonShake, 8);
}

/* =========================================================
   INPUT
   Keyboard: WASD / arrows move, SPACE fires where the ship faces.
   Mouse: the ship always faces the pointer; hold the button to keep
   firing. Touch: the finger is both where the ship heads and what it
   fires at, for as long as it's held down.
========================================================= */
const neonKeysDown = {};
let neonTouchTarget = null;
let neonAimAngle = -Math.PI / 2;
// The pointer in world units (x null until it's been over the arena),
// and whether a mouse button / finger / SPACE is holding the trigger.
const neonPointer = { x: null, y: null, down: false };
let neonSpaceDown = false;
let neonMuzzleUntil = 0;

window.addEventListener('keydown', (e) => {
  if(!state.neonRoundActive) return;
  const tag = e.target.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)){
    neonKeysDown[k] = true;
    e.preventDefault();
  } else if(k === ' '){
    if(!neonSpaceDown) tryNeonShot(true);
    neonSpaceDown = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if(k === ' ') neonSpaceDown = false;
  else neonKeysDown[k] = false;
});

const neonPlayAreaEl = document.getElementById('neonPlayArea');
function neonPointFromEvent(clientX, clientY){
  const canvas = neonCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const W = worldW(canvas);
  return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * 100 };
}

neonPlayAreaEl.addEventListener('pointermove', (e) => {
  const pt = neonPointFromEvent(e.clientX, e.clientY);
  neonPointer.x = pt.x; neonPointer.y = pt.y;
  if(e.pointerType === 'touch' && neonPointer.down) neonTouchTarget = pt;
});
neonPlayAreaEl.addEventListener('pointerdown', (e) => {
  if(!state.neonRoundActive) return;
  const pt = neonPointFromEvent(e.clientX, e.clientY);
  neonPointer.x = pt.x; neonPointer.y = pt.y;
  neonPointer.down = true;
  if(e.pointerType === 'touch') neonTouchTarget = pt;
  tryNeonShot(true);
  e.preventDefault();
});
function releaseNeonTrigger(){ neonPointer.down = false; neonTouchTarget = null; }
window.addEventListener('pointerup', releaseNeonTrigger);
window.addEventListener('pointercancel', releaseNeonTrigger);
window.addEventListener('blur', () => { releaseNeonTrigger(); neonSpaceDown = false; });
// Touch-scrolling the page mid-round would steal the drag.
neonPlayAreaEl.addEventListener('touchstart', (e) => { if(state.neonRoundActive) e.preventDefault(); }, { passive: false });

// Where the ship aims: at the pointer if there is one, otherwise the way
// it last faced (so SPACE fires straight ahead for keyboard players).
function updateNeonAim(){
  if(neonPointer.x != null){
    const dx = neonPointer.x - state.neonPlayer.x, dy = neonPointer.y - state.neonPlayer.y;
    if(Math.hypot(dx, dy) > 1) neonAimAngle = Math.atan2(dy, dx);
  }
}

// Nudges an aim onto the nearest enemy within NEON_AIM_ASSIST of it.
function assistedAngle(angle){
  let best = null, bestDiff = NEON_AIM_ASSIST;
  for(const e of state.neonEnemies){
    if(e.dead) continue;
    const a = Math.atan2(e.y - state.neonPlayer.y, e.x - state.neonPlayer.x);
    let diff = Math.abs(a - angle);
    if(diff > Math.PI) diff = Math.PI * 2 - diff;
    if(diff < bestDiff){ bestDiff = diff; best = a; }
  }
  return best === null ? angle : best;
}

// `fresh` = a new press (always fires unless a shot went out a moment
// ago); otherwise it's the held-trigger cadence.
function tryNeonShot(fresh){
  if(!state.neonRoundActive) return;
  const now = performance.now();
  const gap = fresh ? NEON_TAP_MIN_MS : (hasOverdrive(now) ? NEON_FIRE_MS_OVERDRIVE : NEON_FIRE_MS);
  if(now - state.neonLastShotAt < gap) return;
  state.neonLastShotAt = now;
  updateNeonAim();
  const base = assistedAngle(neonAimAngle);
  const pellets = hasSpread(now) ? NEON_SPREAD_PELLETS : 1;
  const speed = hasOverdrive(now) ? NEON_BULLET_SPEED_OVERDRIVE : NEON_BULLET_SPEED;
  const power = hasPower(now);
  const nose = NEON_PLAYER_R * 1.1;
  for(let i = 0; i < pellets; i++){
    const a = pellets === 1 ? base : base - NEON_SPREAD_ARC / 2 + (NEON_SPREAD_ARC * i / (pellets - 1));
    state.neonBullets.push({
      x: state.neonPlayer.x + Math.cos(a) * nose, y: state.neonPlayer.y + Math.sin(a) * nose,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      power, pierce: power ? NEON_POWER_PIERCE : 0, hitIds: null, dead: false
    });
  }
  neonMuzzleUntil = now + 60;
  sfxNeonShot();
}

function updateNeonPlayerMovement(dtSec, W){
  let dx = 0, dy = 0;
  if(neonKeysDown['w'] || neonKeysDown['arrowup']) dy -= 1;
  if(neonKeysDown['s'] || neonKeysDown['arrowdown']) dy += 1;
  if(neonKeysDown['a'] || neonKeysDown['arrowleft']) dx -= 1;
  if(neonKeysDown['d'] || neonKeysDown['arrowright']) dx += 1;
  if(neonTouchTarget){
    const tdx = neonTouchTarget.x - state.neonPlayer.x, tdy = neonTouchTarget.y - state.neonPlayer.y;
    const tdist = Math.hypot(tdx, tdy);
    if(tdist > 3){ dx += tdx / tdist; dy += tdy / tdist; }
  }
  const mag = Math.hypot(dx, dy);
  if(mag > 0){
    state.neonPlayer.x += (dx / mag) * NEON_PLAYER_SPEED * dtSec;
    state.neonPlayer.y += (dy / mag) * NEON_PLAYER_SPEED * dtSec;
    // No pointer to face (keyboard only): face the way it's moving.
    if(neonPointer.x == null) neonAimAngle = Math.atan2(dy, dx);
  }
  state.neonPlayer.x = Math.max(NEON_PLAYER_R, Math.min(W - NEON_PLAYER_R, state.neonPlayer.x));
  state.neonPlayer.y = Math.max(NEON_PLAYER_R, Math.min(100 - NEON_PLAYER_R, state.neonPlayer.y));
}

/* =========================================================
   PHYSICS / GAME TICK
========================================================= */
// Contact ALWAYS destroys the touching enemy, even during the post-hit
// invulnerability window — only whether it also costs a life depends on
// `wasInvuln`, so enemies never sit overlapping the ship.
function checkNeonPlayerCollisions(canvas){
  const now = performance.now();
  const wasInvuln = now < state.neonInvulnUntil;
  let tookHit = false;
  for(const e of state.neonEnemies){
    if(e.dead) continue;
    const dx = state.neonPlayer.x - e.x, dy = state.neonPlayer.y - e.y;
    if(Math.hypot(dx, dy) < NEON_PLAYER_R + e.r * 0.85){
      e.dead = true; // no points for a collision, only for a shot
      const safe = wasInvuln || tookHit;
      const p = toPx(canvas, e.x, e.y);
      spawnNeonParticles(p.x, p.y, safe ? '#FFFFFF' : '#FF3B3B', safe ? 14 : 24, safe ? 0.8 : 1.2);
      if(!safe){
        tookHit = true;
        state.neonLives = Math.max(0, state.neonLives - 1);
        renderNeonLives();
        triggerNeonLifeLostFeedback();
        state.neonInvulnUntil = now + 1000;
        if(state.neonLives > 0) sfxNeonHit();
      }
    }
  }
  state.neonEnemies = state.neonEnemies.filter(e => !e.dead);
}

const KNOCKBACK = { drifter: 70, zapper: 60, juggernaut: 34, warden: 12 };
function updateNeonBullets(dtSec, canvas, W){
  for(const b of state.neonBullets){
    b.x += b.vx * dtSec; b.y += b.vy * dtSec;
    if(b.x < -8 || b.x > W + 8 || b.y < -8 || b.y > 108){ b.dead = true; continue; }
    const hitR = b.power ? NEON_BULLET_R_POWER : NEON_BULLET_R;
    for(const e of state.neonEnemies){
      if(e.dead || (b.hitIds && b.hitIds.includes(e))) continue;
      if(Math.hypot(b.x - e.x, b.y - e.y) >= hitR + e.r) continue;
      e.hp -= b.power ? 2 : 1;
      e.hitFlash = 1;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      e.kx += (b.vx / sp) * KNOCKBACK[e.type];
      e.ky += (b.vy / sp) * KNOCKBACK[e.type];
      const p = toPx(canvas, b.x, b.y);
      spawnNeonParticles(p.x, p.y, neonEnemyColor(e.type), 8, 0.7);
      if(e.hp <= 0) killNeonEnemy(e, canvas);
      else { e.r = e.baseR * (0.6 + 0.4 * (e.hp / e.maxHp)); sfxNeonHitEnemy(); }
      if(b.pierce > 0){ b.pierce--; (b.hitIds = b.hitIds || []).push(e); }
      else { b.dead = true; break; }
    }
  }
  state.neonBullets = state.neonBullets.filter(b => !b.dead);
  state.neonEnemies = state.neonEnemies.filter(e => !e.dead);
}

function updateNeonGame(dt){
  const dtSec = Math.min(0.05, dt / 1000);
  const canvas = neonCanvasResizer.getCanvas();
  const W = worldW(canvas);

  updateNeonPlayerMovement(dtSec, W);
  updateNeonAim();
  if(neonPointer.down || neonSpaceDown) tryNeonShot(false);

  state.neonEnemies.forEach(e => {
    updateNeonEnemyMovement(e, dtSec);
    if(e.hitFlash > 0) e.hitFlash -= dtSec * 4;
    if(e.type === 'warden') e.angle += dtSec * 0.6;
  });

  updateNeonBullets(dtSec, canvas, W);
  updateNeonShrapnel(dtSec, canvas);
  checkNeonPlayerCollisions(canvas);

  const now = performance.now();
  for(const pu of state.neonPickups){
    if(pu.collected) continue;
    if(Math.hypot(state.neonPlayer.x - pu.x, state.neonPlayer.y - pu.y) < NEON_PLAYER_R + NEON_PICKUP_R + 1){
      pu.collected = true;
      collectNeonPickup(pu, canvas);
    }
  }
  state.neonPickups = state.neonPickups.filter(pu => !pu.collected && (now - pu.spawnedAt) < NEON_PICKUP_LIFE_MS);

  const k = frameFactor(dt);
  updateNeonParticles(k);
  neonFloatTexts = updateFloatTexts(neonFloatTexts, k);
  neonShockwaves = updateShockwaves(neonShockwaves);
}

/* =========================================================
   RENDERING
========================================================= */
/* The arena floor, horizon glow and star layer never change between
   resizes, so they're rasterised once and blitted (js/canvasGlow.js).
   The blit is opaque and full-canvas, so it also replaces clearRect. */
const renderNeonBackground = createBackdrop((ctx, w, h) => {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0B0620');
  bg.addColorStop(0.55, '#140A30');
  bg.addColorStop(1, '#03020A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const horizonY = h * 0.5;
  const band = h * 0.1;
  const glow = ctx.createLinearGradient(0, horizonY - band, 0, horizonY + band);
  glow.addColorStop(0, 'rgba(255,46,154,0)');
  glow.addColorStop(0.5, 'rgba(255,46,154,0.35)');
  glow.addColorStop(1, 'rgba(255,46,154,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizonY - band, w, band * 2);

  // Perspective floor grid, brightening toward the viewer. Line widths
  // follow the buffer size so a sharper buffer doesn't thin them out.
  const lw = Math.max(1, h / 400);
  const vanishX = w / 2;
  ctx.lineWidth = lw;
  for(let i = 1; i <= 10; i++){
    const t = i / 10;
    const y = horizonY + t * t * (h - horizonY);
    ctx.strokeStyle = `rgba(182,255,60,${0.08 + t * 0.22})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(182,255,60,0.16)';
  ctx.beginPath();
  for(let i = -8; i <= 8; i++){
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(vanishX + i * h * 0.19, h);
  }
  ctx.stroke();

  // Skyline silhouette along the horizon.
  ctx.fillStyle = 'rgba(8,4,24,0.9)';
  let bx = 0;
  let seed = 1;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  while(bx < w){
    const bw = h * (0.06 + rnd() * 0.1);
    const bh = h * (0.04 + rnd() * 0.11);
    ctx.fillRect(bx, horizonY - bh, bw, bh);
    bx += bw + h * 0.024;
  }

  // Stars, above the horizon only.
  ctx.fillStyle = '#fff';
  const starR = h / 400;
  for(let i = 0; i < 90; i++){
    const sx = rnd() * w, sy = rnd() * horizonY * 0.92;
    ctx.globalAlpha = 0.2 + rnd() * 0.5;
    ctx.beginPath(); ctx.arc(sx, sy, (rnd() * 1.3 + 0.3) * starR, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
});

function drawNeonPickup(ctx, u, pu, now){
  const x = pu.x * u, y = pu.y * u;
  const left = NEON_PICKUP_LIFE_MS - (now - pu.spawnedAt);
  // Blinks in its last two seconds so the class knows to grab it.
  if(left < 2000 && Math.floor(now / 120) % 2 === 0) return;
  const pulse = 0.75 + 0.25 * Math.sin(now / 160);
  const bob = Math.sin(now / 300 + pu.spawnedAt) * 0.4 * u;
  const color = neonPickupColor(pu.type);
  const r = NEON_PICKUP_R * u;
  drawGlow(ctx, x, y + bob, r * 2.6, color, pulse * 0.55, 1.6);
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = color; ctx.strokeStyle = color;
  if(pu.type === 'power'){
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
    ctx.closePath(); ctx.fill();
  } else if(pu.type === 'overdrive'){
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r); ctx.lineTo(r * 0.5, -r * 0.15); ctx.lineTo(0, -r * 0.15);
    ctx.lineTo(r * 0.3, r); ctx.lineTo(-r * 0.5, r * 0.15); ctx.lineTo(0, r * 0.15);
    ctx.closePath(); ctx.fill();
  } else if(pu.type === 'spread'){
    ctx.beginPath();
    for(const i of [-1, 0, 1]){
      ctx.moveTo(i * r * 0.65 + r * 0.32, -Math.abs(i) * r * 0.3);
      ctx.arc(i * r * 0.65, -Math.abs(i) * r * 0.3, r * 0.32, 0, Math.PI * 2);
    }
    ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(1.5, u * 0.4); ctx.globalAlpha = pulse * 0.8;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1a0505';
    ctx.fillRect(-r * 0.35, -r * 0.08, r * 0.7, r * 0.16);
    ctx.fillRect(-r * 0.08, -r * 0.35, r * 0.16, r * 0.7);
  }
  ctx.restore();
}

function drawNeonEnemy(ctx, u, e, now){
  const x = e.x * u, y = e.y * u;
  const r = e.r * u;
  const baseColor = neonEnemyColor(e.type);
  drawGlow(ctx, x, y, r * (e.type === 'warden' ? 2.6 : 2.0), baseColor, 0.45 + e.hitFlash * 0.4, 1.7);
  ctx.save();
  ctx.fillStyle = e.hitFlash > 0.05 ? '#ffffff' : baseColor;
  ctx.beginPath();
  if(e.type === 'warden'){
    const spikes = 8;
    for(let i = 0; i < spikes * 2; i++){
      const ang = (Math.PI / spikes) * i + e.angle;
      const rad = i % 2 === 0 ? r : r * 0.5;
      const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if(e.type === 'juggernaut'){
    for(let i = 0; i < 6; i++){
      const ang = (Math.PI / 3) * i - Math.PI / 2;
      const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if(e.type === 'zapper'){
    ctx.moveTo(x - r * 0.15, y - r * 1.5);
    ctx.lineTo(x + r * 0.85, y - r * 0.25);
    ctx.lineTo(x + r * 0.2, y - r * 0.1);
    ctx.lineTo(x + r * 0.5, y + r * 1.5);
    ctx.lineTo(x - r * 0.85, y + r * 0.1);
    ctx.lineTo(x - r * 0.2, y - r * 0.05);
  } else {
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r * 0.62, y - r * 0.62, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.62, y + r * 0.62, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.62, y + r * 0.62, x - r, y);
    ctx.quadraticCurveTo(x - r * 0.62, y - r * 0.62, x, y - r);
  }
  ctx.closePath();
  ctx.fill();

  if(e.hitFlash <= 0.05 && (e.type === 'drifter' || e.type === 'zapper')){
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, r * (e.type === 'zapper' ? 0.18 : 0.3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if(e.type === 'warden' && e.hitFlash < 0.05){
    const pulse = 0.6 + 0.4 * Math.sin(now / 220);
    drawGlow(ctx, x, y, r * 0.95, '#ffffff', pulse * 0.55, 1.9);
    ctx.save();
    ctx.globalAlpha = pulse; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y, r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  if(e.maxHp > 1){
    if(e.type === 'warden'){
      const bw = r * 2.2, bh = Math.max(4, u * 1.1), bx = x - bw / 2, by = y - r - u * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.hitFlash > 0.05 ? '#fff' : baseColor;
      ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
    } else {
      const gap = u * 1.4, dot = Math.max(1.5, u * 0.45), startX = x - ((e.maxHp - 1) * gap) / 2;
      for(let i = 0; i < e.maxHp; i++){
        ctx.beginPath();
        ctx.fillStyle = i < e.hp ? '#ffffff' : 'rgba(255,255,255,0.28)';
        ctx.arc(startX + i * gap, y - r - u * 1.8, dot, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

// Swept-wing jet with a flickering thruster; it always faces its aim.
// A shot kicks it back a touch and flashes the nose.
function drawNeonPlayer(ctx, u, now){
  const r = NEON_PLAYER_R * u;
  const recoil = now < neonMuzzleUntil ? (neonMuzzleUntil - now) / 60 * r * 0.25 : 0;
  const x = state.neonPlayer.x * u - Math.cos(neonAimAngle) * recoil;
  const y = state.neonPlayer.y * u - Math.sin(neonAimAngle) * recoil;
  const invuln = now < state.neonInvulnUntil;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(neonAimAngle);
  if(invuln && Math.floor(now / 100) % 2 === 0) ctx.globalAlpha = 0.35;

  const flick = 0.75 + 0.25 * Math.sin(now / 38);
  const flick2 = 0.7 + 0.3 * Math.sin(now / 64 + 1.1);
  ctx.fillStyle = '#FF8A3D';
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.34);
  ctx.lineTo(-r * (0.95 + 0.8 * flick), 0);
  ctx.lineTo(-r * 0.4, r * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFE066';
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.17);
  ctx.lineTo(-r * (0.8 + 0.5 * flick2), 0);
  ctx.lineTo(-r * 0.4, r * 0.17);
  ctx.closePath();
  ctx.fill();

  drawGlow(ctx, 0, 0, r * 2.4, NEON_PLAYER_COLOR, 0.42, 1.7);
  ctx.fillStyle = NEON_PLAYER_COLOR;
  ctx.beginPath();
  ctx.moveTo(r * 1.15, 0);
  ctx.lineTo(r * 0.15, r * 0.5);
  ctx.lineTo(-r * 0.85, r * 0.95);
  ctx.lineTo(-r * 0.4, r * 0.2);
  ctx.lineTo(-r * 0.4, -r * 0.2);
  ctx.lineTo(-r * 0.85, -r * 0.95);
  ctx.lineTo(r * 0.15, -r * 0.5);
  ctx.closePath();
  ctx.fill();
  if(now < neonMuzzleUntil){
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(r * 1.3, 0, r * 0.38, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Every bullet of one kind in a single path: one wide faint stroke for
// the glow and one thin bright stroke for the core, plus a dot for the
// head. A trail is the distance the bolt covers in 35ms.
function drawNeonBullets(ctx, u, list, color, core, width){
  if(!list.length) return;
  ctx.beginPath();
  for(const b of list){
    ctx.moveTo((b.x - b.vx * 0.035) * u, (b.y - b.vy * 0.035) * u);
    ctx.lineTo(b.x * u, b.y * u);
  }
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 2.2 * u;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = core;
  ctx.lineWidth = width * u;
  ctx.stroke();
}

function renderNeonCanvas(){
  const canvas = neonCanvasResizer.getCanvas();
  if(!canvas || canvas.height === 0) return;
  const ctx = neonCanvasResizer.getContext();
  const u = unitPx(canvas);
  const scale = neonScale(canvas);
  const now = performance.now();

  ctx.save();
  applyShake(ctx, neonShake);
  renderNeonBackground(ctx, canvas);

  for(const pu of state.neonPickups) drawNeonPickup(ctx, u, pu, now);
  for(const e of state.neonEnemies) drawNeonEnemy(ctx, u, e, now);

  ctx.save();
  drawNeonBullets(ctx, u, state.neonBullets.filter(b => !b.power), NEON_PLAYER_COLOR, '#F4FFE0', 0.45);
  drawNeonBullets(ctx, u, state.neonBullets.filter(b => b.power), NEON_POWER_COLOR, '#FFFBE0', 0.65);
  drawNeonBullets(ctx, u, state.neonShrapnel, NEON_BOMB_COLOR, '#FFC48A', 0.7);
  ctx.restore();

  // Batched and additive: no per-particle save/restore and no shadow.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(const p of state.neonParticles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  drawShockwaves(ctx, neonShockwaves, scale);
  drawFloatTexts(ctx, neonFloatTexts, Math.max(16, 22 * scale));

  drawNeonPlayer(ctx, u, now);
  ctx.restore(); // the shake

  drawNeonPowerBar(ctx, canvas, scale, now);
}

// The active power-ups along the top, each with a bar draining over its
// ten seconds. Drawn outside the shake so it stays readable.
function drawNeonPowerBar(ctx, canvas, scale, now){
  const active = [
    ['POWER', NEON_POWER_COLOR, powerLeft(state.neonPowerUntil, now)],
    ['OVERDRIVE', NEON_OVERDRIVE_COLOR, powerLeft(state.neonOverdriveUntil, now)],
    ['SPREAD', NEON_SPREAD_COLOR, powerLeft(state.neonSpreadUntil, now)]
  ].filter(a => a[2] > 0);
  if(!active.length) return;
  const w = 120 * scale, h = 26 * scale, gap = 10 * scale;
  let x = canvas.width / 2 - (active.length * w + (active.length - 1) * gap) / 2;
  const y = canvas.height - h - 14 * scale;
  ctx.save();
  ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(const [label, color, left] of active){
    ctx.fillStyle = 'rgba(8,4,24,0.75)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y + h - 4 * scale, w * (left / NEON_POWERUP_MS), 4 * scale);
    ctx.globalAlpha = left < 2000 && Math.floor(now / 150) % 2 === 0 ? 0.4 : 1;
    ctx.fillText(label, x + w / 2, y + h / 2 - 2 * scale);
    ctx.globalAlpha = 1;
    x += w + gap;
  }
  ctx.restore();
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startNeonRound(){
  cancelNeonRound();
  state.neonRoundActive = true;
  state.neonScore = 0;
  state.neonLives = NEON_MAX_LIVES;
  document.getElementById('neonPlayArea').classList.remove('idle');
  document.getElementById('neonHint').classList.remove('hidden');
  resizeNeonCanvas();
  const W0 = worldW(neonCanvasResizer.getCanvas());
  neonLastW = W0;
  state.neonPlayer = { x: W0 / 2, y: 55 };
  state.neonBullets = [];
  state.neonShrapnel = [];
  state.neonEnemies = [];
  state.neonPickups = [];
  state.neonParticles = [];
  neonFloatTexts = [];
  neonShockwaves = [];
  neonShake = createShakeState();
  state.neonPowerUntil = 0;
  state.neonOverdriveUntil = 0;
  state.neonSpreadUntil = 0;
  state.neonLastShotAt = 0;
  state.neonInvulnUntil = 0;
  state.neonBossSpawnedThisRound = false;
  neonTouchTarget = null;
  neonPointer.x = null; neonPointer.y = null; neonPointer.down = false;
  neonSpaceDown = false;
  neonAimAngle = -Math.PI / 2;
  Object.keys(neonKeysDown).forEach(k => neonKeysDown[k] = false);

  document.getElementById('neonScoreDisplay').textContent = '0';
  document.getElementById('neonTimeDisplay').textContent = NEON_ROUND_SECONDS;
  setTimerFill(document.getElementById('neonTimerFill'), 1);
  renderNeonLives();

  const playArea = document.getElementById('neonPlayArea');
  playArea.classList.remove('idle');
  document.getElementById('neonHint').classList.remove('hidden');
  scheduleNeonWarden();

  const between = (range) => range[0] + Math.random() * (range[1] - range[0]);
  let nextEnemyAt = 600;
  let nextPickupAt = between(NEON_PICKUP_FIRST_MS);
  const start = performance.now();
  let lastTime = start;
  const updateTimerHud = createTimerHud(document.getElementById('neonTimeDisplay'), document.getElementById('neonTimerFill'), NEON_ROUND_SECONDS);

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    noteFrame();
    lastTime = now;
    const elapsedMs = now - start;
    const remaining = Math.max(0, NEON_ROUND_SECONDS - elapsedMs / 1000);
    updateTimerHud(remaining);

    const W = worldW(neonCanvasResizer.getCanvas());
    if(elapsedMs >= nextEnemyAt){ spawnNeonEnemy(W); nextEnemyAt = elapsedMs + (560 + Math.random() * 520); }
    if(elapsedMs >= nextPickupAt){ spawnNeonPickup(W); nextPickupAt = elapsedMs + between(NEON_PICKUP_GAP_MS); }

    updateNeonGame(dt);
    renderNeonCanvas();

    if(remaining <= 0){ finishNeonRound(); return; }
    state.neonRoundRAF = requestAnimationFrame(tick);
  }
  state.neonRoundRAF = requestAnimationFrame(tick);
}

export function cancelNeonRound(){
  if(state.neonRoundRAF) cancelAnimationFrame(state.neonRoundRAF);
  state.neonRoundRAF = null;
  clearNeonBossTimeout();
  releaseNeonTrigger();
  neonSpaceDown = false;
  neonFloatTexts = [];
  neonShockwaves = [];
  Object.keys(neonKeysDown).forEach(k => neonKeysDown[k] = false);
  if(state.neonRoundActive){
    state.neonRoundActive = false;
    const playArea = document.getElementById('neonPlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('neonHint');
    if(hint) hint.classList.add('hidden');
    const canvas = neonCanvasResizer.getCanvas();
    if(canvas) renderNeonBackground(neonCanvasResizer.getContext(), canvas);
    const beginBtn = document.getElementById('neonBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishNeonRound(){
  state.neonRoundActive = false;
  state.neonRoundRAF = null;
  clearNeonBossTimeout();
  releaseNeonTrigger();
  neonSpaceDown = false;

  const playArea = document.getElementById('neonPlayArea');
  playArea.classList.add('idle');
  document.getElementById('neonHint').classList.add('hidden');

  const team = state.neonTeams[state.neonCurrentTeam];
  team.total += state.neonScore;
  state.neonTurnsPlayed++;
  renderNeonScoreboard();

  showNeonResult().then(() => {
    if(state.neonTurnsPlayed >= NEON_QUESTIONS.length){
      endNeonGame();
    } else {
      state.neonCurrentTeam = (state.neonCurrentTeam + 1) % state.neonTeams.length;
      renderNeonScoreboard();
      renderNeonTurnBanner();
      document.getElementById('neonBeginTurnBtn').disabled = false;
      document.getElementById('neonTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('neonTimerFill'), 1);
    }
  });
}

function endNeonGame(){
  const winnerText = finishTeamGame({ prefix: 'neon', teams: state.neonTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('neonTurnBanner').innerHTML = `All done — ${winnerText}`;
}

// For the automated tests only.
export function debugNeonInternals(){
  const canvas = neonCanvasResizer.getCanvas();
  return {
    W: worldW(canvas), bullets: state.neonBullets.length, pickups: state.neonPickups.length,
    player: { ...state.neonPlayer }, lastShotAt: state.neonLastShotAt
  };
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'neon',
  getTeams: () => state.neonTeams,
  renderScoreboard: renderNeonScoreboard,
  cancelRound: cancelNeonRound
});

document.getElementById('neonBackBtn').addEventListener('click', () => goToStage(14));
// Wired here (the target stage's own file), not in stage10 — same
// existing convention as qsNextStageBtn: a "Next" button's click
// handler lives in the file for the stage it goes TO.
document.getElementById('billiardsNextStageBtn').addEventListener('click', () => goToStage(15));
