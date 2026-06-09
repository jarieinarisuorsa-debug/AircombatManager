import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { calculateModelSpecs } from "../../data/aircraftSpecs.js";
import { isAdmin } from "../../users/roles.js";
import { t } from "../../utils/i18n.js";

export function renderAircraftView(state) {
  const admin = isAdmin(state);
  const aircraftSpecs = state.aircraftSpecs || [];
  const aircraftSpecFormOpen = Boolean(state.settings?.aircraftSpecFormOpen);

  const tab = window.AIRCRAFT_TAB || 'konetyypit';
  
  const tabNavigation = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'konetyypit' ? 'primary' : 'dashed'}" data-action="set-aircraft-tab" data-tab="konetyypit">${t(state, "aircraft.tab_specs")}</button>
      <button type="button" class="button ${tab === 'saannot' ? 'primary' : 'dashed'}" data-action="set-aircraft-tab" data-tab="saannot">${t(state, "aircraft.tab_rules")}</button>
      <button type="button" class="button ${tab === 'katsastus' ? 'primary' : 'dashed'}" data-action="set-aircraft-tab" data-tab="katsastus">${t(state, "aircraft.tab_inspection")}</button>
    </div>
  `;

  let contentHtml = "";

  if (tab === "konetyypit") {
    const isAdminClass = admin ? "is-admin" : "";
    
    const rows = aircraftSpecs.map(ac => {
      const span = calculateModelSpecs(ac.realSpanM);
      const len = calculateModelSpecs(ac.realLengthM);
      
      const adminActions = admin ? `
        <div class="ac-actions">
          ${UI.Button({
            label: t(state, "aircraft.delete"),
            action: "delete-aircraft-spec",
            specId: ac.id,
            variant: "small danger"
          })}
        </div>
      ` : "";

      return `
        <div class="aircraft-card">
          <div class="ac-title"><strong>${escapeHtml(ac.name)}</strong></div>
          <div class="ac-stat">
            <span class="ac-label">${t(state, "aircraft.real_span")}</span>
            <span class="ac-val">${Number(ac.realSpanM || 0).toFixed(2)} m</span>
          </div>
          <div class="ac-stat">
            <span class="ac-label">${t(state, "aircraft.real_length")}</span>
            <span class="ac-val">${Number(ac.realLengthM || 0).toFixed(2)} m</span>
          </div>
          <div class="ac-stat">
            <span class="ac-label">${t(state, "aircraft.scale_span")}</span>
            <span class="ac-val"><strong>${span.target} cm</strong> <span class="muted">(${span.min} - ${span.max})</span></span>
          </div>
          <div class="ac-stat">
            <span class="ac-label">${t(state, "aircraft.scale_length")}</span>
            <span class="ac-val"><strong>${len.target} cm</strong> <span class="muted">(${len.min} - ${len.max})</span></span>
          </div>
          ${adminActions}
        </div>
      `;
    }).join("");

    const adminHeader = admin ? `<div>${t(state, "aircraft.actions")}</div>` : "";

    const tableContainer = `
      <div class="aircraft-grid ${isAdminClass}">
        <div class="aircraft-grid-header no-mobile">
          <div>${t(state, "aircraft.model_type")}</div>
          <div>${t(state, "aircraft.real_span")}</div>
          <div>${t(state, "aircraft.real_length")}</div>
          <div>${t(state, "aircraft.scale_span_allowed")}</div>
          <div>${t(state, "aircraft.scale_length_allowed")}</div>
          ${adminHeader}
        </div>
        ${rows}
      </div>
    `;

    const actions = `
      <div style="display: flex; gap: 10px;" class="no-print">
        ${admin ? UI.Button({ label: t(state, "aircraft.add_model"), action: "focus-aircraft-spec-form", variant: "primary" }) : ""}
        ${UI.Button({ label: t(state, "aircraft.print_table"), action: "print-page", variant: "dashed" })}
      </div>
    `;

    contentHtml = `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
          <div>
            <p class="kicker">${t(state, "aircraft.table_kicker")}</p>
            <h4 style="margin: 0;">${t(state, "aircraft.table_title")}</h4>
          </div>
          ${actions}
        </div>
        ${tableContainer}
      </div>
    `;
  } else if (tab === "saannot") {
    const rulesContent = `
      <div style="margin-bottom: 25px;">
        <h4 style="margin-top: 0;">${t(state, "aircraft.rules_3_1_title")}</h4>
        <ul style="margin-left: 20px; line-height: 1.6;">
          <li>${t(state, "aircraft.rules_3_1_1")}</li>
          <li>${t(state, "aircraft.rules_3_1_2")}</li>
          <li>${t(state, "aircraft.rules_3_1_3")}</li>
          <li>${t(state, "aircraft.rules_3_1_4")}</li>
          <li>${t(state, "aircraft.rules_3_1_5")}</li>
          <li>${t(state, "aircraft.rules_3_1_6")}</li>
          <li>${t(state, "aircraft.rules_3_1_7")}</li>
        </ul>
      </div>
    `;
    contentHtml = UI.Panel({ kicker: t(state, "aircraft.tab_rules"), title: t(state, "aircraft.rules_title") }, rulesContent);
  } else if (tab === "katsastus") {
    contentHtml = UI.Panel({ kicker: t(state, "aircraft.tab_inspection"), title: t(state, "aircraft.inspection_title") }, `
      <p>${t(state, "aircraft.inspection_msg")}</p>
    `);
  }

  const modalHtml = admin && aircraftSpecFormOpen ? renderAircraftSpecModal(state) : "";

  return `
    ${tabNavigation}
    <div style="width: 100%; ${tab !== 'konetyypit' ? 'max-width: 800px;' : ''}">
      ${contentHtml}
    </div>
    ${modalHtml}
  `;
}

function renderAircraftSpecModal(state) {
  const formContent = `
    ${UI.Input({ label: t(state, "aircraft.model_name"), name: "name", required: true, placeholder: t(state, "aircraft.placeholder_name") })}
    ${UI.Input({ label: t(state, "aircraft.real_span_m"), name: "realSpanM", required: true, type: "number", step: "0.01", placeholder: t(state, "aircraft.placeholder_span") })}
    ${UI.Input({ label: t(state, "aircraft.real_length_m"), name: "realLengthM", required: true, type: "number", step: "0.01", placeholder: t(state, "aircraft.placeholder_length") })}
    <div class="ui-form-actions">
      ${UI.Button({ label: t(state, "aircraft.close"), action: "close-aircraft-spec-form", variant: "small" })}
      ${UI.Button({ label: t(state, "aircraft.add_model"), type: "submit", variant: "primary" })}
    </div>
  `;

  const formPanel = UI.FormPanel({
    action: "add-aircraft-spec",
    id: "aircraft-spec-form",
    className: "aircraft-spec-modal-panel"
  }, formContent);

  return `
    <div class="app-modal-backdrop" data-action="close-aircraft-spec-form">
      <div class="app-modal-shell" role="dialog" aria-modal="true" aria-labelledby="aircraft-spec-modal-title" data-action="none">
        <div class="app-modal-topbar">
          <div>
            <p class="kicker">${t(state, "aircraft.management_kicker")}</p>
            <h3 id="aircraft-spec-modal-title">${t(state, "aircraft.new_model")}</h3>
          </div>
          ${UI.Button({ label: "✕", action: "close-aircraft-spec-form", variant: "small", title: t(state, "aircraft.close") })}
        </div>
        ${formPanel}
      </div>
    </div>
  `;
}
