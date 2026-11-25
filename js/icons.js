/* =========================================================
   ICONS
   Small inline-SVG icons used in place of emoji — single-color
   (currentColor, so they follow the button's own text color in
   both light and dark/fullscreen contexts) and crisp at any size,
   unlike a font-rendered emoji glyph.
========================================================= */
export function speakerIconSVG(muted){
  const wave = muted
    ? `<path d="M15 8.5l6 7M21 8.5l-6 7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    : `<path d="M15.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
       <path d="M18.3 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="9" width="4" height="6" fill="currentColor"/>
    <polygon points="7,9 12,4 12,20 7,15" fill="currentColor"/>
    ${wave}
  </svg>`;
}

// Lite mode button: a speedometer, needle low when lite mode is on.
export function gaugeIconSVG(lite){
  const needle = lite ? 'M12 15L7.2 11.2' : 'M12 15L16.8 11.2';
  return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.5 17a9 9 0 1 1 17 0" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="${needle}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="12" cy="15" r="1.6" fill="currentColor"/>
  </svg>`;
}

// Judgment icons (self-marking "was I right?" buttons on every game's
// question modal) — a solid currentColor disc with the mark cut out in
// white, not a plain glyph, so they read as big satisfying buttons
// rather than tiny text symbols. Size the disc via the `size` param;
// the button's own CSS sets `color` to --success/--error.
export function tickIconSVG(size = 52){
  return `<svg width="${size}" height="${size}" viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r="27" fill="currentColor"/>
    <path d="M15.5 29.5l8 8L41 17.5" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
export function crossIconSVG(size = 52){
  return `<svg width="${size}" height="${size}" viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r="27" fill="currentColor"/>
    <path d="M18 18l20 20M38 18l-20 20" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>
  </svg>`;
}
