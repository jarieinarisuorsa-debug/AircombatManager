// ==============================
// Aircombat Competition Manager
// src/controllers/submitController.js
// Päivitetty: 2026-06-04
// ==============================
// Form-submit dispatcher. Varsinainen logiikka on action-moduuleissa.
// ==============================

import { addAircraft, addAircraftSpec, updateAircraft } from "../features/aircraft/aircraftActions.js";
import { addEntry, saveRaceNumbers } from "../features/entries/entryActions.js";
import { addEvent, updateCompetitionFormat, updateEventInfo, addEventSponsor, saveEventScheduleRow } from "../features/events/eventActions.js";
import { addPilot, updatePilotDetails } from "../features/pilots/pilotActions.js";
import { saveResult } from "../features/results/resultActions.js";
import { saveScoreCard } from "../features/scorecards/scorecardActions.js";
import { closeAircraftSpecForm, closeCompetitionFormatModal, closeEventForm, saveSettings, loginUser } from "../features/settings/settingsActions.js";
import { sendMessage } from "../features/messages/messageActions.js";
import { showToast } from "../ui/toast.js";
import { updateState } from "../state/store.js";
import { openAlertModal } from "../core/alertActions.js";
import { handleAction } from "../core/actionRegistry.js";

const SUBMIT_ACTIONS = {
  "add-event": addEvent,
  "save-competition-format": updateCompetitionFormat,
  "save-event-info": updateEventInfo,
  "add-event-sponsor": addEventSponsor,
  "save-event-schedule-row": saveEventScheduleRow,
  "add-pilot": addPilot,
  "update-pilot-details": updatePilotDetails,
  "add-aircraft": addAircraft,
  "update-aircraft": updateAircraft,
  "add-aircraft-spec": addAircraftSpec,
  "add-entry": addEntry,
  "save-race-numbers": saveRaceNumbers,
  "save-result": saveResult,
  "save-score-card": saveScoreCard,
  "save-settings": saveSettings,
  "login-user": loginUser,
  "send-message": async (data, form) => {
    const receiverId = form.dataset.receiver;
    const { getState } = await import("../state/store.js");
    const { isAdmin } = await import("../users/roles.js");
    const { getMyPilotId } = await import("../features/messages/messagesView.js");
    const state = getState();
    const senderId = isAdmin(state) ? "admin" : getMyPilotId(state);
    if (senderId && receiverId && data.content) {
      sendMessage(senderId, receiverId, data.content);
    }
  }
};


export function createSubmitHandler({ renderApp }) {
  return function handleSubmit(event) {
    const form = event.target.closest("form[data-action]");
    if (!form) return;
    
    // Salli selaimen oma HTML5-validointi (esim. required, type="email")
    if (!form.checkValidity()) {
      return; 
    }
    
    event.preventDefault();

    const action = form.dataset.action;
    const handler = SUBMIT_ACTIONS[action];
    if (!handler && !action) return;

    const data = readFormData(form, action);

    if (event.submitter && event.submitter.name) {
      data[event.submitter.name] = event.submitter.value;
    }

    const submitBtn = event.submitter || form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerText : "Tallenna";

    const isConfirmModal = action === "execute-confirm-modal";

    if (submitBtn && !isConfirmModal) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Tallennetaan...";
    }

    setTimeout(async () => {
      try {
        let result;
        if (handler) {
          result = await handler(data, form);
        } else {
          result = await handleAction(action, event, form, { renderApp, data });
        }
        
        if (action === "add-pilot" && result) {
          location.hash = `#/pilot/${result}`;
          showToast("Tiedot tallennettu", "success");
          return; // Redirect will trigger a re-render
        }
        if (action === "save-race-numbers") {
          location.hash = `#/entries`;
          showToast("Tiedot tallennettu", "success");
          return;
        }
        if (action === "add-aircraft-spec") {
          closeAircraftSpecForm();
        }
        if (action === "add-event") {
          closeEventForm();
        }
        if (action === "save-competition-format") {
          closeCompetitionFormatModal();
        }
        if (action !== "update-pilot-details" && action !== "update-aircraft" && action !== "auth-login") form.reset();
        
        form.removeAttribute("data-dirty");
        if (!isConfirmModal) {
          updateState((state) => {
            state.settings = state.settings || {};
            state.settings.lastSave = { action, id: form.id || null, time: Date.now() };
          }, "save_feedback");
        }

        renderApp();
        if (!isConfirmModal) {
          showToast("Tiedot tallennettu", "success");
        }
      } catch (error) {
        console.error("Submit error:", error);
        openAlertModal({ message: error.message });
      } finally {
        if (submitBtn && !isConfirmModal) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      }
    }, 400);
  };
}

function readFormData(form, action) {
  if (action !== "save-score-card") {
    const data = {};
    const formData = new FormData(form);
    for (const key of new Set(formData.keys())) {
      const values = formData.getAll(key);
      data[key] = values.length > 1 ? values.join(',') : values[0];
    }
    return data;
  }

  const data = {};

  Array.from(form.elements).forEach((element) => {
    if (!element.name || element.disabled) return;
    if (["button", "submit", "reset"].includes(element.type)) return;

    // The paper-like score sheet is print-only on screen. Do not let its duplicate fields
    // override the responsive screen editor values.
    if (element.closest(".score-sheet-desktop")) return;

    if ((element.type === "checkbox" || element.type === "radio") && !element.checked) return;

    data[element.name] = element.type === "checkbox" ? "on" : element.value;
  });

  return data;
}
