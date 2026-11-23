/* =========================================================
   LESSON CONTENT — Stage 13 (Hoop Shot)

   This game's angle is QUESTION FORMS: turning a statement into a
   question, or asking for information. No other stage drills that —
   the games before it all ask a learner to produce or correct a
   statement — so playing six games in a row doesn't become the same
   exercise six times.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    HOOP_QUESTIONS: [
      { prompt: "Make it a question: 'Tom is taller than Sam.'", answer: "Is Tom taller than Sam?" },
      { prompt: "Make it a question: 'The car is faster than the bus.'", answer: "Is the car faster than the bus?" },
      { prompt: "Make it a question: 'Maths is harder than English.'", answer: "Is maths harder than English?" },
      { prompt: "Make it a question: 'Your bag is heavier than mine.'", answer: "Is your bag heavier than mine?" },
      { prompt: "Make it a question: 'Summer is hotter than winter.'", answer: "Is summer hotter than winter?" },
      { prompt: "Make it a question: 'Dogs are noisier than cats.'", answer: "Are dogs noisier than cats?" },
      { prompt: "Make it a question: 'He is older than you.'", answer: "Is he older than you?" },
      { prompt: "Make it a question: 'The film was better than the book.'", answer: "Was the film better than the book?" },
      { prompt: "Make it a question: 'They were busier yesterday.'", answer: "Were they busier yesterday?" },
      { prompt: "Ask your partner which is faster, a bike or a motorbike.", answer: "Which is faster, a bike or a motorbike?" }
    ]
  },
  health: {
    HOOP_QUESTIONS: [
      { prompt: "Make it a question: 'He should see a dentist.'", answer: "Should he see a dentist?" },
      { prompt: "Make it a question: 'I should stay in bed.'", answer: "Should I stay in bed?" },
      { prompt: "Make it a question: 'She should take some medicine.'", answer: "Should she take some medicine?" },
      { prompt: "Make it a question: 'We should call a doctor.'", answer: "Should we call a doctor?" },
      { prompt: "Make it a question: 'They should rest.'", answer: "Should they rest?" },
      { prompt: "Make it a question: 'You should drink some water.'", answer: "Should you drink some water?" },
      { prompt: "Ask someone what is wrong with them.", answer: "What's the matter?" },
      { prompt: "Ask your partner for advice about a headache.", answer: "What should I do about a headache?" },
      { prompt: "Make it a question: 'He should go to hospital.'", answer: "Should he go to hospital?" },
      { prompt: "Ask your partner if they should eat more fruit.", answer: "Should I eat more fruit?" }
    ]
  },
  'comparatives-superlatives': {
    HOOP_QUESTIONS: [
      { prompt: "Make it a question: 'Everest is the tallest mountain.'", answer: "Is Everest the tallest mountain?" },
      { prompt: "Make it a question: 'She is the best student.'", answer: "Is she the best student?" },
      { prompt: "Ask who is the tallest person in the class.", answer: "Who is the tallest person in the class?" },
      { prompt: "Ask which is the biggest city in your country.", answer: "Which is the biggest city in my country?" },
      { prompt: "Make it a question: 'That was the worst film.'", answer: "Was that the worst film?" },
      { prompt: "Make it a question: 'Gold is more expensive than silver.'", answer: "Is gold more expensive than silver?" },
      { prompt: "Ask your partner the most beautiful place they know.", answer: "What is the most beautiful place you know?" },
      { prompt: "Make it a question: 'This is the easiest exercise.'", answer: "Is this the easiest exercise?" },
      { prompt: "Ask who is the fastest runner in the school.", answer: "Who is the fastest runner in the school?" },
      { prompt: "Make it a question: 'July is hotter than May.'", answer: "Is July hotter than May?" }
    ]
  },
  'will-wont': {
    HOOP_QUESTIONS: [
      { prompt: "Make it a question: 'It will rain tomorrow.'", answer: "Will it rain tomorrow?" },
      { prompt: "Make it a question: 'She will help me.'", answer: "Will she help me?" },
      { prompt: "Make it a question: 'They will come to the party.'", answer: "Will they come to the party?" },
      { prompt: "Ask your partner what they will do at the weekend.", answer: "What will you do at the weekend?" },
      { prompt: "Make it a question: 'He will be late.'", answer: "Will he be late?" },
      { prompt: "Ask your partner where they will be in ten years.", answer: "Where will you be in ten years?" },
      { prompt: "Make it a question: 'We will need our coats.'", answer: "Will we need our coats?" },
      { prompt: "Ask if the shop will open on Sunday.", answer: "Will the shop open on Sunday?" },
      { prompt: "Make it a question: 'You will like this film.'", answer: "Will you like this film?" },
      { prompt: "Ask who will win the match.", answer: "Who will win the match?" }
    ]
  },
  'present-perfect': {
    HOOP_QUESTIONS: [
      { prompt: "Make it a question: 'You have been to Japan.'", answer: "Have you been to Japan?" },
      { prompt: "Make it a question: 'She has finished her homework.'", answer: "Has she finished her homework?" },
      { prompt: "Ask your partner if they have ever ridden a horse.", answer: "Have you ever ridden a horse?" },
      { prompt: "Make it a question: 'They have eaten lunch.'", answer: "Have they eaten lunch?" },
      { prompt: "Ask if the bus has arrived.", answer: "Has the bus arrived?" },
      { prompt: "Make it a question: 'He has lost his keys.'", answer: "Has he lost his keys?" },
      { prompt: "Ask your partner how many countries they have visited.", answer: "How many countries have you visited?" },
      { prompt: "Make it a question: 'We have met before.'", answer: "Have we met before?" },
      { prompt: "Ask your partner if they have ever eaten sushi.", answer: "Have you ever eaten sushi?" },
      { prompt: "Make it a question: 'It has stopped raining.'", answer: "Has it stopped raining?" }
    ]
  },
  'amusement-park': {
    HOOP_QUESTIONS: [
      { prompt: "Ask your partner what they did at the amusement park.", answer: "What did you do at the amusement park?" },
      { prompt: "Ask your partner about the roller coaster.", answer: "How was the roller coaster?" },
      { prompt: "Make it a question: 'You watched a 3D film.'", answer: "Did you watch a 3D film?" },
      { prompt: "Make it a question: 'She went on the roller coaster.'", answer: "Did she go on the roller coaster?" },
      { prompt: "Ask your partner how they felt in the haunted house.", answer: "How did you feel in the haunted house?" },
      { prompt: "Make it a question: 'They saw a parade.'", answer: "Did they see a parade?" },
      { prompt: "Ask your partner about the 3D film.", answer: "How was the 3D film?" },
      { prompt: "Make it a question: 'He rode the merry-go-round.'", answer: "Did he ride the merry-go-round?" },
      { prompt: "Ask your partner what they ate at the park.", answer: "What did you eat at the park?" },
      { prompt: "Ask your partner which attraction they visited first.", answer: "Which attraction did you visit first?" }
    ]
  },
  'party-fun': {
    HOOP_QUESTIONS: [
      { prompt: "Ask your partner what they will do for the party.", answer: "What will you do for the party?" },
      { prompt: "Ask who will set the table.", answer: "Who will set the table?" },
      { prompt: "Make it a question: 'You will bring games.'", answer: "Will you bring games?" },
      { prompt: "Make it a question: 'He will choose the music.'", answer: "Will he choose the music?" },
      { prompt: "Ask who will serve the pizza.", answer: "Who will serve the pizza?" },
      { prompt: "Make it a question: 'Rosa will bake biscuits.'", answer: "Will Rosa bake biscuits?" },
      { prompt: "Ask who will blow up the balloons.", answer: "Who will blow up the balloons?" },
      { prompt: "Make it a question: 'They will hang up the decorations.'", answer: "Will they hang up the decorations?" },
      { prompt: "Ask your partner what Tom will do for the party.", answer: "What will Tom do for the party?" },
      { prompt: "Make it a question: 'She will set up the games.'", answer: "Will she set up the games?" }
    ]
  },
  'at-school': {
    HOOP_QUESTIONS: [
      { prompt: "Ask your partner what they have got.", answer: "What have you got?" },
      { prompt: "Ask what Mia has got.", answer: "What has Mia got?" },
      { prompt: "Ask your partner what they want for lunch.", answer: "What do you want?" },
      { prompt: "Ask what he wants.", answer: "What does he want?" },
      { prompt: "Ask what she has got.", answer: "What has she got?" },
      { prompt: "Ask what Tom wants.", answer: "What does Tom want?" },
      { prompt: "Ask what they have got.", answer: "What have they got?" },
      { prompt: "Ask what your friends want.", answer: "What do your friends want?" },
      { prompt: "Tell your partner you have a paintbrush.", answer: "I've got a paintbrush." },
      { prompt: "Tell your partner you want soup and juice.", answer: "I want soup and juice." }
    ]
  },
  'months-weather': {
    HOOP_QUESTIONS: [
      { prompt: "Ask your partner about their birthday.", answer: "When's your birthday?" },
      { prompt: "Ask about the weather today.", answer: "What's the weather like today?" },
      { prompt: "Ask your partner about their favourite season.", answer: "What's your favourite season?" },
      { prompt: "Ask which month it is.", answer: "What month is it?" },
      { prompt: "Ask about the date today.", answer: "What's the date today?" },
      { prompt: "Tell your partner your birthday is in March.", answer: "My birthday is in March." },
      { prompt: "Tell your partner it is raining.", answer: "It's rainy." },
      { prompt: "Ask what the weather is like in summer.", answer: "What's the weather like in summer?" },
      { prompt: "Tell your partner it's the 3rd of April today.", answer: "It's the third of April." },
      { prompt: "Ask when Ana's birthday is.", answer: "When's Ana's birthday?" }
    ]
  },
  'food-drink': {
    HOOP_QUESTIONS: [
      { prompt: "Ask the waiter for a chicken sandwich.", answer: "Can I have a chicken sandwich, please?" },
      { prompt: "You're the waiter. Ask if the customer is ready.", answer: "Are you ready to order?" },
      { prompt: "You're the waiter. Ask about drinks.", answer: "What would you like to drink?" },
      { prompt: "Ask if there is any bread.", answer: "Is there any bread?" },
      { prompt: "Ask if there are any cookies.", answer: "Are there any cookies?" },
      { prompt: "Order a cheese pizza with 'I'll have'.", answer: "I'll have a cheese pizza, please." },
      { prompt: "Order water with 'I'd like'.", answer: "I'd like water, please." },
      { prompt: "You're the waiter. Say hello and offer help.", answer: "Hi. Can I help you?" },
      { prompt: "Tell your partner there isn't any milk.", answer: "There isn't any milk." },
      { prompt: "Tell your partner there are some apples.", answer: "There are some apples." }
    ]
  }
};

export const HOOP_QUESTIONS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  HOOP_QUESTIONS.length = 0;
  HOOP_QUESTIONS.push(...data.HOOP_QUESTIONS);
}
applyLesson('comparatives');
