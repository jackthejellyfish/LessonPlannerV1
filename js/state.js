/* =========================================================
   STATE
   One shared, mutable state object. Every module imports the
   same live binding — reassigning it here (see resetLessonState)
   is visible to every importer immediately, per the ES module spec.
========================================================= */
export let state = {
  currentLesson: 'comparatives',
  currentStage: 1,
  completedStages: new Set(),
  learnIndex: 0,             // Stage 2 slide: the rules first, then the worked examples
  mcIndex: 0,
  mcScore: 0,
  mcAnswered: false,
  mcTimerRAF: null,
  mcStarted: false,   // becomes true the first time the learner actually reaches stage 3
  semiIndex: 0,
  semiScore: 0,
  semiBank: [],     // chips still available to click, in shuffled order
  semiAnswer: [],   // chips clicked so far, in the order clicked
  semiChecked: false,
  semiTimerRAF: null,
  semiStarted: false, // becomes true the first time the learner actually reaches stage 4
  popTeams: [],
  popCurrentTeam: 0,
  popQuestionOrder: [],  // shuffled indices into POP_QUESTIONS, one consumed per turn
  popTurnsPlayed: 0,
  popScore: 0,           // pops scored in the round currently in progress
  popRoundActive: false,
  popRoundRAF: null,
  popParticles: [],       // live particle data: {x, y, vx, vy, alpha, decay, size, color}
  popParticleRAF: null,   // the continuous rendering loop's requestAnimationFrame id
  popBallAnims: [],       // every currently-live ball's {el, xPct, yPct, color, scale, alpha, special}
  popSpecialUsedThisRound: false,
  popSwarmRemaining: 0,   // balls still to clear from the special-ball swarm, if one is in progress
  popBgBlobs: [],         // animated background bokeh blobs for the Ball Pop canvas
  popBombTimeouts: [],    // scheduled setTimeout ids for bombs not yet spawned this round
  popActiveBombs: [],     // currently live bombs: { bomb, anim, fuseInterval, expireTimeout }
  popGemTimeouts: [],     // scheduled setTimeout ids for gems not yet spawned this round
  popActiveGems: [],      // currently live gems: { gem, anim, expireTimeout }
  popMultiTimeouts: [],   // scheduled setTimeout ids for the multiplier ball not yet spawned this round
  popActiveMulti: [],     // currently live multiplier ball(s): { el, anim, expireTimeout }
  popMultiplierUntil: 0,  // performance.now() timestamp — while in the future, all scoring doubles
  invTeams: [],
  invCurrentTeam: 0,
  invQuestionOrder: [],
  invTurnsPlayed: 0,
  invScore: 0,
  invLives: 3,
  invRoundActive: false,
  invRoundRAF: null,
  invShip: { x: 50, targetX: 50 },
  invProjectiles: [],
  invEnemies: [],
  invPickups: [],
  invParticles: [],
  invShockwaves: [],      // expanding rings fired on every enemy kill: { x, y, color, big, createdAt }
  invStars: [],           // starfield background positions, generated once on first render
  invRapidFireUntil: 0,
  invMachineGunUntil: 0,
  invLastAutoFireAt: 0,
  invLastShotAt: 0,
  invBossSpawnedThisRound: false,
  invBossTimeout: null,
  wheelTeams: [],
  wheelCurrentTeam: 0,
  wheelQuestionOrder: [],
  wheelTurnsPlayed: 0,
  wheelUsedSegments: [],   // parallel boolean array, one per WHEEL_QUESTIONS segment — true once spun
  wheelRoundActive: false, // true while the spin animation is running
  wheelRoundRAF: null,
  wheelParticles: [],
  billiardsTeams: [],
  billiardsCurrentTeam: 0,
  billiardsQuestionOrder: [],
  billiardsTurnsPlayed: 0,
  billiardsTurnScore: 0,     // points earned so far in the shot currently in progress
  billiardsBalls: [],        // cue ball + object balls this turn: {x,y,vx,vy,r,value,color,isCue,pocketed}
  billiardsShotFired: false, // true once the cue ball is struck, until the shot resolves
  billiardsRoundActive: false,
  billiardsRoundRAF: null,
  billiardsParticles: [],
  neonTeams: [],
  neonCurrentTeam: 0,
  neonQuestionOrder: [],
  neonTurnsPlayed: 0,
  neonScore: 0,
  neonLives: 3,
  neonRoundActive: false,
  neonRoundRAF: null,
  neonPlayer: { x: 50, y: 50 },
  neonBullets: [],
  neonShrapnel: [],          // Nova Bomb's flying shrapnel — see triggerNeonNovaBomb
  neonEnemies: [],
  neonPickups: [],
  neonParticles: [],
  neonPowerActive: false,    // Power Core pickup — bigger/more forgiving bullets, rest of round
  neonOverdriveActive: false,// Overdrive pickup — faster bullets, rest of round
  neonSpreadActive: false,   // Spread Core pickup — 5-pellet fan shot, rest of round
  neonLastShotAt: 0,
  neonInvulnUntil: 0,        // brief invulnerability window after a life is lost
  neonBossSpawnedThisRound: false,
  neonBossTimeout: null,
  fruitTeams: [],
  fruitCurrentTeam: 0,
  fruitQuestionOrder: [],
  fruitTurnsPlayed: 0,
  fruitScore: 0,
  fruitRoundActive: false,
  fruitRoundRAF: null,
  fruitShapes: [],           // live uncut shapes + flying cut halves this round
  fruitParticles: [],
  fruitSwipeTrail: [],       // recent blade-swipe points: { x, y, createdAt }, fades and is used for cut detection
  // Stage 13 (Hoop Shot)
  hoopTeams: [],
  hoopCurrentTeam: 0,
  hoopQuestionOrder: [],
  hoopTurnsPlayed: 0,
  hoopScore: 0,
  hoopShotsLeft: 0,
  hoopRoundActive: false,
  hoopRoundRAF: null,
  // Stage 14 (Whack-a-Monster)
  whackTeams: [],
  whackCurrentTeam: 0,
  whackQuestionOrder: [],
  whackTurnsPlayed: 0,
  whackScore: 0,
  whackRoundActive: false,
  whackRoundRAF: null,
  muted: false
};

