import { updateState, getState } from "../state/store.js";
import { registerAction } from "./actionRegistry.js";
import { renderApp } from "../main.js";

export function openAlertModal(config) {
  let title = config.title || "Virhe";
  // Attempt to guess a better title if not provided
  if (!config.title && config.message) {
    if (config.message.toLowerCase().includes("valitse")) {
      title = "Valinta puuttuu";
    } else if (config.message.toLowerCase().includes("puuttuu")) {
      title = "Pakollinen tieto puuttuu";
    }
  }

  updateState((state) => {
    state.settings.alertModalOpen = true;
    state.settings.alertModalConfig = {
      title: title,
      message: config.message || "Tuntematon virhe",
    };
  }, "open_alert_modal");
  renderApp();
}

export function closeAlertModal() {
  updateState((state) => {
    state.settings.alertModalOpen = false;
    state.settings.alertModalConfig = null;
  }, "close_alert_modal");
}

export function initAlertActions() {
  registerAction("close-alert-modal", (event, button, { renderApp }) => {
    closeAlertModal();
    renderApp();
    return true;
  });

  registerAction("show-credits", (event, button, { renderApp }) => {
    event.preventDefault(); // Prevent navigating to # and triggering router hashchange!
    import("./confirmActions.js").then(({ openConfirmModal }) => {
      openConfirmModal({
        title: "Aircombat Competition Manager",
        htmlMessage: "<p style='text-align: center; font-size: 1.1rem; margin-bottom: 20px;'>Tämä on demo!</p><p style='text-align: center;'>Ohjelman suunnitellut:<br/><strong style='color: var(--primary);'>Jari Suorsa &copy; 2026</strong></p>",
        isDanger: false,
        submitLabel: "Sulje",
        hideCancel: true
      });
    });
    return true;
  });
}

export function renderAlertModal(state) {
  if (!state.settings?.alertModalOpen) return "";

  const config = state.settings.alertModalConfig;
  if (!config) return "";

  return `
    <div class="app-modal-backdrop" data-action="close-alert-modal">
      <div class="app-modal-shell" role="alertdialog" aria-modal="true" data-action="none" style="max-width: 400px; text-align: center;">
        <div class="app-modal-topbar" style="border: none; padding-bottom: 0;">
          <h3 style="margin: 0 auto; color: var(--danger);">${config.title}</h3>
        </div>
        <div class="app-modal-content" style="padding: 20px;">
          <p style="margin: 0 0 20px 0; font-size: 1.1rem;">${config.message}</p>
          <button type="button" class="button primary" data-action="close-alert-modal" style="width: 100%; justify-content: center;">OK</button>
        </div>
      </div>
    </div>
  `;
}
