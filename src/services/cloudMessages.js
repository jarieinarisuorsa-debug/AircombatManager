import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function fetchMessagesFromCloud() {
  if (!isCloudMode() || !supabase) return [];
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
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

// GENERIC CLOUD SYNC FROM STATE

export function mapMessageFromDb(db) {
  return {
    id: db.id,
    senderId: db.sender_id,
    content: db.content,
    readBy: db.read_by,
    createdAt: db.created_at
  };
}

export function mapMessageToDb(m) {
  return {
    id: m.id,
    sender_id: m.senderId,
    content: m.content,
    read_by: m.readBy,
    created_at: m.createdAt
  };
}
