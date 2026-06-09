// ==============================
// Aircombat Competition Manager
// src/state/store.js
// Päivitetty: 2026-06-04
// ==============================

import { DEFAULT_STATE, DEFAULT_RULES } from "../data/defaultState.js";
import { migrateScoreCard } from "../logic/scoreCards.js";
import { normalizeCompetitionFormat, normalizeClassFormats, HEAT_PHASES } from "../logic/competitionFormat.js";
import { normalizeEventInfo } from "../logic/eventInfo.js";

const STORAGE_KEY = "aircombatCompetitionManager.state.v1";

let cachedState = loadState();

export function getState() {
  return structuredClone(cachedState);
}

export function setState(nextState, reason = "state_update") {
  const oldState = cachedState;
  
  cachedState = migrateState({
    ...nextState,
    auditLog: [
      ...(nextState.auditLog || []),
      {
        id: createId("log"),
        at: new Date().toISOString(),
        reason
      }
    ].slice(-200)
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  
  // Asynchronous cloud sync (Optimistic UI)
  if (!reason.startsWith("init_") && !reason.startsWith("realtime_")) {
    import("../services/cloudStore.js").then(module => {
      module.syncCloudFromState(oldState, cachedState).catch(err => {
        console.error("Cloud sync failed for reason:", reason, err);
      });
    }).catch(err => console.error("Failed to load cloudStore for sync:", err));
  }
  
  return getState();
}

export function updateState(mutator, reason = "state_update") {
  const draft = getState();
  mutator(draft);
  return setState(draft, reason);
}

export function resetState() {
  cachedState = structuredClone(DEFAULT_STATE);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  return getState();
}

export function importState(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed || !Array.isArray(parsed.events) || !Array.isArray(parsed.pilots)) {
    throw new Error("JSON ei näytä Aircombat Competition Manager -tiedostolta.");
  }
  cachedState = migrateState(parsed);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  return getState();
}

export function exportState() {
  return JSON.stringify(cachedState, null, 2);
}

export function createId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return migrateState(JSON.parse(raw));
  } catch (error) {
    console.warn("State load failed, using defaults", error);
    return structuredClone(DEFAULT_STATE);
  }
}

function migrateState(input) {
  const base = structuredClone(DEFAULT_STATE);
  const parsed = input || {};

  const state = {
    ...base,
    ...parsed,
    version: base.version,
    auth: {
      ...base.auth,
      ...(parsed.auth || {})
    },
    settings: {
      ...base.settings,
      ...(parsed.settings || {})
    },
    events: Array.isArray(parsed.events) ? parsed.events.map(migrateEvent) : base.events,
    pilots: Array.isArray(parsed.pilots) ? parsed.pilots : base.pilots,
    aircraft: Array.isArray(parsed.aircraft) ? parsed.aircraft.map(migrateAircraft) : base.aircraft,
    entries: Array.isArray(parsed.entries) ? parsed.entries.map(migrateEntry) : base.entries,
    heats: Array.isArray(parsed.heats) ? parsed.heats.map(migrateHeat) : base.heats,
    results: Array.isArray(parsed.results) ? parsed.results : base.results,
    scoreCards: Array.isArray(parsed.scoreCards) ? parsed.scoreCards.map(migrateScoreCard) : base.scoreCards,
    registrations: Array.isArray(parsed.registrations) ? parsed.registrations : base.registrations,
    aircraftSpecs: (Array.isArray(parsed.aircraftSpecs) && parsed.aircraftSpecs.length > 0) ? parsed.aircraftSpecs.map(migrateAircraftSpec) : base.aircraftSpecs.map(migrateAircraftSpec),
    messages: Array.isArray(parsed.messages) ? parsed.messages : base.messages,
    auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : []
  };

  if (!state.events.some((event) => event.id === state.activeEventId)) {
    state.activeEventId = state.events[0]?.id || null;
  }

  // Varmistetaan että admin@demo.fi on aina ylläpitäjä
  if (state.settings.userEmail === undefined) {
    state.settings.userEmail = "admin@demo.fi"; // Fallback only if strictly undefined, allowing empty string ""
  }
  if (!state.settings.adminEmails) {
    state.settings.adminEmails = [];
  }
  if (!state.settings.adminEmails.includes("admin@demo.fi")) {
    state.settings.adminEmails.push("admin@demo.fi");
  }

  return state;
}

function migrateEvent(event) {
  let migratedClasses = Array.isArray(event.classes) ? event.classes : [];
  migratedClasses = migratedClasses.map(c => c === "WW2" ? "WWII" : c);
  
  return {
    ...event,
    endDate: event.endDate || event.date || "",
    classes: migratedClasses,
    publicNotice: event.publicNotice || "",
    safetyStatus: event.safetyStatus || "planned",
    resultsPublished: Boolean(event.resultsPublished),
    resultsPublishedAt: event.resultsPublishedAt || null,
    resultsApprovedBy: event.resultsApprovedBy || "",
    rules: {
      ...DEFAULT_RULES,
      ...(event.rules || {}),
      groundTargetPoints: event.rules?.groundTargetPoints === 50 ? 60 : (event.rules?.groundTargetPoints || DEFAULT_RULES.groundTargetPoints)
    },
    competitionFormat: normalizeCompetitionFormat(event.competitionFormat),
    classFormats: normalizeClassFormats(event.classFormats),
    eventInfo: normalizeEventInfo(event.eventInfo)
  };
}

function migrateHeat(heat) {
  return {
    ...heat,
    className: heat.className === "WW2" ? "WWII" : heat.className,
    phase: heat.phase || HEAT_PHASES.QUALIFYING,
    round: Number(heat.round || 1)
  };
}

function migrateAircraft(aircraft) {
  const cName = aircraft.className || "Yleinen";
  return {
    ...aircraft,
    className: cName === "WW2" ? "WWII" : cName,
    engine: aircraft.engine || "Other",
    engineModel: aircraft.engineModel || "",
    battery: aircraft.battery || "",
    propeller: aircraft.propeller || "",
    modelPoints: aircraft.modelPoints || {
      fourStroke: false,
      multiwing: false,
      ribStructure: false,
      onboardPilot: false,
      weapons: false,
      riggingStruts: false
    },
    techStatus: aircraft.techStatus || "pending"
  };
}

function migrateEntry(entry) {
  const paymentStatus = entry.paymentStatus || (entry.paid ? "paid" : "unpaid");
  const checkInStatus = entry.checkInStatus || (entry.checkedIn ? "checked_in" : "not_arrived");
  const cName = entry.className || "Yleinen";

  return {
    ...entry,
    className: cName === "WW2" ? "WWII" : cName,
    raceNumber: entry.raceNumber || "",
    paymentStatus,
    checkInStatus,
    technicalInspection: entry.technicalInspection || "pending",
    notes: entry.notes || "",
    paid: paymentStatus === "paid" || paymentStatus === "exempt",
    checkedIn: checkInStatus === "checked_in",
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null
  };
}

function migrateAircraftSpec(spec, idx) {
  const generatedId = `spec-${String(spec.name || idx).toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  return {
    id: spec.id || generatedId,
    name: spec.name || "",
    realSpanM: Number(spec.realSpanM || 0),
    realLengthM: Number(spec.realLengthM || 0)
  };
}

