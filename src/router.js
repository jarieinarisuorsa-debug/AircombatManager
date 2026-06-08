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
import { renderScoreCardEditorView } from "./features/scorecards/components/ScoreCardEditor.js";
import { renderDocumentsView } from "./features/documents/documentsView.js";
import { renderSettingsView } from "./features/settings/settingsView.js";
import { renderMapEditorView } from "./features/events/mapEditorView.js";
import { renderPilotCardView } from "./features/pilots/pilotCardView.js";
import { renderMyPilotCardView } from "./features/pilots/myPilotCardView.js";
import { renderMyEventView } from "./features/dashboard/myEventView.js";
import { isAdmin } from "./users/roles.js";
import { renderSeasonStandingsView } from "./features/results/seasonStandingsView.js";
import { renderMessagesView } from "./features/messages/messagesView.js";

import { renderAuthView } from "./features/auth/authView.js";

export const ROUTES = {
  login: { title: "Kirjaudu sisään", render: renderAuthView },
  dashboard: { title: (state) => (isAdmin(state) ? "Etusivu" : "Etusivu"), render: renderDashboardView },
  calendar: { title: "Kisakalenteri", render: renderCalendarView },
  eventinfo: { title: "Kilpailun tiedot", render: renderEventInfoView },
  entries: { title: "Työympäristö", render: renderEntriesView },
  pilots: { title: "Pilotit", render: renderPilotsView },
  pilot: { title: "Pilottikortti", render: renderPilotCardView },
  mypilotcard: { 
    title: (state) => {
      const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
      let pilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
      if (!pilot && isAdmin(state) && state.pilots.length > 0) pilot = state.pilots[0];
      return pilot ? pilot.name : "Oma pilottikortti";
    },
    render: renderMyPilotCardView 
  },
  myevent: { title: "Oma kilpailu", render: renderMyEventView },
  aircraft: { title: "Koneet", render: renderAircraftView },
  heats: { title: (state) => (isAdmin(state) ? "Heatit" : "Heat-aikataulu"), render: renderHeatsView },
  scorecards: { title: "Tuloskortit", render: renderScoreCardsView },
  scorecard: { title: "Tuloskortin syöttö", render: renderScoreCardEditorView },
  documents: { title: "Asiakirjat", render: renderDocumentsView },
  results: { title: "Kilpailutulokset", render: renderResultsView },
  standings: { title: "Sarjataulukko", render: renderSeasonStandingsView },
  settings: { title: "Asetukset", render: renderSettingsView },
  mapeditor: { title: "Karttaeditori", render: renderMapEditorView },
  messages: { title: "Viestit", render: renderMessagesView }
};

export function getCurrentRoute() {
  const hash = location.hash.replace("#/", "");
  const route = hash.split("/")[0] || "calendar";
  return ROUTES[route] ? route : "calendar";
}

export function getRouteParam() {
  const hash = location.hash.replace("#/", "");
  const parts = hash.split("/");
  return parts.length > 1 ? parts[1] : null;
}
