import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

export function renderSettingsView(state) {
  const tab = state.settings?.settingsTab || "jarjestaja";
  const adminEmailsStr = Array.isArray(state.settings.adminEmails) ? state.settings.adminEmails.join(", ") : "";
  const publicEmailsStr = Array.isArray(state.settings.publicEmails) ? state.settings.publicEmails.join(", ") : "";

  const headerSubtitle = `<p class="muted" style="margin-bottom: 20px;">${t(state, "settings.subtitle")}</p>`;
  const tabNav = `
    <nav class="sub-nav no-print" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px;">
      <button type="button" class="button ${tab === 'jarjestaja' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="jarjestaja">${t(state, "settings.tab_organizer")}</button>
      <button type="button" class="button ${tab === 'oikeudet' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="oikeudet">${t(state, "settings.tab_permissions")}</button>
      <button type="button" class="button ${tab === 'ulkoasu' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="ulkoasu">${t(state, "settings.tab_branding")}</button>
      <button type="button" class="button ${tab === 'ilmoitukset' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="ilmoitukset">${t(state, "settings.tab_notifications")}</button>
      <button type="button" class="button ${tab === 'varmuuskopiot' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="varmuuskopiot">${t(state, "settings.tab_backups")}</button>
    </nav>
  `;

  let content = "";

  if (tab === "jarjestaja") {
    const formContent = `
      ${UI.Input({ label: t(state, "settings.organizer_name"), name: "organizerName", value: state.settings.organizerName || "", placeholder: t(state, "settings.organizer_name_placeholder") })}
      <label class="check-row" style="margin-bottom: 20px;"><input type="checkbox" name="competitionMode" ${state.settings.competitionMode ? "checked" : ""} /> ${t(state, "settings.competition_mode")}</label>
      <label class="check-row" style="margin-bottom: 20px;"><input type="checkbox" name="publicDisplayMode" ${state.settings.publicDisplayMode ? "checked" : ""} /> ${t(state, "settings.public_display_mode")}</label>
      ${UI.Button({ label: t(state, "settings.save_settings"), type: "submit", variant: "primary" })}
    `;
    content = UI.FormPanel({ kicker: t(state, "settings.settings_kicker"), title: t(state, "settings.tab_organizer"), action: "save-settings" }, formContent);
  } else if (tab === "oikeudet") {
    let permissions = state.permissions;
    if (!permissions) {
      permissions = [];
      (state.settings.adminEmails || []).forEach(email => {
        if (email.trim()) permissions.push({ id: `mig-${email}`, email: email.trim(), role: "admin" });
      });
      (state.settings.publicEmails || []).forEach(email => {
        if (email.trim() && !permissions.find(p => p.email === email.trim())) {
          permissions.push({ id: `mig-${email}`, email: email.trim(), role: "pilot" });
        }
      });
    }

    let sortedPermissions = [...permissions].sort((a, b) => {
      if (a.role === 'pending' && b.role !== 'pending') return -1;
      if (b.role === 'pending' && a.role !== 'pending') return 1;
      return a.email.localeCompare(b.email);
    });

    const permissionRows = sortedPermissions.map(perm => `
      <tr style="border-bottom: 1px solid var(--border); ${perm.role === 'pending' ? 'background: rgba(255, 193, 7, 0.1);' : ''}">
        <td style="padding: 10px;">
          <span class="blur-sensitive" title="Näytä sähköposti">${escapeHtml(perm.email)}</span>
          ${perm.role === 'pending' ? `<br><span style="font-size: 0.8rem; color: #ffc107; font-weight: bold;">${t(state, "settings.new_request")}</span>` : ''}
        </td>
        <td style="padding: 10px;">
          <select class="ui-input" style="padding: 4px 30px 4px 8px; width: auto; ${perm.role === 'pending' ? 'border-color: #ffc107;' : ''}" data-action="update-permission-role" data-id="${perm.id}">
            ${perm.role === 'pending' ? `<option value="pending" selected>${t(state, "settings.role_pending")}</option>` : ''}
            <option value="admin" ${perm.role === 'admin' ? 'selected' : ''}>${t(state, "settings.role_admin")}</option>
            <option value="pilot" ${perm.role === 'pilot' ? 'selected' : ''}>${t(state, "settings.role_pilot")}</option>
          </select>
        </td>
        <td style="padding: 10px; text-align: right;">
          <button type="button" class="button small danger" data-action="remove-permission" data-id="${escapeHtml(perm.id)}" data-email="${escapeHtml(perm.email)}">${t(state, "settings.remove")}</button>
        </td>
      </tr>
    `).join("");

    const tableHtml = permissions.length > 0 ? `
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          <thead style="position: sticky; top: 0; z-index: 10;">
            <tr style="border-bottom: 2px solid var(--border); text-align: left;">
              <th style="padding: 10px; background: var(--bg);">${t(state, "settings.email")}</th>
              <th style="padding: 10px; background: var(--bg);">${t(state, "settings.role")}</th>
              <th style="padding: 10px; background: var(--bg);"></th>
            </tr>
          </thead>
          <tbody>
            ${permissionRows}
          </tbody>
        </table>
      </div>
    ` : `<p class="muted" style="margin-bottom: 20px;">${t(state, "settings.no_users")}</p>`;

    const addForm = `
      <form class="stack" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 25px;" data-action="add-permission">
        <h4 style="margin: 0 0 10px 0;">${t(state, "settings.add_new_user")}</h4>
        <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            ${UI.Input({ label: t(state, "settings.email"), name: "email", type: "email", required: true, placeholder: t(state, "settings.email_placeholder") })}
          </div>
          <div style="width: 200px;">
            <label class="ui-label">${t(state, "settings.role")}</label>
            <select name="role" class="ui-input" required>
              <option value="admin">${t(state, "settings.role_admin")}</option>
              <option value="pilot">${t(state, "settings.role_pilot")}</option>
            </select>
          </div>
          <div style="padding-bottom: 4px;">
            ${UI.Button({ label: t(state, "settings.add"), type: "submit", variant: "primary" })}
          </div>
        </div>
      </form>
    `;

    const infoText = `<p class="muted" style="margin-top: 20px;">${t(state, "settings.permission_hint")}</p>`;

    content = UI.Panel({ kicker: t(state, "settings.permissions_kicker"), title: t(state, "settings.tab_permissions") }, addForm + tableHtml + infoText);
  } else if (tab === "ulkoasu") {
    const formContent = `
      <div style="margin-bottom: 20px; max-width: 400px;">
        <label class="ui-label" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">${t(state, "settings.org_logo")}</label>
        <div class="is-admin-dropzone" style="border: 2px dashed var(--border); padding: 16px; text-align: center; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onclick="this.querySelector('input[type=file]').click()">
          <input type="file" id="org-logo-upload" accept="image/*" style="display: none;" />
          ${state.settings.organizationLogoData 
            ? `<img id="org-logo-preview" src="${escapeHtml(state.settings.organizationLogoData)}" alt="Logo" style="max-height: 80px; max-width: 100%; border-radius: 4px; object-fit: contain;" />` 
            : `<div id="org-logo-placeholder">
                 <div style="font-size: 2rem; margin-bottom: 8px;">🖼️</div>
                 <div style="font-size: 0.9rem; color: var(--muted);">${t(state, "settings.upload_logo")}</div>
               </div>
               <img id="org-logo-preview" src="" style="max-height: 80px; max-width: 100%; display: none; margin: 0 auto; border-radius: 4px; object-fit: contain;" />`
          }
        </div>
        <label class="ui-label" style="display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">${t(state, "settings.logo_url_label")}</label>
        <input type="url" name="organizationLogoUrl" class="ui-input" value="${escapeHtml(!state.settings.organizationLogoData || state.settings.organizationLogoData.startsWith('data:') ? '' : state.settings.organizationLogoData)}" placeholder="https://..." style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px;" />
        <div style="font-size: 0.8rem; color: var(--muted); margin-top: 4px;">${t(state, "settings.dropbox_hint")}</div>
        ${state.settings.organizationLogoData ? `<div style="margin-top: 15px; text-align: right;"><button type="button" class="button small danger" data-action="remove-org-logo">${t(state, "settings.remove_logo")}</button></div>` : ""}
      </div>
      <div style="margin-top: 20px;">
        ${UI.Button({ label: t(state, "settings.save"), type: "submit", variant: "primary" })}
      </div>
    `;
    content = UI.FormPanel({ kicker: t(state, "settings.branding_kicker"), title: t(state, "settings.tab_branding"), action: "save-org-logo" }, formContent);
  } else if (tab === "ilmoitukset") {
    const receivers = state.settings.whatsappReceivers || [];
    
    // Migrate old format to array if it exists but the array is empty
    if (receivers.length === 0 && state.settings.whatsappPhone && state.settings.callMeBotApiKey) {
      receivers.push({
        id: "legacy",
        name: "Ylläpitäjä",
        phone: state.settings.whatsappPhone,
        apikey: state.settings.callMeBotApiKey
      });
    }

    const receiverRows = receivers.map(r => `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px;"><strong>${escapeHtml(r.name)}</strong></td>
        <td style="padding: 10px;"><span class="blur-sensitive">${escapeHtml(r.phone)}</span></td>
        <td style="padding: 10px;"><span class="blur-sensitive">${escapeHtml(r.apikey)}</span></td>
        <td style="padding: 10px; text-align: right; white-space: nowrap;">
          <button type="button" class="button small" data-action="test-whatsapp-receiver" data-id="${escapeHtml(r.id)}">${t(state, "settings.test")}</button>
          <button type="button" class="button small danger" data-action="remove-whatsapp-receiver" data-id="${escapeHtml(r.id)}" style="margin-left: 5px;">${t(state, "settings.remove")}</button>
        </td>
      </tr>
    `).join("");

    const tableHtml = receivers.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left;">
            <th style="padding: 10px;">${t(state, "settings.name")}</th>
            <th style="padding: 10px;">${t(state, "settings.phone")}</th>
            <th style="padding: 10px;">${t(state, "settings.api_key")}</th>
            <th style="padding: 10px;"></th>
          </tr>
        </thead>
        <tbody>
          ${receiverRows}
        </tbody>
      </table>
    ` : `<p class="muted" style="margin-bottom: 25px;">${t(state, "settings.no_receivers")}</p>`;

    const formContent = `
      <p style="margin-bottom: 20px;">${t(state, "settings.whatsapp_help1")}</p>
      
      <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 0.9rem;">
        <h5 style="margin-top: 0; margin-bottom: 10px; color: var(--primary);">${t(state, "settings.whatsapp_help2")}</h5>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.5;">
          <li>${t(state, "settings.whatsapp_step1")}</li>
          <li>${t(state, "settings.whatsapp_step2")}</li>
          <li>${t(state, "settings.whatsapp_step3")}</li>
          <li>${t(state, "settings.whatsapp_step4")}</li>
        </ol>
      </div>

      <form class="stack" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border);" data-action="add-whatsapp-receiver">
        <h4 style="margin: 0 0 10px 0;">${t(state, "settings.add_receiver")}</h4>
        <div style="display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            ${UI.Input({ label: t(state, "settings.person_name"), name: "name", required: true, placeholder: "esim. Matti" })}
          </div>
          <div style="flex: 1; min-width: 150px;">
            ${UI.Input({ label: t(state, "settings.whatsapp_number"), name: "phone", required: true, placeholder: "+358401234567" })}
          </div>
          <div style="flex: 1; min-width: 150px;">
            ${UI.Input({ label: t(state, "settings.api_key"), name: "apikey", required: true, placeholder: "1234567" })}
          </div>
        </div>
        <div style="margin-top: 10px;">
          ${UI.Button({ label: t(state, "settings.add_to_list"), type: "submit", variant: "primary" })}
        </div>
      </form>
    `;
    
    content = UI.Panel({ kicker: t(state, "settings.automation_kicker"), title: t(state, "settings.tab_notifications") }, tableHtml + formContent);
  } else if (tab === "varmuuskopiot") {
    content = UI.Panel({ kicker: t(state, "settings.data_kicker"), title: t(state, "settings.backups_title") }, `
      <p style="margin-bottom: 20px;">${t(state, "settings.backup_desc")}</p>
      <div class="stack" style="max-width: 300px;">
        ${UI.Button({ label: t(state, "settings.export_json"), action: "export-json", variant: "primary" })}
        <label class="file-import" style="margin-top: 10px;">
          ${t(state, "settings.import_json")}
          <input type="file" id="import-json-input" accept="application/json" />
        </label>
      </div>
    `);
  }

  return `
    ${headerSubtitle}
    ${tabNav}
    ${content}
  `;
}
