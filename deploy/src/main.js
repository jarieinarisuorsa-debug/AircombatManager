// ==============================
// Aircombat Competition Manager
// src/main.js
// Päivitetty: 2026-06-04
// ==============================
// Sovelluksen käynnistys, reititys ja pää-renderöinti.
// Controllerit hoitavat käyttäjätapahtumat ja action-moduulit datamuutokset.
// ==============================

import { createChangeHandler } from "./controllers/changeController.js";
import { createClickHandler } from "./controllers/clickController.js";
import { handleInput } from "./controllers/inputController.js";
import { createSubmitHandler } from "./controllers/submitController.js";
import { UI } from "./ui/engine.js";
import { ROUTES, getCurrentRoute } from "./router.js";
import { closeAircraftSpecForm, closeCompetitionFormatModal, closeEventForm } from "./features/settings/settingsActions.js";
import { closeScoreCardEditor } from "./features/scorecards/scorecardActions.js";
import { getState, updateState } from "./state/store.js";
import { getCurrentUser } from "./services/authService.js";
import { updateBulkButtonState, updateEntryFormVisibility, applyFormSaveFeedback } from "./ui/domHelpers.js";
import { getActiveEvent } from "./utils/html.js";
import { applyDeviceProfile, watchDeviceProfile } from "./ui/deviceLayout.js";
import { ROLE_LABELS, canUseRoute, getCurrentRole, getDefaultRouteForRole, getNavItems, isUserAdmin } from "./users/roles.js";
import { initDashboardActions } from "./features/dashboard/dashboardActions.js";
import { initPilotActions } from "./features/pilots/pilotActions.js";
import { initAircraftActions } from "./features/aircraft/aircraftActions.js";
import { initEntryActions } from "./features/entries/entryActions.js";
import { initHeatActions } from "./features/heats/heatActions.js";
import { initScorecardActions } from "./features/scorecards/scorecardActions.js";
import { initResultActions } from "./features/results/resultActions.js";
import { initSettingsActions } from "./features/settings/settingsActions.js";
import { initEventActions, moveMapPoi } from "./features/events/eventActions.js";
import { registerRegistrationActions } from "./features/entries/registrationActions.js";
import { initSignatureActions } from "./controllers/signatureController.js";
import { initConfirmActions } from "./core/confirmActions.js";
import { renderConfirmModal } from "./ui/ConfirmModal.js";
import { initAlertActions, renderAlertModal } from "./core/alertActions.js";
import { initAuthActions } from "./features/auth/authActions.js";

// Initialize feature actions
initConfirmActions();
initAlertActions();
initAuthActions();
initDashboardActions();
initPilotActions();
initAircraftActions();
initEntryActions();
initHeatActions();
initScorecardActions();
initResultActions();
initSettingsActions();
initEventActions();
registerRegistrationActions();
initSignatureActions();

const appEl = document.querySelector("#app");
const titleEl = document.querySelector("#page-title");
const activeEventPillEl = document.querySelector("#active-event-pill");
const navEl = document.querySelector("#main-nav");
const roleSelectEl = document.querySelector("#current-role-select");

// HMR-turvalliset event listenerit (estää tuplaklikkaukset jne.)
if (window.__appListenersAdded) {
  window.removeEventListener("hashchange", window.__appHashHandler);
  document.removeEventListener("submit", window.__appSubmitHandler);
  document.removeEventListener("click", window.__appClickHandler);
  document.removeEventListener("change", window.__appChangeHandler);
  document.removeEventListener("input", window.__appInputHandler);
  document.removeEventListener("keydown", window.__appKeydownHandler);
}

window.__appHashHandler = renderApp;
window.__appSubmitHandler = createSubmitHandler({ renderApp });
window.__appClickHandler = createClickHandler({ renderApp });
window.__appChangeHandler = createChangeHandler({ renderApp });
window.__appInputHandler = handleInput;
window.__appKeydownHandler = handleKeydown;

window.addEventListener("hashchange", window.__appHashHandler);
document.addEventListener("submit", window.__appSubmitHandler);
document.addEventListener("click", window.__appClickHandler);
document.addEventListener("change", window.__appChangeHandler);
document.addEventListener("input", window.__appInputHandler);
document.addEventListener("keydown", window.__appKeydownHandler);

window.__appListenersAdded = true;

// Drag and drop support for map uploads and POIs
window.IS_DRAGGING_POI = false;

