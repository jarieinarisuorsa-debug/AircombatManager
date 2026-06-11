// ==============================
// Aircombat Competition Manager
// src/router.js
// Päivitetty: 2026-06-04
// ==============================

import { renderHomeView } from "./features/home/homeView.js";
import { renderDashboardView } from "./features/dashboard/dashboardView.js";
import { renderCalendarView } from "./features/events/calendarView.js";
import { renderEventInfoView } from "./features/events/eventInfoView.js";
import { renderPilotsView } from "./features/pilots/pilotsView.js";
import { renderAircraftView } from "./features/aircraft/aircraftView.js";
import { renderEntriesView } from "./features/entries/entriesView.js";
import { renderHeatsView } from "./features/heats/heatsView.js";
import { renderResultsView } from "./features/results/resultsView.js";
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

import { renderAboutView } from "./features/about/aboutView.js";
import { renderLandingView } from "./features/landing/landingView.js";
import { renderEnvironmentsView } from "./features/landing/environmentsView.js";
import { renderBuildGuideView } from "./features/about/buildGuideView.js";
import { renderTachometerView, unmountTachometer } from "./features/tools/tachometerView.js";

import { t } from "./utils/i18n.js";

export const ROUTES = {
  home: { title: (state) => t(state, "nav.home"), render: renderHomeView },
  dashboard: { title: (state) => isAdmin(state) ? t(state, "nav.home") : t(state, "nav.home"), render: renderDashboardView },
  calendar: { title: (state) => t(state, "nav.calendar"), render: renderCalendarView },
  eventinfo: { title: (state) => t(state, "nav.eventinfo"), render: renderEventInfoView },
  entries: { title: (state) => t(state, "nav.entries"), render: renderEntriesView },
  pilots: { title: (state) => t(state, "nav.pilots"), render: renderPilotsView },
  pilot: { title: (state) => t(state, "nav.pilot"), render: renderPilotCardView },
  mypilotcard: { 
    title: (state) => {
      const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
      let pilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
      if (!pilot && isAdmin(state) && state.pilots.length > 0) pilot = state.pilots[0];
      return pilot ? pilot.name : t(state, "nav.mypilotcard");
    },
    render: renderMyPilotCardView 
  },
  myevent: { title: (state) => t(state, "nav.myevent"), render: renderMyEventView },
  aircraft: { title: (state) => t(state, "nav.aircraft"), render: renderAircraftView },
  heats: { title: (state) => isAdmin(state) ? t(state, "nav.heats") : t(state, "nav.heats_public"), render: renderHeatsView },
  scorecard: { title: (state) => "Scorecard Entry", render: renderScoreCardEditorView },
  documents: { title: (state) => t(state, "nav.documents"), render: renderDocumentsView },
  about: { title: (state) => t(state, "nav.about"), render: renderAboutView },
  results: { title: (state) => t(state, "nav.results"), render: renderResultsView },
  standings: { title: (state) => t(state, "nav.standings"), render: renderSeasonStandingsView },
  settings: { title: (state) => t(state, "nav.settings"), render: renderSettingsView },
  mapeditor: { title: (state) => t(state, "nav.mapeditor"), render: renderMapEditorView },
  messages: { title: (state) => t(state, "nav.messages"), render: renderMessagesView },
  landing: { title: (state) => "Tervetuloa / Welcome", render: renderLandingView },
  environments: { title: (state) => "Valitse maa / Select Country", render: renderEnvironmentsView },
  buildguide: { title: (state) => t(state, "about.guide_title"), render: renderBuildGuideView },
  tachometer: { title: (state) => t(state, "tachometer.title"), render: renderTachometerView }
};

export function getCurrentRoute() {
  const hash = location.hash.replace("#/", "");
  const route = hash.split("/")[0];
  if (!route) return "landing";
  return ROUTES[route] ? route : "landing";
}

export function getRouteParam() {
  const hash = location.hash.replace("#/", "");
  const parts = hash.split("/");
  return parts.length > 1 ? parts[1] : null;
}
