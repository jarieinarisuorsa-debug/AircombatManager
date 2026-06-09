// ==============================
// Aircombat Competition Manager
// src/logic/scoreCards.js
// Päivitetty: 2026-06-04
// ==============================
// Vastuu:
// - kilpailuluokkakohtaiset pilot score card -tietomallit
// - Standard/WWII 5 kierroksen kortti
// - WWI 4 kierroksen kortti + Finale-yhteenveto
// - kierroskohtaisten pisteiden laskenta
// - tuloskorttirivien muodostaminen admin- ja tulosnäkymille
// ==============================

import { getAircraftName, getPilotName } from "../utils/html.js";
import { getCompetitionFormatForClass, formatHeatTitle } from "./competitionFormat.js";

export const SCORE_CARD_TEMPLATE_STANDARD = "standard";
export const SCORE_CARD_TEMPLATE_WWI = "wwi";

export const SCORE_CARD_TEMPLATES = {
  [SCORE_CARD_TEMPLATE_STANDARD]: {
    id: SCORE_CARD_TEMPLATE_STANDARD,
    label: "Standard / WWII · 5 Kierrosta",
    shortLabel: "Standard",
    rounds: [1, 2, 3, 4, 5],
    resultLabels: ["Kierros 1", "Kierros 2", "Kierros 3", "Kierros 4", "Kierros 5"],
    headerLastNameLabel: "Nimi",
    footerRows: [
      { label: "Lentokonemalli", field: "modelName" },
      { label: "Polttomoottori / Akku", field: "motorOrBattery" },
      { label: "Potkuri (esim. 9x4)", field: "propeller" },
      { label: "Kierrosluku (RPM)", field: "rpm" },
      { label: "Pilotin allekirjoitus", field: "pilot" },
      { label: "Tuomarin allekirjoitus", field: "judge" }
    ]
  },
  [SCORE_CARD_TEMPLATE_WWI]: {
    id: SCORE_CARD_TEMPLATE_WWI,
    label: "WWI · 4 Kierrosta + Finaali",
    shortLabel: "WWI",
    rounds: [1, 2, 3, 4],
    resultLabels: ["Kierros 1", "Kierros 2", "Kierros 3", "Finaali"],
    headerLastNameLabel: "Sukunimi",
    modelPointItems: [
      { key: "fourStroke", label: "Nelitahtimoottori", points: 30 },
      { key: "multiwing", label: "Monitaso (Multiwing)", points: 50 },
      { key: "ribStructure", label: "Siipirakenne (Kaaret)", points: 10 },
      { key: "onboardPilot", label: "Pilotti ohjaamossa", points: 10 },
      { key: "weapons", label: "Aseistus", points: 10 },
      { key: "riggingStruts", label: "Tuet ja vaijerit", points: 10 }
    ],
    footerRows: [
      { label: "Lentokonemalli", field: "modelName" },
      { label: "Moottori ja potkuri", field: "motorOrBattery" },
      { label: "Pilotin allekirjoitus", field: "pilot" },
      { label: "Tuomarin allekirjoitus", field: "judge" }
    ]
  }
};

export const SCORE_CARD_ROUNDS = SCORE_CARD_TEMPLATES[SCORE_CARD_TEMPLATE_STANDARD].rounds;

export const DEFAULT_SCORE_CARD_RULES = {
  flightTimePointEverySeconds: 3,
  standardMaxFlightPoints: null,
  wwiMaxFlightPoints: 138,
  cutPoints: 100,
  groundTargetPoints: 60,
  takeoffPoints: 50,
  streamerOkPoints: 50,
  landingAfterEndSignalPoints: 50,
  hasenfussPenalty: 50,
  safetylinePenalty: 200,
  maxModelPoints: 100
};

