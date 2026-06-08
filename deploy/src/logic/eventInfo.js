// ==============================
// Aircombat Competition Manager
// src/logic/eventInfo.js
// Päivitetty: 2026-06-04
// ==============================
// Kilpailukohtaiset julkiset lisätiedot: kartta, saapuminen, yhteystiedot.
// ==============================

export const DEFAULT_EVENT_INFO = {
  description: "",
  organizer: "",
  contactName: "",
  contactEmail: "",
  websiteUrl: "",
  address: "",
  latitude: "",
  longitude: "",
  mapsUrl: "",
  mapImageUrl: "",
  arrivalInfo: "",
  servicesInfo: "",
  documentsText: "",
  mapPois: [],
  mapZones: [],
  sponsors: [],
  schedule: [],
  coatOfArmsData: ""
};

export function normalizeEventInfo(info = {}) {
  return {
    ...DEFAULT_EVENT_INFO,
    ...(info || {}),
    description: String(info.description || ""),
    organizer: String(info.organizer || ""),
    contactName: String(info.contactName || ""),
    contactEmail: String(info.contactEmail || ""),
    websiteUrl: String(info.websiteUrl || ""),
    address: String(info.address || ""),
    latitude: String(info.latitude || ""),
    longitude: String(info.longitude || ""),
    mapsUrl: String(info.mapsUrl || ""),
    mapImageUrl: String(info.mapImageUrl || ""),
    arrivalInfo: String(info.arrivalInfo || ""),
    servicesInfo: String(info.servicesInfo || ""),
    documentsText: String(info.documentsText || ""),
    mapPois: Array.isArray(info.mapPois) ? info.mapPois : [],
    mapZones: Array.isArray(info.mapZones) ? info.mapZones : [],
    sponsors: Array.isArray(info.sponsors) ? info.sponsors : [],
    schedule: Array.isArray(info.schedule) ? info.schedule : [],
    coatOfArmsData: String(info.coatOfArmsData || "")
  };
}

export function parseDocumentLines(documentsText = "") {
  return String(documentsText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...urlParts] = line.split("|").map((part) => part.trim());
      return {
        title: title || line,
        url: urlParts.join("|")
      };
    });
}
