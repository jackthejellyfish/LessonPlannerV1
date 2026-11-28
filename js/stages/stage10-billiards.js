import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { askTeamQuestion } from '../questionChoices.js';
import { pickQuestions, GAME_TURNS } from '../questionDeck.js';
import { beep } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { BILLIARDS_QUESTIONS, BILLIARDS_BALLS } from '../content/stage10-billiards.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, spawnShockwave, updateShockwaves, drawShockwaves, stepParticles, frameFactor } from '../canvasEffects.js';
import { particleCount, noteFrame } from '../quality.js';

// Rising "+N" text on every pocketed ball — same shared canvas
// float-text helper every other canvas game uses.
let billiardsFloatTexts = [];
// Shake + shockwave on a pocket capture — new (2026-08 consistency
// pass): this was previously the flattest feedback in the app, every
// ball (1-6pt) getting the identical 22-particle/3-note treatment with
// no scaling at all. Same shared js/canvasEffects.js helper every other
// game now uses.
let billiardsShake = createShakeState();
let billiardsShockwaves = [];

/* ---- Render on demand ----
   Billiards is turn-based: most of a turn is the class discussing a
   shot while every ball sits still. The loop used to redraw the whole
   table 60 times a second regardless. Now a frame is only drawn while
   something is actually changing (a ball rolling or dropping, an effect
   fading, a shake) plus a couple of frames after it stops so the final
   positions land. Anything that changes the picture without going
   through the physics (a resize, a new rack) calls invalidateBilliards();
   a drag in progress keeps the loop drawing. */
let billiardsDirtyFrames = 2;
function invalidateBilliards(){ billiardsDirtyFrames = 2; }
function billiardsSceneIsStill(){
  if(dragging) return false;
  if(state.billiardsParticles.length || billiardsFloatTexts.length || billiardsShockwaves.length) return false;
  if(performance.now() < billiardsShake.until) return false;
  return state.billiardsBalls.every(b => b.pocketed || (!b.capturing && b.vx === 0 && b.vy === 0));
}
// Same "scale canvas-drawn effects relative to a reference width" trick
// as Star Defender's canvasScale() — used only for the shockwave rings.
const BILLIARDS_REFERENCE_WIDTH = 900;

/* =========================================================
   STAGE 10 — BILLIARDS
   Team-turn structure: answer a question, then take exactly ONE shot
   — drag away from the cue ball to pull the cue stick back, release
   to strike, same pull-back-and-release convention already proven in
   Sky Slingshot. The table re-racks fresh every turn
   (same "clean slate each turn" spirit as Sky Slingshot's level
   reset), so there's always a full set of 6 object balls to aim at.

   The one genuinely new physics ingredient here (every other game in
   this app only has projectile-vs-static-obstacle collision): real
   ball-vs-ball elastic collision — every pocketable ball can carom off
   every other one, not just off the cue ball's first hit. With at
   most 7 balls on the table a plain O(n²) pairwise check per frame is
   trivial, no spatial partitioning needed. Physics is still
   deliberately simplified (flat friction deceleration, no real spin/
   english — ball rotation is a cosmetic roll effect only, see `angle`
   below — no cushion "jaws") — same "simplified but satisfying" spirit
   as every other canvas game here. A ball is captured once its center
   passes within a pocket's radius, then eases into the pocket over
   CAPTURE_ANIM_MS before actually being removed/scored (see
   startBallCapture) rather than vanishing on the spot.
========================================================= */
// The table is letterboxed to a fixed aspect ratio, centered in the canvas,
// instead of being fixed percentages of the canvas's own (variable) width/
// height. Every size below (balls, pockets, friction, launch speed) derives
// from the table's own resulting width (`tableScale`, see billiardsTableBounds)
// rather than raw canvas.width — this is the fix for fullscreen looking "off
// scale" compared to compact mode: previously every size was a % of
// canvas.width alone, so a very wide fullscreen canvas (table letterboxed
// differently than a squarer compact canvas) threw ball/pocket size and even
// the physics (friction was a flat px/s² number, covering a different
// fraction of a differently-sized table) out of proportion with the table
// itself. Locking to the table's own scale makes both modes behave and look
// identical, just at different absolute pixel sizes.
const TABLE_ASPECT = 1.9; // width:height, close to a real pool table's 2:1
// Gap between the table and the canvas edge. Must comfortably clear each
// corner pocket's own radius (POCKET_RADIUS_PCT, % of TABLE width) — at
// the old 6%, a corner pocket's outer edge landed within a few px of the
// canvas edge, close enough that #billiardsPlayArea's own rounded corner
// (border-radius:16px + overflow:hidden, shared with every other canvas
// game) visibly clipped a flat arc off it. Confirmed by testing: a
// zoomed-in screenshot of the top-left corner showed the clip directly.
// 9% leaves the pocket's edge tens of px clear of the canvas boundary.
const TABLE_MARGIN_PCT = 9;
const BALL_RADIUS_PCT = 2.0;    // % of the table's own width
const POCKET_RADIUS_PCT = 6.2;  // % of the table's own width — deliberately
                                 // generous vs. a real table; realistic pocket
                                 // sizes read as frustrating for a casual game
const MIN_BALL_SEPARATION_FACTOR = 2.7; // × ball radius — used when randomizing the rack
// Friction retuned alongside MAX_LAUNCH_SPEED_FACTOR below (see note there) —
// higher on its own than before, but shots still travel noticeably farther
// since the speed increase outpaces it.
const FRICTION_FACTOR = 0.27;   // table-widths/s² deceleration (see note above —
                                 // was a flat px/s² number before)
