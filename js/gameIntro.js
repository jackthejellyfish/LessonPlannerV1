/* =========================================================
   SHARED GAME INTRO SCREEN

   Every team game's setup screen was ~55 lines of near-identical
   hand-written HTML in index.html: a paragraph of prose rules, a
   legend strip, the team rows, two buttons — all stacked in one
   centred column that left most of a classroom display empty.

   This replaces all six with one screen that shows ONE thing at a
   time, in three views:

     menu   — the game's name, then "New game" / "How to play"
     howto  — the rules, then Next for what each thing is worth
     teams  — team names and colours, then Start game

   The point is that a class arriving at a new game sees two large
   choices rather than a wall of rules and inputs at once, and that
   whichever view IS showing gets the whole screen to fill.

   Only one view is in flow at a time, selected by `data-view` on the
   host element (see css/game-intro.css), so switching views costs a
   single attribute write and no re-render.

   WHY EACH STAGE CALLS THIS ITSELF, rather than main.js doing all
   six: every stage module wires its own buttons (`#fruitStartBtn`
   and friends) at import time. If this ran afterwards it would
   replace those elements and silently drop their listeners. Calling
   it at the top of each stage module — before that module queries
   anything — keeps the ordering correct and local, and matches the
   existing convention that a stage owns its own setup.

   The team-view ids are exactly the ones the old markup used
   (`${prefix}TeamInputs` / `${prefix}AddTeamBtn` / `${prefix}StartBtn`),
   so no stage logic and no test selector had to change.
========================================================= */

// `scoring` entries are { swatch, label, points, tone } where `swatch`
// is the existing per-game legend markup (those CSS classes are already
// defined in each stage's own stylesheet, so they're reused verbatim
// rather than reinvented here) and `tone` tints the points value:
// 'bonus' for rewards, 'bad' for penalties, omitted for plain scoring.
//
// Each item is a CARD (reworked 2026-11-22: "hard to see what each thing
// does"): the icon big on top, the name under it in large type that
// wraps rather than being cut off, and the points as a big coloured
// badge. A row with the points at the far end made students match a
// "+3" to its icon across half the screen.
function scoringRow({ swatch, label, points, tone }){
  const toneClass = tone === 'bad' ? ' gi-bad' : tone === 'bonus' ? ' gi-bonus' : '';
  return `
    <li class="gi-score-row${toneClass}">
      <span class="gi-score-swatch"><span class="gi-score-swatch-inner">${swatch}</span></span>
      <span class="gi-score-label">${label}</span>
      ${points ? `<span class="gi-score-points">${points}</span>` : ''}
    </li>`;
}

// As many columns as fit the count nicely: 4 or fewer in one row, then
// 3 + 3 for five or six, 4 + 4 for seven or eight.
function scoringColumns(n){
  if(n <= 4) return n;
  if(n <= 6) return 3;
  return 4;
}

function stepsSlide(steps){
  return `
    <h3 class="gi-slide-title">How to play</h3>
    <ol class="gi-steps">
      ${steps.map(step => `<li>${step}</li>`).join('')}
    </ol>
  `;
}

function scoringSlide(scoring, tip){
  return `
    <h3 class="gi-slide-title">What everything is worth</h3>
    <ul class="gi-scoring" style="--cols:${scoringColumns(scoring.length)}">${scoring.map(scoringRow).join('')}</ul>
    ${tip ? `<p class="gi-tip">${tip}</p>` : ''}
  `;
}

