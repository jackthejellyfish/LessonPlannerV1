# Classroom Lesson App — Project State

> Handover summary: what the app is, how it's built, the rules that keep it
> fast and stable, and how to change it. Current as of **v3.2 (2026-11-14)**.
> The full design history (why things are the way they are, per-game deep
> dives, superseded decisions) is in
> [archive/PROJECT_STATE-history.md](archive/PROJECT_STATE-history.md). It is
> reference only: where it disagrees with this file, this file wins.

---

## 1. What it is

An interactive ESL lesson, run by a teacher on a classroom screen (projector
or large board). Students don't use their own devices. The teacher picks a
lesson, then steps through 14 stages: teaching first, then team games that
quiz the same language.

- **Live site:** `classroom-games-omega.vercel.app`. Pushing to `main` on
  GitHub (`jackthejellyfish/LessonPlannerV1`) auto-deploys on Vercel in about
  30 seconds.
- **Stack:** plain HTML, CSS and native ES modules. No framework, no build
  step, no runtime dependencies apart from Google Fonts. `package.json` exists
  only for the Playwright tests.
- **Hardware target:** weak classroom PCs driving large displays. Frame rate
  matters more than visual polish (see section 5).

### Lessons (7), from `js/lessons.js`

| id | Title |
|---|---|
| `comparatives` | Comparative Adjectives |
| `health` | Health: Should & Shouldn't |
| `comparatives-superlatives` | Comparatives & Superlatives |
| `will-wont` | Will & Won't |
| `present-perfect` | Present Perfect |
| `amusement-park` | At the Amusement Park (past simple + -ing/-ed adjectives) |
| `party-fun` | Party Fun: Who Will…? (will for plans: Wh- and Yes/No questions, short answers) |

### Stages (14), from `js/stepper.js`

| # | Stage | Kind |
|---|---|---|
| 1 | Aim | Lesson objective and 3 example sentences with icons |
| 2 | Learn | Rule cards and visual demos (one at a time) |
| 3 | Controlled | Multiple choice |
| 4 | Guided | Word-order sentence building |
| 5 | Free practice | Two slides: **1** the task, **2** your turn (timer, starters, word bank) |
| 6 | Ball Pop | Team game, DOM balls plus a canvas effects layer |
| 7 | Star Defender | Team game, canvas shooter |
| 8 | Spin the Wheel | Team game |
| 9 | Practice questions | 4 sets: gap fill, unscramble, sentence, free writing |
| 10 | Billiards | Team game, canvas physics |
| 11 | Neon Arena | Team game, canvas |
| 12 | Fruit Ninja | Team game, canvas |
| 13 | Hoop Shot | Team game, canvas (fixed hoop, −/+ aim dock, SHOOT) |
| 14 | Whack! | Team game, DOM; ends with **Finish: choose a lesson** |

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
  Ball Pop's particle loop and every game's round. Restart and the lesson
  picker call it too. Anything new that runs on a timer or rAF must be
  stopped from there, or it plays sounds over other stages. Then it shows
  the target stage. Tapping the step you are already on does nothing. Game stages (any stage in `GAMES`) go full-viewport and move the
  scoreboard into the footer bar.
- **Game registry.** `js/games.js` is the single list of team games. It is in
  a harmless import cycle with navigation. Every function it references must
  be an `export function` declaration, never `export const fn = () => …`,
  otherwise the array can capture `undefined`.
- **Id prefix convention.** Each game uses one prefix (`pop`, `inv`, `wheel`,
  `billiards`, `neon`, `fruit`, `hoop`, `whack`) for all its ids:
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
   render on demand (`invalidateBilliards()` / `invalidateHoop()`). Ball Pop's
   loop parks when no round is running.
4. **Never leave a `requestAnimationFrame` loop running in the background.**
   Every loop has a cancel function, and `goToStage()` calls all of them.
5. **Make every step frame-rate independent:** `k = frameFactor(dt)`, and use
   `pow()` for multiplicative constants. At 60fps `k = 1`, so existing tuning
   stays valid.
6. **No `shadowBlur` on canvases.** Cache static scenery (`createBackdrop()`,
   the Billiards table layer).
7. **Don't "fix" a paint cost by promoting a huge layer.** It measured worse.
   Static is best.
8. **For one-off DOM effects, use the Web Animations API on pooled
   elements** (see Ball Pop's `playPopFx`). That avoids rAF style-flush
   tricks, `setTimeout` cleanup and forced reflows.
9. **CSS animations override inline styles.** Never put a `transform`
   animation on an element whose transform JS sets (Ball Pop's balls).

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
- **Ball Pop:** clear `.pop-ball-layer`, never the whole `#popPlayArea`; the
  play area also holds the canvas. If a ball's CSS width changes, update its
  `radiusFactor` in `renderPopCanvas()` so the glow still matches the hit area.
- **Same-click race.** If a click handler attaches a new click listener to an
  ancestor, the *same* click can trigger it. Attach it with `setTimeout(fn, 0)`.
- **`renderGameIntro()`** runs at the top of each stage module, before that
  module queries the buttons the intro creates. Don't centralise it.
- **`.hidden` is `display:none !important`.** Don't put it in static markup on
  something CSS needs to show later.
- **Don't reuse `.learn-dots` outside Stage 2.** The tests count them.
- **Fruit Ninja:** tune `FRUIT_GRAVITY` and the launch speed together.
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
- Ball Pop's swarm placement doesn't avoid live bombs or gems (rare overlap).
- Stage 9's answers are lost on a page refresh, and when switching between
  its section tabs (each tab re-renders its section fresh).
- Ideas not started: a teacher settings panel (edit questions, round
  lengths), more question sets, and tuning after classroom testing.
