// ==============================
// Aircombat Competition Manager
// src/services/cloudStore.js
// ==============================
// Adapteripohja datan lukemiseen ja tallentamiseen Supabaseen.
// Älä korvaa nykyistä storea vielä. Tämä on valmius Phase 2:lle.
// ==============================

import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

// Hakee kaikki oikeudet pilvestä
export async function fetchPermissionsFromCloud() {
  if (!isCloudMode() || !supabase) return [];
  const { data, error } = await supabase.from("permissions").select("*");
  if (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }
  return data;
}

// Hakee kaikki pilotit pilvestä
export async function fetchPilotsFromCloud() {
  if (!isCloudMode() || !supabase) {
    return [];
  }
  
  const { data, error } = await supabase.from("pilots").select("*");
  if (error) {
    console.error("Error fetching pilots from cloud:", error);
    return [];
  }
  
  return data;
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
  
  const { error } = await supabase.from("pilots").upsert(pilot);
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

// ==========================================
// PHASE 4: EVENTS, REGISTRATION REQUESTS, ENTRIES
// ==========================================

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

function mapEntryToDb(entry) {
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

export async function fetchRegistrationRequestsFromCloud(eventId = null) {
  if (!isCloudMode() || !supabase) return [];
  let query = supabase.from("registration_requests").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching registration requests:", error);
    return [];
  }
  return data.map(mapRegistrationFromDb);
}

export async function submitRegistrationRequestToCloud(request) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("registration_requests").upsert(mapRegistrationToDb(request));
  if (error) {
    console.error("Error submitting registration request:", error);
    return false;
  }
  return true;
}

// TODO: Tuotannossa tämä hyväksyntä (request status update + entries luonti) 
// kannattaa siirtää Supabase RPC -funktioksi tai transaktioksi, jotta se ei jää puolitiehen.
export async function approveRegistrationRequestInCloud(requestId) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase
    .from("registration_requests")
    .update({ status: 'approved', handled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) {
    console.error("Error approving request:", error);
    return false;
  }
  return true;
}

export async function rejectRegistrationRequestInCloud(requestId) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase
    .from("registration_requests")
    .update({ status: 'rejected', handled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) {
    console.error("Error rejecting request:", error);
    return false;
  }
  return true;
}

export async function fetchEntriesFromCloud(eventId = null) {
  if (!isCloudMode() || !supabase) return [];
  let query = supabase.from("entries").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
  return data.map(mapEntryFromDb);
}

// ==========================================
// PHASE 5: HEATS, SCORE CARDS, AIRCRAFT, RESULTS
// ==========================================

