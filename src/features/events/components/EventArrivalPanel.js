import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";

export function renderArrivalOnlyPanel(event, info, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_arrival"), "saapuminen", state)}
      <label style="margin-top: 12px;">${t(state, "event_info.arrival_label")}
        <textarea name="arrivalInfo" placeholder="${t(state, "event_info.arrival_placeholder")}" rows="6">${escapeHtml(info.arrivalInfo)}</textarea>
      </label>
      <label>${t(state, "event_info.services_label")}
        <textarea name="servicesInfo" placeholder="${t(state, "event_info.services_placeholder")}" rows="6">${escapeHtml(info.servicesInfo)}</textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: t(state, "event_info.save_info"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const arrivalInfo = String(info.arrivalInfo || "").trim();
  const servicesInfo = String(info.servicesInfo || "").trim();
  const headerActions = admin ? renderEditButton('saapuminen', state) : "";

  return UI.Panel({ kicker: t(state, "event_info.arrival_kicker"), title: t(state, "event_info.arrival_title"), headerActions }, `
    <div class="event-info-block">
      <h4>${t(state, "event_info.arrival_heading")}</h4>
      ${arrivalInfo ? `<div class="event-info-text">${formatMultiline(arrivalInfo)}</div>` : `<p class="muted">${t(state, "event_info.no_arrival")}</p>`}
    </div>
    <div class="event-info-block">
      <h4>${t(state, "event_info.services_heading")}</h4>
      ${servicesInfo ? `<div class="event-info-text">${formatMultiline(servicesInfo)}</div>` : `<p class="muted">${t(state, "event_info.no_services")}</p>`}
    </div>
  `);
}
