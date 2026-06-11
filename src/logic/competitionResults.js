// ==============================
// Aircombat Competition Manager
// src/logic/competitionResults.js
// Päivitetty: 2026-06-04
// ==============================
// Vastuu:
// - koko kilpailun virallisen tulostaulukon koostaminen
// - luokkakohtaisten tulosten muodostaminen
// - CSV-viennin tuottaminen julkaistavista kilpailutuloksista
// ==============================

import { getCompetitionFormatForClass } from "./competitionFormat.js";
import { calculateResultScore } from "./scoring.js";
import { buildScoreCardRows, hasRoundData, hasSavedScoreCard } from "./scoreCards.js";
import { getAircraftName, getPilotName } from "../utils/html.js";

export function getEventHeats(state, eventId) {
  return state.heats.filter((heat) => heat.eventId === eventId);
}

export function getEventEntries(state, eventId) {
  return state.entries.filter((entry) => entry.eventId === eventId);
}

export function getEventResults(state, eventId) {
  const heatIds = new Set(getEventHeats(state, eventId).map((heat) => heat.id));
  return state.results.filter((result) => heatIds.has(result.heatId));
}

export function isCompetitionResultsPublished(event) {
  return Boolean(event?.resultsPublished);
}

export function buildCompetitionResults(state, event) {
  if (!event) {
    return {
      rows: [],
      classGroups: [],
      stats: createEmptyStats()
    };
  }

  const entries = getEventEntries(state, event.id);
  const heats = getEventHeats(state, event.id);
  const results = getEventResults(state, event.id);
  const scoreCardRows = buildScoreCardRows(state, event);

  const rows = entries.map((entry) => {
    const entryResults = results.filter((result) => result.entryId === entry.id);
    const heatScores = entryResults.map((result) => calculateResultScore(result, event.rules).total);
    const pilot = state.pilots.find((item) => item.id === entry.pilotId);
    const aircraft = state.aircraft.find((item) => item.id === entry.aircraftId);
    const scoreCardRow = scoreCardRows.find((row) => row.entry.id === entry.id);
    const useScoreCard = scoreCardRow && hasSavedScoreCard(scoreCardRow.card);
    const structureLabels = buildStructureRoundLabels(event, entry.className || aircraft?.className || "Yleinen");
    const legacyRoundBreakdown = buildLegacyRoundBreakdown(entryResults, heats, event, structureLabels);
    const roundBreakdown = useScoreCard
      ? buildScoreCardStructureBreakdown(scoreCardRow, structureLabels)
      : legacyRoundBreakdown;
    const effectiveRoundBreakdown = roundBreakdown.filter((round) => round.completed);
    const legacyTotalScore = heatScores.reduce((sum, score) => sum + score, 0);
    const legacyCuts = entryResults.reduce((sum, result) => sum + Number(result.cuts || 0), 0);
    const legacyFlightSeconds = entryResults.reduce((sum, result) => sum + Number(result.flightSeconds || 0), 0);
    const structureTotalScore = effectiveRoundBreakdown.reduce((sum, round) => sum + Number(round.score || 0), 0);
    const structureCuts = useScoreCard
      ? effectiveRoundBreakdown.reduce((sum, round) => sum + Number(round.cuts || 0), 0)
      : legacyCuts;
    const structureFlightSeconds = useScoreCard
      ? effectiveRoundBreakdown.reduce((sum, round) => sum + Number(round.flightSeconds || 0), 0)
      : legacyFlightSeconds;

    return {
      position: 0,
      entryId: entry.id,
      pilotId: entry.pilotId,
      aircraftId: entry.aircraftId,
      pilotName: getPilotName(state, entry.pilotId),
      country: pilot?.country || "",
      club: pilot?.club || "",
      aircraftName: getAircraftName(state, entry.aircraftId),
      aircraftTechStatus: aircraft?.techStatus || "",
      className: entry.className || aircraft?.className || "Yleinen",
      totalScore: useScoreCard ? structureTotalScore : legacyTotalScore,
      totalCuts: useScoreCard ? structureCuts : legacyCuts,
      totalFlightSeconds: useScoreCard ? structureFlightSeconds : legacyFlightSeconds,
      resultCount: useScoreCard ? effectiveRoundBreakdown.length : entryResults.length,
      bestHeatScore: effectiveRoundBreakdown.length ? Math.max(...effectiveRoundBreakdown.map((round) => Number(round.score || 0))) : 0,
      roundBreakdown,
      source: useScoreCard ? "scorecard" : "heat-results",
      status: useScoreCard || entryResults.length ? "result" : "no_result"
    };
  })
    .sort((a, b) => b.totalScore - a.totalScore || b.totalCuts - a.totalCuts || b.totalFlightSeconds - a.totalFlightSeconds || a.pilotName.localeCompare(b.pilotName, "fi"))
    .map((row, index) => ({ ...row, position: index + 1 }));

  const classGroups = buildClassGroups(rows);
  const savedScoreCards = scoreCardRows.filter((row) => hasSavedScoreCard(row.card)).length;

  return {
    rows,
    classGroups,
    stats: {
      entries: entries.length,
      heats: heats.length,
      resultRows: results.length + savedScoreCards,
      pilotsWithResults: rows.filter((row) => row.resultCount > 0).length,
      scoreCards: savedScoreCards,
      totalCuts: rows.reduce((sum, row) => sum + row.totalCuts, 0),
      totalFlightSeconds: rows.reduce((sum, row) => sum + row.totalFlightSeconds, 0)
    }
  };
}

