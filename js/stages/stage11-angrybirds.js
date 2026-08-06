import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { ensureAudio, beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { BIRDS_QUESTIONS, BIRD_LEVELS } from '../content/stage11-angrybirds.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves } from '../canvasEffects.js';

/* =========================================================
   STAGE 11 — SKY SLINGSHOT (Sahara desert overhaul)
   Team-turn structure identical to the other games: answer a
   question, then get ONE shot at a structure of sandstone blocks
   guarding clay pots, built as literal stacked towers. Drag anywhere
   on the board to pull back, release to launch — the launch vector
   is just the drag delta scaled and capped, not "grab the projectile
   precisely", so it stays forgiving for younger players. A dotted
   trajectory preview shows the predicted arc while aiming.

   Internal identifiers still say "birds"/"pigs" (state.birdsXxx,
   function names) even though the theme is now a desert catapult and
   clay pots, not birds/pigs — renaming every identifier across
   state.js/navigation.js/main.js/content/CSS for a purely cosmetic
   reskin wasn't worth the churn/risk; only the visible UI and visuals
   changed. "Sky Slingshot" as a stage label was already thematically
   neutral enough to carry the reskin without a rename.

   NEW this pass: destroying a block or pot triggers a cascading
   collapse — anything that was resting directly on it (checked via a
   simple bounds-overlap test against the level's static layout, not a
   full physics engine) topples and tumbles to the ground under
   gravity + rotation, recursively toppling whatever was resting on
   THAT too. Only a direct hit scores points; collapsed objects are a
   physical/visual payoff, not a scoring shortcut.
========================================================= */
const SHOTS_PER_TURN = 1;
const POINTS_PIG = 10; // fallback value for any pot authored without its own `value`
const POINTS_BLOCK = 3;
const SLING_X_PCT = 24, SLING_Y_PCT = 50;
const GROUND_Y_PCT = 88;
// Retuned as one connected set (2026-07-16), not a single knob — feedback
// was "clunky to pull back, not satisfying, physics off (no rolling, very
// slow)". maxPull (below, in computePull) went 0.13→0.20×canvas.width for
// real pull room; MAX_LAUNCH_SPEED_FACTOR went 0.6→0.95 to match; GRAVITY
// eased down a touch so the bigger shot actually hangs in a satisfying
// arc instead of just landing sooner and harder.
const GRAVITY = 780;
const GROUND_RESTITUTION = 0.42;
const MAX_LAUNCH_SPEED_FACTOR = 0.95; // × canvas.width, the speed at full pull-back
// Ground-roll friction (canvas-widths/s² deceleration) — once the
// projectile settles onto the sand it now rolls out under this constant
// deceleration instead of stopping dead on landing (the old code cut vx
// by 14% EVERY frame it touched ground, which decayed to a standstill in
// a few tenths of a second — no visible roll at all, and a big part of
// "physics are off"). A rolling shot can keep clipping targets after
// touchdown instead of a single point-of-impact mattering.
const ROLL_FRICTION_FACTOR = 0.55;
const ROLL_REST_SPEED = 16; // px/s, below which ground-rolling counts as stopped
// How long the board stays visible, settled, after the shot — long
// enough to actually see the collapse play out before the result
// modal covers everything. Same role as Plinko's PLINKO_LAND_PAUSE_MS.
const TURN_END_PAUSE_MS = 1300;

// Desert palette — sandstone blocks, terracotta pots, warm sky.
const SANDSTONE_FILL = '#D9A15C';
const SANDSTONE_EDGE = '#A9702F';
const POT_FILL = '#C9713F';
const POT_BAND = '#8A4A26';
const POT_HIGHLIGHT = '#F0C08A';
const EXPLOSIVE_FILL = '#E4574B';
const EXPLOSIVE_GLOW = '#FF8B3D';

/* =========================================================
   NEW MECHANICS (2026-08): explosive blocks, a multi-hit combo bonus,
   and swaying pots — see content/stage11-angrybirds.js's header
   comment for which of the 8 levels carry which. All three are
   additive: a level/object without these fields plays exactly as
   before.
========================================================= */
const POINTS_EXPLOSIVE_BONUS = 5; // on top of POINTS_BLOCK for the explosive block itself
const EXPLOSIVE_RADIUS_PCT = 14;  // chain-detonation radius, % of canvas width
const COMBO_BONUS_PER_HIT = 4;    // added for the 3rd hit onward in one shot
const PIG_SWAY_AMPLITUDE_PCT = 6;
const PIG_SWAY_SPEED = 1.4;       // radians of sine phase per second
// Same "scale canvas-drawn effects relative to a reference width" trick
// as Star Defender's canvasScale()/INV_REFERENCE_WIDTH — used only for
// the new shockwave rings, which came from that file's default sizing.
const BIRDS_REFERENCE_WIDTH = 900;

// A moving pot's true x is only ever computed here — both collision
// detection and rendering call this, so a shot can never "miss" against
// a position the player didn't actually see it at, or vice versa.
function pigLiveXPct(pig, nowMs){
  if(!pig.moving) return pig.x;
  return pig.x + Math.sin((nowMs / 1000) * PIG_SWAY_SPEED) * PIG_SWAY_AMPLITUDE_PCT;
}

let birdsRowColors = [];

export function renderBirdsTeamInputs(count){
  renderTeamSetupRows('birdsTeamInputs', 'birdsAddTeamBtn', count, birdsRowColors, renderBirdsTeamInputs);
}
renderBirdsTeamInputs(2);
wireAddTeamButton('birdsTeamInputs', 'birdsAddTeamBtn', renderBirdsTeamInputs);

document.getElementById('birdsStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#birdsTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.birdsTeams = names.map((name, i) => ({ name, color: birdsRowColors[i], total: 0 }));
  state.birdsCurrentTeam = 0;
  state.birdsTurnsPlayed = 0;
  state.birdsLevelIndex = 0;
  state.birdsQuestionOrder = shuffle(BIRDS_QUESTIONS.map((_, i) => i));

  document.getElementById('birdsSetup').classList.add('hidden');
  document.getElementById('birdsGame').classList.remove('hidden');
  document.getElementById('birdsGameOverBanner').classList.add('hidden');
  resizeBirdsCanvas();
  document.getElementById('birdsQDisplay').textContent = `1/${BIRDS_QUESTIONS.length}`;
  renderBirdsScoreboard();
  renderBirdsTurnBanner();
  loadBirdsLevel(0);
  renderBirdsCanvas();
});

