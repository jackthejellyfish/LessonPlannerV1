/* =========================================================
   LESSON CONTENT — Stage 14 (Neon Arena)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    NEON_QUESTIONS: [
      { prompt: "What is the comparative of 'quick'?", answer: "quicker" },
      { prompt: "What is the comparative of 'bright'?", answer: "brighter" },
      { prompt: "What is the comparative of 'dangerous'?", answer: "more dangerous" },
      { prompt: "What is the comparative of 'tough'?", answer: "tougher" },
      { prompt: "What is the comparative of 'small'?", answer: "smaller" },
      { prompt: "What is the comparative of 'noisy'?", answer: "noisier" },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "further / farther" },
      { prompt: "What is the comparative of 'powerful'?", answer: "more powerful" },
      { prompt: "What is the comparative of 'sharp'?", answer: "sharper" },
      { prompt: "What is the comparative of 'many'? (it's irregular!)", answer: "more" },
      { prompt: "What is the comparative of 'rich'?", answer: "richer" },
      { prompt: "What is the comparative of 'poor'?", answer: "poorer" },
      { prompt: "What is the comparative of 'dry'?", answer: "drier" },
      { prompt: "What is the comparative of 'modern'?", answer: "more modern" },
      { prompt: "What is the comparative of 'exciting'?", answer: "more exciting" }
    ]
  },
  health: {
    NEON_QUESTIONS: [
      { prompt: "They've got a headache.", answer: "They should take some medicine." },
      { prompt: "They've got a fever.", answer: "They should stay in bed." },
      { prompt: "They've got a toothache.", answer: "They should see a dentist." },
      { prompt: "They've got a runny nose.", answer: "They should blow their noses." },
      { prompt: "They've got a sore throat.", answer: "They should drink some hot tea." },
      { prompt: "They've got a stomach ache.", answer: "They should see a doctor." },
      { prompt: "They've got a cough.", answer: "They should drink some water." },
      { prompt: "They've got a cold.", answer: "They should stay in bed." },
      { prompt: "They've got a backache.", answer: "They should rest." },
      { prompt: "They've got an earache.", answer: "They should see a doctor." },
      { prompt: "They've got sunburn.", answer: "They should put on some cream." },
      { prompt: "They've got hiccups.", answer: "They should drink some water." },
      { prompt: "They're very tired.", answer: "They should get some sleep." },
      { prompt: "They've got a sore knee.", answer: "They shouldn't play football." },
      { prompt: "They've got a temperature.", answer: "They should stay in bed." }
    ]
  },
  'comparatives-superlatives': {
    NEON_QUESTIONS: [
      { prompt: "Say the opposite: 'bigger'", answer: "smaller" },
      { prompt: "Say the opposite: 'the tallest'", answer: "the shortest" },
      { prompt: "Say the opposite: 'faster'", answer: "slower" },
      { prompt: "Say the opposite: 'the best'", answer: "the worst" },
      { prompt: "Say the opposite: 'hotter'", answer: "colder" },
      { prompt: "Say the opposite: 'the easiest'", answer: "the hardest" },
      { prompt: "Say the opposite: 'heavier'", answer: "lighter" },
      { prompt: "Say the opposite: 'the most expensive'", answer: "the cheapest" },
      { prompt: "Say the opposite: 'older'", answer: "younger" },
      { prompt: "Say the opposite: 'the happiest'", answer: "the saddest" },
      { prompt: "Say the opposite: 'smaller'", answer: "bigger" },
      { prompt: "Say the opposite: 'the coldest'", answer: "the hottest" },
      { prompt: "Say the opposite: 'cheaper'", answer: "more expensive" },
      { prompt: "Say the opposite: 'the worst'", answer: "the best" },
      { prompt: "Say the opposite: 'longer'", answer: "shorter" }
    ]
  },
  'will-wont': {
    NEON_QUESTIONS: [
      { prompt: "Make it negative: 'I will go to the party.'", answer: "I won't go to the party." },
      { prompt: "Make it negative: 'She will tell him.'", answer: "She won't tell him." },
      { prompt: "Make it negative: 'They will be here soon.'", answer: "They won't be here soon." },
      { prompt: "Make it negative: 'It will rain tomorrow.'", answer: "It won't rain tomorrow." },
      { prompt: "Make it negative: 'We will need our coats.'", answer: "We won't need our coats." },
      { prompt: "Make it negative: 'He will pass the test.'", answer: "He won't pass the test." },
      { prompt: "Make it negative: 'You will like this song.'", answer: "You won't like this song." },
      { prompt: "Make it negative: 'The shop will open on Sunday.'", answer: "The shop won't open on Sunday." },
      { prompt: "Make it negative: 'I will forget your name.'", answer: "I won't forget your name." },
      { prompt: "Make it negative: 'My parents will agree.'", answer: "My parents won't agree." },
      { prompt: "Make it negative: 'He will win the race.'", answer: "He won't win the race." },
      { prompt: "Make it negative: 'We will go to the zoo.'", answer: "We won't go to the zoo." },
      { prompt: "Make it negative: 'It will be hot today.'", answer: "It won't be hot today." },
      { prompt: "Make it negative: 'They will play football.'", answer: "They won't play football." },
      { prompt: "Make it negative: 'She will be at home.'", answer: "She won't be at home." }
    ]
  },
  'present-perfect': {
    NEON_QUESTIONS: [
      { prompt: "Make it negative: 'I have finished my homework.'", answer: "I haven't finished my homework." },
      { prompt: "Make it negative: 'She has seen that film.'", answer: "She hasn't seen that film." },
      { prompt: "Make it negative: 'They have eaten lunch.'", answer: "They haven't eaten lunch." },
      { prompt: "Make it negative: 'He has been to London.'", answer: "He hasn't been to London." },
      { prompt: "Make it negative: 'We have met before.'", answer: "We haven't met before." },
      { prompt: "Make it negative: 'The bus has arrived.'", answer: "The bus hasn't arrived." },
      { prompt: "Make it negative: 'You have broken it.'", answer: "You haven't broken it." },
      { prompt: "Make it negative: 'My sister has won a prize.'", answer: "My sister hasn't won a prize." },
      { prompt: "Make it negative: 'It has stopped raining.'", answer: "It hasn't stopped raining." },
      { prompt: "Make it negative: 'I have read that book.'", answer: "I haven't read that book." },
      { prompt: "Make it negative: 'They have gone home.'", answer: "They haven't gone home." },
      { prompt: "Make it negative: 'He has done his homework.'", answer: "He hasn't done his homework." },
      { prompt: "Make it negative: 'We have bought the tickets.'", answer: "We haven't bought the tickets." },
      { prompt: "Make it negative: 'She has written the letter.'", answer: "She hasn't written the letter." },
      { prompt: "Make it negative: 'The film has started.'", answer: "The film hasn't started." }
    ]
  },
  'amusement-park': {
    NEON_QUESTIONS: [
      { prompt: "Make it past: 'I watch a 3D film.'", answer: "I watched a 3D film." },
      { prompt: "Make it past: 'We visit a petting zoo.'", answer: "We visited a petting zoo." },
      { prompt: "Make it past: 'They see a parade.'", answer: "They saw a parade." },
      { prompt: "Make it past: 'She enters a haunted house.'", answer: "She entered a haunted house." },
      { prompt: "Make it past: 'He goes on a roller coaster.'", answer: "He went on a roller coaster." },
      { prompt: "Make it past: 'I ride the merry-go-round.'", answer: "I rode the merry-go-round." },
      { prompt: "Make it past: 'The film is amazing.'", answer: "The film was amazing." },
      { prompt: "Make it past: 'We are excited.'", answer: "We were excited." },
      { prompt: "Make it past: 'My friends ride the Ferris wheel.'", answer: "My friends rode the Ferris wheel." },
      { prompt: "Make it past: 'You win a prize!'", answer: "You won a prize!" },
      { prompt: "Make it past: 'We eat candy floss.'", answer: "We ate candy floss." },
      { prompt: "Make it past: 'He buys a souvenir.'", answer: "He bought a souvenir." },
      { prompt: "Make it past: 'I am scared.'", answer: "I was scared." },
      { prompt: "Make it past: 'They take photos.'", answer: "They took photos." },
      { prompt: "Make it past: 'The parade is boring.'", answer: "The parade was boring." }
    ]
  },
  'party-fun': {
    NEON_QUESTIONS: [
      { prompt: "Make it negative: 'I'll bake biscuits.'", answer: "I won't bake biscuits." },
      { prompt: "Make it negative: 'He'll draw posters.'", answer: "He won't draw posters." },
      { prompt: "Make it negative: 'She'll buy balloons.'", answer: "She won't buy balloons." },
      { prompt: "Make it negative: 'We'll order pizza.'", answer: "We won't order pizza." },
      { prompt: "Make it negative: 'They'll choose the music.'", answer: "They won't choose the music." },
      { prompt: "Make it negative: 'Rosa will set the table.'", answer: "Rosa won't set the table." },
      { prompt: "Make it negative: 'You'll serve the pizza.'", answer: "You won't serve the pizza." },
      { prompt: "Make it negative: 'Dave will play the music.'", answer: "Dave won't play the music." },
      { prompt: "Make it negative: 'I'll hang up the decorations.'", answer: "I won't hang up the decorations." },
      { prompt: "Make it negative: 'Tom will bring games.'", answer: "Tom won't bring games." },
      { prompt: "Make it negative: 'We'll set up the games.'", answer: "We won't set up the games." },
      { prompt: "Make it negative: 'Ann will bake a cake.'", answer: "Ann won't bake a cake." },
      { prompt: "Make it negative: 'They'll blow up the balloons.'", answer: "They won't blow up the balloons." },
      { prompt: "Make it negative: 'He'll serve the drinks.'", answer: "He won't serve the drinks." },
      { prompt: "Make it negative: 'I'll set the table.'", answer: "I won't set the table." }
    ]
  },
  'at-school': {
    NEON_QUESTIONS: [
      { prompt: "Ask the question: 'I've got a stapler.'", answer: "What have you got?" },
      { prompt: "Ask the question: 'She's got a paintbrush.'", answer: "What has she got?" },
      { prompt: "Ask the question: 'He's got a glue stick.'", answer: "What has he got?" },
      { prompt: "Ask the question: 'They've got colouring pencils.'", answer: "What have they got?" },
      { prompt: "Ask the question: 'Mia's got a marker pen.'", answer: "What has Mia got?" },
      { prompt: "Ask the question: 'I want pizza.'", answer: "What do you want?" },
      { prompt: "Ask the question: 'He wants fish.'", answer: "What does he want?" },
      { prompt: "Ask the question: 'She wants juice.'", answer: "What does she want?" },
      { prompt: "Ask the question: 'They want soup.'", answer: "What do they want?" },
      { prompt: "Ask the question: 'Tom wants steak.'", answer: "What does Tom want?" },
      { prompt: "Ask the question: 'We've got a stapler.'", answer: "What have you got?" },
      { prompt: "Ask the question: 'Tom's got a paintbrush.'", answer: "What has Tom got?" },
      { prompt: "Ask the question: 'We want pizza.'", answer: "What do you want?" },
      { prompt: "Ask the question: 'Mia wants soup.'", answer: "What does Mia want?" },
      { prompt: "Ask the question: 'He's got a pencil sharpener.'", answer: "What has he got?" }
    ]
  },
  'months-weather': {
    NEON_QUESTIONS: [
      { prompt: "Make the weather word: 'sun' → It's ___.", answer: "sunny" },
      { prompt: "Make the weather word: 'rain' → It's ___.", answer: "rainy" },
      { prompt: "Make the weather word: 'wind' → It's ___.", answer: "windy" },
      { prompt: "Make the weather word: 'snow' → It's ___.", answer: "snowy" },
      { prompt: "Make the weather word: 'cloud' → It's ___.", answer: "cloudy" },
      { prompt: "Make the weather word: 'fog' → It's ___.", answer: "foggy" },
      { prompt: "Which season? 'December, January, February'", answer: "winter" },
      { prompt: "Which season? 'March, April, May'", answer: "spring" },
      { prompt: "Which season? 'June, July, August'", answer: "summer" },
      { prompt: "Which season? 'September, October, November'", answer: "autumn" },
      { prompt: "Make the weather word: 'storm' → It's ___.", answer: "stormy" },
      { prompt: "Which season is July in?", answer: "summer" },
      { prompt: "Which season is November in?", answer: "autumn" },
      { prompt: "Which season is February in?", answer: "winter" },
      { prompt: "Which season is May in?", answer: "spring" }
    ]
  },
  'food-drink': {
    NEON_QUESTIONS: [
      { prompt: "A or an? '___ apple'", answer: "an" },
      { prompt: "A or an? '___ banana'", answer: "a" },
      { prompt: "A or an? '___ egg'", answer: "an" },
      { prompt: "A or an? '___ sandwich'", answer: "a" },
      { prompt: "A or an? '___ orange'", answer: "an" },
      { prompt: "Make it plural: 'potato' → some ___", answer: "potatoes", choices: ["potatoes", "potatos", "potato"] },
      { prompt: "Make it plural: 'sandwich' → some ___", answer: "sandwiches", choices: ["sandwiches", "sandwichs", "sandwich"] },
      { prompt: "Make it plural: 'cookie' → some ___", answer: "cookies", choices: ["cookies", "cookys", "cookie"] },
      { prompt: "Make it plural: 'tomato' → some ___", answer: "tomatoes", choices: ["tomatoes", "tomatos", "tomato"] },
      { prompt: "Make it plural: 'carrot' → some ___", answer: "carrots", choices: ["carrots", "carrotes", "carrot"] },
      { prompt: "A or an? '___ potato'", answer: "a" },
      { prompt: "A or an? '___ onion'", answer: "an" },
      { prompt: "A or an? '___ ice cream'", answer: "an" },
      { prompt: "Make it plural: 'banana' → some ___", answer: "bananas", choices: ["bananas", "bananaes", "banana"] },
      { prompt: "Make it plural: 'peach' → some ___", answer: "peaches", choices: ["peaches", "peachs", "peach"] }
    ]
  },
  'at-the-buffet': {
    NEON_QUESTIONS: [
      { prompt: "Make it past: 'I have cereal for breakfast.'", answer: "I had cereal for breakfast." },
      { prompt: "Make it past: 'She has fried rice for lunch.'", answer: "She had fried rice for lunch." },
      { prompt: "Make it past: 'The lemonade tastes sweet.'", answer: "The lemonade tasted sweet." },
      { prompt: "Make it past: 'The chicken wings taste spicy.'", answer: "The chicken wings tasted spicy." },
      { prompt: "Make it past: 'We have tuna sandwiches.'", answer: "We had tuna sandwiches." },
      { prompt: "Make it past: 'He has scrambled eggs.'", answer: "He had scrambled eggs." },
      { prompt: "Make it past: 'The grapefruit juice tastes bitter.'", answer: "The grapefruit juice tasted bitter." },
      { prompt: "Make it past: 'They have fruit salad.'", answer: "They had fruit salad." },
      { prompt: "Make it past: 'What do you have for lunch?'", answer: "What did you have for lunch?" },
      { prompt: "Make it past: 'How does the soup taste?'", answer: "How did the soup taste?" },
      { prompt: "Make it past: 'The chips taste salty.'", answer: "The chips tasted salty." },
      { prompt: "Make it past: 'I drink lemonade.'", answer: "I drank lemonade." },
      { prompt: "Make it past: 'How do the chicken wings taste?'", answer: "How did the chicken wings taste?" },
      { prompt: "Make it past: 'My dad eats fried rice.'", answer: "My dad ate fried rice." },
      { prompt: "Make it past: 'The fried rice is greasy.'", answer: "The fried rice was greasy." }
    ]
  },
  'at-the-market': {
    NEON_QUESTIONS: [
      { prompt: "Make it negative: 'He's got some grapes.'", answer: "He hasn't got any grapes." },
      { prompt: "Make it negative: 'She's got some mushrooms.'", answer: "She hasn't got any mushrooms." },
      { prompt: "Make it negative: 'I've got some cheese.'", answer: "I haven't got any cheese." },
      { prompt: "Make it negative: 'We've got some lemons.'", answer: "We haven't got any lemons." },
      { prompt: "Make it negative: 'They've got some pumpkins.'", answer: "They haven't got any pumpkins." },
      { prompt: "Make it negative: 'The farmer has got some watermelons.'", answer: "The farmer hasn't got any watermelons." },
      { prompt: "Make it negative: 'You've got some butter.'", answer: "You haven't got any butter." },
      { prompt: "Make it negative: 'My mum has got some beef.'", answer: "My mum hasn't got any beef." },
      { prompt: "Make it negative: 'He's got some cucumbers.'", answer: "He hasn't got any cucumbers." },
      { prompt: "Make it negative: 'She's got some yoghurt.'", answer: "She hasn't got any yoghurt." },
      { prompt: "Make it negative: 'We've got some milk.'", answer: "We haven't got any milk." },
      { prompt: "Make it negative: 'Tom has got some lamb.'", answer: "Tom hasn't got any lamb." },
      { prompt: "Make it negative: 'I've got some watermelons.'", answer: "I haven't got any watermelons." },
      { prompt: "Make it negative: 'They've got some mushrooms.'", answer: "They haven't got any mushrooms." },
      { prompt: "Make it negative: 'Mia has got some grapes.'", answer: "Mia hasn't got any grapes." }
    ]
  }
};

export const NEON_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  NEON_QUESTIONS.length = 0;
  NEON_QUESTIONS.push(...data.NEON_QUESTIONS);
}
applyLesson('comparatives');
