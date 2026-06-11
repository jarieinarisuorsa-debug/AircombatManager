import { isUserAdmin } from "../../users/roles.js";
import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { renderLogbookPanel } from "./components/LogbookPanel.js";
import { getRouteParam } from "../../router.js";
import { t } from "../../utils/i18n.js";

export function renderPilotCardView(state) {
  const pilotId = getRouteParam();
  const isNew = pilotId === "new";
  const pilot = isNew ? { id: "new", name: "", country: "", club: "", email: "", phone: "", license: "", address: "" } : state.pilots.find(p => p.id === pilotId);
  
  if (!pilot) {
    return UI.Panel({ title: t(state, "pilot.not_found_title") }, `
      <p class="muted">${t(state, "pilot.not_found_msg")}</p>
      <a href="#/pilots" class="button primary">${t(state, "pilot.back_to_list")}</a>
    `);
  }

  const activeEvent = getActiveEvent(state);
  const pilotPlanes = state.aircraft.filter((a) => a.pilotId === pilot.id);
  const entries = activeEvent ? state.entries.filter((e) => e.eventId === activeEvent.id && e.pilotId === pilot.id) : [];
  const hasWw2 = entries.some((e) => e.className === "WWII");
  const hasWwi = entries.some((e) => e.className === "WWI");

  const backButton = isNew ? "" : (activeEvent 
    ? `<a href="#/entries" class="button small dashed">${t(state, "pilot.back_to_event")}</a><a href="#/pilots" class="button small dashed">${t(state, "pilot.all_pilots")}</a>`
    : `<a href="#/pilots" class="button small dashed">${t(state, "pilot.back")}</a>`);

  const deleteButton = isNew ? "" : UI.Button({ label: t(state, "pilot.delete"), action: "delete-pilot", pilotId: pilot.id, variant: "danger small" });

  const editingAircraftId = state.settings?.editingAircraftId;

  const renderScaleCheckboxes = (modelPoints = {}) => {
    return UI.Panel({ title: t(state, "aircraft.wwi_scale_bonus"), kicker: t(state, "common.yes_no"), style: "margin-top: 15px; border: 1px solid var(--border); padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.1);" }, `
      ${UI.Grid({ columns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }, `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_fourStroke" ${modelPoints.fourStroke ? "checked" : ""}> ${t(state, "aircraft.four_stroke")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_multiwing" ${modelPoints.multiwing ? "checked" : ""}> ${t(state, "aircraft.multiwing")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_ribStructure" ${modelPoints.ribStructure ? "checked" : ""}> ${t(state, "aircraft.rib_structure")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_onboardPilot" ${modelPoints.onboardPilot ? "checked" : ""}> ${t(state, "aircraft.onboard_pilot")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_weapons" ${modelPoints.weapons ? "checked" : ""}> ${t(state, "aircraft.weapons")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_riggingStruts" ${modelPoints.riggingStruts ? "checked" : ""}> ${t(state, "aircraft.rigging_struts")}
        </label>
      `)}
    `);
  };

  const planesList = pilotPlanes.length > 0 ? UI.Grid({ columns: "1fr", gap: "6px" }, 
    pilotPlanes.map(plane => {
      if (editingAircraftId === plane.id) {
        return UI.FormPanel({ action: "update-aircraft", className: "embedded-form-panel", style: "grid-column: 1 / -1; border: 2px solid var(--primary-color); border-radius: 8px; padding: 10px; margin-bottom: 10px;" }, `
          <input type="hidden" name="aircraftId" value="${escapeHtml(plane.id)}" />
          ${UI.Grid({ columns: "1fr", gap: "10px" }, `
            ${UI.Input({ label: t(state, "aircraft.name"), name: "name", required: true, value: plane.name })}
            ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
              ${UI.Select({ label: t(state, "aircraft.class"), name: "className", value: plane.className, options: ["WWII", "WWI", "EPA"] })}
              ${UI.Select({ label: t(state, "aircraft.power"), name: "engine", value: plane.engine, options: ["Combustion", "Electric", "Other"] })}
            `)}
            ${UI.Grid({ columns: "1fr 1fr 1fr", gap: "10px", style: "margin-top: 10px;" }, `
              ${UI.Input({ label: t(state, "aircraft.engine_model"), name: "engineModel", placeholder: "e.g. O.S. 15", value: plane.engineModel || "" })}
              ${UI.Input({ label: t(state, "aircraft.battery"), name: "battery", placeholder: "e.g. 3S 1300mAh", value: plane.battery || "" })}
              ${UI.Input({ label: t(state, "aircraft.propeller"), name: "propeller", placeholder: "e.g. 8x4", value: plane.propeller || "" })}
            `)}
            ${renderScaleCheckboxes(plane.modelPoints)}
          `)}
          <div class="ui-form-actions" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
            ${UI.Button({ label: t(state, "common.cancel"), action: "cancel-edit-aircraft", variant: "small" })}
            ${UI.Button({ label: t(state, "common.save_changes"), type: "submit", variant: "primary small" })}
          </div>
        `);
      }

      return `
        <div class="pilot-aircraft-item">
          <div>
            <strong>${escapeHtml(plane.name)}</strong>
            <div class="ui-subline">${escapeHtml(plane.engine)}</div>
          </div>
          <div class="pilot-aircraft-badges" style="display: flex; gap: 6px; align-items: center;">
            <span class="aircraft-mini-badge">${escapeHtml(plane.className)}</span>
            ${UI.Button({ label: t(state, "common.edit"), action: "edit-aircraft", aircraftId: plane.id, variant: "small dashed" })}
            ${UI.Button({ label: t(state, "common.delete"), action: "delete-aircraft", aircraftId: plane.id, variant: "small danger" })}
          </div>
        </div>
      `;
    }).join("")
  ) : `<p class="ui-card-muted">${t(state, "pilot.no_aircraft")}</p>`;

  const addAircraftButton = editingAircraftId ? "" : UI.Button({ id: `toggle-add-aircraft-btn-${pilot.id}`, label: t(state, "pilot.add_aircraft"), action: "toggle-add-aircraft-form", pilotId: pilot.id, variant: "primary dashed", style: "margin-top: 15px;" });

  const addAircraftForm = editingAircraftId ? "" : UI.FormPanel({
    title: t(state, "pilot.add_aircraft_title"),
    action: "add-aircraft",
    id: `add-aircraft-form-${pilot.id}`,
    className: "embedded-form-panel",
    style: "display: none; margin-top: 10px;"
  }, `
    <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}" />
    ${UI.Grid({ columns: "1fr", gap: "10px" }, `
      ${UI.Input({ label: t(state, "aircraft.name"), name: "name", required: true, placeholder: "e.g. Fokker Dr.I" })}
      ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
        ${UI.Select({ label: t(state, "aircraft.class"), name: "className", options: ["WWII", "WWI", "EPA"] })}
        ${UI.Select({ label: t(state, "aircraft.power"), name: "engine", options: ["Combustion", "Electric", "Other"] })}
      `)}
      ${UI.Grid({ columns: "1fr 1fr 1fr", gap: "10px", style: "margin-top: 10px;" }, `
        ${UI.Input({ label: t(state, "aircraft.engine_model"), name: "engineModel", placeholder: "e.g. O.S. 15" })}
        ${UI.Input({ label: t(state, "aircraft.battery"), name: "battery", placeholder: "e.g. 3S 1300mAh" })}
        ${UI.Input({ label: t(state, "aircraft.propeller"), name: "propeller", placeholder: "e.g. 8x4" })}
      `)}
      ${renderScaleCheckboxes()}
    `)}
    <div class="ui-form-actions" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
      ${UI.Button({ label: t(state, "common.cancel"), action: "toggle-add-aircraft-form", pilotId: pilot.id, variant: "small" })}
      ${UI.Button({ label: t(state, "pilot.save_aircraft"), type: "submit", variant: "primary small" })}
    </div>
  `);

  const aircraftPanel = UI.Panel({ title: t(state, "pilot.aircraft_cards"), kicker: t(state, "common.additional_info"), className: "pilot-card-planes" }, `
    <p class="muted">${t(state, "pilot.aircraft_help")}</p>
    ${planesList}
    ${addAircraftButton}
    ${addAircraftForm}
  `);

  const registrationPanel = activeEvent ? UI.Panel({ title: t(state, "pilot.registration"), kicker: escapeHtml(activeEvent.name), className: "pilot-card-registration" }, `
    <p class="muted registration-help">${t(state, "pilot.registration_help")}</p>
    ${UI.Flex({ gap: "10px", className: "registration-toggle-row" }, `
      ${UI.Button({ label: hasWw2 ? t(state, "pilot.wwii_joined") : t(state, "pilot.join_wwii"), action: "toggle-class-entry", pilotId: pilot.id, class: "WWII", className: "registration-toggle-button", variant: hasWw2 ? "success" : "" })}
      ${UI.Button({ label: hasWwi ? t(state, "pilot.wwi_joined") : t(state, "pilot.join_wwi"), action: "toggle-class-entry", pilotId: pilot.id, class: "WWI", className: "registration-toggle-button", variant: hasWwi ? "success" : "" })}
    `)}
  `) : UI.Panel({ title: t(state, "pilot.registration") }, `<p class="muted">${t(state, "pilot.registration_no_event")}</p>`);

  const detailedInfoForm = UI.FormPanel({
    title: t(state, "pilot.details"),
    action: isNew ? "add-pilot" : "update-pilot-details",
    className: "embedded-form-panel pilot-card-details",
    autocomplete: "off"
  }, `
    <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}" />
    ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
      ${UI.Input({ label: t(state, "pilot.name"), name: "name", value: pilot.name || "", required: true })}
      ${UI.Input({ label: t(state, "pilot.country"), name: "country", value: pilot.country || "", placeholder: "e.g. SE, DE" })}
      ${UI.Input({ label: t(state, "pilot.club"), name: "club", value: pilot.club || "" })}
      ${UI.Input({ label: t(state, "pilot.email"), name: "email", type: "email", value: pilot.email || "", placeholder: "name@example.com", className: "blur-sensitive" })}
      ${UI.Input({ label: t(state, "pilot.phone"), name: "phone", value: pilot.phone || "", placeholder: "+123...", className: "blur-sensitive" })}
      ${UI.Input({ label: t(state, "pilot.license"), name: "license", value: pilot.license || "", placeholder: "e.g. ABC-1234" })}
      ${UI.Input({ label: t(state, "pilot.address"), name: "address", value: pilot.address || "", placeholder: "Street Address, Zip, City" })}
    `)}
    <div class="ui-form-actions" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
      ${deleteButton}
      <div style="display: flex; gap: 10px;">
        ${UI.Button({ label: t(state, "common.cancel"), type: "button", action: "cancel-pilot-edit", pilotId: pilot.id, variant: "outline small" })}
        ${UI.Button({ label: isNew ? t(state, "pilot.save_new") : t(state, "pilot.save_details"), type: "submit", variant: "primary small" })}
      </div>
    </div>
  `);

  const tab = window.PILOT_CARD_TAB || 'perustiedot';

  const tabNavigation = `
    <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
      <div class="ui-tabs-container">
        <div class="ui-tabs desktop-only" style="display: flex; gap: 10px; overflow-x: auto;">
          <button type="button" class="button ${tab === 'perustiedot' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="perustiedot">${t(state, "pilot.tab_basics")}</button>
          <button type="button" class="button ${tab === 'ilmoittautuminen' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="ilmoittautuminen" ${isNew ? `disabled title="${t(state, "pilot.save_first")}"` : ''}>${t(state, "pilot.registration")}</button>
          <button type="button" class="button ${tab === 'konekortit' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="konekortit" ${isNew ? `disabled title="${t(state, "pilot.save_first")}"` : ''}>${t(state, "pilot.aircraft_cards")} (${pilotPlanes.length})</button>
          <button type="button" class="button ${tab === 'logbook' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="logbook" ${isNew ? `disabled title="${t(state, "pilot.save_first")}"` : ''}>${t(state, "pilot.tab_logbook")}</button>
        </div>
        <div class="ui-tabs-mobile mobile-only">
          <select class="tab-select" data-action="set-pilot-card-tab">
            <option value="perustiedot" ${tab === 'perustiedot' ? 'selected' : ''}>${t(state, "pilot.tab_basics")}</option>
            <option value="ilmoittautuminen" ${tab === 'ilmoittautuminen' ? 'selected' : ''} ${isNew ? 'disabled' : ''}>${t(state, "pilot.registration")}</option>
            <option value="konekortit" ${tab === 'konekortit' ? 'selected' : ''} ${isNew ? 'disabled' : ''}>${t(state, "pilot.aircraft_cards")} (${pilotPlanes.length})</option>
            <option value="logbook" ${tab === 'logbook' ? 'selected' : ''} ${isNew ? 'disabled' : ''}>${t(state, "pilot.tab_logbook")}</option>
          </select>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        ${backButton}
      </div>
    </div>
  `;

  let tabContent = "";
  if (tab === 'perustiedot') {
    tabContent = UI.Grid({ columns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }, `
      ${detailedInfoForm}
    `);
  } else if (tab === 'ilmoittautuminen' && !isNew) {
    tabContent = UI.Grid({ columns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }, `
      ${registrationPanel}
    `);
  } else if (tab === 'konekortit' && !isNew) {
    tabContent = UI.Grid({ columns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }, `
      ${aircraftPanel}
    `);
  } else if (tab === 'logbook' && !isNew) {
    tabContent = renderLogbookPanel(state, pilot);
  } else if (isNew) {
    tabContent = UI.Grid({ columns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }, `
      ${detailedInfoForm}
    `);
  }

  return `
    ${tabNavigation}
    ${tabContent}
  `;
}
