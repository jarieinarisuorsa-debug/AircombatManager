import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchResultsFromCloud(eventId = null) {
  if (!isCloudMode() || !supabase) return [];
  let query = supabase.from("results").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching results:", error);
    return [];
  }
  return data.map(mapResultFromDb);
}

export async function saveResultsToCloud(results) {
  if (!isCloudMode() || !supabase || results.length === 0) return false;
  const { error } = await supabase.from("results").upsert(results.map(mapResultToDb));
  if (error) {
    console.error("Error saving results:", error);
    return false;
  }
  return true;
}

export function mapResultFromDb(db) {
  return {
    id: db.id,
    eventId: db.event_id,
    className: db.class_name,
    pilotId: db.pilot_id,
    entryId: db.entry_id,
    position: db.position,
    totalScore: db.total_score,
    roundsPlayed: db.rounds_played,
    scoreDetails: db.score_details,
    isOfficial: db.is_official,
    createdAt: db.created_at
  };
}

export function mapResultToDb(r) {
  return {
    id: r.id,
    event_id: r.eventId,
    class_name: r.className,
    pilot_id: r.pilotId,
    entry_id: r.entryId,
    position: r.position,
    total_score: r.totalScore,
    rounds_played: r.roundsPlayed,
    score_details: r.scoreDetails,
    is_official: r.isOfficial,
    created_at: r.createdAt
  };
}

