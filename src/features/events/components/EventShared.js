import { escapeHtml } from "../../../utils/html.js";
import { t } from "../../../utils/i18n.js";

export function getZoneCenter(points) {
  if (!points || points.length === 0) return {x: 50, y: 50};
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

export function renderEditHeader(title, sectionName, state) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">${title}</h3>
      <button type="button" class="button small" data-action="cancel-edit-event-section">${t(state, "event_info.btn_cancel")}</button>
    </div>
  `;
}

export function renderEditButton(sectionName, state) {
  return `<button type="button" class="button small primary" data-action="edit-event-section" data-section="${sectionName}">${t(state, "event_info.btn_edit")}</button>`;
}

export function formatMultiline(value) {
  return escapeHtml(value).replaceAll("\\n", "<br />");
}
