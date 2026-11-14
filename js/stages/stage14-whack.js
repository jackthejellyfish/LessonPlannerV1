import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { WHACK_QUESTIONS } from '../content/stage14-whack.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';
import { createTimerHud, setTimerFill } from '../hud.js';

/* =========================================================
   STAGE 14 — WHACK-A-MONSTER

   Answer a question, then tap monsters as they pop out of holes for 15
   seconds. Built from DOM elements rather than canvas, deliberately:
   isolation testing during the v2 performance work showed this app's
   frame budget goes almost entirely on canvas FILL-RATE, and that the
   DOM layer — even with a dozen animated elements — costs close to
   nothing. A grid of twelve buttons is also the most reliable thing to
   hit with a finger on an interactive whiteboard, which is what this
   game is for.

   Everything that moves is a `transform`, which the compositor can
   handle without re-painting. No blurs, no box-shadow animations — the
   two things v2 found were worth avoiding.
========================================================= */
const WHACK_ROUND_SECONDS = 15;
const WHACK_HOLES = 12;              // 4 x 3
// Eased across the board after play-testing: a monster now stays up
// noticeably longer, bombs are rarer, and the end-of-round speed-up is
// gentler. On a whiteboard a child has to physically walk/reach to a
// hole, which the first tuning didn't allow for — it was built around
// how fast a mouse can move.
const WHACK_UP_MS = 1650;            // was 1150
const WHACK_UP_MS_FAST = 1250;       // the golden one still ducks sooner (was 820)
const WHACK_SPAWN_MIN_MS = 300;
const WHACK_SPAWN_MAX_MS = 560;
const WHACK_BOMB_CHANCE = 0.09;      // was 0.16
const WHACK_GOLDEN_CHANCE = 0.13;
// How much faster spawns get by the end of the round. 1 = no speed-up.
const WHACK_END_URGENCY = 0.25;      // was 0.45
const WHACK_VARIANTS = ['v1', 'v2', 'v3', 'v4'];

/* =========================================================
   AUDIO
========================================================= */
function sfxWhackHit(){
  // A cartoon bonk: a fast downward pitch bend with a soft thud under.
  beep(520, 0.07, 'triangle', 0.13);
  beep(190, 0.11, 'sine', 0.12, 0.03);
}
function sfxWhackPop(){ beep(760, 0.05, 'sine', 0.05); }
function sfxWhackGolden(){ sfxRisingChime([880, 1108, 1318, 1760], { duration: 0.1, volume: 0.14, stagger: 0.045 }); }
function sfxWhackBomb(){ sfxImpact(1.1); }

/* =========================================================
   SETUP / TEAMS
========================================================= */
let whackRowColors = [];

renderGameIntro('whackSetup', {
  prefix: 'whack',
  title: 'Whack-a-Monster',
  steps: [
    'One team answers a question.',
    'Tap the monsters as they pop out of the holes.',
    'Whack as many as you can in 15 seconds.'
  ],
  scoring: [
    { swatch: '<span class="whack-legend-swatch green"></span>', label: 'Monster', points: '+1' },
    { swatch: '<span class="whack-legend-swatch golden"></span>', label: 'Golden monster', points: '+3', tone: 'bonus' },
    { swatch: '<span class="whack-legend-swatch bomb"></span>', label: 'Bomb &mdash; do not tap!', points: '&minus;2', tone: 'bad' }
  ],
  tip: 'The golden monster is worth three, but it ducks back down sooner than the others &mdash; go for it the moment you see it.'
});

export function renderWhackTeamInputs(count){
  renderTeamSetupRows('whackTeamInputs', 'whackAddTeamBtn', count, whackRowColors, renderWhackTeamInputs);
}
renderWhackTeamInputs(2);
wireAddTeamButton('whackTeamInputs', 'whackAddTeamBtn', renderWhackTeamInputs);

document.getElementById('whackStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#whackTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.whackTeams = names.map((name, i) => ({ name, color: whackRowColors[i], total: 0 }));
  state.whackCurrentTeam = 0;
  state.whackTurnsPlayed = 0;
  state.whackQuestionOrder = shuffle(WHACK_QUESTIONS.map((_, i) => i));

  document.getElementById('whackSetup').classList.add('hidden');
  document.getElementById('whackGame').classList.remove('hidden');
  document.getElementById('whackGameOverBanner').classList.add('hidden');
  buildWhackGrid();
  renderWhackScoreboard();
  renderWhackTurnBanner();
});

