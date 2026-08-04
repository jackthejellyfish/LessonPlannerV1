import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { getCurrentLesson } from '../lessons.js';
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
  // --- Health lesson icons: a symptom paired with its advice, not a
  // magnitude comparison, so `scale` just gives a bit of visual variety
  // rather than encoding "which is bigger" the way it does above.
  if(type === 'headache'){
    const r = 16 * scale;
    return `<svg viewBox="0 0 60 70" width="60" height="70">
      <circle cx="30" cy="42" r="${r}" fill="${color}"/>
      <path d="M12 20 L20 28 L12 36" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 20 L40 28 L48 36" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  if(type === 'medicine'){
    const bh = 26 * scale, by = 54 - bh;
    return `<svg viewBox="0 0 40 60" width="40" height="60">
      <rect x="12" y="${by}" width="16" height="${bh}" rx="4" fill="${color}"/>
      <rect x="16" y="${by-6}" width="8" height="8" rx="2" fill="${color}"/>
      <line x1="20" y1="${by+bh*0.35}" x2="20" y2="${by+bh*0.75}" stroke="var(--paper)" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="${by+bh*0.55}" x2="26" y2="${by+bh*0.55}" stroke="var(--paper)" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'bed'){
    const w = 50 * scale;
    return `<svg viewBox="0 0 70 40" width="70" height="40">
      <rect x="${35-w/2}" y="18" width="${w}" height="14" rx="3" fill="${color}"/>
      <rect x="${35-w/2+4}" y="10" width="${w*0.28}" height="10" rx="3" fill="var(--paper)"/>
      <line x1="${35-w/2}" y1="32" x2="${35-w/2}" y2="38" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <line x1="${35+w/2}" y1="32" x2="${35+w/2}" y2="38" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'nose'){
    const r = 14 * scale;
    return `<svg viewBox="0 0 40 60" width="40" height="60">
      <path d="M20 10 C10 26 10 34 20 38 C30 34 30 26 20 10 Z" fill="${color}"/>
      <circle cx="20" cy="${38+r*0.5}" r="${r*0.35}" fill="${color}" opacity="0.55"/>
    </svg>`;
  }
  if(type === 'tissue'){
    const s = 30 * scale;
    return `<svg viewBox="0 0 50 40" width="50" height="40">
      <rect x="${25-s/2}" y="10" width="${s}" height="${s*0.6}" rx="4" fill="${color}"/>
      <path d="M${25-s/2} 10 L25 2 L${25+s/2} 10" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;
  }
  if(type === 'tooth'){
    return `<svg viewBox="0 0 60 60" width="${60*scale}" height="${60*scale}">
      <path d="M30 8 C18 8 12 18 14 30 C15 38 18 46 22 52 C24 46 26 42 30 42 C34 42 36 46 38 52 C42 46 45 38 46 30 C48 18 42 8 30 8 Z" fill="${color}"/>
    </svg>`;
  }
  if(type === 'dentist'){
    const s = 30 * scale;
    return `<svg viewBox="0 0 50 50" width="50" height="50">
      <circle cx="25" cy="25" r="${s/2}" fill="${color}"/>
      <line x1="25" y1="${25-s*0.22}" x2="25" y2="${25+s*0.22}" stroke="var(--paper)" stroke-width="4" stroke-linecap="round"/>
      <line x1="${25-s*0.22}" y1="25" x2="${25+s*0.22}" y2="25" stroke="var(--paper)" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'thermometer'){
    const h = 34 * scale;
    return `<svg viewBox="0 0 40 70" width="40" height="70">
      <rect x="14" y="${48-h}" width="12" height="${h}" rx="6" fill="${color}"/>
      <circle cx="20" cy="54" r="12" fill="${color}"/>
      <circle cx="20" cy="54" r="6" fill="var(--paper)"/>
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
  // iconA/iconB let each side show a different icon type (a symptom
  // paired with its advice); demos that only set `icon` (the original
  // magnitude comparisons — two towers, one taller) fall back to using
  // that same icon/color on both sides, unchanged.
  const iconA = demo.iconA || demo.icon;
  const iconB = demo.iconB || demo.icon;
  document.getElementById('demoLabelA').textContent = demo.labelA;
  document.getElementById('demoLabelB').textContent = demo.labelB;
  document.getElementById('demoIconA').innerHTML = buildCompareIcon(iconA, demo.valueA, COMPARE_ICON_COLORS[iconA]);
  document.getElementById('demoIconB').innerHTML = buildCompareIcon(iconB, demo.valueB, COMPARE_ICON_COLORS[iconB]);
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
  const lesson = getCurrentLesson();
  const container = document.getElementById('printableRules');
  container.innerHTML = `
    <h1>${lesson.printRulesTitle}</h1>
    <p class="print-subtitle">${lesson.printRulesSubtitle}</p>
    ${RULES.map(rule => `
      <div class="print-rule" style="--print-accent:${rule.color}">
        <h2>${rule.name}</h2>
        <div class="print-formula">${rule.formula}</div>
        ${rule.examples.map(([base, suffix]) => `
          <div class="print-example">${base}<span class="arrow">→</span>${base}<span class="suffix">${suffix}</span></div>
        `).join('')}
      </div>
    `).join('')}
    <p class="print-footer">${lesson.printFooter}</p>
  `;
}

document.getElementById('printRulesBtn').addEventListener('click', () => {
  document.getElementById('printableRules').classList.add('active-print');
  document.getElementById('printableWorksheet').classList.remove('active-print');
  window.print();
  setTimeout(() => document.getElementById('printableRules').classList.remove('active-print'), 500);
});
