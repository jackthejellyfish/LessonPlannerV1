import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { ensureAudio, beep, audioOut, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { INV_QUESTIONS } from '../content/stage7-stardefender.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { confirmDialog } from '../confirmDialog.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, stepParticles, frameFactor } from '../canvasEffects.js';
import { drawGlow, createBackdrop } from '../canvasGlow.js';
import { createTimerHud, setTimerFill, replayClass } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

// Rising "+N" text on every kill — same shared canvas float-text helper
// every other canvas game uses, local module state like Plinko's own
// transient render vars.
let invFloatTexts = [];

/* =========================================================
   STAGE 7 — STAR DEFENDER
   Fully canvas-rendered (unlike Ball Pop, which uses real DOM
   buttons for balls) because this game has many simultaneously
   moving entities — ship, projectiles, enemies, pickups,
   particles — and drawing that many DOM nodes every frame would
   be far more expensive than one clearRect + a loop of draw
   calls. Same team-turn/question-modal structure as Ball Pop,
   reusing its modal overlays since only one is ever open at once.
========================================================= */
// Reduced from 20 (2026-07-16), paired with the new bank-or-play choice
// below — a shorter base round makes banking (trading this round's play
// for a longer one later) a real, felt trade-off rather than a minor
// tweak.
const INV_ROUND_SECONDS = 10;
const INV_BOSS_COLOR = "#FF4E6A";
const INV_DART_COLOR = "#7DFFB3";
const INV_MACHINEGUN_COLOR = "#FF8C42";
const INV_MAX_LIVES = 3;
const INV_SCOUT_COLOR = "#6FE3D6";
const INV_BRUTE_COLOR = "#C77DFF";
const INV_PICKUP_COLOR = "#FFD23F";
const INV_SHIELD_COLOR = "#FF6B8B";
const INV_SHIP_COLOR = "#31E6E0";

/* ---- Sound effects (same synthesis approach as everywhere else on
   this page — Web Audio oscillators/noise, no audio files) ---- */
// A laser bolt. The old version was a lone square-wave pitch drop,
// which reads as a retro "bleep"; this layers a bright sine chirp over
// it and a tiny noise transient at the front, which is what gives a
// shot its "crack" rather than just its pitch.
function sfxLaser(){
  if(state.muted) return;
  const ctx = ensureAudio();
  const t0 = ctx.currentTime;
  const mk = (type, f0, f1, vol, dur) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioOut());
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  };
  mk('square', 880, 230, 0.06, 0.11);
  mk('sine', 2100, 520, 0.05, 0.09);
}

// A hit that didn't kill: a short, bright metallic tick, so it is
// clearly distinct from the destroy sound and doesn't muddy a burst of
// rapid fire.
function sfxEnemyHit(){
  beep(1250, 0.045, 'square', 0.07);
  beep(1880, 0.035, 'triangle', 0.05, 0.01);
}

// Destruction uses the shared impact — noise burst plus a pitched thump
// underneath, which the old noise-only version lacked, so kills now
// land with some weight. Intensity still scales with the enemy.
function sfxEnemyDestroy(intensity){
  sfxImpact(0.5 + intensity * 0.8);
}

// Pickups climb a bright major arpeggio and finish on a sparkle.
function sfxPickupCollect(){
  sfxRisingChime([784, 988, 1175, 1568], { duration: 0.12, volume: 0.14, stagger: 0.05 });
  beep(2350, 0.1, 'sine', 0.05, 0.2);
}

// Losing a shield: a falling two-tone alarm over a dull thud. Short on
// purpose — it tells the class something went wrong without becoming a
// punishment.
function sfxShieldLost(){
  beep(420, 0.16, 'sawtooth', 0.13);
  beep(280, 0.26, 'sawtooth', 0.13, 0.12);
  sfxImpact(0.35);
}

