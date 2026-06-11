// ==============================
// Aircombat Competition Manager
// src/logic/competitionFormat.js
// Päivitetty: 2026-06-04
// ==============================
// Kilpailun vaiheistus: alkuerät, semifinaali ja finaali.
// ==============================

import { calculateResultScore } from "./scoring.js";
import { getScoreCardForEntry, hasRoundData, hasSavedScoreCard, getScoreCardStructureStages, calculateScoreCardRound } from "./scoreCards.js";
import { t } from "../utils/i18n.js";

export const HEAT_PHASES = {
  QUALIFYING: "qualifying",
  SEMIFINAL: "semifinal",
  FINAL: "final"
};

export const HEAT_PHASE_LABELS = {
  [HEAT_PHASES.QUALIFYING]: "Qualifying",
  [HEAT_PHASES.SEMIFINAL]: "Semifinal",
  [HEAT_PHASES.FINAL]: "Final"
};

export const DEFAULT_COMPETITION_FORMAT = {
  qualifyingRounds: 3,
  semiFinalEnabled: false,
  semiFinalists: 12,
  finalEnabled: true,
  finalists: 7,
  rankingMode: "total_points"
};

function clampInt(val, def, min, max) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return def;
  return Math.max(min, Math.min(max, num));
}

export function normalizeCompetitionFormat(format = {}) {
  const source = format || {};
  return {
    ...DEFAULT_COMPETITION_FORMAT,
    ...source,
    qualifyingRounds: clampInt(source.qualifyingRounds, DEFAULT_COMPETITION_FORMAT.qualifyingRounds, 1, 20),
    semiFinalEnabled: Boolean(source.semiFinalEnabled),
    semiFinalists: clampInt(source.semiFinalists, DEFAULT_COMPETITION_FORMAT.semiFinalists, 2, 200),
    finalEnabled: Boolean(source.finalEnabled),
    finalists: clampInt(source.finalists, DEFAULT_COMPETITION_FORMAT.finalists, 2, 200),
    rankingMode: source.rankingMode || DEFAULT_COMPETITION_FORMAT.rankingMode
  };
}

export function getCompetitionFormatForClass(event, className) {
  const classFormats = event?.classFormats || {};
  const searchName = String(className || "").toLowerCase().trim();
  const foundKey = Object.keys(classFormats).find(k => k.toLowerCase().trim() === searchName);
  const format = foundKey ? classFormats[foundKey] : event?.competitionFormat;
  return normalizeCompetitionFormat(format || DEFAULT_COMPETITION_FORMAT);
}

export function normalizeClassFormats(classFormats = {}) {
  return Object.fromEntries(
    Object.entries(classFormats || {})
      .filter(([className]) => String(className || "").trim())
      .map(([className, format]) => [className, normalizeCompetitionFormat(format)])
  );
}

export function getPhaseLabel(phase, state) {
  if (state) {
    if (phase === HEAT_PHASES.QUALIFYING) return t(state, "format.phase_qualifying");
    if (phase === HEAT_PHASES.SEMIFINAL) return t(state, "format.phase_semifinal");
    if (phase === HEAT_PHASES.FINAL) return t(state, "format.phase_final");
  }
  return HEAT_PHASE_LABELS[phase] || "Qualifying";
}

export function formatHeatTitle(heat, state) {
  if (!heat) return "";
  const className = (heat.className || "").trim();
  let groupName = (heat.groupName || "").trim();
  
  if (className && groupName.startsWith(className)) {
    groupName = groupName.substring(className.length).trim();
  }
  
  const heatWord = state ? t(state, "heats.heat") : "Heat";
  return `${className} ${heatWord} ${groupName}`.trim();
}

export function getHeatPhase(heat) {
  return heat.phase || HEAT_PHASES.QUALIFYING;
}

export function isHeatComplete(heat, results, context = {}) {
  if (!heat || !Array.isArray(heat.entryIds) || !heat.entryIds.length) return false;

  const resultEntryIds = new Set(results.filter((result) => result.heatId === heat.id).map((result) => result.entryId));

  return heat.entryIds.every((entryId) => (
    resultEntryIds.has(entryId) || hasScoreCardResultForHeat(entryId, heat, context)
  ));
}

