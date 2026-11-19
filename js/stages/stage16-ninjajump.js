import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, showQuestionModal } from '../utils.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { JUMP_QUESTIONS } from '../content/stage16-ninjajump.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, stepParticles, frameFactor } from '../canvasEffects.js';
import { drawGlow } from '../canvasGlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

/* =========================================================
   STAGE 16 — NINJA JUMP
   A single-screen platformer: the whole level is always visible (no
   scrolling camera), so the class can see every star from the back of
   the room. Collect every ninja star to clear the level: +5, a point
   for every second left, and the turn ends there (classroom feedback
   2026-11-18: 20-second turns, and clearing the level ends the round).
   Spikes send the ninja back to the start. Each lap of turns plays the
   next level, so every team in a lap gets the same one.

   The physics is where the fun is, and it's all standard platformer
   "feel" tuning, in tile units per second:
   - acceleration and friction rather than instant speed, so the ninja
     skids a little when turning;
   - variable jump height: gravity is lower while you HOLD jump and
     rise, so a tap is a hop and a hold is a big leap;
   - faster falling than rising, which reads as snappy, not floaty;
   - coyote time (a jump still works for a moment after running off a
     ledge) and jump buffering (a press just before landing still
     counts) - both forgive young players' timing;
   - a double jump with a full flip, springs, and one-way platforms
     that you jump up through and land on;
   - moving platforms (lifts and sliders) that carry the ninja, and a
     triple-jump power-up.

   Levels are tile maps (36 x 16) written as strings below.
   Static scenery (sky, moon, tiles) is drawn once per level and canvas
   size; each frame only the stars, springs, ninja and particles draw.
========================================================= */
// The teacher picks the round length between turns (10/15/20/30s,
// state.jumpSeconds, default 10) - see the picker under Begin turn.
function roundSeconds(){ return state.jumpSeconds || 10; }
const COLS = 36, ROWS = 16;

// Physics, in tiles and seconds.
const GRAVITY = 55;
const FALL_GRAVITY_MULT = 1.9;  // falling (or rising without holding jump)
const MAX_FALL = 26;
const RUN_SPEED = 8.5;
const RUN_ACCEL = 70;
const AIR_ACCEL = 45;
const GROUND_FRICTION = 60;
const AIR_FRICTION = 8;
const JUMP_V = 22;              // 4.4 tiles when held
const DOUBLE_JUMP_V = 18;       // ~2.9 more tiles (each extra air jump)
// 9.9 tiles, ALWAYS: a spring launch rises on the low "held" gravity
// whether or not jump is held (see springBoost). It used to follow the
// hold rule like a jump, so a child who just walked onto a spring got
// ~5 tiles and couldn't reach the Spring Valley ledges at all.
const SPRING_V = 33;
const COYOTE_MS = 100;
const JUMP_BUFFER_MS = 130;
const PLAYER_W = 0.62, PLAYER_H = 0.86;
const STAR_RADIUS = 0.42;

const STAR_POINTS = 1;
const LEVEL_CLEAR_POINTS = 5;
const TIME_BONUS_PER_SEC = 1;   // per whole second left when the level is cleared
const CLEAR_SHOW_MS = 1300;     // the "LEVEL CLEAR!" moment before the result screen
const SPIKE_PENALTY = 1;
const POWERUP_COLOR = '#B983FF';

/* ---- Levels ----
   #  stone block (solid)
   =  wooden plank: jump up through it, land on top
   ^  spikes (back to the start)
   S  spring (always a full-height launch, held jump or not)
   *  ninja star
   T  triple-jump power-up
   P  where the ninja starts
   Every row is exactly 36 characters (checked at load).

   `movers` are moving platforms (one-way, like planks, and they carry
   the ninja): x/y is the left end and top at one end of the trip, w the
   width in tiles, dx/dy how far it travels, period the seconds for a
   full there-and-back, phase where in the trip it starts (0..1).

   Reach rules every level follows, from the measured jump heights
   (feet rise, holding jump): single 4.4 tiles, double 7.3, triple 10.2,
   spring 9.9; a running jump clears about 5.9 tiles across.
   - a plank at most 4 rows above where you stand is a single jump,
     and at most 6 rows is a double jump, with at most 3 tiles across;
   - anything harder has a moving platform that goes there, and
     every moving platform ends its trip flush with the ledge it
     serves (same height, no gap) so a child can just walk off it;
   - 8 stars per level;
   - the triple-jump power-up sits somewhere risky or hard to reach
     (high above a ledge, or right over a spike pit): it's a prize.
     */