/* ---- Setup / teams (same pattern as Ball Pop) ---- */
let invRowColors = [];

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('invSetup', {
  prefix: 'inv',
  title: 'Star Defender',
  steps: [
    'One team answers a question.',
    'Move your ship with the mouse (or A / D). Hold the mouse button or SPACE to keep firing.',
    'Shoot down everything before it gets past you!'
  ],
  scoring: [
    { swatch: '<span class="inv-legend-swatch scout"></span>', label: 'Scout &mdash; 1 hit', points: '+1' },
    { swatch: '<span class="inv-legend-swatch dart"></span>', label: 'Dart &mdash; fast', points: '+2' },
    { swatch: '<span class="inv-legend-swatch brute"></span>', label: 'Brute &mdash; 3 hits', points: '+3' },
    { swatch: '<span class="inv-legend-swatch boss"></span>', label: 'Boss', points: '+15', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch pickup"></span>', label: 'Rapid Fire', points: 'faster shots', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch spread"></span>', label: 'Spread Shot', points: '3 shots at once', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch heart">&hearts;</span>', label: 'Shield', points: 'extra life', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch machinegun"></span>', label: 'Bomb', points: 'clears the screen', tone: 'bonus' }
  ],
  tip: 'Shoot the power-ups or fly into them. Enemies sometimes drop them too! Each enemy that gets past you costs a life.'
});

export function renderInvTeamInputs(count){
  renderTeamSetupRows('invTeamInputs', 'invAddTeamBtn', count, invRowColors, renderInvTeamInputs);
}
renderInvTeamInputs(2);

wireAddTeamButton('invTeamInputs', 'invAddTeamBtn', renderInvTeamInputs);

document.getElementById('invStartBtn').addEventListener('click', () => {
  // bankedSeconds: each team's own accumulated "sat out" time — see
  // beginInvTurn's play-or-bank choice. Per-team (not a single shared
  // pool), since a team-turn game means one team could bank while
  // another plays.
  state.invTeams = readTeamsFromSetup('inv', invRowColors).map(team => ({ ...team, bankedSeconds: 0 }));
  state.invCurrentTeam = 0;
  state.invTurnsPlayed = 0;
  state.invQuestionOrder = shuffle(INV_QUESTIONS.map((_, i) => i));
  state.invLives = INV_MAX_LIVES;

  showGameScreen('inv');
  renderInvScoreboard();
  renderInvTurnBanner();
  renderInvLives();
});

function renderInvScoreboard(){
  renderTeamScoreboard('invTeamList', state.invTeams, state.invCurrentTeam);
}
function renderInvTurnBanner(){
  renderTurnBanner('inv', state.invTeams[state.invCurrentTeam], state.invTurnsPlayed + 1, INV_QUESTIONS.length);
}
function renderInvLives(){
  document.getElementById('invLivesDisplay').innerHTML = Array.from({ length: INV_MAX_LIVES }, (_, i) =>
    `<span class="${i < state.invLives ? '' : 'lost'}">♥</span>`
  ).join('');
}

/* ---- Question modal — reuses Ball Pop's overlay elements, since only
   one modal is ever open at a time regardless of which stage it's for ---- */
function askInvQuestion(){
  const qIndex = state.invQuestionOrder[state.invTurnsPlayed];
  const q = INV_QUESTIONS[qIndex];
  return askTeamQuestion(q, INV_QUESTIONS, state.invTurnsPlayed);
}

function showInvResult(){
  return showTurnResultModal('invNextTeamBtn', { teams: state.invTeams, currentTeamIndex: state.invCurrentTeam });
}

// Play-or-bank choice (2026-07-16): after answering, a team can either
// play their round right now, or bank this round's 10s to make a LATER
// round longer instead. Reuses the shared confirmDialog rather than a
// bespoke modal — functionally it's exactly its two-button-resolves-a-
// Promise shape, just framed as two equally-valid choices instead of a
// confirm/cancel pair. Banking calls straight into finishInvRound()
// with no round ever having started — that function already just reads
// whatever's in state.invScore (left at its default 0) and advances the
// turn, so it doubles as "resolve this turn with zero score" for free.
document.getElementById('invBeginTurnBtn').addEventListener('click', beginInvTurn);
async function beginInvTurn(){
  document.getElementById('invBeginTurnBtn').disabled = true;
  await askInvQuestion();

  const team = state.invTeams[state.invCurrentTeam];
  const playSeconds = INV_ROUND_SECONDS + team.bankedSeconds;
  const message = team.bankedSeconds > 0
    ? `${team.name} has ${team.bankedSeconds}s banked. Play now for a ${playSeconds}s round, or bank another ${INV_ROUND_SECONDS}s for later?`
    : `Play this round now, or bank it — the round after next will be longer instead?`;
  const wantsToPlay = await confirmDialog(message, {
    confirmLabel: `Play now (${playSeconds}s)`,
    cancelLabel: `Bank +${INV_ROUND_SECONDS}s`
  });

  if(!wantsToPlay){
    team.bankedSeconds += INV_ROUND_SECONDS;
    state.invScore = 0;
    finishInvRound();
    return;
  }
  team.bankedSeconds = 0;
  startInvRound(playSeconds);
}

/* =========================================================
   THE ROUND (reworked 2026-11-22, on the Neon Arena pattern)
   - World units: the play area is 100 tall and worldW wide, one unit
     the same distance both ways (it used to be separate percentages
     of width and height, so everything was stretched sideways).
   - The ship follows the pointer (or A/D / arrows); HOLD the mouse, a
     finger or SPACE to keep firing. One click per shot, with clicks
     inside the cooldown dropped, was the old rule.
   - Bolts with trails, a muzzle flash and recoil; hits knock enemies
     back up the screen; kills burst into spinning debris.
   - Enemies move with character: scouts sway, darts dive at the ship,
     brutes plod, the boss sweeps side to side.
   - Power-ups come often (and enemies drop them), fall slowly, and are
     collected by shooting them OR flying into them. Rapid Fire and
     Spread Shot last a few seconds; Shield gives back a life; Bomb
     clears the screen.
========================================================= */
const INV_SHIP_Y = 86;
const INV_SHIP_R = 4.6;
const INV_SHIP_FOLLOW = 0.0002;   // how hard the ship chases the pointer (fraction of the gap left after 1s)
const INV_SHIP_KEY_SPEED = 95;    // units/second with the keyboard
const INV_FIRE_MS = 160;
const INV_FIRE_MS_RAPID = 85;
const INV_TAP_MIN_MS = 70;
const INV_BOLT_SPEED = 210;
const INV_BOLT_R = 1.4;
const INV_SPREAD = 0.2;           // radians either side for Spread Shot
const INV_POWER_MS = 6000;
const INV_PICKUP_R = 3;
const INV_PICKUP_FIRST_MS = [1200, 2000];
const INV_PICKUP_GAP_MS = [2500, 4000];
const INV_PICKUP_MAX = 2;
const INV_DROP_CHANCE = 0.1;
const INV_SPREAD_COLOR = '#FF5CF4';

/* ---- Canvas sizing ---- */
// A sharper buffer than the shared 820px cap, as Neon Arena has.
let invLastW = 0;
const invCanvasResizer = createCanvasResizer('invCanvas', 'invPlayArea', (canvas) => {
  const W = invWorldW(canvas);
  if(invLastW > 0 && Math.abs(W - invLastW) > 0.01){
    const k = W / invLastW;
    const sx = (o) => { o.x *= k; };
    state.invShip.x *= k; state.invShip.targetX *= k;
    state.invEnemies.forEach(e => { e.x *= k; e.baseX *= k; });
    state.invPickups.forEach(sx); state.invProjectiles.forEach(sx);
    if(invPointer.x != null) invPointer.x *= k;
  }
  invLastW = W;
  if(!state.invRoundActive) renderInvCanvas();
}, { maxBufferWidth: 1024 });
function resizeInvCanvas(){ invCanvasResizer.resize(); }
export function ensureInvLayout(){
  if(state.invTeams.length > 0) resizeInvCanvas();
}
function invWorldW(canvas){ return canvas && canvas.height > 0 ? 100 * canvas.width / canvas.height : 180; }
function invUnit(canvas){ return canvas.height / 100; }
// Pixel-sized effects scale with the buffer (tuned on the old 820px one).
function canvasScale(canvas){ return canvas.height / 400; }

/* ---- Particles and debris (canvas pixels) ---- */
function spawnInvParticles(x, y, color, count, scale = 1){
  count = particleCount(count);
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 8 + 2) * scale;
    state.invParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.02 + 0.015, size: (Math.random() * 6 + 2) * scale, color
    });
  }
}
function updateInvParticles(k){
  stepParticles(state.invParticles, k, { gravity: 0.15, dragX: 0.98 });
}
// Spinning shards when something blows up, in world units.
let invDebris = [];
function spawnDebris(x, y, color, count, size){
  count = particleCount(count);
  for(let i = 0; i < count; i++){
    const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 45;
    invDebris.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      size: size * (0.5 + Math.random() * 0.6), color, life: 1 });
  }
}
function stepDebris(dt){
  for(const d of invDebris){
    d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 60 * dt; d.rot += d.vr * dt; d.life -= dt * 1.6;
  }
  invDebris = invDebris.filter(d => d.life > 0);
}
function toPx(canvas, x, y){ const u = invUnit(canvas); return { x: x * u, y: y * u }; }

