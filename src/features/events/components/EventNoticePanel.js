import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";

export function renderNoticePanel(event, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_notices"), "tiedotteet", state)}
      <label>${t(state, "event_info.notice_label")}
        <textarea name="publicNotice" placeholder="${t(state, "event_info.notice_placeholder")}" rows="6">${escapeHtml(event.publicNotice || "")}</textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: t(state, "event_info.publish_notice"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const notice = String(event.publicNotice || "").trim();
  const headerActions = admin ? renderEditButton('tiedotteet', state) : "";
  return UI.Panel({ kicker: t(state, "event_info.notices_kicker"), title: notice ? t(state, "event_info.notices_title") : t(state, "event_info.no_notices_title"), headerActions },
    notice ? `<p class="notice-text public-notice-text">${escapeHtml(notice)}</p>` : `<p class="muted">${t(state, "event_info.no_notices")}</p>`);
}
