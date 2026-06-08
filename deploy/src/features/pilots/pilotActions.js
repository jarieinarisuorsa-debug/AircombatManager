import { createId, updateState, getState } from "../../state/store.js";
import { requireAdmin, requirePilotAccess } from "../../users/roles.js";
import { requireText } from "../../utils/formValues.js";
import { removeEntriesById } from "../entries/entryActions.js";
import { registerAction } from "../../core/actionRegistry.js";
import { openConfirmModal } from "../../core/confirmActions.js";
import { openAlertModal } from "../../core/alertActions.js";

export function addPilot(data) {
  let newPilotId;
  updateState((state) => {
    requireAdmin(state);
    newPilotId = createId("pilot");
    state.pilots.push({
      id: newPilotId,
      name: requireText(data.name, "Pilotin nimi puuttuu."),
      country: String(data.country || "").trim().toUpperCase(),
      club: String(data.club || "").trim(),
      license: String(data.license || "").trim(),
      phone: String(data.phone || "").trim()
    });
  }, "add_pilot");
  return newPilotId;
}

export function updatePilotDetails(data) {
  updateState((state) => {
    const pilotId = String(data.pilotId || "").trim();
    requirePilotAccess(state, pilotId);
    
    const pilot = state.pilots.find((item) => item.id === pilotId);
    if (!pilot) throw new Error("Pilottia ei löytynyt.");

    if (data.name) pilot.name = String(data.name).trim();
    if (data.country !== undefined) pilot.country = String(data.country).trim().toUpperCase();
    if (data.club !== undefined) pilot.club = String(data.club).trim();
    
    const newEmail = String(data.email || "").trim();
    const oldEmail = pilot.email;
    pilot.email = newEmail;
    
    const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
    const isOwnProfile = oldEmail && userEmail && oldEmail.toLowerCase() === userEmail.toLowerCase();
    
    if (isOwnProfile) {
      state.settings.userEmail = newEmail;
    }

    pilot.phone = String(data.phone || "").trim();
    pilot.license = String(data.license || "").trim();
    pilot.address = String(data.address || "").trim();
  }, "update_pilot_details");
}

export function deletePilot(pilotId) {
  updateState((state) => {
    requireAdmin(state);
    const entryIds = new Set(state.entries.filter((entry) => entry.pilotId === pilotId).map((entry) => entry.id));
    removeEntriesById(state, entryIds);
    state.aircraft = state.aircraft.filter((aircraft) => aircraft.pilotId !== pilotId);
    state.pilots = state.pilots.filter((pilot) => pilot.id !== pilotId);
  }, "delete_pilot_cascade");
}

