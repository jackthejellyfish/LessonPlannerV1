/* =========================================================
   LESSON CONTENT — Stage 6 (Ball Pop Challenge)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    POP_QUESTIONS: [
      { prompt: "What is the comparative of 'tall'?", answer: "taller" },
      { prompt: "What is the comparative of 'big'?", answer: "bigger" },
      { prompt: "What is the comparative of 'nice'?", answer: "nicer" },
      { prompt: "What is the comparative of 'hot'?", answer: "hotter" },
      { prompt: "What is the comparative of 'happy'?", answer: "happier" },
      { prompt: "What is the comparative of 'safe'?", answer: "safer" },
      { prompt: "What is the comparative of 'easy'?", answer: "easier" },
      { prompt: "What is the comparative of 'busy'?", answer: "busier" },
      { prompt: "What is the comparative of 'good'? (it's irregular!)", answer: "better" },
      { prompt: "What is the comparative of 'bad'? (it's irregular!)", answer: "worse" },
      { prompt: "What is the comparative of 'long'?", answer: "longer" },
      { prompt: "What is the comparative of 'short'?", answer: "shorter" },
      { prompt: "What is the comparative of 'old'?", answer: "older" },
      { prompt: "What is the comparative of 'cheap'?", answer: "cheaper" },
      { prompt: "What is the comparative of 'funny'?", answer: "funnier" }
    ]
  },
  health: {
    POP_QUESTIONS: [
      { prompt: "I've got a headache. What should you do?", answer: "You should take some medicine." },
      { prompt: "I've got a fever. What should you do?", answer: "You should stay in bed." },
      { prompt: "I've got a runny nose. What should you do?", answer: "You should blow your nose." },
      { prompt: "I've got a toothache. What should you do?", answer: "You should see a dentist." },
      { prompt: "I've got a stomach ache. What should you do?", answer: "You should see a doctor." },
      { prompt: "I've got a sore throat. What should you do?", answer: "You should drink some hot tea." },
      { prompt: "I've got a cough. What should you do?", answer: "You should drink some water." },
      { prompt: "I've got a cold. What should you do?", answer: "You should stay in bed." },
      { prompt: "I've got a backache. What should you do?", answer: "You should rest." },
      { prompt: "I've got an earache. What should you do?", answer: "You should see a doctor." },
      { prompt: "I've got sunburn. What should you do?", answer: "You should put on some cream." },
      { prompt: "I've got hiccups. What should you do?", answer: "You should drink some water." },
      { prompt: "I'm very tired. What should you do?", answer: "You should go to bed early." },
      { prompt: "I've got a sore knee. What shouldn't you do?", answer: "You shouldn't play football." },
      { prompt: "I've got a stomach ache. What shouldn't you eat?", answer: "You shouldn't eat sweets." }
    ]
  },
  'comparatives-superlatives': {
    POP_QUESTIONS: [
      { prompt: "What is the superlative of 'tall'?", answer: "the tallest" },
      { prompt: "What is the superlative of 'big'?", answer: "the biggest" },
      { prompt: "What is the superlative of 'nice'?", answer: "the nicest" },
      { prompt: "What is the superlative of 'hot'?", answer: "the hottest" },
      { prompt: "What is the superlative of 'happy'?", answer: "the happiest" },
      { prompt: "What is the superlative of 'safe'?", answer: "the safest" },
      { prompt: "What is the superlative of 'easy'?", answer: "the easiest" },
      { prompt: "What is the superlative of 'busy'?", answer: "the busiest" },
      { prompt: "What is the superlative of 'good'? (it's irregular!)", answer: "the best" },
      { prompt: "What is the superlative of 'bad'? (it's irregular!)", answer: "the worst" },
      { prompt: "What is the superlative of 'long'?", answer: "the longest" },
      { prompt: "What is the superlative of 'old'?", answer: "the oldest" },
      { prompt: "What is the superlative of 'cheap'?", answer: "the cheapest" },
      { prompt: "What is the superlative of 'funny'?", answer: "the funniest" },
      { prompt: "What is the superlative of 'young'?", answer: "the youngest" }
    ]
  },
  'will-wont': {
    POP_QUESTIONS: [
      { prompt: "What is the short form of 'I will'?", answer: "I'll" },
      { prompt: "What is the short form of 'you will'?", answer: "you'll" },
      { prompt: "What is the short form of 'he will'?", answer: "he'll" },
      { prompt: "What is the short form of 'she will'?", answer: "she'll" },
      { prompt: "What is the short form of 'we will'?", answer: "we'll" },
      { prompt: "What is the short form of 'they will'?", answer: "they'll" },
      { prompt: "What is the short form of 'it will'?", answer: "it'll" },
      { prompt: "What is the short form of 'will not'?", answer: "won't" },
      { prompt: "What is the short form of 'that will'?", answer: "that'll" },
      { prompt: "'I'll' is the short form of which two words?", answer: "I will" },
      { prompt: "'won't' is the short form of which two words?", answer: "will not" },
      { prompt: "'she'll' is the short form of which two words?", answer: "she will" },
      { prompt: "'they'll' is the short form of which two words?", answer: "they will" },
      { prompt: "What is the short form of 'there will'?", answer: "there'll" },
      { prompt: "'we'll' is the short form of which two words?", answer: "we will" }
    ]
  },
  'present-perfect': {
    POP_QUESTIONS: [
      { prompt: "What is the past participle of 'go'?", answer: "gone (or been)" },
      { prompt: "What is the past participle of 'eat'?", answer: "eaten" },
      { prompt: "What is the past participle of 'see'?", answer: "seen" },
      { prompt: "What is the past participle of 'do'?", answer: "done" },
      { prompt: "What is the past participle of 'win'?", answer: "won" },
      { prompt: "What is the past participle of 'write'?", answer: "written" },
      { prompt: "What is the past participle of 'take'?", answer: "taken" },
      { prompt: "What is the past participle of 'break'?", answer: "broken" },
      { prompt: "What is the past participle of 'buy'?", answer: "bought" },
      { prompt: "What is the past participle of 'be'?", answer: "been" },
      { prompt: "What is the past participle of 'swim'?", answer: "swum" },
      { prompt: "What is the past participle of 'drink'?", answer: "drunk" },
      { prompt: "What is the past participle of 'fly'?", answer: "flown" },
      { prompt: "What is the past participle of 'ride'?", answer: "ridden" },
      { prompt: "What is the past participle of 'make'?", answer: "made" }
    ]
  },
  'amusement-park': {
    POP_QUESTIONS: [
      { prompt: "What is the past simple of 'watch'?", answer: "watched" },
      { prompt: "What is the past simple of 'visit'?", answer: "visited" },
      { prompt: "What is the past simple of 'enter'?", answer: "entered" },
      { prompt: "What is the past simple of 'see'? (it's irregular!)", answer: "saw" },
      { prompt: "What is the past simple of 'go'? (it's irregular!)", answer: "went" },
      { prompt: "What is the past simple of 'ride'? (it's irregular!)", answer: "rode" },
      { prompt: "What is the past simple of 'eat'? (it's irregular!)", answer: "ate" },
      { prompt: "What is the past simple of 'buy'? (it's irregular!)", answer: "bought" },
      { prompt: "What is the past simple of 'win'? (it's irregular!)", answer: "won" },
      { prompt: "What is the past simple of 'take'? (it's irregular!)", answer: "took" },
      { prompt: "What is the past simple of 'play'?", answer: "played" },
      { prompt: "What is the past simple of 'scream'?", answer: "screamed" },
      { prompt: "What is the past simple of 'have'? (it's irregular!)", answer: "had" },
      { prompt: "What is the past simple of 'feel'? (it's irregular!)", answer: "felt" },
      { prompt: "What is the past simple of 'drink'? (it's irregular!)", answer: "drank" }
    ]
  },
  'party-fun': {
    POP_QUESTIONS: [
      { prompt: "Use will: 'I bake biscuits.' → I ___ biscuits.", answer: "will bake" },
      { prompt: "Use will: 'She buys balloons.' → She ___ balloons.", answer: "will buy" },
      { prompt: "Use will: 'Tom orders pizza.' → Tom ___ pizza.", answer: "will order" },
      { prompt: "Use will: 'They draw posters.' → They ___ posters.", answer: "will draw" },
      { prompt: "Use will: 'He chooses the music.' → He ___ the music.", answer: "will choose" },
      { prompt: "Use will: 'We bring games.' → We ___ games.", answer: "will bring" },
      { prompt: "Use will: 'Rosa sets the table.' → Rosa ___ the table.", answer: "will set" },
      { prompt: "Use will: 'Dave plays the music.' → Dave ___ the music.", answer: "will play" },
      { prompt: "Use will: 'Ann hangs up the decorations.' → Ann ___ the decorations.", answer: "will hang up" },
      { prompt: "Use will: 'You serve the pizza.' → You ___ the pizza.", answer: "will serve" },
      { prompt: "Use will: 'Mia blows up the balloons.' → Mia ___ the balloons.", answer: "will blow up" },
      { prompt: "Use will: 'I make sandwiches.' → I ___ sandwiches.", answer: "will make" },
      { prompt: "Use will: 'They set up the games.' → They ___ the games.", answer: "will set up" },
      { prompt: "Use will: 'Ben cleans the room.' → Ben ___ the room.", answer: "will clean" },
      { prompt: "Use will: 'We buy a cake.' → We ___ a cake.", answer: "will buy" }
    ]
  },
  'at-school': {
    POP_QUESTIONS: [
      { prompt: "Make it short: 'I have got a marker pen.'", answer: "I've got a marker pen." },
      { prompt: "Make it short: 'She has got a stapler.'", answer: "She's got a stapler." },
      { prompt: "Make it short: 'We have got a glue stick.'", answer: "We've got a glue stick." },
      { prompt: "Make it short: 'He has got a paintbrush.'", answer: "He's got a paintbrush." },
      { prompt: "Make it short: 'They have got colouring pencils.'", answer: "They've got colouring pencils." },
      { prompt: "Change to he: 'I want pizza.' → He ___ pizza.", answer: "wants" },
      { prompt: "Change to she: 'I want juice.' → She ___ juice.", answer: "wants" },
      { prompt: "Change to Tom: 'I want fish.' → Tom ___ fish.", answer: "wants" },
      { prompt: "Change to they: 'He wants soup.' → They ___ soup.", answer: "want" },
      { prompt: "Change to we: 'She wants chicken.' → We ___ chicken.", answer: "want" },
      { prompt: "Make it short: 'I have got a stapler.'", answer: "I've got a stapler." },
      { prompt: "Make it short: 'Tom has got a glue stick.'", answer: "Tom's got a glue stick." },
      { prompt: "Change to she: 'I want steak.' → She ___ steak.", answer: "wants" },
      { prompt: "Change to they: 'She wants juice.' → They ___ juice.", answer: "want" },
      { prompt: "Make it short: 'You have got a marker pen.'", answer: "You've got a marker pen." }
    ]
  },
  'months-weather': {
    POP_QUESTIONS: [
      { prompt: "Say it in words: '1st'", answer: "first" },
      { prompt: "Say it in words: '2nd'", answer: "second" },
      { prompt: "Say it in words: '3rd'", answer: "third" },
      { prompt: "Say it in words: '5th'", answer: "fifth" },
      { prompt: "Say it in words: '12th'", answer: "twelfth" },
      { prompt: "Say it in words: '20th'", answer: "twentieth" },
      { prompt: "Say it in words: '21st'", answer: "twenty-first" },
      { prompt: "Which month comes after June?", answer: "July" },
      { prompt: "Which month comes before October?", answer: "September" },
      { prompt: "Which month comes after December?", answer: "January" },
      { prompt: "Say it in words: '4th'", answer: "fourth" },
      { prompt: "Say it in words: '9th'", answer: "ninth" },
      { prompt: "Say it in words: '22nd'", answer: "twenty-second" },
      { prompt: "Which month comes before March?", answer: "February" },
      { prompt: "Which month comes after September?", answer: "October" }
    ]
  },
  'food-drink': {
    POP_QUESTIONS: [
      { prompt: "Countable or uncountable? 'water'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'apple'", answer: "countable" },
      { prompt: "Countable or uncountable? 'bread'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'cookie'", answer: "countable" },
      { prompt: "Countable or uncountable? 'rice'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'carrot'", answer: "countable" },
      { prompt: "Countable or uncountable? 'juice'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'potato'", answer: "countable" },
      { prompt: "Countable or uncountable? 'sugar'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'sandwich'", answer: "countable" },
      { prompt: "Countable or uncountable? 'milk'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'egg'", answer: "countable" },
      { prompt: "Countable or uncountable? 'pasta'", answer: "uncountable" },
      { prompt: "Countable or uncountable? 'banana'", answer: "countable" },
      { prompt: "Countable or uncountable? 'soup'", answer: "uncountable" }
    ]
  },
  'at-the-buffet': {
    POP_QUESTIONS: [
      { prompt: "It or they? 'How did the fruit salad taste? ___ tasted sweet.'", answer: "It" },
      { prompt: "It or they? 'How did the chicken wings taste? ___ tasted spicy.'", answer: "They" },
      { prompt: "It or they? 'How did the lemonade taste? ___ tasted sour.'", answer: "It" },
      { prompt: "It or they? 'How did the tuna sandwiches taste? ___ tasted salty.'", answer: "They" },
      { prompt: "It or they? 'How did the fried rice taste? ___ tasted greasy.'", answer: "It" },
      { prompt: "It or they? 'How did the scrambled eggs taste? ___ tasted salty.'", answer: "They" },
      { prompt: "It or they? 'How did the grapefruit juice taste? ___ tasted bitter.'", answer: "It" },
      { prompt: "It or they? 'How did the cereal taste? ___ tasted sweet.'", answer: "It" },
      { prompt: "It or they? 'How did the chips taste? ___ tasted greasy.'", answer: "They" },
      { prompt: "It or they? 'How did the soup taste? ___ tasted salty.'", answer: "It" },
      { prompt: "It or they? 'How did the lemons taste? ___ tasted sour.'", answer: "They" },
      { prompt: "It or they? 'How did the cake taste? ___ tasted sweet.'", answer: "It" },
      { prompt: "It or they? 'How did the noodles taste? ___ tasted spicy.'", answer: "They" },
      { prompt: "It or they? 'How did the pizza taste? ___ tasted greasy.'", answer: "It" },
      { prompt: "It or they? 'How did the cookies taste? ___ tasted sweet.'", answer: "They" }
    ]
  },
  'at-the-market': {
    POP_QUESTIONS: [
      { prompt: "Some or any? 'He's got ___ grapes.'", answer: "some" },
      { prompt: "Some or any? 'She hasn't got ___ mushrooms.'", answer: "any" },
      { prompt: "Some or any? 'Have you got ___ beef?'", answer: "any" },
      { prompt: "Some or any? 'I've got ___ cheese.'", answer: "some" },
      { prompt: "Some or any? 'Has she got ___ milk?'", answer: "any" },
      { prompt: "Some or any? 'We haven't got ___ lemons.'", answer: "any" },
      { prompt: "Some or any? 'They've got ___ pumpkins.'", answer: "some" },
      { prompt: "Some or any? 'Has he got ___ cucumbers?'", answer: "any" },
      { prompt: "Some or any? 'She's got ___ yoghurt.'", answer: "some" },
      { prompt: "Some or any? 'I haven't got ___ butter.'", answer: "any" },
      { prompt: "Some or any? 'He's got ___ watermelons.'", answer: "some" },
      { prompt: "Some or any? 'Have they got ___ lamb?'", answer: "any" },
      { prompt: "Some or any? 'We've got ___ milk.'", answer: "some" },
      { prompt: "Some or any? 'He hasn't got ___ cheese.'", answer: "any" },
      { prompt: "Some or any? 'You've got ___ lemons.'", answer: "some" }
    ]
  }
};

export const POP_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  POP_QUESTIONS.length = 0;
  POP_QUESTIONS.push(...data.POP_QUESTIONS);
}
applyLesson('comparatives');