export function getScoreCardRules(event) {
  const rules = event?.rules || {};
  return {
    ...DEFAULT_SCORE_CARD_RULES,
    flightTimePointEverySeconds: Number(rules.flightTimePointEverySeconds || DEFAULT_SCORE_CARD_RULES.flightTimePointEverySeconds),
    cutPoints: Number(rules.cutPoints || DEFAULT_SCORE_CARD_RULES.cutPoints),
    groundTargetPoints: Number(rules.groundTargetPoints || DEFAULT_SCORE_CARD_RULES.groundTargetPoints),
    takeoffPoints: Number(rules.takeoffPoints || DEFAULT_SCORE_CARD_RULES.takeoffPoints),
    streamerOkPoints: Number(rules.intactStreamerPoints || rules.streamerOkPoints || DEFAULT_SCORE_CARD_RULES.streamerOkPoints),
    landingAfterEndSignalPoints: Number(rules.landingAfterEndSignalPoints || DEFAULT_SCORE_CARD_RULES.landingAfterEndSignalPoints),
    hasenfussPenalty: Number(rules.hasenfussPenalty || DEFAULT_SCORE_CARD_RULES.hasenfussPenalty),
    safetylinePenalty: Number(rules.safetylinePenalty || DEFAULT_SCORE_CARD_RULES.safetylinePenalty),
    maxModelPoints: Number(rules.maxModelPoints || DEFAULT_SCORE_CARD_RULES.maxModelPoints),
    wwiMaxFlightPoints: Number(rules.wwiMaxFlightPoints || DEFAULT_SCORE_CARD_RULES.wwiMaxFlightPoints)
  };
}

export function getScoreCardTemplateId({ card, event, entry, aircraft } = {}) {
  if (SCORE_CARD_TEMPLATES[card?.templateId]) return card.templateId;
  const classText = [entry?.className, aircraft?.className, event?.className, event?.name].filter(Boolean).join(" ").toLowerCase();
  if (/\bww1\b|\bwwi\b|world war i|first world war/.test(classText)) return SCORE_CARD_TEMPLATE_WWI;
  return SCORE_CARD_TEMPLATE_STANDARD;
}

export function getScoreCardTemplate(input) {
  const templateId = typeof input === "string" ? input : getScoreCardTemplateId(input);
  return SCORE_CARD_TEMPLATES[templateId] || SCORE_CARD_TEMPLATES[SCORE_CARD_TEMPLATE_STANDARD];
}


export function getScoreCardStructureStages({ card = null, event = null, entry = null, aircraft = null } = {}) {
  const template = getScoreCardTemplate({ card, event, entry, aircraft });
  const className = entry?.className || aircraft?.className || card?.className || "Yleinen";
  const format = getCompetitionFormatForClass(event, className);
  const labels = [];

  for (let round = 1; round <= Number(format.qualifyingRounds || 0); round++) {
    labels.push(`Alkuerä ${round}`);
  }

  if (format.semiFinalEnabled) labels.push("Semifinaali");
  if (format.finalEnabled) labels.push("Finaali");

  const fallbackLabels = template.rounds.map((roundNumber) => `Kierros ${roundNumber}`);
  const visibleLabels = labels.length ? labels : fallbackLabels;

  return visibleLabels.map((label, index) => ({
    roundNumber: Number(template.rounds[index] || index + 1),
    label
  }));
}

export function getScoreCardRoundNumbers(card, event, entry, aircraft) {
  return getScoreCardStructureStages({ card, event, entry, aircraft }).map((stage) => stage.roundNumber);
}

export function createDefaultScoreCard({ entry, pilot, aircraft, event }) {
  const { firstName, lastName } = splitPilotName(pilot?.name || "");
  const templateId = getScoreCardTemplateId({ event, entry, aircraft });
  const template = getScoreCardTemplate(templateId);
  const stages = getScoreCardStructureStages({ event, entry, aircraft });

  return {
    id: `scorecard-${entry.id}`,
    eventId: event.id,
    entryId: entry.id,
    participantId: entry.id,
    className: entry.className || aircraft?.className || "Yleinen",
    templateId,
    startNumber: entry.raceNumber || "",
    firstName,
    lastName,
    frequency: "2.4 GHz",
    flyingRound: "",
    rounds: stages.map((stage) => createDefaultRound(stage.roundNumber, templateId, aircraft?.modelPoints)),
    aircraft: {
      twoPointFiveClass: false,
      modelName: aircraft?.name || "",
      motorOrBattery: aircraft ? [aircraft.engineModel, aircraft.battery].filter(Boolean).join(" / ") : "",
      propeller: aircraft?.propeller || "",
      rpm: ""
    },
    signatures: {
      pilot: "",
      judge: ""
    },
    status: "draft",
    updatedAt: null
  };
}

