import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { ZOMBIE_QUESTIONS, bankOf } from '../content/stage17-zombies.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, stepParticles, frameFactor } from '../canvasEffects.js';
import { drawGlow } from '../canvasGlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';
import { particleCount, noteFrame } from '../quality.js';

/* =========================================================
   STAGE 17 — ZOMBIE DASH (added 2026-11-22)
   A top-down chase for the youngest classes. Pip (a kid in a red cap)
   collects sweets in a park while slow, goofy zombies shuffle after
   them. Nobody "dies": a zombie that catches Pip just knocks two sweets
   out of their hands, and the sweets bounce away to be picked up again.

   The fun is in the physics and the pick-ups:
   - beach balls Pip can kick; a fast ball bonks a zombie dizzy (+2);
   - zombies jostle each other and slide along hedges and bushes;
   - sand slows everyone down, and the Ice Rink is slippery for all;
   - Cure Potion: zombies get scared and run; catch one and it turns
     back into a happy kid (+3); Super Sneakers: a burst of speed;
     Bubble Blast: every zombie nearby is blown away and stunned.

   Six simple levels, easiest first. Each lap of turns moves on a level
   (every team in a lap plays the same one) and the teacher can pick
   any level between turns, the same as Ninja Jump.

   World: a fixed 160 x 90 field, scaled to fit the play area and
   centred (so every level looks the same on any screen). The field,
   fences and scenery are drawn once per canvas size and level into a
   cached layer; a frame draws only what moves.
========================================================= */
const ROUND_SECONDS = 20;
const WORLD_W = 160, WORLD_H = 90;
const FENCE = 3;                 // the fence's thickness, inside the field
const PLAYER_R = 3.4;
const PLAYER_SPEED = 44;         // units/second
const SNEAKER_SPEED = 70;
const ZOMBIE_R = 3.7;
const BALL_R = 3.2;
const CANDY_R = 1.9;
const CANDY_COUNT = 7;
const PICKUP_R = 2.8;
const POWER_MS = 5000;
const INVULN_MS = 1400;
const STUN_MS = 2000;
const RISE_MS = 700;             // a new zombie climbing out of the ground
const BONK_SPEED = 26;           // how fast a ball must hit a zombie to bonk it
const CANDY_COLORS = ['#FF5FA2', '#5FC8FF', '#B07CFF', '#FF9F43', '#3FD38B'];

/* ---- The levels ----
   obstacles: solid. bush/pumpkin/snowman/tree/rock are circles
   { x, y, r }; hedge/slide/grave are boxes { x, y, w, h }.
   zones: sand (or mud) slows anything inside to `slow`.
   ice: everyone slides. night: a darker palette and a glow around Pip.
   The middle of every field is left open: Pip starts there. */
const LEVELS = [
  { name: 'Sunny Park', diff: 'easy', ground: '#8FD16A', ground2: '#82C45E', zombies: 2, zSpeed: 14, balls: 1,
    obstacles: [
      { t: 'bush', x: 38, y: 26, r: 7 }, { t: 'bush', x: 124, y: 64, r: 8 },
      { t: 'bush', x: 120, y: 22, r: 5 }, { t: 'bush', x: 36, y: 66, r: 6 }, { t: 'rock', x: 80, y: 14, r: 3.5 }
    ], zones: [] },
  { name: 'Playground', diff: 'easy', ground: '#9ED872', ground2: '#90CB63', zombies: 3, zSpeed: 15, balls: 2,
    obstacles: [
      { t: 'slide', x: 16, y: 12, w: 10, h: 24 }, { t: 'slide', x: 134, y: 54, w: 10, h: 24 },
      { t: 'bush', x: 124, y: 20, r: 6 }, { t: 'bush', x: 34, y: 70, r: 6 }
    ], zones: [{ t: 'sand', x: 58, y: 58, w: 44, h: 22, slow: 0.5 }] },
  { name: 'Jungle Trail', diff: 'easy', ground: '#6DBE55', ground2: '#62B14B', zombies: 3, zSpeed: 15, balls: 1,
    obstacles: [
      { t: 'palm', x: 34, y: 22, r: 5.5 }, { t: 'palm', x: 126, y: 68, r: 5.5 }, { t: 'palm', x: 40, y: 70, r: 5 },
      { t: 'palm', x: 122, y: 20, r: 5 }, { t: 'log', x: 66, y: 10, w: 28, h: 5 }, { t: 'log', x: 66, y: 75, w: 28, h: 5 }
    ], zones: [{ t: 'river', x: 14, y: 38, w: 40, h: 12, slow: 0.5 }, { t: 'river', x: 106, y: 38, w: 40, h: 12, slow: 0.5 }] },
  { name: 'Pumpkin Patch', diff: 'medium', ground: '#B98B58', ground2: '#AA7D4B', zombies: 3, zSpeed: 17, balls: 1,
    obstacles: [
      { t: 'pumpkin', x: 30, y: 22, r: 4.5 }, { t: 'pumpkin', x: 54, y: 30, r: 3.5 }, { t: 'pumpkin', x: 106, y: 24, r: 4 },
      { t: 'pumpkin', x: 130, y: 34, r: 5 }, { t: 'pumpkin', x: 28, y: 62, r: 4 }, { t: 'pumpkin', x: 104, y: 68, r: 4.5 },
      { t: 'pumpkin', x: 134, y: 72, r: 3.5 }, { t: 'pumpkin', x: 58, y: 70, r: 3 }
    ], zones: [{ t: 'mud', x: 70, y: 8, w: 22, h: 14, slow: 0.55 }, { t: 'mud', x: 68, y: 70, w: 26, h: 13, slow: 0.55 }] },
  { name: 'Desert Oasis', diff: 'medium', ground: '#EBCB86', ground2: '#E2C07A', zombies: 3, zSpeed: 17, balls: 1,
    obstacles: [
      { t: 'cactus', x: 30, y: 22, r: 3.8 }, { t: 'cactus', x: 50, y: 70, r: 3.4 }, { t: 'cactus', x: 112, y: 22, r: 3.8 },
      { t: 'cactus', x: 132, y: 64, r: 4.2 }, { t: 'rock', x: 80, y: 14, r: 3.5 }, { t: 'rock', x: 98, y: 74, r: 3 }
    ], zones: [{ t: 'quicksand', x: 24, y: 38, w: 26, h: 16, slow: 0.4 }, { t: 'quicksand', x: 110, y: 38, w: 26, h: 16, slow: 0.4 }] },
  { name: 'Hedge Maze', diff: 'medium', ground: '#A6D985', ground2: '#98CC77', zombies: 3, zSpeed: 16, balls: 1,
    obstacles: [
      { t: 'hedge', x: 24, y: 18, w: 40, h: 6 }, { t: 'hedge', x: 96, y: 18, w: 40, h: 6 },
      { t: 'hedge', x: 24, y: 66, w: 40, h: 6 }, { t: 'hedge', x: 96, y: 66, w: 40, h: 6 },
      { t: 'hedge', x: 24, y: 30, w: 6, h: 30 }, { t: 'hedge', x: 130, y: 30, w: 6, h: 30 },
      { t: 'hedge', x: 52, y: 38, w: 6, h: 14 }, { t: 'hedge', x: 102, y: 38, w: 6, h: 14 }
    ], zones: [] },
  { name: 'Ice Rink', diff: 'medium', ice: true, ground: '#D6F1FF', ground2: '#C4E8FA', zombies: 3, zSpeed: 16, balls: 2,
    obstacles: [
      { t: 'snowman', x: 34, y: 24, r: 5 }, { t: 'snowman', x: 126, y: 66, r: 5 },
      { t: 'snowman', x: 128, y: 22, r: 4 }, { t: 'snowman', x: 32, y: 68, r: 4 }
    ], zones: [] },
  { name: 'Snowy Mountain', diff: 'medium', ground: '#EEF6FF', ground2: '#E2EDF8', zombies: 4, zSpeed: 16, balls: 2,
    obstacles: [
      { t: 'pine', x: 28, y: 20, r: 5 }, { t: 'pine', x: 132, y: 24, r: 5 }, { t: 'pine', x: 36, y: 70, r: 5 },
      { t: 'pine', x: 124, y: 70, r: 5 }, { t: 'pine', x: 80, y: 12, r: 4 }, { t: 'snowman', x: 60, y: 22, r: 3.5 }
    ], zones: [{ t: 'snow', x: 52, y: 62, w: 56, h: 14, slow: 0.6 }, { t: 'snow', x: 8, y: 34, w: 16, h: 22, slow: 0.6 }, { t: 'snow', x: 136, y: 34, w: 16, h: 22, slow: 0.6 }] },
  { name: 'Spooky Night', diff: 'hard', night: true, ground: '#3C4A66', ground2: '#35425C', zombies: 5, zSpeed: 18, balls: 1,
    obstacles: [
      { t: 'grave', x: 26, y: 16, w: 8, h: 10 }, { t: 'grave', x: 46, y: 16, w: 8, h: 10 }, { t: 'grave', x: 106, y: 16, w: 8, h: 10 },
      { t: 'grave', x: 126, y: 16, w: 8, h: 10 }, { t: 'grave', x: 26, y: 64, w: 8, h: 10 }, { t: 'grave', x: 126, y: 64, w: 8, h: 10 },
      { t: 'tree', x: 80, y: 74, r: 5 }, { t: 'tree', x: 80, y: 14, r: 4 }
    ], zones: [] },
  { name: 'Volcano Island', diff: 'hard', ground: '#5A4640', ground2: '#52403A', zombies: 5, zSpeed: 18, balls: 1,
    obstacles: [
      { t: 'lava', x: 28, y: 15, w: 22, h: 12 }, { t: 'lava', x: 110, y: 63, w: 22, h: 12 },
      { t: 'lava', x: 112, y: 14, w: 18, h: 10 }, { t: 'lava', x: 28, y: 63, w: 20, h: 11 },
      { t: 'rock', x: 80, y: 13, r: 4 }, { t: 'rock', x: 80, y: 78, r: 3.5 }
    ], zones: [{ t: 'ash', x: 60, y: 60, w: 40, h: 14, slow: 0.7 }] }
];
// Where zombies climb out of the ground: the four corners and the
// middle of the long sides, whichever are furthest from Pip.
const SPAWNS = [[12, 10], [148, 10], [12, 80], [148, 80], [80, 7], [80, 83], [8, 45], [152, 45]];

