import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";

export function renderSchedulePanel(info, admin, editMode, state) {
  const schedule = info.schedule || [];
  
  if (editMode === 'lisaa-aikataulu' || (editMode && editMode.startsWith('muokkaa-aikataulu-'))) {
    const isEdit = editMode.startsWith('muokkaa-aikataulu-');
    const rowId = isEdit ? editMode.split('-')[2] : null;
    const row = isEdit ? schedule.find(r => r.id === rowId) : {};
    
    return UI.FormPanel({ action: "save-event-schedule-row", className: "event-info-editor" }, `
      ${renderEditHeader(isEdit ? t(state, "event_info.edit_schedule") : t(state, "event_info.add_schedule"), "aikataulu", state)}
      <input type="hidden" name="id" value="${escapeHtml(row.id || "")}" />
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: t(state, "event_info.date_label"), name: "date", value: row.date, placeholder: "La 1.6." })}
        ${UI.Input({ label: t(state, "event_info.time_label"), name: "time", required: true, value: row.time, placeholder: "09:00" })}
      `)}
      ${UI.Input({ label: t(state, "event_info.title_label"), name: "title", required: true, value: row.title, placeholder: t(state, "event_info.title_placeholder") })}
      <label>${t(state, "event_info.desc_schedule")}
        <textarea name="description" placeholder="${t(state, "event_info.desc_schedule_placeholder")}" rows="3">${escapeHtml(row.description || "")}</textarea>
      </label>
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: t(state, "event_info.class_opt"), name: "className", value: row.className, placeholder: t(state, "event_info.class_placeholder") })}
        ${UI.Input({ label: t(state, "event_info.loc_opt"), name: "location", value: row.location, placeholder: t(state, "event_info.loc_placeholder") })}
      `)}
      <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
        <input type="checkbox" name="isPublished" value="true" ${row.isPublished === false ? "" : "checked"} />
        <strong>${t(state, "event_info.publish_this")}</strong>
        <span class="muted" style="margin-left: 8px; font-weight: normal;">${t(state, "event_info.hide_hint")}</span>
      </label>
      <div class="ui-form-actions" style="margin-top: 20px;">
        ${UI.Button({ label: isEdit ? t(state, "event_info.save_schedule") : t(state, "event_info.add_schedule_btn"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  // Sort schedule by date string and time string
  const sortedRows = [...schedule].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.time || "";
    const timeB = b.time || "";
    return timeA.localeCompare(timeB);
  });

  const visibleRows = admin ? sortedRows : sortedRows.filter(r => r.isPublished !== false);

  let content = "";
  if (visibleRows.length === 0) {
    content = `<p class="muted">${t(state, "event_info.no_schedule")}</p>`;
  } else {
    content = `
      <div class="event-schedule-list" style="display: flex; flex-direction: column; gap: 12px;">
        ${visibleRows.map(row => {
          const publishedTag = row.isPublished === false ? `<span class="badge warning" style="font-size: 0.75rem; margin-left: 8px;">${t(state, "event_info.hidden_badge")}</span>` : "";
          const metaParts = [
            row.className ? `<strong>${escapeHtml(row.className)}</strong>` : "",
            row.location ? `📍 ${escapeHtml(row.location)}` : ""
          ].filter(Boolean);
          const metaLine = metaParts.length > 0 ? `<div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">${metaParts.join(" · ")}</div>` : "";
          const dateLabel = row.date ? `<div style="font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${escapeHtml(row.date)}</div>` : "";
          
          const adminActions = admin ? `
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <button type="button" class="button small" data-action="edit-event-section" data-section="muokkaa-aikataulu-${escapeHtml(row.id)}">${t(state, "event_info.edit")}</button>
              <button type="button" class="button small danger outline" data-action="delete-event-schedule-row" data-row-id="${escapeHtml(row.id)}">${t(state, "event_info.delete")}</button>
            </div>
          ` : "";

          return `
            <div class="small-card" style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; border-left: 4px solid var(--primary); ${row.isPublished === false ? "opacity: 0.7; filter: grayscale(50%);" : ""}">
              <div style="flex: 0 0 70px; text-align: right;">
                ${dateLabel}
                <div style="font-size: 1.4rem; font-weight: bold; color: var(--text);">${escapeHtml(row.time || "–")}</div>
              </div>
              <div style="flex: 1 1 auto; min-width: 0;">
                <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; display: flex; align-items: center;">
                  ${escapeHtml(row.title)}
                  ${publishedTag}
                </h4>
                ${row.description ? `<p style="margin: 0; font-size: 0.95rem; color: var(--text-muted); line-height: 1.4;">${formatMultiline(row.description)}</p>` : ""}
                ${metaLine}
                ${adminActions}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  const headerActions = admin ? `<button type="button" class="button small primary" data-action="edit-event-section" data-section="lisaa-aikataulu">${t(state, "event_info.btn_add_schedule_small")}</button>` : "";
  return UI.Panel({ kicker: t(state, "event_info.schedule_kicker"), title: t(state, "event_info.schedule_title"), headerActions }, content);
}
