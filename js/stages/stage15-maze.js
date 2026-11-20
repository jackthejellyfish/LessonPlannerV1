import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { MAZE_QUESTIONS } from '../content/stage15-maze.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, stepParticles, frameFactor } from '../canvasEffects.js';
import { drawGlow } from '../canvasGlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame, isLowQuality } from '../quality.js';

/* =========================================================
   STAGE 15 — JELLY MAZE
   Jack the jellyfish is trapped in a coral maze, and sharks are after
   him. Top-down, grid-based: Jack swims cell to cell (Pac-Man style,
   so he never snags on a corner), collecting pearls (+1). Reaching the
   EXIT scores a bonus and drops him into a fresh maze with one more,
   slightly faster shark. A shark that catches him costs points and
   sends him back to the start.

   Sharks chase by breadth-first search over the maze (at most ~25x9
   cells, so a full search is trivial and runs only when a shark
   reaches a cell centre, not every frame). They are always slower
   than Jack, and the maze is "braided" (some dead ends knocked
   through into loops), so a team that keeps moving can always dodge.

   Performance: the maze walls and backdrop are drawn ONCE per maze
   (and per canvas size) onto an offscreen layer and blitted each
   frame; the per-frame work is the pearls, Jack and 1-3 sharks.
========================================================= */
// 20s, and escaping ENDS the round (classroom feedback 2026-11-18): a
// team races for the exit, and seconds left on the clock are points.
const MAZE_ROUND_SECONDS = 20;
const MAZE_ROWS = 9;
const MAZE_PLAYER_SPEED = 5.2;      // cells per second
const MAZE_SHARK_SPEED_BASE = 3.2;  // cells per second, maze 1
const MAZE_SHARK_SPEED_STEP = 0.4;  // faster each maze...
const MAZE_SHARK_SPEED_MAX = 4.6;   // ...but always slower than Jack
const MAZE_MAX_SHARKS = 3;
const MAZE_SHARK_RELEASE_MS = 1600; // head start at the start of each maze
const MAZE_CATCH_DIST = 0.62;       // cells
const MAZE_INVULN_MS = 1400;
const MAZE_PEARL_CHANCE = 0.34;
const MAZE_PEARL_POINTS = 1;
const MAZE_EXIT_POINTS = 10;
const MAZE_TIME_BONUS_PER_SEC = 1;  // per whole second left when Jack escapes
const MAZE_ESCAPE_SHOW_MS = 1100;   // the "ESCAPED!" moment before the result screen
const MAZE_CAUGHT_PENALTY = 3;
const MAZE_BRAID_CHANCE = 0.55;     // share of dead ends opened into loops

// Wall bits, and the moves they block.
const N = 1, E = 2, S = 4, W = 8;
const DIRS = {
  up:    { bit: N, dx: 0,  dy: -1, back: S },
  right: { bit: E, dx: 1,  dy: 0,  back: W },
  down:  { bit: S, dx: 0,  dy: 1,  back: N },
  left:  { bit: W, dx: -1, dy: 0,  back: E }
};
const DIR_NAMES = ['up', 'right', 'down', 'left'];
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const MAZE_WALL_COLOR = '#FF8A7A';
const MAZE_WALL_SHADE = '#B8484A';
const MAZE_PEARL_COLOR = '#F4F1FF';
const MAZE_EXIT_COLOR = '#7CFFB2';

/* =========================================================
   SETUP / TEAMS (same pattern as every other game)
========================================================= */
let mazeRowColors = [];

renderGameIntro('mazeSetup', {
  prefix: 'maze',
  title: 'Jelly Maze',
  steps: [
    'One team answers a question.',
    'Help Jack the jellyfish swim out of the maze! Use WASD or the arrow keys, or hold your finger on the board where you want to go.',
    'Grab pearls and reach the EXIT within 20 seconds. Escaping ends your turn.'
  ],
  scoring: [
    { swatch: '<span class="maze-legend-swatch pearl"></span>', label: 'Pearl', points: '+1' },
    { swatch: '<span class="maze-legend-swatch exit">EXIT</span>', label: 'Escape the maze', points: '+10', tone: 'bonus' },
    { swatch: '<span class="maze-legend-swatch clock">+1</span>', label: 'Every second left when you escape', points: '+1', tone: 'bonus' },
    { swatch: '<span class="maze-legend-swatch shark"></span>', label: 'Caught by a shark', points: '&minus;3', tone: 'bad' }
  ],
  tip: 'Grab a few pearls, or race straight for the exit &mdash; your choice! Each new lap of turns adds a shark. Sharks are slower than Jack, so keep swimming.'
});

