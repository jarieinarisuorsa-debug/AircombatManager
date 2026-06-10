import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchPilotsFromCloud() {
  if (!isCloudMode() || !supabase) {
    return [];
  }
  
  try {
    // Haetaan julkiset tiedot kaikista piloteista (näkymän kautta)
    const { data: publicData, error: publicError } = await supabase.from("public_pilots").select("*");
    if (publicError) throw publicError;

    // Haetaan omat yksityiset tiedot (RLS rajaa tämän vain käyttäjän omaan profiiliin tai admineille)
    const { data: privateData, error: privateError } = await supabase.from("pilots").select("*");
    if (privateError) throw privateError;

    // Yhdistetään tiedot: julkinen data on pohjana, johon liitetään yksityiset kentät jos ne on saatu
    const mergedData = publicData.map(pubPilot => {
      const privPilot = (privateData || []).find(p => p.id === pubPilot.id);
      return privPilot ? { ...pubPilot, ...privPilot } : pubPilot;
    });

    return mergedData.map(mapPilotFromDb);
  } catch (error) {
    console.error("Error fetching pilots from cloud:", error);
    return [];
  }
}

// Etsii tietyn pilotin sähköpostilla
export async function findPilotByEmail(email) {
  if (!isCloudMode() || !supabase || !email) {
    return null;
  }

  const { data, error } = await supabase
    .from("pilots")
    .select("*")
    .ilike("email", email.trim())
    .single();

  if (error) {
    console.error("Error finding pilot by email:", error);
    return null;
  }

  return data;
}

// Tallentaa (tai päivittää) pilotin pilveen
export async function savePilotToCloud(pilot) {
  if (!isCloudMode() || !supabase) {
    return false;
  }
  
  const dbData = mapPilotToDb(pilot);
  const { error } = await supabase.from("pilots").upsert(dbData);
  if (error) {
    console.error("Error saving pilot to cloud:", error);
    return false;
  }
  
  return true;
}

// Päivittää tiettyjä kenttiä pilvestä
export async function updatePilotInCloud(pilotId, patch) {
  if (!isCloudMode() || !supabase || !pilotId) {
    return false;
  }

  const { error } = await supabase
    .from("pilots")
    .update(patch)
    .eq("id", pilotId);

  if (error) {
    console.error("Error updating pilot in cloud:", error);
    return false;
  }

  return true;
}

// Poistaa pilotin pilvestä
export async function deletePilotFromCloud(pilotId) {
  if (!isCloudMode() || !supabase || !pilotId) {
    return false;
  }

  const { error } = await supabase
    .from("pilots")
    .delete()
    .eq("id", pilotId);

  if (error) {
    console.error("Error deleting pilot from cloud:", error);
    return false;
  }

  return true;
}

// PHASE 4: EVENTS, REGISTRATION REQUESTS, ENTRIES

function mapEventFromDb(db) {
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

function mapEventToDb(ev) {
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

function mapRegistrationFromDb(db) {
  return {
    id: db.id,
    eventId: db.event_id,
    pilotId: db.pilot_id,
    email: db.email,
    classes: db.classes,
    paymentIntent: db.payment_intent,
    status: db.status,
    createdAt: db.created_at,
    handledAt: db.handled_at,
    handledBy: db.handled_by,
    adminNote: db.admin_note
  };
}

function mapRegistrationToDb(req) {
  return {
    id: req.id,
    event_id: req.eventId,
    pilot_id: req.pilotId,
    email: req.email,
    classes: req.classes,
    payment_intent: req.paymentIntent,
    status: req.status,
    created_at: req.createdAt,
    handled_at: req.handledAt,
    handled_by: req.handledBy,
    admin_note: req.adminNote
  };
}

function mapEntryFromDb(db) {
  return {
    id: db.id,
    eventId: db.event_id,
    pilotId: db.pilot_id,
    aircraftId: db.aircraft_id,
    className: db.class_name,
    raceNumber: db.race_number,
    paymentStatus: db.payment_status,
    checkInStatus: db.check_in_status,
    technicalInspection: db.technical_inspection,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

export function mapEntryToDb(entry) {
  return {
    id: entry.id,
    event_id: entry.eventId,
    pilot_id: entry.pilotId,
    aircraft_id: entry.aircraftId,
    class_name: entry.className,
    race_number: entry.raceNumber,
    payment_status: entry.paymentStatus,
    check_in_status: entry.checkInStatus,
    technical_inspection: entry.technicalInspection,
    notes: entry.notes,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
}

export function mapPilotFromDb(db) {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    country: db.country,
    club: db.club,
    license: db.license,
    address: db.address,
    avatarData: db.avatarData,
    createdAt: db.created_at
  };
}

export function mapPilotToDb(pilot) {
  return {
    id: pilot.id,
    name: pilot.name,
    email: pilot.email,
    phone: pilot.phone,
    country: pilot.country,
    club: pilot.club,
    license: pilot.license,
    address: pilot.address,
    avatarData: pilot.avatarData,
    created_at: pilot.createdAt || new Date().toISOString()
  };
}
