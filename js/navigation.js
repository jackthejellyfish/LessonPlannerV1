import { state } from './state.js';
import { renderStepper } from './stepper.js';
import { cancelMcTimer, resumeMc } from './stages/stage3-controlled.js';
import { cancelSemiTimer, loadSemiItem, startSemiTimer } from './stages/stage4-guided.js';
import { stopPopParticleLoop, resizePopCanvas, startPopParticleLoop } from './stages/stage6-ballpop.js';
import { initQs } from './stages/stage9-questions.js';
import { pauseStopwatch } from './stages/stage5-free.js';
import { gameForStage, cancelAllRounds } from './games.js';
import { enterFooterLayout, exitFooterLayout } from './fullscreenLayout.js';

// The team-game stages take over the full viewport while active — the
// team scoreboard and HUD relocate into that stage's footer bar (see
// css/fullscreen-game.css and js/fullscreenLayout.js). Looked up at call
// time, not cached at load: this module and js/games.js are in an import
// cycle, so GAMES isn't guaranteed to exist while this file is loading.
const isFullscreenStage = (num) => gameForStage(num) !== null;

// Stops everything the current stage might have running: the Stage 3/4
// countdowns (and Stage 3's pause before its next question), the Stage 5
// countdown, Ball Pop's particle loop and any game round. Without this a
// hidden stage keeps counting down and plays its beeps and time-up sound
// over whatever is on screen. Every way out of a stage goes through here:
// moving stage, Restart, and opening the lesson picker.
export function stopStageActivity(){
  cancelMcTimer();
  cancelSemiTimer();
  pauseStopwatch();
  stopPopParticleLoop(); // Ball Pop's continuous particle loop, not a round
  cancelAllRounds();
}

export function goToStage(num){
  stopStageActivity();

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

  if(num === 3) resumeMc();
  if(num === 4){
    if(!state.semiStarted){ state.semiStarted = true; loadSemiItem(); }
    else if(!state.semiChecked){ startSemiTimer(); }
  }
  if(num === 6 && state.popTeams.length > 0){
    resizePopCanvas();
    startPopParticleLoop();
  }
  // First visit only (per lesson): this used to run on every visit, so
  // popping to another stage and back wiped everything students had typed.
  if(num === 9 && !state.qsStarted){ state.qsStarted = true; initQs(); }
  // Stage 6 is skipped here on purpose: Ball Pop re-measures in the
  // popTeams branch above, which also restarts its particle loop.
  const game = gameForStage(num);
  if(game && num !== 6) game.ensureLayout();
}