let invShake = createShakeState();
let invMuzzleUntil = 0;

/* ---- Enemies ---- */
function spawnInvEnemy(W){
  // 15% dart (tiny, dives), 22% brute (slow, 3 hits), 63% scout (sways)
  const roll = Math.random();
  let type, r, hp, vy, points;
  if(roll < 0.15){ type = 'dart'; r = 2.4; hp = 1; vy = 44 + Math.random() * 12; points = 2; }
  else if(roll < 0.37){ type = 'brute'; r = 6.4; hp = 3; vy = 10 + Math.random() * 4; points = 3; }
  else { type = 'scout'; r = 4.2; hp = 1; vy = 21 + Math.random() * 8; points = 1; }
  const x = W * 0.06 + Math.random() * W * 0.88;
  state.invEnemies.push({
    x, baseX: x, y: -6, vy, vx: type === 'dart' ? (state.invShip.x - x) * 0.35 : 0,
    hp, maxHp: hp, type, r, baseR: r, points, hitFlash: 0, dead: false,
    phase: Math.random() * 6, sway: type === 'scout' ? 6 + Math.random() * 6 : 0, ky: 0, angle: 0, born: performance.now()
  });
}

// A formation (2026-11-23: "needs more enemies"): four or five scouts in
// a V that sway together, now and then darts instead. Waves on top of the
// steady stream give the class a group to aim into without the screen
// turning to noise.
function spawnInvWave(W){
  const n = 4 + Math.floor(Math.random() * 2);
  const darts = Math.random() < 0.25;
  const spread = Math.min(12, W * 0.07);
  const centre = W * 0.2 + Math.random() * W * 0.6;
  const phase = Math.random() * 6;
  const vy = darts ? 30 : 20 + Math.random() * 6;
  for(let i = 0; i < n; i++){
    const off = i - (n - 1) / 2;
    const x = Math.max(6, Math.min(W - 6, centre + off * spread));
    const r = darts ? 2.4 : 4.2;
    state.invEnemies.push({
      x, baseX: x, y: -6 - Math.abs(off) * 7, vy, vx: 0,
      hp: 1, maxHp: 1, type: darts ? 'dart' : 'scout', r, baseR: r, points: darts ? 2 : 1, hitFlash: 0, dead: false,
      phase, sway: darts ? 0 : 7, ky: 0, angle: 0, born: performance.now()
    });
  }
}

function spawnInvBoss(){
  if(!state.invRoundActive || state.invBossSpawnedThisRound) return;
  state.invBossSpawnedThisRound = true;
  const W = invWorldW(invCanvasResizer.getCanvas());
  state.invEnemies.push({
    x: W / 2, baseX: W / 2, y: -14, vy: 6, vx: 0, hp: 12, maxHp: 12, type: 'boss',
    r: 12, baseR: 12, points: 15, hitFlash: 0, dead: false, phase: 0, sway: W * 0.3, ky: 0, angle: 0, born: performance.now()
  });
}

// Takes the round's ACTUAL duration (a banked round runs longer).
function scheduleBossForRound(durationSeconds){
  if(Math.random() > 0.40) return;
  const delay = 3000 + Math.random() * Math.max(2000, durationSeconds * 1000 - 8000);
  state.invBossTimeout = setTimeout(spawnInvBoss, delay);
}
function clearBossTimeout(){
  if(state.invBossTimeout) clearTimeout(state.invBossTimeout);
  state.invBossTimeout = null;
}

function enemyColor(type){
  return type === 'boss' ? INV_BOSS_COLOR : type === 'brute' ? INV_BRUTE_COLOR : type === 'dart' ? INV_DART_COLOR : INV_SCOUT_COLOR;
}

/* ---- Pick-ups ---- */
let invPickupsSpawned = 0; // this round, for the tests
function spawnInvPickup(W, at){
  if(state.invPickups.length >= INV_PICKUP_MAX && !at) return;
  invPickupsSpawned++;
  const r = Math.random();
  const type = r < 0.3 ? 'rapid' : r < 0.6 ? 'spread' : r < 0.82 ? 'shield' : 'bomb';
  const x = at ? at.x : W * 0.1 + Math.random() * W * 0.8;
  state.invPickups.push({ x, baseX: x, y: at ? at.y : -5, type, collected: false, phase: Math.random() * 6 });
}
function pickupColor(type){
  return type === 'shield' ? INV_SHIELD_COLOR : type === 'spread' ? INV_SPREAD_COLOR : type === 'bomb' ? INV_MACHINEGUN_COLOR : INV_PICKUP_COLOR;
}

