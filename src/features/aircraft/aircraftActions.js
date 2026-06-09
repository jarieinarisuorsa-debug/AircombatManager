import { createId, updateState, getState } from "../../state/store.js";
import { t } from "../../utils/i18n.js";
import { requireAdmin, requirePilotAccess } from "../../users/roles.js";
import { requireFloat, requireText } from "../../utils/formValues.js";
import { removeEntriesById } from "../entries/entryActions.js";
import { registerAction } from "../../core/actionRegistry.js";
import { openConfirmModal } from "../../core/confirmActions.js";
import { openAircraftSpecForm, closeAircraftSpecForm } from "../settings/settingsActions.js";

export function addAircraft(data) {
  updateState((state) => {
    requirePilotAccess(state, data.pilotId);
    if (!state.pilots.some((pilot) => pilot.id === data.pilotId)) throw new Error("Valitse koneelle pilotti.");
    state.aircraft.push({
      id: createId("aircraft"),
      pilotId: data.pilotId,
      name: requireText(data.name, "Koneen nimi puuttuu."),
      className: requireText(data.className, "Koneen luokka puuttuu."),
      engine: data.engine || "Other",
      engineModel: String(data.engineModel || "").trim(),
      battery: String(data.battery || "").trim(),
      propeller: String(data.propeller || "").trim(),
      modelPoints: {
        fourStroke: data.modelPoints_fourStroke === "on" || data.modelPoints_fourStroke === true,
        multiwing: data.modelPoints_multiwing === "on" || data.modelPoints_multiwing === true,
        ribStructure: data.modelPoints_ribStructure === "on" || data.modelPoints_ribStructure === true,
        onboardPilot: data.modelPoints_onboardPilot === "on" || data.modelPoints_onboardPilot === true,
        weapons: data.modelPoints_weapons === "on" || data.modelPoints_weapons === true,
        riggingStruts: data.modelPoints_riggingStruts === "on" || data.modelPoints_riggingStruts === true
      },
      techStatus: data.techStatus || "pending"
    });
  }, "add_aircraft");
}

export function updateAircraft(data) {
  updateState((state) => {
    const aircraft = state.aircraft.find(a => a.id === data.aircraftId);
    if (!aircraft) throw new Error("Konekorttia ei löytynyt.");
    requirePilotAccess(state, aircraft.pilotId);
    
    if (data.name) aircraft.name = requireText(data.name, "Koneen nimi puuttuu.");
    if (data.className) aircraft.className = requireText(data.className, "Koneen luokka puuttuu.");
    if (data.engine) aircraft.engine = data.engine;
    if (data.engineModel !== undefined) aircraft.engineModel = String(data.engineModel).trim();
    if (data.battery !== undefined) aircraft.battery = String(data.battery).trim();
    if (data.propeller !== undefined) aircraft.propeller = String(data.propeller).trim();
    
    // Always parse checkboxes when updating
    aircraft.modelPoints = {
      fourStroke: data.modelPoints_fourStroke === "on" || data.modelPoints_fourStroke === true,
      multiwing: data.modelPoints_multiwing === "on" || data.modelPoints_multiwing === true,
      ribStructure: data.modelPoints_ribStructure === "on" || data.modelPoints_ribStructure === true,
      onboardPilot: data.modelPoints_onboardPilot === "on" || data.modelPoints_onboardPilot === true,
      weapons: data.modelPoints_weapons === "on" || data.modelPoints_weapons === true,
      riggingStruts: data.modelPoints_riggingStruts === "on" || data.modelPoints_riggingStruts === true
    };

    if (data.techStatus) aircraft.techStatus = data.techStatus;
    
    state.settings = state.settings || {};
    state.settings.editingAircraftId = null;
  }, "update_aircraft");
}

export function addAircraftSpec(data) {
  updateState((state) => {
    requireAdmin(state);
    state.aircraftSpecs.push({
      id: createId("spec"),
      name: requireText(data.name, "Konetyypin nimi puuttuu."),
      realSpanM: requireFloat(data.realSpanM, "Kärkiväli puuttuu tai on virheellinen."),
      realLengthM: requireFloat(data.realLengthM, "Pituus puuttuu tai on virheellinen.")
    });
  }, "add_aircraft_spec");
}

