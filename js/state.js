/* =========================================================
   STATE
   One shared, mutable state object. Every module imports the
   same live binding — reassigning it here (see resetLessonState)
   is visible to every importer immediately, per the ES module spec.

   Every field is defined ONCE, in createState() below, which serves
   both the first load and every restart. It used to be written out
   twice — an annotated initial object and a compressed copy inside
   resetLessonState() — so a field added to one and forgotten in the
   other became a value that silently survived a lesson restart.
========================================================= */
function createState(lessonId, muted){
  return {
    currentLesson: lessonId,
    currentStage: 1,
    completedStages: new Set(),
    learnIndex: 0,             // Stage 2 slide: the rules first, then the worked examples
    freeIndex: 0,              // Stage 5 slide: the task, then your turn
    mcIndex: 0,
    mcScore: 0,
    mcAnswered: false,
    mcTimerRAF: null,
    mcAdvanceTimeout: null,  // the pause between an answer and the next question
    mcAdvancePending: false, // that pause was cut short by leaving the stage
    mcStarted: false,   // becomes true the first time the learner actually reaches stage 3
    semiIndex: 0,
    semiScore: 0,
    semiBank: [],     // chips still available to click, in shuffled order
    semiAnswer: [],   // chips clicked so far, in the order clicked
    semiChecked: false,
    semiTimerRAF: null,
    semiStarted: false, // becomes true the first time the learner actually reaches stage 4
    qsStarted: false,   // Stage 9 worksheet set up for this lesson (keeps revealed answers on revisits)
    popTeams: [],
    popCurrentTeam: 0,
    popQuestionOrder: [],  // shuffled indices into POP_QUESTIONS, one consumed per turn
    popTurnsPlayed: 0,
    popScore: 0,           // pops scored in the round currently in progress
    popRoundActive: false,
    popRoundRAF: null,
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
    neonPlayer: { x: 95, y: 55 },  // world units: the arena is 100 tall, worldW wide
    neonBullets: [],
    neonShrapnel: [],          // Nova Bomb's flying shrapnel — see triggerNeonNovaBomb
    neonEnemies: [],
    neonPickups: [],
    neonParticles: [],
    neonPowerUntil: 0,         // Power Core pickup — piercing, double-damage shots until this time (ms)
    neonOverdriveUntil: 0,     // Overdrive pickup — faster fire and faster bolts until this time
    neonSpreadUntil: 0,        // Spread Core pickup — 5-bolt fan until this time
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
    whackColumns: 4,      // lanes the jellyfish come up in (1-5), the teacher's choice
    // Stage 15 (Jelly Maze)
    mazeTeams: [],
    mazeCurrentTeam: 0,
    mazeQuestionOrder: [],
    mazeTurnsPlayed: 0,
    mazeScore: 0,
    mazeRoundActive: false,
    mazeRoundRAF: null,
    // Stage 16 (Ninja Jump)
    jumpTeams: [],
    jumpCurrentTeam: 0,
    jumpQuestionOrder: [],
    jumpTurnsPlayed: 0,
    jumpScore: 0,
    jumpRoundActive: false,
    jumpRoundRAF: null,
    jumpLevel: 0,         // which level is up next (0-based); laps move it on, the teacher can pick
    jumpSeconds: 10,      // round length, the teacher's choice (10/15/20/30)
    zombieTeams: [],
    zombieCurrentTeam: 0,
    zombieQuestionOrder: [],
    zombieTurnsPlayed: 0,
    zombieScore: 0,
    zombieRoundActive: false,
    zombieRoundRAF: null,
    zombieLevel: 0,       // which level is up next (0-based); laps move it on, the teacher can pick
    muted
  };
}

export let state = createState('comparatives', false);

// Restarts the whole lesson. Reassigns the exported `state` binding —
// every module that imported { state } sees the new object immediately.
// Only the lesson choice and the mute setting carry across.
export function resetLessonState(lessonId = state.currentLesson){
  state = createState(lessonId, state.muted);
}