const REST_SPEED_FACTOR = 0.007; // table-widths/s, below which a ball is "at rest"
const WALL_RESTITUTION = 0.84;
const BALL_RESTITUTION = 0.94;
// Bumped from 0.85 — feedback was that a full-power shot felt weak. Friction
// above was raised too (0.19→0.27), but not proportionally, so shots now both
// hit harder AND travel further, not just look faster covering the same
// ground. MAX_FLIGHT_MS/substeps below both got a bit more headroom to match
// (full-power in-a-straight-line stop time is ~5.7s, under the new 7s cap).
const MAX_LAUNCH_SPEED_FACTOR = 1.5; // × table width/s, the speed at full pull-back
const MAX_FLIGHT_MS = 7000; // safety cap so a shot can never stall the game
const TURN_END_PAUSE_MS = 1200;
const CAPTURE_ANIM_MS = 280; // pocket "drop" animation duration, see startBallCapture

let billiardsRowColors = [];

// Builds this stage's two-column setup screen (rules left, teams
// right). MUST run before anything below queries the buttons it
// creates - see js/gameIntro.js for why each stage calls this itself.
renderGameIntro('billiardsSetup', {
  prefix: 'billiards',
  title: 'Billiards',
  steps: [
    'One team answers a question.',
    'Drag back from the white ball to aim and set power.',
    'Release to shoot. You only get ONE shot.'
  ],
  scoring: [
    { swatch: '<span class="billiards-legend-swatch object"></span>', label: 'Pot a coloured ball', points: '+5 to +50' },
    { swatch: '<span class="billiards-legend-swatch cue"></span>', label: 'Pot the white ball', points: 'no points', tone: 'bad' }
  ],
  tip: 'Aim slightly to the side of a ball, not dead straight at it &mdash; a glancing hit is what sends it toward a pocket.'
});

export function renderBilliardsTeamInputs(count){
  renderTeamSetupRows('billiardsTeamInputs', 'billiardsAddTeamBtn', count, billiardsRowColors, renderBilliardsTeamInputs);
}
renderBilliardsTeamInputs(2);
wireAddTeamButton('billiardsTeamInputs', 'billiardsAddTeamBtn', renderBilliardsTeamInputs);

document.getElementById('billiardsStartBtn').addEventListener('click', () => {
  state.billiardsTeams = readTeamsFromSetup('billiards', billiardsRowColors);
  state.billiardsCurrentTeam = 0;
  state.billiardsTurnsPlayed = 0;
  state.billiardsQuestionOrder = pickQuestions(BILLIARDS_QUESTIONS);

  showGameScreen('billiards');
  resizeBilliardsCanvas();
  document.getElementById('billiardsQDisplay').textContent = `1/${GAME_TURNS}`;
  renderBilliardsScoreboard();
  renderBilliardsTurnBanner();
  loadBilliardsRack();
  renderBilliardsCanvas();
});

function renderBilliardsScoreboard(){
  renderTeamScoreboard('billiardsTeamList', state.billiardsTeams, state.billiardsCurrentTeam);
}
function renderBilliardsTurnBanner(){
  renderTurnBanner('billiards', state.billiardsTeams[state.billiardsCurrentTeam], state.billiardsTurnsPlayed + 1, GAME_TURNS);
}

/* =========================================================
   RACK SETUP
========================================================= */
function getCueBall(){ return state.billiardsBalls.find(b => b.isCue); }

function randomTablePoint(bounds, r, xMinFrac, xMaxFrac){
  const marginX = r * 1.8, marginY = r * 1.8;
  const usableW = Math.max(0, (bounds.right - bounds.left) - marginX * 2);
  const usableH = Math.max(0, (bounds.bottom - bounds.top) - marginY * 2);
  const minX = bounds.left + marginX + usableW * xMinFrac;
  const maxX = bounds.left + marginX + usableW * xMaxFrac;
  return {
    x: minX + Math.random() * Math.max(0, maxX - minX),
    y: bounds.top + marginY + Math.random() * usableH
  };
}

// Randomizes the whole rack — including the cue ball — every turn, instead
// of one fixed layout, per feedback that a static table felt stale.
// Rejection-sampling keeps every ball a minimum distance apart so nothing
// spawns overlapping, AND a minimum distance from every pocket — this
// second check used to not exist at all, which meant a ball could spawn
// with its center already inside a pocket's own capture radius. The
// capture check in billiardsPhysicsStep is a pure position test with no
// velocity guard (deliberately — see the comment there), so a ball
// spawning that close got captured/sunk on the very first physics tick
// of the round, before the player had done anything ("balls fall in on
// their own"). The cue ball is still biased to the left third of the
// table (a loose "break position") so the aiming feel stays familiar turn
// to turn even though the exact spot moves.
function placeBallsRandomly(bounds, r, pockets, pocketR){
  const minSep = r * MIN_BALL_SEPARATION_FACTOR;
  // Generous margin beyond the raw capture radius — not just "technically
  // not captured yet" but a visually clear gap, and enough slack that the
  // ball-vs-ball separation nudge (if two candidates land close together
  // and get pushed apart post-placement) can't shove one back in.
  const minPocketDist = pocketR + r * 1.5;
  const placed = [];
  function tooCloseToPocket(p){
    return pockets.some(pk => Math.hypot(p.x - pk.x, p.y - pk.y) < minPocketDist);
  }
  function place(xMinFrac, xMaxFrac){
    for(let attempt = 0; attempt < 80; attempt++){
      const p = randomTablePoint(bounds, r, xMinFrac, xMaxFrac);
      if(tooCloseToPocket(p)) continue;
      if(placed.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= minSep)){
        placed.push(p);
        return p;
      }
    }
    // Rare — table's crowded enough that no spot cleared both checks in 80
    // tries. Spawning inside a pocket (an instant, input-less "scratch")
    // is worse than merely spawning close to another ball, so give pocket-
    // avoidance its own dedicated second pass before giving up entirely.
    for(let attempt = 0; attempt < 40; attempt++){
      const p = randomTablePoint(bounds, r, xMinFrac, xMaxFrac);
      if(!tooCloseToPocket(p)){ placed.push(p); return p; }
    }
    const fallback = randomTablePoint(bounds, r, xMinFrac, xMaxFrac);
    placed.push(fallback);
    return fallback;
  }
  // Kept off the left rail on purpose — at the old 0.04-0.3 range the
  // ball could spawn almost touching the rail, and since maxPull (in
  // computeCuePull, ~21% of table width) is clamped by the table's own
  // edge, a pull-back aimed toward that nearby rail got cut short well
  // before reaching full power. 0.30-0.58 keeps comfortable clearance in
  // the direction most shots pull back toward (away from the object-ball
  // cluster, which spawns further right) while still varying turn to turn.
  const cuePos = place(0.30, 0.58);
  const objectPositions = BILLIARDS_BALLS.map(() => place(0.36, 0.96));
  return { cuePos, objectPositions };
}