/* =========================================================
   AUDIO
========================================================= */
function sfxCandy(){ beep(1320 + Math.random() * 160, 0.06, 'triangle', 0.09); beep(1760, 0.05, 'sine', 0.05, 0.04); }
function sfxGolden(){ sfxRisingChime([880, 1108, 1318, 1760], { duration: 0.1, volume: 0.13, stagger: 0.045 }); }
function sfxCaught(){ beep(520, 0.09, 'sine', 0.14); beep(330, 0.14, 'sine', 0.12, 0.07); beep(220, 0.16, 'triangle', 0.08, 0.15); }
function sfxKick(){ beep(160, 0.07, 'sine', 0.16); beep(90, 0.08, 'triangle', 0.08, 0.02); }
function sfxBonk(){ sfxImpact(0.5); beep(700, 0.05, 'square', 0.06, 0.03); beep(980, 0.08, 'triangle', 0.07, 0.07); }
function sfxCure(){ sfxRisingChime([660, 880, 1046, 1318], { duration: 0.1, volume: 0.13, stagger: 0.05 }); }
function sfxPower(){ sfxRisingChime([523, 659, 784, 1046, 1318], { duration: 0.09, volume: 0.13, stagger: 0.04 }); }
function sfxBubble(){ beep(300, 0.25, 'sine', 0.14); beep(600, 0.2, 'sine', 0.08, 0.05); beep(1200, 0.12, 'sine', 0.05, 0.1); }
function sfxGroan(){ beep(170 + Math.random() * 30, 0.35, 'sawtooth', 0.025); beep(130, 0.3, 'sine', 0.05, 0.1); }

/* =========================================================
   SETUP / TEAMS
========================================================= */
let zombieRowColors = [];

renderGameIntro('zombieSetup', {
  prefix: 'zombie',
  title: 'Zombie Dash',
  steps: [
    'One team answers a question.',
    'Help Pip grab the sweets! Move with WASD or the arrow keys, or hold your finger on the board where you want Pip to go.',
    'Kick the beach balls at the zombies, and grab the power-ups. You have 20 seconds.'
  ],
  scoring: [
    { swatch: '<span class="zombie-legend-swatch candy"></span>', label: 'Sweet', points: '+1' },
    { swatch: '<span class="zombie-legend-swatch golden"></span>', label: 'Golden sweet', points: '+3', tone: 'bonus' },
    { swatch: '<span class="zombie-legend-swatch ball"></span>', label: 'Bonk a zombie with a ball', points: '+2', tone: 'bonus' },
    { swatch: '<span class="zombie-legend-swatch potion"></span>', label: 'Cure Potion: catch a zombie to cure it', points: '+3', tone: 'bonus' },
    { swatch: '<span class="zombie-legend-swatch sneakers"></span>', label: 'Super Sneakers', points: 'run faster', tone: 'bonus' },
    { swatch: '<span class="zombie-legend-swatch bubble"></span>', label: 'Bubble Blast', points: 'blows zombies away', tone: 'bonus' },
    { swatch: '<span class="zombie-legend-swatch zombie"></span>', label: 'Caught by a zombie', points: '&minus;2', tone: 'bad' }
  ],
  tip: 'Caught? Your sweets bounce out &mdash; grab them back! The zombies are slow, so keep moving. Each lap of turns is a new level.'
});

export function renderZombieTeamInputs(count){
  renderTeamSetupRows('zombieTeamInputs', 'zombieAddTeamBtn', count, zombieRowColors, renderZombieTeamInputs);
}
renderZombieTeamInputs(2);
wireAddTeamButton('zombieTeamInputs', 'zombieAddTeamBtn', renderZombieTeamInputs);

document.getElementById('zombieStartBtn').addEventListener('click', () => {
  state.zombieTeams = readTeamsFromSetup('zombie', zombieRowColors);
  state.zombieCurrentTeam = 0;
  state.zombieTurnsPlayed = 0;
  state.zombieQuestionOrder = shuffle(ZOMBIE_QUESTIONS.map((_, i) => i));
  state.zombieLevel = 0;
  showGameScreen('zombie');
  renderZombieScoreboard();
  renderZombieTurnBanner();
  syncLevelPicker();
  loadLevel(state.zombieLevel);
  resizeZombieCanvas();
});

function renderZombieScoreboard(){
  renderTeamScoreboard('zombieTeamList', state.zombieTeams, state.zombieCurrentTeam);
}
function renderZombieTurnBanner(){
  renderTurnBanner('zombie', state.zombieTeams[state.zombieCurrentTeam], state.zombieTurnsPlayed + 1, ZOMBIE_QUESTIONS.length);
}

/* ---- The teacher's level picker (shown between turns) ---- */
const levelPicker = document.getElementById('zombieLevels');
levelPicker.insertAdjacentHTML('beforeend', LEVELS.map((lv, i) =>
  `<button type="button" class="lvl-${lv.diff}" data-level="${i}" title="${lv.name} (${lv.diff})">${i + 1}</button>`).join(''));
function syncLevelPicker(){
  levelPicker.querySelectorAll('[data-level]').forEach(btn => {
    const on = Number(btn.dataset.level) === state.zombieLevel;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
levelPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-level]');
  if(!btn || state.zombieRoundActive) return;
  state.zombieLevel = Number(btn.dataset.level);
  syncLevelPicker();
  loadLevel(state.zombieLevel);
  renderZombieCanvas();
});

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askZombieQuestion(){
  const q = ZOMBIE_QUESTIONS[state.zombieQuestionOrder[state.zombieTurnsPlayed]];
  return askTeamQuestion(q, bankOf(q), state.zombieTurnsPlayed);
}

document.getElementById('zombieBeginTurnBtn').addEventListener('click', beginZombieTurn);
async function beginZombieTurn(){
  document.getElementById('zombieBeginTurnBtn').disabled = true;
  await askZombieQuestion();
  startZombieRound();
}

/* =========================================================
   CANVAS SIZING
   Opaque canvas: the cached field layer covers it every frame.
========================================================= */
const zombieCanvasResizer = createCanvasResizer('zombieCanvas', 'zombiePlayArea', () => {
  fieldKey = '';
  if(!state.zombieRoundActive) renderZombieCanvas();
}, { contextAttributes: { alpha: false }, maxBufferWidth: 1024 });
function resizeZombieCanvas(){ zombieCanvasResizer.resize(); }
export function ensureZombieLayout(){
  if(state.zombieTeams.length > 0) resizeZombieCanvas();
}

// World -> canvas: one scale for both axes, the field centred.
function viewOf(canvas){
  const s = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
  return { s, ox: (canvas.width - WORLD_W * s) / 2, oy: (canvas.height - WORLD_H * s) / 2 };
}

/* =========================================================
   ROUND DATA (module-level: render data, not game data)
========================================================= */
let level = LEVELS[0];
let player = null;
let zombies = [];
let kids = [];       // cured zombies running home
let balls = [];
let candies = [];
let pickup = null;
let particles = [];
let floatTexts = [];
let shake = createShakeState();
let cureUntil = 0, sneakersUntil = 0, invulnUntil = 0;
let nextPickupAt = 0;
let respawns = [];   // times at which a cured zombie's replacement climbs out
let roundStart = 0;

