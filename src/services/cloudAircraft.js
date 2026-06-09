import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchAircraftFromCloud() {
  if (!isCloudMode() || !supabase) return [];
  const { data, error } = await supabase.from("aircraft").select("*");
  if (error) {
    console.error("Error fetching aircraft:", error);
    return [];
  }
  return data.map(mapAircraftFromDb);
}

export async function saveAircraftToCloud(aircraft) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("aircraft").upsert(mapAircraftToDb(aircraft));
  if (error) {
    console.error("Error saving aircraft:", error);
    return false;
  }
  return true;
}

export async function deleteAircraftFromCloud(id) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("aircraft").delete().eq("id", id);
  if (error) {
    console.error("Error deleting aircraft:", error);
    return false;
  }
  return true;
}

// AIRCRAFT SPECS
export async function fetchAircraftSpecsFromCloud() {
  if (!isCloudMode() || !supabase) return [];
  const { data, error } = await supabase.from("aircraft_specs").select("*");
  if (error) {
    console.error("Error fetching aircraft specs:", error);
    return [];
  }
  return data.map(mapAircraftSpecFromDb);
}

export async function saveAircraftSpecToCloud(spec) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("aircraft_specs").upsert(mapAircraftSpecToDb(spec));
  if (error) {
    console.error("Error saving aircraft spec:", error);
    return false;
  }
  return true;
}

export async function deleteAircraftSpecFromCloud(id) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("aircraft_specs").delete().eq("id", id);
  if (error) {
    console.error("Error deleting aircraft spec:", error);
    return false;
  }
  return true;
}
// MAPPING FUNCTIONS
export function mapAircraftFromDb(db) {
  return {
    id: db.id,
    pilotId: db.pilot_id,
    name: db.name,
    className: db.class_name,
    engine: db.engine,
    techStatus: db.tech_status,
    createdAt: db.created_at
  };
}

export function mapAircraftToDb(ac) {
  return {
    id: ac.id,
    pilot_id: ac.pilotId,
    name: ac.name,
    class_name: ac.className,
    engine: ac.engine,
    tech_status: ac.techStatus,
    created_at: ac.createdAt
  };
}

export function mapAircraftSpecFromDb(db) {
  return {
    id: db.id,
    name: db.name,
    realSpanM: db.real_span_m,
    realLengthM: db.real_length_m,
    createdAt: db.created_at
  };
}

export function mapAircraftSpecToDb(spec) {
  return {
    id: spec.id,
    name: spec.name,
    real_span_m: spec.realSpanM,
    real_length_m: spec.realLengthM,
    created_at: spec.createdAt
  };
}
