// ==============================
// Aircombat Competition Manager
// src/utils/formValues.js
// Päivitetty: 2026-06-04
// ==============================
// Yhteiset lomake- ja muunnosapufunktiot.
// ==============================

export function readYesNo(value) {
  if (value === undefined) return undefined;
  return value === "yes" || value === true || value === "true" || value === "on";
}

export function readNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

export function firstFilled(data, baseName) {
  const direct = String(data[baseName] || "").trim();
  if (direct) return direct;

  for (const key of Object.keys(data)) {
    if (!key.startsWith(`${baseName}_`)) continue;
    const value = String(data[key] || "").trim();
    if (value) return value;
  }

  return "";
}

export function requireText(value, message) {
  const text = String(value || "").trim();
  if (!text) throw new Error(message);
  return text;
}

export function requireFloat(value, message) {
  const valueText = String(value || "").trim().replace(",", ".");
  const number = parseFloat(valueText);
  if (Number.isNaN(number) || number <= 0) throw new Error(message);
  return number;
}

export function slugify(value) {
  return String(value || "aircombat")
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/gi, "-")
    .replace(/^-|-$/g, "") || "aircombat";
}

export function formatDuration(totalSeconds) {
  const minutes = Math.floor(Number(totalSeconds || 0) / 60);
  const seconds = Number(totalSeconds || 0) % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
