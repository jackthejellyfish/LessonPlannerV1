import { escapeHtml } from './utils.js';

/* =========================================================
   CONFIRM DIALOG
   Replaces the native confirm() everywhere in the app — a blocking
   browser-chrome alert looks out of place next to the app's own
   styled modals, and can't be styled/positioned at all. Reuses the
   same .overlay/.modal visual language as the question/result
   modals (see css/modals.css), so it reads as part of the app
   rather than an OS-level interruption.
========================================================= */
export function confirmDialog(message, { confirmLabel = 'Yes', cancelLabel = 'Cancel', danger = false } = {}){
  return new Promise(resolve => {
    const overlay = document.getElementById('confirmOverlay');
    const body = document.getElementById('confirmBody');
    body.innerHTML = `
      <p class="confirm-message">${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="confirmCancelBtn" type="button">${escapeHtml(cancelLabel)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmOkBtn" type="button">${escapeHtml(confirmLabel)}</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    const settle = (result) => {
      overlay.classList.add('hidden');
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };
    const onKeydown = (e) => {
      if(e.key === 'Escape') settle(false);
    };
    document.getElementById('confirmCancelBtn').addEventListener('click', () => settle(false));
    document.getElementById('confirmOkBtn').addEventListener('click', () => settle(true));
    document.addEventListener('keydown', onKeydown);
  });
}