function hasScoreCardResultForHeat(entryId, heat, context = {}) {
  const state = context.state;
  const event = context.event;
  if (!state || !event) return false;

  const entry = (context.entries || state.entries || []).find((item) => item.id === entryId);
  if (!entry) return false;

  const card = getScoreCardForEntry(state, event, entry);
  const phase = getHeatPhase(heat);
  const roundNumber = getScoreCardRoundNumberForHeat(heat, context);
  const round = (card.rounds || []).find((item) => Number(item.roundNumber) === roundNumber);

  return hasRoundData(round);
}

function getScoreCardRoundNumberForHeat(heat, context = {}) {
  const phase = getHeatPhase(heat);

  if (phase === HEAT_PHASES.SEMIFINAL) {
    const qualifyingRounds = Number(context.format?.qualifyingRounds || 0) || inferQualifyingRoundCount(context);
    return qualifyingRounds + 1;
  }

  if (phase === HEAT_PHASES.FINAL) {
    const qualifyingRounds = Number(context.format?.qualifyingRounds || 0) || inferQualifyingRoundCount(context);
    const semiOffset = context.format?.semiFinalEnabled ? 1 : 0;
    return qualifyingRounds + semiOffset + 1;
  }

  return Number(heat?.round || 1);
}

function inferQualifyingRoundCount(context = {}) {
  const heats = context.heats || [];
  const rounds = heats
    .filter((heat) => getHeatPhase(heat) === HEAT_PHASES.QUALIFYING)
    .map((heat) => Number(heat.round || 1))
    .filter(Number.isFinite);

  return rounds.length ? Math.max(...rounds) : 0;
}

