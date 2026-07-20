import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { RULES, COMPARE_DEMOS, COMPARE_ICON_COLORS } from '../content/stage2-rules.js';

// One small function that draws four different themed icons, each
// sized by `valuePct` (0-100) — the same data that used to drive a
// bar's width now drives an icon's size instead. Keeping this as one
// parametrized function (rather than 8 hardcoded SVGs) means adding a
// 5th comparison later is just one more data entry, not new markup.
export function buildCompareIcon(type, valuePct, color){
  const scale = 0.4 + (valuePct / 100) * 0.6; // keep a visible minimum size even at low values

  if(type === 'tower'){
    const h = 34 * scale, w = 20 * scale;
    return `<svg viewBox="0 0 40 60" width="40" height="60">
      <rect x="${20 - w/2}" y="${60 - h}" width="${w}" height="${h}" rx="2" fill="${color}"/>
      <polygon points="${20 - w/2},${60 - h} ${20 + w/2},${60 - h} 20,${60 - h - 10*scale}" fill="${color}"/>
    </svg>`;
  }
  if(type === 'car'){
    const lineLen = 8 + valuePct * 0.32;
    return `<svg viewBox="0 0 90 50" width="90" height="50">
      <rect x="30" y="24" width="34" height="14" rx="6" fill="${color}"/>
      <rect x="38" y="14" width="18" height="12" rx="4" fill="${color}"/>
      <circle cx="38" cy="40" r="5" fill="#33393b"/>
      <circle cx="58" cy="40" r="5" fill="#33393b"/>
      <line x1="${26 - lineLen}" y1="24" x2="24" y2="24" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <line x1="${26 - lineLen * 0.7}" y1="31" x2="24" y2="31" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'bag'){
    const s = 20 + valuePct * 0.28;
    return `<svg viewBox="0 0 70 60" width="70" height="60">
      <path d="M ${35 - s*0.22} ${60 - s} q 0 -14 ${s*0.22} -14 q ${s*0.22} 0 ${s*0.22} 14" fill="none" stroke="${color}" stroke-width="4"/>
      <rect x="${35 - s/2}" y="${60 - s*0.72}" width="${s}" height="${s*0.72}" rx="6" fill="${color}"/>
    </svg>`;
  }
  if(type === 'path'){
    const len = 18 + valuePct * 0.55;
    return `<svg viewBox="0 0 90 20" width="90" height="20">
      <line x1="5" y1="10" x2="${5 + len}" y2="10" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="9 6"/>
    </svg>`;
  }
  return '';
}

/* =========================================================
   STAGE 2 — LEARN THE RULE
========================================================= */
export function renderRuleCards(){
  const list = document.getElementById('ruleGrid');
  list.innerHTML = RULES.map((rule, i) => {
    const isOpen = state.expandedRules.has(i);
    return `
      <div class="rule-row ${isOpen ? 'open' : ''}" style="--card-color:${rule.color}">
        <button class="rule-toggle" data-i="${i}">
          <span>${rule.name}</span>
          <span class="chevron">⌄</span>
        </button>
        ${isOpen ? `
          <div class="rule-body">
            <div class="rule-formula">${rule.formula}</div>
            ${rule.examples.map(([base, suffix]) => `
              <div class="rule-example">${base}<span class="arrow">→</span>${base}<span class="suffix">${suffix}</span></div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Each rule toggles independently — opening one doesn't close the
  // others, so students can compare two or more spelling rules side by
  // side instead of only ever seeing one at a time.
  list.querySelectorAll('.rule-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      if(state.expandedRules.has(i)) state.expandedRules.delete(i);
      else state.expandedRules.add(i);
      renderRuleCards();
    });
  });
}

export function renderCompareDemo(){
  const demo = COMPARE_DEMOS[state.demoIndex];
  const color = COMPARE_ICON_COLORS[demo.icon];
  document.getElementById('demoLabelA').textContent = demo.labelA;
  document.getElementById('demoLabelB').textContent = demo.labelB;
  document.getElementById('demoIconA').innerHTML = buildCompareIcon(demo.icon, demo.valueA, color);
  document.getElementById('demoIconB').innerHTML = buildCompareIcon(demo.icon, demo.valueB, color);
  document.getElementById('demoCaption').innerHTML = demo.caption;

  const nav = document.getElementById('demoNav');
  nav.innerHTML = COMPARE_DEMOS.map((_, i) =>
    `<button class="demo-dot ${i === state.demoIndex ? 'active' : ''}" data-i="${i}" aria-label="Example ${i+1}"></button>`
  ).join('');
  nav.querySelectorAll('.demo-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      state.demoIndex = Number(dot.dataset.i);
      renderCompareDemo();
    });
  });
}

document.getElementById('learnBackBtn').addEventListener('click', () => goToStage(1));
document.getElementById('learnNextBtn').addEventListener('click', () => goToStage(3));

// Renders a static, always-fully-expanded version of the rules into
// the hidden #printableRules container — completely independent of
// which rules happen to be open in the interactive accordion, since a
// printout should always show everything.
export function renderPrintableRules(){
  const container = document.getElementById('printableRules');
  container.innerHTML = `
    <h1>Comparative Adjectives — Rules Reference</h1>
    <p class="print-subtitle">Spelling rules for forming comparative adjectives</p>
    ${RULES.map(rule => `
      <div class="print-rule" style="--print-accent:${rule.color}">
        <h2>${rule.name}</h2>
        <div class="print-formula">${rule.formula}</div>
        ${rule.examples.map(([base, suffix]) => `
          <div class="print-example">${base}<span class="arrow">→</span>${base}<span class="suffix">${suffix}</span></div>
        `).join('')}
      </div>
    `).join('')}
    <p class="print-footer">Comparative Adjectives — Interactive Lesson</p>
  `;
}

document.getElementById('printRulesBtn').addEventListener('click', () => {
  document.getElementById('printableRules').classList.add('active-print');
  document.getElementById('printableWorksheet').classList.remove('active-print');
  window.print();
  setTimeout(() => document.getElementById('printableRules').classList.remove('active-print'), 500);
});