function killEnemy(e, canvas){
  e.dead = true;
  state.invScore += e.points;
  document.getElementById('invScoreDisplay').textContent = state.invScore;
  const color = enemyColor(e.type);
  const p = toPx(canvas, e.x, e.y);
  const s = canvasScale(canvas);
  spawnInvParticles(p.x, p.y, color, e.type === 'boss' ? 50 : e.type === 'brute' ? 30 : 16, s);
  spawnDebris(e.x, e.y, color, e.type === 'boss' ? 14 : e.type === 'brute' ? 8 : 5, e.r * 0.45);
  state.invShockwaves.push({ x: p.x, y: p.y, color, big: e.type === 'boss', createdAt: performance.now() });
  spawnFloatText(invFloatTexts, p.x, p.y, `+${e.points}`, color);
  sfxEnemyDestroy(e.type === 'boss' ? 1.4 : e.type === 'brute' ? 1 : 0.5);
  triggerShake(invShake, e.type === 'boss' ? 9 : e.type === 'brute' ? 4 : 2);
  if(e.type === 'boss' || Math.random() < INV_DROP_CHANCE) spawnInvPickup(invWorldW(canvas), { x: e.x, y: e.y });
}

function collectPickup(pu, canvas){
  pu.collected = true;
  const now = performance.now();
  const p = toPx(canvas, pu.x, pu.y);
  let label;
  if(pu.type === 'shield'){
    if(state.invLives < INV_MAX_LIVES){ state.invLives++; renderInvLives(); label = '+1 LIFE'; }
    else { state.invScore += 3; document.getElementById('invScoreDisplay').textContent = state.invScore; label = '+3'; }
  } else if(pu.type === 'rapid'){ state.invRapidFireUntil = now + INV_POWER_MS; label = 'RAPID FIRE!'; }
  else if(pu.type === 'spread'){ state.invSpreadUntil = now + INV_POWER_MS; label = 'SPREAD SHOT!'; }
  else {
    // Bomb: a blast ring from the ship; every ordinary enemy on screen
    // is destroyed, the boss takes a big hit.
    label = 'BOOM!';
    triggerShake(invShake, 9);
    const sp = toPx(canvas, state.invShip.x, INV_SHIP_Y);
    state.invShockwaves.push({ x: sp.x, y: sp.y, color: INV_MACHINEGUN_COLOR, big: true, createdAt: now, huge: true });
    for(const e of state.invEnemies){
      if(e.dead || e.y < -2) continue;
      if(e.type === 'boss'){ e.hp -= 4; e.hitFlash = 1; if(e.hp <= 0) killEnemy(e, canvas); }
      else killEnemy(e, canvas);
    }
  }
  sfxPickupCollect();
  spawnInvParticles(p.x, p.y, pickupColor(pu.type), 22, canvasScale(canvas));
  spawnFloatText(invFloatTexts, p.x, p.y - 18 * canvasScale(canvas), label, pickupColor(pu.type));
}

// Red border pulse + lives-icon glow + shake when a life is lost.
function triggerLifeLostFeedback(){
  replayClass(document.getElementById('invPlayArea'), 'life-lost', 620);
  replayClass(document.getElementById('invLivesDisplay'), 'pulse', 720);
  triggerShake(invShake, 8);
}

