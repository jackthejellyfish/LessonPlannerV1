/* =========================================================
   ON-SCREEN FRAME METER
   For checking performance on the actual classroom PC and board, where
   it matters, rather than on a development machine. Open the app with
   ?fps  in the address bar (e.g. https://…/?fps) and a small panel in
   the corner shows:

     fps     frames drawn in the last second
     worst   the slowest single frame in that second, in ms
     lite    whether adaptive lite mode is on, and at which level
             (js/quality.js)

   It does nothing at all unless ?fps is present: no element, no loop.
   It measures with its own requestAnimationFrame, so it reports what
   the screen is actually achieving whether or not a game is running.
========================================================= */
import { qualityLevel } from './quality.js';

function wanted(){
  try { return new URLSearchParams(window.location.search).has('fps'); } catch(_) { return false; }
}

export function initFpsMeter(){
  if(!wanted()) return;
  const el = document.createElement('div');
  el.className = 'fps-meter';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  let frames = 0, worst = 0, last = performance.now(), windowStart = last;
  function tick(now){
    const dt = now - last;
    last = now;
    frames++;
    if(dt > worst) worst = dt;
    if(now - windowStart >= 1000){
      const fps = Math.round((frames * 1000) / (now - windowStart));
      el.textContent = `${fps} fps · worst ${Math.round(worst)}ms · lite ${qualityLevel() ? `on (level ${qualityLevel()})` : 'off'}`;
      el.classList.toggle('slow', fps < 45);
      frames = 0; worst = 0; windowStart = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
