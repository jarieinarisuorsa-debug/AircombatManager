// ==============================
// Aircombat Competition Manager
// src/logic/participants.js
// Päivitetty: 2026-06-04
// ==============================
// Vastuu:
// - kilpailukohtaisten osallistujien haku ja esitysrivit
// - adminin osallistujalistan CSV-vienti
// - julkisen osallistujalistan rajaaminen turvalliseksi
// ==============================

import { getAircraftName, getPilotName } from "../utils/html.js";

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Ei maksettu",
  paid: "Maksettu",
  exempt: "Vapautettu"
};

export const CHECK_IN_STATUS_LABELS = {
  not_arrived: "Ei saapunut",
  arrived: "Saapunut",
  checked_in: "Check-in OK"
};

export const TECHNICAL_INSPECTION_LABELS = {
  pending: "Tarkastamatta",
  approved: "Hyväksytty",
  repair_required: "Korjattava",
  rejected: "Hylätty"
};

export function getEventEntries(state, eventId) {
  return (state.entries || []).filter((entry) => entry.eventId === eventId);
}

export function normalizeClassName(event, className) {
  const fallback = event?.classes?.[0] || "Yleinen";
  return String(className || fallback).trim() || fallback;
}

export function getEntryStatusLabel(labels, value, fallback = "-") {
  return labels[value] || fallback;
}

export function hydrateEntry(state, entry) {
  const pilot = state.pilots.find((item) => item.id === entry.pilotId) || null;
  const aircraft = state.aircraft.find((item) => item.id === entry.aircraftId) || null;

  return {
    ...entry,
    pilot,
    aircraft,
    pilotName: getPilotName(state, entry.pilotId),
    aircraftName: getAircraftName(state, entry.aircraftId),
    country: pilot?.country || "",
    club: pilot?.club || "",
    aircraftClassName: aircraft?.className || "",
    aircraftTechStatus: aircraft?.techStatus || (entry.aircraftId ? "pending" : "missing_aircraft"),
    raceNumber: entry.raceNumber || "",
    paymentStatus: entry.paymentStatus || (entry.paid ? "paid" : "unpaid"),
    checkInStatus: entry.checkInStatus || (entry.checkedIn ? "checked_in" : "not_arrived"),
    technicalInspection: entry.technicalInspection || aircraft?.techStatus || "pending",
    notes: entry.notes || ""
  };
}

export function buildParticipantRows(state, event) {
  if (!event) return [];

  return getEventEntries(state, event.id)
    .map((entry) => hydrateEntry(state, entry))
    .sort(compareParticipants);
}

export function buildPublicParticipantRows(state, event) {
  return buildParticipantRows(state, event).map((row) => ({
    id: row.id,
    pilotName: row.pilotName,
    country: row.country,
    club: row.club,
    className: row.className,
    raceNumber: row.raceNumber
  }));
}

export function groupParticipantsByClass(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const className = row.className || "Yleinen";
    if (!groups.has(className)) groups.set(className, []);
    groups.get(className).push(row);
  });

  return Array.from(groups.entries()).map(([className, items]) => ({
    className,
    rows: items
  }));
}

export function buildParticipantsCsv(state, event) {
  const rows = buildParticipantRows(state, event);
  const header = [
    "Kilpailu",
    "Kilpailunumero",
    "Pilotti",
    "Maa",
    "Seura",
    "Luokka",
    "Kone",
    "Maksu",
    "Check-in",
    "Tekninen tarkastus",
    "Huomiot"
  ];

  const lines = [
    header,
    ...rows.map((row) => [
      event?.name || "",
      row.raceNumber,
      row.pilotName,
      row.country,
      row.club,
      row.className,
      row.aircraftName,
      getEntryStatusLabel(PAYMENT_STATUS_LABELS, row.paymentStatus),
      getEntryStatusLabel(CHECK_IN_STATUS_LABELS, row.checkInStatus),
      getEntryStatusLabel(TECHNICAL_INSPECTION_LABELS, row.technicalInspection),
      row.notes
    ])
  ];

  return lines.map((line) => line.map(escapeCsvCell).join(";")).join("\n");
}

function compareParticipants(a, b) {
  return String(a.className || "").localeCompare(String(b.className || ""), "fi")
    || compareRaceNumber(a.raceNumber, b.raceNumber)
    || String(a.pilotName || "").localeCompare(String(b.pilotName || ""), "fi");
}

function compareRaceNumber(a, b) {
  const numberA = Number(a);
  const numberB = Number(b);
  const validA = Number.isFinite(numberA) && String(a || "").trim() !== "";
  const validB = Number.isFinite(numberB) && String(b || "").trim() !== "";
  if (validA && validB) return numberA - numberB;
  if (validA) return -1;
  if (validB) return 1;
  return String(a || "").localeCompare(String(b || ""), "fi");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (!/[;"\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}