function renderBirdsScoreboard(){
  renderTeamScoreboard('birdsTeamList', state.birdsTeams, state.birdsCurrentTeam);
}
function renderBirdsTurnBanner(){
  document.getElementById('birdsTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.birdsTeams[state.birdsCurrentTeam].name)}</strong>'s turn — question ${state.birdsTurnsPlayed + 1} of ${BIRDS_QUESTIONS.length}`;
}

/* =========================================================
   LEVEL SETUP
========================================================= */
function loadBirdsLevel(index){
  const template = BIRD_LEVELS[index % BIRD_LEVELS.length];
  state.birdsPigs = template.pigs.map(p => ({ ...p, alive: true, falling: false, settled: false }));
  state.birdsBlocks = template.blocks.map(b => ({ ...b, alive: true, falling: false, settled: false }));
  state.birdsShotsLeft = SHOTS_PER_TURN;
  state.birdsTurnScore = 0;
  birdsFloatTexts = [];
  birdsShockwaves = [];
  birdsShake = createShakeState();
  birdsHitsThisShot = 0;
  loadNextBird();
  document.getElementById('birdsShotsDisplay').textContent = String(state.birdsShotsLeft);
  document.getElementById('birdsScoreDisplay').textContent = '0';
}

function loadNextBird(){
  const canvas = birdsCanvasResizer.getCanvas();
  state.birdsBird = {
    x: canvas.width * (SLING_X_PCT / 100), y: canvas.height * (SLING_Y_PCT / 100),
    vx: 0, vy: 0, r: canvas.width * 0.017, launched: false, rotation: 0
  };
  birdsTrail = [];
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askBirdsQuestion(){
  const qIndex = state.birdsQuestionOrder[state.birdsTurnsPlayed];
  const q = BIRDS_QUESTIONS[qIndex];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('birdsBeginTurnBtn').addEventListener('click', beginBirdsTurn);
async function beginBirdsTurn(){
  document.getElementById('birdsBeginTurnBtn').disabled = true;
  document.getElementById('birdsPlayArea').classList.remove('idle');
  await askBirdsQuestion();
  loadBirdsLevel(state.birdsLevelIndex);
  document.getElementById('birdsHint').classList.remove('hidden');
  startBirdsRound();
}

function finishBirdsTurn(){
  const team = state.birdsTeams[state.birdsCurrentTeam];
  const total = state.birdsTurnScore;
  team.total += total;
  state.birdsTurnsPlayed++;
  state.birdsLevelIndex++;
  renderBirdsScoreboard();

  document.getElementById('birdsPlayArea').classList.add('idle');
  document.getElementById('birdsHint').classList.add('hidden');

  showBirdsResult().then(() => {
    if(state.birdsTurnsPlayed >= BIRDS_QUESTIONS.length){
      endBirdsGame();
    } else {
      state.birdsCurrentTeam = (state.birdsCurrentTeam + 1) % state.birdsTeams.length;
      renderBirdsScoreboard();
      renderBirdsTurnBanner();
      document.getElementById('birdsQDisplay').textContent = `${state.birdsTurnsPlayed + 1}/${BIRDS_QUESTIONS.length}`;
      document.getElementById('birdsBeginTurnBtn').disabled = false;
    }
  });
}

function showBirdsResult(){
  return showTurnResultModal('birdsNextTeamBtn', { teams: state.birdsTeams, currentTeamIndex: state.birdsCurrentTeam });
}

function endBirdsGame(){
  const winnerText = finishTeamGame({ prefix: 'birds', teams: state.birdsTeams });
  document.getElementById('birdsTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   AUDIO
========================================================= */
function sfxLaunch(){ beep(200, 0.1, 'sawtooth', 0.14); beep(320, 0.08, 'sawtooth', 0.1, 0.04); }
function sfxThud(){ if(state.muted) return; beep(110, 0.09, 'square', 0.14); }
function sfxPigPop(){
  if(state.muted) return;
  [520, 700, 880].forEach((f, i) => beep(f, 0.12, 'triangle', 0.16, i * 0.05));
}
// A short rising "tick" each time the pull crosses another 25% of power —
// audio feedback for how hard the shot will be, since a silent drag gave
// no sense of building tension. Ratcheted (only fires on NEW thresholds
// crossed this drag, tracked by stretchTicked below) rather than firing
// every frame, so it reads as a countdown of clicks, not a buzz.
function sfxStretchTick(power){
  if(state.muted) return;
  beep(320 + power * 260, 0.045, 'square', 0.07);
}

// Short motion trail behind the projectile while in flight — purely a
// visual trail (not part of `state`, same reasoning as Plinko's
// module-level hover-preview vars: transient UI, not game data).
let birdsTrail = [];

// Rising "+N" text on every block/pot hit — same shared canvas
// float-text helper every other canvas game uses.
let birdsFloatTexts = [];

// Screen shake on a solid hit — a brief, decaying random jitter applied
// to the whole canvas draw in renderBirdsCanvas. Added per feedback that
// impacts weren't "satisfying"; a hit that only removed a sprite and
// spawned a few particles read as flat next to the bigger pull-back and
// faster shots elsewhere in this rework. Now built on the shared
// js/canvasEffects.js helper (this file's own version was the pattern's
// origin — Star Defender/Plinko each independently copied it — so this
// is the same behavior, just one shared implementation going forward).
let birdsShake = createShakeState();

// Shockwave rings on the biggest moments (explosive blocks, big combos)
// — same shared helper, new to this game (previously only particles +
// shake marked a hit, with nothing distinguishing an explosive/combo
// moment from a routine one).
let birdsShockwaves = [];

function updateBirdsTrail(bird){
  birdsTrail.unshift({ x: bird.x, y: bird.y, alpha: 1 });
  if(birdsTrail.length > 10) birdsTrail.pop();
  for(let i = 0; i < birdsTrail.length; i++) birdsTrail[i].alpha = 1 - i / birdsTrail.length;
}

/* =========================================================
   PARTICLES (shared little gravity+decay burst, same recipe as
   Ball Pop/Plinko's particle systems)
========================================================= */
function spawnBirdsParticles(x, y, color, count = 18){
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7 + 2;
    state.birdsParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
      alpha: 1, decay: Math.random() * 0.02 + 0.012, size: Math.random() * 6 + 2, color
    });
  }
}
function updateBirdsParticles(){
  for(const p of state.birdsParticles){
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.vx *= 0.98;
    p.alpha -= p.decay; p.size *= 0.97;
  }
  state.birdsParticles = state.birdsParticles.filter(p => p.alpha > 0 && p.size > 0.3);
}

/* =========================================================
   COMBO — how many blocks/pots this ONE shot has scored against so far
   (a rolling/bouncing shot can rack up several across multiple frames,
   not just the first impact). Reset once per turn in loadBirdsLevel,
   since there's only ever one shot. The 3rd hit onward stacks a bonus
   on top of whatever those objects were already worth — rewards a shot
   that clips a lot for MORE than just the sum of its parts, addressing
   the exact thing multi-hit shots were missing before.
========================================================= */
let birdsHitsThisShot = 0;

function registerBirdsHit(px, py){
  birdsHitsThisShot++;
  if(birdsHitsThisShot < 3) return;
  state.birdsTurnScore += COMBO_BONUS_PER_HIT;
  document.getElementById('birdsScoreDisplay').textContent = String(state.birdsTurnScore);
  spawnFloatText(birdsFloatTexts, px, py - 8, `COMBO x${birdsHitsThisShot}!`, '#7CFFEA', -1.6);
  spawnShockwave(birdsShockwaves, px, py, '#7CFFEA', { big: birdsHitsThisShot >= 4 });
  triggerShake(birdsShake, Math.min(10, 4 + birdsHitsThisShot));
  sfxRisingChime([700, 900, 1100, 1300].slice(0, Math.min(4, birdsHitsThisShot - 1)), { stagger: 0.045, duration: 0.09 });
}

// A wider chain-detonation around an explosive block — everything
// within EXPLOSIVE_RADIUS_PCT that's still alive gets destroyed (and
// scored) outright, not just toppled the way a normal collapse does;
// triggerCollapse still runs for each one too, so whatever was resting
// on THEM keeps falling exactly as it would from a direct hit.
function triggerExplosion(centerBlock, canvas){
  const cx = centerBlock.x, cy = centerBlock.y;
  const bx = canvas.width * (cx / 100), by = canvas.height * (cy / 100);
  spawnBirdsParticles(bx, by, EXPLOSIVE_GLOW, 40);
  spawnShockwave(birdsShockwaves, bx, by, EXPLOSIVE_GLOW, { big: true });
  triggerShake(birdsShake, 12);
  sfxImpact(1.3);

  const pool = [...state.birdsBlocks, ...state.birdsPigs];
  for(const obj of pool){
    if(obj === centerBlock || !obj.alive || obj.falling) continue;
    if(Math.hypot(obj.x - cx, obj.y - cy) > EXPLOSIVE_RADIUS_PCT) continue;
    obj.alive = false;
    const isPig = obj.w === undefined;
    const value = isPig ? (obj.value != null ? obj.value : POINTS_PIG) : POINTS_BLOCK;
    state.birdsTurnScore += value;
    document.getElementById('birdsScoreDisplay').textContent = String(state.birdsTurnScore);
    const ox = canvas.width * (obj.x / 100), oy = canvas.height * (obj.y / 100);
    spawnBirdsParticles(ox, oy, isPig ? POT_FILL : SANDSTONE_FILL, 16);
    spawnFloatText(birdsFloatTexts, ox, oy, `+${value}`, isPig ? POT_FILL : SANDSTONE_FILL);
    registerBirdsHit(ox, oy);
    triggerCollapse(obj);
  }
}

/* =========================================================
   CASCADING COLLAPSE
   Event-driven, not checked every frame: only re-evaluated at the
   instant something is destroyed. A block/pot's % footprint (from
   the static level layout) is compared against every other still-
   solid object's footprint — anything resting directly on top
   (x-ranges overlap AND its bottom edge sits at the destroyed
   object's top edge, within a small tolerance) starts falling, and
   whatever was resting on THAT is checked too (BFS), so a base-block
   hit can bring an entire tower down in one shot.
========================================================= */
function objBoundsPct(obj){
  if(obj.w !== undefined){
    return { left: obj.x - obj.w / 2, right: obj.x + obj.w / 2, top: obj.y - obj.h / 2, bottom: obj.y + obj.h / 2 };
  }
  return { left: obj.x - obj.r, right: obj.x + obj.r, top: obj.y - obj.r, bottom: obj.y + obj.r };
}

// Gives the object a small upward "pop" before gravity takes over —
// reads as being physically knocked loose, not just switched to
// falling. Runtime fall position/velocity are tracked in real px
// (fallX/fallY/fallVX/fallVY), same as the projectile itself, since a
// tumbling object accumulating velocity doesn't fit the %-of-canvas
// convention static level objects normally use.
function startFalling(obj){
  const canvas = birdsCanvasResizer.getCanvas();
  obj.falling = true;
  obj.settled = false;
  obj.fallX = canvas.width * (obj.x / 100);
  obj.fallY = canvas.height * (obj.y / 100);
  obj.fallVX = (Math.random() - 0.5) * 70;
  obj.fallVY = -40 - Math.random() * 40;
  obj.rotation = 0;
  obj.spin = (Math.random() - 0.5) * 5;
}

function triggerCollapse(destroyed){
  const TOL = 2.2; // % of canvas — adjacency tolerance for "resting on"
  const pool = [...state.birdsBlocks, ...state.birdsPigs];
  const queue = [destroyed];
  while(queue.length){
    const base = queue.shift();
    const bb = objBoundsPct(base);
    for(const obj of pool){
      if(obj === base || obj.falling || !obj.alive) continue;
      const ob = objBoundsPct(obj);
      const xOverlap = ob.left < bb.right && ob.right > bb.left;
      const resting = Math.abs(ob.bottom - bb.top) < TOL;
      if(xOverlap && resting){
        startFalling(obj);
        queue.push(obj);
      }
    }
  }
}

function updateFallingObjects(dtSec, canvas){
  const groundY = canvas.height * (GROUND_Y_PCT / 100);
  for(const obj of [...state.birdsBlocks, ...state.birdsPigs]){
    if(!obj.falling || obj.settled) continue;
    obj.fallVY += GRAVITY * dtSec;
    obj.fallX += obj.fallVX * dtSec;
    obj.fallY += obj.fallVY * dtSec;
    obj.rotation = (obj.rotation || 0) + (obj.spin || 0) * dtSec;
    const halfSize = obj.w !== undefined ? canvas.height * (obj.h / 100) / 2 : canvas.width * (obj.r / 100);
    if(obj.fallY + halfSize >= groundY){
      obj.fallY = groundY - halfSize;
      obj.settled = true;
      obj.fallVX = 0; obj.fallVY = 0;
      spawnBirdsParticles(obj.fallX, obj.fallY, SANDSTONE_FILL, 10);
      sfxThud();
    }
  }
}

/* =========================================================
   CANVAS SIZING
========================================================= */
const birdsCanvasResizer = createCanvasResizer('birdsCanvas', 'birdsPlayArea');
export function resizeBirdsCanvas(){ birdsCanvasResizer.resize(); }
// Called on the compact-mode toggle (see main.js) — same role as
// ensureInvLayout/ensurePlinkoLayout, since that toggle resizes the
// stage box via a pure CSS class with no native 'resize' event.
export function ensureBirdsLayout(){
  if(state.birdsTeams.length > 0) resizeBirdsCanvas();
}

/* =========================================================
   AIM / DRAG INPUT
   Deliberately forgiving: dragging from ANYWHERE on the board (not
   just precisely grabbing the projectile) aims the shot — the launch
   vector is just the drag delta, capped and scaled. Easier for
   younger players than requiring a precise grab.
========================================================= */
let dragging = false;
let dragStart = null;
let dragCurrent = null;
let stretchTicked = 0; // highest 25%-power threshold already ticked this drag (0-4)

function canvasPoint(canvas, e){
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// The single source of truth for "where is the pulled-back projectile,
// and how much power does that represent" — used by BOTH the trajectory
// preview and the actual launch, so they can never disagree. Critically,
// the returned point is clamped to stay fully inside the play area no
// matter how far the real mouse has actually moved.
function computePull(canvas){
  const slingX = canvas.width * (SLING_X_PCT / 100), slingY = canvas.height * (SLING_Y_PCT / 100);
  const groundY = canvas.height * (GROUND_Y_PCT / 100);
  const r = state.birdsBird ? state.birdsBird.r : canvas.width * 0.017;
  // Up from 0.13 — feedback was that pulling back "feels clunky", and the
  // old range gave barely any room to build up a satisfying draw before
  // hitting the clamp below.
  const maxPull = canvas.width * 0.20;

  const rawDx = dragStart.x - dragCurrent.x, rawDy = dragStart.y - dragCurrent.y;
  const rawDist = Math.hypot(rawDx, rawDy);
  const dist = Math.min(rawDist, maxPull);
  const nx = rawDist > 0 ? rawDx / rawDist : 0, ny = rawDist > 0 ? rawDy / rawDist : 0;

  let x = slingX - nx * dist, y = slingY - ny * dist;
  x = Math.max(r * 1.3, Math.min(canvas.width - r * 1.3, x));
  y = Math.max(r * 1.3, Math.min(groundY - r * 1.3, y));

  // Recompute the effective pull FROM the clamped point, so power/
  // direction always exactly match what was drawn on screen.
  const edx = slingX - x, edy = slingY - y;
  const edist = Math.hypot(edx, edy);
  const power = Math.min(edist / maxPull, 1);
  return {
    x, y, power, dist: edist,
    nx: edist > 0 ? edx / edist : 0, ny: edist > 0 ? edy / edist : 0,
    slingX, slingY, groundY, maxPull
  };
}

function onBirdsPointerDown(e){
  if(!state.birdsRoundActive || !state.birdsBird || state.birdsBird.launched || state.birdsShotsLeft <= 0) return;
  const canvas = birdsCanvasResizer.getCanvas();
  dragging = true;
  dragStart = canvasPoint(canvas, e);
  dragCurrent = { ...dragStart };
  stretchTicked = 0;
  document.getElementById('birdsHint').classList.add('hidden');
}
function onBirdsPointerMove(e){
  if(!dragging) return;
  const canvas = birdsCanvasResizer.getCanvas();
  dragCurrent = canvasPoint(canvas, e);
  const pull = computePull(canvas);
  const threshold = Math.floor(pull.power * 4); // 0-4, one per 25%
  if(threshold > stretchTicked){
    stretchTicked = threshold;
    sfxStretchTick(pull.power);
  }
  renderBirdsCanvas();
}
function onBirdsPointerUp(){
  if(!dragging) return;
  dragging = false;
  const canvas = birdsCanvasResizer.getCanvas();
  const pull = computePull(canvas);

  if(pull.dist < 10){ renderBirdsCanvas(); return; } // too small a drag — not a real launch attempt

  const speed = pull.power * canvas.width * MAX_LAUNCH_SPEED_FACTOR;
  const bird = state.birdsBird;
  bird.vx = pull.nx * speed;
  bird.vy = pull.ny * speed;
  bird.launched = true;
  state.birdsShotsLeft--;
  document.getElementById('birdsShotsDisplay').textContent = String(state.birdsShotsLeft);
  sfxLaunch();
}
// Safety net: if the window loses focus mid-drag (cursor left the
// browser entirely, alt-tab, etc.) mousemove/mouseup can stop firing —
// without this the drag would stay "stuck" open indefinitely.
function cancelDragIfStuck(){
  if(dragging){ dragging = false; renderBirdsCanvas(); }
}

const birdsCanvasEl = birdsCanvasResizer.getCanvas();
birdsCanvasEl.addEventListener('mousedown', onBirdsPointerDown);
window.addEventListener('mousemove', onBirdsPointerMove);
window.addEventListener('mouseup', onBirdsPointerUp);
window.addEventListener('blur', cancelDragIfStuck);
birdsCanvasEl.addEventListener('touchstart', (e) => { onBirdsPointerDown(e.touches[0]); e.preventDefault(); }, { passive: false });
birdsCanvasEl.addEventListener('touchmove', (e) => { onBirdsPointerMove(e.touches[0]); e.preventDefault(); }, { passive: false });
birdsCanvasEl.addEventListener('touchend', onBirdsPointerUp);

/* =========================================================
   PHYSICS
========================================================= */
function circleRectHit(cx, cy, cr, rx, ry, rw, rh){
  const closestX = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
  const closestY = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));
  const dx = cx - closestX, dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}

let birdsFinishTimeout = null;

function updateBirdsPhysics(dt){
  const canvas = birdsCanvasResizer.getCanvas();
  const dtSec = Math.min(0.032, dt / 1000);

  // Falling/collapsing debris and particles animate regardless of
  // whether the projectile itself is still in flight — a tower can
  // still be mid-collapse after the projectile has already settled.
  updateFallingObjects(dtSec, canvas);
  updateBirdsParticles();
  birdsFloatTexts = updateFloatTexts(birdsFloatTexts);
  birdsShockwaves = updateShockwaves(birdsShockwaves);

  const bird = state.birdsBird;
  if(!bird || !bird.launched) return;

  bird.vy += GRAVITY * dtSec;
  bird.x += bird.vx * dtSec;
  bird.y += bird.vy * dtSec;
  // Faux rolling, same recipe as Billiards' ball `angle` — rotation rate
  // tied to CURRENT speed every frame (direction from vx's sign) instead
  // of a random spin fixed once at launch, so the projectile visibly
  // speeds up/slows down its spin as gravity and impacts change its
  // actual speed. This was the literal "no rolling" complaint: the old
  // constant spin didn't respond to the flight at all.
  {
    const spinSpeed = Math.hypot(bird.vx, bird.vy);
    const dir = bird.vx < 0 ? -1 : 1;
    bird.rotation = (bird.rotation || 0) + (spinSpeed / bird.r) * dtSec * dir;
  }
  updateBirdsTrail(bird);

  const groundY = canvas.height * (GROUND_Y_PCT / 100);
  if(bird.y + bird.r > groundY){
    bird.y = groundY - bird.r;
    // A small bounce below this speed just settles instead of reflecting
    // — without a cutoff, restitution keeps producing smaller and smaller
    // bounces indefinitely, which reads as jitter rather than "coming to
    // rest".
    if(Math.abs(bird.vy) < 70){
      bird.vy = 0;
    } else {
      bird.vy = -bird.vy * GROUND_RESTITUTION;
      sfxThud();
    }
  }
  // Ground-roll: once resting vertically, vx decays under constant
  // friction instead of the old per-frame multiplicative cut (which
  // decayed to zero in a few tenths of a second — no visible roll
  // distance at all). A shot that lands short can now keep sliding
  // through whatever's directly ahead instead of a single impact point
  // being all that matters.
  if(bird.vy === 0 && bird.y + bird.r >= groundY - 1){
    const rollSpeed = Math.abs(bird.vx);
    if(rollSpeed > 0){
      const decel = canvas.width * ROLL_FRICTION_FACTOR * dtSec;
      const newSpeed = Math.max(0, rollSpeed - decel);
      bird.vx = Math.sign(bird.vx) * newSpeed;
    }
  }

  for(const block of state.birdsBlocks){
    if(!block.alive || block.falling) continue;
    const bx = canvas.width * (block.x / 100), by = canvas.height * (block.y / 100);
    const bw = canvas.width * (block.w / 100), bh = canvas.height * (block.h / 100);
    if(circleRectHit(bird.x, bird.y, bird.r, bx, by, bw, bh)){
      block.alive = false;
      if(block.type === 'explosive'){
        const total = POINTS_BLOCK + POINTS_EXPLOSIVE_BONUS;
        state.birdsTurnScore += total;
        document.getElementById('birdsScoreDisplay').textContent = String(state.birdsTurnScore);
        spawnFloatText(birdsFloatTexts, bx, by, `+${total}`, EXPLOSIVE_GLOW);
        registerBirdsHit(bx, by);
        triggerExplosion(block, canvas); // its own particles/shockwave/shake/sfx — bigger than a normal hit's
      } else {
        state.birdsTurnScore += POINTS_BLOCK;
        document.getElementById('birdsScoreDisplay').textContent = String(state.birdsTurnScore);
        spawnBirdsParticles(bx, by, SANDSTONE_FILL, 20);
        spawnFloatText(birdsFloatTexts, bx, by, `+${POINTS_BLOCK}`, SANDSTONE_FILL);
        sfxThud();
        triggerShake(birdsShake, 5);
        registerBirdsHit(bx, by);
      }
      triggerCollapse(block);
      bird.vx *= 0.6; bird.vy *= 0.6;
      bird.vx += (Math.random() - 0.5) * 80;
      break; // one collision resolved per frame — avoids double-dampening against a neighboring block on the same tick
    }
  }
  for(const pig of state.birdsPigs){
    if(!pig.alive || pig.falling) continue;
    // Live (possibly swaying) position — the same value the render loop
    // draws the pot at, so a shot can never hit/miss somewhere the
    // player didn't actually see it.
    const pigXPct = pigLiveXPct(pig, performance.now());
    const px = canvas.width * (pigXPct / 100), py = canvas.height * (pig.y / 100), pr = canvas.width * (pig.r / 100);
    const dx = bird.x - px, dy = bird.y - py;
    if(Math.hypot(dx, dy) < bird.r + pr){
      pig.alive = false;
      const value = pig.value != null ? pig.value : POINTS_PIG;
      state.birdsTurnScore += value;
      document.getElementById('birdsScoreDisplay').textContent = String(state.birdsTurnScore);
      spawnBirdsParticles(px, py, POT_FILL, 26);
      spawnFloatText(birdsFloatTexts, px, py, `+${value}`, POT_FILL);
      sfxPigPop();
      // Bigger pots (worth more) land a bigger shake — scales the "juice"
      // with how good a hit it was, not a flat amount every time.
      triggerShake(birdsShake, 6 + value * 0.15);
      registerBirdsHit(px, py);
      triggerCollapse(pig);
      bird.vx *= 0.7; bird.vy *= 0.7;
      break;
    }
  }

  const speed = Math.hypot(bird.vx, bird.vy);
  const resting = speed < ROLL_REST_SPEED && bird.y + bird.r >= groundY - 1;
  const offscreen = bird.x < -bird.r * 2 || bird.x > canvas.width + bird.r * 2 || bird.y > canvas.height + bird.r * 4;

  // Exactly one shot per turn now — once it resolves, the turn is over
  // regardless of what's left standing (no more "birds remaining, load
  // the next one" branch, since there's never a second shot to load).
  if(resting || offscreen){
    bird.launched = false;
    bird.vx = 0; bird.vy = 0;
    clearTimeout(birdsFinishTimeout);
    birdsFinishTimeout = setTimeout(finishBirdsTurn, TURN_END_PAUSE_MS);
  }
}

function startBirdsRound(){
  state.birdsRoundActive = true;
  let lastTime = performance.now();
  function tick(now){
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    updateBirdsPhysics(dt);
    renderBirdsCanvas();
    if(state.birdsRoundActive){
      state.birdsRoundRAF = requestAnimationFrame(tick);
    }
  }
  state.birdsRoundRAF = requestAnimationFrame(tick);
}

export function cancelBirdsRound(){
  if(state.birdsRoundRAF) cancelAnimationFrame(state.birdsRoundRAF);
  state.birdsRoundRAF = null;
  state.birdsRoundActive = false;
  clearTimeout(birdsFinishTimeout);
  dragging = false;
  state.birdsBird = null;
  state.birdsParticles = [];
  birdsTrail = [];
  birdsFloatTexts = [];
  birdsShockwaves = [];
  const playArea = document.getElementById('birdsPlayArea');
  if(playArea) playArea.classList.add('idle');
  const hint = document.getElementById('birdsHint');
  if(hint) hint.classList.add('hidden');
  const canvas = birdsCanvasResizer.getCanvas();
  if(canvas){ const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
  const beginBtn = document.getElementById('birdsBeginTurnBtn');
  if(beginBtn) beginBtn.disabled = false;
}

/* =========================================================
   RENDERING — Sahara desert scene
========================================================= */
function drawBirdsBackground(ctx, canvas, groundY){
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#F7D08A'); sky.addColorStop(0.6, '#F0A868'); sky.addColorStop(1, '#E8935C');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, groundY);

  // Sun disc with a soft glow.
  const sunX = canvas.width * 0.82, sunY = canvas.height * 0.18, sunR = canvas.width * 0.045;
  ctx.save();
  ctx.shadowColor = '#FFE1A8'; ctx.shadowBlur = sunR * 1.4;
  ctx.fillStyle = '#FFEFC2';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Distant pyramids — flat triangles, muted so they read as far away.
  ctx.fillStyle = 'rgba(150,90,50,0.35)';
  [[0.14, 0.055], [0.24, 0.04]].forEach(([xf, sf]) => {
    const baseX = canvas.width * xf, baseY = groundY, s = canvas.width * sf;
    ctx.beginPath();
    ctx.moveTo(baseX - s, baseY);
    ctx.lineTo(baseX, baseY - s * 1.3);
    ctx.lineTo(baseX + s, baseY);
    ctx.closePath();
    ctx.fill();
  });

  // A palm tree accent, far right.
  const palmX = canvas.width * 0.94, palmBaseY = groundY;
  ctx.strokeStyle = 'rgba(110,70,40,0.55)';
  ctx.lineWidth = Math.max(3, canvas.width * 0.006);
  ctx.beginPath();
  ctx.moveTo(palmX, palmBaseY);
  ctx.quadraticCurveTo(palmX + canvas.width * 0.01, palmBaseY - canvas.width * 0.05, palmX + canvas.width * 0.006, palmBaseY - canvas.width * 0.09);
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,120,50,0.55)';
  const frondY = palmBaseY - canvas.width * 0.09;
  [-1, -0.5, 0, 0.5, 1].forEach(a => {
    ctx.beginPath();
    ctx.ellipse(palmX + canvas.width * 0.006 + a * canvas.width * 0.018, frondY - Math.abs(a) * canvas.width * 0.006,
      canvas.width * 0.02, canvas.width * 0.008, a * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sand ground with soft dune-ridge curves layered for depth.
  const ground = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  ground.addColorStop(0, '#E8C382'); ground.addColorStop(1, '#C99B5C');
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = 'rgba(180,130,70,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, groundY + canvas.height * 0.03);
  ctx.quadraticCurveTo(canvas.width * 0.3, groundY - canvas.height * 0.015, canvas.width * 0.6, groundY + canvas.height * 0.02);
  ctx.quadraticCurveTo(canvas.width * 0.85, groundY + canvas.height * 0.045, canvas.width, groundY + canvas.height * 0.015);
  ctx.lineTo(canvas.width, groundY); ctx.lineTo(0, groundY);
  ctx.closePath(); ctx.fill();
}

function drawCatapult(ctx, canvas, slingX, slingY, groundY){
  const legTopY = slingY - canvas.height * 0.02;
  const legSpread = canvas.width * 0.028;
  const baseSpread = canvas.width * 0.055;
  ctx.strokeStyle = '#8B6239'; ctx.lineWidth = Math.max(5, canvas.width * 0.01); ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(slingX - baseSpread, groundY);
  ctx.lineTo(slingX - legSpread, legTopY);
  ctx.moveTo(slingX + baseSpread, groundY);
  ctx.lineTo(slingX + legSpread, legTopY);
  ctx.stroke();
  // Crossbar bracing the A-frame.
  ctx.lineWidth = Math.max(3, canvas.width * 0.006);
  ctx.beginPath();
  ctx.moveTo(slingX - baseSpread * 0.6, groundY - canvas.height * 0.06);
  ctx.lineTo(slingX + baseSpread * 0.6, groundY - canvas.height * 0.06);
  ctx.stroke();
  // Rope down to a small wooden base pin.
  ctx.strokeStyle = '#6B4A28'; ctx.lineWidth = Math.max(2, canvas.width * 0.0035);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(slingX, legTopY);
  ctx.lineTo(slingX, groundY - canvas.height * 0.008);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Same recipe as Billiards' drawBilliardsPowerMeter — reads pull.power,
// the exact 0-1 value the real launch uses, so it can never disagree
// with the shot it represents. Added per feedback that pulling back had
// no feedback on how hard the resulting shot would actually be.
function drawBirdsPowerMeter(ctx, canvas, power){
  const barW = canvas.width * 0.22, barH = Math.max(10, canvas.height * 0.026);
  const x = (canvas.width - barW) / 2, y = canvas.height * 0.04;

  ctx.save();
  ctx.fillStyle = 'rgba(20,20,30,0.28)';
  ctx.beginPath();
  ctx.roundRect(x, y, barW, barH, barH / 2);
  ctx.fill();

  const fillColor = power < 0.5 ? '#5C9C7C' : power < 0.8 ? '#C97A3D' : '#C1665C';
  const fillW = Math.max(barH, barW * power);
  ctx.shadowColor = fillColor; ctx.shadowBlur = 10;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.roundRect(x, y, fillW, barH, barH / 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(70,45,20,0.85)';
  ctx.font = `bold ${Math.max(11, barH * 0.62)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('POWER', x + barW / 2, y - 4);
  ctx.restore();
}

function renderBirdsCanvas(){
  const canvas = birdsCanvasResizer.getCanvas();
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  applyShake(ctx, birdsShake);

  const groundY = canvas.height * (GROUND_Y_PCT / 100);
  drawBirdsBackground(ctx, canvas, groundY);

  const slingX = canvas.width * (SLING_X_PCT / 100), slingY = canvas.height * (SLING_Y_PCT / 100);
  drawCatapult(ctx, canvas, slingX, slingY, groundY);

  // Blocks (sandstone) — falling ones render at their live px fall
  // position + rotation instead of the static %-based layout position.
  for(const block of state.birdsBlocks){
    if(!block.alive) continue;
    let bx, by, rot = 0;
    if(block.falling){ bx = block.fallX; by = block.fallY; rot = block.rotation || 0; }
    else { bx = canvas.width * (block.x / 100); by = canvas.height * (block.y / 100); }
    const bw = canvas.width * (block.w / 100), bh = canvas.height * (block.h / 100);
    const isExplosive = block.type === 'explosive';
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    // A slow pulsing glow marks an explosive block as "special" before
    // it's ever hit — same "communicate value/danger at a glance"
    // language as the chief pots' gold band.
    if(isExplosive){
      ctx.shadowColor = EXPLOSIVE_GLOW;
      ctx.shadowBlur = 10 + 6 * Math.sin(performance.now() / 160);
    }
    ctx.fillStyle = isExplosive ? EXPLOSIVE_FILL : SANDSTONE_FILL;
    ctx.strokeStyle = isExplosive ? EXPLOSIVE_GLOW : SANDSTONE_EDGE; ctx.lineWidth = isExplosive ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 4);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    if(isExplosive){
      // A small starburst mark — same silhouette idea as Fruit Ninja's
      // bomb fuse, reused here as the "this one's different" cue.
      ctx.fillStyle = '#FFE3A8';
      ctx.beginPath();
      const spikes = 5, r1 = bw * 0.16, r2 = bw * 0.07;
      for(let i = 0; i < spikes * 2; i++){
        const rad = i % 2 === 0 ? r1 : r2;
        const a = (Math.PI / spikes) * i;
        const spx = Math.sin(a) * rad, spy = -Math.cos(a) * rad;
        if(i === 0) ctx.moveTo(spx, spy); else ctx.lineTo(spx, spy);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Pots — a decorated clay urn (belly + neck + band + a friendly
  // painted face) replacing the old green smiley "pig". Higher-value
  // pots (see BIRD_LEVELS' `value` field) get a gold band + a subtle
  // glow instead of the standard brown band, so a "chief" pot reads as
  // a bigger prize at a glance, same "size/color communicates value"
  // language as Billiards' numbered balls.
  for(const pig of state.birdsPigs){
    if(!pig.alive) continue;
    let px, py, rot = 0;
    if(pig.falling){ px = pig.fallX; py = pig.fallY; rot = pig.rotation || 0; }
    else { px = canvas.width * (pigLiveXPct(pig, performance.now()) / 100); py = canvas.height * (pig.y / 100); }
    const pr = canvas.width * (pig.r / 100);
    const value = pig.value != null ? pig.value : POINTS_PIG;
    const bandColor = value >= 25 ? '#D9A62B' : POT_BAND;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.shadowColor = value >= 25 ? 'rgba(217,166,43,0.55)' : 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = value >= 25 ? 12 : 6; ctx.shadowOffsetY = value >= 25 ? 0 : 3;
    ctx.fillStyle = POT_FILL;
    ctx.beginPath();
    ctx.ellipse(0, pr * 0.1, pr * 0.95, pr * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // Neck
    ctx.fillRect(-pr * 0.28, -pr * 0.95, pr * 0.56, pr * 0.45);
    // Lip
    ctx.beginPath(); ctx.ellipse(0, -pr * 0.95, pr * 0.32, pr * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    // Decorative band
    ctx.strokeStyle = bandColor; ctx.lineWidth = Math.max(1.5, pr * 0.12);
    ctx.beginPath(); ctx.ellipse(0, pr * 0.05, pr * 0.9, pr * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    // Highlight
    ctx.fillStyle = POT_HIGHLIGHT; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.ellipse(-pr * 0.32, -pr * 0.1, pr * 0.18, pr * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // Friendly painted face
    ctx.fillStyle = bandColor;
    ctx.beginPath(); ctx.arc(-pr * 0.3, pr * 0.05, pr * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pr * 0.3, pr * 0.05, pr * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = bandColor; ctx.lineWidth = Math.max(1.5, pr * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, pr * 0.22, pr * 0.3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
  }

  // Particles
  for(const p of state.birdsParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawShockwaves(ctx, birdsShockwaves, canvas.width / BIRDS_REFERENCE_WIDTH);
  drawFloatTexts(ctx, birdsFloatTexts, Math.max(16, canvas.width * 0.024));

  // Trajectory preview + sling bands while aiming. Band color/glow
  // intensifies with pull power (same green->amber->red language as the
  // power meter) so the elastic itself reads as "how hard", not just the
  // separate bar — a stronger visual tie between the two than before.
  if(dragging && dragStart && dragCurrent && state.birdsBird){
    const pull = computePull(canvas);
    const bandColor = pull.power < 0.5 ? '#8B6239' : pull.power < 0.8 ? '#C97A3D' : '#C1665C';

    ctx.save();
    ctx.strokeStyle = bandColor;
    ctx.lineWidth = Math.max(3, canvas.width * 0.005) * (1 + pull.power * 0.4);
    ctx.lineCap = 'round';
    if(pull.power > 0.5){ ctx.shadowColor = bandColor; ctx.shadowBlur = 8 * pull.power; }
    ctx.beginPath();
    ctx.moveTo(slingX - canvas.width * 0.02, slingY - canvas.height * 0.015);
    ctx.lineTo(pull.x, pull.y);
    ctx.moveTo(slingX + canvas.width * 0.02, slingY - canvas.height * 0.015);
    ctx.lineTo(pull.x, pull.y);
    ctx.stroke();
    ctx.restore();

    // Pouch — a small leather patch where the projectile actually sits,
    // so the bands read as holding something rather than meeting at a
    // bare point.
    ctx.save();
    ctx.fillStyle = '#6B4A28';
    ctx.beginPath();
    ctx.ellipse(pull.x, pull.y, canvas.width * 0.014, canvas.width * 0.009,
      Math.atan2(slingY - pull.y, slingX - pull.x), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if(pull.dist > 10){
      const speed = pull.power * canvas.width * MAX_LAUNCH_SPEED_FACTOR;
      let sx = pull.x, sy = pull.y, svx = pull.nx * speed, svy = pull.ny * speed;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for(let i = 1; i <= 7; i++){
        const t = i * 0.09;
        const px = sx + svx * t, py = sy + svy * t + 0.5 * GRAVITY * t * t;
        if(py > groundY) break;
        ctx.beginPath(); ctx.arc(px, py, Math.max(2, canvas.width * 0.004), 0, Math.PI * 2); ctx.fill();
      }
      drawBirdsPowerMeter(ctx, canvas, pull.power);
    }
    state.birdsBird.x = pull.x; state.birdsBird.y = pull.y;
  } else if(state.birdsBird && !state.birdsBird.launched){
    state.birdsBird.x = slingX; state.birdsBird.y = slingY;
  }

  // Projectile — a spinning faceted gem, recolored gold/amber for the
  // desert theme (was purple/pink). Rotation is driven by the ball's
  // CURRENT speed every frame (see updateBirdsPhysics), not a fixed
  // spin set once at launch — genuine rolling that speeds up/slows down
  // with the actual flight, not a decorative constant twirl.
  const bird = state.birdsBird;
  if(bird){
    if(bird.launched){
      for(const t of birdsTrail){
        ctx.save();
        ctx.globalAlpha = t.alpha * 0.5;
        ctx.fillStyle = '#F0A840';
        ctx.beginPath(); ctx.arc(t.x, t.y, bird.r * 0.6 * t.alpha, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation || 0);
    ctx.shadowColor = '#F0A840'; ctx.shadowBlur = 16;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bird.r);
    grad.addColorStop(0, '#FFF6C8'); grad.addColorStop(0.5, '#FFB74D'); grad.addColorStop(1, '#C9631A');
    ctx.fillStyle = grad;
    const points = 6;
    ctx.beginPath();
    for(let i = 0; i < points * 2; i++){
      const radius = i % 2 === 0 ? bird.r : bird.r * 0.48;
      const angle = (Math.PI / points) * i;
      const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(0, 0, bird.r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // matches the shake ctx.save() at the top of this function
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'birds',
  getTeams: () => state.birdsTeams,
  renderScoreboard: renderBirdsScoreboard,
  cancelRound: cancelBirdsRound
});

document.getElementById('birdsBackBtn').addEventListener('click', () => goToStage(10));
