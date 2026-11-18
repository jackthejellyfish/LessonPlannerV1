/* =========================================================
   THE GAME REGISTRY
   The team-game stages, in stage order — the one list that both
   navigation.js (fullscreen layout, cancel rounds on every move,
   re-measure on arrival) and main.js (full reset, compact-mode
   re-measure) walk. Adding or removing a game is one line here.

   This used to be two hand-kept copies, one in each of those files,
   on the belief that sharing it would close an import cycle
   (main -> navigation -> stages -> navigation). The cycle already
   exists — navigation imports the stage modules, which import
   goToStage back — and it is harmless, because nothing calls
   goToStage while modules are still loading. It is safe for this
   list too: every function referenced below is an `export function`
   declaration, which ES modules make available before the module
   body runs. Keep it that way (no `export const fn = () => …` for
   anything listed here), or this array can capture `undefined`.

   `prefix` is the id prefix every game shares across its own markup
   (`popSetup`/`popGame`/`popBeginTurnBtn`/...), the convention
   teamColorPicker.js and teamGameFlow.js also rely on.
========================================================= */
import { cancelPopRound, renderPopTeamInputs, resizePopCanvas } from './stages/stage6-ballpop.js';
import { cancelInvRound, renderInvTeamInputs, ensureInvLayout } from './stages/stage7-stardefender.js';
import { cancelWheelRound, renderWheelTeamInputs, ensureWheelLayout } from './stages/stage8-spinwheel.js';
import { cancelBilliardsRound, renderBilliardsTeamInputs, ensureBilliardsLayout } from './stages/stage10-billiards.js';
import { cancelNeonRound, renderNeonTeamInputs, ensureNeonLayout } from './stages/stage11-neonarena.js';
import { cancelFruitRound, renderFruitTeamInputs, ensureFruitLayout } from './stages/stage12-fruitninja.js';
import { cancelHoopRound, renderHoopTeamInputs, ensureHoopLayout } from './stages/stage13-hoopshot.js';
import { cancelWhackRound, renderWhackTeamInputs, ensureWhackLayout } from './stages/stage14-whack.js';
import { cancelMazeRound, renderMazeTeamInputs, ensureMazeLayout } from './stages/stage15-maze.js';
import { cancelJumpRound, renderJumpTeamInputs, ensureJumpLayout } from './stages/stage16-ninjajump.js';

export const GAMES = [
  { stage: 6,  prefix: 'pop',       ensureLayout: resizePopCanvas,       cancelRound: cancelPopRound,       renderTeamInputs: renderPopTeamInputs },
  { stage: 7,  prefix: 'inv',       ensureLayout: ensureInvLayout,       cancelRound: cancelInvRound,       renderTeamInputs: renderInvTeamInputs },
  { stage: 8,  prefix: 'wheel',     ensureLayout: ensureWheelLayout,     cancelRound: cancelWheelRound,     renderTeamInputs: renderWheelTeamInputs },
  { stage: 10, prefix: 'billiards', ensureLayout: ensureBilliardsLayout, cancelRound: cancelBilliardsRound, renderTeamInputs: renderBilliardsTeamInputs },
  { stage: 11, prefix: 'neon',      ensureLayout: ensureNeonLayout,      cancelRound: cancelNeonRound,      renderTeamInputs: renderNeonTeamInputs },
  { stage: 12, prefix: 'fruit',     ensureLayout: ensureFruitLayout,     cancelRound: cancelFruitRound,     renderTeamInputs: renderFruitTeamInputs },
  { stage: 13, prefix: 'hoop',      ensureLayout: ensureHoopLayout,      cancelRound: cancelHoopRound,      renderTeamInputs: renderHoopTeamInputs },
  { stage: 14, prefix: 'whack',     ensureLayout: ensureWhackLayout,     cancelRound: cancelWhackRound,     renderTeamInputs: renderWhackTeamInputs },
  { stage: 15, prefix: 'maze',      ensureLayout: ensureMazeLayout,      cancelRound: cancelMazeRound,      renderTeamInputs: renderMazeTeamInputs },
  { stage: 16, prefix: 'jump',      ensureLayout: ensureJumpLayout,      cancelRound: cancelJumpRound,      renderTeamInputs: renderJumpTeamInputs }
];

export function gameForStage(num){
  return GAMES.find(g => g.stage === num) || null;
}

export function cancelAllRounds(){
  GAMES.forEach(g => g.cancelRound());
}