function loadLevel(i){
  level = LEVELS[i] || LEVELS[0];
  fieldKey = '';
  player = { x: WORLD_W / 2, y: WORLD_H / 2, vx: 0, vy: 0, r: PLAYER_R, face: 1, step: 0 };
  zombies = []; kids = []; candies = []; particles = []; floatTexts = []; pickup = null; respawns = [];
  balls = Array.from({ length: level.balls }, (_, k) => ({
    x: WORLD_W / 2 + (k === 0 ? -24 : 24), y: WORLD_H / 2 + (k === 0 ? 14 : -14), vx: 0, vy: 0, r: BALL_R, spin: 0
  }));
  for(let k = 0; k < CANDY_COUNT; k++) addCandy();
}

/* =========================================================
   COLLISION HELPERS
========================================================= */
// Pushes a circle out of every obstacle and the fences. `bounce` is how
// much of the speed into a surface comes back out (0 = slide along it).
function collideWorld(o, bounce){
  const min = FENCE + o.r, maxX = WORLD_W - FENCE - o.r, maxY = WORLD_H - FENCE - o.r;
  let hit = false;
  if(o.x < min){ o.x = min; if(o.vx < 0){ o.vx = -o.vx * bounce; hit = true; } }
  if(o.x > maxX){ o.x = maxX; if(o.vx > 0){ o.vx = -o.vx * bounce; hit = true; } }
  if(o.y < min){ o.y = min; if(o.vy < 0){ o.vy = -o.vy * bounce; hit = true; } }
  if(o.y > maxY){ o.y = maxY; if(o.vy > 0){ o.vy = -o.vy * bounce; hit = true; } }
  for(const ob of level.obstacles){
    let nx, ny, dist, reach;
    if(ob.w){
      const cx = Math.max(ob.x, Math.min(ob.x + ob.w, o.x));
      const cy = Math.max(ob.y, Math.min(ob.y + ob.h, o.y));
      nx = o.x - cx; ny = o.y - cy; dist = Math.hypot(nx, ny); reach = o.r;
      if(dist === 0){ // centre inside the box: out the nearest side
        const sides = [o.x - ob.x, ob.x + ob.w - o.x, o.y - ob.y, ob.y + ob.h - o.y];
        const m = Math.min(...sides), k = sides.indexOf(m);
        nx = k === 0 ? -1 : k === 1 ? 1 : 0; ny = k === 2 ? -1 : k === 3 ? 1 : 0;
        dist = 0; reach = o.r + m;
      }
    } else {
      nx = o.x - ob.x; ny = o.y - ob.y; dist = Math.hypot(nx, ny); reach = o.r + ob.r;
    }
    if(dist >= reach) continue;
    const len = dist || 1;
    const ux = dist ? nx / len : nx, uy = dist ? ny / len : ny;
    o.x += ux * (reach - dist); o.y += uy * (reach - dist);
    const into = o.vx * ux + o.vy * uy;
    if(into < 0){ o.vx -= (1 + bounce) * into * ux; o.vy -= (1 + bounce) * into * uy; hit = true; }
  }
  return hit;
}

function inZoneSlow(o){
  for(const z of level.zones){
    if(o.x > z.x && o.x < z.x + z.w && o.y > z.y && o.y < z.y + z.h) return z.slow;
  }
  return 1;
}

function blockedAt(x, y, r){
  if(x < FENCE + r || x > WORLD_W - FENCE - r || y < FENCE + r || y > WORLD_H - FENCE - r) return true;
  return level.obstacles.some(ob => ob.w
    ? x > ob.x - r && x < ob.x + ob.w + r && y > ob.y - r && y < ob.y + ob.h + r
    : Math.hypot(x - ob.x, y - ob.y) < ob.r + r);
}

// A free spot for a sweet: clear of scenery, sweets, and Pip.
function freeSpot(r, awayFrom, minDist){
  for(let tries = 0; tries < 60; tries++){
    const x = FENCE + 6 + Math.random() * (WORLD_W - 2 * FENCE - 12);
    const y = FENCE + 6 + Math.random() * (WORLD_H - 2 * FENCE - 12);
    if(blockedAt(x, y, r + 1)) continue;
    if(awayFrom && Math.hypot(x - awayFrom.x, y - awayFrom.y) < minDist) continue;
    if(candies.some(c => Math.hypot(c.x - x, c.y - y) < 8)) continue;
    return { x, y };
  }
  return { x: WORLD_W / 2, y: FENCE + 8 };
}

function addCandy(){
  const p = freeSpot(CANDY_R, player, 12);
  const golden = Math.random() < 0.12;
  candies.push({ x: p.x, y: p.y, vx: 0, vy: 0, r: CANDY_R, golden, color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)], readyAt: 0, born: performance.now(), loose: false });
}

function spawnZombie(now){
  const far = SPAWNS
    .map(([x, y]) => ({ x, y, d: Math.hypot(x - player.x, y - player.y) }))
    .filter(p => !blockedAt(p.x, p.y, ZOMBIE_R) && !zombies.some(z => Math.hypot(z.x - p.x, z.y - p.y) < 10))
    .sort((a, b) => b.d - a.d);
  const pick = far[Math.floor(Math.random() * Math.min(3, far.length))] || { x: 12, y: 10 };
  zombies.push({
    x: pick.x, y: pick.y, vx: 0, vy: 0, r: ZOMBIE_R,
    speed: level.zSpeed * (0.85 + Math.random() * 0.3),
    born: now, stunUntil: 0, pauseUntil: 0, phase: Math.random() * 6,
    // Getting unstuck: progress is checked every second; no progress
    // means a sidestep for a moment.
    checkAt: now + 1000, lastX: pick.x, lastY: pick.y, sideUntil: 0, side: 1,
    tint: ['#86D06F', '#7CC7A0', '#9BCF63'][Math.floor(Math.random() * 3)]
  });
  burst(pick.x, pick.y + 1.5, level.night ? '#6B7390' : '#9A7048', 10, 0.8);
  sfxGroan();
}

/* =========================================================
   INPUT: keys, or hold on the board where Pip should go
========================================================= */
const keys = {};
let pointerTarget = null;
window.addEventListener('keydown', (e) => {
  if(!state.zombieRoundActive) return;
  const tag = e.target.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)){
    keys[k] = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { Object.keys(keys).forEach(k => keys[k] = false); pointerTarget = null; });

const canvasEl = zombieCanvasResizer.getCanvas();
function pointerToWorld(e){
  const rect = canvasEl.getBoundingClientRect();
  const canvas = zombieCanvasResizer.getCanvas();
  const { s, ox, oy } = viewOf(canvas);
  const px = (e.clientX - rect.left) * canvas.width / rect.width;
  const py = (e.clientY - rect.top) * canvas.height / rect.height;
  return { x: (px - ox) / s, y: (py - oy) / s };
}
canvasEl.addEventListener('pointerdown', (e) => {
  if(!state.zombieRoundActive) return;
  pointerTarget = pointerToWorld(e);
  try{ canvasEl.setPointerCapture(e.pointerId); }catch(_){ /* not every pointer can be captured */ }
});
canvasEl.addEventListener('pointermove', (e) => { if(pointerTarget) pointerTarget = pointerToWorld(e); });
['pointerup', 'pointercancel'].forEach(t => canvasEl.addEventListener(t, () => { pointerTarget = null; }));

function inputDir(){
  let dx = 0, dy = 0;
  if(keys.w || keys.arrowup) dy -= 1;
  if(keys.s || keys.arrowdown) dy += 1;
  if(keys.a || keys.arrowleft) dx -= 1;
  if(keys.d || keys.arrowright) dx += 1;
  if(pointerTarget){
    const tx = pointerTarget.x - player.x, ty = pointerTarget.y - player.y;
    const d = Math.hypot(tx, ty);
    if(d > 1.5){ dx += tx / d; dy += ty / d; }
  }
  const m = Math.hypot(dx, dy);
  return m ? { x: dx / m, y: dy / m } : { x: 0, y: 0 };
}

/* =========================================================
   PHYSICS
   Characters chase a target velocity: `grip` is how much of the gap
   is still left after a second, so a low number snaps to it (grass)
   and a high one slides towards it (ice). Frame-rate independent.
========================================================= */
function steer(o, tx, ty, grip, dt){
  const k = 1 - Math.pow(grip, dt);
  o.vx += (tx - o.vx) * k;
  o.vy += (ty - o.vy) * k;
}