export function deleteAircraftSpec(specId) {
  updateState((state) => {
    requireAdmin(state);
    state.aircraftSpecs = state.aircraftSpecs.filter((spec) => spec.id !== specId);
  }, "delete_aircraft_spec");
}

export function deleteAircraft(aircraftId) {
  updateState((state) => {
    const aircraft = state.aircraft.find(a => a.id === aircraftId);
    if (aircraft) requirePilotAccess(state, aircraft.pilotId);
    
    const entryIds = new Set(state.entries.filter((entry) => entry.aircraftId === aircraftId).map((entry) => entry.id));
    removeEntriesById(state, entryIds);
    state.aircraft = state.aircraft.filter((aircraft) => aircraft.id !== aircraftId);
  }, "delete_aircraft_cascade");
}

export function initAircraftActions() {
  registerAction("focus-aircraft-spec-form", (event, button, { renderApp }) => {
    openAircraftSpecForm();
    renderApp();
    window.requestAnimationFrame(() => {
      const form = document.getElementById("aircraft-spec-form");
      if (!form) return;
      const firstInput = form.querySelector('input:not([type="hidden"])');
      if (firstInput) firstInput.focus();
    });
    return true;
  });

  registerAction("set-aircraft-tab", (event, button, { renderApp }) => {
    window.AIRCRAFT_TAB = button.dataset.tab;
    renderApp();
    return true;
  });

  registerAction("close-aircraft-spec-form", (event, button, { renderApp }) => {
    closeAircraftSpecForm();
    renderApp();
    return true;
  });

  registerAction("toggle-add-aircraft-form", (event, button) => {
    const pilotId = button.dataset.pilotId;
    const form = document.querySelector(`#add-aircraft-form-${pilotId}`);
    const toggleBtn = document.querySelector(`#toggle-add-aircraft-btn-${pilotId}`);
    if (!form) return true;

    const isHidden = form.style.display === "none";
    form.style.display = isHidden ? "grid" : "none";
    if (toggleBtn) {
      toggleBtn.textContent = isHidden ? t(getState(), "aircraft_actions.cancel") : t(getState(), "aircraft_actions.add_aircraft");
    }
    if (isHidden) form.querySelector('input[name="name"]')?.focus();
    return true;
  });

  registerAction("edit-aircraft", (event, button, { renderApp }) => {
    updateState(state => {
      state.settings = state.settings || {};
      state.settings.editingAircraftId = button.dataset.aircraftId;
    });
    renderApp();
    return true;
  });

  registerAction("cancel-edit-aircraft", (event, button, { renderApp }) => {
    updateState(state => {
      state.settings = state.settings || {};
      state.settings.editingAircraftId = null;
    });
    renderApp();
    return true;
  });

  registerAction("delete-aircraft", (event, button) => {
    openConfirmModal({
      title: t(getState(), "aircraft_actions.del_aircraft_title"),
      message: t(getState(), "aircraft_actions.del_aircraft_msg"),
      action: "execute-delete-aircraft",
      payload: { aircraftId: button.dataset.aircraftId },
      requireText: t(getState(), "settings_actions.delete_word")
    });
    return true;
  });

  registerAction("execute-delete-aircraft", (event, button, { renderApp }) => {
    deleteAircraft(button.dataset.aircraftId);
    renderApp();
    return true;
  });

  registerAction("delete-aircraft-spec", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: t(getState(), "aircraft_actions.del_type_title"),
      message: "Poistetaanko konetyyppi taulukosta?",
      action: "execute-delete-aircraft-spec",
      payload: { specId: button.dataset.specId }
    });
    return true;
  });

  registerAction("execute-delete-aircraft-spec", (event, button, { renderApp }) => {
    requireAdmin(getState());
    deleteAircraftSpec(button.dataset.specId);
    renderApp();
    return true;
  });
}