const LEVELS = [
  { name: 'Dojo Garden', sky: ['#2B1E4A', '#E8796B'], map: [
    '.........................T..........',
    '....................................',
    '....................................',
    '....................................',
    '..............*....*................',
    '.............========...............',
    '....................................',
    '....*............................*..',
    '...=====........................====',
    '....................................',
    '..........*................*........',
    '.........=====...........=====......',
    '....................................',
    '.P.....*...................*........',
    '####################################',
    '####################################'
  ], movers: [
    // Glides along row 8 between the left ledge and the middle.
    { x: 8, y: 8, w: 3, dx: 12, dy: 0, period: 9, phase: 0 }
  ]},
  { name: 'Spring Valley', sky: ['#14324A', '#5FB3A8'], moon: [0.52, 0.13], map: [
    '..................T.................',
    '....................................',
    '.......*....................*.......',
    '......===..................===......',
    '....................................',
    '....................................',
    '..*..............**..............*..',
    '.===............====............===.',
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '..........*............*............',
    '.P..S.....###.........###.....S.....',
    '####################################',
    '####################################'
  ], movers: [
    // A lift from the floor up beside the middle ledge.
    { x: 14, y: 12.5, w: 2, dx: 0, dy: -5.5, period: 5, phase: 0 },
    // A lift on the right, up to the high right ledge.
    { x: 25, y: 12.5, w: 2, dx: 0, dy: -9.5, period: 7, phase: 0.5 }
  ]},
  { name: 'Spike Temple', sky: ['#1E1430', '#B5543C'], map: [
    '....................................',
    '....................................',
    '....................................',
    '................*..*................',
    '...............======...............',
    '....................................',
    '......*......................*......',
    '.....===....................===.....',
    '....................................',
    '...........*............*...........',
    '..........===......T...===..........',
    '....................................',
    '....................................',
    '.P.....^^^^^..*..^^^^^..*..^^^^^....',
    '####################################',
    '####################################'
  ], movers: [
    // Ferries across each spike pit, low enough to hop onto.
    { x: 6, y: 11, w: 2, dx: 5, dy: 0, period: 4.4, phase: 0 },
    { x: 16, y: 11, w: 2, dx: 5, dy: 0, period: 4.8, phase: 0.5 },
    { x: 26, y: 11, w: 2, dx: 5, dy: 0, period: 4.6, phase: 0.25 }
  ]},
  { name: 'Rooftop Run', sky: ['#0E1630', '#3E4F8C'], map: [
    '..................................T.',
    '....................................',
    '................*..*................',
    '...............======...............',
    '....................................',
    '...*........................*.......',
    '..====.....................====.....',
    '....................................',
    '.........*..............*...........',
    '........####..........####..........',
    '........####..........####..........',
    '.P*.....####....*.....####..........',
    '######..####..######..####..########',
    '######..####..######..####..########',
    '######^^####^^######^^####^^########',
    '####################################'
  ], movers: [
    // A lift in the gap between the tower and the middle roof, up to
    // the high middle ledge.
    { x: 12, y: 11, w: 3, dx: 0, dy: -8, period: 5.5, phase: 0 },
    // Slides between the right tower and the high right ledge.
    { x: 21, y: 6, w: 3, dx: 4, dy: 0, period: 4, phase: 0 }
  ]}
];
LEVELS.forEach((lv, i) => {
  if(lv.map.length !== ROWS || lv.map.some(r => r.length !== COLS)){
    console.error(`Ninja Jump level ${i + 1} is not ${COLS}x${ROWS}`);
  }
});

/* =========================================================
   SETUP / TEAMS (same pattern as every other game)
========================================================= */
let jumpRowColors = [];

