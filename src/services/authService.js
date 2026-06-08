// ==============================
// Aircombat Competition Manager
// src/services/authService.js
// ==============================
// Käsittelee kirjautumisen Supabasella tai local mock -tilassa.
// ==============================

import { supabase } from "./supabaseClient.js";
import { isCloudMode } from "./storageMode.js";

export async function getCurrentUser() {
  if (isCloudMode() && supabase) {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Auth error:", error);
      return null;
    }

    return session?.user || null;
  }

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

export async function signInWithPassword(email, password) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail) {
    throw new Error("Sähköpostiosoite on pakollinen.");
  }

  if (!cleanPassword) {
    throw new Error("Salasana on pakollinen.");
  }

  if (isCloudMode() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword
    });

    if (error) throw error;
    return data;
  }

  localStorage.setItem(
    "mock_user",
    JSON.stringify({ id: "local-user", email: cleanEmail })
  );

  return {
    user: { id: "local-user", email: cleanEmail },
    session: null
  };
}

export async function signUpWithPassword(email, password) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail) {
    throw new Error("Sähköpostiosoite on pakollinen.");
  }

  if (!cleanPassword) {
    throw new Error("Salasana on pakollinen.");
  }

  if (isCloudMode() && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword
    });

    if (error) throw error;
    
    // Auto-create a pending permission request so the admin sees the new user
    if (data?.user?.email) {
      const { error: permError } = await supabase.from("permissions").insert({
        email: data.user.email,
        role: "pending"
      });
      if (permError) console.error("Failed to insert pending permission:", permError);
    }

    return data;
  }

  // Local mock behavior
  localStorage.setItem(
    "mock_user",
    JSON.stringify({ id: "local-user", email: cleanEmail })
  );

  return {
    user: { id: "local-user", email: cleanEmail },
    session: null
  };
}

export async function signOut() {
  if (isCloudMode() && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  }

  localStorage.removeItem("mock_user");
  return true;
}

export async function sendPasswordResetEmail(email) {
  const cleanEmail = String(email || "").trim();
  if (!cleanEmail) {
    throw new Error("Sähköpostiosoite on pakollinen.");
  }

  if (isCloudMode() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw error;
    return true;
  }

  return true;
}

export async function updatePassword(newPassword) {
  const cleanPassword = String(newPassword || "");
  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error("Salasanan tulee olla vähintään 6 merkkiä pitkä.");
  }

  if (isCloudMode() && supabase) {
    const { error } = await supabase.auth.updateUser({
      password: cleanPassword
    });
    if (error) throw error;
    return true;
  }

  return true;
}

export async function deleteOwnAccount() {
  if (isCloudMode() && supabase) {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    
    // Sign out after deletion
    await supabase.auth.signOut();
    return true;
  }

  // Local mock behavior
  localStorage.removeItem("mock_user");
  return true;
}
