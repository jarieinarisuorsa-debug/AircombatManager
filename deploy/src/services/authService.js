// ==============================
// Aircombat Competition Manager
// src/services/authService.js
// ==============================
// Käsittelee kirjautumiset. Phase 1:ssa tukee valmiuksia Supabaselle, mutta
// toimii täysin myös ilman sitä (local mock).
// ==============================

import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

// Palauttaa tällä hetkellä kirjautuneen käyttäjän istunnon
export async function getCurrentUser() {
  if (isCloudMode() && supabase) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Auth error:", error);
      return null;
    }
    return session?.user || null;
  }
  
  // Local mode mock (ei oikeaa autentikointia)
  const mockUserStr = localStorage.getItem("mock_user");
  if (mockUserStr) {
    try {
      return JSON.parse(mockUserStr);
    } catch (err) {
      return null;
    }
  }
  return null;
}

// Sähköpostipohjainen sisäänkirjautuminen (Magic Link / OTP)
export async function signInWithEmail(email) {
  if (isCloudMode() && supabase) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  // Local mode mock
  console.log(`Mock sign in sent to ${email}`);
  localStorage.setItem("mock_user", JSON.stringify({ id: "local-user", email }));
  return { message: "Mock sign in successful" };
}

// Uloskirjautuminen
export async function signOut() {
  if (isCloudMode() && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  }
  
  // Local mode mock
  console.log("Mock sign out successful");
  localStorage.removeItem("mock_user");
  return true;
}