export function buildPhaseRanking({ entries, heats, results, rules, phase, state, event }) {
  const phaseHeatIds = new Set(heats.filter((heat) => getHeatPhase(heat) === phase).map((heat) => heat.id));
  const phaseResults = results.filter((result) => phaseHeatIds.has(result.heatId));

  return entries
    .map((entry) => {
      // 1. Kokeile käyttää tuloskorttia, jos se on olemassa ja tallennettu
      const card = state && event ? getScoreCardForEntry(state, event, entry) : null;
      let phaseScore = 0;
      let phaseCuts = 0;
      let phaseFlightSeconds = 0;
      let phaseResultCount = 0;

      if (card && hasSavedScoreCard(card)) {
        // Jos tuloskortti löytyy, etsi tähän vaiheeseen (esim. qualifying) kuuluvat kierrokset
        const stages = getScoreCardStructureStages({ card, event, entry });
        const roundScores = stages.map(({ roundNumber }) => {
          const round = card.rounds.find((item) => Number(item.roundNumber) === roundNumber) || {};
          return { roundNumber, ...round, score: calculateScoreCardRound(round, event, card.templateId) };
        });

        // Etsi ne stages, jotka kuuluvat tähän phaseen (esim. qualifying)
        const phaseStages = stages.filter(s => s.heatPhase === phase);
        const phaseRoundNumbers = new Set(phaseStages.map(s => Number(s.roundNumber)));

        const activeRoundScores = roundScores.filter(r => phaseRoundNumbers.has(Number(r.roundNumber)) && hasRoundData(r));
        
        phaseScore = activeRoundScores.reduce((sum, round) => sum + (round.score?.total || 0), 0);
        phaseCuts = activeRoundScores.reduce((sum, round) => sum + Number(round.cuts || 0), 0);
        phaseFlightSeconds = activeRoundScores.reduce((sum, round) => sum + (round.score?.flightSeconds || 0), 0);
        phaseResultCount = activeRoundScores.length;
      } else {
        // 2. Jos tuloskorttia ei ole, käytä vanhaa legacy-results taulukkoa
        const entryResults = phaseResults.filter((result) => result.entryId === entry.id);
        phaseScore = entryResults.reduce((sum, result) => sum + calculateResultScore(result, rules).total, 0);
        phaseCuts = entryResults.reduce((sum, result) => sum + Number(result.cuts || 0), 0);
        phaseFlightSeconds = entryResults.reduce((sum, result) => sum + Number(result.flightSeconds || 0), 0);
        phaseResultCount = entryResults.length;
      }

      return {
        ...entry,
        totalScore: phaseScore,
        totalCuts: phaseCuts,
        totalFlightSeconds: phaseFlightSeconds,
        resultCount: phaseResultCount
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || b.totalCuts - a.totalCuts || b.totalFlightSeconds - a.totalFlightSeconds);
}

function uniqueRounds(heats) {
  const rounds = new Set(heats.map((heat) => Number(heat.round || 1)).filter(Number.isFinite));
  return Array.from(rounds);
}

export function getClassStageStatus({ event, className, classEntries, classHeats, results, state }) {
  const format = getCompetitionFormatForClass(event, className);
  const rules = event?.rules || {};
  const qualifyingHeats = classHeats.filter((heat) => getHeatPhase(heat) === HEAT_PHASES.QUALIFYING);
  const semifinalHeats = classHeats.filter((heat) => getHeatPhase(heat) === HEAT_PHASES.SEMIFINAL);
  const finalHeats = classHeats.filter((heat) => getHeatPhase(heat) === HEAT_PHASES.FINAL);
  const completionContext = { state, event, entries: classEntries, heats: classHeats, format };

  const qualifyingRounds = uniqueRounds(qualifyingHeats);
  const qualifyingRoundsGenerated = qualifyingRounds.length ? Math.max(...qualifyingRounds) : 0;
  const allQualifyingRoundsGenerated = qualifyingRoundsGenerated >= format.qualifyingRounds;
  const allQualifyingResultsSaved = qualifyingHeats.length > 0 && qualifyingHeats.every((heat) => isHeatComplete(heat, results, completionContext));
  const completedQualifyingHeats = qualifyingHeats.filter((heat) => isHeatComplete(heat, results, completionContext)).length;

  const semifinalGenerated = semifinalHeats.length > 0;
  const allSemifinalResultsSaved = semifinalGenerated && semifinalHeats.every((heat) => isHeatComplete(heat, results, completionContext));
  const completedSemifinalHeats = semifinalHeats.filter((heat) => isHeatComplete(heat, results, completionContext)).length;

  const finalGenerated = finalHeats.length > 0;
  const allFinalResultsSaved = finalGenerated && finalHeats.every((heat) => isHeatComplete(heat, results, completionContext));
  const completedFinalHeats = finalHeats.filter((heat) => isHeatComplete(heat, results, completionContext)).length;

  const qualifyingRanking = buildPhaseRanking({
    entries: classEntries,
    heats: classHeats,
    results,
    rules,
    phase: HEAT_PHASES.QUALIFYING,
    state,
    event
  });

  const semifinalRanking = buildPhaseRanking({
    entries: classEntries,
    heats: classHeats,
    results,
    rules,
    phase: HEAT_PHASES.SEMIFINAL,
    state,
    event
  });

  const finalRanking = buildPhaseRanking({
    entries: classEntries,
    heats: classHeats,
    results,
    rules,
    phase: HEAT_PHASES.FINAL,
    state,
    event
  });

  const base = {
    className,
    format,
    qualifyingHeats,
    semifinalHeats,
    finalHeats,
    qualifyingRoundsGenerated,
    completedQualifyingHeats,
    completedSemifinalHeats,
    completedFinalHeats,
    totalQualifyingHeats: qualifyingHeats.length,
    totalSemifinalHeats: semifinalHeats.length,
    totalFinalHeats: finalHeats.length,
    allQualifyingRoundsGenerated,
    allQualifyingResultsSaved,
    semifinalGenerated,
    allSemifinalResultsSaved,
    finalGenerated,
    allFinalResultsSaved,
    qualifyingRanking,
    semifinalRanking,
    nextPhase: null,
    nextLabel: t(state, "format.class_ready"),
    canGenerate: false,
    disabledReason: "",
    advancingCount: 0,
    done: false
  };

  if (classEntries.length < 2) {
    return {
      ...base,
      nextPhase: HEAT_PHASES.QUALIFYING,
      nextLabel: t(state, "format.draw_qualifying").replace("{round}", "1"),
      disabledReason: t(state, "format.need_2_pilots")
    };
  }

  if (qualifyingRoundsGenerated < format.qualifyingRounds) {
    return {
      ...base,
      nextPhase: HEAT_PHASES.QUALIFYING,
      nextLabel: t(state, "format.draw_qualifying").replace("{round}", String(qualifyingRoundsGenerated + 1)),
      canGenerate: true,
      advancingCount: classEntries.length
    };
  }

  if (!allQualifyingResultsSaved) {
    return {
      ...base,
      nextPhase: format.semiFinalEnabled ? HEAT_PHASES.SEMIFINAL : (format.finalEnabled ? HEAT_PHASES.FINAL : null),
      nextLabel: format.semiFinalEnabled ? t(state, "format.draw_semifinal") : (format.finalEnabled ? t(state, "format.draw_final") : t(state, "format.class_ready")),
      disabledReason: t(state, "format.save_qualifying_first")
    };
  }

  if (format.semiFinalEnabled && !semifinalGenerated) {
    const advancingCount = Math.min(format.semiFinalists, classEntries.length);
    return {
      ...base,
      nextPhase: HEAT_PHASES.SEMIFINAL,
      nextLabel: t(state, "format.draw_semifinal"),
      canGenerate: advancingCount >= 2,
      advancingCount,
      disabledReason: advancingCount >= 2 ? "" : t(state, "format.need_2_semifinalists")
    };
  }

  if (format.semiFinalEnabled && semifinalGenerated && !allSemifinalResultsSaved) {
    return {
      ...base,
      nextPhase: format.finalEnabled ? HEAT_PHASES.FINAL : null,
      nextLabel: format.finalEnabled ? t(state, "format.draw_final") : t(state, "format.class_ready"),
      disabledReason: t(state, "format.save_semifinal_first")
    };
  }

  if (format.finalEnabled && !finalGenerated) {
    const sourceRanking = format.semiFinalEnabled ? semifinalRanking : qualifyingRanking;
    const advancingCount = Math.min(format.finalists, sourceRanking.length);
    return {
      ...base,
      nextPhase: HEAT_PHASES.FINAL,
      nextLabel: t(state, "format.draw_final"),
      canGenerate: advancingCount >= 2,
      advancingCount,
      disabledReason: advancingCount >= 2 ? "" : t(state, "format.need_2_finalists")
    };
  }

  if (format.finalEnabled && finalGenerated && !allFinalResultsSaved) {
    return {
      ...base,
      nextPhase: null,
      nextLabel: t(state, "format.final_waiting_results"),
      disabledReason: t(state, "format.save_final_first")
    };
  }

  return {
    ...base,
    done: true,
    nextPhase: null,
    nextLabel: t(state, "format.class_ready")
  };
}

export function getEntriesForNextStage(status, classEntries) {
  if (!status?.nextPhase) return [];

  if (status.nextPhase === HEAT_PHASES.QUALIFYING) {
    return classEntries;
  }

  if (status.nextPhase === HEAT_PHASES.SEMIFINAL) {
    return status.qualifyingRanking.slice(0, status.format.semiFinalists);
  }

  if (status.nextPhase === HEAT_PHASES.FINAL) {
    const sourceRanking = status.format.semiFinalEnabled ? status.semifinalRanking : status.qualifyingRanking;
    return sourceRanking.slice(0, status.format.finalists);
  }
  
  return [];
}

export function formatCompetitionStructureLabel(format) {
  if (!format) return "";
  const parts = [`${format.qualifyingRounds} qualifying rounds`];
  if (format.semiFinalEnabled) parts.push("semifinal");
  if (format.finalEnabled) parts.push("final");
  return parts.join(" + ");
}
