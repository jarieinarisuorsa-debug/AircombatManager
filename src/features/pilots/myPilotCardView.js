import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { buildScoreCardRows } from "../../logic/scoreCards.js";
import { formatHeatTitle } from "../../logic/competitionFormat.js";
import { isUserAdmin, getCurrentRole, ROLES } from "../../users/roles.js";
import { renderLogbookPanel } from "./components/LogbookPanel.js";
import { t } from "../../utils/i18n.js";

export function renderMyPilotCardView(state) {
  const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";

  // The global login barrier ensures userEmail is present, but we double-check just in case.
  if (!userEmail) return `<p class="muted">${t(state, "my_pilot.login_req")}</p>`;

  let pilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
  
  if (!pilot) {
    const createPanel = UI.Panel({
      kicker: t(state, "my_pilot.welcome"),
      title: t(state, "my_pilot.create_title")
    }, `
      <p style="margin-bottom: 16px;">${t(state, "my_pilot.create_msg1")}</p>
      <p class="muted" style="margin-bottom: 15px;">${t(state, "my_pilot.create_email_info").replace("{email}", escapeHtml(userEmail))}</p>
      ${isUserAdmin(state) ? `
        <div style="background: rgba(255, 165, 0, 0.1); border-left: 3px solid orange; padding: 10px; margin-bottom: 20px; font-size: 0.9rem;">
          ${t(state, "my_pilot.admin_email_warning")}
        </div>
      ` : ""}
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${UI.Button({ label: t(state, "my_pilot.create_btn"), action: "create-own-pilot-card", variant: "primary" })}
        ${UI.Button({ label: t(state, "my_pilot.switch_email_btn"), action: "auth-logout", variant: "dashed danger" })}
      </div>
    `);
    
    return UI.SplitLayout(createPanel, "");
  }

  // --- HAE DATA ---
  const activeEvent = getActiveEvent(state);
  const pilotPlanes = state.aircraft.filter((a) => a.pilotId === pilot.id);
  const entries = activeEvent ? state.entries.filter((e) => e.eventId === activeEvent.id && e.pilotId === pilot.id) : [];
  const hasWw2 = entries.some((e) => e.className === "WWII");
  const hasWwi = entries.some((e) => e.className === "WWI");

  const pageHeader = '';

  // --- VÄLILEHTI 1: PERUSTIEDOT ---
  const avatarPanel = UI.Panel({
    title: t(state, "my_pilot.avatar_title"),
    className: "pilot-card-avatar-panel"
  }, `
    <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 10px;">
      ${pilot.avatarData || pilot.avatarUrl ? 
        `<div style="width: 100px; height: 100px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 2px solid var(--border);"></div>` : 
        `<div style="width: 100px; height: 100px; border-radius: 50%; background: var(--surface-2); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 2.5rem; border: 2px dashed var(--border);">${escapeHtml(pilot.name.charAt(0))}</div>`
      }
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label class="button small" style="cursor: pointer;">
          ${pilot.avatarData || pilot.avatarUrl ? t(state, "my_pilot.avatar_change") : t(state, "my_pilot.avatar_select")}
          <input type="file" id="pilot-avatar-upload" data-pilot-id="${escapeHtml(pilot.id)}" accept="image/*" capture="user" style="display: none;">
        </label>
        ${pilot.avatarData || pilot.avatarUrl ? UI.Button({ label: t(state, "my_pilot.avatar_remove"), action: "remove-pilot-avatar", pilotId: pilot.id, variant: "small danger" }) : ""}
      </div>
    </div>
    <p class="muted" style="font-size: 0.85rem; margin: 0;">${t(state, "my_pilot.avatar_hint")}</p>
  `);

  const detailedInfoForm = UI.FormPanel({
    title: t(state, "my_pilot.info_title"),
    action: "update-pilot-details",
    className: "embedded-form-panel pilot-card-details"
  }, `
    <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}" />
    ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
      ${UI.Input({ label: t(state, "my_pilot.name"), name: "name", value: pilot.name || "", required: true })}
      ${UI.Input({ label: t(state, "my_pilot.country"), name: "country", value: pilot.country || "", placeholder: "FI" })}
      ${UI.Input({ label: t(state, "my_pilot.club"), name: "club", value: pilot.club || "" })}
      ${UI.Input({ label: t(state, "my_pilot.email"), name: "email", type: "email", value: pilot.email || "", placeholder: "nimi@esimerkki.com", readonly: true })}
      <p class="muted" style="font-size: 0.8rem; margin-top: -5px; grid-column: span 1;">${t(state, "my_pilot.email_hint")}</p>
      ${UI.Input({ label: t(state, "my_pilot.phone"), name: "phone", value: pilot.phone || "", placeholder: "+358..." })}
      ${UI.Input({ label: t(state, "my_pilot.license"), name: "license", value: pilot.license || "", placeholder: "esim. FIN-1234" })}
      ${UI.Input({ label: t(state, "my_pilot.address"), name: "address", value: pilot.address || "", placeholder: "Katuosoite, Postinumero, Kaupunki" })}
    `)}
    <div class="ui-form-actions" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px;">
      ${UI.Button({ label: t(state, "my_pilot.save_info"), type: "submit", variant: "primary small" })}
    </div>
  `);


  // --- VÄLILEHTI 2: ILMOITTAUTUMINEN ---
  let registrationPanelContent = "";
  if (activeEvent) {
    const existingReg = state.registrations?.find(r => r.eventId === activeEvent.id && r.pilotId === pilot.id);
    
    let statusPanel = "";
    if (existingReg) {
      const statusLabel = existingReg.status === "pending" ? t(state, "my_pilot.reg_pending") : (existingReg.status === "approved" ? t(state, "my_pilot.reg_approved") : t(state, "my_pilot.reg_rejected"));
      const statusColor = existingReg.status === "pending" ? "orange" : (existingReg.status === "approved" ? "green" : "red");
      
      statusPanel = `
        <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${statusColor}; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0;">${t(state, "my_pilot.reg_status")} <span style="color: ${statusColor}">${statusLabel}</span></h4>
          <p class="muted">${t(state, "my_pilot.reg_classes")} ${existingReg.classes.join(", ")}</p>
        </div>
        <div style="margin-bottom: 20px;">
          ${UI.Button({ label: t(state, "my_pilot.reg_cancel"), action: "cancel-registration", regId: existingReg.id, variant: "small danger" })}
        </div>
      `;
    }

    const selectedClasses = existingReg ? existingReg.classes : [];
    
    const classCheckboxes = (activeEvent.classes || []).map(cls => `
      <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; cursor: pointer;">
        <input type="checkbox" name="class_${cls}" ${selectedClasses.includes(cls) ? "checked" : ""}>
        <span style="font-weight: bold; font-size: 1.1rem;">${escapeHtml(cls)}</span>
      </label>
    `).join("");
    
    const paymentIntentValue = existingReg ? (existingReg.paymentIntent || "paid_in_advance") : "paid_in_advance";
    const paymentOptions = `
      <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0;">${t(state, "my_pilot.pay_method")}</h4>
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer;">
          <input type="radio" name="paymentIntent" value="paid_in_advance" ${paymentIntentValue === "paid_in_advance" ? "checked" : ""}>
          <span>${t(state, "my_pilot.pay_advance")}</span>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="radio" name="paymentIntent" value="pay_on_site" ${paymentIntentValue === "pay_on_site" ? "checked" : ""}>
          <span>${t(state, "my_pilot.pay_onsite")}</span>
        </label>
      </div>
    `;

    registrationPanelContent = `
      ${statusPanel}
      ${UI.FormPanel({ action: "submit-registration" }, `
        <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}">
        <input type="hidden" name="eventId" value="${escapeHtml(activeEvent.id)}">
        <p class="muted" style="margin-bottom: 15px;">${existingReg ? t(state, "my_pilot.reg_edit_hint") : t(state, "my_pilot.reg_new_hint")}</p>
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 6px;">
          <h4 style="margin: 0 0 10px 0;">${t(state, "my_pilot.comp_classes")}</h4>
          ${classCheckboxes}
        </div>
        ${paymentOptions}
        ${UI.Button({ label: existingReg ? t(state, "my_pilot.reg_update") : t(state, "my_pilot.reg_submit"), type: "submit", variant: "primary" })}
      `)}
    `;
  }

  const registrationPanel = activeEvent ? UI.Panel({ title: t(state, "my_pilot.reg_title"), kicker: escapeHtml(activeEvent.name), className: "pilot-card-registration" }, registrationPanelContent) : UI.Panel({ title: t(state, "my_pilot.reg_title") }, `<p class="muted">${t(state, "my_pilot.reg_no_event")}</p>`);

  // --- VÄLILEHTI 3: KONEKORTIT ---
  const editingAircraftId = state.settings?.editingAircraftId;

  const renderScaleCheckboxes = (modelPoints = {}) => {
    return UI.Panel({ title: t(state, "my_pilot.wwi_bonus_title"), kicker: t(state, "my_pilot.yes_no"), style: "margin-top: 15px; border: 1px solid var(--border); padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.1);" }, `
      ${UI.Grid({ columns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }, `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_fourStroke" ${modelPoints.fourStroke ? "checked" : ""}> ${t(state, "my_pilot.four_stroke")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_multiwing" ${modelPoints.multiwing ? "checked" : ""}> ${t(state, "my_pilot.multiwing")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_ribStructure" ${modelPoints.ribStructure ? "checked" : ""}> ${t(state, "my_pilot.ribs")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_onboardPilot" ${modelPoints.onboardPilot ? "checked" : ""}> ${t(state, "my_pilot.pilot_in_cockpit")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_weapons" ${modelPoints.weapons ? "checked" : ""}> ${t(state, "my_pilot.weapons")}
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_riggingStruts" ${modelPoints.riggingStruts ? "checked" : ""}> ${t(state, "my_pilot.rigging")}
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
            ${UI.Input({ label: t(state, "my_pilot.ac_name"), name: "name", required: true, value: plane.name })}
            ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
              ${UI.Select({ label: t(state, "my_pilot.ac_class"), name: "className", value: plane.className, options: ["WWII", "WWI", "EPA"] })}
              ${UI.Select({ label: t(state, "my_pilot.ac_engine"), name: "engine", value: plane.engine, options: ["Combustion", "Electric", "Other"] })}
            `)}
            ${UI.Grid({ columns: "1fr 1fr 1fr", gap: "10px", style: "margin-top: 10px;" }, `
              ${UI.Input({ label: t(state, "my_pilot.ac_engine_model"), name: "engineModel", placeholder: "esim. O.S. 15", value: plane.engineModel || "" })}
              ${UI.Input({ label: t(state, "my_pilot.ac_battery"), name: "battery", placeholder: "esim. 3S 1300mAh", value: plane.battery || "" })}
              ${UI.Input({ label: t(state, "my_pilot.ac_propeller"), name: "propeller", placeholder: "esim. 8x4", value: plane.propeller || "" })}
            `)}
            ${renderScaleCheckboxes(plane.modelPoints)}
          `)}
          <div class="ui-form-actions" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
            ${UI.Button({ label: t(state, "my_pilot.cancel"), action: "cancel-edit-aircraft", variant: "small" })}
            ${UI.Button({ label: t(state, "my_pilot.save_changes"), type: "submit", variant: "primary small" })}
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
            ${UI.Button({ label: t(state, "my_pilot.edit"), action: "edit-aircraft", aircraftId: plane.id, variant: "small dashed" })}
            ${UI.Button({ label: t(state, "my_pilot.delete"), action: "delete-aircraft", aircraftId: plane.id, variant: "small danger" })}
          </div>
        </div>
      `;
    }).join("")
  ) : `<p class="ui-card-muted">${t(state, "my_pilot.no_aircraft")}</p>`;

  const addAircraftButton = editingAircraftId ? "" : UI.Button({ id: `toggle-add-aircraft-btn-${pilot.id}`, label: t(state, "my_pilot.add_aircraft_btn"), action: "toggle-add-aircraft-form", pilotId: pilot.id, variant: "primary dashed", style: "margin-top: 15px;" });

  const addAircraftForm = editingAircraftId ? "" : UI.FormPanel({
    title: t(state, "my_pilot.add_aircraft_title"),
    action: "add-aircraft",
    id: `add-aircraft-form-${pilot.id}`,
    className: "embedded-form-panel",
    style: "display: none; margin-top: 10px;"
  }, `
    <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}" />
    ${UI.Grid({ columns: "1fr", gap: "10px" }, `
      ${UI.Input({ label: t(state, "my_pilot.ac_name"), name: "name", required: true, placeholder: "esim. Fokker Dr.I" })}
      ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
        ${UI.Select({ label: t(state, "my_pilot.ac_class"), name: "className", options: ["WWII", "WWI", "EPA"] })}
        ${UI.Select({ label: t(state, "my_pilot.ac_engine"), name: "engine", options: ["Combustion", "Electric", "Other"] })}
      `)}
      ${UI.Grid({ columns: "1fr 1fr 1fr", gap: "10px", style: "margin-top: 10px;" }, `
        ${UI.Input({ label: t(state, "my_pilot.ac_engine_model"), name: "engineModel", placeholder: "esim. O.S. 15" })}
        ${UI.Input({ label: t(state, "my_pilot.ac_battery"), name: "battery", placeholder: "esim. 3S 1300mAh" })}
        ${UI.Input({ label: t(state, "my_pilot.ac_propeller"), name: "propeller", placeholder: "esim. 8x4" })}
      `)}
      ${renderScaleCheckboxes()}
    `)}
    <div class="ui-form-actions" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
      ${UI.Button({ label: t(state, "my_pilot.cancel"), action: "toggle-add-aircraft-form", pilotId: pilot.id, variant: "small" })}
      ${UI.Button({ label: t(state, "my_pilot.save_aircraft"), type: "submit", variant: "primary small" })}
    </div>
  `);

  const aircraftPanel = UI.Panel({ title: t(state, "my_pilot.aircraft_title"), kicker: t(state, "my_pilot.aircraft_kicker"), className: "pilot-card-planes" }, `
    <p class="muted">${t(state, "my_pilot.aircraft_hint")}</p>
    ${planesList}
    ${addAircraftButton}
    ${addAircraftForm}
  `);

  // --- VÄLILEHTI 4: KILPAILUTAPAHTUMAT ---
  let myHeatsContent = `<p class="muted">${t(state, "my_pilot.no_heats")}</p>`;
  if (activeEvent && state.heats.some(h => h.eventId === activeEvent.id)) {
    const myHeats = state.heats.filter(h => h.eventId === activeEvent.id && (h.pilotIds || []).includes(pilot.id));
    if (myHeats.length > 0) {
      myHeatsContent = `<ul style="list-style: none; padding: 0; margin: 0;">` + myHeats.map(h => `
        <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
          <strong>${escapeHtml(formatHeatTitle(h, state))}</strong>
        </li>
      `).join('') + `</ul>`;
    }
  }

  const myScoreCardsContent = (() => {
    if (!activeEvent) return `<p class="muted">${t(state, "my_pilot.no_active_event")}</p>`;
    const rows = buildScoreCardRows(state, activeEvent);
    const myRows = rows.filter(r => r.entry.pilotId === pilot.id);
    if (myRows.length === 0) return `<p class="muted">${t(state, "my_pilot.no_scorecards")}</p>`;
    
    return `<div class="stack">` + myRows.map(row => `
      <div style="background: var(--surface-2); border: 1px solid var(--border); padding: 15px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">${escapeHtml(row.className)}</h3>
          <span class="badge ${row.card?.updatedAt ? "badge-saved" : "badge-empty"}">${row.card?.updatedAt ? t(state, "my_pilot.saved") : t(state, "my_pilot.no_results")}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">${t(state, "my_pilot.total_points")}</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--success);">${row.totals.totalPoints}</div>
          </div>
          <div style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">${t(state, "my_pilot.cuts")}</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--danger);">${row.totals.totalCuts}</div>
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <a href="#/scorecard/${escapeHtml(row.entry.id)}" class="button dashed" style="flex: 1; text-align: center;">${t(state, "my_pilot.open_scorecard")}</a>
          <button type="button" class="button primary" data-action="show-qr-code" data-entry-id="${escapeHtml(row.entry.id)}" style="flex: 1;">${t(state, "my_pilot.show_qr")}</button>
        </div>
      </div>
    `).join('') + `</div>`;
  })();

  const heatsPanel = UI.Panel({ title: t(state, "my_pilot.heats_title"), kicker: t(state, "my_pilot.heats_kicker") }, myHeatsContent);
  const scoreCardsPanel = UI.Panel({ title: t(state, "my_pilot.scores_title"), kicker: t(state, "my_pilot.scores_kicker"), style: "margin-top: 20px;" }, myScoreCardsContent);
  const eventPanel = heatsPanel + scoreCardsPanel;

  // --- RAKENNA VÄLILEHDET ---
  const tab = window.MY_PILOT_CARD_TAB || 'perustiedot';

  // --- VÄLILEHTI 5: LENTOPÄIVÄKIRJA ---
  let logbookContent = "";
  if (tab === 'logbook') {
    logbookContent = renderLogbookPanel(state, pilot);
  }

  // --- VÄLILEHTI 6: POISTA TILI ---
  let deleteAccountContent = "";
  if (tab === 'poista') {
    deleteAccountContent = UI.FormPanel({
      title: t(state, "my_pilot.del_acc_title"),
      action: "delete-account-with-password",
      className: "pilot-card-danger-zone",
      style: "border: 1px solid var(--danger); background: rgba(255,0,0,0.05);"
    }, `
      <p style="margin-bottom: 20px;">${t(state, "my_pilot.del_acc_msg")}</p>
      <div style="margin-bottom: 20px; max-width: 300px;">
        ${UI.Input({ label: t(state, "auth.password") || "Salasana", name: "password", type: "password", required: true, autocomplete: "current-password" })}
      </div>
      <div style="display: flex; gap: 10px;">
        ${UI.Button({ label: t(state, "my_pilot.del_acc_btn"), type: "submit", variant: "danger" })}
      </div>
    `);
  }

  // --- RAKENNA VÄLILEHDET ---
  const tabNavigation = `
    <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'perustiedot' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="perustiedot">${t(state, "my_pilot.tab_basic")}</button>
      <button type="button" class="button ${tab === 'ilmoittautuminen' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="ilmoittautuminen">${t(state, "my_pilot.tab_reg")}</button>
      <button type="button" class="button ${tab === 'konekortit' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="konekortit">${t(state, "my_pilot.tab_ac").replace("{count}", pilotPlanes.length)}</button>
      <button type="button" class="button ${tab === 'kilpailu' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="kilpailu">${t(state, "my_pilot.tab_comp")}</button>
      <button type="button" class="button ${tab === 'logbook' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="logbook">${t(state, "my_pilot.tab_logbook")}</button>
      <button type="button" class="button ${tab === 'poista' ? 'danger' : 'dashed danger'}" data-action="set-my-pilot-tab" data-tab="poista">${t(state, "my_pilot.del_acc_btn") || "Poista tili"}</button>
    </div>
  `;

  let tabContent = "";
  if (tab === 'perustiedot') {
    tabContent = `<div class="stack">${avatarPanel}${detailedInfoForm}</div>`;
  } else if (tab === 'ilmoittautuminen') {
    tabContent = `<div class="stack">${registrationPanel}</div>`;
  } else if (tab === 'konekortit') {
    tabContent = `<div class="stack">${aircraftPanel}</div>`;
  } else if (tab === 'kilpailu') {
    tabContent = `<div class="stack">${eventPanel}</div>`;
  } else if (tab === 'logbook') {
    tabContent = logbookContent;
  } else if (tab === 'poista') {
    tabContent = deleteAccountContent;
  }

  return `
    ${pageHeader}
    ${tabNavigation}
    ${tabContent}
  `;
}
