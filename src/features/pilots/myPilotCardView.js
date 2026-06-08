import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { buildScoreCardRows } from "../../logic/scoreCards.js";
import { isUserAdmin, getCurrentRole, ROLES } from "../../users/roles.js";
import { renderLogbookPanel } from "./components/LogbookPanel.js";

export function renderMyPilotCardView(state) {
  const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";

  // The global login barrier ensures userEmail is present, but we double-check just in case.
  if (!userEmail) return `<p class="muted">Kirjautuminen vaaditaan.</p>`;

  let pilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
  
  // Admin preview mode: if an admin switches to public role but has no pilot profile, show the first pilot as a demo.
  let isPreview = false;
  if (!pilot && isUserAdmin(state) && state.pilots.length > 0) {
    pilot = state.pilots[0];
    isPreview = true;
  }

  if (!pilot) {
    if (getCurrentRole(state) === ROLES.PILOT) {
      const createPanel = UI.Panel({
        kicker: "Tervetuloa",
        title: "Luo pilottikorttisi"
      }, `
        <p style="margin-bottom: 16px;">Ylläpito on myöntänyt sinulle pilotin oikeudet, mutta sinulta puuttuu vielä oma pilottikortti.</p>
        <p class="muted" style="margin-bottom: 24px;">Luo pilottikortti napin painalluksella, jotta pääset täydentämään omat tietosi ja lisäämään konekortteja!</p>
        ${UI.Button({ label: "Luo pilottikorttini nyt", action: "create-own-pilot-card", variant: "primary" })}
      `);
      return UI.PageHeader({
        kicker: "Pilotti",
        title: "Oma pilottikortti"
      }) + UI.SplitLayout(createPanel, "");
    }

    const notFoundPanel = UI.Panel({
      kicker: "Tunnistautuminen",
      title: "Pilottia ei löytynyt"
    }, `
      <p style="margin-bottom: 16px;">Sähköpostiosoitteella <strong>${escapeHtml(userEmail)}</strong> ei löytynyt pilottia rekisteristä.</p>
      <p class="muted" style="margin-bottom: 24px;">Pyydä kilpailun järjestäjää lisäämään sähköpostiosoitteesi pilottitietoihisi, tai yritä toisella sähköpostiosoitteella.</p>
      ${UI.Button({ label: "Vaihda sähköpostia / Kirjaudu ulos", action: "auth-logout", variant: "small" })}
    `);

    return UI.PageHeader({
      kicker: "Julkinen",
      title: "Oma pilottikortti"
    }) + UI.SplitLayout(notFoundPanel, "");
  }

  // --- HAE DATA ---
  const activeEvent = getActiveEvent(state);
  const pilotPlanes = state.aircraft.filter((a) => a.pilotId === pilot.id);
  const entries = activeEvent ? state.entries.filter((e) => e.eventId === activeEvent.id && e.pilotId === pilot.id) : [];
  const hasWw2 = entries.some((e) => e.className === "WWII");
  const hasWwi = entries.some((e) => e.className === "WWI");

  const pageHeader = isPreview ? `<div style="background: rgba(255,165,0,0.2); border: 1px solid orange; color: orange; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;"><strong>Admin-esikatselu:</strong> Katsot näkymää toisena pilottina (${escapeHtml(pilot.name)}).<br><span style="font-size: 0.85rem;">Olet kirjautunut sisään osoitteella <strong>${escapeHtml(userEmail)}</strong>. Luo Pilotit-sivulla profiili tällä sähköpostilla nähdäksesi oman korttisi.</span></div>` : '';

  // --- VÄLILEHTI 1: PERUSTIEDOT ---
  const avatarPanel = UI.Panel({
    title: "Pilotin kuva",
    className: "pilot-card-avatar-panel"
  }, `
    <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 10px;">
      ${pilot.avatarData || pilot.avatarUrl ? 
        `<div style="width: 100px; height: 100px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 2px solid var(--border);"></div>` : 
        `<div style="width: 100px; height: 100px; border-radius: 50%; background: var(--surface-2); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 2.5rem; border: 2px dashed var(--border);">${escapeHtml(pilot.name.charAt(0))}</div>`
      }
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label class="button small" style="cursor: pointer;">
          ${pilot.avatarData || pilot.avatarUrl ? "Vaihda kuva" : "Ota / Valitse kuva"}
          <input type="file" id="pilot-avatar-upload" data-pilot-id="${escapeHtml(pilot.id)}" accept="image/*" capture="user" style="display: none;">
        </label>
        ${pilot.avatarData || pilot.avatarUrl ? UI.Button({ label: "Poista kuva", action: "remove-pilot-avatar", pilotId: pilot.id, variant: "small danger" }) : ""}
      </div>
    </div>
    <p class="muted" style="font-size: 0.85rem; margin: 0;">Kuva tallennetaan pilottikorttiin ja näkyy järjestelmän osallistujalistoissa.</p>
  `);

  const detailedInfoForm = UI.FormPanel({
    title: "Pilotin tiedot",
    action: "update-pilot-details",
    className: "embedded-form-panel pilot-card-details"
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
    <div class="ui-form-actions" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px;">
      ${UI.Button({ label: "Tallenna tiedot", type: "submit", variant: "primary small" })}
    </div>
  `);

  const dangerZonePanel = UI.Panel({
    title: "Vaarallinen alue",
    className: "pilot-card-danger-zone",
    style: "border: 1px solid var(--danger); background: rgba(255,0,0,0.05); margin-top: 20px;"
  }, `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div>
        <h4 style="margin: 0 0 5px 0; color: var(--danger);">Tilin poistaminen</h4>
        <p class="muted" style="margin: 0; font-size: 0.9rem;">Poistaa sisäänkirjautumistunnuksesi käytöstä. Toimintoa ei voi perua.</p>
      </div>
      ${UI.Button({ label: "Poista tilini käytöstä", action: "execute-confirm-modal", title: "Poista tilini käytöstä", message: "Oletko aivan varma, että haluat poistaa tilisi käytöstä? Et voi enää kirjautua sisään järjestelmään, mutta aiemmat kilpailutuloksesi säilyvät arkistossa. Vahvistaaksesi toimenpiteen, kirjoita alle sana <strong>POISTA</strong>.", confirmText: "POISTA", confirmAction: "delete-own-account", variant: "danger" })}
    </div>
  `);

  // --- VÄLILEHTI 2: ILMOITTAUTUMINEN ---
  let registrationPanelContent = "";
  if (activeEvent) {
    const existingReg = state.registrations?.find(r => r.eventId === activeEvent.id && r.pilotId === pilot.id);
    
    let statusPanel = "";
    if (existingReg) {
      const statusLabel = existingReg.status === "pending" ? "Odottaa hyväksyntää" : (existingReg.status === "approved" ? "Hyväksytty" : "Hylätty");
      const statusColor = existingReg.status === "pending" ? "orange" : (existingReg.status === "approved" ? "green" : "red");
      
      statusPanel = `
        <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${statusColor}; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0;">Ilmoittautumisen tila: <span style="color: ${statusColor}">${statusLabel}</span></h4>
          <p class="muted">Valitut luokat: ${existingReg.classes.join(", ")}</p>
        </div>
        <div style="margin-bottom: 20px;">
          ${existingReg.status === "pending" ? UI.Button({ label: "Peruuta ilmoittautuminen", action: "cancel-registration", regId: existingReg.id, variant: "small danger" }) : ""}
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
        <h4 style="margin: 0 0 10px 0;">Kilpailumaksun maksutapa</h4>
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer;">
          <input type="radio" name="paymentIntent" value="paid_in_advance" ${paymentIntentValue === "paid_in_advance" ? "checked" : ""}>
          <span>Kilpailumaksu maksettu etukäteen</span>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="radio" name="paymentIntent" value="pay_on_site" ${paymentIntentValue === "pay_on_site" ? "checked" : ""}>
          <span>Maksan kilpailupaikalla</span>
        </label>
      </div>
    `;

    registrationPanelContent = `
      ${statusPanel}
      ${UI.FormPanel({ action: "submit-registration" }, `
        <input type="hidden" name="pilotId" value="${escapeHtml(pilot.id)}">
        <input type="hidden" name="eventId" value="${escapeHtml(activeEvent.id)}">
        <p class="muted" style="margin-bottom: 15px;">${existingReg ? "Voit muokata valintojasi ja lähettää ilmoittautumisen uudelleen päivitettäväksi." : "Valitse kilpailuluokat, joihin haluat osallistua. Ilmoittautumisesi siirtyy ylläpidon hyväksyttäväksi."}</p>
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 6px;">
          <h4 style="margin: 0 0 10px 0;">Kilpailuluokat</h4>
          ${classCheckboxes}
        </div>
        ${paymentOptions}
        ${UI.Button({ label: existingReg ? "Päivitä ilmoittautuminen" : "Lähetä ilmoittautuminen", type: "submit", variant: "primary" })}
      `)}
    `;
  }

  const registrationPanel = activeEvent ? UI.Panel({ title: "Ilmoittautuminen", kicker: escapeHtml(activeEvent.name), className: "pilot-card-registration" }, registrationPanelContent) : UI.Panel({ title: "Ilmoittautuminen" }, `<p class="muted">Valitse aktiivinen kilpailu kojelaudalta voidaksesi ilmoittaa pilotin mukaan.</p>`);

  // --- VÄLILEHTI 3: KONEKORTIT ---
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

  // --- VÄLILEHTI 4: KILPAILUTAPAHTUMAT ---
  let myHeatsContent = `<p class="muted">Ei arvottuja eriä.</p>`;
  if (activeEvent && state.heats.some(h => h.eventId === activeEvent.id)) {
    const myHeats = state.heats.filter(h => h.eventId === activeEvent.id && (h.pilotIds || []).includes(pilot.id));
    if (myHeats.length > 0) {
      myHeatsContent = `<ul style="list-style: none; padding: 0; margin: 0;">` + myHeats.map(h => `
        <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
          <strong>${escapeHtml(h.className)} · Heat ${h.number}</strong>
        </li>
      `).join('') + `</ul>`;
    }
  }

  const myScoreCardsContent = (() => {
    if (!activeEvent) return `<p class="muted">Ei aktiivista kilpailua.</p>`;
    const rows = buildScoreCardRows(state, activeEvent);
    const myRows = rows.filter(r => r.entry.pilotId === pilot.id);
    if (myRows.length === 0) return `<p class="muted">Ei tuloskortteja.</p>`;
    
    return `<div class="stack">` + myRows.map(row => `
      <div style="background: var(--surface-2); border: 1px solid var(--border); padding: 15px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">${escapeHtml(row.className)}</h3>
          <span class="badge ${row.card?.updatedAt ? "badge-saved" : "badge-empty"}">${row.card?.updatedAt ? "Tallennettu" : "Ei tuloksia"}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">Yhteispisteet</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--success);">${row.totals.totalPoints}</div>
          </div>
          <div style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">Cutit</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--danger);">${row.totals.totalCuts}</div>
          </div>
        </div>
      </div>
    `).join('') + `</div>`;
  })();

  const heatsPanel = UI.Panel({ title: "Omat lähtövuorot (Heatit)", kicker: "Aktiivinen kilpailu" }, myHeatsContent);
  const scoreCardsPanel = UI.Panel({ title: "Omat tuloskortit", kicker: "Yhteenveto", style: "margin-top: 20px;" }, myScoreCardsContent);
  const eventPanel = heatsPanel + scoreCardsPanel;

  // --- RAKENNA VÄLILEHDET ---
  const tab = window.MY_PILOT_CARD_TAB || 'perustiedot';

  // --- VÄLILEHTI 5: LENTOPÄIVÄKIRJA ---
  let logbookContent = "";
  if (tab === 'logbook') {
    logbookContent = renderLogbookPanel(state, pilot);
  }

  // --- RAKENNA VÄLILEHDET ---
  const tabNavigation = `
    <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'perustiedot' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="perustiedot">Perustiedot</button>
      <button type="button" class="button ${tab === 'ilmoittautuminen' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="ilmoittautuminen">Ilmoittautuminen</button>
      <button type="button" class="button ${tab === 'konekortit' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="konekortit">Konekortit (${pilotPlanes.length})</button>
      <button type="button" class="button ${tab === 'kilpailu' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="kilpailu">Kilpailu</button>
      <button type="button" class="button ${tab === 'logbook' ? 'primary' : 'dashed'}" data-action="set-my-pilot-tab" data-tab="logbook">Lentopäiväkirja</button>
    </div>
  `;

  let tabContent = "";
  if (tab === 'perustiedot') {
    tabContent = `<div class="stack">${avatarPanel}${detailedInfoForm}${dangerZonePanel}</div>`;
  } else if (tab === 'ilmoittautuminen') {
    tabContent = `<div class="stack">${registrationPanel}</div>`;
  } else if (tab === 'konekortit') {
    tabContent = `<div class="stack">${aircraftPanel}</div>`;
  } else if (tab === 'kilpailu') {
    tabContent = `<div class="stack">${eventPanel}</div>`;
  } else if (tab === 'logbook') {
    tabContent = logbookContent;
  }

  return `
    ${pageHeader}
    ${tabNavigation}
    ${tabContent}
  `;
}