export function renderMazeTeamInputs(count){
  renderTeamSetupRows('mazeTeamInputs', 'mazeAddTeamBtn', count, mazeRowColors, renderMazeTeamInputs);
}
renderMazeTeamInputs(2);
wireAddTeamButton('mazeTeamInputs', 'mazeAddTeamBtn', renderMazeTeamInputs);

document.getElementById('mazeStartBtn').addEventListener('click', () => {
  state.mazeTeams = readTeamsFromSetup('maze', mazeRowColors);
  state.mazeCurrentTeam = 0;
  state.mazeTurnsPlayed = 0;
  state.mazeQuestionOrder = shuffle(MAZE_QUESTIONS.map((_, i) => i));

  showGameScreen('maze');
  renderMazeScoreboard();
  renderMazeTurnBanner();
  // A maze to look at before the first turn, rather than an empty sea.
  newMaze(1);
  resizeMazeCanvas();
});

function renderMazeScoreboard(){
  renderTeamScoreboard('mazeTeamList', state.mazeTeams, state.mazeCurrentTeam);
}
function renderMazeTurnBanner(){
  renderTurnBanner('maze', state.mazeTeams[state.mazeCurrentTeam], state.mazeTurnsPlayed + 1, MAZE_QUESTIONS.length);
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askMazeQuestion(){
  const q = MAZE_QUESTIONS[state.mazeQuestionOrder[state.mazeTurnsPlayed]];
  return askTeamQuestion(q, MAZE_QUESTIONS, state.mazeTurnsPlayed);
}

document.getElementById('mazeBeginTurnBtn').addEventListener('click', beginMazeTurn);
async function beginMazeTurn(){
  document.getElementById('mazeBeginTurnBtn').disabled = true;
  await askMazeQuestion();
  startMazeRound();
}

/* =========================================================
   CANVAS SIZING
   Opaque canvas: the backdrop layer covers it every frame.
========================================================= */
const mazeCanvasResizer = createCanvasResizer('mazeCanvas', 'mazePlayArea', () => {
  staticLayerKey = '';
  if(!state.mazeRoundActive) renderMazeCanvas();
}, { contextAttributes: { alpha: false } });
function resizeMazeCanvas(){ mazeCanvasResizer.resize(); }
export function ensureMazeLayout(){
  if(state.mazeTeams.length > 0) resizeMazeCanvas();
}

/* =========================================================
   THE MAZE
========================================================= */
// Transient per-round data lives in module variables (same reasoning
// as every other canvas game: render data, not game data).
let maze = null;          // { cols, rows, walls: Uint8Array, id }
let mazeIdCounter = 0;
let mazeLevel = 1;
let pearls = new Set();   // cell indices that still hold a pearl
let player = null;
let sharks = [];
let mazeParticles = [];
let mazeFloatTexts = [];
let mazeShake = createShakeState();
let mazeInvulnUntil = 0;
let mazeFlashUntil = 0;
let mazeFlashColor = '#7CFFB2';
// While the round runs: when it ends (performance.now ms), for the time
// bonus. escapedAt is set the moment Jack escapes; the round then plays
// out its celebration and finishes.
let mazeRoundEndsAt = 0;
let mazeEscapedAt = 0;
let bfsDist = null;
let bfsFrom = -1;

function chooseCols(){
  const canvas = mazeCanvasResizer.getCanvas();
  const aspect = canvas && canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 2;
  // Square cells that fill the play area's shape; odd counts keep the
  // centre den on a real cell.
  let cols = Math.round(MAZE_ROWS * aspect);
  cols = Math.max(9, Math.min(25, cols));
  if(cols % 2 === 0) cols -= 1;
  return cols;
}

// Recursive-backtracker maze, then "braided": a share of the dead ends
// get one extra wall knocked out, which turns them into loops. Loops
// are what make a chase fun - without them one shark in the right
// corridor is an unavoidable catch.
function generateWalls(cols, rows){
  const walls = new Uint8Array(cols * rows).fill(N | E | S | W);
  const visited = new Uint8Array(cols * rows);
  const stack = [0];
  visited[0] = 1;
  while(stack.length){
    const c = stack[stack.length - 1];
    const opts = neighbours(c, cols, rows).filter(([n]) => !visited[n]);
    if(!opts.length){ stack.pop(); continue; }
    const [n, dir] = opts[Math.floor(Math.random() * opts.length)];
    walls[c] &= ~DIRS[dir].bit;
    walls[n] &= ~DIRS[dir].back;
    visited[n] = 1;
    stack.push(n);
  }
  for(let c = 0; c < walls.length; c++){
    const open = DIR_NAMES.filter(d => !(walls[c] & DIRS[d].bit)).length;
    if(open === 1 && Math.random() < MAZE_BRAID_CHANCE){
      const closed = neighbours(c, cols, rows).filter(([, dir]) => walls[c] & DIRS[dir].bit);
      if(closed.length){
        const [n, dir] = closed[Math.floor(Math.random() * closed.length)];
        walls[c] &= ~DIRS[dir].bit;
        walls[n] &= ~DIRS[dir].back;
      }
    }
  }
  return walls;
}

function neighbours(c, cols, rows){
  const x = c % cols, y = (c / cols) | 0;
  const out = [];
  if(y > 0) out.push([c - cols, 'up']);
  if(x < cols - 1) out.push([c + 1, 'right']);
  if(y < rows - 1) out.push([c + cols, 'down']);
  if(x > 0) out.push([c - 1, 'left']);
  return out;
}

function canMove(cx, cy, dir){
  if(!maze) return false;
  const d = DIRS[dir];
  const nx = cx + d.dx, ny = cy + d.dy;
  if(nx < 0 || ny < 0 || nx >= maze.cols || ny >= maze.rows) return false;
  return !(maze.walls[cy * maze.cols + cx] & d.bit);
}

function startCell(){ return { x: 0, y: maze.rows - 1 }; }
function exitCell(){ return { x: maze.cols - 1, y: 0 }; }
function denCells(){
  const cx = (maze.cols - 1) / 2, cy = (maze.rows - 1) / 2;
  return [
    { x: cx, y: cy },             // the centre
    { x: 0, y: 0 },               // top-left
    { x: maze.cols - 1, y: maze.rows - 1 } // bottom-right
  ];
}

function makeMover(x, y){
  return { cx: x, cy: y, tx: x, ty: y, t: 0, dir: null, moving: false, face: 1 };
}

function newMaze(level){
  mazeLevel = level;
  const cols = chooseCols();
  maze = { cols, rows: MAZE_ROWS, walls: generateWalls(cols, MAZE_ROWS), id: ++mazeIdCounter };
  staticLayerKey = '';
  pearls = new Set();
  const s = startCell(), ex = exitCell();
  for(let c = 0; c < cols * MAZE_ROWS; c++){
    const x = c % cols, y = (c / cols) | 0;
    if((x === s.x && y === s.y) || (x === ex.x && y === ex.y)) continue;
    if(Math.random() < MAZE_PEARL_CHANCE) pearls.add(c);
  }
  player = makeMover(s.x, s.y);
  const count = Math.min(MAZE_MAX_SHARKS, level);
  const dens = denCells();
  const releaseAt = performance.now() + MAZE_SHARK_RELEASE_MS;
  sharks = [];
  for(let i = 0; i < count; i++){
    const d = dens[i];
    sharks.push(Object.assign(makeMover(d.x, d.y), { den: d, releaseAt, wander: 0 }));
  }
  bfsFrom = -1;
}

function sharkSpeed(){
  return Math.min(MAZE_SHARK_SPEED_MAX, MAZE_SHARK_SPEED_BASE + (mazeLevel - 1) * MAZE_SHARK_SPEED_STEP);
}

// Mover position in cell units (centre of cell = integer + 0.5 later).
function posOf(m){
  return { x: m.cx + (m.tx - m.cx) * m.t, y: m.cy + (m.ty - m.cy) * m.t };
}

/* =========================================================
   INPUT
   Keys: the most recently pressed held direction wins, and the
   others act as "turn here when you can" - so holding Up while
   swimming along a corridor turns at the next opening.
   Pointer (mouse or touch): hold anywhere on the board and Jack swims
   towards that point, trying the longer axis first.
========================================================= */
const KEY_TO_DIR = {
  w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right'
};
let heldDirs = [];        // most recent last
let pointerTarget = null; // { x, y } in cell units, while held

window.addEventListener('keydown', (e) => {
  if(!state.mazeRoundActive) return;
  const tag = e.target.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA') return;
  const dir = KEY_TO_DIR[e.key.toLowerCase()];
  if(!dir) return;
  e.preventDefault();
  heldDirs = heldDirs.filter(d => d !== dir);
  heldDirs.push(dir);
});
window.addEventListener('keyup', (e) => {
  const dir = KEY_TO_DIR[e.key.toLowerCase()];
  if(dir) heldDirs = heldDirs.filter(d => d !== dir);
});
// Keys released while the window is out of focus never send keyup.
window.addEventListener('blur', () => { heldDirs = []; pointerTarget = null; });

const mazeCanvasEl = mazeCanvasResizer.getCanvas();
function pointerToCells(e){
  const rect = mazeCanvasEl.getBoundingClientRect();
  const canvas = mazeCanvasEl;
  const L = layout(canvas);
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  return { x: (px - L.ox) / L.s - 0.5, y: (py - L.oy) / L.s - 0.5 };
}
mazeCanvasEl.addEventListener('pointerdown', (e) => {
  if(!state.mazeRoundActive) return;
  pointerTarget = pointerToCells(e);
  try{ mazeCanvasEl.setPointerCapture(e.pointerId); }catch(_){ /* not all pointers can be captured */ }
  e.preventDefault();
});
mazeCanvasEl.addEventListener('pointermove', (e) => {
  if(pointerTarget) pointerTarget = pointerToCells(e);
});
['pointerup', 'pointercancel'].forEach(t => mazeCanvasEl.addEventListener(t, () => { pointerTarget = null; }));

// The directions the player wants, best first.
function wantedDirs(){
  const out = heldDirs.slice().reverse();
  if(pointerTarget && player){
    const p = posOf(player);
    const dx = pointerTarget.x - p.x, dy = pointerTarget.y - p.y;
    if(Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3){
      const h = dx > 0 ? 'right' : 'left', v = dy > 0 ? 'down' : 'up';
      const first = Math.abs(dx) >= Math.abs(dy) ? [h, v] : [v, h];
      // Only steer along an axis that still has distance to cover.
      first.forEach(d => {
        const far = (d === 'left' || d === 'right') ? Math.abs(dx) > 0.3 : Math.abs(dy) > 0.3;
        if(far && !out.includes(d)) out.push(d);
      });
    }
  }
  return out;
}

/* =========================================================
   MOVEMENT
========================================================= */
function stepPlayer(dtSec){
  const want = wantedDirs();
  let budget = MAZE_PLAYER_SPEED * dtSec;
  let guard = 0;
  while(budget > 0 && guard++ < 4){
    if(player.moving){
      // Reverse on the spot, mid-corridor, without waiting for a centre.
      if(want[0] && want[0] === OPPOSITE[player.dir]){
        [player.cx, player.tx] = [player.tx, player.cx];
        [player.cy, player.ty] = [player.ty, player.cy];
        player.t = 1 - player.t;
        player.dir = want[0];
      }
      const left = 1 - player.t;
      if(budget < left){ player.t += budget; budget = 0; break; }
      budget -= left;
      player.cx = player.tx; player.cy = player.ty; player.t = 0; player.moving = false;
      onPlayerArrive(); // may end the round (escape)
      if(!state.mazeRoundActive || mazeEscapedAt) break;
    }
    const dir = want.find(d => canMove(player.cx, player.cy, d));
    if(!dir) break;
    const d = DIRS[dir];
    player.tx = player.cx + d.dx; player.ty = player.cy + d.dy;
    player.dir = dir; player.moving = true; player.t = 0;
    if(d.dx) player.face = d.dx;
  }
}

function onPlayerArrive(){
  const c = player.cy * maze.cols + player.cx;
  if(pearls.has(c)){
    pearls.delete(c);
    addMazeScore(MAZE_PEARL_POINTS);
    const L = layout(mazeCanvasResizer.getCanvas());
    const px = L.ox + (player.cx + 0.5) * L.s, py = L.oy + (player.cy + 0.5) * L.s;
    spawnMazeParticles(px, py, MAZE_PEARL_COLOR, 6, L.s / 40);
    spawnFloatText(mazeFloatTexts, px, py, '+1', '#FFFFFF');
    beep(1320 + Math.random() * 120, 0.05, 'sine', 0.07);
  }
  const ex = exitCell();
  if(player.cx === ex.x && player.cy === ex.y) escapeMaze();
}

// Escaping ends the turn: +10, plus a point for every whole second left.
// The round keeps rendering for MAZE_ESCAPE_SHOW_MS (Jack and the sharks
// stop) so the class sees the moment, then finishes (see tick).
// For the automated tests only: put Jack one step from the exit, moving
// into it, so a test can check what escaping does without solving a
// random maze by keyboard.
export function debugMoveJackToExit(){
  if(!state.mazeRoundActive || !player) return;
  const ex = exitCell();
  player.cx = ex.x - 1; player.cy = ex.y;
  player.tx = ex.x; player.ty = ex.y;
  player.dir = 'right'; player.moving = true; player.t = 0.9;
}

function escapeMaze(){
  if(mazeEscapedAt) return;
  const now = performance.now();
  mazeEscapedAt = now;
  const secondsLeft = Math.max(0, Math.floor((mazeRoundEndsAt - now) / 1000));
  const bonus = secondsLeft * MAZE_TIME_BONUS_PER_SEC;
  addMazeScore(MAZE_EXIT_POINTS + bonus);
  const canvas = mazeCanvasResizer.getCanvas();
  const L = layout(canvas);
  const px = L.ox + (player.cx + 0.5) * L.s, py = L.oy + (player.cy + 0.5) * L.s;
  spawnMazeParticles(px, py, MAZE_EXIT_COLOR, 30, L.s / 30);
  spawnFloatText(mazeFloatTexts, canvas.width / 2, canvas.height / 2, `ESCAPED! +${MAZE_EXIT_POINTS}`, MAZE_EXIT_COLOR, -0.8);
  if(bonus > 0){
    spawnFloatText(mazeFloatTexts, canvas.width / 2, canvas.height / 2 + Math.max(22, canvas.width * 0.045), `TIME BONUS +${bonus}`, '#FFE066', -0.8);
  }
  sfxRisingChime([660, 880, 1046, 1318]);
  mazeFlashUntil = now + 450;
  mazeFlashColor = MAZE_EXIT_COLOR;
  mazeInvulnUntil = now + 99999;
  heldDirs = [];
  pointerTarget = null;
}

// Breadth-first distances from the player's cell, recomputed only when
// the player has moved to a different cell since the last search.
function playerCellIndex(){
  const near = player.t > 0.5 ? { x: player.tx, y: player.ty } : { x: player.cx, y: player.cy };
  return near.y * maze.cols + near.x;
}
function refreshBfs(){
  const from = playerCellIndex();
  if(from === bfsFrom && bfsDist) return;
  bfsFrom = from;
  const n = maze.cols * maze.rows;
  if(!bfsDist || bfsDist.length !== n) bfsDist = new Int16Array(n);
  bfsDist.fill(-1);
  const queue = new Int16Array(n);
  let head = 0, tail = 0;
  queue[tail++] = from;
  bfsDist[from] = 0;
  while(head < tail){
    const c = queue[head++];
    const x = c % maze.cols, y = (c / maze.cols) | 0;
    for(const dir of DIR_NAMES){
      if(!canMove(x, y, dir)) continue;
      const nc = (y + DIRS[dir].dy) * maze.cols + (x + DIRS[dir].dx);
      if(bfsDist[nc] === -1){ bfsDist[nc] = bfsDist[c] + 1; queue[tail++] = nc; }
    }
  }
}

function chooseSharkDir(sh){
  const open = DIR_NAMES.filter(d => canMove(sh.cx, sh.cy, d));
  if(!open.length) return null;
  // Maze 1's shark wanders now and then, so it isn't a perfect hunter.
  const wanderChance = mazeLevel === 1 ? 0.18 : 0.08;
  if(Math.random() < wanderChance){
    const noBack = open.filter(d => d !== OPPOSITE[sh.dir]);
    const pool = noBack.length ? noBack : open;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  refreshBfs();
  let best = null, bestD = Infinity;
  for(const d of open){
    const nc = (sh.cy + DIRS[d].dy) * maze.cols + (sh.cx + DIRS[d].dx);
    const dist = bfsDist[nc];
    if(dist >= 0 && dist < bestD){ bestD = dist; best = d; }
  }
  return best;
}

function stepSharks(dtSec, now){
  const speed = sharkSpeed();
  for(const sh of sharks){
    if(now < sh.releaseAt) continue;
    let budget = speed * dtSec;
    let guard = 0;
    while(budget > 0 && guard++ < 4){
      if(sh.moving){
        const left = 1 - sh.t;
        if(budget < left){ sh.t += budget; budget = 0; break; }
        budget -= left;
        sh.cx = sh.tx; sh.cy = sh.ty; sh.t = 0; sh.moving = false;
      }
      const dir = chooseSharkDir(sh);
      if(!dir) break;
      const d = DIRS[dir];
      sh.tx = sh.cx + d.dx; sh.ty = sh.cy + d.dy;
      sh.dir = dir; sh.moving = true; sh.t = 0;
      if(d.dx) sh.face = d.dx;
    }
  }
}

function checkCatch(now){
  if(now < mazeInvulnUntil) return;
  const p = posOf(player);
  for(const sh of sharks){
    if(now < sh.releaseAt) continue;
    const q = posOf(sh);
    if(Math.hypot(p.x - q.x, p.y - q.y) < MAZE_CATCH_DIST){
      caught(sh, now);
      return;
    }
  }
}

function caught(sh, now){
  const lost = Math.min(state.mazeScore, MAZE_CAUGHT_PENALTY);
  addMazeScore(-lost);
  const canvas = mazeCanvasResizer.getCanvas();
  const L = layout(canvas);
  const p = posOf(player);
  const px = L.ox + (p.x + 0.5) * L.s, py = L.oy + (p.y + 0.5) * L.s;
  spawnMazeParticles(px, py, '#C9B8F0', 18, L.s / 30);
  spawnFloatText(mazeFloatTexts, px, py, lost ? `CAUGHT! −${lost}` : 'CAUGHT!', '#FF6B6B', -1.1);
  triggerShake(mazeShake, 8);
  sfxImpact(1.1);
  mazeFlashUntil = now + 300;
  mazeFlashColor = '#FF4444';
  // Back to the start; the shark that caught him goes home to its den.
  const s = startCell();
  Object.assign(player, makeMover(s.x, s.y));
  Object.assign(sh, makeMover(sh.den.x, sh.den.y), { releaseAt: now + 900 });
  mazeInvulnUntil = now + MAZE_INVULN_MS;
  bfsFrom = -1;
}

function addMazeScore(n){
  state.mazeScore = Math.max(0, state.mazeScore + n);
  document.getElementById('mazeScoreDisplay').textContent = String(state.mazeScore);
}

/* =========================================================
   PARTICLES
========================================================= */
function spawnMazeParticles(x, y, color, count, scale = 1){
  count = particleCount(count);
  for(let i = 0; i < count; i++){
    const a = Math.random() * Math.PI * 2;
    const sp = (Math.random() * 3 + 1) * scale;
    mazeParticles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, alpha: 1,
      decay: Math.random() * 0.03 + 0.025, size: (Math.random() * 3 + 2) * scale, color });
  }
}

