# Comparative Adjectives — ESL Lesson: Project State Document

> **Purpose of this document:** Complete handoff summary for continuing development in a new chat session. Covers architecture, all 14 stages, the full state object, key patterns, known quirks, and pending work.

---

## Overview

A **modular, multi-file** interactive ESL lesson built in HTML/CSS/JS (no frameworks, no build tools — plain native ES modules, no external dependencies beyond Google Fonts). Entry point: `index.html`. Deployed to GitHub → Vercel (auto-deploy on push), served as-is with no build step.

Originally a single 4,273-line `comparatives-lesson_29.html` file (kept for reference in `archive/`); refactored into the module layout below with no behavior changes — every stage, timer, game mechanic, and known quirk documented below is unchanged.

- **Target language:** Comparative adjectives (English)
- **User:** Jack — British EFL teacher, Da Nang Vietnam, 6+ years experience, iPGCE starting Sept 2026
- **Context:** Classroom resource for secondary/EFL students. Displayed on a classroom screen (teacher-led), not individual student devices.

---

## Architecture

### Global layout
```
body (100dvh, overflow:hidden, flex column)
  └── .wrap (flex:1, min-height:0, flex column)
        ├── nav.stepper (flex-shrink:0)
        └── <section class="stage"> (flex:1, one visible at a time)
              ├── h2 (flex-shrink:0)
              ├── .stage-body (flex:1, min-height:0, overflow:hidden, justify-content:flex-start)
              └── .stage-footer (flex-shrink:0)
```

**Critical layout rule:** `.stage-body` must be `justify-content:flex-start` (NOT center). Center + overflow:hidden clips top content invisibly — a bug we hit multiple times.

### Navigation
`goToStage(num)` — the single navigation function. Called for every stage change. **Always** cancels ALL running loops before switching:
```js
cancelMcTimer();
cancelSemiTimer();
cancelPopRound();
stopPopParticleLoop();
cancelInvRound();
cancelPlinkoRound();
cancelBirdsRound();
cancelCometRound();
```
Lazy-init: Stages 3, 4, and 9 initialise only on first visit via their respective flags/functions.

### State object (complete)
```js
let state = {
  currentStage, completedStages, expandedRules, demoIndex,
  // Stage 3 (Controlled)
  mcIndex, mcScore, mcAnswered, mcTimerRAF, mcStarted,
  // Stage 4 (Guided)
  semiIndex, semiScore, semiBank, semiAnswer, semiChecked, semiTimerRAF, semiStarted,
  // Stage 6 (Ball Pop)
  popTeams, popCurrentTeam, popQuestionOrder, popTurnsPlayed,
  popScore, popRoundActive, popRoundRAF,
  popParticles, popParticleRAF,
  popBallAnims,        // array of {el, xPct, yPct, color, scale, alpha, special, swarm, gem, bomb}
  popSpecialUsedThisRound, popSwarmRemaining,
  popBombTimeouts, popActiveBombs,
  popGemTimeouts, popActiveGems,
  popBgBlobs,          // animated background bokeh blobs for ball pop canvas
  // Stage 7 (Star Defender)
  invTeams, invCurrentTeam, invQuestionOrder, invTurnsPlayed,
  invScore, invLives, invRoundActive, invRoundRAF,
  invShip: {x, targetX},
  invProjectiles, invEnemies, invPickups, invParticles, invStars,
  invRapidFireUntil, invMachineGunUntil, invLastAutoFireAt, invLastShotAt,
  invBossSpawnedThisRound, invBossTimeout,
  // Stage 8 (Spin the Wheel)
  wheelTeams, wheelCurrentTeam, wheelQuestionOrder, wheelTurnsPlayed,
  wheelUsedSegments,    // parallel boolean array, one per WHEEL_QUESTIONS segment
  wheelRoundActive, wheelRoundRAF, wheelParticles,
  // Stage 10 (Plinko)
  plinkoTeams, plinkoCurrentTeam, plinkoQuestionOrder, plinkoTurnsPlayed,
  plinkoUnlockedBalls, plinkoRoundActive, plinkoRoundRAF,
  plinkoBalls, plinkoRoundResults, plinkoPegs, plinkoPegPoints, plinkoParticles,
  // Stage 11 (Sky Slingshot)
  birdsTeams, birdsCurrentTeam, birdsQuestionOrder, birdsTurnsPlayed,
  birdsLevelIndex, birdsShotsLeft, birdsTurnScore,
  birdsBlocks, birdsPigs,   // live level state, in % of canvas
  birdsBird,                // the in-flight bird, in px, or null
  birdsRoundActive, birdsRoundRAF, birdsParticles,
  // Stage 12 (Comet Chaos)
  cometTeams, cometCurrentTeam, cometQuestionOrder, cometTurnsPlayed,
  cometLevelIndex, cometShotsLeft, cometTurnScore,
  cometComet,               // the in-flight comet, in px, or null
  cometRoundActive, cometRoundRAF, cometParticles, cometStars,
  // Stage 13 (Billiards)
  billiardsTeams, billiardsCurrentTeam, billiardsQuestionOrder, billiardsTurnsPlayed,
  billiardsTurnScore,
  billiardsBalls,           // cue ball + object balls this turn: {x,y,vx,vy,r,value,color,isCue,pocketed}
  billiardsShotFired,       // true once the cue ball is struck, until the shot resolves
  billiardsRoundActive, billiardsRoundRAF, billiardsParticles,
  // Stage 14 (Neon Arena)
  neonTeams, neonCurrentTeam, neonQuestionOrder, neonTurnsPlayed,
  neonScore, neonLives,
  neonPlayer: {x, y},        // free-roam WASD/arrow-key movement — this app's first
  neonBullets, neonEnemies, neonPickups, neonParticles, neonStars,
  neonPowerActive, neonOverdriveActive, neonSpreadActive,  // rest-of-round pickup effects
  neonLastShotAt, neonInvulnUntil,
  neonRoundActive, neonRoundRAF, neonBossSpawnedThisRound, neonBossTimeout,
  // Global
  muted
};
```

### CSS custom properties (`:root`)
```css
--primary: #5C8A82    /* sage-teal */
--primary-dark: #4A726B
--success: #5C9C7C    --success-bg: #E9F3EC
--error: #C1665C      --error-bg: #F8ECEA
--timer: #C97A3D      /* amber — countdown rings, bomb glow */
--hazard: #E4574B     /* dark-canvas game warning red — bomb, boss-hit flash; separate from --error, see base.css comment */
--rule-a: #5C8A82  --rule-b: #8577A8  --rule-c: #C97B6C  --rule-d: #BF9A54
--ink, --muted, --line, --surface, --paper
--font-display: 'Bricolage Grotesque', sans-serif    --font-body: 'Inter', sans-serif
--radius: 16px
```

### Sound system
Web Audio API only — no audio files. `ensureAudio()` creates the `AudioContext` lazily (browsers require user gesture first). The `beep(freq, duration, type, volume, when)` function is the base primitive. All sfx built from `beep()` or direct oscillator/noise patterns.

### Two rendering approaches
- **DOM elements** (Ball Pop balls, chips, modals): Used when elements need individual click handlers and there are few of them
- **Canvas** (Ball Pop particles/glow, Star Defender everything): Used for many simultaneously moving things. Pattern: clear → draw background → draw entities → draw particles → draw HUD overlay

---

## Stage-by-Stage Reference

### Stage 1 — Aim
- Static page with the lesson objective
- Three illustrated SVG examples of target language (elephant/mouse, mountains, speed lines)
- `.example-sentence` styling: bold, `var(--rule-b)` color; `.hl` for the comparative word in `var(--rule-c)`

### Stage 2 — Learn the Rule
Four accordion rule cards in a 2×2 CSS grid. **All four can be open simultaneously** for comparison — uses `state.expandedRules` (a `Set`, not a single index).

Compare-demo below: parametric SVG icons (tower, car, bag, path) sized by valueA/valueB. `buildCompareIcon(type, valuePct, color)` generates all icons from one function.

Print button → populates `#printableRules` → `@media print` shows only that element.

**`#stage2 .stage-body` scrolls internally (`overflow-y:auto`), unlike every other stage.**
With all 4 rule cards open at once, the accordion's content height genuinely exceeds the
available space — the shared `.stage-body{overflow:hidden}` was silently clipping the
compare-demo section off the bottom the moment enough cards were open (a real reported bug,
not a rare edge case). Fixed with a Stage-2-specific override in `base.css` right after the
`justify-content:center` block — see the comment there for why Stage 2 is deliberately
excluded from that centering rule too (centering + `overflow:hidden` clips from both ends).

**`.rule-list` has `padding-top:14px`** — a second, smaller edge-clipping issue found by
testing, not just reading the CSS: `.rule-row:not(.open):hover` lifts a card `translateY(-2px)`
and adds a shadow that blurs ~10px above its own resting edge. For a card in the grid's top row,
that combined ~12px of upward bleed left the hovered card's border sitting almost flush against
the stage panel's own top edge — confirmed by forcing the hover state via script and measuring:
the row's `top` landed 2px *above* `.stage-body`'s own `top`. The padding gives the lift/shadow
real headroom without touching the hover animation itself (this app's shared bouncy hover
language is deliberate and used everywhere — see "Site-wide hover language" below — so the fix
is spacing, not a weaker hover).

### Stage 3 — Controlled Practice (MC)
- 10 questions, `MC_TIME_LIMIT = 10` seconds each
- Circular countdown ring (SVG `stroke-dashoffset` on a `<circle>`)
- Score pill with `@keyframes scorePop` (grow + glow + settle) — a CSS animation class triggered via `void el.offsetWidth` reflow trick
- Lazy-init: `state.mcStarted` flag

### Stage 4 — Guided Practice (Word Order)
- 10 sentence-build items — students click chips into correct order
- `MC_TIME_LIMIT = 30` seconds per sentence
- Same circular timer as Stage 3
- Lazy-init: `state.semiStarted` flag

### Stage 5 — Free Practice
- Configurable countdown timer: `type="text"` inputs (not number, to control zero-padding)
- `±1 minute` adjust buttons work both while stopped (adjust config) and while running (nudge live remaining time)
- **Fixed `width:260px`** on the container (not max-width) — prevents resize when Start↔Pause label changes
- Two cards side-by-side: Sentence Starters (5 frames) + Word Bank (prominent, gold-tinted bg)

### Stage 6 — Ball Pop Challenge
**Team-turn game: answer question → pop balls for 10 seconds**

#### Ball types (CSS classes on DOM buttons):
| Class | Width | Key property |
|---|---|---|
| `.pop-ball` | 11% | Normal — random color gradient |
| `.pop-ball.special` | 9% | "Power orb" — white-hot core, dashed orbiting ring (`::before`), pulsing flare (`::after`); pops into 4 swarm balls via a mega explosion, not the normal pop feedback |
| `.pop-ball.swarm` | 8% | Spawned by special ball |
| `.pop-ball.gem` | 5% | Pink/purple/cyan gradient, +3 pts, 2s fuse |
| `.pop-ball.bomb` | 6% | Octagon clip-path, hazard stripes, −1 on click |
| `.pop-ball.multi` | 7% | New (2026-07-16) — electric-blue 8-point starburst (`clip-path`, not a circle), exactly 1 per round, 2.6s fuse. Doubles EVERY point value for the next 4s, positive AND negative (a bomb costs −2 during the window too) — "everything doubles, no exceptions" was chosen over "only normal pops double" as a rule simple enough for a room of players to track by ear |

