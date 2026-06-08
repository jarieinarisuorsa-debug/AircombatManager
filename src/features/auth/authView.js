// ==============================
// Aircombat Competition Manager
// src/features/auth/authView.js
// ==============================

import { UI } from "../../ui/engine.js";
import { isCloudMode } from "../../services/storageMode.js";
import { getState } from "../../state/store.js";

export function renderAuthView() {
  const isCloud = isCloudMode();
  const state = getState();
  const mode = state.settings?.authMode || "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot_password";
  const isUpdate = mode === "update_password";

  let titleText = "Kirjaudu sisään sähköpostiosoitteella ja salasanalla.";
  if (isRegister) titleText = "Luo uusi käyttäjätili syöttämällä sähköposti ja salasana.";
  if (isForgot) titleText = "Syötä sähköpostiosoitteesi, niin lähetämme sinulle palautuslinkin.";
  if (isUpdate) titleText = "Syötä uusi salasana tilillesi.";

  let formAction = "auth-login";
  if (isRegister) formAction = "auth-register";
  if (isForgot) formAction = "auth-forgot-password";
  if (isUpdate) formAction = "auth-update-password";

  let buttonText = isCloud ? "Kirjaudu sisään" : "Kirjaudu sisään (Local Mock)";
  if (isRegister) buttonText = isCloud ? "Luo tili" : "Luo tili (Local Mock)";
  if (isForgot) buttonText = isCloud ? "Lähetä palautuslinkki" : "Lähetä linkki (Local Mock)";
  if (isUpdate) buttonText = isCloud ? "Vaihda salasana" : "Vaihda salasana (Local Mock)";

  return `
    <div class="auth-container" style="max-width: 400px; margin: 40px auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin-bottom: 10px;">Aircombat Manager</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          ${titleText}
        </p>
      </div>

      ${UI.FormPanel({
        action: formAction,
        className: "auth-form",
        autocomplete: "on"
      }, `
        ${!isUpdate ? `
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
        ` : ''}

        ${!isForgot ? `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 6px;">Salasana ${isRegister || isUpdate ? '(väh. 6 merkkiä)' : ''}</label>
          <div style="position: relative; display: flex; align-items: center;">
            <input name="password" type="password" placeholder="Syötä salasana" required ${isRegister || isUpdate ? 'minlength="6"' : ''}
                   style="width: 100%; box-sizing: border-box; padding: 10px 40px 10px 10px; font-size: 1rem; border-radius: 6px; border: 1px solid var(--border); background: rgba(3, 10, 20, 0.55); color: var(--text);" />
            <button type="button" tabindex="-1"
                    style="position: absolute; right: 6px; background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px; color: var(--muted);"
                    title="Näytä/piilota salasana"
                    onclick="const i = this.previousElementSibling; if(i.type==='password'){i.type='text';this.textContent='🙈'}else{i.type='password';this.textContent='👁️'}">
              👁️
            </button>
          </div>
          ${mode === 'login' ? `
          <div style="text-align: right; margin-top: 8px;">
            <button type="button" data-action="auth-set-mode" data-mode="forgot_password" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.85rem;">Unohditko salasanasi?</button>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div style="margin-top: 25px;">
          <button type="submit" class="button primary" style="width: 100%; justify-content: center;">
            ${buttonText}
          </button>
        </div>

        <div style="margin-top: 15px; text-align: center; display: flex; flex-direction: column; gap: 8px;">
          ${mode !== 'login' ? `
            <button type="button" data-action="auth-set-mode" data-mode="login" style="background: none; border: none; color: var(--primary); text-decoration: underline; cursor: pointer; font-size: 0.9rem;">
              Takaisin kirjautumiseen
            </button>
          ` : `
            <button type="button" data-action="auth-set-mode" data-mode="register" style="background: none; border: none; color: var(--primary); text-decoration: underline; cursor: pointer; font-size: 0.9rem;">
              Eikö sinulla ole tiliä? Luo uusi tili tästä.
            </button>
          `}
        </div>

        ${(mode === 'login' && !isCloud) ? `
        <div style="margin-top: 20px; font-size: 0.85rem; color: var(--text-muted); text-align: left; background: var(--surface-hover); padding: 15px; border-radius: 6px;">
          <p style="margin: 0 0 10px 0;"><strong>Local Mock -tilassa salasana voi olla mitä tahansa. Kokeile näitä:</strong></p>
          <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>Admin-rooli (Ylläpitäjä):</strong> Syötä <code>admin@demo.fi</code><br><span style="font-size: 0.8rem;">(Kovakoodattu oletusasetuksiin adminiksi. Näet tällä kaikki hallintavalikot, asetukset ja työympäristön.)</span></li>
            <li><strong>Pilotti-rooli (Peruskäyttäjä):</strong> Syötä <code>matti@demo.fi</code><br><span style="font-size: 0.8rem;">(Löytyy oletuksena pilottirekisteristä. Näet tällä oman pilottikorttisi, kisakalenterin ja tulokset.)</span></li>
            <li><strong>Vierailija (Guest):</strong> Syötä esim. <code>testi@testi.fi</code><br><span style="font-size: 0.8rem;">(Kirjaudut sisään rekisteröitymättömänä vierailijana, jolla on vain lukuoikeudet julkisiin tietoihin.)</span></li>
          </ol>
        </div>` : ''}
      `)}
    </div>
  `;
}