function addScore(n, x, y, color, label){
  state.zombieScore = Math.max(0, state.zombieScore + n);
  document.getElementById('zombieScoreDisplay').textContent = String(state.zombieScore);
  const canvas = zombieCanvasResizer.getCanvas();
  const { s, ox, oy } = viewOf(canvas);
  spawnFloatText(floatTexts, ox + x * s, oy + (y - 4) * s, label || (n > 0 ? `+${n}` : `−${-n}`), color);
}

function burst(x, y, color, count, speed = 1){
  const canvas = zombieCanvasResizer.getCanvas();
  const { s, ox, oy } = viewOf(canvas);
  const n = particleCount(count);
  for(let i = 0; i < n; i++){
    const a = Math.random() * Math.PI * 2, v = (Math.random() * 3 + 1.2) * speed * s * 0.35;
    particles.push({ x: ox + x * s, y: oy + y * s, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      alpha: 1, decay: 0.025 + Math.random() * 0.02, size: (Math.random() * 0.6 + 0.5) * s, color });
  }
}

function stepPlayer(dt, now){
  const dir = inputDir();
  const top = (now < sneakersUntil ? SNEAKER_SPEED : PLAYER_SPEED) * inZoneSlow(player);
  steer(player, dir.x * top, dir.y * top, level.ice ? 0.3 : 0.0004, dt);
  player.x += player.vx * dt; player.y += player.vy * dt;
  collideWorld(player, 0);
  if(Math.abs(player.vx) > 2) player.face = Math.sign(player.vx);
  player.step += Math.hypot(player.vx, player.vy) * dt;
}

function stepZombies(dt, now){
  const scared = now < cureUntil;
  for(const z of zombies){
    if(now - z.born < RISE_MS){ z.vx = z.vy = 0; continue; }
    let tx = 0, ty = 0;
    if(now >= z.stunUntil && now >= z.pauseUntil){
      let dx = player.x - z.x, dy = player.y - z.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      if(scared){ dx = -dx; dy = -dy; }
      // A lazy weave from side to side, and a sidestep when stuck.
      const weave = Math.sin(now / 520 + z.phase) * 0.35 + (now < z.sideUntil ? z.side * 1.2 : 0);
      const sx = dx - dy * weave, sy = dy + dx * weave;
      const m = Math.hypot(sx, sy) || 1;
      const sp = z.speed * (scared ? 0.8 : 1) * inZoneSlow(z);
      tx = sx / m * sp; ty = sy / m * sp;
    }
    steer(z, tx, ty, level.ice ? 0.45 : 0.03, dt);
    z.x += z.vx * dt; z.y += z.vy * dt;
    collideWorld(z, 0.2);
    if(now >= z.checkAt){
      if(Math.hypot(z.x - z.lastX, z.y - z.lastY) < z.speed * 0.25 && now >= z.stunUntil){
        z.sideUntil = now + 800; z.side = Math.random() < 0.5 ? -1 : 1;
      }
      z.lastX = z.x; z.lastY = z.y; z.checkAt = now + 1000;
    }
  }
  // Zombies jostle: overlapping pairs push apart evenly.
  for(let i = 0; i < zombies.length; i++){
    for(let j = i + 1; j < zombies.length; j++){
      const a = zombies[i], b = zombies[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
      if(d > 0 && d < min){
        const push = (min - d) / 2, ux = dx / d, uy = dy / d;
        a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
      }
    }
  }
}

function stepKids(dt){
  // A cured kid skips off to the nearest fence and leaves.
  for(const k of kids){
    k.x += k.vx * dt; k.y += k.vy * dt;
    k.hop += dt * 14;
  }
  kids = kids.filter(k => k.x > -8 && k.x < WORLD_W + 8 && k.y > -8 && k.y < WORLD_H + 8);
}

function stepBalls(dt, now){
  const drag = Math.pow(level.ice ? 0.8 : 0.35, dt);
  for(const b of balls){
    b.vx *= drag; b.vy *= drag;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const speedBefore = Math.hypot(b.vx, b.vy);
    if(collideWorld(b, 0.8) && speedBefore > 18) beep(240, 0.04, 'sine', 0.05);
    b.spin += Math.hypot(b.vx, b.vy) * dt / b.r;
    // Pip kicks: the ball is pushed clear and given Pip's speed and more.
    const dx = b.x - player.x, dy = b.y - player.y, d = Math.hypot(dx, dy), min = b.r + player.r;
    if(d > 0 && d < min){
      const ux = dx / d, uy = dy / d;
      b.x = player.x + ux * min; b.y = player.y + uy * min;
      const along = Math.max(0, player.vx * ux + player.vy * uy);
      const kick = along * 1.9 + 12;
      const into = b.vx * ux + b.vy * uy;
      if(into < kick){
        b.vx += (kick - into) * ux; b.vy += (kick - into) * uy;
        if(kick > 30) sfxKick();
      }
    }
    // Ball meets zombie: a fast ball bonks it dizzy.
    for(const z of zombies){
      if(now - z.born < RISE_MS) continue;
      const zx = z.x - b.x, zy = z.y - b.y, zd = Math.hypot(zx, zy), zmin = z.r + b.r;
      if(zd === 0 || zd >= zmin) continue;
      const ux = zx / zd, uy = zy / zd;
      const rel = (b.vx - z.vx) * ux + (b.vy - z.vy) * uy;
      b.x -= ux * (zmin - zd) * 0.7; b.y -= uy * (zmin - zd) * 0.7;
      z.x += ux * (zmin - zd) * 0.3; z.y += uy * (zmin - zd) * 0.3;
      if(rel > 0){
        b.vx -= 1.6 * rel * ux; b.vy -= 1.6 * rel * uy;
        z.vx += rel * 0.8 * ux; z.vy += rel * 0.8 * uy;
      }
      if(rel > BONK_SPEED && now >= z.stunUntil){
        z.stunUntil = now + STUN_MS;
        addScore(2, z.x, z.y, '#FFD23F', '+2 BONK!');
        burst(z.x, z.y - z.r, '#FFE066', 14, 1.3);
        triggerShake(shake, 4);
        sfxBonk();
      }
    }
  }
  // Balls bounce off each other (equal mass).
  for(let i = 0; i < balls.length; i++){
    for(let j = i + 1; j < balls.length; j++){
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
      if(d === 0 || d >= min) continue;
      const ux = dx / d, uy = dy / d, push = (min - d) / 2;
      a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
      const rel = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
      if(rel > 0){ a.vx -= rel * ux; a.vy -= rel * uy; b.vx += rel * ux; b.vy += rel * uy; }
    }
  }
}

function stepCandies(dt, now){
  for(const c of candies){
    if(c.loose){
      // Knocked-out sweets skid to a stop.
      const f = Math.pow(level.ice ? 0.5 : 0.05, dt);
      c.vx *= f; c.vy *= f;
      c.x += c.vx * dt; c.y += c.vy * dt;
      collideWorld(c, 0.6);
    }
    if(now < c.readyAt) continue;
    if(Math.hypot(c.x - player.x, c.y - player.y) < c.r + player.r + 0.6){
      c.taken = true;
      if(c.golden){ addScore(3, c.x, c.y, '#FFD23F'); sfxGolden(); burst(c.x, c.y, '#FFE066', 16, 1.2); }
      else { addScore(1, c.x, c.y, c.color); sfxCandy(); burst(c.x, c.y, c.color, 7, 0.8); }
    }
  }
  const taken = candies.filter(c => c.taken && !c.loose).length;
  candies = candies.filter(c => !c.taken);
  // Every sweet from the field comes back somewhere new; knocked-out
  // ones don't (they were Pip's to begin with).
  for(let i = 0; i < taken; i++) addCandy();
}

// Caught: Pip is knocked back and two sweets fly out to be re-collected.
function catchPlayer(z, now){
  invulnUntil = now + INVULN_MS;
  z.pauseUntil = now + 700;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  player.vx = dx / d * 75; player.vy = dy / d * 75;
  z.vx = -dx / d * 30; z.vy = -dy / d * 30;
  const lose = Math.min(2, state.zombieScore);
  if(lose > 0) addScore(-lose, player.x, player.y, '#FF6B6B');
  for(let i = 0; i < lose; i++){
    const a = Math.atan2(dy, dx) + (i ? 0.9 : -0.9) + (Math.random() - 0.5) * 0.6;
    candies.push({ x: player.x, y: player.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, r: CANDY_R, golden: false,
      color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)], readyAt: now + 500, born: now, loose: true });
  }
  triggerShake(shake, 6);
  sfxCaught();
}

