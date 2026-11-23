import { state } from '../state.js';
import { goToStage } from '../navigation.js';
import { shuffle } from '../utils.js';
import { askTeamQuestion } from '../questionChoices.js';
import { beep, sfxImpact, sfxRisingChime } from '../audio.js';
import { renderTeamSetupRows, wireAddTeamButton, renderTeamScoreboard } from '../teamColorPicker.js';
import { renderGameIntro } from '../gameIntro.js';
import { HOOP_QUESTIONS } from '../content/stage13-hoopshot.js';
import { createCanvasResizer } from '../canvasGame.js';
import { showTurnResultModal, finishTeamGame, wireTeamManagementButtons, readTeamsFromSetup, showGameScreen, renderTurnBanner } from '../teamGameFlow.js';
import { spawnFloatText, updateFloatTexts, drawFloatTexts } from '../canvasFloatText.js';
import { createShakeState, triggerShake, applyShake, stepParticles, frameFactor } from '../canvasEffects.js';
import { createBackdrop } from '../canvasGlow.js';
import { setTimerFill } from '../hud.js';
import { noteFrame, particleCount } from '../quality.js';

/* =========================================================
   STAGE 13 — FOOTBALL (a penalty shoot-out)
   Rebuilt 2026-11-22 from Hoop Shot ("rework the basketball game into
   a football game: fun physics and characters, a little bit silly").
   The file, the `hoop` id prefix and HOOP_QUESTIONS keep their old
   names, the same way Balloon Pop kept Ball Pop's.

   Answer a question, then take three penalty kicks. Tap anywhere on
   the goal to aim (or nudge the aim with the arrow buttons / keys),
   then press KICK. Nothing fires until KICK, so a slip costs nothing.

   The skill is WHERE and WHEN: the goalkeeper sways about in his goal
   and, once the ball is struck, dives late (and now and then the wrong
   way), so a kick into the corner he's furthest from is the best bet.
   Some kicks have a wall of hopping defenders in front, so aim over
   them. Corners are worth more than the middle.

   The view looks from behind the ball at the goal. Positions are in
   "goal units": the posts are at x = -1 and +1, the crossbar at
   y = 0.66, and depth z runs from 0 (the penalty spot) to 1 (the goal
   line). proj() turns that into canvas pixels with a simple
   perspective, so near things are bigger.
========================================================= */
const SHOTS_PER_TURN = 3;
const BAR_Y = 0.66;
const POST_R = 0.05;
const FLIGHT_S = 0.8;          // spot to goal line
const RUNUP_S = 0.45;
const WALL_Z = 0.58;
const KEEPER_REACT_S = 0.2;
const KEEPER_DIVE_SPEED = 2.4; // goal units/second
const KEEPER_MAX_DIVE = 0.55;
const KEEPER_MAX_TILT = 0.9;   // radians: a full dive lies him well over, but not flat
const KEEPER_LENGTH = 0.62;    // feet to gloves, in goal units
const KEEPER_WRONG_WAY = 0.33; // how often he guesses the wrong side
const GRAVITY = 2.6;
const GOAL_POINTS = 3;
const CORNER_POINTS = 5;
const GREEN = '#46B04A';

/* =========================================================
   AUDIO
========================================================= */
function sfxKick(){ sfxImpact(0.55); beep(140, 0.08, 'sine', 0.16); }
function sfxStep(){ beep(90 + Math.random() * 30, 0.04, 'triangle', 0.05); }
function sfxBoing(){ beep(260, 0.07, 'square', 0.08); beep(520, 0.14, 'sine', 0.1, 0.03); beep(390, 0.16, 'sine', 0.06, 0.1); }
function sfxSave(){ sfxImpact(0.4); beep(220, 0.12, 'sawtooth', 0.05); }
function sfxGoal(corner){
  sfxRisingChime(corner ? [784, 988, 1175, 1568, 1976] : [659, 880, 1109, 1319], { duration: 0.14, volume: 0.15, stagger: 0.05 });
  // The crowd: a burst of filtered "noise" made of quick random beeps.
  for(let i = 0; i < 8; i++) beep(300 + Math.random() * 500, 0.12, 'sawtooth', 0.012, 0.05 + i * 0.04);
}
function sfxAim(){ beep(880, 0.02, 'triangle', 0.03); }

/* =========================================================
   SETUP / TEAMS
========================================================= */
let hoopRowColors = [];
let floatTexts = [];
let particles = [];
let shake = createShakeState();

renderGameIntro('hoopSetup', {
  prefix: 'hoop',
  title: 'Football',
  steps: [
    'One team answers a question.',
    'Tap the goal where you want to shoot (or use the arrow buttons), then press KICK!',
    'You get three kicks. Beat the goalie, and look out for the wall!'
  ],
  scoring: [
    { swatch: '<span class="hoop-legend-swatch goal"></span>', label: 'Goal!', points: '+3' },
    { swatch: '<span class="hoop-legend-swatch corner"></span>', label: 'Top corner', points: '+5', tone: 'bonus' },
    { swatch: '<span class="hoop-legend-swatch miss"></span>', label: 'Saved, wide or off the post', points: '0' }
  ],
  tip: 'The goalie sways from side to side. Kick when he is far from where you are aiming, and he might even dive the wrong way!'
});

export function renderHoopTeamInputs(count){
  renderTeamSetupRows('hoopTeamInputs', 'hoopAddTeamBtn', count, hoopRowColors, renderHoopTeamInputs);
}
renderHoopTeamInputs(2);
wireAddTeamButton('hoopTeamInputs', 'hoopAddTeamBtn', renderHoopTeamInputs);

document.getElementById('hoopStartBtn').addEventListener('click', () => {
  state.hoopTeams = readTeamsFromSetup('hoop', hoopRowColors);
  state.hoopCurrentTeam = 0;
  state.hoopTurnsPlayed = 0;
  state.hoopQuestionOrder = shuffle(HOOP_QUESTIONS.map((_, i) => i));
  showGameScreen('hoop');
  renderHoopScoreboard();
  renderHoopTurnBanner();
  newShot(true);
  ensureHoopLayout();
});