/* ---- Input ---- */
const invKeys = {};
const invPointer = { x: null, down: false };
let invSpaceDown = false;
window.addEventListener('keydown', (e) => {
  if(!state.invRoundActive) return;
  const tag = e.target.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if(['a', 'd', 'arrowleft', 'arrowright'].includes(k)){ invKeys[k] = true; invPointer.x = null; e.preventDefault(); }
  else if(k === ' '){ if(!invSpaceDown) tryInvShot(true); invSpaceDown = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if(k === ' ') invSpaceDown = false; else invKeys[k] = false;
});
const invPlayAreaEl = document.getElementById('invPlayArea');
function invPointerX(e){
  const canvas = invCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  return ((e.clientX - rect.left) / rect.width) * invWorldW(canvas);
}
invPlayAreaEl.addEventListener('pointermove', (e) => { if(state.invRoundActive) invPointer.x = invPointerX(e); });
invPlayAreaEl.addEventListener('pointerdown', (e) => {
  if(!state.invRoundActive) return;
  invPointer.x = invPointerX(e);
  invPointer.down = true;
  tryInvShot(true);
  e.preventDefault();
});
function releaseInvTrigger(){ invPointer.down = false; }
window.addEventListener('pointerup', releaseInvTrigger);
window.addEventListener('pointercancel', releaseInvTrigger);
window.addEventListener('blur', () => { releaseInvTrigger(); invSpaceDown = false; Object.keys(invKeys).forEach(k => invKeys[k] = false); });
invPlayAreaEl.addEventListener('touchstart', (e) => { if(state.invRoundActive) e.preventDefault(); }, { passive: false });

function tryInvShot(fresh){
  if(!state.invRoundActive) return;
  const now = performance.now();
  const gap = fresh ? INV_TAP_MIN_MS : (now < state.invRapidFireUntil ? INV_FIRE_MS_RAPID : INV_FIRE_MS);
  if(now - state.invLastShotAt < gap) return;
  state.invLastShotAt = now;
  const angles = now < state.invSpreadUntil ? [-INV_SPREAD, 0, INV_SPREAD] : [0];
  for(const a of angles){
    state.invProjectiles.push({
      x: state.invShip.x + Math.sin(a) * 3, y: INV_SHIP_Y - INV_SHIP_R * 1.4,
      vx: Math.sin(a) * INV_BOLT_SPEED, vy: -Math.cos(a) * INV_BOLT_SPEED, hit: false
    });
  }
  invMuzzleUntil = now + 60;
  sfxLaser();
}

/* ---- The update ---- */
function updateInvGame(dt){
  const dtSec = Math.min(0.05, dt / 1000);
  const canvas = invCanvasResizer.getCanvas();
  const W = invWorldW(canvas);
  const now = performance.now();
  const ship = state.invShip;

  // Ship: chases the pointer, or slides on the keys.
  const prevX = ship.x;
  let keyDir = 0;
  if(invKeys.a || invKeys.arrowleft) keyDir -= 1;
  if(invKeys.d || invKeys.arrowright) keyDir += 1;
  if(keyDir) ship.targetX = ship.x + keyDir * INV_SHIP_KEY_SPEED * dtSec;
  else if(invPointer.x != null) ship.targetX = invPointer.x;
  ship.targetX = Math.max(4, Math.min(W - 4, ship.targetX));
  ship.x += (ship.targetX - ship.x) * (1 - Math.pow(INV_SHIP_FOLLOW, dtSec));
  ship.vx = (ship.x - prevX) / Math.max(dtSec, 0.001);

  if(invPointer.down || invSpaceDown) tryInvShot(false);

  for(const p of state.invProjectiles){ p.x += p.vx * dtSec; p.y += p.vy * dtSec; }
  state.invProjectiles = state.invProjectiles.filter(p => p.y > -6 && p.x > -6 && p.x < W + 6 && !p.hit);

  for(const e of state.invEnemies){
    const t = (now - e.born) / 1000;
    e.y += (e.vy + e.ky) * dtSec;
    e.ky *= Math.pow(0.002, dtSec);
    if(e.type === 'dart') e.x += e.vx * dtSec;
    else if(e.sway) { e.x = e.baseX + Math.sin(t * (e.type === 'boss' ? 0.7 : 1.7) + e.phase) * e.sway; }
    e.x = Math.max(e.r, Math.min(W - e.r, e.x));
    e.angle += dtSec * (e.type === 'boss' ? 0.4 : e.type === 'brute' ? 0.6 : 0);
    if(e.hitFlash > 0) e.hitFlash -= dtSec * 4;
  }
  const leaked = state.invEnemies.filter(e => e.y >= 100 + e.r * 0.5);
  if(leaked.length){
    state.invLives = Math.max(0, state.invLives - leaked.length);
    renderInvLives();
    triggerLifeLostFeedback();
    if(state.invLives > 0) sfxShieldLost();
  }
  state.invEnemies = state.invEnemies.filter(e => e.y < 100 + e.r * 0.5 && !e.dead);

  for(const pu of state.invPickups){
    pu.y += 15 * dtSec;
    pu.x = pu.baseX + Math.sin(now / 500 + pu.phase) * 3;
  }

  // Bolts against enemies and pick-ups.
  for(const b of state.invProjectiles){
    if(b.hit) continue;
    for(const e of state.invEnemies){
      if(e.dead || Math.hypot(b.x - e.x, b.y - e.y) >= e.r + INV_BOLT_R) continue;
      b.hit = true;
      e.hp--; e.hitFlash = 1;
      e.ky -= e.type === 'boss' ? 8 : e.type === 'brute' ? 26 : 40; // knocked back up
      const p = toPx(canvas, b.x, b.y);
      spawnInvParticles(p.x, p.y, enemyColor(e.type), 6, canvasScale(canvas) * 0.6);
      if(e.hp <= 0) killEnemy(e, canvas);
      else { e.r = e.baseR * (0.65 + 0.35 * (e.hp / e.maxHp)); sfxEnemyHit(); }
      break;
    }
    if(b.hit) continue;
    for(const pu of state.invPickups){
      if(pu.collected || Math.hypot(b.x - pu.x, b.y - pu.y) >= INV_PICKUP_R + INV_BOLT_R + 1) continue;
      b.hit = true;
      collectPickup(pu, canvas);
      break;
    }
  }
  // Flying into a pick-up collects it too.
  for(const pu of state.invPickups){
    if(!pu.collected && Math.hypot(pu.x - ship.x, pu.y - INV_SHIP_Y) < INV_PICKUP_R + INV_SHIP_R + 1) collectPickup(pu, canvas);
  }

  state.invProjectiles = state.invProjectiles.filter(p => !p.hit);
  state.invEnemies = state.invEnemies.filter(e => !e.dead);
  state.invPickups = state.invPickups.filter(pu => !pu.collected && pu.y < 108);

  const k = frameFactor(dt);
  updateInvParticles(k);
  stepDebris(dtSec);
  invFloatTexts = updateFloatTexts(invFloatTexts, k);
  state.invShockwaves = state.invShockwaves.filter(sw => now - sw.createdAt < (sw.huge ? 700 : 380));
}

/* ---- Drawing ---- */
// The fighter: swept wings, canopy, a burning engine; it banks into its
// movement and kicks back a touch with every shot.
function drawInvShip(ctx, canvas, now){
  const u = invUnit(canvas);
  const ship = state.invShip;
  const recoil = now < invMuzzleUntil ? (invMuzzleUntil - now) / 60 : 0;
  const x = ship.x * u, y = (INV_SHIP_Y + recoil * 0.9) * u;
  const bank = Math.max(-0.45, Math.min(0.45, (ship.vx || 0) * 0.004));
  const s = u * INV_SHIP_R / 16; // the art below was drawn 16 units "tall"
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bank);
  const flick = 0.78 + 0.22 * Math.sin(now / 42);
  const flick2 = 0.75 + 0.25 * Math.sin(now / 71 + 1.3);
  drawGlow(ctx, 0, 14 * s, 17 * s, '#FF9F1C', 0.42, 1.6);
  ctx.fillStyle = '#FF8A3D';
  ctx.beginPath(); ctx.moveTo(-5.5 * s, 8 * s); ctx.lineTo(0, (15 + 13 * flick) * s); ctx.lineTo(5.5 * s, 8 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FFE066';
  ctx.beginPath(); ctx.moveTo(-2.6 * s, 8 * s); ctx.lineTo(0, (12 + 8 * flick2) * s); ctx.lineTo(2.6 * s, 8 * s); ctx.closePath(); ctx.fill();
  drawGlow(ctx, 0, 0, 26 * s, INV_SHIP_COLOR, 0.4, 1.7);
  ctx.fillStyle = '#1F9E9A';
  ctx.beginPath();
  ctx.moveTo(-16 * s, 10 * s); ctx.lineTo(-5 * s, -2 * s); ctx.lineTo(-5 * s, 9 * s); ctx.closePath();
  ctx.moveTo(16 * s, 10 * s); ctx.lineTo(5 * s, -2 * s); ctx.lineTo(5 * s, 9 * s); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INV_SHIP_COLOR;
  ctx.beginPath();
  ctx.moveTo(0, -18 * s); ctx.lineTo(7 * s, 6 * s); ctx.lineTo(4 * s, 11 * s); ctx.lineTo(-4 * s, 11 * s); ctx.lineTo(-7 * s, 6 * s);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E8FFFD';
  ctx.beginPath(); ctx.ellipse(0, -5 * s, 2.8 * s, 5.2 * s, 0, 0, Math.PI * 2); ctx.fill();
  if(recoil > 0){
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(0, -21 * s, 5 * s * recoil + 2 * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(ctx, e, u, now){
  const x = e.x * u, y = e.y * u, r = e.r * u;
  const baseColor = enemyColor(e.type);
  drawGlow(ctx, x, y, r * (e.type === 'boss' ? 2.6 : 2.0), baseColor, 0.42 + e.hitFlash * 0.4, 1.7);
  ctx.save();
  // A hit squashes it for a moment.
  const squash = 1 + Math.max(0, e.hitFlash) * 0.18;
  ctx.translate(x, y); ctx.scale(squash, 1 / squash); ctx.translate(-x, -y);
  ctx.fillStyle = e.hitFlash > 0.05 ? '#ffffff' : baseColor;
  ctx.beginPath();
  if(e.type === 'boss'){
    const plates = 6;
    for(let i = 0; i < plates * 2; i++){
      const ang = (Math.PI / plates) * i + e.angle;
      const rad = i % 2 === 0 ? r : r * 0.68;
      const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if(e.type === 'brute'){
    for(let i = 0; i < 6; i++){
      const ang = (Math.PI / 3) * i - Math.PI / 2 + e.angle;
      const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if(e.type === 'dart'){
    // Points the way it's diving.
    const a = Math.atan2(e.vy, e.vx) - Math.PI / 2;
    const c = Math.cos(a), sn = Math.sin(a);
    const pt = (px, py) => [x + px * c - py * sn, y + px * sn + py * c];
    const pts = [[0, r * 2.1], [r * 0.42, r * 0.2], [r * 0.95, -r * 0.95], [r * 0.22, -r * 0.5], [0, -r * 0.95], [-r * 0.22, -r * 0.5], [-r * 0.95, -r * 0.95], [-r * 0.42, r * 0.2]];
    pts.forEach(([px, py], i) => { const [qx, qy] = pt(px, py); i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); });
  } else {
    // Scout saucer, tilting as it sways.
    const tilt = Math.cos((now - e.born) / 1000 * 1.7 + e.phase) * 0.25;
    ctx.translate(x, y); ctx.rotate(tilt); ctx.translate(-x, -y);
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + r * 0.95, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.32, x, y - r * 0.38);
    ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.32, x - r, y);
  }
  ctx.closePath();
  ctx.fill();
  if(e.hitFlash <= 0.05){
    if(e.type === 'scout'){
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.ellipse(x, y - r * 0.42, r * 0.34, r * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      // Blinking lights round the rim.
      ctx.fillStyle = Math.floor(now / 200) % 2 ? '#FFE066' : '#FFFFFF';
      for(const k of [-0.6, 0, 0.6]){ ctx.beginPath(); ctx.arc(x + k * r, y + r * 0.22, r * 0.09, 0, Math.PI * 2); ctx.fill(); }
    } else if(e.type === 'brute'){
      ctx.fillStyle = '#2A1240';
      ctx.beginPath(); ctx.arc(x, y, r * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(x, y + r * 0.08, r * 0.16, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  if(e.type === 'boss' && e.hitFlash < 0.05){
    const pulse = 0.6 + 0.4 * Math.sin(now / 220);
    drawGlow(ctx, x, y, r * 0.9, '#ffffff', pulse * 0.55, 1.9);
    ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y, r * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if(e.maxHp > 1){
    if(e.type === 'boss'){
      const bw = r * 2.2, bh = Math.max(4, u * 1.1), bx = x - bw / 2, by = y - r - u * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.hitFlash > 0.05 ? '#fff' : baseColor; ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
    } else {
      const gap = u * 1.5, dot = Math.max(1.5, u * 0.45), startX = x - ((e.maxHp - 1) * gap) / 2;
      for(let i = 0; i < e.maxHp; i++){
        ctx.beginPath(); ctx.fillStyle = i < e.hp ? '#ffffff' : 'rgba(255,255,255,0.28)';
        ctx.arc(startX + i * gap, y - r - u * 2, dot, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function drawPickup(ctx, pu, u, now){
  const x = pu.x * u, y = pu.y * u, r = INV_PICKUP_R * u;
  const pulse = 0.75 + 0.25 * Math.sin(now / 150);
  const color = pickupColor(pu.type);
  drawGlow(ctx, x, y, r * 2.8, color, pulse * 0.55, 1.6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(now / 400 + pu.phase) * 0.3);
  // A capsule casing, then the icon on it.
  ctx.fillStyle = 'rgba(10,8,32,0.75)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, u * 0.5);
  ctx.stroke();
  ctx.fillStyle = color;
  const i = r * 0.55;
  ctx.beginPath();
  if(pu.type === 'shield'){
    ctx.arc(-i * 0.5, -i * 0.25, i * 0.55, 0, Math.PI * 2); ctx.arc(i * 0.5, -i * 0.25, i * 0.55, 0, Math.PI * 2);
    ctx.moveTo(-i * 1.02, 0); ctx.lineTo(0, i * 1.05); ctx.lineTo(i * 1.02, 0); ctx.closePath();
  } else if(pu.type === 'rapid'){
    ctx.moveTo(-i * 0.3, -i); ctx.lineTo(i * 0.5, -i * 0.1); ctx.lineTo(0, -i * 0.1);
    ctx.lineTo(i * 0.3, i); ctx.lineTo(-i * 0.5, i * 0.1); ctx.lineTo(0, i * 0.1); ctx.closePath();
  } else if(pu.type === 'spread'){
    for(const a of [-0.6, 0, 0.6]){ const px = Math.sin(a) * i, py = -Math.cos(a) * i; ctx.moveTo(px + i * 0.28, py); ctx.arc(px, py, i * 0.28, 0, Math.PI * 2); }
    ctx.moveTo(i * 0.3, i * 0.5); ctx.arc(0, i * 0.5, i * 0.3, 0, Math.PI * 2);
  } else {
    ctx.arc(0, i * 0.15, i * 0.75, 0, Math.PI * 2);
    ctx.rect(-i * 0.18, -i * 1.05, i * 0.36, i * 0.5);
  }
  ctx.fill();
  ctx.restore();
}

// All bolts as one path: a faint wide stroke for the glow, a thin bright
// one for the core.
function drawBolts(ctx, u){
  if(!state.invProjectiles.length) return;
  ctx.save();
  ctx.beginPath();
  for(const b of state.invProjectiles){
    ctx.moveTo((b.x - b.vx * 0.03) * u, (b.y - b.vy * 0.03) * u);
    ctx.lineTo(b.x * u, b.y * u);
  }
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.35; ctx.strokeStyle = INV_SHIP_COLOR; ctx.lineWidth = u * 1.3; ctx.stroke();
  ctx.globalAlpha = 1; ctx.strokeStyle = '#E8FFFD'; ctx.lineWidth = u * 0.5; ctx.stroke();
  ctx.restore();
}

function drawPowerBar(ctx, canvas, now){
  const active = [
    ['RAPID FIRE', INV_PICKUP_COLOR, state.invRapidFireUntil - now],
    ['SPREAD SHOT', INV_SPREAD_COLOR, state.invSpreadUntil - now]
  ].filter(a => a[2] > 0);
  if(!active.length) return;
  const s = canvasScale(canvas);
  const w = 130 * s, h = 26 * s, gap = 10 * s;
  let x = canvas.width / 2 - (active.length * w + (active.length - 1) * gap) / 2;
  const y = 12 * s;
  ctx.save();
  ctx.font = `bold ${Math.round(12 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(const [label, color, left] of active){
    ctx.fillStyle = 'rgba(8,4,24,0.7)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y + h - 4 * s, w * (left / INV_POWER_MS), 4 * s);
    ctx.globalAlpha = left < 1500 && Math.floor(now / 150) % 2 === 0 ? 0.4 : 1;
    ctx.fillText(label, x + w / 2, y + h / 2 - 2 * s);
    ctx.globalAlpha = 1;
    x += w + gap;
  }
  ctx.restore();
}

function renderInvCanvas(){
  const canvas = invCanvasResizer.getCanvas();
  if(!canvas || canvas.height === 0) return;
  const ctx = canvas.getContext('2d');
  const u = invUnit(canvas);
  const s = canvasScale(canvas);
  const now = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  applyShake(ctx, invShake);

  // Starfield drifting down, faster for nearer (bigger) stars.
  if(!state.invStars || state.invStars.length === 0){
    state.invStars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.4, phase: Math.random() * 6 }));
  }
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for(const st of state.invStars){
    if(state.invRoundActive){ st.y += st.r * 0.0006; if(st.y > 1){ st.y = 0; st.x = Math.random(); } }
    ctx.globalAlpha = (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(now / 500 + st.phase))) * (0.5 + st.r * 0.3);
    ctx.beginPath(); ctx.arc(st.x * canvas.width, st.y * canvas.height, st.r * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  if(state.invRoundActive){
    for(const pu of state.invPickups) drawPickup(ctx, pu, u, now);
    for(const e of state.invEnemies) drawEnemy(ctx, e, u, now);
    drawBolts(ctx, u);

    for(const sw of state.invShockwaves){
      const dur = sw.huge ? 700 : 380;
      const t = (now - sw.createdAt) / dur;
      if(t >= 1) continue;
      const r = (sw.huge ? 260 : sw.big ? 40 : 20) * s * (0.3 + t * 1.3);
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = (1 - t) * 0.33; ctx.lineWidth = (sw.big ? 4 : 2.5) * s * 3.4;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1 - t; ctx.lineWidth = (sw.big ? 4 : 2.5) * s;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Debris shards.
    ctx.save();
    for(const d of invDebris){
      ctx.globalAlpha = Math.max(0, d.life);
      ctx.fillStyle = d.color;
      const c = Math.cos(d.rot), sn = Math.sin(d.rot), sz = d.size * u;
      const px = d.x * u, py = d.y * u;
      ctx.beginPath();
      ctx.moveTo(px + c * sz, py + sn * sz);
      ctx.lineTo(px - sn * sz * 0.6, py + c * sz * 0.6);
      ctx.lineTo(px - c * sz * 0.8, py - sn * sz * 0.8);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for(const p of state.invParticles){
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    drawInvShip(ctx, canvas, now);
    drawFloatTexts(ctx, invFloatTexts, Math.max(16, 22 * s));
  }
  ctx.restore(); // the shake
  if(state.invRoundActive) drawPowerBar(ctx, canvas, now);
}

/* ---- Round lifecycle ---- */
function startInvRound(durationSeconds = INV_ROUND_SECONDS){
  cancelInvRound();
  state.invRoundActive = true;
  state.invScore = 0;
  state.invLives = INV_MAX_LIVES;
  document.getElementById('invPlayArea').classList.remove('idle');
  resizeInvCanvas();
  const W0 = invWorldW(invCanvasResizer.getCanvas());
  invLastW = W0;
  state.invShip = { x: W0 / 2, targetX: W0 / 2, vx: 0 };
  state.invProjectiles = [];
  state.invEnemies = [];
  state.invPickups = [];
  state.invParticles = [];
  state.invShockwaves = [];
  invDebris = [];
  invPickupsSpawned = 0;
  invFloatTexts = [];
  invShake = createShakeState();
  state.invRapidFireUntil = 0;
  state.invSpreadUntil = 0;
  state.invLastShotAt = 0;
  state.invBossSpawnedThisRound = false;
  invPointer.x = null; invPointer.down = false; invSpaceDown = false;
  Object.keys(invKeys).forEach(k => invKeys[k] = false);

  document.getElementById('invScoreDisplay').textContent = '0';
  document.getElementById('invTimeDisplay').textContent = durationSeconds;
  setTimerFill(document.getElementById('invTimerFill'), 1);
  renderInvLives();
  scheduleBossForRound(durationSeconds);

  const between = (r) => r[0] + Math.random() * (r[1] - r[0]);
  let nextEnemyAt = 400;
  let nextWaveAt = 2200 + Math.random() * 1000;
  let nextPickupAt = between(INV_PICKUP_FIRST_MS);
  const start = performance.now();
  let lastTime = start;
  const updateTimerHud = createTimerHud(document.getElementById('invTimeDisplay'), document.getElementById('invTimerFill'), durationSeconds);

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    noteFrame();
    lastTime = now;
    const elapsedMs = now - start;
    const remaining = Math.max(0, durationSeconds - elapsedMs / 1000);
    updateTimerHud(remaining);
    const W = invWorldW(invCanvasResizer.getCanvas());
    // More enemies (2026-11-23): a steady stream about 50% denser than
    // before (was every 500-1000ms), plus a formation every 3-4.5s.
    if(elapsedMs >= nextEnemyAt){ spawnInvEnemy(W); nextEnemyAt = elapsedMs + (330 + Math.random() * 330); }
    if(elapsedMs >= nextWaveAt){ spawnInvWave(W); nextWaveAt = elapsedMs + (3000 + Math.random() * 1500); }
    if(elapsedMs >= nextPickupAt){ spawnInvPickup(W); nextPickupAt = elapsedMs + between(INV_PICKUP_GAP_MS); }
    updateInvGame(dt);
    renderInvCanvas();
    if(remaining <= 0){ finishInvRound(); return; }
    state.invRoundRAF = requestAnimationFrame(tick);
  }
  state.invRoundRAF = requestAnimationFrame(tick);
}

// Called on a natural round end AND when the teacher navigates away
// mid-round, so the loop can never keep running in the background.
export function cancelInvRound(){
  if(state.invRoundRAF) cancelAnimationFrame(state.invRoundRAF);
  state.invRoundRAF = null;
  clearBossTimeout();
  releaseInvTrigger(); invSpaceDown = false;
  Object.keys(invKeys).forEach(k => invKeys[k] = false);
  if(state.invRoundActive){
    state.invRoundActive = false;
    const playArea = document.getElementById('invPlayArea');
    if(playArea) playArea.classList.add('idle');
    renderInvCanvas();
    const beginBtn = document.getElementById('invBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishInvRound(){
  state.invRoundActive = false;
  state.invRoundRAF = null;
  clearBossTimeout();
  releaseInvTrigger(); invSpaceDown = false;
  document.getElementById('invPlayArea').classList.add('idle');
  renderInvCanvas();

  const team = state.invTeams[state.invCurrentTeam];
  team.total += state.invScore;
  state.invTurnsPlayed++;
  renderInvScoreboard();

  showInvResult().then(() => {
    if(state.invTurnsPlayed >= INV_QUESTIONS.length){
      endInvGame();
    } else {
      state.invCurrentTeam = (state.invCurrentTeam + 1) % state.invTeams.length;
      renderInvScoreboard();
      renderInvTurnBanner();
      document.getElementById('invBeginTurnBtn').disabled = false;
      document.getElementById('invTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('invTimerFill'), 1);
    }
  });
}

function endInvGame(){
  const winnerText = finishTeamGame({ prefix: 'inv', teams: state.invTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('invTurnBanner').innerHTML = `All done — ${winnerText}`;
}

// For the automated tests only.
export function debugInvInternals(){
  const canvas = invCanvasResizer.getCanvas();
  return { W: invWorldW(canvas), lastShotAt: state.invLastShotAt, pickups: state.invPickups.length, pickupsSpawned: invPickupsSpawned,
    ship: { ...state.invShip }, enemies: state.invEnemies.length };
}

wireTeamManagementButtons({
  prefix: 'inv',
  getTeams: () => state.invTeams,
  renderScoreboard: renderInvScoreboard,
  cancelRound: cancelInvRound
});

document.getElementById('invBackBtn').addEventListener('click', () => goToStage(10));
document.getElementById('invNextBtn').addEventListener('click', () => goToStage(12));