export function createDefaultRound(roundNumber, templateId = SCORE_CARD_TEMPLATE_STANDARD, aircraftModelPoints = null) {
  return {
    roundNumber,
    modelPoints: aircraftModelPoints ? { ...aircraftModelPoints } : createDefaultModelPoints(),
    takeoff: false,
    flightMinutes: 0,
    flightSeconds: 0,
    cuts: 0,
    groundTargets: 0,
    streamerOk: false,
    hasenfuss: false,
    safetylineOverflown: false,
    landingAfterEndSignal: false,
    total: 0,
    templateId
  };
}

export function createDefaultModelPoints() {
  return {
    fourStroke: false,
    multiwing: false,
    ribStructure: false,
    onboardPilot: false,
    weapons: false,
    riggingStruts: false
  };
}

export function getScoreCardForEntry(state, event, entry) {
  const existing = (state.scoreCards || []).find((card) => card.eventId === event.id && card.entryId === entry.id);
  if (existing) return migrateScoreCard(existing, { event, entry, state });

  const pilot = state.pilots.find((item) => item.id === entry.pilotId);
  const aircraft = state.aircraft.find((item) => item.id === entry.aircraftId);
  return createDefaultScoreCard({ entry, pilot, aircraft, event });
}

export function migrateScoreCard(card, { event, entry, state } = {}) {
  const pilot = state?.pilots?.find((item) => item.id === entry?.pilotId);
  const aircraft = state?.aircraft?.find((item) => item.id === entry?.aircraftId);
  const fallback = event && entry ? createDefaultScoreCard({ event, entry, pilot, aircraft }) : null;
  const templateId = getScoreCardTemplateId({ card, event, entry, aircraft });
  const template = getScoreCardTemplate(templateId);
  const stages = getScoreCardStructureStages({ card, event, entry, aircraft });

  return {
    ...(fallback || {}),
    ...card,
    className: card?.className || fallback?.className || entry?.className || aircraft?.className || "Yleinen",
    startNumber: card?.startNumber || entry?.raceNumber || "",
    templateId,
    rounds: stages.map((stage) => {
      const existing = Array.isArray(card?.rounds) ? card.rounds.find((round) => Number(round.roundNumber) === stage.roundNumber) : null;
      return normalizeRound(existing, stage.roundNumber, templateId);
    }),
    aircraft: {
      ...(fallback?.aircraft || {}),
      ...(card?.aircraft || {})
    },
    signatures: {
      ...(fallback?.signatures || {}),
      ...(card?.signatures || {})
    },
    status: card?.status || "draft"
  };
}

export function normalizeRound(existing, roundNumber, templateId = SCORE_CARD_TEMPLATE_STANDARD) {
  return {
    ...createDefaultRound(roundNumber, templateId),
    ...(existing || {}),
    roundNumber,
    templateId,
    modelPoints: {
      ...createDefaultModelPoints(),
      ...(existing?.modelPoints || {})
    },
    takeoff: Boolean(existing?.takeoff),
    flightMinutes: clampNumber(existing?.flightMinutes, 0, 99),
    flightSeconds: clampNumber(existing?.flightSeconds, 0, 59),
    cuts: clampNumber(existing?.cuts, 0, 99),
    groundTargets: clampNumber(existing?.groundTargets, 0, 99),
    streamerOk: Boolean(existing?.streamerOk),
    hasenfuss: Boolean(existing?.hasenfuss),
    safetylineOverflown: Boolean(existing?.safetylineOverflown),
    landingAfterEndSignal: Boolean(existing?.landingAfterEndSignal)
  };
}