function renderHoopScoreboard(){
  renderTeamScoreboard('hoopTeamList', state.hoopTeams, state.hoopCurrentTeam);
}
function renderHoopTurnBanner(){
  renderTurnBanner('hoop', state.hoopTeams[state.hoopCurrentTeam], state.hoopTurnsPlayed + 1, HOOP_QUESTIONS.length);
}

/* =========================================================
   CANVAS + PERSPECTIVE
========================================================= */
// Opaque canvas: the stadium backdrop covers it every frame.
const hoopCanvasResizer = createCanvasResizer('hoopCanvas', 'hoopPlayArea', () => {
  renderHoopCanvas();
}, { contextAttributes: { alpha: false }, maxBufferWidth: 1024 });
export function ensureHoopLayout(){
  if(state.hoopTeams.length > 0){ hoopCanvasResizer.resize(); renderHoopCanvas(); }
}

// The goal's place on screen. The dock of buttons sits over the bottom
// of the play area, so the penalty spot is kept above it.
function viewOf(w, h){
  const GW = Math.min(w * 0.3, h * 0.55);   // half the goal's width, in px
  return { w, h, cx: w / 2, Gy: h * 0.6, Sy: h * 0.8, GW, Kn: 1.9 };
}
// Goal units (x across, y up, z depth) to canvas pixels, and the scale
// there (1 on the goal line, bigger nearer the viewer).
function proj(v, x, y, z){
  const k = v.Kn + (1 - v.Kn) * z;
  const groundY = v.Sy + (v.Gy - v.Sy) * z;
  return { x: v.cx + x * v.GW * k, y: groundY - y * v.GW * k, k };
}

/* =========================================================
   THE STADIUM (cached)
========================================================= */
const renderStadium = createBackdrop((ctx, w, h) => {
  const v = viewOf(w, h);
  // Sky and floodlights.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.3);
  sky.addColorStop(0, '#1B2A5A'); sky.addColorStop(1, '#3C5BA8');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.3);
  // The stand and a crowd of coloured dots.
  const standTop = h * 0.07, standBot = v.Gy - v.GW * 0.95;
  ctx.fillStyle = '#2B2F45'; ctx.fillRect(0, standTop, w, standBot - standTop);
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const fans = ['#FF5F6D', '#FFD23F', '#4DA3FF', '#FFFFFF', '#FF9F43', '#B07CFF', '#3FD38B'];
  const rows = 6, rowH = (standBot - standTop) / rows;
  for(let r = 0; r < rows; r++){
    for(let x = rowH * 0.6 * (r % 2 ? 1 : 0.5); x < w; x += rowH * 0.85){
      ctx.fillStyle = fans[Math.floor(rnd() * fans.length)];
      ctx.beginPath(); ctx.arc(x, standTop + rowH * (r + 0.55), rowH * 0.32, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Advert boards.
  const boardY = standBot, boardH = h * 0.035;
  const ads = ['#FF5F6D', '#FFD23F', '#4DA3FF', '#3FD38B'];
  for(let i = 0; i * w / 8 < w; i++){ ctx.fillStyle = ads[i % ads.length]; ctx.fillRect(i * w / 8, boardY, w / 8, boardH); }
  // The pitch, with mowing stripes that narrow towards the goal.
  const pitchTop = boardY + boardH;
  ctx.fillStyle = GREEN; ctx.fillRect(0, pitchTop, w, h - pitchTop);
  ctx.fillStyle = '#3FA043';
  for(let i = -6; i <= 6; i += 2){
    const a = proj(v, i * 0.5, 0, 1.25), b = proj(v, (i + 1) * 0.5, 0, 1.25);
    const c = proj(v, (i + 1) * 0.5, 0, -0.6), d = proj(v, i * 0.5, 0, -0.6);
    ctx.beginPath(); ctx.moveTo(a.x, pitchTop); ctx.lineTo(b.x, pitchTop); ctx.lineTo(c.x, d.y + 400); ctx.lineTo(d.x, d.y + 400); ctx.fill();
  }
  // White lines: the goal line, the six-yard box, the spot.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(2, v.GW * 0.012);
  const line = (pts) => { ctx.beginPath(); pts.forEach(([x, z], i) => { const p = proj(v, x, 0, z); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke(); };
  line([[-3.5, 1], [3.5, 1]]);
  line([[-1.6, 1], [-1.6, 0.72], [1.6, 0.72], [1.6, 1]]);
  line([[-2.8, 1], [-2.8, 0.25], [2.8, 0.25], [2.8, 1]]);
  const spot = proj(v, 0, 0, 0);
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(spot.x, spot.y, v.GW * 0.03, v.GW * 0.012, 0, 0, Math.PI * 2); ctx.fill();
  // The net (behind the goal line) and the frame.
  const back = 1.18;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  const tl = proj(v, -1, BAR_Y, back), tr = proj(v, 1, BAR_Y, back), bl = proj(v, -1, 0, back), br = proj(v, 1, 0, back);
  ctx.fillRect(tl.x, tl.y, tr.x - tl.x, bl.y - tl.y);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i = 0; i <= 14; i++){ const x = tl.x + (tr.x - tl.x) * i / 14; ctx.moveTo(x, tl.y); ctx.lineTo(x, bl.y); }
  for(let i = 0; i <= 7; i++){ const y = tl.y + (bl.y - tl.y) * i / 7; ctx.moveTo(tl.x, y); ctx.lineTo(tr.x, y); }
  const fl = proj(v, -1, BAR_Y, 1), fr = proj(v, 1, BAR_Y, 1), fbl = proj(v, -1, 0, 1), fbr = proj(v, 1, 0, 1);
  ctx.moveTo(fl.x, fl.y); ctx.lineTo(tl.x, tl.y); ctx.moveTo(fr.x, fr.y); ctx.lineTo(tr.x, tr.y);
  ctx.moveTo(fbl.x, fbl.y); ctx.lineTo(bl.x, bl.y); ctx.moveTo(fbr.x, fbr.y); ctx.lineTo(br.x, br.y);
  ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = v.GW * 0.045; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fbl.x, fbl.y); ctx.lineTo(fl.x, fl.y); ctx.lineTo(fr.x, fr.y); ctx.lineTo(fbr.x, fbr.y); ctx.stroke();
  // The two "top corner" targets, faintly marked.
  ctx.fillStyle = 'rgba(255,210,63,0.16)';
  for(const side of [-1, 1]){
    const a = proj(v, side * 0.6, BAR_Y, 1), b = proj(v, side * 1, 0.38, 1);
    ctx.fillRect(Math.min(a.x, b.x), a.y, Math.abs(b.x - a.x), b.y - a.y);
  }
});

/* =========================================================
   ONE PENALTY
========================================================= */
let aim = { x: 0.55, y: 0.45 };
let keeper = null;
let wall = [];
let ball = null;
let kicker = null;
let phase = 'aim';          // aim | runup | flight | loose | done
let phaseAt = 0;
let shotResult = null;      // 'goal' | 'corner' | 'saved' | 'post' | 'wide' | 'blocked'
let netBulge = null;
let shotsTaken = 0;

function newShot(first){
  const now = performance.now();
  keeper = {
    x: 0, y: 0, center: 0, swayAmp: 0.3 + Math.random() * 0.28, swaySpeed: 1.3 + Math.random() * 0.9, swayPhase: Math.random() * 6,
    diving: false, diveFrom: 0, diveTo: 0, diveAt: 0, tilt: 0, dizzyUntil: 0, bob: 0, cheer: false
  };
  // The first kick of a turn has no wall; later ones may have 0-3.
  wall = [];
  const n = first ? 0 : (Math.random() < 0.45 ? 0 : 1 + Math.floor(Math.random() * 3));
  for(let i = 0; i < n; i++){
    let x, tries = 0;
    do { x = -0.75 + Math.random() * 1.5; tries++; } while(tries < 20 && wall.some(d => Math.abs(d.x - x) < 0.3));
    wall.push({ x, jumpAt: Math.random() * 0.35, jumpY: 0, color: ['#E8453C', '#2F6FE0', '#F59F00'][i % 3], blink: Math.random() * 3 });
  }
  ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, squash: 0 };
  kicker = { t: 0, mood: 'ready' };
  phase = 'aim';
  phaseAt = now;
  shotResult = null;
  netBulge = null;
  syncControls();
}

function canAim(){ return state.hoopRoundActive && phase === 'aim'; }

function setHint(text){
  const hint = document.getElementById('hoopHint');
  if(hint) hint.textContent = text;
}

/* ---- Aiming ---- */
function setAim(x, y){
  aim.x = Math.max(-1.35, Math.min(1.35, x));
  aim.y = Math.max(0.04, Math.min(0.95, y));
}
function nudge(dx, dy){
  if(!canAim()) return false;
  setAim(aim.x + dx, aim.y + dy);
  sfxAim();
  return true;
}
function wireHoldButton(id, dx, dy){
  const btn = document.getElementById(id);
  let timer = null;
  const stop = () => { clearTimeout(timer); timer = null; };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch(_){ /* ignore */ }
    nudge(dx, dy);
    let delay = 260;
    const repeat = () => { if(!nudge(dx, dy)) { stop(); return; } delay = Math.max(50, delay * 0.8); timer = setTimeout(repeat, delay); };
    timer = setTimeout(repeat, delay);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
  btn.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); nudge(dx, dy); } });
}
wireHoldButton('hoopAngleDown', -0.06, 0);
wireHoldButton('hoopAngleUp', 0.06, 0);
wireHoldButton('hoopPowerDown', 0, -0.05);
wireHoldButton('hoopPowerUp', 0, 0.05);
document.getElementById('hoopShootBtn').addEventListener('click', kick);

