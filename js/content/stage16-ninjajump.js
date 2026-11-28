/* =========================================================
   LESSON CONTENT — Stage 16 (Ninja Jump)
   "Put the words in order" questions: the team says the whole
   sentence. A different shape from every other game's bank.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: than / is / a cat / a tiger / stronger", answer: "A tiger is stronger than a cat." },
      { prompt: "Put the words in order: bigger / my / is / house / than / yours", answer: "My house is bigger than yours." },
      { prompt: "Put the words in order: more / is / than / this film / exciting / that one", answer: "This film is more exciting than that one." },
      { prompt: "Put the words in order: than / ninjas / are / faster / dogs", answer: "Ninjas are faster than dogs." },
      { prompt: "Put the words in order: heavier / an elephant / a horse / is / than", answer: "An elephant is heavier than a horse." },
      { prompt: "Put the words in order: is / my sister / me / than / taller", answer: "My sister is taller than me." },
      { prompt: "Put the words in order: than / better / pizza / is / salad", answer: "Pizza is better than salad. (or the other way round!)" },
      { prompt: "Put the words in order: is / than / today / hotter / yesterday", answer: "Today is hotter than yesterday." },
      { prompt: "Put the words in order: more / maths / difficult / is / than / art", answer: "Maths is more difficult than art." },
      { prompt: "Put the words in order: than / the city / noisier / the village / is", answer: "The city is noisier than the village." },
      { prompt: "Put the words in order: older / my brother / than / is / me", answer: "My brother is older than me." },
      { prompt: "Put the words in order: is / a mouse / than / smaller / a cat", answer: "A mouse is smaller than a cat." },
      { prompt: "Put the words in order: a bus / is / slower / than / a train", answer: "A bus is slower than a train." },
      { prompt: "Put the words in order: more / is / than / my bedroom / colourful / the kitchen", answer: "My bedroom is more colourful than the kitchen." },
      { prompt: "Put the words in order: winter / colder / is / than / autumn", answer: "Winter is colder than autumn." }
    ]
  },
  health: {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: should / you / some medicine / take", answer: "You should take some medicine." },
      { prompt: "Put the words in order: in bed / he / stay / should", answer: "He should stay in bed." },
      { prompt: "Put the words in order: shouldn't / she / sweets / eat", answer: "She shouldn't eat sweets." },
      { prompt: "Put the words in order: the matter / what's / ?", answer: "What's the matter?" },
      { prompt: "Put the words in order: a dentist / see / they / should", answer: "They should see a dentist." },
      { prompt: "Put the words in order: got / I've / a sore throat", answer: "I've got a sore throat." },
      { prompt: "Put the words in order: shouldn't / you / football / play", answer: "You shouldn't play football." },
      { prompt: "Put the words in order: I / should / what / do / ?", answer: "What should I do?" },
      { prompt: "Put the words in order: hot tea / we / drink / should", answer: "We should drink hot tea." },
      { prompt: "Put the words in order: has / he / a fever / got", answer: "He has got a fever." },
      { prompt: "Put the words in order: shouldn't / he / go / to school", answer: "He shouldn't go to school." },
      { prompt: "Put the words in order: a headache / she's / got", answer: "She's got a headache." },
      { prompt: "Put the words in order: should / we / our hands / wash", answer: "We should wash our hands." },
      { prompt: "Put the words in order: the matter / what's / with you / ?", answer: "What's the matter with you?" },
      { prompt: "Put the words in order: go / should / I / to the doctor / ?", answer: "Should I go to the doctor?" }
    ]
  },
  'comparatives-superlatives': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: the / is / tallest / Tom / in the class", answer: "Tom is the tallest in the class." },
      { prompt: "Put the words in order: the best / this is / pizza / in town", answer: "This is the best pizza in town." },
      { prompt: "Put the words in order: than / a bus / is / a plane / faster", answer: "A plane is faster than a bus." },
      { prompt: "Put the words in order: the most / she / is / ninja / famous", answer: "She is the most famous ninja." },
      { prompt: "Put the words in order: the worst / that / day / was / ever", answer: "That was the worst day ever." },
      { prompt: "Put the words in order: is / the / city / biggest / which / ?", answer: "Which is the biggest city?" },
      { prompt: "Put the words in order: cheaper / this bag / is / than / that one", answer: "This bag is cheaper than that one." },
      { prompt: "Put the words in order: the / easiest / level / is / this", answer: "This is the easiest level." },
      { prompt: "Put the words in order: the funniest / my dad / person / is / I know", answer: "My dad is the funniest person I know." },
      { prompt: "Put the words in order: more / than / is / gold / expensive / silver", answer: "Gold is more expensive than silver." },
      { prompt: "Put the words in order: the oldest / my grandma / is / in my family", answer: "My grandma is the oldest in my family." },
      { prompt: "Put the words in order: than / slower / a turtle / is / a rabbit", answer: "A turtle is slower than a rabbit." },
      { prompt: "Put the words in order: is / the longest / which / river / ?", answer: "Which is the longest river?" },
      { prompt: "Put the words in order: the cheapest / this / is / shop", answer: "This is the cheapest shop." },
      { prompt: "Put the words in order: happier / I / today / am / than yesterday", answer: "I am happier today than yesterday." }
    ]
  },
  'will-wont': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: will / tomorrow / it / rain", answer: "It will rain tomorrow." },
      { prompt: "Put the words in order: won't / I / anyone / tell", answer: "I won't tell anyone." },
      { prompt: "Put the words in order: help / I'll / you", answer: "I'll help you." },
      { prompt: "Put the words in order: you / will / come / to my party / ?", answer: "Will you come to my party?" },
      { prompt: "Put the words in order: be / she / won't / late", answer: "She won't be late." },
      { prompt: "Put the words in order: the match / will / who / win / ?", answer: "Who will win the match?" },
      { prompt: "Put the words in order: will / robots / our homework / do", answer: "Robots will do our homework." },
      { prompt: "Put the words in order: won't / forget / we / your birthday", answer: "We won't forget your birthday." },
      { prompt: "Put the words in order: think / I / pass / you'll / the test", answer: "I think you'll pass the test." },
      { prompt: "Put the words in order: open / the window / I'll", answer: "I'll open the window." },
      { prompt: "Put the words in order: will / be / it / sunny / tomorrow", answer: "It will be sunny tomorrow." },
      { prompt: "Put the words in order: won't / they / late / be", answer: "They won't be late." },
      { prompt: "Put the words in order: you / will / me / help / ?", answer: "Will you help me?" },
      { prompt: "Put the words in order: carry / I'll / your bag", answer: "I'll carry your bag." },
      { prompt: "Put the words in order: will / where / you / go / ?", answer: "Where will you go?" }
    ]
  },
  'present-perfect': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: have / I / to Japan / been", answer: "I have been to Japan." },
      { prompt: "Put the words in order: ever / you / have / a horse / ridden / ?", answer: "Have you ever ridden a horse?" },
      { prompt: "Put the words in order: has / she / her homework / finished", answer: "She has finished her homework." },
      { prompt: "Put the words in order: never / they / have / sushi / eaten", answer: "They have never eaten sushi." },
      { prompt: "Put the words in order: lost / he / has / his keys", answer: "He has lost his keys." },
      { prompt: "Put the words in order: we / that film / seen / have / already", answer: "We have already seen that film." },
      { prompt: "Put the words in order: just / it / stopped / has / raining", answer: "It has just stopped raining." },
      { prompt: "Put the words in order: haven't / I / my lunch / eaten / yet", answer: "I haven't eaten my lunch yet." },
      { prompt: "Put the words in order: arrived / the bus / has / ?", answer: "Has the bus arrived?" },
      { prompt: "Put the words in order: you / how many / have / countries / visited / ?", answer: "How many countries have you visited?" },
      { prompt: "Put the words in order: have / I / my homework / done", answer: "I have done my homework." },
      { prompt: "Put the words in order: been / she / has / to Paris", answer: "She has been to Paris." },
      { prompt: "Put the words in order: you / have / seen / ever / snow / ?", answer: "Have you ever seen snow?" },
      { prompt: "Put the words in order: has / the film / started / ?", answer: "Has the film started?" },
      { prompt: "Put the words in order: never / I / have / a whale / seen", answer: "I have never seen a whale." }
    ]
  },
  'amusement-park': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: went / we / to the amusement park", answer: "We went to the amusement park." },
      { prompt: "Put the words in order: was / the roller coaster / exciting", answer: "The roller coaster was exciting." },
      { prompt: "Put the words in order: I / scared / was / in the haunted house", answer: "I was scared in the haunted house." },
      { prompt: "Put the words in order: saw / they / a parade", answer: "They saw a parade." },
      { prompt: "Put the words in order: the 3D film / how / was / ?", answer: "How was the 3D film?" },
      { prompt: "Put the words in order: rode / she / the merry-go-round", answer: "She rode the merry-go-round." },
      { prompt: "Put the words in order: bored / my brother / was / in the queue", answer: "My brother was bored in the queue." },
      { prompt: "Put the words in order: did / what / you / do / ?", answer: "What did you do?" },
      { prompt: "Put the words in order: amazing / the show / was", answer: "The show was amazing." },
      { prompt: "Put the words in order: visited / we / the petting zoo", answer: "We visited the petting zoo." },
      { prompt: "Put the words in order: took / we / lots of photos", answer: "We took lots of photos." },
      { prompt: "Put the words in order: was / the parade / boring", answer: "The parade was boring." },
      { prompt: "Put the words in order: excited / was / I / on the ride", answer: "I was excited on the ride." },
      { prompt: "Put the words in order: you / how / did / feel / ?", answer: "How did you feel?" },
      { prompt: "Put the words in order: ate / she / candy floss", answer: "She ate candy floss." }
    ]
  },
  'party-fun': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: will / who / the table / set / ?", answer: "Who will set the table?" },
      { prompt: "Put the words in order: bake / I'll / biscuits", answer: "I'll bake biscuits." },
      { prompt: "Put the words in order: you / will / bring / games / ?", answer: "Will you bring games?" },
      { prompt: "Put the words in order: will / Rosa / the balloons / blow up", answer: "Rosa will blow up the balloons." },
      { prompt: "Put the words in order: won't / he / pizza / order", answer: "He won't order pizza." },
      { prompt: "Put the words in order: what / you / will / do / ?", answer: "What will you do?" },
      { prompt: "Put the words in order: the music / will / choose / Tom", answer: "Tom will choose the music." },
      { prompt: "Put the words in order: hang up / we'll / the decorations", answer: "We'll hang up the decorations." },
      { prompt: "Put the words in order: draw / she'll / the posters", answer: "She'll draw the posters." },
      { prompt: "Put the words in order: will / the games / who / set up / ?", answer: "Who will set up the games?" },
      { prompt: "Put the words in order: will / Ann / bake / biscuits", answer: "Ann will bake biscuits." },
      { prompt: "Put the words in order: who / the pizza / will / order / ?", answer: "Who will order the pizza?" },
      { prompt: "Put the words in order: won't / I / the music / choose", answer: "I won't choose the music." },
      { prompt: "Put the words in order: they / will / hang up / the decorations / ?", answer: "Will they hang up the decorations?" },
      { prompt: "Put the words in order: set / we'll / the table", answer: "We'll set the table." }
    ]
  },
  'at-school': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: got / what / you / have / ?", answer: "What have you got?" },
      { prompt: "Put the words in order: a / I've / got / stapler", answer: "I've got a stapler." },
      { prompt: "Put the words in order: has / what / got / she / ?", answer: "What has she got?" },
      { prompt: "Put the words in order: got / he's / a / paintbrush", answer: "He's got a paintbrush." },
      { prompt: "Put the words in order: want / you / what / do / ?", answer: "What do you want?" },
      { prompt: "Put the words in order: pizza / want / I", answer: "I want pizza." },
      { prompt: "Put the words in order: does / want / what / he / ?", answer: "What does he want?" },
      { prompt: "Put the words in order: fish / wants / she", answer: "She wants fish." },
      { prompt: "Put the words in order: a / glue stick / we've / got", answer: "We've got a glue stick." },
      { prompt: "Put the words in order: wants / Tom / soup / and / juice", answer: "Tom wants soup and juice." },
      { prompt: "Put the words in order: they / what / got / have / ?", answer: "What have they got?" },
      { prompt: "Put the words in order: wants / Mia / chicken / and / juice", answer: "Mia wants chicken and juice." },
      { prompt: "Put the words in order: got / she's / a / marker pen", answer: "She's got a marker pen." },
      { prompt: "Put the words in order: does / want / what / Tom / ?", answer: "What does Tom want?" },
      { prompt: "Put the words in order: colouring pencils / got / we've", answer: "We've got colouring pencils." }
    ]
  },
  'months-weather': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: birthday / your / when's / ?", answer: "When's your birthday?" },
      { prompt: "Put the words in order: in / is / my birthday / May", answer: "My birthday is in May." },
      { prompt: "Put the words in order: the / it's / of June / tenth / on", answer: "It's on the tenth of June." },
      { prompt: "Put the words in order: like / what's / weather / the / ?", answer: "What's the weather like?" },
      { prompt: "Put the words in order: sunny / it's / and / hot", answer: "It's sunny and hot." },
      { prompt: "Put the words in order: cold / in / it's / winter", answer: "It's cold in winter." },
      { prompt: "Put the words in order: favourite / what's / season / your / ?", answer: "What's your favourite season?" },
      { prompt: "Put the words in order: fall / leaves / autumn / in", answer: "Leaves fall in autumn." },
      { prompt: "Put the words in order: today / it's / windy", answer: "It's windy today." },
      { prompt: "Put the words in order: on / Christmas / is / the 25th of December", answer: "Christmas is on the 25th of December." },
      { prompt: "Put the words in order: is / my birthday / in / August", answer: "My birthday is in August." },
      { prompt: "Put the words in order: rainy / it's / today", answer: "It's rainy today." },
      { prompt: "Put the words in order: the / it's / of May / first", answer: "It's the first of May." },
      { prompt: "Put the words in order: hot / in / it's / summer", answer: "It's hot in summer." },
      { prompt: "Put the words in order: the date / what's / today / ?", answer: "What's the date today?" }
    ]
  },
  'food-drink': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: bread / there / any / is / ?", answer: "Is there any bread?" },
      { prompt: "Put the words in order: some / there are / cookies", answer: "There are some cookies." },
      { prompt: "Put the words in order: any / there / carrots / are / ?", answer: "Are there any carrots?" },
      { prompt: "Put the words in order: have / can I / a sandwich / please / ?", answer: "Can I have a sandwich, please?", choices: ["Can I have a sandwich, please?", "Can I a sandwich have, please?", "Have I can a sandwich, please?"] },
      { prompt: "Put the words in order: to order / you / are / ready / ?", answer: "Are you ready to order?" },
      { prompt: "Put the words in order: would / what / to drink / you like / ?", answer: "What would you like to drink?" },
      { prompt: "Put the words in order: water / I'd like / please", answer: "I'd like water, please.", choices: ["I'd like water, please.", "I'd like please, water.", "Water, I'd like please."] },
      { prompt: "Put the words in order: isn't / any / there / milk", answer: "There isn't any milk." },
      { prompt: "Put the words in order: an / there's / apple", answer: "There's an apple." },
      { prompt: "Put the words in order: I'll have / please / a cheese pizza", answer: "I'll have a cheese pizza, please.", choices: ["I'll have a cheese pizza, please.", "I'll a cheese pizza have, please.", "A cheese pizza, I'll have please."] },
      { prompt: "Put the words in order: any / there / eggs / are / ?", answer: "Are there any eggs?" },
      { prompt: "Put the words in order: some / there's / rice", answer: "There's some rice." },
      { prompt: "Put the words in order: aren't / any / there / apples", answer: "There aren't any apples." },
      { prompt: "Put the words in order: help / can I / you / ?", answer: "Can I help you?" },
      { prompt: "Put the words in order: I'll have / some / soup", answer: "I'll have some soup." }
    ]
  },
  'at-the-buffet': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: have / for breakfast / what / you / did / ?", answer: "What did you have for breakfast?" },
      { prompt: "Put the words in order: had / I / scrambled eggs", answer: "I had scrambled eggs." },
      { prompt: "Put the words in order: the fruit salad / did / taste / how / ?", answer: "How did the fruit salad taste?" },
      { prompt: "Put the words in order: tasted / it / sweet", answer: "It tasted sweet." },
      { prompt: "Put the words in order: spicy / they / tasted", answer: "They tasted spicy." },
      { prompt: "Put the words in order: had / she / fried rice / for lunch", answer: "She had fried rice for lunch." },
      { prompt: "Put the words in order: for lunch / did / what / he / have / ?", answer: "What did he have for lunch?" },
      { prompt: "Put the words in order: the lemonade / sour / tasted", answer: "The lemonade tasted sour." },
      { prompt: "Put the words in order: we / tuna sandwiches / had", answer: "We had tuna sandwiches." },
      { prompt: "Put the words in order: the chicken wings / how / taste / did / ?", answer: "How did the chicken wings taste?" },
      { prompt: "Put the words in order: tasted / bitter / the grapefruit juice", answer: "The grapefruit juice tasted bitter." },
      { prompt: "Put the words in order: had / they / cereal / for breakfast", answer: "They had cereal for breakfast." },
      { prompt: "Put the words in order: the chips / salty / tasted", answer: "The chips tasted salty." },
      { prompt: "Put the words in order: Tom / have / what / did / ?", answer: "What did Tom have?" },
      { prompt: "Put the words in order: the fried rice / greasy / tasted", answer: "The fried rice tasted greasy." }
    ]
  },
  'at-the-market': {
    JUMP_QUESTIONS: [
      { prompt: "Put the words in order: got / he's / some grapes", answer: "He's got some grapes." },
      { prompt: "Put the words in order: hasn't / she / any mushrooms / got", answer: "She hasn't got any mushrooms." },
      { prompt: "Put the words in order: got / any beef / you / have / ?", answer: "Have you got any beef?" },
      { prompt: "Put the words in order: what / got / she / has / ?", answer: "What has she got?" },
      { prompt: "Put the words in order: has / he / any milk / got / ?", answer: "Has he got any milk?" },
      { prompt: "Put the words in order: some cheese / got / I've", answer: "I've got some cheese." },
      { prompt: "Put the words in order: haven't / we / any lemons / got", answer: "We haven't got any lemons." },
      { prompt: "Put the words in order: they've / some pumpkins / got", answer: "They've got some pumpkins." },
      { prompt: "Put the words in order: the farmer / got / what / has / ?", answer: "What has the farmer got?" },
      { prompt: "Put the words in order: got / any yoghurt / has / Mia / ?", answer: "Has Mia got any yoghurt?" },
      { prompt: "Put the words in order: got / some cucumbers / she's", answer: "She's got some cucumbers." },
      { prompt: "Put the words in order: any butter / I / got / haven't", answer: "I haven't got any butter." },
      { prompt: "Put the words in order: you / got / have / any watermelons / ?", answer: "Have you got any watermelons?" },
      { prompt: "Put the words in order: hasn't / Tom / got / any lamb", answer: "Tom hasn't got any lamb." },
      { prompt: "Put the words in order: got / some milk / we've", answer: "We've got some milk." }
    ]
  }
};

export const JUMP_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  JUMP_QUESTIONS.length = 0;
  JUMP_QUESTIONS.push(...data.JUMP_QUESTIONS);
}
applyLesson('comparatives');