document.addEventListener("dragstart", (e) => {
  const poi = e.target.closest(".map-poi[draggable='true']");
  if (poi) {
    window.IS_DRAGGING_POI = true;
    e.dataTransfer.setData("application/poi-id", poi.dataset.poiId);
    e.dataTransfer.effectAllowed = "move";
  }
});

document.addEventListener("dragend", () => {
  setTimeout(() => { window.IS_DRAGGING_POI = false; }, 100);
});

document.addEventListener("dragover", (e) => {
  if (e.target.closest(".is-admin-dropzone")) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
  const mapContainer = e.target.closest(".map-container.is-admin");
  if (mapContainer && e.dataTransfer.types.includes("application/poi-id")) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
});

document.addEventListener("drop", (e) => {
  const dropzone = e.target.closest(".is-admin-dropzone");
  if (dropzone && e.dataTransfer.types.includes("Files")) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = dropzone.querySelector("input[type='file']");
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  const mapContainer = e.target.closest(".map-container.is-admin");
  if (mapContainer && e.dataTransfer.types.includes("application/poi-id")) {
    e.preventDefault();
    const poiId = e.dataTransfer.getData("application/poi-id");
    if (poiId) {
      const rect = mapContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      moveMapPoi(poiId, x, y);
      renderApp();
    }
  }
});

import { isCloudMode } from "./services/storageMode.js";
import {
  fetchPilotsFromCloud,
  fetchPermissionsFromCloud,
  fetchEventsFromCloud,
  fetchAircraftFromCloud,
  fetchAircraftSpecsFromCloud,
  fetchRegistrationRequestsFromCloud,
  fetchEntriesFromCloud,
  fetchHeatsFromCloud,
  fetchScoreCardsFromCloud,
  fetchResultsFromCloud
} from "./services/cloudStore.js";

watchDeviceProfile(renderApp);

async function initApp() {
  try {
    const user = await getCurrentUser();
    updateState(state => {
      if (!state.auth) state.auth = {};
      state.auth.user = user;
    }, "init_auth");
  } catch (err) {
    console.error("Auth init failed:", err);
  }

  if (isCloudMode()) {
    try {
      console.info("Cloud mode active. Fetching ALL initial data...");
      const [
        pilots, permissions, events, aircraft, specs,
        registrations, entries, heats, scoreCards, results
      ] = await Promise.all([
        fetchPilotsFromCloud(),
        fetchPermissionsFromCloud(),
        fetchEventsFromCloud(),
        fetchAircraftFromCloud(),
        fetchAircraftSpecsFromCloud(),
        fetchRegistrationRequestsFromCloud(), // fetches all
        fetchEntriesFromCloud(),              // fetches all
        fetchHeatsFromCloud(),                // fetches all
        fetchScoreCardsFromCloud(),           // fetches all
        fetchResultsFromCloud()               // fetches all
      ]);
      
      updateState(state => {
        if (pilots && pilots.length > 0) state.pilots = pilots;
        if (permissions) state.permissions = permissions;
        if (events && events.length > 0) state.events = events;
        if (aircraft && aircraft.length > 0) state.aircraft = aircraft;
        if (specs && specs.length > 0) state.aircraftSpecs = specs;
        if (registrations && registrations.length > 0) state.registrations = registrations;
        if (entries && entries.length > 0) state.entries = entries;
        if (heats && heats.length > 0) state.heats = heats;
        if (scoreCards && scoreCards.length > 0) state.scoreCards = scoreCards;
        if (results && results.length > 0) state.results = results;
      }, "init_cloud_data");
    } catch (err) {
      console.error("Failed to fetch cloud data:", err);
    }
  }

  if (!location.hash) location.hash = `#/${getDefaultRouteForRole(getCurrentRole(getState()))}`;
  renderApp();
}

initApp();

