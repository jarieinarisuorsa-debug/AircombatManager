import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";

export function renderSettingsView(state) {
  const tab = state.settings?.settingsTab || "jarjestaja";
  const adminEmailsStr = Array.isArray(state.settings.adminEmails) ? state.settings.adminEmails.join(", ") : "";
  const publicEmailsStr = Array.isArray(state.settings.publicEmails) ? state.settings.publicEmails.join(", ") : "";

  const headerSubtitle = `<p class="muted" style="margin-bottom: 20px;">Järjestäjätiedot, datan varmuuskopiointi ja hallinnan asetukset</p>`;
  const tabNav = `
    <nav class="sub-nav no-print" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px;">
      <button type="button" class="button ${tab === 'jarjestaja' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="jarjestaja">Järjestäjä</button>
      <button type="button" class="button ${tab === 'oikeudet' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="oikeudet">Käyttäjät ja oikeudet</button>
      <button type="button" class="button ${tab === 'ulkoasu' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="ulkoasu">Ulkoasu ja logo</button>
      <button type="button" class="button ${tab === 'ilmoitukset' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="ilmoitukset">Ilmoitukset (WhatsApp)</button>
      <button type="button" class="button ${tab === 'varmuuskopiot' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="varmuuskopiot">Varmuuskopiot</button>
      <button type="button" class="button ${tab === 'debug' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="debug">Kehitys / debug</button>
    </nav>
  `;

  let content = "";

  if (tab === "jarjestaja") {
    const formContent = `
      ${UI.Input({ label: "Järjestäjän nimi", name: "organizerName", value: state.settings.organizerName || "", placeholder: "Seura / järjestäjä" })}
      <label class="check-row" style="margin-bottom: 20px;"><input type="checkbox" name="publicDisplayMode" ${state.settings.publicDisplayMode ? "checked" : ""} /> Julkinen näyttötila</label>
      ${UI.Button({ label: "Tallenna asetukset", type: "submit", variant: "primary" })}
    `;
    content = UI.FormPanel({ kicker: "Asetukset", title: "Järjestäjä", action: "save-settings" }, formContent);
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
          ${escapeHtml(perm.email)}
          ${perm.role === 'pending' ? '<br><span style="font-size: 0.8rem; color: #ffc107; font-weight: bold;">UUSI PYYNTÖ</span>' : ''}
        </td>
        <td style="padding: 10px;">
          <select class="ui-input" style="padding: 4px 8px; width: auto; ${perm.role === 'pending' ? 'border-color: #ffc107;' : ''}" data-action="update-permission-role" data-id="${perm.id}">
            ${perm.role === 'pending' ? '<option value="pending" selected>Odottaa oikeuksia</option>' : ''}
            <option value="admin" ${perm.role === 'admin' ? 'selected' : ''}>Ylläpitäjä</option>
            <option value="pilot" ${perm.role === 'pilot' ? 'selected' : ''}>Pilotti (Katselu)</option>
          </select>
        </td>
        <td style="padding: 10px; text-align: right;">
          <button type="button" class="button small danger" data-action="remove-permission" data-id="${escapeHtml(perm.id)}">Poista</button>
        </td>
      </tr>
    `).join("");

    const tableHtml = permissions.length > 0 ? `
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          <thead style="position: sticky; top: 0; background: var(--surface); z-index: 1;">
            <tr style="border-bottom: 2px solid var(--border); text-align: left;">
              <th style="padding: 10px;">Sähköposti</th>
              <th style="padding: 10px;">Rooli</th>
              <th style="padding: 10px;"></th>
            </tr>
          </thead>
          <tbody>
            ${permissionRows}
          </tbody>
        </table>
      </div>
    ` : `<p class="muted" style="margin-bottom: 20px;">Ei lisättyjä käyttäjiä.</p>`;

    const addForm = `
      <form class="stack" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 25px;" data-action="add-permission">
        <h4 style="margin: 0 0 10px 0;">Lisää uusi käyttäjä</h4>
        <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            ${UI.Input({ label: "Sähköposti", name: "email", type: "email", required: true, placeholder: "esim@osoite.fi" })}
          </div>
          <div style="width: 200px;">
            <label class="ui-label">Rooli</label>
            <select name="role" class="ui-input" required>
              <option value="admin">Ylläpitäjä</option>
              <option value="pilot">Pilotti (Katselu)</option>
            </select>
          </div>
          <div style="padding-bottom: 4px;">
            ${UI.Button({ label: "Lisää", type: "submit", variant: "primary" })}
          </div>
        </div>
      </form>
    `;

    const infoText = `<p class="muted" style="margin-top: 20px;">Vinkki: Kun lisäät pilotille sähköpostiosoitteen suoraan Pilotit-sivulla, hän saa automaattisesti pilottioikeudet kirjautuessaan, eikä häntä tarvitse lisätä erikseen tähän listaan.</p>`;

    content = UI.Panel({ kicker: "Oikeudet", title: "Käyttäjät ja oikeudet" }, addForm + tableHtml + infoText);
  } else if (tab === "ulkoasu") {
    content = UI.Panel({ kicker: "Brändäys", title: "Ulkoasu ja logo" }, `
      <div style="margin-bottom: 20px; max-width: 400px;">
        <label class="ui-label" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">Yhdistyksen logo</label>
        <div class="is-admin-dropzone" style="border: 2px dashed var(--border); padding: 16px; text-align: center; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onclick="this.querySelector('input[type=file]').click()">
          <input type="file" id="org-logo-upload" accept="image/*" style="display: none;" />
          ${state.settings.organizationLogoData 
            ? `<img id="org-logo-preview" src="${escapeHtml(state.settings.organizationLogoData)}" alt="Logo" style="max-height: 80px; max-width: 100%; border-radius: 4px; object-fit: contain;" />` 
            : `<div id="org-logo-placeholder">
                 <div style="font-size: 2rem; margin-bottom: 8px;">🖼️</div>
                 <div style="font-size: 0.9rem; color: var(--muted);">Lataa logo (klik tai raahaa)</div>
               </div>
               <img id="org-logo-preview" src="" style="max-height: 80px; max-width: 100%; display: none; margin: 0 auto; border-radius: 4px; object-fit: contain;" />`
          }
        </div>
        <label class="ui-label" style="display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">Tai anna logon URL-osoite (esim. Dropbox-linkki)</label>
        <input type="url" name="organizationLogoUrl" class="ui-input" value="${escapeHtml(!state.settings.organizationLogoData || state.settings.organizationLogoData.startsWith('data:') ? '' : state.settings.organizationLogoData)}" placeholder="https://..." style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px;" />
        <div style="font-size: 0.8rem; color: var(--muted); margin-top: 4px;">Huom: Dropbox-linkit muutetaan automaattisesti toimivaan muotoon.</div>
        ${state.settings.organizationLogoData ? `<div style="margin-top: 15px; text-align: right;"><button type="button" class="button small danger" data-action="remove-org-logo">Poista logo</button></div>` : ""}
      </div>
    `);
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
        <td style="padding: 10px;">${escapeHtml(r.phone)}</td>
        <td style="padding: 10px;"><span style="filter: blur(4px); user-select: none;">${escapeHtml(r.apikey)}</span></td>
        <td style="padding: 10px; text-align: right; white-space: nowrap;">
          <button type="button" class="button small" data-action="test-whatsapp-receiver" data-id="${escapeHtml(r.id)}">Testaa</button>
          <button type="button" class="button small danger" data-action="remove-whatsapp-receiver" data-id="${escapeHtml(r.id)}" style="margin-left: 5px;">Poista</button>
        </td>
      </tr>
    `).join("");

    const tableHtml = receivers.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left;">
            <th style="padding: 10px;">Nimi</th>
            <th style="padding: 10px;">Puhelinnumero</th>
            <th style="padding: 10px;">API-avain</th>
            <th style="padding: 10px;"></th>
          </tr>
        </thead>
        <tbody>
          ${receiverRows}
        </tbody>
      </table>
    ` : `<p class="muted" style="margin-bottom: 25px;">Ei asetettuja WhatsApp-ilmoitusten saajia.</p>`;

    const formContent = `
      <p style="margin-bottom: 20px;">Voit lisätä useita henkilöitä saamaan ilmoituksia (esim. muut ylläpitäjät). Jokainen tarvitsee oman CallMeBot API-avaimensa.</p>
      
      <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 0.9rem;">
        <h5 style="margin-top: 0; margin-bottom: 10px; color: var(--primary);">Näin saat API-avaimen (kestää 10 sekuntia):</h5>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.5;">
          <li>Tallenna puhelimeesi yhteystieto <strong>+34 644 10 28 72</strong> (esim. nimellä "CallMeBot").</li>
          <li>Lähetä tälle numerolle WhatsApp-viesti: <strong>I allow callmebot to send me messages</strong></li>
          <li>Botti vastaa heti ja antaa sinulle API-avaimen.</li>
          <li>Syötä avaimesi ja puhelinnumerosi alle.</li>
        </ol>
      </div>

      <form class="stack" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border);" data-action="add-whatsapp-receiver">
        <h4 style="margin: 0 0 10px 0;">Lisää uusi vastaanottaja</h4>
        <div style="display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            ${UI.Input({ label: "Henkilön nimi", name: "name", required: true, placeholder: "esim. Matti Ylläpitäjä" })}
          </div>
          <div style="flex: 1; min-width: 150px;">
            ${UI.Input({ label: "WhatsApp-numero", name: "phone", required: true, placeholder: "+358401234567" })}
          </div>
          <div style="flex: 1; min-width: 150px;">
            ${UI.Input({ label: "API-avain", name: "apikey", required: true, placeholder: "1234567" })}
          </div>
        </div>
        <div style="margin-top: 10px;">
          ${UI.Button({ label: "Lisää listalle", type: "submit", variant: "primary" })}
        </div>
      </form>
    `;
    
    content = UI.Panel({ kicker: "Automaatio", title: "WhatsApp-ilmoitukset" }, tableHtml + formContent);
  } else if (tab === "varmuuskopiot") {
    content = UI.Panel({ kicker: "Data", title: "Varmuuskopiot" }, `
      <p style="margin-bottom: 20px;">Varmuuskopioi koko kilpailun data JSON-tiedostona tai tuo aiempi varmuuskopio. Huomaa, että tuonti korvaa nykyiset tiedot.</p>
      <div class="stack" style="max-width: 300px;">
        ${UI.Button({ label: "Vie JSON-varmuuskopio", action: "export-json", variant: "primary" })}
        <label class="file-import" style="margin-top: 10px;">
          Tuo JSON-varmuuskopio
          <input type="file" id="import-json-input" accept="application/json" />
        </label>
      </div>
    `);
  } else if (tab === "debug") {
    content = UI.Panel({ kicker: "Järjestelmä", title: "Kehitys / debug" }, `
      <div style="border: 1px solid var(--danger); border-radius: 8px; padding: 16px; background: rgba(255,0,0,0.05); margin-bottom: 20px; max-width: 500px;">
        <h4 style="color: var(--danger); margin-top: 0; margin-bottom: 8px;">Vaarallinen alue</h4>
        <p class="muted" style="margin-bottom: 16px;">Tämä toiminto tyhjentää kaiken järjestelmään syötetyn tiedon ja palauttaa oletusasetukset sekä demo-datan. Toimintoa <strong>ei voi perua</strong>.</p>
        ${UI.Button({ label: "Palauta demodata", action: "reset-data", variant: "danger" })}
      </div>
      
      <p class="muted">Tämä osio on tarkoitettu vain kehitykseen ja vianmääritykseen.</p>
    `);
  }

  return `
    ${headerSubtitle}
    ${tabNav}
    ${content}
  `;
}
