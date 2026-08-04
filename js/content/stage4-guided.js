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
  }
};

export const SEMI_ITEMS = [];

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  SEMI_ITEMS.length = 0;
  SEMI_ITEMS.push(...data.SEMI_ITEMS);
}
applyLesson('comparatives');