document.addEventListener('keydown', (e) => {
  if(state.currentStage !== 17 || !canAim()) return;
  if(document.querySelector('.overlay:not(.hidden)')) return;
  if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const map = { ArrowLeft: [-0.06, 0], ArrowRight: [0.06, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] };
  if(map[e.key]){ e.preventDefault(); nudge(...map[e.key]); return; }
  if(e.key === ' ' || e.key === 'Enter'){
    if(e.target && e.target.tagName === 'BUTTON' && e.target.closest('#hoopControls')) return;
    e.preventDefault(); kick();
  }
});

// Tap (or press and slide) anywhere on the goal to put the target there.
const canvasEl = hoopCanvasResizer.getCanvas();
let pointerAiming = false;
function aimAtPointer(e){
  if(!canAim()) return;
  const canvas = hoopCanvasResizer.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * canvas.width / rect.width;
  const py = (e.clientY - rect.top) * canvas.height / rect.height;
  const v = viewOf(canvas.width, canvas.height);
  setAim((px - v.cx) / v.GW, (v.Gy - py) / v.GW);
}
canvasEl.addEventListener('pointerdown', (e) => {
  if(!canAim()) return;
  pointerAiming = true;
  try { canvasEl.setPointerCapture(e.pointerId); } catch(_){ /* ignore */ }
  aimAtPointer(e);
  sfxAim();
  e.preventDefault();
});
canvasEl.addEventListener('pointermove', (e) => { if(pointerAiming) aimAtPointer(e); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => canvasEl.addEventListener(ev, () => { pointerAiming = false; }));

function syncControls(){
  const on = canAim();
  document.querySelectorAll('#hoopControls button').forEach(b => { b.disabled = !on; });
}

/* ---- The kick ---- */
function kick(){
  if(!canAim()) return;
  phase = 'runup';
  phaseAt = performance.now();
  kicker.mood = 'run';
  // A little random bend, so the same aim doesn't always land the same.
  ball.curve = (Math.random() - 0.5) * 0.16;
  ball.tx = aim.x; ball.ty = aim.y;
  setHint('Here goes...');
  syncControls();
}

function launch(now){
  phase = 'flight';
  phaseAt = now;
  sfxKick();
  triggerShake(shake, 2);
  // The keeper reads it (or doesn't), a moment after the strike.
  const guessRight = Math.random() > KEEPER_WRONG_WAY;
  const target = guessRight ? ball.tx + (Math.random() - 0.5) * 0.25 : -Math.sign(ball.tx || 1) * (0.3 + Math.random() * 0.4);
  keeper.diveAt = now + KEEPER_REACT_S * 1000;
  keeper.diveTo = target;
}

function addPoints(n, label, color, at){
  state.hoopScore += n;
  document.getElementById('hoopScoreDisplay').textContent = String(state.hoopScore);
  const canvas = hoopCanvasResizer.getCanvas();
  const v = viewOf(canvas.width, canvas.height);
  const p = proj(v, at.x, at.y + 0.15, Math.min(1, at.z));
  spawnFloatText(floatTexts, p.x, p.y, label, color, -1.4);
}

function burst(at, color, count, speed = 1){
  const canvas = hoopCanvasResizer.getCanvas();
  const v = viewOf(canvas.width, canvas.height);
  const p = proj(v, at.x, at.y, Math.min(1.1, at.z));
  const n = particleCount(count);
  const s = v.GW / 200;
  for(let i = 0; i < n; i++){
    const a = Math.random() * Math.PI * 2, sp = (Math.random() * 6 + 2) * speed * s;
    particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2 * s, alpha: 1, decay: 0.015 + Math.random() * 0.02,
      size: (Math.random() * 4 + 2) * s, color: color || ['#FF5F6D', '#FFD23F', '#4DA3FF', '#3FD38B', '#FFFFFF'][i % 5] });
  }
}

