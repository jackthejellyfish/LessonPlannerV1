# Teacher Jack’s Lesson Planner — Project State

> Handover summary: what the app is, how it's built, the rules that keep it
> fast and stable, and how to change it. Current as of **v3.4 (2026-11-18)**.
> The full design history (why things are the way they are, per-game deep
> dives, superseded decisions) is in
> [archive/PROJECT_STATE-history.md](archive/PROJECT_STATE-history.md). It is
> reference only: where it disagrees with this file, this file wins.

---

## 1. What it is

An interactive ESL lesson, run by a teacher on a classroom screen (projector
or large board). Students don't use their own devices. The teacher picks a
lesson, then steps through 16 stages: teaching first, then team games that
quiz the same language.

- **Branding:** "Teacher Jack’s Lesson Planner", with Jack the jellyfish
  (`img/jellyfish.svg`, also the favicon) on the lesson picker. Every
  lesson's tab title and print footer end in the brand name (`js/lessons.js`).

- **Live site:** `classroom-games-omega.vercel.app`. Pushing to `main` on
  GitHub (`jackthejellyfish/LessonPlannerV1`) auto-deploys on Vercel in about
  30 seconds.
- **Stack:** plain HTML, CSS and native ES modules. No framework, no build
  step, no runtime dependencies apart from Google Fonts. `package.json` exists
  only for the Playwright tests.
- **Hardware target:** weak classroom PCs driving large displays. Frame rate
  matters more than visual polish (see section 5).

### Lessons (9), from `js/lessons.js`

| id | Title |
|---|---|
| `comparatives` | Comparative Adjectives |
| `health` | Health: Should & Shouldn't |
| `comparatives-superlatives` | Comparatives & Superlatives |
| `will-wont` | Will & Won't |
| `present-perfect` | Present Perfect |
| `amusement-park` | At the Amusement Park (past simple + -ing/-ed adjectives) |
| `party-fun` | Party Fun: Who Will…? (will for plans: Wh- and Yes/No questions, short answers) |
| `at-school` | At School: I’ve Got… / I Want… (have got / has got and want / wants, from the Unit 2 textbook pages) |
| `months-weather` | Months, Weather and Seasons (in + month, on + date, ordinals, It’s + weather, the seasons) |

### Stages (16), from `js/stepper.js`

| # | Stage | Kind |
|---|---|---|
| 1 | Aim | Lesson objective and 3 example sentences with icons |
| 2 | Learn | Rule cards and visual demos (one at a time) |
| 3 | Controlled | Multiple choice |
| 4 | Guided | Word-order sentence building |
| 5 | Free practice | Two slides: **1** the task, **2** your turn (timer, starters, word bank) |
| 6 | Balloon Pop | Team game, canvas: balloons float up with buoyancy, sway and springy strings; tap to pop |
| 7 | Star Defender | Team game, canvas shooter |
| 8 | Spin the Wheel | Team game |
| 9 | Practice questions | 4 sets: gap fill, unscramble, sentence, free writing |
| 10 | Billiards | Team game, canvas physics |
| 11 | Neon Arena | Team game, canvas |
| 12 | Fruit Ninja | Team game, canvas (bombs cost 5; a mega bomb halves the score; the blade never freezes) |
| 13 | Hoop Shot | Team game, canvas (fixed hoop, −/+ aim dock, SHOOT) |
| 14 | Whack! (Whack-a-Jelly) | Team game, canvas: jellyfish pop out of a grid of reef holes, 1-5 lanes x 3 rows (teacher picks lanes between turns) |
| 15 | Jelly Maze | Team game, canvas, 20s: Jack escapes a coral maze (escaping ends the turn, +1 per second left), sharks chase by BFS |
| 16 | Ninja Jump | Team game, canvas platformer, 10/15/20/30s (teacher picks between turns), one level per lap of turns, clearing it ends the turn; moving platforms, triple-jump power-up; ends with **Finish: choose a lesson** |

Every team game follows the same loop: a setup screen (rules plus teams and
colours) → a team answers a question → the team plays a short timed turn →
the result modal shows the standings → the next team → the game-over banner.