export function calculateScoreCardRound(round, event, templateOrId = null) {
  const template = getScoreCardTemplate(templateOrId || round?.templateId || SCORE_CARD_TEMPLATE_STANDARD);
  const rules = getScoreCardRules(event);
  const minutes = clampNumber(round?.flightMinutes, 0, 99);
  const seconds = clampNumber(round?.flightSeconds, 0, 59);
  const flightSeconds = minutes * 60 + seconds;
  const rawFlightPoints = Math.floor(flightSeconds / rules.flightTimePointEverySeconds);
  const flightPoints = template.id === SCORE_CARD_TEMPLATE_WWI ? Math.min(rules.wwiMaxFlightPoints, rawFlightPoints) : rawFlightPoints;
  const cuts = clampNumber(round?.cuts, 0, 99);
  const groundTargets = clampNumber(round?.groundTargets, 0, 99);
  const cutPoints = cuts * rules.cutPoints;
  const groundTargetPoints = template.id === SCORE_CARD_TEMPLATE_WWI ? groundTargets * rules.groundTargetPoints : 0;
  const takeoffPoints = template.id === SCORE_CARD_TEMPLATE_WWI && round?.takeoff ? rules.takeoffPoints : 0;
  const modelPoints = template.id === SCORE_CARD_TEMPLATE_WWI ? calculateModelPoints(round, rules) : 0;
  const landingAfterEndSignalPoints = template.id === SCORE_CARD_TEMPLATE_WWI && round?.landingAfterEndSignal ? rules.landingAfterEndSignalPoints : 0;
  const streamerOkPoints = round?.streamerOk ? rules.streamerOkPoints : 0;
  const hasenfussPenalty = round?.hasenfuss ? rules.hasenfussPenalty : 0;
  const safetylinePenalty = round?.safetylineOverflown ? rules.safetylinePenalty : 0;
  const penaltyPoints = hasenfussPenalty + safetylinePenalty;
  const flightTotal = takeoffPoints + flightPoints + cutPoints + groundTargetPoints + landingAfterEndSignalPoints + streamerOkPoints - penaltyPoints;
  const total = modelPoints + takeoffPoints + flightPoints + cutPoints + groundTargetPoints + landingAfterEndSignalPoints + streamerOkPoints - penaltyPoints;

  return {
    flightSeconds,
    rawFlightPoints,
    flightPoints,
    modelPoints,
    takeoffPoints,
    cutPoints,
    groundTargetPoints,
    landingAfterEndSignalPoints,
    streamerOkPoints,
    hasenfussPenalty,
    safetylinePenalty,
    penaltyPoints,
    flightTotal,
    total
  };
}

export function calculateModelPoints(round, rules = DEFAULT_SCORE_CARD_RULES) {
  const template = SCORE_CARD_TEMPLATES[SCORE_CARD_TEMPLATE_WWI];
  const modelPoints = round?.modelPoints || {};
  const total = template.modelPointItems.reduce((sum, item) => sum + (modelPoints[item.key] ? item.points : 0), 0);
  return Math.min(Number(rules.maxModelPoints || DEFAULT_SCORE_CARD_RULES.maxModelPoints), total);
}

export function calculateScoreCardTotals(card, event, entry = null, aircraft = null) {
  const template = getScoreCardTemplate({ card, event, entry, aircraft });
  const stages = getScoreCardStructureStages({ card, event, entry, aircraft });
  const roundScores = stages.map(({ roundNumber, label }) => {
    const round = card.rounds.find((item) => Number(item.roundNumber) === roundNumber) || createDefaultRound(roundNumber, template.id);
    return {
      roundNumber,
      label,
      ...round,
      score: calculateScoreCardRound(round, event, template.id)
    };
  });

  return {
    template,
    roundScores,
    totalPoints: roundScores.reduce((sum, round) => sum + round.score.total, 0),
    totalCuts: roundScores.reduce((sum, round) => sum + Number(round.cuts || 0), 0),
    totalFlightSeconds: roundScores.reduce((sum, round) => sum + round.score.flightSeconds, 0),
    bestRoundScore: roundScores.reduce((best, round) => Math.max(best, round.score.total), 0),
    completedRounds: roundScores.filter((round) => hasRoundData(round)).length
  };
}

