/* =========================================================
   LESSON CONTENT — Stage 8 (Spin the Wheel)
   Open speaking questions ("e.g." answers), 15 a lesson. A game asks
   ten of them, the ones not asked yet first (js/questionDeck.js). The
   slices' points are a game mechanic and live in the stage file
   (WHEEL_POINTS in js/stages/stage8-spinwheel.js), not here.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    WHEEL_QUESTIONS: [
      { prompt: "What is the comparative of 'quick'?", answer: "quicker" },
      { prompt: "What is the comparative of 'wise'?", answer: "wiser" },
      { prompt: "What is the comparative of 'dark'?", answer: "darker" },
      { prompt: "What is the comparative of 'bright'?", answer: "brighter" },
      { prompt: "What is the comparative of 'calm'?", answer: "calmer" },
      { prompt: "What is the comparative of 'crowded'?", answer: "more crowded" },
      { prompt: "What is the comparative of 'beautiful'?", answer: "more beautiful" },
      { prompt: "What is the comparative of 'curious'?", answer: "more curious" },
      { prompt: "What is the comparative of 'far'? (it's irregular!)", answer: "farther" },
      { prompt: "What is the comparative of 'little'? (it's irregular!)", answer: "less" },
      { prompt: "What is the comparative of 'friendly'?", answer: "friendlier" },
      { prompt: "What is the comparative of 'clean'?", answer: "cleaner" },
      { prompt: "What is the comparative of 'large'?", answer: "larger" },
      { prompt: "What is the comparative of 'important'?", answer: "more important" },
      { prompt: "What is the comparative of 'sad'?", answer: "sadder" }
    ]
  },
  health: {
    WHEEL_QUESTIONS: [
      { prompt: "They've got a headache. What should they do?", answer: "They should take some medicine." },
      { prompt: "You've got a fever. What should you do?", answer: "You should stay in bed." },
      { prompt: "We've got sore throats. What should we do?", answer: "We should drink some hot tea." },
      { prompt: "He's eaten five burgers. What shouldn't he do?", answer: "He shouldn't eat too much." },
      { prompt: "I've got a toothache. What should I do?", answer: "I should see a dentist." },
      { prompt: "She's got a runny nose. What should she do?", answer: "She should blow her nose." },
      { prompt: "You feel tired. What should you do?", answer: "You should get some sleep." },
      { prompt: "They've got a cough. What should they do?", answer: "They should drink some water." },
      { prompt: "He's got a backache. What shouldn't he do?", answer: "He shouldn't carry heavy bags." },
      { prompt: "I've got a stomach ache. What should I do?", answer: "I should see a doctor." },
      { prompt: "What should you do to stay healthy? Say two things.", answer: "e.g. You should eat fruit and exercise." },
      { prompt: "What shouldn't you do before bed?", answer: "e.g. You shouldn't play computer games." },
      { prompt: "Your friend has got a cold. Give them two pieces of advice.", answer: "e.g. You should stay in bed. You shouldn't go swimming." },
      { prompt: "Act it out! Show a problem. The class asks 'What's the matter?'", answer: "e.g. I've got a backache." },
      { prompt: "What should a footballer eat before a match?", answer: "e.g. He should eat pasta and drink water." }
    ]
  },
  'comparatives-superlatives': {
    WHEEL_QUESTIONS: [
      { prompt: "Compare: an elephant and a mouse. (big)", answer: "An elephant is bigger than a mouse." },
      { prompt: "Which is the best day of the week, and why?", answer: "e.g. Saturday is the best day because..." },
      { prompt: "Compare: a car and a bicycle. (fast)", answer: "A car is faster than a bicycle." },
      { prompt: "Compare: winter and summer. (cold)", answer: "Winter is colder than summer." },
      { prompt: "What is the most beautiful place you know?", answer: "e.g. The most beautiful place is..." },
      { prompt: "Compare: maths and English. (easy)", answer: "e.g. English is easier than maths." },
      { prompt: "Compare: your bag and your friend's bag. (heavy)", answer: "e.g. My bag is heavier than my friend's." },
      { prompt: "Who is the tallest person in your family?", answer: "e.g. My father is the tallest." },
      { prompt: "Compare: a phone and a laptop. (expensive)", answer: "A laptop is more expensive than a phone." },
      { prompt: "What is the worst film you have ever seen?", answer: "e.g. The worst film I've seen is..." },
      { prompt: "Who is the funniest person you know?", answer: "e.g. My uncle is the funniest person I know." },
      { prompt: "Compare: a cat and a dog. (clever)", answer: "e.g. A dog is cleverer than a cat." },
      { prompt: "What is the most delicious food in the world?", answer: "e.g. Pizza is the most delicious food." },
      { prompt: "Compare: the sun and the moon. (hot)", answer: "The sun is hotter than the moon." },
      { prompt: "Which is the best subject at school? Why?", answer: "e.g. Art is the best subject because..." }
    ]
  },
  'will-wont': {
    WHEEL_QUESTIONS: [
      { prompt: "What will you do after school today?", answer: "e.g. I will go home and do my homework." },
      { prompt: "What will the weather be like tomorrow?", answer: "e.g. It will be sunny tomorrow." },
      { prompt: "Make it negative: 'He will come to the party.'", answer: "He won't come to the party." },
      { prompt: "What won't you do this weekend?", answer: "e.g. I won't get up early." },
      { prompt: "Where will you be in ten years?", answer: "e.g. I will be at university." },
      { prompt: "Make a question: 'you / help / me'", answer: "Will you help me?" },
      { prompt: "What will people use instead of cars in 2100?", answer: "e.g. People will use flying cars." },
      { prompt: "Make it negative: 'They will win the match.'", answer: "They won't win the match." },
      { prompt: "Make a promise using 'won't'.", answer: "e.g. I won't tell anyone." },
      { prompt: "What will you eat for dinner tonight?", answer: "e.g. I will eat rice and chicken." },
      { prompt: "What will you do on your next birthday?", answer: "e.g. I will have a party with my friends." },
      { prompt: "Make a prediction about your best friend.", answer: "e.g. She will be a famous singer." },
      { prompt: "What will your teacher do tonight? Guess!", answer: "e.g. She will mark our homework." },
      { prompt: "Make a question: 'it / be / sunny / tomorrow'", answer: "Will it be sunny tomorrow?" },
      { prompt: "What won't you do when you are old?", answer: "e.g. I won't eat broccoli!" }
    ]
  },
  'present-perfect': {
    WHEEL_QUESTIONS: [
      { prompt: "Have you ever been to another country? Which one?", answer: "e.g. Yes, I have been to Thailand." },
      { prompt: "Name three things you have done today.", answer: "e.g. I have eaten breakfast, I have..." },
      { prompt: "Make it negative: 'She has finished her work.'", answer: "She hasn't finished her work." },
      { prompt: "Have you ever eaten something very strange?", answer: "e.g. Yes, I have eaten..." },
      { prompt: "What is the best film you have ever seen?", answer: "e.g. The best film I have seen is..." },
      { prompt: "Make a question: 'you / ever / ride / a horse'", answer: "Have you ever ridden a horse?" },
      { prompt: "Name something you have never done.", answer: "e.g. I have never flown in a helicopter." },
      { prompt: "Make it negative: 'They have eaten lunch.'", answer: "They haven't eaten lunch." },
      { prompt: "Has anyone in your family won a prize?", answer: "e.g. Yes, my sister has won a medal." },
      { prompt: "What have you learned in English this year?", answer: "e.g. I have learned the present perfect." },
      { prompt: "Have you ever met a famous person? Who?", answer: "e.g. Yes, I have met..." },
      { prompt: "What is the most exciting thing you have ever done?", answer: "e.g. I have been on a big roller coaster." },
      { prompt: "How many times have you been to the beach this year?", answer: "e.g. I have been to the beach three times." },
      { prompt: "Name two things you haven't done yet today.", answer: "e.g. I haven't done my homework. I haven't had dinner." },
      { prompt: "Have you ever broken something? What?", answer: "e.g. Yes, I have broken a glass." }
    ]
  },
  'amusement-park': {
    WHEEL_QUESTIONS: [
      { prompt: "Imagine you went to an amusement park. What did you do?", answer: "e.g. I went on a roller coaster." },
      { prompt: "Name three things you did at the amusement park.", answer: "e.g. I saw a parade, I rode the merry-go-round and I ate candy floss." },
      { prompt: "How was the roller coaster? How did you feel?", answer: "e.g. It was exciting. I was excited!" },
      { prompt: "Which attraction is the scariest? Why?", answer: "e.g. The haunted house. It was scary — I was scared!" },
      { prompt: "What was the most boring thing you did last weekend?", answer: "e.g. I watched TV. It was boring. I was bored." },
      { prompt: "Make a question: 'you / do / at the park'", answer: "What did you do at the park?" },
      { prompt: "Tell us about an amazing film you watched.", answer: "e.g. I watched ___. It was amazing!" },
      { prompt: "Make it past: 'We see a parade.'", answer: "We saw a parade." },
      { prompt: "What did you eat or buy the last time you went out?", answer: "e.g. I ate an ice cream and bought a T-shirt." },
      { prompt: "What is the most popular attraction in your class? Ask!", answer: "e.g. The roller coaster — six people went on it." },
      { prompt: "What did you do last weekend? Say three things.", answer: "e.g. I went to the park, I played football and I watched a film." },
      { prompt: "What is the most exciting ride you know? Why?", answer: "e.g. The roller coaster. It's fast and exciting!" },
      { prompt: "When were you bored last week? Why?", answer: "e.g. I was bored on Sunday. It was rainy." },
      { prompt: "Tell us about something amazing you saw.", answer: "e.g. I saw fireworks. They were amazing!" },
      { prompt: "Make a question: 'you / ride / the Ferris wheel'", answer: "Did you ride the Ferris wheel?" }
    ]
  },
  'party-fun': {
    WHEEL_QUESTIONS: [
      { prompt: "What will you do for the party?", answer: "e.g. I’ll bake biscuits." },
      { prompt: "Name three party jobs. Who will do them?", answer: "e.g. Ann will buy balloons, Tom will order pizza and I’ll draw posters." },
      { prompt: "Will you bring games to the party?", answer: "e.g. Yes, I will. / No, I won’t." },
      { prompt: "Which party job won’t you do? Why?", answer: "e.g. I won’t bake biscuits — I can’t cook!" },
      { prompt: "Plan your dream birthday party. What will happen?", answer: "e.g. We’ll play games, eat pizza and dance all night." },
      { prompt: "Make a question: 'who / play the music'", answer: "Who will play the music?" },
      { prompt: "Say it short: 'I will' and 'will not'.", answer: "I’ll and won’t" },
      { prompt: "Make it negative: 'He will draw the posters.'", answer: "He won’t draw the posters." },
      { prompt: "Ask a classmate a 'Will you…?' question about the party.", answer: "e.g. Will you hang up the decorations?" },
      { prompt: "Who in your class will choose the music? Ask!", answer: "e.g. Sara will choose the music." },
      { prompt: "Your class will have a party on Friday. What will you bring?", answer: "e.g. I’ll bring some games." },
      { prompt: "Who will help you at your next birthday party?", answer: "e.g. My mum will help me." },
      { prompt: "Make a question: 'who / blow up the balloons'", answer: "Who will blow up the balloons?" },
      { prompt: "Answer: 'Will you dance at the party?'", answer: "e.g. Yes, I will. / No, I won’t." },
      { prompt: "Say three things you won't do at a party.", answer: "e.g. I won’t sleep, I won’t cry and I won’t be late." }
    ]
  },
  'at-school': {
    WHEEL_QUESTIONS: [
      { prompt: "What have you got in your pencil case?", answer: "e.g. I’ve got a colouring pencil and a glue stick." },
      { prompt: "Name all six classroom things from the lesson!", answer: "marker pen, stapler, paintbrush, glue stick, colouring pencil, pencil sharpener" },
      { prompt: "What do you want for lunch today?", answer: "e.g. I want chicken and juice." },
      { prompt: "Point to a classmate. What has he or she got?", answer: "e.g. She’s got a stapler." },
      { prompt: "Name all six cafeteria foods and drinks from the lesson!", answer: "pizza, fish, chicken, steak, soup, juice" },
      { prompt: "Make it short: 'He has got a paintbrush.'", answer: "He’s got a paintbrush." },
      { prompt: "Make a sentence: she / want / fish", answer: "She wants fish." },
      { prompt: "Which one is NOT food: pizza, stapler or soup?", answer: "stapler", choices: ["stapler", "pizza", "soup"] },
      { prompt: "What does your best friend want for lunch? Guess!", answer: "e.g. He wants pizza." },
      { prompt: "Describe your school bag: say four things you’ve got.", answer: "e.g. I’ve got a marker pen, a glue stick, a stapler and a paintbrush." },
      { prompt: "What has your teacher got on the desk?", answer: "e.g. She’s got a stapler and a marker pen." },
      { prompt: "What do you want for dinner tonight?", answer: "e.g. I want fish and soup." },
      { prompt: "Ask a classmate what they have got. Then tell the class.", answer: "e.g. What have you got? — Lan’s got a paintbrush." },
      { prompt: "What does your mum or dad want for lunch? Guess!", answer: "e.g. My dad wants steak." },
      { prompt: "Which one is NOT a classroom thing: stapler, juice or paintbrush?", answer: "juice", choices: ["juice", "stapler", "paintbrush"] }
    ]
  },
  'months-weather': {
    WHEEL_QUESTIONS: [
      { prompt: "When’s your birthday?", answer: "e.g. It’s on the fifth of May." },
      { prompt: "Say all twelve months in order!", answer: "January, February, March, April, May, June, July, August, September, October, November, December" },
      { prompt: "What’s the weather like today?", answer: "e.g. It’s sunny and windy." },
      { prompt: "What’s your favourite season? Why?", answer: "e.g. Summer — it’s hot and I can swim." },
      { prompt: "Say the four seasons.", answer: "spring, summer, autumn, winter" },
      { prompt: "What’s the date today?", answer: "e.g. It’s the nineteenth of November." },
      { prompt: "What’s the weather like in winter where you live?", answer: "e.g. It’s cold and snowy." },
      { prompt: "Say it in words: 3rd", answer: "third" },
      { prompt: "Ask a classmate when their birthday is. Which season is it in?", answer: "e.g. When’s your birthday? — It’s in July. That’s summer!" },
      { prompt: "Describe the weather in all four seasons.", answer: "e.g. It’s rainy in spring, hot in summer, windy in autumn and snowy in winter." },
      { prompt: "Which month is your favourite? Why?", answer: "e.g. December — it’s my birthday month!" },
      { prompt: "What do you wear when it’s cold and snowy?", answer: "e.g. I wear a coat and a hat." },
      { prompt: "What do you do in summer?", answer: "e.g. I swim in the sea." },
      { prompt: "When’s your best friend’s birthday?", answer: "e.g. It’s on the tenth of August." },
      { prompt: "Say the months of spring and summer.", answer: "March, April, May, June, July, August" }
    ]
  },
  'food-drink': {
    WHEEL_QUESTIONS: [
      { prompt: "What’s in your fridge at home?", answer: "e.g. There’s some milk and there are some eggs." },
      { prompt: "Name five uncountable foods or drinks!", answer: "e.g. water, bread, rice, sugar, juice" },
      { prompt: "Order a meal from the waiter.", answer: "e.g. Can I have a chicken sandwich, please?" },
      { prompt: "What would you like to drink?", answer: "e.g. I’d like orange juice, please." },
      { prompt: "A or an? Say it: 'apple'", answer: "an apple" },
      { prompt: "Is there any pizza in the classroom?", answer: "e.g. No, there isn’t any pizza." },
      { prompt: "Name three things on a table in a restaurant.", answer: "e.g. a fork, a knife and a spoon" },
      { prompt: "Countable or uncountable: 'salt'?", answer: "uncountable" },
      { prompt: "Ask a classmate two questions about their lunch box.", answer: "e.g. Is there any fruit? Are there any cookies?" },
      { prompt: "Be the waiter AND the customer: order a soup, a main dish and a drink!", answer: "e.g. Are you ready to order? — Yes. I’ll have soup, then pizza, and I’d like water, please." },
      { prompt: "What’s in your lunch box today?", answer: "e.g. There’s a sandwich and there are some grapes." },
      { prompt: "Name five countable foods!", answer: "e.g. an apple, a banana, an egg, a carrot, a potato" },
      { prompt: "Is there any milk in your fridge? What else is there?", answer: "e.g. Yes, there is. There’s some cheese too." },
      { prompt: "You’re the waiter. Ask three questions.", answer: "e.g. Can I help you? Are you ready to order? What would you like to drink?" },
      { prompt: "A or an? Say them: 'egg', 'banana', 'orange'", answer: "an egg, a banana, an orange" }
    ]
  },
  'at-the-buffet': {
    WHEEL_QUESTIONS: [
      { prompt: "What did you have for breakfast today?", answer: "e.g. I had cereal and milk." },
      { prompt: "What did you have for lunch yesterday?", answer: "e.g. I had fried rice and lemonade." },
      { prompt: "What did you have for dinner last night? How did it taste?", answer: "e.g. I had chicken wings. They tasted spicy." },
      { prompt: "Name three sweet foods!", answer: "e.g. cake, fruit salad, chocolate" },
      { prompt: "Name three salty foods!", answer: "e.g. chips, popcorn, soup" },
      { prompt: "What’s your favourite food at a buffet? Why?", answer: "e.g. Chicken wings! They taste spicy and delicious." },
      { prompt: "Name four buffet foods from the lesson!", answer: "e.g. cereal, scrambled eggs, fruit salad, fried rice" },
      { prompt: "Ask a classmate what they had for breakfast.", answer: "e.g. What did you have for breakfast? — I had scrambled eggs." },
      { prompt: "What food tastes sour? Name two.", answer: "e.g. lemons and grapefruit" },
      { prompt: "Name a spicy food. Do you like it?", answer: "e.g. Chicken wings. Yes, I like them!" },
      { prompt: "Plan a buffet! Name a food and a drink for breakfast and for lunch.", answer: "e.g. Breakfast: cereal and grapefruit juice. Lunch: tuna sandwiches and lemonade." },
      { prompt: "What did your teacher have for lunch? Guess!", answer: "e.g. She had a tuna sandwich." },
      { prompt: "How did your breakfast taste today?", answer: "e.g. It tasted sweet. / They tasted salty." },
      { prompt: "Which food is greasy? Is it healthy?", answer: "e.g. Chips are greasy. They aren’t very healthy." },
      { prompt: "Make a question: 'you / have / for lunch'", answer: "What did you have for lunch?", choices: ["What did you have for lunch?", "What did you had for lunch?", "What you had for lunch?"] }
    ]
  },
  'at-the-market': {
    WHEEL_QUESTIONS: [
      { prompt: "What have you got in your fridge at home?", answer: "e.g. I’ve got some milk and some cheese." },
      { prompt: "Name four fruits or vegetables from the market!", answer: "e.g. grapes, watermelons, pumpkins, mushrooms" },
      { prompt: "Name four foods from a cow or a sheep!", answer: "e.g. beef, lamb, milk, cheese" },
      { prompt: "Have you got any yoghurt at home?", answer: "e.g. Yes, I have. / No, I haven’t." },
      { prompt: "Ask a classmate: 'Have you got any…?'", answer: "e.g. Have you got any lemons? — No, I haven’t." },
      { prompt: "You’re at the market. What have you got in your bag?", answer: "e.g. I’ve got some grapes and some cucumbers." },
      { prompt: "What hasn’t your fridge got? Say two things.", answer: "e.g. It hasn’t got any butter or any beef." },
      { prompt: "Point to a classmate. Ask the class: 'Has he / she got any…?'", answer: "e.g. Has she got any pencils? — Yes, she has." },
      { prompt: "Which one is NOT a fruit: grapes, lemons or mushrooms?", answer: "mushrooms", choices: ["mushrooms", "grapes", "lemons"] },
      { prompt: "Which one is NOT made from milk: cheese, butter or lamb?", answer: "lamb", choices: ["lamb", "cheese", "butter"] },
      { prompt: "Make a question: 'he / got / any cheese'", answer: "Has he got any cheese?", choices: ["Has he got any cheese?", "Have he got any cheese?", "He has got any cheese?"] },
      { prompt: "Make it negative: 'She’s got some pumpkins.'", answer: "She hasn’t got any pumpkins.", choices: ["She hasn’t got any pumpkins.", "She hasn’t got some pumpkins.", "She haven’t got any pumpkins."] },
      { prompt: "Plan a picnic! What have you got?", answer: "e.g. We’ve got some cheese, some grapes and some lemonade." },
      { prompt: "What’s your favourite fruit? Have you got any today?", answer: "e.g. Watermelon! No, I haven’t got any today." },
      { prompt: "Be the farmer! Answer: 'Have you got any watermelons?'", answer: "e.g. Yes, I have. They’re big and sweet!" }
    ]
  }
};

export const WHEEL_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  WHEEL_QUESTIONS.length = 0;
  WHEEL_QUESTIONS.push(...data.WHEEL_QUESTIONS);
}
applyLesson('comparatives');

// One distinct color per segment, fixed position on the wheel — pure
// decoration, not lesson content, so it doesn't vary by lesson.
export const WHEEL_COLORS = [
  "#FF6B6B", "#4C5FD5", "#3DB88D", "#F2B705", "#B266FF",
  "#FF8C42", "#31E6E0", "#FF6B8B", "#8577A8", "#5C9C7C"
];