---

## 2. File map

```
index.html            all stage markup; modulepreload list for every js/ module
css/                  base.css (tokens, layout), fullscreen-game.css, modals.css,
                      game-intro.css, one stageN-*.css per stage
js/main.js            entry: wiring, lesson apply, full reset, compact mode
js/state.js           the single mutable `state`; createState() defines every field
js/lessons.js         lesson registry (titles, print titles, MC template)
js/navigation.js      goToStage(): cancels every game loop, fullscreen layout
js/stepper.js         STAGE_LABELS and the top step bar
js/games.js           GAMES registry: one row per team game (stage, prefix, hooks)
js/teamGameFlow.js    shared turn flow: result modal, end game, setup helpers
js/teamColorPicker.js team rows, colour palette, scoreboards
js/gameIntro.js       generates every game's setup/intro screen
js/canvasGame.js      createCanvasResizer(), createBackdrop(), buffer sizing
js/canvasEffects.js   particles, shockwaves, frameFactor(), stepParticles()
js/canvasGlow.js      drawGlow() (does nothing in lite mode)
js/canvasFloatText.js "+N" floating text on canvases
js/hud.js             timer bars: createTimerHud(), setTimerFill()
js/quality.js         adaptive lite mode: noteFrame(), particleCount(), isLowQuality()
js/fpsMeter.js        on-screen meter, only when the URL has ?fps
js/timerRing.js, audio.js, particles.js, confirmDialog.js, icons.js, utils.js
js/stages/stageN-*.js game and stage logic
js/content/stageN-*.js lesson content (plain data, keyed by lesson id)
img/jellyfish.svg     Jack the jellyfish: favicon and lesson-picker logo
tests/                Playwright specs (section 7)
LESSON_TEMPLATE.md    the form a teacher fills in to request a new lesson
archive/              original single-file app, and the full history doc
```

---

## 3. How the pieces fit

- **State.** `js/state.js` exports one live `state` object. Restarting a lesson
  reassigns it through `createState(lessonId, muted)`, so every importer sees
  the new object. Add a new field **once**, in `createState()`. Field names
  are deliberately flat and searchable (`state.whackTeams`, `state.popScore`),
  so keep that style.
