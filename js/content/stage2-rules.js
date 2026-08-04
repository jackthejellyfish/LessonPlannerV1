/* =========================================================
   LESSON CONTENT — Stage 2 (Learn the Rule)
   Swap or extend the rule cards / presentation demo here;
   js/stages/stage2-rules.js only contains rendering logic.

   RULES: {name, formula, color, examples:[[base, suffix]]} —
   rendered as `base` → `base` + `suffix` (see renderRuleCards),
   so a suffix with a leading space reads as a full continuation
   ("He" → "He should stay in bed."), not just a word ending.

   COMPARE_DEMOS: {labelA, labelB, valueA, valueB, icon | iconA/
   iconB, caption}. `icon` sizes/colors one shared icon type for
   both sides (the original "magnitude" comparison — two towers,
   one taller); `iconA`/`iconB` (falls back to `icon` if absent)
   let each side use a *different* icon type instead, for demos
   that pair two different things (a symptom and its advice)
   rather than comparing one thing's size.
========================================================= */
const LESSON_CONTENT = {
  comparatives: {
    RULES: [
      { name: "Add -er", formula: "adjective + er", color: "var(--rule-a)",
        examples: [["tall","er"],["small","er"],["long","er"]] },
      { name: "Add -r", formula: "ends in e, so just + r", color: "var(--rule-b)",
        examples: [["nice","r"],["large","r"],["safe","r"]] },
      { name: "Double + -er", formula: "short vowel + consonant: double it, + er", color: "var(--rule-c)",
        examples: [["big","ger"],["hot","ter"],["thin","ner"]] },
      { name: "y → ier", formula: "consonant + y: change y to i, + er", color: "var(--rule-d)",
        examples: [["happ","ier"],["eas","ier"],["bus","ier"]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Tower A", labelB: "Tower B", valueA: 85, valueB: 45, icon: "tower",
        caption: 'Tower A is <span class="hl">taller</span> than Tower B.' },
      { labelA: "Car A", labelB: "Car B", valueA: 55, valueB: 95, icon: "car",
        caption: 'Car B is <span class="hl">faster</span> than Car A.' },
      { labelA: "Bag A", labelB: "Bag B", valueA: 30, valueB: 75, icon: "bag",
        caption: 'Bag B is <span class="hl">heavier</span> than Bag A.' },
      { labelA: "Path A", labelB: "Path B", valueA: 90, valueB: 60, icon: "path",
        caption: 'Path A is <span class="hl">longer</span> than Path B.' }
    ],
    COMPARE_ICON_COLORS: { tower: "var(--rule-a)", car: "var(--rule-b)", bag: "var(--rule-c)", path: "var(--rule-d)" }
  },
  health: {
    RULES: [
      { name: "Positive", formula: "I / He / She / They + should + verb", color: "var(--rule-a)",
        examples: [["I"," should take some medicine."], ["He"," should stay in bed."], ["They"," should see a dentist."]] },
      { name: "Negative", formula: "I / He / She / They + shouldn't + verb", color: "var(--rule-c)",
        examples: [["He"," shouldn't eat too much."], ["She"," shouldn't stay up late."], ["I"," shouldn't skip breakfast."]] }
    ],
    COMPARE_DEMOS: [
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "headache", iconB: "medicine",
        caption: 'I’ve got a headache. You should <span class="hl">take some medicine</span>.' },
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "thermometer", iconB: "bed",
        caption: 'I’ve got a fever. I should <span class="hl">stay in bed</span>.' },
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "nose", iconB: "tissue",
        caption: 'He’s got a runny nose. He should <span class="hl">blow his nose</span>.' },
      { labelA: "Problem", labelB: "Advice", valueA: 75, valueB: 75, iconA: "tooth", iconB: "dentist",
        caption: 'I’ve got a toothache. I should <span class="hl">see a dentist</span>.' }
    ],
    COMPARE_ICON_COLORS: {
      headache: "var(--rule-c)", thermometer: "var(--rule-c)", nose: "var(--rule-c)", tooth: "var(--rule-c)",
      medicine: "var(--rule-a)", bed: "var(--rule-a)", tissue: "var(--rule-a)", dentist: "var(--rule-a)"
    }
  }
};

export const RULES = [];
export const COMPARE_DEMOS = [];
export const COMPARE_ICON_COLORS = {};

export function applyLesson(id){
  const data = LESSON_CONTENT[id] || LESSON_CONTENT.comparatives;
  RULES.length = 0;
  RULES.push(...data.RULES);
  COMPARE_DEMOS.length = 0;
  COMPARE_DEMOS.push(...data.COMPARE_DEMOS);
  Object.keys(COMPARE_ICON_COLORS).forEach(k => delete COMPARE_ICON_COLORS[k]);
  Object.assign(COMPARE_ICON_COLORS, data.COMPARE_ICON_COLORS);
}
applyLesson('comparatives');
