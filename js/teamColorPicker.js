/* =========================================================
   TEAM COLOR PICKER
   A small shared component used by every team-based game's setup
   screen (Ball Pop, Star Defender, Spin Wheel, Billiards, Neon Arena,
   Fruit Ninja): a clickable swatch
   next to each team name that opens a popover grid of colors.
   Only one popover is ever open at a time; clicking outside or
   picking a color closes it.
========================================================= */
import { escapeHtml } from './utils.js';

/* The palette teams pick from. The previous set was 12 desaturated
   mid-tones derived from the app's own muted accent colours — which is
   why it read as "a strange range of shades" rather than as colours:
   there was no plain red, no plain blue, no yellow, and several
   near-identical olives and mauves that two teams could not tell apart
   from the back of a classroom.

   This is the full spectrum instead, at a saturation that stays legible
   in BOTH places a team colour is shown: tinted 8% behind a white setup
   row, and as a solid dot/ring on a near-black game canvas. That
   constraint is why there is no very dark charcoal and no pastel — each
   would disappear against one of the two backgrounds. 20 colours, laid
   out 5 to a row. */
export const TEAM_COLOR_PALETTE = [
  "#E03131", "#FF6B6B", "#FD7E14", "#F59F00", "#FACC15",
  "#94D82D", "#37B24D", "#0CA678", "#1098AD", "#22B8CF",
  "#0EA5E9", "#1C7ED6", "#4C6EF5", "#7950F2", "#AE3EC9",
  "#E64980", "#F783AC", "#A9714B", "#909296", "#63E6BE"
];

/* Which colours new teams get BEFORE anyone picks. Taking the palette in
   order would hand Team 1 red and Team 2 the red next to it, so the two
   teams that exist by default would start nearly indistinguishable —
   exactly the problem this rework is meant to fix. This is a separate,
   deliberately-spread order: blue, red, green, amber. Every entry must
   also exist in TEAM_COLOR_PALETTE, or the picker would open with the
   team's current colour not shown as selected. */
const DEFAULT_TEAM_COLORS = ["#1C7ED6", "#E03131", "#37B24D", "#F59F00"];

let openPopover = null;
let openAnchor = null;

function closeOpenPopover(){
  if(openPopover) openPopover.remove();
  openPopover = null;
  openAnchor = null;
  document.removeEventListener('click', handleOutsideClick, true);
  document.removeEventListener('keydown', handleEscape, true);
}

function handleOutsideClick(e){
  if(openPopover && !openPopover.contains(e.target) && e.target !== openAnchor){
    closeOpenPopover();
  }
}

function handleEscape(e){
  if(e.key === 'Escape') closeOpenPopover();
}

function openColorPopover(anchorBtn, currentColor, onChange, getUsedColors){
  closeOpenPopover();

  const popover = document.createElement('div');
  popover.className = 'team-color-popover';
  popover.innerHTML = TEAM_COLOR_PALETTE.map(color => {
    const takenByOther = getUsedColors().includes(color) && color !== currentColor;
    return `<button type="button" class="team-color-option${takenByOther ? ' taken' : ''}${color === currentColor ? ' selected' : ''}"
      style="background:${color}" data-color="${color}" ${takenByOther ? 'disabled' : ''}
      aria-label="Pick ${color}${takenByOther ? ' (already used by another team)' : ''}"></button>`;
  }).join('');
  document.body.appendChild(popover);

  const rect = anchorBtn.getBoundingClientRect();
  const popoverWidth = popover.offsetWidth;
  let left = rect.left;
  if(left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8;
  popover.style.top = (rect.bottom + 6) + 'px';
  popover.style.left = Math.max(8, left) + 'px';

  popover.querySelectorAll('.team-color-option:not(.taken)').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      onChange(opt.dataset.color);
      closeOpenPopover();
    });
  });

  openPopover = popover;
  openAnchor = anchorBtn;
  // Deferred so the click that opened this popover doesn't immediately close it.
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick, true);
    document.addEventListener('keydown', handleEscape, true);
  }, 0);
}

// Builds one color-swatch button. `onChange(color)` fires when the
// teacher picks a new color; `getUsedColors()` returns the colors
// currently claimed by every OTHER row, so this row's popover can grey
// those out and keep every team visually distinct.
function createColorSwatchButton(initialColor, onChange, getUsedColors){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'team-color-swatch';
  setSwatchColor(btn, initialColor);
  btn.setAttribute('aria-label', 'Choose team color');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if(openAnchor === btn){ closeOpenPopover(); return; }
    openColorPopover(btn, btn.dataset.color, (color) => {
      setSwatchColor(btn, color);
      onChange(color);
    }, getUsedColors);
  });
  return btn;
}

// `color` also becomes the swatch's own text color, so the popover-ring
// CSS (`box-shadow: 0 0 0 2px currentColor`) always matches without the
// two ever being able to drift out of sync.
function setSwatchColor(btn, color){
  btn.style.background = color;
  btn.style.color = color;
  btn.dataset.color = color;
}

