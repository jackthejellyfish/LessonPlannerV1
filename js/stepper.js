import { state } from './state.js';
import { goToStage } from './navigation.js';

// Kept SHORT on purpose: with 17 stages the stepper gives each label
// only ~56-80px before it wraps, so "Whack!" beats "Whack-a-Monster".
export const STAGE_LABELS = ["Aim", "Learn", "Controlled", "Guided", "Free practice", "Balloon Pop", "Star Defender", "Spin Wheel", "Questions", "Billiards", "Neon Arena", "Fruit Ninja", "Hoop Shot", "Whack!", "Jelly Maze", "Ninja Jump", "Zombie Dash"];

export function renderStepper(){
  const stepper = document.getElementById('stepper');
  stepper.innerHTML = STAGE_LABELS.map((label, i) => {
    const num = i + 1;
    const isActive = num === state.currentStage;
    const isDone = state.completedStages.has(num) && !isActive;
    return `
      <button class="step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" data-stage="${num}"${isActive ? ' aria-current="step"' : ''}>
        <div class="step-line"></div>
        <span class="circle">${isDone ? '✓' : num}</span>
        <span class="step-label">${label}</span>
      </button>
    `;
  }).join('');

  stepper.querySelectorAll('.step').forEach(btn => {
    // A tap on the step you're already on does nothing. It used to run a
    // full stage exit, which cancels a game round in progress - easy to do
    // by accident on a touch board.
    btn.addEventListener('click', () => {
      const num = Number(btn.dataset.stage);
      if(num !== state.currentStage) goToStage(num);
    });
  });
}
