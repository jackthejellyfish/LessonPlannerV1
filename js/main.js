/* =========================================================
   APP ENTRY POINT
   Importing each stage module registers that stage's event
   listeners and runs its one-time setup (e.g. the default team
   input rows) as a side effect of the import itself — the same
   moment those statements ran in the original single-file
   version, just split across files now.
========================================================= */
import { state, resetLessonState } from './state.js';
import { renderStepper } from './stepper.js';
import { goToStage } from './navigation.js';
import { speakerIconSVG } from './icons.js';
import { confirmDialog } from './confirmDialog.js';

import './stages/stage1-aim.js';
import { renderRuleCards, renderCompareDemo, renderPrintableRules } from './stages/stage2-rules.js';
import { cancelMcTimer } from './stages/stage3-controlled.js';
import { cancelSemiTimer } from './stages/stage4-guided.js';
import { renderWordBank, renderScaffoldList, resetStopwatch, initStopwatchDisplay } from './stages/stage5-free.js';
import { cancelPopRound, stopPopParticleLoop, renderPopTeamInputs, resizePopCanvas } from './stages/stage6-ballpop.js';
import { cancelInvRound, renderInvTeamInputs, ensureInvLayout } from './stages/stage7-stardefender.js';
import { cancelWheelRound, renderWheelTeamInputs, ensureWheelLayout } from './stages/stage8-spinwheel.js';
import './stages/stage9-questions.js';
import { cancelPlinkoRound, renderPlinkoTeamInputs, renderPlinkoBallLegend, ensurePlinkoLayout } from './stages/stage10-plinko.js';
import { cancelBirdsRound, renderBirdsTeamInputs, ensureBirdsLayout } from './stages/stage11-angrybirds.js';
import { cancelCometRound, renderCometTeamInputs, ensureCometLayout } from './stages/stage12-cometchaos.js';
import { cancelBilliardsRound, renderBilliardsTeamInputs, ensureBilliardsLayout } from './stages/stage13-billiards.js';
import { cancelNeonRound, renderNeonTeamInputs, ensureNeonLayout } from './stages/stage14-neonarena.js';

document.getElementById('muteBtn').innerHTML = speakerIconSVG(state.muted);
document.getElementById('muteBtn').addEventListener('click', () => {
  state.muted = !state.muted;
  document.getElementById('muteBtn').innerHTML = speakerIconSVG(state.muted);
});

// Compact mode: shrinks the fullscreen game into a smaller, centered
// board for players who can't physically reach the far edges of a large
// display. Only visible/relevant while a game is open (see
// css/fullscreen-game.css); the preference persists across games until
// toggled off again.
// Toggling compact mode resizes the stage box via CSS alone, which does
// NOT fire a native window 'resize' event — each game's <canvas> keeps
// its OLD pixel-buffer dimensions until something explicitly re-measures
// it, so its drawn content (e.g. Ball Pop's glow rings) ends up
// stretched/misaligned relative to the new box size. Shared by the
// click handler below AND the footer-height ResizeObserver, since both
// need to re-measure whichever game is actually open; the others are
// hidden (0 size) and get re-measured correctly whenever the teacher
// navigates to them.
function resizeCurrentStageCanvas(){
  if(state.currentStage === 6) resizePopCanvas();
  else if(state.currentStage === 7) ensureInvLayout();
  else if(state.currentStage === 8) ensureWheelLayout();
  else if(state.currentStage === 10) ensurePlinkoLayout();
  else if(state.currentStage === 11) ensureBirdsLayout();
  else if(state.currentStage === 12) ensureCometLayout();
  else if(state.currentStage === 13) ensureBilliardsLayout();
  else if(state.currentStage === 14) ensureNeonLayout();
}

document.getElementById('compactModeBtn').addEventListener('click', () => {
  const compact = document.body.classList.toggle('compact-game');
  const btn = document.getElementById('compactModeBtn');
  btn.textContent = compact ? '⤡' : '⤢';
  btn.setAttribute('aria-label', compact ? 'Return game to full size' : 'Shrink game to a smaller, easier-to-reach size');
  resizeCurrentStageCanvas();
});