- **Navigation.** `goToStage(n)` first calls `stopStageActivity()`, which
  stops **everything** a stage can leave running: the Stage 3/4 countdowns
  (and Stage 3's pause before its next question), the Stage 5 countdown,
  and every game's round. Restart and the lesson
  picker call it too. Anything new that runs on a timer or rAF must be
  stopped from there, or it plays sounds over other stages. Then it shows
  the target stage. Tapping the step you are already on does nothing. Game stages (any stage in `GAMES`) go full-viewport and move the
  scoreboard into the footer bar.
- **Game registry.** `js/games.js` is the single list of team games. It is in
  a harmless import cycle with navigation. Every function it references must
  be an `export function` declaration, never `export const fn = () => …`,
  otherwise the array can capture `undefined`.
- **Id prefix convention.** Each game uses one prefix (`pop`, `inv`, `wheel`,
  `billiards`, `neon`, `fruit`, `hoop`, `whack`, `maze`, `jump`) for all its ids:
  `popSetup`, `popGame`, `popTurnBanner`, `popTeamInputs`, and so on. The
  shared helpers (`readTeamsFromSetup`, `showGameScreen`, `renderTurnBanner`)
  depend on this.
- **Content vs logic.** Each content file in `js/content/` holds a
  `LESSON_CONTENT` object keyed by lesson id, plus an `applyLesson(id)` that
  mutates its exported arrays in place. `main.js` calls every content file's
  `applyLesson` when a lesson is chosen. Stage logic never hard-codes lesson
  text. Tuning constants and colour palettes stay in the stage files, not in
  content.
- **Canvas games.** Use `createCanvasResizer()`. It handles debounced resizing
  and buffer sizing, and caches the canvas and context. Neon, Fruit and Hoop
  use opaque canvases (`alpha:false`): get their context **only** through
  `resizer.getContext()`, and paint the backdrop instead of calling
  `clearRect` (an opaque canvas clears to black).
- **Fullscreen bar heights are measured, not guessed.** In a game the step
  bar is fixed to the top and the footer (team pills, timer, Back/Next) to
  the bottom. A ResizeObserver in `main.js` writes their real heights to
  `--fs-stepper-h` / `--fs-footer-h`, and `.stage-body` pads by those. The
  old fixed guess broke on laptops (125% scaling gives about 1536x730): the
  footer wrapped to two lines and hid the Star Defender ship and the Hoop
  Shot ball. `tests/layout-fit.spec.js` checks every game at 3 laptop sizes.
- **Compact mode** (`body.compact-game`): shrinks a fullscreen game to a
  centred card so younger students can reach the edges. Any game that holds
  pixel positions has to re-map them on resize. Billiards does this in
  `remapBilliardsToCanvas()`.

---

## 4. Adding things

**A new lesson.** Fill in `LESSON_TEMPLATE.md`, then:
1. Add an entry to `LESSONS` in `js/lessons.js`.
2. Add a `'<id>': {...}` block to **every** `js/content/stage*.js`. Plan for
   10–14 vocabulary items, and vary the phrasing and subject between games.
3. Stage 2 is the only stage where the grammar's shape matters. Rule cards
   render as `base → base+suffix`, which covers suffix grammar
   (tall → taller), modal sentences ("He" + " should rest") and two-point
   lessons (sentence-style examples). New icons go in `buildCompareIcon()` /
   `buildAimIcon()` as simple flat SVGs.
4. Stages 1, 2, 5 and 9 are hand-written content. Check them by eye: both
   Stage 5 slides must fit at 1280x720 without scrolling (a test enforces
   this).

**A new game.**
1. Create three files: `js/stages/stageN-x.js`, `js/content/stageN-x.js` and
   `css/stageN-x.css`.
2. Add a `<section class="stage hidden" id="stageN">` to `index.html`.
3. Add a label to `STAGE_LABELS`.
4. Add one row to `GAMES` in `js/games.js`.
5. Add a side-effect import of the stage module to `main.js`.
6. Add the new module(s) to the `modulepreload` list in `index.html`. A test
   fails if that list and `js/` disagree.
7. Reuse `renderGameIntro()`, `readTeamsFromSetup()`, `showGameScreen()`,
   `renderTurnBanner()`, `showTurnResultModal()`, `createTimerHud()` and
   `createCanvasResizer()`.
8. The game loop must have a cancel function, call `noteFrame()` and
   `frameFactor()`, and wrap particle counts in `particleCount()`.

---

## 5. Performance rules (most important)

Measured with `tests/perf-games.spec.js` at **2560x1440 with the CPU slowed
6×**. Every game now runs at about 60fps, down from 21–29 before v3.1. Between
turns the main thread is 0% busy in every game; on the idle Stage 1 page it
was 38%. On a fast dev machine fps always shows 60, so judge changes by the
main-thread numbers (busy %, layouts/s, style recalcs/s).

1. **Animate only `transform` and `opacity`.** Never animate `filter`,
   `box-shadow`, `background-*`, `width`/`height`/`top`/`left`, and never use
   `backdrop-filter`. For glows and flashes, fade the opacity of an overlay
   (`::after`).
2. **Don't write the same DOM value every frame.** Timer bars go through
   `js/hud.js`: they drain with `scaleX`, and the text is written only when the
   second changes. Never set a `.timer-bar-fill`'s width.
3. **Don't redraw a canvas that hasn't changed.** Billiards and Hoop Shot
   render on demand (`invalidateBilliards()` / `invalidateHoop()`). Every
   other game draws one still frame between turns and runs no loop.
4. **Never leave a `requestAnimationFrame` loop running in the background.**
   Every loop has a cancel function, and `goToStage()` calls all of them.
5. **Make every step frame-rate independent:** `k = frameFactor(dt)`, and use
   `pow()` for multiplicative constants. At 60fps `k = 1`, so existing tuning
   stays valid.
6. **No `shadowBlur` on canvases.** Cache static scenery (`createBackdrop()`,
   the Billiards table layer).
7. **Don't "fix" a paint cost by promoting a huge layer.** It measured worse.
   Static is best.
8. **For one-off DOM effects, use the Web Animations API** (the score
   "bump" in Balloon Pop). That avoids rAF style-flush tricks, `setTimeout`
   cleanup and forced reflows.
9. **CSS animations override inline styles.** Never put a `transform`
   animation on an element whose transform JS sets.
10. **On canvas, strokes, clips and many small detail fills cost more than
   they look.** Measured 2026-11-18 at 1440p, CPU slowed 6x: a `clip()` per
   balloon cost ~7fps, round-capped curved tentacles ~3fps, Fruit Ninja's
   rotated-ellipse fruit details ~6fps, a glow behind every fruit ~10fps.
   Pre-rendering shapes to sprites and blitting them rotated was SLOWER
   here (52 to 36fps), so don't reach for that first. Fewer, simpler fills
   and one batched stroke per frame are what worked.

**Lite mode** (`js/quality.js`): after 3 consecutive seconds under 45fps the
session switches to lite mode. Particles are halved, glows are dropped,
canvas buffers drop to 70%, and `body.low-quality` stops decorative CSS loops.
Gameplay is unchanged. `?lite=1` / `?lite=0` force it on or off.

**To check a real classroom PC:** open the site with `?fps` to show fps, the
worst frame, and whether lite mode is on.

---

## 6. Gotchas that have bitten before

- **`.stage-body` must use `justify-content:flex-start`** (or `safe center`,
  as Stages 1, 3 and 4 do). Plain `center` plus `overflow:hidden` clips
  overflowing content from both ends, silently.
- **Balloon Pop** (rebuilt 2026-11-18 from the DOM "Ball Pop") simulates in
  world units where the play area is 100 tall, so balloons stay round on
  any screen shape; hit-testing converts the tap the same way. The file
  and `pop` prefix kept their old names (`stage6-ballpop.js`).
- **Same-click race.** If a click handler attaches a new click listener to an
  ancestor, the *same* click can trigger it. Attach it with `setTimeout(fn, 0)`.
- **`renderGameIntro()`** runs at the top of each stage module, before that
  module queries the buttons the intro creates. Don't centralise it.
- **`.hidden` is `display:none !important`.** Don't put it in static markup on
  something CSS needs to show later.
- **Don't reuse `.learn-dots` outside Stage 2.** The tests count them.
- **Fruit Ninja:** tune `FRUIT_GRAVITY` and the launch speed together.
  Anti-scribble rules (2026-11-18, students scribbled with the mouse for
  huge scores): bombs are 17% of throws and cost 5; two mega bombs a round
  launch inside a cluster of bait fruit and halve the score. The blade
  NEVER freezes: a freeze (and an overheat gauge) were tried the same day
  and the class read a frozen blade as the game lagging. Measured with a
  scripted scribble against careful single swipes: scribble 67-117 points
  originally, 41-51 now; careful play 85-100.
- **Ninja Jump physics** moves by the average of the old and new vertical
  speed each frame, so jump height is identical at 20fps and 60fps. The
  levels are built on those heights (single jump 4.4 tiles, double 7.3,
  triple 10.2, spring 9.9, running jump clears about 5.9 tiles), so don't
  swap it back to a plain `v * dt`. A spring ALWAYS launches 9.9 tiles
  (`springBoost`): it used to follow the hold-jump rule, so a child who just
  walked onto one got ~5 tiles and Spring Valley's ledges were unreachable.
  Moving platforms pause at each end of their trip, level with the ledge
  they serve: without the pause they were level for an instant and stepping
  off meant falling. The level rules are written above `LEVELS`.
- **Whack-a-Jelly lanes** are `state.whackColumns` (1-5, default 4), set
  from the picker on the play area between turns. Every lane has 3 rows of
  holes and each jelly comes out of a random free one: the first version
  had one vent per lane, and a class just tapped the same spot over and
  over (2026-11-19). Rows are drawn back to front, each row's rock lips
  over its jellies, which is what makes them come up out of the holes.
- **Hoop Shot** is 2 shots a turn (was 3, changed 2026-11-19).
- **Up to 6 teams** per game (`MAX_TEAMS` in `js/teamColorPicker.js`,
  raised from 4 on 2026-11-19). With 5-6 teams the setup rows go two
  across and the result screen lays out 3 + 3 (`:has()` rules in
  `game-intro.css` / `modals.css`). Every game is still 10 turns, so with
  6 teams some teams get one more turn than others.
- **Lesson picker** wraps 5 cards a row once there are 9 lessons (5 + 4),
  so it stays two rows on a 720p board.
- **Stage 5's timer slide must fit 1280x720** (a test checks every
  lesson). Keep a new lesson's task headline to two lines and its steps
  to one line each, or the stopwatch is pushed off the bottom.
