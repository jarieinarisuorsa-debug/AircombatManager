// ==============================
// Aircombat Competition Manager
// src/router.js
// Päivitetty: 2026-06-04
// ==============================

import { renderDashboardView } from "./features/dashboard/dashboardView.js";
import { renderCalendarView } from "./features/events/calendarView.js";
import { renderEventInfoView } from "./features/events/eventInfoView.js";
import { renderPilotsView } from "./features/pilots/pilotsView.js";
import { renderAircraftView } from "./features/aircraft/aircraftView.js";
import { renderEntriesView } from "./features/entries/entriesView.js";
import { renderHeatsView } from "./features/heats/heatsView.js";
import { renderResultsView } from "./features/results/resultsView.js";
import { renderScoreCardsView } from "./features/scorecards/scorecardsView.js";
import { renderDocumentsView } from "./features/documents/documentsView.js";
import { renderSettingsView } from "./features/settings/settingsView.js";
import { renderMapEditorView } from "./features/events/mapEditorView.js";
import { renderPilotCardView } from "./features/pilots/pilotCardView.js";
import { renderMyPilotCardView } from "./features/pilots/myPilotCardView.js";
import { renderMyEventView } from "./features/dashboard/myEventView.js";
import { isAdmin } from "./users/roles.js";

import { renderAuthView } from "./features/auth/authView.js";

export const ROUTES = {
  login: { title: "Kirjaudu sisään", render: renderAuthView },
  dashboard: { title: (state) => (isAdmin(state) ? "Etusivu" : "Etusivu"), render: renderDashboardView },
  calendar: { title: "Kisakalenteri", render: renderCalendarView },
  eventinfo: { title: "Kilpailun tiedot", render: renderEventInfoView },
  entries: { title: "Työympäristö", render: renderEntriesView },
  pilots: { title: "Pilotit", render: renderPilotsView },
  pilot: { title: "Pilottikortti", render: renderPilotCardView },
  mypilotcard: { title: "Oma pilottikortti", render: renderMyPilotCardView },
  myevent: { title: "Oma kilpailu", render: renderMyEventView },
  aircraft: { title: "Koneet", render: renderAircraftView },
  heats: { title: (state) => (isAdmin(state) ? "Heatit" : "Heat-aikataulu"), render: renderHeatsView },
  scorecards: { title: "Tuloskortit", render: renderScoreCardsView },
  documents: { title: "Asiakirjat", render: renderDocumentsView },
  results: { title: "Kilpailutulokset", render: renderResultsView },
  settings: { title: "Asetukset", render: renderSettingsView },
  mapeditor: { title: "Karttaeditori", render: renderMapEditorView }
};

export function getCurrentRoute() {
  const hash = location.hash.replace("#/", "");
  const route = hash.split("/")[0] || "dashboard";
  return ROUTES[route] ? route : "dashboard";
}

export function getRouteParam() {
  const hash = location.hash.replace("#/", "");
  const parts = hash.split("/");
  return parts.length > 1 ? parts[1] : null;
}
