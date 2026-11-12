import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml, showQuestionModal } from '../utils.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { DIG_QUESTIONS } from '../content/stage15-dig.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons } from '../teamGameFlow.js';

/* =========================================================
   STAGE 15 — TREASURE DIG

   Answer a question, then dig five squares. Gems score, rocks cost,
   and one buried chest is worth more than everything else on the board.

   This is the one game in the set with NO reflex or aim component at
   all, and that's the point: every other game rewards being fast or
   accurate, which quietly means the same two or three children win
   every time. Here the weakest player in the class has exactly the
   same chance as the strongest, so it's the one to reach for when a
   lesson needs everybody still in it at the end.

   The board is regenerated per turn, so no team can benefit from
   watching where the previous team dug.
========================================================= */
const DIG_COLS = 7;
const DIG_ROWS = 4;
const DIG_TILES = DIG_COLS * DIG_ROWS;
const DIG_PER_TURN = 5;

// Contents of one board. The counts matter more than they look: with 5
// digs on 28 tiles, this mix gives a roughly 50/50 chance of at least
// one gem and a genuine but unlikely shot at the chest, which is what
// keeps a turn tense rather than either hopeless or routine.
const DIG_GEMS = 7;
const DIG_ROCKS = 6;
const DIG_CHESTS = 1;

const DIG_POINTS = { gem: 5, rock: -2, chest: 20, dirt: 0 };

/* =========================================================
   AUDIO
========================================================= */
function sfxDigDirt(){
  // A dry scrape — short filtered noise, no pitch.
  beep(140, 0.09, 'triangle', 0.05);
  beep(95, 0.12, 'sine', 0.05, 0.02);
}
function sfxDigGem(){ sfxRisingChime([988, 1245, 1480], { duration: 0.12, volume: 0.14, stagger: 0.05 }); }
function sfxDigRock(){ sfxImpact(0.65); }
function sfxDigChest(){
  sfxRisingChime([523, 659, 784, 1047, 1319, 1568], { duration: 0.16, volume: 0.15, stagger: 0.07 });
}

/* =========================================================
   SETUP / TEAMS
========================================================= */
let digRowColors = [];

renderGameIntro('digSetup', {
  prefix: 'dig',
  title: 'Treasure Dig',
  steps: [
    'One team answers a question.',
    'Tap a square to dig it up.',
    'You get five digs. Find the treasure!'
  ],
  scoring: [
    { swatch: '<span class="dig-legend-swatch gem"></span>', label: 'Gem', points: '+5', tone: 'bonus' },
    { swatch: '<span class="dig-legend-swatch chest"></span>', label: 'Treasure chest', points: '+20', tone: 'bonus' },
    { swatch: '<span class="dig-legend-swatch rock"></span>', label: 'Rock', points: '&minus;2', tone: 'bad' },
    { swatch: '<span class="dig-legend-swatch dirt"></span>', label: 'Just dirt', points: '0' }
  ],
  tip: 'Nothing here is skill &mdash; it is pure luck, so every team has exactly the same chance no matter who is playing.'
});

export function renderDigTeamInputs(count){
  renderTeamSetupRows('digTeamInputs', 'digAddTeamBtn', count, digRowColors, renderDigTeamInputs);
}
renderDigTeamInputs(2);
wireAddTeamButton('digTeamInputs', 'digAddTeamBtn', renderDigTeamInputs);

document.getElementById('digStartBtn').addEventListener('click', () => {
  const names = Array.from(document.querySelectorAll('#digTeamInputs input')).map(i => i.value.trim() || 'Team');
  state.digTeams = names.map((name, i) => ({ name, color: digRowColors[i], total: 0 }));
  state.digCurrentTeam = 0;
  state.digTurnsPlayed = 0;
  state.digQuestionOrder = shuffle(DIG_QUESTIONS.map((_, i) => i));

  document.getElementById('digSetup').classList.add('hidden');
  document.getElementById('digGame').classList.remove('hidden');
  document.getElementById('digGameOverBanner').classList.add('hidden');
  buildDigGrid();
  renderDigScoreboard();
  renderDigTurnBanner();
});

function renderDigScoreboard(){
  renderTeamScoreboard('digTeamList', state.digTeams, state.digCurrentTeam);
}
function renderDigTurnBanner(){
  document.getElementById('digTurnBanner').innerHTML =
    `<strong>${escapeHtml(state.digTeams[state.digCurrentTeam].name)}</strong>'s turn — question ${state.digTurnsPlayed + 1} of ${DIG_QUESTIONS.length}`;
}

/* =========================================================
   BOARD
========================================================= */
let digTiles = [];

function buildDigGrid(){
  const grid = document.getElementById('digGrid');
  grid.style.setProperty('--dig-cols', DIG_COLS);
  grid.innerHTML = '';
  digTiles = [];
  for(let i = 0; i < DIG_TILES; i++){
    const tile = document.createElement('button');
    tile.className = 'dig-tile';
    tile.type = 'button';
    tile.setAttribute('aria-label', 'Dig here');
    tile.innerHTML = `
      <span class="dig-tile-face dig-tile-top"></span>
      <span class="dig-tile-face dig-tile-found"></span>
    `;
    tile.addEventListener('click', () => digTile(i));
    grid.appendChild(tile);
    digTiles.push({ el: tile, kind: 'dirt', dug: false });
  }
  dealDigBoard();
}

