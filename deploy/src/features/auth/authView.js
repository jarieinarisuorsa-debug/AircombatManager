// ==============================
// Aircombat Competition Manager
// src/features/auth/authView.js
// ==============================

import { UI } from "../../ui/engine.js";
import { isCloudMode } from "../../services/storageMode.js";

export function renderAuthView() {
  const isCloud = isCloudMode();
  
  return `
    <div class="auth-container" style="max-width: 400px; margin: 40px auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin-bottom: 10px;">Aircombat Manager</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          Syötä sähköpostiosoitteesi kirjautuaksesi sisään.
        </p>
      </div>
      
      ${UI.FormPanel({
        action: "auth-login",
        className: "auth-form"
      }, `
        <div style="margin-bottom: 20px;">
          ${UI.Input({
            name: "email",
            type: "email",
            label: "Sähköpostiosoite",
            placeholder: "esim. pilotti@demo.fi",
            required: true,
            style: "width: 100%; box-sizing: border-box; padding: 10px; font-size: 1rem; border-radius: 6px;"
          })}
        </div>
        
        <div style="margin-top: 25px;">
          <button type="submit" class="button primary" style="width: 100%; justify-content: center;">
            ${isCloud ? "Lähetä kirjautumislinkki" : "Kirjaudu sisään (Local Mock)"}
          </button>
        </div>
        
        ${isCloud ? `
          <p style="margin-top: 20px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">
            Lähetämme sinulle sähköpostitse turvallisen kertakäyttöisen linkin, jolla pääset kirjautumaan sisään ilman salasanaa.
          </p>
        ` : ""}
      `)}
    </div>
  `;
}
