import { goToStage } from '../navigation.js';
import { escapeHtml } from '../utils.js';
import { getCurrentLesson } from '../lessons.js';
import { SURVEY } from '../content/survey.js';
import { printActivity } from './activityPrint.js';

/* =========================================================
   STAGE 7 — CLASS SURVEY (added 2026-11-22)
   The board explains the activity and shows a filled-in example row
   (built from the lesson's survey content). "Print survey" gives a
   handout with the same questions and empty rows: the example is on
   the board only, never on the printout.
========================================================= */
const SURVEY_PRINT_ROWS = 7;

function tableHead(){
  return `<tr><th class="sv-name">Name</th>${SURVEY.questions.map(q => `<th>${escapeHtml(q)}</th>`).join('')}</tr>`;
}

export function renderSurvey(){
  document.getElementById('surveyExample').innerHTML = `
    <table class="sv-table">
      <thead>${tableHead()}</thead>
      <tbody>
        <tr class="sv-example">
          <td class="sv-name">${escapeHtml(SURVEY.example.name)}</td>
          ${SURVEY.example.answers.map(a => `<td>${escapeHtml(a)}</td>`).join('')}
        </tr>
        <tr class="sv-empty"><td></td>${SURVEY.questions.map(() => '<td></td>').join('')}</tr>
      </tbody>
    </table>`;
}

document.getElementById('surveyPrintBtn').addEventListener('click', () => {
  const lesson = getCurrentLesson();
  const rows = Array.from({ length: SURVEY_PRINT_ROWS }, () =>
    `<tr><td></td>${SURVEY.questions.map(() => '<td></td>').join('')}</tr>`).join('');
  printActivity(`
    <div class="pa-survey">
      <h1>Class Survey</h1>
      <p class="pa-subtitle">${escapeHtml(lesson.title)}</p>
      <p class="pa-line">My name: ______________________________ &nbsp;&nbsp; Class: __________</p>
      <p class="pa-instructions">Walk around the class. Ask your friends the questions and write their answers!</p>
      <table class="pa-table">
        <thead>${tableHead()}</thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="pa-footer">${lesson.printFooter}</p>
    </div>`);
});

document.getElementById('surveyBackBtn').addEventListener('click', () => goToStage(6));
document.getElementById('surveyNextBtn').addEventListener('click', () => goToStage(8));
