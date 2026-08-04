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
