import {
  calculateScoreCardTotals,
  createDefaultRound,
  getScoreCardTemplate
} from "../../logic/scoreCards.js";
import { createId, getState, updateState } from "../../state/store.js";
import { requireAdmin, isAdmin } from "../../users/roles.js";
import { getActiveEvent } from "../../utils/html.js";
import { firstFilled, readNumber, readYesNo } from "../../utils/formValues.js";
import { registerAction } from "../../core/actionRegistry.js";

export function openScoreCardEditor(entryId = "") {
  updateState((state) => {
    state.settings.scoreCardEditorOpen = true;
    state.settings.scoreCardEditorEntryId = String(entryId || "").trim();
  }, "open_score_card_editor");
}

export function closeScoreCardEditor() {
  updateState((state) => {
    state.settings.scoreCardEditorOpen = false;
    state.settings.scoreCardEditorEntryId = "";
  }, "close_score_card_editor");
}

export function saveScoreCard(data, form) {
  updateState((state) => {
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const entry = state.entries.find((item) => item.id === data.entryId && item.eventId === activeEvent.id);
    if (!entry) throw new Error("Osallistujaa ei löydy aktiivisesta kilpailusta.");

    if (!isAdmin(state)) {
      const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
      const myPilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
      if (!myPilot || entry.pilotId !== myPilot.id) {
        throw new Error("Tämä toiminto on vain adminille tai kyseiselle pilotille.");
      }
    }

    const existingIndex = state.scoreCards.findIndex((card) => card.eventId === activeEvent.id && card.entryId === entry.id);
    const existingScoreCard = existingIndex >= 0 ? state.scoreCards[existingIndex] : null;

    const template = getScoreCardTemplate(String(data.templateId || "standard"));
    const rounds = template.rounds.map((roundNumber) => {
      const existingRound = existingScoreCard?.rounds?.find((r) => r.roundNumber === roundNumber);
      const isSaved = true;

      const round = {
        ...createDefaultRound(roundNumber, template.id),
        isSaved,
        takeoff: readYesNo(data[`r${roundNumber}_takeoff`]),
        flightMinutes: readNumber(data[`r${roundNumber}_flightMinutes`], 0, 99),
        flightSeconds: readNumber(data[`r${roundNumber}_flightSeconds`], 0, 59),
        cuts: readNumber(data[`r${roundNumber}_cuts`], 0, 99),
        groundTargets: readNumber(data[`r${roundNumber}_groundTargets`], 0, 99),
        takeoff: readYesNo(data[`r${roundNumber}_takeoff`]),
        streamerOk: readYesNo(data[`r${roundNumber}_streamerOk`]),
        hasenfuss: readYesNo(data[`r${roundNumber}_hasenfuss`]),
        safetylineOverflown: readYesNo(data[`r${roundNumber}_safetylineOverflown`]),
        landingAfterEndSignal: readYesNo(data[`r${roundNumber}_landingAfterEndSignal`])
      };

      if (template.modelPointItems) {
        round.modelPoints = Object.fromEntries(template.modelPointItems.map((item) => [
          item.key,
          readYesNo(data[`r${roundNumber}_model_${item.key}`])
        ]));
      }

      round.signatures = {
        pilotSignature: firstFilled(data, `r${roundNumber}_pilotSignature`),
        judgeSignature: firstFilled(data, `r${roundNumber}_judgeSignature`)
      };

      return round;
    });

    const scoreCard = {
      id: `scorecard-${entry.id}`,
      eventId: activeEvent.id,
      entryId: entry.id,
      participantId: entry.id,
      templateId: template.id,
      startNumber: String(data.startNumber || "").trim(),
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      frequency: String(data.frequency || "").trim(),
      flyingRound: String(data.flyingRound || "").trim(),
      rounds,
      aircraft: {
        twoPointFiveClass: Boolean(form.querySelector('[name="twoPointFiveClass"]:checked')),
        modelName: firstFilled(data, "modelName"),
        motorOrBattery: firstFilled(data, "motorOrBattery"),
        propeller: firstFilled(data, "propeller"),
        rpm: firstFilled(data, "rpm")
      },
      signatures: {
        pilotSignature: firstFilled(data, "pilotSignature"),
        judgeSignature: firstFilled(data, "judgeSignature")
      },
      status: "draft",
      updatedAt: new Date().toISOString()
    };

    const totals = calculateScoreCardTotals(scoreCard, activeEvent);
    scoreCard.totalPoints = totals.totalPoints;
    scoreCard.totalCuts = totals.totalCuts;
    scoreCard.totalFlightSeconds = totals.totalFlightSeconds;

    if (existingIndex >= 0) state.scoreCards[existingIndex] = scoreCard;
    else state.scoreCards.push(scoreCard);

    if (scoreCard.startNumber && entry.raceNumber !== scoreCard.startNumber) entry.raceNumber = scoreCard.startNumber;
    if (entry.className && template.id === "wwi" && !/wwi|ww1/i.test(entry.className)) entry.className = "WWI";
    entry.updatedAt = new Date().toISOString();

    markResultsDraft(activeEvent);
  }, "save_score_card");
}

function markResultsDraft(event) {
  event.resultsPublished = false;
  event.resultsPublishedAt = null;
  event.status = "results_draft";
}

export function initScorecardActions() {
  registerAction("open-score-card-editor", (event, button, { renderApp }) => {
    openScoreCardEditor(button.dataset.entryId || "");
    renderApp();
    window.requestAnimationFrame(() => {
      const form = document.getElementById(`scorecard-${button.dataset.entryId}`);
      form?.querySelector("input, select, textarea")?.focus();
    });
    return true;
  });

  registerAction("close-score-card-editor", (event, button, { renderApp }) => {
    closeScoreCardEditor();
    renderApp();
    return true;
  });
}
