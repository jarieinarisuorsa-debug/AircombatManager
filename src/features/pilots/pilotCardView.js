import { isUserAdmin } from "../../users/roles.js";
import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { renderLogbookPanel } from "./components/LogbookPanel.js";
import { getRouteParam } from "../../router.js";

export function renderPilotCardView(state) {
  const pilotId = getRouteParam();
  const isNew = pilotId === "new";
  const pilot = isNew ? { id: "new", name: "", country: "FI", club: "", email: "", phone: "", license: "", address: "" } : state.pilots.find(p => p.id === pilotId);
  
  if (!pilot) {
    return UI.Panel({ title: "Pilottia ei löytynyt" }, `
      <p class="muted">Tätä pilottia ei ole olemassa tai se on poistettu.</p>
      <a href="#/pilots" class="button primary">Takaisin pilottilistalle</a>
    `);
  }

  const activeEvent = getActiveEvent(state);
  const pilotPlanes = state.aircraft.filter((a) => a.pilotId === pilot.id);
  const entries = activeEvent ? state.entries.filter((e) => e.eventId === activeEvent.id && e.pilotId === pilot.id) : [];
  const hasWw2 = entries.some((e) => e.className === "WWII");
  const hasWwi = entries.some((e) => e.className === "WWI");

  const backButton = activeEvent 
    ? `<a href="#/entries" class="button small" style="margin-right: 5px;">⬅ Työympäristöön</a><a href="#/pilots" class="button small">Kaikki pilotit</a>`
    : `<a href="#/pilots" class="button small">⬅ Takaisin</a>`;
    
  const pageHeader = UI.PageHeader({
    kicker: "Pilottikortti",
    title: pilot.name,
    subtitle: activeEvent ? `Aktiivinen kilpailu: ${activeEvent.name}` : "Ei aktiivista kilpailua",
    headerActions: backButton
  });

  const deleteButton = isNew ? "" : UI.Button({ label: "Poista pilotti", action: "delete-pilot", pilotId: pilot.id, variant: "danger small" });

  const editingAircraftId = state.settings?.editingAircraftId;

  const renderScaleCheckboxes = (modelPoints = {}) => {
    return UI.Panel({ title: "WWI Skaalabonukset", kicker: "Kyllä/Ei", style: "margin-top: 15px; border: 1px solid var(--border); padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.1);" }, `
      ${UI.Grid({ columns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }, `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_fourStroke" ${modelPoints.fourStroke ? "checked" : ""}> Nelitahtimoottori
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_multiwing" ${modelPoints.multiwing ? "checked" : ""}> Monitaso (Multiwing)
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_ribStructure" ${modelPoints.ribStructure ? "checked" : ""}> Siipirakenne (Kaaret)
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_onboardPilot" ${modelPoints.onboardPilot ? "checked" : ""}> Pilotti ohjaamossa
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_weapons" ${modelPoints.weapons ? "checked" : ""}> Aseistus
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
          <input type="checkbox" name="modelPoints_riggingStruts" ${modelPoints.riggingStruts ? "checked" : ""}> Tuet ja vaijerit
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
            ${UI.Input({ label: "Koneen nimi", name: "name", required: true, value: plane.name })}
            ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
              ${UI.Select({ label: "Koneen luokkamerkintä", name: "className", value: plane.className, options: ["WWII", "WWI", "EPA"] })}
              ${UI.Select({ label: "Käyttövoima", name: "engine", value: plane.engine, options: ["Combustion", "Electric", "Other"] })}
            `)}
            ${UI.Grid({ columns: "1fr 1fr 1fr", gap: "10px", style: "margin-top: 10px;" }, `
              ${UI.Input({ label: "Moottori (malli)", name: "engineModel", placeholder: "esim. O.S. 15", value: plane.engineModel || "" })}
              ${UI.Input({ label: "Akku", name: "battery", placeholder: "esim. 3S 1300mAh", value: plane.battery || "" })}
              ${UI.Input({ label: "Potkuri", name: "propeller", placeholder: "esim. 8x4", value: plane.propeller || "" })}
            `)}
            ${renderScaleCheckboxes(plane.modelPoints)}
          `)}
          <div class="ui-form-actions" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
            ${UI.Button({ label: "Peruuta", action: "cancel-edit-aircraft", variant: "small" })}
            ${UI.Button({ label: "Tallenna muutokset", type: "submit", variant: "primary small" })}
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
            ${UI.Button({ label: "Muokkaa", action: "edit-aircraft", aircraftId: plane.id, variant: "small dashed" })}
            ${UI.Button({ label: "Poista", action: "delete-aircraft", aircraftId: plane.id, variant: "small danger" })}
          </div>
        </div>
      `;
    }).join("")
  ) : `<p class="ui-card-muted">Ei rekisteröityjä koneita.</p>`;

  const addAircraftButton = editingAircraftId ? "" : UI.Button({ id: `toggle-add-aircraft-btn-${pilot.id}`, label: "+ Lisää konekortti", action: "toggle-add-aircraft-form", pilotId: pilot.id, variant: "primary dashed", style: "margin-top: 15px;" });

  const addAircraftForm = editingAircraftId ? "" : UI.FormPanel({
    title: "Lisää konekortti",
    action: "add-aircraft",
    id: `add-aircraft-form-${pilot.id}`,
    className: "embedded-form-panel",
    style: "display: none; margin-top: 10px;"
  }, `
    <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}" />
    ${UI.Grid({ columns: "1fr", gap: "10px" }, `
      ${UI.Input({ label: "Koneen nimi", name: "name", required: true, placeholder: "esim. Fokker Dr.I" })}
      ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
        ${UI.Select({ label: "Koneen luokkamerkintä", name: "className", options: ["WWII", "WWI", "EPA"] })}
        ${UI.Select({ label: "Käyttövoima", name: "engine", options: ["Combustion", "Electric", "Other"] })}
      `)}
      ${UI.Grid({ columns: "1fr 1fr 1fr", gap: "10px", style: "margin-top: 10px;" }, `
        ${UI.Input({ label: "Moottori (malli)", name: "engineModel", placeholder: "esim. O.S. 15" })}
        ${UI.Input({ label: "Akku", name: "battery", placeholder: "esim. 3S 1300mAh" })}
        ${UI.Input({ label: "Potkuri", name: "propeller", placeholder: "esim. 8x4" })}
      `)}
      ${renderScaleCheckboxes()}
    `)}
    <div class="ui-form-actions" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
      ${UI.Button({ label: "Peruuta", action: "toggle-add-aircraft-form", pilotId: pilot.id, variant: "small" })}
      ${UI.Button({ label: "Tallenna kone", type: "submit", variant: "primary small" })}
    </div>
  `);

  const aircraftPanel = UI.Panel({ title: "Konekortit", kicker: "Lisätieto", className: "pilot-card-planes" }, `
    <p class="muted">Konekortti on lisätieto ja katsastuksen apu. Kilpailuluokka määräytyy ilmoittautumisesta, ei konekortista.</p>
    ${planesList}
    ${addAircraftButton}
    ${addAircraftForm}
  `);

  const registrationPanel = activeEvent ? UI.Panel({ title: "Ilmoittautuminen", kicker: escapeHtml(activeEvent.name), className: "pilot-card-registration" }, `
    <p class="muted registration-help">Voit ilmoittaa pilotin mukaan tai poistaa ilmoittautumisen painamalla alta luokkaa.</p>
    ${UI.Flex({ gap: "10px", className: "registration-toggle-row" }, `
      ${UI.Button({ label: hasWw2 ? "✔️ WWII Mukana" : "+ Ilmoita WWII", action: "toggle-class-entry", pilotId: pilot.id, class: "WWII", className: "registration-toggle-button", variant: hasWw2 ? "success" : "" })}
      ${UI.Button({ label: hasWwi ? "✔️ WWI Mukana" : "+ Ilmoita WWI", action: "toggle-class-entry", pilotId: pilot.id, class: "WWI", className: "registration-toggle-button", variant: hasWwi ? "success" : "" })}
    `)}
  `) : UI.Panel({ title: "Ilmoittautuminen" }, `<p class="muted">Valitse aktiivinen kilpailu kojelaudalta voidaksesi ilmoittaa pilotin mukaan.</p>`);

  const detailedInfoForm = UI.FormPanel({
    title: "Pilotin tiedot",
    action: isNew ? "add-pilot" : "update-pilot-details",
    className: "embedded-form-panel pilot-card-details",
    autocomplete: "off"
  }, `
    <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}" />
    ${UI.Grid({ columns: "1fr 1fr", gap: "10px" }, `
      ${UI.Input({ label: "Nimi", name: "name", value: pilot.name || "", required: true })}
      ${UI.Input({ label: "Maa", name: "country", value: pilot.country || "", placeholder: "FI" })}
      ${UI.Input({ label: "Seura", name: "club", value: pilot.club || "" })}
      ${UI.Input({ label: "Sähköpostiosoite", name: "email", type: "email", value: pilot.email || "", placeholder: "nimi@esimerkki.com" })}
      ${UI.Input({ label: "Puhelinnumero", name: "phone", value: pilot.phone || "", placeholder: "+358..." })}
      ${UI.Input({ label: "FAI / Kansallinen lisenssi", name: "license", value: pilot.license || "", placeholder: "esim. FIN-1234" })}
      ${UI.Input({ label: "Postiosoite", name: "address", value: pilot.address || "", placeholder: "Katuosoite, Postinumero, Kaupunki" })}
    `)}
    <div class="ui-form-actions" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
      ${deleteButton}
      ${UI.Button({ label: isNew ? "Tallenna uusi pilotti" : "Tallenna tiedot", type: "submit", variant: "primary small" })}
    </div>
  `);

  const tab = window.PILOT_CARD_TAB || 'perustiedot';

  const tabNavigation = `
    <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'perustiedot' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="perustiedot">Perustiedot</button>
      <button type="button" class="button ${tab === 'ilmoittautuminen' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="ilmoittautuminen" ${isNew ? 'disabled title="Tallenna uusi pilotti ensin"' : ''}>Ilmoittautuminen</button>
      <button type="button" class="button ${tab === 'konekortit' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="konekortit" ${isNew ? 'disabled title="Tallenna uusi pilotti ensin"' : ''}>Konekortit (${pilotPlanes.length})</button>
      <button type="button" class="button ${tab === 'logbook' ? 'primary' : 'dashed'}" data-action="set-pilot-card-tab" data-tab="logbook" ${isNew ? 'disabled title="Tallenna uusi pilotti ensin"' : ''}>Lentopäiväkirja</button>
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
    ${pageHeader}
    ${tabNavigation}
    ${tabContent}
  `;
}
