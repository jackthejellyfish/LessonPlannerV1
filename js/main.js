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
import { applyMuteState } from './audio.js';
import { confirmDialog } from './confirmDialog.js';
import { getLesson, renderLessonCards } from './lessons.js';
import { showGameIntroMenu } from './gameIntro.js';

import { renderAimHeader, renderAimExamples } from './stages/stage1-aim.js';
import { renderLearnSlide, renderPrintableRules } from './stages/stage2-rules.js';
import { cancelMcTimer } from './stages/stage3-controlled.js';
import { cancelSemiTimer } from './stages/stage4-guided.js';
import { renderWordBank, renderScaffoldList, resetStopwatch, initStopwatchDisplay } from './stages/stage5-free.js';
import { cancelPopRound, stopPopParticleLoop, renderPopTeamInputs, resizePopCanvas } from './stages/stage6-ballpop.js';
import { cancelInvRound, renderInvTeamInputs, ensureInvLayout } from './stages/stage7-stardefender.js';
import { cancelWheelRound, renderWheelTeamInputs, ensureWheelLayout } from './stages/stage8-spinwheel.js';
import './stages/stage9-questions.js';
import { cancelBilliardsRound, renderBilliardsTeamInputs, ensureBilliardsLayout } from './stages/stage10-billiards.js';
import { cancelNeonRound, renderNeonTeamInputs, ensureNeonLayout } from './stages/stage11-neonarena.js';
import { cancelFruitRound, renderFruitTeamInputs, ensureFruitLayout } from './stages/stage12-fruitninja.js';
import { cancelHoopRound, renderHoopTeamInputs, ensureHoopLayout } from './stages/stage13-hoopshot.js';
import { cancelWhackRound, renderWhackTeamInputs, ensureWhackLayout } from './stages/stage14-whack.js';
import { cancelMemoryRound, renderMemoryTeamInputs, ensureMemoryLayout } from './stages/stage15-memory.js';

// Every content/stageN-*.js file exports its own applyLesson(id), which
// mutates its exported arrays/objects in place (see that file's header
// comment) so every stage/*.js importer above keeps reading live data
// without ever needing to know a lesson switch happened. Aliased on
// import (every file names its export the same thing) and called
// together from applyLessonContent() below — explicit, grep-able call
// sites over a dynamic `content[stage].applyLesson()` lookup, same
// preference documented throughout this app for its primary maintainer.
import { applyLesson as applyStage1Content } from './content/stage1-aim.js';
import { applyLesson as applyStage2Content } from './content/stage2-rules.js';
import { applyLesson as applyStage3Content } from './content/stage3-controlled.js';
import { applyLesson as applyStage4Content } from './content/stage4-guided.js';
import { applyLesson as applyStage5Content } from './content/stage5-free.js';
import { applyLesson as applyStage6Content } from './content/stage6-ballpop.js';
import { applyLesson as applyStage7Content } from './content/stage7-stardefender.js';
import { applyLesson as applyStage8Content } from './content/stage8-spinwheel.js';
import { applyLesson as applyStage9Content } from './content/stage9-questions.js';
import { applyLesson as applyStage10Content } from './content/stage10-billiards.js';
import { applyLesson as applyStage11Content } from './content/stage11-neonarena.js';
import { applyLesson as applyStage12Content } from './content/stage12-fruitninja.js';
import { applyLesson as applyStage13Content } from './content/stage13-hoopshot.js';
import { applyLesson as applyStage14Content } from './content/stage14-whack.js';
import { applyLesson as applyStage15Content } from './content/stage15-memory.js';

const CONTENT_APPLIERS = [
  applyStage1Content, applyStage2Content, applyStage3Content, applyStage4Content, applyStage5Content,
  applyStage6Content, applyStage7Content, applyStage8Content, applyStage9Content, applyStage10Content,
  applyStage11Content, applyStage12Content, applyStage13Content, applyStage14Content,
  applyStage15Content
];

