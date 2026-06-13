import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";
import { parseDocumentLines } from "../../../logic/eventInfo.js";
export function renderDocumentsPanel(info, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_docs"), "dokumentit", state)}
      <label>${t(state, "event_info.docs_label")}
        <textarea name="documentsText" placeholder="${t(state, "event_info.docs_placeholder")}" rows="6">${escapeHtml(info.documentsText)}</textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: t(state, "event_info.save_docs"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const documents = parseDocumentLines(info.documentsText);
  const headerActions = admin ? renderEditButton('dokumentit', state) : "";

  return UI.Panel({ kicker: t(state, "event_info.docs_kicker"), title: t(state, "event_info.docs_title"), headerActions }, documents.length ? UI.ScrollableNav({
    className: "event-document-list",
    navStyle: "padding: 10px 0; -webkit-overflow-scrolling: touch;"
  }, documents.map((doc) => `
    <a class="event-document-card panel" href="${escapeHtml(doc.url || "#")}" ${doc.url ? `target="_blank" rel="noopener noreferrer"` : ""} style="flex: 0 0 85%; max-width: 320px; scroll-snap-align: start; text-decoration: none; display: flex; flex-direction: column; padding: 16px;">
      <strong style="color: var(--primary); font-size: 1.05rem; margin-bottom: 4px;">${escapeHtml(doc.title)}</strong>
      <span style="font-size: 0.85rem; color: var(--muted); word-break: break-all; opacity: 0.8;">${doc.url ? escapeHtml(doc.url) : t(state, "event_info.no_link")}</span>
    </a>
  `).join("")) : `
    <p class="muted">${t(state, "event_info.no_docs")}</p>
    <p class="muted">${t(state, "event_info.docs_admin_hint")}</p>
  `);
}