function checkZombieContact(now){
  const scared = now < cureUntil;
  for(const z of zombies){
    if(now - z.born < RISE_MS) continue;
    if(Math.hypot(z.x - player.x, z.y - player.y) >= z.r + player.r - 0.4) continue;
    if(scared){
      // Cured! The zombie becomes a happy kid who skips off home.
      z.cured = true;
      const ex = z.x < WORLD_W / 2 ? -1 : 1;
      kids.push({ x: z.x, y: z.y, vx: ex * 34, vy: (z.y < WORLD_H / 2 ? -1 : 1) * 10, hop: 0, r: z.r });
      addScore(3, z.x, z.y, '#FF8FD8', '+3 CURED!');
      burst(z.x, z.y, '#FF8FD8', 18, 1.3);
      sfxCure();
      respawns.push(now + 2500);
    } else if(now >= invulnUntil && now >= z.stunUntil){
      catchPlayer(z, now);
    }
  }
  zombies = zombies.filter(z => !z.cured);
}

function spawnPickup(now){
  const r = Math.random();
  const type = r < 0.4 ? 'potion' : r < 0.7 ? 'sneakers' : 'bubble';
  const p = freeSpot(PICKUP_R, player, 22);
  pickup = { type, x: p.x, y: p.y, born: now };
}

function stepPickup(now){
  if(!pickup){
    if(now >= nextPickupAt) spawnPickup(now);
    return;
  }
  if(now - pickup.born > 7000){ pickup = null; nextPickupAt = now + 2000; return; }
  if(Math.hypot(pickup.x - player.x, pickup.y - player.y) >= PICKUP_R + player.r) return;
  const { type, x, y } = pickup;
  pickup = null;
  nextPickupAt = now + 5500 + Math.random() * 2500;
  sfxPower();
  if(type === 'potion'){
    cureUntil = now + POWER_MS;
    addScore(0, x, y, '#FF8FD8', 'CURE POTION!');
    burst(x, y, '#FF8FD8', 18, 1.2);
  } else if(type === 'sneakers'){
    sneakersUntil = now + POWER_MS;
    addScore(0, x, y, '#5FC8FF', 'SUPER SNEAKERS!');
    burst(x, y, '#5FC8FF', 18, 1.2);
  } else {
    // Bubble Blast: everything near Pip is blown outward, zombies stunned.
    sfxBubble();
    triggerShake(shake, 5);
    addScore(0, x, y, '#9FE8FF', 'BUBBLE BLAST!');
    bubbleRing = { x: player.x, y: player.y, at: now };
    for(const z of zombies){
      const dx = z.x - player.x, dy = z.y - player.y, d = Math.hypot(dx, dy) || 1;
      if(d > 60) continue;
      const push = 110 * (1 - d / 70);
      z.vx = dx / d * push; z.vy = dy / d * push;
      z.stunUntil = now + 1500;
    }
    for(const b of balls){
      const dx = b.x - player.x, dy = b.y - player.y, d = Math.hypot(dx, dy) || 1;
      if(d < 50){ b.vx += dx / d * 70; b.vy += dy / d * 70; }
    }
  }
}
let bubbleRing = null;

/* =========================================================
   RENDERING
========================================================= */
let fieldLayer = null, fieldKey = '';

