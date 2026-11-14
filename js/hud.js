/* =========================================================
   ROUND TIMER HUD
   Every timed game shows the same two things in its footer: the
   seconds left as a number, and a bar that drains. Each game used to
   write both on EVERY animation frame:

     timeDisplay.textContent = Math.ceil(remaining);   // 60x a second
     timerFill.style.width = pct + '%';                // 60x a second

   The number only changes once a second, but assigning textContent
   replaces the text node regardless, and changing `width` forces a
   layout of the footer. Measured at ~30 layouts/s for the whole of
   every round (tests/perf-games.spec.js) — main-thread work competing
   with the game loop for nothing visible.

   Now: the text is written only when the number actually changes, and
   the bar is a full-width element scaled with `transform: scaleX()`,
   which skips layout entirely. Writes are also skipped when the bar
   would move by less than a pixel's worth.
========================================================= */

// Sets a .timer-bar-fill to a fraction of full (0..1) without layout.
export function setTimerFill(el, fraction){
  if(!el) return;
  const f = Math.max(0, Math.min(1, fraction));
  el.style.transform = `scaleX(${f})`;
}

export function createTimerHud(timeEl, fillEl, totalSeconds){
  let lastText = null;
  let lastStep = -1;
  return function update(remainingSeconds){
    const text = String(Math.max(0, Math.ceil(remainingSeconds)));
    if(text !== lastText){
      timeEl.textContent = text;
      lastText = text;
    }
    // 500 steps across the bar is finer than a pixel on any board.
    const step = Math.round((remainingSeconds / totalSeconds) * 500);
    if(step !== lastStep){
      lastStep = step;
      setTimerFill(fillEl, step / 500);
    }
  };
}