function applyLessonContent(id){
  CONTENT_APPLIERS.forEach(apply => apply(id));
  document.title = getLesson(id).pageTitle;
}

document.getElementById('muteBtn').innerHTML = speakerIconSVG(state.muted);
document.getElementById('muteBtn').addEventListener('click', () => {
  state.muted = !state.muted;
  // Ducks the master gain, so anything already sounding stops too —
  // previously mute only prevented NEW sounds from starting.
  applyMuteState();
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
/* =========================================================
   THE GAME REGISTRY
   The six team-based game stages, in stage order. Everything below
   that used to be written out once per game — the full-reset DOM
   cleanup, the per-stage canvas re-measure, the round cancellations —
   now walks this instead.

   The motivation was concrete: v2 deleted two games and renumbered
   three, and every one of those copy-pasted blocks was a separate
   place to miss. Adding or removing a game is now one line here.

   `prefix` is the id prefix every game already shares across its own
   markup (`popSetup`/`popGame`/`popBeginTurnBtn`/...), the same
   convention teamColorPicker.js and teamGameFlow.js already rely on.
========================================================= */
const GAMES = [
  { stage: 6,  prefix: 'pop',       ensureLayout: resizePopCanvas,      cancelRound: cancelPopRound,       renderTeamInputs: renderPopTeamInputs },
  { stage: 7,  prefix: 'inv',       ensureLayout: ensureInvLayout,      cancelRound: cancelInvRound,       renderTeamInputs: renderInvTeamInputs },
  { stage: 8,  prefix: 'wheel',     ensureLayout: ensureWheelLayout,    cancelRound: cancelWheelRound,     renderTeamInputs: renderWheelTeamInputs },
  { stage: 10, prefix: 'billiards', ensureLayout: ensureBilliardsLayout, cancelRound: cancelBilliardsRound, renderTeamInputs: renderBilliardsTeamInputs },
  { stage: 11, prefix: 'neon',      ensureLayout: ensureNeonLayout,     cancelRound: cancelNeonRound,      renderTeamInputs: renderNeonTeamInputs },
  { stage: 12, prefix: 'fruit',     ensureLayout: ensureFruitLayout,    cancelRound: cancelFruitRound,     renderTeamInputs: renderFruitTeamInputs },
  { stage: 13, prefix: 'hoop',      ensureLayout: ensureHoopLayout,     cancelRound: cancelHoopRound,      renderTeamInputs: renderHoopTeamInputs },
  { stage: 14, prefix: 'whack',     ensureLayout: ensureWhackLayout,    cancelRound: cancelWhackRound,     renderTeamInputs: renderWhackTeamInputs },
  { stage: 15, prefix: 'memory',    ensureLayout: ensureMemoryLayout,   cancelRound: cancelMemoryRound,    renderTeamInputs: renderMemoryTeamInputs }
];

function resizeCurrentStageCanvas(){
  const game = GAMES.find(g => g.stage === state.currentStage);
  if(game) game.ensureLayout();
}

document.getElementById('compactModeBtn').addEventListener('click', () => {
  const compact = document.body.classList.toggle('compact-game');
  const btn = document.getElementById('compactModeBtn');
  btn.textContent = compact ? '⤡' : '⤢';
  btn.setAttribute('aria-label', compact ? 'Return game to full size' : 'Shrink game to a smaller, easier-to-reach size');
  resizeCurrentStageCanvas();
});

// Hide-nav: lets a teacher opt back out of the always-visible fullscreen
// stepper (see css/fullscreen-game.css) for a fully edge-to-edge game
// with no chrome at all. Independent of compact mode and, like it,
// persists as you move between games until toggled off again.
document.getElementById('hideNavBtn').addEventListener('click', () => {
  const hidden = document.body.classList.toggle('hide-nav');
  const btn = document.getElementById('hideNavBtn');
  btn.setAttribute('aria-label', hidden ? 'Show the top navigation bar' : 'Hide the top navigation bar for a distraction-free fullscreen game');
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
   FULL RESET
   Resets every stage's state and UI back to a first-visit look,
   then returns to Stage 1. Cross-cuts multiple stage modules, so
   it lives here rather than inside any one of them. Shared by the
   Restart-lesson button (every stage's footer has its own
   `.restart-lesson-btn` wired to the same handler below) AND by
   picking a lesson on the select screen — the two only differ in
   whether a lessonId is passed through to resetLessonState (a
   plain Restart keeps whatever lesson is already running; picking
   a lesson passes its id explicitly).
========================================================= */
function performFullReset(lessonId){
  cancelMcTimer();
  cancelSemiTimer();
  stopPopParticleLoop(); // Ball Pop's own continuous loop, not a round
  GAMES.forEach(g => g.cancelRound());
  resetLessonState(lessonId);

  document.querySelector('#stage4 .semi-actions').classList.remove('hidden');
  // Each game's setup screen comes back, its in-game view goes away, and
  // its team rows are rebuilt at the default count of 2. This was the
  // same four lines plus a render call, written out six times.
  GAMES.forEach(({ prefix, renderTeamInputs }) => {
    document.getElementById(`${prefix}Game`).classList.add('hidden');
    document.getElementById(`${prefix}PlayAgainBtn`).classList.add('hidden');
    document.getElementById(`${prefix}BeginTurnBtn`).classList.remove('hidden');
    document.getElementById(`${prefix}Setup`).classList.remove('hidden');
    renderTeamInputs(2);
    showGameIntroMenu(prefix);
  });
  renderAimHeader();
  renderAimExamples();
  renderLearnSlide();
  renderPrintableRules();
  renderWordBank();
  renderScaffoldList();
  resetStopwatch();
  goToStage(1);
  // Stage 3/4 are left uninitialized here on purpose — goToStage()
  // will set each one up fresh (new timer included) the next time the
  // learner actually navigates to it, same as a first-time visit.
}

document.querySelectorAll('.restart-lesson-btn').forEach(btn => btn.addEventListener('click', async () => {
  if(!await confirmDialog('Restart the whole lesson from the beginning?', { confirmLabel: 'Restart', danger: true })) return;
  performFullReset();
}));

/* =========================================================
   LESSON SELECT
   The landing screen shown before Stage 1 — see js/lessons.js
   for the registry and card rendering. Picking a card swaps every
   stage's content in place, then runs the same full reset as the
   Restart button, then reveals .wrap for the first time.
========================================================= */
function selectLesson(id){
  applyLessonContent(id);
  performFullReset(id);
  document.getElementById('lessonSelect').classList.add('hidden');
  document.getElementById('wrap').classList.remove('hidden');
}
renderLessonCards(selectLesson);

document.getElementById('changeLessonBtn').addEventListener('click', async () => {
  if(!await confirmDialog('Change lesson? This will restart the app and discard the current scores.', { confirmLabel: 'Change lesson', danger: true })) return;
  document.getElementById('wrap').classList.add('hidden');
  document.getElementById('lessonSelect').classList.remove('hidden');
});

/* =========================================================
   INIT
   Renders the default (comparatives) lesson content into the
   still-hidden .wrap so nothing is ever left blank — picking a
   lesson on the select screen re-renders all of this anyway via
   performFullReset(), this just avoids relying on that being the
   only path that ever populates the page.
========================================================= */
renderStepper();
renderAimHeader();
renderAimExamples();
renderLearnSlide();
renderPrintableRules();
renderWordBank();
renderScaffoldList();
initStopwatchDisplay();
// Stage 3 (Controlled practice) and Stage 4 (Guided practice) are
// deliberately NOT initialized here — goToStage() sets each of them
// up the first time the learner actually reaches that stage, so their
// countdown timers can't start ticking while the stage is still hidden.
