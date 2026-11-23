/* =========================================================
   LESSON CONTENT — Stage 9 (Speaking dice)
   Six questions per lesson (one per face of the dice), each with two
   helpful phrases (sentence frames, `___` is a gap) and a small word
   bank, shown when the dice lands on it.
========================================================= */
const q = (question, phrases, words) => ({ question, phrases, words });
const LESSON_CONTENT = {
  comparatives: [
    q('Who is taller, you or your friend?', ['___ is taller than ___.', 'I’m shorter than ___.'], ['taller', 'shorter', 'older', 'younger']),
    q('Which are better, cats or dogs? Why?', ['I think ___ are better than ___.', '___ are friendlier than ___.'], ['friendlier', 'cleverer', 'funnier', 'cuter']),
    q('Which is bigger, your house or your school?', ['My ___ is bigger than my ___.', 'My ___ is smaller than my ___.'], ['bigger', 'smaller', 'newer', 'older']),
    q('Which are more interesting, books or films?', ['___ are more interesting than ___.', 'I think ___ are more exciting.'], ['more interesting', 'more exciting', 'more boring', 'easier']),
    q('Which is hotter, summer or spring?', ['___ is hotter than ___.', '___ is colder than ___.'], ['hotter', 'colder', 'sunnier', 'wetter']),
    q('Which is faster, a bike or a car?', ['A ___ is faster than a ___.', 'A ___ is slower than a ___.'], ['faster', 'slower', 'safer', 'cheaper'])
  ],
  health: [
    q('What should you do if you have a headache?', ['You should ___.', 'You shouldn’t ___.'], ['take some medicine', 'rest', 'drink water', 'watch TV']),
    q('What should you do if you have a cold?', ['You should ___.', 'You shouldn’t ___.'], ['stay in bed', 'drink hot tea', 'go swimming', 'go outside']),
    q('What shouldn’t you eat if you have a stomach ache?', ['You shouldn’t eat ___.', 'You should eat ___.'], ['sweets', 'chips', 'soup', 'toast']),
    q('What should you do if you have a toothache?', ['You should see a ___.', 'You shouldn’t eat ___.'], ['dentist', 'sweets', 'ice cream', 'brush your teeth']),
    q('What should we do to stay healthy?', ['We should ___ every day.', 'We shouldn’t ___ too much.'], ['exercise', 'sleep', 'eat fruit', 'play computer games']),
    q('What’s the matter? (Act out a problem!)', ['What’s the matter? I’ve got a ___.', 'You should ___.'], ['headache', 'sore throat', 'fever', 'cough'])
  ],
  'comparatives-superlatives': [
    q('Who is the tallest person in your family?', ['___ is the tallest person in my family.', '___ is taller than ___.'], ['tallest', 'shortest', 'oldest', 'youngest']),
    q('What is the best food in the world?', ['I think ___ is the best food.', '___ is better than ___.'], ['best', 'worst', 'tastiest', 'healthiest']),
    q('What is the most exciting sport?', ['___ is the most exciting sport.', '___ is more exciting than ___.'], ['most exciting', 'most boring', 'easiest', 'hardest']),
    q('What is the biggest animal you know?', ['The ___ is the biggest animal.', 'A ___ is bigger than a ___.'], ['biggest', 'smallest', 'fastest', 'strongest']),
    q('Which is the best day of the week? Why?', ['___ is the best day because…', '___ is the worst day.'], ['best', 'worst', 'busiest', 'quietest']),
    q('Which is the hottest month of the year?', ['___ is the hottest month.', '___ is colder than ___.'], ['hottest', 'coldest', 'wettest', 'sunniest'])
  ],
  'will-wont': [
    q('What will you do this weekend?', ['I will ___.', 'I won’t ___.'], ['play football', 'visit my grandma', 'watch a film', 'do homework']),
    q('What will you be in the future?', ['I will be a ___.', 'I won’t be a ___.'], ['doctor', 'teacher', 'footballer', 'scientist']),
    q('Will it rain tomorrow?', ['Yes, it will. / No, it won’t.', 'I think it will be ___.'], ['sunny', 'rainy', 'cloudy', 'windy']),
    q('What will you eat for dinner tonight?', ['I will eat ___.', 'I won’t eat ___.'], ['pizza', 'rice', 'chicken', 'vegetables']),
    q('Where will you go on holiday?', ['I will go to ___.', 'I’ll go with ___.'], ['the beach', 'the mountains', 'my grandparents’', 'another country']),
    q('Will robots do our homework in the future?', ['I think robots will ___.', 'Robots won’t ___.'], ['clean', 'cook', 'drive', 'teach'])
  ],
  'present-perfect': [
    q('Have you ever been to another country?', ['Yes, I have. I’ve been to ___.', 'No, I haven’t.'], ['Spain', 'France', 'China', 'England']),
    q('Have you ever eaten something strange?', ['Yes, I have. I’ve eaten ___.', 'No, I’ve never eaten ___.'], ['snails', 'frogs’ legs', 'sushi', 'spicy food']),
    q('Have you ever seen a famous person?', ['Yes, I have. I’ve seen ___.', 'No, I’ve never seen a famous person.'], ['a singer', 'a footballer', 'an actor', 'a YouTuber']),
    q('What have you just done?', ['I’ve just ___.', 'I haven’t ___ yet.'], ['finished', 'eaten', 'written', 'read']),
    q('Have you ever broken a bone?', ['Yes, I’ve broken my ___.', 'No, I’ve never broken a bone.'], ['arm', 'leg', 'finger', 'toe']),
    q('Have you ever been on a plane?', ['Yes, I have. I’ve flown to ___.', 'No, I’ve never been on a plane.'], ['plane', 'train', 'boat', 'helicopter'])
  ],
  'amusement-park': [
    q('What did you do last weekend?', ['I went to ___.', 'I played ___.'], ['went', 'saw', 'played', 'ate']),
    q('Which ride is the most exciting? How did you feel?', ['The ___ was exciting.', 'I was excited / scared.'], ['roller coaster', 'ghost train', 'big wheel', 'bumper cars']),
    q('What did you eat on your last day out?', ['I ate ___.', 'It was delicious!'], ['candy floss', 'ice cream', 'popcorn', 'a hot dog']),
    q('When were you bored?', ['I was bored when ___.', 'The ___ was boring.'], ['queue', 'lesson', 'film', 'journey']),
    q('When were you surprised?', ['I was surprised when ___.', 'It was surprising!'], ['surprised', 'amazed', 'excited', 'frightened']),
    q('What was the best day of your holiday?', ['The best day was when we ___.', 'It was amazing!'], ['amazing', 'interesting', 'fun', 'exciting'])
  ],
  'party-fun': [
    q('What will you do at the party?', ['I will ___.', 'I’ll help with ___.'], ['make a cake', 'blow up balloons', 'play music', 'draw a poster']),
    q('What won’t you do at the party?', ['I won’t ___.', 'I don’t want to ___.'], ['dance', 'sing', 'wash up', 'serve the pizza']),
    q('Who will bring the food?', ['___ will bring the food.', 'I’ll bring ___.'], ['pizza', 'sandwiches', 'crisps', 'fruit']),
    q('Will you dance at the party?', ['Yes, I will.', 'No, I won’t.'], ['dance', 'sing', 'play games', 'take photos']),
    q('What will you wear to the party?', ['I’ll wear ___.', 'I won’t wear ___.'], ['a T-shirt', 'a dress', 'jeans', 'a hat']),
    q('What games will we play?', ['We will play ___.', 'I think we’ll play ___.'], ['musical chairs', 'pass the parcel', 'hide and seek', 'tag'])
  ],
  'at-school': [
    q('What have you got in your school bag?', ['I’ve got ___.', 'I haven’t got ___.'], ['a pencil case', 'a ruler', 'a book', 'a glue stick']),
    q('What has your friend got?', ['He / She has got ___.', 'He / She hasn’t got ___.'], ['a rubber', 'scissors', 'a sharpener', 'crayons']),
    q('What do you want for your birthday?', ['I want ___.', 'I don’t want ___.'], ['a bike', 'a puppy', 'a game', 'a ball']),
    q('What do you want for lunch?', ['I want ___ and ___.', 'I don’t want ___.'], ['pizza', 'fish', 'chicken', 'soup']),
    q('Have you got a pet?', ['Yes, I have. I’ve got a ___.', 'No, I haven’t.'], ['dog', 'cat', 'fish', 'rabbit']),
    q('What does your friend want?', ['He / She wants ___.', 'He / She doesn’t want ___.'], ['juice', 'water', 'an apple', 'a sandwich'])
  ],
  'months-weather': [
    q('When is your birthday?', ['My birthday is in ___.', 'It’s on the ___ of ___.'], ['first', 'second', 'third', 'twentieth']),
    q('What’s the weather like today?', ['It’s ___ today.', 'It isn’t ___.'], ['sunny', 'rainy', 'cloudy', 'windy']),
    q('What is your favourite season? Why?', ['My favourite season is ___ because…', 'In ___ it’s ___.'], ['spring', 'summer', 'autumn', 'winter']),
    q('What’s the weather like in winter?', ['In winter it’s ___.', 'It’s cold and ___.'], ['cold', 'snowy', 'icy', 'foggy']),
    q('What do you do in summer?', ['In summer I ___.', 'When it’s hot, I ___.'], ['swim', 'play outside', 'eat ice cream', 'go to the beach']),
    q('Which month is the hottest here?', ['___ is the hottest month.', 'It’s hot in ___.'], ['June', 'July', 'August', 'May'])
  ],
  'food-drink': [
    q('What’s in your fridge at home?', ['There’s some ___.', 'There are some ___.'], ['milk', 'cheese', 'eggs', 'apples']),
    q('What would you like to eat for lunch?', ['I’d like some ___, please.', 'Can I have a ___, please?'], ['soup', 'pasta', 'sandwich', 'pizza']),
    q('What would you like to drink?', ['I’d like ___, please.', 'I’ll have ___, please.'], ['water', 'orange juice', 'milk', 'lemonade']),
    q('Is there any food in your bag today?', ['Yes, there is. There’s ___.', 'No, there isn’t any ___.'], ['an apple', 'a banana', 'some bread', 'some cookies']),
    q('What’s your favourite food? What’s in it?', ['My favourite food is ___.', 'There’s some ___ in it.'], ['cheese', 'tomato', 'rice', 'chicken']),
    q('Be the waiter! Ask your partner what they want.', ['Are you ready to ___?', 'What would you like to ___?'], ['order', 'drink', 'eat', 'have'])
  ]
};

export const DICE_QUESTIONS = [];

export function applyLesson(id){
  DICE_QUESTIONS.length = 0;
  DICE_QUESTIONS.push(...(LESSON_CONTENT[id] || LESSON_CONTENT.comparatives).map(x => ({ ...x })));
}
applyLesson('comparatives');
