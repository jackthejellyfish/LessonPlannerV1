/* =========================================================
   ADAPTIVE QUALITY ("lite mode")
   The games are tuned to hold 60fps on an ordinary laptop, but some
   classroom PCs drive a 4K board through a weak (or blocklisted)
   graphics chip. Rather than make every machine look plainer to suit
   the slowest one, the games report their frame times here, and if a
   machine is SUSTAINEDLY slow the app switches itself into lite mode:

     - half the particles per burst          (particleCount)
     - no soft glow sprites behind entities   (canvasGlow.drawGlow)
     - no faint outer ring on shockwaves      (canvasEffects)
     - a lower-resolution canvas buffer       (canvasGame)
     - decorative CSS loops switched off       (body.low-quality)

   None of these change gameplay — sizes, hit areas, speeds and scoring
   are untouched. It only ever steps DOWN (once a machine has proven
   slow, flipping back and forth would be worse than either), and it
   lasts for the browser session.

   Overrides, for a teacher or for testing:  ?lite=1  forces it on,
   ?lite=0  forces it off. Add  ?fps  to see the frame meter
   (js/fpsMeter.js), which also shows whether lite mode is on.
========================================================= */

// Under 45fps for three whole seconds running counts as "struggling".
// Long enough that one heavy moment (a mega explosion) can't trip it.
const SLOW_FPS = 45;
const SLOW_WINDOWS = 3;
const PARTICLE_SCALE = 0.45;
const SESSION_KEY = 'lpa-lite-mode';

const listeners = new Set();

function readOverride(){
  try {
    const v = new URLSearchParams(window.location.search).get('lite');
    if(v === '1' || v === '') return true;
    if(v === '0') return false;
  } catch(_) { /* ignore */ }
  return null;
}

const override = readOverride();
let lowQuality = override !== null ? override : readSession();

function readSession(){
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch(_) { return false; }
}

function applyBodyClass(){
  if(document.body) document.body.classList.toggle('low-quality', lowQuality);
}
applyBodyClass();

export function isLowQuality(){ return lowQuality; }

// Scales a particle burst's size. Always at least 1, so every effect
// still visibly happens.
export function particleCount(n){
  return lowQuality ? Math.max(1, Math.ceil(n * PARTICLE_SCALE)) : n;
}

// Call once per frame from a game loop. Frames are counted in one-second
// windows of wall-clock time; three slow windows in a row (under
// SLOW_FPS) switch lite mode on. Counting per window rather than keeping
// a running average matters: a struggling PC alternates quick and slow
// frames, and an average hovering around the threshold kept resetting.
// The loop's own dt is deliberately not used: every game clamps it (to
// 50ms) for physics stability, which would hide a 200ms frame.
let lastFrameAt = 0;
let windowStart = 0;
let windowFrames = 0;
let slowWindows = 0;
export function noteFrame(){
  if(lowQuality || override === false) return;
  const now = performance.now();
  const gap = now - lastFrameAt;
  lastFrameAt = now;
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
    if(slowWindows >= SLOW_WINDOWS) enableLowQuality();
  }
}

let lastWindowFrameMs = 1000 / 60;
export function averageFrameMs(){ return lastWindowFrameMs; }

export function onQualityChange(fn){ listeners.add(fn); }

function enableLowQuality(){
  lowQuality = true;
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch(_) { /* ignore */ }
  applyBodyClass();
  listeners.forEach(fn => fn(lowQuality));
  // Every canvas re-measures on a window resize (createCanvasResizer),
  // which is what picks up the lower buffer resolution.
  window.dispatchEvent(new Event('resize'));
}
