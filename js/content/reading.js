/* =========================================================
   LESSON CONTENT — Stage 8 (Reading)
   A short reading (about 100 words) using the lesson's language, and
   six questions graded from easy to harder: two "find it in the text",
   two details, one "why", and a last one about the students themselves
   (its answer is an example; any sensible answer is right).
   `paragraphs` are separate paragraphs of the text.
========================================================= */
const OWN = 'Students’ own answers';
const LESSON_CONTENT = {
  comparatives: {
    title: 'My Two Pets',
    paragraphs: [
      'My name is Lucy and I have got two pets, a dog called Max and a cat called Bella. Max is bigger than Bella, and he is much louder too! Bella is smaller and quieter, but she is cleverer than Max. She can open the kitchen door!',
      'Max is faster than Bella in the garden, but Bella is better at climbing trees. In winter, Max is happier than Bella because he loves the snow. Bella thinks the snow is colder and wetter than her warm bed. Who is my favourite? That’s easy: they are both the best!'
    ],
    questions: [
      { q: 'What are the names of Lucy’s pets?', a: 'Max (a dog) and Bella (a cat).' },
      { q: 'Who is bigger, Max or Bella?', a: 'Max is bigger than Bella.' },
      { q: 'Which pet is quieter?', a: 'Bella is quieter than Max.' },
      { q: 'What can Bella open?', a: 'The kitchen door.' },
      { q: 'Why is Max happier in winter?', a: 'Because he loves the snow.' },
      { q: 'Which pet would you like, Max or Bella? Why?', a: `${OWN}, e.g. I’d like Bella because she is cleverer.` }
    ]
  },
  health: {
    title: 'A Bad Day for Tom',
    paragraphs: [
      'Tom woke up on Monday and he didn’t feel well. He had a headache and a sore throat. His mum took his temperature. “You’ve got a fever,” she said. “You shouldn’t go to school today. You should stay in bed.” Tom drank some hot lemon tea and took some medicine.',
      'In the afternoon his friend Sam called. “Can you play football?” he asked. “No, I can’t,” said Tom. “I’m ill. I should rest.” By Wednesday, Tom felt much better. He went back to school, but his teacher said, “You shouldn’t run too much today!”'
    ],
    questions: [
      { q: 'On which day did Tom feel ill?', a: 'On Monday.' },
      { q: 'What two problems did Tom have?', a: 'A headache and a sore throat.' },
      { q: 'What did his mum say he should do?', a: 'He should stay in bed (and not go to school).' },
      { q: 'What did Tom drink?', a: 'Hot lemon tea.' },
      { q: 'Why couldn’t Tom play football with Sam?', a: 'Because he was ill and he should rest.' },
      { q: 'What should you do when you have a cold?', a: `${OWN}, e.g. You should drink water and rest.` }
    ]
  },
  'comparatives-superlatives': {
    title: 'The Animal Sports Day',
    paragraphs: [
      'Every year the animals have a big sports day. This year the cheetah was the fastest animal in the race. She was faster than the horse and much faster than the tortoise! In the high jump, the kangaroo jumped higher than the frog.',
      'The elephant was the strongest animal. It lifted a heavy tree! The tortoise was the slowest, but he was the happiest animal at the end because everyone cheered for him. “This is the best day of my life!” he said.'
    ],
    questions: [
      { q: 'Who was the fastest animal in the race?', a: 'The cheetah.' },
      { q: 'Was the horse faster than the cheetah?', a: 'No, it wasn’t. The cheetah was faster.' },
      { q: 'Who jumped higher, the kangaroo or the frog?', a: 'The kangaroo.' },
      { q: 'What did the elephant lift?', a: 'A heavy tree.' },
      { q: 'Why was the tortoise the happiest animal?', a: 'Because everyone cheered for him.' },
      { q: 'What is the best sport, in your opinion? Why?', a: `${OWN}, e.g. Football is the best sport because it’s the most exciting.` }
    ]
  },
  'will-wont': {
    title: 'Life in 2050',
    paragraphs: [
      'What will life be like in 2050? My grandpa thinks robots will do all the housework. He says people won’t wash the dishes or clean their rooms any more! My sister thinks cars will fly, so there won’t be any traffic jams.',
      'I think children will still go to school, but they will learn with computers, not books. Maybe we will go on holiday to the Moon! I hope people will look after the planet, and the air will be cleaner. One thing is sure: I won’t stop eating pizza!'
    ],
    questions: [
      { q: 'Which year is the text about?', a: '2050.' },
      { q: 'What does grandpa think robots will do?', a: 'All the housework.' },
      { q: 'Why won’t there be any traffic jams?', a: 'Because cars will fly.' },
      { q: 'How will children learn?', a: 'With computers, not books.' },
      { q: 'What does the writer hope?', a: 'That people will look after the planet and the air will be cleaner.' },
      { q: 'What will you do in 2050?', a: `${OWN}, e.g. I will be a doctor.` }
    ]
  },
  'present-perfect': {
    title: 'Ella’s Adventures',
    paragraphs: [
      'Ella is twelve, but she has already had lots of adventures. She has been to six countries. She has seen the Eiffel Tower in Paris and she has swum in the sea in Greece. She has never been on a very long flight, but she wants to fly to Australia one day.',
      'Ella has tried lots of different foods too. She has eaten sushi in Japan, but she has never tried snails! Her brother Ben has never left his country, but he has just bought a map of the world. “Have you ever been to China?” he asks Ella. “Not yet!” she says.'
    ],
    questions: [
      { q: 'How old is Ella?', a: 'Twelve.' },
      { q: 'How many countries has Ella been to?', a: 'Six.' },
      { q: 'Where has she swum in the sea?', a: 'In Greece.' },
      { q: 'Which food has Ella never tried?', a: 'Snails.' },
      { q: 'What has Ben just bought?', a: 'A map of the world.' },
      { q: 'Have you ever been to another country? Where?', a: `${OWN}, e.g. Yes, I have. I’ve been to Spain.` }
    ]
  },
  'amusement-park': {
    title: 'A Day at Fun Land',
    paragraphs: [
      'Last Saturday, Mia and her family went to Fun Land. First they went on the roller coaster. It was really exciting, but Mia’s dad was frightened! Then they rode the bumper cars. Mia laughed a lot because her brother crashed into everyone. At lunchtime they ate hot dogs and candy floss.',
      'In the afternoon they waited in a long queue for the ghost train. The queue was boring, but the ride was amazing. Mia screamed when a skeleton jumped out! In the evening they watched the fireworks. Everyone was tired but happy when they got home.'
    ],
    questions: [
      { q: 'When did Mia go to Fun Land?', a: 'Last Saturday.' },
      { q: 'Who was frightened on the roller coaster?', a: 'Mia’s dad.' },
      { q: 'Why did Mia laugh on the bumper cars?', a: 'Because her brother crashed into everyone.' },
      { q: 'What did they eat at lunchtime?', a: 'Hot dogs and candy floss.' },
      { q: 'How did they feel when they got home?', a: 'They were tired but happy.' },
      { q: 'Which ride would you like to go on? Why?', a: `${OWN}, e.g. The roller coaster, because it’s exciting.` }
    ]
  },
  'party-fun': {
    title: 'The Class Party',
    paragraphs: [
      'Our class party is on Friday and everyone will help. Who will bring the food? Lily will make a big chocolate cake, and Tom will bring pizza. Will Jack bring drinks? Yes, he will. He’ll bring orange juice and lemonade. Anna and Sophie will decorate the classroom with balloons and a big poster.',
      'What will our teacher do? She will play the music! Will we play games? Yes, we will. We’ll play musical chairs and pass the parcel. Ben won’t dance because he’s shy, but he will take photos. It will be the best party ever!'
    ],
    questions: [
      { q: 'When is the class party?', a: 'On Friday.' },
      { q: 'What will Lily make?', a: 'A big chocolate cake.' },
      { q: 'Will Jack bring drinks?', a: 'Yes, he will. (Orange juice and lemonade.)' },
      { q: 'What will the teacher do?', a: 'She will play the music.' },
      { q: 'Why won’t Ben dance?', a: 'Because he’s shy.' },
      { q: 'What will you do at a party?', a: `${OWN}, e.g. I will make a poster and dance.` }
    ]
  },
  'at-school': {
    title: 'Sam’s School Bag',
    paragraphs: [
      'Sam has got a big blue school bag. Inside, he has got three books, a pencil case and a lunch box. In his pencil case, he has got two pencils, a rubber, a ruler and some colouring pencils, but he hasn’t got a sharpener. His friend Kate has got a pink school bag with a glue stick and some scissors.',
      'Today is Sam’s birthday. He wants a new football and a computer game. Kate wants a puppy for her birthday! At lunchtime, Sam has got sandwiches and an apple. He wants chocolate too, but his mum says no!'
    ],
    questions: [
      { q: 'What colour is Sam’s school bag?', a: 'Blue.' },
      { q: 'What has Sam got in his school bag?', a: 'Three books, a pencil case and a lunch box.' },
      { q: 'What hasn’t Sam got in his pencil case?', a: 'A sharpener.' },
      { q: 'What does Sam want for his birthday?', a: 'A new football and a computer game.' },
      { q: 'What does Kate want for her birthday?', a: 'A puppy.' },
      { q: 'What have you got in your school bag?', a: `${OWN}, e.g. I’ve got a pencil case and two books.` }
    ]
  },
  'months-weather': {
    title: 'Max’s Year',
    paragraphs: [
      'Hi, I’m Max. My favourite month is July because my birthday is on the twentieth of July. In summer it’s hot and sunny, and I swim in the sea. In autumn, in September and October, it’s windy and the leaves fall from the trees. I go back to school on the fifth of September.',
      'Winter is very cold here. In December it’s snowy and we build snowmen. My sister’s birthday is on the first of December. In spring, in April, it’s rainy, so I take my umbrella everywhere. What’s the weather like today? It’s cloudy!'
    ],
    questions: [
      { q: 'What is Max’s favourite month?', a: 'July.' },
      { q: 'When is Max’s birthday?', a: 'On the twentieth of July.' },
      { q: 'What’s the weather like in autumn?', a: 'It’s windy (and the leaves fall from the trees).' },
      { q: 'When does Max go back to school?', a: 'On the fifth of September.' },
      { q: 'Why does Max take his umbrella everywhere in April?', a: 'Because it’s rainy.' },
      { q: 'When is your birthday? What’s the weather like then?', a: `${OWN}, e.g. It’s on the third of May. It’s sunny.` }
    ]
  },
  'food-drink': {
    title: 'Lunch at Luca’s Café',
    paragraphs: [
      'Hi, I’m Sofia. On Saturday I go to Luca’s Café with my dad. The waiter says, “Hi. Can I help you? Are you ready to order?” My dad says, “Yes, thanks. I’ll have a cheese pizza, please.” I’m very hungry. Is there any pasta? Yes, there is! So I have some pasta with tomato sauce.',
      'Then the waiter asks, “What would you like to drink?” I’m thirsty. I’d like some orange juice, but there isn’t any juice today, so I have water. For dessert there are some chocolate cookies, but there aren’t any cakes. Yum!'
    ],
    questions: [
      { q: 'Where do Sofia and her dad go on Saturday?', a: 'To Luca’s Café.' },
      { q: 'What does her dad order?', a: 'A cheese pizza.' },
      { q: 'Is there any pasta at the café?', a: 'Yes, there is.' },
      { q: 'Why does Sofia have water?', a: 'Because there isn’t any orange juice today.' },
      { q: 'Are there any cakes for dessert? What is there?', a: 'No, there aren’t. There are some chocolate cookies.' },
      { q: 'What would you like to order at a café?', a: `${OWN}, e.g. I’d like a sandwich and some juice, please.` }
    ]
  },
  'at-the-buffet': {
    title: 'Breakfast at the Hotel Buffet',
    paragraphs: [
      'Hi, I’m Max. Last summer my family stayed at a big hotel by the sea. Every morning there was a buffet. On the first day I had scrambled eggs and grapefruit juice. The eggs tasted good, but the juice tasted bitter! My little sister had cereal with milk. It tasted sweet.',
      'For lunch we had fried rice and chicken wings. The chicken wings tasted spicy, so I drank lots of lemonade. My dad had tuna sandwiches. They tasted salty. Then we all had fruit salad. It tasted sweet and fresh. Yum!'
    ],
    questions: [
      { q: 'Where did Max’s family stay?', a: 'At a big hotel by the sea.' },
      { q: 'What did Max have on the first day?', a: 'Scrambled eggs and grapefruit juice.' },
      { q: 'How did the grapefruit juice taste?', a: 'It tasted bitter.' },
      { q: 'What did his little sister have?', a: 'Cereal with milk.' },
      { q: 'Why did Max drink lots of lemonade?', a: 'Because the chicken wings tasted spicy.' },
      { q: 'What did you have for breakfast today? How did it taste?', a: `${OWN}, e.g. I had cereal. It tasted sweet.` }
    ]
  },
  'at-the-market': {
    title: 'Saturday at the Farmers’ Market',
    paragraphs: [
      'Every Saturday, Lucy and her grandpa go to the farmers’ market. Today Grandpa has got a big shopping bag. First they go to the fruit stall. The farmer has got some grapes and some watermelons, but he hasn’t got any lemons. Lucy loves grapes, so Grandpa buys some.',
      'Next they go to the milk stall. “Have you got any yoghurt?” asks Lucy. “Yes, I have,” says the woman. She has got some cheese and some butter too, but she hasn’t got any milk today. Now Grandpa’s bag is very heavy!'
    ],
    questions: [
      { q: 'When do Lucy and her grandpa go to the market?', a: 'Every Saturday.' },
      { q: 'What has the farmer got?', a: 'Some grapes and some watermelons.' },
      { q: 'Has the farmer got any lemons?', a: 'No, he hasn’t.' },
      { q: 'What does Grandpa buy at the fruit stall?', a: 'Some grapes.' },
      { q: 'Has the woman got any milk today?', a: 'No, she hasn’t. But she’s got some yoghurt, cheese and butter.' },
      { q: 'What have you got in your fridge at home?', a: `${OWN}, e.g. I’ve got some milk and some cheese.` }
    ]
  }
};

export const READING = { title: '', paragraphs: [], questions: [] };

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  READING.title = data.title;
  READING.paragraphs = data.paragraphs.slice();
  READING.questions = data.questions.map(x => ({ ...x }));
}
applyLesson('comparatives');
