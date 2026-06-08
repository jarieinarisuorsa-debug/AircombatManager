// ==============================
// Aircombat Competition Manager
// src/features/auth/authActions.js
// ==============================

import { signInWithPassword, signOut, signUpWithPassword } from "../../services/authService.js";
import { updateState, getState } from "../../state/store.js";
import { showToast } from "../../ui/toast.js";
import { registerAction } from "../../core/actionRegistry.js";

export function initAuthActions() {
  registerAction("auth-login", async (event, form, context) => {
    const email = String(context?.data?.email || "").trim();
    const password = String(context?.data?.password || "");

    if (!email) {
      throw new Error("Sähköpostiosoite on pakollinen.");
    }

    if (!password) {
      throw new Error("Salasana on pakollinen.");
    }

    try {
      const data = await signInWithPassword(email, password);
      const user = data?.user || { id: "local-user", email };

      updateState((state) => {
        state.auth.user = user;
        if (state.settings) {
          state.settings.userEmail = user.email || email;
          state.settings.currentRole = null;
        }
      }, "auth_login");

      showToast("Kirjautuminen onnistui.", "success");
      window.location.hash = "";
      window.location.reload();
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
  registerAction("auth-register", async (event, form, context) => {
    const email = String(context?.data?.email || "").trim();
    const password = String(context?.data?.password || "");

    if (!email) {
      throw new Error("Sähköpostiosoite on pakollinen.");
    }
    if (!password || password.length < 6) {
      throw new Error("Salasanan tulee olla vähintään 6 merkkiä pitkä.");
    }

    try {
      const data = await signUpWithPassword(email, password);
      
      // WhatsApp Notification via CallMeBot for all receivers
      const currentState = getState();
      let receivers = currentState.settings?.whatsappReceivers || [];
      
      // Fallback for legacy single receiver
      if (receivers.length === 0 && currentState.settings?.whatsappPhone && currentState.settings?.callMeBotApiKey) {
        receivers = [{ phone: currentState.settings.whatsappPhone, apikey: currentState.settings.callMeBotApiKey }];
      }

      if (receivers.length > 0) {
        showToast(`Lähetetään WhatsApp-ilmoitus ${receivers.length} vastaanottajalle...`, "info");
        const msg = encodeURIComponent(`Uusi käyttäjä rekisteröityi RC Aircombat -ohjelmaan: ${email}. Voit nyt hyväksyä hänet Asetuksista.`);
        const fetchPromises = [];
        receivers.forEach(receiver => {
          const phone = receiver.phone.replace(/[^0-9]/g, '');
          const apikey = receiver.apikey;
          if (phone && apikey) {
            const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${msg}&apikey=${apikey}`;
            fetchPromises.push(fetch(url, { mode: 'no-cors' }).catch(err => console.error("WhatsApp notification failed:", err)));
          }
        });
        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }
      }

      // If user session exists, auto-confirm is likely off and they are logged in
      if (data?.session) {
        const user = data.user;
        updateState((state) => {
          state.auth.user = user;
          if (state.settings) {
            state.settings.userEmail = user.email || email;
            state.settings.currentRole = null;
          }
        }, "auth_register_login");
        
        showToast("Tili luotu ja kirjautuminen onnistui!", "success");
        window.location.hash = "";
        window.location.reload();
      } else {
        // Auto-confirm is ON, they need to check email, or the local mock just finished
        showToast("Tili luotu! Jos järjestelmä vaatii vahvistuksen, tarkista sähköpostisi.", "success");
        updateState((state) => {
          if (state.settings) state.settings.authMode = "login";
        }, "auth_toggle");
        import("../../main.js").then(m => m.renderApp());
      }
    } catch (err) {
      console.error("Register failed:", err);
      throw new Error("Tilin luonti epäonnistui: " + err.message);
    }
  });

  registerAction("auth-toggle-mode", () => {
    updateState((state) => {
      if (!state.settings) state.settings = {};
      state.settings.authMode = state.settings.authMode === "register" ? "login" : "register";
    }, "auth_toggle");
    import("../../main.js").then(m => m.renderApp());
  });

  registerAction("auth-set-mode", (event, button) => {
    const mode = button.dataset.mode || "login";
    updateState((state) => {
      if (!state.settings) state.settings = {};
      state.settings.authMode = mode;
    }, "auth_set_mode");
    import("../../main.js").then(m => m.renderApp());
  });

  registerAction("auth-forgot-password", async (event, form, context) => {
    const email = String(context?.data?.email || "").trim();
    if (!email) {
      throw new Error("Sähköpostiosoite on pakollinen.");
    }
    try {
      const { sendPasswordResetEmail } = await import("../../services/authService.js");
      await sendPasswordResetEmail(email);
      showToast("Palautuslinkki lähetetty! Tarkista sähköpostisi.", "success");
      updateState((state) => {
        if (!state.settings) state.settings = {};
        state.settings.authMode = "login";
      }, "auth_forgot_password");
      import("../../main.js").then(m => m.renderApp());
    } catch (err) {
      console.error("Forgot password failed:", err);
      throw new Error("Palautuksen pyytäminen epäonnistui: " + err.message);
    }
  });

  registerAction("auth-update-password", async (event, form, context) => {
    const password = String(context?.data?.password || "");
    if (!password || password.length < 6) {
      throw new Error("Salasanan tulee olla vähintään 6 merkkiä pitkä.");
    }
    try {
      const { updatePassword } = await import("../../services/authService.js");
      await updatePassword(password);
      showToast("Salasana vaihdettu onnistuneesti!", "success");
      updateState((state) => {
        if (!state.settings) state.settings = {};
        state.settings.authMode = "login";
      }, "auth_update_password");
      import("../../main.js").then(m => m.renderApp());
    } catch (err) {
      console.error("Update password failed:", err);
      throw new Error("Salasanan vaihtaminen epäonnistui: " + err.message);
    }
  });

  registerAction("delete-own-account", async () => {
    try {
      showToast("Poistetaan tiliä...", "info");
      const { deleteOwnAccount } = await import("../../services/authService.js");
      await deleteOwnAccount();
      
      updateState((state) => {
        state.auth.user = null;
        if (state.settings) state.settings.userEmail = "";
      }, "delete_own_account");

      showToast("Tilisi on poistettu onnistuneesti.", "success");
      window.location.hash = "#/login";
      window.location.reload();
    } catch (err) {
      console.error("Account deletion failed:", err);
      showToast("Tilin poistaminen epäonnistui: " + err.message, "error");
    }
  });
}
