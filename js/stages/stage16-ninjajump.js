import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
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
const GOLDEN_POINTS = 3;        // the golden shuriken: worth three stars
const GOLDEN_RADIUS = 0.5;
const GOLDEN_COLOR = '#FFC83D';
const SPEED_COLOR = '#4BE38A';
const SPEED_MS = 6000;          // how long the speed boost lasts
const SPEED_MULT = 1.5;         // run speed while boosted
// Fans. An updraft lifts harder than gravity pulls (even falling
// gravity, so it works without holding jump), up to a top speed, and
// fades out over its last 1.5 tiles so the ninja settles on the plank
// above instead of shooting past it. Side winds push, but a child
// running against one still gets through.
const FAN_LIFT = 150;
const FAN_MAX_UP = 11;
const FAN_FADE = 1.5;
const WIND_PUSH = 32;
const WIND_MAX_SPEED = RUN_SPEED * 1.5;
const FAN_TILES = 'F<>';
function isSolid(ch){ return ch === '#' || ch === 'F' || ch === '<' || ch === '>'; }

/* ---- Levels ----
   #  stone block (solid)
   =  wooden plank: jump up through it, land on top
   ^  spikes (back to the start)
   S  spring (always a full-height launch, held jump or not)
   F  fan blowing UP (a solid block): its updraft carries the ninja up
      to the first plank above it and drops them onto it
   <  >  fan on a wall blowing left / right along its row (a solid block)
   *  ninja star
   P  where the ninja starts
   Every row is exactly 36 characters (checked at load).

   `diff` is 'easy', 'medium' or 'hard' (the colour of the level's
   button on the teacher's level picker). The list runs easiest first.

   Pick-ups are NOT in the map: each level lists a few candidate spots
   ([x, y] tiles) and every round picks one at random, so a class can't
   just learn where they are (feedback 2026-11-20):
   - `golden`: the golden shuriken, worth 3 stars, always somewhere
     hard (high up, over spikes, in a gap). Every level has one.
     It isn't needed to clear the level.
   - `triple`: the triple-jump power-up (some levels).
   - `speed`: the speed boost (some levels).

   `movers` are moving platforms (one-way, like planks, and they carry
   the ninja): x/y is the left end and top at one end of the trip, w the
   width in tiles, dx/dy how far it travels, period the seconds for a
   full there-and-back, phase where in the trip it starts (0..1).

   Reach rules every level follows, from the measured jump heights
   (feet rise, holding jump): single 4.4 tiles, double 7.3, triple 10.2,
   spring 9.9; a running jump clears about 5.9 tiles across.
   - a plank at most 4 rows above where you stand is a single jump,
     and at most 6 rows is a double jump, with at most 3 tiles across;
   - anything harder has a moving platform or an updraft that goes
     there, and every moving platform ends its trip flush with the
     ledge it serves (same height, no gap) so a child can just walk
     off it;
   - 8 stars per level;
   - the easy levels need nothing harder than a double jump, and the
     fans in Lantern Bridge do the climbing for you.
   */