function loadBilliardsRack(){
  const canvas = billiardsCanvasResizer.getCanvas();
  const bounds = billiardsTableBounds(canvas);
  const tableScale = bounds.right - bounds.left;
  const r = tableScale * (BALL_RADIUS_PCT / 100);
  const pockets = billiardsPockets(canvas);
  const pocketR = tableScale * (POCKET_RADIUS_PCT / 100);
  const { cuePos, objectPositions } = placeBallsRandomly(bounds, r, pockets, pocketR);
  const objectBalls = BILLIARDS_BALLS.map((b, i) => ({
    x: objectPositions[i].x, y: objectPositions[i].y,
    vx: 0, vy: 0, angle: 0, r, value: b.value, color: b.color, isCue: false, pocketed: false
  }));
  const cueBall = {
    // restX/restY (not just x/y) — the cue ball's true rest position for this
    // turn, since it's no longer a fixed constant. restX/restY never change
    // (the ball itself no longer moves at all while aiming — see the drag
    // handler below), so the render/aim code always has a stable anchor to
    // pull the cue stick back from. See cueAwaitingStrike below for why this
    // still matters.
    x: cuePos.x, y: cuePos.y, restX: cuePos.x, restY: cuePos.y,
    vx: 0, vy: 0, angle: 0, r, value: 0, color: '#ffffff', isCue: true, pocketed: false
  };
  state.billiardsBalls = [cueBall, ...objectBalls];
  billiardsLastBounds = bounds;
  state.billiardsTurnScore = 0;
  state.billiardsShotFired = false;
  billiardsFloatTexts = [];
  billiardsShockwaves = [];
  billiardsShake = createShakeState();
  cueAwaitingStrike = true;
  invalidateBilliards();
  document.getElementById('billiardsScoreDisplay').textContent = '0';
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askBilliardsQuestion(){
  const q = state.billiardsQuestionOrder[state.billiardsTurnsPlayed];
  return askTeamQuestion(q, BILLIARDS_QUESTIONS, state.billiardsTurnsPlayed);
}

document.getElementById('billiardsBeginTurnBtn').addEventListener('click', beginBilliardsTurn);
async function beginBilliardsTurn(){
  document.getElementById('billiardsBeginTurnBtn').disabled = true;
  document.getElementById('billiardsPlayArea').classList.remove('idle');
  await askBilliardsQuestion();
  loadBilliardsRack();
  document.getElementById('billiardsHint').classList.remove('hidden');
  startBilliardsRound();
}

function finishBilliardsTurn(){
  // The last frame stays on screen; nothing moves until the next turn.
  dragging = false;
  stopBilliardsLoop();
  state.billiardsParticles = []; billiardsFloatTexts = []; billiardsShockwaves = [];
  billiardsShake = createShakeState();
  safeRenderBilliards();
  const team = state.billiardsTeams[state.billiardsCurrentTeam];
  const total = state.billiardsTurnScore;
  team.total += total;
  state.billiardsTurnsPlayed++;
  renderBilliardsScoreboard();

  document.getElementById('billiardsPlayArea').classList.add('idle');
  document.getElementById('billiardsHint').classList.add('hidden');

  showBilliardsResult().then(() => {
    if(state.billiardsTurnsPlayed >= GAME_TURNS){
      endBilliardsGame();
    } else {
      state.billiardsCurrentTeam = (state.billiardsCurrentTeam + 1) % state.billiardsTeams.length;
      renderBilliardsScoreboard();
      renderBilliardsTurnBanner();
      document.getElementById('billiardsQDisplay').textContent = `${state.billiardsTurnsPlayed + 1}/${GAME_TURNS}`;
      document.getElementById('billiardsBeginTurnBtn').disabled = false;
    }
  });
}

function showBilliardsResult(){
  return showTurnResultModal('billiardsNextTeamBtn', { teams: state.billiardsTeams, currentTeamIndex: state.billiardsCurrentTeam });
}

function endBilliardsGame(){
  const winnerText = finishTeamGame({ prefix: 'billiards', teams: state.billiardsTeams });
  document.getElementById('billiardsTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   AUDIO
========================================================= */
function sfxCueStrike(){ beep(180, 0.08, 'square', 0.16); beep(90, 0.1, 'sine', 0.12, 0.02); }
function sfxCushion(){ if(state.muted) return; beep(260, 0.05, 'triangle', 0.09); }
function sfxBallClick(){ if(state.muted) return; beep(1100, 0.04, 'square', 0.1); }
function sfxPocket(isCue){
  if(state.muted) return;
  if(isCue){ beep(150, 0.25, 'sine', 0.14); beep(100, 0.3, 'sine', 0.1, 0.05); }
  else { [880, 1108, 1318].forEach((f, i) => beep(f, 0.12, 'triangle', 0.16, i * 0.05)); }
}

/* =========================================================
   PARTICLES
========================================================= */
function spawnBilliardsParticles(x, y, color, count = 14, speedMult = 1){
  count = particleCount(count); // lite mode: fewer per burst (js/quality.js)
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 5 + 1.5) * speedMult;
    state.billiardsParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: Math.random() * 0.025 + 0.015, size: Math.random() * 4 + 1.5, color
    });
  }
}
function updateBilliardsParticles(k){
  stepParticles(state.billiardsParticles, k, { gravity: 0.08, dragX: 0.98 });
}

