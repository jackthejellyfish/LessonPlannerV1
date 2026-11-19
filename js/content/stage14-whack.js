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
      { prompt: "Which is correct? 'Maths is more easy / easier for me.'", answer: "easier" }
    ]
  },
  health: {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'You should / shouldn't rest when you are ill.'", answer: "should" },
      { prompt: "Which is correct? 'You should / shouldn't eat five burgers.'", answer: "shouldn't" },
      { prompt: "Which is correct? 'He should go / should goes to the doctor.'", answer: "should go" },
      { prompt: "Which is correct? 'She shouldn't stay / shouldn't stays up late.'", answer: "shouldn't stay" },
      { prompt: "Which is correct? 'With a fever you should / shouldn't go to school.'", answer: "shouldn't" },
      { prompt: "Which is correct? 'With a sore throat, drink hot tea / eat cold ice cream.'", answer: "drink hot tea" },
      { prompt: "Which is correct? 'You should / shouldn't wash your hands.'", answer: "should" },
      { prompt: "Which is correct? 'With a toothache, see a dentist / see a mechanic.'", answer: "see a dentist" },
      { prompt: "Which is correct? 'They should / shoulds take some medicine.'", answer: "should" },
      { prompt: "Which is correct? 'You shouldn't carry / shouldn't carries heavy bags.'", answer: "shouldn't carry" }
    ]
  },
  'comparatives-superlatives': {
    WHACK_QUESTIONS: [
      { prompt: "Which is correct? 'He is the tallest / the most tall boy.'", answer: "the tallest" },
      { prompt: "Which is correct? 'That was the baddest / the worst day.'", answer: "the worst" },
      { prompt: "Which is correct? 'She is the goodest / the best singer.'", answer: "the best" },
      { prompt: "Which is correct? 'It is the most beautiful / the beautifulest city.'", answer: "the most beautiful" },
      { prompt: "Which is correct? 'Today is the hottest / the hotest day.'", answer: "the hottest" },
      { prompt: "Which is correct? 'This is the easiest / the most easy question.'", answer: "the easiest" },
      { prompt: "Which is correct? 'He is the happiest / the happyest person here.'", answer: "the happiest" },
      { prompt: "Which is correct? 'That is the more expensive / the most expensive car.'", answer: "the most expensive" },
      { prompt: "Which is correct? 'She is the busiest / the busyest teacher.'", answer: "the busiest" },
      { prompt: "Which is correct? 'It is the biggest / the bigest dog.'", answer: "the biggest" }
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
      { prompt: "Which is correct? 'I'll / I will's see you later.'", answer: "I'll" }
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
      { prompt: "Which is correct? 'They hasn't / haven't arrived.'", answer: "haven't" }
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
      { prompt: "Which is correct? 'We were amazing / amazed by the film.'", answer: "amazed" }
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
      { prompt: "Which is correct? 'We'll / We're will hang up the decorations.'", answer: "We'll" }
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
      { prompt: "Which is correct? 'I drink juice / steak.'", answer: "juice" }
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
      { prompt: "Which is correct? 'Flowers grow in spring / autumn.'", answer: "spring" }
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
