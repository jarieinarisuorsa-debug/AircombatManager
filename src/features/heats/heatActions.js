import { buildHeatGroups } from "../../logic/heatBuilder.js";
import {
  HEAT_PHASES,
  getClassStageStatus,
  getEntriesForNextStage
} from "../../logic/competitionFormat.js";
import { updateState, getState } from "../../state/store.js";
import { requireAdmin } from "../../users/roles.js";
import { getActiveEvent } from "../../utils/html.js";
import { registerAction } from "../../core/actionRegistry.js";
import { openConfirmModal } from "../../core/confirmActions.js";

export function generateHeats(targetClassName = null) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const entries = state.entries.filter((entry) => entry.eventId === activeEvent.id);
    if (entries.length < 2) throw new Error("Tarvitaan vähintään kaksi ilmoittautunutta koko kilpailuun.");

    const results = state.results || [];
    const entriesByClass = new Map();

    entries.forEach((entry) => {
      const className = entry.className || "Yleinen";
      if (!entriesByClass.has(className)) entriesByClass.set(className, []);
      entriesByClass.get(className).push(entry);
    });

    const classesToProcess = targetClassName ? [targetClassName] : Array.from(entriesByClass.keys());
    const newHeats = [];

    classesToProcess.forEach((className) => {
      const classEntries = entriesByClass.get(className) || [];
      if (classEntries.length < 2) {
        if (targetClassName) throw new Error(`Luokassa ${className} ei ole tarpeeksi ilmoittautuneita arvonnan suorittamiseksi.`);
        return;
      }

      const blocked = classEntries.filter((entry) => ["repair_required", "rejected"].includes(entry.technicalInspection));
      if (blocked.length) throw new Error(`Luokassa ${className} on korjattavia tai hylättyjä koneita. Tarkasta tekniset tiedot ensin.`);

      const classHeats = state.heats.filter((heat) => heat.eventId === activeEvent.id && heat.className === className);
      const stageStatus = getClassStageStatus({
        event: activeEvent,
        className,
        classEntries,
        classHeats,
        results,
        state
      });

      if (!stageStatus.canGenerate || !stageStatus.nextPhase) {
        if (targetClassName) throw new Error(stageStatus.disabledReason || `${className}: seuraavaa vaihetta ei voi vielä arpoa.`);
        return;
      }

      const stageEntries = getEntriesForNextStage(stageStatus, classEntries);
      if (stageEntries.length < 2) {
        if (targetClassName) throw new Error(`${className}: jatkovaiheeseen ei riitä vähintään kahta osallistujaa.`);
        return;
      }

      const round = stageStatus.nextPhase === HEAT_PHASES.QUALIFYING
        ? stageStatus.qualifyingRoundsGenerated + 1
        : 1;

      const classNewHeats = buildHeatGroups({
        eventId: activeEvent.id,
        className,
        entries: stageEntries,
        groupSize: activeEvent.rules.maxAircraftPerHeat,
        round,
        phase: stageStatus.nextPhase,
        state
      });

      newHeats.push(...classNewHeats);
    });

    if (newHeats.length === 0) {
      throw new Error("Arvonta ei luonut uusia heatteja. Tarkista osallistujat, kilpailun rakenne ja edellisen vaiheen tulokset.");
    }

    state.heats.push(...newHeats);
    activeEvent.status = "active";
    activeEvent.resultsPublished = false;
    activeEvent.resultsPublishedAt = null;
  }, "generate_heats");
}

export function cancelLastHeats(className) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const classHeats = state.heats.filter((heat) => heat.eventId === activeEvent.id && heat.className === className);
    if (!classHeats.length) throw new Error("Ei peruttavia heatteja.");

    const finalHeats = classHeats.filter((heat) => heat.phase === "final");
    const semifinalHeats = classHeats.filter((heat) => heat.phase === "semifinal");
    const qualifyingHeats = classHeats.filter((heat) => !heat.phase || heat.phase === "qualifying");

    let heatsToRemove = [];

    if (finalHeats.length > 0) {
      heatsToRemove = finalHeats;
    } else if (semifinalHeats.length > 0) {
      heatsToRemove = semifinalHeats;
    } else {
      const rounds = qualifyingHeats.map((heat) => Number(heat.round) || 1).filter(Number.isFinite);
      const maxRound = rounds.length ? Math.max(...rounds) : 1;
      heatsToRemove = qualifyingHeats.filter((heat) => (Number(heat.round) || 1) === maxRound);
    }

    const heatIdsToRemove = new Set(heatsToRemove.map((heat) => heat.id));

    // Check if any of these heats have traditional results
    const hasResults = state.results && state.results.some((result) => heatIdsToRemove.has(result.heatId));
    if (hasResults) {
      throw new Error("Näihin heatteihin on jo syötetty tuloksia. Tulokset pitää poistaa ennen arvonnan perumista.");
    }

    // Remove heats
    state.heats = state.heats.filter((heat) => !heatIdsToRemove.has(heat.id));

    activeEvent.resultsPublished = false;
    activeEvent.resultsPublishedAt = null;
    if (activeEvent.status === "results_published") activeEvent.status = "active";
  }, "cancel_heats");
}

export function initHeatActions() {
  registerAction("generate-heats", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: "Arvo heatit",
      message: "Arvotaanko seuraavat heatit aktiivisille luokille?",
      action: "execute-generate-heats",
      requireText: "ARVO"
    });
    return true;
  });

  registerAction("execute-generate-heats", (event, button, { renderApp }) => {
    requireAdmin(getState());
    generateHeats();
    renderApp();
    return true;
  });

  registerAction("generate-class-heats", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: `Arvo luokan ${button.dataset.class} heatit`,
      message: `Arvotaanko seuraavat heatit luokalle ${button.dataset.class}?`,
      action: "execute-generate-class-heats",
      payload: { class: button.dataset.class },
      requireText: "ARVO"
    });
    return true;
  });

  registerAction("execute-generate-class-heats", (event, button, { renderApp }) => {
    requireAdmin(getState());
    generateHeats(button.dataset.class);
    renderApp();
    return true;
  });

  registerAction("cancel-class-heats", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: `Peruuta viimeisin arvonta (${button.dataset.class})`,
      message: `Haluatko varmasti peruuttaa luokan ${button.dataset.class} viimeisimmän heat-arvonnan?`,
      action: "execute-cancel-class-heats",
      payload: { class: button.dataset.class },
      isDanger: true,
      submitLabel: "Peruuta arvonta"
    });
    return true;
  });

  registerAction("execute-cancel-class-heats", (event, button, { renderApp }) => {
    requireAdmin(getState());
    cancelLastHeats(button.dataset.class);
    renderApp();
    return true;
  });
}
