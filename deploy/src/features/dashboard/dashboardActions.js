import { registerAction } from "../../core/actionRegistry.js";
import { saveDashboardNotice } from "../settings/settingsActions.js";
import { showToast } from "../../ui/toast.js";

export function initDashboardActions() {
  registerAction("save-dashboard-notice", (event, button) => {
    const eventId = button.dataset.eventId;
    const noticeText = document.getElementById("dashboard-public-notice")?.value || "";
    saveDashboardNotice(eventId, noticeText);
    showToast("Ajankohtaiset tiedot tallennettu ja julkaistu!", "success");
    return true;
  });

  registerAction('set-my-event-tab', (event, button, { renderApp }) => {
    window.MY_EVENT_TAB = button.dataset.tab;
    renderApp();
    return true;
  });

  registerAction('set-admin-dashboard-tab', (event, button, { updateState }) => {
    updateState(state => {
      state.settings = state.settings || {};
      state.settings.adminDashboardClassTab = button.dataset.tab;
    });
    return true;
  });
}
