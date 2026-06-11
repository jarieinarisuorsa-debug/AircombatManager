import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";
import { fetchEventsFromCloud, saveEventToCloud } from "./cloudEvents.js";
import { fetchPilotsFromCloud, savePilotToCloud, mapEntryToDb } from "./cloudPilots.js";
import { fetchAircraftFromCloud, saveAircraftToCloud, fetchAircraftSpecsFromCloud, saveAircraftSpecToCloud } from "./cloudAircraft.js";
import { fetchEntriesFromCloud, fetchRegistrationRequestsFromCloud, submitRegistrationRequestToCloud } from "./cloudRegistrations.js";
import { fetchHeatsFromCloud, saveHeatsToCloud } from "./cloudHeats.js";
import { fetchResultsFromCloud, saveResultsToCloud } from "./cloudResults.js";
import { fetchScoreCardsFromCloud, saveScoreCardToCloud } from "./cloudScoreCards.js";
import { fetchMessagesFromCloud, saveMessagesToCloud } from "./cloudMessages.js";
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
      messages,
      settingsRows
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
      fetchMessagesFromCloud(),
      supabase.from("settings").select("*")
    ]);

    let settings = null;
    if (settingsRows && settingsRows.data && settingsRows.data.length > 0) {
      settings = settingsRows.data.find(r => r.id === 'global')?.data;
    }

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
      messages,
      settings
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

  // Sync Settings
  if (oldState.settings !== newState.settings) {
    // Only pick settings that we want to be global and synced
    const globalSettings = {
      organizerName: newState.settings.organizerName,
      organizationLogoData: newState.settings.organizationLogoData,
      whatsappReceivers: newState.settings.whatsappReceivers,
      systemUpdates: newState.settings.systemUpdates
    };
    
    // We stringify and parse to remove undefined values, ensuring clean JSONB
    const cleanSettings = JSON.parse(JSON.stringify(globalSettings));
    
    const { error } = await supabase.from("settings").upsert({
      id: "global",
      data: cleanSettings,
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      console.error("Error saving settings to cloud:", error);
    }
  }
}
