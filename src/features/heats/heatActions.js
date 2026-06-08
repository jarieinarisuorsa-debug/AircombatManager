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
}
