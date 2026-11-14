import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, beep, audioOut, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { INV_QUESTIONS } from '../content/stage7-stardefender.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { confirmDialog } from '../confirmDialog.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, stepParticles, frameFactor } from '../canvasEffects.js';
import { drawGlow, createBackdrop } from '../canvasGlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';

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
    'Click anywhere to move your ship there and fire.',
    'Shoot down everything for 20 seconds.'
  ],
  scoring: [
    { swatch: '<span class="inv-legend-swatch scout"></span>', label: 'Scout &mdash; 1 hit', points: '+1' },
    { swatch: '<span class="inv-legend-swatch dart"></span>', label: 'Dart &mdash; fast', points: '+2' },
    { swatch: '<span class="inv-legend-swatch brute"></span>', label: 'Brute &mdash; 3 hits', points: '+3' },
    { swatch: '<span class="inv-legend-swatch boss"></span>', label: 'Boss', points: '+15', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch pickup"></span>', label: 'Rapid fire', points: 'power-up', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch machinegun"></span>', label: 'Machine gun', points: 'power-up', tone: 'bonus' },
    { swatch: '<span class="inv-legend-swatch heart">&hearts;</span>', label: 'Shield', points: 'extra life', tone: 'bonus' }
  ],
  tip: 'Shoot the glowing pickups to collect them. You have 3 lives &mdash; losing them all ends the turn early.'
});

export function renderInvTeamInputs(count){
  renderTeamSetupRows('invTeamInputs', 'invAddTeamBtn', count, invRowColors, renderInvTeamInputs);
}
renderInvTeamInputs(2);

wireAddTeamButton('invTeamInputs', 'invAddTeamBtn', renderInvTeamInputs);

document.getElementById('invStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#invTeamInputs input')).map(i => i.value.trim() || 'Team');
  // bankedSeconds: each team's own accumulated "sat out" time — see
  // beginInvTurn's play-or-bank choice. Per-team (not a single shared
  // pool), since a team-turn game means one team could bank while
  // another plays.
  state.invTeams = names.map((name, i) => ({ name, color: invRowColors[i], total: 0, bankedSeconds: 0 }));
  state.invCurrentTeam = 0;
  state.invTurnsPlayed = 0;
  state.invQuestionOrder = shuffle(INV_QUESTIONS.map((_, i) => i));
  state.invLives = INV_MAX_LIVES;

  document.getElementById('invSetup').classList.add('hidden');
  document.getElementById('invGame').classList.remove('hidden');
  document.getElementById('invGameOverBanner').classList.add('hidden');
  renderInvScoreboard();
  renderInvTurnBanner();
  renderInvLives();
});

