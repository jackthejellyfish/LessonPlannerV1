import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { beep, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { MEMORY_QUESTIONS } from '../content/stage16-memory.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';

/* =========================================================
   STAGE 16 — MEMORY MATCH

   Answer a question, then find as many matching pairs as you can in 25
   seconds. Six pairs, twelve cards.

   This is the only game in the set that rewards ATTENTION rather than
   speed or aim — a child who watches carefully while someone else
   plays does well here, which is exactly the opposite of every reflex
   game. Worth reaching for with a class that has gone over-excited.

   Cards are plain buttons with a CSS 3D flip; the symbols are drawn in
   CSS rather than canvas so they stay crisp at any board size.
========================================================= */
const MEMORY_ROUND_SECONDS = 25;
const MEMORY_PAIRS = 6;
const MEMORY_POINTS_PER_PAIR = 2;
// Clearing the whole board inside the time limit is meant to feel like
// a real achievement, so it is worth more than two extra pairs.
const MEMORY_CLEAR_BONUS = 6;
// How long a non-matching pair stays face-up. Long enough for the class
// to actually read both cards and remember them — the entire game is
// that memory, so rushing this would break it.
const MEMORY_PEEK_MS = 900;

// Six clearly different symbols. Shape first, colour second: a class at
// the back of the room should be able to pair them even if the display
// washes the colours out.
const MEMORY_SYMBOLS = [
  { glyph: '★', color: '#FFD23F', name: 'star' },
  { glyph: '●', color: '#4CC9F0', name: 'circle' },
  { glyph: '▲', color: '#8AE05C', name: 'triangle' },
  { glyph: '■', color: '#FF7AB8', name: 'square' },
  { glyph: '♥', color: '#FF5C5C', name: 'heart' },
  { glyph: '✦', color: '#B98CFF', name: 'sparkle' }
];

/* =========================================================
   AUDIO
========================================================= */
function sfxMemoryFlip(){ beep(620, 0.05, 'sine', 0.06); }
function sfxMemoryMatch(){ sfxRisingChime([784, 988, 1175], { duration: 0.12, volume: 0.14, stagger: 0.05 }); }
function sfxMemoryMiss(){ beep(300, 0.1, 'triangle', 0.07); beep(220, 0.13, 'triangle', 0.06, 0.07); }
function sfxMemoryClear(){ sfxRisingChime([523, 659, 784, 1047, 1319], { duration: 0.15, volume: 0.15, stagger: 0.07 }); }

/* =========================================================
   SETUP / TEAMS
========================================================= */
let memoryRowColors = [];

renderGameIntro('memorySetup', {
  prefix: 'memory',
  title: 'Memory Match',
  steps: [
    'One team answers a question.',
    'Tap two cards to turn them over.',
    'Match the pairs before time runs out.'
  ],
  scoring: [
    { swatch: '<span class="memory-legend-swatch pair"></span>', label: 'Matching pair', points: '+2' },
    { swatch: '<span class="memory-legend-swatch clear"></span>', label: 'Clear the whole board', points: '+6', tone: 'bonus' }
  ],
  tip: 'Watch the other team closely &mdash; the cards you see them turn over are the ones you will want to remember on your turn.'
});

export function renderMemoryTeamInputs(count){
  renderTeamSetupRows('memoryTeamInputs', 'memoryAddTeamBtn', count, memoryRowColors, renderMemoryTeamInputs);
}
renderMemoryTeamInputs(2);
wireAddTeamButton('memoryTeamInputs', 'memoryAddTeamBtn', renderMemoryTeamInputs);

document.getElementById('memoryStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#memoryTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.memoryTeams = names.map((name, i) => ({ name, color: memoryRowColors[i], total: 0 }));
  state.memoryCurrentTeam = 0;
  state.memoryTurnsPlayed = 0;
  state.memoryQuestionOrder = shuffle(MEMORY_QUESTIONS.map((_, i) => i));

  document.getElementById('memorySetup').classList.add('hidden');
  document.getElementById('memoryGame').classList.remove('hidden');
  document.getElementById('memoryGameOverBanner').classList.add('hidden');
  buildMemoryGrid();
  renderMemoryScoreboard();
  renderMemoryTurnBanner();
});