// Restarts the whole lesson. Reassigns the exported `state` binding —
// every module that imported { state } sees the new object immediately.
export function resetLessonState(lessonId = state.currentLesson){
  const wasMuted = state.muted;
  state = {
    currentLesson: lessonId,
    currentStage: 1, completedStages: new Set(), learnIndex: 0,
    mcIndex: 0, mcScore: 0, mcAnswered: false, mcTimerRAF: null, mcStarted: false,
    semiIndex: 0, semiScore: 0, semiBank: [], semiAnswer: [], semiChecked: false, semiTimerRAF: null, semiStarted: false,
    popTeams: [], popCurrentTeam: 0, popQuestionOrder: [], popTurnsPlayed: 0, popScore: 0, popRoundActive: false, popRoundRAF: null,
    popParticles: [], popParticleRAF: null, popBallAnims: [], popSpecialUsedThisRound: false, popSwarmRemaining: 0, popBgBlobs: [],
    popBombTimeouts: [], popActiveBombs: [],
    popGemTimeouts: [], popActiveGems: [],
    popMultiTimeouts: [], popActiveMulti: [], popMultiplierUntil: 0,
    invTeams: [], invCurrentTeam: 0, invQuestionOrder: [], invTurnsPlayed: 0, invScore: 0, invLives: 3,
    invRoundActive: false, invRoundRAF: null, invShip: { x: 50, targetX: 50 },
    invProjectiles: [], invEnemies: [], invPickups: [], invParticles: [], invShockwaves: [], invStars: [],
    invRapidFireUntil: 0, invMachineGunUntil: 0, invLastAutoFireAt: 0, invLastShotAt: 0,
    invBossSpawnedThisRound: false, invBossTimeout: null,
    wheelTeams: [], wheelCurrentTeam: 0, wheelQuestionOrder: [], wheelTurnsPlayed: 0,
    wheelUsedSegments: [], wheelRoundActive: false, wheelRoundRAF: null, wheelParticles: [],
    billiardsTeams: [], billiardsCurrentTeam: 0, billiardsQuestionOrder: [], billiardsTurnsPlayed: 0,
    billiardsTurnScore: 0, billiardsBalls: [], billiardsShotFired: false,
    billiardsRoundActive: false, billiardsRoundRAF: null, billiardsParticles: [],
    neonTeams: [], neonCurrentTeam: 0, neonQuestionOrder: [], neonTurnsPlayed: 0,
    neonScore: 0, neonLives: 3, neonRoundActive: false, neonRoundRAF: null,
    neonPlayer: { x: 50, y: 50 }, neonBullets: [], neonShrapnel: [], neonEnemies: [], neonPickups: [],
    neonParticles: [],
    neonPowerActive: false, neonOverdriveActive: false, neonSpreadActive: false,
    neonLastShotAt: 0, neonInvulnUntil: 0,
    neonBossSpawnedThisRound: false, neonBossTimeout: null,
    fruitTeams: [], fruitCurrentTeam: 0, fruitQuestionOrder: [], fruitTurnsPlayed: 0, fruitScore: 0,
    fruitRoundActive: false, fruitRoundRAF: null, fruitShapes: [], fruitParticles: [], fruitSwipeTrail: [],
    hoopTeams: [], hoopCurrentTeam: 0, hoopQuestionOrder: [], hoopTurnsPlayed: 0,
    hoopScore: 0, hoopShotsLeft: 0, hoopRoundActive: false, hoopRoundRAF: null,
    whackTeams: [], whackCurrentTeam: 0, whackQuestionOrder: [], whackTurnsPlayed: 0,
    whackScore: 0, whackRoundActive: false, whackRoundRAF: null,
    muted: wasMuted
  };
}
