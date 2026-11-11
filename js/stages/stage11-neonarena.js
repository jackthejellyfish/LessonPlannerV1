import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, beep, audioOut } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { NEON_QUESTIONS } from '../content/stage11-neonarena.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves } from '../canvasEffects.js';

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
function triggerNeonKillFeedback(e, canvas){
  triggerShake(neonShake, e.type === 'warden' ? 10 : e.type === 'juggernaut' ? 5 : 2);
  if(e.type === 'warden'){
    spawnShockwave(neonShockwaves, (e.x / 100) * canvas.width, (e.y / 100) * canvas.height, neonEnemyColor(e.type), { big: true });
  }
}

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
const NEON_ROUND_SECONDS = 20;
const NEON_MAX_LIVES = 3;
const NEON_FIRE_COOLDOWN = 180; // ms between shots
const NEON_PLAYER_SPEED = 46;   // %/second
// Everything below is sized smaller than the original pass — feedback was
// that the arena felt "very cramped" with the player, enemies, and
// projectiles all fighting for the same small patch of space. Player and
// bullets shrunk again (2026-07-16) — bullets specifically also switched
// from plain circles to an elongated tracer shape (see renderNeonCanvas),
// so they read as actual bullets, not thrown balls.
const NEON_PLAYER_RADIUS_PCT = 1.7;
const NEON_BULLET_SPEED_BASE = 95; // %/second
const NEON_BULLET_RADIUS_PCT = 0.55;      // normal shot
const NEON_BULLET_RADIUS_BIG_PCT = 0.85;  // Power Core shot

const NEON_PLAYER_COLOR = '#B6FF3C';
const NEON_DRIFTER_COLOR = '#FF3EA5';
const NEON_ZAPPER_COLOR = '#00E5FF';
const NEON_JUGGERNAUT_COLOR = '#7B5CFF';
const NEON_WARDEN_COLOR = '#FF7A18';
const NEON_POWER_COLOR = '#FFE94A';
const NEON_OVERDRIVE_COLOR = '#3EC1FF';
const NEON_SPREAD_COLOR = '#FF5CF4';
const NEON_BOMB_COLOR = '#FF3B3B';
// Nova Bomb shrapnel (2026-07-16 rework) — see triggerNeonNovaBomb.
const NEON_SHRAPNEL_COUNT = 18;
const NEON_SHRAPNEL_SPEED = 95;    // %/second, matches the base bullet speed
const NEON_SHRAPNEL_MAX_DIST = 32; // % of arena traveled before a piece fizzles — the blast's effective radius
const NEON_SHRAPNEL_HIT_R = 2.4;   // %, shrapnel's own collision radius

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
function sfxNeonShot(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(760, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.1);
  gain.gain.value = 0.08;
  osc.connect(gain).connect(audioOut());
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}
function sfxNeonHitEnemy(){ beep(340, 0.06, 'square', 0.12); }
function sfxNeonDestroy(intensity){
  if(state.muted) return;
  const ctx = ensureAudio();
  const duration = 0.2 + intensity * 0.15;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 850 + intensity * 1500;
  const gain = ctx.createGain();
  gain.gain.value = 0.28 + intensity * 0.1;
  noise.connect(filter).connect(gain).connect(audioOut());
  noise.start();
}
function sfxNeonPickup(){ [880, 1108, 1318].forEach((f, i) => beep(f, 0.12, 'triangle', 0.15, i * 0.05)); }
function sfxNeonHit(){ beep(140, 0.3, 'sawtooth', 0.2); }
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
    'Move with WASD or the arrow keys. Click to shoot.',
    'Survive and score for 20 seconds.'
  ],
  scoring: [
    { swatch: '<span class="neon-legend-swatch drifter"></span>', label: 'Drifter', points: '+1' },
    { swatch: '<span class="neon-legend-swatch zapper"></span>', label: 'Zapper', points: '+2' },
    { swatch: '<span class="neon-legend-swatch juggernaut"></span>', label: 'Juggernaut', points: '+3' },
    { swatch: '<span class="neon-legend-swatch warden"></span>', label: 'Warden', points: '+15', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch power"></span>', label: 'Power Core', points: 'bigger shots', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch overdrive"></span>', label: 'Overdrive', points: 'faster shots', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch spread"></span>', label: 'Spread Core', points: '5-way shot', tone: 'bonus' },
    { swatch: '<span class="neon-legend-swatch bomb"></span>', label: 'Nova Bomb', points: 'clears the screen', tone: 'bonus' }
  ],
  tip: 'Touching an enemy costs a life. Walk over the glowing pickups to collect them &mdash; they last the whole round.'
});

