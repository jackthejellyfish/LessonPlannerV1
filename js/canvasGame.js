/* =========================================================
   CANVAS GAME HELPER
   Every canvas-based game (Ball Pop's particle layer, Star Defender,
   Billiards, Neon Arena, Fruit Ninja) needs the exact same three
   things: size the canvas's pixel buffer to match its play area, redo
   that on a debounced window resize, and hand back a cached element
   reference instead of re-querying the DOM every animation frame —
   this was duplicated near-identically five times (each with its own
   copy of the same debounce/resize logic, and each update/render pair
   re-fetching the canvas via getElementById on every single frame).
   Now it's one factory.
========================================================= */
/* ---- Backing-buffer resolution policy ----
   WHY THIS EXISTS — measured, see tests/perf.spec.js. On a classroom
   display these play areas are ~1544x784, so a 1:1 backing buffer is
   1.2 MILLION pixels. Isolation testing found that size alone was the
   entire cost of the heavy games: on an idle Ball Pop stage, a frame
   that cleared the canvas and drew NOTHING AT ALL still only managed
   22fps, while the identical loop against a 400x200 buffer hit 59fps.
   It was not the blobs, the particles, the shadows or the DOM — it was
   the number of pixels being touched per frame.

   So every game canvas is capped to MAX_BUFFER_WIDTH pixels wide and
   upscaled by CSS (every one of them is already `width:100%;
   height:100%`, so this needs no per-game CSS). What these canvases
   draw — soft glows, particles, gradients, thick strokes — upscales
   essentially invisibly, which is exactly why this is affordable.

   Games stay resolution-independent because they all derive sizes and
   positions from canvas.width/height rather than hardcoded pixels, so
   a smaller buffer scales the whole scene rather than cropping it.

   `renderScale` lets a game ask for an even smaller buffer; Ball Pop
   does, since its canvas is a pure decorative glow overlay drawn
   behind real DOM buttons and has no crisp content to protect.

   `maxBufferWidth` is the opposite lever, and the Spin Wheel is why it
   exists: this cap is tuned for SOFT content — glows, particles,
   gradients — where an upscale is invisible. That wheel draws fine arcs
   and crisp NUMBERS, and upscaling those from an 820px buffer left it
   looking blurry and out of place beside every other stage. A game may
   raise its own cap when it has genuinely crisp content AND can afford
   the pixels; the wheel can, because it only animates during a spin
   rather than running a loop the whole time its stage is open. */
const MAX_BUFFER_WIDTH = 820;

function bufferSize(playArea, renderScale, maxBufferWidth){
  const w = playArea.clientWidth, h = playArea.clientHeight;
  if(w <= 0 || h <= 0) return { w: 0, h: 0 };
  const scale = Math.min(renderScale, maxBufferWidth / w);
  if(scale >= 1) return { w, h };
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

export function createCanvasResizer(canvasId, playAreaId, onResize, { renderScale = 1, maxBufferWidth = MAX_BUFFER_WIDTH } = {}){
  let canvasEl = null;

  function getCanvas(){
    if(!canvasEl) canvasEl = document.getElementById(canvasId);
    return canvasEl;
  }

  // Every call also schedules one extra pass a frame later — cheap
  // insurance against the box not having fully settled yet at the exact
  // synchronous moment resize() first ran (e.g. right as a stage becomes
  // visible, or right after a CSS class toggle like compact mode, where
  // the "final" box size is only guaranteed reliable after the browser's
  // next layout/paint). A stale canvas buffer reads as squished/
  // stretched content, so this errs toward double-checking once too
  // often rather than risk it once too few; a second identical
  // measurement is a cheap no-op.
  let settleFrame = null;
  function resize(){
    const canvas = getCanvas();
    const playArea = document.getElementById(playAreaId);
    if(!canvas || !playArea) return;
    const { w, h } = bufferSize(playArea, renderScale, maxBufferWidth);
    canvas.width = w;
    canvas.height = h;
    if(onResize) onResize(canvas);

    if(settleFrame === null){
      settleFrame = requestAnimationFrame(() => {
        settleFrame = null;
        const c = getCanvas(), pa = document.getElementById(playAreaId);
        if(!c || !pa) return;
        const next = bufferSize(pa, renderScale, maxBufferWidth);
        if(c.width !== next.w || c.height !== next.h){
          c.width = next.w;
          c.height = next.h;
          if(onResize) onResize(c);
        }
      });
    }
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  return { resize, getCanvas };
}
