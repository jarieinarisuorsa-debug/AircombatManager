import { UI } from "../../../ui/engine.js";
import { renderArrivalOnlyPanel } from "./EventArrivalPanel.js";
import { renderMapOnlyPanel } from "./EventMapPanel.js";
export function renderLocationPanel(event, info, admin, isEdit, state) {
  // Fallback for old 'sijainti' tab
  return UI.Grid({ columns: "minmax(280px, 0.9fr) minmax(280px, 1.1fr)", gap: "18px", className: "event-info-grid" }, `
    ${renderArrivalOnlyPanel(event, info, admin, false, state)}
    ${renderMapOnlyPanel(event, info, admin, false, state)}
  `);
}
