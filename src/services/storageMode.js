// ==============================
// Aircombat Competition Manager
// src/services/storageMode.js
// ==============================
// Hallinnoi käytetäänkö local- (localStorage) vai cloud-tilaa (Supabase).
// ==============================

import { supabase } from "./supabaseClient.js";

let currentMode = supabase ? "cloud" : "local";

export function getStorageMode() {
  return currentMode;
}

export function setStorageMode(mode) {
  if (mode !== "local" && mode !== "cloud") {
    throw new Error("Invalid storage mode. Must be 'local' or 'cloud'.");
  }
  currentMode = mode;
}

export function isCloudMode() {
  return currentMode === "cloud";
}