**The multiplier ball** (`state.popMultiplierUntil`, a timestamp; `popMultiplierActive()` checks
`performance.now()` against it) follows the exact same independent-schedule architecture as
bombs/gems (`scheduleMultiForRound`/`spawnPopMulti`/`removeMulti`/`clearAllMulti`, all four
lifecycle exit points wired the same as bombs/gems) but spawns only ONE per round, since it
affects ALL subsequent scoring rather than being a routine pickup. Every scoring call site
(normal ball, swarm ball, the special ball's own point, the gem, the bomb) reads
`popMultiplierActive()` at the moment of the click and passes the actual awarded amount through
to the shared feedback functions (`popBallFeedback`/`popGemFeedback`/`popBombFeedback` all
gained an `amount`/`penalty` parameter, default 1, shown directly instead of a hardcoded "+1"/
"−1"/"+3") — a doubled normal pop shows "+2", a doubled gem shows "+6", a doubled bomb shows
"−2". `#popPopsDisplay` gets a `.multi-active` class for the WHOLE 4-second window (checked once
per frame in the round's own `tick()`), not just a one-off flash on pop, so the score number
itself keeps glowing cyan as a continuous reminder.

**Gems get their own signature pop effect** (`spawnPopSparkles`, 2026-07-16) — small 8-point
sparkle glyphs (`.pop-sparkle`, CSS `clip-path` diamond-star) flying outward and fading, layered
on top of the shared shockwave+particles+text every ball type already gets. Added per feedback
asking for more distinct per-type "fun visual effects" — before this, a gem pop was really just
a bigger version of a normal pop (2 particle bursts instead of 1); now all 4 types have a
genuinely distinct signature (bomb: shake + red; special: triple-ring mega explosion; gem:
sparkle burst; normal: the plain shared feedback).

**Special ball's mega explosion** (`spawnMegaExplosion`, replaces the shared `popBallFeedback`
for this one ball type only): three staggered `.pop-shockwave.mega` rings (the middle one
flashes white), ~4x the particles at higher speed/size (`spawnPopParticles` gained optional
`speedMult`/`sizeMult` params, default 1, so every other call site is unaffected), "BONUS!"
floating text instead of "+1", and a brief warm `.pop-play-area.mega-flash` pulse across the
play area's border. `sfxMegaExplosion()` layers a filtered-noise boom (same technique as
Plinko's `sfxExplosion`) under a rising fanfare.

#### Canvas layer (z-index 20, `pointer-events:none`):
Particle canvas sits above the CSS-gradient play area background but below `.pop-ball-layer` (z-index 21). It renders:
- Animated bokeh background blobs (`state.popBgBlobs`)
- Pulsing glow rings around each live ball (radius derived from real CSS width — must stay in sync)
- Physics particles on pop

#### Key constants:
```js
POP_ROUND_SECONDS = 10
POP_SPECIAL_CHANCE = 0.18    // ~18% chance of special ball per spawn
POP_GEM_COUNT = 3            // gems per round
POP_GEM_FUSE_MS = 2000
POP_BOMB_FUSE_MS = 3000
// bombs: 1-2 per round, scheduled via setTimeout
```

#### Non-overlapping placement:
- `getNonCollidingPosition(minDistancePct)` — rejection sampling, checks all live `popBallAnims`
- `getSwarmPositions(count)` — grid partition (subdivides play area into cells, one ball per cell)

#### Lifecycle:
All 4 exit points (natural finish, cancel, stop particle loop, restart) call:
`clearAllBombs()` + `clearAllGems()` + `state.popBallAnims = []` + clear ball layer

### Stage 7 — Star Defender
**Fully canvas-rendered space shooter (10 seconds per round by default — see the play-or-bank
choice below, which can extend this)**

#### Enemy types:
Speed history, same day: ~10% ("ever so slightly"), then +20%, then another +20% on top of
THAT (three separate rounds of "faster" feedback — the table below reflects all three, net
≈×1.58 vs. the original numbers). Each round multiplies the already-bumped code rather than
re-deriving from scratch (`(24 + Math.random()*9) * 1.2 * 1.2`, etc.), so the history stays
legible in the source rather than collapsing into one opaque final number.

| Type | Shape | HP | Speed | Points | Radius |
|---|---|---|---|---|---|
| `scout` | Diamond | 1 | 17.3-23.8 %/s | 1 | 3.6% |
| `brute` | Hexagon | 3 | 7.9-11.5 %/s | 3 | 5.5% → shrinks on hit |
| `dart` | Thin diamond | 1 | 34.6-47.5 %/s | 2 | 2.0% |
| `boss` | 6-plate armored hull + pulsing core + dashed counter-rotating shield ring | 10 | 4.3-6.5 %/s | 15 | 11% |

Boss spawns via `scheduleBossForRound(durationSeconds)` — 40% chance, once per round, at a
random point in the round (the spawn window now scales with the round's ACTUAL duration, not
always the base 10s, so a banked/extended round doesn't cluster the boss into just the first few
seconds). Killing the boss specifically triggers a canvas screen-shake (`triggerInvShake`) —
the same small `ctx.translate` trick Sky Slingshot's impact feedback uses — since a boss kill is
the single biggest moment in this game.

**Play-or-bank choice (2026-07-16, new mechanic)**: after answering the question, each team
chooses — via the shared `confirmDialog` — to either play the round right now, or bank this
round's 10s to make a LATER round longer instead (banking is per-team, tracked as
`team.bankedSeconds`, reset to 0 whenever that team chooses to play). Banking never starts a
round at all — `state.invScore` stays at its default 0 and `finishInvRound()` is called directly,
which already just reads whatever's in `state.invScore` and advances the turn, so "resolve this
turn with zero score, no round played" falls out of the existing turn-resolution code for free
rather than needing a separate path. `startInvRound(durationSeconds)` takes the actual round
length as a parameter (base 10s + whatever's banked) instead of a hardcoded constant, threaded
through the round timer/HUD display/`scheduleBossForRound` alike.

#### Pickups (fall from top, shot to collect):
| Type | Color | Effect | Shape |
|---|---|---|---|
| `rapid` | Gold `#FFD23F` | 4s faster click cooldown (90ms) | Dot |
| `shield` | Pink `#FF6B8B` | +1 life (max 3) | Heart |
| `machinegun` | Orange `#FF8C42` | 5s auto-fire every 60ms | Rectangle |

#### Movement pattern:
- Click on canvas → ship lerps toward click X (`x += (targetX - x) * 0.22`)
- Laser fires immediately from current ship position on click
- Rapid fire: 3-shot spread, 90ms cooldown
- Machine gun: auto-fires in tick loop, no click needed

#### Life loss visual feedback:
`triggerLifeLostFeedback()` → `@keyframes invLifeLost` (red border glow on play area) + `@keyframes livesLost` (glow on ♥ icons). Both use the `void el.offsetWidth` reflow trick to retrigger.

#### Delta-time movement:
`dt = Math.min(50, now - lastTime)` passed to `updateInvGame(dt)`. All velocities are in `%/second`. Guarantees consistent speed regardless of frame rate.

#### Team scores:
CSS custom property `--tc:${team.color}` set inline on each `<li>`. CSS uses `color-mix(in srgb, var(--tc) 14%, var(--surface))` for background tint, `box-shadow` with `var(--tc)` for active glow.

### Stage 8 — Spin the Wheel
**Replaces the original Bamboozle tile game entirely** (removed, not kept alongside — `stage8-
bamboozle.js`/`.css` and `content/stage8-bamboozle.js` were deleted, along with `state.bzTeams/
bzCurrentTeam/bzFreezeNext/bzTileData` and the `.bz-grid`/`.bz-tile`/`.bz-game-layout`
fullscreen CSS rules). Same stage slot (between Star Defender and Practice Questions), same
fullscreen team-game shell, deliberately much simpler mechanics than Bamboozle's steal/swap/
wipeout/freeze reward system per the explicit ask — "keep this one simple... but add some fun
dynamic visuals/sounds."

**Mechanic:** a canvas-drawn 10-segment wheel, one segment per `WHEEL_QUESTIONS` entry
(`content/stage8-spinwheel.js`, each `{prompt, answer, points}`). Point values are deliberately
**scattered, not sorted by difficulty or monotonically increasing around the wheel** (1, 5, 10,
15, 20, 25, 30, 50, 100, 200) — a later revision from the original 10-30 range, per feedback
asking for much more variance ("have some 100, 200, then a singular 1"). This is a genuine
"wheel of fortune" feel on purpose: landing on a jackpot segment is luck, not a harder question —
an easy word can sit on the 200 segment and a harder one on the 1. "Spin" animates the wheel
through
`SPIN_EXTRA_TURNS=6` full rotations with an ease-out deceleration
(`computeTargetAngle()`/`spinWheelTo()`) and lands **exactly on the next question in a shuffled
order** (`state.wheelQuestionOrder` — identical shuffle-once-consume-one-per-turn pattern every
other game here uses) — the segment it visually stops on IS that question's real segment, not
decoration, so the spin is a genuine (if simple) mechanic. Landing reveals the question via
`showQuestionModal`; a self-marked-correct answer awards that segment's points. Once spun, a
segment is excluded from future landings (`state.wheelUsedSegments[i]=true`) but keeps its full
original color — an earlier version dimmed used segments to gray, removed 2026-07-16 per
explicit feedback to "remove that colour change"; the underlying used-segment bookkeeping for
picking the next question is untouched, only the two rendering-time color/opacity ternaries
(the segment fill and its point-value text) were deleted.

**Fun-factor additions, kept lightweight:** a ticking sound each time the spin crosses a
segment boundary (`sfxTick()`, triggered by comparing `Math.floor(traveled/SEG_ANGLE)` between
frames — naturally speeds up early, slows near the stop as the wheel decelerates), a bright
landing flash + confetti-style particle burst (`spawnWheelConfetti`) sized to the point value,
and a glowing pointer fixed at the top (drawn outside the wheel's own `ctx.rotate()` transform,
same "fixed indicator, rotating dial" technique any wheel-of-fortune needs).

`currentWheelAngle` is module-level, not in `state` — same "transient render/animation state,
not core game data" reasoning as Plinko's hover-preview vars and Sky Slingshot's trail array.

### Stage 9 — Practice Questions
**4 sets of increasing difficulty + printable worksheet**

| Set | Type | Mechanic |
|---|---|---|
| Gap Fill | `gap` | `<input class="qs-gap">` inline in sentence |
| Unscramble | `scramble` | Same chip-click mechanic as Stage 4 |
| Sentence Writing | `sentence` | Free `<textarea>`, teacher-checked |
| Free Writing | `free` | Open `<textarea>`, teacher-checked |

**All questions in the current section render at once** (`renderQsSection()` builds one
`.qs-q-card` per question into `.qs-q-list`, replacing an earlier one-question-at-a-time
flow). "Check answers" grades every question in the section together — gap/scramble cards
get `.correct`/`.incorrect` styling and a running score, sentence/free cards get `.reviewed`
(no auto-grade, teacher/partner checks) — then "Next section →" advances `qsState.setIndex`.
Per-question state lives in `qsState.scrambleState[qi]` (`{bank, answer}` per scramble
question, since multiple scramble questions each need independent chip banks now, not one
shared `qsState.bank`/`qsState.answer`). `qsState.completedSets` (a `Set`) drives the
`.qs-tab.completed` styling across re-renders.

**Wrong answers can be fixed and rechecked** — `checkSection()` and `checkSingleQuestion(qi)`
no longer lock in an incorrect gap-fill input or scramble question forever. A gap-fill
`<input>` is only `disabled` once it's actually correct (`inp.disabled = correct`, not
unconditionally `true`); a scramble question's chips only lock once its card carries the
`correct` class (`isScrambleQuestionLocked(qi)`, checked per-question — not the old global
`qsState.checked` flag, which would have kept EVERY scramble question's chips frozen after the
first "Check answers" click, correct or not). Both grading functions now start with
`clearGradeClasses(card)` (strips stale `correct`/`incorrect`/`reviewed` off the card and its
input/strip) before re-grading, so calling either one twice never leaves double classes
stacked from the first attempt. After `checkSection()`, if anything's still wrong the "Check
answers" button re-appears relabelled **"Check again"** (rather than disappearing in favor of
only "Next section →") so a class can fix their mistakes and re-submit the whole section as
many times as needed; `renderQsSection()` resets the button back to its default label when
moving to a new section. `checkSingleQuestion(qi)`'s Enter-to-check guard now only blocks a
question that's already `correct` (or `reviewed`, for the ungraded types) — an `incorrect` one
stays checkable.

**Enter-to-check grades only the ONE question the focus is in**, not the whole section —
`checkSingleQuestion(qi)` finds the focused input's `.qs-q-card[data-qi]` and grades just that
card (marks correct/incorrect, disables its input, plays the same sfx as a full check), then
stops; it deliberately does not touch `qsState.score`/the progress pill/the Next button, which
stay driven only by the real "Check answers" button. This replaced an earlier version where
Enter clicked the section-wide Check button — technically correct but surprising in practice:
a teacher who'd only answered question 1 so far and hit Enter got every still-blank question
2-5 flagged incorrect too. `checkSection()` (the real Check-answers handler) is unaffected by
any prior individual checks — it re-grades every question from its current (possibly already-
disabled) input value regardless, so the two paths never produce conflicting state. As before,
Enter is ignored when the focused element is a `<textarea>`, so it still inserts a newline for
the free/sentence sets instead of submitting.

The Unscramble and Free Writing sections can be taller than the available space (5 cards with
chip-wrap, or long-form textareas) — `.qs-question-area` uses `overflow-y:auto` +
`justify-content:flex-start` (not `center`) for exactly the reason described in Critical
Pattern #4: this is genuinely unbounded content, so it scrolls internally rather than being
force-fit or clipped. Gap Fill (5 short cards) fits without scrolling at the standard
1600×1000 viewport; the others may need a scroll, which is expected, not a bug.

Print → `renderPrintableWorksheet()` populates `#printableWorksheet` → `@media print` uses `.active-print` class to show only that element (not the whole app). Answer key included for gap fill + unscramble sets only.

Both print systems (rules + worksheet) use the same `active-print` mechanism.

---

## Critical Patterns to Preserve

### 1. Never allow `requestAnimationFrame` loops to run in the background
Every loop has a cancel function. `goToStage()` calls ALL of them unconditionally. This was the source of the biggest class of bugs in this project.

### 2. Glow ring radius must match real CSS ball width
The canvas glow ring for Ball Pop balls is derived from each ball type's actual CSS `width` percentage, halved for radius. If you change a ball's CSS size, update the corresponding `radiusFactor` in `renderPopCanvas()`:
```js
let radiusFactor = 0.075;  // normal: 15% wide
if(anim.special) radiusFactor = 0.06;   // 12%
if(anim.swarm)   radiusFactor = 0.055;  // 11%
if(anim.gem)     radiusFactor = 0.035;  // 7%
```
Mismatch causes the ring to appear larger than the clickable area — confusing for players.

### 3. CSS animation + JS transform conflict
If JS sets `style.transform` every frame (Ball Pop ball scale/position), CSS animations must NOT also target transform. Use `filter` or `box-shadow` for CSS-animated effects on the same elements.

### 4. `justify-content:center` + `overflow:hidden`
Clips from both top AND bottom when content overflows. Always use `flex-start` for `.stage-body`. This caused the Free Practice timer to appear sliced at the top.

### 5. `innerHTML = ''` deletes ALL children
The Ball Pop canvas is a sibling of `.pop-ball-layer` inside `#popPlayArea`. The layer gets cleared between rounds, not the whole play area. Clearing the whole container would remove the canvas. Always target `.pop-ball-layer` specifically.

### 6. CSS custom properties as per-instance parameters
Team color cards: `style="--tc:${team.color}"` on each `<li>`, CSS reads `var(--tc)`. One shared CSS rule, per-instance variation — no JS style manipulation needed.

### 7. `color-mix()` for tinted backgrounds
`color-mix(in srgb, var(--tc) 14%, var(--surface))` creates a tinted background from any team color without precomputing hex values. Modern browsers only (Chrome 111+, Firefox 113+, Safari 16.2+).

### 8. Same-click race when attaching a "next click" listener to an ancestor of the button just clicked
If button A is *inside* container C, and A's click handler synchronously (or via a promise
microtask within the same task) attaches a NEW click listener directly to C, that SAME click
event can still reach C's new listener during its own bubble phase — the listener didn't
exist when the event started, but gets included because it was added before the event
finished propagating. Symptom: an action meant to require a *second, separate* click fires
immediately using stale coordinates from the first click. Hit this once already in
`teamColorPicker.js` (fixed) and initially missed it in `stage10-plinko.js`'s ball-drop flow
(`waitForPlinkoDrop` — picking a ball from a menu inside `#plinkoBallPicker` immediately
"dropped" the ball at the menu's location instead of waiting for the real board click). Fix:
defer attaching the new listener with `setTimeout(fn, 0)` so it only attaches after the
originating click has fully finished dispatching. Watch for this pattern any time a click
handler both closes/replaces a menu AND wires up a "click elsewhere to continue" listener on
a shared ancestor in the same step.

---

## File Structure
```
index.html                     Semantic markup only — all 13 <section class="stage">
                                blocks, the shared modals, <link> tags for every
                                css/*.css file, and one <script type="module" src="js/main.js">

css/
  base.css                     :root variables, reset, body background, .wrap,
                                lesson-header, stepper, stage panel layout, buttons,
                                .hidden, particle-burst, mute-toggle, timer-circle ring,
                                reduced-motion
  modals.css                   .overlay / .modal (shared question + result popups)
  team-color-picker.css        .team-color-swatch / .team-color-popover (setup-screen color picker)
  stage2-rules.css             Rule accordion + compare-demo
  stage3-controlled.css        Score row, progress bar, mc-* (+ correctPulse/shakeWrong keyframes)
  stage4-guided.css            sentence-strip, chip, chip-bank, semi-*
  stage5-free.css              free-*, stopwatch
  stage6-ballpop.css           pop-* (play area, balls, particles, bombs, gems, legend)
  stage7-stardefender.css      inv-* (play area, lives, legend, powerup indicators)
  stage8-spinwheel.css         wheel-specific legend swatch + begin-turn-button positioning
                                (reuses .inv-play-area/.inv-canvas + .pop-* chrome)
  stage9-questions.css         qs-layout, qs-gap, qs-scramble
  stage10-plinko.css           plinko-legend-swatch, plinko-ball-picker (reuses .inv-play-area/.inv-canvas)
  stage11-angrybirds.css       birds-legend-swatch, birds-hint (reuses .inv-play-area/.inv-canvas)
  stage12-cometchaos.css       comet-legend-swatch, comet-hint (reuses .inv-play-area/.inv-canvas)
  stage13-billiards.css        billiards-legend-swatch, billiards-hint (reuses .inv-play-area/.inv-canvas)
  stage14-neonarena.css        neon-legend-swatch, neon-hint, neonBeginTurnBtn positioning
                                (reuses .inv-play-area/.inv-canvas/.inv-lives + the life-lost keyframes)
  fullscreen-game.css          body.fullscreen-game overrides for stages 6/7/8/10/11/12/13/14 (see below)
  print.css                    @media print (rules + worksheet print styles)

js/
  main.js                      Entry point — imports every stage module (registers
                                their listeners as a side effect), mute toggle,
                                restart-lesson orchestration, INIT sequence
  state.js                     export let state = {...}; resetLessonState()
  navigation.js                goToStage() — the single navigation function; also owns the
                                FULLSCREEN_STAGES set, toggles body.fullscreen-game, and calls
                                enterFooterLayout/exitFooterLayout on stage transitions
  fullscreenLayout.js           enterFooterLayout()/exitFooterLayout() — relocates a game's
                                .pop-sidebar/.pop-hud-card into/out of its .stage-footer
  stepper.js                   STAGE_LABELS, renderStepper()
  utils.js                     escapeHtml, shuffle, showQuestionModal (shared question-modal
                                flow used by all 4 team-based games — see below)
  audio.js                     ensureAudio, beep, sfxCorrect/Incorrect/Tick/TimeUp
  icons.js                     speakerIconSVG, tickIconSVG, crossIconSVG — inline-SVG icons
                                used in place of emoji throughout the app
  confirmDialog.js             confirmDialog() — in-page replacement for native confirm()
  particles.js                 burstParticles, burstFromElement (DOM particle burst)
  timerRing.js                 TIMER_RING_RADIUS/CIRCUMFERENCE, setTimerRing
  teamColorPicker.js           TEAM_COLOR_PALETTE, renderTeamSetupRows(), renderTeamScoreboard()
                                — shared by every team-based game's setup screen AND in-game
                                scoreboard (stage6/7/8/10/11/12/13)
  canvasGame.js                createCanvasResizer(canvasId, playAreaId, onResize) — shared by
                                every canvas-based game (see "Canvas game helper" below)
  teamGameFlow.js               showTurnResultModal(), finishTeamGame(), wireTeamManagementButtons()
                                — shared by all 8 team-based games (stage6/7/8/10/11/12/13/14),
                                see "Shared team-game orchestration" below
  content/                     Lesson content only (question banks, level layouts, word lists)
                                — see "Content modularity" below. One file per stage, exact
                                same export names the stage file used to declare inline.
    stage2-rules.js             RULES, COMPARE_DEMOS, COMPARE_ICON_COLORS
    stage3-controlled.js        MC_QUESTIONS
    stage4-guided.js            SEMI_ITEMS
    stage5-free.js              WORD_BANK, SCAFFOLD_FRAMES
    stage6-ballpop.js           POP_QUESTIONS
    stage7-stardefender.js      INV_QUESTIONS
    stage8-spinwheel.js         WHEEL_QUESTIONS (each `{prompt,answer,points}`), WHEEL_COLORS
    stage9-questions.js         QS_SETS
    stage10-plinko.js           PLINKO_QUESTIONS, BALL_TYPES, SLOT_VALUES
    stage11-angrybirds.js       BIRDS_QUESTIONS, BIRD_LEVELS
    stage12-cometchaos.js       COMET_QUESTIONS, COMET_LEVELS
    stage13-billiards.js        BILLIARDS_QUESTIONS, BILLIARDS_BALLS (ball layout, deliberately
                                 spread apart rather than a real rack — see Stage 13 section)
    stage14-neonarena.js        NEON_QUESTIONS
  stages/
    stage1-aim.js               aimNextBtn listener only
    stage2-rules.js             buildCompareIcon, renderRuleCards, renderCompareDemo,
                                 renderPrintableRules (content imported from content/stage2-rules.js)
    stage3-controlled.js        startMcTimer/cancelMcTimer, renderMcQuestion,
                                 handleMcAnswer/Timeout, finishMcQuestion
    stage4-guided.js            startSemiTimer/cancelSemiTimer, loadSemiItem, renderSemi
    stage5-free.js              renderWordBank/renderScaffoldList, stopwatch (tracks
                                 configuredMs separately from remainingMs so Reset always
                                 returns to the last configured duration)
    stage6-ballpop.js           all pop* functions (largest module)
    stage7-stardefender.js      all inv* functions; canvas-drawn ship/projectiles/particles/
                                 pickups scale via canvasScale(canvas) so they stay
                                 proportionate in fullscreen
    stage8-spinwheel.js         wheel spin animation/easing, canvas-drawn 10-segment wheel,
                                 all wheel* functions — replaces the deleted stage8-bamboozle.js
    stage9-questions.js         initQs, renderQsQuestion/Scramble, renderPrintableWorksheet
                                 (worksheet unscramble prompts are shuffled at print time)
    stage10-plinko.js           full physics engine (peg field, circle-collision bounce,
                                 per-ball-type gravity/restitution/wobble), ball-type unlock
                                 progression, point-goal panel + landing-flash rendering
    stage11-angrybirds.js       Sahara-themed slingshot physics (drag-to-aim, gravity/ground-
                                 bounce, circle-vs-block/pot collision, cascading structural
                                 collapse), one shot per turn, level layouts cycle each turn
    stage12-cometchaos.js       gravity-well physics (planets pull the comet via inverse-
                                 square gravity, a black hole swallows a shot that gets too
                                 close), same drag-to-aim slingshot input as Stage 11
    stage13-billiards.js        real ball-vs-ball elastic collision physics (the one genuinely
                                 new physics ingredient in the app — every other game only has
                                 projectile-vs-static-obstacle collision), cushion bounces,
                                 pocket capture, one shot per turn, same drag-to-aim convention
    stage14-neonarena.js        this app's first free keyboard movement (WASD/arrow keys, fully
                                 decoupled from click/tap-to-fire aiming), enemy homing+wobble AI,
                                 walk-to-collect pickups, an instant-radius AOE pickup (Nova Bomb)

archive/
  comparatives-lesson_29.html  Original monolithic file, kept for reference only —
                                not loaded by the app

tests/                        Committed Playwright specs — see "Testing" below. Not part of the
                               deployed site; dev-only tooling.
  full-regression.spec.js      All 14 stages reachable + zero console/page errors, plus a few
                                deeper stage-1/2/6/9 smoke checks
  team-games.spec.js           Real playthrough assertions for Billiards + Neon Arena (a starter
                                pair, not all 8 — see "Testing" below)

package.json                  private:true, devDependencies: @playwright/test only — this repo
                               still has no build step; this exists purely for test tooling
playwright.config.js          webServer auto-launches `python -m http.server 8934`
```

### Content modularity — swapping or extending what the lesson teaches
Every stage's question bank / word list / level layout lives in `js/content/<stagefile>.js`,
completely separate from that stage's game/rendering logic in `js/stages/<stagefile>.js` — the
whole point being that **changing what the app teaches never requires touching game code**.
Each content file exports plain data (arrays of string/number object literals, no functions)
under the exact same names the stage file used to declare inline, so the stage file's only
change was adding one `import { X, Y } from '../content/stageN-name.js';` line.

**To swap in a new topic for an existing stage** (e.g. replace the comparative-adjectives
questions in Ball Pop with a different grammar point): edit only
`js/content/stage6-ballpop.js` — same array shape (`{ prompt, answer }`), any length. No other
file needs to change.

**To add a new level/structure/ball type to a physics game**: edit the level array in that
stage's content file (e.g. `content/stage11-angrybirds.js`'s `BIRD_LEVELS`, an array of
`{ pigs: [{x,y,r}], blocks: [{x,y,w,h}] }` objects, all in % of canvas) — the game code reads
`state.xLevelIndex % LEVELS.length`, so adding a 7th layout is just appending one more object.

