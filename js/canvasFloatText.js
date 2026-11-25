/* =========================================================
   CANVAS FLOATING SCORE TEXT
   The rising, fading "+N" text every canvas-rendered team game now
   shows at the moment points are scored — the same feedback language
   Ball Pop pioneered with its DOM-based showFloatingText, generalized
   here for games with no per-entity DOM nodes to attach text to (they
   already draw everything — balls, particles — straight onto canvas).
   Each stage keeps its own array as a local module variable (transient
   render state, not `state`), same reasoning as Plinko's
   plinkoPreviewX/plinkoFloatTexts before it.
========================================================= */
export function spawnFloatText(list, x, y, text, color, vy = -1.0){
  list.push({ x, y, text, color, alpha: 1, vy });
}

// `k` = 60fps-frames elapsed (see frameFactor in canvasEffects.js), so
// text rises and fades at the same real-time speed at any frame rate.
export function updateFloatTexts(list, k = 1, decay = 0.013){
  let alive = 0;
  for(let i = 0; i < list.length; i++){
    const t = list[i];
    t.y += t.vy * k;
    t.alpha -= decay * k;
    if(t.alpha > 0) list[alive++] = t;
  }
  list.length = alive;
  return list;
}

// The glow behind this text used to be ctx.shadowBlur, which re-blurs
// the glyphs every frame. A dark stroked outline costs a fraction of
// that and does the real job better anyway — the point was never the
// bloom, it was keeping "+3" readable against a bright particle burst.
export function drawFloatTexts(ctx, list, fontPx){
  // Every game calls this every frame; most frames have no text, and
  // setting ctx.font means parsing a font string.
  if(!list.length) return;
  ctx.save();
  ctx.font = `bold ${fontPx}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, fontPx * 0.16);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  for(const t of list){
    ctx.globalAlpha = Math.max(0, t.alpha);
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.restore();
}
