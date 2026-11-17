import { goToStage } from '../navigation.js';
import { shuffle, escapeHtml } from '../utils.js';
import { sfxCorrect, sfxIncorrect } from '../audio.js';
import { getCurrentLesson } from '../lessons.js';
import { QS_SETS } from '../content/stage9-questions.js';

// Gap-fill answers are typed, so a keyboard's straight apostrophe has to
// match the curly one the content uses (won't / won’t), along with case
// and stray spaces either side.
function sameAnswer(typed, answer){
  const norm = (t) => String(t || '').trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
  return norm(typed) === norm(answer);
}

/* =========================================================
   STAGE 9 — PRACTICE QUESTIONS + WORKSHEET PRINT
   Four sets each progressively freer (gap fill → unscramble →
   sentence writing → free writing). All questions in a section
   render at once; the class checks the whole section together,
   then moves on to the next section.
========================================================= */

let qsState={setIndex:0,score:0,checked:false,scrambleState:[],completedSets:new Set()};

export function initQs(){
  qsState={setIndex:0,score:0,checked:false,scrambleState:[],completedSets:new Set()};
  renderQsTabs(); renderQsSection();
}

function renderQsTabs(){
  document.getElementById('qsSetTabs').innerHTML=QS_SETS.map((s,i)=>`
    <button class="qs-tab${i===qsState.setIndex?' active':''}${qsState.completedSets.has(i)?' completed':''}" data-i="${i}">${s.label}</button>`).join('');
  document.getElementById('qsSetTabs').querySelectorAll('.qs-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      qsState.setIndex=Number(btn.dataset.i);
      renderQsTabs(); renderQsSection();
    });
  });
}

function renderQsSection(){
  const set=QS_SETS[qsState.setIndex];
  qsState.checked=false; qsState.score=0;
  document.getElementById('qsCheckBtn').classList.remove('hidden');
  document.getElementById('qsCheckBtn').disabled=false;
  document.getElementById('qsCheckBtn').textContent='Check answers';
  document.getElementById('qsNextBtn').classList.add('hidden');
  const fb=document.getElementById('qsFeedback');
  fb.className='qs-feedback hidden'; fb.textContent='';
  document.getElementById('qsProgressFill').style.width='0%';
  document.getElementById('qsScore').textContent=`${set.questions.length} Qs`;

  qsState.scrambleState = set.type==='scramble'
    ? set.questions.map(q=>({bank:shuffle(q.chips.map((t,i)=>({id:i,text:t}))),answer:[]}))
    : [];

  const area=document.getElementById('qsQuestionArea');
  area.innerHTML=`<p class="qs-set-desc">${escapeHtml(set.desc)}</p>
    <div class="qs-q-list">${set.questions.map((q,qi)=>renderQuestionCard(set,q,qi)).join('')}</div>`;

  if(set.type==='scramble'){
    set.questions.forEach((q,qi)=>renderScrambleQuestion(qi));
  }
}

function renderQuestionCard(set,q,qi){
  let body;
  if(set.type==='gap'){
    body=`<div class="qs-gap-fill">${q.prompt.split('___').map((p,i,a)=>
      `<span>${escapeHtml(p)}</span>${i<a.length-1?`<input class="qs-gap" data-qi="${qi}" placeholder="…" autocomplete="off">`:''}`).join('')}</div>`;
  } else if(set.type==='scramble'){
    body=`<div class="qs-chosen-strip" id="qsStrip-${qi}"></div>
      <div class="qs-scramble-chips" id="qsChips-${qi}"></div>`;
  } else if(set.type==='sentence'){
    body=`<p class="qs-q-prompt">${escapeHtml(q.prompt)}</p>
      <p class="qs-q-hint">${escapeHtml(q.hint)}</p>
      <textarea class="qs-free-textarea" data-qi="${qi}" rows="2" placeholder="Write your sentence here…"></textarea>`;
  } else {
    body=`<p class="qs-q-prompt">${escapeHtml(q.prompt)}</p>
      <textarea class="qs-free-textarea" data-qi="${qi}" rows="4" placeholder="Write here…"></textarea>`;
  }
  return `<div class="qs-q-card" data-qi="${qi}">
    <span class="qs-q-num">${qi+1}</span>
    <div class="qs-q-body">${body}</div>
  </div>`;
}

// A scramble question locks only once IT is correct — not whenever the
// section as a whole has been checked — so an incorrect one stays
// rearrangeable for a retry after "Check again".
function isScrambleQuestionLocked(qi){
  const card=document.querySelector(`.qs-q-card[data-qi="${qi}"]`);
  return !!card && card.classList.contains('correct');
}