export function buildClassGroups(rows) {
  const classes = new Map();

  rows.forEach((row) => {
    const className = row.className || "Yleinen";
    if (!classes.has(className)) classes.set(className, []);
    classes.get(className).push(row);
  });

  return Array.from(classes.entries()).map(([className, classRows]) => ({
    className,
    rows: classRows.map((row, index) => ({ ...row, classPosition: index + 1 }))
  }));
}

export function buildCompetitionResultsCsv(state, event) {
  const { rows } = buildCompetitionResults(state, event);
  const header = [
    "Sijoitus",
    "Pilotti",
    "Maa",
    "Seura",
    "Luokka",
    "Kone",
    "Pisteet",
    "Cutit",
    "Lentoaika s",
    "Paras heat",
    "Tuloksia",
    "Lähde"
  ];

  const lines = [header, ...rows.map((row) => [
    row.position,
    row.pilotName,
    row.country,
    row.club,
    row.className,
    row.aircraftName,
    row.totalScore,
    row.totalCuts,
    row.totalFlightSeconds,
    row.bestHeatScore,
    row.resultCount,
    row.source === "scorecard" ? "Tuloskortti" : "Heat-tulos"
  ])];

  return lines.map((line) => line.map(escapeCsvCell).join(";")).join("\n");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (!/[;"\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}



function buildStructureRoundLabels(event, className) {
  const format = getCompetitionFormatForClass(event, className);
  const labels = [];

  for (let round = 1; round <= Number(format.qualifyingRounds || 0); round++) {
    labels.push(`Alkuerä ${round}`);
  }

  if (format.semiFinalEnabled) labels.push("Semifinaali");
  if (format.finalEnabled) labels.push("Finaali");

  return labels;
}

function buildScoreCardStructureBreakdown(scoreCardRow, structureLabels) {
  const roundScores = scoreCardRow?.totals?.roundScores || [];
  const labels = structureLabels.length
    ? structureLabels
    : roundScores.map((round) => `Alkuerä ${round.roundNumber}`);

  return labels.map((label, index) => {
    const round = roundScores[index];

    if (!round) {
      return {
        label,
        score: 0,
        cuts: 0,
        flightSeconds: 0,
        completed: false
      };
    }

    return {
      label,
      score: round.score?.total || 0,
      cuts: Number(round.cuts || 0),
      flightSeconds: round.score?.flightSeconds || 0,
      completed: Boolean(round.isSaved) || hasRoundData(round)
    };
  });
}

function mergeRoundBreakdownWithStructure(structureLabels, actualBreakdown) {
  const actualMap = new Map((actualBreakdown || []).map((round) => [round.label, round]));

  if (!structureLabels.length) {
    return actualBreakdown || [];
  }

  return structureLabels.map((label) => actualMap.get(label) || {
    label,
    score: 0,
    completed: false
  });
}

function buildLegacyRoundBreakdown(entryResults, heats, event, structureLabels = []) {

  const heatMap = new Map(heats.map((heat) => [heat.id, heat]));
  const grouped = new Map();

  entryResults
    .slice()
    .sort((a, b) => compareResultsByHeat(a, b, heatMap))
    .forEach((result) => {
      const heat = heatMap.get(result.heatId);
      const label = getRoundLabel(heat);
      const score = calculateResultScore(result, event.rules).total;
      const previous = grouped.get(label) || { label, score: 0, completed: false };
      grouped.set(label, {
        label,
        score: previous.score + score,
        completed: true
      });
    });

  return mergeRoundBreakdownWithStructure(structureLabels, Array.from(grouped.values()).sort(compareRoundBreakdownItems));
}

function compareResultsByHeat(a, b, heatMap) {
  const heatA = heatMap.get(a.heatId);
  const heatB = heatMap.get(b.heatId);
  return compareHeatMeta(heatA, heatB);
}

function compareRoundBreakdownItems(a, b) {
  return compareRoundLabelStrings(a.label, b.label);
}

function compareHeatMeta(a, b) {
  const phaseOrder = { qualifying: 1, semifinal: 2, final: 3 };
  const phaseA = phaseOrder[a?.phase || "qualifying"] || 99;
  const phaseB = phaseOrder[b?.phase || "qualifying"] || 99;
  if (phaseA !== phaseB) return phaseA - phaseB;

  const roundA = Number(a?.round || 0);
  const roundB = Number(b?.round || 0);
  if (roundA !== roundB) return roundA - roundB;

  return String(a?.groupName || "").localeCompare(String(b?.groupName || ""), "fi", { numeric: true });
}

function getRoundLabel(heat) {
  if (!heat) return "Alkuerä 1";
  if (heat.phase === "semifinal") return "Semifinaali";
  if (heat.phase === "final") return "Finaali";
  return `Alkuerä ${Number(heat.round || 1)}`;
}

function compareRoundLabelStrings(a, b) {
  const order = (label) => {
    if (/^heat\s+\d+/i.test(label)) {
      return { bucket: 1, number: Number(label.match(/\d+/)?.[0] || 0) };
    }
    if (/semifinaali/i.test(label)) return { bucket: 2, number: 0 };
    if (/finaali/i.test(label)) return { bucket: 3, number: 0 };
    return { bucket: 9, number: 0 };
  };

  const aInfo = order(a);
  const bInfo = order(b);
  if (aInfo.bucket !== bInfo.bucket) return aInfo.bucket - bInfo.bucket;
  if (aInfo.number !== bInfo.number) return aInfo.number - bInfo.number;
  return String(a).localeCompare(String(b), "fi", { numeric: true });
}

function createEmptyStats() {
  return {
    entries: 0,
    heats: 0,
    resultRows: 0,
    pilotsWithResults: 0,
    scoreCards: 0,
    totalCuts: 0,
    totalFlightSeconds: 0
  };
}
