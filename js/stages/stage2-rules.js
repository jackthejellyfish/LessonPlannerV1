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
  // --- Will/Won't lesson icons: a situation paired with its
  // prediction. Paired, not magnitude-based, so `scale` only adds a
  // little size variety (same convention as the health icons above).
  if(type === 'cloud'){
    const r = 15 * scale;
    return `<svg viewBox="0 0 80 70" width="80" height="70">
      <circle cx="30" cy="30" r="${r}" fill="${color}"/>
      <circle cx="46" cy="26" r="${r * 1.25}" fill="${color}"/>
      <circle cx="60" cy="32" r="${r * 0.85}" fill="${color}"/>
      <rect x="28" y="32" width="34" height="12" rx="6" fill="${color}"/>
      <path d="M34 52 L30 64 M48 52 L44 64 M60 52 L56 64" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'umbrella'){
    const w = 26 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M${35 - w} 34 Q35 ${34 - w} ${35 + w} 34 Z" fill="${color}"/>
      <line x1="35" y1="34" x2="35" y2="58" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <path d="M35 58 q0 8 -8 8" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'clock'){
    const r = 22 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <circle cx="35" cy="36" r="${r}" fill="none" stroke="${color}" stroke-width="5"/>
      <line x1="35" y1="36" x2="35" y2="${36 - r * 0.55}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <line x1="35" y1="36" x2="${35 + r * 0.4}" y2="36" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'rocket'){
    const h = 40 * scale;
    return `<svg viewBox="0 0 60 70" width="60" height="70">
      <path d="M30 ${56 - h} C40 ${56 - h + 12} 44 ${56 - h + 26} 44 56 L16 56 C16 ${56 - h + 26} 20 ${56 - h + 12} 30 ${56 - h} Z" fill="${color}"/>
      <circle cx="30" cy="${56 - h * 0.55}" r="5" fill="var(--paper)"/>
      <polygon points="16,50 6,62 16,60" fill="${color}"/>
      <polygon points="44,50 54,62 44,60" fill="${color}"/>
    </svg>`;
  }
  if(type === 'book'){
    const w = 30 * scale;
    return `<svg viewBox="0 0 80 70" width="80" height="70">
      <path d="M40 22 Q${40 - w} 14 ${40 - w - 6} 18 L${40 - w - 6} 54 Q${40 - w} 50 40 58 Z" fill="${color}"/>
      <path d="M40 22 Q${40 + w} 14 ${40 + w + 6} 18 L${40 + w + 6} 54 Q${40 + w} 50 40 58 Z" fill="${color}" opacity="0.72"/>
      <line x1="40" y1="22" x2="40" y2="58" stroke="var(--paper)" stroke-width="3"/>
    </svg>`;
  }
  if(type === 'trophy'){
    const sc = scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M${35 - 15 * sc} 12 L${35 + 15 * sc} 12 L${35 + 13 * sc} ${12 + 24 * sc} Q35 ${12 + 36 * sc} ${35 - 13 * sc} ${12 + 24 * sc} Z" fill="${color}"/>
      <rect x="31" y="${12 + 34 * sc}" width="8" height="${10 * sc}" fill="${color}"/>
      <rect x="22" y="${12 + 44 * sc}" width="26" height="7" rx="3" fill="${color}"/>
    </svg>`;
  }
  if(type === 'cake'){
    const w = 36 * scale;
    return `<svg viewBox="0 0 80 70" width="80" height="70">
      <rect x="${40 - w / 2}" y="34" width="${w}" height="24" rx="4" fill="${color}"/>
      <path d="M${40 - w / 2} 34 q ${w / 4} 8 ${w / 2} 0 q ${w / 4} -8 ${w / 2} 0 v -4 h ${-w} Z" fill="${color}" opacity="0.6"/>
      <line x1="40" y1="30" x2="40" y2="20" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="40" cy="16" r="4" fill="var(--rule-d)"/>
    </svg>`;
  }
  if(type === 'suitcase'){
    const w = 48 * scale;
    return `<svg viewBox="0 0 80 70" width="80" height="70">
      <path d="M32 22 Q32 13 40 13 Q48 13 48 22" fill="none" stroke="${color}" stroke-width="4"/>
      <rect x="${40 - w / 2}" y="22" width="${w}" height="${w * 0.72}" rx="6" fill="${color}"/>
      <rect x="36" y="22" width="8" height="${w * 0.72}" fill="var(--paper)" opacity="0.6"/>
    </svg>`;
  }
  if(type === 'tick'){
    const sc = scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <circle cx="35" cy="36" r="${24 * sc}" fill="${color}" opacity="0.18"/>
      <path d="M${35 - 13 * sc} 36 L${35 - 3 * sc} ${36 + 11 * sc} L${35 + 15 * sc} ${36 - 12 * sc}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  // --- Amusement Park lesson icons: an attraction (-ing: what it was
  // like) paired with a face (-ed: how you felt). Paired, not
  // magnitude-based, so `scale` only nudges the size.
  if(type === 'coaster'){
    return `<svg viewBox="0 0 90 70" width="90" height="70">
      <path d="M4 64 C14 64 16 16 32 16 C48 16 46 48 60 48 C72 48 76 24 88 24" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
      <path d="M18 44 V68 M32 18 V68 M48 38 V68 M62 48 V68 M80 30 V68" stroke="var(--muted)" stroke-width="2.5" stroke-linecap="round"/>
      <g transform="rotate(-36 78 22)"><rect x="68" y="12" width="${16 + 4 * scale}" height="10" rx="3" fill="${color}"/><circle cx="72" cy="24" r="3" fill="var(--ink)"/><circle cx="84" cy="24" r="3" fill="var(--ink)"/></g>
    </svg>`;
  }
  if(type === 'carousel'){
    return `<svg viewBox="0 0 80 70" width="80" height="70">
      <polygon points="40,4 72,22 8,22" fill="${color}"/>
      <line x1="40" y1="22" x2="40" y2="58" stroke="var(--muted)" stroke-width="4"/>
      <line x1="22" y1="22" x2="22" y2="42" stroke="var(--muted)" stroke-width="2"/>
      <line x1="58" y1="22" x2="58" y2="36" stroke="var(--muted)" stroke-width="2"/>
      <rect x="14" y="40" width="16" height="9" rx="4" fill="${color}" opacity="0.7"/>
      <rect x="50" y="34" width="16" height="9" rx="4" fill="${color}" opacity="0.7"/>
      <rect x="6" y="58" width="68" height="8" rx="4" fill="${color}"/>
    </svg>`;
  }
  if(type === 'glasses3d'){
    return `<svg viewBox="0 0 90 70" width="90" height="70">
      <rect x="6" y="22" width="78" height="30" rx="8" fill="${color}"/>
      <rect x="13" y="28" width="26" height="18" rx="5" fill="#E4574B"/>
      <rect x="51" y="28" width="26" height="18" rx="5" fill="#31A8E0"/>
      <path d="M41 34 Q45 30 49 34" fill="none" stroke="var(--paper)" stroke-width="3"/>
      <text x="45" y="16" text-anchor="middle" font-family="var(--font-display)" font-weight="800" font-size="14" fill="${color}">3D</text>
    </svg>`;
  }
  if(type === 'ghost'){
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M15 64 V30 a20 20 0 0 1 40 0 V64 l-6 -6 l-7 6 l-7 -6 l-6 6 l-7 -6 Z" fill="${color}"/>
      <circle cx="28" cy="30" r="4" fill="var(--paper)"/>
      <circle cx="42" cy="30" r="4" fill="var(--paper)"/>
      <ellipse cx="35" cy="44" rx="5" ry="6" fill="var(--paper)"/>
    </svg>`;
  }
  if(type.startsWith('face-')){
    const mood = type.slice(5);
    const r = 24 + 4 * scale;
    const f = 'var(--ink)';
    const eyes = {
      excited: `<path d="M23 31 l5 -5 l5 5 M37 31 l5 -5 l5 5" fill="none" stroke="${f}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      bored:   `<path d="M22 30 h11 M37 30 h11" stroke="${f}" stroke-width="3.5" stroke-linecap="round"/><path d="M22 26 h11 M37 26 h11" stroke="${f}" stroke-width="2" stroke-linecap="round" opacity="0.4"/>`,
      amazed:  `<circle cx="28" cy="29" r="5" fill="var(--paper)" stroke="${f}" stroke-width="2.5"/><circle cx="42" cy="29" r="5" fill="var(--paper)" stroke="${f}" stroke-width="2.5"/><circle cx="28" cy="29" r="2" fill="${f}"/><circle cx="42" cy="29" r="2" fill="${f}"/>`,
      scared:  `<circle cx="28" cy="30" r="4.5" fill="var(--paper)" stroke="${f}" stroke-width="2"/><circle cx="42" cy="30" r="4.5" fill="var(--paper)" stroke="${f}" stroke-width="2"/><circle cx="28" cy="31" r="1.6" fill="${f}"/><circle cx="42" cy="31" r="1.6" fill="${f}"/><path d="M22 21 l7 3 M48 21 l-7 3" stroke="${f}" stroke-width="2.5" stroke-linecap="round"/>`
    }[mood] || '';
    const mouth = {
      excited: `<path d="M24 41 Q35 56 46 41 Z" fill="${f}"/>`,
      bored:   `<path d="M28 46 h14" stroke="${f}" stroke-width="3.5" stroke-linecap="round"/>`,
      amazed:  `<ellipse cx="35" cy="46" rx="5" ry="7" fill="${f}"/>`,
      scared:  `<path d="M25 47 q3.3 -4 6.6 0 t6.6 0 t6.6 0" fill="none" stroke="${f}" stroke-width="3" stroke-linecap="round"/><path d="M56 22 q4 6 0 9 q-4 -3 0 -9 Z" fill="#31A8E0"/>`
    }[mood] || '';
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <circle cx="35" cy="36" r="${r}" fill="${color}"/>
      ${eyes}${mouth}
    </svg>`;
  }
  // --- Party Fun lesson icons: a party job on each side. Paired, not
  // magnitude-based, so `scale` only nudges the size.
  if(type === 'biscuits'){
    const r = 9 + 2 * scale;
    return `<svg viewBox="0 0 80 70" width="80" height="70">
      <rect x="6" y="40" width="68" height="10" rx="3" fill="var(--muted)"/>
      ${[18, 40, 62].map(cx => `<circle cx="${cx}" cy="${40 - r}" r="${r}" fill="${color}"/>
      <circle cx="${cx - 3}" cy="${37 - r}" r="1.8" fill="var(--ink)"/><circle cx="${cx + 3}" cy="${42 - r}" r="1.8" fill="var(--ink)"/>`).join('')}
      <path d="M26 14 q4 -5 0 -10 M40 14 q4 -5 0 -10 M54 14 q4 -5 0 -10" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'balloons'){
    const ry = 12 + 3 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M22 34 Q26 50 35 66 M48 32 Q44 50 35 66 M35 28 V66" fill="none" stroke="var(--muted)" stroke-width="2"/>
      <ellipse cx="21" cy="${34 - ry}" rx="${ry * 0.8}" ry="${ry}" fill="${color}" opacity="0.7"/>
      <ellipse cx="49" cy="${32 - ry}" rx="${ry * 0.8}" ry="${ry}" fill="${color}" opacity="0.7"/>
      <ellipse cx="35" cy="${28 - ry * 0.7}" rx="${ry * 0.8}" ry="${ry}" fill="${color}"/>
    </svg>`;
  }
  if(type === 'pizza'){
    const r = 22 + 6 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <circle cx="35" cy="36" r="${r}" fill="${color}" opacity="0.55"/>
      <circle cx="35" cy="36" r="${r - 5}" fill="${color}"/>
      <circle cx="27" cy="29" r="4" fill="var(--paper)"/>
      <circle cx="44" cy="31" r="4" fill="var(--paper)"/>
      <circle cx="32" cy="45" r="4" fill="var(--paper)"/>
      <path d="M35 36 V${36 - r} M35 36 L${35 + r * 0.87} ${36 + r / 2} M35 36 L${35 - r * 0.87} ${36 + r / 2}" stroke="var(--paper)" stroke-width="2" opacity="0.8"/>
    </svg>`;
  }
  if(type === 'music'){
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M24 ${50 - 4 * scale} V16 L56 9 V${44 - 4 * scale}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M24 16 L56 9 V18 L24 25 Z" fill="${color}"/>
      <ellipse cx="17" cy="${52 - 4 * scale}" rx="8.5" ry="7" fill="${color}"/>
      <ellipse cx="49" cy="${46 - 4 * scale}" rx="8.5" ry="7" fill="${color}"/>
    </svg>`;
  }
  if(type === 'dice'){
    const s = 26 + 8 * scale;
    const x = 35 - s / 2, y = 38 - s / 2, p = s / 4;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="6" fill="${color}"/>
      ${[[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]].map(([i, j]) => `<circle cx="${x + i * p}" cy="${y + j * p}" r="3" fill="var(--paper)"/>`).join('')}
    </svg>`;
  }
  if(type === 'poster'){
    const h = 40 + 10 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <rect x="14" y="${64 - h}" width="42" height="${h}" rx="3" fill="${color}"/>
      <polygon points="35,${70 - h} 38,${76 - h} 44,${77 - h} 39.5,${81 - h} 41,${87 - h} 35,${84 - h} 29,${87 - h} 30.5,${81 - h} 26,${77 - h} 32,${76 - h}" fill="var(--rule-d)"/>
      <rect x="20" y="${92 - h}" width="30" height="4" rx="2" fill="var(--paper)"/>
      <rect x="22" y="${100 - h}" width="26" height="4" rx="2" fill="var(--paper)" opacity="0.7"/>
    </svg>`;
  }
  // --- At School lesson icons (2026-11-19): classroom things and
  // cafeteria food, paired, so `scale` only nudges the size.
  if(type === 'pencil'){
    const len = 34 + 6 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70"><g transform="rotate(-35 35 35)">
      <rect x="${48 - len}" y="29" width="${len}" height="12" rx="2" fill="${color}"/>
      <rect x="${42 - len}" y="29" width="7" height="12" rx="2" fill="var(--muted)"/>
      <polygon points="48,29 62,35 48,41" fill="#E9C99A"/>
      <polygon points="57,32.8 62,35 57,37.2" fill="var(--ink)"/>
    </g></svg>`;
  }
  if(type === 'glue'){
    const h = 34 + 6 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <rect x="23" y="${66 - h}" width="24" height="${h}" rx="4" fill="${color}"/>
      <rect x="23" y="${72 - h * 0.7}" width="24" height="10" fill="var(--paper)" opacity="0.85"/>
      <rect x="25" y="${52 - h}" width="20" height="16" rx="4" fill="var(--muted)"/>
    </svg>`;
  }
  if(type === 'brush'){
    return `<svg viewBox="0 0 70 70" width="70" height="70"><g transform="rotate(-45 35 35)">
      <rect x="4" y="32" width="34" height="6" rx="3" fill="var(--muted)"/>
      <rect x="36" y="30" width="9" height="10" rx="1" fill="var(--ink)" opacity="0.6"/>
      <path d="M45 30 Q${62 + 4 * scale} 35 45 40 Z" fill="${color}"/>
    </g></svg>`;
  }
  if(type === 'fish'){
    const rx = 18 + 4 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <ellipse cx="32" cy="36" rx="${rx}" ry="${rx * 0.6}" fill="${color}"/>
      <polygon points="${30 + rx},36 ${44 + rx},24 ${44 + rx},48" fill="${color}"/>
      <circle cx="${32 - rx * 0.55}" cy="32" r="3" fill="var(--paper)"/>
      <path d="M${32 - rx * 0.1} 28 Q${32 + rx * 0.15} 36 ${32 - rx * 0.1} 44" stroke="var(--paper)" stroke-width="2" fill="none" opacity="0.7"/>
    </svg>`;
  }
  if(type === 'bowl'){
    const w = 24 + 4 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M${35 - w} 34 Q35 ${34 + w * 1.4} ${35 + w} 34 Z" fill="${color}"/>
      <ellipse cx="35" cy="34" rx="${w}" ry="5" fill="var(--rule-d)"/>
      <path d="M26 24 q4 -5 0 -10 M35 24 q4 -5 0 -10 M44 24 q4 -5 0 -10" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  if(type === 'juice'){
    const h = 36 + 6 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <line x1="38" y1="${64 - h * 0.55}" x2="47" y2="${64 - h - 12}" stroke="var(--rule-c)" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 ${64 - h} L48 ${64 - h} L45 64 L25 64 Z" fill="var(--paper)" stroke="var(--muted)" stroke-width="2"/>
      <path d="M23.2 ${64 - h * 0.75} L46.8 ${64 - h * 0.75} L45 64 L25 64 Z" fill="${color}"/>
    </svg>`;
  }
  // --- Months / weather / seasons lesson icons (2026-11-19).
  if(type === 'calendar'){
    const s = 40 + 6 * scale;
    const x = 35 - s / 2, y = 38 - s / 2;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="5" fill="var(--paper)" stroke="${color}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${s}" height="${s * 0.28}" rx="5" fill="${color}"/>
      <rect x="${x + s * 0.22}" y="${y - 6}" width="4" height="11" rx="2" fill="var(--muted)"/>
      <rect x="${x + s * 0.7}" y="${y - 6}" width="4" height="11" rx="2" fill="var(--muted)"/>
      <circle cx="${x + s * 0.62}" cy="${y + s * 0.64}" r="${s * 0.14}" fill="none" stroke="var(--rule-a)" stroke-width="3"/>
    </svg>`;
  }
  if(type === 'sun'){
    const r = 12 + 3 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <circle cx="35" cy="35" r="${r}" fill="${color}"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const t = a * Math.PI / 180;
        return `<line x1="${35 + Math.cos(t) * (r + 5)}" y1="${35 + Math.sin(t) * (r + 5)}" x2="${35 + Math.cos(t) * (r + 12)}" y2="${35 + Math.sin(t) * (r + 12)}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
      }).join('')}
    </svg>`;
  }
  if(type === 'snowflake'){
    const l = 22 + 4 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      ${[0, 60, 120].map(a => `<g transform="rotate(${a} 35 35)" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none">
        <line x1="35" y1="${35 - l}" x2="35" y2="${35 + l}"/>
        <path d="M29 ${41 - l} L35 ${47 - l} L41 ${41 - l} M29 ${29 + l} L35 ${23 + l} L41 ${29 + l}"/>
      </g>`).join('')}
    </svg>`;
  }
  if(type === 'flower'){
    const r = 8 + 2 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70">
      <path d="M35 40 V68" stroke="var(--rule-a)" stroke-width="4"/>
      <path d="M35 58 q-12 -2 -14 -12 q12 0 14 12" fill="var(--rule-a)"/>
      ${[0, 72, 144, 216, 288].map(a => {
        const t = (a - 90) * Math.PI / 180;
        return `<circle cx="${35 + Math.cos(t) * r * 1.3}" cy="${28 + Math.sin(t) * r * 1.3}" r="${r}" fill="${color}"/>`;
      }).join('')}
      <circle cx="35" cy="28" r="${r * 0.75}" fill="var(--rule-d)"/>
    </svg>`;
  }
  if(type === 'leaf'){
    const s = 0.85 + 0.15 * scale;
    return `<svg viewBox="0 0 70 70" width="70" height="70"><g transform="translate(35 36) scale(${s}) rotate(-30)">
      <path d="M0 -28 C22 -16 22 14 0 28 C-22 14 -22 -16 0 -28 Z" fill="${color}"/>
      <path d="M0 -24 V34 M0 -6 L10 -14 M0 6 L-10 -2 M0 16 L10 8" stroke="var(--paper)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g></svg>`;
  }
  return '';
}