function renderScrambleQuestion(qi){
  const st=qsState.scrambleState[qi];
  const strip=document.getElementById(`qsStrip-${qi}`);
  strip.innerHTML=st.answer.map(c=>`<button class="chip answer-chip" data-id="${c.id}">${escapeHtml(c.text)}</button>`).join('');
  strip.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(isScrambleQuestionLocked(qi))return;
      const c=st.answer.find(x=>x.id===Number(btn.dataset.id));
      st.answer=st.answer.filter(x=>x.id!==Number(btn.dataset.id));
      st.bank.push(c); renderScrambleQuestion(qi);
    });
  });
  const bank=document.getElementById(`qsChips-${qi}`);
  bank.innerHTML=st.bank.map(c=>`<button class="chip" data-id="${c.id}">${escapeHtml(c.text)}</button>`).join('');
  bank.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(isScrambleQuestionLocked(qi))return;
      const c=st.bank.find(x=>x.id===Number(btn.dataset.id));
      st.bank=st.bank.filter(x=>x.id!==Number(btn.dataset.id));
      st.answer.push(c); renderScrambleQuestion(qi);
    });
  });
}

// Strips prior correct/incorrect/reviewed marks from a question card (and
// its input/strip) so it can be graded again — needed because checkSection
// and checkSingleQuestion can now both run more than once per question,
// to let a learner fix a wrong answer and check it again.
function clearGradeClasses(card){
  card.classList.remove('correct','incorrect','reviewed');
  card.querySelectorAll('.qs-gap, .qs-chosen-strip').forEach(el=>el.classList.remove('correct','incorrect'));
}

function checkSection(){
  const set=QS_SETS[qsState.setIndex];
  qsState.checked=true; qsState.score=0;
  const graded = set.type==='gap' || set.type==='scramble';

  set.questions.forEach((q,qi)=>{
    const card=document.querySelector(`.qs-q-card[data-qi="${qi}"]`);
    clearGradeClasses(card);
    if(set.type==='gap'){
      const inp=card.querySelector('.qs-gap');
      const correct=sameAnswer(inp?.value, q.answer);
      inp?.classList.add(correct?'correct':'incorrect');
      // Only lock in a CORRECT answer — an incorrect one stays editable
      // so the learner can fix it and check again.
      if(inp)inp.disabled=correct;
      card.classList.add(correct?'correct':'incorrect');
      if(correct)qsState.score++;
    } else if(set.type==='scramble'){
      const st=qsState.scrambleState[qi];
      const built=st.answer.map(c=>c.text).join(' ');
      const correct=built===q.answer;
      document.getElementById(`qsStrip-${qi}`)?.classList.add(correct?'correct':'incorrect');
      card.classList.add(correct?'correct':'incorrect');
      if(correct)qsState.score++;
    } else {
      const ta=card.querySelector('.qs-free-textarea');
      if(ta)ta.disabled=true;
      card.classList.add('reviewed');
    }
  });

  const fb=document.getElementById('qsFeedback');
  if(graded){
    fb.textContent=`${qsState.score}/${set.questions.length} correct.`;
    fb.className=`qs-feedback ${qsState.score===set.questions.length?'correct':'incorrect'}`;
    document.getElementById('qsScore').textContent=`${qsState.score}/${set.questions.length}`;
    qsState.score===set.questions.length ? sfxCorrect() : sfxIncorrect();
  } else {
    fb.textContent='Check your writing with your teacher or partner. Press Next when ready.';
    fb.className='qs-feedback info';
    document.getElementById('qsScore').textContent=`${set.questions.length}/${set.questions.length}`;
    sfxCorrect();
  }
  fb.classList.remove('hidden');
  document.getElementById('qsProgressFill').style.width='100%';

  // If anything's still wrong, keep the check button around (re-labelled)
  // instead of forcing the learner straight to Next — that's the whole
  // point of allowing a recheck.
  const checkBtn=document.getElementById('qsCheckBtn');
  const allCorrect = !graded || qsState.score===set.questions.length;
  if(graded && !allCorrect){
    checkBtn.textContent='Check again';
    checkBtn.classList.remove('hidden');
  } else {
    checkBtn.classList.add('hidden');
  }
  document.getElementById('qsNextBtn').classList.remove('hidden');
  document.getElementById('qsNextBtn').textContent = qsState.setIndex<QS_SETS.length-1 ? 'Next section →' : 'Finish';

  qsState.completedSets.add(qsState.setIndex);
  renderQsTabs();
}

function goToNextSection(){
  if(qsState.setIndex<QS_SETS.length-1){
    qsState.setIndex++;
    renderQsTabs(); renderQsSection();
  } else {
    const fb=document.getElementById('qsFeedback');
    fb.textContent='All sections complete! Try another set or print the worksheet.';
    fb.className='qs-feedback info'; fb.classList.remove('hidden');
    document.getElementById('qsNextBtn').classList.add('hidden');
  }
}

