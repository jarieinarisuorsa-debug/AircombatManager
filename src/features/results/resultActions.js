import { buildCompetitionResultsCsv, getEventResults } from "../../logic/competitionResults.js";
import { buildParticipantsCsv } from "../../logic/participants.js";
import { createId, getState, updateState } from "../../state/store.js";
import { requireAdmin } from "../../users/roles.js";
import { downloadTextFile, getActiveEvent } from "../../utils/html.js";
import { slugify } from "../../utils/formValues.js";
import { registerAction } from "../../core/actionRegistry.js";
import { openConfirmModal } from "../../core/confirmActions.js";

export function saveResult(data, form) {
  updateState((state) => {
    requireAdmin(state);
    const existingIndex = state.results.findIndex((result) => result.heatId === data.heatId && result.entryId === data.entryId);
    const result = {
      id: existingIndex >= 0 ? state.results[existingIndex].id : createId("result"),
      heatId: data.heatId,
      entryId: data.entryId,
      flightSeconds: Number(data.flightSeconds || 0),
      cuts: Number(data.cuts || 0),
      penaltyPoints: Number(data.penaltyPoints || 0),
      intactStreamer: Boolean(form.elements.intactStreamer.checked),
      savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) state.results[existingIndex] = result;
    else state.results.push(result);

    const heat = state.heats.find((item) => item.id === data.heatId);
    if (!heat) return;

    const heatResultEntryIds = new Set(state.results.filter((item) => item.heatId === heat.id).map((item) => item.entryId));
    heat.status = heat.entryIds.every((entryId) => heatResultEntryIds.has(entryId)) ? "completed" : "active";

    const activeEvent = state.events.find((event) => event.id === heat.eventId);
    if (activeEvent) markResultsDraft(activeEvent);
  }, "save_result");
}

export function publishCompetitionResults(eventId) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = eventId ? state.events.find((e) => e.id === eventId) : getActiveEvent(state);
    if (!activeEvent) throw new Error("Kilpailua ei löytynyt.");

    const eventResults = getEventResults(state, activeEvent.id);
    const eventScoreCards = (state.scoreCards || []).filter((card) => card.eventId === activeEvent.id && card.updatedAt);
    if (!eventResults.length && !eventScoreCards.length) {
      throw new Error("Kilpailutuloksia ei voi julkaista ennen kuin vähintään yksi heat-tulos tai tuloskortti on tallennettu.");
    }

    activeEvent.resultsPublished = true;
    activeEvent.resultsPublishedAt = new Date().toISOString();
    activeEvent.resultsApprovedBy = state.settings.organizerName || "Admin";
    activeEvent.status = "results_published";
  }, "publish_competition_results");
}

export function unpublishCompetitionResults(eventId) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = eventId ? state.events.find((e) => e.id === eventId) : getActiveEvent(state);
    if (!activeEvent) throw new Error("Kilpailua ei löytynyt.");

    activeEvent.resultsPublished = false;
    activeEvent.resultsPublishedAt = null;
    activeEvent.resultsApprovedBy = "";
    activeEvent.status = "completed";
  }, "unpublish_competition_results");
}


export function exportCompetitionResultsCsv(eventId) {
  const state = getState();
  requireAdmin(state);
  const activeEvent = eventId ? state.events.find((e) => e.id === eventId) : getActiveEvent(state);
  if (!activeEvent) throw new Error("Kilpailua ei löytynyt.");

  downloadTextFile(`${slugify(activeEvent.name || "aircombat-results")}-kilpailutulokset.csv`, buildCompetitionResultsCsv(state, activeEvent), "text/csv;charset=utf-8");
}

export function exportParticipantsCsv() {
  const state = getState();
  requireAdmin(state);
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

  downloadTextFile(`${slugify(activeEvent.name || "aircombat")}-osallistujat.csv`, buildParticipantsCsv(state, activeEvent), "text/csv;charset=utf-8");
}

function markResultsDraft(event) {
  event.resultsPublished = false;
  event.resultsPublishedAt = null;
  event.status = "results_draft";
}

export function initResultActions() {
  registerAction("set-standings-year", (event, button, { renderApp }) => {
    window.STANDINGS_YEAR = parseInt(button.dataset.year, 10);
    renderApp();
    return true;
  });

  registerAction("set-standings-class", (event, button, { renderApp }) => {
    window.STANDINGS_CLASS = button.dataset.class;
    renderApp();
    return true;
  });

  registerAction("set-results-year", (event, button, { renderApp }) => {
    window.RESULTS_YEAR = parseInt(button.dataset.year, 10);
    renderApp();
    return true;
  });

  registerAction("publish-competition-results", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Päätä kilpailu ja julkaise",
      message: "Päätetäänkö kilpailu ja julkaistaan tulokset? Ranking tulee julkisesti näkyviin ja kilpailu merkitään päättyneeksi.",
      action: "execute-publish-competition-results",
      eventId: button.dataset.eventId,
      isDanger: false,
      submitLabel: "Päätä & Julkaise"
    });
    return true;
  });

  registerAction("execute-publish-competition-results", (event, button, { renderApp }) => {
    requireAdmin(getState());
    publishCompetitionResults(button.dataset.eventId);
    renderApp();
    return true;
  });

  registerAction("unpublish-competition-results", (event, button, { renderApp }) => {
    requireAdmin(getState());
    unpublishCompetitionResults(button.dataset.eventId);
    renderApp();
    return true;
  });

  registerAction("export-results-csv", (event, button) => {
    exportCompetitionResultsCsv(button.dataset.eventId);
    return true;
  });

  registerAction("export-participants-csv", (event, button) => {
    exportParticipantsCsv();
    return true;
  });

  registerAction("set-results-tab", (event, button, { renderApp }) => {
    window.RESULTS_TAB = button.dataset.tab;
    renderApp();
    return true;
  });

  registerAction("print-class-scorecards", (event, button, { renderApp }) => {
    window.PRINT_CLASS_FILLED_SCORECARDS = button.dataset.class;
    renderApp();
    setTimeout(() => {
      window.print();
      window.PRINT_CLASS_FILLED_SCORECARDS = null;
      renderApp();
    }, 500);
    return true;
  });

  registerAction("print-pilot-scorecard", (event, button, { renderApp }) => {
    window.PRINT_PILOT_SCORECARD_ENTRY_ID = button.dataset.entryId;
    renderApp();
    setTimeout(() => {
      window.print();
      window.PRINT_PILOT_SCORECARD_ENTRY_ID = null;
      renderApp();
    }, 500);
    return true;
  });
}
