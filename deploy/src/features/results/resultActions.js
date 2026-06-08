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

export function publishCompetitionResults() {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

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

export function unpublishCompetitionResults() {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    activeEvent.resultsPublished = false;
    activeEvent.resultsPublishedAt = null;
    activeEvent.status = "results_draft";
  }, "unpublish_competition_results");
}

export function exportCompetitionResultsCsv() {
  const state = getState();
  requireAdmin(state);
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

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
  registerAction("publish-competition-results", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Julkaise tulokset",
      message: "Julkaistaanko tulokset? Ranking tulee julkisesti näkyviin.",
      action: "execute-publish-competition-results",
      isDanger: false,
      submitLabel: "Julkaise"
    });
    return true;
  });

  registerAction("execute-publish-competition-results", (event, button, { renderApp }) => {
    requireAdmin(getState());
    publishCompetitionResults();
    renderApp();
    return true;
  });

  registerAction("unpublish-competition-results", (event, button, { renderApp }) => {
    requireAdmin(getState());
    unpublishCompetitionResults();
    renderApp();
    return true;
  });

  registerAction("export-results-csv", (event, button) => {
    exportCompetitionResultsCsv();
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
}