- **Teacher pickers on a play area** (`.game-picker` in `css/base.css`):
  Whack-a-Jelly's lanes and Ninja Jump's round length
  (`state.jumpSeconds`). Shown only while the play area is `.idle`.
- **The question is always the centre of attention** (feedback
  2026-11-18). Every game's question modal (`.modal-question` in
  `css/modals.css`) fills most of the screen over a dark backdrop, with the
  text sized off both height and width; Stage 3's question and Stage 9's
  prompts are the biggest text on their screens. Keep it that way when
  adding a stage. Prompt wording is "Which is correct?" / "Is this
  correct?", not "...right?".
- **Test-only hooks.** A few game modules export `debug...` functions
  (`debugMoveJackToExit`, `debugCollectAllStars`, `debugJumpInternals`,
  `debugBalloonTargets`, `debugWhackTargets`) so tests can reach a game
  state without playing it by hand. Nothing in the app calls them.
- **Hover lifts need room.** A button that lifts or scales on hover inside
  an `overflow:hidden`/`auto` box gets its top sliced off. The step bar and
  the Stage 9 tabs have a few px of padding for this.
- **Billiards** uses a deliberately spread layout, not a real rack. A tight
  rack absorbs the cue ball's energy and nothing gets pocketed.
- **No emoji anywhere** (UI, text or comments). Use monochrome symbols
  (✓ ✗ ← → ↺ ♥ ✕), text, or SVGs from `js/icons.js`.
