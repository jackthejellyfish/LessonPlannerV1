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
import { goToStage, stopStageActivity } from './navigation.js';
import { speakerIconSVG, gaugeIconSVG } from './icons.js';
import { applyMuteState } from './audio.js';
import { confirmDialog } from './confirmDialog.js';
import { getLesson, renderLessonCards } from './lessons.js';
import { showGameIntroMenu } from './gameIntro.js';
import { initFpsMeter } from './fpsMeter.js';
import { isLowQuality, setLiteMode, onQualityChange } from './quality.js';

import { renderAimHeader, renderAimExamples } from './stages/stage1-aim.js';
import { renderLearnSlide, renderPrintableRules } from './stages/stage2-rules.js';
import './stages/stage3-controlled.js';
import './stages/stage4-guided.js';
import { renderWordBank, renderScaffoldList, resetStopwatch, initStopwatchDisplay } from './stages/stage5-free.js';
import './stages/stage9-questions.js';
import { GAMES, gameForStage } from './games.js';

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
import { applyLesson as applyDictationContent } from './content/dictation.js';
import { applyLesson as applySurveyContent } from './content/survey.js';
import { applyLesson as applyReadingContent } from './content/reading.js';
import { applyLesson as applyDiceContent } from './content/dice.js';
import { applyLesson as applyStage10Content } from './content/stage10-billiards.js';
import { applyLesson as applyStage11Content } from './content/stage11-neonarena.js';
import { applyLesson as applyStage12Content } from './content/stage12-fruitninja.js';
import { applyLesson as applyStage13Content } from './content/stage13-hoopshot.js';
import { applyLesson as applyStage14Content } from './content/stage14-whack.js';
import { applyLesson as applyStage15Content } from './content/stage15-maze.js';
import { applyLesson as applyStage16Content } from './content/stage16-ninjajump.js';
// Zombie Dash's review mix reads the other games' banks, so it is
// applied LAST, once they hold the new lesson.
import { applyLesson as applyStage17Content } from './content/stage17-zombies.js';

const CONTENT_APPLIERS = [
  applyStage1Content, applyStage2Content, applyStage3Content, applyStage4Content, applyStage5Content,
  applyDictationContent, applySurveyContent, applyReadingContent, applyDiceContent,
  applyStage6Content, applyStage7Content, applyStage8Content, applyStage9Content, applyStage10Content,
  applyStage11Content, applyStage12Content, applyStage13Content, applyStage14Content,
  applyStage15Content, applyStage16Content, applyStage17Content
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

// Lite mode by hand (js/quality.js): for a slow classroom PC. The button
// also follows lite mode when the PC switches it on by itself.
function syncLiteButton(){
  const btn = document.getElementById('liteModeBtn');
  const on = isLowQuality();
  btn.innerHTML = gaugeIconSVG(on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.title = on ? 'Lite mode is on: click for full quality' : 'Lite mode: smoother games on a slow PC';
}
syncLiteButton();
onQualityChange(syncLiteButton);
document.getElementById('liteModeBtn').addEventListener('click', () => setLiteMode(!isLowQuality()));

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

// The game list lives in js/games.js, shared with navigation.js.
function resizeCurrentStageCanvas(){
  const game = gameForStage(state.currentStage);
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
// --fs-footer-h in sync with each stage's footer's ACTUAL
// rendered height instead, re-running the current game's canvas resize
// whenever it changes so the canvas always sizes against the real
// available space, not an approximation (see the CSS var's definition
// in fullscreen-game.css for the bug this fixes — confirmed via
// measurement, not just guessed at).
//
// Since 2026-11-18 this covers NORMAL fullscreen too, not just compact
// mode. There the footer is position:fixed and the play area reserved a
// flat clamp(56px,8vh,76px) for it, but on a laptop-sized screen (or
// with 4 teams) the footer wraps to two lines and grows to ~120px. The
// extra 40-60px covered the bottom of the game - the Star Defender ship
// and the Hoop Shot ball were hidden entirely. tests/layout-fit.spec.js.
// The step bar at the top is measured the same way (its labels can wrap).
//
// Hidden check: offsetParent is ALWAYS null for a position:fixed element,
// so it can't tell a hidden stage's footer from a fixed visible one.
// getClientRects() is empty only for display:none (a hidden stage).
function syncChromeHeights(){
  if(!document.body.classList.contains('fullscreen-game')) return;
  const stage = document.getElementById(`stage${state.currentStage}`);
  const footer = stage && stage.querySelector('.stage-footer');
  if(footer && footer.getClientRects().length){
    const h = Math.ceil(footer.getBoundingClientRect().height) + 6;
    document.body.style.setProperty('--fs-footer-h', `${h}px`);
  }
  const stepper = document.getElementById('stepper');
  if(stepper && stepper.getClientRects().length){
    const h = Math.ceil(stepper.getBoundingClientRect().height) + 6;
    document.body.style.setProperty('--fs-stepper-h', `${h}px`);
  }
}
const chromeObserver = new ResizeObserver(() => {
  syncChromeHeights();
  resizeCurrentStageCanvas();
});
document.querySelectorAll('.stage-footer').forEach(f => chromeObserver.observe(f));
chromeObserver.observe(document.getElementById('stepper'));

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
  stopStageActivity();
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

function showLessonSelect(){
  // Leave the current stage cleanly before the picker covers it - this
  // used to stop only game rounds, so a Stage 3/4 countdown kept beeping
  // behind the picker.
  stopStageActivity();
  document.getElementById('wrap').classList.add('hidden');
  document.getElementById('lessonSelect').classList.remove('hidden');
}

document.getElementById('changeLessonBtn').addEventListener('click', async () => {
  if(!await confirmDialog('Change lesson? This will restart the app and discard the current scores.', { confirmLabel: 'Change lesson', danger: true })) return;
  showLessonSelect();
});

// The last stage's "Finish" — the end of the lesson, so no warning about
// discarding scores; the game is over by the time anyone presses it.
document.getElementById('zombieFinishBtn').addEventListener('click', showLessonSelect);

/* =========================================================
   INIT
   Renders the default (comparatives) lesson content into the
   still-hidden .wrap so nothing is ever left blank — picking a
   lesson on the select screen re-renders all of this anyway via
   performFullReset(), this just avoids relying on that being the
   only path that ever populates the page.
========================================================= */
initFpsMeter(); // only when ?fps is in the URL
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