// Fresh contents every turn, so a team can't learn the board from
// watching the team before them.
function dealDigBoard(){
  const contents = [
    ...Array(DIG_CHESTS).fill('chest'),
    ...Array(DIG_GEMS).fill('gem'),
    ...Array(DIG_ROCKS).fill('rock')
  ];
  while(contents.length < DIG_TILES) contents.push('dirt');
  const shuffled = shuffle(contents);
  digTiles.forEach((t, i) => {
    t.kind = shuffled[i];
    t.dug = false;
    t.el.className = 'dig-tile';
    t.el.disabled = false;
    t.el.querySelector('.dig-tile-found').textContent = '';
  });
}

const DIG_GLYPH = { gem: '◆', rock: '●', chest: '★', dirt: '' };

function digTile(index){
  if(!state.digRoundActive) return;
  const tile = digTiles[index];
  if(tile.dug || state.digDigsLeft <= 0) return;

  tile.dug = true;
  tile.el.disabled = true;
  tile.el.classList.add('dug', `found-${tile.kind}`);
  tile.el.querySelector('.dig-tile-found').textContent = DIG_GLYPH[tile.kind];

  const delta = DIG_POINTS[tile.kind];
  state.digScore = Math.max(0, state.digScore + delta);
  document.getElementById('digScoreDisplay').textContent = String(state.digScore);

  if(tile.kind === 'chest'){ sfxDigChest(); flashDig('good'); }
  else if(tile.kind === 'gem'){ sfxDigGem(); }
  else if(tile.kind === 'rock'){ sfxDigRock(); flashDig('bad'); }
  else sfxDigDirt();

  if(delta !== 0) showDigPoints(tile, delta);

  state.digDigsLeft--;
  document.getElementById('digDigsDisplay').textContent = String(state.digDigsLeft);
  document.getElementById('digTimerFill').style.width = `${(state.digDigsLeft / DIG_PER_TURN) * 100}%`;

  if(state.digDigsLeft <= 0){
    // A beat to let the last reveal land before the result modal.
    setTimeout(() => { if(state.digRoundActive) finishDigRound(); }, 900);
  }
}

function flashDig(kind){
  const area = document.getElementById('digPlayArea');
  const cls = kind === 'bad' ? 'flash-bad' : 'flash-good';
  area.classList.add(cls);
  setTimeout(() => area.classList.remove(cls), 260);
}

function showDigPoints(tile, delta){
  const tag = document.createElement('span');
  tag.className = 'dig-points' + (delta < 0 ? ' bad' : delta >= 20 ? ' chest' : ' bonus');
  tag.textContent = (delta > 0 ? '+' : '') + delta;
  tile.el.appendChild(tag);
  setTimeout(() => tag.remove(), 900);
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askDigQuestion(){
  const q = DIG_QUESTIONS[state.digQuestionOrder[state.digTurnsPlayed]];
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true });
}

document.getElementById('digBeginTurnBtn').addEventListener('click', async () => {
  document.getElementById('digBeginTurnBtn').disabled = true;
  await askDigQuestion();
  startDigRound();
});

function startDigRound(){
  cancelDigRound();
  state.digRoundActive = true;
  state.digScore = 0;
  state.digDigsLeft = DIG_PER_TURN;
  dealDigBoard();

  document.getElementById('digScoreDisplay').textContent = '0';
  document.getElementById('digDigsDisplay').textContent = String(DIG_PER_TURN);
  document.getElementById('digTimerFill').style.width = '100%';
  document.getElementById('digPlayArea').classList.remove('idle');
  document.getElementById('digHint').classList.remove('hidden');
}

export function cancelDigRound(){
  if(state.digRoundActive){
    state.digRoundActive = false;
    const area = document.getElementById('digPlayArea');
    if(area){ area.classList.add('idle'); area.classList.remove('flash-bad', 'flash-good'); }
    const hint = document.getElementById('digHint');
    if(hint) hint.classList.add('hidden');
    const begin = document.getElementById('digBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

function finishDigRound(){
  state.digRoundActive = false;
  document.getElementById('digPlayArea').classList.add('idle');
  document.getElementById('digHint').classList.add('hidden');

  state.digTeams[state.digCurrentTeam].total += state.digScore;
  state.digTurnsPlayed++;
  renderDigScoreboard();

  showTurnResultModal('digNextTeamBtn', { teams: state.digTeams, currentTeamIndex: state.digCurrentTeam }).then(() => {
    if(state.digTurnsPlayed >= DIG_QUESTIONS.length){ endDigGame(); return; }
    state.digCurrentTeam = (state.digCurrentTeam + 1) % state.digTeams.length;
    renderDigScoreboard();
    renderDigTurnBanner();
    document.getElementById('digBeginTurnBtn').disabled = false;
    document.getElementById('digDigsDisplay').textContent = String(DIG_PER_TURN);
    document.getElementById('digTimerFill').style.width = '100%';
  });
}

function endDigGame(){
  const winnerText = finishTeamGame({ prefix: 'dig', teams: state.digTeams, setPlayAreaIdle: true });
  document.getElementById('digTurnBanner').innerHTML = `All done — ${winnerText}`;
}

/* =========================================================
   TEAM MANAGEMENT + NAVIGATION
========================================================= */
wireTeamManagementButtons({
  prefix: 'dig',
  getTeams: () => state.digTeams,
  renderScoreboard: renderDigScoreboard,
  cancelRound: cancelDigRound
});

export function ensureDigLayout(){ /* DOM grid — nothing to re-measure */ }

document.getElementById('digBackBtn').addEventListener('click', () => goToStage(14));
document.getElementById('whackNextStageBtn').addEventListener('click', () => goToStage(15));
