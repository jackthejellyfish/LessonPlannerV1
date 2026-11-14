/* =========================================================
   SHARED CANVAS IMPACT EFFECTS — screen shake + shockwave rings.
   Same stateless, caller-owns-the-state convention as
   canvasFloatText.js (spawnFloatText/updateFloatTexts/drawFloatTexts):
   each game keeps its own shake-state object and shockwave array
   (either a local module var or a `state.xShockwaves` field, this
   module doesn't care which) and passes it into every call — no
   singleton, no dependency on canvasGame.js's resizer or
   teamGameFlow.js's modal chrome, which own unrelated concerns.

   Extracted after finding the exact same {shakeUntil,shakeMag} +
   ctx.translate(random*mag,...) trick independently typed out in
   Star Defender, Sky Slingshot, and Plinko, and the exact same
   fading-ring shockwave independently built in Star Defender —
   see PROJECT_STATE.md for which games call this vs. keep their own
   (Ball Pop's shake is DOM-based, a genuinely different technique,
   and intentionally NOT migrated here).
========================================================= */

/* ---- Screen shake ---- */
export function createShakeState(){
  return { until: 0, mag: 0, durationMs: 300 };
}

export function triggerShake(shakeState, mag, durationMs = 300){
  shakeState.until = performance.now() + durationMs;
  shakeState.mag = mag;
  shakeState.durationMs = durationMs;
}

// Call once per frame, inside the ctx.save()/ctx.restore() that already
// wraps the whole render — no-ops (translates by 0,0) once shakeState.until
// has passed, so it's always safe to call unconditionally.
export function applyShake(ctx, shakeState){
  const now = performance.now();
  if(now >= shakeState.until) return;
  const remaining = (shakeState.until - now) / shakeState.durationMs;
  const mag = shakeState.mag * remaining;
  ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
}

/* ---- Shockwave rings — a fading, expanding stroked circle, the shared
   "impact ring" language used for a kill/pop/hit's biggest moments. ---- */
export function spawnShockwave(list, x, y, color, opts = {}){
  list.push({
    x, y, color,
    big: !!opts.big,
    createdAt: performance.now(),
    durationMs: opts.durationMs ?? 380,
    maxRadius: opts.maxRadius ?? (opts.big ? 40 : 20),
    lineWidth: opts.lineWidth ?? (opts.big ? 4 : 2.5)
  });
}

export function updateShockwaves(list){
  const now = performance.now();
  return list.filter(sw => now - sw.createdAt < sw.durationMs);
}

// `scale` is the same "reference-width proportion" factor every canvas
// game already derives for its own entities (e.g. Star Defender's
// invScale) — passed in rather than assumed, since every game's own
// reference width differs.
export function drawShockwaves(ctx, list, scale = 1){
  for(const sw of list){
    const t = (performance.now() - sw.createdAt) / sw.durationMs;
    if(t >= 1) continue;
    const r = sw.maxRadius * scale * (0.3 + t * 1.3);
    // Was shadowBlur on the stroke. A ring is already a thin bright
    // shape on a dark field; a second wider, fainter ring reads as the
    // same bloom without asking the renderer to blur anything.
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.35;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = sw.lineWidth * scale * 3.5;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1 - t;
    ctx.lineWidth = sw.lineWidth * scale;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* ---- Frame-rate-independent particle stepping ----
   Every game used to advance its particles by a fixed amount PER FRAME
   (x += vx; alpha -= decay; ...). That ties effect speed to frame rate:
   on a classroom PC managing 30fps every burst lived twice as long in
   real time, so twice as many particles were alive at once, which made
   the frame rate worse still — a feedback loop on exactly the machines
   that could least afford it. On a 120Hz panel effects ran double speed.

   `k` is "how many 60fps frames' worth of time just passed"
   (frameFactor(dtMs)), and every per-frame constant is scaled by it —
   multiplicative ones (drag, shrink) by exponent, so the curve is the
   same shape at any frame rate. Tuned values are unchanged: at 60fps
   k is 1 and this is the exact arithmetic each game already had.

   Dead particles are compacted out IN PLACE rather than with
   .filter(), which allocated a fresh array every frame per game. */
export const FRAME_MS = 1000 / 60;

// Clamped so a long stall (tab switch, GC pause) can't fling everything.
export function frameFactor(dtMs){
  return Math.min(3, Math.max(0, dtMs) / FRAME_MS);
}

export function stepParticles(list, k, { gravity = 0, dragX = 1, dragY = 1, shrink = 0.97 } = {}){
  const dragXk = dragX === 1 ? 1 : Math.pow(dragX, k);
  const dragYk = dragY === 1 ? 1 : Math.pow(dragY, k);
  const shrinkK = Math.pow(shrink, k);
  let alive = 0;
  for(let i = 0; i < list.length; i++){
    const p = list[i];
    p.x += p.vx * k;
    p.y += p.vy * k;
    p.vy += gravity * k;
    p.vx *= dragXk;
    p.vy *= dragYk;
    p.alpha -= p.decay * k;
    p.size *= shrinkK;
    if(p.alpha > 0 && p.size > 0.3) list[alive++] = p;
  }
  list.length = alive;
  return list;
}
