/* =========================================================
   PRINTING AN ACTIVITY HANDOUT (Running dictation, Survey)
   Same trick as the rules and worksheet prints: fill a hidden
   container, mark it .active-print (css/print.css hides everything
   else when printing), print, then unmark it.
========================================================= */
export function printActivity(html){
  const box = document.getElementById('printableActivity');
  box.innerHTML = html;
  ['printableRules', 'printableWorksheet'].forEach(id => document.getElementById(id).classList.remove('active-print'));
  box.classList.add('active-print');
  window.print();
  setTimeout(() => box.classList.remove('active-print'), 500);
}
