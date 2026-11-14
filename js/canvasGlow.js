/* =========================================================
   CACHED GLOW / BACKDROP LAYERS

   WHY THIS EXISTS — measured, not guessed. `tests/perf.spec.js` under
   6x CPU throttling found the two heaviest games were spending almost
   all of their frame budget on canvas BACKGROUNDS, not on gameplay:

     Ball Pop, idle, no balls, no particles ....... 50.0 ms/frame
     Ball Pop, same, with its 8 bokeh blobs cut ... 16.7 ms/frame
     Fruit Ninja, mid-round ....................... 50.0 ms/frame

   The cause is the same in both: filling a LARGE, alpha-blended
   gradient across a ~1544x784 canvas, every single frame. A radial
   gradient fill has to be rasterized and blended pixel by pixel; eight
   of them covering most of the canvas is several million blended
   pixels per frame, which a work laptop's software rasterizer cannot
   do 60 times a second.

   The fix in both cases is the same, and it's the oldest trick there
   is: rasterize once, then blit. `drawImage` of an already-rasterized
   bitmap is a fundamentally cheaper operation than re-evaluating a
   gradient per pixel — and it costs nothing visually, because the
   thing being drawn is identical every frame.

   Two helpers, because the two cases differ in what stays constant:
     - getGlowSprite(): one blob/glow, moves and pulses every frame,
       but its APPEARANCE is fixed -> cache the sprite, move the blit.
     - createBackdrop(): a whole background layer that is completely
       static until the canvas resizes -> cache the entire layer.

   Both caches are keyed so they survive across frames but rebuild on
   the things that actually change them (colour, size).
========================================================= */

/* ---- Colour parsing ------------------------------------------------
   Callers pass ordinary CSS colours (the same hex strings already used
   everywhere else in this app); the sprite needs the raw channels so it
   can fade the SAME colour from opaque to transparent. Alpha in the
   input is ignored on purpose — opacity is applied at blit time via
   globalAlpha, so one cached sprite serves every opacity a caller wants
   instead of needing one sprite per (colour, alpha) pair. */
function parseColor(color){
  const c = String(color).trim();
  if(c[0] === '#'){
    const hex = c.slice(1);
    const full = hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex;
    const n = parseInt(full.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/-?\d+(\.\d+)?/g);
  return m ? [Number(m[0]) | 0, Number(m[1]) | 0, Number(m[2]) | 0] : [255, 255, 255];
}

/* ---- Radial glow sprites ----
   Rendered once per colour at a fixed resolution and then scaled at
   blit time. SPRITE_SIZE is a deliberate trade: big enough that a large
   background blob scaled up from it doesn't show banding, small enough
   that building one is cheap and a handful of them cost no real memory
   (256*256*4 bytes ~= 260KB each, and this app uses under a dozen
   distinct glow colours in total). */
const SPRITE_SIZE = 256;
const spriteCache = new Map();

// `falloff` shapes the fade: 1 is a plain linear ramp to transparent
// (what a soft background blob wants), higher values concentrate the
// brightness in the middle (what a tight entity glow wants).
export function getGlowSprite(color, falloff = 1){
  const key = color + '|' + falloff;
  let sprite = spriteCache.get(key);
  if(sprite) return sprite;

  const [r, g, b] = parseColor(color);
  sprite = document.createElement('canvas');
  sprite.width = sprite.height = SPRITE_SIZE;
  const sctx = sprite.getContext('2d');
  const mid = SPRITE_SIZE / 2;
  const grad = sctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  // Explicit intermediate stops rather than two endpoints: a 2-stop
  // radial ramp is visibly linear and reads as a flat disc with a hard
  // edge once scaled up to background-blob size.
  for(let i = 0; i <= 8; i++){
    const t = i / 8;
    grad.addColorStop(t, `rgba(${r},${g},${b},${Math.pow(1 - t, falloff + 1)})`);
  }
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  spriteCache.set(key, sprite);
  return sprite;
}

// Blits a cached glow centred on (x, y) at the given RADIUS in px.
// `alpha` is the peak opacity at the centre — apply the pulse/fade here
// rather than baking it into the sprite (see getGlowSprite above).
export function drawGlow(ctx, x, y, radius, color, alpha = 1, falloff = 1){
  if(alpha <= 0.004 || radius <= 0) return;
  const sprite = getGlowSprite(color, falloff);
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = prev;
}

/* ---- Whole-backdrop caching ----
   For a background that is genuinely static between resizes (Fruit
   Ninja's vertical gradient, Neon Arena's starfield). `renderFn(ctx,
   w, h)` is called only when the size actually changes; every other
   frame is a single opaque blit.

   Returns a `draw(ctx, canvas)` matching the call shape the games'
   existing renderXBackground() functions already have, so adopting it
   is a one-line swap at each call site. */
export function createBackdrop(renderFn){
  let layer = null;
  let w = 0, h = 0;

  return function draw(ctx, canvas){
    if(canvas.width === 0 || canvas.height === 0) return;
    if(!layer || w !== canvas.width || h !== canvas.height){
      w = canvas.width;
      h = canvas.height;
      layer = layer || document.createElement('canvas');
      layer.width = w;
      layer.height = h;
      const lctx = layer.getContext('2d');
      lctx.clearRect(0, 0, w, h);
      renderFn(lctx, w, h);
    }
    // Backdrops are opaque and cover the full canvas, so this doubles as
    // the frame's clear — callers that used to clearRect first no longer
    // need to, and 'copy' skips blending the blit entirely.
    const prevOp = ctx.globalCompositeOperation;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'copy';
    ctx.globalAlpha = 1;
    ctx.drawImage(layer, 0, 0);
    ctx.globalCompositeOperation = prevOp;
    ctx.globalAlpha = prevAlpha;
  };
}