**What deliberately stays OUT of content/**: visual palettes (`POP_BALL_COLORS`,
`PLANET_COLORS`, `WHEEL_COLORS`, ball colors in `BILLIARDS_BALLS`... though those last ones are
paired with per-ball point *values*, which ARE content, so they stayed with the layout data
rather than being split out — see Stage 13) and physics/tuning constants (`GRAVITY`,
`POP_BOMB_FUSE_MS`, `MAX_LAUNCH_SPEED_FACTOR`, etc.) — these are behavior/feel knobs
interleaved with the functions that use them, not swappable teaching content, and moving them
would add reorganization risk for no content-swapping benefit.

**Adding an entirely new stage**: create `js/content/stageN-name.js` (its question bank/level
data) alongside `js/stages/stageN-name.js` (its game logic, importing from the content file)
and `css/stageN-name.css`; add a `<section class="stage hidden" id="stageN">` to `index.html`;
add its label to `STAGE_LABELS` in `js/stepper.js`; wire any `goToStage()` special-case (lazy
init/cancel, plus `FULLSCREEN_STAGES` if it's a game) in `js/navigation.js`; and side-effect-
import the new stage module from `js/main.js`. If it's a canvas physics game, reuse
`createCanvasResizer()` (`js/canvasGame.js`) and `renderTeamScoreboard()`
(`js/teamColorPicker.js`) rather than writing new resize/scoreboard code — see Stage 12's file
for a complete, current example of this pattern end to end.

### Canvas game helper (`js/canvasGame.js`)
Every canvas-based game (Ball Pop's particle layer, Star Defender, Plinko, Sky Slingshot, Comet
Chaos) needs the same three things: size the canvas's pixel buffer to match its play area, redo
that on a debounced `window.resize`, and hand back a cached element reference instead of
re-querying the DOM every animation frame. This used to be five near-identical copies of the
same ~10-line resize function, and — the real cost — every game's `update*`/`render*` pair
called `document.getElementById('xCanvas')` freshly on **every single frame**, including once
inside a nested collision loop in Star Defender. `createCanvasResizer(canvasId, playAreaId,
onResize)` returns `{ resize, getCanvas }`: `resize()` re-measures the canvas (and runs the
optional `onResize` callback for stage-specific extra work, e.g. Plinko regenerating its peg
field) and is wired to the debounced resize listener internally; `getCanvas()` returns a cached
reference, fetched via `getElementById` at most once per page load. Each stage's own
`resizeXCanvas()`/`ensureXLayout()` exports are now thin wrappers around one shared resizer
instance, and every `document.getElementById('xCanvas')` call inside a hot loop was replaced
with `xCanvasResizer.getCanvas()`.

### Shared team-game orchestration (`js/teamGameFlow.js`)
All 8 team-based games (Ball Pop, Star Defender, Spin Wheel, Plinko, Sky Slingshot, Comet Chaos,
Billiards, Neon Arena) re-implemented the same result-modal/end-game/team-management chrome
almost byte-for-byte — found during a Modularity/Performance/Stability review and confirmed by
reading all 8 `showXResult`/`endXGame` pairs side by side before extracting this. Three exports,
each replacing exactly one of the three duplicated pieces — nothing else:
- `showTurnResultModal(nextBtnId, { teams, currentTeamIndex })` — the
  `#popResultOverlay`/`#popResultBody` Promise/show/hide/listener plumbing shared by every
  `showXResult()`, plus the team-standings strip and the Continue button, both generated here.
  **As of 2026-07-15 this is the ENTIRE modal body** — no `bodyHtml` parameter any more. Every
  game used to build its own "Turn result" tag + big "+N"/breakdown text (Plinko's multi-ball
  breakdown, Spin Wheel's "Spin result" tag, Neon Arena's "N points!", etc.) and pass it in; all
  of that was deleted from all 8 `showXResult()` functions per explicit feedback that the score
  screen should show "just the team scores: no need for any other text" — the standings pills
  ARE the result now. `teams`/`currentTeamIndex` are optional (every current caller passes them)
  — when given, the modal is tinted to the acting team's own color (`--tc`) and a
  `burstFromElement()` confetti burst (`js/particles.js`) fires from that team's own **standings
  pill** (`.result-pill.active`, retargeted from the old `.modal-result-big` score number once
  that element stopped existing) in the same color.

**Turn-result standings strip (`renderResultStandings()` in `js/teamColorPicker.js`)**: a row of
score-first cards — same colored visual language as the in-game scoreboard (`color-mix`
background tint driven by `--tc`), sized up and bordered heavier (3px, ~20% tint) per feedback
that they needed to be "much more visible." Each card leads with a large, bold, team-colored
score number and the team name (with its color dot) underneath — deliberately the *reverse* of
the sidebar scoreboard's name-then-score order, since this is a celebratory reveal where the
exciting number should dominate. The team that just played gets the glowing "active" treatment.
There is deliberately **no** "leading team" tag — an early version added one, but it was removed
per feedback; a team's relative standing is already obvious just from comparing the score
numbers side by side, no extra label needed. Each card pops in with a staggered entrance
(`animation-delay` per `nth-child`) using this app's established bouncy
`cubic-bezier(.34,1.56,.64,1)` spring easing (see "Site-wide hover language" below) rather than a
new motion language. `#popResultBody` was widened slightly (480px → 560px) to comfortably fit up
to 4 cards on one row without the confirm dialog or question modal (each already independently
sized) being affected. The old `.modal-tag`/`.modal-result-big` (+ its `resultScorePop`
keyframes)/`.modal-followup` (Plinko's breakdown-line class) CSS rules were deleted from
`modals.css` once confirmed dead everywhere (grepped for each class name across every stage
file and `utils.js` first, since `.modal-followup-text` — a *different*, still-used class in the
shared question modal — has a confusingly similar name).
- `finishTeamGame({ prefix, teams, hasTimerHud, setPlayAreaIdle })` — the shared tail of every
  `endXGame()`: finishing sfx, winner computation, game-over banner, hiding begin-turn, revealing
  Play Again. Returns `winnerText` so callers set their own turn-banner line with it (only Ball
  Pop's differs: "All 10 questions done" vs. everyone else's "All done"). `hasTimerHud` (true only
  for the 3 continuously-timed-round games: Ball Pop/Star Defender/Neon Arena) and
  `setPlayAreaIdle` (true only where the original `endXGame` set `.idle` itself — some games
  already do that earlier in their own turn-resolution flow) are the two genuine structural
  variations found; every other line was identical in all 8 originals.
- `wireTeamManagementButtons({ prefix, getTeams, renderScoreboard, cancelRound, beforePlayAgain,
  afterPlayAgain })` — the reset-scores/change-teams/play-again click handlers, identical logic in
  all 8 (confirmed the confirm-dialog wording is word-for-word identical everywhere before
  hardcoding it in here). Two real per-game exceptions, covered by the optional hooks rather than
  forcing false uniformity: Ball Pop stops its own particle loop before hiding the game
  (`beforePlayAgain: stopPopParticleLoop`), Plinko re-renders its ball-type legend after returning
  to setup since unlocked balls reset with a new game (`afterPlayAgain: renderPlinkoBallLegend`).

**Explicitly out of scope, by design**: `renderXTurnBanner` (one line, not worth the indirection)
and every bit of actual gameplay/scoring logic — Spin Wheel's correctness-gated scoring,
Billiards' `cueAwaitingStrike`/randomized rack, Neon Arena's lives-never-end-the-round-early
behavior, etc. all stay exactly as they were, untouched, in each stage's own file. Also a
deliberate design choice: `prefix` is used to build DOM ids (`` `${prefix}BeginTurnBtn` ``, same
pattern `teamColorPicker.js`/`canvasGame.js` already use for their own id parameters) but NOT to
access `state` dynamically — every stage still passes its own `state.xTeams` explicitly via
`getTeams: () => state.xTeams`, kept grep-able rather than reached into via a
`state[prefix + 'Teams']`-style trick. This app's primary future maintainer is the teacher who
owns it, not a dev team, so explicit call sites won over clever indirection here.

### Setup-screen legend (`.pop-legend`/`.pop-legend-item`, all 8 team-based games)
Every team-based game's pre-game setup screen shows a small legend above the team-name inputs
(what each enemy/ball/pot/pickup is worth) — styled once in `css/stage6-ballpop.css`, reused by
every other stage's own swatch sub-classes (`.inv-legend-swatch`, `.neon-legend-swatch`,
`.comet-legend-swatch`, `.billiards-legend-swatch`, `.birds-legend-swatch`,
`.plinko-peg-legend-swatch`/`.plinko-legend-swatch`). **Reworked to compact horizontal chips
(2026-07-16)**, per feedback that the setup screens felt cluttered and needed to be "more
minimalistic" — worst-case, Neon Arena has 8 legend entries and Star Defender has 7. Each
`.pop-legend-item` used to be a stacked icon-over-2-line-text box in a 48px swatch box with no
visual grouping; now it's a single-line pill (icon + label side by side, `--paper`-tinted
background, rounded, capped to a 40px swatch box — checked against every legend type's actual
swatch size first, the largest being Ball Pop's 38px `normal` ball, so nothing needed resizing
individually) inside a `.pop-legend` capped to `max-width:480px` so the whole legend reads as
one tidy centered block instead of sprawling the full stage width. Purely a shared-CSS change
(`.pop-legend-swatch-box`/`.pop-legend-item`/`.pop-legend-points`) — no per-game swatch CSS or
markup needed touching.

**Setup screens also vertically centered**, same day, follow-up feedback ("center the
information on the team select page") — the legend compacting above made these screens
noticeably shorter, which made the pre-existing `justify-content:flex-start` on `.stage-body`
(see "Global layout" below) read as a large dead gap below a block of content pinned to the top.
Added `#stage6/7/8/10/11/12/13/14 .stage-body{justify-content:center}` alongside stages 1/3/4's
existing centered rule, same "bounded content in normal use" reasoning — verified safe (not
stage 2's overflow-clipping risk) by stress-testing with the maximum team count the app itself
allows (4) before committing to it, same testing discipline stage 2's own decision used. The
in-game view these stages also contain already fills its own available space via its flex chain,
so this is a no-op once a game is actually running, not just while on the setup screen.

### Fullscreen game mode (stages 6, 7, 8, 10, 11, 12, 13, 14)
While the visible stage is a game, `navigation.js` adds `fullscreen-game` to `<body>` and
calls `enterFooterLayout(stageEl)` (from `js/fullscreenLayout.js`); leaving the stage calls
`exitFooterLayout(stageEl)`. `css/fullscreen-game.css` hides the stepper, expands `.stage` to
`position:fixed; inset:0`, and turns the footer into a single dark-glass bar
(`rgba(14,12,28,0.92)` + blur) that holds Back/Next **and** the team scoreboard **and** the
HUD (time/score/question + a slim timer bar) all in one row. The play area gets the entire
stage above that bar — no reserved top/left gutters at all.

**This is a DOM reparenting, not a CSS positioning trick.** `enterFooterLayout` physically
moves `.pop-sidebar` and `.pop-hud-card` (whichever exist for that stage) into a
`.fs-footer-info` wrapper inserted as the footer's second child (between the Back button and
the Next/Restart button(s)); `exitFooterLayout` puts them back where they came from
(positions remembered via a `WeakMap`). An earlier version tried to keep them as
absolutely-positioned floating cards inset from the play area by reserved gutter variables —
functional, but the user found it visually "janky" (two separately-floating pieces, an
overlapping redundant idle-state message) and asked for the current footer-integrated design
instead. If you're tempted to go back to floating overlays, don't — this was a deliberate,
requested redesign, not an accident.

**Gotcha hit while building this:** the relocated `.pop-sidebar` kept `flex-direction:column`
and a fixed `flex: 0 0 clamp(160px,18vw,230px)` from its *non-fullscreen* base rule in
`stage6-ballpop.css`, because the fullscreen override didn't re-declare those two specific
properties. CSS cascades **per property**, not per rule — a more-specific selector only wins
for the properties it actually declares. Symptom: team pills rendered stacked in a narrow
column instead of a horizontal row, even though the override's `display:flex` and background
styling were correctly applying. Fix: the fullscreen `.pop-sidebar` rule now explicitly sets
both `flex-direction:row` and `flex:0 1 auto`. Worth checking for this same pattern
(inherited shorthand/directional properties silently surviving an otherwise-winning override)
if any future footer-relocated element looks wrongly laid out.

The HUD (time/score + timer bar) is one merged card, not two separately-positioned pieces —
`index.html` wraps `.pop-hud` + `.timer-bar-track` in a `.pop-hud-card` div; that wrapper is
`display:contents` (invisible to layout) outside fullscreen mode and becomes a real flex row
only under `body.fullscreen-game`. The sidebar's active team gets an explicit `.turn-badge`
("▶ Current turn", hidden in the footer context since the pill's own glow already says it)
rendered in each stage's `render*Scoreboard()`, plus inactive teams dim to `opacity:0.55` —
the colored border alone wasn't a clear enough "whose turn" signal from across a room. The
old verbose "Team X's turn — question Y of N" banner text is hidden in fullscreen (targeted
via `[id$="TurnBanner"]`) since it's redundant with the highlighted pill + HUD question count.

Every game's sidebar also has a **Change teams** button (`#popChangeTeamsBtn` /
`#invChangeTeamsBtn` / `#wheelChangeTeamsBtn` / `#plinkoChangeTeamsBtn` / `#birdsChangeTeamsBtn`
/ `#cometChangeTeamsBtn` / `#billiardsChangeTeamsBtn` / `#neonChangeTeamsBtn`) that cancels any in-progress round and
jumps straight back to the team setup screen — same target state as "Play again", just
reachable mid-game (with a confirm() since it discards the current game), not only after all
questions are answered.

### Shared question modal (all team-based games — Ball Pop / Star Defender / Spin Wheel / Plinko / Sky Slingshot / Comet Chaos / Billiards / Neon Arena)
`showQuestionModal(prompt, answer, { correctLabel, wrongLabel, showFollowup })` in
`js/utils.js` is the ONE shared implementation for every pre-turn question popup in the app.
Flow, identical everywhere: big readable question (`.modal-q-text`,
`clamp(28px,4.2vh,38px)`, no more small "WARM-UP QUESTION" text-pill — a small floating circle
badge, `.modal-q-badge`, carries that framing instead) → a single "Check answer" button
(`.btn-check-answer`) → a big answer reveal (`.modal-answer-word`) → a large tick/cross pair
(`.judge-btn.judge-correct` / `.judge-wrong`, custom SVGs from `icons.js`'
`tickIconSVG()`/`crossIconSVG()` — solid currentColor disc with the mark cut out in white, not
a plain glyph) the student marks themselves with. Returns `Promise<boolean>` (true = marked
correct). Ball Pop/Star Defender/Plinko/Sky Slingshot/Comet Chaos/Billiards/Neon Arena don't act on the
result — the warm-up doesn't gate play, it's just self-assessment, sound feedback only
(`sfxCorrect`/`sfxIncorrect`, played inside `showQuestionModal` itself). **Spin the Wheel is the
one caller that branches on it**: the landed segment's points are only awarded if the answer was
marked correct, 0 otherwise (`beginWheelTurn()`: `const points = correct ? q.points : 0;`) — the
same "branch on the boolean to gate scoring" role Bamboozle's bespoke modal used to play, before
Bamboozle was replaced.

`showQuestionModal` always sets `modalBody.className = 'modal modal-question'` itself — no
caller-side class juggling needed anymore now that every game uses the same template (earlier
this required each caller to remember to reset the class, since `#popQuestionBody` is shared
and `classList` isn't cleared by an `innerHTML` swap — that whole class of bug is gone now
that there's only one template to apply).

### Team color picker (stages 6, 7, 8, 10, 11, 12, 13, 14)
`js/teamColorPicker.js` renders a small swatch button per team row; clicking it opens a
12-color popover (`TEAM_COLOR_PALETTE`). Colors already used by other rows are greyed out
(but not hard-blocked) so teams stay visually distinct by default. Each stage module keeps
its own `rowColors` array (`popRowColors`, `invRowColors`, `wheelRowColors`, `plinkoRowColors`,
`birdsRowColors`, `cometRowColors`, `billiardsRowColors`, `neonRowColors`) that persists across "+ Add team"
re-renders, same pattern as the existing name-preservation logic.

**Remove-team + shared add/remove wiring**: `renderTeamSetupRows(containerId, addBtnId, count,
rowColors, renderFn, min=2)` now takes the caller's own `renderXTeamInputs` function back as
`renderFn` — once `count > min`, each row gets a `.pop-team-row-remove` (✕) button that splices
that row's name/color out and calls `renderFn(count - 1)`, the exact same preserve-then-
restore-names pattern "+ Add team" already used. `wireAddTeamButton(containerId, addBtnId,
renderFn, max=4)` centralizes what used to be four near-identical inline click handlers (one
per stage file) into one shared implementation. Every stage's `renderXTeamInputs` now passes
itself as `renderFn` when calling `renderTeamSetupRows` — a normal recursive-reference pattern
(the function refers to its own name inside its own body, resolved at call time, not
definition time, so this is safe despite reading like forward reference).

**"More dynamic" visual redesign**: swatches bumped to 34px, `createColorSwatchButton()` now
calls `setSwatchColor(btn, color)` which sets both `btn.style.background` **and**
`btn.style.color` to the same value — the `currentColor` trick, so
`box-shadow:0 0 0 2px currentColor` always matches the swatch without a second property to
keep in sync. Selecting a color triggers `@keyframes teamColorPopIn` (scale+fade entrance) and
adds a `::after{content:'✓'}` checkmark on the selected swatch. `applyRowColorStyle(row, color)`
live-tints the team row's border/background as soon as a color is picked, not just the swatch
itself, so the whole row reads as "this team" at a glance.

### Compact mode (fullscreen games only)
`#compactModeBtn` (`.mute-toggle.compact-toggle`, only visible via
`body.fullscreen-game .compact-toggle{display:flex}`) toggles `compact-game` on `<body>`
(`js/main.js`). `css/fullscreen-game.css`'s compact-mode block shrinks the fullscreen
`.stage` from edge-to-edge down to a centered `min(82vw,980px) × min(80vh,720px)` rounded card
with margin on all sides — for younger players who can't physically reach the far
edges/corners of a large classroom display. Independent of which game is open; the
preference persists across `goToStage()` calls until toggled off. Initial markup pitfall:
the button originally had a `hidden` class alongside `compact-toggle`, and `.hidden{display:
none!important}` blocked the later `display:flex` override regardless of selector
specificity — fixed by removing `hidden` from the static markup and letting
`.compact-toggle{display:none}`'s own (non-`!important`) default handle the non-fullscreen
case.

**Bug found via testing: toggling compact mode left `<canvas>` game content stretched/
misaligned** (most visibly, Ball Pop's canvas-drawn glow rings around each ball rendered as
off-center ellipses instead of circles matching the DOM ball elements). Root cause: `compact-
game` is a pure CSS class toggle — it resizes the stage box, but does **not** fire a native
window `resize` event, and every game's canvas (`resizePopCanvas`/`resizeInvCanvas`/
`resizePlinkoCanvas`) only re-reads its play area's `clientWidth`/`clientHeight` into the
canvas's pixel-buffer `width`/`height` attributes on an actual `resize` event. So the canvas
kept its OLD buffer resolution while the browser stretched that bitmap non-uniformly to fit
the NEW (differently-shaped) compact box — circles became ellipses, positions drifted. Fixed
in `js/main.js`'s `compactModeBtn` handler: after toggling the class, explicitly call
whichever game's resize path matches `state.currentStage` (`resizePopCanvas()` /
`ensureInvLayout()` — a new export mirroring the existing `ensurePlinkoLayout()` — /
`ensurePlinkoLayout()`). Deliberately scoped to only the currently-open stage rather than
calling all three unconditionally: the other two games' play areas are `display:none` while
hidden, so their `clientWidth`/`clientHeight` would read 0 and incorrectly zero out their
canvas buffers (harmless in practice, since `goToStage()` already re-runs the correct resize
on entry to stages 6/10 — but wasteful and worth avoiding regardless).

**A second, more serious compact-mode bug found via testing (2026-07-16): the footer covered
the bottom ~10% of the canvas, not just crowded it.** In compact mode the footer becomes
`position:absolute; bottom:0` over the shrunk stage box (see "Fullscreen game mode" above for
why — team scoreboard + HUD physically relocate into it), and `.stage-body` reserved space for
it via a single fixed `padding-bottom: clamp(52px,10vh,68px)` guess. That guess was badly wrong
for some games: measured directly, Billiards' actual compact-mode footer ran **145px** tall
(team pills + HUD + button labels wrap differently at this box's narrower width) against a 68px
reservation — the canvas extended ~59px UNDER the footer, silently hiding the bottom row of
pockets and the entire shot-power meter (drawn near the canvas's own bottom edge). This wasn't
Billiards-specific — any content near the bottom of ANY game's canvas in compact mode was at
risk, the fixed guess just happened to be closest for the games that got tested most. Fixed at
the root, not by tuning the guess further: a `ResizeObserver` (`js/main.js`, observes every
`.stage-footer`) keeps a `--compact-footer-h` CSS custom property in sync with each stage's
footer's ACTUAL rendered height, re-running the current game's canvas resize whenever it
changes; `.stage-body`'s padding-bottom in `fullscreen-game.css` now reads `var(--compact-
footer-h, clamp(52px,10vh,68px))` — the old clamp value survives only as the fallback for the
brief instant before the observer's first measurement lands. Verified the fix generalizes (not
just fixed for the one game that surfaced it) by measuring the canvas-vs-footer gap on both
Billiards and Neon Arena, and confirmed it survives toggling compact mode off and back on
(the observer re-fires and re-measures each time, not just once at page load).

**Further "squished/stretched, resolution off" investigation, same day — one confirmed gap
found, general robustness added, root cause NOT fully confirmed.** Follow-up feedback described
this as happening broadly, across games, when moving between compact and fullscreen. Extensive
re-testing (numeric canvas-buffer-vs-container checks AND visual screenshots across 7 of the 8
games, several realistic sequences — toggling compact before vs. after starting a game, real
browser window resizes, navigating away and back mid-compact, re-toggling repeatedly, even a
simulated `deviceScaleFactor:2` pass) could not reproduce a stretch/squish with the code as it
stood. Two things were still fixed, on their own merits:
- **A real, confirmed gap**: stage 7 (Star Defender) was the ONLY game stage missing from
  `goToStage()`'s per-stage resize dispatch in `navigation.js` — every other game re-syncs its
  canvas on navigation (in case its box size changed while the stage was hidden), stage 7 only
  ever resized inside its own begin-turn handler. Added the missing `if(num===7){
  ensureInvLayout(); }` (and the corresponding import) for consistency with every other stage.
- **General robustness**: `createCanvasResizer()` (`js/canvasGame.js`) now schedules one extra
  re-check a frame later on every `resize()` call, only re-applying if the canvas buffer and its
  container's `clientWidth/Height` actually disagree — cheap insurance against the box not having
  fully settled at the exact synchronous moment `resize()` first ran, covering every game for
  free since they all go through this one shared factory.
- **What this does NOT cover**: device-pixel-ratio-aware canvas rendering (a genuinely different
  possible cause of "resolution off" on a high-DPI/Windows-display-scaled screen — the browser
  upscales a CSS-pixel-resolution canvas bitmap for display, reading soft/blurry). Deliberately
  NOT attempted: every game's rendering AND physics/collision code reads `canvas.width`/`height`
  directly as its own coordinate space throughout (not through a separate "logical size"
  abstraction), so retrofitting proper DPR support would mean touching the math in all 8+ canvas
  games, not just the shared resizer — too invasive and too risky to attempt speculatively inside
  this batch without a confirmed repro to verify against. If this is still happening after the
  two fixes above, worth getting an exact repro (which game, which OS display-scaling %, exact
  steps) before attempting that larger, riskier change.

### No emoji, anywhere (policy)
The app deliberately uses **no colorful pictographic emoji** anywhere — not in UI copy, not in
floating/toast text, not in code comments. Plain monochrome Unicode symbols used as functional
icons are fine and already used throughout: `✓`/`✗` (feedback), `←`/`→`/`↺`/`⤢`/`⤡` (nav/
restart/compact-mode), `♥` (Star Defender lives), `✕` (remove-team). If you're tempted to add
an icon for a new feature, prefer one of those, a plain text label, or a small inline SVG (see
`js/icons.js`) over an emoji character.

### Shared confirm dialog (`js/confirmDialog.js`)
`confirmDialog(message, { confirmLabel, cancelLabel, danger })` replaces every native
`confirm()` in the app with an in-page modal reusing the `.overlay`/`.modal` visual language
(`#confirmOverlay`/`#confirmBody` in `index.html`) — a browser-chrome `confirm()` popup looks
and behaves like an OS interruption, can't be styled, and can't be tested/screenshotted the
same way as the rest of the app's UI. Returns a `Promise<boolean>`, so every call site is
`if(!await confirmDialog(...)) return;` inside an `async` event handler. Cancel is always the
left/`btn-ghost` button, the primary action always right; destructive actions (reset scores,
change teams, restart lesson) pass `danger:true` for a `.btn-danger` (red) primary button
instead of `.btn-primary`. Also closes on Escape.

Every game stage's footer has its own "Restart lesson" shortcut, all wired through one shared
`document.querySelectorAll('.restart-lesson-btn').forEach(...)` handler in `main.js` — not
one real button with the rest faking clicks on it (an earlier version of this had exactly that
problem: `restartLesson2`/`restartLesson3` each just called `.click()` on `#restartLesson`).

### Icons (`js/icons.js`)
`speakerIconSVG(muted)` returns a small inline-SVG speaker glyph (filled polygon/rect,
`currentColor` fill/stroke so it follows the button's own text color in both light and
fullscreen-dark contexts) for `#muteBtn`, with a crossed-out variant for the muted state — set
directly via `.innerHTML`, not `.textContent`, since it's markup not a character. Replaced an
emoji (🔊/🔇) per the no-emoji policy above. `tickIconSVG()`/`crossIconSVG()` are the same
pattern for the question modal's judge buttons (see above).

### Site-wide hover language
Every interactive element in the app (`.btn` and all its variants, `.mute-toggle`,
`.bz-tile`, `.mc-option`, `.chip`, the Stage 2 rule-accordion rows, `.demo-dot`,
`.plinko-ball-option`, the team-color swatches/options, `.pop-team-row`/`-remove`, the
stopwatch adjust buttons, `.qs-tab`) shares one hover "feel", set per request to be "soft and
fun to interact with": a slow spring transition
(`cubic-bezier(.34,1.56,.64,1)`, ~0.28-0.32s — noticeably slower than a flat color-swap) that
lifts/scales the element slightly and adds a colored glow (`box-shadow` using
`color-mix(in srgb, <theme color> N%, transparent)`, tinted to whatever that element's own
accent color is — primary teal, error red, a team's own color, etc.). `:active` states
shorten `transition-duration` back down to ~0.08s so an actual *click* still feels immediate;
only the hover approach is slow. If you add a new clickable element, match this pattern
(lift + colored glow, slow-in) rather than reintroducing a fast/flat hover — that was the
explicit ask, and a mismatched fast hover now reads as a regression, not a stylistic choice.

**Senior-front-end consistency pass (2026-07-16)** — a deliberate "review the whole site" ask,
not a specific bug report. Audited every CSS file for `:hover`/`:focus`/transition coverage
first (grepped for `outline`/`:focus-visible` across the whole `css/` folder) rather than
guessing at what needed polish, and found the gaps were narrow rather than widespread — this
codebase already had the hover language above applied broadly. What was actually missing:
- **Keyboard focus was inconsistent, not absent** — `.team-color-swatch`/`.pop-team-row`/text
  inputs already had `:focus-visible`/`:focus-within` treatment (from earlier sessions), but the
  single MOST-used interactive element on the page, `.btn` (every button everywhere, via one
  shared rule), had none, and neither did `.step` (the stepper) or `.mute-toggle`. Added
  `:focus-visible` outlines (`2px solid var(--primary)`, matching the existing team-picker
  style) to all three, plus `.judge-btn` (the question modal's tick/cross buttons). The stepper
  needed its outline moved onto just `.circle` (`.step:focus-visible{outline:none}` +
  `.step:focus-visible .circle{outline:...}`) rather than the whole button, so keyboard focus
  doesn't draw a second, squarer ring around the circle+label flex column on top of the
  circle's own round one.
- **The stepper had no hover/press feedback at all** — every other clickable element in the app
  responds to hover/active in some way; `.step` only changed appearance via its `.active`/
  `.done` STATE classes, never on hover. Added a matching lift+glow hover and a press scale-down,
  same language as everything else.
- **Stage switches and modal opens were instant, zero-acknowledgment cuts** — `.stage` and
  `.overlay`/`.modal` both toggle via the shared `.hidden{display:none!important}` utility, and
  neither had ever had an entrance animation, even though several elements INSIDE modals already
  did (`.modal-q-badge`, `.result-pill`, etc. all had their own pop-in animations — the frame
  around them was the one piece with no motion). Fixed both with a **CSS-only** technique
  requiring zero JS changes: since `display:none` elements don't run animations, defining the
  animation only on the "visible" rule (`.stage:not(.hidden)`, `.overlay:not(.hidden)`/
  `.overlay:not(.hidden) .modal`) means it (re)plays fresh every single time `.hidden` is
  removed, exactly like a first paint — a fade+slight-rise for stages, a backdrop fade + a
  springy pop-in (`cubic-bezier(.34,1.56,.64,1)`, matching the hover language's own easing) for
  every modal. Respects `prefers-reduced-motion` automatically via the existing blanket
  `*{transition:none!important;animation:none!important;}` rule.
- **Confirmed via testing, not just visual inspection**: caught one real false alarm while
  verifying the stepper's focus ring — a synchronous `getComputedStyle` check right after
  `.focus()` read stale/UA-default outline values, because `.step .circle`'s pre-existing
  `transition:all 0.15s ease` means `outline` is technically an animated property on that
  element, and the computed style hadn't settled yet in the same tick. Re-checked after a short
  wait and confirmed the actual rule applies correctly — worth remembering generally: a `transition:
  all` shorthand affects EVERY property including ones a later change might add, which can produce
  exactly this kind of "looks broken in a same-tick check" false alarm.

### Game-over banner (`.game-over-banner`, every team-based game)
A big, unmissable end-of-game announcement overlaying the whole play area (dimmed backdrop,
blurred, `.game-over-winner` in a large shimmering gradient-text animation) — added because
the existing "Team X wins!" text update targeted the `#<game>TurnBanner` span inside
`.pop-turn-box`, which is unconditionally `display:none` in fullscreen mode
(`body.fullscreen-game .pop-turn-box > span[id$="TurnBanner"]`) — and every team-based game
*is* fullscreen while playing, so that text was never actually visible to announce a winner.
Each game's `end*Game()` now also sets `#<game>GameOverWinner` and removes `.hidden` from
`#<game>GameOverBanner`; each game's `*StartBtn` handler re-adds `.hidden` at the start of a
new game (the banner element persists in the DOM across games, only its own class controls
visibility, independent of the parent `#<game>Game` container's hide/show). The old Bamboozle
tile grid (since replaced by the Spin Wheel — see Stage 8) needed an extra `.bz-grid-wrap`
positioning wrapper around its tile container for this, since that container's `innerHTML` was
fully replaced on every render and couldn't safely contain static banner markup directly —
worth remembering for any *future* stage whose play area is rebuilt via `innerHTML` rather
than drawn on canvas: give the banner its own stable wrapper, don't nest it inside whatever
gets wiped on re-render. The existing "Play again" button is untouched — this banner is a
purely additive visual, not a replacement for that already-working control.

### Module dependency notes
- `state.js` exports a live `state` binding; `resetLessonState()` reassigns it in place —
  every importer sees the new object immediately (ES module live bindings), same effect
  as the original single-file `state = {...}` reset.
- `navigation.js` ↔ `stepper.js` and `navigation.js` ↔ each stage module are mutually
  importing (`goToStage` calls into stage cancel/render functions; stage modules call
  `goToStage` from their footer nav buttons). This is safe because every cross-call
  happens inside an event handler or `requestAnimationFrame` callback — never during a
  module's own top-level evaluation — so the circular imports never hit a temporal-dead-zone.
- Team colors come from the shared picker (`teamColorPicker.js`), not a fixed per-index array.
  Every game stage reads/writes the `#popQuestionOverlay` / `#popResultOverlay` modal elements
  directly by ID — same shared-modal reuse pattern everywhere, no function-level dependency
  needed since there's only ever one modal open at a time regardless of which game it's for.
- No build step: `index.html` loads `js/main.js` as a native `<script type="module">`,
  which the browser resolves relative to `index.html`. Must be served over `http(s)://`
  (e.g. `python -m http.server`) — ES modules are blocked under `file://`.
- The shared game-chrome CSS classes (`.pop-sidebar`, `.pop-team-list`, `.pop-hud-card`,
  `.pop-turn-box`, `.pop-legend`) live in `css/stage6-ballpop.css` even though every other
  team-based game reuses them too — same "Ball-Pop-named-but-shared" pattern as
  `renderQuestionModalHTML`/`#popQuestionOverlay` above. If you're hunting for one of these
  styles while working in another stage's file, check `stage6-ballpop.css` first.

## Stage 10 — Plinko Drop
Team-turn structure identical to the other games: answer a question (shared modal), then
pick a ball type and click the board to choose a drop point. A small custom 2D physics
sim (gravity + circle-circle collision + a random "wobble" kick scaled to impact speed, not
a fixed value) carries the ball down into one of 9 scoring slots (`SLOT_VALUES`, edges pay
100, center pays 2 — same risk shape as a real Plinko board). Eight ball types (`BALL_TYPES`)
unlock progressively, one per turn (turns 0-7 of the 10-question game): Classic, Heavy,
Exploding, Bouncy, Splitting, Blazing, Chaos, Golden — each with different
gravity/restitution/wobble and a distinct glowing trail color.

**The board is deliberately narrower and taller than a full-width board** —
`#plinkoPlayArea{ width:min(52%, 560px); margin:0 auto; }` in `css/stage10-plinko.css`
overrides the shared `.inv-play-area{width:100%}` rule via ID specificity (works the same in
both normal and fullscreen/compact modes, since only width is touched). This isn't just
cosmetic: it makes aiming for a specific edge slot genuinely harder, since the ball has less
horizontal room to work with. `generatePlinkoPegs` derives its row count from this actual
aspect ratio (`Math.round((bottomY-topY)/spacing)+1`, clamped to `[9,20]`) instead of a fixed
constant — a taller/narrower board gets more ROWS of pegs (more bounce chances), not just
more empty space between the same 11 rows a fixed row count would leave.

**`state.plinkoBalls` is an array, not a single ball.** It was originally
`state.plinkoBall` (one object or `null`) until the Splitting ball type required more than
one ball in flight at once; `updatePlinkoBalls(dt)` iterates the array each frame, and a
round only resolves (`finishPlinkoTurn`) once every ball from that drop has landed
(`state.plinkoBalls.length === 0`). `state.plinkoRoundResults` accumulates `{points,
slotIndex}` per landed ball for that drop; `finishPlinkoTurn(results)` sums the points and
`showPlinkoResult` shows a "N balls landed!" breakdown when `results.length > 1`.

**Anti-exploit randomness (the "too easy to win" fix).** Before this rework, a ball dropped
right against either wall could ride an almost perfectly straight, deterministic line down
into that wall's 100-point slot every time — wall bounces were a fixed reflection
(`vx = ±|vx| × restitution`) and the peg-hit "wobble" kick was purely proportional to the
ball's *current* speed, which is nearly zero on the still-slow first hit right after spawn.
Four changes close that gap, all in `updatePlinkoBalls`/`generatePlinkoPegs`:
- **Peg jitter**: `generatePlinkoPegs` now offsets every peg's x/y by a small random amount
  (`spacing * 0.16`) each time the board regenerates (game start / resize) — no more a
  perfectly regular lattice with a "solved" channel down either wall.
- **Kick floor**: the peg-hit sideways kick is now `Math.max(speed, 320) * (wobble/100)`
  (also adds a smaller vertical kick, `× 0.35`), not just `speed * (wobble/100)` —
  guarantees a meaningful deflection even on a slow first hit.
- **Continuous drift**: every ball gets a small random `vx` nudge every frame
  (`(Math.random()-0.5) * 110 * dtSec * 60`), independent of collisions, so a ball can't just
  free-fall in a straight line between hits.
- **Randomized wall bounces**: wall reflections now add `± Math.random() * 110` on top of the
  deterministic reflection.
- **Golden ball's edge-lean is now probabilistic, not guaranteed**: 70% chance it leans
  toward the nearer edge (down from a constant, stronger lean), 30% chance it leans the
  *other* way — it's a jackpot nudge, not an autopilot to the 100 slot.

**New ball mechanics** (`spawnPlinkoBall` sets `explosive`/`splitter`/`chaotic` flags from
`BALL_TYPES`, checked per-frame in `updatePlinkoBalls`):
- **Exploding**: 40% chance per peg hit to detonate (`detonatePlinkoBall`) — adds a large
  random velocity kick and sets `peg.disabledUntil = now + 500`. A disabled peg stops
  colliding with **any** ball (not just the one that hit it) until it expires; drawn dim/small
  in `renderPlinkoCanvas` while disabled, reading as "temporarily blown open."
- **Splitting**: on its first peg hit only (`ball.hasSplit` guards against repeat splits), a
  clone is pushed into `state.plinkoBalls` with a mirrored/diverged `vx`. Both balls finish
  independently — see the multi-ball result handling above.
- **Chaos**: applies a random directional impulse on its own timer
  (`ball.nextChaosKick`, every 120-260ms) regardless of peg contact, so its path stays
  erratic even through open stretches of the board.

**Peg field** (`generatePlinkoPegs`): a full-width offset (quincunx) lattice — every row
spans the same width, odd rows shifted half a spacing so pegs interleave — not a narrowing
triangle. That matters functionally, not just visually: a drop near either edge now hits
pegs immediately, so "drop anywhere left to right" (`waitForPlinkoDrop`, clamped to 5%-95%
of canvas width) actually works everywhere, rather than only really working near the center
where the old triangular top row was. Cyan pegs + alternating pink/blue diamond side-wall
decoration + glowing magenta slot-divider "pins" (`drawPlinkoSideWalls`) match the reference
arcade-Plinko aesthetic the design was based on.

**Bug found via testing, not visible from reading the code:** picking a ball from
`#plinkoBallPicker` (a menu) and then immediately attaching a "click the board to drop"
listener to that same `#plinkoBallPicker` element let the SAME click that picked the ball
also register as the drop — see Critical Pattern #8 above. Fixed with `setTimeout(fn, 0)`
before attaching the drop listener. Before this fix, every drop silently landed near
whatever screen position the ball-picker happened to be at, regardless of where the teacher
actually clicked — worth remembering if drop position ever looks "off" again after future
changes to this flow.

**Drop-position hover preview:** while `waitForPlinkoDrop` is waiting for the click, a
`mousemove` listener on `#plinkoBallPicker` tracks the cursor and redraws a translucent ghost
ball + dashed vertical guide line at that x position (`plinkoPreviewX`/`plinkoPreviewTypeId`,
module-level — not in `state`, since it's a transient UI hint with no gameplay meaning).
`renderPlinkoCanvas()` draws it last, after the real ball/particles, so it never hides
anything live. Cleared on drop (in `onClick`) and on `cancelPlinkoRound()` (covers navigating
away mid-selection, before either picker listener would have fired and cleaned up after
itself — `cancelPlinkoRound` now also explicitly removes those listeners via
`plinkoDropListeners`, since they're attached directly to a persistent DOM element rather
than one that gets recreated). The picker's "click here to drop" phase (`.drop-hint-mode`)
deliberately has **no** dimming background — earlier it reused the ball-picker menu's opaque
backdrop, which defeated the point of a hover preview by darkening the whole board; now only
the hint text itself has a small readable pill behind it.

**Slower fall, shorter slot pins, more peg rows, post-land pause** (feedback: "ball drops way
too fast", "goals for the points are super tall... give more room for the actual pegs", "can't
see what point it landed in"). Three coordinated changes:
- Every ball type's `gravity` was roughly halved (e.g. Classic 1500→680). Combined with the
  taller board (above), a drop now takes several seconds instead of under one.
- The slot-divider pins (`pinTop`/`pinBottom` in `renderPlinkoCanvas`) shrank from spanning
  25% of the board's height (`bounds.top` to `canvas.height*0.97`) down to ~10%
  (`bounds.top=0.8` to `canvas.height*0.9`) — short stubs, not a fence. `slotBounds().top`
  moved from `0.72` to `0.8` to match, and `generatePlinkoPegs`'s `bottomY` extended from
  `0.6` to `0.78`, so the freed vertical space goes straight to more peg rows (row count is
  already derived from this range, see above — no separate change needed there).
- **A landed ball no longer vanishes the instant physics stops.** `landPlinkoBall` used to
  immediately filter the ball out of `state.plinkoBalls` and cancel the round's
  `requestAnimationFrame` loop in the same call — meaning the very next (and last) render
  never drew it, so a class genuinely could not see which slot it landed in before the result
  modal appeared. Fixed with a `landed` flag: `updatePlinkoBalls` skips physics for a landed
  ball but `renderPlinkoCanvas` keeps drawing it (settled into the middle of its slot,
  `vx=vy=0`); the round only actually resolves — RAF cancelled, `finishPlinkoTurn` called —
  after `PLINKO_LAND_PAUSE_MS` (1200ms) via `plinkoFinishTimeout`, cleared in
  `cancelPlinkoRound()` so navigating away mid-pause can't fire a stale result. A Splitting
  ball's second ball must also be `landed` before the pause timer starts.
- Wobble percentages were also bumped ~50% across every ball type (Classic 30→48, Heavy
  14→26, etc.) — even after the earlier anti-exploit pass, a drop still read as fundamentally
  predictable; see the `BALL_TYPES` comment for the exact numbers.

**Point-goal board + landing payoff rework** (feedback: the landing moment "looks/feels janky
and not so satisfying," point goals should "look more engaging too"). No change to the drop/
peg-bounce physics itself — purely a rendering/feedback pass over `renderPlinkoCanvas`'s slot-
drawing section and `landPlinkoBall`:
- The old thin pink divider pins + plain text labels were replaced with full-height colored
  "pockets" (`slotTierStyle(value)` — gold for 100, violet for 25, cyan for 10, soft blue for 5,
  muted blue-gray for 2), each with a linear-gradient fill, a glow sized to its tier, and a slow
  idle shimmer (`0.5+0.5*Math.sin(now/900+i*0.7)`) so the board reads as inviting before any
  ball even drops.
- Landing now has a real payoff, not just the pre-existing particle burst + chime standing
  alone: the winning slot's panel flashes and briefly scales up (`plinkoLandFlash = {slotIndex,
  strength:1, big: points>=100}`, decayed once per render), a floating "+N" score text rises
  and fades from the slot (`plinkoFloatTexts` — canvas-drawn, since Plinko has no DOM ball layer
  to attach Ball Pop's `showFloatingText` style element to), and a 100-point land additionally
  washes the whole board in a brief warm gold overlay.
- The ball no longer teleports to the slot center the instant it lands — `landPlinkoBall` sets
  `ball.settleX/settleY` targets instead of snapping there directly, and `updatePlinkoBalls`
  eases the landed ball toward that target over a few frames (`ball.x += (settleX-ball.x)*0.28`
  etc., locking fully still once close enough) — reads as "rolling to a stop," not a jump cut.

**Pegs score points and get destroyed on hit** — added per an explicit ask ("when the ball hits
a peg the pegs will add a point and be destroyed"). Every peg gets a `kind` (`'normal'` ~66%,
`'bonus'` ~12%, `'neutral'` ~22%) assigned at generation time, plus `points` (1/5/0) and a
`destroyed` flag:
- **Normal** pegs (cyan, unchanged from the original look) award **+1** and are destroyed —
  removed from both collision and rendering — the instant a ball bounces off them.
- **Bonus** pegs (gold) award **+5**, are destroyed the same way, and additionally give the ball
  a small extra velocity kick on top of the normal bounce (reads as a genuine small explosion,
  not just a bigger particle burst) — visually and physically distinct, not just a recolor.
- **Neutral** pegs (dim gray, softer glow) award nothing and are **never** destroyed — this is
  the exact behavior every peg used to have before this change, kept as one of the three kinds
  rather than removed, per the explicit ask for "some that give no points and don't get
  destroyed."

Feedback (particle burst sized to kind, a floating "+N" text via the existing `plinkoFloatTexts`
canvas-text array, a distinct `sfxPegPoint()` ding for normal pegs, the existing `sfxExplosion()`
reused as-is for bonus pegs rather than writing a near-duplicate sound) fires in addition to the
pre-existing per-hit bounce particle/`sfxPegHit()`, which still plays for every peg including
neutral ones — the baseline "ball bounced off something" feedback is unchanged, the new feedback
layers on top only when a peg actually scores.

**The peg field regenerates fully fresh at the start of every drop** (`spawnPlinkoBall` calls
`generatePlinkoPegs(canvas)` again before spawning the ball), same "clean slate each turn" spirit
as Billiards' rack/Sky Slingshot's level — otherwise the board would grow sparser turn over turn
as normal/bonus pegs get destroyed, across a 10-question game. A Splitting ball's clone (spawned
mid-drop, not via a fresh `spawnPlinkoBall()` call) correctly shares the same, by-then partially-
depleted field as the ball it split from, since regeneration only happens at drop-start.

Peg points accumulate in `state.plinkoPegPoints` (reset to 0 each drop) and are shown live in a
third HUD item (`#plinkoBonusDisplay`, "Peg bonus") during the drop — Plinko previously had no
live running score at all, only Question/Ball. `finishPlinkoTurn` folds `state.plinkoPegPoints`
into the turn's total alongside the slot-landing points, and `showPlinkoResult` shows a separate
"Peg bonus: +N" followup line so the breakdown (slot value vs. peg bonus) stays transparent, same
spirit as the existing multi-ball breakdown line.

A new static legend on the setup screen (`.plinko-peg-legend-swatch.normal/.bonus/.neutral`)
explains all three peg behaviors before play — this is genuinely new information a player has no
other way to discover, unlike the ball types (which already had their own dynamic legend).

### Physics/visual polish pass (2026-07-16)
Feedback: the ambient particle trail made the ball itself "a bit difficult to see", and landing
"janks itself into place". Both root-caused precisely, not just generally tuned down:
- **Ambient trail cut way back**: the per-frame trail spawn (`Math.random() < (fiery?0.9:0.5)`,
  1-2 particles at 0.3× speed) dropped to `0.35/0.16` chance at `0.16×` speed — same technique,
  just far less of it, so it reads as a subtle wisp instead of a cloud competing with the ball for
  attention. Peg-hit/landing bursts (the actually-celebratory particle moments) are untouched.
- **Landing eased far more gently**: the settle lerp factor dropped from `0.28` to `0.09` — 0.28
  converged in ~10 frames (~170ms, still fast enough to read as a snap); 0.09 takes closer to 30
  frames (~500ms), long enough to actually look like rolling to a stop rather than teleporting-
  then-correcting. A new `ball.landSquash` (1 at impact, eased to 0 on the same timing) drives a
  small squash-and-settle scale pulse on top, so the stop itself has a bit of weight to it.
- **New: faux rolling.** `ball.angle` accumulates every frame from the ball's current speed (same
  recipe as Billiards'/Sky Slingshot's ball rotation from the session before — the highlight
  gradient now visibly spins with the ball instead of staying static.
- **New: screen shake on a big moment** (`triggerPlinkoShake` — same small canvas-translate trick
  as Sky Slingshot's) — a bonus-peg pop or landing in a 100+ point slot now shakes the board
  briefly, on top of the particle burst/chime those moments already had.
- Verified by dropping real balls and confirming visually (particle trail is subtle, not
  obscuring; landing has a visible roll-and-settle, not a snap) plus the committed suite.

---

## Stage 11 — Sky Slingshot (Sahara desert theme)
Team-turn structure identical to the other games: answer a question (shared modal), then get
**exactly one shot** (`SHOTS_PER_TURN=1`) at a structure of sandstone blocks guarding clay pots,
built as literal stacked towers. **Dragging anywhere on the board** (not precisely grabbing the
projectile) aims the shot — the launch vector is just the drag delta from mousedown to
mouseup, capped at a max pull radius and scaled to a launch speed — deliberately forgiving for
younger players. A dotted trajectory preview (using the exact same kinematics formula the real
physics uses) draws live while dragging.

**The catapult sits at `SLING_X_PCT=24` (not pinned to the left edge)** — an earlier pass
raised the anchor's *height* (`SLING_Y_PCT=50`) to fix an "aim up" bug (see below), but the
anchor was still hard against the left edge, which a later round of feedback called out as
"too far left, hard to pull back": there just wasn't enough physical room on-screen for a
comfortable backward drag. Moving the anchor inward (plus bumping `maxPull` from
`canvas.width*0.11` to `0.13`) fixed it — more room to pull, no change needed to the launch-
speed math itself, since power is always normalized 0-1 against `maxPull` regardless of
`maxPull`'s absolute size.

**Level data is stored in % of canvas, not px** (`BIRD_LEVELS`, each `{ pigs: [{x,y,r}],
blocks: [{x,y,w,h}] }` — pigs/blocks are now pot/sandstone-block targets, the field names are
just unchanged internal identifiers). `state.birdsBlocks`/`state.birdsPigs` (the live,
mutable per-turn copies with `alive`/`falling`/`settled` flags — see collapse physics below)
stay in % too, so a resize or the compact-mode toggle never needs to rescale in-progress game
state. Only the in-flight projectile (`state.birdsBird`) and any currently-falling debris
track real px (`fallX/fallY/fallVX/fallVY` on the object itself once it starts falling — see
below). Six level layouts, each built as literal stacked towers (blocks directly beneath one
another, touching edges) so the collapse mechanic reads clearly, cycle via
`state.birdsLevelIndex % BIRD_LEVELS.length`.

**Cascading structural collapse** — the core mechanic added this pass, direct response to "make
the structures moveable objects that react to being hit and knock over other objects... if the
base is taken out it might collapse the full structure." Event-driven (checked once per
destroy, not every frame): when a block/pot is destroyed by a direct hit, `triggerCollapse()`
scans every other still-solid object for one whose bottom edge rests on the destroyed object's
top edge (x-range overlap + y-adjacency within a small % tolerance, derived from the level's
static `x,y,w,h`/`x,y,r` layout — no new authoring format needed), marks it `falling` via
`startFalling()` (switches it from %-based to real-px tracking, gives it a small upward "pop"
plus gravity + rotation), and recursively re-checks what was resting on THAT too (BFS via a
queue) — this is what lets a base-block hit bring down an entire multi-tier tower in one shot.
A falling object free-falls to the ground line then **settles** (rotation locks, dust particles
+ thud sound) and stays rendered as inert rubble, non-collidable, for the rest of the level.
**No extra points for collapse-only removals** — only a direct hit scores (`POINTS_PIG=10`,
`POINTS_BLOCK=3`, unchanged) — collapse is a physical/visual payoff, not a scoring shortcut.

**Physics is deliberately simplified**, same "satisfying, not a real physics engine"
philosophy as Plinko's peg bounces: gravity + ground-bounce (`GROUND_RESTITUTION`) for the
projectile, dampened velocity (×0.6-0.7) with a little random deflection on a direct hit —
not a proper directional reflection off a collision normal — so a dampened-not-stopped shot
can carry on to hit a second or third target (confirmed via testing: a well-aimed shot scored
two pots in one launch, and separately triggered a real multi-block cascade). `circleRectHit()`
is a standard clamped-closest-point circle-vs-AABB test; pots use plain circle-circle distance.

Since it's always exactly one shot, a shot resolving (resting or off-canvas) **always** calls
`finishBirdsTurn()` after `TURN_END_PAUSE_MS=1100` via `birdsFinishTimeout` — the old "birds
remain, load the next one" branch and the `POINTS_UNUSED_BIRD` bonus were both removed as dead
code once a second shot could never happen.

**Visual re-theme, canvas primitives only, no emoji/sprites**: warm gold-to-orange sky gradient
+ a glowing sun disc (clouds removed), sand-dune ground with layered soft-curve ridges, distant
pyramid silhouettes + a palm tree accent, an A-frame wooden catapult (angled legs, a crossbar,
a dashed rope down to the base) replacing the old bare posts, sandstone-colored blocks, and
pots redesigned as decorated clay urns (belly + neck + lip + a painted band + a friendly
two-eyes-and-a-smile face, same charm as the old pig but reading as pottery) that shatter into
sandy-colored shards instead of green particles. The projectile keeps its spinning 6-pointed
gem shape (well-received from an earlier pass) but recolored gold/amber
(`#FFF6C8`→`#FFB74D`→`#C9631A`) to match the desert palette instead of the old purple/pink.
Internal identifiers still say `birds`/`pigs` throughout the file — renaming every reference
for a purely cosmetic reskin wasn't worth the churn; only the visible UI/visuals changed.

**Drag pull-back is clamped so it can never visually leave the canvas** — `computePull(canvas)`
clamps the raw drag delta to `maxPull`, computes a candidate pulled-back point, clamps THAT
point to stay fully inside the canvas with a margin, then recomputes the effective power/
direction FROM the clamped point (not the raw input), so the preview arc and the actual launch
can never disagree and the projectile can never render or fire from off-screen.
`window.addEventListener('blur', cancelDragIfStuck)` is a second safety net for a drag that
gets stuck open (alt-tab, cursor leaves the window).

### Full rework (2026-07-16) — pull feel, rolling physics, structure variety
Explicit creative license ("feels clunky to pull back, not satisfying, ball physics are off —
no rolling, very slow, structures boring to hit"). Retuned as one connected set of changes, not
isolated tweaks, since the individual complaints were symptoms of the same few root causes:
- **Pull-back overhaul**: `maxPull` (in `computePull`) `0.13→0.20×canvas.width` — the old range
  gave barely any room to build a satisfying draw. Added a shot-power meter (`drawBirdsPowerMeter`,
  same recipe as Billiards' — reads the exact `pull.power` the real launch uses, drawn in the sky
  near the top of the canvas so it never competes with the ground-level catapult/structures) and a
  ratcheted "stretch tick" sound (`sfxStretchTick`, fires once per 25%-power threshold crossed
  during a drag, tracked by module-level `stretchTicked`) — the drag previously gave zero feedback
  on how hard the resulting shot would be. The sling bands themselves now thicken and glow
  green→amber→red with pull power (same color language as the meter), and a small leather "pouch"
  renders at the pull point so the bands read as holding something rather than meeting at a bare
  point.
- **Speed + gravity retuned together**: `MAX_LAUNCH_SPEED_FACTOR` `0.6→0.95` to match the bigger
  `maxPull`; `GRAVITY` eased `850→780` so the now-harder shot hangs in a bigger, more satisfying
  arc instead of just landing sooner and harder. Verified empirically: a near-full-power test pull
  now launches at ~1390px/s (canvas-width-relative), against the old theoretical max of ~880px/s.
- **Real rolling, replacing a fixed launch-time spin**: the projectile used to get
  `bird.spin = (Math.random()-0.5)*6 + bird.vx*0.01` ONCE at launch and rotate at that constant
  rate for the entire flight, completely decoupled from its actual speed — the literal "no
  rolling" complaint. Now `bird.rotation` accumulates every physics frame from the ball's
  *current* speed (`(speed/bird.r)*dtSec`, direction from `vx`'s sign), same cosmetic-rolling
  recipe used for Billiards' ball `angle` the session before — verified by sampling `rotation`
  twice ~150ms apart mid-flight and confirming it actually changed.
- **New: ground-roll instead of stopping dead on landing.** The old code cut `vx` by 14% EVERY
  frame the projectile touched the ground (`bird.vx *= 0.86`), which decayed to a standstill in a
  few tenths of a second — visually there was no roll distance at all, "physics are off" in a very
  literal sense. Replaced with a proper constant-deceleration friction (`ROLL_FRICTION_FACTOR=0.55`
  canvas-widths/s², applied only once the projectile is resting vertically on the ground) so a shot
  that lands short now visibly rolls out and can keep clipping targets directly in its path instead
  of a single point of impact being all that mattered. Confirmed via a 5-shot sweep against the new
  bridge level (below): one shot scored 41 points in a single turn — several objects in a row, not
  just the one it first touched.
- **New: screen shake on impact** (`triggerShake(mag)`, a brief decaying random jitter applied via
  `ctx.translate` wrapping the entire `renderBirdsCanvas` draw) — pots shake harder than blocks,
  scaled by the pot's own value (`6 + value*0.15`) so a chief-pot hit feels like the bigger deal it
  is, not a flat amount every time.
- **New: pot value tiers.** Pots can now carry their own `value` (omitted = defaults to
  `POINTS_PIG=10` via a fallback, so every untouched pot in the original 6 levels kept working
  unchanged). The single hardest-to-reach pot in levels 4-6 was bumped to `value:25` — a "chief"
  pot, rendered with a gold band/face instead of brown plus a subtle gold glow, same "size/color
  communicates value" language Billiards' numbered balls already established. The setup screen's
  legend text was updated from "Pot · +10" to "Pot · +10 to +25" to match, mirroring Billiards'
  own "+5 to +50" legend phrasing.
- **New: two structurally distinct levels appended** (`BIRD_LEVELS` now has 8 entries, not 6) —
  every existing level was some flavor of "N-block tower topped with a pot," which was the literal
  "structures boring" complaint. **"Bridge"**: a wide slab lintel spans two single-block support
  towers with a chief pot balanced on top of the lintel itself; destroying EITHER support (not one
  specific block) brings the lintel and pot down together, since `triggerCollapse`'s adjacency
  check is a genuine x-overlap test against every other object, not a same-x-only stack — this
  level is the first thing in the app to actually exercise that generality. **"Skyline"**: a row of
  short single-pedestal pots flanking one tall 2-block pedestal topped with the chief pot — a clear
  "go for the middle" bonus target framed by easier flanking shots. Both were verified by force-
  loading the level index directly (`state.birdsLevelIndex`) and firing real shots at them — not
  just that the data parses without errors, but that the geometry is actually hittable and the
  collapse propagates correctly (confirmed the chief pot's `alive` flips to `false` on a direct
  support hit that also brings the lintel down).
- Verified via the committed suite (`npm test`, all 7 passing) plus a battery of fresh Playwright
  checks: full-power pull-back measured against the new constants, rotation sampled mid-flight to
  confirm it's live, a 5-shot drag sweep against the bridge level, and both new levels screenshotted
  at setup (confirming the gold-banded chief pot renders distinctly) and mid-flight. Zero console/
  page errors throughout.

---

## Stage 12 — Comet Chaos
The "design something creative/silly but fun" stage. Same team-turn structure and drag-to-
pull-back slingshot input as Sky Slingshot (deliberately — familiar input feel), launched from
a fixed anchor at `LAUNCH_X_PCT=12, LAUNCH_Y_PCT=50`, but the physics is genuinely different
from every other game in the app: **there's no constant downward gravity.** Instead each level
(`COMET_LEVELS`) scatters 1-3 "planets" across the board, each pulling the comet toward itself
with inverse-square gravity (`gravityAccelAt()`, `accel = GRAV_STRENGTH * planet.mass /
distSq`, floored at `GRAV_MIN_DIST_FRAC` of canvas width to avoid a divide-by-near-zero
singularity/explosion on a close pass) — summed from every planet in the current level, same
"forgiving, arcade-tuned, not a real physics engine" spirit as every other canvas game here,
just applied to a genuinely curvy, hard-to-predict flight path instead of a fixed parabola. A
comet bounces elastically off all four canvas walls (`WALL_RESTITUTION=0.75`), loses a little
velocity per second to `DRAG` (keeps a comet from gaining energy indefinitely off repeated
close planet passes), and is capped at `canvas.width*1.3` px/s to keep close-pass slingshots
bounded rather than literally exploding.

**Two later levels (index 2 and 3) also have a black hole** — get within
`blackHole.r + comet.r*0.4` and the shot is swallowed for zero points (`swallowComet`,
"sucked in" particle burst — particles start scattered around the black hole and spiral back
toward its center as they age, via a `pulling`/`pullX`/`pullY` flag on those particles only,
distinct from every other particle burst in the app which is pure outward scatter). Landing
inside the glowing target ring scores `POINTS_TARGET=20`, or `POINTS_BULLSEYE=50` inside the
smaller inner ring. A shot that neither lands nor gets swallowed within
`MAX_FLIGHT_MS=6000` is called a miss (`missComet`, zero points) so a turn can never stall —
without this cap, a comet caught in a stable-ish orbit between two planets could in principle
fly for the rest of the lesson. All three outcomes funnel through one shared
`endCometShot(points)` (adds to `state.cometTurnScore`, freezes the comet, then — same
post-shot-pause pattern as Sky Slingshot's `birdsFinishTimeout` — schedules either
`loadNextComet()` or, on the last shot, `finishCometTurn()` via `TURN_END_PAUSE_MS`).

**The trajectory preview is a genuine simulation, not a decorative arc.** Since the whole point
of a gravity-well game is being able to actually read the curve before committing,
`computeTrajectoryPreview()` forward-simulates up to 80 steps using the exact same
`gravityAccelAt()` the real flight uses (plus wall-bounce reflection, capped at 2 preview
bounces, and an early stop if it would already reach the target or black hole) — so the dotted
preview line drawn while dragging can never disagree with where the comet will actually go.
This mirrors Sky Slingshot's "one shared `computePull()` used by both the live launch and the
preview" pattern, just extended to a multi-step forward simulation instead of a single
kinematic formula.

Rendering is all canvas primitives, no emoji/sprites: a starfield (`state.cometStars`, 90
twinkling dots, lazily generated once via `ensureCometStars` since it only needs canvas
dimensions, not live game state — same lazy-init pattern as `invStars`), planets as a glowing
sphere + a tilted decorative ring in one of 4 colors (`PLANET_COLORS`, cycled by index), a
black hole as a dark radial-gradient core with a rotating dashed accretion ring
(`ctx.rotate(now/900)`), and a pulsing two-ring target (cyan outer, gold inner bullseye,
`1 + 0.06*Math.sin(now/260)` scale). The comet itself is an icy white-to-blue gradient circle
(not a spinning star like Sky Slingshot's projectile — different "biome," different shape
language) with a fading trail (`cometTrail`, same 10-point unshift/pop pattern as
`birdsTrail`).

**"Next" button convention reminder**: a "Next" footer button's click handler is always wired
in the file for the stage it goes *to*, not the stage it appears on (`qsNextStageBtn` in
`stage10-plinko.js`, `plinkoNextStageBtn` in `stage11-angrybirds.js`, `birdsNextStageBtn` in
`stage12-cometchaos.js`, `cometNextStageBtn` in `stage13-billiards.js`, and now
`billiardsNextStageBtn` in `stage14-neonarena.js` — see Stage 14 below). Keep following this
pattern if a Stage 15 is ever added.

---

## Stage 13 — Billiards
The newest stage, added after Comet Chaos. Same team-turn structure and one-shot-per-turn
drag-pull-back convention already proven twice (Sky Slingshot, Comet Chaos): answer a question,
drag away from the cue ball to pull the cue stick back, release to strike — power scaled by
pull distance via `computeCuePull()`, the same clamp-then-recompute-from-the-clamped-point
pattern every other drag-aim game here uses.

**The one genuinely new physics ingredient in the whole app: real ball-vs-ball elastic
collision.** Every other game only ever has projectile-vs-static-obstacle collision (a block, a
peg, a pig) — here, up to 7 balls (cue + 6 object balls) can all carom off each other, not just
off the cue ball's first hit. A plain O(n²) pairwise check per **sub-step** (see below) is
trivial at that count — no spatial partitioning needed. On overlap: push the two balls apart
along the collision normal to resolve the overlap immediately (prevents tunneling/sticking),
then exchange the normal-direction velocity component between them (`BALL_RESTITUTION=0.94`,
equal-mass elastic collision — a dead-on hit transfers ~97% of the striking ball's speed to the
struck one; a glancing hit leaves both balls with a fraction each, deflecting at an angle, which
reproduces the real "90-degree rule" pool players know since the struck ball only inherits the
*normal*-direction component and the striking ball keeps only the *tangential* one). Cushion
bounces (`WALL_RESTITUTION`) and flat friction deceleration apply to every ball every frame, cue
included.

**Physics is sub-stepped, not one big step per frame** (`updateBilliardsPhysics` splits each
frame's `dtSec` into 4 smaller `billiardsPhysicsStep()` passes) — added after feedback that a hit
"doesn't feel too pool-like." At this game's generously high launch speed, a single large step
could let a fast ball's position jump clean past another ball between frames without the
overlap check ever triggering (classic discrete-collision tunneling) — an occasional "ghost"
pass-through that would absolutely read as physically wrong. Sub-stepping resolves collisions at
a finer time resolution so a fast-moving ball can't skip over another one undetected.

**All size AND motion constants are relative to the table's own width, not the canvas's** —
`BALL_RADIUS_PCT`/`POCKET_RADIUS_PCT` (% of table width), `FRICTION_FACTOR`/`REST_SPEED_FACTOR`
(table-widths/s² and table-widths/s, computed fresh each frame from the *current* table size),
`MAX_LAUNCH_SPEED_FACTOR` (× table width/s). This is the fix for a real reported bug: fullscreen
mode "seems a bit off in terms of scale" compared to compact mode, which "looks great." Root
cause — every size AND the friction deceleration used to be a flat number or a % of raw
`canvas.width` alone, so a very wide fullscreen canvas (vs. a squarer compact one) threw
everything out of proportion with the table itself, and shots even *decelerated* differently
between the two modes since flat-px friction covered a different fraction of a differently-sized
table. `billiardsTableBounds(canvas)` now letterboxes the table to a fixed `TABLE_ASPECT=1.9`
(close to a real table's 2:1), centered in the canvas with `TABLE_MARGIN_PCT` margin, and every
size/motion constant derives from that letterboxed table's own resulting width — both modes now
look and behave identically, just at different absolute pixel sizes. Also retuned while fixing
this: `MAX_LAUNCH_SPEED_FACTOR` dropped from a very high `1.05×canvas.width` to `0.85×table
width`, and friction was raised proportionally (`FRICTION_FACTOR=0.19`) — the old combination let
a full-power shot's *theoretical* friction-only stopping distance vastly exceed the table's own
length, so shots could carom around almost indefinitely rather than rolling to a natural,
weighted-feeling stop, which was likely a real contributor to "doesn't feel pool-like" alongside
the tunneling risk above.

**`TABLE_MARGIN_PCT` is 9, not the original 6 — a second, later fix for a real "slight overlap in
fullscreen" report.** A corner pocket's own radius (`POCKET_RADIUS_PCT` of table width) landed
close enough to the canvas edge at the old margin that `#billiardsPlayArea`'s own rounded corner
(`border-radius:16px; overflow:hidden`, shared with every other canvas game) visibly clipped a
flat arc off it — confirmed by a zoomed-in screenshot of the top-left corner showing the clip
directly, not just inferred from the numbers. 9% leaves the pocket's outer edge tens of px clear
of the canvas boundary in fullscreen. Since every pocket/ball/friction value already derives from
`billiardsTableBounds()` fresh each frame (see above), bumping this one constant was the entire
fix — nothing downstream needed touching.

**A real bug, also caught by testing: dragging the aim preview near/into a pocket could pocket
the cue ball before any shot was ever fired.** Root cause: `billiardsPhysicsStep`'s pocket-
capture check runs on every non-pocketed ball's *current* position every frame, with no velocity
guard — and the cue ball's `x/y` get overwritten every frame during a drag (`cue.x = pull.x;
cue.y = pull.y;`, in the render function, to show the pulled-back preview point). Since physics
runs before render each tick, a drag that pulled the preview point close to a pocket got
processed as "the cue ball is at this position" by the very next physics step, regardless of
whether a shot had been released. Fixed by skipping the cue ball entirely in
`billiardsPhysicsStep` while `cueAwaitingStrike` is true (`if(ball.isCue && cueAwaitingStrike)
continue;`) — the same module-level flag already used elsewhere to distinguish "hasn't been
struck yet" from "is still resolving," now also used to keep the cue ball out of the physics
simulation entirely until it's actually hit, rather than narrowly patching just the pocket check.

**A shot-power gauge (`drawBilliardsPowerMeter`) shows while pulling back**, added alongside the
above per an explicit ask. Reads `pull.power` — the exact 0-1 value the real strike already uses
— so the bar can never disagree with the shot it represents; only shown once `pull.dist > 8`, the
same threshold the aim line/cue stick already gate on. Color ramps green → amber → red with
power, echoing the timer-bar's "filling bar" language elsewhere in the app but recolored so it
also reads as "how hard," not just "how much."

**The rack — including the cue ball — is randomized fresh every turn**, not a fixed layout,
per feedback that a static table felt stale. `placeBallsRandomly()` rejection-samples random
points on the table (up to 80 attempts per ball) until every ball is at least
`MIN_BALL_SEPARATION_FACTOR × radius` from every other one already placed, so nothing ever spawns
overlapping; the cue ball is still biased to the left third of the table (a loose "break
position") so the aiming feel stays familiar turn to turn even though the exact spot moves.
`BILLIARDS_BALLS` in the content file now holds only `{value, color}` — position is generated,
not authored. The cue ball's randomized spot for the turn is stored as `restX/restY` on the ball
object itself (distinct from its live `x/y`, which get temporarily overwritten while dragging to
preview the pulled-back point) — `computeCuePull()`'s anchor and the idle "snap back to rest"
render branch both read `restX/restY`, not a fixed constant, now that there isn't one.

**The ball layout is deliberately NOT a real triangle rack — spread apart with clear space
around each ball**, like a practice-drill setup, even though positions are now randomized. A
real tight rack was tried first and rejected after testing: a tightly-packed cluster absorbs and
redistributes the cue ball's momentum across many glancing sub-collisions (realistic — that's
what an actual break does too), so almost none of that energy survives as one clean shot toward
a pocket even at generous arcade physics — several full-power straight-on test shots at a real
rack pocketed nothing. The rejection-sampled spread keeps every ball with clear space around it,
so aiming at any ONE ball is still a clean, direct hit that keeps most of its transferred speed —
pocketing something stays a real, achievable skill-based outcome most turns, which matters far
more here than rack authenticity. Note that a *dead-straight* shot sends the target ball further
away along the same line, not into a pocket — reaching a pocket needs a slight aiming angle, same
as real pool; this is expected, not a bug (confirmed via testing: an angled test shot pocketed
cleanly where a straight one hadn't).

**A real bug caught during testing, not visible from reading the code in isolation:** the cue
ball's render-time "keep it pinned at the rest position while idle" logic (copied from Sky
Slingshot/Comet Chaos's `!bird.launched`/`cueAwaitingStrike`-style pattern) originally checked
`!state.billiardsShotFired` — but that flag flips back to `false` the instant a shot *resolves*
(while the ball is still resting on the table during the post-shot pause), not just before a
shot is ever fired. The result: the cue ball visually teleported back to its starting spot the
moment physics settled, before the result modal even appeared, undoing the whole point of the
pause (seeing where everything actually ended up). Fixed with a dedicated module-level
`cueAwaitingStrike` flag — `true` only from a fresh rack-load until the cue is actually struck,
`false` for the rest of that turn regardless of resolution state. The pointer-down drag-start
guard had the identical bug (would let a second drag start during the pause) and got the same
fix. Worth remembering for any future drag-launch game: "has this been fired yet" and "is a
shot currently resolving" are NOT the same boolean.

**A fresh rack loads every turn** (`loadBilliardsRack()`, called from `beginBilliardsTurn()`),
same "clean slate each turn" spirit as Sky Slingshot's level reset — with only 6 object balls
and a 10-question game, permanently removing pocketed balls would leave many turns with an
increasingly empty (or eventually bare) table.

**Table & rendering**: a bright, light, rounded-rail table — deliberately NOT the traditional
dark felt look, per an explicit "keep it light, bright, modern and fun" ask, using the reference
photo only for the aiming/stick mechanic, not the visual style. Mint-green felt gradient, coral
rounded rails, 6 pockets (4 corners + 2 long-side midpoints, `billiardsPockets()`) as simple dark
circles. Each object ball shows its point value in a small white "number plate" circle, like a
real numbered pool ball, so the value is always visible without a separate legend lookup during
play. A dotted aim guide line + a wooden cue-stick graphic (trailing backward from the pulled-
back point, length scaling with pull distance) draw live while dragging, using the same
`computeCuePull()` the real strike uses so preview and launch can never disagree.

**Cue ball no longer moves during aim — only the stick pulls back (fix, 2026-07-15).** The
render function used to do `cue.x = pull.x; cue.y = pull.y;` while dragging, physically
repositioning the actual ball sprite to the pulled-back point and drawing the stick trailing
behind THAT — so the white ball itself visibly slid backward as you aimed, per explicit
feedback that "only the cue should move." Fixed by leaving the ball's `x/y` untouched at
`restX/restY` throughout the drag; the stick's tip now starts touching the ball's edge and
retreats further along the aim line as `pull.dist` grows (`tipDist = cue.r*1.3 + pull.dist`),
computed off `pull.anchorX/anchorY` (== `restX/restY`) instead of the old moved-ball point.

**Shot power increased, friction/substeps/flight-cap retuned to match (2026-07-15).**
`MAX_LAUNCH_SPEED_FACTOR` raised `0.85→1.5` per feedback that a full-power shot "felt weak";
`maxPull` (inside `computeCuePull`) raised `0.16→0.21×table width` to give the harder shot more
pull range to build up to. `FRICTION_FACTOR` raised too (`0.19→0.27`) but not proportionally to
the speed increase, so shots now both hit harder AND travel further, not just look faster
covering the same ground. `MAX_FLIGHT_MS` (`6000→7000`) and substep count (`4→6`) both got a
little more headroom to match — full-power straight-line stop time is ~5.7s (comfortably under
the new cap), and more substeps keep the tunneling-safety margin from the original fix intact
at the higher speed.

**Balls now visibly roll instead of sliding as flat static discs (new, 2026-07-15).** Each ball
tracks an `angle` that accumulates every physics step (`angle += (speed/r) * dtSec`, in
`billiardsPhysicsStep`) — the highlight ellipse and the numbered plate rotate together around
the ball's own center at render time. This is a deliberate cosmetic stylization, not physically
-accurate top-down spin (a real ball's topspin axis is horizontal and wouldn't visibly rotate
from directly above) — same "simplified but satisfying" spirit as the rest of this game's
physics. Verified numerically (angle measurably accumulating frame-to-frame during a real shot),
not just by reading the code.

**Pocketing eases a ball in over ~280ms instead of making it vanish on contact (new,
2026-07-15).** Per feedback that pocketing "is pretty janky" — a ball's center crossing a
pocket's capture radius used to call `pocketBall()` (score/particles/sound, `pocketed=true`)
immediately, same frame, regardless of how fast it was moving. Now capture is two-phase:
`startBallCapture()` freezes the ball's velocity and stores its capture start time/position;
`updateBilliardsCaptures()` (called once per rendered frame, after the physics substeps) eases
its position toward the pocket's center and its render scale toward ~8% over `CAPTURE_ANIM_MS`
(280ms, ease-in — accelerates in like gravity taking it), then calls the same `pocketBall()`
finalization (score/particles/sound) once the animation completes. A capturing ball is excluded
from the physics loop, the ball-vs-ball collision pass, AND the "all balls resting" check (which
would otherwise treat its zeroed velocity as "done" before the animation — and therefore the
score — actually finalizes) until it's truly `pocketed`. Confirmed via Playwright that the
`capturing` state genuinely occurs mid-shot during real play, not just in isolated code review.

**Cue ball spawn zone moved off the rail (2026-07-16), fixing a real "can't reach full power"
bug, not just a positioning preference.** `placeBallsRandomly`'s cue range was `place(0.04,
0.3)` — biased left, but 0.04 sits almost touching the left rail. Since `computeCuePull`'s
pulled-back point is clamped to stay inside the table bounds, a cue ball spawned that close to
a rail couldn't be pulled back far enough in that direction to reach `maxPull` — the clamp cut
the drag short well before full power, regardless of how far the player actually dragged.
Moved to `place(0.30, 0.58)` (comfortable clearance from the left rail — the direction most
pull-backs go, since object balls spawn further right at 0.36-0.96 — while still varying turn
to turn). Verified by dragging toward the tightest realistic direction from a fresh spawn and
confirming the power meter now reaches full.

---

## Stage 14 — Neon Arena
The newest stage, added after Billiards, refactored from a standalone prototype the teacher
built separately (a top-down shooter with click-to-move-and-shoot, roaming enemies, four touch-
to-collect pickups, and a single permadeath life). Same team-turn structure as every other
canvas game (answer a question via the shared modal, then play a timed round, turn score adds
to the team total), modeled most closely on **Star Defender** — same `NEON_ROUND_SECONDS=20`
timed round and the exact same "lives are a cosmetic warning, not a fail-state" behavior: losing
all 3 lives never ends the round early, it just floors at 0 and keeps giving the red-flash/heart-
pulse feedback (confirmed by re-reading `stage7-stardefender.js`: `invLives` reaching 0 does not
short-circuit `startInvRound`'s timer loop) — carried over deliberately for consistency rather
than inventing a new fail-state rule.

**This app's first free keyboard movement.** Every other game is click/drag-only; Neon Arena
adds WASD + arrow-key 8-directional movement (`state.neonPlayer.x/y` in % space, polled each
frame from a module-level `neonKeysDown` map, diagonal-normalized, clamped inside the arena) —
genuinely decoupled from aiming, unlike the prototype's original "click both moves and shoots."
Click (or tap) fires toward that point instead, respecting a fixed cooldown
(`NEON_FIRE_COOLDOWN=180ms`). A touch fallback (drag toward a point to move that way; the
initial touch also fires one shot toward it) keeps the stage usable without a keyboard, though
keyboard is the primary intended input for this teacher-led classroom-screen app. The keydown
listener explicitly ignores focused `<input>`/`<textarea>` elements so typing a team name
containing "w/a/s/d" never gets hijacked.

**Enemies (4 tiers, same spawn-cadence/HP/shrink-on-hit/points shape as Star Defender's scout/
brute/dart/boss, just reskinned)**: Drifter (common, 1 HP, +1), Zapper (fast/small, 1 HP, +2),
Juggernaut (tanky, 3 HP, +3, visibly shrinks as it's damaged), and Warden (rare mid-round spawn
via the same ~40%-chance/`setTimeout` scheduling Star Defender's boss uses, 10 HP, +15). All four
tiers were resized smaller in a later pass (e.g. the player `NEON_PLAYER_RADIUS_PCT` 3.2→2.3,
Warden's `radiusPct` 8.5→6.2) after feedback that the arena felt "very cramped" — see the bug
note just below, which turned out to be the bigger contributor to that feeling than raw size
alone. The Warden's silhouette was also redesigned from a 6-plate hexagon (adapted near-verbatim
from Star Defender's boss) into its own 8-spike crown/gear shape, and its rotating dashed "shield
ring" was removed entirely — see the visual-theme paragraph below. Enemies spawn just outside a
random edge and home loosely toward the player with a perpendicular sine wobble
(`updateNeonEnemyMovement`) rather than moving in a straight line, so approach paths read as
organic, not robotic.

**Touching an enemy always destroys it — even during the post-hit invulnerability window** (only
whether it *also* costs a life depends on whether the player was already invulnerable). This
wasn't the original behavior: `checkNeonPlayerCollisions` used to bail out entirely while
`now < state.neonInvulnUntil`, which meant any enemy that wandered into contact range during that
~1-second window just sat there, visibly overlapping the player, uncleared, until the window
expired — a real, code-level cause of the "very cramped" complaint, not just a raw-size issue.
Now contact always clears the touching enemy (white "safe" particles instead of red if it was a
free/invulnerable clear), and invulnerability doubles as a legible "safe to plow through enemies"
window rather than a silent rendering glitch.

**Pickups are collected by walking over them, not shooting** — natural now that the player moves
freely. They sit at a random point in the arena and expire after 7 seconds if not collected
(`spawnedAt` timestamp, filtered each tick), rather than falling from the top like Star
Defender's. Three are "rest of round" boolean flags (`state.neonPowerActive`/`neonOverdriveActive`/
`neonSpreadActive`, reset at the start of every round): Power Core (bigger, more forgiving
bullets, 2 damage instead of 1), Overdrive (55% faster bullet travel speed), Spread Core
(5-pellet fan shot instead of 1, ±0.25 rad each side). The fourth, **Nova Bomb, is an instant
one-shot effect, not a banked charge**: touching it immediately runs `triggerNeonNovaBomb()`, an
instant radius hit-test against every live enemy (26% of arena width) that kills anything caught
in range and awards its points — deliberately simplified from the prototype's original "explosion
particles that separately fly outward and collide with enemies" into one direct hit-test, same
visual/audio payoff (a big particle burst + a filtered-noise boom) for far less code.

**Audio is fully resynthesized via Web Audio** (`sfxNeonShot`/`sfxNeonHitEnemy`/`sfxNeonDestroy`/
`sfxNeonPickup`/`sfxNeonHit`/`sfxNeonBomb`) — the prototype's original `<audio>`/`.wav` files
(background music + sfx) are **not** reused anywhere; this app's sound system is Web Audio
oscillators/noise only, no audio assets, same as every other stage.

**Visual theme: a synthwave/neon-grid arena**, distinct from every other stage's theme (Sahara
desert, deep-space starfield ×2, mint-felt pool table, dark carnival wheel). `renderNeonBackground`
draws a dark navy-to-black gradient, a glowing pink horizon band, and a perspective grid (fixed
horizontal lines spaced by `t²` easing toward the bottom edge + lines converging toward a
vanishing point at the horizon center) — cheap canvas primitives, same cost class as Star
Defender's/Comet Chaos's starfield loops. Player is a lime-green glowing swept-wing jet silhouette
(a nose, a notched tail between two swept wingtips) that rotates to face the last aim direction
(`neonAimAngle`, updated on every shot) — redesigned from an earlier, plainer kite shape. The
jet's white cockpit dot (present in that redesign) was removed outright per later feedback —
just the glowing wing silhouette now, no interior marking. **Neither the player nor the Warden
boss is surrounded by a ring anymore** —
an earlier pass drew a stroke ring around the player unconditionally (not just during
invulnerability, which was the actual bug — it was visible at all times) and a rotating dashed
"shield ring" around the Warden; both were removed outright per feedback calling them a "strange
circle around user and certain enemies." The player's existing alpha-flicker is the only
invulnerability cue now; the Warden keeps its pulsing white reactor core but nothing encircling
it. Enemies are neon-outlined shapes per type (diamond/dart/hexagon/8-spike crown boss, same
shape-per-type convention as Star
Defender); pickups are pulsing glowing icons (diamond/lightning-zigzag/three-dot-fan/ringed-
circle-with-cross) distinguished by color, not just shape.

**Player and projectiles shrunk again, projectiles reshaped into bullets (2026-07-16)**:
`NEON_PLAYER_RADIUS_PCT` `2.3→1.7`, `NEON_BULLET_RADIUS_PCT` `1.0→0.55`,
`NEON_BULLET_RADIUS_BIG_PCT` `1.5→0.85`. Projectiles are no longer plain circles — first pass
drew a tapered capsule (`quadraticCurveTo` on both sides, pointed at the leading edge); a same-
day follow-up ask to match Star Defender's own projectile specifically replaced that with Star
Defender's exact simpler shape instead — a plain `ctx.ellipse` (narrow width, longer length,
glow via `shadowBlur`, no custom path). Star Defender's ellipse never needs rotating since its
projectile only ever travels straight up; Neon's fly in any direction, so the same shape rotates
to face `Math.atan2(vy,vx) - Math.PI/2` here (the `-Math.PI/2` because an unrotated ellipse's
long axis already points "down" in canvas terms, so that offset aligns it with the travel
direction instead of perpendicular to it). Collision still uses a simple circular radius
(`NEON_BULLET_RADIUS_PCT`/`_BIG_PCT`), not the elongated shape — purely a rendering change.

**Nova Bomb reworked from an instant radius-kill back into real flying shrapnel (2026-07-16)**,
per explicit reference to "the mechanics I had used in the previous version: releases
projectiles" — the standalone prototype's original bomb spawned particles that separately flew
and collided; the refactor into this app had simplified that into one instant
`Math.hypot(...) < radiusPct` check killing everything in range the same frame, which read as a
flash rather than an explosion. `triggerNeonNovaBomb(x, y, canvas)` now only kicks off
`NEON_SHRAPNEL_COUNT` (18) pieces radiating outward from the detonation point
(`state.neonShrapnel`, a new array alongside `neonBullets` in state.js) at `NEON_SHRAPNEL_SPEED`
(95%/s, matching the base bullet speed) — all scoring/death moved into a new
`updateNeonShrapnel(dtSec, canvas)` (called from `updateNeonGame`, mirrors
`updateNeonBullets`'s enemy-collision logic almost exactly) as pieces actually connect, not at
the moment the pickup is collected. Two deliberate differences from a normal bullet: shrapnel
still **instant-kills on contact** regardless of enemy HP (preserving the bomb's original power
— only the delivery method changed, not its strength) and is **not consumed on a hit** (no
`break`/removal), so a single piece can pierce through several enemies lined up in its path,
preserving the "clears a crowd" payoff the instant version had. Each piece fizzles once it's
traveled `NEON_SHRAPNEL_MAX_DIST` (32%) from its origin — the explosion's effective blast
radius — rather than flying indefinitely. Rendered with the same rotated-ellipse language as the
bullets above, tinted in the bomb's own red/orange so a detonation reads as "many small
fragments," not more player bullets. `state.neonShrapnel` gets reset alongside `neonBullets` at
round start; verified 18 pieces actually spawn and radiate outward on a real pickup collection,
not just that the code parses.

---

## Known Limitations / Pending Work

1. **Swarm ball non-overlap with bombs/gems**: `getSwarmPositions()` doesn't check against live bombs or gems — only against other balls. Low probability collision but possible.
2. **Stage 9 unscramble answer checking**: Chip IDs are per-render (now per-question, in `qsState.scrambleState[qi]`); refreshing mid-section loses state. Not a real bug (teachers control pacing) but worth noting.
3. **Boss rotation angle**: Stored as `e.angle` on each enemy object (not in state). Lost if round is cancelled and resumed — boss will restart rotation from 0. Cosmetic only.
4. **`color-mix()` browser support**: IE and older mobile browsers don't support it. Team card backgrounds silently degrade to `var(--surface)` (uncolored).
5. **Ball Pop background blobs**: `state.popBgBlobs` is seeded lazily in `renderPopCanvas()` on first call. On restart, cleared via `popBgBlobs: []` in the state reset, which causes a re-seed on next render. Working as intended.
6. **Comet Chaos black hole swallow path**: verified correct by code review (identical distance-check structure to the already-live-tested target-hit path, same audio/particle techniques already proven safe elsewhere) and by extensive play confirming zero errors across many gravity-heavy shots, but not confirmed by a live-triggered swallow in testing — deterministically aiming a shot through chaotic multi-planet gravity toward a specific point turned out to be impractical to script reliably (the gravity is doing exactly what it's supposed to: bending the path unpredictably). Worth a manual click-through check if this code path is ever touched again.
7. **Billiards ball layout is not a real pool rack, deliberately**: `BILLIARDS_BALLS` spreads the
   6 object balls apart with clear space around each one, rather than a tight triangle rack.
   Tried a real rack first and confirmed via testing that a tightly-packed cluster absorbs and
   redistributes the cue ball's momentum across many glancing sub-collisions (realistic — that's
   what an actual break does too), so almost none of that energy survives as one clean shot
   toward a pocket even at generous arcade physics — several full-power straight test shots
   pocketed nothing. The spread layout fixes this: aiming at any one ball is a clean, direct hit
   that keeps most of its transferred speed, making pocketing a real, achievable skill-based
   outcome most turns. Also note the sink is only achievable at a slight *angle* — a dead-straight
   shot sends the target ball further away along the same line, not toward a pocket, same as
   real pool aiming.

---

## Data Content (quick reference)

**MC_QUESTIONS** — 10 comparative MC questions (tall/big/nice/hot/happy/safe/easy/busy/good/bad)

**SEMI_ITEMS** — 10 sentence-build items (word chips)

**SCAFFOLD_FRAMES** — 5 sentence starters for Free Practice

**POP_QUESTIONS** — 10 comparative questions (reused for Ball Pop)

**INV_QUESTIONS** — 10 different comparative questions (for Star Defender)

**WHEEL_QUESTIONS** — 10 comparative questions, each with its own point value 10-30 (for Spin the Wheel)

**BILLIARDS_QUESTIONS** — 10 comparative questions (for Billiards)

**NEON_QUESTIONS** — 10 comparative questions (for Neon Arena)

**QS_SETS** — 4 sets × 5 questions each (gap fill, scramble, sentence, free)

**RULES** — 4 spelling rules: Add -er, Add -r, Double+-er, y→ier

**COMPARE_DEMOS** — 4 visual comparisons: Tower, Car, Bag, Path (icon type + valueA + valueB)

---

## Testing
This project had no committed test suite until a Modularity/Performance/Stability review flagged
it as the top Major finding — every prior verification pass (there have been many, see the
session history in persistent memory) was a one-off Playwright script written into a scratchpad
temp directory and thrown away, never repeatable. `package.json`/`playwright.config.js`/`tests/`
fix that; they're dev-tooling only and change nothing about how the site deploys (still a plain
static build, zero bundling — see "Deployment" below).

**Setup** (once): `npm install`, then `npx playwright install chromium`.
**Run**: `npm test` — `playwright.config.js`'s `webServer` auto-launches `python -m http.server
8934` (the exact command used by hand all through this project's history) and points the suite
at it; no separate server needs to be running first.

**What's covered**: `tests/full-regression.spec.js` sweeps all 14 stages via the stepper
(`locator.evaluate(el => el.click())` to bypass Playwright's visibility gate, since fullscreen
game stages hide the visible stepper by design) and asserts zero console/page errors, plus a few
deeper stage-1/2/6/9 smoke checks. `tests/team-games.spec.js` plays a real full turn in Billiards
and Neon Arena (question → play → result modal → score updates) as a **starter pair, not
exhaustive coverage of all 8 team-based games** — extending the same pattern to the other 6
(Star Defender, Spin Wheel, Plinko, Sky Slingshot, Comet Chaos, Ball Pop) is a natural next step,
not something silently skipped. The Billiards test's result-modal assertion was updated
2026-07-15 to read `.result-pill.active .result-pill-score` instead of the now-deleted
`.modal-result-big` — a live example of why this suite is worth having: it would have (and did,
when run) caught the result-modal simplification breaking the old selector immediately.

**The suite runs serially (`workers: 1`), not in parallel — this was found by testing, not
assumed.** The default `fullyParallel` config intermittently failed several tests when all 7 ran
at once against `python -m http.server` (simple CPU/resource contention — two of the specs drive
a real ~20s game loop each). Re-running the exact same failing tests alone always passed. Rather
than chase a faster-but-flaky config, `workers: 1` trades a slightly longer run (under a minute
for this suite's size) for consistent, trustworthy pass/fail results — the entire point of adding
a test suite in the first place. Worth remembering if this suite ever grows large enough that
serial execution becomes genuinely slow: the fix then is a sturdier dev server (or splitting
game-loop-heavy specs into their own serial project while letting cheap smoke tests parallelize),
not just cranking workers back up.

---

## Deployment

- **Repo:** `jackthejellyfish/classroom-games` (GitHub)
- **Host:** Vercel — `classroom-games-omega.vercel.app`
- **Root dir:** repo root
- **Deploy trigger:** push to main → Vercel auto-deploys in ~30s
- **File location in repo:** root level (not in a subfolder)

---

## Possible Next Steps (as discussed)

The teacher mentioned these but they were deferred to future sessions:
- **Fine-tuning any of the 14 stages** based on classroom testing
- **Additional question sets** for the MC/guided/ball-pop/invaders games
- **Adapting the whole file** to a different grammar topic (this is designed to be data-driven — changing the RULES array and question arrays is the primary lever)
- **A separate "teacher settings" panel** (question editing, round time adjustment) — the team colour picker part of this is now built (`js/teamColorPicker.js`)

---

*This section is a historical snapshot from the original pre-refactor single-file version (`comparatives-lesson.html`, 4,273 lines). The rest of this document is kept current every session — see the top-level sections above for the actual current architecture.*