function mapHeatFromDb(db) {
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

function mapHeatToDb(h) {
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

function mapScoreCardFromDb(db) {
  return {
    id: db.id,
    eventId: db.event_id,
    heatId: db.heat_id,
    entryId: db.entry_id,
    pilotId: db.pilot_id,
    className: db.class_name,
    aircraftId: db.aircraft_id,
    frequency: db.frequency,
    flightTimeSeconds: db.flight_time_seconds,
    pointsFlight: db.points_flight,
    cuts: db.cuts,
    pointsCuts: db.points_cuts,
    intactStreamer: db.intact_streamer,
    pointsIntactStreamer: db.points_intact_streamer,
    groundTargetHit: db.ground_target_hit,
    pointsGroundTarget: db.points_ground_target,
    takeoff: db.takeoff,
    pointsTakeoff: db.points_takeoff,
    landingAfterEndSignal: db.landing_after_end_signal,
    pointsLandingAfterEndSignal: db.points_landing_after_end_signal,
    penaltyHasenfuss: db.penalty_hasenfuss,
    penaltySafetyline: db.penalty_safetyline,
    penaltyOther: db.penalty_other,
    notes: db.notes,
    totalPoints: db.total_points,
    position: db.position,
    pointsAwarded: db.points_awarded,
    isApproved: db.is_approved,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

function mapScoreCardToDb(sc) {
  return {
    id: sc.id,
    event_id: sc.eventId,
    heat_id: sc.heatId,
    entry_id: sc.entryId,
    pilot_id: sc.pilotId,
    class_name: sc.className,
    aircraft_id: sc.aircraftId,
    frequency: sc.frequency,
    flight_time_seconds: sc.flightTimeSeconds,
    points_flight: sc.pointsFlight,
    cuts: sc.cuts,
    points_cuts: sc.pointsCuts,
    intact_streamer: sc.intactStreamer,
    points_intact_streamer: sc.pointsIntactStreamer,
    ground_target_hit: sc.groundTargetHit,
    points_ground_target: sc.pointsGroundTarget,
    takeoff: sc.takeoff,
    points_takeoff: sc.pointsTakeoff,
    landing_after_end_signal: sc.landingAfterEndSignal,
    points_landing_after_end_signal: sc.pointsLandingAfterEndSignal,
    penalty_hasenfuss: sc.penaltyHasenfuss,
    penalty_safetyline: sc.penaltySafetyline,
    penalty_other: sc.penaltyOther,
    notes: sc.notes,
    total_points: sc.totalPoints,
    position: sc.position,
    points_awarded: sc.pointsAwarded,
    is_approved: sc.isApproved,
    created_at: sc.createdAt,
    updated_at: sc.updatedAt
  };
}

function mapAircraftFromDb(db) {
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

function mapAircraftToDb(ac) {
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

function mapAircraftSpecFromDb(db) {
  return {
    id: db.id,
    name: db.name,
    realSpanM: db.real_span_m,
    realLengthM: db.real_length_m,
    createdAt: db.created_at
  };
}

function mapAircraftSpecToDb(spec) {
  return {
    id: spec.id,
    name: spec.name,
    real_span_m: spec.realSpanM,
    real_length_m: spec.realLengthM,
    created_at: spec.createdAt
  };
}

function mapResultFromDb(db) {
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

function mapResultToDb(r) {
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

// HEATS
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

// SCORE CARDS
export async function fetchScoreCardsFromCloud(eventId = null) {
  if (!isCloudMode() || !supabase) return [];
  let query = supabase.from("score_cards").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching score cards:", error);
    return [];
  }
  return data.map(mapScoreCardFromDb);
}

export async function saveScoreCardToCloud(scoreCard) {
  if (!isCloudMode() || !supabase) return false;
  const { error } = await supabase.from("score_cards").upsert(mapScoreCardToDb(scoreCard));
  if (error) {
    console.error("Error saving score card:", error);
    return false;
  }
  return true;
}

// AIRCRAFT
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

// RESULTS
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

// ==========================================
// MESSAGES
// ==========================================

function mapMessageFromDb(db) {
  return {
    id: db.id,
    senderId: db.sender_id,
    content: db.content,
    readBy: db.read_by,
    createdAt: db.created_at
  };
}

function mapMessageToDb(m) {
  return {
    id: m.id,
    sender_id: m.senderId,
    content: m.content,
    read_by: m.readBy,
    created_at: m.createdAt
  };
}

export async function fetchMessagesFromCloud() {
  if (!isCloudMode() || !supabase) return [];
  const { data, error } = await supabase.from("messages").select("*");
  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data.map(mapMessageFromDb);
}

export async function saveMessagesToCloud(messages) {
  if (!isCloudMode() || !supabase || messages.length === 0) return false;
  const { error } = await supabase.from("messages").upsert(messages.map(mapMessageToDb));
  if (error) {
    console.error("Error saving messages:", error);
    return false;
  }
  return true;
}

// ==========================================
// GENERIC CLOUD SYNC FROM STATE
// ==========================================

export async function deleteFromCloud(table, id) {
  if (!isCloudMode() || !supabase || !id) return false;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
    return false;
  }
  return true;
}

function findChangedItems(oldArray = [], newArray = []) {
  const oldMap = new Map(oldArray.map(i => [i.id, i]));
  const addedOrUpdated = [];
  const deleted = [];
  
  newArray.forEach(item => {
    const oldItem = oldMap.get(item.id);
    if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
      addedOrUpdated.push(item);
    }
  });
  
  const newMap = new Map(newArray.map(i => [i.id, i]));
  oldArray.forEach(item => {
    if (!newMap.has(item.id)) {
      deleted.push(item);
    }
  });
  
  return { addedOrUpdated, deleted };
}

export async function syncAllFromCloud() {
  if (!isCloudMode() || !supabase) return null;
  
  try {
    const [
      events,
      pilots,
      aircraft,
      entries,
      heats,
      results,
      scoreCards,
      registrations,
      aircraftSpecs,
      messages
    ] = await Promise.all([
      fetchEventsFromCloud(),
      fetchPilotsFromCloud(),
      fetchAircraftFromCloud(),
      fetchEntriesFromCloud(),
      fetchHeatsFromCloud(),
      fetchResultsFromCloud(),
      fetchScoreCardsFromCloud(),
      fetchRegistrationRequestsFromCloud(),
      fetchAircraftSpecsFromCloud(),
      fetchMessagesFromCloud()
    ]);

    return {
      events,
      pilots,
      aircraft,
      entries,
      heats,
      results,
      scoreCards,
      registrations,
      aircraftSpecs,
      messages
    };
  } catch (err) {
    console.error("Failed to sync all from cloud:", err);
    return null;
  }
}

export async function syncCloudFromState(oldState, newState) {
  if (!isCloudMode() || !supabase) return;

  // Sync Permissions
  if (oldState.permissions !== newState.permissions) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.permissions, newState.permissions);
    if (addedOrUpdated.length > 0) {
      // Remove any non-UUID IDs before upserting (if generated locally)
      const toUpsert = addedOrUpdated.map(p => {
        if (p.id && p.id.startsWith("perm-")) {
          const { id, ...rest } = p;
          return rest; // Let Supabase generate a new UUID
        }
        return p;
      });
      await supabase.from("permissions").upsert(toUpsert);
    }
    for (const p of deleted) await deleteFromCloud("permissions", p.id);
  }

  // Sync Pilots
  if (oldState.pilots !== newState.pilots) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.pilots, newState.pilots);
    for (const p of addedOrUpdated) await savePilotToCloud(p);
    for (const p of deleted) await deleteFromCloud("pilots", p.id);
  }

  // Sync Events
  if (oldState.events !== newState.events) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.events, newState.events);
    for (const e of addedOrUpdated) await saveEventToCloud(e);
    for (const e of deleted) await deleteFromCloud("events", e.id);
  }

  // Sync Aircraft
  if (oldState.aircraft !== newState.aircraft) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.aircraft, newState.aircraft);
    for (const a of addedOrUpdated) await saveAircraftToCloud(a);
    for (const a of deleted) await deleteFromCloud("aircraft", a.id);
  }

  // Sync Aircraft Specs
  if (oldState.aircraftSpecs !== newState.aircraftSpecs) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.aircraftSpecs, newState.aircraftSpecs);
    for (const s of addedOrUpdated) await saveAircraftSpecToCloud(s);
    for (const s of deleted) await deleteFromCloud("aircraft_specs", s.id);
  }

  // Sync Entries
  if (oldState.entries !== newState.entries) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.entries, newState.entries);
    if (addedOrUpdated.length > 0) {
      // Create entries manually using mapEntryToDb because saveEntryToCloud doesn't exist
      await supabase.from("entries").upsert(addedOrUpdated.map(mapEntryToDb));
    }
    for (const e of deleted) await deleteFromCloud("entries", e.id);
  }

  // Sync Registrations (Requests)
  if (oldState.registrations !== newState.registrations) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.registrations, newState.registrations);
    for (const r of addedOrUpdated) await submitRegistrationRequestToCloud(r);
    for (const r of deleted) await deleteFromCloud("registration_requests", r.id);
  }

  // Sync Heats
  if (oldState.heats !== newState.heats) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.heats, newState.heats);
    if (addedOrUpdated.length > 0) await saveHeatsToCloud(addedOrUpdated);
    for (const h of deleted) await deleteFromCloud("heats", h.id);
  }

  // Sync ScoreCards
  if (oldState.scoreCards !== newState.scoreCards) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.scoreCards, newState.scoreCards);
    for (const sc of addedOrUpdated) await saveScoreCardToCloud(sc);
    for (const sc of deleted) await deleteFromCloud("score_cards", sc.id);
  }

  // Sync Results
  if (oldState.results !== newState.results) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.results, newState.results);
    if (addedOrUpdated.length > 0) await saveResultsToCloud(addedOrUpdated);
    for (const r of deleted) await deleteFromCloud("results", r.id);
  }

  // Sync Messages
  if (oldState.messages !== newState.messages) {
    const { addedOrUpdated, deleted } = findChangedItems(oldState.messages || [], newState.messages || []);
    if (addedOrUpdated.length > 0) await saveMessagesToCloud(addedOrUpdated);
    for (const m of deleted) await deleteFromCloud("messages", m.id);
  }
}
