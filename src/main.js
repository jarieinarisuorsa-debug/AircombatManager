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
import { createSubmitHandler } from "./controllers/submitController.js?v=2";
import { UI } from "./ui/engine.js";
import { ROUTES, getCurrentRoute } from "./router.js";
import { closeAircraftSpecForm, closeCompetitionFormatModal, closeEventForm } from "./features/settings/settingsActions.js";

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
import { initResultActions } from "./features/results/resultActions.js";
import { initSettingsActions } from "./features/settings/settingsActions.js";
import { initEventActions, moveMapPoi } from "./features/events/eventActions.js";
import { registerRegistrationActions } from "./features/entries/registrationActions.js";
import { initSignatureActions } from "./controllers/signatureController.js";
import { initConfirmActions } from "./core/confirmActions.js";
import { renderConfirmModal } from "./ui/ConfirmModal.js";
import { initAlertActions, renderAlertModal } from "./core/alertActions.js";
import { initAuthActions } from "./features/auth/authActions.js";
import { initMessageActions } from "./features/messages/messageActions.js";

// Initialize feature actions
initConfirmActions();
initAlertActions();
initAuthActions();
initDashboardActions();
initPilotActions();
initAircraftActions();
initEntryActions();
initHeatActions();
initResultActions();
initSettingsActions();
initEventActions();
registerRegistrationActions();
initSignatureActions();
initMessageActions();

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
    
    if (isCloudMode()) {
      import("./services/supabaseClient.js").then(m => {
        if (m.supabase) {
          m.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              updateState(state => {
                if (!state.settings) state.settings = {};
                state.settings.authMode = 'update_password';
              }, "recovery_mode");
              location.hash = "#/login";
            }
          });
        }
      }).catch(err => console.error("Failed to load supabaseClient for auth listener:", err));
    }
  } catch (err) {
    console.error("Auth init failed:", err);
  }

  if (isCloudMode()) {
    try {
      console.info("Cloud mode active. Fetching ALL initial data...");
      const cloudData = await import("./services/cloudStore.js").then(m => m.syncAllFromCloud());
      
      if (cloudData) {
        updateState(state => {
          if (cloudData.pilots) state.pilots = cloudData.pilots;
          if (cloudData.events) state.events = cloudData.events;
          if (cloudData.aircraft) state.aircraft = cloudData.aircraft;
          if (cloudData.aircraftSpecs) state.aircraftSpecs = cloudData.aircraftSpecs;
          if (cloudData.registrations) state.registrations = cloudData.registrations;
          if (cloudData.entries) state.entries = cloudData.entries;
          if (cloudData.heats) state.heats = cloudData.heats;
          if (cloudData.scoreCards) state.scoreCards = cloudData.scoreCards;
          if (cloudData.results) state.results = cloudData.results;
          
          // Ensure activeEventId is valid or null after sync
          if (!state.events.some(e => e.id === state.activeEventId)) {
            state.activeEventId = state.events.length > 0 ? state.events[0].id : null;
          }
        }, "init_cloud_data");
        
        // Fetch permissions separately since it's not in syncAllFromCloud returned object
        const permissions = await import("./services/cloudStore.js").then(m => m.fetchPermissionsFromCloud());
        if (permissions) {
          updateState(state => { state.permissions = permissions; }, "init_permissions");
        }
      }
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
  
    // Auth status is now rendered inside renderNavigation()

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
  if (activeEventPillEl) {
    activeEventPillEl.textContent = activeEvent ? activeEvent.name : "Ei aktiivista kisaa";
  }
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

const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  calendar: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  eventinfo: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  entries: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  pilots: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  aircraft: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-2.8-.9c-.4-.1-.8.2-.9.6L1 17l4 2 2 4 .3.3c.4-.1.7-.5.6-.9L7 19l4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"></path></svg>`,
  heats: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  scorecards: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M9 10h.01"></path></svg>`,
  documents: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  results: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10"></path><path d="M6 4h12v7a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6V4z"></path></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  myevent: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`,
  mypilotcard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3z"></path><circle cx="8" cy="12" r="3"></circle><line x1="14" y1="10" x2="19" y2="10"></line><line x1="14" y1="14" x2="19" y2="14"></line></svg>`,
  messages: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
};

function renderNavigation(state, routeKey) {
  if (!navEl) return;
  const activeEmail = state.auth?.user?.email || state.settings?.userEmail;
  const authItemHtml = activeEmail 
    ? `<a href="#" data-action="auth-logout" style="cursor: pointer;">
         <span class="nav-icon">
           <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
         </span>
         Kirjaudu ulos
       </a>`
    : `<a href="#/login" style="cursor: pointer;">
         <span class="nav-icon">
           <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
         </span>
         Kirjaudu sisään
       </a>`;

  const creditsItemHtml = `
    <a href="#" data-action="show-credits" style="cursor: pointer; margin-top: 10px;">
      <span class="nav-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      </span>
      Tietoja ohjelmasta
    </a>
  `;

  let currentUserId = "unknown";
  if (isUserAdmin(state)) {
    currentUserId = "admin";
  } else {
    const pilot = (state.pilots || []).find(p => p.email && p.email.toLowerCase().trim() === activeEmail?.toLowerCase().trim());
    if (pilot) currentUserId = pilot.id;
  }

  let unreadCount = 0;
  if (state.messages && currentUserId !== "unknown") {
    unreadCount = state.messages.filter(m => !m.readBy || !m.readBy.includes(currentUserId)).length;
  }

  navEl.innerHTML = getNavItems(state)
    .map((item) => {
      const icon = ICONS[item.key] || ICONS.dashboard;
      let labelHtml = item.label;
      if (item.key === "messages" && unreadCount > 0) {
        labelHtml += ` <span style="background: var(--danger, #ef4444); color: white; border-radius: 999px; padding: 2px 7px; font-size: 0.7rem; font-weight: bold; margin-left: 6px; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);">${unreadCount}</span>`;
      }
      return `<a href="#/${item.key}" data-route="${item.key}" class="${item.key === routeKey ? "active" : ""}">
        <span class="nav-icon">${icon}</span>
        <span style="display: flex; align-items: center;">${labelHtml}</span>
      </a>`;
    })
    .join("") + creditsItemHtml + authItemHtml;
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

    renderApp();
    return;
  }
  if (state.settings?.confirmModalOpen) {
    closeConfirmModal();
    renderApp();
  }
}
