/* =========================================================
   LESSON CONTENT — Stage 9 (Practice Questions / worksheet)
   Four sets each progressively freer (gap fill → unscramble →
   sentence writing → free writing).
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with the correct comparative.",
        questions:[
          {prompt:"The Nile is ___ than the Thames. (long)", answer:"longer"},
          {prompt:"A cheetah is ___ than a horse. (fast)", answer:"faster"},
          {prompt:"My bag is ___ than yours. (heavy)", answer:"heavier"},
          {prompt:"Summer is ___ than spring. (hot)", answer:"hotter"},
          {prompt:"This exercise is ___ than the last. (easy)", answer:"easier"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["My","sister","is","taller","than","me","."],answer:"My sister is taller than me ."},
          {chips:["The","red","car","is","faster","than","the","blue","one","."],answer:"The red car is faster than the blue one ."},
          {chips:["It","is","hotter","in","July","than","in","May","."],answer:"It is hotter in July than in May ."},
          {chips:["This","exercise","is","harder","than","the","first","."],answer:"This exercise is harder than the first ."},
          {chips:["Dogs","are","noisier","than","cats","."],answer:"Dogs are noisier than cats ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full comparative sentence using the word given.",
        questions:[
          {prompt:'Write a sentence using "bigger".',    hint:'___ is bigger than ___.'},
          {prompt:'Write a sentence using "more tired".',hint:'I am more tired than ___.'},
          {prompt:'Write a sentence using "better".',    hint:'___ is better than ___ because…'},
          {prompt:'Write a sentence using "closer".',    hint:'My ___ is closer than ___ to ___.'},
          {prompt:'Write a sentence using "more expensive".',hint:'___ is more expensive than ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences comparing two things. Use as many comparatives as you can.",
        questions:[
          {prompt:"Compare two animals. Write at least 3 sentences."},
          {prompt:"Compare two foods you like. Write at least 3 sentences."},
          {prompt:"Compare two places you know. Write at least 3 sentences."},
        ]},
    ]
  },
  health: {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with should or shouldn't.",
        questions:[
          {prompt:"She's got a fever. She ___ stay in bed. (should)", answer:"should"},
          {prompt:"He's eaten five burgers. He ___ eat so much. (shouldn't)", answer:"shouldn't"},
          {prompt:"I've got a toothache. I ___ see a dentist. (should)", answer:"should"},
          {prompt:"They're tired, but it's a school night. They ___ stay up late. (shouldn't)", answer:"shouldn't"},
          {prompt:"We've got sore throats. We ___ drink some hot tea. (should)", answer:"should"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["He","should","take","some","medicine","."],answer:"He should take some medicine ."},
          {chips:["She","shouldn't","eat","too","much","."],answer:"She shouldn't eat too much ."},
          {chips:["I","should","see","a","dentist","."],answer:"I should see a dentist ."},
          {chips:["We","should","drink","some","hot","tea","."],answer:"We should drink some hot tea ."},
          {chips:["They","shouldn't","stay","up","late","."],answer:"They shouldn't stay up late ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence giving advice with the word given.",
        questions:[
          {prompt:'Write a sentence using "should".',      hint:'___ should ___.'},
          {prompt:'Write a sentence using "shouldn’t".', hint:'___ shouldn’t ___.'},
          {prompt:'Write a sentence giving advice for a headache.', hint:'You should ___.'},
          {prompt:'Write a sentence giving advice for a sore throat.', hint:'You should ___.'},
          {prompt:'Write a sentence about something you shouldn’t do when you are ill.', hint:'When you are ill, you shouldn’t ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences using should/shouldn't as much as you can.",
        questions:[
          {prompt:"Write about a time you were ill. What was the matter, and what did you do? Write at least 3 sentences."},
          {prompt:"Give a friend advice about staying healthy. Write at least 3 sentences using should/shouldn't."},
          {prompt:"Compare two illnesses you know. What should you do for each one? Write at least 3 sentences."},
        ]},
    ]
  },
  'comparatives-superlatives': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with the correct comparative or superlative.",
        questions:[
          {prompt:"The Nile is ___ river in the world. (long)", answer:"the longest"},
          {prompt:"A cheetah is ___ than a horse. (fast)", answer:"faster"},
          {prompt:"This is ___ day of the year. (hot)", answer:"the hottest"},
          {prompt:"My bag is ___ than yours. (heavy)", answer:"heavier"},
          {prompt:"She is ___ student in the class. (good)", answer:"the best"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["My","sister","is","taller","than","me","."],answer:"My sister is taller than me ."},
          {chips:["Everest","is","the","tallest","mountain","."],answer:"Everest is the tallest mountain ."},
          {chips:["It","is","hotter","in","July","than","in","May","."],answer:"It is hotter in July than in May ."},
          {chips:["That","was","the","worst","film","ever","."],answer:"That was the worst film ever ."},
          {chips:["Gold","is","more","expensive","than","silver","."],answer:"Gold is more expensive than silver ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence using the word given.",
        questions:[
          {prompt:'Write a sentence using "bigger".',               hint:'___ is bigger than ___.'},
          {prompt:'Write a sentence using "the biggest".',          hint:'___ is the biggest ___ in ___.'},
          {prompt:'Write a sentence using "better".',               hint:'___ is better than ___ because\u2026'},
          {prompt:'Write a sentence using "the most beautiful".',   hint:'___ is the most beautiful ___ I know.'},
          {prompt:'Write a sentence using "more expensive".',       hint:'___ is more expensive than ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3\u20135 sentences. Use comparatives AND superlatives.",
        questions:[
          {prompt:"Compare three animals. Which is the biggest? Write at least 3 sentences."},
          {prompt:"Compare three foods you like. Which is the best? Write at least 3 sentences."},
          {prompt:"Compare three places you know. Which is the most beautiful? Write at least 3 sentences."},
        ]},
    ]
  },
  'will-wont': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with will or won\u2019t.",
        questions:[
          {prompt:"It\u2019s very cloudy. I think it ___ rain. (will)", answer:"will"},
          {prompt:"He never studies, so he ___ pass the test. (won\u2019t)", answer:"won\u2019t"},
          {prompt:"Don\u2019t worry \u2014 I ___ tell anyone. (won\u2019t)", answer:"won\u2019t"},
          {prompt:"She ___ be twelve next birthday. (will)", answer:"will"},
          {prompt:"It\u2019s freezing outside. You ___ need a coat. (will)", answer:"will"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["I","will","call","you","tomorrow","."],answer:"I will call you tomorrow ."},
          {chips:["She","won't","be","late","again","."],answer:"She won't be late again ."},
          {chips:["Will","you","help","me","please","?"],answer:"Will you help me please ?"},
          {chips:["They","will","win","the","match","."],answer:"They will win the match ."},
          {chips:["We","won't","forget","your","birthday","."],answer:"We won't forget your birthday ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence about the future.",
        questions:[
          {prompt:'Write a sentence using "will".',                  hint:'Tomorrow I will ___.'},
          {prompt:'Write a sentence using "won\u2019t".',            hint:'Next week I won\u2019t ___.'},
          {prompt:'Write a question using "Will".',                  hint:'Will you ___?'},
          {prompt:'Write a promise using "won\u2019t".',             hint:'I promise I won\u2019t ___.'},
          {prompt:'Write a prediction about the year 2100.',         hint:'In 2100, people will ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3\u20135 sentences using will and won\u2019t as much as you can.",
        questions:[
          {prompt:"What will you do next weekend? Write at least 3 sentences."},
          {prompt:"What will your life be like in ten years? Write at least 3 sentences."},
          {prompt:"Make three predictions about the future of your city. Write at least 3 sentences."},
        ]},
    ]
  },
  'present-perfect': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with have or has.",
        questions:[
          {prompt:"I ___ visited Japan twice. (have)", answer:"have"},
          {prompt:"She ___ finished her homework. (has)", answer:"has"},
          {prompt:"They ___ never eaten sushi. (have)", answer:"have"},
          {prompt:"My brother ___ broken his arm. (has)", answer:"has"},
          {prompt:"___ you ever ridden a horse? (Have)", answer:"Have"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["I","have","visited","Japan","twice","."],answer:"I have visited Japan twice ."},
          {chips:["She","has","finished","her","homework","."],answer:"She has finished her homework ."},
          {chips:["Have","you","ever","eaten","sushi","?"],answer:"Have you ever eaten sushi ?"},
          {chips:["They","haven't","arrived","yet","."],answer:"They haven't arrived yet ."},
          {chips:["He","has","never","been","to","London","."],answer:"He has never been to London ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence in the present perfect.",
        questions:[
          {prompt:'Write a sentence using "have visited".',      hint:'I have visited ___.'},
          {prompt:'Write a sentence using "has finished".',      hint:'___ has finished ___.'},
          {prompt:'Write a sentence using "have never".',        hint:'I have never ___.'},
          {prompt:'Write a question using "Have you ever".',     hint:'Have you ever ___?'},
          {prompt:'Write a sentence using "hasn\u2019t".',       hint:'___ hasn\u2019t ___ yet.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3\u20135 sentences using the present perfect as much as you can.",
        questions:[
          {prompt:"Write about three things you have done this year. Write at least 3 sentences."},
          {prompt:"Write about three things you have never done, but would like to. Write at least 3 sentences."},
          {prompt:"Interview a partner: what have they done that you haven\u2019t? Write at least 3 sentences."},
        ]},
    ]
  },
  'amusement-park': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Fill in the blank with the past simple or the correct -ing / -ed adjective.",
        questions:[
          {prompt:"Yesterday I ___ a 3D film. (watch)", answer:"watched"},
          {prompt:"We ___ on a roller coaster. (go)", answer:"went"},
          {prompt:"She ___ the merry-go-round. (ride)", answer:"rode"},
          {prompt:"The haunted house was ___. (scary / scared)", answer:"scary"},
          {prompt:"The film was great. I was ___. (amazing / amazed)", answer:"amazed"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["What","did","you","do","at","the","park","?"],answer:"What did you do at the park ?"},
          {chips:["I","saw","a","parade","."],answer:"I saw a parade ."},
          {chips:["How","was","the","roller","coaster","?"],answer:"How was the roller coaster ?"},
          {chips:["It","was","exciting","and","I","was","excited","."],answer:"It was exciting and I was excited ."},
          {chips:["We","visited","a","petting","zoo","."],answer:"We visited a petting zoo ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence about a day at an amusement park.",
        questions:[
          {prompt:'Write a sentence using "went on".',             hint:'I went on the ___.'},
          {prompt:'Write a sentence using "saw".',                 hint:'We saw ___.'},
          {prompt:'Write a sentence using "It was ___ing".',       hint:'The ___ was ___ing.'},
          {prompt:'Write a sentence using "I was ___ed".',         hint:'I was ___ed because ___.'},
          {prompt:'Write a question using "What did you".',        hint:'What did you ___?'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences using the past simple and -ing / -ed adjectives.",
        questions:[
          {prompt:"Imagine you went to an amusement park. What did you do? How was it? Write at least 3 sentences."},
          {prompt:"Write about the most exciting day out you remember. Where did you go and how did you feel? Write at least 3 sentences."},
          {prompt:"Ask four friends 'What did you do at the amusement park?'. What was the most popular attraction? Write at least 3 sentences."},
        ]},
    ]
  },
  'party-fun': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Complete each sentence using will or won’t.",
        questions:[
          {prompt:"I bake biscuits. → I ___ biscuits.", answer:"will bake"},
          {prompt:"She comes to the party. → She ___ to the party.", answer:"will come"},
          {prompt:"Tony watches a film. → Tony ___ a film.", answer:"will watch"},
          {prompt:"Sam hasn’t got any money. He ___ buy the tickets. (will / won’t)", answer:"won’t"},
          {prompt:"Will you bring games? — Yes, I ___.", answer:"will"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["What","will","you","do","for","the","party","?"],answer:"What will you do for the party ?"},
          {chips:["Who","will","set","the","table","?"],answer:"Who will set the table ?"},
          {chips:["I'll","order","the","pizza","."],answer:"I'll order the pizza ."},
          {chips:["Will","he","choose","the","music","?"],answer:"Will he choose the music ?"},
          {chips:["Rosa","won't","draw","the","posters","."],answer:"Rosa won't draw the posters ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence or question about a party.",
        questions:[
          {prompt:'Write a sentence using "I’ll".',                  hint:'I’ll ___ for the party.'},
          {prompt:'Write a sentence using "won’t".',                 hint:'___ won’t ___ because ___.'},
          {prompt:'Write a question using "Who will".',              hint:'Who will ___?'},
          {prompt:'Write a question using "Will you".',              hint:'Will you ___?'},
          {prompt:'Answer the question "Will you bake biscuits?"',   hint:'Yes, I ___. / No, I ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences using will and won’t.",
        questions:[
          {prompt:"Plan a party for your class. Who will do each job? Write at least 3 sentences."},
          {prompt:"What will you do on your next birthday? What won’t you do? Write at least 3 sentences."},
          {prompt:"Ask four friends 'What will you do for the party?'. Write what each friend will do."},
        ]},
    ]
  },
  'at-school': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Complete each sentence with have, has, do, does, want or wants.",
        questions:[
          {prompt:"I ___ got a glue stick.", answer:"have"},
          {prompt:"She ___ got a pencil sharpener.", answer:"has"},
          {prompt:"What does he want? — He ___ fish.", answer:"wants"},
          {prompt:"What ___ you want? — I want soup.", answer:"do"},
          {prompt:"What ___ Tom got? — He’s got a stapler.", answer:"has"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["What","have","you","got","?"],answer:"What have you got ?"},
          {chips:["She's","got","a","paintbrush","."],answer:"She's got a paintbrush ."},
          {chips:["What","does","he","want","?"],answer:"What does he want ?"},
          {chips:["I","want","pizza","and","juice","."],answer:"I want pizza and juice ."},
          {chips:["He's","got","a","colouring","pencil","."],answer:"He's got a colouring pencil ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence or question about school or lunch.",
        questions:[
          {prompt:'Write a sentence using "I’ve got".',                   hint:'I’ve got a ___.'},
          {prompt:'Write a sentence using "She’s got".',                  hint:'She’s got a ___.'},
          {prompt:'Write a question using "What has".',                   hint:'What has ___ got?'},
          {prompt:'Write a sentence using "wants".',                      hint:'___ wants ___.'},
          {prompt:'Answer the question "What do you want for lunch?"',    hint:'I want ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences using have got / has got and want / wants.",
        questions:[
          {prompt:"What have you got in your school bag? Write at least 3 sentences."},
          {prompt:"Ask three friends 'What do you want for lunch?'. Write what each friend wants."},
          {prompt:"Look around your classroom. What has your teacher got? What have your friends got? Write at least 3 sentences."},
        ]},
    ]
  },
  'months-weather': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Complete each sentence with in, on, a date word or a weather word.",
        questions:[
          {prompt:"My birthday is ___ June.", answer:"in"},
          {prompt:"It’s ___ the 9th of June.", answer:"on"},
          {prompt:"5th → the ___ of March", answer:"fifth"},
          {prompt:"There’s a lot of sun today. It’s ___.", answer:"sunny"},
          {prompt:"It’s cold and snowy in ___.", answer:"winter"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["When's","your","birthday","?"],answer:"When's your birthday ?"},
          {chips:["It's","on","the","fifth","of","May","."],answer:"It's on the fifth of May ."},
          {chips:["What's","the","weather","like","?"],answer:"What's the weather like ?"},
          {chips:["It's","rainy","and","windy","today","."],answer:"It's rainy and windy today ."},
          {chips:["It's","hot","in","summer","."],answer:"It's hot in summer ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence or question about dates, weather or seasons.",
        questions:[
          {prompt:'Write when your birthday is.',             hint:'My birthday is in ___. It’s on the ___ of ___.'},
          {prompt:'Write about the weather today.',           hint:'It’s ___ and ___.'},
          {prompt:'Write a sentence about winter.',           hint:'In winter, it’s ___.'},
          {prompt:'Write a question about the weather.',      hint:'What’s the weather ___?'},
          {prompt:'Write your favourite season and why.',     hint:'My favourite season is ___ because ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences about months, weather and seasons.",
        questions:[
          {prompt:"Write about your favourite season. What’s the weather like? What do you do? Write at least 3 sentences."},
          {prompt:"Ask three friends 'When’s your birthday?'. Write each friend’s birthday and its season."},
          {prompt:"Write a weather report for this week. What’s the weather like on each day?"},
        ]},
    ]
  },
  'food-drink': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Complete each sentence with a, an, some, any or a restaurant word.",
        questions:[
          {prompt:"Is there ___ milk in the fridge?", answer:"any"},
          {prompt:"There are ___ potatoes on the plate.", answer:"some"},
          {prompt:"Is there ___ orange in your bag?", answer:"an"},
          {prompt:"There aren’t ___ cookies.", answer:"any"},
          {prompt:"Can I ___ a sandwich, please?", answer:"have"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["Are","there","any","cookies","?"],answer:"Are there any cookies ?"},
          {chips:["There's","some","juice","in","the","glass","."],answer:"There's some juice in the glass ."},
          {chips:["Is","there","a","banana","?"],answer:"Is there a banana ?"},
          {chips:["I'll","have","a","cheese","pizza","."],answer:"I'll have a cheese pizza ."},
          {chips:["There","isn't","any","bread","."],answer:"There isn't any bread ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence or question about food, some and any.",
        questions:[
          {prompt:'Write what is in your fridge at home.',        hint:'There’s some ___. There are some ___.'},
          {prompt:'Write a question with “any” about food.',      hint:'Is there any ___? / Are there any ___?'},
          {prompt:'Write what there isn’t in your kitchen.',      hint:'There isn’t any ___.'},
          {prompt:'Order your favourite food in a restaurant.',   hint:'Can I have ___, please?'},
          {prompt:'Order a drink.',                               hint:'I’d like ___, please.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences about food and restaurants.",
        questions:[
          {prompt:"Write a menu for your own café. What food and drinks are there? Write at least 3 sentences."},
          {prompt:"Write a conversation between a waiter and a customer. Use 'Can I help you?' and 'I’d like…'."},
          {prompt:"What’s in your lunch box today? Write what there is and what there isn’t."},
        ]},
    ]
  },
  'at-the-buffet': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Complete each sentence with have, had, taste, tasted, it, they or a taste word.",
        questions:[
          {prompt:"What did you ___ for lunch?", answer:"have"},
          {prompt:"I ___ cereal for breakfast.", answer:"had"},
          {prompt:"How did the soup ___?", answer:"taste"},
          {prompt:"The chicken wings? They ___ spicy.", answer:"tasted"},
          {prompt:"Lemons taste ___.", answer:"sour"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["What","did","you","have","for","breakfast","?"],answer:"What did you have for breakfast ?"},
          {chips:["I","had","fried","rice","for","lunch","."],answer:"I had fried rice for lunch ."},
          {chips:["How","did","the","lemonade","taste","?"],answer:"How did the lemonade taste ?"},
          {chips:["It","tasted","very","sweet","."],answer:"It tasted very sweet ."},
          {chips:["They","tasted","spicy","and","greasy","."],answer:"They tasted spicy and greasy ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence or question about food and how it tasted.",
        questions:[
          {prompt:'Write what you had for breakfast today.',     hint:'I had ___ and ___.'},
          {prompt:'Write what you had for lunch yesterday.',     hint:'I had ___ for lunch.'},
          {prompt:'Write how your breakfast tasted.',            hint:'It tasted ___. / They tasted ___.'},
          {prompt:'Write a question about a friend’s dinner.',   hint:'What did you have for ___?'},
          {prompt:'Write about a food you didn’t like.',         hint:'I had ___. It tasted ___.'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences about food and how it tasted.",
        questions:[
          {prompt:"Write about a day at a buffet. What did you have for breakfast and lunch? How did it taste?"},
          {prompt:"Write a menu for a school buffet. Say how each food tastes."},
          {prompt:"Ask three classmates what they had for dinner last night. Write their answers."},
        ]},
    ]
  },
  'at-the-market': {
    QS_SETS: [
      { label:"Gap Fill", type:"gap", desc:"Complete each sentence with some, any, have, has, haven’t or hasn’t.",
        questions:[
          {prompt:"He’s got ___ grapes.", answer:"some"},
          {prompt:"She hasn’t got ___ milk.", answer:"any"},
          {prompt:"___ you got any cheese?", answer:"Have"},
          {prompt:"Has he got any beef? — No, he ___.", answer:"hasn’t"},
          {prompt:"What ___ she got?", answer:"has"},
        ]},
      { label:"Unscramble", type:"scramble", desc:"Put the words in the correct order to make a sentence.",
        questions:[
          {chips:["He's","got","some","watermelons","."],answer:"He's got some watermelons ."},
          {chips:["Have","you","got","any","butter","?"],answer:"Have you got any butter ?"},
          {chips:["She","hasn't","got","any","lemons","."],answer:"She hasn't got any lemons ."},
          {chips:["Has","he","got","any","yoghurt","?"],answer:"Has he got any yoghurt ?"},
          {chips:["We've","got","some","mushrooms","."],answer:"We've got some mushrooms ."},
        ]},
      { label:"Sentences", type:"sentence", desc:"Write a full sentence or question with have got, some and any.",
        questions:[
          {prompt:'Write what you have got in your fridge.',  hint:'I’ve got some ___.'},
          {prompt:'Write what you haven’t got.',              hint:'I haven’t got any ___.'},
          {prompt:'Write a question for a friend.',           hint:'Have you got any ___?'},
          {prompt:'Write about a classmate’s lunch.',         hint:'She’s got some ___. / He hasn’t got any ___.'},
          {prompt:'Write a question about your teacher.',     hint:'Has he / she got any ___?'},
        ]},
      { label:"Free Writing", type:"free", desc:"Write 3–5 sentences about food at the market.",
        questions:[
          {prompt:"You are at a farmers’ market. Write what the farmers have got and what they haven’t got."},
          {prompt:"Write a shopping list. Then write what you have got at home and what you haven’t got."},
          {prompt:"Write a conversation at a market stall. Use ‘Have you got any…?’ and short answers."},
        ]},
    ]
  }
};

export const QS_SETS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  QS_SETS.length = 0;
  QS_SETS.push(...data.QS_SETS);
}
applyLesson('comparatives');
