/* =========================================================
   LESSON CONTENT — Stage 15 (Jelly Maze)
   "Fill the gap" questions: a sentence with one gap and the base
   word in brackets. A different shape from every other game's bank
   (which-is-right, make-it-a-question, is-this-right, opposites).
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'A whale is ___ than a dolphin.' (big)", answer: "bigger" },
      { prompt: "Fill the gap: 'A shark is ___ than a goldfish.' (dangerous)", answer: "more dangerous" },
      { prompt: "Fill the gap: 'The sea is ___ than the swimming pool.' (deep)", answer: "deeper" },
      { prompt: "Fill the gap: 'A jellyfish is ___ than a crab.' (soft)", answer: "softer" },
      { prompt: "Fill the gap: 'My maze is ___ than yours.' (easy)", answer: "easier" },
      { prompt: "Fill the gap: 'This octopus is ___ than that one.' (funny)", answer: "funnier" },
      { prompt: "Fill the gap: 'The water is ___ today than yesterday.' (cold)", answer: "colder" },
      { prompt: "Fill the gap: 'Swimming is ___ than running.' (good)", answer: "better" },
      { prompt: "Fill the gap: 'A turtle is ___ than a fish.' (slow)", answer: "slower" },
      { prompt: "Fill the gap: 'This shell is ___ than that pearl.' (beautiful)", answer: "more beautiful" }
    ]
  },
  health: {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'I've got a headache. I ___ take some medicine.' (should)", answer: "should" },
      { prompt: "Fill the gap: 'You've got a cold. You ___ go swimming.' (shouldn't)", answer: "shouldn't" },
      { prompt: "Fill the gap: 'She's got a toothache. She should ___ a dentist.' (see)", answer: "see" },
      { prompt: "Fill the gap: 'He's got a fever. He should ___ in bed.' (stay)", answer: "stay" },
      { prompt: "Fill the gap: 'What's the ___? — I've got a sore throat.' (matter)", answer: "matter" },
      { prompt: "Fill the gap: 'You've got a stomach ache. You ___ eat sweets.' (shouldn't)", answer: "shouldn't" },
      { prompt: "Fill the gap: 'We've got a cough. We should ___ some water.' (drink)", answer: "drink" },
      { prompt: "Fill the gap: 'They've got a backache. They ___ rest.' (should)", answer: "should" },
      { prompt: "Fill the gap: 'I've got an earache. ___ I see a doctor?' (should)", answer: "Should" },
      { prompt: "Fill the gap: 'You've got a runny nose. You should ___ a tissue.' (use)", answer: "use" }
    ]
  },
  'comparatives-superlatives': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'The blue whale is ___ animal in the sea.' (big)", answer: "the biggest" },
      { prompt: "Fill the gap: 'A dolphin is ___ than a turtle.' (fast)", answer: "faster" },
      { prompt: "Fill the gap: 'This is ___ maze in the game.' (difficult)", answer: "the most difficult" },
      { prompt: "Fill the gap: 'The Pacific is ___ ocean in the world.' (deep)", answer: "the deepest" },
      { prompt: "Fill the gap: 'A crab is ___ than a shark.' (small)", answer: "smaller" },
      { prompt: "Fill the gap: 'That was ___ day of the holiday.' (good)", answer: "the best" },
      { prompt: "Fill the gap: 'This beach is ___ than that one.' (busy)", answer: "busier" },
      { prompt: "Fill the gap: 'It was ___ storm of the year.' (bad)", answer: "the worst" },
      { prompt: "Fill the gap: 'The aquarium is ___ than the museum.' (interesting)", answer: "more interesting" },
      { prompt: "Fill the gap: 'Jack is ___ jellyfish in the sea.' (happy)", answer: "the happiest" }
    ]
  },
  'will-wont': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'I think it ___ be sunny tomorrow.' (will)", answer: "will" },
      { prompt: "Fill the gap: 'Don't worry. I ___ tell anyone.' (won't)", answer: "won't" },
      { prompt: "Fill the gap: 'That bag looks heavy. I ___ carry it for you.' (will)", answer: "'ll / will" },
      { prompt: "Fill the gap: 'She will ___ the race, I'm sure!' (win)", answer: "win" },
      { prompt: "Fill the gap: 'They won't ___ late again.' (be)", answer: "be" },
      { prompt: "Fill the gap: '___ you help me with my homework?' (will)", answer: "Will" },
      { prompt: "Fill the gap: 'I promise I ___ forget your birthday.' (won't)", answer: "won't" },
      { prompt: "Fill the gap: 'In the future, robots ___ do our jobs.' (will)", answer: "will" },
      { prompt: "Fill the gap: 'It's cold. I ___ close the window.' (will)", answer: "'ll / will" },
      { prompt: "Fill the gap: 'He won't ___ to the party.' (come)", answer: "come" }
    ]
  },
  'present-perfect': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'I have ___ in the sea.' (swim)", answer: "swum" },
      { prompt: "Fill the gap: 'She has ___ a real shark.' (see)", answer: "seen" },
      { prompt: "Fill the gap: 'They ___ never been to Australia.' (have)", answer: "have" },
      { prompt: "Fill the gap: 'He has ___ his phone again!' (lose)", answer: "lost" },
      { prompt: "Fill the gap: 'Have you ever ___ a jellyfish?' (touch)", answer: "touched" },
      { prompt: "Fill the gap: 'We have ___ lunch already.' (eat)", answer: "eaten" },
      { prompt: "Fill the gap: 'It ___ just started to rain.' (have)", answer: "has" },
      { prompt: "Fill the gap: 'I have ___ this book three times.' (read)", answer: "read" },
      { prompt: "Fill the gap: 'She has ___ a cake for us.' (make)", answer: "made" },
      { prompt: "Fill the gap: 'Have you ___ your homework yet?' (do)", answer: "done" }
    ]
  },
  'amusement-park': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'Yesterday we ___ to the amusement park.' (go)", answer: "went" },
      { prompt: "Fill the gap: 'The haunted house was really ___.' (scare)", answer: "scary" },
      { prompt: "Fill the gap: 'I ___ the roller coaster three times!' (ride)", answer: "rode" },
      { prompt: "Fill the gap: 'My sister was ___ in the long queue.' (bore)", answer: "bored" },
      { prompt: "Fill the gap: 'We ___ a big parade.' (see)", answer: "saw" },
      { prompt: "Fill the gap: 'The 3D film was ___.' (amaze)", answer: "amazing" },
      { prompt: "Fill the gap: 'They ___ the petting zoo.' (visit)", answer: "visited" },
      { prompt: "Fill the gap: 'I was very ___ before the ride.' (excite)", answer: "excited" },
      { prompt: "Fill the gap: 'He ___ some candy floss.' (eat)", answer: "ate" },
      { prompt: "Fill the gap: 'The merry-go-round was a bit ___.' (bore)", answer: "boring" }
    ]
  },
  'party-fun': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: '___ will blow up the balloons?' (who)", answer: "Who" },
      { prompt: "Fill the gap: 'Rosa ___ bake biscuits.' (will)", answer: "will" },
      { prompt: "Fill the gap: 'Will you bring games? — Yes, I ___.' (will)", answer: "will" },
      { prompt: "Fill the gap: 'Will Tom choose the music? — No, he ___.' (won't)", answer: "won't" },
      { prompt: "Fill the gap: 'What ___ you do for the party?' (will)", answer: "will" },
      { prompt: "Fill the gap: 'I'll ___ the table.' (set)", answer: "set" },
      { prompt: "Fill the gap: 'She will ___ up the decorations.' (hang)", answer: "hang" },
      { prompt: "Fill the gap: 'We ___ order pizza. We'll make sandwiches.' (won't)", answer: "won't" },
      { prompt: "Fill the gap: 'Who will ___ the posters?' (draw)", answer: "draw" },
      { prompt: "Fill the gap: 'They'll ___ up the games.' (set)", answer: "set" }
    ]
  }
};

export const MAZE_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  MAZE_QUESTIONS.length = 0;
  MAZE_QUESTIONS.push(...data.MAZE_QUESTIONS);
}
applyLesson('comparatives');
