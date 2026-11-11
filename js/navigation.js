import { state } from './state.js';
import { renderStepper } from './stepper.js';
import { cancelMcTimer, renderMcQuestion, startMcTimer } from './stages/stage3-controlled.js';
import { cancelSemiTimer, loadSemiItem, startSemiTimer } from './stages/stage4-guided.js';
import { cancelPopRound, stopPopParticleLoop, resizePopCanvas, startPopParticleLoop } from './stages/stage6-ballpop.js';
import { cancelInvRound, ensureInvLayout } from './stages/stage7-stardefender.js';
import { cancelWheelRound, ensureWheelLayout } from './stages/stage8-spinwheel.js';
import { initQs } from './stages/stage9-questions.js';
import { cancelBilliardsRound, ensureBilliardsLayout } from './stages/stage10-billiards.js';
import { cancelNeonRound, ensureNeonLayout } from './stages/stage11-neonarena.js';
import { cancelFruitRound, ensureFruitLayout } from './stages/stage12-fruitninja.js';
import { enterFooterLayout, exitFooterLayout } from './fullscreenLayout.js';

/* The team-game stages, in stage order. These take over the full
   viewport while active — the team scoreboard and HUD relocate into
   that stage's footer bar instead of a permanent side panel (see
   css/fullscreen-game.css and js/fullscreenLayout.js).

   One table drives three things that used to be three separate
   hand-maintained lists: which stages are fullscreen, which rounds get
   cancelled on every navigation, and which stage re-measures its canvas
   on arrival. js/main.js keeps its own equivalent table for the reset
   flow; the two are deliberately not shared, because importing one from
   the other would close an import cycle (main -> navigation -> stages
   -> navigation). */
const GAME_STAGES = [
  { stage: 6,  ensureLayout: null,                 cancelRound: cancelPopRound },
  { stage: 7,  ensureLayout: ensureInvLayout,      cancelRound: cancelInvRound },
  { stage: 8,  ensureLayout: ensureWheelLayout,    cancelRound: cancelWheelRound },
  { stage: 10, ensureLayout: ensureBilliardsLayout, cancelRound: cancelBilliardsRound },
  { stage: 11, ensureLayout: ensureNeonLayout,     cancelRound: cancelNeonRound },
  { stage: 12, ensureLayout: ensureFruitLayout,    cancelRound: cancelFruitRound }
];
const FULLSCREEN_STAGES = new Set(GAME_STAGES.map(g => g.stage));

export function goToStage(num){
  // Pause whichever gamified timer might still be running when we
  // leave — without this, a requestAnimationFrame loop keeps counting
  // down even while its stage is hidden, and can silently time out
  // in the background before the learner ever comes back to it.
  cancelMcTimer();
  cancelSemiTimer();
  stopPopParticleLoop(); // Ball Pop's continuous particle loop, not a round
  GAME_STAGES.forEach(g => g.cancelRound());

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
  if(num === 9){ initQs(); }
  // Stage 6 is absent from this dispatch on purpose: Ball Pop re-measures
  // in the popTeams branch above, which also restarts its particle loop.
  const game = GAME_STAGES.find(g => g.stage === num);
  if(game && game.ensureLayout) game.ensureLayout();
}