const LEVELS = [
  { name: 'Dojo Garden', diff: 'easy', sky: ['#2B1E4A', '#E8796B'], map: [
    '....................................',
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
  ],
  triple: [[25, 0], [2, 2], [34, 3]],
  golden: [[8, 1], [0, 4], [28, 1]] },

  { name: 'Bamboo Steps', diff: 'easy', sky: ['#173B2E', '#8FC97A'], moon: [0.18, 0.16], map: [
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '................====................',
    '....................................',
    '...........*..............*.........',
    '..........======........======......',
    '....................................',
    '....................................',
    '....======..........======..........',
    '....................................',
    '.P....*....*....*....*....*....*....',
    '####################################',
    '####################################'
  ],
  speed: [[8, 10], [22, 10], [13, 7], [34, 13]],
  golden: [[17, 0], [34, 3], [1, 6]] },

  { name: 'Lantern Bridge', diff: 'easy', sky: ['#1B2440', '#C77D5B'], map: [
    '....................................',
    '....................................',
    '...*....*...............*....*......',
    '..=========............=========....',
    '....................................',
    '....................................',
    '....................................',
    '..............*....*................',
    '.............========...............',
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '.P....*.....................*.......',
    '#########F######F#######F###########',
    '####################################'
  ],
  speed: [[12, 13], [31, 13], [17, 7]],
  golden: [[18, 0], [35, 7], [0, 7]] },

  { name: 'Jungle Vines', diff: 'easy', theme: 'jungle', sky: ['#123322', '#6FB36A'], moon: [0.86, 0.14], map: [
    '....................................',
    '................*...................',
    '..............=====.................',
    '....................................',
    '....*...........................*...',
    '...=====.....................=====..',
    '....................................',
    '...........*..............*.........',
    '..........=====.........=====.......',
    '....................................',
    '....................................',
    '.....=====..........=====...........',
    '....................................',
    '.P.......*....^^.......*.......*....',
    '####################################',
    '####################################'
  ],
  speed: [[12, 13], [27, 13]],
  golden: [[35, 1], [1, 2], [24, 1]] },

  { name: 'Spring Valley', diff: 'medium', sky: ['#14324A', '#5FB3A8'], moon: [0.52, 0.13], map: [
    '....................................',
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
  ],
  triple: [[18, 0], [2, 0], [33, 0]],
  speed: [[8, 13], [20, 13], [28, 13]],
  golden: [[4, 0], [30, 0]] },

  { name: 'Spike Temple', diff: 'medium', sky: ['#1E1430', '#B5543C'], map: [
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
    '..........===..........===..........',
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
  ],
  triple: [[19, 10], [8, 9], [29, 9]],
  golden: [[0, 2], [35, 2], [9, 12], [29, 12]] },

  { name: 'Rooftop Run', diff: 'medium', sky: ['#0E1630', '#3E4F8C'], map: [
    '....................................',
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
  ],
  triple: [[34, 0], [6, 12], [20, 12]],
  speed: [[3, 11], [17, 11], [31, 11]],
  golden: [[0, 0], [13, 13], [27, 13]] },

  { name: 'Desert Dunes', diff: 'medium', theme: 'desert', sky: ['#E9824A', '#FBD38D'], moon: [0.5, 0.16], map: [
    '....................................',
    '....................................',
    '...*..............................*.',
    '..===............................===',
    '....................................',
    '....................................',
    '.......*........................*...',
    '......===......................===..',
    '....................................',
    '....................................',
    '...........*................*.......',
    '..........###..............###......',
    '.........#####............#####.....',
    '.P...*..#######...^^^.*.#######.....',
    '####################################',
    '####################################'
  ],
  speed: [[3, 13], [16, 13]],
  golden: [[17, 6], [0, 0], [35, 0]] },

  { name: 'Snowy Summit', diff: 'medium', theme: 'snow', sky: ['#2C4A73', '#B9D7F0'], moon: [0.12, 0.14], map: [
    '....................................',
    '.................**.................',
    '................====................',
    '....................................',
    '....................................',
    '....*........................*......',
    '...====........======.......====....',
    '....................................',
    '....................................',
    '..........*..............*..........',
    '.........====...........====........',
    '....................................',
    '....................................',
    '.P....S.....^^^^...*.*.^^^^.....S...',
    '####################################',
    '####################################'
  ],
  triple: [[34, 10], [1, 10]],
  golden: [[0, 3], [35, 3], [17, 4]] },

  { name: 'Windy Peak', diff: 'hard', sky: ['#1A2238', '#7A8FB8'], moon: [0.5, 0.12], map: [
    '....................................',
    '....................................',
    '....................................',
    '..*.........*..........*.........*..',
    '.====.....=====......=====.....====.',
    '....................................',
    '....................................',
    '...................................<',
    '......*......................*......',
    '.....====...................====....',
    '....................................',
    '....................................',
    '....................................',
    '.P..............*..*................',
    '#####^^^^###F##########F###^^^^#####',
    '####################################'
  ],
  golden: [[7, 12], [28, 12], [17, 0]] },

  { name: 'Storm Tower', diff: 'hard', sky: ['#120E24', '#5B3F7A'], moon: [0.86, 0.14], map: [
    '....................................',
    '...............*..*.................',
    '..............======................',
    '....................................',
    '>...................................',
    '...*.........................*......',
    '..====......................====....',
    '....................................',
    '....................................',
    '.........*...............*..........',
    '........====............====........',
    '....................................',
    '.................*..................',
    '.P..........*.......................',
    '####F########^^^^^^^^^########F#####',
    '####################################'
  ], movers: [
    // A lift from the low left ledge up to the top ledge.
    { x: 12, y: 10, w: 2, dx: 0, dy: -8, period: 6, phase: 0 },
    // A ferry across the spike pit, level with the floor.
    { x: 13, y: 14, w: 2, dx: 7, dy: 0, period: 5, phase: 0.5 }
  ],
  triple: [[35, 0], [0, 1], [19, 11]],
  speed: [[10, 13], [26, 13]],
  golden: [[14, 12], [21, 12], [35, 3]] },

  { name: 'Volcano Crossing', diff: 'hard', theme: 'volcano', sky: ['#1A0A0A', '#7A2A14'], map: [
    '....................................',
    '.....*.......................*......',
    '....===.....................===.....',
    '....................................',
    '....................................',
    '.........*..............*...........',
    '........===............===..........',
    '....................................',
    '.....*........**..........*.........',
    '....................................',
    '....###....................###......',
    '....###....................###......',
    '....###....................###......',
    '.P..###^^^^^^^^^^^^^^^^^^^^###......',
    '####################################',
    '####################################'
  ], movers: [
    // A ferry over the lava, flush with both rock pillars at each end.
    { x: 7, y: 10, w: 2, dx: 18, dy: 0, period: 7, phase: 0 }
  ],
  triple: [[1, 12], [33, 12]],
  golden: [[17, 3], [0, 0], [35, 0]] }
];
LEVELS.forEach((lv, i) => {
  if(lv.map.length !== ROWS || lv.map.some(r => r.length !== COLS)){
    console.error(`Ninja Jump level ${i + 1} is not ${COLS}x${ROWS}`);
    return;
  }
  // Every pick-up spot must be open air in the map (not a star, block
  // or plank), or a pick-up could appear inside a wall.
  ['golden', 'triple', 'speed'].forEach(k => (lv[k] || []).forEach(([x, y]) => {
    if(!lv.map[y] || lv.map[y][x] !== '.') console.error(`Ninja Jump level ${i + 1}: ${k} spot ${x},${y} is not open air`);
  }));
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
    'Collect every ninja star before the time runs out to clear the level and finish your turn. The teacher picks the time and the level.'
  ],
  scoring: [
    { swatch: '<span class="jump-legend-swatch star"></span>', label: 'Ninja star', points: '+1' },
    { swatch: '<span class="jump-legend-swatch clear">&#10003;</span>', label: 'Clear the level', points: '+5', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch clock">+1</span>', label: 'Every second left when you clear it', points: '+1', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch golden"></span>', label: 'Golden shuriken (somewhere hard!)', points: '+3', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch triple">3</span>', label: 'Power-up &mdash; triple jump!', points: '', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch speed">&raquo;</span>', label: 'Speed boost &mdash; run faster!', points: '', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch fan"></span>', label: 'Fan &mdash; rides you up, or blows you sideways', points: '', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch spring"></span>', label: 'Spring &mdash; super jump!', points: '', tone: 'bonus' },
    { swatch: '<span class="jump-legend-swatch spikes"></span>', label: 'Spikes &mdash; back to the start', points: '&minus;1', tone: 'bad' }
  ],
  tip: 'Hold jump for a big leap, tap it for a small hop. Ride the moving platforms and the fans to reach the high ledges! The power-ups move every turn. On a touch board, use the arrow and JUMP buttons.'
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
  state.jumpLevel = 0;

  showGameScreen('jump');
  renderJumpScoreboard();
  renderJumpTurnBanner();
  syncTimePicker();
  syncLevelPicker();
  loadLevel(state.jumpLevel);
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

/* ---- The teacher's level picker (shown between turns) ----
   One button per level, coloured by difficulty. Each lap of turns moves
   on to the next level by itself; picking one here changes the level
   for the next turn, and the laps carry on from there. The easy levels
   are first, for a class still finding the controls. */
const levelPicker = document.getElementById('jumpLevels');
levelPicker.insertAdjacentHTML('beforeend', LEVELS.map((lv, i) =>
  `<button type="button" class="lvl-${lv.diff}" data-level="${i}" title="${lv.name} (${lv.diff})">${i + 1}</button>`).join(''));
function syncLevelPicker(){
  levelPicker.querySelectorAll('[data-level]').forEach(btn => {
    const on = Number(btn.dataset.level) === state.jumpLevel;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
levelPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-level]');
  if(!btn || state.jumpRoundActive) return;
  state.jumpLevel = Number(btn.dataset.level);
  syncLevelPicker();
  loadLevel(state.jumpLevel);
  renderJumpCanvas();
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
  return askTeamQuestion(q, JUMP_QUESTIONS, state.jumpTurnsPlayed);
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
let powerups = [];        // { x, y, got, phase, kind: 'triple' | 'speed' }
let golden = null;        // { x, y, got, phase } - the golden shuriken
let updrafts = [];        // { x, fanY, len } - one per upward fan tile
let winds = [];           // { y, x0, x1, dir } - one per side fan
let tripleJump = false;   // collected this round
let speedUntil = 0;       // the speed boost runs until this time
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
  updrafts = [];
  winds = [];
  tripleJump = false;
  speedUntil = 0;
  movers = (lv.movers || []).map(m => ({ ...m, x0: m.x, y0: m.y, prevY: m.y, ddx: 0 }));
  stepMovers(performance.now());
  movers.forEach(m => { m.prevY = m.y; m.ddx = 0; });
  for(let y = 0; y < ROWS; y++){
    for(let x = 0; x < COLS; x++){
      const ch = grid[y][x];
      if(ch === '*'){ stars.push({ x: x + 0.5, y: y + 0.5, got: false, phase: Math.random() * 6 }); grid[y][x] = '.'; }
      else if(ch === 'S'){ springs.push({ x, y, firedAt: -1e9 }); }
      else if(ch === 'P'){ spawn = { x: x + 0.5, y: y + 1 }; grid[y][x] = '.'; }
    }
  }
  // Fans, once the grid is final. An updraft rises from its fan to the
  // first plank above (and sets the ninja down on it), or stops short
  // of a stone block; a side wind blows along its row to the next wall.
  for(let y = 0; y < ROWS; y++){
    for(let x = 0; x < COLS; x++){
      const ch = grid[y][x];
      if(ch === 'F'){
        let len = y - 1;
        for(let r = y - 1; r >= 0; r--){
          if(grid[r][x] === '='){ len = y - r + 0.5; break; }
          if(isSolid(grid[r][x])){ len = y - r - 1.5; break; }
        }
        updrafts.push({ x, fanY: y, len: Math.max(1, len) });
      } else if(ch === '<' || ch === '>'){
        const dir = ch === '>' ? 1 : -1;
        let end = x + dir;
        while(end >= 0 && end < COLS && !isSolid(grid[y][end])) end += dir;
        winds.push({ y, dir, x0: Math.min(x, end) + 1, x1: Math.max(x, end) });
      }
    }
  }
  // The pick-ups go somewhere different every round (see LEVELS).
  const pick = (spots) => spots && spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
  const g = pick(lv.golden);
  golden = g ? { x: g[0] + 0.5, y: g[1] + 0.5, got: false, phase: Math.random() * 6 } : null;
  const t = pick(lv.triple);
  if(t) powerups.push({ x: t[0] + 0.5, y: t[1] + 0.45, got: false, phase: Math.random() * 6, kind: 'triple' });
  const sp = pick(lv.speed);
  if(sp) powerups.push({ x: sp[0] + 0.5, y: sp[1] + 0.45, got: false, phase: Math.random() * 6, kind: 'speed' });
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
  const hit = overlapsTile(ninja.x - PLAYER_W / 2, ninja.y - PLAYER_H, ninja.x + PLAYER_W / 2, ninja.y, isSolid);
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
      isSolid(ch) || (ch === '=' && prevFeet <= ty + 1e-3));
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
    const hit = overlapsTile(left, ninja.y - PLAYER_H, right, ninja.y, isSolid);
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

// Upward push from any updraft the ninja's middle is in: full strength
// low down, fading to nothing over the top FAN_FADE tiles of its column.
function updraftLift(){
  for(const u of updrafts){
    if(ninja.x < u.x - 0.15 || ninja.x > u.x + 1.15) continue;
    const d = u.fanY - ninja.y;             // feet height above the fan
    if(d < -0.01 || d > u.len) continue;
    return FAN_LIFT * Math.max(0, Math.min(1, (u.len - d) / FAN_FADE));
  }
  return 0;
}
// -1, 0 or 1: the side wind the ninja's body is in.
function windAt(){
  for(const w of winds){
    if(ninja.y - PLAYER_H >= w.y + 1 || ninja.y <= w.y - 0.1) continue;
    if(ninja.x < w.x0 || ninja.x > w.x1) continue;
    return w.dir;
  }
  return 0;
}

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
  const fast = now < speedUntil;
  const runSpeed = fast ? RUN_SPEED * SPEED_MULT : RUN_SPEED;

  // Run: accelerate toward the target speed, with friction when idle.
  const accel = (ninja.onGround ? RUN_ACCEL : AIR_ACCEL) * (fast ? 1.4 : 1);
  if(dir !== 0){
    ninja.vx += dir * accel * dtSec;
    ninja.vx = Math.max(-runSpeed, Math.min(runSpeed, ninja.vx));
    ninja.face = dir;
  } else {
    const f = (ninja.onGround ? GROUND_FRICTION : AIR_FRICTION) * dtSec;
    ninja.vx = Math.abs(ninja.vx) <= f ? 0 : ninja.vx - Math.sign(ninja.vx) * f;
  }
  // Side winds push the ninja along their row (after friction, so a
  // wind still nudges a ninja standing still). Not inside an updraft,
  // though: Windy Peak's wind crosses its fan columns, and blowing a
  // child out of the column half-way up felt like the fan was broken.
  const wind = updraftLift() > 0 ? 0 : windAt();
  if(wind){
    ninja.vx = Math.max(-WIND_MAX_SPEED, Math.min(WIND_MAX_SPEED, ninja.vx + wind * WIND_PUSH * dtSec));
  }
  if(fast && ninja.onGround && Math.abs(ninja.vx) > RUN_SPEED * 0.8 && Math.random() < 0.5){
    spawnJumpParticles(ninja.x - Math.sign(ninja.vx) * 0.3, ninja.y - 0.3, SPEED_COLOR, 1, 0.02);
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
  // An updraft pushes up against gravity, up to its top speed.
  const lift = ninja.vy > -FAN_MAX_UP ? updraftLift() : 0;
  const vyBefore = ninja.vy;
  ninja.vy = Math.min(MAX_FALL, ninja.vy + (g - lift) * dtSec);
  if(lift > 0 && ninja.vy < 0 && ninja.onGround){ ninja.onGround = false; ninja.platform = null; }

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

  if(golden && !golden.got){
    const cx = Math.max(left, Math.min(golden.x, right)), cy = Math.max(top, Math.min(golden.y, bottom));
    if(Math.hypot(cx - golden.x, cy - golden.y) < GOLDEN_RADIUS) collectGolden(now);
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
  const L = layout(jumpCanvasResizer.getCanvas());
  if(pu.kind === 'speed'){
    speedUntil = now + SPEED_MS;
    spawnJumpParticles(pu.x, pu.y, SPEED_COLOR, 18, 0.14);
    spawnFloatText(jumpFloatTexts, L.ox + pu.x * L.s, L.oy + (pu.y - 0.6) * L.s, 'SPEED BOOST!', SPEED_COLOR, -0.9);
    sfxRisingChime([660, 990, 1320]);
    jumpBannerText = 'SPEED BOOST!';
    jumpBannerUntil = now + 1100;
    return;
  }
  tripleJump = true;
  // If it's grabbed mid-air, the third jump is available straight away.
  spawnJumpParticles(pu.x, pu.y, POWERUP_COLOR, 18, 0.14);
  spawnFloatText(jumpFloatTexts, L.ox + pu.x * L.s, L.oy + (pu.y - 0.6) * L.s, 'TRIPLE JUMP!', POWERUP_COLOR, -0.9);
  sfxRisingChime([784, 988, 1175]);
  jumpBannerText = 'TRIPLE JUMP!';
  jumpBannerUntil = now + 1100;
}

// The golden shuriken: worth three stars, not needed for the clear.
function collectGolden(now){
  golden.got = true;
  addJumpScore(GOLDEN_POINTS);
  const L = layout(jumpCanvasResizer.getCanvas());
  spawnJumpParticles(golden.x, golden.y, GOLDEN_COLOR, 20, 0.15);
  spawnFloatText(jumpFloatTexts, L.ox + golden.x * L.s, L.oy + (golden.y - 0.6) * L.s, `GOLDEN! +${GOLDEN_POINTS}`, GOLDEN_COLOR, -0.9);
  sfxRisingChime([1046, 1318, 1568, 2093]);
  triggerShake(jumpShake, 3);
  jumpBannerText = 'GOLDEN SHURIKEN!';
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
    get golden(){ return golden; },
    get powerups(){ return powerups; },
    get updrafts(){ return updrafts; },
    get winds(){ return winds; },
    levelCount: LEVELS.length,
    levels: LEVELS,
    loadLevel,
    setTriple(on){ tripleJump = on; },
    setInput(next){ Object.assign(input, next); }
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

/* ---- Environment themes (2026-11-22) ----
   A level's `theme` sets its backdrop and what its blocks, planks and
   hazards look like. Only the look changes: '^' still means "back to
   the start", whether it's drawn as spikes, thorns, cactus, icicles
   or lava. Levels with no theme are the original dojo look. */
const THEMES = {
  dojo:    { ground: '#3B3648', block: '#4A4458', lip: '#6FBF73', plank: '#B07A4A', plankEdge: '#7E5230', hazard: 'spike' },
  jungle:  { ground: '#26331C', block: '#4D5B32', lip: '#7BD15A', plank: '#8A5A2E', plankEdge: '#5C3B1C', hazard: 'thorn' },
  desert:  { ground: '#9C6B3C', block: '#D9A55B', lip: '#F2CF8A', plank: '#A8743F', plankEdge: '#76502A', hazard: 'cactus' },
  snow:    { ground: '#53647F', block: '#7586A6', lip: '#F4FAFF', plank: '#BFE6FF', plankEdge: '#7FB8DB', hazard: 'icicle' },
  volcano: { ground: '#221414', block: '#3F2C2A', lip: '#6B4A3A', plank: '#5A4038', plankEdge: '#33231F', hazard: 'lava' }
};

// The far scenery for each theme, as flat silhouettes (cached with the
// rest of the scenery, so it costs nothing per frame).
function drawBackdrop(ctx, w, h, theme, lv){
  const [mx, my] = lv.moon || [0.82, 0.2];
  if(theme === 'desert'){
    // A big low sun, dunes and two pyramids.
    ctx.fillStyle = 'rgba(255, 236, 170, 0.95)';
    ctx.beginPath(); ctx.arc(w * mx, h * my, h * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160, 90, 40, 0.45)';
    for(const [px, base, size] of [[0.22, 0.66, 0.2], [0.36, 0.66, 0.13], [0.78, 0.68, 0.17]]){
      ctx.beginPath(); ctx.moveTo(w * px - h * size, h * base); ctx.lineTo(w * px, h * (base - size)); ctx.lineTo(w * px + h * size, h * base); ctx.fill();
    }
    ctx.fillStyle = 'rgba(200, 120, 60, 0.4)';
    ctx.beginPath(); ctx.moveTo(0, h);
    for(let i = 0; i <= 8; i++) ctx.quadraticCurveTo(w * (i - 0.5) / 8, h * (0.6 + (i % 2) * 0.06), w * i / 8, h * 0.66);
    ctx.lineTo(w, h); ctx.fill();
    return;
  }
  if(theme === 'volcano'){
    // No moon: a glowing volcano with a smoke plume.
    const vx = w * 0.5;
    const glow = ctx.createRadialGradient(vx, h * 0.34, 0, vx, h * 0.34, h * 0.35);
    glow.addColorStop(0, 'rgba(255, 140, 40, 0.55)'); glow.addColorStop(1, 'rgba(255, 80, 20, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(60, 50, 50, 0.45)';
    for(const [px, py, r] of [[0.5, 0.2, 0.06], [0.53, 0.13, 0.08], [0.49, 0.06, 0.09]]){ ctx.beginPath(); ctx.arc(w * px, h * py, h * r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(20, 8, 8, 0.75)';
    ctx.beginPath(); ctx.moveTo(vx - h * 0.62, h * 0.72); ctx.lineTo(vx - h * 0.08, h * 0.3); ctx.lineTo(vx + h * 0.08, h * 0.3); ctx.lineTo(vx + h * 0.62, h * 0.72); ctx.fill();
    ctx.fillStyle = 'rgba(255, 110, 30, 0.9)';
    ctx.beginPath(); ctx.moveTo(vx - h * 0.08, h * 0.3); ctx.lineTo(vx + h * 0.08, h * 0.3); ctx.lineTo(vx + h * 0.03, h * 0.42); ctx.lineTo(vx - h * 0.02, h * 0.5); ctx.lineTo(vx - h * 0.05, h * 0.38); ctx.fill();
    return;
  }
  // Moon (or a pale sun) for the others.
  ctx.fillStyle = 'rgba(255, 244, 214, 0.9)';
  ctx.beginPath(); ctx.arc(w * mx, h * my, h * 0.09, 0, Math.PI * 2); ctx.fill();
  if(theme === 'snow'){
    // Snowy peaks, and flakes hanging in the air.
    const peaks = [[0.05, 0.62, 0.24], [0.28, 0.6, 0.32], [0.52, 0.66, 0.22], [0.75, 0.58, 0.3], [0.97, 0.64, 0.22]];
    for(const [px, base, size] of peaks){
      const x = w * px, top = h * (base - size), half = h * size * 0.9;
      ctx.fillStyle = 'rgba(40, 60, 95, 0.55)';
      ctx.beginPath(); ctx.moveTo(x - half, h * base + h * 0.2); ctx.lineTo(x, top); ctx.lineTo(x + half, h * base + h * 0.2); ctx.fill();
      ctx.fillStyle = 'rgba(245, 250, 255, 0.85)';
      ctx.beginPath(); ctx.moveTo(x - half * 0.3, top + h * size * 0.3); ctx.lineTo(x, top); ctx.lineTo(x + half * 0.3, top + h * size * 0.3);
      ctx.lineTo(x + half * 0.1, top + h * size * 0.24); ctx.lineTo(x - half * 0.05, top + h * size * 0.32); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    let seed = 3;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for(let i = 0; i < 70; i++){ ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h * 0.8, h * (0.003 + rnd() * 0.004), 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  if(theme === 'jungle'){
    // Rolling treetops, and vines hanging from the top edge.
    ctx.fillStyle = 'rgba(10, 40, 20, 0.5)';
    ctx.beginPath(); ctx.moveTo(0, h);
    for(let i = 0; i <= 14; i++){ const x = w * i / 14; ctx.arc(x, h * (0.58 + (i % 3) * 0.04), h * 0.09, Math.PI, 0); }
    ctx.lineTo(w, h); ctx.fill();
    ctx.strokeStyle = 'rgba(30, 90, 40, 0.7)'; ctx.lineWidth = Math.max(2, h * 0.006);
    ctx.fillStyle = 'rgba(70, 150, 60, 0.8)';
    for(let i = 0; i < 9; i++){
      const x = w * (0.05 + i * 0.115), len = h * (0.12 + (i % 3) * 0.07);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + h * 0.03, len / 2, x, len); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, len, h * 0.018, h * 0.01, 0.5, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  // Dojo: far mountains and a pagoda.
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
}

// One hazard tile ('^'), drawn in its theme's style.
function drawHazard(ctx, X, Y, s, style){
  if(style === 'lava'){
    ctx.fillStyle = '#FF5A1F';
    ctx.fillRect(X, Y + s * 0.45, s + 0.5, s * 0.55);
    ctx.fillStyle = '#FFB13B';
    ctx.fillRect(X, Y + s * 0.45, s + 0.5, s * 0.12);
    ctx.beginPath(); ctx.arc(X + s * 0.35, Y + s * 0.62, s * 0.08, 0, Math.PI * 2); ctx.arc(X + s * 0.75, Y + s * 0.78, s * 0.06, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.fillStyle = style === 'thorn' ? '#3E7D2E' : style === 'cactus' ? '#3F9B4A' : style === 'icicle' ? '#CFEFFF' : '#C9D3DF';
  if(style === 'cactus'){
    ctx.fillRect(X + s * 0.38, Y + s * 0.25, s * 0.24, s * 0.75);
    ctx.fillRect(X + s * 0.15, Y + s * 0.45, s * 0.2, s * 0.12); ctx.fillRect(X + s * 0.15, Y + s * 0.32, s * 0.08, s * 0.2);
    ctx.fillRect(X + s * 0.65, Y + s * 0.55, s * 0.2, s * 0.12); ctx.fillRect(X + s * 0.77, Y + s * 0.4, s * 0.08, s * 0.22);
    return;
  }
  ctx.beginPath();
  for(let k = 0; k < 3; k++){
    const bx = X + (k / 3) * s;
    ctx.moveTo(bx, Y + s);
    ctx.lineTo(bx + s / 6, Y + s * (style === 'thorn' ? 0.3 : 0.42));
    ctx.lineTo(bx + s / 3, Y + s);
  }
  ctx.fill();
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

  const th = THEMES[lv.theme] || THEMES.dojo;
  drawBackdrop(ctx, w, h, lv.theme || 'dojo', lv);

  const { s, ox, oy } = layout(canvas);
  // The level keeps its 36x16 shape, so on a taller or wider play area
  // there's spare room around it. Below it is solid ground, beside it
  // stone walls, so the floor never looks like it's floating in the sky.
  ctx.fillStyle = th.ground;
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
        ctx.fillStyle = th.block;
        ctx.fillRect(X, Y, s + 0.5, s + 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(X, Y + s * 0.5, s + 0.5, 1);
        ctx.fillRect(X + ((y % 2) ? s * 0.5 : 0), Y, 1, s * 0.5);
        // A grassy lip on any block with open air above it.
        if(!isSolid(tileAt(x, y - 1))){
          ctx.fillStyle = th.lip;
          ctx.fillRect(X, Y, s + 0.5, s * 0.16);
        }
      } else if(FAN_TILES.includes(ch)){
        drawFanHousing(ctx, X, Y, s, ch);
      } else if(ch === '='){
        ctx.fillStyle = th.plank;
        ctx.fillRect(X, Y, s + 0.5, s * 0.26);
        ctx.fillStyle = th.plankEdge;
        ctx.fillRect(X, Y + s * 0.2, s + 0.5, s * 0.06);
      } else if(ch === '^'){
        drawHazard(ctx, X, Y, s, th.hazard);
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

// A fan's metal box: drawn once into the scenery. The spinning blades
// and the moving air are drawn each frame (drawFans).
function drawFanHousing(ctx, X, Y, s, ch){
  ctx.fillStyle = '#5B6375';
  ctx.fillRect(X, Y, s + 0.5, s + 0.5);
  ctx.fillStyle = '#2A2F3A';
  const pad = s * 0.12;
  ctx.fillRect(X + pad, Y + pad, s - pad * 2, s - pad * 2);
  // Grille bars on the side the air comes out of.
  ctx.fillStyle = '#9AA3B2';
  if(ch === 'F'){
    for(let i = 0; i < 3; i++) ctx.fillRect(X + s * (0.2 + i * 0.25), Y, s * 0.08, s * 0.18);
  } else {
    const gx = ch === '>' ? X + s * 0.82 : X;
    for(let i = 0; i < 3; i++) ctx.fillRect(gx, Y + s * (0.2 + i * 0.25), s * 0.18, s * 0.08);
  }
}

// Spinning blades in each fan, and streaks of air moving through each
// updraft and wind. A handful of plain rectangles: cheap on a weak PC.
function drawFans(ctx, L, now){
  if(!updrafts.length && !winds.length) return;
  const { s, ox, oy } = L;
  const spin = now / 70;
  ctx.fillStyle = '#C9D3DF';
  const blades = (cx, cy) => {
    const a = Math.cos(spin), b = Math.sin(spin), r = s * 0.32, t = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx + a * r - b * t, cy + b * r + a * t);
    ctx.lineTo(cx + a * r + b * t, cy + b * r - a * t);
    ctx.lineTo(cx - a * r + b * t, cy - b * r - a * t);
    ctx.lineTo(cx - a * r - b * t, cy - b * r + a * t);
    ctx.closePath();
    ctx.moveTo(cx - b * r - a * t, cy + a * r - b * t);
    ctx.lineTo(cx - b * r + a * t, cy + a * r + b * t);
    ctx.lineTo(cx + b * r + a * t, cy - a * r + b * t);
    ctx.lineTo(cx + b * r - a * t, cy - a * r - b * t);
    ctx.closePath();
    ctx.fill();
  };
  for(const u of updrafts) blades(ox + (u.x + 0.5) * s, oy + (u.fanY + 0.5) * s);
  for(const w of winds) blades(ox + (w.dir > 0 ? w.x0 - 0.5 : w.x1 + 0.5) * s, oy + (w.y + 0.5) * s);

  ctx.fillStyle = 'rgba(220,240,255,0.32)';
  for(const u of updrafts){
    for(let i = 0; i < 4; i++){
      const t = ((now / 650 + i / 4 + u.x * 0.37) % 1);
      const y = oy + (u.fanY - t * u.len) * s;
      const x = ox + (u.x + 0.2 + ((i * 0.29) % 0.6)) * s;
      ctx.fillRect(x, y - s * 0.5, Math.max(1.5, s * 0.06), s * 0.5);
    }
  }
  for(const w of winds){
    const span = w.x1 - w.x0;
    for(let i = 0; i < 6; i++){
      const t = ((now / 900 + i / 6 + w.y * 0.31) % 1);
      const x = ox + (w.dir > 0 ? w.x0 + t * span : w.x1 - t * span) * s;
      const y = oy + (w.y + 0.2 + ((i * 0.23) % 0.6)) * s;
      ctx.fillRect(x - s * 0.4, y, s * 0.8, Math.max(1.5, s * 0.06));
    }
  }
}

function drawStar(ctx, x, y, r, angle, fill = '#DDE5F0', hub = '#5A6478'){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.beginPath();
  for(let i = 0; i < 8; i++){
    const rad = i % 2 === 0 ? r : r * 0.32;
    const a = (Math.PI / 4) * i;
    if(i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hub;
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
  const color = pu.kind === 'speed' ? SPEED_COLOR : POWERUP_COLOR;
  drawGlow(ctx, x, y, s * 1.1, color, 0.55 + 0.2 * Math.sin(now / 180), 1.4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if(pu.kind === 'speed'){
    // Two chevrons pointing forward: "fast".
    for(let i = 0; i < 2; i++){
      const cx = x + r * (-0.22 + i * 0.36);
      ctx.moveTo(cx - r * 0.16, y - r * 0.4);
      ctx.lineTo(cx + r * 0.2, y);
      ctx.lineTo(cx - r * 0.16, y + r * 0.4);
    }
    ctx.stroke();
    return;
  }
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
  // The speed boost: a green aura that flickers in its last second.
  const boostLeft = speedUntil - now;
  if(boostLeft > 0 && (boostLeft > 1000 || Math.floor(now / 120) % 2 === 0)){
    drawGlow(ctx, x, feet - h * 0.5, h * 1.2, SPEED_COLOR, 0.5, 1.6);
  }
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
  drawFans(ctx, L, now);
  for(const m of movers) drawMover(ctx, L, m);
  for(const pu of powerups) if(!pu.got) drawPowerup(ctx, L, pu, now);

  for(const st of stars){
    if(st.got) continue;
    const bob = Math.sin(now / 300 + st.phase) * s * 0.08;
    drawGlow(ctx, ox + st.x * s, oy + st.y * s + bob, s * 0.7, '#BFD7FF', 0.35, 1.6);
    drawStar(ctx, ox + st.x * s, oy + st.y * s + bob, s * 0.36, now / 260 + st.phase);
  }
  if(golden && !golden.got){
    const bob = Math.sin(now / 300 + golden.phase) * s * 0.08;
    const gx = ox + golden.x * s, gy = oy + golden.y * s + bob;
    drawGlow(ctx, gx, gy, s * 1.1, GOLDEN_COLOR, 0.5 + 0.15 * Math.sin(now / 200), 1.5);
    drawStar(ctx, gx, gy, s * 0.48, now / 200 + golden.phase, GOLDEN_COLOR, '#8A5A00');
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
  // each lap moves on to the next level (see finishJumpRound) unless the
  // teacher picks another. The pick-ups move every round.
  loadLevel(state.jumpLevel);

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
      // A new lap of turns: on to the next level.
      if(state.jumpCurrentTeam === 0){
        state.jumpLevel = (state.jumpLevel + 1) % LEVELS.length;
        syncLevelPicker();
      }
      loadLevel(state.jumpLevel);
      renderJumpCanvas();
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

document.getElementById('jumpBackBtn').addEventListener('click', () => goToStage(19));
// A "Next" button's handler lives in the file for the stage it goes TO.
document.getElementById('mazeNextStageBtn').addEventListener('click', () => goToStage(20));