function getField(canvas){
  const key = `${canvas.width}x${canvas.height}:${LEVELS.indexOf(level)}`;
  if(fieldLayer && fieldKey === key) return fieldLayer;
  fieldLayer = fieldLayer || document.createElement('canvas');
  fieldLayer.width = canvas.width; fieldLayer.height = canvas.height;
  const ctx = fieldLayer.getContext('2d');
  const { s, ox, oy } = viewOf(canvas);
  // Beyond the field (letterbox): a darker shade of the ground.
  ctx.fillStyle = level.night ? '#232B3D' : shade(level.ground, -0.28);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(s, s);
  // Ground with mowing stripes (or ice sheen).
  ctx.fillStyle = level.ground;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = level.ground2;
  for(let x = 0; x < WORLD_W; x += 20) ctx.fillRect(x, 0, 10, WORLD_H);
  if(level.ice){
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.4;
    ctx.beginPath();
    for(let i = 0; i < 14; i++){
      const x = (i * 37) % WORLD_W, y = (i * 23) % WORLD_H;
      ctx.moveTo(x, y); ctx.lineTo(x + 9, y + 3); ctx.moveTo(x + 4, y + 6); ctx.lineTo(x + 12, y + 4);
    }
    ctx.stroke();
  } else {
    // Little flowers / tufts.
    let seed = 7 + LEVELS.indexOf(level);
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for(let i = 0; i < 46; i++){
      const x = rnd() * WORLD_W, y = rnd() * WORLD_H;
      ctx.fillStyle = level.night ? 'rgba(160,180,220,0.18)' : (i % 3 ? 'rgba(255,255,255,0.35)' : 'rgba(255,214,90,0.6)');
      ctx.beginPath(); ctx.arc(x, y, 0.55, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Slow ground: sand, mud, river, quicksand, snow drifts, ash.
  const ZONE_LOOK = {
    sand: ['#F3D98F', 'rgba(200,160,80,0.35)'], mud: ['#7A5634', 'rgba(40,24,10,0.3)'],
    river: ['#5AB8E8', 'rgba(255,255,255,0.55)'], quicksand: ['#C9A25E', 'rgba(120,80,30,0.45)'],
    snow: ['#FFFFFF', 'rgba(170,200,230,0.6)'], ash: ['#77665F', 'rgba(40,30,28,0.4)']
  };
  for(const z of level.zones){
    const [fill, dots] = ZONE_LOOK[z.t] || ZONE_LOOK.sand;
    ctx.fillStyle = fill;
    roundRect(ctx, z.x, z.y, z.w, z.h, z.t === 'river' ? 5 : 3); ctx.fill();
    ctx.fillStyle = dots;
    if(z.t === 'river' || z.t === 'quicksand'){
      // Ripples / swirls.
      ctx.strokeStyle = dots; ctx.lineWidth = 0.5;
      ctx.beginPath();
      for(let i = 0; i < 6; i++){
        const x = z.x + 4 + ((i * 9.7) % (z.w - 10)), y = z.y + 3 + ((i * 3.9) % (z.h - 6));
        if(z.t === 'river'){ ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - 1, x + 4, y); ctx.quadraticCurveTo(x + 6, y + 1, x + 8, y); }
        else { ctx.moveTo(x + 2, y); ctx.arc(x, y, 2, 0, Math.PI * 1.5); }
      }
      ctx.stroke();
    } else {
      for(let i = 0; i < 10; i++){
        ctx.beginPath(); ctx.arc(z.x + 3 + ((i * 7.3) % (z.w - 6)), z.y + 3 + ((i * 4.1) % (z.h - 6)), 0.7, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // The fence.
  ctx.fillStyle = level.night ? '#5B4A6E' : '#C98A4B';
  ctx.fillRect(0, 0, WORLD_W, FENCE); ctx.fillRect(0, WORLD_H - FENCE, WORLD_W, FENCE);
  ctx.fillRect(0, 0, FENCE, WORLD_H); ctx.fillRect(WORLD_W - FENCE, 0, FENCE, WORLD_H);
  ctx.fillStyle = level.night ? '#7A6690' : '#E2A866';
  for(let x = 2; x < WORLD_W; x += 6){ ctx.fillRect(x, 0.6, 2, FENCE - 1.2); ctx.fillRect(x, WORLD_H - FENCE + 0.6, 2, FENCE - 1.2); }
  for(let y = 2; y < WORLD_H; y += 6){ ctx.fillRect(0.6, y, FENCE - 1.2, 2); ctx.fillRect(WORLD_W - FENCE + 0.6, y, FENCE - 1.2, 2); }
  // Scenery.
  for(const ob of level.obstacles) drawObstacle(ctx, ob);
  // Holes the zombies climb out of.
  ctx.fillStyle = level.night ? 'rgba(10,12,24,0.45)' : 'rgba(90,60,30,0.35)';
  for(const [x, y] of SPAWNS){ ctx.beginPath(); ctx.ellipse(x, y + 1.5, 3.4, 1.6, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  fieldKey = key;
  return fieldLayer;
}

function drawObstacle(ctx, ob){
  // Every obstacle gets a soft shadow below-right.
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  if(ob.w){ roundRect(ctx, ob.x + 0.8, ob.y + 1.2, ob.w, ob.h, 1.6); ctx.fill(); }
  else { ctx.beginPath(); ctx.ellipse(ob.x + 0.6, ob.y + ob.r * 0.55, ob.r, ob.r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
  if(ob.t === 'bush'){
    ctx.fillStyle = '#4E9F3D';
    for(const [dx, dy, k] of [[-0.45, 0.1, 0.62], [0.45, 0.1, 0.62], [0, -0.3, 0.7], [0, 0.25, 0.7]]){
      ctx.beginPath(); ctx.arc(ob.x + dx * ob.r, ob.y + dy * ob.r, ob.r * k, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#E84A5F';
    for(const [dx, dy] of [[-0.4, -0.2], [0.35, 0.3], [0.1, -0.5]]){ ctx.beginPath(); ctx.arc(ob.x + dx * ob.r, ob.y + dy * ob.r, 0.7, 0, Math.PI * 2); ctx.fill(); }
  } else if(ob.t === 'rock'){
    ctx.fillStyle = '#A9AFB8'; ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#C9CED6'; ctx.beginPath(); ctx.arc(ob.x - ob.r * 0.3, ob.y - ob.r * 0.3, ob.r * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if(ob.t === 'pumpkin'){
    ctx.fillStyle = '#F08A24';
    for(const dx of [-0.45, 0.45, 0]){ ctx.beginPath(); ctx.ellipse(ob.x + dx * ob.r, ob.y, ob.r * 0.62, ob.r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5E8C2F'; ctx.fillRect(ob.x - 0.6, ob.y - ob.r - 1.2, 1.2, 2.2);
  } else if(ob.t === 'snowman'){
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(ob.x, ob.y + ob.r * 0.25, ob.r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ob.x, ob.y - ob.r * 0.85, ob.r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.moveTo(ob.x, ob.y - ob.r * 0.85); ctx.lineTo(ob.x + ob.r * 0.6, ob.y - ob.r * 0.75); ctx.lineTo(ob.x, ob.y - ob.r * 0.68); ctx.fill();
    ctx.fillStyle = '#26324A';
    ctx.beginPath(); ctx.arc(ob.x - ob.r * 0.22, ob.y - ob.r * 1.0, 0.45, 0, Math.PI * 2); ctx.arc(ob.x + ob.r * 0.22, ob.y - ob.r * 1.0, 0.45, 0, Math.PI * 2); ctx.fill();
  } else if(ob.t === 'tree'){
    ctx.fillStyle = '#4A3A5E'; ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5C4A73'; ctx.beginPath(); ctx.arc(ob.x - ob.r * 0.3, ob.y - ob.r * 0.3, ob.r * 0.5, 0, Math.PI * 2); ctx.fill();
  } else if(ob.t === 'hedge'){
    ctx.fillStyle = '#3F8F3A'; roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 2); ctx.fill();
    ctx.fillStyle = '#56AE4C'; roundRect(ctx, ob.x + 0.6, ob.y + 0.5, ob.w - 1.2, Math.min(ob.h, ob.w) * 0.45, 1.6); ctx.fill();
  } else if(ob.t === 'slide'){
    ctx.fillStyle = '#FF6B6B'; roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 2); ctx.fill();
    ctx.fillStyle = '#FFD23F'; ctx.fillRect(ob.x + 2, ob.y + 2, ob.w - 4, ob.h - 4);
    ctx.fillStyle = '#FF6B6B'; for(let y = ob.y + 4; y < ob.y + ob.h - 3; y += 4) ctx.fillRect(ob.x + 2, y, ob.w - 4, 1);
  } else if(ob.t === 'palm'){
    ctx.fillStyle = '#8A5A2E'; ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2E9E4A';
    for(let k = 0; k < 6; k++){
      const a = k * Math.PI / 3 + 0.3;
      ctx.beginPath(); ctx.ellipse(ob.x + Math.cos(a) * ob.r * 0.55, ob.y + Math.sin(a) * ob.r * 0.55, ob.r * 0.55, ob.r * 0.22, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#7A4E28'; ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if(ob.t === 'log'){
    ctx.fillStyle = '#8A5A2E'; roundRect(ctx, ob.x, ob.y, ob.w, ob.h, ob.h / 2); ctx.fill();
    ctx.fillStyle = '#C4925C'; ctx.beginPath(); ctx.ellipse(ob.x + ob.w - ob.h * 0.3, ob.y + ob.h / 2, ob.h * 0.28, ob.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6E4522'; ctx.fillRect(ob.x + 3, ob.y + ob.h * 0.35, ob.w * 0.6, 0.4);
  } else if(ob.t === 'cactus'){
    ctx.fillStyle = '#3F9B4A';
    ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ob.x - ob.r * 0.95, ob.y - ob.r * 0.2, ob.r * 0.45, 0, Math.PI * 2); ctx.arc(ob.x + ob.r * 0.95, ob.y + ob.r * 0.15, ob.r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF6FA8'; ctx.beginPath(); ctx.arc(ob.x, ob.y - ob.r * 0.75, ob.r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for(const [dx, dy] of [[-0.4, 0.1], [0.3, -0.3], [0.2, 0.45]]){ ctx.fillRect(ob.x + dx * ob.r, ob.y + dy * ob.r, 0.3, 0.3); }
  } else if(ob.t === 'pine'){
    ctx.fillStyle = '#2F6B45';
    for(const [k, rr] of [[0, 1], [1, 0.72], [2, 0.45]]){ ctx.beginPath(); ctx.arc(ob.x, ob.y - k * ob.r * 0.35, ob.r * rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#FFFFFF';
    for(const [dx, dy] of [[-0.5, -0.1], [0.45, 0.1], [0, -0.75], [0.1, 0.5]]){ ctx.beginPath(); ctx.arc(ob.x + dx * ob.r, ob.y + dy * ob.r, ob.r * 0.16, 0, Math.PI * 2); ctx.fill(); }
  } else if(ob.t === 'lava'){
    // A glowing lava pool (solid: nobody walks through lava).
    ctx.fillStyle = '#3A2420'; roundRect(ctx, ob.x - 1, ob.y - 1, ob.w + 2, ob.h + 2, 4); ctx.fill();
    ctx.fillStyle = '#FF5A1F'; roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 3.5); ctx.fill();
    ctx.fillStyle = '#FFB13B';
    for(let k = 0; k < 4; k++){ ctx.beginPath(); ctx.arc(ob.x + ob.w * (0.2 + k * 0.2), ob.y + ob.h * (0.35 + (k % 2) * 0.3), Math.min(ob.w, ob.h) * 0.12, 0, Math.PI * 2); ctx.fill(); }
  } else if(ob.t === 'grave'){
    ctx.fillStyle = '#8D93A6'; roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 3); ctx.fill();
    ctx.fillStyle = '#6C7287'; ctx.fillRect(ob.x + ob.w / 2 - 0.5, ob.y + 2, 1, 4.5); ctx.fillRect(ob.x + ob.w / 2 - 2, ob.y + 3.2, 4, 1);
  }
}

function roundRect(ctx, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// '#rrggbb' lightened (+) or darkened (-) by a fraction.
function shade(hex, f){
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(Math.max(0, Math.min(255, f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function drawCandy(ctx, c, now){
  const bob = c.loose ? 0 : Math.sin(now / 300 + c.x) * 0.35;
  const x = c.x, y = c.y + bob, r = c.r;
  if(c.golden){
    drawGlow(ctx, x, y, r * 3.2, '#FFD23F', 0.55, 1.6);
    ctx.fillStyle = '#FFD23F';
    ctx.beginPath();
    for(let k = 0; k < 10; k++){
      const rr = k % 2 ? r * 0.5 : r * 1.25, a = -Math.PI / 2 + k * Math.PI / 5 + now / 900;
      k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    return;
  }
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y); ctx.lineTo(x - r * 1.7, y - r * 0.7); ctx.lineTo(x - r * 1.7, y + r * 0.7); ctx.closePath();
  ctx.moveTo(x + r * 0.8, y); ctx.lineTo(x + r * 1.7, y - r * 0.7); ctx.lineTo(x + r * 1.7, y + r * 0.7); ctx.closePath();
  ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
}

function drawPickup(ctx, p, now){
  const left = 7000 - (now - p.born);
  if(left < 1800 && Math.floor(now / 130) % 2 === 0) return; // blinks before it vanishes
  const y = p.y + Math.sin(now / 250) * 0.6;
  const color = p.type === 'potion' ? '#FF8FD8' : p.type === 'sneakers' ? '#5FC8FF' : '#9FE8FF';
  drawGlow(ctx, p.x, y, PICKUP_R * 3, color, 0.6, 1.6);
  if(p.type === 'potion'){
    ctx.fillStyle = '#FFE6F6'; ctx.fillRect(p.x - 0.8, y - 3.2, 1.6, 1.6);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, y + 0.4, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(p.x - 0.9, y - 1.9, 1.8, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(p.x - 0.8, y - 0.2, 0.6, 0, Math.PI * 2); ctx.fill();
  } else if(p.type === 'sneakers'){
    ctx.fillStyle = color;
    roundRect(ctx, p.x - 2.6, y - 1.6, 3, 2.6, 0.8); ctx.fill();
    roundRect(ctx, p.x - 2.6, y - 0.2, 5.2, 1.6, 0.8); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(p.x - 2.6, y + 1, 5.2, 0.5);
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(p.x, y, 2.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(159,232,255,0.3)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(p.x - 0.8, y - 0.9, 0.6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBall(ctx, b){
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  // Coloured panels turn as it rolls.
  const cols = ['#FF5F6D', '#4DA3FF', '#FFD23F'];
  for(let k = 0; k < 3; k++){
    const a = b.spin + k * (Math.PI * 2 / 3);
    ctx.fillStyle = cols[k];
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r, a, a + 0.75); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.28, 0, Math.PI * 2); ctx.fill();
}

// A goofy zombie: arms out in front, wobbly walk, mismatched googly eyes
// that follow Pip. Blue and wide-eyed while the Cure Potion lasts;
// dizzy stars when bonked; rises out of its hole when new.
function drawZombie(ctx, z, now, scared){
  const rising = Math.min(1, (now - z.born) / RISE_MS);
  const stunned = now < z.stunUntil;
  const walk = stunned ? 0 : Math.sin(now / 140 + z.phase);
  // A new zombie grows up out of its hole (no clip: clips are costly).
  const r = z.r * (0.4 + 0.6 * rising);
  const x = z.x, y = z.y - Math.abs(walk) * 0.5;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.65 * rising;
  const body = scared ? '#8FB8FF' : z.tint;
  const dark = scared ? '#5E86D6' : '#4F8F45';
  const toward = Math.atan2(player.y - z.y, player.x - z.x);
  const armDir = scared ? toward + Math.PI : toward;
  // Arms (behind the body when reaching up, in front when reaching down).
  ctx.strokeStyle = dark; ctx.lineCap = 'round'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for(const side of [-1, 1]){
    const ax = x + Math.cos(armDir + side * 0.9) * r * 0.7, ay = y + Math.sin(armDir + side * 0.9) * r * 0.7;
    const reach = r * (1.5 + (scared ? 0 : 0.2 * walk * side));
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.cos(armDir + (scared ? side * 1.2 : 0)) * reach, ay + Math.sin(armDir + (scared ? side * 1.2 : 0)) * reach - (scared ? r * 0.8 : 0));
  }
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(x, y, r * (1 + walk * 0.04), r * (1 - walk * 0.04), walk * 0.08, 0, Math.PI * 2); ctx.fill();
  // Hair tuft and a patch.
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(x - 0.8, y - r * 0.92); ctx.lineTo(x + 0.2, y - r * 1.35); ctx.lineTo(x + 0.9, y - r * 0.9); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.45, r * 0.18, 0, Math.PI * 2); ctx.fill();
  // Googly eyes (one bigger), pupils looking at Pip.
  const lx = Math.cos(toward) * 0.45, ly = Math.sin(toward) * 0.45;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(x - r * 0.36, y - r * 0.2, r * 0.34, 0, Math.PI * 2); ctx.arc(x + r * 0.34, y - r * 0.26, r * 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1E2433';
  if(stunned){
    ctx.font = `bold ${r * 0.55}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('x', x - r * 0.36, y - r * 0.2); ctx.fillText('x', x + r * 0.34, y - r * 0.26);
  } else {
    ctx.beginPath(); ctx.arc(x - r * 0.36 + lx, y - r * 0.2 + ly, r * 0.15, 0, Math.PI * 2); ctx.arc(x + r * 0.34 + lx * 0.8, y - r * 0.26 + ly * 0.8, r * 0.11, 0, Math.PI * 2); ctx.fill();
  }
  // Mouth: a wobbly line, or an "o" when scared.
  ctx.strokeStyle = '#1E2433'; ctx.lineWidth = 0.4;
  ctx.beginPath();
  if(scared){ ctx.arc(x, y + r * 0.42, r * 0.17, 0, Math.PI * 2); }
  else { ctx.moveTo(x - r * 0.35, y + r * 0.4); ctx.quadraticCurveTo(x - r * 0.1, y + r * 0.28, x, y + r * 0.42); ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.55, x + r * 0.32, y + r * 0.38); }
  ctx.stroke();
  ctx.restore();
  if(stunned){
    ctx.fillStyle = '#FFE066';
    for(let k = 0; k < 3; k++){
      const a = now / 200 + k * (Math.PI * 2 / 3);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.9, y - r * 1.25 + Math.sin(a) * r * 0.3, 0.6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// A cured kid, arms up, hopping home.
function drawKid(ctx, k){
  const y = k.y - Math.abs(Math.sin(k.hop)) * 1.5;
  ctx.strokeStyle = '#E58FB8'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(k.x - k.r * 0.6, y - k.r * 0.2); ctx.lineTo(k.x - k.r * 1.1, y - k.r * 1.3);
  ctx.moveTo(k.x + k.r * 0.6, y - k.r * 0.2); ctx.lineTo(k.x + k.r * 1.1, y - k.r * 1.3); ctx.stroke();
  ctx.fillStyle = '#FFC4DE'; ctx.beginPath(); ctx.arc(k.x, y, k.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1E2433';
  ctx.beginPath(); ctx.arc(k.x - k.r * 0.32, y - k.r * 0.2, k.r * 0.12, 0, Math.PI * 2); ctx.arc(k.x + k.r * 0.32, y - k.r * 0.2, k.r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1E2433'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.arc(k.x, y + k.r * 0.1, k.r * 0.4, 0.2, Math.PI - 0.2); ctx.stroke();
}

// Pip: a round kid in a red cap. Squashes a little with each step and
// blinks while safe after being caught.
function drawPip(ctx, now){
  if(now < invulnUntil && Math.floor(now / 90) % 2 === 0) ctx.globalAlpha = 0.45;
  const sp = Math.hypot(player.vx, player.vy);
  const bounce = sp > 3 ? Math.abs(Math.sin(player.step * 0.45)) : 0;
  const r = player.r, x = player.x, y = player.y - bounce * 0.9;
  if(now < sneakersUntil){
    ctx.fillStyle = 'rgba(95,200,255,0.35)';
    ctx.beginPath(); ctx.arc(x - player.vx * 0.06, y - player.vy * 0.06, r * 0.9, 0, Math.PI * 2); ctx.fill();
  }
  // Feet.
  ctx.fillStyle = now < sneakersUntil ? '#5FC8FF' : '#3B3F5C';
  const fs = Math.sin(player.step * 0.45) * (sp > 3 ? 1 : 0);
  ctx.beginPath(); ctx.ellipse(x - r * 0.45, y + r * 0.92 + fs * 0.4, r * 0.32, r * 0.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.45, y + r * 0.92 - fs * 0.4, r * 0.32, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  // Body/head.
  ctx.fillStyle = '#FFD27A';
  ctx.beginPath(); ctx.ellipse(x, y, r * (1 + bounce * 0.05), r * (1 - bounce * 0.05), 0, 0, Math.PI * 2); ctx.fill();
  // Cap with a brim the way Pip faces.
  ctx.fillStyle = '#E8453C';
  ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.95, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + player.face * r * 0.75, y - r * 0.2, r * 0.6, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y - r * 0.85, r * 0.16, 0, Math.PI * 2); ctx.fill();
  // Face.
  ctx.fillStyle = '#1E2433';
  const ex = player.face * r * 0.12;
  ctx.beginPath(); ctx.arc(x - r * 0.32 + ex, y + r * 0.12, r * 0.13, 0, Math.PI * 2); ctx.arc(x + r * 0.32 + ex, y + r * 0.12, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,120,0.45)';
  ctx.beginPath(); ctx.arc(x - r * 0.6, y + r * 0.42, r * 0.17, 0, Math.PI * 2); ctx.arc(x + r * 0.6, y + r * 0.42, r * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1E2433'; ctx.lineWidth = 0.35;
  ctx.beginPath(); ctx.arc(x + ex, y + r * 0.38, r * 0.22, 0.25, Math.PI - 0.25); ctx.stroke();
  ctx.globalAlpha = 1;
}

function renderZombieCanvas(){
  const canvas = zombieCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0 || canvas.height === 0 || !player) return;
  const ctx = zombieCanvasResizer.getContext();
  const now = performance.now();
  const { s, ox, oy } = viewOf(canvas);
  const scared = now < cureUntil;

  // The field stays put; only what's on it shakes (a shaken opaque
  // blit would leave a black strip along one edge).
  ctx.drawImage(getField(canvas), 0, 0);
  ctx.save();
  applyShake(ctx, shake);

  ctx.save();
  ctx.translate(ox, oy); ctx.scale(s, s);
  // Shadows, all in one fill.
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  const shadow = (o, r) => { ctx.moveTo(o.x + r, o.y + r * 0.85); ctx.ellipse(o.x, o.y + r * 0.85, r, r * 0.38, 0, 0, Math.PI * 2); };
  shadow(player, player.r * 0.9);
  for(const z of zombies) shadow(z, z.r * 0.9);
  for(const b of balls) shadow(b, b.r * 0.9);
  ctx.fill();

  if(level.night) drawGlow(ctx, player.x, player.y, 26, '#FFE9A8', 0.35, 1.2);
  for(const c of candies) drawCandy(ctx, c, now);
  if(pickup) drawPickup(ctx, pickup, now);
  for(const b of balls) drawBall(ctx, b);
  for(const k of kids) drawKid(ctx, k);
  // Draw back to front so the lower one overlaps.
  const sorted = zombies.slice().sort((a, b) => a.y - b.y);
  let pipDrawn = false;
  for(const z of sorted){
    if(!pipDrawn && player.y < z.y){ drawPip(ctx, now); pipDrawn = true; }
    drawZombie(ctx, z, now, scared);
  }
  if(!pipDrawn) drawPip(ctx, now);

  if(bubbleRing){
    const t = (now - bubbleRing.at) / 600;
    if(t >= 1) bubbleRing = null;
    else {
      ctx.strokeStyle = `rgba(159,232,255,${1 - t})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(bubbleRing.x, bubbleRing.y, 6 + t * 60, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();

  // Particles and floating text are in canvas pixels.
  ctx.save();
  for(const p of particles){
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  drawFloatTexts(ctx, floatTexts, Math.max(16, s * 4.2));
  ctx.restore(); // the shake

  // The level's name, and the active power-up with its time left.
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = `800 ${Math.round(s * 3.6)}px Bricolage Grotesque, sans-serif`;
  const label = state.zombieRoundActive
    ? (scared ? `CURE POTION ${Math.ceil((cureUntil - now) / 1000)}` : now < sneakersUntil ? `SUPER SNEAKERS ${Math.ceil((sneakersUntil - now) / 1000)}` : '')
    : `Level ${LEVELS.indexOf(level) + 1}: ${level.name}`;
  if(label){
    const w = ctx.measureText(label).width + s * 6, h = s * 6;
    ctx.fillStyle = 'rgba(20,24,40,0.7)';
    roundRect(ctx, canvas.width / 2 - w / 2, oy + s * 4.5, w, h, h / 2); ctx.fill();
    ctx.fillStyle = scared ? '#FF8FD8' : now < sneakersUntil && state.zombieRoundActive ? '#5FC8FF' : '#FFFFFF';
    ctx.fillText(label, canvas.width / 2, oy + s * 5.6);
  }
  ctx.restore();
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startZombieRound(){
  cancelZombieRound();
  state.zombieRoundActive = true;
  state.zombieScore = 0;
  loadLevel(state.zombieLevel);
  shake = createShakeState();
  cureUntil = 0; sneakersUntil = 0; invulnUntil = 0; bubbleRing = null;
  pointerTarget = null;
  Object.keys(keys).forEach(k => keys[k] = false);

  document.getElementById('zombieScoreDisplay').textContent = '0';
  document.getElementById('zombieTimeDisplay').textContent = ROUND_SECONDS;
  setTimerFill(document.getElementById('zombieTimerFill'), 1);
  document.getElementById('zombiePlayArea').classList.remove('idle');
  document.getElementById('zombieHint').classList.remove('hidden');
  resizeZombieCanvas();

  const start = performance.now();
  roundStart = start;
  nextPickupAt = start + 3000 + Math.random() * 1500;
  // Zombies climb out one after another, not all at once.
  for(let k = 0; k < level.zombies; k++) respawns.push(start + 300 + k * 1100);
  let last = start;
  const updateTimerHud = createTimerHud(document.getElementById('zombieTimeDisplay'), document.getElementById('zombieTimerFill'), ROUND_SECONDS);

  function tick(now){
    const dtMs = Math.min(50, now - last);
    noteFrame();
    last = now;
    const remaining = Math.max(0, ROUND_SECONDS - (now - start) / 1000);
    updateTimerHud(remaining);
    const dt = dtMs / 1000;

    respawns = respawns.filter(t => { if(now >= t){ spawnZombie(now); return false; } return true; });
    stepPlayer(dt, now);
    stepZombies(dt, now);
    stepBalls(dt, now);
    stepCandies(dt, now);
    stepKids(dt);
    checkZombieContact(now);
    stepPickup(now);
    const k = frameFactor(dtMs);
    stepParticles(particles, k, { dragX: 0.93, dragY: 0.93 });
    floatTexts = updateFloatTexts(floatTexts, k);
    renderZombieCanvas();

    if(remaining <= 0){ finishZombieRound(); return; }
    state.zombieRoundRAF = requestAnimationFrame(tick);
  }
  state.zombieRoundRAF = requestAnimationFrame(tick);
}

export function cancelZombieRound(){
  if(state.zombieRoundRAF) cancelAnimationFrame(state.zombieRoundRAF);
  state.zombieRoundRAF = null;
  pointerTarget = null;
  Object.keys(keys).forEach(k => keys[k] = false);
  if(state.zombieRoundActive){
    state.zombieRoundActive = false;
    const playArea = document.getElementById('zombiePlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('zombieHint');
    if(hint) hint.classList.add('hidden');
    loadLevel(state.zombieLevel);
    renderZombieCanvas();
    const beginBtn = document.getElementById('zombieBeginTurnBtn');
    if(beginBtn) beginBtn.disabled = false;
  }
}

function finishZombieRound(){
  state.zombieRoundActive = false;
  state.zombieRoundRAF = null;
  pointerTarget = null;
  document.getElementById('zombiePlayArea').classList.add('idle');
  document.getElementById('zombieHint').classList.add('hidden');

  const team = state.zombieTeams[state.zombieCurrentTeam];
  team.total += state.zombieScore;
  state.zombieTurnsPlayed++;
  renderZombieScoreboard();

  showTurnResultModal('zombieNextTeamBtn', { teams: state.zombieTeams, currentTeamIndex: state.zombieCurrentTeam }).then(() => {
    if(state.zombieTurnsPlayed >= ZOMBIE_QUESTIONS.length){
      endZombieGame();
    } else {
      state.zombieCurrentTeam = (state.zombieCurrentTeam + 1) % state.zombieTeams.length;
      // A new lap of turns moves on a level (wrapping after the last).
      if(state.zombieTurnsPlayed % state.zombieTeams.length === 0){
        state.zombieLevel = (state.zombieLevel + 1) % LEVELS.length;
        syncLevelPicker();
      }
      loadLevel(state.zombieLevel);
      renderZombieCanvas();
      renderZombieScoreboard();
      renderZombieTurnBanner();
      document.getElementById('zombieBeginTurnBtn').disabled = false;
      document.getElementById('zombieTimeDisplay').textContent = '--';
      setTimerFill(document.getElementById('zombieTimerFill'), 1);
    }
  });
}

function endZombieGame(){
  const winnerText = finishTeamGame({ prefix: 'zombie', teams: state.zombieTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('zombieTurnBanner').innerHTML = `All done — ${winnerText}`;
}

// For the automated tests only.
export function debugZombieInternals(){
  return {
    level: LEVELS.indexOf(level), levels: LEVELS.length,
    zombies: zombies.length, candies: candies.length, balls: balls.length,
    player: player ? { x: player.x, y: player.y } : null, score: state.zombieScore
  };
}
// Puts Pip right on top of the nearest sweet (and away from zombies).
export function debugZombieGrabCandy(){
  const c = candies.find(k => !k.loose);
  if(c){ player.x = c.x; player.y = c.y; player.vx = player.vy = 0; }
  return !!c;
}
// Rolls the first ball into the first zombie, fast.
export function debugZombieBonk(){
  const z = zombies.find(k => performance.now() - k.born > RISE_MS), b = balls[0];
  if(!z || !b) return false;
  const dx = z.x - b.x, dy = z.y - b.y, d = Math.hypot(dx, dy) || 1;
  b.x = z.x - dx / d * (z.r + b.r + 0.5); b.y = z.y - dy / d * (z.r + b.r + 0.5);
  b.vx = dx / d * 90; b.vy = dy / d * 90;
  return true;
}

/* =========================================================
   TEAM MANAGEMENT
========================================================= */
wireTeamManagementButtons({
  prefix: 'zombie',
  getTeams: () => state.zombieTeams,
  renderScoreboard: renderZombieScoreboard,
  cancelRound: cancelZombieRound
});

document.getElementById('zombieBackBtn').addEventListener('click', () => goToStage(18));
// A "Next" button's click handler lives in the file for the stage it goes TO.
document.getElementById('jumpNextStageBtn').addEventListener('click', () => goToStage(19));
