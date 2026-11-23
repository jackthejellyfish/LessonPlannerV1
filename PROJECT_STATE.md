# Teacher Jack’s Lesson Planner — Project State

> Handover summary: what the app is, how it's built, the rules that keep it
> fast and stable, and how to change it. Current as of **v3.6 (2026-11-22)**.
> The full design history (why things are the way they are, per-game deep
> dives, superseded decisions) is in
> [archive/PROJECT_STATE-history.md](archive/PROJECT_STATE-history.md). It is
> reference only: where it disagrees with this file, this file wins.

---

## 1. What it is

An interactive ESL lesson, run by a teacher on a classroom screen (projector
or large board). Students don't use their own devices. The teacher picks a
lesson, then steps through 21 stages: teaching first, then team games that
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
| `food-drink` | Food and Drink: Some and Any (countable / uncountable nouns, a / an, some / any, there is / are, ordering in a restaurant) |

### Stages (21), from `js/stepper.js`

| # | Stage | Kind |
|---|---|---|
| 1 | Aim | Lesson objective and 3 example sentences with icons |
| 2 | Learn | Rule cards and visual demos (one at a time; the ← dots → slide nav sits in the footer) |
| 3 | Controlled | Multiple choice; a thin progress line, then a big timer and score centred above the question |
| 4 | Guided | Word-order sentence building, 20s a sentence (same practice bar) |
| 5 | Free practice | Two slides: **1** the task (steps + example), **2** your turn: the task in one line, a big timer and three big sentence starters, with the word bank a tab away |
| 6 | Running dictation | How-to slide; **Print sentences** gives six big sentences on one A4 page to cut out; the teacher reveals them one by one so pairs can check (`js/stages/dictation.js`, content `js/content/dictation.js`) |
| 7 | Class survey | How-to slide with a filled-in example row; **Print survey** gives the handout (same questions, empty rows, no example) (`js/stages/survey.js`, content `js/content/survey.js`) |
| 8 | Reading | ~100-word reading and six graded questions; tap a card once for the question, again for the answer. Prints: reading + answer sheet (2 pages, double-sided) and the six questions as cut-out strips (`js/stages/reading.js`, content `js/content/reading.js`) |
| 9 | Speaking dice | Six questions; click the felt tray to throw a colour-per-face dice (simulated bounces, spin and tip-overs); the question it lands on opens in the big card with phrases and a word bank; the same number twice in a row crosses that question out. Tiles can be opened by hand too (`js/stages/dice.js`, content `js/content/dice.js`) |
| 10 | Balloon Pop | Team game, canvas: balloons float up with buoyancy, sway and springy strings; tap to pop |
| 11 | Star Defender | Team game, canvas shooter: the ship follows the pointer, hold to fire, frequent power-ups (Rapid Fire, Spread Shot, Shield, Bomb) caught by shooting or flying into them |
| 12 | Spin the Wheel | Team game, answer first: a right answer earns a spin and the slice's points (a wrong one: no spin); pegs and a flapping pointer, two ★ bonus slices a game (Double / Triple / Steal) |
| 13 | Practice questions | The worksheet on the board: gap fill, unscramble and sentences side by side on one screen; tap a question (or a section's Show) to reveal its answer. Free writing is on the printed sheet only |
| 14 | Billiards | Team game, canvas physics |
| 15 | Neon Arena | Team game, canvas, 10s rounds (cut from 20s 2026-11-23): hold to fire, timed power-ups that turn up often |
| 16 | Fruit Ninja | Team game, canvas (each volley comes from a random edge: bottom, top, left, right or a corner; bombs cost 5; a mega bomb halves the score; the blade never freezes) |
| 17 | Football | Team game, canvas penalty shoot-out (rebuilt from Hoop Shot; ids keep the `hoop` prefix): tap the goal to aim, KICK, 3 kicks a turn; a swaying keeper who dives late, sometimes a hopping wall |
| 18 | Whack! (Whack-a-Jelly) | Team game, canvas: jellyfish pop out of a grid of reef holes, 1-5 lanes x 3 rows (teacher picks lanes between turns); every lane gets the same deal. One question per lane before each turn ("Lane 2 of 4"), then the team plays together |
| 19 | Jelly Maze | Team game, canvas, 20s: Jack escapes a coral maze (escaping ends the turn, +1 per second left), sharks chase by BFS |
| 20 | Ninja Jump | Team game, canvas platformer, 8 levels (3 easy, 3 medium, 2 hard). The teacher picks the level and the time (10/15/20/30s) between turns; each lap of turns moves on a level; clearing it ends the turn. Moving platforms, fans (updrafts and side winds), springs; triple jump, speed boost and a golden shuriken (+3) at random spots each round. 12 levels since 2026-11-22, with environment themes (jungle, desert, snow, volcano) |
| 21 | Zombie Dash | Team game, canvas, top-down, for young classes: Pip collects sweets while goofy zombies shuffle after them; beach balls to kick (a fast one bonks a zombie, +2), Cure Potion / Super Sneakers / Bubble Blast, 10 levels incl. jungle, desert, snowy mountain and volcano (teacher picks; each lap moves on). Questions are a review mix from the other games. Ends with **Finish: choose a lesson** |

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
js/questionChoices.js multiple-choice versions of the turn questions (askTeamQuestion)
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
  `popSetup`, `popGame`, `popTurnBanner`, `popTeamInputs`, and so on (`zombie` for Stage 17). The
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

**Stage numbers vs file names.** Stages 6-7 (2026-11-22) and 8-9
(2026-11-23) were inserted after Free practice, so every game moved up
four (Balloon Pop is stage 10, Zombie Dash 21) but kept its file name
(`stage6-ballpop.js` etc.). Go by the
`GAMES` registry and the `<section id="stageN">`, not the file name. The
new stages' files have no number (`dictation.js`, `survey.js`).

**A new lesson.** Fill in `LESSON_TEMPLATE.md`, then:
1. Add an entry to `LESSONS` in `js/lessons.js`.
2. Add a `'<id>': {...}` block to **every** `js/content/stage*.js`, plus
   six sentences in `js/content/dictation.js`, two questions with an
   example row in `js/content/survey.js`, a reading with six questions
   in `js/content/reading.js`, and six dice questions (phrases + words)
   in `js/content/dice.js`. Plan for
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
3. **Don't redraw a canvas that hasn't changed.** Billiards renders on
   demand (`invalidateBilliards()`). Every game draws one still frame
   between turns and runs no loop (Football's keeper sways, so it loops
   during its round only).
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
- **Ninja Jump levels and pick-ups** (2026-11-20). `LEVELS` runs easiest
  first, each with a `diff` that colours its picker button. Pick-ups are
  not in the maps: `golden`, `triple` and `speed` list candidate spots and
  each round picks one (so a class can't learn them); a load-time check
  logs an error if a spot isn't open air. Fans are map tiles: `F` blows
  up to the first plank above it and sets the ninja down on it (the lift
  fades over its last 1.5 tiles), `<` / `>` blow along their row. Winds
  don't act inside an updraft (Windy Peak's wind crosses its fans). A
  test stands the ninja on every fan and checks where it lands.
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
- **Football** (stage 13, was Hoop Shot) is 3 kicks a turn.
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
- **Multiple-choice turn questions** (feedback 2026-11-20). Every team
  game except Spin the Wheel asks through `askTeamQuestion(q, bank,
  turnIndex)` in `js/questionChoices.js`. Every other turn (2nd, 4th, ...)
  is multiple choice when the question allows it; the first is always
  open, which the tests rely on. Options are built from the question's
  shape ("Which is correct? 'a / b'", "In or on?", "Is this correct?" ->
  Yes/No, "Put the words in order" -> the prompt's chunks swapped, else
  two similar answers from the same bank). Where that guesses wrong, give
  the question its own `choices: [right, wrong, ...]` (three Whack-a-Jelly
  questions do). The app marks a multiple-choice answer itself.
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
- **World units, not percentages** (Neon Arena, 2026-11-22). Neon kept
  x and y as separate percentages of width and height, so on a 2:1
  board everything moved, aimed and collided twice as far sideways
  ("feels squashed"). It now uses the Balloon Pop / Whack scheme: the
  arena is 100 units tall and `worldW` wide. Zombie Dash goes further:
  a fixed 160x90 field, scaled to fit and centred.
- **Sharper buffers cost frames.** Neon Arena and Zombie Dash raise the
  shared 820px buffer cap to 1024 (`maxBufferWidth`). Measured on Neon at
  2560x1440, CPU 6x: 820px 57fps, 1024px 55fps, 1280px 40fps. Don't go
  past 1024 for an action game.
- **One game loop per round** (Billiards, 2026-11-22, "black screen
  crash"). Billiards never stopped its loop at the end of a turn, so
  every turn stacked another one (5 turns = 5x physics speed), and
  between turns nothing repainted after a resize. It now stops at the
  turn's end, repaints on resize, and survives a bad frame. It was also
  the only game using `ctx.roundRect`, which older Chrome/Safari lack;
  use `roundRectPath()` (or arcTo) for rounded shapes.
- **Fair lanes** (Whack-a-Jelly, 2026-11-22). Each lane is a student,
  so the next jelly goes to the lane that has had the fewest (never more
  than one ahead), and every lane draws the same jelly / golden / puffer
  sequence. Random free holes were fair only on average.
- **One question per lane** (Whack-a-Jelly, 2026-11-23). Each player on
  the team answers a question before the turn (`askTeamQuestion(q, bank,
  n, { label: 'Lane 2 of 4' })`; `label` is shown above the question in
  the shared modal). `state.whackQuestionsAsked` walks the shuffled bank
  and reshuffles when it runs out; still 10 turns a game. After the
  last question a "Get ready!" panel waits for the teacher's **Go!**
  (`#whackGoBtn`) so players can reach their lanes. Tests that start a
  turn must answer until `#popQuestionOverlay` is hidden, then click Go.
- **Speaking dice physics** (2026-11-23). Each throw is simulated in full
  before it plays (`simulate()` in `js/stages/dice.js`: 1/120 s steps,
  bounces, rim, friction, tip-overs every dice-width) and played back as
  transforms; the face sequence is built afterwards to end on the number
  rolled. It always settles (hard cap 2.4 s, ~1.2 s typical) and is safe
  with a constant `Math.random`, which the regression test relies on.
- **Scrambles must be scrambled.** Use `scramble()` from `js/utils.js`,
  never `shuffle()`, for unscramble tasks: it guarantees the words don't
  come out in (or nearly in) the right order. Stage 9 seeds it with
  `seededRandom(answer)` so the board and the printed sheet match.
- **Zombie Dash's questions** come from the other games' banks
  (`js/content/stage17-zombies.js`, applied LAST in `main.js`), so a new
  lesson needs no block for it. `bankOf(q)` gives multiple-choice turns
  like-for-like wrong options.
- **The turn-result screen** is a grid of equal cards (one column per
  team, 3 + 3 for five or six), a "+N this turn" tag on the team that
  just played and "In the lead" on the leader. `teamGameFlow.js` works
  out the turn's points from the last total it showed.
- **Environment themes** (2026-11-22). Ninja Jump levels take a
  `theme` (`jungle`, `desert`, `snow`, `volcano`; none = the dojo look):
  it changes the backdrop, block / plank colours and how `^` is drawn
  (thorns, cactus, icicles, lava), never the rules. Zombie Dash levels
  are themed by their obstacle and zone types (palm, log, cactus, pine,
  lava; river, quicksand, snow, ash).
- **Football's keeper** saves with exactly what's drawn: a line from his
  feet to his gloves, tipped by his dive (`keeperTouches`). Capping the
  tilt (`KEEPER_MAX_TILT`) is what leaves the top corners open.
- **Taken team colours** stay full colour with a cross and the owner's
  team number (a faded swatch read as a different, pastel colour).
- **Billiards** uses a deliberately spread layout, not a real rack. A tight
  rack absorbs the cue ball's energy and nothing gets pocketed.
- **No emoji anywhere** (UI, text or comments). Use monochrome symbols
  (✓ ✗ ← → ↺ ♥ ✕), text, or SVGs from `js/icons.js`.
- Use `confirmDialog()`, never the browser's `confirm()`.
- **A delayed "next question" is a timer too.** Stage 3 used a bare
  `setTimeout` to move on after an answer; leaving the stage inside that
  ~1s let it fire, and question 2's countdown beeped behind Guided practice.
  Keep the id and clear it in the stage's cancel function.
- **Stage 9 is set up once per lesson** (`state.qsStarted`), so answers
  already revealed stay revealed when you move to another stage and back.

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
| `soak` (opt-in: `SOAK=1`) | plays every game for many turns with 6 teams, leaves rounds half-way, restarts; checks memory, DOM nodes and listeners stay flat |

Tests run serially on purpose: running them in parallel made the game-loop
specs flaky.

---

## 8. Known limitations and ideas not yet done

- **Caching on Vercel was left at the defaults on purpose.** File names have
  no version stamps, so aggressive caching could mix old and new modules just
  after a deploy.
- `color-mix()` (team tints) needs a 2023+ browser. Older browsers fall back
  to untinted cards.
- Stage 9's revealed answers are lost on a page refresh.
- Ideas not started: a teacher settings panel (edit questions, round
  lengths), more question sets, and tuning after classroom testing.
