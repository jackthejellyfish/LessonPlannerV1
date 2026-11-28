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
      { prompt: "Fill the gap: 'This shell is ___ than that pearl.' (beautiful)", answer: "more beautiful" },
      { prompt: "Fill the gap: 'An octopus is ___ than a starfish.' (clever)", answer: "cleverer" },
      { prompt: "Fill the gap: 'The beach is ___ than the city.' (quiet)", answer: "quieter" },
      { prompt: "Fill the gap: 'A shark is ___ than a jellyfish.' (fast)", answer: "faster" },
      { prompt: "Fill the gap: 'This wave is ___ than that one.' (high)", answer: "higher" },
      { prompt: "Fill the gap: 'My shell is ___ than yours.' (pretty)", answer: "prettier" }
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
      { prompt: "Fill the gap: 'You've got a runny nose. You should ___ a tissue.' (use)", answer: "use" },
      { prompt: "Fill the gap: 'You've got a cough. You ___ eat ice cream.' (shouldn't)", answer: "shouldn't" },
      { prompt: "Fill the gap: 'He's got a cold. He should ___ some hot tea.' (drink)", answer: "drink" },
      { prompt: "Fill the gap: 'What should I ___? — You should rest.' (do)", answer: "do" },
      { prompt: "Fill the gap: 'She's got a toothache. She shouldn't eat ___.' (sweets)", answer: "sweets" },
      { prompt: "Fill the gap: 'I've got a sore ___. I can't sing.' (throat)", answer: "throat" }
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
      { prompt: "Fill the gap: 'Jack is ___ jellyfish in the sea.' (happy)", answer: "the happiest" },
      { prompt: "Fill the gap: 'A sailfish is ___ fish in the sea.' (fast)", answer: "the fastest" },
      { prompt: "Fill the gap: 'This shell is ___ than that one.' (pretty)", answer: "prettier" },
      { prompt: "Fill the gap: 'The shark is ___ animal in this maze.' (dangerous)", answer: "the most dangerous" },
      { prompt: "Fill the gap: 'Today the sea is ___ than yesterday.' (calm)", answer: "calmer" },
      { prompt: "Fill the gap: 'This is ___ coral in the reef.' (beautiful)", answer: "the most beautiful" }
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
      { prompt: "Fill the gap: 'He won't ___ to the party.' (come)", answer: "come" },
      { prompt: "Fill the gap: 'I'm hungry. I ___ make a sandwich.' (will)", answer: "'ll / will" },
      { prompt: "Fill the gap: 'It won't ___ tomorrow. It'll be sunny.' (rain)", answer: "rain" },
      { prompt: "Fill the gap: 'Will you ___ me? — Yes, of course!' (help)", answer: "help" },
      { prompt: "Fill the gap: 'She ___ be late. She's always on time.' (won't)", answer: "won't" },
      { prompt: "Fill the gap: 'Who ___ win the race?' (will)", answer: "will" }
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
      { prompt: "Fill the gap: 'Have you ___ your homework yet?' (do)", answer: "done" },
      { prompt: "Fill the gap: 'I have never ___ a whale.' (see)", answer: "seen" },
      { prompt: "Fill the gap: 'She has ___ to the beach.' (go)", answer: "gone" },
      { prompt: "Fill the gap: 'We have ___ lots of fish today.' (catch)", answer: "caught" },
      { prompt: "Fill the gap: 'Has he ___ his swimming test?' (pass)", answer: "passed" },
      { prompt: "Fill the gap: 'They have ___ a sandcastle.' (build)", answer: "built" }
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
      { prompt: "Fill the gap: 'The merry-go-round was a bit ___.' (bore)", answer: "boring" },
      { prompt: "Fill the gap: 'We ___ lots of photos.' (take)", answer: "took" },
      { prompt: "Fill the gap: 'The roller coaster was very ___.' (excite)", answer: "exciting" },
      { prompt: "Fill the gap: 'She ___ a big teddy bear.' (win)", answer: "won" },
      { prompt: "Fill the gap: 'I was ___ by the fireworks.' (amaze)", answer: "amazed" },
      { prompt: "Fill the gap: 'My dad ___ me a souvenir.' (buy)", answer: "bought" }
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
      { prompt: "Fill the gap: 'They'll ___ up the games.' (set)", answer: "set" },
      { prompt: "Fill the gap: 'Who will ___ the pizza?' (serve)", answer: "serve" },
      { prompt: "Fill the gap: 'Will Ann bake biscuits? — Yes, she ___.' (will)", answer: "will" },
      { prompt: "Fill the gap: 'I ___ draw posters. I can't draw!' (won't)", answer: "won't" },
      { prompt: "Fill the gap: 'They'll ___ up the balloons.' (blow)", answer: "blow" },
      { prompt: "Fill the gap: '___ will choose the music? — Dave will.' (who)", answer: "Who" }
    ]
  },
  'at-school': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'What ___ you got?' (have)", answer: "have" },
      { prompt: "Fill the gap: 'She's ___ a marker pen.' (got)", answer: "got" },
      { prompt: "Fill the gap: 'What ___ Tom got?' (has)", answer: "has" },
      { prompt: "Fill the gap: 'I've got a glue ___.' (stick)", answer: "stick" },
      { prompt: "Fill the gap: 'He's got a pencil ___.' (sharpener)", answer: "sharpener" },
      { prompt: "Fill the gap: 'What do you ___?' (want)", answer: "want" },
      { prompt: "Fill the gap: 'She ___ chicken.' (wants)", answer: "wants" },
      { prompt: "Fill the gap: 'What ___ he want?' (does)", answer: "does" },
      { prompt: "Fill the gap: 'I want soup and ___.' (juice)", answer: "juice" },
      { prompt: "Fill the gap: 'We've got a ___ to paint with.' (paintbrush)", answer: "paintbrush" },
      { prompt: "Fill the gap: 'What ___ they got?' (have)", answer: "have" },
      { prompt: "Fill the gap: 'He ___ steak and juice.' (wants)", answer: "wants" },
      { prompt: "Fill the gap: 'I've got a marker ___.' (pen)", answer: "pen" },
      { prompt: "Fill the gap: 'What ___ Mia want?' (does)", answer: "does" },
      { prompt: "Fill the gap: 'She's got colouring ___.' (pencils)", answer: "pencils" }
    ]
  },
  'months-weather': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'When's your ___?' (birthday)", answer: "birthday" },
      { prompt: "Fill the gap: 'My birthday is ___ June.' (in)", answer: "in" },
      { prompt: "Fill the gap: 'It's ___ the third of June.' (on)", answer: "on" },
      { prompt: "Fill the gap: 'What's the weather ___?' (like)", answer: "like" },
      { prompt: "Fill the gap: 'It's ___ and cloudy.' (rainy)", answer: "rainy" },
      { prompt: "Fill the gap: 'January, February, ___' (March)", answer: "March" },
      { prompt: "Fill the gap: 'spring, summer, ___, winter' (autumn)", answer: "autumn" },
      { prompt: "Fill the gap: 'It's the ___ of May.' (first)", answer: "first" },
      { prompt: "Fill the gap: 'It's cold and ___ in winter.' (snowy)", answer: "snowy" },
      { prompt: "Fill the gap: 'We swim in the sea in ___.' (summer)", answer: "summer" },
      { prompt: "Fill the gap: 'It's foggy ___ November.' (in)", answer: "in" },
      { prompt: "Fill the gap: 'October, November, ___' (December)", answer: "December" },
      { prompt: "Fill the gap: 'Flowers grow in ___.' (spring)", answer: "spring" },
      { prompt: "Fill the gap: 'It's the ___ of June.' (second)", answer: "second" },
      { prompt: "Fill the gap: 'What's your favourite ___? — Summer!' (season)", answer: "season" }
    ]
  },
  'food-drink': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'Is there ___ bread?' (any)", answer: "any" },
      { prompt: "Fill the gap: 'There are ___ apples.' (some)", answer: "some" },
      { prompt: "Fill the gap: 'Is there ___ egg?' (an)", answer: "an" },
      { prompt: "Fill the gap: 'Are you ready to ___?' (order)", answer: "order" },
      { prompt: "Fill the gap: 'What would you like to ___?' (drink)", answer: "drink" },
      { prompt: "Fill the gap: 'Can I ___ a sandwich, please?' (have)", answer: "have" },
      { prompt: "Fill the gap: 'I'd ___ some soup, please.' (like)", answer: "like" },
      { prompt: "Fill the gap: 'Put the fork on the ___ of the plate.' (left)", answer: "left" },
      { prompt: "Fill the gap: 'Can you pass the salt and ___, please?' (pepper)", answer: "pepper" },
      { prompt: "Fill the gap: 'There ___ any cookies.' (aren't)", answer: "aren't" },
      { prompt: "Fill the gap: 'Is there ___ apple?' (an)", answer: "an" },
      { prompt: "Fill the gap: 'There isn't ___ juice.' (any)", answer: "any" },
      { prompt: "Fill the gap: 'There are ___ carrots in the soup.' (some)", answer: "some" },
      { prompt: "Fill the gap: 'Can I ___ you?' (help)", answer: "help" },
      { prompt: "Fill the gap: '___ there any bananas?' (are)", answer: "Are" }
    ]
  },
  'at-the-buffet': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'What did you ___ for breakfast?' (have)", answer: "have" },
      { prompt: "Fill the gap: 'I ___ scrambled eggs and grapefruit juice.' (had)", answer: "had" },
      { prompt: "Fill the gap: 'How did the fruit salad ___?' (taste)", answer: "taste" },
      { prompt: "Fill the gap: 'The fruit salad? It ___ sweet.' (tasted)", answer: "tasted" },
      { prompt: "Fill the gap: 'The chicken wings tasted ___.' (spicy)", answer: "spicy" },
      { prompt: "Fill the gap: 'How did the chips taste? ___ tasted salty.' (they)", answer: "They" },
      { prompt: "Fill the gap: 'Lemons taste ___.' (sour)", answer: "sour" },
      { prompt: "Fill the gap: 'I had cereal for ___.' (breakfast)", answer: "breakfast" },
      { prompt: "Fill the gap: 'We had tuna ___ for lunch.' (sandwiches)", answer: "sandwiches" },
      { prompt: "Fill the gap: 'She had fried ___ for dinner.' (rice)", answer: "rice" },
      { prompt: "Fill the gap: 'The grapefruit juice tasted ___.' (bitter)", answer: "bitter" },
      { prompt: "Fill the gap: 'How ___ the lemonade taste?' (did)", answer: "did" },
      { prompt: "Fill the gap: 'He had chicken ___.' (wings)", answer: "wings" },
      { prompt: "Fill the gap: 'The fried rice tasted ___.' (greasy)", answer: "greasy" },
      { prompt: "Fill the gap: 'What did they have for ___? — Fruit salad.' (lunch)", answer: "lunch" }
    ]
  },
  'at-the-market': {
    MAZE_QUESTIONS: [
      { prompt: "Fill the gap: 'He's got ___ grapes.' (some)", answer: "some" },
      { prompt: "Fill the gap: 'She hasn't got ___ mushrooms.' (any)", answer: "any" },
      { prompt: "Fill the gap: 'What ___ he got?' (has)", answer: "has" },
      { prompt: "Fill the gap: 'Have you got any beef? — Yes, I ___.' (have)", answer: "have" },
      { prompt: "Fill the gap: 'Has she got any milk? — No, she ___.' (hasn't)", answer: "hasn't" },
      { prompt: "Fill the gap: '___ you got any lemons?' (have)", answer: "Have" },
      { prompt: "Fill the gap: 'They've got some ___. They're big and orange.' (pumpkins)", answer: "pumpkins" },
      { prompt: "Fill the gap: 'Cheese is made from ___.' (milk)", answer: "milk" },
      { prompt: "Fill the gap: 'He's got some cucumbers, but he ___ got any lemons.' (hasn't)", answer: "hasn't" },
      { prompt: "Fill the gap: '___ he got any cheese?' (has)", answer: "Has" },
      { prompt: "Fill the gap: 'We've got some long green ___.' (cucumbers)", answer: "cucumbers" },
      { prompt: "Fill the gap: 'Have they got any meat? — Yes, they've got some ___.' (lamb)", answer: "lamb" },
      { prompt: "Fill the gap: 'I'd like some ___ on my bread.' (butter)", answer: "butter" },
      { prompt: "Fill the gap: 'She's got some ___. They're small and purple.' (grapes)", answer: "grapes" },
      { prompt: "Fill the gap: 'Has she got ___ yoghurt?' (any)", answer: "any" }
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
