import { state } from './state.js';
import { goToStage } from './navigation.js';

export const STAGE_LABELS = ["Aim", "Learn", "Controlled", "Guided", "Free practice", "Ball Pop", "Star Defender", "Spin Wheel", "Questions", "Plinko", "Sky Slingshot", "Comet Chaos", "Billiards", "Neon Arena"];

export function renderStepper(){
  const stepper = document.getElementById('stepper');
  stepper.innerHTML = STAGE_LABELS.map((label, i) => {
    const num = i + 1;
    const isActive = num === state.currentStage;
    const isDone = state.completedStages.has(num) && !isActive;
    return `
      <button class="step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" data-stage="${num}">
        <div class="step-line"></div>
        <span class="circle">${isDone ? '✓' : num}</span>
        <span class="step-label">${label}</span>
      </button>
    `;
  }).join('');

  stepper.querySelectorAll('.step').forEach(btn => {
    btn.addEventListener('click', () => goToStage(Number(btn.dataset.stage)));
  });
}
