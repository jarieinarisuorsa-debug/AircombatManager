// ==============================
// Aircombat Competition Manager
// src/services/supabaseClient.js
// ==============================
// Alustaa Supabase-clientin.
// ==============================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://zzflwazltcwmtmqaqrtp.supabase.co";
const supabaseAnonKey = "sb_publishable_AwVstB6uSKHbul3XAeZj8w_KfHYmCed";

export let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.info("Supabase client initialized.");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
} else {
  console.info("Supabase credentials not found. Running in local-only mode.");
}