// Does the keeper get a hand (or a face) to it? He is a line from his
// feet to his gloves, tipped over by his dive, with some thickness:
// exactly what's drawn. Standing he's wide (arms out); fully stretched
// he's thinner, and can't reach the top corners.
function keeperTouches(x, y){
  const fx = keeper.x, fy = 0.05;
  const hx = fx + Math.sin(keeper.tilt) * KEEPER_LENGTH, hy = fy + Math.cos(keeper.tilt) * KEEPER_LENGTH;
  const dx = hx - fx, dy = hy - fy;
  const t = Math.max(0, Math.min(1, ((x - fx) * dx + (y - fy) * dy) / (dx * dx + dy * dy)));
  const d = Math.hypot(x - (fx + dx * t), y - (fy + dy * t));
  const thick = 0.2 + (0.11 - 0.2) * Math.min(1, Math.abs(keeper.tilt) / KEEPER_MAX_TILT);
  return d < thick;
}

// The ball reaches the goal line: post, save, goal or miss.
function judgeAtGoal(now){
  const x = ball.x, y = ball.y;
  const absX = Math.abs(x);
  const hitPost = Math.abs(absX - 1) < POST_R + 0.03 && y < BAR_Y + 0.03;
  const hitBar = Math.abs(y - BAR_Y) < POST_R + 0.03 && absX < 1 + POST_R;
  if(hitPost || hitBar){
    shotResult = 'post';
    ball.vz = -0.5; ball.vx = hitPost ? -Math.sign(x) * (0.5 + Math.random() * 0.4) : (Math.random() - 0.5) * 0.8;
    ball.vy = hitBar ? -0.2 : 0.4;
    phase = 'loose'; phaseAt = now;
    sfxBoing(); triggerShake(shake, 5);
    addPoints(0, 'BOING!', '#FFFFFF', ball);
    kicker.mood = 'sad';
    return;
  }
  const inGoal = absX < 1 - POST_R && y < BAR_Y - 0.02;
  if(!inGoal){
    shotResult = 'wide';
    ball.vz = 0.9; ball.vx = x * 0.4; ball.vy = 0.2;
    phase = 'loose'; phaseAt = now;
    addPoints(0, y >= BAR_Y ? 'Over the bar!' : 'Wide!', '#FFFFFF', ball);
    kicker.mood = 'sad';
    return;
  }
  if(keeperTouches(x, y)){
    shotResult = 'saved';
    ball.vz = -0.55; ball.vx = (x - keeper.x) * 2.2 + (Math.random() - 0.5) * 0.4; ball.vy = 0.55;
    phase = 'loose'; phaseAt = now;
    sfxSave(); triggerShake(shake, 4);
    // Off the face: dizzy!
    if(y > 0.4 && Math.abs(keeper.tilt) < 0.4 && Math.abs(x - keeper.x) < 0.12){ keeper.dizzyUntil = now + 1600; addPoints(0, 'BONK! Saved!', '#FFD23F', ball); }
    else addPoints(0, 'SAVED!', '#FFFFFF', ball);
    keeper.cheer = true;
    kicker.mood = 'sad';
    return;
  }
  const corner = absX > 0.6 && y > 0.38;
  shotResult = corner ? 'corner' : 'goal';
  ball.vz = 0.5; ball.vx = 0; ball.vy = 0;
  phase = 'loose'; phaseAt = now;
  netBulge = { x, y, at: now };
  addPoints(corner ? CORNER_POINTS : GOAL_POINTS, corner ? 'TOP CORNER! +5' : 'GOAL! +3', corner ? '#FFD23F' : '#FFFFFF', ball);
  burst(ball, null, corner ? 50 : 34, 1.3);
  triggerShake(shake, corner ? 8 : 5);
  sfxGoal(corner);
  kicker.mood = 'happy';
  if(keeper.diving && Math.sign(keeper.diveTo - keeper.diveFrom) !== Math.sign(x - keeper.diveFrom)) setHint('Sent him the wrong way!');
}

