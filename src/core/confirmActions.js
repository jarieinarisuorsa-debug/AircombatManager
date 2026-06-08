import { updateState, getState } from "../state/store.js";
import { handleAction, registerAction } from "./actionRegistry.js";
import { renderApp } from "../main.js";
import { openAlertModal } from "./alertActions.js";

export function openConfirmModal(config) {
  updateState((state) => {
    state.settings.confirmModalOpen = true;
    state.settings.confirmModalConfig = {
      title: config.title || "Vahvista",
      message: config.message || "Oletko varma?",
      htmlMessage: config.htmlMessage || null,
      requireText: config.requireText || null,
      isPrompt: config.isPrompt === true,
      promptDefault: config.promptDefault || "",
      action: config.action,
      payload: config.payload || {},
      isDanger: config.isDanger !== false,
      submitLabel: config.submitLabel || "OK",
      hideCancel: config.hideCancel || false
    };
  }, "open_confirm_modal");
  renderApp();
}

export function closeConfirmModal() {
  updateState((state) => {
    state.settings.confirmModalOpen = false;
    state.settings.confirmModalConfig = null;
  }, "close_confirm_modal");
}

export function initConfirmActions() {
  registerAction("close-confirm-modal", (event, button, { renderApp }) => {
    closeConfirmModal();
    renderApp();
    return true;
  });

  registerAction("execute-confirm-modal", (event, form, { renderApp }) => {
    const state = getState();
    const config = state.settings.confirmModalConfig;
    if (!config) return true;

    if (config.requireText) {
      const formData = new FormData(form);
      const typed = (formData.get("confirmText") || "").trim();
      if (typed !== config.requireText) {
        openAlertModal({ title: "Virhe", message: `Vahvistusteksti ei täsmää. Kirjoita: ${config.requireText}` });
        return true;
      }
    }

    closeConfirmModal();

    if (config.action) {
      const syntheticButton = document.createElement("button");
      if (config.payload) {
        for (const [key, value] of Object.entries(config.payload)) {
          syntheticButton.dataset[key] = value;
        }
      }

      if (config.isPrompt) {
        const formData = new FormData(form);
        const promptResult = formData.get("promptResult");
        if (promptResult !== null) {
          syntheticButton.dataset.promptResult = promptResult;
        }
      }

      handleAction(config.action, event, syntheticButton, { renderApp, getState, updateState });
    } else {
      renderApp();
    }
    return true;
  });
}