/* =========================================================
   STAGE 2 — LEARN THE RULE
========================================================= */
/* =========================================================
   ONE SLIDE AT A TIME

   This page used to show every rule as an accordion grid with the
   worked examples underneath, so a learner met the whole grammar
   point — up to six rules plus a comparison demo — in a single
   screenful of small text. Per classroom feedback that this
   overwhelms students at the moment a topic is introduced, it is now
   a slideshow: one rule, big, then Next.

   The worked examples are slides in the SAME sequence rather than a
   separate widget below, which is what lets any one slide have the
   whole stage to fill. So the deck is: every rule, then every
   example, and the last Next leads into controlled practice.
========================================================= */
function learnSlides(){
  return [
    ...RULES.map(rule => ({ kind: 'rule', data: rule })),
    ...COMPARE_DEMOS.map(demo => ({ kind: 'demo', data: demo }))
  ];
}

function renderRuleSlide(rule){
  return `
    <article class="learn-card learn-card-rule" style="--card-color:${rule.color}">
      <h3 class="learn-rule-name">${rule.name}</h3>
      <p class="learn-rule-formula">${rule.formula}</p>
      <div class="learn-rule-examples">
        ${rule.examples.map(([base, suffix]) => `
          <div class="rule-example">${base}<span class="arrow">→</span>${base}<span class="suffix">${suffix}</span></div>
        `).join('')}
      </div>
    </article>
  `;
}

