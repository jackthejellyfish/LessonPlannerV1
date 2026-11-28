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
      { prompt: "Ask your partner which is faster, a bike or a motorbike.", answer: "Which is faster, a bike or a motorbike?" },
      { prompt: "Make it a question: 'Your sister is younger than you.'", answer: "Is your sister younger than you?" },
      { prompt: "Make it a question: 'Cats are quieter than dogs.'", answer: "Are cats quieter than dogs?" },
      { prompt: "Make it a question: 'The test was easier than last week.'", answer: "Was the test easier than last week?" },
      { prompt: "Ask your partner which is bigger, an elephant or a whale.", answer: "Which is bigger, an elephant or a whale?" },
      { prompt: "Ask your partner who is older, their mum or their dad.", answer: "Who is older, your mum or your dad?" }
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
      { prompt: "Ask your partner if they should eat more fruit.", answer: "Should I eat more fruit?" },
      { prompt: "Make it a question: 'She should stay at home.'", answer: "Should she stay at home?" },
      { prompt: "Ask your partner what's wrong with their brother.", answer: "What's the matter with your brother?" },
      { prompt: "Make it a question: 'They should go to bed early.'", answer: "Should they go to bed early?" },
      { prompt: "Ask your partner for advice about a cold.", answer: "What should I do about a cold?" },
      { prompt: "Make it a question: 'I should take some medicine.'", answer: "Should I take some medicine?" }
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
      { prompt: "Make it a question: 'July is hotter than May.'", answer: "Is July hotter than May?" },
      { prompt: "Make it a question: 'The Nile is the longest river.'", answer: "Is the Nile the longest river?" },
      { prompt: "Ask who is the oldest person in your partner's family.", answer: "Who is the oldest person in your family?" },
      { prompt: "Make it a question: 'A cheetah is faster than a lion.'", answer: "Is a cheetah faster than a lion?" },
      { prompt: "Ask your partner what the best film is.", answer: "What is the best film?" },
      { prompt: "Make it a question: 'They were the happiest children.'", answer: "Were they the happiest children?" }
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
      { prompt: "Ask who will win the match.", answer: "Who will win the match?" },
      { prompt: "Make it a question: 'They will win the match.'", answer: "Will they win the match?" },
      { prompt: "Ask your partner what they will eat tonight.", answer: "What will you eat tonight?" },
      { prompt: "Make it a question: 'It will be cold.'", answer: "Will it be cold?" },
      { prompt: "Ask when the bus will arrive.", answer: "When will the bus arrive?" },
      { prompt: "Make it a question: 'Your sister will call me.'", answer: "Will your sister call me?" }
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
      { prompt: "Make it a question: 'It has stopped raining.'", answer: "Has it stopped raining?" },
      { prompt: "Make it a question: 'She has been to Paris.'", answer: "Has she been to Paris?" },
      { prompt: "Ask your partner if they have ever seen snow.", answer: "Have you ever seen snow?" },
      { prompt: "Make it a question: 'They have bought a dog.'", answer: "Have they bought a dog?" },
      { prompt: "Ask your partner if they have done their homework.", answer: "Have you done your homework?" },
      { prompt: "Make it a question: 'The film has started.'", answer: "Has the film started?" }
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
      { prompt: "Ask your partner which attraction they visited first.", answer: "Which attraction did you visit first?" },
      { prompt: "Make it a question: 'You bought a souvenir.'", answer: "Did you buy a souvenir?" },
      { prompt: "Ask your partner how the parade was.", answer: "How was the parade?" },
      { prompt: "Make it a question: 'They ate candy floss.'", answer: "Did they eat candy floss?" },
      { prompt: "Ask your partner how they felt on the roller coaster.", answer: "How did you feel on the roller coaster?" },
      { prompt: "Make it a question: 'She won a prize.'", answer: "Did she win a prize?" }
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
      { prompt: "Make it a question: 'She will set up the games.'", answer: "Will she set up the games?" },
      { prompt: "Ask who will bake biscuits.", answer: "Who will bake biscuits?" },
      { prompt: "Make it a question: 'Ann will buy balloons.'", answer: "Will Ann buy balloons?" },
      { prompt: "Ask who will draw the posters.", answer: "Who will draw the posters?" },
      { prompt: "Make it a question: 'We will order pizza.'", answer: "Will we order pizza?" },
      { prompt: "Ask your partner if they will play the music.", answer: "Will you play the music?" }
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
      { prompt: "Tell your partner you want soup and juice.", answer: "I want soup and juice." },
      { prompt: "Ask what your teacher has got.", answer: "What has your teacher got?" },
      { prompt: "Ask what they want.", answer: "What do they want?" },
      { prompt: "Tell your partner you have got a stapler.", answer: "I've got a stapler." },
      { prompt: "Ask what Mia wants.", answer: "What does Mia want?" },
      { prompt: "Tell your partner Tom wants fish.", answer: "Tom wants fish." }
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
      { prompt: "Ask when Ana's birthday is.", answer: "When's Ana's birthday?" },
      { prompt: "Ask your partner what the weather is like in winter.", answer: "What's the weather like in winter?" },
      { prompt: "Tell your partner your birthday is on the 8th of May.", answer: "My birthday is on the eighth of May." },
      { prompt: "Ask your partner when their mum's birthday is.", answer: "When's your mum's birthday?" },
      { prompt: "Tell your partner it's cold and windy today.", answer: "It's cold and windy today." },
      { prompt: "Ask which season it is.", answer: "What season is it?" }
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
      { prompt: "Tell your partner there are some apples.", answer: "There are some apples." },
      { prompt: "Ask if there is any rice.", answer: "Is there any rice?" },
      { prompt: "Ask if there are any bananas.", answer: "Are there any bananas?" },
      { prompt: "Order soup with 'Can I have'.", answer: "Can I have some soup, please?" },
      { prompt: "Tell your partner there aren't any eggs.", answer: "There aren't any eggs." },
      { prompt: "You're the customer. Order juice with 'I'll have'.", answer: "I'll have some juice, please." }
    ]
  },
  'at-the-buffet': {
    HOOP_QUESTIONS: [
      { prompt: "Ask your partner what they had for breakfast.", answer: "What did you have for breakfast?" },
      { prompt: "Ask your partner what they had for lunch.", answer: "What did you have for lunch?" },
      { prompt: "Ask how the fruit salad tasted.", answer: "How did the fruit salad taste?" },
      { prompt: "Ask how the chicken wings tasted.", answer: "How did the chicken wings taste?" },
      { prompt: "Make it a question: 'You had cereal.'", answer: "Did you have cereal?" },
      { prompt: "Ask what Tom had for dinner.", answer: "What did Tom have for dinner?" },
      { prompt: "Tell your partner you had scrambled eggs for breakfast.", answer: "I had scrambled eggs for breakfast." },
      { prompt: "Tell your partner the lemonade tasted sweet.", answer: "The lemonade tasted sweet." },
      { prompt: "Ask how the tuna sandwiches tasted.", answer: "How did the tuna sandwiches taste?" },
      { prompt: "Make it a question: 'She had fried rice.'", answer: "Did she have fried rice?" },
      { prompt: "Ask what your partner had to drink.", answer: "What did you have to drink?" },
      { prompt: "Tell your partner the chicken wings tasted spicy.", answer: "The chicken wings tasted spicy." },
      { prompt: "Ask how the grapefruit juice tasted.", answer: "How did the grapefruit juice taste?" },
      { prompt: "Make it a question: 'They had fruit salad.'", answer: "Did they have fruit salad?" },
      { prompt: "Ask what Mia had for lunch.", answer: "What did Mia have for lunch?" }
    ]
  },
  'at-the-market': {
    HOOP_QUESTIONS: [
      { prompt: "Ask your partner if they have got any grapes.", answer: "Have you got any grapes?" },
      { prompt: "Ask if he has got any milk.", answer: "Has he got any milk?" },
      { prompt: "Ask what she has got.", answer: "What has she got?" },
      { prompt: "Make it a question: 'She's got some cheese.'", answer: "Has she got any cheese?" },
      { prompt: "Tell your partner you've got some lemons.", answer: "I've got some lemons." },
      { prompt: "Tell your partner he hasn't got any mushrooms.", answer: "He hasn't got any mushrooms." },
      { prompt: "Make it a question: 'They've got some pumpkins.'", answer: "Have they got any pumpkins?" },
      { prompt: "Ask the farmer if he has got any watermelons.", answer: "Have you got any watermelons?" },
      { prompt: "Ask what Tom has got.", answer: "What has Tom got?" },
      { prompt: "Make it a question: 'You've got some beef.'", answer: "Have you got any beef?" },
      { prompt: "Ask your partner if their mum has got any butter.", answer: "Has your mum got any butter?" },
      { prompt: "Tell your partner she's got some yoghurt.", answer: "She's got some yoghurt." },
      { prompt: "Make it a question: 'He's got some cucumbers.'", answer: "Has he got any cucumbers?" },
      { prompt: "Ask what they have got.", answer: "What have they got?" },
      { prompt: "Ask if she has got any lamb.", answer: "Has she got any lamb?" }
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
