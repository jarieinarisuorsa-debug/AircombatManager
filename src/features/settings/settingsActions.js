import { updateState, exportState, resetState, importState, getState } from "../../state/store.js";
import { requireAdmin } from "../../users/roles.js";
import { registerAction } from "../../core/actionRegistry.js";
import { downloadTextFile } from "../../utils/html.js";
import { openConfirmModal } from "../../core/confirmActions.js";
import { openAlertModal } from "../../core/alertActions.js";
import { showToast } from "../../ui/toast.js";

export function toggleTheme() {
  updateState((state) => {
    state.settings.theme = state.settings.theme === "sunlight" ? "dark" : "sunlight";
  }, "toggle_theme");
}

export function saveDashboardNotice(eventId, noticeText) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === eventId);
    if (event) event.publicNotice = noticeText;
  }, "save_dashboard_notice");
}

export function setActiveEvent(eventId) {
  updateState((state) => {
    state.activeEventId = eventId;
  }, "set_active_event");
}

export function setSettingsTab(tabName) {
  updateState((state) => {
    state.settings.settingsTab = tabName;
  }, "set_settings_tab");
}

export function changeRole(role) {
  updateState((state) => {
    state.settings.currentRole = role;
  }, "change_role");
}

export function saveSettings(data, form) {
  updateState((state) => {
    requireAdmin(state);
    state.settings.organizerName = String(data.organizerName || "").trim();
    if (form.elements.publicDisplayMode) {
      state.settings.publicDisplayMode = Boolean(form.elements.publicDisplayMode.checked);
    }
  }, "save_settings");
}

export function addWhatsappReceiver(data) {
  updateState((state) => {
    requireAdmin(state);
    state.settings.whatsappReceivers = state.settings.whatsappReceivers || [];
    const phone = String(data.phone || "").trim().replace(/[^0-9+]/g, '');
    const apikey = String(data.apikey || "").trim();
    const name = String(data.name || "Nimetön").trim();
    
    if (!phone || !apikey) throw new Error("Puhelinnumero ja API-avain ovat pakollisia.");
    
    state.settings.whatsappReceivers.push({
      id: `wa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      phone,
      apikey
    });
    
    // Siivotaan vanhat yksittäiset kentät pois
    delete state.settings.whatsappPhone;
    delete state.settings.callMeBotApiKey;
  }, "add_whatsapp_receiver");
}

export function removeWhatsappReceiver(id) {
  updateState((state) => {
    requireAdmin(state);
    state.settings.whatsappReceivers = (state.settings.whatsappReceivers || []).filter(r => r.id !== id);
  }, "remove_whatsapp_receiver");
}

export function addPermission(data) {
  updateState((state) => {
    requireAdmin(state);
    state.permissions = state.permissions || [];
    const email = String(data.email || "").trim().toLowerCase();
    const role = String(data.role || "pilot").trim().toLowerCase();
    if (!email) throw new Error("Sähköposti puuttuu.");
    
    if (state.permissions.some(p => p.email.toLowerCase() === email)) {
      throw new Error("Käyttäjällä on jo määritetty rooli.");
    }
    
    state.permissions.push({
      id: `perm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      email,
      role
    });
  }, "add_permission");
}

export function updatePermissionRole(id, role) {
  updateState((state) => {
    requireAdmin(state);
    state.permissions = state.permissions || [];
    const perm = state.permissions.find(p => p.id === id);
    if (perm) {
      perm.role = role;
    }
  }, "update_permission_role");
}

export function removePermission(id) {
  updateState((state) => {
    requireAdmin(state);
    state.permissions = (state.permissions || []).filter(p => p.id !== id);
  }, "remove_permission");
}

export function loginUser(data) {
  updateState((state) => {
    const newEmail = String(data.userEmail || "").trim();
    state.settings.userEmail = newEmail;
    
    // Clear any manual debug role override so it evaluates properly based on email
    state.settings.currentRole = null;
  }, "login_user");
}



export function toggleAircraftSpecForm() {
  updateState((state) => {
    requireAdmin(state);
    state.settings.aircraftSpecFormOpen = !Boolean(state.settings.aircraftSpecFormOpen);
  }, "toggle_aircraft_spec_form");
}

