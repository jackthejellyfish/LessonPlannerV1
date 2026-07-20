import { state } from './state.js';
import { renderStepper } from './stepper.js';
import { cancelMcTimer, renderMcQuestion, startMcTimer } from './stages/stage3-controlled.js';
import { cancelSemiTimer, loadSemiItem, startSemiTimer } from './stages/stage4-guided.js';
import { cancelPopRound, stopPopParticleLoop, resizePopCanvas, startPopParticleLoop } from './stages/stage6-ballpop.js';
import { cancelInvRound, ensureInvLayout } from './stages/stage7-stardefender.js';
import { cancelWheelRound, ensureWheelLayout } from './stages/stage8-spinwheel.js';
import { initQs } from './stages/stage9-questions.js';
import { cancelPlinkoRound, ensurePlinkoLayout } from './stages/stage10-plinko.js';
import { cancelBirdsRound, ensureBirdsLayout } from './stages/stage11-angrybirds.js';
import { cancelCometRound, ensureCometLayout } from './stages/stage12-cometchaos.js';
import { cancelBilliardsRound, ensureBilliardsLayout } from './stages/stage13-billiards.js';
import { cancelNeonRound, ensureNeonLayout } from './stages/stage14-neonarena.js';
import { enterFooterLayout, exitFooterLayout } from './fullscreenLayout.js';

// Stages that take over the full viewport while active — the team
// scoreboard and HUD relocate into that stage's footer bar instead of
// a permanent side panel (see css/fullscreen-game.css and
// js/fullscreenLayout.js). Extend this set when a new game stage is added.
const FULLSCREEN_STAGES = new Set([6, 7, 8, 10, 11, 12, 13, 14]);

export function goToStage(num){
  // Pause whichever gamified timer might still be running when we
  // leave — without this, a requestAnimationFrame loop keeps counting
  // down even while its stage is hidden, and can silently time out
  // in the background before the learner ever comes back to it.
  cancelMcTimer();
  cancelSemiTimer();
  cancelPopRound();
  stopPopParticleLoop();
  cancelInvRound();
  cancelWheelRound();
  cancelPlinkoRound();
  cancelBirdsRound();
  cancelCometRound();
  cancelBilliardsRound();
  cancelNeonRound();

  const prevNum = state.currentStage;
  if(FULLSCREEN_STAGES.has(prevNum) && prevNum !== num){
    exitFooterLayout(document.getElementById('stage' + prevNum));
  }

  state.completedStages.add(state.currentStage);
  state.currentStage = num;
  document.querySelectorAll('.stage').forEach(s => s.classList.add('hidden'));
  document.getElementById('stage' + num).classList.remove('hidden');
  document.body.classList.toggle('fullscreen-game', FULLSCREEN_STAGES.has(num));
  if(FULLSCREEN_STAGES.has(num)){
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
  // Stage 7 was missing from this dispatch entirely — every other game
  // stage re-syncs its canvas on navigation (in case its box size
  // changed while the stage was hidden, e.g. a compact-mode toggle or a
  // window resize that happened on a different stage), but Star
  // Defender only ever resized inside its own begin-turn handler. Found
  // while investigating a general "canvas doesn't redraw at the right
  // size" report — fixed for consistency with every other stage here.
  if(num === 7){ ensureInvLayout(); }
  if(num === 8){ ensureWheelLayout(); }
  if(num === 9){ initQs(); }
  if(num === 10){ ensurePlinkoLayout(); }
  if(num === 11){ ensureBirdsLayout(); }
  if(num === 12){ ensureCometLayout(); }
  if(num === 13){ ensureBilliardsLayout(); }
  if(num === 14){ ensureNeonLayout(); }
}
