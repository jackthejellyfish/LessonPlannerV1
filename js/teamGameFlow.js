import { escapeHtml } from './utils.js';
import { sfxFanfare } from './audio.js';
import { confirmDialog } from './confirmDialog.js';
import { renderResultStandings } from './teamColorPicker.js';
import { showGameIntroMenu } from './gameIntro.js';
import { burstFromElement } from './particles.js';
import { setTimerFill } from './hud.js';

/* =========================================================
   SHARED TEAM-GAME ORCHESTRATION
   Every team-based game (Ball Pop, Star Defender, Spin Wheel, Billiards,
   Neon Arena, Fruit Ninja) re-implemented the same
   result-modal/end-game/team-management chrome almost byte-for-byte —
   confirmed by reading them all side by side before extracting this. What's
   NOT here on purpose: each game's own turn-banner text (only Ball Pop's
   differs — "All 10 questions done" vs. everyone else's "All done"), and
   every bit of actual gameplay/scoring logic (Spin Wheel's correctness-
   gated scoring, Billiards' randomized rack, Neon Arena's lives-never-
   end-the-round-early behavior, etc.) — those stay exactly where they are,
   in each stage's own file. This module only owns the mechanical parts
   that were genuinely identical everywhere.

   IDs are built from each game's own `prefix` (e.g. 'billiards' →
   #billiardsBeginTurnBtn) — the same "pass the id, don't guess it"
   convention already used by teamColorPicker.js's renderTeamSetupRows()
   and canvasGame.js's createCanvasResizer(), just applied one layer up.
========================================================= */

// Shared by every game's showXResult(): the question-result modal's
// Promise/overlay/listener plumbing, the team-standings strip, and the
// Continue button. Deliberately minimal per explicit feedback that the
// old per-game "Turn result" tag + big "+N"/breakdown text felt cluttered —
// the standings pills ARE the result now, nothing else competes with them.
// Every game's showXResult() used to build its own bodyHtml for that now-
// removed text; none of them pass anything extra here any more.
//
// `teams`/`currentTeamIndex` are optional so this still works for any
// caller that doesn't have a team roster (none currently do, but no
// reason to force it) — when given, the modal is tinted to the acting
// team's own color (`--tc`) and a confetti burst fires from that team's
// own standings pill in the same color.
/* ---- Setup -> play, and the turn banner ----
   The same three pieces every team game had written out for itself.
   Each game still assigns its own state explicitly (state.popTeams =
   readTeamsFromSetup('pop', ...)), so every field stays grep-able;
   only the DOM work is shared. */

// The team rows on a game's setup screen, as fresh team objects.
export function readTeamsFromSetup(prefix, rowColors){
  return Array.from(document.querySelectorAll(`#${prefix}TeamInputs input`)).map((input, i) => ({
    name: input.value.trim() || 'Team',
    color: rowColors[i],
    total: 0
  }));
}

// Swaps a game from its setup screen to its play screen.
export function showGameScreen(prefix){
  document.getElementById(`${prefix}Setup`).classList.add('hidden');
  document.getElementById(`${prefix}Game`).classList.remove('hidden');
  document.getElementById(`${prefix}GameOverBanner`).classList.add('hidden');
}

// "<Team>'s turn — question 3 of 10" (Spin the Wheel says "spin").
export function renderTurnBanner(prefix, team, turnNumber, totalTurns, noun = 'question'){
  document.getElementById(`${prefix}TurnBanner`).innerHTML =
    `<strong>${escapeHtml(team.name)}</strong>'s turn — ${noun} ${turnNumber} of ${totalTurns}`;
}

// Each team's total the last time the scoreboard showed, so the card of
// the team that just played can say what it scored this turn without
// every game having to pass its own turn score in. A total that went DOWN
// since then means the scores were reset, so it counts from zero.
const lastShownTotal = new WeakMap();