function renderInvScoreboard(){
  renderTeamScoreboard('invTeamList', state.invTeams, state.invCurrentTeam);
}
function renderInvTurnBanner(){
  document.getElementById('invTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.invTeams[state.invCurrentTeam].name)}</strong>'s turn — question ${state.invTurnsPlayed + 1} of ${INV_QUESTIONS.length}`;
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
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
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

/* ---- Canvas sizing ---- */
const invCanvasResizer = createCanvasResizer('invCanvas', 'invPlayArea');
function resizeInvCanvas(){ invCanvasResizer.resize(); }

// Called whenever the stage's on-screen box changes size WITHOUT a
// native window 'resize' event firing — e.g. toggling compact mode
// (see main.js), which only changes a CSS class. Mirrors
// ensurePlinkoLayout's guard: only touches the canvas once a game is
// actually in progress.
export function ensureInvLayout(){
  if(state.invTeams.length > 0) resizeInvCanvas();
}

/* ---- Particles (same physics formulas as Ball Pop's — gravity, drag,
   decay — kept as a separate array/canvas since this is a different
   game with its own coordinate space) ---- */
function spawnInvParticles(x, y, color, count, scale = 1){
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

function spawnInvEnemy(){
  // 15% dart (tiny/fast), 22% brute (slow/tanky), 63% scout (standard)
  const roll = Math.random();
  let type, radiusPct, hp, vy, points;
  // Speed history: ~10% ("ever so slightly") in an earlier pass, +20% on
  // top of that, now another +20% on top of THAT (three separate rounds
  // of "faster" feedback) — each factor multiplies the already-bumped
  // base numbers below rather than re-deriving from scratch, so all
  // three rounds stay reflected. Net effect vs. the original numbers:
  // ×1.1 × 1.2 × 1.2 ≈ ×1.58.
  if(roll < 0.15){
    type = 'dart'; radiusPct = 2.0; hp = 1; vy = (24 + Math.random() * 9) * 1.2 * 1.2; points = 2;
  } else if(roll < 0.37){
    type = 'brute'; radiusPct = 5.5; hp = 3; vy = (5.5 + Math.random() * 2.5) * 1.2 * 1.2; points = 3;
  } else {
    type = 'scout'; radiusPct = 3.6; hp = 1; vy = (12 + Math.random() * 5.5) * 1.2 * 1.2; points = 1;
  }
  state.invEnemies.push({
    x: 8 + Math.random() * 84, y: -5, vy,
    hp, maxHp: hp, type,
    radiusPct, baseRadiusPct: radiusPct,
    points, hitFlash: 0, dead: false
  });
}

// Now built on the shared js/canvasEffects.js helper (this file's own
// version was one of 3 near-identical copies found across the app —
// Sky Slingshot and Plinko each independently typed out the same
// {shakeUntil,shakeMag} + ctx.translate trick — so this is the same
// behavior, just one shared implementation going forward).
let invShake = createShakeState();

// A small burst at the ship's barrel every time it fires — makes each
// shot read as a real event instead of just a bolt silently appearing.
function spawnInvMuzzleFlash(canvas){
  const s = canvasScale(canvas);
  const x = (state.invShip.x / 100) * canvas.width;
  const y = canvas.height - 18 * s - 14 * s;
  spawnInvParticles(x, y, INV_SHIP_COLOR, 5, s * 0.5);
}

// Expanding ring fired on every enemy kill (not just bosses) — same
// "impact ring" language as Ball Pop's DOM shockwave, but drawn on
// canvas since this game has no per-entity DOM nodes to animate.
const INV_SHOCKWAVE_DURATION_MS = 380;
function spawnInvShockwave(x, y, color, big = false){
  state.invShockwaves.push({ x, y, color, big, createdAt: performance.now() });
}

function spawnInvPickup(){
  // Three pickups with equal probability
  const r = Math.random();
  const type = r < 0.33 ? 'rapid' : r < 0.66 ? 'shield' : 'machinegun';
  state.invPickups.push({ x: 12 + Math.random() * 76, y: -5, collected: false, type });
}

function spawnInvBoss(){
  if(!state.invRoundActive || state.invBossSpawnedThisRound) return;
  state.invBossSpawnedThisRound = true;
  const hp = 10;
  const radiusPct = 11;
  state.invEnemies.push({
    x: 20 + Math.random() * 60, y: -12,
    vy: (3 + Math.random() * 1.5) * 1.2 * 1.2,
    hp, maxHp: hp, type: 'boss',
    radiusPct, baseRadiusPct: radiusPct,
    points: 15, hitFlash: 0, dead: false,
    angle: 0  // used to animate the boss's rotating ring
  });
}

// Takes the round's ACTUAL duration (not always INV_ROUND_SECONDS —
// a banked round runs longer, see beginInvTurn) so the boss's spawn
// window scales with it too, rather than always clustering in the
// first few seconds of a much longer round.
function scheduleBossForRound(durationSeconds){
  // ~40% chance a boss appears, at a random point in the middle of
  // the round — early enough the player can actually engage it.
  if(Math.random() > 0.40) return;
  const delay = 3000 + Math.random() * Math.max(2000, durationSeconds * 1000 - 8000);
  const id = setTimeout(spawnInvBoss, delay);
  state.invBossTimeout = id;
}

function clearBossTimeout(){
  if(state.invBossTimeout) clearTimeout(state.invBossTimeout);
  state.invBossTimeout = null;
}

// Red border pulse + lives-icon glow + canvas shake when a life is
// lost — four separate signals (border color, icon glow, shake, sfx) so
// students at the back of the room still notice something went wrong.
// The shake (8) is deliberately bigger than even a boss kill's (see the
// enemy-kill triggerShake below) — losing a life should read as worse
// than any kill, not the same or less.
function triggerLifeLostFeedback(){
  const playArea = document.getElementById('invPlayArea');
  const livesEl = document.getElementById('invLivesDisplay');
  playArea.classList.remove('life-lost');
  void playArea.offsetWidth;
  playArea.classList.add('life-lost');
  setTimeout(() => playArea.classList.remove('life-lost'), 620);
  livesEl.classList.remove('pulse');
  void livesEl.offsetWidth;
  livesEl.classList.add('pulse');
  setTimeout(() => livesEl.classList.remove('pulse'), 720);
  triggerShake(invShake, 8);
}

/* ---- Fire on click: moves the ship toward the click X and fires
   immediately from wherever the ship currently is — responsive
   "move and shoot" rather than waiting for the ship to arrive. ---- */
document.getElementById('invPlayArea').addEventListener('click', (e) => {
  if(!state.invRoundActive) return;
  const canvas = invCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
  state.invShip.targetX = Math.max(6, Math.min(94, clickXPct));

  const now = performance.now();
  const rapid = now < state.invRapidFireUntil;
  const cooldown = rapid ? 90 : 220;
  if(now - state.invLastShotAt < cooldown) return;
  state.invLastShotAt = now;

  sfxLaser();
  spawnInvMuzzleFlash(canvas);
  const shots = rapid ? 3 : 1;
  for(let i = 0; i < shots; i++){
    state.invProjectiles.push({ x: state.invShip.x + (i - (shots - 1) / 2) * 4, y: 90, hit: false });
  }
});

function updateInvGame(dt){
  const dtSec = dt / 1000;
  const canvas = invCanvasResizer.getCanvas();

  // Ship eases toward the click target — same lerp-toward-target
  // technique used for the ball spawn-in ease elsewhere on this page.
  state.invShip.x += (state.invShip.targetX - state.invShip.x) * 0.22;

  state.invProjectiles.forEach(p => { p.y -= 150 * dtSec; });
  state.invProjectiles = state.invProjectiles.filter(p => p.y > -5 && !p.hit);

  state.invEnemies.forEach(e => {
    e.y += e.vy * dtSec;
    if(e.hitFlash > 0) e.hitFlash -= dtSec * 4;
  });
  const reachedBottom = state.invEnemies.filter(e => e.y >= 96);
  if(reachedBottom.length > 0){
    state.invLives = Math.max(0, state.invLives - reachedBottom.length);
    renderInvLives();
    triggerLifeLostFeedback();
    if(state.invLives > 0) sfxShieldLost();
  }
  state.invEnemies = state.invEnemies.filter(e => e.y < 96 && !e.dead);

  state.invPickups.forEach(p => { p.y += 22 * dtSec; });
  state.invPickups = state.invPickups.filter(p => p.y < 105 && !p.collected);

  // Collisions — projectile vs enemy
  for(const proj of state.invProjectiles){
    if(proj.hit) continue;
    for(const enemy of state.invEnemies){
      if(enemy.dead) continue;
      const dx = proj.x - enemy.x, dy = proj.y - enemy.y;
      if(Math.sqrt(dx * dx + dy * dy) < enemy.radiusPct + 2.5){
        proj.hit = true;
        enemy.hp--;
        enemy.hitFlash = 1;
        if(enemy.hp <= 0){
          enemy.dead = true;
          state.invScore += enemy.points;
          document.getElementById('invScoreDisplay').textContent = state.invScore;
          const color = enemy.type === 'boss' ? INV_BOSS_COLOR : enemy.type === 'brute' ? INV_BRUTE_COLOR : INV_SCOUT_COLOR;
          const killX = (enemy.x / 100) * canvas.width, killY = (enemy.y / 100) * canvas.height;
          spawnInvParticles(killX, killY, color, enemy.type === 'boss' ? 60 : enemy.type === 'brute' ? 40 : 22, canvasScale(canvas));
          spawnInvShockwave(killX, killY, color, enemy.type === 'boss');
          spawnFloatText(invFloatTexts, killX, killY, `+${enemy.points}`, color);
          sfxEnemyDestroy(enemy.type === 'brute' ? 1 : 0.5);
          // A boss kill is the biggest single moment in this game — same
          // small canvas-shake trick as Sky Slingshot's impact feedback.
          // Every kill now gets a scaled-down version of the same shake so
          // all hits feel like they land, not just bosses.
          triggerShake(invShake, enemy.type === 'boss' ? 8 : enemy.type === 'brute' ? 4 : 2);
        } else {
          // A hit that doesn't destroy it still visibly wears it down —
          // shrinks toward 60% of its original size as HP drops, so a
          // damaged hexagon looks visibly smaller, not just flashed white.
          enemy.radiusPct = enemy.baseRadiusPct * (0.6 + 0.4 * (enemy.hp / enemy.maxHp));
          sfxEnemyHit();
        }
        break;
      }
    }
  }

  // Collisions — projectile vs pickup
  for(const proj of state.invProjectiles){
    if(proj.hit) continue;
    for(const pu of state.invPickups){
      if(pu.collected) continue;
      const dx = proj.x - pu.x, dy = proj.y - pu.y;
      if(Math.sqrt(dx * dx + dy * dy) < 6){
        proj.hit = true;
        pu.collected = true;
        const color = pu.type === 'shield' ? INV_SHIELD_COLOR : pu.type === 'machinegun' ? INV_MACHINEGUN_COLOR : INV_PICKUP_COLOR;
        if(pu.type === 'shield'){
          state.invLives = Math.min(INV_MAX_LIVES, state.invLives + 1);
          renderInvLives();
        } else if(pu.type === 'machinegun'){
          state.invMachineGunUntil = performance.now() + 5000;
        } else {
          state.invRapidFireUntil = performance.now() + 4000;
        }
        sfxPickupCollect();
        spawnInvParticles((pu.x / 100) * canvas.width, (pu.y / 100) * canvas.height, color, 26, canvasScale(canvas));
        break;
      }
    }
  }

  state.invProjectiles = state.invProjectiles.filter(p => !p.hit);
  state.invEnemies = state.invEnemies.filter(e => !e.dead);
  state.invPickups = state.invPickups.filter(pu => !pu.collected);

  const k = frameFactor(dt);
  updateInvParticles(k);
  invFloatTexts = updateFloatTexts(invFloatTexts, k);
  const shockNow = performance.now();
  state.invShockwaves = state.invShockwaves.filter(sw => shockNow - sw.createdAt < INV_SHOCKWAVE_DURATION_MS);
}

// Reference width the ship/projectile/particle proportions below were
// tuned at — canvasScale(canvas) turns those fixed-px numbers into
// values relative to the canvas's actual width, so everything drawn on
// canvas (not just the CSS-sized DOM entities) grows proportionally in
// fullscreen instead of staying pinned at its old absolute pixel size.
const INV_REFERENCE_WIDTH = 900;
function canvasScale(canvas){ return canvas.width / INV_REFERENCE_WIDTH; }

/* The ship was a flat 4-point arrowhead. It's now a readable little
   fighter — swept wings, a bright canopy, and an engine flame that
   actually burns — because at classroom distance the old silhouette
   read as "a triangle" rather than as the thing you are flying.

   It also BANKS: the hull tilts into the direction it is travelling,
   taken from the gap between where the ship is and where it's heading.
   That one value is already in state (invShip.targetX), so the bank
   costs nothing to compute and does more for the sense of movement
   than any amount of extra detail would. */
function drawInvShip(ctx, canvas){
  const s = canvasScale(canvas);
  const x = (state.invShip.x / 100) * canvas.width;
  const y = canvas.height - 20 * s;
  const drift = (state.invShip.targetX - state.invShip.x);
  const bank = Math.max(-0.42, Math.min(0.42, drift * 0.055));
  const now = performance.now();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bank);

  // Engine flame first, so the hull overlaps it. Two stacked tongues
  // with offset flicker rates read as fire rather than as a triangle.
  const flick = 0.78 + 0.22 * Math.sin(now / 42);
  const flick2 = 0.75 + 0.25 * Math.sin(now / 71 + 1.3);
  drawGlow(ctx, 0, 14 * s, 17 * s, '#FF9F1C', 0.42, 1.6);
  ctx.fillStyle = '#FF8A3D';
  ctx.beginPath();
  ctx.moveTo(-5.5 * s, 8 * s);
  ctx.lineTo(0, (15 + 13 * flick) * s);
  ctx.lineTo(5.5 * s, 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFE066';
  ctx.beginPath();
  ctx.moveTo(-2.6 * s, 8 * s);
  ctx.lineTo(0, (12 + 8 * flick2) * s);
  ctx.lineTo(2.6 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // Hull glow, then the hull itself — cached sprite rather than
  // shadowBlur, same reason as everywhere else in this app.
  drawGlow(ctx, 0, 0, 26 * s, INV_SHIP_COLOR, 0.4, 1.7);

  // Swept wings
  ctx.fillStyle = '#1F9E9A';
  ctx.beginPath();
  ctx.moveTo(-16 * s, 10 * s);
  ctx.lineTo(-5 * s, -2 * s);
  ctx.lineTo(-5 * s, 9 * s);
  ctx.closePath();
  ctx.moveTo(16 * s, 10 * s);
  ctx.lineTo(5 * s, -2 * s);
  ctx.lineTo(5 * s, 9 * s);
  ctx.closePath();
  ctx.fill();

  // Fuselage
  ctx.fillStyle = INV_SHIP_COLOR;
  ctx.beginPath();
  ctx.moveTo(0, -18 * s);
  ctx.lineTo(7 * s, 6 * s);
  ctx.lineTo(4 * s, 11 * s);
  ctx.lineTo(-4 * s, 11 * s);
  ctx.lineTo(-7 * s, 6 * s);
  ctx.closePath();
  ctx.fill();

  // Canopy
  ctx.fillStyle = '#E8FFFD';
  ctx.beginPath();
  ctx.ellipse(0, -5 * s, 2.8 * s, 5.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderInvCanvas(){
  const canvas = invCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  applyShake(ctx, invShake);

  const invScaleEarly = canvasScale(canvas);

  // Starfield. Stars now DRIFT downward at a speed tied to their size,
  // which gives the field parallax depth and makes the whole screen
  // feel like it's moving — the single cheapest way to add motion to a
  // game where the ship only slides left and right. One save/restore
  // for the batch rather than one per star.
  if(!state.invStars || state.invStars.length === 0){
    state.invStars = Array.from({ length: 56 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.5 + 0.4, phase: Math.random() * Math.PI * 2
    }));
  }
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for(const st of state.invStars){
    st.y += (st.r * 0.00045);
    if(st.y > 1) { st.y = 0; st.x = Math.random(); }
    const tw = 0.5 + 0.5 * Math.sin(Date.now() / 500 + st.phase);
    ctx.globalAlpha = (0.22 + tw * 0.45) * (0.5 + st.r * 0.3);
    ctx.beginPath();
    ctx.arc(st.x * canvas.width, st.y * canvas.height, st.r * invScaleEarly, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawInvShip(ctx, canvas);

  const invScale = canvasScale(canvas);
  for(const p of state.invProjectiles){
    const x = (p.x / 100) * canvas.width, y = (p.y / 100) * canvas.height;
    // Dimmer trailing ellipse behind the bolt (projectiles only ever
    // travel straight up at a fixed speed, so "behind" is simply a
    // fixed offset back down toward where it came from) — makes the
    // shot read as fast motion instead of a static dot.
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = INV_SHIP_COLOR;
    ctx.beginPath();
    ctx.ellipse(x, y + 9 * invScale, 1.6 * invScale, 6 * invScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawGlow(ctx, x, y, 11 * invScale, INV_SHIP_COLOR, 0.5, 1.7);
    ctx.save();
    ctx.fillStyle = '#D8FFFA';
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2 * invScale, 7 * invScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for(const sw of state.invShockwaves){
    const t = (performance.now() - sw.createdAt) / INV_SHOCKWAVE_DURATION_MS;
    if(t >= 1) continue;
    const r = (sw.big ? 40 : 20) * invScale * (0.3 + t * 1.3);
    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = (1 - t) * 0.33;
    ctx.lineWidth = (sw.big ? 4 : 2.5) * invScale * 3.4;
    ctx.beginPath(); ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1 - t;
    ctx.lineWidth = (sw.big ? 4 : 2.5) * invScale;
    ctx.beginPath(); ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  for(const e of state.invEnemies){
    const x = (e.x / 100) * canvas.width, y = (e.y / 100) * canvas.height;
    const r = canvas.width * (e.radiusPct / 100);
    const baseColor = e.type === 'boss' ? INV_BOSS_COLOR : e.type === 'brute' ? INV_BRUTE_COLOR : e.type === 'dart' ? INV_DART_COLOR : INV_SCOUT_COLOR;
    drawGlow(ctx, x, y, r * (e.type === 'boss' ? 2.6 : 2.0), baseColor,
      0.42 + e.hitFlash * 0.4, 1.7);
    ctx.save();
    ctx.fillStyle = e.hitFlash > 0.05 ? '#ffffff' : baseColor;

    ctx.beginPath();
    if(e.type === 'boss'){
      // Armored hexagonal hull — 6 thick angular plates (a gear/mothership
      // silhouette) rather than a thin spinning star, so it reads as a
      // heavy, dangerous thing rather than a sparkly shape. Rotates slowly.
      if(!e.angle) e.angle = 0;
      e.angle += 0.006;
      const plates = 6;
      for(let i = 0; i < plates * 2; i++){
        const ang = (Math.PI / plates) * i + e.angle;
        const rad = i % 2 === 0 ? r : r * 0.68;
        const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
        if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if(e.type === 'brute'){
      for(let i = 0; i < 6; i++){
        const ang = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
        if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if(e.type === 'dart'){
      // A needle with swept-back fins — reads as fast even standing
      // still, which matters because it IS the fast one.
      ctx.moveTo(x, y - r * 2.1);
      ctx.lineTo(x + r * 0.42, y - r * 0.2);
      ctx.lineTo(x + r * 0.95, y + r * 0.95);
      ctx.lineTo(x + r * 0.22, y + r * 0.5);
      ctx.lineTo(x, y + r * 0.95);
      ctx.lineTo(x - r * 0.22, y + r * 0.5);
      ctx.lineTo(x - r * 0.95, y + r * 0.95);
      ctx.lineTo(x - r * 0.42, y - r * 0.2);
    } else {
      // Scout: a little saucer — a dome over a wide hull. Previously a
      // plain diamond, which was indistinguishable from the dart at a
      // glance once both were in motion.
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x, y + r * 0.95, x + r, y);
      ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.32, x, y - r * 0.38);
      ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.32, x - r, y);
    }
    ctx.closePath();
    ctx.fill();

    // Cockpit dome on the scout, and a hot core on the dart: small
    // bright marks that make each type identifiable instantly.
    if(e.hitFlash <= 0.05){
      if(e.type === 'scout'){
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.42, r * 0.34, r * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if(e.type === 'dart'){
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.5, r * 0.16, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if(e.type === 'brute'){
        // Armour seams
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = Math.max(1, r * 0.09);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Pulsing reactor core + a dashed, counter-rotating shield ring —
    // reads as a genuine "boss" (armor + power source + shield) instead
    // of one flat shape, and the counter-rotation against the hull's
    // own spin adds visual complexity without extra moving parts.
    if(e.type === 'boss' && e.hitFlash < 0.05){
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 220);
      drawGlow(ctx, x, y, r * 0.9, '#ffffff', pulse * 0.55, 1.9);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([r * 0.3, r * 0.18]);
      ctx.beginPath();
      ctx.arc(x, y, r * 1.4, -e.angle * 1.6, Math.PI * 2 - e.angle * 1.6);
      ctx.stroke();
      ctx.restore();
    }

    if(e.maxHp > 1){
      // For the boss, draw a health bar instead of small pips
      if(e.type === 'boss'){
        const bw = r * 2.5, bh = 5;
        const bx = x - bw / 2, by = y - r * 2 - 14;
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = e.hitFlash > 0.05 ? '#fff' : baseColor;
        ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
      } else {
        const gap = 6;
        const startX = x - ((e.maxHp - 1) * gap) / 2;
        for(let i = 0; i < e.maxHp; i++){
          ctx.beginPath();
          ctx.fillStyle = i < e.hp ? '#ffffff' : 'rgba(255,255,255,0.28)';
          ctx.arc(startX + i * gap, y - r - 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  for(const pu of state.invPickups){
    const x = (pu.x / 100) * canvas.width, y = (pu.y / 100) * canvas.height;
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 150);
    const color = pu.type === 'shield' ? INV_SHIELD_COLOR : pu.type === 'machinegun' ? INV_MACHINEGUN_COLOR : INV_PICKUP_COLOR;
    drawGlow(ctx, x, y, 22 * invScale, color, pulse * 0.5, 1.6);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = color;
    if(pu.type === 'shield'){
      const r = 5 * invScale;
      ctx.beginPath();
      ctx.arc(x - r * 0.55, y - r * 0.3, r, 0, Math.PI * 2);
      ctx.arc(x + r * 0.55, y - r * 0.3, r, 0, Math.PI * 2);
      ctx.moveTo(x - r * 1.5, y);
      ctx.lineTo(x, y + r * 1.8);
      ctx.lineTo(x + r * 1.5, y);
      ctx.closePath();
      ctx.fill();
    } else if(pu.type === 'machinegun'){
      // Draw a small gun-barrel silhouette
      ctx.fillRect(x - 7 * invScale, y - 3 * invScale, 14 * invScale, 5 * invScale);
      ctx.fillRect(x + 5 * invScale, y - 5 * invScale, 5 * invScale, 9 * invScale);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 7 * invScale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // One save/restore for the batch and no per-particle shadow — an
  // explosion is exactly the frame that can least afford either.
  // 'lighter' makes overlapping sparks add up, which recovers the bloom
  // the shadow used to provide, for free.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(const p of state.invParticles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawFloatTexts(ctx, invFloatTexts, Math.max(16, 22 * invScale));

  // Active power-up indicators (stacked so multiple can show at once)
  const now = performance.now();
  const indicatorFont = Math.max(12, 12 * invScale);
  let indicatorY = 16 * invScale;
  if(now < state.invMachineGunUntil){
    ctx.save();
    ctx.fillStyle = 'rgba(255,140,66,0.92)';
    ctx.font = `bold ${indicatorFont}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('⚙ MACHINE GUN', canvas.width / 2, indicatorY);
    ctx.restore();
    indicatorY += 16 * invScale;
  }
  if(now < state.invRapidFireUntil){
    ctx.save();
    ctx.fillStyle = 'rgba(255,210,63,0.92)';
    ctx.font = `bold ${indicatorFont}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('✦ RAPID FIRE', canvas.width / 2, indicatorY);
    ctx.restore();
  }

  ctx.restore(); // matches the shake ctx.save() at the top of this function
}

function startInvRound(durationSeconds = INV_ROUND_SECONDS){
  cancelInvRound();
  state.invRoundActive = true;
  state.invScore = 0;
  state.invLives = INV_MAX_LIVES;
  state.invShip = { x: 50, targetX: 50 };
  state.invProjectiles = [];
  state.invEnemies = [];
  state.invPickups = [];
  state.invParticles = [];
  state.invShockwaves = [];
  invFloatTexts = [];
  state.invRapidFireUntil = 0;
  state.invMachineGunUntil = 0;
  state.invLastAutoFireAt = 0;
  state.invLastShotAt = 0;
  state.invBossSpawnedThisRound = false;

  document.getElementById('invScoreDisplay').textContent = '0';
  document.getElementById('invTimeDisplay').textContent = durationSeconds;
  setTimerFill(document.getElementById('invTimerFill'), 1);
  renderInvLives();

  const playArea = document.getElementById('invPlayArea');
  playArea.classList.remove('idle');
  resizeInvCanvas();
  scheduleBossForRound(durationSeconds);

  let nextEnemyAt = 500;
  let nextPickupAt = 4000 + Math.random() * 3000;
  const start = performance.now();
  let lastTime = start;
  const timeDisplay = document.getElementById('invTimeDisplay');
  const timerFill = document.getElementById('invTimerFill');
  const updateTimerHud = createTimerHud(timeDisplay, timerFill, durationSeconds);

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    const elapsedMs = now - start;
    const remaining = Math.max(0, durationSeconds - elapsedMs / 1000);

    updateTimerHud(remaining);

    if(elapsedMs >= nextEnemyAt){
      spawnInvEnemy();
      nextEnemyAt = elapsedMs + (500 + Math.random() * 500);
    }
    if(elapsedMs >= nextPickupAt){
      spawnInvPickup();
      nextPickupAt = elapsedMs + (6000 + Math.random() * 4000);
    }

    // Machine gun: auto-fires every 60ms, no click needed
    if(now < state.invMachineGunUntil && now - state.invLastAutoFireAt >= 60){
      state.invLastAutoFireAt = now;
      state.invProjectiles.push({ x: state.invShip.x, y: 90, hit: false });
      sfxLaser();
      const mgCanvas = invCanvasResizer.getCanvas();
      if(mgCanvas) spawnInvMuzzleFlash(mgCanvas);
    }

    updateInvGame(dt);
    renderInvCanvas();

    if(remaining <= 0){ finishInvRound(); return; }
    state.invRoundRAF = requestAnimationFrame(tick);
  }
  state.invRoundRAF = requestAnimationFrame(tick);
}

// Cancels an in-progress round cleanly — same role as cancelPopRound:
// called on natural round end AND when the teacher navigates away
// mid-round, so the rAF loop can never keep running in the background.
export function cancelInvRound(){
  if(state.invRoundRAF) cancelAnimationFrame(state.invRoundRAF);
  state.invRoundRAF = null;
  clearBossTimeout();
  if(state.invRoundActive){
    state.invRoundActive = false;
    const playArea = document.getElementById('invPlayArea');
    if(playArea) playArea.classList.add('idle');
    const canvas = invCanvasResizer.getCanvas();
    if(canvas){
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const beginBtn = document.getElementById('invBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishInvRound(){
  state.invRoundActive = false;
  state.invRoundRAF = null;
  clearBossTimeout();

  const playArea = document.getElementById('invPlayArea');
  playArea.classList.add('idle');

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

wireTeamManagementButtons({
  prefix: 'inv',
  getTeams: () => state.invTeams,
  renderScoreboard: renderInvScoreboard,
  cancelRound: cancelInvRound
});

document.getElementById('invBackBtn').addEventListener('click', () => goToStage(6));
document.getElementById('invNextBtn').addEventListener('click', () => goToStage(8));