- Use `confirmDialog()`, never the browser's `confirm()`.
- **A delayed "next question" is a timer too.** Stage 3 used a bare
  `setTimeout` to move on after an answer; leaving the stage inside that
  ~1s let it fire, and question 2's countdown beeped behind Guided practice.
  Keep the id and clear it in the stage's cancel function.
- **Stage 9 is set up once per lesson** (`state.qsStarted`), so students'
  answers survive moving to another stage and back.

---

## 7. Testing

```
npm install && npx playwright install chromium   # once
npm test                                         # serial (workers: 1); serves on :8934
```

| Spec | Covers |
|---|---|
| `full-regression` | every stage with zero console errors; modulepreload list matches `js/`; Stage 5 fit |
| `layout-fit` | every game's play area clears the step bar and footer at 1280x720, 1366x768, 1536x730, and in compact mode |
| `lessons` | every lesson through every stage |
| `team-games`, `new-games` | real played turns through the result modal |
| `quality` | lite mode off by default, forced on, auto-triggers; `?fps` meter; Billiards survives compact mode |
| `perf`, `perf-games` | fps floors and the per-game main-thread survey at 1440p, CPU 6× slower (load `?lite=0`) |

Tests run serially on purpose: running them in parallel made the game-loop
specs flaky.

---

## 8. Known limitations and ideas not yet done

- **Caching on Vercel was left at the defaults on purpose.** File names have
  no version stamps, so aggressive caching could mix old and new modules just
  after a deploy.
- `color-mix()` (team tints) needs a 2023+ browser. Older browsers fall back
  to untinted cards.
- Stage 9's answers are lost on a page refresh, and when switching between
  its section tabs (each tab re-renders its section fresh).
- Ideas not started: a teacher settings panel (edit questions, round
  lengths), more question sets, and tuning after classroom testing.
