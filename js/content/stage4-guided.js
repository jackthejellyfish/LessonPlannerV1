/* =========================================================
   LESSON CONTENT — Stage 4 (Guided / Semi-controlled Practice)
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    SEMI_ITEMS: [
      { chips: ["The robot", "is", "faster", "than", "the golf cart"] },
      { chips: ["The mountain", "is", "taller", "than", "the hill"] },
      { chips: ["The puppy", "is", "smaller", "than", "the horse"] },
      { chips: ["The diamond", "is", "shinier", "than", "the pebble"] },
      { chips: ["My backpack", "is", "heavier", "than", "your bag"] },
      { chips: ["The bear", "is", "bigger", "than", "the wolf"] },
      { chips: ["The vault", "is", "safer", "than", "the drawer"] },
      { chips: ["This lesson", "is", "easier", "than", "the last one"] },
      { chips: ["The ocean", "is", "colder", "than", "the pool"] },
      { chips: ["Your idea", "is", "better", "than", "my idea"] }
    ]
  },
  health: {
    SEMI_ITEMS: [
      { chips: ["He", "should", "take", "some", "medicine"] },
      { chips: ["She", "should", "stay", "in", "bed"] },
      { chips: ["They", "shouldn't", "eat", "too", "much"] },
      { chips: ["I", "should", "see", "a", "dentist"] },
      { chips: ["He", "should", "blow", "his", "nose"] },
      { chips: ["You", "should", "drink", "some", "hot", "tea"] },
      { chips: ["She", "shouldn't", "stay", "up", "late"] },
      { chips: ["I", "should", "take", "my", "temperature"] },
      { chips: ["We", "shouldn't", "go", "to", "school"] },
      { chips: ["He", "should", "see", "a", "doctor"] }
    ]
  },
  'comparatives-superlatives': {
    SEMI_ITEMS: [
      { chips: ["Everest", "is", "the tallest", "mountain", "in the world"] },
      { chips: ["The cheetah", "is", "faster", "than", "the horse"] },
      { chips: ["This", "is", "the biggest", "pizza", "in the shop"] },
      { chips: ["My bag", "is", "heavier", "than", "your bag"] },
      { chips: ["She", "is", "the best", "student", "in the class"] },
      { chips: ["Today", "is", "hotter", "than", "yesterday"] },
      { chips: ["That", "was", "the worst", "film", "of the year"] },
      { chips: ["The blue car", "is", "more expensive", "than", "the red one"] },
      { chips: ["He", "is", "the happiest", "person", "here"] },
      { chips: ["This book", "is", "more interesting", "than", "that one"] }
    ]
  },
  'will-wont': {
    SEMI_ITEMS: [
      { chips: ["I", "will", "call", "you", "tomorrow"] },
      { chips: ["She", "won't", "be", "late", "again"] },
      { chips: ["They", "will", "win", "the", "match"] },
      { chips: ["We", "won't", "forget", "your", "birthday"] },
      { chips: ["It", "will", "rain", "this", "afternoon"] },
      { chips: ["He", "will", "be", "twelve", "next year"] },
      { chips: ["I", "won't", "tell", "anyone", "about it"] },
      { chips: ["Will", "you", "help", "me", "please"] },
      { chips: ["People", "will", "live", "on", "Mars"] },
      { chips: ["You", "won't", "need", "a", "coat"] }
    ]
  },
  'present-perfect': {
    // Present perfect needs have/has + a participle, which is two chips
    // before the sentence even starts — so these are kept to 5-6 chips
    // total, or the chip bank wraps past the bottom of the stage.
    SEMI_ITEMS: [
      { chips: ["I", "have", "visited", "Japan", "twice"] },
      { chips: ["She", "has", "finished", "her", "homework"] },
      { chips: ["They", "have", "never", "eaten", "sushi"] },
      { chips: ["He", "has", "lost", "his", "keys"] },
      { chips: ["We", "have", "seen", "that", "film"] },
      { chips: ["Have", "you", "ever", "ridden", "a horse"] },
      { chips: ["I", "haven't", "finished", "my", "book"] },
      { chips: ["It", "has", "stopped", "raining", "now"] },
      { chips: ["She", "hasn't", "been", "to", "Paris"] },
      { chips: ["The train", "has", "already", "left", "the station"] }
    ]
  },
  'amusement-park': {
    SEMI_ITEMS: [
      { chips: ["We", "went", "on", "a roller coaster"] },
      { chips: ["She", "visited", "a", "petting zoo"] },
      { chips: ["They", "saw", "a parade", "at the park"] },
      { chips: ["I", "rode", "the", "merry-go-round"] },
      { chips: ["He", "entered", "the", "haunted house"] },
      { chips: ["The roller coaster", "was", "really", "exciting"] },
      { chips: ["I", "was", "scared", "in the", "haunted house"] },
      { chips: ["We", "were", "amazed", "by", "the 3D film"] },
      { chips: ["The parade", "was", "boring", "for", "my brother"] },
      { chips: ["My sister", "won", "a prize", "at", "the park"] }
    ]
  }
};

export const SEMI_ITEMS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  SEMI_ITEMS.length = 0;
  SEMI_ITEMS.push(...data.SEMI_ITEMS);
}
applyLesson('comparatives');
