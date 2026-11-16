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
      { prompt: "Which is right? 'My brother is taller / more tall than me.'", answer: "taller" },
      { prompt: "Which is right? 'This book is more interesting / interestinger.'", answer: "more interesting" },
      { prompt: "Which is right? 'Today is hoter / hotter than yesterday.'", answer: "hotter" },
      { prompt: "Which is right? 'She is happyer / happier today.'", answer: "happier" },
      { prompt: "Which is right? 'A plane is more fast / faster than a car.'", answer: "faster" },
      { prompt: "Which is right? 'Your idea is gooder / better.'", answer: "better" },
      { prompt: "Which is right? 'My bag is heavyer / heavier.'", answer: "heavier" },
      { prompt: "Which is right? 'That was badder / worse.'", answer: "worse" },
      { prompt: "Which is right? 'The sea is safer / more safe here.'", answer: "safer" },
      { prompt: "Which is right? 'Maths is more easy / easier for me.'", answer: "easier" }
    ]
  },
  health: {
    WHACK_QUESTIONS: [
      { prompt: "Which is right? 'You should / shouldn't rest when you are ill.'", answer: "should" },
      { prompt: "Which is right? 'You should / shouldn't eat five burgers.'", answer: "shouldn't" },
      { prompt: "Which is right? 'He should go / should goes to the doctor.'", answer: "should go" },
      { prompt: "Which is right? 'She shouldn't stay / shouldn't stays up late.'", answer: "shouldn't stay" },
      { prompt: "Which is right? 'With a fever you should / shouldn't go to school.'", answer: "shouldn't" },
      { prompt: "Which is right? 'With a sore throat, drink hot tea / eat cold ice cream.'", answer: "drink hot tea" },
      { prompt: "Which is right? 'You should / shouldn't wash your hands.'", answer: "should" },
      { prompt: "Which is right? 'With a toothache, see a dentist / see a mechanic.'", answer: "see a dentist" },
      { prompt: "Which is right? 'They should / shoulds take some medicine.'", answer: "should" },
      { prompt: "Which is right? 'You shouldn't carry / shouldn't carries heavy bags.'", answer: "shouldn't carry" }
    ]
  },
  'comparatives-superlatives': {
    WHACK_QUESTIONS: [
      { prompt: "Which is right? 'He is the tallest / the most tall boy.'", answer: "the tallest" },
      { prompt: "Which is right? 'That was the baddest / the worst day.'", answer: "the worst" },
      { prompt: "Which is right? 'She is the goodest / the best singer.'", answer: "the best" },
      { prompt: "Which is right? 'It is the most beautiful / the beautifulest city.'", answer: "the most beautiful" },
      { prompt: "Which is right? 'Today is the hottest / the hotest day.'", answer: "the hottest" },
      { prompt: "Which is right? 'This is the easiest / the most easy question.'", answer: "the easiest" },
      { prompt: "Which is right? 'He is the happiest / the happyest person here.'", answer: "the happiest" },
      { prompt: "Which is right? 'That is the more expensive / the most expensive car.'", answer: "the most expensive" },
      { prompt: "Which is right? 'She is the busiest / the busyest teacher.'", answer: "the busiest" },
      { prompt: "Which is right? 'It is the biggest / the bigest dog.'", answer: "the biggest" }
    ]
  },
  'will-wont': {
    WHACK_QUESTIONS: [
      { prompt: "Which is right? 'I will / will to help you.'", answer: "will" },
      { prompt: "Which is right? 'She will come / will comes tomorrow.'", answer: "will come" },
      { prompt: "Which is right? 'They won't / don't will be late.'", answer: "won't" },
      { prompt: "Which is right? 'He wills / will phone you.'", answer: "will" },
      { prompt: "Which is right? 'Will you / Do you will help me?'", answer: "Will you" },
      { prompt: "Which is right? 'It will rain / will rains tomorrow.'", answer: "will rain" },
      { prompt: "Which is right? 'We won't forget / won't forgets.'", answer: "won't forget" },
      { prompt: "Which is right? 'She will not / not will come.'", answer: "will not" },
      { prompt: "Which is right? 'They will be / will are happy.'", answer: "will be" },
      { prompt: "Which is right? 'I'll / I will's see you later.'", answer: "I'll" }
    ]
  },
  'present-perfect': {
    WHACK_QUESTIONS: [
      { prompt: "Which is right? 'I have / has visited Japan.'", answer: "have" },
      { prompt: "Which is right? 'She have / has finished.'", answer: "has" },
      { prompt: "Which is right? 'They have went / have gone home.'", answer: "have gone" },
      { prompt: "Which is right? 'He has broke / has broken his arm.'", answer: "has broken" },
      { prompt: "Which is right? 'We have saw / have seen that film.'", answer: "have seen" },
      { prompt: "Which is right? 'Have / Has you ever been to Paris?'", answer: "Have" },
      { prompt: "Which is right? 'I haven't did / haven't done it.'", answer: "haven't done" },
      { prompt: "Which is right? 'She has buyed / has bought a bike.'", answer: "has bought" },
      { prompt: "Which is right? 'It has stop / has stopped raining.'", answer: "has stopped" },
      { prompt: "Which is right? 'They hasn't / haven't arrived.'", answer: "haven't" }
    ]
  },
  'amusement-park': {
    WHACK_QUESTIONS: [
      { prompt: "Which is right? 'I goed / went on a roller coaster.'", answer: "went" },
      { prompt: "Which is right? 'We saw / seed a parade.'", answer: "saw" },
      { prompt: "Which is right? 'She rode / rided the merry-go-round.'", answer: "rode" },
      { prompt: "Which is right? 'They visited / visitted a petting zoo.'", answer: "visited" },
      { prompt: "Which is right? 'The roller coaster was exciting / excited.'", answer: "exciting" },
      { prompt: "Which is right? 'I was exciting / excited.'", answer: "excited" },
      { prompt: "Which is right? 'The parade was boring / bored.'", answer: "boring" },
      { prompt: "Which is right? 'My brother was boring / bored.'", answer: "bored" },
      { prompt: "Which is right? 'The haunted house was scary / scared.'", answer: "scary" },
      { prompt: "Which is right? 'We were amazing / amazed by the film.'", answer: "amazed" }
    ]
  },
  'party-fun': {
    WHACK_QUESTIONS: [
      { prompt: "Which is right? 'I will bake / bakes biscuits.'", answer: "bake" },
      { prompt: "Which is right? 'Who will / wills set the table?'", answer: "will" },
      { prompt: "Which is right? 'She won't / willn't draw posters.'", answer: "won't" },
      { prompt: "Which is right? 'Will you help? — Yes, I will / Yes, I'll.'", answer: "Yes, I will" },
      { prompt: "Which is right? 'He will choose / to choose the music.'", answer: "choose" },
      { prompt: "Which is right? 'What will you / you will do for the party?'", answer: "will you" },
      { prompt: "Which is right? 'Rosa will set / setting the table.'", answer: "set" },
      { prompt: "Which is right? 'Will he order pizza? — No, he won't / don't.'", answer: "won't" },
      { prompt: "Which is right? 'I'm full. I will / won't have dessert.'", answer: "won't" },
      { prompt: "Which is right? 'We'll / We're will hang up the decorations.'", answer: "We'll" }
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