export function renderApp() {
  const state = getState();
  const routeKey = getCurrentRoute();

  if (!canUseRoute(state, routeKey)) {
    if (!state.auth?.user && routeKey !== "login") {
      location.hash = "#/login";
      setTimeout(() => showToast("Kirjaudu sisään jatkaaksesi.", "error"), 50);
    } else {
      location.hash = `#/${getDefaultRouteForRole(getCurrentRole(state))}`;
    }
    return;
  }
  
  if (routeKey === "login") {
    if (navEl) navEl.innerHTML = "";
    if (activeEventPillEl) activeEventPillEl.textContent = "";
    titleEl.textContent = ROUTES.login.title;
    appEl.innerHTML = ROUTES.login.render(state);
    if (roleSelectEl) roleSelectEl.style.display = "none";
    applyTheme(state);
    applyDeviceProfile();
    return;
  }

  applyTheme(state);
  applyDeviceProfile();

  const route = ROUTES[routeKey];
  const activeEvent = getActiveEvent(state);

  renderNavigation(state, routeKey);
  renderRoleSwitch(state);
  
  const authStatusEl = document.querySelector("#auth-status");
  if (authStatusEl) {
    const activeEmail = state.auth?.user?.email || state.settings?.userEmail;
    if (activeEmail) {
      authStatusEl.innerHTML = `
        <span style="font-size: 0.85rem; color: var(--text-muted);">
          ${activeEmail}
        </span>
        <button type="button" class="button small" data-action="auth-logout" style="background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 4px 8px;">
          Kirjaudu ulos
        </button>
      `;
    } else {
      authStatusEl.innerHTML = `
        <a href="#/login" class="button small primary" style="text-decoration: none;">Kirjaudu sisään</a>
      `;
    }
  }

  const isDebug = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (roleSelectEl) {
    const showRoleSwitch = isDebug || isUserAdmin(state);
    roleSelectEl.parentElement.style.display = showRoleSwitch ? "flex" : "none";
  }

  const brandMarkEl = document.querySelector(".brand-mark");
  if (brandMarkEl) {
    if (state.settings.organizationLogoData) {
      brandMarkEl.innerHTML = `<img src="${state.settings.organizationLogoData}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" />`;
      brandMarkEl.style.background = "transparent";
      brandMarkEl.style.padding = "0";
    } else {
      brandMarkEl.innerHTML = "AC";
      brandMarkEl.style.background = "";
      brandMarkEl.style.padding = "";
    }
  }

  titleEl.textContent = typeof route.title === "function" ? route.title(state) : route.title;
  activeEventPillEl.textContent = activeEvent ? activeEvent.name : "Ei aktiivista kisaa";
  appEl.innerHTML = route.render(state) + renderConfirmModal(state) + renderAlertModal(state);

  const entryForm = appEl.querySelector("form[data-action='add-entry']");
  if (entryForm) updateEntryFormVisibility(entryForm);

  updateBulkButtonState();
  applyFormSaveFeedback(state);
}

function applyTheme(state) {
  const theme = state.settings.theme || "dark";
  document.body.classList.toggle("theme-sunlight", theme === "sunlight");

  const themeBtn = document.querySelector("#theme-toggle-btn");
  if (!themeBtn) return;

  if (theme === "sunlight") {
    themeBtn.innerHTML = "🌙 Tumma tila";
    themeBtn.title = "Vaihda tummaan tilaan";
  } else {
    themeBtn.innerHTML = "☀️ Aurinkotila";
    themeBtn.title = "Vaihda valoisaan aurinkotilaan";
  }
}

function renderNavigation(state, routeKey) {
  if (!navEl) return;
  navEl.innerHTML = getNavItems(state)
    .map((item) => `<a href="#/${item.key}" data-route="${item.key}" class="${item.key === routeKey ? "active" : ""}">${item.label}</a>`)
    .join("");
}

function renderRoleSwitch(state) {
  if (!roleSelectEl) return;
  const isDebug = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  if (!isDebug && !isUserAdmin(state)) {
    roleSelectEl.style.display = "none";
    return;
  }
  roleSelectEl.style.display = "";
  
  const role = getCurrentRole(state);
  roleSelectEl.innerHTML = Object.entries(ROLE_LABELS)
    .map(([value, label]) => `<option value="${value}" ${value === role ? "selected" : ""}>${label}</option>`)
    .join("");
}

function handleKeydown(event) {
  if (event.key !== "Escape") return;
  const state = getState();
  if (state.settings?.aircraftSpecFormOpen) {
    closeAircraftSpecForm();
    renderApp();
    return;
  }
  if (state.settings?.eventFormOpen) {
    closeEventForm();
    renderApp();
    return;
  }
  if (state.settings?.competitionFormatModalOpen) {
    closeCompetitionFormatModal();
    renderApp();
    return;
  }
  if (state.settings?.scoreCardEditorOpen) {
    closeScoreCardEditor();
    renderApp();
    return;
  }
  if (state.settings?.confirmModalOpen) {
    closeConfirmModal();
    renderApp();
  }
}