function renderWhackScoreboard(){
  renderTeamScoreboard('whackTeamList', state.whackTeams, state.whackCurrentTeam);
}
function renderWhackTurnBanner(){
  document.getElementById('whackTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.whackTeams[state.whackCurrentTeam].name)}</strong>'s turn — question ${state.whackTurnsPlayed + 1} of ${WHACK_QUESTIONS.length}`;
}

/* =========================================================
   GRID
   Built once per game, not per round: the holes never change, so each
   round only toggles classes on existing nodes. Monster markup is
   inside the hole and clipped by it, so "popping up" is a transform
   from below the rim.
========================================================= */
let whackHoles = [];

function buildWhackGrid(){
  const grid = document.getElementById('whackGrid');
  grid.innerHTML = '';
  whackHoles = [];
  for(let i = 0; i < WHACK_HOLES; i++){
    const hole = document.createElement('div');
    hole.className = 'whack-hole';
    hole.innerHTML = `
      <div class="whack-hole-back"></div>
      <button class="whack-monster" type="button" aria-label="Whack the monster" tabindex="-1">
        <span class="whack-face">
          <span class="whack-eye left"></span>
          <span class="whack-eye right"></span>
          <span class="whack-mouth"></span>
        </span>
      </button>
      <div class="whack-hole-front"></div>
    `;
    const btn = hole.querySelector('.whack-monster');
    btn.addEventListener('click', () => whackHit(i));
    grid.appendChild(hole);
    whackHoles.push({ el: hole, btn, kind: null, downAt: 0, timeout: null });
  }
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askWhackQuestion(){
  const q = WHACK_QUESTIONS[state.whackQuestionOrder[state.whackTurnsPlayed]];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('whackBeginTurnBtn').addEventListener('click', async () => {
  document.getElementById('whackBeginTurnBtn').disabled = true;
  await askWhackQuestion();
  startWhackRound();
});

function clearWhackHole(hole){
  if(hole.timeout){ clearTimeout(hole.timeout); hole.timeout = null; }
  hole.kind = null;
  hole.el.classList.remove('up', 'bomb', 'golden', 'bonked', ...WHACK_VARIANTS);
}

function popWhackMonster(){
  const free = whackHoles.filter(h => !h.kind);
  if(free.length === 0) return;
  const hole = free[Math.floor(Math.random() * free.length)];
  const roll = Math.random();
  const kind = roll < WHACK_BOMB_CHANCE ? 'bomb'
    : roll < WHACK_BOMB_CHANCE + WHACK_GOLDEN_CHANCE ? 'golden'
    : 'monster';
  hole.kind = kind;
  hole.el.classList.remove('bonked', ...WHACK_VARIANTS);
  hole.el.classList.toggle('bomb', kind === 'bomb');
  hole.el.classList.toggle('golden', kind === 'golden');
  // A colour per pop, so the board doesn't look like twelve copies of
  // the same creature. Bombs and golden ones carry their own look.
  if(kind === 'monster'){
    hole.el.classList.add(WHACK_VARIANTS[Math.floor(Math.random() * WHACK_VARIANTS.length)]);
  }
  hole.el.classList.add('up');
  spawnWhackDirt(hole);
  sfxWhackPop();
  hole.timeout = setTimeout(() => clearWhackHole(hole), kind === 'golden' ? WHACK_UP_MS_FAST : WHACK_UP_MS);
}

function whackHit(index){
  if(!state.whackRoundActive) return;
  const hole = whackHoles[index];
  if(!hole.kind) return;   // already ducked, or never up

  const kind = hole.kind;
  let delta = 0;
  if(kind === 'bomb'){
    delta = -2;
    sfxWhackBomb();
    document.getElementById('whackPlayArea').classList.add('flash-bad');
    setTimeout(() => document.getElementById('whackPlayArea').classList.remove('flash-bad'), 220);
  } else if(kind === 'golden'){
    delta = 3;
    sfxWhackGolden();
  } else {
    delta = 1;
    sfxWhackHit();
  }

  state.whackScore = Math.max(0, state.whackScore + delta);
  document.getElementById('whackScoreDisplay').textContent = String(state.whackScore);
  showWhackPoints(hole, delta);
  if(kind !== 'bomb') spawnWhackBurst(hole, kind === 'golden');

  // 'bonked' plays the squash-and-drop; the hole is cleared immediately
  // so the same monster can't be tapped twice.
  clearWhackHole(hole);
  hole.el.classList.add('bonked');
  setTimeout(() => hole.el.classList.remove('bonked'), 260);
}

/* ---- Effect particles ----
   Plain spans with a direction in --dx/--dy, animated entirely by CSS
   (transform + opacity) and removed on a timer. Deliberately NOT
   canvas: this stage has no canvas at all, and the v2 performance work
   established that the DOM layer is effectively free here while canvas
   fill-rate is not. */
function addWhackParticle(hole, className, dx, dy, lifeMs){
  const el = document.createElement('span');
  el.className = className;
  el.style.setProperty('--dx', `${dx}px`);
  el.style.setProperty('--dy', `${dy}px`);
  hole.el.appendChild(el);
  setTimeout(() => el.remove(), lifeMs);
}

// Dirt kicked out of the hole as something climbs through it.
function spawnWhackDirt(hole){
  for(let i = 0; i < 5; i++){
    const dx = (Math.random() - 0.5) * 70;
    const dy = -(14 + Math.random() * 24);
    addWhackParticle(hole, 'whack-dirt', dx, dy, 480);
  }
}

// The hit: a ring plus a spray of stars. A golden monster throws more
// of them, so the big score reads as a bigger event.
function spawnWhackBurst(hole, golden){
  addWhackParticle(hole, 'whack-ring', 0, 0, 430);
  const count = golden ? 8 : 5;
  for(let i = 0; i < count; i++){
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    addWhackParticle(hole, 'whack-burst',
      Math.cos(ang) * (34 + Math.random() * 26),
      Math.sin(ang) * (34 + Math.random() * 26), 540);
  }
}

// A floating "+1" at the hole. DOM rather than canvas, matching the way
// Ball Pop does its own floating text.
function showWhackPoints(hole, delta){
  const tag = document.createElement('span');
  tag.className = 'whack-points' + (delta < 0 ? ' bad' : delta > 1 ? ' bonus' : '');
  tag.textContent = (delta > 0 ? '+' : '') + delta;
  hole.el.appendChild(tag);
  setTimeout(() => tag.remove(), 700);
}

/* =========================================================
   ROUND LIFECYCLE
========================================================= */
function startWhackRound(){
  cancelWhackRound();
  state.whackRoundActive = true;
  state.whackScore = 0;

  document.getElementById('whackScoreDisplay').textContent = '0';
  document.getElementById('whackTimeDisplay').textContent = String(WHACK_ROUND_SECONDS);
  setTimerFill(document.getElementById('whackTimerFill'), 1);
  document.getElementById('whackPlayArea').classList.remove('idle');
  document.getElementById('whackHint').classList.remove('hidden');
  whackHoles.forEach(clearWhackHole);

  const start = performance.now();
  let nextSpawnAt = 250;
  const timeDisplay = document.getElementById('whackTimeDisplay');
  const timerFill = document.getElementById('whackTimerFill');
  const updateTimerHud = createTimerHud(timeDisplay, timerFill, WHACK_ROUND_SECONDS);

  function tick(now){
    const elapsed = now - start;
    const remaining = Math.max(0, WHACK_ROUND_SECONDS - elapsed / 1000);
    updateTimerHud(remaining);

    if(elapsed >= nextSpawnAt){
      popWhackMonster();
      // Spawns still speed up toward the end, but far less sharply than
      // they did — the finish should feel busy, not punishing.
      const urgency = 1 - (remaining / WHACK_ROUND_SECONDS) * WHACK_END_URGENCY;
      nextSpawnAt = elapsed + (WHACK_SPAWN_MIN_MS + Math.random() * (WHACK_SPAWN_MAX_MS - WHACK_SPAWN_MIN_MS)) * urgency;
    }

    if(remaining <= 0){ finishWhackRound(); return; }
    state.whackRoundRAF = requestAnimationFrame(tick);
  }
  state.whackRoundRAF = requestAnimationFrame(tick);
}

export function cancelWhackRound(){
  if(state.whackRoundRAF) cancelAnimationFrame(state.whackRoundRAF);
  state.whackRoundRAF = null;
  whackHoles.forEach(clearWhackHole);
  if(state.whackRoundActive){
    state.whackRoundActive = false;
    const playArea = document.getElementById('whackPlayArea');
    if(playArea){ playArea.classList.add('idle'); playArea.classList.remove('flash-bad'); }
    const hint = document.getElementById('whackHint');
    if(hint) hint.classList.add('hidden');
    const begin = document.getElementById('whackBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

function finishWhackRound(){
  state.whackRoundActive = false;
  state.whackRoundRAF = null;
  whackHoles.forEach(clearWhackHole);
  document.getElementById('whackPlayArea').classList.add('idle');
  document.getElementById('whackHint').classList.add('hidden');

  state.whackTeams[state.whackCurrentTeam].total += state.whackScore;
  state.whackTurnsPlayed++;
  renderWhackScoreboard();

  showTurnResultModal('whackNextTeamBtn', { teams: state.whackTeams, currentTeamIndex: state.whackCurrentTeam }).then(() => {
    if(state.whackTurnsPlayed >= WHACK_QUESTIONS.length){ endWhackGame(); return; }
    state.whackCurrentTeam = (state.whackCurrentTeam + 1) % state.whackTeams.length;
    renderWhackScoreboard();
    renderWhackTurnBanner();
    document.getElementById('whackBeginTurnBtn').disabled = false;
    document.getElementById('whackTimeDisplay').textContent = '--';
    setTimerFill(document.getElementById('whackTimerFill'), 1);
  });
}

function endWhackGame(){
  const winnerText = finishTeamGame({ prefix: 'whack', teams: state.whackTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('whackTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT + NAVIGATION
========================================================= */
wireTeamManagementButtons({
  prefix: 'whack',
  getTeams: () => state.whackTeams,
  renderScoreboard: renderWhackScoreboard,
  cancelRound: cancelWhackRound
});

export function ensureWhackLayout(){ /* DOM grid — nothing to re-measure */ }

document.getElementById('whackBackBtn').addEventListener('click', () => goToStage(13));
document.getElementById('hoopNextStageBtn').addEventListener('click', () => goToStage(14));
// Whack-a-Monster is the last stage, so it has no Next button.
