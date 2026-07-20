/* =========================================================
   CANVAS GAME HELPER
   Every canvas-based game (Ball Pop's particle layer, Star Defender,
   Plinko, Sky Slingshot, Comet Chaos) needs the exact same three
   things: size the canvas's pixel buffer to match its play area, redo
   that on a debounced window resize, and hand back a cached element
   reference instead of re-querying the DOM every animation frame —
   this was duplicated near-identically five times (each with its own
   copy of the same debounce/resize logic, and each update/render pair
   re-fetching the canvas via getElementById on every single frame).
   Now it's one factory.
========================================================= */
export function createCanvasResizer(canvasId, playAreaId, onResize){
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
    canvas.width = playArea.clientWidth;
    canvas.height = playArea.clientHeight;
    if(onResize) onResize(canvas);

    if(settleFrame === null){
      settleFrame = requestAnimationFrame(() => {
        settleFrame = null;
        const c = getCanvas(), pa = document.getElementById(playAreaId);
        if(!c || !pa) return;
        if(c.width !== pa.clientWidth || c.height !== pa.clientHeight){
          c.width = pa.clientWidth;
          c.height = pa.clientHeight;
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
