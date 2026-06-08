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
    const { getState } = await import("../state/store.js");
    const { isAdmin, isUserAdmin } = await import("../users/roles.js");
    const state = getState();
    const userIsAdmin = isAdmin(state);
    const actualAdmin = isUserAdmin(state);

    let senderId = null;
    
    // Yritetään ensin löytää aito pilottiprofiili
    const email = state.auth?.user?.email || state.settings?.userEmail || "";
    const pilot = (state.pilots || []).find(p => p.email && p.email.toLowerCase().trim() === email.toLowerCase().trim());
    
    if (userIsAdmin) {
      senderId = "admin"; // Admin-tilassa aina Järjestäjä
    } else if (pilot) {
      senderId = pilot.id; // Pilotti-tilassa, jos oma profiili löytyy, käytetään sitä
    } else if (actualAdmin && state.pilots?.length > 0) {
      senderId = state.pilots[0].id; // Admin-esikatselu, jos omaa profiilia ei ole
    }

    if (!senderId) {
      const { showToast } = await import("../ui/toast.js");
      showToast("Virhe: Pilottiprofiilia ei löytynyt.", "error");
      return;
    }

    const { sendMessage } = await import("../features/messages/messageActions.js");
    const sent = sendMessage(senderId, data.content);
    
    // Clear the input only if message was successfully sent (cooldown didn't block it)
    if (sent !== false) {
      form.reset();
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
    const originalContent = submitBtn ? submitBtn.innerHTML : "Tallenna";

    const isConfirmModal = action === "execute-confirm-modal";

    if (submitBtn && !isConfirmModal) {
      submitBtn.disabled = true;
      if (submitBtn.dataset.noLoadingText !== "true") {
        submitBtn.innerHTML = "Tallennetaan...";
      }
    }

    const executeSubmit = async () => {
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
        if (action !== "update-pilot-details" && action !== "update-aircraft" && action !== "auth-login" && action !== "send-message") form.reset();
        
        form.removeAttribute("data-dirty");
        if (!isConfirmModal) {
          updateState((state) => {
            state.settings = state.settings || {};
            state.settings.lastSave = { action, id: form.id || null, time: Date.now() };
          }, "save_feedback");
        }

        if (action !== "send-message") {
          renderApp();
        }
        
        if (!isConfirmModal && form.dataset.noFeedback !== "true") {
          showToast("Tiedot tallennettu", "success");
        }
      } catch (error) {
        console.error("Submit error:", error);
        openAlertModal({ message: error.message });
      } finally {
        if (submitBtn && !isConfirmModal) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
        }
      }
    };

    if (form.dataset.noFeedback === "true") {
      executeSubmit();
    } else {
      setTimeout(executeSubmit, 400);
    }
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