function renderDemoSlide(demo){
  // iconA/iconB let each side show a different icon type (a symptom
  // paired with its advice); demos that only set `icon` (the original
  // magnitude comparisons — two towers, one taller) fall back to using
  // that same icon/color on both sides, unchanged.
  const iconA = demo.iconA || demo.icon;
  const iconB = demo.iconB || demo.icon;
  return `
    <article class="learn-card learn-card-demo">
      <div class="compare-icons">
        <div class="compare-icon-box">
          <div class="compare-icon-frame">${buildCompareIcon(iconA, demo.valueA, COMPARE_ICON_COLORS[iconA])}</div>
          <span class="bar-label">${demo.labelA}</span>
        </div>
        <div class="compare-vs">vs</div>
        <div class="compare-icon-box">
          <div class="compare-icon-frame">${buildCompareIcon(iconB, demo.valueB, COMPARE_ICON_COLORS[iconB])}</div>
          <span class="bar-label">${demo.labelB}</span>
        </div>
      </div>
      <p class="compare-caption">${demo.caption}</p>
    </article>
  `;
}

export function renderLearnSlide(){
  const slides = learnSlides();
  // Content changes with the lesson, so clamp rather than assume the
  // stored index is still in range after a lesson switch.
  const index = Math.max(0, Math.min(state.learnIndex, slides.length - 1));
  state.learnIndex = index;
  const slide = slides[index];

  document.getElementById('learnSlide').innerHTML =
    slide.kind === 'rule' ? renderRuleSlide(slide.data) : renderDemoSlide(slide.data);

  // Dots double as direct navigation — a teacher revisiting one rule
  // mid-explanation shouldn't have to click Next through the others.
  const dots = document.getElementById('learnDots');
  dots.innerHTML = slides.map((s, i) => `
    <button class="demo-dot ${i === index ? 'active' : ''}${s.kind === 'demo' ? ' is-demo' : ''}"
      data-i="${i}" type="button"
      aria-label="${s.kind === 'rule' ? 'Rule' : 'Example'} ${i + 1} of ${slides.length}"></button>
  `).join('');
  dots.querySelectorAll('.demo-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      state.learnIndex = Number(dot.dataset.i);
      renderLearnSlide();
    });
  });

  document.getElementById('learnPrevSlideBtn').disabled = index === 0;
  // On the final slide the in-page Next becomes the way forward into
  // practice, so a teacher can run the whole page from one button
  // instead of switching to the footer at the end.
  const next = document.getElementById('learnNextSlideBtn');
  next.textContent = index === slides.length - 1 ? 'Next: Controlled practice →' : 'Next →';
}

document.getElementById('learnPrevSlideBtn').addEventListener('click', () => {
  if(state.learnIndex > 0){ state.learnIndex--; renderLearnSlide(); }
});
document.getElementById('learnNextSlideBtn').addEventListener('click', () => {
  if(state.learnIndex >= learnSlides().length - 1){ goToStage(3); return; }
  state.learnIndex++;
  renderLearnSlide();
});

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
