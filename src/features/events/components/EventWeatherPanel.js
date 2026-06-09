import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";
import { renderWeatherWidget } from "../weatherWidget.js";
export function renderWeatherOnlyPanel(event, info, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_weather"), "saatila", state)}
      <div style="padding: 15px; background: var(--surface-1); border-radius: 8px; border: 1px solid var(--border);">
        <label style="display: block; margin-bottom: 12px; font-weight: bold;">${t(state, "event_info.coords_label")}</label>
        ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
          ${UI.Input({ label: t(state, "event_info.lat"), name: "latitude", id: "event-latitude-input", value: info.latitude, placeholder: "esim. 61.777" })}
          ${UI.Input({ label: t(state, "event_info.lon"), name: "longitude", id: "event-longitude-input", value: info.longitude, placeholder: "esim. 22.723" })}
        `)}
        <div style="margin-top: 15px;">
          <button type="button" class="button small dashed" data-action="fetch-admin-location">${t(state, "event_info.fetch_loc")}</button>
          <span id="admin-location-status" style="font-size: 0.8rem; color: var(--muted); margin-left: 8px;"></span>
        </div>
      </div>
      <div class="ui-form-actions" style="margin-top: 20px;">
        ${UI.Button({ label: t(state, "event_info.save_coords"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const headerActions = admin ? renderEditButton('saatila', state) : "";
  return renderWeatherWidget(event, admin, headerActions, state);
}
