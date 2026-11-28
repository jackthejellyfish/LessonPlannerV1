import { goToStage } from '../navigation.js';
import { getCurrentLesson } from '../lessons.js';
import { AIM_EXAMPLES } from '../content/stage1-aim.js';

document.getElementById('aimNextBtn').addEventListener('click', () => goToStage(2));

// Same one-function-many-cases pattern as buildCompareIcon in
// stage2-rules.js — see that file for why (one more example is a data
// entry here, not new markup).
function buildAimIcon(type){
  if(type === 'elephant'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <circle cx="34" cy="42" r="26" fill="var(--rule-a)" />
      <circle cx="80" cy="54" r="9" fill="var(--muted)" />
    </svg>`;
  }
  if(type === 'mountain'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <polygon points="10,55 40,10 70,55" fill="var(--rule-c)" />
      <polygon points="55,55 78,28 100,55" fill="var(--muted)" />
    </svg>`;
  }
  if(type === 'speed'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M8 20 L48 20 M8 34 L60 34 M8 48 L38 48" stroke="var(--rule-b)" stroke-width="6" stroke-linecap="round" />
      <path d="M70 34 L92 34" stroke="var(--muted)" stroke-width="6" stroke-linecap="round" />
      <polygon points="92,28 92,40 100,34" fill="var(--muted)" />
    </svg>`;
  }
  if(type === 'thermometer'){
    return `<svg viewBox="0 0 40 70" class="aim-example-svg" aria-hidden="true">
      <rect x="14" y="6" width="12" height="42" rx="6" fill="var(--rule-a)"/>
      <circle cx="20" cy="54" r="12" fill="var(--rule-a)"/>
      <circle cx="20" cy="54" r="6" fill="var(--error)"/>
    </svg>`;
  }
  if(type === 'tooth'){
    return `<svg viewBox="0 0 60 60" class="aim-example-svg" aria-hidden="true">
      <path d="M30 8 C18 8 12 18 14 30 C15 38 18 46 22 52 C24 46 26 42 30 42 C34 42 36 46 38 52 C42 46 45 38 46 30 C48 18 42 8 30 8 Z" fill="var(--rule-c)"/>
      <path d="M8 24 L17 18 L11 13" stroke="var(--muted)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'plate'){
    return `<svg viewBox="0 0 70 50" class="aim-example-svg" aria-hidden="true">
      <ellipse cx="35" cy="36" rx="30" ry="10" fill="var(--muted)"/>
      <ellipse cx="35" cy="32" rx="24" ry="8" fill="var(--rule-d)"/>
      <circle cx="35" cy="32" r="4" fill="var(--paper)"/>
    </svg>`;
  }
  // --- Will/Won't + Present Perfect lesson icons. Same flat-shape
  // vocabulary as the cases above (a couple of primitives per icon, no
  // detail that won't survive being shown at 70px on a classroom
  // screen) so a new lesson stays a data entry, not a drawing job.
  if(type === 'cloud'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <circle cx="36" cy="32" r="16" fill="var(--rule-b)"/>
      <circle cx="56" cy="28" r="20" fill="var(--rule-b)"/>
      <circle cx="74" cy="36" r="13" fill="var(--rule-b)"/>
      <rect x="34" y="36" width="42" height="14" rx="7" fill="var(--rule-b)"/>
      <path d="M40 58 L36 68 M56 58 L52 68 M72 58 L68 68" stroke="var(--rule-a)" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'rocket'){
    return `<svg viewBox="0 0 60 70" class="aim-example-svg" aria-hidden="true">
      <path d="M30 4 C40 16 44 30 44 44 L16 44 C16 30 20 16 30 4 Z" fill="var(--rule-c)"/>
      <circle cx="30" cy="26" r="6" fill="var(--paper)"/>
      <polygon points="16,38 6,52 16,50" fill="var(--rule-a)"/>
      <polygon points="44,38 54,52 44,50" fill="var(--rule-a)"/>
      <path d="M24 48 L30 66 L36 48 Z" fill="var(--rule-d)"/>
    </svg>`;
  }
  if(type === 'trophy'){
    return `<svg viewBox="0 0 70 70" class="aim-example-svg" aria-hidden="true">
      <path d="M20 8 L50 8 L48 32 Q35 44 22 32 Z" fill="var(--rule-d)"/>
      <path d="M20 14 Q8 14 10 24 Q12 32 22 30" fill="none" stroke="var(--rule-d)" stroke-width="4"/>
      <path d="M50 14 Q62 14 60 24 Q58 32 48 30" fill="none" stroke="var(--rule-d)" stroke-width="4"/>
      <rect x="31" y="40" width="8" height="12" fill="var(--muted)"/>
      <rect x="20" y="52" width="30" height="8" rx="3" fill="var(--muted)"/>
    </svg>`;
  }
  if(type === 'suitcase'){
    return `<svg viewBox="0 0 80 70" class="aim-example-svg" aria-hidden="true">
      <path d="M30 18 Q30 8 40 8 Q50 8 50 18" fill="none" stroke="var(--muted)" stroke-width="4"/>
      <rect x="12" y="18" width="56" height="40" rx="6" fill="var(--rule-c)"/>
      <rect x="36" y="18" width="8" height="40" fill="var(--paper)" opacity="0.65"/>
    </svg>`;
  }
  if(type === 'book'){
    return `<svg viewBox="0 0 80 70" class="aim-example-svg" aria-hidden="true">
      <path d="M40 18 Q26 10 10 14 L10 56 Q26 52 40 60 Z" fill="var(--rule-a)"/>
      <path d="M40 18 Q54 10 70 14 L70 56 Q54 52 40 60 Z" fill="var(--rule-b)"/>
      <line x1="40" y1="18" x2="40" y2="60" stroke="var(--paper)" stroke-width="3"/>
    </svg>`;
  }
  // --- Amusement Park lesson icons. Same flat-shape vocabulary.
  if(type === 'coaster'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M6 62 C18 62 20 14 36 14 C52 14 50 48 64 48 C76 48 80 24 94 24" fill="none" stroke="var(--rule-c)" stroke-width="5" stroke-linecap="round"/>
      <path d="M22 40 V66 M36 16 V66 M52 36 V66 M66 48 V66 M84 30 V66" stroke="var(--muted)" stroke-width="3" stroke-linecap="round"/>
      <g transform="rotate(-38 82 22)"><rect x="72" y="12" width="20" height="10" rx="3" fill="var(--rule-a)"/><circle cx="76" cy="24" r="3" fill="var(--ink)"/><circle cx="88" cy="24" r="3" fill="var(--ink)"/></g>
    </svg>`;
  }
  if(type === 'carousel'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <polygon points="50,4 86,24 14,24" fill="var(--rule-c)"/>
      <path d="M14 24 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0" fill="var(--rule-d)"/>
      <line x1="50" y1="24" x2="50" y2="60" stroke="var(--muted)" stroke-width="4"/>
      <line x1="28" y1="28" x2="28" y2="46" stroke="var(--muted)" stroke-width="2"/>
      <line x1="72" y1="28" x2="72" y2="40" stroke="var(--muted)" stroke-width="2"/>
      <rect x="20" y="42" width="16" height="9" rx="4" fill="var(--rule-a)"/>
      <rect x="64" y="36" width="16" height="9" rx="4" fill="var(--rule-b)"/>
      <rect x="10" y="58" width="80" height="8" rx="4" fill="var(--rule-a)"/>
    </svg>`;
  }
  if(type === 'ghost'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M14 66 V36 L36 18 L58 36 V66 Z" fill="var(--rule-b)"/>
      <rect x="30" y="46" width="12" height="20" rx="2" fill="var(--paper)" opacity="0.7"/>
      <path d="M60 62 V30 a16 16 0 0 1 32 0 V62 l-5 -5 l-6 5 l-5 -5 l-5 5 l-6 -5 Z" fill="var(--surface)" stroke="var(--muted)" stroke-width="2.5"/>
      <circle cx="70" cy="30" r="3.5" fill="var(--ink)"/>
      <circle cx="82" cy="30" r="3.5" fill="var(--ink)"/>
      <ellipse cx="76" cy="42" rx="4" ry="5" fill="var(--ink)"/>
    </svg>`;
  }
  // --- Party Fun lesson icons. Same flat-shape vocabulary.
  if(type === 'balloons'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M36 40 Q40 54 50 66 M64 38 Q60 54 50 66 M50 34 V66" fill="none" stroke="var(--muted)" stroke-width="2"/>
      <ellipse cx="34" cy="24" rx="13" ry="16" fill="var(--rule-c)"/>
      <ellipse cx="66" cy="22" rx="13" ry="16" fill="var(--rule-b)"/>
      <ellipse cx="50" cy="18" rx="13" ry="16" fill="var(--rule-a)"/>
    </svg>`;
  }
  if(type === 'pizza'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <circle cx="50" cy="36" r="30" fill="var(--rule-d)"/>
      <circle cx="50" cy="36" r="24" fill="var(--rule-c)"/>
      <circle cx="40" cy="28" r="5" fill="var(--error)"/>
      <circle cx="60" cy="30" r="5" fill="var(--error)"/>
      <circle cx="46" cy="46" r="5" fill="var(--error)"/>
      <path d="M50 36 L50 6 M50 36 L76 50 M50 36 L24 50" stroke="var(--rule-d)" stroke-width="2.5"/>
    </svg>`;
  }
  if(type === 'music'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M38 52 V14 L76 6 V44" fill="none" stroke="var(--rule-b)" stroke-width="5" stroke-linejoin="round"/>
      <path d="M38 14 L76 6 V16 L38 24 Z" fill="var(--rule-b)"/>
      <ellipse cx="30" cy="54" rx="10" ry="8" fill="var(--rule-a)"/>
      <ellipse cx="68" cy="46" rx="10" ry="8" fill="var(--rule-a)"/>
    </svg>`;
  }
  // --- At School + Months/Weather lesson icons (2026-11-19). Same flat,
  // few-primitive style as above.
  if(type === 'pencil'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <g transform="rotate(-28 50 35)">
        <rect x="20" y="27" width="54" height="16" rx="2" fill="var(--rule-a)"/>
        <rect x="12" y="27" width="10" height="16" rx="3" fill="var(--rule-c)"/>
        <polygon points="74,27 92,35 74,43" fill="#E9C99A"/>
        <polygon points="86,32.3 92,35 86,37.7" fill="var(--ink)"/>
      </g>
    </svg>`;
  }
  if(type === 'gluestick'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <rect x="36" y="22" width="28" height="44" rx="5" fill="var(--rule-b)"/>
      <rect x="36" y="36" width="28" height="12" fill="var(--paper)" opacity="0.85"/>
      <rect x="39" y="6" width="22" height="18" rx="4" fill="var(--rule-d)"/>
    </svg>`;
  }
  if(type === 'calendar'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <rect x="26" y="12" width="48" height="52" rx="6" fill="var(--paper)" stroke="var(--rule-c)" stroke-width="3"/>
      <rect x="26" y="12" width="48" height="15" rx="6" fill="var(--rule-c)"/>
      <rect x="35" y="5" width="5" height="13" rx="2" fill="var(--muted)"/>
      <rect x="60" y="5" width="5" height="13" rx="2" fill="var(--muted)"/>
      ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${34 + c * 12}" y="${34 + r * 9}" width="7" height="5" rx="1" fill="var(--muted)" opacity="0.5"/>`).join('')).join('')}
      <circle cx="61" cy="45" r="7" fill="none" stroke="var(--rule-a)" stroke-width="3"/>
    </svg>`;
  }
  if(type === 'sun'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <circle cx="50" cy="35" r="15" fill="var(--rule-d)"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const r = a * Math.PI / 180;
        return `<line x1="${50 + Math.cos(r) * 21}" y1="${35 + Math.sin(r) * 21}" x2="${50 + Math.cos(r) * 29}" y2="${35 + Math.sin(r) * 29}" stroke="var(--rule-d)" stroke-width="4" stroke-linecap="round"/>`;
      }).join('')}
    </svg>`;
  }
  // --- Food and drink lesson (2026-11-23).
  if(type === 'apple'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M50 22 q1 -10 8 -14" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="62" cy="12" rx="8" ry="4" transform="rotate(-25 62 12)" fill="var(--success)"/>
      <circle cx="41" cy="42" r="20" fill="var(--error)"/>
      <circle cx="59" cy="42" r="20" fill="var(--error)"/>
      <ellipse cx="37" cy="35" rx="4" ry="7" fill="var(--paper)" opacity="0.55"/>
    </svg>`;
  }
  // --- At the Buffet / At the Market lessons (2026-11-27).
  if(type === 'chili'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M30 18 C34 46 52 62 82 60 C62 54 50 40 44 16 Z" fill="var(--error)"/>
      <path d="M30 18 q2 -8 10 -6 l4 4" stroke="var(--success)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="30" rx="2.5" ry="7" fill="var(--paper)" opacity="0.5" transform="rotate(-20 40 30)"/>
    </svg>`;
  }
  if(type === 'grapes'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M50 14 q2 -8 10 -10" stroke="var(--success)" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${[[38,22],[50,22],[62,22],[44,34],[56,34],[50,46],[50,58]].map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="7.5" fill="#8E5BB5"/>`).join('')}
    </svg>`;
  }
  if(type === 'cheese'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M18 54 L82 54 L82 34 L18 22 Z" fill="#F2C94C"/>
      <path d="M18 22 L82 34 L70 18 Z" fill="#F7DD86"/>
      <circle cx="36" cy="40" r="4" fill="#D9A92B"/><circle cx="60" cy="46" r="5" fill="#D9A92B"/><circle cx="70" cy="40" r="3" fill="#D9A92B"/>
    </svg>`;
  }
  if(type === 'milk'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      <path d="M38 22 L62 22 L62 64 L38 64 Z" fill="var(--paper)" stroke="var(--muted)" stroke-width="2"/>
      <path d="M38 22 L44 10 L56 10 L62 22 Z" fill="var(--rule-b)"/>
      <rect x="38" y="36" width="24" height="12" fill="var(--rule-b)"/>
    </svg>`;
  }
  if(type === 'snowflake'){
    return `<svg viewBox="0 0 100 70" class="aim-example-svg" aria-hidden="true">
      ${[0, 60, 120].map(a => `<g transform="rotate(${a} 50 35)" stroke="var(--rule-b)" stroke-width="4" stroke-linecap="round" fill="none">
        <line x1="50" y1="8" x2="50" y2="62"/>
        <path d="M43 15 L50 21 L57 15 M43 55 L50 49 L57 55"/>
      </g>`).join('')}
    </svg>`;
  }
  return '';
}

export function renderAimHeader(){
  const lesson = getCurrentLesson();
  document.getElementById('aimHeader').innerHTML = `
    <h1>${lesson.title}</h1>
    <p class="objective">${lesson.objective}</p>
  `;
}

export function renderAimExamples(){
  document.getElementById('aimExamples').innerHTML = AIM_EXAMPLES.map(ex => `
    <div class="aim-example">
      ${buildAimIcon(ex.icon)}
      <p class="example-sentence">${ex.sentenceHtml}</p>
    </div>
  `).join('');
}
