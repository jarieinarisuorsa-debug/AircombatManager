// ==============================
// Aircombat Competition Manager
// src/data/defaultState.js
// Päivitetty: 2026-06-04
// ==============================

import { AIRCRAFT_TYPES } from "./aircraftSpecs.js";
import { DEFAULT_COMPETITION_FORMAT } from "../logic/competitionFormat.js";
import { DEFAULT_EVENT_INFO } from "../logic/eventInfo.js";

export const DEFAULT_RULES = {
  heatDurationSeconds: 420,
  maxAircraftPerHeat: 6,
  flightTimePointEverySeconds: 3,
  cutPoints: 100,
  intactStreamerPoints: 50,
  groundTargetPoints: 60,
  takeoffPoints: 50,
  landingAfterEndSignalPoints: 50,
  wwiMaxFlightPoints: 138,
  maxModelPoints: 100,
  hasenfussPenalty: 50,
  safetylinePenalty: 200,
  penaltyEnabled: true
};

export const DEFAULT_STATE = {
  version: 1,
  auth: { user: null },
  activeEventId: null,
  settings: {
    organizerName: "",
    publicDisplayMode: false,
    currentRole: "admin",
    theme: "dark",
    pilotViewMode: "grid",
    aircraftSpecFormOpen: false,
    eventFormOpen: false,
    competitionFormatModalOpen: false,
    competitionFormatModalClassName: "",
    userEmail: "admin@demo.fi",
    adminEmails: ["admin@demo.fi"]
  },
  events: [],
  pilots: [],
  aircraft: [],
  entries: [],
  registrations: [],
  heats: [],
  results: [],
  scoreCards: [],
  aircraftSpecs: AIRCRAFT_TYPES,
  messages: [],
  auditLog: []
};
