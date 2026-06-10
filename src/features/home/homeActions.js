import { registerAction } from "../../core/actionRegistry.js";
import { updateState, getState } from "../../state/store.js";
import { isUserAdmin } from "../../users/roles.js";
import { showToast } from "../../ui/toast.js";

export function initHomeActions() {
  registerAction("toggle-system-update-form", (event, el, { renderApp }) => {
    const state = getState();
    if (!isUserAdmin(state)) return;
    
    updateState((s) => {
      if (!s.settings) s.settings = {};
      s.settings.isEditingSystemUpdate = !s.settings.isEditingSystemUpdate;
    }, "toggle_system_update_form");
    
    renderApp();
  });

  registerAction("save-system-update", (event, form, { renderApp }) => {
    event.preventDefault();
    const state = getState();
    if (!isUserAdmin(state)) return;

    const formData = new FormData(form);
    const date = formData.get("date");
    const content = formData.get("content");

    if (!date || !content) {
      showToast("Täytä kaikki kentät.", "error");
      return;
    }

    updateState((s) => {
      if (!s.settings) s.settings = {};
      if (!s.settings.systemUpdates) s.settings.systemUpdates = [];
      
      s.settings.systemUpdates.push({
        id: "su-" + Date.now(),
        date: date,
        content: content,
        createdAt: new Date().toISOString()
      });
      s.settings.isEditingSystemUpdate = false;
    }, "save_system_update");

    showToast("Järjestelmäpäivitys julkaistu!", "success");
    renderApp();
  });

  registerAction("delete-system-update", (event, button, { renderApp }) => {
    const state = getState();
    if (!isUserAdmin(state)) return;

    const id = button.dataset.id;
    if (!id) return;

    if (!confirm("Haluatko varmasti poistaa tämän päivityslokin?")) return;

    updateState((s) => {
      if (!s.settings || !s.settings.systemUpdates) return;
      s.settings.systemUpdates = s.settings.systemUpdates.filter(u => u.id !== id);
    }, "delete_system_update");

    showToast("Päivitys poistettu.", "info");
    renderApp();
  });
}
