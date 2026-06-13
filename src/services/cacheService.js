import { syncAllFromCloud } from "./cloudStore.js";
import { isCloudMode } from "./storageMode.js";

const CACHE_KEY = "lastCloudSyncTime";
const CACHE_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

export async function checkCacheAndSync(force = false) {
  if (!isCloudMode()) return null;

  const lastSyncStr = localStorage.getItem(CACHE_KEY);
  const now = Date.now();
  
  const isCacheExpired = !lastSyncStr || (now - parseInt(lastSyncStr, 10)) > CACHE_EXPIRATION_MS;

  if (force || isCacheExpired) {
    const reason = force ? "Manual Force" : "Cache Expired";
    console.info(`[Supabase] Fetching ALL data... (Reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from events (reason: ${reason})`);
    console.debug(`[Supabase] SELECT id, name, country, club from public_pilots (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from aircraft (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from entries (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from heats (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from results (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from score_cards (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from registration_requests (reason: ${reason})`);
    console.debug(`[Supabase] SELECT * from messages (reason: ${reason})`);
    console.debug(`[Supabase] SELECT data->systemUpdates... from settings (reason: ${reason})`);
    
    const cloudData = await syncAllFromCloud();
    
    if (cloudData) {
      localStorage.setItem(CACHE_KEY, now.toString());
    }
    
    return cloudData;
  } else {
    console.info(`[Supabase] Skipping full fetch. Using local state. (Cache expires in ${Math.round((CACHE_EXPIRATION_MS - (now - parseInt(lastSyncStr, 10))) / 1000 / 60)} min)`);
    return null;
  }
}