export function renderGameIntro(setupId, { prefix, title, steps, scoring = [], tip = '' }){
  const host = document.getElementById(setupId);
  if(!host) return;

  // Spin the Wheel has no per-item scoring, so its how-to is a single
  // slide; every other game gets rules then points.
  const slides = scoring.length
    ? [stepsSlide(steps), scoringSlide(scoring, tip)]
    : [stepsSlide(steps) + (tip ? `<p class="gi-tip">${tip}</p>` : '')];

  host.classList.add('game-intro');
  host.dataset.view = 'menu';
  host.innerHTML = `
    <section class="gi-view gi-menu">
      <h2 class="gi-game-title">${title}</h2>
      <div class="gi-menu-actions">
        <button class="gi-menu-btn gi-menu-btn-primary" id="${prefix}NewGameBtn" type="button">
          <span class="gi-menu-btn-label">New game</span>
          <span class="gi-menu-btn-sub">Pick teams and play</span>
        </button>
        <button class="gi-menu-btn" id="${prefix}HowToBtn" type="button">
          <span class="gi-menu-btn-label">How to play</span>
          <span class="gi-menu-btn-sub">Rules and points</span>
        </button>
      </div>
    </section>

    <section class="gi-view gi-howto" aria-label="How to play">
      <div class="gi-slide" id="${prefix}HowToSlide"></div>
      <nav class="gi-slide-nav">
        <button class="btn btn-ghost" id="${prefix}HowToPrevBtn" type="button">← Back</button>
        <div class="gi-slide-dots" id="${prefix}HowToDots"></div>
        <button class="btn btn-primary" id="${prefix}HowToNextBtn" type="button">Next →</button>
      </nav>
    </section>

    <section class="gi-view gi-teams" aria-label="Team setup">
      <h3 class="gi-slide-title">Who is playing?</h3>
      <div class="pop-team-inputs" id="${prefix}TeamInputs"></div>
      <div class="pop-setup-actions">
        <button class="btn btn-ghost" id="${prefix}AddTeamBtn" type="button">+ Add team</button>
        <button class="btn btn-primary gi-start" id="${prefix}StartBtn" type="button">Start game</button>
      </div>
      <button class="gi-back-link" id="${prefix}TeamsBackBtn" type="button">← Back</button>
    </section>
  `;

  /* ---- view switching ---- */
  const setView = (view) => { host.dataset.view = view; };
  document.getElementById(`${prefix}NewGameBtn`).addEventListener('click', () => setView('teams'));
  document.getElementById(`${prefix}TeamsBackBtn`).addEventListener('click', () => setView('menu'));

  /* ---- how-to slideshow ---- */
  let slideIndex = 0;
  const slideEl = document.getElementById(`${prefix}HowToSlide`);
  const dotsEl = document.getElementById(`${prefix}HowToDots`);
  const prevBtn = document.getElementById(`${prefix}HowToPrevBtn`);
  const nextBtn = document.getElementById(`${prefix}HowToNextBtn`);

  function renderSlide(){
    slideEl.innerHTML = slides[slideIndex];
    dotsEl.innerHTML = slides.map((_, i) =>
      `<span class="gi-slide-dot${i === slideIndex ? ' active' : ''}"></span>`).join('');
    // Back on the first slide leaves the how-to entirely rather than
    // being a dead button; Next on the last one does the same, so the
    // deck always has a way out at both ends.
    prevBtn.textContent = slideIndex === 0 ? '← Back' : '← Previous';
    nextBtn.textContent = slideIndex === slides.length - 1 ? 'Got it →' : 'Next →';
  }

  prevBtn.addEventListener('click', () => {
    if(slideIndex === 0){ setView('menu'); return; }
    slideIndex--;
    renderSlide();
  });
  nextBtn.addEventListener('click', () => {
    if(slideIndex === slides.length - 1){ setView('menu'); return; }
    slideIndex++;
    renderSlide();
  });
  document.getElementById(`${prefix}HowToBtn`).addEventListener('click', () => {
    slideIndex = 0;
    renderSlide();
    setView('howto');
  });

  renderSlide();
}

// Returns a game's intro to the menu. The setup screen is re-shown by
// several flows that don't go through this module — Play Again, Change
// teams, Restart lesson, picking a new lesson — and without this it
// would reappear on whichever view happened to be open when the game
// started, usually the team list.
export function showGameIntroMenu(prefix){
  // `${prefix}Setup` is the same id convention every game already uses
  // for this container, and the one renderGameIntro was handed.
  const host = document.getElementById(`${prefix}Setup`);
  if(host) host.dataset.view = 'menu';
}