export function buildScoreCardRows(state, event) {
  if (!event) return [];
  
  const eventHeats = state.heats?.filter(h => h.eventId === event.id) || [];

  return state.entries
    .filter((entry) => entry.eventId === event.id)
    .map((entry) => {
      const pilot = state.pilots.find((item) => item.id === entry.pilotId);
      const aircraft = state.aircraft.find((item) => item.id === entry.aircraftId);
      const card = getScoreCardForEntry(state, event, entry);
      const totals = calculateScoreCardTotals(card, event, entry, aircraft);

      const className = entry.className || aircraft?.className || "Yleinen";
      
      const pilotHeats = eventHeats.filter(h => h.className === className && h.entryIds.includes(entry.id));
      const calculatedFlyingRound = pilotHeats.map(h => {
        const phaseLabel = h.phase === "semifinal" ? "Semi " : (h.phase === "final" ? "Finaali " : `K${h.round} `);
        return `${phaseLabel}${formatHeatTitle(h, null)}`;
      }).join(", ");
      const pilotAircraft = state.aircraft.filter(a => a.pilotId === entry.pilotId && a.className === className);

      return {
        entry,
        pilot,
        aircraft,
        pilotAircraft,
        card,
        totals,
        pilotName: getPilotName(state, entry.pilotId),
        aircraftName: getAircraftName(state, entry.aircraftId),
        className,
        calculatedFlyingRound
      };
    })
    .sort((a, b) => String(a.entry.raceNumber || "").localeCompare(String(b.entry.raceNumber || ""), "fi", { numeric: true }) || a.pilotName.localeCompare(b.pilotName, "fi"));
}

export function hasSavedScoreCard(card) {
  return Boolean(card?.updatedAt) || (Array.isArray(card?.rounds) && card.rounds.some(hasRoundData));
}

export function hasRoundData(round) {
  return Boolean(
    Object.values(round?.modelPoints || {}).some(Boolean) ||
    round?.takeoff ||
    Number(round?.flightMinutes || 0) ||
    Number(round?.flightSeconds || 0) ||
    Number(round?.cuts || 0) ||
    Number(round?.groundTargets || 0) ||
    round?.streamerOk ||
    round?.hasenfuss ||
    round?.safetylineOverflown ||
    round?.landingAfterEndSignal
  );
}

export function roundHasData(round) {
  if (!round) return false;
  return Number(round.flightMinutes || 0) > 0 ||
         Number(round.flightSeconds || 0) > 0 ||
         Number(round.cuts || 0) > 0 ||
         Number(round.groundTargets || 0) > 0 ||
         Boolean(round.takeoff) ||
         Boolean(round.streamerOk) ||
         Boolean(round.hasenfuss) ||
         Boolean(round.safetylineOverflown) ||
         Boolean(round.landingAfterEndSignal) ||
         (round.modelPoints && Object.values(round.modelPoints).some(v => v));
}

export function isRoundDirty(round, existingRound) {
  if (!existingRound) return roundHasData(round);
  return Number(round.flightMinutes || 0) !== Number(existingRound.flightMinutes || 0) ||
         Number(round.flightSeconds || 0) !== Number(existingRound.flightSeconds || 0) ||
         Number(round.cuts || 0) !== Number(existingRound.cuts || 0) ||
         Number(round.groundTargets || 0) !== Number(existingRound.groundTargets || 0) ||
         Boolean(round.takeoff) !== Boolean(existingRound.takeoff) ||
         Boolean(round.streamerOk) !== Boolean(existingRound.streamerOk) ||
         Boolean(round.hasenfuss) !== Boolean(existingRound.hasenfuss) ||
         Boolean(round.safetylineOverflown) !== Boolean(existingRound.safetylineOverflown) ||
         Boolean(round.landingAfterEndSignal) !== Boolean(existingRound.landingAfterEndSignal) ||
         JSON.stringify(round.modelPoints || {}) !== JSON.stringify(existingRound.modelPoints || {});
}

export function getRoundStatusInfo(round, activeEvent, isDirty = false) {
  if (activeEvent?.resultsPublished) return { id: "locked", label: "Lukittu", icon: "🔒", class: "locked" };
  
  if (isDirty) {
    return { id: "in-progress", label: "Muokataan", icon: "✎", class: "in-progress" };
  }
  
  if (roundHasData(round)) {
    return { id: "saved", label: "Tallennettu", icon: "✓", class: "saved" };
  }
  
  return { id: "empty", label: "Ei aloitettu", icon: "○", class: "empty" };
}

export function buildOfficialScoreCardRanking(state, event) {
  return buildScoreCardRows(state, event)
    .map((row) => ({ ...row, hasScoreCard: hasSavedScoreCard(row.card) }))
    .sort((a, b) =>
      b.totals.totalPoints - a.totals.totalPoints ||
      b.totals.totalCuts - a.totals.totalCuts ||
      b.totals.totalFlightSeconds - a.totals.totalFlightSeconds ||
      a.pilotName.localeCompare(b.pilotName, "fi")
    );
}

export function splitPilotName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "" };
}

export function clampNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}
