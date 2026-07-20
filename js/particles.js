/* =========================================================
   PARTICLE BURST
   A small celebratory effect for correct answers — plain DOM
   elements animated with a transition, not canvas. Each
   particle is appended to `container` (which must be
   position:relative) and flies outward from (xPct, yPct),
   expressed as a percentage of that container's own size.
========================================================= */
export function burstParticles(container, xPct, yPct, color){
  const count = 12;
  for(let i = 0; i < count; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.background = color;
    p.style.left = xPct + '%';
    p.style.top = yPct + '%';
    container.appendChild(p);

    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    const distance = 45 + Math.random() * 55;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    // Wrapped in rAF so the browser registers the starting position
    // before the transition target changes — otherwise both states
    // land in the same paint and nothing appears to animate.
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      p.style.opacity = '0';
    });
    setTimeout(() => p.remove(), 650);
  }
}

// Convenience wrapper: burst outward from the center of a specific
// element (e.g. the button just clicked), relative to some ancestor
// container that particles get appended into.
export function burstFromElement(el, container, color){
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const xPct = ((elRect.left + elRect.width / 2) - containerRect.left) / containerRect.width * 100;
  const yPct = ((elRect.top + elRect.height / 2) - containerRect.top) / containerRect.height * 100;
  burstParticles(container, xPct, yPct, color);
}
