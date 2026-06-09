import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";

export function renderSponsorsPanel(info, admin, isEdit, state) {
  const sponsors = info.sponsors || [];
  
  if (isEdit) {
    return UI.FormPanel({ action: "add-event-sponsor", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.add_sponsor"), "sponsorit", state)}
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: t(state, "event_info.sponsor_name"), name: "name", required: true })}
        <label>${t(state, "event_info.level")}
          <select name="level">
            <option value="${t(state, "event_info.level_main")}">${t(state, "event_info.level_main")}</option>
            <option value="${t(state, "event_info.level_partner")}" selected>${t(state, "event_info.level_partner")}</option>
            <option value="${t(state, "event_info.level_supporter")}">${t(state, "event_info.level_supporter")}</option>
          </select>
        </label>
        ${UI.Input({ label: t(state, "event_info.logo_url"), name: "logoUrl", placeholder: "https://..." })}
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; font-size: 0.9rem;">${t(state, "event_info.add_logo")}</label>
          <div class="is-admin-dropzone" style="border: 2px dashed var(--border); padding: 24px; text-align: center; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onclick="this.querySelector('input[type=file]').click()">
            <input type="file" id="sponsor-logo-upload" accept="image/*" style="display: none;" />
            <div style="font-size: 2rem; margin-bottom: 8px;">🖼️</div>
            <div style="font-weight: bold; margin-bottom: 4px;">${t(state, "event_info.drag_logo")}</div>
            <div style="font-size: 0.9rem; color: var(--muted);">${t(state, "event_info.click_logo")}</div>
            <img id="sponsor-logo-preview" src="" alt="Esikatselu" style="max-height: 100px; max-width: 100%; display: none; margin: 16px auto 0 auto; border-radius: 4px; object-fit: contain;" />
            <input type="hidden" name="logoData" id="sponsor-logo-data" />
          </div>
        </div>
        ${UI.Input({ label: t(state, "event_info.web_url"), name: "websiteUrl", placeholder: "https://..." })}
      `)}
      <label>${t(state, "event_info.desc_opt")}
        <textarea name="description" placeholder="${t(state, "event_info.desc_placeholder_sponsor")}" rows="3"></textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: t(state, "event_info.btn_add_sponsor"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const levels = [t(state, "event_info.level_main"), t(state, "event_info.level_partner"), t(state, "event_info.level_supporter")];
  let content = "";

  levels.forEach(level => {
    // In db they might be saved in Finnish, so we should map if needed, but for now we filter by UI text 
    // or just assume they are saved as the localized text. If saved as finnish we should probably just use Finnish mapping.
    // Actually, to be safe, filter by the finnish text if it's stored in db, but let's check.
    const levelSponsors = sponsors.filter(s => s.level === level || s.level === "Pääsponsori" && level === t(state, "event_info.level_main") || s.level === "Yhteistyökumppani" && level === t(state, "event_info.level_partner") || s.level === "Tukija" && level === t(state, "event_info.level_supporter"));
    if (levelSponsors.length === 0) return;

    // Use a Set to avoid duplicates if checking multiple conditions above
    const uniqueSponsors = Array.from(new Set(levelSponsors));

    content += `
      <div style="margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 8px;">${escapeHtml(level)}</h3>
        ${UI.Grid({ columns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }, 
          uniqueSponsors.map(sponsor => {
            let logo = "";
            if (sponsor.logoUrl) {
              logo = `<img src="${escapeHtml(sponsor.logoUrl)}" alt="${escapeHtml(sponsor.name)} logo" style="max-height: 80px; max-width: 100%; object-fit: contain; margin-bottom: 12px;" />`;
            } else {
              const initials = sponsor.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
              logo = `<div style="display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; background-color: var(--card-alt); border-radius: 50%; margin: 0 auto 12px auto; font-size: 1.5rem; font-weight: bold; color: var(--muted);">${escapeHtml(initials)}</div>`;
            }
            
            const link = sponsor.websiteUrl ? `<a href="${escapeHtml(sponsor.websiteUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none; font-weight: bold;">${escapeHtml(sponsor.name)}</a>` : `<strong>${escapeHtml(sponsor.name)}</strong>`;
            const desc = sponsor.description ? `<p style="margin: 8px 0 0 0; font-size: 0.9rem; color: var(--muted);">${escapeHtml(sponsor.description)}</p>` : "";
            const delBtn = admin ? `<div style="margin-top: 12px; text-align: center;"><button type="button" class="button small danger" data-action="delete-event-sponsor" data-sponsor-id="${escapeHtml(sponsor.id)}">${t(state, "event_info.delete")}</button></div>` : "";
            
            return `
              <div class="small-card" style="display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 20px;">
                <div>
                  ${logo}
                  <div style="font-size: 1.1rem; margin-bottom: 4px;">${link}</div>
                  ${desc}
                </div>
                ${delBtn}
              </div>
            `;
          }).join("")
        )}
      </div>
    `;
  });

  if (sponsors.length === 0) {
    content = `<p class="muted">${t(state, "event_info.no_sponsors")}</p>`;
  }

  const headerActions = admin ? `<button type="button" class="button small primary" data-action="edit-event-section" data-section="sponsorit">${t(state, "event_info.btn_add_sponsor_small")}</button>` : "";
  return UI.Panel({ kicker: t(state, "event_info.sponsors_kicker"), title: t(state, "event_info.sponsors_title"), headerActions }, content);
}
