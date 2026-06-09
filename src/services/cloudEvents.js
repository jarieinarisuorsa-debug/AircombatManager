import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchEventsFromCloud() {
  if (!isCloudMode() || !supabase) return [];
  const { data, error } = await supabase.from("events").select("*");
  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }
  return data.map(mapEventFromDb);
}

export async function saveEventToCloud(event) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("events").upsert(mapEventToDb(event));
  if (error) {
    console.error("Error saving event:", error);
    return false;
  }
  return true;
}
export function mapEventFromDb(db) {
  return {
    id: db.id,
    name: db.name,
    location: db.location,
    date: db.date,
    endDate: db.end_date,
    status: db.status,
    classes: db.classes,
    publicNotice: db.public_notice,
    safetyStatus: db.safety_status,
    resultsPublished: db.results_published,
    resultsPublishedAt: db.results_published_at,
    resultsApprovedBy: db.results_approved_by,
    rules: db.rules,
    competitionFormat: db.competition_format,
    classFormats: db.class_formats,
    eventInfo: db.event_info
  };
}

export function mapEventToDb(ev) {
  return {
    id: ev.id,
    name: ev.name,
    location: ev.location,
    date: ev.date,
    end_date: ev.endDate,
    status: ev.status,
    classes: ev.classes,
    public_notice: ev.publicNotice,
    safety_status: ev.safetyStatus,
    results_published: ev.resultsPublished,
    results_published_at: ev.resultsPublishedAt,
    results_approved_by: ev.resultsApprovedBy,
    rules: ev.rules,
    competition_format: ev.competitionFormat,
    class_formats: ev.classFormats,
    event_info: ev.eventInfo
  };
}
