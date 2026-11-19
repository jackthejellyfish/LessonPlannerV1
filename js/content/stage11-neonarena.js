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
      { prompt: "What is the comparative of 'many'? (it's irregular!)", answer: "more" }
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
      { prompt: "They've got an earache.", answer: "They should see a doctor." }
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
      { prompt: "Say the opposite: 'the happiest'", answer: "the saddest" }
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
      { prompt: "Make it negative: 'My parents will agree.'", answer: "My parents won't agree." }
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
      { prompt: "Make it negative: 'I have read that book.'", answer: "I haven't read that book." }
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
      { prompt: "Make it past: 'You win a prize!'", answer: "You won a prize!" }
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
      { prompt: "Make it negative: 'Tom will bring games.'", answer: "Tom won't bring games." }
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
      { prompt: "Ask the question: 'Tom wants steak.'", answer: "What does Tom want?" }
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
      { prompt: "Which season? 'September, October, November'", answer: "autumn" }
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
