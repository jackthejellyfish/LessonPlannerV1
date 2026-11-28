/* =========================================================
   LESSON CONTENT — Stage 7 (Star Defender)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    INV_QUESTIONS: [
      { prompt: "What is the comparative of 'fast'?", answer: "faster" },
      { prompt: "What is the comparative of 'strong'?", answer: "stronger" },
      { prompt: "What is the comparative of 'big'?", answer: "bigger" },
      { prompt: "What is the comparative of 'brave'?", answer: "braver" },
      { prompt: "What is the comparative of 'scary'?", answer: "scarier" },
      { prompt: "What is the comparative of 'loud'?", answer: "louder" },
      { prompt: "What is the comparative of 'hot'?", answer: "hotter" },
      { prompt: "What is the comparative of 'clever'?", answer: "cleverer" },
      { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
      { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" },
      { prompt: "What is the comparative of 'heavy'?", answer: "heavier" },
      { prompt: "What is the comparative of 'slow'?", answer: "slower" },
      { prompt: "What is the comparative of 'weak'?", answer: "weaker" },
      { prompt: "What is the comparative of 'angry'?", answer: "angrier" },
      { prompt: "What is the comparative of 'famous'?", answer: "more famous" }
    ]
  },
  health: {
    INV_QUESTIONS: [
      { prompt: "He's got a headache. What should he do?", answer: "He should take some medicine." },
      { prompt: "She's got a fever. What should she do?", answer: "She should stay in bed." },
      { prompt: "He's got a runny nose. What should he do?", answer: "He should blow his nose." },
      { prompt: "She's got a toothache. What should she do?", answer: "She should see a dentist." },
      { prompt: "He's got a stomach ache. What should he do?", answer: "He should see a doctor." },
      { prompt: "She's got a sore throat. What should she do?", answer: "She should drink some hot tea." },
      { prompt: "He's got a cough. What should he do?", answer: "He should drink some water." },
      { prompt: "She's got a cold. What should she do?", answer: "She should stay in bed." },
      { prompt: "He's got a backache. What should he do?", answer: "He should rest." },
      { prompt: "She's got an earache. What should she do?", answer: "She should see a doctor." },
      { prompt: "She's got a headache. What shouldn't she do?", answer: "She shouldn't watch TV." },
      { prompt: "He's got sunburn. What should he do?", answer: "He should stay out of the sun." },
      { prompt: "She's got a sore knee. What should she do?", answer: "She should rest." },
      { prompt: "He's very tired. What should he do?", answer: "He should go to bed early." },
      { prompt: "She's got hiccups. What should she do?", answer: "She should drink some water." }
    ]
  },
  'comparatives-superlatives': {
    INV_QUESTIONS: [
      { prompt: "What is the comparative of 'strong'?", answer: "stronger" },
      { prompt: "What is the comparative of 'heavy'?", answer: "heavier" },
      { prompt: "What is the comparative of 'wide'?", answer: "wider" },
      { prompt: "What is the comparative of 'sad'?", answer: "sadder" },
      { prompt: "What is the comparative of 'bright'?", answer: "brighter" },
      { prompt: "What is the comparative of 'funny'?", answer: "funnier" },
      { prompt: "What is the comparative of 'simple'?", answer: "simpler" },
      { prompt: "What is the comparative of 'dangerous'?", answer: "more dangerous" },
      { prompt: "What is the comparative of 'careful'?", answer: "more careful" },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther" },
      { prompt: "What is the comparative of 'short'?", answer: "shorter" },
      { prompt: "What is the comparative of 'slow'?", answer: "slower" },
      { prompt: "What is the comparative of 'angry'?", answer: "angrier" },
      { prompt: "What is the comparative of 'quiet'?", answer: "quieter" },
      { prompt: "What is the comparative of 'popular'?", answer: "more popular" }
    ]
  },
  'will-wont': {
    INV_QUESTIONS: [
      { prompt: "Make it future: 'I play football.'", answer: "I will play football." },
      { prompt: "Make it future: 'She helps me.'", answer: "She will help me." },
      { prompt: "Make it future: 'They arrive at six.'", answer: "They will arrive at six." },
      { prompt: "Make it future: 'He is twelve.'", answer: "He will be twelve." },
      { prompt: "Make it future: 'We go to the beach.'", answer: "We will go to the beach." },
      { prompt: "Make it future: 'It rains a lot.'", answer: "It will rain a lot." },
      { prompt: "Make it future: 'You like this film.'", answer: "You will like this film." },
      { prompt: "Make it future: 'The bus is late.'", answer: "The bus will be late." },
      { prompt: "Make it future: 'I see you on Monday.'", answer: "I will see you on Monday." },
      { prompt: "Make it future: 'My sister cooks dinner.'", answer: "My sister will cook dinner." },
      { prompt: "Make it future: 'We eat pizza.'", answer: "We will eat pizza." },
      { prompt: "Make it future: 'He gets up early.'", answer: "He will get up early." },
      { prompt: "Make it future: 'They are tired.'", answer: "They will be tired." },
      { prompt: "Make it future: 'I help my mum.'", answer: "I will help my mum." },
      { prompt: "Make it future: 'It is cold.'", answer: "It will be cold." }
    ]
  },
  'present-perfect': {
    INV_QUESTIONS: [
      { prompt: "Complete: 'I ___ (visit) Japan twice.'", answer: "have visited" },
      { prompt: "Complete: 'She ___ (finish) her work.'", answer: "has finished" },
      { prompt: "Complete: 'They ___ (see) that film.'", answer: "have seen" },
      { prompt: "Complete: 'He ___ (lose) his keys.'", answer: "has lost" },
      { prompt: "Complete: 'We ___ (eat) all the cake.'", answer: "have eaten" },
      { prompt: "Complete: 'It ___ (stop) raining.'", answer: "has stopped" },
      { prompt: "Complete: 'You ___ (do) a great job.'", answer: "have done" },
      { prompt: "Complete: 'My team ___ (win) the cup.'", answer: "has won" },
      { prompt: "Complete: 'I ___ (read) that book.'", answer: "have read" },
      { prompt: "Complete: 'She ___ (take) my pen.'", answer: "has taken" },
      { prompt: "Complete: 'We ___ (finish) our homework.'", answer: "have finished" },
      { prompt: "Complete: 'He ___ (break) his arm.'", answer: "has broken" },
      { prompt: "Complete: 'They ___ (buy) a new car.'", answer: "have bought" },
      { prompt: "Complete: 'She ___ (write) a letter.'", answer: "has written" },
      { prompt: "Complete: 'I ___ (fly) in a plane.'", answer: "have flown" }
    ]
  },
  'amusement-park': {
    INV_QUESTIONS: [
      { prompt: "Complete: 'Yesterday I ___ (go) on a roller coaster.'", answer: "went" },
      { prompt: "Complete: 'She ___ (watch) a 3D film.'", answer: "watched" },
      { prompt: "Complete: 'We ___ (see) a parade.'", answer: "saw" },
      { prompt: "Complete: 'They ___ (enter) a haunted house.'", answer: "entered" },
      { prompt: "Complete: 'He ___ (ride) the merry-go-round.'", answer: "rode" },
      { prompt: "Complete: 'My class ___ (visit) a petting zoo.'", answer: "visited" },
      { prompt: "Complete: 'I ___ (eat) candy floss.'", answer: "ate" },
      { prompt: "Complete: 'You ___ (win) a big teddy bear!'", answer: "won" },
      { prompt: "Complete: 'My dad ___ (buy) a souvenir.'", answer: "bought" },
      { prompt: "Complete: 'We ___ (take) lots of photos.'", answer: "took" },
      { prompt: "Complete: 'We ___ (scream) on the roller coaster.'", answer: "screamed" },
      { prompt: "Complete: 'She ___ (have) a great day.'", answer: "had" },
      { prompt: "Complete: 'They ___ (play) games at the park.'", answer: "played" },
      { prompt: "Complete: 'I ___ (feel) scared in the haunted house.'", answer: "felt" },
      { prompt: "Complete: 'He ___ (drink) a big lemonade.'", answer: "drank" }
    ]
  },
  'party-fun': {
    INV_QUESTIONS: [
      { prompt: "Will or won't? 'My friends love me. They ___ always be on my side.'", answer: "will" },
      { prompt: "Will or won't? 'Sam hasn't got any money. He ___ buy the concert tickets.'", answer: "won't" },
      { prompt: "Will or won't? 'Julie is very tired today. She ___ take a nap at home.'", answer: "will" },
      { prompt: "Will or won't? 'Susan is very shy. She ___ dance in front of her classmates.'", answer: "won't" },
      { prompt: "Will or won't? 'I'm very full. I ___ have dessert.'", answer: "won't" },
      { prompt: "Will or won't? 'Kelly is my best friend. We ___ travel together this holiday.'", answer: "will" },
      { prompt: "Will or won't? 'Mia loves baking. She ___ bake biscuits for the party.'", answer: "will" },
      { prompt: "Will or won't? 'Ben can't draw. He ___ draw the posters.'", answer: "won't" },
      { prompt: "Will or won't? 'The pizza is here! Dad ___ serve it now.'", answer: "will" },
      { prompt: "Will or won't? 'Leo hates loud music. He ___ play the music.'", answer: "won't" },
      { prompt: "Will or won't? 'Anna loves music. She ___ choose the songs.'", answer: "will" },
      { prompt: "Will or won't? 'Max is ill. He ___ come to the party.'", answer: "won't" },
      { prompt: "Will or won't? 'We have lots of balloons. We ___ buy more.'", answer: "won't" },
      { prompt: "Will or won't? 'I'm good at drawing. I ___ draw the posters.'", answer: "will" },
      { prompt: "Will or won't? 'Tom doesn't like cake. He ___ eat any.'", answer: "won't" }
    ]
  },
  'at-school': {
    INV_QUESTIONS: [
      { prompt: "Have or has? 'I ___ got a marker pen.'", answer: "have" },
      { prompt: "Have or has? 'She ___ got a pencil sharpener.'", answer: "has" },
      { prompt: "Have or has? 'We ___ got two glue sticks.'", answer: "have" },
      { prompt: "Have or has? 'Tom ___ got a paintbrush.'", answer: "has" },
      { prompt: "Have or has? 'What ___ you got?'", answer: "have" },
      { prompt: "Have or has? 'What ___ Mia got?'", answer: "has" },
      { prompt: "Want or wants? 'I ___ steak.'", answer: "want" },
      { prompt: "Want or wants? 'My sister ___ soup.'", answer: "wants" },
      { prompt: "Want or wants? 'What does he ___?'", answer: "want" },
      { prompt: "Want or wants? 'They ___ pizza and juice.'", answer: "want" },
      { prompt: "Have or has? 'They ___ got colouring pencils.'", answer: "have" },
      { prompt: "Have or has? 'My teacher ___ got a stapler.'", answer: "has" },
      { prompt: "Want or wants? 'Mia ___ fish and juice.'", answer: "wants" },
      { prompt: "Want or wants? 'We ___ chicken.'", answer: "want" },
      { prompt: "Have or has? 'He ___ got a glue stick.'", answer: "has" }
    ]
  },
  'months-weather': {
    INV_QUESTIONS: [
      { prompt: "In or on? 'My birthday is ___ May.'", answer: "in" },
      { prompt: "In or on? 'It's ___ the 4th of July.'", answer: "on" },
      { prompt: "In or on? 'It's snowy ___ winter.'", answer: "in" },
      { prompt: "In or on? 'We have a party ___ the 1st of January.'", answer: "on" },
      { prompt: "In or on? 'Leaves fall ___ autumn.'", answer: "in" },
      { prompt: "In or on? 'School starts ___ September.'", answer: "in" },
      { prompt: "In or on? 'Her birthday is ___ the 20th of March.'", answer: "on" },
      { prompt: "In or on? 'It's hot ___ August.'", answer: "in" },
      { prompt: "In or on? 'Christmas is ___ the 25th of December.'", answer: "on" },
      { prompt: "In or on? 'Flowers grow ___ spring.'", answer: "in" },
      { prompt: "In or on? 'It's rainy ___ April.'", answer: "in" },
      { prompt: "In or on? 'My party is ___ the 9th of June.'", answer: "on" },
      { prompt: "In or on? 'We go to the beach ___ summer.'", answer: "in" },
      { prompt: "In or on? 'Is your birthday ___ the 2nd of May?'", answer: "on" },
      { prompt: "In or on? 'It's windy ___ October.'", answer: "in" }
    ]
  },
  'food-drink': {
    INV_QUESTIONS: [
      { prompt: "Some or any? 'There are ___ cookies on the table.'", answer: "some" },
      { prompt: "Some or any? 'Is there ___ milk?'", answer: "any" },
      { prompt: "Some or any? 'There isn't ___ bread.'", answer: "any" },
      { prompt: "Some or any? 'I'd like ___ soup, please.'", answer: "some" },
      { prompt: "Some or any? 'Are there ___ carrots?'", answer: "any" },
      { prompt: "Some or any? 'There's ___ juice in the fridge.'", answer: "some" },
      { prompt: "Some or any? 'There aren't ___ potatoes.'", answer: "any" },
      { prompt: "Some or any? 'There's ___ pasta on my plate.'", answer: "some" },
      { prompt: "Some or any? 'Is there ___ salt?'", answer: "any" },
      { prompt: "Some or any? 'Can I have ___ water, please?'", answer: "some" },
      { prompt: "Some or any? 'There are ___ apples in the bag.'", answer: "some" },
      { prompt: "Some or any? 'Is there ___ cheese?'", answer: "any" },
      { prompt: "Some or any? 'There aren't ___ eggs.'", answer: "any" },
      { prompt: "Some or any? 'I'd like ___ rice, please.'", answer: "some" },
      { prompt: "Some or any? 'Are there ___ bananas?'", answer: "any" }
    ]
  },
  'at-the-buffet': {
    INV_QUESTIONS: [
      { prompt: "Which taste? 'Lemons taste ___.'", answer: "sour" },
      { prompt: "Which taste? 'Chillies taste ___.'", answer: "spicy" },
      { prompt: "Which taste? 'Sugar tastes ___.'", answer: "sweet" },
      { prompt: "Which taste? 'Chips with lots of salt taste ___.'", answer: "salty" },
      { prompt: "Which taste? 'Grapefruit juice tastes a bit ___.'", answer: "bitter" },
      { prompt: "Which taste? 'Fried chicken with lots of oil tastes ___.'", answer: "greasy" },
      { prompt: "Which taste? 'Honey tastes ___.'", answer: "sweet" },
      { prompt: "Which taste? 'Sea water tastes ___.'", answer: "salty" },
      { prompt: "Which taste? 'Coffee with no sugar tastes ___.'", answer: "bitter" },
      { prompt: "Which taste? 'Curry with lots of chilli tastes ___.'", answer: "spicy" },
      { prompt: "Which taste? 'Lemon juice tastes ___.'", answer: "sour" },
      { prompt: "Which taste? 'Chocolate cake tastes ___.'", answer: "sweet" },
      { prompt: "Which taste? 'Popcorn with lots of salt tastes ___.'", answer: "salty" },
      { prompt: "Which taste? 'Burgers with lots of oil taste ___.'", answer: "greasy" },
      { prompt: "Which taste? 'Green apples taste a bit ___.'", answer: "sour" }
    ]
  },
  'at-the-market': {
    INV_QUESTIONS: [
      { prompt: "Have or has? 'He ___ got some grapes.'", answer: "has" },
      { prompt: "Have or has? 'I ___ got some cheese.'", answer: "have" },
      { prompt: "Have or has? '___ you got any beef?'", answer: "Have" },
      { prompt: "Have or has? '___ she got any milk?'", answer: "Has" },
      { prompt: "Have or has? 'They ___ got some pumpkins.'", answer: "have" },
      { prompt: "Have or has? 'The farmer ___ got some watermelons.'", answer: "has" },
      { prompt: "Have or has? 'What ___ she got?'", answer: "has" },
      { prompt: "Have or has? 'My mum ___ got some butter.'", answer: "has" },
      { prompt: "Have or has? 'What ___ they got?'", answer: "have" },
      { prompt: "Have or has? '___ Tom got any mushrooms?'", answer: "Has" },
      { prompt: "Haven't or hasn't? 'She ___ got any cucumbers.'", answer: "hasn't" },
      { prompt: "Haven't or hasn't? 'I ___ got any lamb.'", answer: "haven't" },
      { prompt: "Haven't or hasn't? 'He ___ got any yoghurt.'", answer: "hasn't" },
      { prompt: "Haven't or hasn't? 'We ___ got any grapes.'", answer: "haven't" },
      { prompt: "Haven't or hasn't? 'The shop ___ got any milk.'", answer: "hasn't" }
    ]
  }
};

export const INV_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  INV_QUESTIONS.length = 0;
  INV_QUESTIONS.push(...data.INV_QUESTIONS);
}
applyLesson('comparatives');
