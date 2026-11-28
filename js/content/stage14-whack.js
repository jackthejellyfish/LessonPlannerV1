/* =========================================================
   LESSON CONTENT — Stage 14 (Whack-a-Monster)

   This game's angle is a snap TWO-WAY CHOICE: one sentence, two
   candidate words, pick the right one. Deliberately the quickest
   question type in the set, because the game behind it is the
   fastest — a long open-ended question would leave the class waiting
   around before a 15-second scramble.

   The wrong option in each pair is a real mistake learners make
   (regular -er on an irregular, a double consonant missed, "will to"),
   not a nonsense word, so getting it right means something.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'My brother is taller / more tall than me.'", answer: "taller" },
      { prompt: "Which is correct? 'This book is more interesting / interestinger.'", answer: "more interesting" },
      { prompt: "Which is correct? 'Today is hoter / hotter than yesterday.'", answer: "hotter" },
      { prompt: "Which is correct? 'She is happyer / happier today.'", answer: "happier" },
      { prompt: "Which is correct? 'A plane is more fast / faster than a car.'", answer: "faster" },
      { prompt: "Which is correct? 'Your idea is gooder / better.'", answer: "better" },
      { prompt: "Which is correct? 'My bag is heavyer / heavier.'", answer: "heavier" },
      { prompt: "Which is correct? 'That was badder / worse.'", answer: "worse" },
      { prompt: "Which is correct? 'The sea is safer / more safe here.'", answer: "safer" },
      { prompt: "Which is correct? 'Maths is more easy / easier for me.'", answer: "easier" },
      { prompt: "Which is correct? 'A tiger is stronger / more strong than a cat.'", answer: "stronger" },
      { prompt: "Which is correct? 'My dog is funnier / funnyer than yours.'", answer: "funnier" },
      { prompt: "Which is correct? 'This road is longer / more long.'", answer: "longer" },
      { prompt: "Which is correct? 'Gold is more expensive / expensiver than silver.'", answer: "more expensive", choices: ["more expensive", "expensiver"] },
      { prompt: "Which is correct? 'Your bag is biger / bigger than mine.'", answer: "bigger" }
    ]
  },
  health: {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'You should / shouldn't rest when you are ill.'", answer: "should" },
      { prompt: "Which is correct? 'You should / shouldn't eat five burgers.'", answer: "shouldn't" },
      { prompt: "Which is correct? 'He should go / should goes to the doctor.'", answer: "should go" },
      { prompt: "Which is correct? 'She shouldn't stay / shouldn't stays up late.'", answer: "shouldn't stay" },
      { prompt: "Which is correct? 'With a fever you should / shouldn't go to school.'", answer: "shouldn't" },
      { prompt: "Which is correct? 'With a sore throat, drink hot tea / eat cold ice cream.'", answer: "drink hot tea", choices: ["drink hot tea", "eat cold ice cream"] },
      { prompt: "Which is correct? 'You should / shouldn't wash your hands.'", answer: "should" },
      { prompt: "Which is correct? 'With a toothache, see a dentist / see a mechanic.'", answer: "see a dentist" },
      { prompt: "Which is correct? 'They should / shoulds take some medicine.'", answer: "should" },
      { prompt: "Which is correct? 'You shouldn't carry / shouldn't carries heavy bags.'", answer: "shouldn't carry" },
      { prompt: "Which is correct? 'With a toothache you should / shouldn't eat sweets.'", answer: "shouldn't" },
      { prompt: "Which is correct? 'She should rest / should rests.'", answer: "should rest" },
      { prompt: "Which is correct? 'With a fever, stay in bed / go swimming.'", answer: "stay in bed" },
      { prompt: "Which is correct? 'He should see / should to see a doctor.'", answer: "should see", choices: ["should see", "should to see"] },
      { prompt: "Which is correct? 'What's the matter / What the matter?'", answer: "What's the matter" }
    ]
  },
  'comparatives-superlatives': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'He is the tallest / the most tall boy.'", answer: "the tallest" },
      { prompt: "Which is correct? 'That was the baddest / the worst day.'", answer: "the worst" },
      { prompt: "Which is correct? 'She is the goodest / the best singer.'", answer: "the best" },
      { prompt: "Which is correct? 'It is the most beautiful / the beautifulest city.'", answer: "the most beautiful", choices: ["the most beautiful", "the beautifulest"] },
      { prompt: "Which is correct? 'Today is the hottest / the hotest day.'", answer: "the hottest" },
      { prompt: "Which is correct? 'This is the easiest / the most easy question.'", answer: "the easiest" },
      { prompt: "Which is correct? 'He is the happiest / the happyest person here.'", answer: "the happiest" },
      { prompt: "Which is correct? 'That is the more expensive / the most expensive car.'", answer: "the most expensive" },
      { prompt: "Which is correct? 'She is the busiest / the busyest teacher.'", answer: "the busiest" },
      { prompt: "Which is correct? 'It is the biggest / the bigest dog.'", answer: "the biggest" },
      { prompt: "Which is correct? 'He is the youngest / the most young in his family.'", answer: "the youngest" },
      { prompt: "Which is correct? 'This is the cheapest / the cheapiest shop.'", answer: "the cheapest" },
      { prompt: "Which is correct? 'A car is faster / more fast than a bike.'", answer: "faster" },
      { prompt: "Which is correct? 'She is the most famous / the famousest singer.'", answer: "the most famous", choices: ["the most famous", "the famousest"] },
      { prompt: "Which is correct? 'It was the funniest / the funnyest film.'", answer: "the funniest" }
    ]
  },
  'will-wont': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'I will / will to help you.'", answer: "will" },
      { prompt: "Which is correct? 'She will come / will comes tomorrow.'", answer: "will come" },
      { prompt: "Which is correct? 'They won't / don't will be late.'", answer: "won't" },
      { prompt: "Which is correct? 'He wills / will phone you.'", answer: "will" },
      { prompt: "Which is correct? 'Will you / Do you will help me?'", answer: "Will you" },
      { prompt: "Which is correct? 'It will rain / will rains tomorrow.'", answer: "will rain" },
      { prompt: "Which is correct? 'We won't forget / won't forgets.'", answer: "won't forget" },
      { prompt: "Which is correct? 'She will not / not will come.'", answer: "will not" },
      { prompt: "Which is correct? 'They will be / will are happy.'", answer: "will be" },
      { prompt: "Which is correct? 'I'll / I will's see you later.'", answer: "I'll", choices: ["I'll", "I will's"] },
      { prompt: "Which is correct? 'I won't / willn't tell anyone.'", answer: "won't" },
      { prompt: "Which is correct? 'It will be / will is sunny.'", answer: "will be" },
      { prompt: "Which is correct? 'He will play / will plays football.'", answer: "will play" },
      { prompt: "Which is correct? 'Where will you / you will go?'", answer: "will you" },
      { prompt: "Which is correct? 'She won't be / won't is late.'", answer: "won't be" }
    ]
  },
  'present-perfect': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'I have / has visited Japan.'", answer: "have" },
      { prompt: "Which is correct? 'She have / has finished.'", answer: "has" },
      { prompt: "Which is correct? 'They have went / have gone home.'", answer: "have gone" },
      { prompt: "Which is correct? 'He has broke / has broken his arm.'", answer: "has broken" },
      { prompt: "Which is correct? 'We have saw / have seen that film.'", answer: "have seen" },
      { prompt: "Which is correct? 'Have / Has you ever been to Paris?'", answer: "Have" },
      { prompt: "Which is correct? 'I haven't did / haven't done it.'", answer: "haven't done" },
      { prompt: "Which is correct? 'She has buyed / has bought a bike.'", answer: "has bought" },
      { prompt: "Which is correct? 'It has stop / has stopped raining.'", answer: "has stopped" },
      { prompt: "Which is correct? 'They hasn't / haven't arrived.'", answer: "haven't" },
      { prompt: "Which is correct? 'I have ate / have eaten lunch.'", answer: "have eaten" },
      { prompt: "Which is correct? 'He has / have lost his keys.'", answer: "has" },
      { prompt: "Which is correct? 'We have flew / have flown to Japan.'", answer: "have flown" },
      { prompt: "Which is correct? 'Has / Have your brother finished?'", answer: "Has" },
      { prompt: "Which is correct? 'She has written / has wrote a song.'", answer: "has written" }
    ]
  },
  'amusement-park': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'I goed / went on a roller coaster.'", answer: "went" },
      { prompt: "Which is correct? 'We saw / seed a parade.'", answer: "saw" },
      { prompt: "Which is correct? 'She rode / rided the merry-go-round.'", answer: "rode" },
      { prompt: "Which is correct? 'They visited / visitted a petting zoo.'", answer: "visited" },
      { prompt: "Which is correct? 'The roller coaster was exciting / excited.'", answer: "exciting" },
      { prompt: "Which is correct? 'I was exciting / excited.'", answer: "excited" },
      { prompt: "Which is correct? 'The parade was boring / bored.'", answer: "boring" },
      { prompt: "Which is correct? 'My brother was boring / bored.'", answer: "bored" },
      { prompt: "Which is correct? 'The haunted house was scary / scared.'", answer: "scary" },
      { prompt: "Which is correct? 'We were amazing / amazed by the film.'", answer: "amazed" },
      { prompt: "Which is correct? 'We ate / eated candy floss.'", answer: "ate" },
      { prompt: "Which is correct? 'The fireworks were amazing / amazed.'", answer: "amazing" },
      { prompt: "Which is correct? 'I was tired / tiring after the park.'", answer: "tired" },
      { prompt: "Which is correct? 'He bought / buyed a souvenir.'", answer: "bought" },
      { prompt: "Which is correct? 'The ghost train was frightening / frightened.'", answer: "frightening" }
    ]
  },
  'party-fun': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'I will bake / bakes biscuits.'", answer: "bake" },
      { prompt: "Which is correct? 'Who will / wills set the table?'", answer: "will" },
      { prompt: "Which is correct? 'She won't / willn't draw posters.'", answer: "won't" },
      { prompt: "Which is correct? 'Will you help? — Yes, I will / Yes, I'll.'", answer: "Yes, I will" },
      { prompt: "Which is correct? 'He will choose / to choose the music.'", answer: "choose" },
      { prompt: "Which is correct? 'What will you / you will do for the party?'", answer: "will you" },
      { prompt: "Which is correct? 'Rosa will set / setting the table.'", answer: "set" },
      { prompt: "Which is correct? 'Will he order pizza? — No, he won't / don't.'", answer: "won't" },
      { prompt: "Which is correct? 'I'm full. I will / won't have dessert.'", answer: "won't" },
      { prompt: "Which is correct? 'We'll / We're will hang up the decorations.'", answer: "We'll" },
      { prompt: "Which is correct? 'Who will bring / brings the games?'", answer: "bring" },
      { prompt: "Which is correct? 'Will she bake biscuits? — No, she won't / doesn't.'", answer: "won't" },
      { prompt: "Which is correct? 'Tom will play / plays the music.'", answer: "play" },
      { prompt: "Which is correct? 'They will hang / hangs up the decorations.'", answer: "hang" },
      { prompt: "Which is correct? 'What will Tom / Tom will do?'", answer: "will Tom" }
    ]
  },
  'at-school': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'I've got / I's got a stapler.'", answer: "I've got" },
      { prompt: "Which is correct? 'She's got / She've got a paintbrush.'", answer: "She's got" },
      { prompt: "Which is correct? 'What have / has you got?'", answer: "have" },
      { prompt: "Which is correct? 'What have / has he got?'", answer: "has" },
      { prompt: "Which is correct? 'I want / wants pizza.'", answer: "want" },
      { prompt: "Which is correct? 'He want / wants fish.'", answer: "wants" },
      { prompt: "Which is correct? 'What do / does she want?'", answer: "does" },
      { prompt: "Which is correct? 'What does he want / wants?'", answer: "want" },
      { prompt: "Which is correct? 'You paint with a pencil sharpener / paintbrush.'", answer: "paintbrush" },
      { prompt: "Which is correct? 'I drink juice / steak.'", answer: "juice" },
      { prompt: "Which is correct? 'They've got / They's got a glue stick.'", answer: "They've got" },
      { prompt: "Which is correct? 'Mia want / wants soup.'", answer: "wants" },
      { prompt: "Which is correct? 'What do / does they want?'", answer: "do" },
      { prompt: "Which is correct? 'What has / have Tom got?'", answer: "has" },
      { prompt: "Which is correct? 'I want soup / a stapler for lunch.'", answer: "soup" }
    ]
  },
  'months-weather': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'My birthday is in / on May.'", answer: "in" },
      { prompt: "Which is correct? 'It's in / on the 2nd of May.'", answer: "on" },
      { prompt: "Which is correct? 'It's sunny / sun today.'", answer: "sunny" },
      { prompt: "Which is correct? 'the fiveth / fifth of June'", answer: "fifth" },
      { prompt: "Which is correct? 'It's snowy in winter / summer.'", answer: "winter" },
      { prompt: "Which is correct? 'the first / oneth of March'", answer: "first" },
      { prompt: "Which is correct? 'What's the weather like / likes?'", answer: "like" },
      { prompt: "Which is correct? 'August / august is hot.'", answer: "August" },
      { prompt: "Which is correct? 'It's windy / windly today.'", answer: "windy" },
      { prompt: "Which is correct? 'Flowers grow in spring / autumn.'", answer: "spring" },
      { prompt: "Which is correct? 'the second / twoth of June'", answer: "second" },
      { prompt: "Which is correct? 'It's cloudy / cloud today.'", answer: "cloudy" },
      { prompt: "Which is correct? 'My birthday is on / in the 9th of May.'", answer: "on" },
      { prompt: "Which is correct? 'It's hot in summer / winter.'", answer: "summer" },
      { prompt: "Which is correct? 'the third / threeth of March'", answer: "third" }
    ]
  },
  'food-drink': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'Is there a / any bread?'", answer: "any" },
      { prompt: "Which is correct? 'There are some / any cookies.'", answer: "some" },
      { prompt: "Which is correct? 'Is there a / an apple?'", answer: "an" },
      { prompt: "Which is correct? 'There isn't some / any juice.'", answer: "any" },
      { prompt: "Which is correct? 'Is / Are there any carrots?'", answer: "Are" },
      { prompt: "Which is correct? 'I'd like / likes water, please.'", answer: "like" },
      { prompt: "Which is correct? 'Can I have / has a pizza, please?'", answer: "have" },
      { prompt: "Which is correct? 'There's some rice / rices.'", answer: "rice" },
      { prompt: "Which is correct? 'Are there any potato / potatoes?'", answer: "potatoes" },
      { prompt: "Which is correct? 'Is / Are there any milk?'", answer: "Is" },
      { prompt: "Which is correct? 'There's some / any milk.'", answer: "some" },
      { prompt: "Which is correct? 'Is there an / a egg?'", answer: "an", choices: ["an", "a"] },
      { prompt: "Which is correct? 'There aren't any / some eggs.'", answer: "any" },
      { prompt: "Which is correct? 'Are / Is there any apples?'", answer: "Are" },
      { prompt: "Which is correct? 'Can I have some bread / breads?'", answer: "bread" }
    ]
  },
  'at-the-buffet': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'I had / have cereal yesterday.'", answer: "had" },
      { prompt: "Which is correct? 'What did you have / had for lunch?'", answer: "have" },
      { prompt: "Which is correct? 'How did the soup taste / tasted?'", answer: "taste" },
      { prompt: "Which is correct? 'How did the chicken wings taste? They / It tasted spicy.'", answer: "They" },
      { prompt: "Which is correct? 'How did the fruit salad taste? It / They tasted sweet.'", answer: "It" },
      { prompt: "Which is correct? 'Lemons taste sour / sweet.'", answer: "sour" },
      { prompt: "Which is correct? 'Chillies taste spicy / sweet.'", answer: "spicy" },
      { prompt: "Which is correct? 'Sugar tastes sweet / bitter.'", answer: "sweet" },
      { prompt: "Which is correct? 'Chips with lots of salt taste salty / sour.'", answer: "salty" },
      { prompt: "Which is correct? 'You drink lemonade / chicken wings.'", answer: "lemonade", choices: ["lemonade", "chicken wings"] },
      { prompt: "Which is correct? 'She had / haved fried rice.'", answer: "had" },
      { prompt: "Which is correct? 'What did he have / has for breakfast?'", answer: "have" },
      { prompt: "Which is correct? 'Coffee with no sugar tastes bitter / sweet.'", answer: "bitter" },
      { prompt: "Which is correct? 'Chicken wings with lots of oil taste greasy / sour.'", answer: "greasy" },
      { prompt: "Which is correct? 'How did / does the cereal taste yesterday?'", answer: "did" }
    ]
  },
  'at-the-market': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'He's got some / any grapes.'", answer: "some" },
      { prompt: "Which is correct? 'She hasn't got any / some mushrooms.'", answer: "any" },
      { prompt: "Which is correct? 'Have / Has you got any beef?'", answer: "Have" },
      { prompt: "Which is correct? 'Has / Have he got any milk?'", answer: "Has" },
      { prompt: "Which is correct? 'Has she got any cheese? — Yes, she has / Yes, she have.'", answer: "Yes, she has" },
      { prompt: "Which is correct? 'Have you got any lamb? — No, I haven't / No, I hasn't.'", answer: "No, I haven't" },
      { prompt: "Which is correct? 'What has / have she got?'", answer: "has" },
      { prompt: "Which is correct? 'I've got some milk / milks.'", answer: "milk" },
      { prompt: "Which is correct? 'They haven't / hasn't got any lemons.'", answer: "haven't" },
      { prompt: "Which is correct? 'Has the shop got any / some beef?'", answer: "any" },
      { prompt: "Which is correct? 'Pumpkins / Mushrooms are big and orange.'", answer: "Pumpkins" },
      { prompt: "Which is correct? 'Lemons / Watermelons are small, yellow and sour.'", answer: "Lemons" },
      { prompt: "Which is correct? 'Cheese and butter come from milk / grapes.'", answer: "milk" },
      { prompt: "Which is correct? 'What have / has they got?'", answer: "have" },
      { prompt: "Which is correct? 'She hasn't / haven't got any cucumbers.'", answer: "hasn't" }
    ]
  }
};

export const WHACK_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  WHACK_QUESTIONS.length = 0;
  WHACK_QUESTIONS.push(...data.WHACK_QUESTIONS);
}
applyLesson('comparatives');
