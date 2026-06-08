// ==============================
// Aircombat Competition Manager
// src/controllers/inputController.js
// Päivitetty: 2026-06-04
// ==============================
// Input-event dispatcher.
// ==============================

import { filterPilots, markFormDirty } from "../ui/domHelpers.js";
import { handleScoreCardInput } from "./scoreCardInputController.js";
import { updateState, getState } from "../state/store.js";
import { renderApp } from "../main.js";

export function handleInput(event) {
  markFormDirty(event);
  if (event.target.id === "pilot-search" || event.target.id === "workspace-pilot-search") {
    filterPilots();
    return;
  }

  if (event.target.id === "reg-pilot-search") {
    filterRegistryPilotRows(event.target.value);
    return;
  }

  if (event.target.id === "participant-search") {
    const query = event.target.value;
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.participantSearchQuery = query;
    }, "filter_participants");
    renderApp();
    return;
  }

  const scorecardForm = event.target.closest(".score-card-form");
  if (scorecardForm) {
    handleScoreCardInput(scorecardForm);
    return;
  }

  if (event.target.dataset.action === "scale-map-poi") {
    const scale = parseFloat(event.target.value);
    const poiId = event.target.dataset.poiId;
    if (!isNaN(scale) && poiId) {
      const poiEmoji = document.querySelector(`.map-poi[data-poi-id="${poiId}"] .poi-emoji`);
      if (poiEmoji) {
        poiEmoji.style.fontSize = `${scale * 1.5}rem`;
      }
    }
  }
}

function filterRegistryPilotRows(value) {
  const query = String(value || "").toLowerCase().trim();
  const rows = document.querySelectorAll(".reg-pilot-row");
  rows.forEach((row) => {
    const name = String(row.dataset.name || "").toLowerCase();
    row.style.display = name.includes(query) ? "" : "none";
  });
}
