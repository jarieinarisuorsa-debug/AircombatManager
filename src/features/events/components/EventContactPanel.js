import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";

export function renderContactPanel(info, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_contacts"), "yhteystiedot", state)}
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: t(state, "event_info.org_label"), name: "organizer", value: info.organizer, placeholder: t(state, "event_info.org_placeholder") })}
        ${UI.Input({ label: t(state, "event_info.web_label"), name: "websiteUrl", value: info.websiteUrl, placeholder: "https://..." })}
        ${UI.Input({ label: t(state, "event_info.contact_name"), name: "contactName", value: info.contactName, placeholder: "Nimi" })}
        ${UI.Input({ label: t(state, "event_info.contact_email"), name: "contactEmail", type: "email", value: info.contactEmail, placeholder: "info@example.com" })}
      `)}
      <div class="ui-form-actions">
        ${UI.Button({ label: t(state, "event_info.save_contacts"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const parts = [
    info.organizer ? `<strong>${t(state, "event_info.org_bold")}</strong> ${escapeHtml(info.organizer)}` : "",
    info.contactName ? `<strong>${t(state, "event_info.name_bold")}</strong> ${escapeHtml(info.contactName)}` : "",
    info.contactEmail ? `<strong>${t(state, "event_info.email_bold")}</strong> ${escapeHtml(info.contactEmail)}` : ""
  ].filter(Boolean);

  const website = info.websiteUrl ? `<a class="button small" href="${escapeHtml(info.websiteUrl)}" target="_blank" rel="noopener noreferrer">${t(state, "event_info.open_web")}</a>` : "";
  const headerActions = admin ? renderEditButton('yhteystiedot', state) : "";

  return UI.Panel({ kicker: t(state, "event_info.contacts_kicker"), title: t(state, "event_info.contacts_title"), headerActions }, `
    ${parts.length ? `
      <div class="event-info-text" style="font-size: 1.1em; line-height: 1.6;">
        ${parts.map((part) => `<div>${part}</div>`).join("")}
      </div>
    ` : `<p class="muted">${t(state, "event_info.no_contacts")}</p>`}
    ${website ? `<div style="margin-top: 15px;">${website}</div>` : ""}
  `);
}