export function initPilotActions() {
  registerAction("open-pilot-card", (event, button) => {
    location.hash = `#/pilot/${button.dataset.pilotId}`;
    return true;
  });

  registerAction("toggle-add-pilot-form", () => {
    const container = document.getElementById("add-pilot-form-container");
    if (!container) return true;
    const isHidden = container.style.display === "none";
    container.style.display = isHidden ? "block" : "none";
    if (isHidden) container.querySelector('input[name="name"]')?.focus();
    return true;
  });

  registerAction("delete-pilot", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Poista pilotti",
      message: "Poistetaanko pilotti? Tämä poistaa myös pilotin kilpailukohtaiset osallistumiset ja niihin liittyvät tulosrivit.",
      requireText: "POISTA",
      action: "execute-delete-pilot",
      payload: { pilotId: button.dataset.pilotId }
    });
    return true;
  });

  registerAction("execute-delete-pilot", (event, button, { renderApp }) => {
    requireAdmin(getState());
    deletePilot(button.dataset.pilotId);
    renderApp();
    return true;
  });

  registerAction("set-pilot-card-tab", (event, button, { renderApp }) => {
    window.PILOT_CARD_TAB = button.dataset.tab;
    renderApp();
    return true;
  });

  registerAction("set-my-pilot-tab", (event, button, { renderApp }) => {
    window.MY_PILOT_CARD_TAB = button.dataset.tab;
    renderApp();
    return true;
  });

  registerAction("open-participants-modal", (event, button, { renderApp }) => {
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.participantsModalOpen = true;
    });
    renderApp();
    return true;
  });

  registerAction("close-participants-modal", (event, button, { renderApp }) => {
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.participantsModalOpen = false;
    });
    renderApp();
    return true;
  });

  registerAction("remove-pilot-avatar", (event, button, { renderApp }) => {
    updateState((state) => {
      const pilotId = button.dataset.pilotId;
      requirePilotAccess(state, pilotId);
      const pilot = state.pilots.find(p => p.id === pilotId);
      if (pilot) {
        pilot.avatarData = null;
        pilot.avatarUrl = null;
      }
    }, "remove_pilot_avatar");
    renderApp();
    return true;
  });
  registerAction("set-stopwatch-class", (event, button, { renderApp }) => {
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.stopwatchActiveClassName = button.dataset.class;
    }, "set_stopwatch_class");
    renderApp();
    return true;
  });

  registerAction("set-stopwatch-stage", (event, button, { renderApp }) => {
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.stopwatchActiveRoundNumber = parseInt(button.dataset.round, 10);
    }, "set_stopwatch_stage");
    renderApp();
    return true;
  });

  registerAction("start-stopwatch", (event, button) => {
    if (window.__stopwatchRunning) return true;
    window.__stopwatchRunning = true;
    window.__stopwatchStart = Date.now() - (window.__stopwatchAccumulated || 0);
    
    window.__stopwatchInterval = setInterval(() => {
      const ms = Date.now() - window.__stopwatchStart;
      window.__stopwatchAccumulated = ms;
      const display = document.getElementById("stopwatch-display");
      if (display) {
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60).toString().padStart(2, "0");
        const secs = (totalSecs % 60).toString().padStart(2, "0");
        display.textContent = `${mins}:${secs}`;
      }
    }, 100);
    return true;
  });

  registerAction("stop-stopwatch", () => {
    if (window.__stopwatchInterval) clearInterval(window.__stopwatchInterval);
    window.__stopwatchInterval = null;
    window.__stopwatchRunning = false;
    return true;
  });

  registerAction("reset-stopwatch", () => {
    if (window.__stopwatchInterval) clearInterval(window.__stopwatchInterval);
    window.__stopwatchInterval = null;
    window.__stopwatchRunning = false;
    window.__stopwatchStart = null;
    window.__stopwatchAccumulated = 0;
    const display = document.getElementById("stopwatch-display");
    if (display) display.textContent = "00:00";
    return true;
  });

  registerAction("transfer-stopwatch-time", (event, button) => {
    if (!window.__stopwatchAccumulated) {
      openAlertModal({ title: "Ei aikaa", message: "Sekuntikellossa ei ole aikaa." });
      return true;
    }
    const totalSecs = Math.floor(window.__stopwatchAccumulated / 1000);
    const flightMinutes = Math.floor(totalSecs / 60);
    const flightSeconds = totalSecs % 60;
    
    const entryId = button.dataset.entryId;
    const roundNumber = parseInt(button.dataset.round, 10);

    const state = getState();
    const card = state.scoreCards?.find(c => c.entryId === entryId);
    let hasTime = false;
    if (card && card.rounds) {
      const round = card.rounds.find(r => Number(r.roundNumber) === roundNumber);
      if (round && (Number(round.flightMinutes) > 0 || Number(round.flightSeconds) > 0)) {
        hasTime = true;
      }
    }

    const message = hasTime 
      ? `Valitulla erällä on jo aika. Haluatko korvata sen mitatulla ajalla?`
      : `Siirretäänkö aika ${flightMinutes} min ${flightSeconds} sekuntia valittuun erään?`;
    
    const submitLabel = hasTime ? "Korvaa aika" : "Siirrä aika";
    
    openConfirmModal({
      title: "Siirrä aika tuloskortille",
      message,
      isDanger: false,
      submitLabel,
      action: "execute-transfer-time",
      payload: { entryId, roundNumber, flightMinutes, flightSeconds }
    });
    return true;
  });

  registerAction("execute-transfer-time", (event, button, { renderApp }) => {
    updateState((state) => {
      state.scoreCards = state.scoreCards || [];
      const entryId = button.dataset.entryId;
      const roundNumber = parseInt(button.dataset.roundNumber, 10);
      const minutes = parseInt(button.dataset.flightMinutes, 10);
      const seconds = parseInt(button.dataset.flightSeconds, 10);

      // Find scorecard
      let card = state.scoreCards.find(c => c.entryId === entryId);
      if (!card) {
        const entry = state.entries.find(e => e.id === entryId);
        if (!entry) return;
        const templateId = entry.className === "WWI" ? "WWI" : "WW2";
        card = {
          id: `scorecard-${entryId}`,
          eventId: entry.eventId,
          entryId: entry.id,
          participantId: entry.id,
          templateId: templateId,
          rounds: [],
          updatedAt: new Date().toISOString()
        };
        state.scoreCards.push(card);
      }
      
      card.rounds = card.rounds || [];
      let round = card.rounds.find(r => Number(r.roundNumber) === roundNumber);
      if (!round) {
        round = { roundNumber, flightMinutes: 0, flightSeconds: 0 };
        card.rounds.push(round);
      }
      
      round.flightMinutes = minutes;
      round.flightSeconds = seconds;
      card.updatedAt = new Date().toISOString();
      
    }, "transfer_stopwatch_time");
    
    renderApp();
    return true;
  });
}
