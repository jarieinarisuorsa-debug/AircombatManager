// ==============================
// Aircombat Competition Manager
// src/features/auth/authActions.js
// ==============================

import { signInWithEmail, signOut } from "../../services/authService.js";
import { updateState } from "../../state/store.js";
import { showToast } from "../../ui/toast.js";

import { registerAction } from "../../core/actionRegistry.js";

export function initAuthActions() {
  registerAction("auth-login", async (event, form, context) => {
    const email = context?.data?.email?.trim();
    if (!email) {
      throw new Error("Sähköpostiosoite on pakollinen.");
    }

    try {
      await signInWithEmail(email);
      
      // Local mode mock - simulates successful login directly
      // In cloud mode, this just sends the link and the user needs to click it.
      if (!import.meta.env?.VITE_SUPABASE_URL) {
        // Mock update state for local mode
        updateState((state) => {
          state.auth.user = { id: "local-user", email };
        }, "mock_login");
        
        showToast("Kirjautuminen onnistui (Local Mode)", "success");
        window.location.hash = "#/dashboard";
        
        // Reload app via window location to force rerender
        window.location.reload();
      } else {
        showToast("Kirjautumislinkki lähetetty sähköpostiisi!", "success");
      }
    } catch (err) {
      console.error("Login failed:", err);
      throw new Error("Kirjautuminen epäonnistui: " + err.message);
    }
  });
  
  registerAction("auth-logout", async () => {
    try {
      await signOut();
      updateState((state) => {
        state.auth.user = null;
        if (state.settings) state.settings.userEmail = "";
      }, "logout");
      showToast("Olet kirjautunut ulos.", "success");
      window.location.hash = "#/login";
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      showToast("Uloskirjautuminen epäonnistui.", "error");
    }
  });
}
