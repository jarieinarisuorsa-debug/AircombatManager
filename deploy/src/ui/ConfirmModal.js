import { escapeHtml } from "../utils/html.js";

export function renderConfirmModal(state) {
  if (!state.settings?.confirmModalOpen) return "";
  const config = state.settings.confirmModalConfig || {};
  
  const textInputHtml = config.requireText ? `
    <div style="margin: 20px 0;">
      <label class="ui-label" style="display: block; margin-bottom: 8px;">Kirjoita <strong style="user-select: none;">${escapeHtml(config.requireText)}</strong> vahvistaaksesi:</label>
      <input type="text" name="confirmText" class="ui-input" autocomplete="off" style="width: 100%; border-color: var(--danger); font-family: monospace; font-size: 1.1em; letter-spacing: 1px;" required autofocus />
    </div>
  ` : config.isPrompt ? `
    <div style="margin: 20px 0;">
      <input type="text" name="promptResult" class="ui-input" value="${escapeHtml(config.promptDefault || '')}" autocomplete="off" style="width: 100%; font-size: 1.1em;" autofocus />
    </div>
  ` : "";

  const submitClass = config.isDanger !== false ? "danger" : "primary";

  return `
    <div class="app-modal-backdrop" style="z-index: 2000;" data-action="close-confirm-modal">
      <div class="app-modal-shell" role="dialog" aria-modal="true" style="max-width: 450px; ${config.isDanger !== false ? 'border: 2px solid var(--danger);' : ''}" data-action="none">
        <div class="app-modal-topbar">
          <h3 style="${config.isDanger !== false ? 'color: var(--danger);' : ''} margin: 0;">${escapeHtml(config.title)}</h3>
        </div>
        <div class="app-modal-content">
          <p style="margin-bottom: 20px; line-height: 1.5;">${escapeHtml(config.message)}</p>
          
          <form data-action="execute-confirm-modal" style="margin: 0;">
            ${textInputHtml}
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
              <button type="button" class="button" data-action="close-confirm-modal">Peruuta</button>
              <button type="submit" class="button ${submitClass}">${escapeHtml(config.submitLabel || "Poista")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}
