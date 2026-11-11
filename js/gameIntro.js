/* =========================================================
   SHARED GAME INTRO SCREEN

   Every team game's setup screen was ~55 lines of near-identical
   hand-written HTML in index.html: a paragraph of prose rules, a
   legend strip, the team rows, two buttons — all stacked in one
   centred column. On a wide classroom display that left roughly
   two thirds of the screen empty while the rules themselves were a
   dense sentence nobody reads aloud mid-lesson.

   This replaces all six with one two-column layout: how to play on
   the left, team setup on the right. Rules become three numbered
   steps written to be read off a screen at the back of a room, and
   the scoring legend becomes a labelled list rather than a row of
   bare swatches.

   WHY EACH STAGE CALLS THIS ITSELF, rather than main.js doing all
   six: every stage module wires its own buttons (`#fruitStartBtn`
   and friends) at import time. If this ran afterwards it would
   replace those elements and silently drop their listeners. Calling
   it at the top of each stage module — before that module queries
   anything — keeps the ordering correct and local, and matches the
   existing convention that a stage owns its own setup.

   The generated ids are exactly the ones the old markup used
   (`${prefix}TeamInputs` / `${prefix}AddTeamBtn` / `${prefix}StartBtn`),
   so no stage logic and no test selector had to change.
========================================================= */

// `scoring` entries are { swatch, label, points, tone } where `swatch`
// is the existing per-game legend markup (those CSS classes are already
// defined in each stage's own stylesheet, so they're reused verbatim
// rather than reinvented here) and `tone` tints the points value:
// 'bonus' for rewards, 'bad' for penalties, omitted for plain scoring.
function scoringRow({ swatch, label, points, tone }){
  const toneClass = tone === 'bad' ? ' gi-bad' : tone === 'bonus' ? ' gi-bonus' : '';
  return `
    <li class="gi-score-row">
      <span class="gi-score-swatch">${swatch}</span>
      <span class="gi-score-label">${label}</span>
      ${points ? `<span class="gi-score-points${toneClass}">${points}</span>` : ''}
    </li>`;
}

export function renderGameIntro(setupId, { prefix, steps, scoring = [], tip = '' }){
  const host = document.getElementById(setupId);
  if(!host) return;
  host.classList.add('game-intro');
  host.innerHTML = `
    <section class="gi-rules" aria-label="How to play">
      <h3 class="gi-heading">How to play</h3>
      <ol class="gi-steps">
        ${steps.map(step => `<li>${step}</li>`).join('')}
      </ol>
      ${scoring.length ? `
        <h4 class="gi-subheading">Points</h4>
        <ul class="gi-scoring">${scoring.map(scoringRow).join('')}</ul>` : ''}
      ${tip ? `<p class="gi-tip">${tip}</p>` : ''}
    </section>

    <section class="gi-setup" aria-label="Team setup">
      <h3 class="gi-heading">Teams</h3>
      <div class="pop-team-inputs" id="${prefix}TeamInputs"></div>
      <div class="pop-setup-actions">
        <button class="btn btn-ghost" id="${prefix}AddTeamBtn" type="button">+ Add team</button>
        <button class="btn btn-primary gi-start" id="${prefix}StartBtn" type="button">Start game</button>
      </div>
    </section>
  `;
}