/* =========================================================
   RENDERING
========================================================= */
function layout(canvas){
  const cols = maze ? maze.cols : 17, rows = maze ? maze.rows : MAZE_ROWS;
  const s = Math.min(canvas.width / cols, canvas.height / rows) * 0.97;
  return { s, ox: (canvas.width - cols * s) / 2, oy: (canvas.height - rows * s) / 2 };
}

// The backdrop + walls + exit gate, drawn once per maze and size.
let staticLayer = null;
let staticLayerKey = '';
function drawStaticLayer(canvas){
  const key = `${canvas.width}x${canvas.height}:${maze ? maze.id : 0}`;
  if(staticLayer && key === staticLayerKey) return staticLayer;
  staticLayerKey = key;
  staticLayer = staticLayer || document.createElement('canvas');
  staticLayer.width = canvas.width;
  staticLayer.height = canvas.height;
  const ctx = staticLayer.getContext('2d');
  const w = canvas.width, h = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0B4F6C');
  bg.addColorStop(1, '#062A3D');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // A few light shafts from the surface - painted once, so free.
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#BFF4FF';
  for(let i = 0; i < 5; i++){
    const x = w * (0.1 + i * 0.2);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.03, 0); ctx.lineTo(x + w * 0.03, 0);
    ctx.lineTo(x + w * 0.09, h); ctx.lineTo(x - w * 0.01, h);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if(!maze) return staticLayer;

  const L = layout(canvas);
  const { s, ox, oy } = L;
  // Sandy floor inside the maze.
  ctx.fillStyle = 'rgba(255, 230, 180, 0.07)';
  ctx.fillRect(ox, oy, maze.cols * s, maze.rows * s);

  // Every wall segment in ONE path, stroked twice (shade, then colour)
  // for a little depth.
  ctx.beginPath();
  for(let y = 0; y < maze.rows; y++){
    for(let x = 0; x < maze.cols; x++){
      const wl = maze.walls[y * maze.cols + x];
      const x0 = ox + x * s, y0 = oy + y * s;
      if(wl & N){ ctx.moveTo(x0, y0); ctx.lineTo(x0 + s, y0); }
      if(wl & W){ ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + s); }
      if(y === maze.rows - 1 && (wl & S)){ ctx.moveTo(x0, y0 + s); ctx.lineTo(x0 + s, y0 + s); }
      // The exit cell's east side is left open: that's the way out.
      if(x === maze.cols - 1 && (wl & E) && y !== 0){ ctx.moveTo(x0 + s, y0); ctx.lineTo(x0 + s, y0 + s); }
    }
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = MAZE_WALL_SHADE;
  ctx.lineWidth = s * 0.2;
  ctx.save();
  ctx.translate(0, s * 0.04);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = MAZE_WALL_COLOR;
  ctx.lineWidth = s * 0.16;
  ctx.stroke();

  // Exit gate label.
  const ex = exitCell();
  ctx.fillStyle = MAZE_EXIT_COLOR;
  ctx.font = `800 ${Math.max(10, s * 0.28)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', ox + (ex.x + 0.5) * s, oy + (ex.y + 0.5) * s);
  // Start marker.
  const st = startCell();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#C9B8F0';
  ctx.font = `700 ${Math.max(9, s * 0.2)}px system-ui, sans-serif`;
  ctx.fillText('START', ox + (st.x + 0.5) * s, oy + (st.y + 0.82) * s);
  ctx.globalAlpha = 1;
  return staticLayer;
}

// Jack: the same bell, cheeks and tentacles as the app icon, in paths.
function drawJack(ctx, x, y, r, now, blink){
  if(blink && Math.floor(now / 110) % 2 === 0) return;
  ctx.save();
  ctx.translate(x, y);
  // Tentacles wave.
  ctx.strokeStyle = '#A996D8';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for(let i = 0; i < 4; i++){
    const tx = -r * 0.6 + i * r * 0.4;
    const sway = Math.sin(now / 160 + i) * r * 0.18;
    ctx.moveTo(tx, r * 0.1);
    ctx.quadraticCurveTo(tx + sway, r * 0.55, tx - sway, r * 1.0);
  }
  ctx.stroke();
  // Bell.
  ctx.fillStyle = '#B9A5E8';
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.15);
  ctx.bezierCurveTo(-r, -r * 1.2, r, -r * 1.2, r, r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.5, r * 0.25, r * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#333B3C';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.18, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.3, -r * 0.18, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F29BA8';
  ctx.beginPath();
  ctx.ellipse(-r * 0.56, r * 0.02, r * 0.13, r * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.56, r * 0.02, r * 0.13, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A side-view cartoon shark, flipped to face the way it swims.
function drawShark(ctx, x, y, r, face, now, waiting){
  ctx.save();
  ctx.translate(x, y + Math.sin(now / 200 + x) * r * 0.06);
  ctx.scale(face < 0 ? -1 : 1, 1);
  if(waiting) ctx.globalAlpha = 0.55 + 0.25 * Math.sin(now / 120);
  // Tail
  ctx.fillStyle = '#5E7189';
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, 0);
  ctx.lineTo(-r * 1.25, -r * 0.5);
  ctx.lineTo(-r * 1.1, 0);
  ctx.lineTo(-r * 1.25, r * 0.45);
  ctx.closePath();
  ctx.fill();
  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.35);
  ctx.lineTo(r * 0.05, -r * 0.95);
  ctx.lineTo(r * 0.3, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  // Body
  ctx.fillStyle = '#7C8DA6';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pale belly
  ctx.fillStyle = '#D9E2EC';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, r * 0.2, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye (angry brow)
  ctx.fillStyle = '#1B2430';
  ctx.beginPath();
  ctx.arc(r * 0.52, -r * 0.12, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1B2430';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(r * 0.38, -r * 0.3); ctx.lineTo(r * 0.64, -r * 0.2);
  ctx.stroke();
  // Toothy grin
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(r * 0.25, r * 0.1);
  for(let i = 0; i < 4; i++){
    ctx.lineTo(r * (0.3 + i * 0.13), r * 0.24);
    ctx.lineTo(r * (0.36 + i * 0.13), r * 0.1);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderMazeCanvas(){
  const canvas = mazeCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0) return;
  const ctx = mazeCanvasResizer.getContext();
  const now = performance.now();

  ctx.save();
  applyShake(ctx, mazeShake);
  ctx.drawImage(drawStaticLayer(canvas), 0, 0);

  if(maze){
    const { s, ox, oy } = layout(canvas);
    // Exit glow, pulsing.
    const ex = exitCell();
    drawGlow(ctx, ox + (ex.x + 0.5) * s, oy + (ex.y + 0.5) * s, s * (0.9 + 0.15 * Math.sin(now / 200)), MAZE_EXIT_COLOR, 0.45, 1.6);

    // Pearls: one fill for the batch, one for the highlights.
    ctx.fillStyle = MAZE_PEARL_COLOR;
    ctx.beginPath();
    for(const c of pearls){
      const x = ox + ((c % maze.cols) + 0.5) * s, y = oy + (((c / maze.cols) | 0) + 0.5) * s;
      ctx.moveTo(x + s * 0.12, y);
      ctx.arc(x, y, s * 0.12, 0, Math.PI * 2);
    }
    ctx.fill();
    if(!isLowQuality()){
      ctx.fillStyle = 'rgba(190, 170, 255, 0.55)';
      ctx.beginPath();
      for(const c of pearls){
        const x = ox + ((c % maze.cols) + 0.5) * s, y = oy + (((c / maze.cols) | 0) + 0.5) * s;
        ctx.moveTo(x + s * 0.05, y + s * 0.04);
        ctx.arc(x + s * 0.03, y + s * 0.04, s * 0.05, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    if(player){
      for(const sh of sharks){
        const q = posOf(sh);
        drawShark(ctx, ox + (q.x + 0.5) * s, oy + (q.y + 0.5) * s, s * 0.4, sh.face, now, now < sh.releaseAt);
      }
      const p = posOf(player);
      const jx = ox + (p.x + 0.5) * s, jy = oy + (p.y + 0.45) * s;
      drawGlow(ctx, jx, jy, s * 0.55, '#C9B8F0', 0.35, 1.6);
      drawJack(ctx, jx, jy, s * 0.3, now, now < mazeInvulnUntil && state.mazeRoundActive);
    }

    // Which maze this is.
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `700 ${Math.max(11, s * 0.26)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Maze ${mazeLevel}`, Math.max(6, ox), Math.max(4, oy - s * 0.32 > 0 ? oy - s * 0.32 : 4));
  }

  ctx.save();
  for(const pt of mazeParticles){
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(0.1, pt.size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  drawFloatTexts(ctx, mazeFloatTexts, Math.max(16, canvas.width * 0.03));

  if(now < mazeFlashUntil){
    ctx.globalAlpha = ((mazeFlashUntil - now) / 450) * 0.3;
    ctx.fillStyle = mazeFlashColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startMazeRound(){
  cancelMazeRound();
  state.mazeRoundActive = true;
  state.mazeScore = 0;
  mazeParticles = [];
  mazeFloatTexts = [];
  mazeShake = createShakeState();
  mazeInvulnUntil = 0;
  mazeFlashUntil = 0;
  mazeEscapedAt = 0;
  heldDirs = [];
  pointerTarget = null;

  document.getElementById('mazeScoreDisplay').textContent = '0';
  document.getElementById('mazeTimeDisplay').textContent = MAZE_ROUND_SECONDS;
  setTimerFill(document.getElementById('mazeTimerFill'), 1);
  document.getElementById('mazePlayArea').classList.remove('idle');
  document.getElementById('mazeHint').classList.remove('hidden');
  resizeMazeCanvas();
  // Every team in a lap plays the same difficulty: lap 1 has one shark,
  // lap 2 two (and faster), up to three.
  newMaze(1 + Math.floor(state.mazeTurnsPlayed / Math.max(1, state.mazeTeams.length)));

  const start = performance.now();
  mazeRoundEndsAt = start + MAZE_ROUND_SECONDS * 1000;
  let lastTime = start;
  const updateTimerHud = createTimerHud(document.getElementById('mazeTimeDisplay'), document.getElementById('mazeTimerFill'), MAZE_ROUND_SECONDS);

  function tick(now){
    const dt = Math.min(50, now - lastTime);
    noteFrame();
    lastTime = now;
    const remaining = Math.max(0, MAZE_ROUND_SECONDS - (now - start) / 1000);
    if(!mazeEscapedAt) updateTimerHud(remaining); // the clock stops on escape

    const dtSec = dt / 1000;
    if(!mazeEscapedAt){
      stepPlayer(dtSec);
      stepSharks(dtSec, now);
      checkCatch(now);
    }
    const k = frameFactor(dt);
    stepParticles(mazeParticles, k, { dragX: 0.94, dragY: 0.94 });
    mazeFloatTexts = updateFloatTexts(mazeFloatTexts, k);
    renderMazeCanvas();

    if(mazeEscapedAt ? now - mazeEscapedAt >= MAZE_ESCAPE_SHOW_MS : remaining <= 0){ finishMazeRound(); return; }
    state.mazeRoundRAF = requestAnimationFrame(tick);
  }
  state.mazeRoundRAF = requestAnimationFrame(tick);
}

export function cancelMazeRound(){
  if(state.mazeRoundRAF) cancelAnimationFrame(state.mazeRoundRAF);
  state.mazeRoundRAF = null;
  heldDirs = [];
  pointerTarget = null;
  if(state.mazeRoundActive){
    state.mazeRoundActive = false;
    const playArea = document.getElementById('mazePlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('mazeHint');
    if(hint) hint.classList.add('hidden');
    renderMazeCanvas();
    const beginBtn = document.getElementById('mazeBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishMazeRound(){
  state.mazeRoundActive = false;
  state.mazeRoundRAF = null;
  heldDirs = [];
  pointerTarget = null;
  document.getElementById('mazePlayArea').classList.add('idle');
  document.getElementById('mazeHint').classList.add('hidden');
  renderMazeCanvas();

  const team = state.mazeTeams[state.mazeCurrentTeam];
  team.total += state.mazeScore;
  state.mazeTurnsPlayed++;
  renderMazeScoreboard();

  showTurnResultModal('mazeNextTeamBtn', { teams: state.mazeTeams, currentTeamIndex: state.mazeCurrentTeam }).then(() => {
    if(state.mazeTurnsPlayed >= MAZE_QUESTIONS.length){
      endMazeGame();
    } else {
      state.mazeCurrentTeam = (state.mazeCurrentTeam + 1) % state.mazeTeams.length;
      renderMazeScoreboard();
      renderMazeTurnBanner();
      document.getElementById('mazeBeginTurnBtn').disabled = false;
      document.getElementById('mazeTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('mazeTimerFill'), 1);
    }
  });
}

function endMazeGame(){
  const winnerText = finishTeamGame({ prefix: 'maze', teams: state.mazeTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('mazeTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'maze',
  getTeams: () => state.mazeTeams,
  renderScoreboard: renderMazeScoreboard,
  cancelRound: cancelMazeRound
});

document.getElementById('mazeBackBtn').addEventListener('click', () => goToStage(14));
// A "Next" button's handler lives in the file for the stage it goes TO.
document.getElementById('whackNextStageBtn').addEventListener('click', () => goToStage(15));