function update(dt, now){
  const t = now / 1000;
  // Keeper sways until the ball is struck, then dives.
  if(!keeper.diving){
    if(phase === 'aim' || phase === 'runup' || (phase === 'flight' && now < keeper.diveAt)){
      keeper.x = keeper.center + Math.sin(t * keeper.swaySpeed + keeper.swayPhase) * keeper.swayAmp;
    } else if(phase === 'flight'){
      keeper.diving = true; keeper.diveFrom = keeper.x;
      const want = keeper.diveTo - keeper.x;
      keeper.diveTo = Math.max(-0.85, Math.min(0.85, keeper.x + Math.max(-KEEPER_MAX_DIVE, Math.min(KEEPER_MAX_DIVE, want))));
    }
  } else {
    const dir = Math.sign(keeper.diveTo - keeper.x);
    keeper.x += dir * Math.min(Math.abs(keeper.diveTo - keeper.x), KEEPER_DIVE_SPEED * dt);
    const target = Math.sign(keeper.diveTo - keeper.diveFrom) * Math.min(KEEPER_MAX_TILT, Math.abs(keeper.diveTo - keeper.diveFrom) * 2);
    keeper.tilt += (target - keeper.tilt) * Math.min(1, dt * 10);
  }
  keeper.bob = Math.abs(Math.sin(t * 6)) * (keeper.diving ? 0 : 0.02);

  // Wall defenders hop when the ball is struck.
  if(phase === 'flight' || phase === 'loose'){
    const since = (now - phaseAt) / 1000 + (phase === 'loose' ? FLIGHT_S : 0);
    for(const d of wall){
      const j = (since - d.jumpAt) / 0.45;
      d.jumpY = j > 0 && j < 1 ? Math.sin(j * Math.PI) * 0.24 : 0;
    }
  }

  if(phase === 'runup'){
    kicker.t = Math.min(1, (now - phaseAt) / (RUNUP_S * 1000));
    if(Math.floor(kicker.t * 6) !== kicker.lastStep){ kicker.lastStep = Math.floor(kicker.t * 6); sfxStep(); }
    if(kicker.t >= 1) launch(now);
  } else if(phase === 'flight'){
    const p = Math.min(1, (now - phaseAt) / (FLIGHT_S * 1000));
    const prevZ = ball.z;
    ball.z = p;
    ball.x = ball.tx * p + ball.curve * Math.sin(Math.PI * p);
    ball.y = ball.ty * p + 0.16 * Math.sin(Math.PI * p);
    ball.spin += dt * 14;
    // Through the wall?
    if(prevZ < WALL_Z && ball.z >= WALL_Z){
      for(const d of wall){
        if(Math.abs(ball.x - d.x) < 0.13 && ball.y < 0.44 + d.jumpY){
          shotResult = 'blocked';
          ball.vz = -0.45; ball.vx = (ball.x - d.x) * 3 + (Math.random() - 0.5) * 0.6; ball.vy = 0.6;
          phase = 'loose'; phaseAt = now;
          sfxSave(); triggerShake(shake, 3);
          addPoints(0, 'Blocked!', '#FFFFFF', ball);
          kicker.mood = 'sad';
          return;
        }
      }
    }
    if(p >= 1) judgeAtGoal(now);
  } else if(phase === 'loose'){
    // Free physics: rebounds bounce along the grass; a goal settles in
    // the net; a miss sails off.
    const inNet = shotResult === 'goal' || shotResult === 'corner';
    ball.x += ball.vx * dt; ball.z += ball.vz * dt; ball.y += ball.vy * dt;
    if(inNet){
      ball.vz *= Math.pow(0.02, dt);
      if(ball.z > 1.14){ ball.z = 1.14; ball.vz = 0; }
      ball.vy -= GRAVITY * 0.5 * dt;
      if(ball.y < 0){ ball.y = 0; ball.vy = 0; }
    } else {
      ball.vy -= GRAVITY * dt;
      if(ball.y < 0){
        ball.y = 0;
        if(Math.abs(ball.vy) > 0.25){ ball.squash = 1; beep(200, 0.04, 'sine', 0.06); }
        ball.vy = -ball.vy * 0.55; ball.vx *= 0.8; ball.vz *= 0.8;
      }
    }
    ball.spin += dt * (Math.hypot(ball.vx, ball.vz) * 8);
    ball.squash = Math.max(0, ball.squash - dt * 6);
    if(now - phaseAt > (inNet ? 1300 : 1200)){ phase = 'done'; resolveShot(); }
  }
}

function resolveShot(){
  shotsTaken++;
  state.hoopShotsLeft--;
  document.getElementById('hoopShotsDisplay').textContent = String(Math.max(0, state.hoopShotsLeft));
  setTimerFill(document.getElementById('hoopTimerFill'), state.hoopShotsLeft / SHOTS_PER_TURN);
  setTimeout(() => {
    if(!state.hoopRoundActive) return;
    if(state.hoopShotsLeft <= 0){ finishHoopRound(); return; }
    newShot(false);
    setHint(wall.length ? 'A wall! Aim over it, then KICK!' : 'Tap the goal to aim, then KICK!');
  }, 350);
}

