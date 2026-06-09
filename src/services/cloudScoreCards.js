import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchScoreCardsFromCloud(eventId = null) {
  if (!isCloudMode() || !supabase) return [];
  let query = supabase.from("score_cards").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching score cards:", error);
    return [];
  }
  
  const scoreCards = data.map(mapScoreCardFromDb);

  // Tietoturva (Vaihe 4): Suodata allekirjoitukset pois, jos käyttäjä ei ole admin tai kyseisen kortin omistaja.
  // Näin estetään allekirjoitusten päätyminen julkiseen selaimeen (Network tab).
  // Käytämme window.statea saadaksemme nykyisen roolin, koska cloudStore.js ei säilytä omaa tilaa.
  const state = window.state || {};
  const { isUserAdmin } = await import("../users/roles.js");
  const isAdmin = isUserAdmin(state);
  const userEmail = state?.auth?.user?.email || "";
  
  let userPilotId = null;
  if (userEmail && state.pilots) {
    const p = state.pilots.find(p => p.email && p.email.toLowerCase() === userEmail.toLowerCase());
    if (p) userPilotId = p.id;
  }

  if (!isAdmin) {
    return scoreCards.map(sc => {
      if (sc.pilotId !== userPilotId) {
        // Poistetaan allekirjoitukset
        return {
          ...sc,
          signatures: null,
          rounds: (sc.rounds || []).map(r => ({ ...r, signatures: null }))
        };
      }
      return sc;
    });
  }

  return scoreCards;
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

export function mapScoreCardFromDb(db) {
  // Try to parse modern JSON structure if it exists, otherwise use legacy flat structure
  if (db.rounds || db.template_id) {
    return {
      id: db.id,
      eventId: db.event_id,
      entryId: db.entry_id,
      participantId: db.entry_id,
      pilotId: db.pilot_id,
      className: db.class_name,
      templateId: db.template_id,
      startNumber: db.start_number,
      firstName: db.first_name,
      lastName: db.last_name,
      frequency: db.frequency,
      flyingRound: db.flying_round,
      rounds: db.rounds || [],
      aircraft: db.aircraft || {},
      signatures: db.signatures || {},
      status: db.status,
      updatedAt: db.updated_at
    };
  }

  // Legacy fallback
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

export function mapScoreCardToDb(sc) {
  // If modern structure
  if (sc.rounds || sc.templateId) {
    return {
      id: sc.id,
      event_id: sc.eventId,
      entry_id: sc.entryId,
      pilot_id: sc.pilotId,
      class_name: sc.className,
      template_id: sc.templateId,
      start_number: sc.startNumber,
      first_name: sc.firstName,
      last_name: sc.lastName,
      frequency: sc.frequency,
      flying_round: sc.flyingRound,
      rounds: sc.rounds,
      aircraft: sc.aircraft,
      signatures: sc.signatures,
      status: sc.status,
      updated_at: sc.updatedAt
    };
  }

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