export function openAircraftSpecForm() {
  updateState((state) => {
    requireAdmin(state);
    state.settings.aircraftSpecFormOpen = true;
  }, "open_aircraft_spec_form");
}

export function closeAircraftSpecForm() {
  updateState((state) => {
    requireAdmin(state);
    state.settings.aircraftSpecFormOpen = false;
  }, "close_aircraft_spec_form");
}

export function openEventForm() {
  updateState((state) => {
    requireAdmin(state);
    state.settings.eventFormOpen = true;
  }, "open_event_form");
}

export function closeEventForm() {
  updateState((state) => {
    requireAdmin(state);
    state.settings.eventFormOpen = false;
  }, "close_event_form");
}

export function openCompetitionFormatModal(className = "") {
  updateState((state) => {
    requireAdmin(state);
    state.settings.competitionFormatModalOpen = true;
    state.settings.competitionFormatModalClassName = String(className || "").trim();
  }, "open_competition_format_modal");
}

export function closeCompetitionFormatModal() {
  updateState((state) => {
    requireAdmin(state);
    state.settings.competitionFormatModalOpen = false;
    state.settings.competitionFormatModalClassName = "";
  }, "close_competition_format_modal");
}

export function initSettingsActions() {
  registerAction("add-permission", (event, form, { renderApp }) => {
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      addPermission(data);
      form.reset();
      renderApp();
      showToast("Käyttäjä lisätty", "success");
    } catch (e) {
      openAlertModal({ message: e.message });
    }
    return true;
  });

  registerAction("update-permission-role", (event, select, { renderApp }) => {
    updatePermissionRole(select.dataset.id, select.value);
    renderApp();
    showToast("Rooli päivitetty", "success");
    return true;
  });

  registerAction("remove-permission", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Poista oikeus",
      message: "Oletko varma että haluat poistaa tämän käyttäjän oikeudet?",
      action: "execute-remove-permission",
      payload: { id: button.dataset.id }
    });
    return true;
  });

  registerAction("execute-remove-permission", (event, button, { renderApp }) => {
    removePermission(button.dataset.id);
    renderApp();
    showToast("Käyttäjä poistettu", "success");
    return true;
  });

  registerAction("add-whatsapp-receiver", (event, form, { renderApp }) => {
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      addWhatsappReceiver(data);
      form.reset();
      renderApp();
      showToast("WhatsApp-ilmoitus tallennettu! Lähetetään testiviesti...", "success");

      const phone = String(data.phone || "").trim().replace(/[^0-9]/g, '');
      const apikey = String(data.apikey || "").trim();
      if (phone && apikey) {
        const msg = encodeURIComponent(`Testiviesti Aircombat Managerista! Tämä numero on nyt asennettu vastaanottamaan ilmoituksia järjestelmästä. ✅ (${new Date().toLocaleTimeString()})`);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${msg}&apikey=${apikey}`;
        fetch(url, { mode: 'no-cors' }).catch(err => console.error("WhatsApp test notification failed:", err));
      }

    } catch (e) {
      openAlertModal({ message: e.message });
    }
    return true;
  });

  registerAction("remove-whatsapp-receiver", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Poista ilmoitus",
      message: "Poistetaanko tämä WhatsApp-ilmoituksen saaja?",
      action: "execute-remove-whatsapp-receiver",
      payload: { id: button.dataset.id }
    });
    return true;
  });

  registerAction("test-whatsapp-receiver", (event, button) => {
    const state = getState();
    requireAdmin(state);
    const receiverId = button.dataset.id;
    const receiver = (state.settings.whatsappReceivers || []).find(r => r.id === receiverId);
    
    if (receiver) {
      showToast("Lähetetään testiviesti...", "info");
      const phone = String(receiver.phone || "").trim().replace(/[^0-9]/g, '');
      const apikey = String(receiver.apikey || "").trim();
      if (phone && apikey) {
        const msg = encodeURIComponent(`Manuaalinen testiviesti Aircombat Managerista! Yhteys toimii täydellisesti. ✅ (${new Date().toLocaleTimeString()})`);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${msg}&apikey=${apikey}`;
        fetch(url, { mode: 'no-cors' }).catch(err => console.error("WhatsApp test notification failed:", err));
      }
    }
    return true;
  });

  registerAction("execute-remove-whatsapp-receiver", (event, button, { renderApp }) => {
    removeWhatsappReceiver(button.dataset.id);
    renderApp();
    showToast("Vastaanottaja poistettu", "success");
    return true;
  });

  registerAction("set-settings-tab", (event, button, { renderApp }) => {
    setSettingsTab(button.dataset.tab);
    renderApp();
    return true;
  });

  registerAction("change-role", (event, select, { renderApp }) => {
    changeRole(select.value);
    renderApp();
    return true;
  });

  registerAction("login-user", (event, form, { renderApp }) => {
    const data = Object.fromEntries(new FormData(form).entries());
    loginUser(data);
    renderApp();
    return true;
  });

  registerAction("toggle-theme", (event, button, { renderApp }) => {
    toggleTheme();
    renderApp();
    return true;
  });

  registerAction("remove-org-logo", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Poista logo",
      message: "Poistetaanko yhdistyksen logo?",
      action: "execute-remove-org-logo",
      requireText: "POISTA"
    });
    return true;
  });

  registerAction("execute-remove-org-logo", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      if (state.settings) state.settings.organizationLogoData = null;
    }, "remove_org_logo");
    renderApp();
    return true;
  });

  registerAction("save-org-logo", (event, form, { renderApp, data }) => {
    updateState((state) => {
      requireAdmin(state);
      state.settings = state.settings || {};
      if (data && data.organizationLogoUrl !== undefined) {
        let url = String(data.organizationLogoUrl).trim();
        if (url.includes("dropbox.com") && url.includes("dl=0")) {
          url = url.replace("dl=0", "raw=1");
        }
        if (url !== "") {
          state.settings.organizationLogoData = url;
        }
      }
    }, "save_org_logo");
    renderApp();
    return true;
  });

  registerAction("export-json", (event, button, { renderApp }) => {
    requireAdmin(getState());
    downloadTextFile(`aircombat-competition-${new Date().toISOString().slice(0, 10)}.json`, exportState());
    return true;
  });

  registerAction("execute-import-json", (event, button, { renderApp }) => {
    try {
      importState(window.__PENDING_JSON_IMPORT__ || "");
      window.__PENDING_JSON_IMPORT__ = null;
      renderApp();
      showToast("JSON-tuonti onnistui.", "success");
    } catch (error) {
      openAlertModal({ message: error.message });
    }
    return true;
  });

  registerAction("reset-data", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Palauta demodata",
      message: "Palautetaanko demodata? Nykyinen selaimen localStorage-data korvataan kokonaan.",
      action: "execute-reset-data",
      requireText: "PALAUTA DEMODATA"
    });
    return true;
  });

  registerAction("execute-reset-data", (event, button, { renderApp }) => {
    requireAdmin(getState());
    resetState();
    renderApp();
    showToast("Demodata palautettu", "success");
    return true;
  });

  registerAction("open-event-form", (event, button, { renderApp }) => {
    openEventForm();
    renderApp();
    window.requestAnimationFrame(() => {
      const form = document.getElementById("event-form-modal");
      if (!form) return;
      const firstInput = form.querySelector("input, select, textarea");
      if (firstInput) {
        window.setTimeout(() => firstInput.focus(), 60);
      }
    });
    return true;
  });

  registerAction("close-event-form", (event, button, { renderApp }) => {
    closeEventForm();
    renderApp();
    return true;
  });

  registerAction("open-competition-format-modal", (event, button, { renderApp }) => {
    openCompetitionFormatModal(button.dataset.formatClass || "");
    renderApp();
    window.requestAnimationFrame(() => {
      const form = document.getElementById("competition-format-form");
      form?.querySelector("input, select, textarea")?.focus();
    });
    return true;
  });

  registerAction("close-competition-format-modal", (event, button, { renderApp }) => {
    closeCompetitionFormatModal();
    renderApp();
    return true;
  });
}