/* =========================================================
   DRAWING
========================================================= */
// The goalkeeper: noodle arms, giant gloves, googly eyes on the ball.
// Diving, he tips over from his feet; dizzy, stars spin round his head.
function drawKeeper(ctx, v, now){
  const base = proj(v, keeper.x, 0, 1);
  const u = v.GW;                         // 1 goal unit in px, on the goal line
  ctx.save();
  ctx.translate(base.x, base.y - keeper.bob * u);
  ctx.rotate(keeper.tilt);
  // Legs.
  ctx.strokeStyle = '#1E2433'; ctx.lineWidth = u * 0.045; ctx.lineCap = 'round';
  const kickLeg = keeper.diving ? 0.08 : Math.sin(now / 160) * 0.02;
  ctx.beginPath(); ctx.moveTo(-u * 0.05, -u * 0.18); ctx.lineTo(-u * 0.08 - kickLeg * u, 0); ctx.moveTo(u * 0.05, -u * 0.18); ctx.lineTo(u * 0.08 + kickLeg * u, 0); ctx.stroke();
  // Body (a bright jersey) and shorts.
  ctx.fillStyle = '#B8F03C';
  ctx.beginPath(); ctx.ellipse(0, -u * 0.31, u * 0.12, u * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1E2433'; ctx.fillRect(-u * 0.1, -u * 0.2, u * 0.2, u * 0.05);
  ctx.fillStyle = '#1E2433'; ctx.font = `800 ${u * 0.09}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('1', 0, -u * 0.32);
  // Noodle arms up and out, wobbling, with huge gloves.
  const wob = Math.sin(now / 130) * 0.04;
  const reach = keeper.diving ? 0.36 : 0.24;
  ctx.strokeStyle = '#FFD7A8'; ctx.lineWidth = u * 0.035;
  ctx.beginPath();
  for(const side of [-1, 1]){
    ctx.moveTo(side * u * 0.1, -u * 0.38);
    ctx.quadraticCurveTo(side * u * (reach * 0.6), -u * (0.5 + wob * side), side * u * reach, -u * (0.52 + wob * side));
  }
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  for(const side of [-1, 1]){ ctx.beginPath(); ctx.arc(side * u * reach, -u * (0.53 + wob * side), u * 0.06, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#FF6B6B';
  for(const side of [-1, 1]){ ctx.beginPath(); ctx.arc(side * u * reach, -u * (0.53 + wob * side), u * 0.03, 0, Math.PI * 2); ctx.fill(); }
  // Head, googly eyes on the ball, a cap.
  ctx.fillStyle = '#FFD7A8';
  ctx.beginPath(); ctx.arc(0, -u * 0.52, u * 0.085, 0, Math.PI * 2); ctx.fill();
  const bp = proj(v, ball.x, ball.y, Math.min(1, ball.z));
  const look = Math.atan2(bp.y - (base.y - u * 0.52), bp.x - base.x) - keeper.tilt;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(-u * 0.035, -u * 0.54, u * 0.032, 0, Math.PI * 2); ctx.arc(u * 0.038, -u * 0.545, u * 0.026, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1E2433';
  const dizzy = now < keeper.dizzyUntil;
  if(dizzy){
    ctx.font = `800 ${u * 0.05}px sans-serif`;
    ctx.fillText('x', -u * 0.035, -u * 0.54); ctx.fillText('x', u * 0.038, -u * 0.545);
  } else {
    ctx.beginPath();
    ctx.arc(-u * 0.035 + Math.cos(look) * u * 0.013, -u * 0.54 + Math.sin(look) * u * 0.013, u * 0.014, 0, Math.PI * 2);
    ctx.arc(u * 0.038 + Math.cos(look) * u * 0.011, -u * 0.545 + Math.sin(look) * u * 0.011, u * 0.011, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#1E2433'; ctx.lineWidth = u * 0.008;
  ctx.beginPath();
  if(keeper.cheer) ctx.arc(0, -u * 0.5, u * 0.03, 0.2, Math.PI - 0.2);
  else { ctx.moveTo(-u * 0.025, -u * 0.485); ctx.lineTo(u * 0.025, -u * 0.48); }
  ctx.stroke();
  ctx.fillStyle = '#2F6FE0';
  ctx.beginPath(); ctx.arc(0, -u * 0.565, u * 0.085, Math.PI, 0); ctx.fill();
  ctx.restore();
  if(dizzy){
    ctx.fillStyle = '#FFE066';
    for(let k = 0; k < 3; k++){
      const a = now / 180 + k * 2.1;
      const hx = base.x + Math.sin(keeper.tilt) * u * 0.55, hy = base.y - Math.cos(keeper.tilt) * u * 0.62;
      ctx.beginPath(); ctx.arc(hx + Math.cos(a) * u * 0.1, hy + Math.sin(a) * u * 0.03, u * 0.018, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// Wall defenders: round, eyes squeezed shut, hands over their faces.
function drawWall(ctx, v, now){
  for(const d of wall){
    const p = proj(v, d.x, d.jumpY, WALL_Z);
    const u = v.GW * p.k;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    const g = proj(v, d.x, 0, WALL_Z);
    ctx.beginPath(); ctx.ellipse(g.x, g.y, u * 0.12, u * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1E2433';
    ctx.fillRect(p.x - u * 0.06, p.y - u * 0.14, u * 0.035, u * 0.14); ctx.fillRect(p.x + u * 0.025, p.y - u * 0.14, u * 0.035, u * 0.14);
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - u * 0.25, u * 0.11, u * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFD7A8';
    ctx.beginPath(); ctx.arc(p.x, p.y - u * 0.41, u * 0.075, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1E2433'; ctx.lineWidth = Math.max(1, u * 0.01);
    const blink = (now / 1000 + d.blink) % 3 < 0.15 || d.jumpY > 0;
    ctx.beginPath();
    if(blink){ ctx.moveTo(p.x - u * 0.04, p.y - u * 0.42); ctx.lineTo(p.x - u * 0.015, p.y - u * 0.42); ctx.moveTo(p.x + u * 0.015, p.y - u * 0.42); ctx.lineTo(p.x + u * 0.04, p.y - u * 0.42); }
    else { ctx.arc(p.x - u * 0.028, p.y - u * 0.42, u * 0.012, 0, Math.PI * 2); ctx.moveTo(p.x + u * 0.04, p.y - u * 0.42); ctx.arc(p.x + u * 0.028, p.y - u * 0.42, u * 0.012, 0, Math.PI * 2); }
    ctx.stroke();
    // Hands up in front of the face when jumping.
    ctx.fillStyle = '#FFD7A8';
    const hy = d.jumpY > 0 ? p.y - u * 0.38 : p.y - u * 0.22;
    ctx.beginPath(); ctx.arc(p.x - u * 0.05, hy, u * 0.03, 0, Math.PI * 2); ctx.arc(p.x + u * 0.05, hy, u * 0.03, 0, Math.PI * 2); ctx.fill();
  }
}

// The striker, seen from behind: runs in from the left with wobbly legs
// and big boots, then celebrates or holds their head.
function drawKicker(ctx, v, now){
  const spot = proj(v, 0, 0, 0);
  const u = v.GW * spot.k * 0.6;
  let x, y;
  if(phase === 'aim'){ x = spot.x - u * 0.75; y = spot.y + u * 0.18; }
  else if(phase === 'runup'){ const t = kicker.t; x = spot.x - u * (0.75 - 0.55 * t); y = spot.y + u * (0.18 - 0.12 * t) - Math.abs(Math.sin(t * Math.PI * 3)) * u * 0.05; }
  else { x = spot.x - u * 0.2; y = spot.y + u * 0.06; }
  const happy = kicker.mood === 'happy' && phase !== 'runup';
  const jump = happy ? Math.abs(Math.sin(now / 140)) * u * 0.08 : 0;
  y -= jump;
  const swing = phase === 'runup' ? Math.sin(kicker.t * Math.PI * 6) * 0.5 : phase === 'flight' && now - phaseAt < 250 ? 0.9 : 0;
  ctx.save();
  ctx.translate(x, y);
  // Legs with big boots.
  ctx.strokeStyle = '#FFD7A8'; ctx.lineWidth = u * 0.04; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-u * 0.04, -u * 0.12); ctx.lineTo(-u * 0.05 - swing * u * 0.04, 0);
  ctx.moveTo(u * 0.04, -u * 0.12); ctx.lineTo(u * 0.06 + swing * u * 0.12, -swing * u * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#1E2433';
  ctx.beginPath(); ctx.ellipse(-u * 0.05 - swing * u * 0.04, 0, u * 0.045, u * 0.022, 0, 0, Math.PI * 2);
  ctx.ellipse(u * 0.06 + swing * u * 0.12, -swing * u * 0.06, u * 0.045, u * 0.022, 0, 0, Math.PI * 2); ctx.fill();
  // Shorts, shirt with a number, head.
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-u * 0.08, -u * 0.16, u * 0.16, u * 0.06);
  ctx.fillStyle = '#E8453C';
  ctx.beginPath(); ctx.ellipse(0, -u * 0.25, u * 0.1, u * 0.11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = `800 ${u * 0.09}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('9', 0, -u * 0.25);
  // Arms: up for joy, on the head when it went wrong, swinging otherwise.
  ctx.strokeStyle = '#FFD7A8'; ctx.lineWidth = u * 0.03;
  ctx.beginPath();
  if(happy){ ctx.moveTo(-u * 0.08, -u * 0.3); ctx.lineTo(-u * 0.16, -u * 0.48); ctx.moveTo(u * 0.08, -u * 0.3); ctx.lineTo(u * 0.16, -u * 0.48); }
  else if(kicker.mood === 'sad' && phase !== 'runup'){ ctx.moveTo(-u * 0.08, -u * 0.3); ctx.lineTo(-u * 0.07, -u * 0.43); ctx.moveTo(u * 0.08, -u * 0.3); ctx.lineTo(u * 0.07, -u * 0.43); }
  else { ctx.moveTo(-u * 0.08, -u * 0.3); ctx.lineTo(-u * 0.14, -u * (0.2 + swing * 0.05)); ctx.moveTo(u * 0.08, -u * 0.3); ctx.lineTo(u * 0.14, -u * (0.2 - swing * 0.05)); }
  ctx.stroke();
  ctx.fillStyle = '#6B3E26';
  ctx.beginPath(); ctx.arc(0, -u * 0.4, u * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD23F'; ctx.fillRect(-u * 0.07, -u * 0.43, u * 0.14, u * 0.02); // headband
  ctx.restore();
}

function drawBall(ctx, v){
  const p = proj(v, ball.x, ball.y, ball.z);
  const g = proj(v, ball.x, 0, ball.z);
  const r = v.GW * 0.055 * p.k;
  // Shadow on the grass, smaller the higher the ball.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y, r * (1 - Math.min(0.6, ball.y)), r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(p.x, p.y - r);
  ctx.scale(1 + ball.squash * 0.25, 1 - ball.squash * 0.25);
  ctx.rotate(ball.spin);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1E2433';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
  for(let k = 0; k < 5; k++){
    const a = k * Math.PI * 2 / 5;
    ctx.moveTo(Math.cos(a) * r * 0.86 + r * 0.14, Math.sin(a) * r * 0.86);
    ctx.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.14, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function drawTarget(ctx, v, now){
  const p = proj(v, aim.x, aim.y, 1);
  const r = v.GW * (0.07 + Math.sin(now / 200) * 0.006);
  ctx.save();
  ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = Math.max(2, v.GW * 0.014);
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.moveTo(p.x - r * 1.4, p.y); ctx.lineTo(p.x - r * 0.5, p.y); ctx.moveTo(p.x + r * 0.5, p.y); ctx.lineTo(p.x + r * 1.4, p.y);
  ctx.moveTo(p.x, p.y - r * 1.4); ctx.lineTo(p.x, p.y - r * 0.5); ctx.moveTo(p.x, p.y + r * 0.5); ctx.lineTo(p.x, p.y + r * 1.4);
  ctx.stroke();
  ctx.restore();
}

function renderHoopCanvas(){
  const canvas = hoopCanvasResizer.getCanvas();
  if(!canvas || canvas.width === 0 || canvas.height === 0) return;
  const ctx = hoopCanvasResizer.getContext();
  const v = viewOf(canvas.width, canvas.height);
  const now = performance.now();
  renderStadium(ctx, canvas);
  if(!ball) return;
  ctx.save();
  applyShake(ctx, shake);
  // The net bulges where a goal went in.
  if(netBulge){
    const t = (now - netBulge.at) / 700;
    if(t < 1){
      const p = proj(v, netBulge.x, netBulge.y, 1.15);
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - t)})`; ctx.lineWidth = Math.max(1, v.GW * 0.006);
      for(let k = 1; k <= 3; k++){ ctx.beginPath(); ctx.arc(p.x, p.y, v.GW * 0.06 * k * (0.6 + t), 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  // Back to front: anything in the net, keeper, wall, ball, striker.
  const ballBehind = ball.z > 1;
  if(ballBehind) drawBall(ctx, v);
  drawKeeper(ctx, v, now);
  if(!ballBehind && ball.z > WALL_Z) drawBall(ctx, v);
  drawWall(ctx, v, now);
  if(phase === 'aim') drawTarget(ctx, v, now);
  if(!ballBehind && ball.z <= WALL_Z) drawBall(ctx, v);
  drawKicker(ctx, v, now);
  ctx.save();
  for(const p of particles){
    ctx.globalAlpha = Math.max(0, p.alpha); ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
  }
  ctx.restore();
  drawFloatTexts(ctx, floatTexts, Math.max(18, v.GW * 0.12));
  ctx.restore();
}

/* =========================================================
   QUESTION + TURN FLOW
========================================================= */
function askHoopQuestion(){
  const q = HOOP_QUESTIONS[state.hoopQuestionOrder[state.hoopTurnsPlayed]];
  return askTeamQuestion(q, HOOP_QUESTIONS, state.hoopTurnsPlayed);
}

document.getElementById('hoopBeginTurnBtn').addEventListener('click', async () => {
  document.getElementById('hoopBeginTurnBtn').disabled = true;
  await askHoopQuestion();
  startHoopRound();
});

function startHoopRound(){
  cancelHoopRound();
  state.hoopRoundActive = true;
  state.hoopScore = 0;
  state.hoopShotsLeft = SHOTS_PER_TURN;
  shotsTaken = 0;
  floatTexts = []; particles = [];
  shake = createShakeState();
  aim = { x: 0.55, y: 0.45 };
  document.getElementById('hoopScoreDisplay').textContent = '0';
  document.getElementById('hoopShotsDisplay').textContent = String(SHOTS_PER_TURN);
  setTimerFill(document.getElementById('hoopTimerFill'), 1);
  document.getElementById('hoopPlayArea').classList.remove('idle');
  document.getElementById('hoopHint').classList.remove('hidden');
  hoopCanvasResizer.resize();
  newShot(true);
  setHint('Tap the goal to aim, then KICK!');

  let last = performance.now();
  function tick(now){
    const dtMs = Math.min(50, now - last);
    noteFrame();
    last = now;
    update(dtMs / 1000, now);
    const k = frameFactor(dtMs);
    stepParticles(particles, k, { gravity: 0.25, dragX: 0.98 });
    floatTexts = updateFloatTexts(floatTexts, k);
    renderHoopCanvas();
    if(state.hoopRoundActive) state.hoopRoundRAF = requestAnimationFrame(tick);
  }
  state.hoopRoundRAF = requestAnimationFrame(tick);
}

export function cancelHoopRound(){
  if(state.hoopRoundRAF) cancelAnimationFrame(state.hoopRoundRAF);
  state.hoopRoundRAF = null;
  if(state.hoopRoundActive){
    state.hoopRoundActive = false;
    const playArea = document.getElementById('hoopPlayArea');
    if(playArea) playArea.classList.add('idle');
    const hint = document.getElementById('hoopHint');
    if(hint) hint.classList.add('hidden');
    newShot(true);
    renderHoopCanvas();
    const begin = document.getElementById('hoopBeginTurnBtn');
    if(begin) begin.disabled = false;
  }
}

function finishHoopRound(){
  state.hoopRoundActive = false;
  if(state.hoopRoundRAF) cancelAnimationFrame(state.hoopRoundRAF);
  state.hoopRoundRAF = null;
  document.getElementById('hoopPlayArea').classList.add('idle');
  document.getElementById('hoopHint').classList.add('hidden');
  syncControls();

  state.hoopTeams[state.hoopCurrentTeam].total += state.hoopScore;
  state.hoopTurnsPlayed++;
  renderHoopScoreboard();

  showTurnResultModal('hoopNextTeamBtn', { teams: state.hoopTeams, currentTeamIndex: state.hoopCurrentTeam }).then(() => {
    if(state.hoopTurnsPlayed >= HOOP_QUESTIONS.length){ endHoopGame(); return; }
    state.hoopCurrentTeam = (state.hoopCurrentTeam + 1) % state.hoopTeams.length;
    renderHoopScoreboard();
    renderHoopTurnBanner();
    newShot(true);
    renderHoopCanvas();
    document.getElementById('hoopBeginTurnBtn').disabled = false;
    document.getElementById('hoopShotsDisplay').textContent = String(SHOTS_PER_TURN);
    setTimerFill(document.getElementById('hoopTimerFill'), 1);
  });
}

function endHoopGame(){
  const winnerText = finishTeamGame({ prefix: 'hoop', teams: state.hoopTeams, setPlayAreaIdle: true });
  document.getElementById('hoopTurnBanner').innerHTML = `All done — ${winnerText}`;
}

// For the automated tests only.
export function debugFootball(){
  return { phase, aim: { ...aim }, keeper: keeper ? { x: keeper.x, diving: keeper.diving } : null, wall: wall.length,
    result: shotResult, shotsLeft: state.hoopShotsLeft, ball: ball ? { x: ball.x, y: ball.y, z: ball.z } : null };
}
// Freezes the keeper far from (left of) the aim, so a test can score.
export function debugParkKeeper(x){ if(keeper){ keeper.swayAmp = 0; keeper.center = x; keeper.x = x; } }

/* =========================================================
   TEAM MANAGEMENT + NAVIGATION
========================================================= */
wireTeamManagementButtons({
  prefix: 'hoop',
  getTeams: () => state.hoopTeams,
  renderScoreboard: renderHoopScoreboard,
  cancelRound: cancelHoopRound
});

document.getElementById('hoopBackBtn').addEventListener('click', () => goToStage(16));
// Wired here (the target stage's own file) — the existing convention.
document.getElementById('fruitNextStageBtn').addEventListener('click', () => goToStage(17));
