import { state } from './state.js';
import { renderStepper } from './stepper.js';
import { cancelMcTimer, renderMcQuestion, startMcTimer } from './stages/stage3-controlled.js';
import { cancelSemiTimer, loadSemiItem, startSemiTimer } from './stages/stage4-guided.js';
import { stopPopParticleLoop, resizePopCanvas, startPopParticleLoop } from './stages/stage6-ballpop.js';
import { initQs } from './stages/stage9-questions.js';
import { gameForStage, cancelAllRounds } from './games.js';
import { enterFooterLayout, exitFooterLayout } from './fullscreenLayout.js';

// The team-game stages take over the full viewport while active — the
// team scoreboard and HUD relocate into that stage's footer bar (see
// css/fullscreen-game.css and js/fullscreenLayout.js). Looked up at call
// time, not cached at load: this module and js/games.js are in an import
// cycle, so GAMES isn't guaranteed to exist while this file is loading.
const isFullscreenStage = (num) => gameForStage(num) !== null;

export function goToStage(num){
  // Pause whichever gamified timer might still be running when we
  // leave — without this, a requestAnimationFrame loop keeps counting
  // down even while its stage is hidden, and can silently time out
  // in the background before the learner ever comes back to it.
  cancelMcTimer();
  cancelSemiTimer();
  stopPopParticleLoop(); // Ball Pop's continuous particle loop, not a round
  cancelAllRounds();

  const prevNum = state.currentStage;
  if(isFullscreenStage(prevNum) && prevNum !== num){
    exitFooterLayout(document.getElementById('stage' + prevNum));
  }

  state.completedStages.add(state.currentStage);
  state.currentStage = num;
  document.querySelectorAll('.stage').forEach(s => s.classList.add('hidden'));
  document.getElementById('stage' + num).classList.remove('hidden');
  document.body.classList.toggle('fullscreen-game', isFullscreenStage(num));
  if(isFullscreenStage(num)){
    enterFooterLayout(document.getElementById('stage' + num));
  }
  renderStepper();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if(num === 3){
    if(!state.mcStarted){ state.mcStarted = true; renderMcQuestion(); }
    else if(!state.mcAnswered){ startMcTimer(); }
  }
  if(num === 4){
    if(!state.semiStarted){ state.semiStarted = true; loadSemiItem(); }
    else if(!state.semiChecked){ startSemiTimer(); }
  }
  if(num === 6 && state.popTeams.length > 0){
    resizePopCanvas();
    startPopParticleLoop();
  }
  if(num === 9){ initQs(); }
  // Stage 6 is skipped here on purpose: Ball Pop re-measures in the
  // popTeams branch above, which also restarts its particle loop.
  const game = gameForStage(num);
  if(game && num !== 6) game.ensureLayout();
}