function renderMemoryScoreboard(){
  renderTeamScoreboard('memoryTeamList', state.memoryTeams, state.memoryCurrentTeam);
}
function renderMemoryTurnBanner(){
  document.getElementById('memoryTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.memoryTeams[state.memoryCurrentTeam].name)}</strong>'s turn — question ${state.memoryTurnsPlayed + 1} of ${MEMORY_QUESTIONS.length}`;
}

/* =========================================================
   BOARD
========================================================= */
let memoryCards = [];
let memoryFirstPick = null;
let memoryBusy = false;     // true during the peek window, so a third tap can't land

function buildMemoryGrid(){
  const grid = document.getElementById('memoryGrid');
  grid.innerHTML = '';
  memoryCards = [];
  for(let i = 0; i < MEMORY_PAIRS * 2; i++){
    const card = document.createElement('button');
    card.className = 'memory-card';
    card.type = 'button';
    card.innerHTML = `
      <span class="memory-card-inner">
        <span class="memory-face memory-back">?</span>
        <span class="memory-face memory-front"></span>
      </span>
    `;
    card.addEventListener('click', () => flipMemoryCard(i));
    grid.appendChild(card);
    memoryCards.push({ el: card, symbol: null, matched: false, faceUp: false });
  }
  dealMemoryBoard();
}

function dealMemoryBoard(){
  const deck = shuffle([...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]);
  memoryCards.forEach((c, i) => {
    c.symbol = deck[i];
    c.matched = false;
    c.faceUp = false;
    c.el.className = 'memory-card';
    c.el.disabled = false;
    c.el.setAttribute('aria-label', 'Hidden card');
    const front = c.el.querySelector('.memory-front');
    front.textContent = c.symbol.glyph;
    front.style.color = c.symbol.color;
  });
  memoryFirstPick = null;
  memoryBusy = false;
}

function flipMemoryCard(index){
  if(!state.memoryRoundActive || memoryBusy) return;
  const card = memoryCards[index];
  if(card.matched || card.faceUp) return;

  card.faceUp = true;
  card.el.classList.add('flipped');
  card.el.setAttribute('aria-label', card.symbol.name);
  sfxMemoryFlip();

  if(!memoryFirstPick){ memoryFirstPick = card; return; }

  const first = memoryFirstPick;
  memoryFirstPick = null;

  if(first.symbol.glyph === card.symbol.glyph){
    first.matched = card.matched = true;
    first.el.classList.add('matched');
    card.el.classList.add('matched');
    first.el.disabled = card.el.disabled = true;
    state.memoryScore += MEMORY_POINTS_PER_PAIR;
    state.memoryPairsFound++;
    document.getElementById('memoryScoreDisplay').textContent = `${state.memoryPairsFound}/${MEMORY_PAIRS}`;
    sfxMemoryMatch();

    if(state.memoryPairsFound >= MEMORY_PAIRS){
      state.memoryScore += MEMORY_CLEAR_BONUS;
      sfxMemoryClear();
      // Stop the clock early — the board is clear, there is nothing
      // left to do with the remaining seconds.
      setTimeout(() => { if(state.memoryRoundActive) finishMemoryRound(); }, 700);
    }
    return;
  }

  // No match: hold both face-up long enough to be remembered, then
  // turn them back. memoryBusy blocks further taps during the peek so
  // a fast tapper can't flip a third card into the comparison.
  memoryBusy = true;
  sfxMemoryMiss();
  setTimeout(() => {
    first.faceUp = card.faceUp = false;
    first.el.classList.remove('flipped');
    card.el.classList.remove('flipped');
    first.el.setAttribute('aria-label', 'Hidden card');
    card.el.setAttribute('aria-label', 'Hidden card');
    memoryBusy = false;
  }, MEMORY_PEEK_MS);
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askMemoryQuestion(){
  const q = MEMORY_QUESTIONS[state.memoryQuestionOrder[state.memoryTurnsPlayed]];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('memoryBeginTurnBtn').addEventListener('click', async () => {
  document.getElementById('memoryBeginTurnBtn').disabled = true;
  await askMemoryQuestion();
  startMemoryRound();
});

function startMemoryRound(){
  cancelMemoryRound();
  state.memoryRoundActive = true;
  state.memoryScore = 0;
  state.memoryPairsFound = 0;
  dealMemoryBoard();

  document.getElementById('memoryScoreDisplay').textContent = `0/${MEMORY_PAIRS}`;
  document.getElementById('memoryTimeDisplay').textContent = String(MEMORY_ROUND_SECONDS);
  document.getElementById('memoryTimerFill').style.width = '100%';
  document.getElementById('memoryPlayArea').classList.remove('idle');
  document.getElementById('memoryHint').classList.remove('hidden');

  const start = performance.now();
  const timeDisplay = document.getElementById('memoryTimeDisplay');
  const timerFill = document.getElementById('memoryTimerFill');
  function tick(now){
    const remaining = Math.max(0, MEMORY_ROUND_SECONDS - (now - start) / 1000);
    timeDisplay.textContent = String(Math.ceil(remaining));
    timerFill.style.width = (remaining / MEMORY_ROUND_SECONDS * 100) + '%';
    if(remaining <= 0){ finishMemoryRound(); return; }
    state.memoryRoundRAF = requestAnimationFrame(tick);
  }
  state.memoryRoundRAF = requestAnimationFrame(tick);
}

export function cancelMemoryRound(){
  if(state.memoryRoundRAF) cancelAnimationFrame(state.memoryRoundRAF);
  state.memoryRoundRAF = null;
  memoryFirstPick = null;
  memoryBusy = false;
  if(state.memoryRoundActive){
    state.memoryRoundActive = false;
    const area = document.getElementById('memoryPlayArea');
    if(area) area.classList.add('idle');
    const hint = document.getElementById('memoryHint');
    if(hint) hint.classList.add('hidden');
    const begin = document.getElementById('memoryBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

function finishMemoryRound(){
  state.memoryRoundActive = false;
  if(state.memoryRoundRAF) cancelAnimationFrame(state.memoryRoundRAF);
  state.memoryRoundRAF = null;
  document.getElementById('memoryPlayArea').classList.add('idle');
  document.getElementById('memoryHint').classList.add('hidden');

  state.memoryTeams[state.memoryCurrentTeam].total += state.memoryScore;
  state.memoryTurnsPlayed++;
  renderMemoryScoreboard();

  showTurnResultModal('memoryNextTeamBtn', { teams: state.memoryTeams, currentTeamIndex: state.memoryCurrentTeam }).then(() => {
    if(state.memoryTurnsPlayed >= MEMORY_QUESTIONS.length){ endMemoryGame(); return; }
    state.memoryCurrentTeam = (state.memoryCurrentTeam + 1) % state.memoryTeams.length;
    renderMemoryScoreboard();
    renderMemoryTurnBanner();
    document.getElementById('memoryBeginTurnBtn').disabled = false;
    document.getElementById('memoryTimeDisplay').textContent = '--';
    document.getElementById('memoryTimerFill').style.width = '100%';
  });
}

function endMemoryGame(){
  const winnerText = finishTeamGame({ prefix: 'memory', teams: state.memoryTeams, hasTimerHud: true, setPlayAreaIdle: true });
  document.getElementById('memoryTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT + NAVIGATION
========================================================= */
wireTeamManagementButtons({
  prefix: 'memory',
  getTeams: () => state.memoryTeams,
  renderScoreboard: renderMemoryScoreboard,
  cancelRound: cancelMemoryRound
});

export function ensureMemoryLayout(){ /* DOM grid — nothing to re-measure */ }

document.getElementById('memoryBackBtn').addEventListener('click', () => goToStage(15));
document.getElementById('digNextStageBtn').addEventListener('click', () => goToStage(16));