// A team's row previews its own chosen color live (tinted background +
// matching border) rather than staying a plain, identical-looking input
// for every team — the row itself is the team's little "identity card".
// Also exposes the color as --tc (same custom-property convention
// renderTeamScoreboard/renderResultStandings already use) so the row's
// own CSS can derive further color-mix() effects — its hover/focus glow
// — from one source instead of duplicating the color in JS per effect.
function applyRowColorStyle(row, color){
  row.style.setProperty('--tc', color);
  row.style.borderColor = color;
  row.style.background = `color-mix(in srgb, ${color} 8%, var(--surface))`;
}

// Renders one row per team into `containerId`: a color swatch + a name
// input + (once there are more than `min` teams) a remove button.
// `rowColors` is mutated in place and persists across re-renders (e.g.
// when "+ Add team" grows the list), so previously-picked colors and
// typed names both survive — the caller just needs to preserve/restore
// input values the same way it always did. `renderFn` is the caller's
// own `renderXTeamInputs` — passed back in so the remove button can
// re-render one row fewer itself, the same self-re-invoking pattern
// every stage's "+ Add team" handler already used.
export function renderTeamSetupRows(containerId, addBtnId, count, rowColors, renderFn, min = 2){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  for(let i = 0; i < count; i++){
    if(!rowColors[i]){
      rowColors[i] = DEFAULT_TEAM_COLORS.find(c => !rowColors.includes(c))
        || TEAM_COLOR_PALETTE.find(c => !rowColors.includes(c))
        || TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length];
    }
    const row = document.createElement('div');
    row.className = 'pop-team-row';
    applyRowColorStyle(row, rowColors[i]);

    const swatch = createColorSwatchButton(rowColors[i], (color) => {
      rowColors[i] = color;
      applyRowColorStyle(row, color);
    }, () => rowColors.filter((_, idx) => idx !== i));

    const input = document.createElement('input');
    input.type = 'text';
    input.value = `Team ${i + 1}`;
    input.maxLength = 16;
    input.setAttribute('aria-label', `Name for team ${i + 1}`);

    row.appendChild(swatch);
    row.appendChild(input);

    if(count > min && renderFn){
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'pop-team-row-remove';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', `Remove ${input.value}`);
      removeBtn.addEventListener('click', () => {
        const names = Array.from(wrap.querySelectorAll('input')).map(inp => inp.value);
        names.splice(i, 1);
        rowColors.splice(i, 1);
        renderFn(count - 1);
        document.querySelectorAll(`#${containerId} input`).forEach((inp, idx) => { if(names[idx]) inp.value = names[idx]; });
      });
      row.appendChild(removeBtn);
    }

    wrap.appendChild(row);
  }
  rowColors.length = count;
  document.getElementById(addBtnId).disabled = count >= 4;
}

// Wires the "+ Add team" click handler shared by every stage's setup
// screen — same preserve-names-then-re-render logic every stage used
// to duplicate individually.
export function wireAddTeamButton(containerId, addBtnId, renderFn, max = 4){
  document.getElementById(addBtnId).addEventListener('click', () => {
    const current = document.querySelectorAll(`#${containerId} input`).length;
    if(current >= max) return;
    const names = Array.from(document.querySelectorAll(`#${containerId} input`)).map(i => i.value);
    renderFn(current + 1);
    document.querySelectorAll(`#${containerId} input`).forEach((input, i) => { if(names[i]) input.value = names[i]; });
  });
}

// The in-game team scoreboard list — identical markup across every
// team-based game (Ball Pop/Star Defender/Spin Wheel/Billiards/
// Neon Arena/Fruit Ninja), previously copy-pasted once per stage.
export function renderTeamScoreboard(containerId, teams, currentIndex){
  document.getElementById(containerId).innerHTML = teams.map((t, i) => `
    <li class="${i === currentIndex ? 'active' : ''}" style="--tc:${t.color}">
      ${i === currentIndex ? '<span class="turn-badge">▶ Current turn</span>' : ''}
      <span class="name"><span class="dot" style="background:${t.color}"></span>${escapeHtml(t.name)}</span>
      <span class="pop-score">${t.total}</span>
    </li>
  `).join('');
}

// A row of team-standings cards for the turn-result modal — same colored
// visual language as renderTeamScoreboard() above (color-mix tint driven
// by --tc), but bigger and score-first: the score is the large, dominant
// number up top (the exciting part), the team name a smaller label below
// it — deliberately the reverse order of the sidebar scoreboard, which
// leads with the name. The team that just played gets the highlighted/
// glowing treatment so it's obvious whose result this was.
export function renderResultStandings(teams, currentIndex){
  return `
    <div class="result-standings">
      ${teams.map((t, i) => `
        <div class="result-pill${i === currentIndex ? ' active' : ''}" style="--tc:${t.color}">
          <span class="result-pill-score">${t.total}</span>
          <span class="result-pill-name"><span class="result-pill-dot" style="background:${t.color}"></span>${escapeHtml(t.name)}</span>
        </div>
      `).join('')}
    </div>
  `;
}