renderGameIntro('jumpSetup', {
  prefix: 'jump',
  title: 'Ninja Jump',
  steps: [
    'One team answers a question.',
    'Run with A / D or the arrow keys. Jump with SPACE (or W / up). Press jump again in the air to double jump!',
    'Collect every ninja star before the time runs out to clear the level and finish your turn. The teacher picks the time.'
  ],
  scoring: [
    { swatch: '<span class="jump-legend-swatch star"></span>', label: 'Ninja star', points: '+1' },
    { swatch: '<span class="jump-legend-swatch clear">&#10003;</span>', label: 'Clear the level', points: '+5', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch clock">+1</span>', label: 'Every second left when you clear it', points: '+1', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch triple">3</span>', label: 'Power-up &mdash; triple jump!', points: '', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch spring"></span>', label: 'Spring &mdash; super jump!', points: '', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch spikes"></span>', label: 'Spikes &mdash; back to the start', points: '&minus;1', tone: 'bad' }
  ],
  tip: 'Hold jump for a big leap, tap it for a small hop. Ride the moving platforms to reach the high ledges! On a touch board, use the arrow and JUMP buttons.'
});

export function renderJumpTeamInputs(count){
  renderTeamSetupRows('jumpTeamInputs', 'jumpAddTeamBtn', count, jumpRowColors, renderJumpTeamInputs);
}
renderJumpTeamInputs(2);
wireAddTeamButton('jumpTeamInputs', 'jumpAddTeamBtn', renderJumpTeamInputs);

document.getElementById('jumpStartBtn').addEventListener('click', () => {
  state.jumpTeams = readTeamsFromSetup('jump', jumpRowColors);
  state.jumpCurrentTeam = 0;
  state.jumpTurnsPlayed = 0;
  state.jumpQuestionOrder = shuffle(JUMP_QUESTIONS.map((_, i) => i));

  showGameScreen('jump');
  renderJumpScoreboard();
  renderJumpTurnBanner();
  syncTimePicker();
  loadLevel(0);
  resizeJumpCanvas();
});

/* ---- The teacher's round-length picker (shown between turns) ---- */
function syncTimePicker(){
  document.querySelectorAll('#jumpTimes [data-seconds]').forEach(btn => {
    const on = Number(btn.dataset.seconds) === roundSeconds();
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
document.querySelectorAll('#jumpTimes [data-seconds]').forEach(btn => {
  btn.addEventListener('click', () => {
    if(state.jumpRoundActive) return;
    state.jumpSeconds = Number(btn.dataset.seconds);
    syncTimePicker();
  });
});

function renderJumpScoreboard(){
  renderTeamScoreboard('jumpTeamList', state.jumpTeams, state.jumpCurrentTeam);
}
function renderJumpTurnBanner(){
  renderTurnBanner('jump', state.jumpTeams[state.jumpCurrentTeam], state.jumpTurnsPlayed + 1, JUMP_QUESTIONS.length);
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askJumpQuestion(){
  const q = JUMP_QUESTIONS[state.jumpQuestionOrder[state.jumpTurnsPlayed]];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('jumpBeginTurnBtn').addEventListener('click', beginJumpTurn);
async function beginJumpTurn(){
  document.getElementById('jumpBeginTurnBtn').disabled = true;
  await askJumpQuestion();
  startJumpRound();
}

/* =========================================================
   CANVAS SIZING (opaque: the scenery layer covers it every frame)
========================================================= */
const jumpCanvasResizer = createCanvasResizer('jumpCanvas', 'jumpPlayArea', () => {
  sceneryKey = '';
  if(!state.jumpRoundActive) renderJumpCanvas();
}, { contextAttributes: { alpha: false } });
function resizeJumpCanvas(){ jumpCanvasResizer.resize(); }
export function ensureJumpLayout(){
  if(state.jumpTeams.length > 0) resizeJumpCanvas();
}

/* =========================================================
   LEVEL STATE
========================================================= */
let levelIndex = 0;
let grid = [];            // rows of single-character strings
let stars = [];           // { x, y, got, phase }
let springs = [];         // { x, y, firedAt }
let movers = [];          // moving platforms, see LEVELS
let powerups = [];        // { x, y, got, phase } - the triple jump
let tripleJump = false;   // collected this round
let clearedAt = 0;        // when the level was cleared (ends the round)
let roundEndsAt = 0;
let spawn = { x: 1.5, y: 14 };
let ninja = null;
let jumpParticles = [];
let jumpFloatTexts = [];
let jumpShake = createShakeState();
let jumpBannerText = '';
let jumpBannerUntil = 0;

function loadLevel(i){
  levelIndex = i % LEVELS.length;
  const lv = LEVELS[levelIndex];
  grid = lv.map.map(r => r.split(''));
  stars = [];
  springs = [];
  powerups = [];
  tripleJump = false;
  movers = (lv.movers || []).map(m => ({ ...m, x0: m.x, y0: m.y, prevY: m.y, ddx: 0 }));
  stepMovers(performance.now());
  movers.forEach(m => { m.prevY = m.y; m.ddx = 0; });
  for(let y = 0; y < ROWS; y++){
    for(let x = 0; x < COLS; x++){
      const ch = grid[y][x];
      if(ch === '*'){ stars.push({ x: x + 0.5, y: y + 0.5, got: false, phase: Math.random() * 6 }); grid[y][x] = '.'; }
      else if(ch === 'T'){ powerups.push({ x: x + 0.5, y: y + 0.45, got: false, phase: Math.random() * 6 }); grid[y][x] = '.'; }
      else if(ch === 'S'){ springs.push({ x, y, firedAt: -1e9 }); }
      else if(ch === 'P'){ spawn = { x: x + 0.5, y: y + 1 }; grid[y][x] = '.'; }
    }
  }
  sceneryKey = '';
  resetNinja();
  jumpBannerText = lv.name;
  jumpBannerUntil = performance.now() + 1400;
}

function resetNinja(){
  ninja = {
    x: spawn.x, y: spawn.y, vx: 0, vy: 0, face: 1,
    onGround: true, lastGroundAt: performance.now(), airJumps: 0,
    squash: 0, flipStart: -1e9, runPhase: 0, frozenUntil: 0, blinkUntil: 0,
    platform: null,     // the moving platform it's standing on
    springBoost: false  // rising from a spring: full height, held or not
  };
}

function tileAt(tx, ty){
  if(tx < 0 || tx >= COLS) return '#';   // side walls
  if(ty < 0) return '.';                 // open sky above
  if(ty >= ROWS) return '#';
  return grid[ty][tx];
}

/* =========================================================
   INPUT
========================================================= */
const input = { left: false, right: false, jumpHeld: false, jumpPressedAt: -1e9 };
const LEFT_KEYS = ['a', 'arrowleft'], RIGHT_KEYS = ['d', 'arrowright'], JUMP_KEYS = [' ', 'w', 'arrowup'];

function pressJump(){
  if(!input.jumpHeld) input.jumpPressedAt = performance.now();
  input.jumpHeld = true;
}
function releaseAllInput(){
  input.left = input.right = input.jumpHeld = false;
  input.jumpPressedAt = -1e9;
}

window.addEventListener('keydown', (e) => {
  if(!state.jumpRoundActive) return;
  const tag = e.target.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if(LEFT_KEYS.includes(k)){ input.left = true; e.preventDefault(); }
  else if(RIGHT_KEYS.includes(k)){ input.right = true; e.preventDefault(); }
  // preventDefault on Space also stops it "clicking" whatever button
  // still has focus (the question modal's, say) or scrolling the page.
  else if(JUMP_KEYS.includes(k)){ if(!e.repeat) pressJump(); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if(LEFT_KEYS.includes(k)) input.left = false;
  else if(RIGHT_KEYS.includes(k)) input.right = false;
  else if(JUMP_KEYS.includes(k)) input.jumpHeld = false;
});
window.addEventListener('blur', releaseAllInput);

// On-screen buttons for touch boards. Pointer events, so a finger
// sliding off a button still releases it (pointerleave).
function wireHoldButton(id, onDown, onUp){
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', (e) => { if(state.jumpRoundActive){ onDown(); } e.preventDefault(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, onUp));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
wireHoldButton('jumpLeftBtn', () => { input.left = true; }, () => { input.left = false; });
wireHoldButton('jumpRightBtn', () => { input.right = true; }, () => { input.right = false; });
wireHoldButton('jumpJumpBtn', pressJump, () => { input.jumpHeld = false; });

/* =========================================================
   MOVING PLATFORMS
   There and back, positioned from the clock rather than stepped, so
   they're in the same place at any frame rate. Each one PAUSES at both
   ends of its trip (MOVER_DWELL of the period at each end, so about a
   second), level with the ledge it serves: a smooth swing with no pause
   was only level with the ledge for an instant, and stepping off it
   meant falling. Each keeps last frame's top (prevY) and this frame's
   sideways move (ddx) for the ninja to ride along with.
========================================================= */
const MOVER_DWELL = 0.2;
function moverProgress(u){
  const D = MOVER_DWELL;
  if(u < D) return 0;
  if(u < 0.5){ const t = (u - D) / (0.5 - D); return t * t * (3 - 2 * t); }
  if(u < 0.5 + D) return 1;
  const t = (u - 0.5 - D) / (0.5 - D);
  return 1 - t * t * (3 - 2 * t);
}
function stepMovers(now){
  for(const m of movers){
    const u = ((now / 1000 / m.period + m.phase) % 1 + 1) % 1;
    const k = moverProgress(u);
    const nx = m.x0 + m.dx * k;
    m.prevY = m.y;
    m.ddx = nx - m.x;
    m.x = nx;
    m.y = m.y0 + m.dy * k;
  }
}

/* =========================================================
   PHYSICS
========================================================= */
function overlapsTile(left, top, right, bottom, test){
  for(let ty = Math.floor(top); ty <= Math.floor(bottom - 1e-6); ty++){
    for(let tx = Math.floor(left); tx <= Math.floor(right - 1e-6); tx++){
      if(test(tileAt(tx, ty), tx, ty)) return { tx, ty };
    }
  }
  return null;
}

function moveX(dx){
  ninja.x += dx;
  const hit = overlapsTile(ninja.x - PLAYER_W / 2, ninja.y - PLAYER_H, ninja.x + PLAYER_W / 2, ninja.y, ch => ch === '#');
  if(hit){
    ninja.x = dx > 0 ? hit.tx - PLAYER_W / 2 - 1e-4 : hit.tx + 1 + PLAYER_W / 2 + 1e-4;
    ninja.vx = 0;
  }
}

function moveY(dy){
  const prevFeet = ninja.y;
  ninja.y += dy;
  const left = ninja.x - PLAYER_W / 2, right = ninja.x + PLAYER_W / 2;
  if(dy > 0){
    // Landing on stone, or on a plank the feet were above a moment ago.
    const hit = overlapsTile(left, ninja.y - PLAYER_H, right, ninja.y, (ch, tx, ty) =>
      ch === '#' || (ch === '=' && prevFeet <= ty + 1e-3));
    if(hit){
      ninja.y = hit.ty;
      land();
      return;
    }
    // Moving platforms are one-way, like planks: land if the feet were
    // above the platform's top a moment ago (its top THIS frame or last,
    // whichever is lower, so a lift rising into the feet still catches
    // them) and are at or below it now.
    for(const m of movers){
      if(right > m.x && left < m.x + m.w && prevFeet <= Math.max(m.y, m.prevY) + 0.02 && ninja.y >= m.y){
        ninja.y = m.y;
        land();
        ninja.platform = m;
        return;
      }
    }
  } else if(dy < 0){
    const hit = overlapsTile(left, ninja.y - PLAYER_H, right, ninja.y, ch => ch === '#');
    if(hit){
      ninja.y = hit.ty + 1 + PLAYER_H;
      ninja.vy = 0; // bonk
    }
  }
}

function land(){
  if(!ninja.onGround && ninja.vy > 10){
    ninja.squash = Math.min(0.35, ninja.vy / 70);
    dust(ninja.x, ninja.y, 6);
  }
  ninja.vy = 0;
  ninja.onGround = true;
  ninja.airJumps = 0;
  ninja.springBoost = false;
  ninja.lastGroundAt = performance.now();
}

function maxAirJumps(){ return tripleJump ? 2 : 1; }

function stepNinja(dtSec, now){
  // Ride a moving platform: carried sideways with it (walls still stop
  // the ninja) and kept standing on its top as it rises or sinks.
  const m = ninja.platform;
  if(m && ninja.vy >= 0){
    if(ninja.x + PLAYER_W / 2 > m.x && ninja.x - PLAYER_W / 2 < m.x + m.w){
      moveX(m.ddx);
      ninja.y = m.y;
    } else {
      ninja.platform = null;
    }
  }
  const frozen = now < ninja.frozenUntil;
  const dir = frozen ? 0 : (input.right ? 1 : 0) - (input.left ? 1 : 0);

  // Run: accelerate toward the target speed, with friction when idle.
  const accel = ninja.onGround ? RUN_ACCEL : AIR_ACCEL;
  if(dir !== 0){
    ninja.vx += dir * accel * dtSec;
    ninja.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, ninja.vx));
    ninja.face = dir;
  } else {
    const f = (ninja.onGround ? GROUND_FRICTION : AIR_FRICTION) * dtSec;
    ninja.vx = Math.abs(ninja.vx) <= f ? 0 : ninja.vx - Math.sign(ninja.vx) * f;
  }

  // Jump: buffered presses, coyote time, then the double jump.
  if(!frozen && now - input.jumpPressedAt < JUMP_BUFFER_MS){
    const canGroundJump = ninja.onGround || now - ninja.lastGroundAt < COYOTE_MS;
    if(canGroundJump && ninja.vy >= 0){
      ninja.vy = -JUMP_V;
      ninja.onGround = false;
      ninja.platform = null;
      ninja.lastGroundAt = -1e9; // spend the coyote window
      ninja.squash = -0.25;
      input.jumpPressedAt = -1e9;
      dust(ninja.x, ninja.y, 4);
      beep(420, 0.07, 'square', 0.035); beep(640, 0.07, 'square', 0.035, 0.04);
    } else if(!ninja.onGround && ninja.airJumps < maxAirJumps()){
      // Double jump, and with the power-up a third: each one flips.
      ninja.airJumps++;
      ninja.vy = -DOUBLE_JUMP_V;
      ninja.springBoost = false;
      ninja.flipStart = now;
      input.jumpPressedAt = -1e9;
      const third = ninja.airJumps === 2;
      spawnJumpParticles(ninja.x, ninja.y - PLAYER_H * 0.2, third ? POWERUP_COLOR : '#FFFFFF', third ? 12 : 8, 0.08);
      beep(third ? 900 : 700, 0.07, 'square', 0.035); beep(third ? 1350 : 1050, 0.08, 'square', 0.035, 0.04);
    }
  }

  // Lower gravity while rising with jump held = variable jump height.
  if(ninja.vy >= 0) ninja.springBoost = false;
  const g = (ninja.vy < 0 && (input.jumpHeld || ninja.springBoost)) ? GRAVITY : GRAVITY * FALL_GRAVITY_MULT;
  const vyBefore = ninja.vy;
  ninja.vy = Math.min(MAX_FALL, ninja.vy + g * dtSec);

  // Moved by the AVERAGE of the old and new speed: exact under constant
  // gravity, so a jump reaches the same height at 20fps as at 60fps.
  // (Plain v*dt lost ~0.2 tiles at 60fps and ~0.6 at 20fps - enough to
  // miss a ledge the levels are built around on a slow classroom PC.)
  // Sub-stepped so a fast fall can't tunnel through a one-tile plank.
  const dx = ninja.vx * dtSec, dy = (vyBefore + ninja.vy) / 2 * dtSec;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.25));
  const wasGround = ninja.onGround;
  ninja.onGround = false;
  ninja.platform = null; // re-set by moveY if it lands on one again
  for(let i = 0; i < steps; i++){
    moveX(dx / steps);
    moveY(dy / steps);
  }
  if(wasGround && !ninja.onGround && ninja.vy >= 0) ninja.lastGroundAt = now; // walked off a ledge: coyote starts now

  if(ninja.onGround && Math.abs(ninja.vx) > 0.5) ninja.runPhase += Math.abs(ninja.vx) * dtSec * 2.2;
  ninja.squash *= Math.pow(0.0005, dtSec); // springs back in ~0.15s
}

function checkThings(now){
  const left = ninja.x - PLAYER_W / 2, right = ninja.x + PLAYER_W / 2;
  const top = ninja.y - PLAYER_H, bottom = ninja.y;

  for(const st of stars){
    if(st.got) continue;
    const cx = Math.max(left, Math.min(st.x, right)), cy = Math.max(top, Math.min(st.y, bottom));
    if(Math.hypot(cx - st.x, cy - st.y) < STAR_RADIUS) collectStar(st);
  }

  for(const sp of springs){
    // The spring's coil fills the bottom 40% of its tile.
    if(right > sp.x && left < sp.x + 1 && bottom > sp.y + 0.6 && top < sp.y + 1 && ninja.vy >= 0){
      ninja.vy = -SPRING_V;
      ninja.onGround = false;
      ninja.platform = null;
      ninja.lastGroundAt = -1e9;
      ninja.springBoost = true;  // full height whether or not jump is held
      ninja.airJumps = 0;        // a spring gives the air jumps back
      ninja.squash = -0.35;
      sp.firedAt = now;
      beep(260, 0.16, 'sine', 0.12); beep(520, 0.18, 'sine', 0.1, 0.06);
    }
  }

  for(const pu of powerups){
    if(pu.got) continue;
    const cx = Math.max(left, Math.min(pu.x, right)), cy = Math.max(top, Math.min(pu.y, bottom));
    if(Math.hypot(cx - pu.x, cy - pu.y) < 0.5) collectPowerup(pu, now);
  }

  if(now >= ninja.blinkUntil){
    const spike = overlapsTile(left + 0.12, top, right - 0.12, bottom - 0.02, (ch, tx, ty) => ch === '^' && bottom > ty + 0.5);
    if(spike) hurt(now);
  }
}

function collectStar(st){
  st.got = true;
  addJumpScore(STAR_POINTS);
  const L = layout(jumpCanvasResizer.getCanvas());
  const px = L.ox + st.x * L.s, py = L.oy + st.y * L.s;
  spawnJumpParticles(st.x, st.y, '#E6EEF8', 10, 0.1);
  spawnFloatText(jumpFloatTexts, px, py, '+1', '#FFFFFF');
  beep(1568, 0.06, 'triangle', 0.08); beep(2093, 0.08, 'triangle', 0.07, 0.05);
  if(stars.every(s => s.got)) levelClear();
}

function collectPowerup(pu, now){
  pu.got = true;
  tripleJump = true;
  // If it's grabbed mid-air, the third jump is available straight away.
  const L = layout(jumpCanvasResizer.getCanvas());
  spawnJumpParticles(pu.x, pu.y, POWERUP_COLOR, 18, 0.14);
  spawnFloatText(jumpFloatTexts, L.ox + pu.x * L.s, L.oy + (pu.y - 0.6) * L.s, 'TRIPLE JUMP!', POWERUP_COLOR, -0.9);
  sfxRisingChime([784, 988, 1175]);
  jumpBannerText = 'TRIPLE JUMP!';
  jumpBannerUntil = now + 1100;
}

// Clearing the level ends the turn: +5 and a point for every whole
// second left. The round keeps drawing for CLEAR_SHOW_MS (the ninja
// stops) so the class sees it, then finishes (see tick).
function levelClear(){
  if(clearedAt) return;
  const now = performance.now();
  clearedAt = now;
  const secondsLeft = Math.max(0, Math.floor((roundEndsAt - now) / 1000));
  const bonus = secondsLeft * TIME_BONUS_PER_SEC;
  addJumpScore(LEVEL_CLEAR_POINTS + bonus);
  const canvas = jumpCanvasResizer.getCanvas();
  spawnFloatText(jumpFloatTexts, canvas.width / 2, canvas.height * 0.4, `LEVEL CLEAR! +${LEVEL_CLEAR_POINTS}`, '#FFE066', -0.8);
  if(bonus > 0){
    spawnFloatText(jumpFloatTexts, canvas.width / 2, canvas.height * 0.4 + Math.max(22, canvas.width * 0.04), `TIME BONUS +${bonus}`, '#7CFFB2', -0.8);
  }
  sfxRisingChime([660, 880, 1046, 1318, 1568]);
  triggerShake(jumpShake, 4);
  releaseAllInput();
}

// For the automated tests only: collect every star at once, as if the
// level had been played through.
export function debugCollectAllStars(){
  if(!state.jumpRoundActive) return;
  for(const st of stars) if(!st.got) collectStar(st);
}

// For the automated tests only: live views of the level and the ninja,
// so a test can place the ninja and check what the physics does with it
// (does a spring reach the ledge, does a lift carry you up).
export function debugJumpInternals(){
  return {
    get ninja(){ return ninja; },
    get movers(){ return movers; },
    get levelIndex(){ return levelIndex; },
    loadLevel,
    setTriple(on){ tripleJump = on; }
  };
}

function hurt(now){
  const lost = Math.min(state.jumpScore, SPIKE_PENALTY);
  addJumpScore(-lost);
  const L = layout(jumpCanvasResizer.getCanvas());
  spawnJumpParticles(ninja.x, ninja.y - PLAYER_H / 2, '#3A3F4B', 16, 0.14);
  spawnFloatText(jumpFloatTexts, L.ox + ninja.x * L.s, L.oy + (ninja.y - 1) * L.s, lost ? `OUCH! −${lost}` : 'OUCH!', '#FF6B6B', -1.1);
  triggerShake(jumpShake, 6);
  sfxImpact(0.8);
  resetNinja();
  ninja.frozenUntil = now + 350;
  ninja.blinkUntil = now + 900;
}

function addJumpScore(n){
  state.jumpScore = Math.max(0, state.jumpScore + n);
  document.getElementById('jumpScoreDisplay').textContent = String(state.jumpScore);
}

/* =========================================================
   PARTICLES (positions kept in TILE units, converted when drawn)
========================================================= */
function spawnJumpParticles(x, y, color, count, speed){
  count = particleCount(count);
  for(let i = 0; i < count; i++){
    const a = Math.random() * Math.PI * 2;
    const sp = (Math.random() * 0.7 + 0.3) * speed;
    jumpParticles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, alpha: 1,
      decay: Math.random() * 0.03 + 0.03, size: Math.random() * 0.08 + 0.05, color });
  }
}
function dust(x, y, count){
  count = particleCount(count);
  for(let i = 0; i < count; i++){
    const side = i % 2 ? 1 : -1;
    jumpParticles.push({ x: x + side * 0.2, y: y - 0.05, vx: side * (0.03 + Math.random() * 0.04), vy: -Math.random() * 0.03,
      alpha: 0.7, decay: 0.04, size: 0.08 + Math.random() * 0.06, color: '#D9CBB8' });
  }
}

/* =========================================================
   RENDERING
========================================================= */
function layout(canvas){
  const s = Math.min(canvas.width / COLS, canvas.height / ROWS);
  return { s, ox: (canvas.width - COLS * s) / 2, oy: (canvas.height - ROWS * s) / 2 };
}

let sceneryLayer = null;
let sceneryKey = '';
function drawScenery(canvas){
  const key = `${canvas.width}x${canvas.height}:${levelIndex}`;
  if(sceneryLayer && key === sceneryKey) return sceneryLayer;
  sceneryKey = key;
  sceneryLayer = sceneryLayer || document.createElement('canvas');
  sceneryLayer.width = canvas.width;
  sceneryLayer.height = canvas.height;
  const ctx = sceneryLayer.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const lv = LEVELS[levelIndex];

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, lv.sky[0]);
  sky.addColorStop(1, lv.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Moon - placed per level where it won't sit behind a star.
  const [mx, my] = lv.moon || [0.82, 0.2];
  ctx.fillStyle = 'rgba(255, 244, 214, 0.9)';
  ctx.beginPath();
  ctx.arc(w * mx, h * my, h * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // Far mountains and a pagoda, as flat silhouettes.
  ctx.fillStyle = 'rgba(10, 8, 25, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  const peaks = [[0, 0.72], [0.12, 0.5], [0.25, 0.68], [0.4, 0.45], [0.55, 0.66], [0.7, 0.52], [0.85, 0.7], [1, 0.55]];
  peaks.forEach(([px, py]) => ctx.lineTo(px * w, py * h));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 8, 25, 0.5)';
  const pw = h * 0.07, px0 = w * 0.62, base = h * 0.66;
  for(let i = 0; i < 3; i++){
    const tierW = pw * (1.6 - i * 0.35), y = base - i * pw * 0.7;
    ctx.fillRect(px0 - tierW * 0.35, y - pw * 0.45, tierW * 0.7, pw * 0.45);
    ctx.beginPath();
    ctx.moveTo(px0 - tierW * 0.6, y - pw * 0.4);
    ctx.lineTo(px0, y - pw * 0.75);
    ctx.lineTo(px0 + tierW * 0.6, y - pw * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  const { s, ox, oy } = layout(canvas);
  // The level keeps its 36x16 shape, so on a taller or wider play area
  // there's spare room around it. Below it is solid ground, beside it
  // stone walls, so the floor never looks like it's floating in the sky.
  ctx.fillStyle = '#3B3648';
  ctx.fillRect(0, oy + ROWS * s - 1, w, h - (oy + ROWS * s) + 1);
  if(ox > 0){
    ctx.fillRect(0, 0, ox + 0.5, h);
    ctx.fillRect(ox + COLS * s - 0.5, 0, w - (ox + COLS * s) + 0.5, h);
  }
  for(let y = 0; y < ROWS; y++){
    for(let x = 0; x < COLS; x++){
      const ch = grid[y][x];
      const X = ox + x * s, Y = oy + y * s;
      if(ch === '#'){
        ctx.fillStyle = '#4A4458';
        ctx.fillRect(X, Y, s + 0.5, s + 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(X, Y + s * 0.5, s + 0.5, 1);
        ctx.fillRect(X + ((y % 2) ? s * 0.5 : 0), Y, 1, s * 0.5);
        // A grassy lip on any block with open air above it.
        if(tileAt(x, y - 1) !== '#'){
          ctx.fillStyle = '#6FBF73';
          ctx.fillRect(X, Y, s + 0.5, s * 0.16);
        }
      } else if(ch === '='){
        ctx.fillStyle = '#B07A4A';
        ctx.fillRect(X, Y, s + 0.5, s * 0.26);
        ctx.fillStyle = '#7E5230';
        ctx.fillRect(X, Y + s * 0.2, s + 0.5, s * 0.06);
      } else if(ch === '^'){
        ctx.fillStyle = '#C9D3DF';
        ctx.beginPath();
        for(let k = 0; k < 3; k++){
          const bx = X + (k / 3) * s;
          ctx.moveTo(bx, Y + s);
          ctx.lineTo(bx + s / 6, Y + s * 0.42);
          ctx.lineTo(bx + s / 3, Y + s);
        }
        ctx.fill();
      }
    }
  }

  // Each moving platform's track: a faint dotted line along its path,
  // so the class can see where a platform goes before it gets there.
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for(const m of movers){
    const cx0 = ox + (m.x0 + m.w / 2) * s, cy0 = oy + (m.y0 + 0.12) * s;
    const len = Math.hypot(m.dx, m.dy) * s;
    const n = Math.max(2, Math.round(len / (s * 0.5)));
    for(let i = 0; i <= n; i++){
      const t = i / n;
      ctx.fillRect(cx0 + m.dx * s * t - 1.5, cy0 + m.dy * s * t - 1.5, 3, 3);
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `700 ${Math.max(11, s * 0.55)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Level ${levelIndex + 1}: ${lv.name}`, ox + s * 0.3, oy + s * 0.25);
  return sceneryLayer;
}

function drawStar(ctx, x, y, r, angle){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#DDE5F0';
  ctx.beginPath();
  for(let i = 0; i < 8; i++){
    const rad = i % 2 === 0 ? r : r * 0.32;
    const a = (Math.PI / 4) * i;
    if(i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5A6478';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpring(ctx, X, Y, s, now, firedAt){
  const t = Math.min(1, (now - firedAt) / 250);
  const stretch = t < 1 ? 1 + 0.6 * Math.sin(t * Math.PI) : 1;
  const coilH = s * 0.32 * stretch;
  const base = Y + s;
  ctx.strokeStyle = '#9AA3B2';
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.beginPath();
  for(let i = 0; i <= 4; i++){
    const yy = base - (i / 4) * coilH;
    ctx.lineTo(X + s * (i % 2 ? 0.75 : 0.25), yy);
  }
  ctx.stroke();
  ctx.fillStyle = '#FF5C5C';
  ctx.fillRect(X + s * 0.12, base - coilH - s * 0.12, s * 0.76, s * 0.14);
}

// A lacquered wooden platform with gold end caps, so it reads as
// something different from the still planks.
function drawMover(ctx, L, m){
  const { s, ox, oy } = L;
  const X = ox + m.x * s, Y = oy + m.y * s, W = m.w * s;
  ctx.fillStyle = '#C0392B';
  ctx.fillRect(X, Y, W, s * 0.3);
  ctx.fillStyle = '#7B241C';
  ctx.fillRect(X, Y + s * 0.22, W, s * 0.08);
  ctx.fillStyle = '#F4C542';
  ctx.fillRect(X, Y, s * 0.16, s * 0.3);
  ctx.fillRect(X + W - s * 0.16, Y, s * 0.16, s * 0.3);
}

// The triple-jump power-up: a glowing purple orb with three stacked
// chevrons, bobbing.
function drawPowerup(ctx, L, pu, now){
  const { s, ox, oy } = L;
  const x = ox + pu.x * s, y = oy + pu.y * s + Math.sin(now / 260 + pu.phase) * s * 0.1;
  const r = s * 0.42;
  drawGlow(ctx, x, y, s * 1.1, POWERUP_COLOR, 0.55 + 0.2 * Math.sin(now / 180), 1.4);
  ctx.fillStyle = POWERUP_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for(let i = 0; i < 3; i++){
    const cy = y + r * (0.42 - i * 0.36);
    ctx.moveTo(x - r * 0.42, cy + r * 0.14);
    ctx.lineTo(x, cy - r * 0.14);
    ctx.lineTo(x + r * 0.42, cy + r * 0.14);
  }
  ctx.stroke();
}

function drawNinja(ctx, L, now, color){
  if(now < ninja.blinkUntil && Math.floor(now / 90) % 2 === 0) return;
  const { s, ox, oy } = L;
  const x = ox + ninja.x * s, feet = oy + ninja.y * s;
  const h = PLAYER_H * s, w = PLAYER_W * s;
  const sq = ninja.squash;

  // With the power-up: a purple aura, and while airborne, one small pip
  // over the head per air jump still left - so the class can see "two
  // more jumps!" at a glance.
  if(tripleJump) drawGlow(ctx, x, feet - h * 0.6, h * 1.3, POWERUP_COLOR, 0.45, 1.6);
  if(!ninja.onGround){
    const left = maxAirJumps() - ninja.airJumps;
    ctx.fillStyle = tripleJump ? POWERUP_COLOR : '#FFFFFF';
    for(let i = 0; i < left; i++){
      ctx.beginPath();
      ctx.arc(x + (i - (left - 1) / 2) * s * 0.32, feet - h * 1.55, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(x, feet);
  // Drawn 20% larger than the hitbox, a common platformer trick: the
  // ninja reads better from the back of the room, and collisions stay
  // forgiving.
  ctx.scale(1.2 * (1 + sq * 0.6) * ninja.face, 1.2 * (1 - sq));
  // Double-jump flip: one full turn around the body's middle.
  const flipT = (now - ninja.flipStart) / 380;
  if(flipT >= 0 && flipT < 1){
    ctx.translate(0, -h / 2);
    ctx.rotate(flipT * Math.PI * 2);
    ctx.translate(0, h / 2);
  }

  const dark = '#23262E';
  // Legs: a simple two-step run cycle.
  const swing = ninja.onGround ? Math.sin(ninja.runPhase * Math.PI) * w * 0.18 : w * 0.12;
  ctx.fillStyle = dark;
  ctx.fillRect(-w * 0.3 + swing, -h * 0.28, w * 0.22, h * 0.28);
  ctx.fillRect(w * 0.08 - swing, -h * 0.28, w * 0.22, h * 0.28);
  // Body
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -h * 0.25);
  ctx.lineTo(-w * 0.38, -h * 0.72);
  ctx.lineTo(w * 0.38, -h * 0.72);
  ctx.lineTo(w * 0.42, -h * 0.25);
  ctx.closePath();
  ctx.fill();
  // Belt in the team's colour.
  ctx.fillStyle = color;
  ctx.fillRect(-w * 0.42, -h * 0.4, w * 0.84, h * 0.07);
  // Head
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, -h * 0.8, w * 0.42, 0, Math.PI * 2);
  ctx.fill();
  // Eye slit and eyes
  ctx.fillStyle = '#F3CFA6';
  ctx.fillRect(-w * 0.1, -h * 0.86, w * 0.5, h * 0.11);
  ctx.fillStyle = '#1B1E24';
  ctx.fillRect(w * 0.06, -h * 0.84, w * 0.07, h * 0.07);
  ctx.fillRect(w * 0.26, -h * 0.84, w * 0.07, h * 0.07);
  // Headband with two tails streaming out behind.
  ctx.fillStyle = color;
  ctx.fillRect(-w * 0.42, -h * 0.98, w * 0.84, h * 0.09);
  const flow = Math.min(1, Math.abs(ninja.vx) / RUN_SPEED);
  const wave = Math.sin(now / 90) * h * 0.06;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, h * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, -h * 0.94);
  ctx.quadraticCurveTo(-w * (0.8 + flow * 0.3), -h * (0.98 - flow * 0.1) + wave, -w * (1.0 + flow * 0.5), -h * (0.8 - flow * 0.12) - wave);
  ctx.moveTo(-w * 0.4, -h * 0.92);
  ctx.quadraticCurveTo(-w * (0.75 + flow * 0.25), -h * 0.8 - wave, -w * (0.9 + flow * 0.35), -h * (0.66 - flow * 0.1) + wave);
  ctx.stroke();
  ctx.restore();
}

function renderJumpCanvas(){
  const canvas = jumpCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0 || !grid.length) return;
  const ctx = jumpCanvasResizer.getContext();
  const now = performance.now();
  const L = layout(canvas);
  const { s, ox, oy } = L;

  ctx.save();
  applyShake(ctx, jumpShake);
  ctx.drawImage(drawScenery(canvas), 0, 0);

  for(const sp of springs) drawSpring(ctx, ox + sp.x * s, oy + sp.y * s, s, now, sp.firedAt);
  for(const m of movers) drawMover(ctx, L, m);
  for(const pu of powerups) if(!pu.got) drawPowerup(ctx, L, pu, now);

  for(const st of stars){
    if(st.got) continue;
    const bob = Math.sin(now / 300 + st.phase) * s * 0.08;
    drawGlow(ctx, ox + st.x * s, oy + st.y * s + bob, s * 0.7, '#BFD7FF', 0.35, 1.6);
    drawStar(ctx, ox + st.x * s, oy + st.y * s + bob, s * 0.36, now / 260 + st.phase);
  }

  if(ninja){
    const team = state.jumpTeams[state.jumpCurrentTeam];
    drawNinja(ctx, L, now, team ? team.color : '#E4574B');
  }

  ctx.save();
  for(const p of jumpParticles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(ox + p.x * s, oy + p.y * s, Math.max(0.5, p.size * s), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  drawFloatTexts(ctx, jumpFloatTexts, Math.max(16, canvas.width * 0.03));

  // Level name, big, for a moment at the start of each level.
  if(state.jumpRoundActive && now < jumpBannerUntil){
    const a = Math.min(1, (jumpBannerUntil - now) / 400);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${Math.max(18, s * 1.3)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(jumpBannerText, canvas.width / 2, canvas.height * 0.3);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startJumpRound(){
  cancelJumpRound();
  state.jumpRoundActive = true;
  state.jumpScore = 0;
  jumpParticles = [];
  jumpFloatTexts = [];
  jumpShake = createShakeState();
  clearedAt = 0;
  releaseAllInput();

  document.getElementById('jumpScoreDisplay').textContent = '0';
  const JUMP_ROUND_SECONDS = roundSeconds(); // fixed for this round
  document.getElementById('jumpTimeDisplay').textContent = JUMP_ROUND_SECONDS;
  setTimerFill(document.getElementById('jumpTimerFill'), 1);
  document.getElementById('jumpPlayArea').classList.remove('idle');
  document.getElementById('jumpHint').classList.remove('hidden');
  resizeJumpCanvas();
  // Every team in the same lap of turns plays the same level (fair), and
  // each lap moves on to the next level (variety).
  const lap = Math.floor(state.jumpTurnsPlayed / Math.max(1, state.jumpTeams.length));
  loadLevel(lap);

  const start = performance.now();
  roundEndsAt = start + JUMP_ROUND_SECONDS * 1000;
  let lastTime = start;
  const updateTimerHud = createTimerHud(document.getElementById('jumpTimeDisplay'), document.getElementById('jumpTimerFill'), JUMP_ROUND_SECONDS);

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    noteFrame();
    lastTime = now;
    const remaining = Math.max(0, JUMP_ROUND_SECONDS - (now - start) / 1000);
    if(!clearedAt) updateTimerHud(remaining); // the clock stops on a clear

    stepMovers(now);
    if(!clearedAt){
      stepNinja(dt / 1000, now);
      checkThings(now);
    }
    const k = frameFactor(dt);
    stepParticles(jumpParticles, k, { gravity: 0.004, dragX: 0.95 });
    jumpFloatTexts = updateFloatTexts(jumpFloatTexts, k);
    renderJumpCanvas();

    if(clearedAt ? now - clearedAt >= CLEAR_SHOW_MS : remaining <= 0){ finishJumpRound(); return; }
    state.jumpRoundRAF = requestAnimationFrame(tick);
  }
  state.jumpRoundRAF = requestAnimationFrame(tick);
}

export function cancelJumpRound(){
  if(state.jumpRoundRAF) cancelAnimationFrame(state.jumpRoundRAF);
  state.jumpRoundRAF = null;
  releaseAllInput();
  if(state.jumpRoundActive){
    state.jumpRoundActive = false;
    const playArea = document.getElementById('jumpPlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('jumpHint');
    if(hint) hint.classList.add('hidden');
    renderJumpCanvas();
    const beginBtn = document.getElementById('jumpBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishJumpRound(){
  state.jumpRoundActive = false;
  state.jumpRoundRAF = null;
  releaseAllInput();
  document.getElementById('jumpPlayArea').classList.add('idle');
  document.getElementById('jumpHint').classList.add('hidden');
  renderJumpCanvas();

  const team = state.jumpTeams[state.jumpCurrentTeam];
  team.total += state.jumpScore;
  state.jumpTurnsPlayed++;
  renderJumpScoreboard();

  showTurnResultModal('jumpNextTeamBtn', { teams: state.jumpTeams, currentTeamIndex: state.jumpCurrentTeam }).then(() => {
    if(state.jumpTurnsPlayed >= JUMP_QUESTIONS.length){
      endJumpGame();
    } else {
      state.jumpCurrentTeam = (state.jumpCurrentTeam + 1) % state.jumpTeams.length;
      renderJumpScoreboard();
      renderJumpTurnBanner();
      document.getElementById('jumpBeginTurnBtn').disabled = false;
      document.getElementById('jumpTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('jumpTimerFill'), 1);
    }
  });
}

function endJumpGame(){
  const winnerText = finishTeamGame({ prefix: 'jump', teams: state.jumpTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('jumpTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'jump',
  getTeams: () => state.jumpTeams,
  renderScoreboard: renderJumpScoreboard,
  cancelRound: cancelJumpRound
});

document.getElementById('jumpBackBtn').addEventListener('click', () => goToStage(15));
// A "Next" button's handler lives in the file for the stage it goes TO.
document.getElementById('mazeNextStageBtn').addEventListener('click', () => goToStage(16));
