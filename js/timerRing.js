// Both countdown rings use the same radius (set in the SVG markup),
// so the circumference math is shared rather than repeated per timer.
export const TIMER_RING_RADIUS = 18;
export const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * TIMER_RING_RADIUS;

// Updates a countdown ring's drawn arc length to reflect the fraction
// of time remaining — this is the "reverse loading circle" effect:
// stroke-dasharray is set to the full circumference, and increasing
// stroke-dashoffset shortens how much of that circle is actually drawn.
export function setTimerRing(arcEl, numEl, remaining, total){
  const fraction = Math.max(0, remaining / total);
  // Called every animation frame by the Stage 3/4 countdowns. Only the
  // dash offset genuinely changes per frame; the dash array is constant
  // and the number changes once a second, and rewriting textContent
  // every frame forced a layout each time for an identical digit.
  if(arcEl.style.strokeDasharray === '') arcEl.style.strokeDasharray = TIMER_RING_CIRCUMFERENCE;
  arcEl.style.strokeDashoffset = TIMER_RING_CIRCUMFERENCE * (1 - fraction);
  arcEl.classList.toggle('urgent', remaining <= 5);
  const text = String(Math.ceil(remaining));
  if(numEl.textContent !== text) numEl.textContent = text;
}
