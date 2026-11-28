# New Lesson Request Template

Copy this file, fill in the sections below for the new grammar/vocab topic,
and hand it to Claude (paste the file or its content into the chat, plus any
textbook screenshots as images in the same message). See "What Claude does
with this" at the bottom for what comes back.

---

## 1. Identity

- **Lesson id** (short, lowercase, hyphenated — used internally, never shown): e.g. `past-simple`
- **Title** (shown on the lesson-select card): e.g. `Past Simple: Regular Verbs`
- **Tagline** (one sentence, shown under the title on the card):
- **Objective** (one sentence: "By the end of this lesson, you will be able to ___"):

## 2. Grammar shape

Pick whichever describes the target structure — this decides whether Stage 2's
existing rule-card format can be reused as-is or needs a small new rendering
branch (see the memory note on this):

- [ ] **Word-transformation** — one word changes form by adding/changing a suffix
      (e.g. tall→taller, happy→happier). List the spelling-rule categories:
      | Rule name | Formula | 3 examples (base → changed) |
      |---|---|---|
- [ ] **Modal/auxiliary positive-negative** — a fixed auxiliary word slots in
      before a verb, same for every subject pronoun (e.g. should/shouldn't,
      can/can't, must/mustn't). Give a few example sentences per subject:
      | Subject | Positive | Negative |
      |---|---|---|
- [ ] **Something else** — describe the pattern in a sentence or two, and give
      5-6 example sentences showing it in use. Claude will figure out the
      closest fit or flag if Stage 2 needs custom rendering.

## 3. Core vocabulary / building blocks

The words or short phrases every stage's questions get built from. Aim for
10-14 (more is fine, fewer than ~8 makes some game stages repetitive). If the
source is a textbook page, just paste/describe the vocabulary list — a
screenshot works too.

-
-
-

## 4. Example sentences

3-6 full sentences using the target structure, ideally covering different
subjects/vocab so Claude can see the pattern's range (used for Stage 1's
illustrated examples and Stage 2's demo cards):

-
-
-

## 5. Question phrasing

How should a question be worded? (e.g. "What is the comparative of X?" or
"You've got X. What should you do?") One example is usually enough — Claude
will vary phrasing/subject across the game stages for variety the way the
Health lesson does.

## 6. Anything else worth knowing

Irregular forms, false friends, things that don't fit the pattern cleanly,
tone/register notes, or source material (textbook name/unit, screenshots) —
whatever would help get it right without back-and-forth.

---

## What Claude does with this

Reads `js/lessons.js` for the current lesson registry, adds a new entry there
(title/tagline/objective/print titles/question template), then adds a
matching dataset to every `js/content/stage*.js` file's `applyLesson()`
switch — game-stage question banks (`{prompt,answer}`, one file per game,
**15 questions each**, so 150 per lesson; a game asks 10 and the class
meets new ones on a replay) get generated with varied phrasing/subjects
from the vocab list; Stage 4/9/5 get
hand-written sentences/frames; Stage 2 gets rule cards (reusing the existing
`[base, suffix]` shape if it fits the grammar type above) and, if the
Word-transformation vs Modal shape doesn't apply, may need a couple of new
small SVG icon cases added to `buildCompareIcon()`. No game/rendering logic
changes for a normal vocab-substitution lesson — see the "adding a lesson"
memory for the full checklist and gotchas.