// Compact mode's footer floats as a position:absolute overlay at the
// bottom of the shrunk stage box, so .stage-body reserves space for it
// via padding-bottom — but the footer's real height varies per game
// (team count, HUD field count, button label lengths all wrap
// differently at this box's narrower width) and can't be reliably
// guessed with one fixed CSS value. A ResizeObserver keeps
// --compact-footer-h in sync with each stage's footer's ACTUAL
// rendered height instead, re-running the current game's canvas resize
// whenever it changes so the canvas always sizes against the real
// available space, not an approximation (see the CSS var's definition
// in fullscreen-game.css for the bug this fixes — confirmed via
// measurement, not just guessed at).
const compactFooterObserver = new ResizeObserver((entries) => {
  if(!document.body.classList.contains('compact-game')) return;
  for(const entry of entries){
    const footer = entry.target;
    if(footer.offsetParent === null) continue; // a hidden stage's footer — ignore
    const h = Math.ceil(footer.getBoundingClientRect().height) + 6;
    document.body.style.setProperty('--compact-footer-h', `${h}px`);
  }
  resizeCurrentStageCanvas();
});
document.querySelectorAll('.stage-footer').forEach(f => compactFooterObserver.observe(f));

/* =========================================================
   RESTART LESSON
   Resets every stage's state and UI back to a first-visit look,
   then returns to Stage 1. Cross-cuts multiple stage modules, so
   it lives here rather than inside any one of them. Every game
   stage's footer has its own "Restart lesson" shortcut
   (`.restart-lesson-btn`, one shared handler) rather than a chain
   of buttons faking clicks on each other.
========================================================= */
document.querySelectorAll('.restart-lesson-btn').forEach(btn => btn.addEventListener('click', async () => {
  if(!await confirmDialog('Restart the whole lesson from the beginning?', { confirmLabel: 'Restart', danger: true })) return;
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
  resetLessonState();

  document.querySelector('#stage4 .semi-actions').classList.remove('hidden');
  document.getElementById('popGame').classList.add('hidden');
  document.getElementById('popPlayAgainBtn').classList.add('hidden');
  document.getElementById('popBeginTurnBtn').classList.remove('hidden');
  document.getElementById('popSetup').classList.remove('hidden');
  document.getElementById('invGame').classList.add('hidden');
  document.getElementById('invPlayAgainBtn').classList.add('hidden');
  document.getElementById('invBeginTurnBtn').classList.remove('hidden');
  document.getElementById('invSetup').classList.remove('hidden');
  document.getElementById('wheelGame').classList.add('hidden');
  document.getElementById('wheelPlayAgainBtn').classList.add('hidden');
  document.getElementById('wheelBeginTurnBtn').classList.remove('hidden');
  document.getElementById('wheelSetup').classList.remove('hidden');
  document.getElementById('plinkoGame').classList.add('hidden');
  document.getElementById('plinkoPlayAgainBtn').classList.add('hidden');
  document.getElementById('plinkoBeginTurnBtn').classList.remove('hidden');
  document.getElementById('plinkoSetup').classList.remove('hidden');
  document.getElementById('birdsGame').classList.add('hidden');
  document.getElementById('birdsPlayAgainBtn').classList.add('hidden');
  document.getElementById('birdsBeginTurnBtn').classList.remove('hidden');
  document.getElementById('birdsSetup').classList.remove('hidden');
  document.getElementById('cometGame').classList.add('hidden');
  document.getElementById('cometPlayAgainBtn').classList.add('hidden');
  document.getElementById('cometBeginTurnBtn').classList.remove('hidden');
  document.getElementById('cometSetup').classList.remove('hidden');
  document.getElementById('billiardsGame').classList.add('hidden');
  document.getElementById('billiardsPlayAgainBtn').classList.add('hidden');
  document.getElementById('billiardsBeginTurnBtn').classList.remove('hidden');
  document.getElementById('billiardsSetup').classList.remove('hidden');
  document.getElementById('neonGame').classList.add('hidden');
  document.getElementById('neonPlayAgainBtn').classList.add('hidden');
  document.getElementById('neonBeginTurnBtn').classList.remove('hidden');
  document.getElementById('neonSetup').classList.remove('hidden');
  renderPopTeamInputs(2);
  renderInvTeamInputs(2);
  renderWheelTeamInputs(2);
  renderPlinkoTeamInputs(2);
  renderPlinkoBallLegend();
  renderBirdsTeamInputs(2);
  renderCometTeamInputs(2);
  renderBilliardsTeamInputs(2);
  renderNeonTeamInputs(2);
  renderRuleCards();
  renderCompareDemo();
  resetStopwatch();
  goToStage(1);
  // Stage 3/4 are left uninitialized here on purpose — goToStage()
  // will set each one up fresh (new timer included) the next time the
  // learner actually navigates to it, same as a first-time visit.
}));

/* =========================================================
   INIT
========================================================= */
renderStepper();
renderRuleCards();
renderPrintableRules();
renderCompareDemo();
renderWordBank();
renderScaffoldList();
initStopwatchDisplay();
// Stage 3 (Controlled practice) and Stage 4 (Guided practice) are
// deliberately NOT initialized here — goToStage() sets each of them
// up the first time the learner actually reaches that stage, so their
// countdown timers can't start ticking while the stage is still hidden.