/* =========================================================
   CANVAS SIZING
========================================================= */
// A resize clears the canvas buffer, so the next frame must repaint even
// if nothing on the table is moving (see billiardsDirtyFrames), and the
// balls have to move with the table (see remapBilliardsToCanvas).
const billiardsCanvasResizer = createCanvasResizer('billiardsCanvas', 'billiardsPlayArea', (canvas) => {
  remapBilliardsToCanvas(canvas);
  invalidateBilliards();
  // Repaint now, not on the loop's next frame: between turns no loop runs,
  // and a resize wipes the canvas, which left the dark frame behind it
  // showing as a "black screen" (2026-11-22).
  safeRenderBilliards();
});

/* ---- Keeping the rack on the table through a resize ----
   Ball positions, radii and speeds are in canvas PIXELS (the physics,
   pockets and cushions are all pixel-based). Toggling compact mode,
   hiding the nav or resizing the window mid-turn changes the canvas
   size, which used to leave every ball where it was in pixels: off the
   edge of a smaller table, or bunched in one corner of a bigger one.

   The table always keeps TABLE_ASPECT, so the old and new tables differ
   only by a uniform scale and an offset. Every ball (and its rest spot,
   speed and radius) is carried across with that same mapping, so the
   rack looks identical, just bigger or smaller. Short-lived effects are
   simply dropped and an in-progress aim drag is cancelled, since both
   are in the old pixel space. */
let billiardsLastBounds = null;
function remapBilliardsToCanvas(canvas){
  if(!canvas || canvas.width === 0 || canvas.height === 0) return;
  const next = billiardsTableBounds(canvas);
  const prev = billiardsLastBounds;
  billiardsLastBounds = next;
  if(!prev || !state.billiardsBalls.length) return;
  const prevW = prev.right - prev.left;
  if(prevW <= 0) return;
  const k = (next.right - next.left) / prevW;
  if(Math.abs(k - 1) < 1e-6 && prev.left === next.left && prev.top === next.top) return;
  const mapX = (x) => next.left + (x - prev.left) * k;
  const mapY = (y) => next.top + (y - prev.top) * k;
  for(const b of state.billiardsBalls){
    b.x = mapX(b.x); b.y = mapY(b.y);
    if(b.restX != null){ b.restX = mapX(b.restX); b.restY = mapY(b.restY); }
    b.vx *= k; b.vy *= k; b.r *= k;
    if(b.capturing){
      b.capturing.startX = mapX(b.capturing.startX);
      b.capturing.startY = mapY(b.capturing.startY);
      b.capturing.pocket = { x: mapX(b.capturing.pocket.x), y: mapY(b.capturing.pocket.y) };
    }
  }
  state.billiardsParticles = [];
  billiardsFloatTexts = [];
  billiardsShockwaves = [];
  dragging = false;
}
export function resizeBilliardsCanvas(){ billiardsCanvasResizer.resize(); }
export function ensureBilliardsLayout(){
  if(state.billiardsTeams.length > 0) resizeBilliardsCanvas();
}

function billiardsTableBounds(canvas){
  const availW = canvas.width * (1 - 2 * TABLE_MARGIN_PCT / 100);
  const availH = canvas.height * (1 - 2 * TABLE_MARGIN_PCT / 100);
  let tableW, tableH;
  if(availW / availH > TABLE_ASPECT){
    tableH = availH;
    tableW = tableH * TABLE_ASPECT;
  } else {
    tableW = availW;
    tableH = tableW / TABLE_ASPECT;
  }
  const left = (canvas.width - tableW) / 2;
  const top = (canvas.height - tableH) / 2;
  return { left, right: left + tableW, top, bottom: top + tableH };
}
function billiardsPockets(canvas){
  const b = billiardsTableBounds(canvas);
  const midX = (b.left + b.right) / 2;
  return [
    { x: b.left, y: b.top }, { x: b.right, y: b.top },
    { x: b.left, y: b.bottom }, { x: b.right, y: b.bottom },
    { x: midX, y: b.top }, { x: midX, y: b.bottom }
  ];
}

/* =========================================================
   AIM / DRAG INPUT — pull back away from the cue ball, release to
   strike, same convention as Sky Slingshot's computePull.
========================================================= */
let dragging = false;
let dragStart = null;
let dragCurrent = null;
let billiardsShotStartedAt = 0;
// True from the moment a fresh rack loads until the cue ball is actually
// struck, then false for the rest of the turn — deliberately NOT the
// same thing as `state.billiardsShotFired` (which flips back to false
// the instant the shot RESOLVES, while it's still resting on the table
// during the post-shot pause). Render uses this one to decide whether
// it's safe to auto-position the cue ball at its rest spot; using
// billiardsShotFired there was a real bug — it made the cue ball
// visually teleport back to its starting spot the instant the shot
// settled, before the result modal even appeared, undoing the whole
// point of the pause (seeing where everything actually ended up).
let cueAwaitingStrike = true;