export function renderNeonTeamInputs(count){
  renderTeamSetupRows('neonTeamInputs', 'neonAddTeamBtn', count, neonRowColors, renderNeonTeamInputs);
}
renderNeonTeamInputs(2);
wireAddTeamButton('neonTeamInputs', 'neonAddTeamBtn', renderNeonTeamInputs);

document.getElementById('neonStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#neonTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.neonTeams = names.map((name, i) => ({ name, color: neonRowColors[i], total: 0 }));
  state.neonCurrentTeam = 0;
  state.neonTurnsPlayed = 0;
  state.neonQuestionOrder = shuffle(NEON_QUESTIONS.map((_, i) => i));
  state.neonLives = NEON_MAX_LIVES;

  document.getElementById('neonSetup').classList.add('hidden');
  document.getElementById('neonGame').classList.remove('hidden');
  document.getElementById('neonGameOverBanner').classList.add('hidden');
  renderNeonScoreboard();
  renderNeonTurnBanner();
  renderNeonLives();
});

function renderNeonScoreboard(){
  renderTeamScoreboard('neonTeamList', state.neonTeams, state.neonCurrentTeam);
}
function renderNeonTurnBanner(){
  document.getElementById('neonTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.neonTeams[state.neonCurrentTeam].name)}</strong>'s turn — question ${state.neonTurnsPlayed + 1} of ${NEON_QUESTIONS.length}`;
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
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
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
const neonCanvasResizer = createCanvasResizer('neonCanvas', 'neonPlayArea');
function resizeNeonCanvas(){ neonCanvasResizer.resize(); }
export function ensureNeonLayout(){
  if(state.neonTeams.length > 0) resizeNeonCanvas();
}
const NEON_REFERENCE_WIDTH = 900;
function neonScale(canvas){ return canvas.width / NEON_REFERENCE_WIDTH; }

function ensureNeonStars(){
  if(state.neonStars.length > 0) return;
  state.neonStars = Array.from({ length: 40 }, () => ({
    xPct: Math.random() * 100, yPct: Math.random() * 100,
    size: Math.random() * 1.3 + 0.3, phase: Math.random() * Math.PI * 2
  }));
}

/* =========================================================
   PARTICLES
========================================================= */
function spawnNeonParticles(x, y, color, count = 18, scale = 1){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 7 + 2) * scale;
    state.neonParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.02 + 0.015, size: (Math.random() * 5 + 2) * scale, color
    });
  }
}
function updateNeonParticles(){
  for(const p of state.neonParticles){
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.97; p.vy *= 0.97;
    p.alpha -= p.decay; p.size *= 0.97;
  }
  state.neonParticles = state.neonParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

/* =========================================================
   ENEMIES
========================================================= */
function spawnNeonEnemy(){
  const roll = Math.random();
  let type, radiusPct, hp, speed, points;
  if(roll < 0.14){ type = 'zapper'; radiusPct = 1.5; hp = 1; speed = 26 + Math.random() * 8; points = 2; }
  else if(roll < 0.36){ type = 'juggernaut'; radiusPct = 3.7; hp = 3; speed = 8 + Math.random() * 3; points = 3; }
  else { type = 'drifter'; radiusPct = 2.4; hp = 1; speed = 14 + Math.random() * 6; points = 1; }

  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if(edge === 0){ x = Math.random() * 100; y = -6; }
  else if(edge === 1){ x = 106; y = Math.random() * 100; }
  else if(edge === 2){ x = Math.random() * 100; y = 106; }
  else { x = -6; y = Math.random() * 100; }

  state.neonEnemies.push({
    x, y, type, hp, maxHp: hp, speed, radiusPct, baseRadiusPct: radiusPct,
    points, hitFlash: 0, dead: false, wobble: Math.random() * Math.PI * 2
  });
}

function spawnNeonWarden(){
  if(!state.neonRoundActive || state.neonBossSpawnedThisRound) return;
  state.neonBossSpawnedThisRound = true;
  const hp = 10, radiusPct = 6.2;
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if(edge === 0){ x = Math.random() * 100; y = -10; }
  else if(edge === 1){ x = 110; y = Math.random() * 100; }
  else if(edge === 2){ x = Math.random() * 100; y = 110; }
  else { x = -10; y = Math.random() * 100; }
  state.neonEnemies.push({
    x, y, type: 'warden', hp, maxHp: hp, speed: 7 + Math.random() * 2,
    radiusPct, baseRadiusPct: radiusPct, points: 15, hitFlash: 0, dead: false, wobble: 0, angle: 0
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
  e.x += (nx + px * wobbleAmt) * e.speed * dtSec;
  e.y += (ny + py * wobbleAmt) * e.speed * dtSec;
}

/* =========================================================
   PICKUPS
========================================================= */
function spawnNeonPickup(){
  const r = Math.random();
  const type = r < 0.28 ? 'power' : r < 0.56 ? 'overdrive' : r < 0.84 ? 'spread' : 'bomb';
  state.neonPickups.push({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80, collected: false, type, spawnedAt: performance.now() });
}

// Reworked (2026-07-16) from an instant "kill everything in a radius"
// check back into the original prototype's own mechanic — a ring of
// shrapnel actually flies outward from the detonation point and has to
// physically reach an enemy to kill it (see updateNeonShrapnel below),
// piercing through multiple enemies along each piece's path for the same
// "clears a crowd" payoff the instant version had, just animated instead
// of instant. triggerNeonNovaBomb itself now only kicks the shrapnel off
// — all scoring/death happens later, in updateNeonShrapnel, as pieces
// actually connect.
function triggerNeonNovaBomb(x, y, canvas){
  for(let i = 0; i < NEON_SHRAPNEL_COUNT; i++){
    const angle = (Math.PI * 2 * i) / NEON_SHRAPNEL_COUNT + (Math.random() * 0.3 - 0.15);
    state.neonShrapnel.push({
      x, y, originX: x, originY: y,
      vx: Math.cos(angle) * NEON_SHRAPNEL_SPEED,
      vy: Math.sin(angle) * NEON_SHRAPNEL_SPEED
    });
  }
  spawnNeonParticles((x / 100) * canvas.width, (y / 100) * canvas.height, NEON_BOMB_COLOR, 60, 2.2);
  sfxNeonBomb();
}

function updateNeonShrapnel(dtSec, canvas){
  state.neonShrapnel.forEach(s => { s.x += s.vx * dtSec; s.y += s.vy * dtSec; });
  state.neonShrapnel = state.neonShrapnel.filter(s => Math.hypot(s.x - s.originX, s.y - s.originY) < NEON_SHRAPNEL_MAX_DIST);

  for(const s of state.neonShrapnel){
    for(const e of state.neonEnemies){
      if(e.dead) continue;
      if(Math.hypot(s.x - e.x, s.y - e.y) < NEON_SHRAPNEL_HIT_R + e.radiusPct){
        // Instant kill on contact, same as the bomb always was — only
        // the delivery changed, not the bomb's actual power. Shrapnel is
        // NOT consumed on a hit (no `break`/removal here) so one piece
        // can pierce through several enemies lined up in its path.
        e.dead = true;
        state.neonScore += e.points;
        document.getElementById('neonScoreDisplay').textContent = String(state.neonScore);
        const count = e.type === 'warden' ? 50 : e.type === 'juggernaut' ? 34 : 20;
        spawnNeonParticles((e.x / 100) * canvas.width, (e.y / 100) * canvas.height, neonEnemyColor(e.type), count, e.type === 'warden' ? 1.8 : 1);
        spawnFloatText(neonFloatTexts, (e.x / 100) * canvas.width, (e.y / 100) * canvas.height, `+${e.points}`, neonEnemyColor(e.type));
        sfxNeonDestroy(e.type === 'warden' ? 1.4 : e.type === 'juggernaut' ? 1 : 0.5);
        triggerNeonKillFeedback(e, canvas);
      }
    }
  }
  state.neonEnemies = state.neonEnemies.filter(e => !e.dead);
}

function collectNeonPickup(pu, canvas){
  const color = neonPickupColor(pu.type);
  spawnNeonParticles((pu.x / 100) * canvas.width, (pu.y / 100) * canvas.height, color, 22, 1);
  sfxNeonPickup();
  if(pu.type === 'power') state.neonPowerActive = true;
  else if(pu.type === 'overdrive') state.neonOverdriveActive = true;
  else if(pu.type === 'spread') state.neonSpreadActive = true;
  else if(pu.type === 'bomb') triggerNeonNovaBomb(pu.x, pu.y, canvas);
}

/* =========================================================
   LIFE-LOST FEEDBACK — identical technique to Star Defender's
   triggerLifeLostFeedback, IDs renamed for this stage, plus the same
   added canvas shake (bigger than any kill — losing a life should read
   as worse than a kill, not the same or less).
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
   INPUT — WASD/arrow-key movement (this app's first free
   keyboard input), click-to-fire decoupled from movement, plus a
   touch fallback (drag toward a point to move that way, and the
   initial touch also fires one shot toward it).
========================================================= */
const neonKeysDown = {};
let neonTouchTarget = null;
let neonAimAngle = -Math.PI / 2;

window.addEventListener('keydown', (e) => {
  if(!state.neonRoundActive) return;
  const tag = e.target.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)){
    neonKeysDown[k] = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  neonKeysDown[e.key.toLowerCase()] = false;
});

function currentNeonBulletSpeed(){
  return state.neonOverdriveActive ? NEON_BULLET_SPEED_BASE * 1.55 : NEON_BULLET_SPEED_BASE;
}

function fireNeonShot(targetXPct, targetYPct){
  const now = performance.now();
  if(now - state.neonLastShotAt < NEON_FIRE_COOLDOWN) return;
  state.neonLastShotAt = now;
  const px = state.neonPlayer.x, py = state.neonPlayer.y;
  const dx = targetXPct - px, dy = targetYPct - py;
  const dist = Math.hypot(dx, dy) || 1;
  const baseAngle = Math.atan2(dy / dist, dx / dist);
  neonAimAngle = baseAngle;
  const pellets = state.neonSpreadActive ? 5 : 1;
  const spreadArc = 0.5;
  const speed = currentNeonBulletSpeed();
  for(let i = 0; i < pellets; i++){
    const angle = pellets === 1 ? baseAngle : baseAngle - spreadArc / 2 + (spreadArc * i / (pellets - 1));
    state.neonBullets.push({ x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, big: state.neonPowerActive, hit: false });
  }
  sfxNeonShot();
}

const neonPlayAreaEl = document.getElementById('neonPlayArea');

function neonPointFromEvent(canvas, clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
}

neonPlayAreaEl.addEventListener('click', (e) => {
  if(!state.neonRoundActive) return;
  const canvas = neonCanvasResizer.getCanvas();
  const pt = neonPointFromEvent(canvas, e.clientX, e.clientY);
  fireNeonShot(pt.x, pt.y);
});
neonPlayAreaEl.addEventListener('touchstart', (e) => {
  if(!state.neonRoundActive) return;
  const canvas = neonCanvasResizer.getCanvas();
  const pt = neonPointFromEvent(canvas, e.touches[0].clientX, e.touches[0].clientY);
  neonTouchTarget = pt;
  fireNeonShot(pt.x, pt.y);
  e.preventDefault();
}, { passive: false });
neonPlayAreaEl.addEventListener('touchmove', (e) => {
  if(!state.neonRoundActive) return;
  const canvas = neonCanvasResizer.getCanvas();
  neonTouchTarget = neonPointFromEvent(canvas, e.touches[0].clientX, e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });
neonPlayAreaEl.addEventListener('touchend', () => { neonTouchTarget = null; });

function updateNeonPlayerMovement(dtSec){
  let dx = 0, dy = 0;
  if(neonKeysDown['w'] || neonKeysDown['arrowup']) dy -= 1;
  if(neonKeysDown['s'] || neonKeysDown['arrowdown']) dy += 1;
  if(neonKeysDown['a'] || neonKeysDown['arrowleft']) dx -= 1;
  if(neonKeysDown['d'] || neonKeysDown['arrowright']) dx += 1;
  if(neonTouchTarget){
    const tdx = neonTouchTarget.x - state.neonPlayer.x, tdy = neonTouchTarget.y - state.neonPlayer.y;
    const tdist = Math.hypot(tdx, tdy);
    if(tdist > 2){ dx += tdx / tdist; dy += tdy / tdist; }
  }
  const mag = Math.hypot(dx, dy);
  if(mag > 0){
    state.neonPlayer.x += (dx / mag) * NEON_PLAYER_SPEED * dtSec;
    state.neonPlayer.y += (dy / mag) * NEON_PLAYER_SPEED * dtSec;
  }
  state.neonPlayer.x = Math.max(NEON_PLAYER_RADIUS_PCT, Math.min(100 - NEON_PLAYER_RADIUS_PCT, state.neonPlayer.x));
  state.neonPlayer.y = Math.max(NEON_PLAYER_RADIUS_PCT, Math.min(100 - NEON_PLAYER_RADIUS_PCT, state.neonPlayer.y));
}

/* =========================================================
   PHYSICS / GAME TICK
========================================================= */
// Contact ALWAYS destroys the touching enemy, even during the post-hit
// invulnerability window — only whether it also costs a life depends on
// `wasInvuln`. Earlier this bailed out entirely while invulnerable, which
// meant enemies that wandered into contact range during that ~1s window just
// sat there visibly overlapping the player, uncleared, until it expired —
// a real contributor to the "very cramped" complaint, not just raw sizing.
// Now invulnerability reads as "safe to plow through," clearing anything it
// touches for free, which both fixes the visual pileup and adds a small,
// legible risk/reward payoff to having just taken a hit.
function checkNeonPlayerCollisions(canvas){
  const now = performance.now();
  const wasInvuln = now < state.neonInvulnUntil;
  let tookHit = false;
  for(const e of state.neonEnemies){
    if(e.dead) continue;
    const dx = state.neonPlayer.x - e.x, dy = state.neonPlayer.y - e.y;
    if(Math.hypot(dx, dy) < NEON_PLAYER_RADIUS_PCT + e.radiusPct){
      e.dead = true; // contact destroys the enemy — no points for a collision, only for a shot
      const safe = wasInvuln || tookHit;
      spawnNeonParticles((e.x / 100) * canvas.width, (e.y / 100) * canvas.height, safe ? '#FFFFFF' : '#FF3B3B', safe ? 14 : 24, safe ? 0.8 : 1.2);
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

function updateNeonBullets(dtSec, canvas){
  state.neonBullets.forEach(b => { b.x += b.vx * dtSec; b.y += b.vy * dtSec; });
  state.neonBullets = state.neonBullets.filter(b => b.x > -8 && b.x < 108 && b.y > -8 && b.y < 108);

  for(const b of state.neonBullets){
    if(b.hit) continue;
    for(const e of state.neonEnemies){
      if(e.dead) continue;
      const dx = b.x - e.x, dy = b.y - e.y;
      const hitR = (b.big ? NEON_BULLET_RADIUS_BIG_PCT : NEON_BULLET_RADIUS_PCT) + e.radiusPct;
      if(Math.hypot(dx, dy) < hitR){
        b.hit = true;
        e.hp -= b.big ? 2 : 1;
        e.hitFlash = 1;
        // A small spark burst on every hit, not just a kill — before this,
        // particles only fired on the finishing blow, so a multi-hit
        // enemy (juggernaut/warden) felt like it was absorbing shots with
        // no feedback at all until it finally died.
        spawnNeonParticles((b.x / 100) * canvas.width, (b.y / 100) * canvas.height, neonEnemyColor(e.type), 8, 0.7);
        if(e.hp <= 0){
          e.dead = true;
          state.neonScore += e.points;
          document.getElementById('neonScoreDisplay').textContent = String(state.neonScore);
          const count = e.type === 'warden' ? 50 : e.type === 'juggernaut' ? 34 : 20;
          spawnNeonParticles((e.x / 100) * canvas.width, (e.y / 100) * canvas.height, neonEnemyColor(e.type), count, e.type === 'warden' ? 1.8 : 1);
          spawnFloatText(neonFloatTexts, (e.x / 100) * canvas.width, (e.y / 100) * canvas.height, `+${e.points}`, neonEnemyColor(e.type));
          sfxNeonDestroy(e.type === 'warden' ? 1.4 : e.type === 'juggernaut' ? 1 : 0.5);
          triggerNeonKillFeedback(e, canvas);
        } else {
          e.radiusPct = e.baseRadiusPct * (0.6 + 0.4 * (e.hp / e.maxHp));
          sfxNeonHitEnemy();
        }
        break;
      }
    }
  }
  state.neonBullets = state.neonBullets.filter(b => !b.hit);
  state.neonEnemies = state.neonEnemies.filter(e => !e.dead);
}

function updateNeonGame(dt){
  const dtSec = Math.min(0.05, dt / 1000);
  const canvas = neonCanvasResizer.getCanvas();

  updateNeonPlayerMovement(dtSec);

  state.neonEnemies.forEach(e => {
    updateNeonEnemyMovement(e, dtSec);
    if(e.hitFlash > 0) e.hitFlash -= dtSec * 4;
    if(e.type === 'warden') e.angle += dtSec * 0.6;
  });

  updateNeonBullets(dtSec, canvas);
  updateNeonShrapnel(dtSec, canvas);
  checkNeonPlayerCollisions(canvas);

  for(const pu of state.neonPickups){
    if(pu.collected) continue;
    const dx = state.neonPlayer.x - pu.x, dy = state.neonPlayer.y - pu.y;
    if(Math.hypot(dx, dy) < NEON_PLAYER_RADIUS_PCT + 2.6){
      pu.collected = true;
      collectNeonPickup(pu, canvas);
    }
  }
  state.neonPickups = state.neonPickups.filter(pu => !pu.collected && (performance.now() - pu.spawnedAt) < 7000);

  updateNeonParticles();
  neonFloatTexts = updateFloatTexts(neonFloatTexts);
  neonShockwaves = updateShockwaves(neonShockwaves);
}

/* =========================================================
   RENDERING
========================================================= */
function renderNeonBackground(ctx, canvas){
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#0B0620');
  bg.addColorStop(0.55, '#140A30');
  bg.addColorStop(1, '#03020A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const horizonY = canvas.height * 0.5;
  const glow = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 40);
  glow.addColorStop(0, 'rgba(255,46,154,0)');
  glow.addColorStop(0.5, 'rgba(255,46,154,0.35)');
  glow.addColorStop(1, 'rgba(255,46,154,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizonY - 40, canvas.width, 80);

  ctx.save();
  ctx.strokeStyle = 'rgba(182,255,60,0.18)';
  ctx.lineWidth = 1;
  const vanishX = canvas.width / 2;
  for(let i = 1; i <= 10; i++){
    const t = i / 10;
    const y = horizonY + t * t * (canvas.height - horizonY);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  for(let i = -6; i <= 6; i++){
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(vanishX + i * canvas.width * 0.09, canvas.height);
    ctx.stroke();
  }
  ctx.restore();

  ensureNeonStars();
  const now = performance.now();
  for(const s of state.neonStars){
    const x = (s.xPct / 100) * canvas.width, y = (s.yPct / 100) * horizonY;
    const tw = 0.5 + 0.5 * Math.sin(now / 700 + s.phase);
    ctx.save();
    ctx.globalAlpha = 0.25 + tw * 0.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, s.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawNeonPickup(ctx, canvas, pu, now){
  const x = (pu.x / 100) * canvas.width, y = (pu.y / 100) * canvas.height;
  const scale = neonScale(canvas);
  const pulse = 0.7 + 0.3 * Math.sin(now / 160);
  const color = neonPickupColor(pu.type);
  // Bumped from 5 to 11 (~2.2x) — at 5 a power-up was smaller than even
  // the smallest enemy on screen and easy to miss entirely. Every shape
  // below is built from fractions of r, so this one constant scales the
  // whole pickup. Collection hitbox (updateNeonGame, a separate fixed
  // constant) is intentionally left untouched — this is a visibility
  // fix, not a difficulty change.
  const r = 11 * scale;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.shadowColor = color; ctx.shadowBlur = 18 * scale;
  ctx.fillStyle = color; ctx.strokeStyle = color;
  if(pu.type === 'power'){
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath(); ctx.fill();
  } else if(pu.type === 'overdrive'){
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y - r); ctx.lineTo(x + r * 0.5, y - r * 0.15); ctx.lineTo(x, y - r * 0.15);
    ctx.lineTo(x + r * 0.3, y + r); ctx.lineTo(x - r * 0.5, y + r * 0.15); ctx.lineTo(x, y + r * 0.15);
    ctx.closePath(); ctx.fill();
  } else if(pu.type === 'spread'){
    [-1, 0, 1].forEach(i => {
      ctx.beginPath();
      ctx.arc(x + i * r * 0.65, y - Math.abs(i) * r * 0.3, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.globalAlpha = pulse * 0.8;
    ctx.beginPath(); ctx.arc(x, y, r * 1.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1a0505';
    ctx.fillRect(x - r * 0.35, y - r * 0.08, r * 0.7, r * 0.16);
    ctx.fillRect(x - r * 0.08, y - r * 0.35, r * 0.16, r * 0.7);
  }
  ctx.restore();
}

function drawNeonEnemy(ctx, canvas, e, now){
  const x = (e.x / 100) * canvas.width, y = (e.y / 100) * canvas.height;
  const r = canvas.width * (e.radiusPct / 100);
  const baseColor = neonEnemyColor(e.type);
  ctx.save();
  ctx.shadowColor = baseColor;
  ctx.shadowBlur = e.type === 'warden' ? 28 + e.hitFlash * 24 : 10 + e.hitFlash * 16;
  ctx.fillStyle = e.hitFlash > 0.05 ? '#ffffff' : baseColor;
  ctx.beginPath();
  if(e.type === 'warden'){
    // Spiky crown/gear silhouette — deliberately distinct from Star
    // Defender's 6-plate boss this was originally adapted from, and from
    // every other enemy shape in this stage.
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
    ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * 0.45, y); ctx.lineTo(x, y + r * 0.8); ctx.lineTo(x - r * 0.45, y);
  } else {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if(e.type === 'warden' && e.hitFlash < 0.05){
    // Just a pulsing reactor core — no surrounding ring (the old dashed
    // rotating "shield ring" here was the other half of the "strange circle
    // around enemies" complaint, alongside the player's ring above).
    const pulse = 0.6 + 0.4 * Math.sin(now / 220);
    ctx.save();
    ctx.globalAlpha = pulse; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 20; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y, r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  if(e.maxHp > 1){
    if(e.type === 'warden'){
      const bw = r * 2.5, bh = 5, bx = x - bw / 2, by = y - r * 2 - 14;
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.hitFlash > 0.05 ? '#fff' : baseColor;
      ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
    } else {
      const gap = 6, startX = x - ((e.maxHp - 1) * gap) / 2;
      for(let i = 0; i < e.maxHp; i++){
        ctx.beginPath();
        ctx.fillStyle = i < e.hp ? '#ffffff' : 'rgba(255,255,255,0.28)';
        ctx.arc(startX + i * gap, y - r - 8, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

// Swept-wing jet silhouette (nose + a notched tail between two swept
// wingtips) with a small bright cockpit dot near the nose — replaces the
// earlier plain kite shape. No surrounding ring anymore: that ring used to
// render unconditionally (not just during invulnerability, which was the
// actual bug behind the "strange circle around the player" complaint) — the
// existing alpha-flicker below is the only invulnerability cue now.
function drawNeonPlayer(ctx, canvas){
  const x = (state.neonPlayer.x / 100) * canvas.width, y = (state.neonPlayer.y / 100) * canvas.height;
  const r = canvas.width * (NEON_PLAYER_RADIUS_PCT / 100);
  const now = performance.now();
  const invuln = now < state.neonInvulnUntil;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(neonAimAngle);
  if(invuln && Math.floor(now / 100) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.shadowColor = NEON_PLAYER_COLOR; ctx.shadowBlur = 14;
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
  ctx.restore();
}

function renderNeonCanvas(){
  const canvas = neonCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.save();
  applyShake(ctx, neonShake);

  renderNeonBackground(ctx, canvas);

  const scale = neonScale(canvas);
  const now = performance.now();

  for(const pu of state.neonPickups) drawNeonPickup(ctx, canvas, pu, now);
  for(const e of state.neonEnemies) drawNeonEnemy(ctx, canvas, e, now);

  // Thin projectile lines instead of filled ellipses — a short, narrow
  // stroked segment along the travel direction reads as a fast-moving
  // bolt rather than a pill/capsule shape. Same total length as the old
  // ellipse (baseR*2.6 each way from center), just much narrower.
  for(const b of state.neonBullets){
    const x = (b.x / 100) * canvas.width, y = (b.y / 100) * canvas.height;
    const baseR = Math.max(1, (b.big ? NEON_BULLET_RADIUS_BIG_PCT : NEON_BULLET_RADIUS_PCT) / 100 * canvas.width);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(b.vy, b.vx) - Math.PI / 2);
    ctx.shadowColor = b.big ? NEON_POWER_COLOR : NEON_PLAYER_COLOR;
    ctx.shadowBlur = 8 * scale;
    ctx.strokeStyle = b.big ? NEON_POWER_COLOR : '#E7FFC2';
    ctx.lineWidth = baseR * 0.55;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -baseR * 2.6);
    ctx.lineTo(0, baseR * 2.6);
    ctx.stroke();
    ctx.restore();
  }

  // Nova Bomb shrapnel — same thin-line language as the bullets above,
  // tinted in the bomb's own red so a detonation clearly reads as "many
  // small fast fragments", not more player bullets.
  for(const s of state.neonShrapnel){
    const x = (s.x / 100) * canvas.width, y = (s.y / 100) * canvas.height;
    const baseR = Math.max(1, 0.8 / 100 * canvas.width);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(s.vy, s.vx) - Math.PI / 2);
    ctx.shadowColor = NEON_BOMB_COLOR;
    ctx.shadowBlur = 8 * scale;
    ctx.strokeStyle = '#FFC48A';
    ctx.lineWidth = baseR * 0.55;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -baseR * 2.2);
    ctx.lineTo(0, baseR * 2.2);
    ctx.stroke();
    ctx.restore();
  }

  for(const p of state.neonParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8 * scale;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawShockwaves(ctx, neonShockwaves, scale);
  drawFloatTexts(ctx, neonFloatTexts, Math.max(16, 20 * scale));

  drawNeonPlayer(ctx, canvas);

  let indicatorY = 16 * scale;
  const indicatorFont = Math.max(12, 12 * scale);
  function drawIndicator(text, color){
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `bold ${indicatorFont}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, indicatorY);
    ctx.restore();
    indicatorY += 16 * scale;
  }
  if(state.neonPowerActive) drawIndicator('◆ POWER CORE', NEON_POWER_COLOR);
  if(state.neonOverdriveActive) drawIndicator('▲ OVERDRIVE', NEON_OVERDRIVE_COLOR);
  if(state.neonSpreadActive) drawIndicator('✦ SPREAD CORE', NEON_SPREAD_COLOR);

  ctx.restore(); // matches the shake ctx.save() near the top of this function
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startNeonRound(){
  cancelNeonRound();
  state.neonRoundActive = true;
  state.neonScore = 0;
  state.neonLives = NEON_MAX_LIVES;
  state.neonPlayer = { x: 50, y: 50 };
  state.neonBullets = [];
  state.neonShrapnel = [];
  state.neonEnemies = [];
  state.neonPickups = [];
  state.neonParticles = [];
  neonFloatTexts = [];
  neonShockwaves = [];
  neonShake = createShakeState();
  state.neonPowerActive = false;
  state.neonOverdriveActive = false;
  state.neonSpreadActive = false;
  state.neonLastShotAt = 0;
  state.neonInvulnUntil = 0;
  state.neonBossSpawnedThisRound = false;
  neonTouchTarget = null;
  neonAimAngle = -Math.PI / 2;
  Object.keys(neonKeysDown).forEach(k => neonKeysDown[k] = false);

  document.getElementById('neonScoreDisplay').textContent = '0';
  document.getElementById('neonTimeDisplay').textContent = NEON_ROUND_SECONDS;
  document.getElementById('neonTimerFill').style.width = '100%';
  renderNeonLives();

  const playArea = document.getElementById('neonPlayArea');
  playArea.classList.remove('idle');
  document.getElementById('neonHint').classList.remove('hidden');
  resizeNeonCanvas();
  scheduleNeonWarden();

  let nextEnemyAt = 600;
  let nextPickupAt = 3000 + Math.random() * 2500;
  const start = performance.now();
  let lastTime = start;
  const timeDisplay = document.getElementById('neonTimeDisplay');
  const timerFill = document.getElementById('neonTimerFill');

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    const elapsedMs = now - start;
    const remaining = Math.max(0, NEON_ROUND_SECONDS - elapsedMs / 1000);

    timeDisplay.textContent = Math.ceil(remaining);
    timerFill.style.width = (remaining / NEON_ROUND_SECONDS * 100) + '%';

    if(elapsedMs >= nextEnemyAt){ spawnNeonEnemy(); nextEnemyAt = elapsedMs + (560 + Math.random() * 520); }
    if(elapsedMs >= nextPickupAt){ spawnNeonPickup(); nextPickupAt = elapsedMs + (5000 + Math.random() * 3500); }

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
  neonTouchTarget = null;
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
    if(canvas){ const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    const beginBtn = document.getElementById('neonBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishNeonRound(){
  state.neonRoundActive = false;
  state.neonRoundRAF = null;
  clearNeonBossTimeout();

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
      document.getElementById('neonTimerFill').style.width = '100%';
    }
  });
}

function endNeonGame(){
  const winnerText = finishTeamGame({ prefix: 'neon', teams: state.neonTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('neonTurnBanner').innerHTML = `All done — ${winnerText}`;
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

document.getElementById('neonBackBtn').addEventListener('click', () => goToStage(10));
// Wired here (the target stage's own file), not in stage10 — same
// existing convention as qsNextStageBtn: a "Next" button's click
// handler lives in the file for the stage it goes TO.
document.getElementById('billiardsNextStageBtn').addEventListener('click', () => goToStage(11));
