/* =========================================================
   FULLSCREEN FOOTER LAYOUT
   In fullscreen game mode, the team scoreboard and HUD (score/
   timer) physically move into that stage's footer bar instead
   of floating over the play area — this reclaims the entire
   play area for the game itself (no reserved top/left gutters)
   and keeps every piece of game "chrome" in one predictable
   strip along the bottom, next to the Back/Next controls.

   DOM nodes are actually relocated (not just repositioned with
   CSS) so normal flexbox layout does the work of arranging them
   next to the nav buttons — far more robust than pixel-matching
   two separately-positioned floating cards to a footer bar of
   unknown height. Each element's original parent/sibling is
   remembered so it can be put back exactly where it came from.
========================================================= */
const originalPlacement = new WeakMap();

function relocate(el, newParent, referenceNode){
  if(!el) return;
  if(!originalPlacement.has(el)){
    originalPlacement.set(el, { parent: el.parentElement, next: el.nextElementSibling });
  }
  newParent.insertBefore(el, referenceNode || null);
}

function restore(el){
  if(!el || !originalPlacement.has(el)) return;
  const { parent, next } = originalPlacement.get(el);
  parent.insertBefore(el, next);
}

function getOrCreateInfoWrap(footer){
  let wrap = footer.querySelector('.fs-footer-info');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className = 'fs-footer-info';
    // Always the second child — first is "← Back", everything after
    // (a lone "Next" button, or a div grouping a couple of buttons)
    // stays last, so the info strip sits visually between them.
    footer.insertBefore(wrap, footer.children[1] || null);
  }
  return wrap;
}

export function enterFooterLayout(stageEl){
  if(!stageEl) return;
  const footer = stageEl.querySelector('.stage-footer');
  if(!footer) return;
  const wrap = getOrCreateInfoWrap(footer);
  const sidebar = stageEl.querySelector('.pop-sidebar');
  const hudCard = stageEl.querySelector('.pop-hud-card');
  relocate(sidebar, wrap, null);
  relocate(hudCard, wrap, null);
}

export function exitFooterLayout(stageEl){
  if(!stageEl) return;
  const sidebar = stageEl.querySelector('.pop-sidebar');
  const hudCard = stageEl.querySelector('.pop-hud-card');
  restore(sidebar);
  restore(hudCard);
}