function canvasPoint(canvas, e){
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function computeCuePull(canvas){
  const bounds = billiardsTableBounds(canvas);
  const cue = getCueBall();
  const anchorX = cue.restX, anchorY = cue.restY;
  const maxPull = (bounds.right - bounds.left) * 0.21; // more pull range to match the power increase

  const rawDx = dragStart.x - dragCurrent.x, rawDy = dragStart.y - dragCurrent.y;
  const rawDist = Math.hypot(rawDx, rawDy);
  // Power/direction are derived straight from the raw drag vector, capped
  // only by maxPull — NOT clamped to the table's bounding box. It used to
  // be clamped (a pulled-back point kept inside the table rect), but that
  // meant a cue ball resting near a rail hit the box clamp well before
  // the drag reached maxPull, capping shot power far under 1 in that
  // direction ("impossible to power up near the edge"), and could even
  // skew the aim angle if x and y clamped by different amounts. The
  // clamped point was only ever used to derive power/direction — nothing
  // renders it — so there's no visual to preserve here.
  const dist = Math.min(rawDist, maxPull);
  const nx = rawDist > 0 ? rawDx / rawDist : 0, ny = rawDist > 0 ? rawDy / rawDist : 0;
  const power = Math.min(dist / maxPull, 1);
  return { power, dist, nx, ny, anchorX, anchorY, maxPull };
}

function onBilliardsPointerDown(e){
  const cue = getCueBall();
  if(!state.billiardsRoundActive || !cue || cue.pocketed || !cueAwaitingStrike) return;
  const canvas = billiardsCanvasResizer.getCanvas();
  dragging = true;
  dragStart = canvasPoint(canvas, e);
  dragCurrent = { ...dragStart };
  document.getElementById('billiardsHint').classList.add('hidden');
}
function onBilliardsPointerMove(e){
  if(!dragging) return;
  const canvas = billiardsCanvasResizer.getCanvas();
  dragCurrent = canvasPoint(canvas, e);
  // No render here: the round's loop draws every frame while dragging
  // (billiardsSceneIsStill). Rendering per pointer event drew the whole
  // table several times a frame on a high-rate mouse or touch board.
}
function onBilliardsPointerUp(){
  if(!dragging) return;
  dragging = false;
  const canvas = billiardsCanvasResizer.getCanvas();
  const pull = computeCuePull(canvas);

  if(pull.dist < 10){ renderBilliardsCanvas(); return; }

  const bounds = billiardsTableBounds(canvas);
  const tableScale = bounds.right - bounds.left;
  const speed = pull.power * tableScale * MAX_LAUNCH_SPEED_FACTOR;
  const cue = getCueBall();
  cue.vx = pull.nx * speed;
  cue.vy = pull.ny * speed;
  state.billiardsShotFired = true;
  cueAwaitingStrike = false;
  billiardsShotStartedAt = performance.now();
  sfxCueStrike();
}
function cancelDragIfStuck(){
  if(dragging){ dragging = false; renderBilliardsCanvas(); }
}

const billiardsCanvasEl = billiardsCanvasResizer.getCanvas();
billiardsCanvasEl.addEventListener('mousedown', onBilliardsPointerDown);
window.addEventListener('mousemove', onBilliardsPointerMove);
window.addEventListener('mouseup', onBilliardsPointerUp);
window.addEventListener('blur', cancelDragIfStuck);
billiardsCanvasEl.addEventListener('touchstart', (e) => { onBilliardsPointerDown(e.touches[0]); e.preventDefault(); }, { passive: false });
billiardsCanvasEl.addEventListener('touchmove', (e) => { onBilliardsPointerMove(e.touches[0]); e.preventDefault(); }, { passive: false });
billiardsCanvasEl.addEventListener('touchend', onBilliardsPointerUp);

/* =========================================================
   PHYSICS
========================================================= */
let billiardsFinishTimeout = null;

function pocketBall(ball, pocketPos){
  ball.pocketed = true;
  ball.capturing = null;
  ball.vx = 0; ball.vy = 0;
  spawnBilliardsParticles(pocketPos.x, pocketPos.y, ball.isCue ? '#cfe0f5' : ball.color, 22, 1.2);
  sfxPocket(ball.isCue);
  if(ball.isCue){
    triggerShake(billiardsShake, 5); // a scratch is its own small moment, even though it scores nothing
  } else {
    state.billiardsTurnScore += ball.value;
    document.getElementById('billiardsScoreDisplay').textContent = String(state.billiardsTurnScore);
    spawnFloatText(billiardsFloatTexts, pocketPos.x, pocketPos.y, `+${ball.value}`, ball.color);
    // Bigger-value balls land a bigger shake + a shockwave ring — same
    // "scale the juice with how good the hit was" convention Sky
    // Slingshot uses; every ball previously got the exact same
    // feedback regardless of its 5-50pt value.
    triggerShake(billiardsShake, 4 + ball.value * 0.12);
    spawnShockwave(billiardsShockwaves, pocketPos.x, pocketPos.y, ball.color, { big: ball.value >= 25 });
  }
}

// A ball whose center reaches a pocket's capture radius doesn't just vanish
// on the spot any more — it eases into the pocket (position lerping to the
// pocket's own center, radius shrinking toward 0) over CAPTURE_ANIM_MS before
// pocketBall() actually fires (score/particles/sound). This was the "janky"
// part of pocketing: previously a fast-moving ball just disappeared mid-
// stride the instant it crossed the capture radius.
function startBallCapture(ball, pocketPos){
  ball.vx = 0; ball.vy = 0;
  ball.capturing = { pocket: pocketPos, startX: ball.x, startY: ball.y, t0: performance.now() };
}

function updateBilliardsCaptures(){
  for(const ball of state.billiardsBalls){
    if(!ball.capturing) continue;
    const c = ball.capturing;
    const t = Math.min(1, (performance.now() - c.t0) / CAPTURE_ANIM_MS);
    const eased = t * t; // ease-in — accelerates into the pocket, like gravity taking it
    ball.x = c.startX + (c.pocket.x - c.startX) * eased;
    ball.y = c.startY + (c.pocket.y - c.startY) * eased;
    ball.captureScale = 1 - eased * 0.92;
    if(t >= 1) pocketBall(ball, c.pocket);
  }
}

function resolveBilliardsShot(){
  state.billiardsShotFired = false;
  clearTimeout(billiardsFinishTimeout);
  billiardsFinishTimeout = setTimeout(finishBilliardsTurn, TURN_END_PAUSE_MS);
}

function billiardsPhysicsStep(dtSec, bounds, pockets, pocketR, friction){
  for(const ball of state.billiardsBalls){
    if(ball.pocketed || ball.capturing) continue;
    // The cue ball isn't really "in" the physics simulation until it's
    // actually struck — while cueAwaitingStrike, its x/y are just a UI
    // aim reticle, repositioned every frame by the render function to
    // follow the drag. A REAL bug this fixes: the pocket-capture check
    // below runs on every ball's CURRENT position every frame regardless
    // of velocity, with no guard — so dragging the aim preview near/into
    // a pocket's capture radius pocketed the cue ball as an instant
    // scratch before the shot was ever released. Skipping the cue ball
    // entirely here until it's struck removes it from that check (and
    // the wall-bounce/movement math, which was harmless but pointless
    // to run on a stationary ball) rather than special-casing just the
    // pocket check.
    if(ball.isCue && cueAwaitingStrike) continue;

    const speed = Math.hypot(ball.vx, ball.vy);
    if(speed > 0){
      const newSpeed = Math.max(0, speed - friction * dtSec);
      const k = newSpeed / speed;
      ball.vx *= k; ball.vy *= k;
      // Faux rolling — spins the ball's highlight/number-plate (see render)
      // proportional to how far it's traveling. Not a physically-accurate
      // top-down rotation axis (real topspin wouldn't visibly rotate from
      // directly above), but a deliberate stylization so a moving ball
      // visibly *rolls* instead of sliding as a flat, static disc.
      ball.angle = (ball.angle || 0) + (speed / Math.max(1, ball.r)) * dtSec;
    }
    ball.x += ball.vx * dtSec;
    ball.y += ball.vy * dtSec;

    // Pocket capture is checked BEFORE the cushion bounce, so a ball
    // heading into a pocket gets captured instead of bouncing off the
    // rail right at the pocket's mouth. Capture starts a short drop
    // animation (see startBallCapture) rather than pocketing instantly.
    let captured = false;
    for(const p of pockets){
      if(Math.hypot(ball.x - p.x, ball.y - p.y) < pocketR){
        startBallCapture(ball, p);
        captured = true;
        break;
      }
    }
    if(captured) continue;

    if(ball.x - ball.r < bounds.left){ ball.x = bounds.left + ball.r; ball.vx = Math.abs(ball.vx) * WALL_RESTITUTION; sfxCushion(); }
    if(ball.x + ball.r > bounds.right){ ball.x = bounds.right - ball.r; ball.vx = -Math.abs(ball.vx) * WALL_RESTITUTION; sfxCushion(); }
    if(ball.y - ball.r < bounds.top){ ball.y = bounds.top + ball.r; ball.vy = Math.abs(ball.vy) * WALL_RESTITUTION; sfxCushion(); }
    if(ball.y + ball.r > bounds.bottom){ ball.y = bounds.bottom - ball.r; ball.vy = -Math.abs(ball.vy) * WALL_RESTITUTION; sfxCushion(); }
  }

  // Ball-vs-ball elastic collision — equal-mass circles, so the impulse
  // just exchanges each ball's velocity component along the collision
  // normal. O(n²) over at most 7 balls is trivial.
  const live = state.billiardsBalls.filter(b => !b.pocketed && !b.capturing);
  for(let i = 0; i < live.length; i++){
    for(let j = i + 1; j < live.length; j++){
      const a = live[i], b = live[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if(dist > 0 && dist < minDist){
        const nx = dx / dist, ny = dy / dist;
        const overlap = minDist - dist;
        a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2; b.y += ny * overlap / 2;

        const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if(velAlongNormal < 0){
          const impulse = -(1 + BALL_RESTITUTION) * velAlongNormal / 2;
          a.vx -= impulse * nx; a.vy -= impulse * ny;
          b.vx += impulse * nx; b.vy += impulse * ny;
          spawnBilliardsParticles((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffffff', 5, 0.7);
          sfxBallClick();
        }
      }
    }
  }
}

function updateBilliardsPhysics(dt){
  const k = frameFactor(dt);
  updateBilliardsParticles(k);
  billiardsFloatTexts = updateFloatTexts(billiardsFloatTexts, k);
  billiardsShockwaves = updateShockwaves(billiardsShockwaves);
  if(!state.billiardsRoundActive || !state.billiardsBalls.length) return;
  const canvas = billiardsCanvasResizer.getCanvas();
  const bounds = billiardsTableBounds(canvas);
  const tableScale = bounds.right - bounds.left;
  const friction = tableScale * FRICTION_FACTOR;
  const restThreshold = tableScale * REST_SPEED_FACTOR;
  const pockets = billiardsPockets(canvas);
  const pocketR = tableScale * (POCKET_RADIUS_PCT / 100);
  if(!(tableScale > 0)) return; // the play area is hidden or zero-sized
  for(const b of state.billiardsBalls) if(!b.pocketed) repairBall(b, bounds);

  // Sub-stepped (6 smaller passes instead of 1 big one) so a fast-moving ball
  // can't tunnel straight through another ball between frames without a
  // collision ever being detected — a real risk at this game's generously
  // high launch speed (bumped again alongside MAX_LAUNCH_SPEED_FACTOR above),
  // and a likely source of hits that "didn't feel right."
  const dtSec = Math.min(0.032, dt / 1000);
  const substeps = 6;
  const stepDt = dtSec / substeps;
  for(let s = 0; s < substeps; s++){
    billiardsPhysicsStep(stepDt, bounds, pockets, pocketR, friction);
  }
  updateBilliardsCaptures();

  if(state.billiardsShotFired){
    // A ball mid pocket-drop counts as neither pocketed nor "resting" yet —
    // its velocity is already zeroed by startBallCapture, but the shot isn't
    // truly over (score/sound haven't fired) until the animation finalizes.
    const allRestingOrGone = state.billiardsBalls.every(b => b.pocketed || (!b.capturing && Math.hypot(b.vx, b.vy) < restThreshold));
    const timedOut = performance.now() - billiardsShotStartedAt > MAX_FLIGHT_MS;
    if(allRestingOrGone || timedOut) resolveBilliardsShot();
  }
}

// Exactly one loop, from Begin turn until the turn's result. It used to
// keep running after the turn ended (only leaving the stage stopped it),
// so every turn started ANOTHER loop on top: by the fifth turn five loops
// each ran the physics every frame and the balls flew five times too fast.
function startBilliardsRound(){
  stopBilliardsLoop();
  state.billiardsRoundActive = true;
  let lastTime = performance.now();
  function tick(now){
    state.billiardsRoundRAF = null;
    const dt = Math.min(50, now - lastTime);
    noteFrame();
    lastTime = now;
    try {
      updateBilliardsPhysics(dt);
    } catch(err){
      if(!billiardsRenderErrorLogged){ billiardsRenderErrorLogged = true; console.warn('Billiards physics step skipped:', err); }
    }
    if(!billiardsSceneIsStill()) billiardsDirtyFrames = 2;
    if(billiardsDirtyFrames > 0){
      billiardsDirtyFrames--;
      safeRenderBilliards();
    }
    if(state.billiardsRoundActive){
      state.billiardsRoundRAF = requestAnimationFrame(tick);
    }
  }
  state.billiardsRoundRAF = requestAnimationFrame(tick);
}

// Stops the loop but leaves the table as it is (the balls where they
// stopped), unlike cancelBilliardsRound which clears everything.
function stopBilliardsLoop(){
  if(state.billiardsRoundRAF) cancelAnimationFrame(state.billiardsRoundRAF);
  state.billiardsRoundRAF = null;
  state.billiardsRoundActive = false;
}

export function cancelBilliardsRound(){
  if(state.billiardsRoundRAF) cancelAnimationFrame(state.billiardsRoundRAF);
  state.billiardsRoundRAF = null;
  state.billiardsRoundActive = false;
  state.billiardsShotFired = false;
  clearTimeout(billiardsFinishTimeout);
  dragging = false;
  cueAwaitingStrike = true;
  state.billiardsBalls = [];
  state.billiardsParticles = [];
  billiardsFloatTexts = [];
  billiardsShockwaves = [];
  const playArea = document.getElementById('billiardsPlayArea');
  if(playArea) playArea.classList.add('idle');
  const hint = document.getElementById('billiardsHint');
  if(hint) hint.classList.add('hidden');
  // Show the empty table rather than a cleared (dark) canvas.
  safeRenderBilliards();
  const beginBtn = document.getElementById('billiardsBeginTurnBtn');
  if(beginBtn) beginBtn.disabled = false;
}

// A shot-power gauge, shown only while actively pulling back (pull.dist >
// 8, same threshold the aim line/cue stick already use) — reads 0-100%
// against MAX_LAUNCH_SPEED_FACTOR, the same `pull.power` value the real
// strike uses, so the bar can never disagree with the shot it represents.
// Color ramps green -> amber -> red with power, echoing the timer-bar
// language used elsewhere in the app (a filling bar as a "how much" cue)
// but recolored so it also reads as "how hard," not just "how full."
function drawBilliardsPowerMeter(ctx, canvas, power){
  const barW = canvas.width * 0.22, barH = Math.max(10, canvas.height * 0.026);
  const x = (canvas.width - barW) / 2, y = canvas.height - barH - canvas.height * 0.035;

  ctx.save();
  ctx.fillStyle = 'rgba(20,20,30,0.28)';
  ctx.beginPath();
  roundRectPath(ctx, x, y, barW, barH, barH / 2);
  ctx.fill();

  const fillColor = power < 0.5 ? '#5C9C7C' : power < 0.8 ? '#C97A3D' : '#C1665C';
  const fillW = Math.max(barH, barW * power);
  // No shadowBlur glow: it re-blurred the bar on every pointer move.
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  roundRectPath(ctx, x, y, fillW, barH, barH / 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${Math.max(11, barH * 0.62)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('POWER', x + barW / 2, y - 4);
  ctx.restore();
}

/* =========================================================
   RENDERING
========================================================= */
// ctx.roundRect is missing from older browsers (Chrome before 99, Safari
// before 16), which school PCs and iPads still run. Billiards was the only
// game using it, and there it threw on the very first frame, so the table
// never drew at all. This draws the same path either way.
function roundRectPath(ctx, x, y, w, h, r){
  if(typeof ctx.roundRect === 'function'){ ctx.roundRect(x, y, w, h, r); return; }
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// One bad frame must never end the game: an exception thrown inside the
// animation loop used to stop it for good, so the shot never finished and
// the table froze or went blank. Log it once and carry on.
let billiardsRenderErrorLogged = false;
function safeRenderBilliards(){
  try {
    renderBilliardsCanvas();
  } catch(err){
    if(!billiardsRenderErrorLogged){ billiardsRenderErrorLogged = true; console.warn('Billiards frame skipped:', err); }
  }
}

// A ball whose numbers went bad (NaN or Infinity, e.g. from a zero-sized
// table) is put back somewhere sane instead of poisoning every
// collision it touches.
function repairBall(ball, bounds){
  const ok = (v) => Number.isFinite(v);
  if(ok(ball.x) && ok(ball.y) && ok(ball.vx) && ok(ball.vy) && ok(ball.r) && ball.r > 0) return;
  const w = bounds.right - bounds.left;
  ball.r = ok(ball.r) && ball.r > 0 ? ball.r : Math.max(1, w * (BALL_RADIUS_PCT / 100));
  ball.x = ok(ball.x) ? Math.min(bounds.right - ball.r, Math.max(bounds.left + ball.r, ball.x)) : (bounds.left + bounds.right) / 2;
  ball.y = ok(ball.y) ? Math.min(bounds.bottom - ball.r, Math.max(bounds.top + ball.r, ball.y)) : (bounds.top + bounds.bottom) / 2;
  ball.vx = 0; ball.vy = 0; ball.angle = 0;
}
/* The table itself (background, rails, felt gradient, pockets) never
   changes between resizes, but was rebuilt, gradient included, on every
   frame. It is drawn once into an offscreen layer and blitted. */
let billiardsTableLayer = null;
function getBilliardsTableLayer(canvas){
  if(billiardsTableLayer && billiardsTableLayer.width === canvas.width && billiardsTableLayer.height === canvas.height){
    return billiardsTableLayer;
  }
  billiardsTableLayer = billiardsTableLayer || document.createElement('canvas');
  billiardsTableLayer.width = canvas.width;
  billiardsTableLayer.height = canvas.height;
  const ctx = billiardsTableLayer.getContext('2d');

  ctx.fillStyle = '#EAF6F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bounds = billiardsTableBounds(canvas);
  const tableScale = bounds.right - bounds.left;
  const railThickness = tableScale * 0.035;
  const railRadius = railThickness * 0.7;

  ctx.fillStyle = '#FF9F7A';
  ctx.beginPath();
  roundRectPath(ctx, bounds.left - railThickness, bounds.top - railThickness,
    (bounds.right - bounds.left) + railThickness * 2, (bounds.bottom - bounds.top) + railThickness * 2, railRadius);
  ctx.fill();

  const felt = ctx.createLinearGradient(0, bounds.top, 0, bounds.bottom);
  felt.addColorStop(0, '#BDEEDD'); felt.addColorStop(1, '#8FDCC4');
  ctx.fillStyle = felt;
  ctx.beginPath();
  roundRectPath(ctx, bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top, railRadius * 0.5);
  ctx.fill();

  const pocketR = tableScale * (POCKET_RADIUS_PCT / 100);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(2, canvas.width * 0.004);
  ctx.fillStyle = '#2B2B3A';
  for(const p of billiardsPockets(canvas)){
    ctx.beginPath(); ctx.arc(p.x, p.y, pocketR * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();
  }
  return billiardsTableLayer;
}

function renderBilliardsCanvas(){
  const canvas = billiardsCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  applyShake(ctx, billiardsShake);

  ctx.drawImage(getBilliardsTableLayer(canvas), 0, 0);

  const bounds = billiardsTableBounds(canvas);
  const tableScale = bounds.right - bounds.left;

  // One save/restore for the whole batch rather than one per particle.
  ctx.save();
  for(const p of state.billiardsParticles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  drawShockwaves(ctx, billiardsShockwaves, canvas.width / BILLIARDS_REFERENCE_WIDTH);
  drawFloatTexts(ctx, billiardsFloatTexts, Math.max(16, tableScale * 0.05));

  const cue = state.billiardsBalls && state.billiardsBalls.find(b => b.isCue);

  // Aim guide line + cue stick while dragging — uses the exact same
  // clamped computeCuePull() the real launch uses. The ball itself stays put
  // at its rest spot the whole time; only the stick pulls back away from it
  // as pull distance grows. (Previously this also overwrote cue.x/y to the
  // pulled-back point, dragging the actual white ball backwards with the
  // aim — read as the ball flinching away from its own shot rather than a
  // stick being drawn back to strike it.)
  if(dragging && dragStart && dragCurrent && cue && !cue.pocketed && cueAwaitingStrike){
    const pull = computeCuePull(canvas);

    if(pull.dist > 8){
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = Math.max(1.5, tableScale * 0.003);
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(pull.anchorX + pull.nx * cue.r, pull.anchorY + pull.ny * cue.r);
      ctx.lineTo(pull.anchorX + pull.nx * tableScale * 0.7, pull.anchorY + pull.ny * tableScale * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Stick tip starts touching the ball's back edge and retreats further
      // along the aim line as pull.dist grows — the ball never moves.
      const tipDist = cue.r * 1.3 + pull.dist;
      const tipX = pull.anchorX - pull.nx * tipDist, tipY = pull.anchorY - pull.ny * tipDist;
      const stickLen = tableScale * 0.16 + pull.dist * 0.9;
      const buttX = tipX - pull.nx * stickLen, buttY = tipY - pull.ny * stickLen;
      ctx.save();
      ctx.strokeStyle = '#C9A671'; ctx.lineWidth = Math.max(4, tableScale * 0.009); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(buttX, buttY); ctx.stroke();
      ctx.restore();

      drawBilliardsPowerMeter(ctx, canvas, pull.power);
    }
  } else if(cue && !cue.pocketed && cueAwaitingStrike){
    cue.x = cue.restX;
    cue.y = cue.restY;
  }

  // Balls — a small white "number plate" showing each object ball's
  // point value, like a real numbered pool ball. The highlight + number
  // plate rotate together around the ball's own center as it rolls (see
  // the `angle` update in billiardsPhysicsStep) — not physically-accurate
  // for a top-down view, but a deliberate stylization so a moving ball
  // visibly rolls instead of sliding as a flat, static disc. A ball mid
  // pocket-drop (captureScale < 1) shrinks and fades as it eases in.
  // Every ball has the same radius, so the number font is the same string
  // for all of them: set once per frame rather than parsed once per ball.
  const numberFont = state.billiardsBalls && state.billiardsBalls.length
    ? `bold ${Math.max(9, state.billiardsBalls[0].r * 0.85)}px sans-serif` : '';
  for(const ball of state.billiardsBalls || []){
    if(ball.pocketed) continue;
    const scale = ball.captureScale != null ? ball.captureScale : 1;
    const rx = ball.r * scale;

    ctx.save();
    ctx.globalAlpha = scale;
    // Drop shadow as a plain offset disc under the ball. This was
    // ctx.shadowBlur, which blurs a copy of every ball on every frame.
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.arc(ball.x, ball.y + rx * 0.16, rx * 1.04, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ball.color;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle || 0);
    ctx.globalAlpha = 0.5 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.32, -rx * 0.34, rx * 0.32, rx * 0.2, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if(!ball.isCue){
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.angle || 0);
      ctx.globalAlpha = scale;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, rx * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      // A ball shrinking into a pocket still needs its own size.
      ctx.font = scale === 1 ? numberFont : `bold ${Math.max(9, rx * 0.85)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(ball.value), 0, 0);
      ctx.restore();
    }
  }

  ctx.restore(); // matches the shake ctx.save() near the top of this function
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'billiards',
  getTeams: () => state.billiardsTeams,
  renderScoreboard: renderBilliardsScoreboard,
  cancelRound: cancelBilliardsRound
});

document.getElementById('billiardsBackBtn').addEventListener('click', () => goToStage(13));
// Wired here (the target stage's own file), not in stage9 — same
// existing convention throughout: a "Next" button's click handler lives
// in the file for the stage it goes TO.
document.getElementById('qsNextStageBtn').addEventListener('click', () => goToStage(14));
