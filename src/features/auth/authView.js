// ==============================
// Aircombat Competition Manager
// src/features/auth/authView.js
// ==============================

import { UI } from "../../ui/engine.js";
import { isCloudMode } from "../../services/storageMode.js";
import { getState } from "../../state/store.js";
import { t } from "../../utils/i18n.js";

export function renderAuthView() {
  const isCloud = isCloudMode();
  const state = getState();
  const mode = state.settings?.authMode || "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot_password";
  const isUpdate = mode === "update_password";

  let titleText = t(state, "auth.login_title");
  if (isRegister) titleText = t(state, "auth.register_title");
  if (isForgot) titleText = t(state, "auth.forgot_title");
  if (isUpdate) titleText = t(state, "auth.update_title");

  let formAction = "auth-login";
  if (isRegister) formAction = "auth-register";
  if (isForgot) formAction = "auth-forgot-password";
  if (isUpdate) formAction = "auth-update-password";

  let buttonText = isCloud ? t(state, "auth.login") : t(state, "auth.login") + " (Local Mock)";
  if (isRegister) buttonText = isCloud ? t(state, "auth.register") : t(state, "auth.register") + " (Local Mock)";
  if (isForgot) buttonText = isCloud ? t(state, "auth.send_reset") : t(state, "auth.send_reset") + " (Local Mock)";
  if (isUpdate) buttonText = isCloud ? t(state, "auth.update_password") : t(state, "auth.update_password") + " (Local Mock)";

  const termsModal = state.settings?.termsModalOpen ? `
    <div class="app-modal-backdrop" style="z-index: 2000;">
      <div class="app-modal-shell" style="max-width: 500px; padding: 20px;">
        <h3 style="margin-top: 0;">${t(state, "about.security_title")}</h3>
        <div style="max-height: 50vh; overflow-y: auto; margin: 15px 0; font-size: 0.9rem; line-height: 1.5; color: var(--text);">
          <p style="margin-bottom: 10px;">${t(state, "about.security_personal")}</p>
          <p style="margin-bottom: 10px;">${t(state, "about.security_login")}</p>
          <p style="margin-bottom: 10px;">${t(state, "about.security_data")}</p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button type="button" class="button" data-action="auth-close-terms">${t(state, "common.cancel")}</button>
          <button type="button" class="button primary" data-action="auth-accept-terms">${t(state, "common.save_changes").replace('Tallenna', 'Hyväksy').replace('Save', 'Accept')}</button>
        </div>
      </div>
    </div>
  ` : '';

  return `
    ${termsModal}
    <div class="auth-container" style="max-width: 400px; margin: 40px auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin-bottom: 10px; margin-top: 20px;">Aircombat Manager</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          ${titleText}
        </p>
      </div>

      ${UI.FormPanel({
        action: formAction,
        className: "auth-form",
        autocomplete: "on",
        style: "position: relative; padding-top: 40px;"
      }, `
        <div style="position: absolute; top: 15px; right: 15px;">
          <button type="button" class="app-btn icon-btn" data-action="toggle-language" title="Vaihda kieli / Change language" style="background: rgba(255,255,255,0.1); border-radius: 6px; padding: 4px 10px; font-weight: bold; border: 1px solid var(--border); font-size: 0.85rem;">
            🌐 ${state.settings?.language === 'en' ? 'FI' : 'EN'}
          </button>
        </div>
        ${!isUpdate ? `
        <div style="margin-bottom: 20px;">
          ${UI.Input({
            name: "email",
            type: "email",
            label: t(state, "auth.email"),
            placeholder: t(state, "auth.email_placeholder"),
            required: true,
            autocapitalize: "none",
            autocorrect: "off",
            style: "width: 100%; box-sizing: border-box; padding: 10px; font-size: 1rem; border-radius: 6px;"
          })}
        </div>
        ` : ''}

        ${!isForgot ? `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 6px;">${t(state, "auth.password")} ${isRegister || isUpdate ? t(state, "auth.password_min") : ''}</label>
          <div style="position: relative; display: flex; align-items: center;">
            <input name="password" type="password" placeholder="${t(state, "auth.password_placeholder")}" required ${isRegister || isUpdate ? 'minlength="6"' : ''}
                   style="width: 100%; box-sizing: border-box; padding: 10px 40px 10px 10px; font-size: 1rem; border-radius: 6px; border: 1px solid var(--border); background: rgba(3, 10, 20, 0.55); color: var(--text);" />
            <button type="button" tabindex="-1"
                    style="position: absolute; right: 6px; background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px; color: var(--muted);"
                    title="${t(state, "auth.toggle_password")}"
                    onclick="const i = this.previousElementSibling; if(i.type==='password'){i.type='text';this.textContent='🙈'}else{i.type='password';this.textContent='👁️'}">
              👁️
            </button>
          </div>
          ${mode === 'login' ? `
          <div style="text-align: right; margin-top: 8px;">
            <button type="button" data-action="auth-set-mode" data-mode="forgot_password" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.85rem;">${t(state, "auth.forgot_link")}</button>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${isRegister ? `
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 0.85rem; line-height: 1.4; color: var(--text-muted);">
            <input type="checkbox" name="acceptTerms" required style="margin-top: 3px;" />
            <span>${t(state, "auth.accept_terms_html")}</span>
          </label>
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
              ${t(state, "auth.back_to_login")}
            </button>
          ` : `
            <button type="button" data-action="auth-set-mode" data-mode="register" style="background: none; border: none; color: var(--primary); text-decoration: underline; cursor: pointer; font-size: 0.9rem;">
              ${t(state, "auth.no_account")}
            </button>
          `}
        </div>

        ${(mode === 'login' && !isCloud) ? `
        <div style="margin-top: 20px; font-size: 0.85rem; color: var(--text-muted); text-align: left; background: var(--surface-hover); padding: 15px; border-radius: 6px;">
          <p style="margin: 0 0 10px 0;"><strong>${t(state, "auth.local_mock")}</strong></p>
          <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>${t(state, "auth.mock_admin")}</strong> ${t(state, "auth.mock_admin_email")}<br><span style="font-size: 0.8rem;">${t(state, "auth.mock_admin_desc")}</span></li>
            <li><strong>${t(state, "auth.mock_pilot")}</strong> ${t(state, "auth.mock_pilot_email")}<br><span style="font-size: 0.8rem;">${t(state, "auth.mock_pilot_desc")}</span></li>
            <li><strong>${t(state, "auth.mock_guest")}</strong> ${t(state, "auth.mock_guest_email")}<br><span style="font-size: 0.8rem;">${t(state, "auth.mock_guest_desc")}</span></li>
          </ol>
        </div>` : ''}
      `)}
    </div>
  `;
}
