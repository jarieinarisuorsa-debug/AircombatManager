import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";

export function renderSettingsView(state) {
  const tab = state.settings?.settingsTab || "jarjestaja";
  const adminEmailsStr = Array.isArray(state.settings.adminEmails) ? state.settings.adminEmails.join(", ") : "";
  const publicEmailsStr = Array.isArray(state.settings.publicEmails) ? state.settings.publicEmails.join(", ") : "";

  const pageHeader = UI.PageHeader({
    kicker: "Hallinta",
    title: "Asetukset",
    subtitle: "Järjestäjätiedot ja datan varmuuskopiointi"
  });

  const tabNav = `
    <nav class="sub-nav no-print" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px;">
      <button type="button" class="button ${tab === 'jarjestaja' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="jarjestaja">Järjestäjä</button>
      <button type="button" class="button ${tab === 'oikeudet' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="oikeudet">Käyttäjät ja oikeudet</button>
      <button type="button" class="button ${tab === 'ulkoasu' ? 'primary' : 'dashed'}" data-action="set-settings-tab" data-tab="ulkoasu">Ulkoasu ja logo</button>
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
    const formContent = `
      <label class="ui-label" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">Ylläpitäjien sähköpostit (erota pilkulla)</label>
      <textarea name="adminEmails" class="ui-input" rows="3" style="width: 100%; box-sizing: border-box; margin-bottom: 20px;" placeholder="admin@demo.fi, toinen@esimerkki.fi">${escapeHtml(adminEmailsStr)}</textarea>
      
      <label class="ui-label" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">Peruskäyttäjien (pilottien) sähköpostit (erota pilkulla)</label>
      <textarea name="publicEmails" class="ui-input" rows="3" style="width: 100%; box-sizing: border-box; margin-bottom: 20px;" placeholder="pilotti@demo.fi, matti@meikalainen.fi">${escapeHtml(publicEmailsStr)}</textarea>

      <p class="muted" style="margin-bottom: 20px;">Lisää sähköpostiosoitteet ylläpitäjille ja peruskäyttäjille, joilla on oikeus hallita kilpailua tai tarkastella omaa pilottikorttiaan.</p>
      
      <input type="hidden" name="organizerName" value="${escapeHtml(state.settings.organizerName || "")}" />
      <input type="checkbox" name="publicDisplayMode" ${state.settings.publicDisplayMode ? "checked" : ""} style="display: none;" />

      ${UI.Button({ label: "Tallenna asetukset", type: "submit", variant: "primary" })}
    `;
    content = UI.FormPanel({ kicker: "Oikeudet", title: "Käyttäjät ja oikeudet", action: "save-settings" }, formContent);
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
        ${state.settings.organizationLogoData ? `<div style="margin-top: 8px; text-align: right;"><button type="button" class="button small danger" data-action="remove-org-logo">Poista logo</button></div>` : ""}
      </div>
    `);
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
    ${pageHeader}
    ${tabNav}
    ${content}
  `;
}
