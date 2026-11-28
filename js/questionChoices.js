/* =========================================================
   MULTIPLE-CHOICE VERSIONS OF THE GAME QUESTIONS
   Feedback 2026-11-20: mix some multiple-choice questions in with the
   open ones. Every game's question bank is plain {prompt, answer}, so
   rather than hand-write options for ~1000 questions, the options are
   built from the question itself, by its shape:
   - "Which is correct? '... in / on ...'": the two words either side
     of the slash;
   - "In or on? '...'": the two words in the prompt;
   - "Is this correct? '...'": Yes / No (the full answer is shown after);
   - "Put the words in order: ...": the right sentence and two wrong
     orders of the same words;
   - anything else with a short answer: the answer and two other
     answers from the same game's bank.
   Open questions ("e.g. ..." answers, Spin the Wheel) are never
   multiple choice. buildChoices() returns null whenever it can't make
   a fair set of options, and the question is then asked the usual way.
========================================================= */
import { shuffle, showQuestionModal } from './utils.js';
import { markAsked, homeBank } from './questionDeck.js';

const norm = (t) => String(t).toLowerCase().replace(/[’`]/g, "'").replace(/[.,!?;:"]/g, '').replace(/\s+/g, ' ').trim();
// The answer without a teacher's note in brackets: "Pizza is better
// than salad. (or the other way round!)" -> "Pizza is better than salad."
const stripNote = (t) => String(t).replace(/\s*\([^)]*\)\s*$/, '').trim();
const words = (t) => String(t).trim().split(/\s+/);

// The quoted sentence inside a prompt, if any (straight or curly quotes;
// an apostrophe inside a word is not a quote).
function quoted(prompt){
  const m = prompt.match(/['‘"“](.+)['’"”]\s*$/);
  return m ? m[1] : null;
}

// Words that can't end an option: "the most / the tallest" was cut
// after "most" ("the tallest / the most tall boy"), so take one more.
const DANGLING = new Set(['the', 'a', 'an', 'most', 'more', 'very']);
function slashChoices(prompt, answer){
  const q = quoted(prompt);
  if(!q || q.split(' / ').length !== 2) return null;
  const [before, after] = q.split(' / ');
  const n = words(answer).length;
  const clean = (t) => t.replace(/^[^\w'’]+|[^\w'’]+$/g, '');
  const a = norm(answer);
  const bw = words(before), aw = words(after);
  let right = null, wrong = null;
  if(norm(clean(bw.slice(-n).join(' '))) === a){
    right = clean(bw.slice(-n).join(' '));
    let k = Math.min(n, aw.length);
    while(k < aw.length && DANGLING.has(norm(aw[k - 1]))) k++;
    wrong = clean(aw.slice(0, k).join(' '));
  } else if(norm(clean(aw.slice(0, n).join(' '))) === a){
    right = clean(aw.slice(0, n).join(' '));
    wrong = clean(bw.slice(-Math.min(n, bw.length)).join(' '));
  }
  if(!right || !wrong || norm(right) === norm(wrong)) return null;
  return [right, wrong];
}

function orChoices(prompt, answer){
  const m = prompt.match(/^([\w'’-]+) or ([\w'’-]+)\?/i);
  if(!m) return null;
  const opts = [m[1].toLowerCase(), m[2].toLowerCase()];
  const a = norm(answer);
  if(!opts.includes(a)) return null;
  // Same case as the answer, or a capital letter gives it away
  // ("It" against "they" in "It or they? '___ tasted sweet.'").
  const other = opts.find(o => o !== a);
  return [answer, /^[A-Z]/.test(answer) ? other.charAt(0).toUpperCase() + other.slice(1) : other];
}

function yesNoChoices(answer){
  const a = norm(answer);
  if(a.startsWith('yes')) return ['Yes, it’s correct', 'No, it’s wrong'];
  if(a.startsWith('no')) return ['No, it’s wrong', 'Yes, it’s correct'];
  return null;
}

// Two wrong orders of the answer. The prompt's own chunks ("visited /
// we / the petting zoo") are swapped, so a wrong option never splits a
// chunk the question kept together, and words keep the case the prompt
// gives them (so "Rosa" stays capitalised and "leaves" doesn't).
function wordOrderChoices(prompt, answer){
  const sentence = stripNote(answer);
  const end = (sentence.match(/[.?!]$/) || [''])[0];
  const body = sentence.replace(/[.?!]$/, '').trim();
  const chunks = prompt.slice(prompt.indexOf(':') + 1).split(' / ').map(c => c.trim()).filter(c => /\w/.test(c));
  // Put the chunks in the answer's order, matching longest first.
  const target = norm(body);
  const order = [];
  const left = chunks.slice();
  let pos = 0;
  while(pos < target.length && left.length){
    const fits = left.filter(c => target.startsWith(norm(c), pos) &&
      (pos + norm(c).length === target.length || target[pos + norm(c).length] === ' '));
    if(!fits.length) break;
    const c = fits.sort((x, y) => norm(y).length - norm(x).length)[0];
    order.push(c);
    left.splice(left.indexOf(c), 1);
    pos += norm(c).length + 1;
  }
  const parts = (order.length === chunks.length && !left.length) ? order : null;
  if(!parts || parts.length < 3) return null;
  const say = (arr) => {
    const t = arr.join(' ');
    return t.charAt(0).toUpperCase() + t.slice(1) + end;
  };
  const right = sentence.replace(/\s+/g, ' ');
  const wrong = new Set();
  for(const i of shuffle(parts.map((_, i) => i).slice(0, -1))){
    const arr = parts.slice();
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    const t = say(arr);
    if(norm(t) !== norm(right)) wrong.add(t);
    if(wrong.size === 2) break;
  }
  if(!wrong.size) return null;
  return [right, ...wrong];
}

// Other answers from the same bank that look like this one (similar
// length), so the wrong options aren't obviously wrong by shape alone.
function bankChoices(q, bank){
  const answer = stripNote(q.answer);
  if(words(answer).length > 7) return null;
  const n = words(answer).length;
  const seen = new Set([norm(answer)]);
  const pool = [];
  for(const other of shuffle(bank)){
    if(other === q) continue;
    const a = stripNote(other.answer);
    if(/^e\.g\./i.test(a) || /—|–/.test(a)) continue;
    if(Math.abs(words(a).length - n) > 2) continue;
    if(seen.has(norm(a))) continue;
    seen.add(norm(a));
    pool.push(a);
    if(pool.length === 2) break;
  }
  if(!pool.length) return null;
  return [answer, ...pool];
}

// Returns { correct, options } with the options in a random order, or
// null if this question should stay open-ended.
export function buildChoices(q, bank){
  if(!q || !q.answer || /^e\.g\./i.test(q.answer.trim())) return null;
  // A question can carry its own options (right one first) where the
  // automatic ones would come out wrong.
  if(Array.isArray(q.choices) && q.choices.length >= 2) return { correct: q.choices[0], options: shuffle(q.choices) };
  const p = q.prompt;
  let set = null;
  if(/^which is correct\?/i.test(p)) set = slashChoices(p, q.answer);
  else if(/^is this correct\?/i.test(p)) set = yesNoChoices(q.answer);
  else if(/^put the words in order/i.test(p)) set = wordOrderChoices(p, q.answer);
  else set = orChoices(p, q.answer);
  if(!set && !/^(is this|which is) correct\?/i.test(p) && !/^put the words/i.test(p)) set = bankChoices(q, bank);
  if(!set || set.length < 2) return null;
  return { correct: set[0], options: shuffle(set) };
}

// Every team game asks its turn question through this. Every other turn
// (the 2nd, 4th, ...) is multiple choice when the question allows it, so
// a game always mixes the two, and a game's first question is always
// the open kind.
// `label` is an optional line above the question (Whack-a-Jelly uses it
// for "Lane 2 of 4": one question per student before the team plays).
// A question borrowed from another game's bank (js/questionDeck.js) takes
// its wrong options from that bank, where the answers look like its own.
export function askTeamQuestion(q, bank, turnIndex, { label = '' } = {}){
  markAsked(q);
  const choices = turnIndex % 2 === 1 ? buildChoices(q, homeBank(q) || bank) : null;
  return showQuestionModal(q.prompt, q.answer, { showFollowup: true, choices, label });
}
