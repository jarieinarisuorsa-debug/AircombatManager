import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchHeatsFromCloud(eventId = null) {
  if (!isCloudMode() || !supabase) return [];
  let query = supabase.from("heats").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching heats:", error);
    return [];
  }
  return data.map(mapHeatFromDb);
}

export async function saveHeatsToCloud(heats) {
  if (!isCloudMode() || !supabase || heats.length === 0) return false;
  const { error } = await supabase.from("heats").upsert(heats.map(mapHeatToDb));
  if (error) {
    console.error("Error saving heats:", error);
    return false;
  }
  return true;
}
export function mapHeatFromDb(db) {
  return {
    id: db.id,
    eventId: db.event_id,
    className: db.class_name,
    groupName: db.group_name,
    round: db.round,
    phase: db.phase,
    status: db.status,
    entryIds: db.entry_ids,
    createdAt: db.created_at
  };
}

export function mapHeatToDb(h) {
  return {
    id: h.id,
    event_id: h.eventId,
    class_name: h.className,
    group_name: h.groupName,
    round: h.round,
    phase: h.phase,
    status: h.status,
    entry_ids: h.entryIds,
    created_at: h.createdAt
  };
}

// SCORE CARDS
