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

export function updateFloatTexts(list, decay = 0.013){
  for(const t of list){ t.y += t.vy; t.alpha -= decay; }
  return list.filter(t => t.alpha > 0);
}

export function drawFloatTexts(ctx, list, fontPx){
  for(const t of list){
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.alpha);
    ctx.fillStyle = t.color;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 10;
    ctx.font = `bold ${fontPx}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}
