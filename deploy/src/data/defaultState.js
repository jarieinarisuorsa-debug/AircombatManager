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
  groundTargetPoints: 50,
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
  activeEventId: "event-jami-spring",
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
    userEmail: "",
    adminEmails: ["admin@demo.fi"]
  },
  events: [
    {
      id: "event-jami-spring",
      name: "Jämijärvi",
      location: "Jämijärven lentokenttä",
      date: "2026-04-11",
      endDate: "2026-04-11",
      status: "planned",
      classes: ["WW2", "WWI", "EPA"],
      publicNotice: "Kevätkokous",
      safetyStatus: "planned",
      resultsPublished: false,
      resultsPublishedAt: null,
      resultsApprovedBy: "",
      rules: { ...DEFAULT_RULES },
      competitionFormat: { ...DEFAULT_COMPETITION_FORMAT },
      classFormats: {},
      eventInfo: { ...DEFAULT_EVENT_INFO }
    },
    {
      id: "event-seinajoki",
      name: "Seinäjoki",
      location: "Seinäjoen lennokkikerho RC-AirClubin lennokkikenttä",
      date: "2026-05-16",
      endDate: "2026-05-16",
      status: "planned",
      classes: ["WW2", "WWI", "EPA"],
      publicNotice: "",
      safetyStatus: "planned",
      resultsPublished: false,
      resultsPublishedAt: null,
      resultsApprovedBy: "",
      rules: { ...DEFAULT_RULES },
      competitionFormat: { ...DEFAULT_COMPETITION_FORMAT },
      classFormats: {},
      eventInfo: { ...DEFAULT_EVENT_INFO }
    },
    {
      id: "event-kiuruvesi",
      name: "Kiuruvesi",
      location: "Kiuruveden lentokenttä",
      date: "2026-06-13",
      endDate: "2026-06-13",
      status: "planned",
      classes: ["WW2", "WWI", "EPA"],
      publicNotice: "",
      safetyStatus: "planned",
      resultsPublished: false,
      resultsPublishedAt: null,
      resultsApprovedBy: "",
      rules: { ...DEFAULT_RULES },
      competitionFormat: { ...DEFAULT_COMPETITION_FORMAT },
      classFormats: {},
      eventInfo: { ...DEFAULT_EVENT_INFO }
    },
    {
      id: "event-easg",
      name: "EASG Finland",
      location: "Jämijärven lentokenttä",
      date: "2026-08-04",
      endDate: "2026-08-08",
      status: "planned",
      classes: ["WW2", "WWI", "EPA"],
      publicNotice: "",
      safetyStatus: "planned",
      resultsPublished: false,
      resultsPublishedAt: null,
      resultsApprovedBy: "",
      rules: { ...DEFAULT_RULES },
      competitionFormat: { ...DEFAULT_COMPETITION_FORMAT },
      classFormats: {},
      eventInfo: { ...DEFAULT_EVENT_INFO }
    },
    {
      id: "event-turku",
      name: "Battle of Turku IV",
      location: "Turku",
      date: "2026-09-19",
      endDate: "2026-09-19",
      status: "planned",
      classes: ["WW2", "WWI", "EPA"],
      publicNotice: "Syyskokous",
      safetyStatus: "planned",
      resultsPublished: false,
      resultsPublishedAt: null,
      resultsApprovedBy: "",
      rules: { ...DEFAULT_RULES },
      competitionFormat: { ...DEFAULT_COMPETITION_FORMAT },
      classFormats: {},
      eventInfo: { ...DEFAULT_EVENT_INFO }
    }
  ],
  pilots: [
    {
      id: "pilot-demo-1",
      name: "Matti Meikäläinen",
      country: "FI",
      club: "Demo RC",
      email: "matti@demo.fi",
      license: "",
      phone: ""
    },
    {
      id: "pilot-demo-2",
      name: "Erkki Esimerkkinen",
      country: "FI",
      club: "Demo RC",
      license: "",
      phone: ""
    },
    {
      id: "pilot-demo-3",
      name: "Franz Beispiel",
      country: "DE",
      club: "Demo Aircombat",
      license: "",
      phone: ""
    }
  ],
  aircraft: [
    {
      id: "aircraft-demo-1",
      pilotId: "pilot-demo-1",
      name: "Spitfire Mk IX",
      className: "WW2",
      engine: "Combustion",
      techStatus: "approved"
    },
    {
      id: "aircraft-demo-2",
      pilotId: "pilot-demo-2",
      name: "Mustang P-51",
      className: "WW2",
      engine: "Electric",
      techStatus: "approved"
    },
    {
      id: "aircraft-demo-3",
      pilotId: "pilot-demo-3",
      name: "Fokker Dr.I",
      className: "WWI",
      engine: "Combustion",
      techStatus: "approved"
    }
  ],
  entries: [],
  registrations: [],
  heats: [],
  results: [],
  scoreCards: [],
  aircraftSpecs: AIRCRAFT_TYPES,
  auditLog: []
};
