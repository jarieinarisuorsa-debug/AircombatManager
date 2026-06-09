import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

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
  
  const dbData = mapRegistrationToDb(request);
  
  // Try update first to avoid INSERT permission requirements for admins updating status
  const { data, error: updateError } = await supabase
    .from("registration_requests")
    .update(dbData)
    .eq('id', dbData.id)
    .select();
    
  if (!updateError && data && data.length > 0) {
    return true; // Update successful
  }
  
  // If update failed (likely because it doesn't exist), try insert
  const { error: insertError } = await supabase
    .from("registration_requests")
    .insert(dbData);
    
  if (insertError) {
    console.error("Error submitting registration request:", insertError);
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

export function mapRegistrationFromDb(db) {
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

export function mapRegistrationToDb(req) {
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

export function mapEntryFromDb(db) {
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

// PHASE 5: HEATS, SCORE CARDS, AIRCRAFT, RESULTS

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