export function showTurnResultModal(nextBtnId, { teams, currentTeamIndex } = {}){
  return new Promise(resolve => {
    const modalBody = document.getElementById('popResultBody');
    const currentTeam = teams ? teams[currentTeamIndex] : null;
    let turnPoints = null;
    if(currentTeam){
      const before = lastShownTotal.get(currentTeam);
      turnPoints = before == null || before > currentTeam.total ? currentTeam.total : currentTeam.total - before;
    }
    if(teams) teams.forEach(t => lastShownTotal.set(t, t.total));
    modalBody.style.setProperty('--tc', currentTeam ? currentTeam.color : '');
    modalBody.innerHTML = `
      ${teams ? `<p class="result-title">Scores</p>${renderResultStandings(teams, currentTeamIndex, turnPoints)}` : ''}
      <div class="modal-actions">
        <button class="btn btn-primary" id="${nextBtnId}" type="button">Continue</button>
      </div>
    `;
    document.getElementById('popResultOverlay').classList.remove('hidden');

    const activePill = modalBody.querySelector('.result-pill.active');
    if(activePill && currentTeam) burstFromElement(activePill, modalBody, currentTeam.color);

    document.getElementById(nextBtnId).addEventListener('click', () => {
      document.getElementById('popResultOverlay').classList.add('hidden');
      resolve();
    });
  });
}

export function computeWinnerText(teams){
  const maxScore = Math.max(...teams.map(t => t.total));
  const winners = teams.filter(t => t.total === maxScore);
  return winners.length > 1
    ? `It's a tie: ${winners.map(w => w.name).join(' & ')}!`
    : `${winners[0].name} wins!`;
}

// The shared tail of every game's endXGame(): finishing sfx, the winner
// revealed in the big game-over banner, hiding the begin-turn button,
// revealing Play Again. `hasTimerHud` and `setPlayAreaIdle` are the two
// genuine structural variations found across the 8 games — timed-round
// games (Ball Pop/Star Defender/Neon Arena) reset a live timer HUD here;
// some (but not all) canvas games still need `.idle` added to their play
// area here (the rest already set it earlier in their own turn-resolution
// flow, so doing it again here would just be redundant, not wrong — this
// flag mirrors exactly what each game's original endXGame did, not what
// looked "more correct"). Callers set their own turn-banner text with the
// returned winnerText BEFORE calling this, and do so before this call —
// order matches every original endXGame.
export function finishTeamGame({ prefix, teams, hasTimerHud = false, setPlayAreaIdle = false }){
  // The end of a whole game, not just one right answer — it gets the
  // fanfare rather than reusing sfxCorrect's single-question ding.
  sfxFanfare();
  const winnerText = computeWinnerText(teams);

  document.getElementById(`${prefix}BeginTurnBtn`).classList.add('hidden');
  if(hasTimerHud){
    document.getElementById(`${prefix}TimeDisplay`).textContent = '--';
    setTimerFill(document.getElementById(`${prefix}TimerFill`), 0);
  }
  document.getElementById(`${prefix}GameOverWinner`).textContent = winnerText;
  document.getElementById(`${prefix}GameOverBanner`).classList.remove('hidden');
  if(setPlayAreaIdle){
    document.getElementById(`${prefix}PlayArea`).classList.add('idle');
  }
  document.getElementById(`${prefix}PlayAgainBtn`).classList.remove('hidden');

  return winnerText;
}

// The reset-scores/change-teams/play-again handlers, identical in every
// game except one genuine per-game extra (Ball Pop stops its own particle
// loop before hiding the game) — covered by the optional beforePlayAgain/
// afterPlayAgain hooks rather than forcing false uniformity onto the
// games that don't need either.
export function wireTeamManagementButtons({ prefix, getTeams, renderScoreboard, cancelRound, beforePlayAgain, afterPlayAgain }){
  document.getElementById(`${prefix}ResetScoresBtn`).addEventListener('click', async () => {
    if(!await confirmDialog('Reset all team scores to 0?', { confirmLabel: 'Reset', danger: true })) return;
    getTeams().forEach(t => { t.total = 0; lastShownTotal.delete(t); });
    renderScoreboard();
  });

  document.getElementById(`${prefix}ChangeTeamsBtn`).addEventListener('click', async () => {
    if(!await confirmDialog('Go back and change teams? This will end the current game.', { confirmLabel: 'Change teams', danger: true })) return;
    cancelRound();
    document.getElementById(`${prefix}PlayAgainBtn`).click();
  });

  document.getElementById(`${prefix}PlayAgainBtn`).addEventListener('click', () => {
    if(beforePlayAgain) beforePlayAgain();
    document.getElementById(`${prefix}Game`).classList.add('hidden');
    document.getElementById(`${prefix}PlayAgainBtn`).classList.add('hidden');
    document.getElementById(`${prefix}BeginTurnBtn`).classList.remove('hidden');
    document.getElementById(`${prefix}BeginTurnBtn`).disabled = false;
    document.getElementById(`${prefix}Setup`).classList.remove('hidden');
    showGameIntroMenu(prefix);
    if(afterPlayAgain) afterPlayAgain();
  });
}