document.getElementById('qsCheckBtn').addEventListener('click',checkSection);
document.getElementById('qsNextBtn').addEventListener('click',goToNextSection);

// Grades just ONE question, not the whole section — used by Enter (see
// below). Deliberately separate from checkSection: a teacher who has
// only answered question 1 so far and hits Enter wants feedback on
// THAT answer, not every still-blank question in the section flagged
// incorrect. Section-level score/progress/Next-button state is
// untouched here; only the full "Check answers" button drives those.
function checkSingleQuestion(qi){
  const set=QS_SETS[qsState.setIndex];
  const q=set.questions[qi];
  const card=document.querySelector(`.qs-q-card[data-qi="${qi}"]`);
  // Once correct (or, for ungraded types, reviewed) there's nothing left to
  // redo — but an incorrect answer stays checkable so a learner can fix it
  // and press Enter again.
  if(!card || card.classList.contains('correct') || card.classList.contains('reviewed')) return;
  clearGradeClasses(card);

  if(set.type==='gap'){
    const inp=card.querySelector('.qs-gap');
    const correct=sameAnswer(inp?.value, q.answer);
    inp?.classList.add(correct?'correct':'incorrect');
    if(inp)inp.disabled=correct;
    card.classList.add(correct?'correct':'incorrect');
    correct?sfxCorrect():sfxIncorrect();
  } else if(set.type==='scramble'){
    const st=qsState.scrambleState[qi];
    const built=st.answer.map(c=>c.text).join(' ');
    const correct=built===q.answer;
    document.getElementById(`qsStrip-${qi}`)?.classList.add(correct?'correct':'incorrect');
    card.classList.add(correct?'correct':'incorrect');
    correct?sfxCorrect():sfxIncorrect();
  } else {
    card.classList.add('reviewed');
  }
}

/* Enter-to-check: grades only the question the focused input belongs to
   (via the nearest .qs-q-card), never the whole section. Textareas are
   excluded so Enter still inserts a newline while writing free/sentence
   answers instead of submitting. */
document.getElementById('qsQuestionArea').addEventListener('keydown',(e)=>{
  if(e.key!=='Enter'||e.target.tagName==='TEXTAREA')return;
  const card=e.target.closest('.qs-q-card');
  if(!card)return;
  e.preventDefault();
  checkSingleQuestion(Number(card.dataset.qi));
});

document.getElementById('qsPrintBtn').addEventListener('click',()=>{
  renderPrintableWorksheet();
  document.getElementById('printableWorksheet').classList.add('active-print');
  document.getElementById('printableRules').classList.remove('active-print');
  window.print();
  setTimeout(()=>document.getElementById('printableWorksheet').classList.remove('active-print'),500);
});

// Unscramble answers are stored chip by chip ("Who will set the table ?"),
// which reads oddly on paper; close the gap before punctuation.
function tidyChips(text){ return text.replace(/ ([?.!,])/g, '$1'); }

function renderPrintableWorksheet(){
  const lesson=getCurrentLesson();
  const ws=document.getElementById('printableWorksheet');
  ws.innerHTML=`
    <h1>${lesson.printWorksheetTitle}</h1>
    <p class="print-subtitle">Name: __________________ &nbsp;&nbsp; Class: __________________ &nbsp;&nbsp; Date: __________________</p>
    ${QS_SETS.map((set,si)=>`
      <div class="ws-set-title">Section ${si+1}: ${set.label}</div>
      <div class="ws-set-label">${escapeHtml(set.desc)}</div>
      ${set.questions.map((q,qi)=>`
        <div class="ws-q">
          <div class="ws-q-prompt">${qi+1}. ${escapeHtml(set.type==='scramble'?shuffle(q.chips).join(' / '):(q.prompt||''))}</div>
          <div class="ws-answer-line"></div>
          ${set.type==='free'?'<div class="ws-answer-line"></div><div class="ws-answer-line"></div>':''}
        </div>`).join('')}
    `).join('')}
    <div class="answer-key">
      <h3>Answer Key (Gap Fill &amp; Unscramble)</h3>
      <ol>${QS_SETS[0].questions.map(q=>`<li>${escapeHtml(q.answer)}</li>`).join('')}
          ${QS_SETS[1].questions.map(q=>`<li>${escapeHtml(tidyChips(q.answer))}</li>`).join('')}</ol>
    </div>
    <p class="print-footer">${lesson.printFooter}</p>`;
}

document.getElementById('qsBackBtn').addEventListener('click', () => goToStage(8));
