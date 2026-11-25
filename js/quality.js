/* =========================================================
   ADAPTIVE QUALITY ("lite mode")
   The games are tuned to hold 60fps on an ordinary laptop, but some
   classroom PCs drive a 4K board through a weak (or blocklisted)
   graphics chip. Rather than make every machine look plainer to suit
   the slowest one, the games report their frame times here, and if a
   machine is SUSTAINEDLY slow the app steps itself down a level:

     level 1 (lite)
       - half the particles per burst          (particleCount)
       - no soft glow sprites behind entities   (canvasGlow.drawGlow)
       - no faint outer ring on shockwaves      (canvasEffects)
       - canvas buffers at 70%                  (canvasGame)
       - decorative CSS loops switched off       (body.low-quality)
     level 2 (lite, for a PC still under 45fps at level 1)
       - all of the above, canvas buffers at 50% and a third of the
         particles. Half the buffer width is a quarter of the pixels.

   None of these change gameplay — sizes, hit areas, speeds and scoring
   are untouched. It only ever steps DOWN (once a machine has proven
   slow, flipping back and forth would be worse than either).

   The level is REMEMBERED on this PC (localStorage) for two weeks, so
   a slow classroom PC starts the next lesson in lite mode instead of
   stuttering for the first seconds of every game until it trips again
   (it used to be sessionStorage, forgotten whenever the browser closed).

   The teacher can also switch it by hand with the in-game button
   (#liteModeBtn, setLiteMode()). A choice made by hand is kept on this
   PC with no expiry, and turning lite mode OFF by hand stops it from
   switching itself back on.

   Overrides, for testing:  ?lite=1 / ?lite=2 force a level, ?lite=0
   forces full quality AND forgets the remembered level.
   Add  ?fps  to see the frame meter (js/fpsMeter.js), which also shows
   the level.
========================================================= */

// Under 45fps for three whole seconds running counts as "struggling".
// Long enough that one heavy moment (a mega explosion) can't trip it.
const SLOW_FPS = 45;
const SLOW_WINDOWS = 3;
const MAX_LEVEL = 2;
// Per level: canvas buffer scale, particle scale.
const BUFFER_SCALE = [1, 0.7, 0.5];
const PARTICLE_SCALE = [1, 0.45, 0.3];
const STORE_KEY = 'lpa-quality';
const REMEMBER_MS = 14 * 24 * 60 * 60 * 1000;

const listeners = new Set();

function readOverride(){
  try {
    const v = new URLSearchParams(window.location.search).get('lite');
    if(v === '1' || v === '') return 1;
    if(v === '2') return 2;
    if(v === '0'){
      try { localStorage.removeItem(STORE_KEY); } catch(_) { /* ignore */ }
      return 0;
    }
  } catch(_) { /* ignore */ }
  return null;
}

// { level, manual }. An automatic level lasts REMEMBER_MS; a level the
// teacher picked by hand lasts until they change it.
function readStored(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if(!saved) return { level: 0, manual: false };
    const lvl = Math.max(0, Math.min(MAX_LEVEL, saved.level | 0));
    if(saved.manual) return { level: lvl, manual: true };
    if(!(lvl > 0) || !(Date.now() - saved.at < REMEMBER_MS)) return { level: 0, manual: false };
    return { level: lvl, manual: false };
  } catch(_) { return { level: 0, manual: false }; }
}
function store(manual){
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ level, at: Date.now(), manual })); } catch(_) { /* ignore */ }
}

const override = readOverride();
const stored = readStored();
let level = override !== null ? override : stored.level;
let manual = override === null && stored.manual;
// Whether a slow PC may step itself down: not under a ?lite= override,
// and not after the teacher switched lite mode off by hand.
const mayStepDown = () => override === null && !(manual && level === 0);

function applyBodyClass(){
  if(document.body) document.body.classList.toggle('low-quality', level > 0);
}
applyBodyClass();

export function isLowQuality(){ return level > 0; }
export function qualityLevel(){ return level; }
// How much of its usual buffer width a game canvas gets (js/canvasGame.js).
export function bufferScale(){ return BUFFER_SCALE[level]; }

// Scales a particle burst's size. Always at least 1, so every effect
// still visibly happens.
export function particleCount(n){
  return level > 0 ? Math.max(1, Math.ceil(n * PARTICLE_SCALE[level])) : n;
}

// Call once per frame from a game loop. Frames are counted in one-second
// windows of wall-clock time; three slow windows in a row (under
// SLOW_FPS) step the level down. Counting per window rather than keeping
// a running average matters: a struggling PC alternates quick and slow
// frames, and an average hovering around the threshold kept resetting.
// The loop's own dt is deliberately not used: every game clamps it (to
// 50ms) for physics stability, which would hide a 200ms frame.
let lastFrameAt = 0;
let windowStart = 0;
let windowFrames = 0;
let slowWindows = 0;
export function noteFrame(){
  const now = performance.now();
  const gap = now - lastFrameAt;
  lastFrameAt = now;
  if(level >= MAX_LEVEL || !mayStepDown()) return;
  // A gap this long is a pause (a modal, a turn change, a hidden tab),
  // not a slow frame: start a fresh window.
  if(gap > 500){ windowStart = now; windowFrames = 0; return; }
  windowFrames++;
  const elapsed = now - windowStart;
  if(elapsed >= 1000){
    lastWindowFrameMs = elapsed / windowFrames;
    const fps = (windowFrames * 1000) / elapsed;
    slowWindows = fps < SLOW_FPS ? slowWindows + 1 : 0;
    windowStart = now;
    windowFrames = 0;
    if(slowWindows >= SLOW_WINDOWS) stepDown();
  }
}

let lastWindowFrameMs = 1000 / 60;
export function averageFrameMs(){ return lastWindowFrameMs; }

export function onQualityChange(fn){ listeners.add(fn); }

function stepDown(){
  // The next level gets its own three seconds to prove itself, starting
  // after the stall the resize below causes.
  setLevel(Math.min(MAX_LEVEL, level + 1), manual);
}

// The in-game button: on is level 1 (a PC still too slow there can step
// on down to level 2 by itself), off is full quality and stays that way.
export function setLiteMode(on){
  if(on === (level > 0)) return;
  setLevel(on ? 1 : 0, true);
}

function setLevel(next, byHand){
  level = next;
  manual = byHand;
  slowWindows = 0;
  lastFrameAt = 0;
  store(byHand);
  applyBodyClass();
  listeners.forEach(fn => fn(level > 0));
  // Every canvas re-measures on a window resize (createCanvasResizer),
  // which is what picks up the lower buffer resolution.
  window.dispatchEvent(new Event('resize'));
}
