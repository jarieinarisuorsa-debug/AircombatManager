import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";
import { formatDateRange } from "../../../utils/html.js";
export function renderSummaryPanel(event, info, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_general"), "yleista", state)}
      <label>${t(state, "event_info.desc_label")}
        <textarea name="description" placeholder="${t(state, "event_info.desc_placeholder")}" rows="8">${escapeHtml(info.description)}</textarea>
      </label>
      
      <div style="margin-top: 15px;">
        <label>${t(state, "event_info.coat_of_arms")}</label>
        
        <div id="coat-of-arms-preview-card" class="panel" style="display: ${info.coatOfArmsData ? "flex" : "none"}; align-items: center; gap: 30px; padding: 20px; margin-top: 8px;">
          <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            <img id="coat-of-arms-preview" src="${escapeHtml(info.coatOfArmsData || "")}" style="max-height: 160px; max-width: 200px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));" alt="${t(state, "event_info.coat_of_arms")}" />
          </div>
          <div style="flex: 1;">
            <p style="margin: 0 0 8px 0; font-size: 1.1rem;"><strong>${t(state, "event_info.coat_saved")}</strong></p>
            <p style="margin: 0 0 15px 0; color: var(--muted); font-size: 0.9rem;">${t(state, "event_info.coat_desc")}</p>
            <div style="display: flex; gap: 10px;">
               <button type="button" class="button small outline" onclick="document.getElementById('coat-of-arms-upload').click()">${t(state, "event_info.change_image")}</button>
               <button type="button" class="button small danger outline" data-action="clear-coat-of-arms" id="clear-coat-of-arms-btn">${t(state, "event_info.remove_image")}</button>
            </div>
          </div>
        </div>

        <label id="coat-of-arms-dropzone-label" class="is-admin-dropzone" style="display: ${info.coatOfArmsData ? "none" : "flex"}; flex-direction: column; align-items: center; justify-content: center; min-height: 120px; border: 2px dashed var(--border); border-radius: 8px; cursor: pointer; padding: 20px; margin-top: 8px; text-align: center; background: rgba(0,0,0,0.1); transition: 0.2s ease;">
          <input type="file" id="coat-of-arms-upload" style="display: none;" accept="image/png, image/jpeg, image/webp, image/svg+xml" />
          <input type="hidden" name="coatOfArmsData" id="coat-of-arms-data" value="${escapeHtml(info.coatOfArmsData || "")}" />
          <span style="font-size: 2rem; margin-bottom: 10px; opacity: 0.8;">🛡️</span>
          <span style="color: var(--text); font-weight: 600; font-size: 0.95rem;">${t(state, "event_info.drag_drop")}</span>
          <span style="color: var(--muted); font-size: 0.8rem; margin-top: 6px;">${t(state, "event_info.drag_hint")}</span>
        </label>
      </div>

      <div class="ui-form-actions" style="margin-top: 20px;">
        ${UI.Button({ label: t(state, "event_info.save_changes"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const description = String(info.description || "").trim();
  const headerActions = admin ? renderEditButton('yleista', state) : "";

  return UI.Panel({ kicker: t(state, "event_info.basic_kicker"), title: t(state, "event_info.basic_title"), headerActions }, `
    <div class="event-info-summary">
      <article class="small-card"><span class="muted">${t(state, "event_info.loc")}</span><strong>${escapeHtml(event.location || "-")}</strong></article>
      <article class="small-card"><span class="muted">${t(state, "event_info.date")}</span><strong>${formatDateRange(event.date, event.endDate)}</strong></article>
      <article class="small-card"><span class="muted">${t(state, "event_info.classes")}</span><strong>${(event.classes || []).map(escapeHtml).join(", ") || "-"}</strong></article>
      <article class="small-card"><span class="muted">${t(state, "event_info.status")}</span><strong>${escapeHtml(event.status || "-")}</strong></article>
    </div>
    ${description ? `<div class="event-info-text" style="margin-top: 20px;">${formatMultiline(description)}</div>` : `<p class="muted" style="margin-top: 20px;">${t(state, "event_info.no_desc")}</p>`}
  `);
}
