/* =========================================================
   LESSON CONTENT — Stage 2 (Learn the Rule)
   Swap or extend the spelling rules / presentation examples here;
   js/stages/stage2-rules.js only contains rendering logic.
========================================================= */
export const RULES = [
  { name: "Add -er", formula: "adjective + er", color: "var(--rule-a)",
    examples: [["tall","er"],["small","er"],["long","er"]] },
  { name: "Add -r", formula: "ends in e, so just + r", color: "var(--rule-b)",
    examples: [["nice","r"],["large","r"],["safe","r"]] },
  { name: "Double + -er", formula: "short vowel + consonant: double it, + er", color: "var(--rule-c)",
    examples: [["big","ger"],["hot","ter"],["thin","ner"]] },
  { name: "y → ier", formula: "consonant + y: change y to i, + er", color: "var(--rule-d)",
    examples: [["happ","ier"],["eas","ier"],["bus","ier"]] }
];

// Presentation demo: simple SVG icon comparisons that anchor the
// meaning of each comparative before students have to produce one
// themselves. Icon size (not an abstract bar) is what visually carries
// "bigger/taller/faster/heavier" — see buildCompareIcon in stage2-rules.js.
export const COMPARE_DEMOS = [
  { labelA: "Tower A", labelB: "Tower B", valueA: 85, valueB: 45, icon: "tower",
    caption: 'Tower A is <span class="hl">taller</span> than Tower B.' },
  { labelA: "Car A", labelB: "Car B", valueA: 55, valueB: 95, icon: "car",
    caption: 'Car B is <span class="hl">faster</span> than Car A.' },
  { labelA: "Bag A", labelB: "Bag B", valueA: 30, valueB: 75, icon: "bag",
    caption: 'Bag B is <span class="hl">heavier</span> than Bag A.' },
  { labelA: "Path A", labelB: "Path B", valueA: 90, valueB: 60, icon: "path",
    caption: 'Path A is <span class="hl">longer</span> than Path B.' }
];
export const COMPARE_ICON_COLORS = { tower: "var(--rule-a)", car: "var(--rule-b)", bag: "var(--rule-c)", path: "var(--rule-d)" };
