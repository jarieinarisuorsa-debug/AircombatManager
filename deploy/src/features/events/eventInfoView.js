import { escapeHtml, formatDateRange, getActiveEvent } from "../../utils/html.js";
import { normalizeEventInfo, parseDocumentLines } from "../../logic/eventInfo.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";
import { renderWeatherWidget } from "./weatherWidget.js";

function getZoneCenter(points) {
  if (!points || points.length === 0) return {x: 50, y: 50};
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

export function renderEventInfoView(state) {
  const event = getActiveEvent(state);
  const admin = isAdmin(state);

  if (!event) {
    return UI.Panel({
      kicker: "Kilpailun tiedot",
      title: "Ei aktiivista kilpailua"
    }, `
      <p class="muted">Valitse kilpailu kisakalenterista.</p>
      <a class="button primary" href="#/calendar">Avaa kisakalenteri</a>
    `);
  }

  const info = normalizeEventInfo(event.eventInfo);
  const headerActions = admin ? "" : UI.Flex({ gap: "10px", wrap: "wrap" }, `
    <a class="button small" href="#/calendar">← Kisakalenteri</a>
    <a class="button small success" href="#/mypilotcard">Ilmoittaudu</a>
  `);

  const pageHeader = UI.PageHeader({
    kicker: "Kilpailun tiedot",
    title: event.name,
    subtitle: `${escapeHtml(event.location)} · ${formatDateRange(event.date, event.endDate)}`,
    headerActions
  });

  const tab = window.EVENT_INFO_TAB || 'yleista';
  const editMode = state.settings?.eventInfoEditMode;

  const tabNavigation = `
    <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'yleista' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="yleista">Yleistä</button>
      <button type="button" class="button ${tab === 'sijainti' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="sijainti">Kartta ja saapuminen</button>
      <button type="button" class="button ${tab === 'aikataulu' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="aikataulu">Aikataulu</button>
      <button type="button" class="button ${tab === 'dokumentit' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="dokumentit">Dokumentit</button>
      <button type="button" class="button ${tab === 'tiedotteet' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="tiedotteet">Tiedotteet</button>
      <button type="button" class="button ${tab === 'yhteystiedot' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="yhteystiedot">Yhteystiedot</button>
      <button type="button" class="button ${tab === 'sponsorit' ? 'primary' : 'dashed'}" data-action="set-event-info-tab" data-tab="sponsorit">Sponsorit</button>
    </div>
  `;

  let tabContent = "";
  if (tab === 'yleista') {
    tabContent = renderSummaryPanel(event, info, admin, editMode === 'yleista');
  } else if (tab === 'sijainti') {
    tabContent = renderLocationPanel(event, info, admin, editMode === 'sijainti');
  } else if (tab === 'aikataulu') {
    tabContent = renderSchedulePanel(info, admin, editMode);
  } else if (tab === 'dokumentit') {
    tabContent = renderDocumentsPanel(info, admin, editMode === 'dokumentit');
  } else if (tab === 'tiedotteet') {
    tabContent = renderNoticePanel(event, admin, editMode === 'tiedotteet');
  } else if (tab === 'yhteystiedot') {
    tabContent = renderContactPanel(info, admin, editMode === 'yhteystiedot');
  } else if (tab === 'sponsorit') {
    tabContent = renderSponsorsPanel(info, admin, editMode === 'sponsorit');
  }

  return `
    ${pageHeader}
    ${tabNavigation}
    ${tabContent}
  `;
}

function renderEditHeader(title, sectionName) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">${title}</h3>
      <button type="button" class="button small" data-action="cancel-edit-event-section">Peruuta</button>
    </div>
  `;
}

function renderEditButton(sectionName) {
  return `<button type="button" class="button small primary" data-action="edit-event-section" data-section="${sectionName}">✏️ Muokkaa</button>`;
}

function renderSummaryPanel(event, info, admin, isEdit) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader("Muokkaa yleisiä tietoja", "yleista")}
      <label>Kilpailun kuvaus
        <textarea name="description" placeholder="Yleiskuvaus kilpailusta" rows="8">${escapeHtml(info.description)}</textarea>
      </label>
      
      <div style="margin-top: 15px;">
        <label>Paikkakunnan vaakuna</label>
        
        <div id="coat-of-arms-preview-card" class="panel" style="display: ${info.coatOfArmsData ? "flex" : "none"}; align-items: center; gap: 30px; padding: 20px; margin-top: 8px;">
          <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            <img id="coat-of-arms-preview" src="${escapeHtml(info.coatOfArmsData || "")}" style="max-height: 160px; max-width: 200px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));" alt="Vaakunan esikatselu" />
          </div>
          <div style="flex: 1;">
            <p style="margin: 0 0 8px 0; font-size: 1.1rem;"><strong>Tallennettu vaakuna</strong></p>
            <p style="margin: 0 0 15px 0; color: var(--muted); font-size: 0.9rem;">Vaakuna näytetään kisakalenterissa tapahtumakortin reunassa.</p>
            <div style="display: flex; gap: 10px;">
               <button type="button" class="button small outline" onclick="document.getElementById('coat-of-arms-upload').click()">Vaihda kuva</button>
               <button type="button" class="button small danger outline" data-action="clear-coat-of-arms" id="clear-coat-of-arms-btn">Poista vaakuna</button>
            </div>
          </div>
        </div>

        <label id="coat-of-arms-dropzone-label" class="is-admin-dropzone" style="display: ${info.coatOfArmsData ? "none" : "flex"}; flex-direction: column; align-items: center; justify-content: center; min-height: 120px; border: 2px dashed var(--border); border-radius: 8px; cursor: pointer; padding: 20px; margin-top: 8px; text-align: center; background: rgba(0,0,0,0.1); transition: 0.2s ease;">
          <input type="file" id="coat-of-arms-upload" style="display: none;" accept="image/png, image/jpeg, image/webp, image/svg+xml" />
          <input type="hidden" name="coatOfArmsData" id="coat-of-arms-data" value="${escapeHtml(info.coatOfArmsData || "")}" />
          <span style="font-size: 2rem; margin-bottom: 10px; opacity: 0.8;">🛡️</span>
          <span style="color: var(--text); font-weight: 600; font-size: 0.95rem;">Raahaa vaakuna tähän tai klikkaa valitaksesi tiedoston</span>
          <span style="color: var(--muted); font-size: 0.8rem; margin-top: 6px;">Suositus: PNG ilman taustaa, koko vähintään 256x256</span>
        </label>
      </div>

      <div class="ui-form-actions" style="margin-top: 20px;">
        ${UI.Button({ label: "Tallenna muutokset", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const description = String(info.description || "").trim();
  const headerActions = admin ? renderEditButton('yleista') : "";

  return UI.Panel({ kicker: "Perustiedot", title: "Kilpailu", headerActions }, `
    <div class="event-info-summary">
      <article class="small-card"><span class="muted">Paikka</span><strong>${escapeHtml(event.location || "-")}</strong></article>
      <article class="small-card"><span class="muted">Ajankohta</span><strong>${formatDateRange(event.date, event.endDate)}</strong></article>
      <article class="small-card"><span class="muted">Luokat</span><strong>${(event.classes || []).map(escapeHtml).join(", ") || "-"}</strong></article>
      <article class="small-card"><span class="muted">Status</span><strong>${escapeHtml(event.status || "-")}</strong></article>
    </div>
    ${description ? `<div class="event-info-text" style="margin-top: 20px;">${formatMultiline(description)}</div>` : `<p class="muted" style="margin-top: 20px;">Kilpailulle ei ole vielä lisätty julkista kuvausta.</p>`}
  `);
}

function renderNoticePanel(event, admin, isEdit) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader("Muokkaa tiedotteita", "tiedotteet")}
      <label>Kilpailunjohdon tiedote
        <textarea name="publicNotice" placeholder="Tärkeä tiedote, aikataulumuutos tai ohje" rows="6">${escapeHtml(event.publicNotice || "")}</textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: "Julkaise tiedote", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const notice = String(event.publicNotice || "").trim();
  const headerActions = admin ? renderEditButton('tiedotteet') : "";
  return UI.Panel({ kicker: "Tiedotteet", title: notice ? "Kilpailunjohdon tiedote" : "Ei julkaistuja tiedotteita", headerActions },
    notice ? `<p class="notice-text public-notice-text">${escapeHtml(notice)}</p>` : `<p class="muted">Kilpailunjohto ei ole vielä julkaissut tiedotteita tähän kilpailuun.</p>`);
}

function renderLocationPanel(event, info, admin, isEdit) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader("Muokkaa sijaintia ja saapumista", "sijainti")}
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: "Osoite", name: "address", value: info.address, placeholder: "Jämijärven lentokenttä" })}
        ${UI.Input({ label: "Google Maps / karttalinkki", name: "mapsUrl", value: info.mapsUrl, placeholder: "https://maps.google.com/..." })}
      `)}
      <div style="margin-top: 12px; padding: 12px; background: var(--surface-1); border-radius: 8px; border: 1px solid var(--border);">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Säätilan sijainti (Koordinaatit)</label>
        ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
          ${UI.Input({ label: "Leveysaste (Latitude)", name: "latitude", id: "event-latitude-input", value: info.latitude, placeholder: "esim. 61.777" })}
          ${UI.Input({ label: "Pituusaste (Longitude)", name: "longitude", id: "event-longitude-input", value: info.longitude, placeholder: "esim. 22.723" })}
        `)}
        <div style="margin-top: 8px;">
          <button type="button" class="button small dashed" data-action="fetch-admin-location">📍 Hae nykyinen sijaintini laitteelta</button>
          <span id="admin-location-status" style="font-size: 0.8rem; color: var(--muted); margin-left: 8px;"></span>
        </div>
      </div>
      <label style="margin-top: 12px;">Saapumisohje
        <textarea name="arrivalInfo" placeholder="Pysäköinti, leirintä, kisatoimisto, flight line..." rows="4">${escapeHtml(info.arrivalInfo)}</textarea>
      </label>
      <label>Palvelut
        <textarea name="servicesInfo" placeholder="WC, vesi, sähkö, ruokailu, ensiapu..." rows="4">${escapeHtml(info.servicesInfo)}</textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: "Tallenna sijaintitiedot", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  return UI.Grid({ columns: "minmax(280px, 0.9fr) minmax(280px, 1.1fr)", gap: "18px", className: "event-info-grid" }, `
    ${renderArrivalSubPanel(event, info, admin)}
    ${renderMapSubPanel(info, admin)}
  `);
}

function renderArrivalSubPanel(event, info, admin) {
  const arrivalInfo = String(info.arrivalInfo || "").trim();
  const servicesInfo = String(info.servicesInfo || "").trim();
  const headerActions = admin ? renderEditButton('sijainti') : "";

  return UI.Panel({ kicker: "Saapuminen", title: "Ohjeet ja palvelut", headerActions }, `
    <div class="event-info-block">
      <h4>Saapumisohje</h4>
      ${arrivalInfo ? `<div class="event-info-text">${formatMultiline(arrivalInfo)}</div>` : `<p class="muted">Saapumisohjeita ei ole vielä lisätty.</p>`}
    </div>
    <div class="event-info-block">
      <h4>Palvelut</h4>
      ${servicesInfo ? `<div class="event-info-text">${formatMultiline(servicesInfo)}</div>` : `<p class="muted">Palvelutietoja ei ole vielä lisätty.</p>`}
    </div>
    ${renderWeatherWidget(event, admin)}
  `);
}

function renderMapSubPanel(info, admin) {
  const address = String(info.address || "").trim();
  const mapsUrl = String(info.mapsUrl || "").trim();
  const mapImageUrl = String(info.mapImageUrl || "").trim();
  const pois = info.mapPois || [];
  const zones = info.mapZones || [];

  let svgZones = "";
  zones.forEach(zone => {
    const pointsStr = zone.points.map(p => `${p.x},${p.y}`).join(" ");
    const center = getZoneCenter(zone.points);
    svgZones += `
      <polygon points="${pointsStr}" fill="${zone.color?.fill || 'rgba(0,0,0,0.3)'}" stroke="${zone.color?.stroke || '#fff'}" stroke-width="0.5" stroke-linejoin="round" />
      <text x="${center.x}" y="${center.y}" fill="#fff" font-size="2.5" text-anchor="middle" dominant-baseline="middle" style="text-shadow: 0 1px 3px rgba(0,0,0,0.9); font-weight: bold; pointer-events: none;">${escapeHtml(zone.label)}</text>
    `;
  });
  const svgOverlay = svgZones ? `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;">${svgZones}</svg>` : "";

  const mapContent = mapImageUrl
    ? `
      <div class="map-container">
        <img class="event-map-image" src="${escapeHtml(mapImageUrl)}" alt="Kilpailualueen kartta" />
        ${svgOverlay}
        ${pois.map(poi => {
          const emoji = poi.label.split(' ')[0] || '📍';
          const scale = poi.scale || 1;
          return `
          <div class="map-poi" style="left: ${poi.x}%; top: ${poi.y}%">
            <span class="poi-emoji" title="${escapeHtml(poi.label)}" style="font-size: ${scale * 1.5}rem;">${escapeHtml(emoji)}</span>
            <div class="poi-tooltip">${escapeHtml(poi.label)}</div>
          </div>
        `}).join("")}
      </div>
    `
    : `<div class="event-map-placeholder">Karttakuvaa ei ole lisätty.</div>`;

  return UI.Panel({ kicker: "Kartta", title: "Sijainti" }, `
    ${address ? `<p><strong>Osoite:</strong><br />${escapeHtml(address)}</p>` : `<p class="muted">Osoitetta ei ole vielä lisätty.</p>`}
    ${mapContent}
    <div class="row-actions event-info-actions" style="margin-top: 15px;">
      ${mapsUrl ? `<a class="button primary" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Avaa Google Maps</a>` : ""}
      ${admin ? `<a class="button" href="#/mapeditor">🎨 Siirry karttaeditoriin</a>` : ""}
    </div>
  `);
}

function renderDocumentsPanel(info, admin, isEdit) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader("Muokkaa dokumentteja", "dokumentit")}
      <label>Dokumentit ja linkit
        <textarea name="documentsText" placeholder="Yksi per rivi: Kenttäkartta | https://..." rows="6">${escapeHtml(info.documentsText)}</textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: "Tallenna dokumentit", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const documents = parseDocumentLines(info.documentsText);
  const headerActions = admin ? renderEditButton('dokumentit') : "";

  return UI.Panel({ kicker: "Dokumentit", title: "Linkit ja liitteet", headerActions }, documents.length ? `
    <div class="event-document-list">
      ${documents.map((doc) => `
        <a class="event-document-card" href="${escapeHtml(doc.url || "#")}" ${doc.url ? `target="_blank" rel="noopener noreferrer"` : ""}>
          <strong>${escapeHtml(doc.title)}</strong>
          <span>${doc.url ? escapeHtml(doc.url) : "Ei linkkiä"}</span>
        </a>
      `).join("")}
    </div>
  ` : `
    <p class="muted">Dokumentteja ei ole vielä lisätty.</p>
    <p class="muted">Admin voi lisätä tähän esimerkiksi kenttäkartan, aikataulun, turvallisuusohjeen tai majoitusinfon.</p>
  `);
}

function renderContactPanel(info, admin, isEdit) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader("Muokkaa yhteystietoja", "yhteystiedot")}
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: "Järjestäjä", name: "organizer", value: info.organizer, placeholder: "Seura / järjestäjä" })}
        ${UI.Input({ label: "Verkkosivu", name: "websiteUrl", value: info.websiteUrl, placeholder: "https://..." })}
        ${UI.Input({ label: "Yhteyshenkilö", name: "contactName", value: info.contactName, placeholder: "Nimi" })}
        ${UI.Input({ label: "Yhteyssähköposti", name: "contactEmail", type: "email", value: info.contactEmail, placeholder: "info@example.com" })}
      `)}
      <div class="ui-form-actions">
        ${UI.Button({ label: "Tallenna yhteystiedot", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const parts = [
    info.organizer ? `<strong>Järjestäjä:</strong> ${escapeHtml(info.organizer)}` : "",
    info.contactName ? `<strong>Yhteyshenkilö:</strong> ${escapeHtml(info.contactName)}` : "",
    info.contactEmail ? `<strong>Sähköposti:</strong> ${escapeHtml(info.contactEmail)}` : ""
  ].filter(Boolean);

  const website = info.websiteUrl ? `<a class="button small" href="${escapeHtml(info.websiteUrl)}" target="_blank" rel="noopener noreferrer">Avaa verkkosivu</a>` : "";
  const headerActions = admin ? renderEditButton('yhteystiedot') : "";

  return UI.Panel({ kicker: "Tiedustelut", title: "Yhteystiedot", headerActions }, `
    ${parts.length ? `
      <div class="event-info-text" style="font-size: 1.1em; line-height: 1.6;">
        ${parts.map((part) => `<div>${part}</div>`).join("")}
      </div>
    ` : `<p class="muted">Yhteystietoja ei ole vielä lisätty.</p>`}
    ${website ? `<div style="margin-top: 15px;">${website}</div>` : ""}
  `);
}

function formatMultiline(value) {
  return escapeHtml(value).replaceAll("\\n", "<br />");
}

function renderSponsorsPanel(info, admin, isEdit) {
  const sponsors = info.sponsors || [];
  
  if (isEdit) {
    return UI.FormPanel({ action: "add-event-sponsor", className: "event-info-editor" }, `
      ${renderEditHeader("Lisää uusi sponsori", "sponsorit")}
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: "Sponsorin nimi", name: "name", required: true })}
        <label>Taso
          <select name="level">
            <option value="Pääsponsori">Pääsponsori</option>
            <option value="Yhteistyökumppani" selected>Yhteistyökumppani</option>
            <option value="Tukija">Tukija</option>
          </select>
        </label>
        ${UI.Input({ label: "Logon URL-osoite", name: "logoUrl", placeholder: "https://..." })}
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; font-size: 0.9rem;">Lisää logo</label>
          <div class="is-admin-dropzone" style="border: 2px dashed var(--border); padding: 24px; text-align: center; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onclick="this.querySelector('input[type=file]').click()">
            <input type="file" id="sponsor-logo-upload" accept="image/*" style="display: none;" />
            <div style="font-size: 2rem; margin-bottom: 8px;">🖼️</div>
            <div style="font-weight: bold; margin-bottom: 4px;">Raahaa logo tähän</div>
            <div style="font-size: 0.9rem; color: var(--muted);">tai klikkaa selataksesi tiedostoja</div>
            <img id="sponsor-logo-preview" src="" alt="Esikatselu" style="max-height: 100px; max-width: 100%; display: none; margin: 16px auto 0 auto; border-radius: 4px; object-fit: contain;" />
            <input type="hidden" name="logoData" id="sponsor-logo-data" />
          </div>
        </div>
        ${UI.Input({ label: "Verkkosivun URL", name: "websiteUrl", placeholder: "https://..." })}
      `)}
      <label>Kuvaus (valinnainen)
        <textarea name="description" placeholder="Lyhyt esittely..." rows="3"></textarea>
      </label>
      <div class="ui-form-actions">
        ${UI.Button({ label: "Lisää sponsori", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  const levels = ["Pääsponsori", "Yhteistyökumppani", "Tukija"];
  let content = "";

  levels.forEach(level => {
    const levelSponsors = sponsors.filter(s => s.level === level);
    if (levelSponsors.length === 0) return;

    content += `
      <div style="margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 8px;">${escapeHtml(level)}</h3>
        ${UI.Grid({ columns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }, 
          levelSponsors.map(sponsor => {
            let logo = "";
            if (sponsor.logoUrl) {
              logo = `<img src="${escapeHtml(sponsor.logoUrl)}" alt="${escapeHtml(sponsor.name)} logo" style="max-height: 80px; max-width: 100%; object-fit: contain; margin-bottom: 12px;" />`;
            } else {
              const initials = sponsor.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
              logo = `<div style="display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; background-color: var(--card-alt); border-radius: 50%; margin: 0 auto 12px auto; font-size: 1.5rem; font-weight: bold; color: var(--muted);">${escapeHtml(initials)}</div>`;
            }
            
            const link = sponsor.websiteUrl ? `<a href="${escapeHtml(sponsor.websiteUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none; font-weight: bold;">${escapeHtml(sponsor.name)}</a>` : `<strong>${escapeHtml(sponsor.name)}</strong>`;
            const desc = sponsor.description ? `<p style="margin: 8px 0 0 0; font-size: 0.9rem; color: var(--muted);">${escapeHtml(sponsor.description)}</p>` : "";
            const delBtn = admin ? `<div style="margin-top: 12px; text-align: center;"><button type="button" class="button small danger" data-action="delete-event-sponsor" data-sponsor-id="${escapeHtml(sponsor.id)}">Poista</button></div>` : "";
            
            return `
              <div class="small-card" style="display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 20px;">
                <div>
                  ${logo}
                  <div style="font-size: 1.1rem; margin-bottom: 4px;">${link}</div>
                  ${desc}
                </div>
                ${delBtn}
              </div>
            `;
          }).join("")
        )}
      </div>
    `;
  });

  if (sponsors.length === 0) {
    content = `<p class="muted">Tähän kilpailuun ei ole vielä lisätty sponsoreita.</p>`;
  }

  const headerActions = admin ? `<button type="button" class="button small primary" data-action="edit-event-section" data-section="sponsorit">➕ Lisää sponsori</button>` : "";
  return UI.Panel({ kicker: "Kilpailun tukijat", title: "Sponsorit", headerActions }, content);
}

function renderSchedulePanel(info, admin, editMode) {
  const schedule = info.schedule || [];
  
  if (editMode === 'lisaa-aikataulu' || (editMode && editMode.startsWith('muokkaa-aikataulu-'))) {
    const isEdit = editMode.startsWith('muokkaa-aikataulu-');
    const rowId = isEdit ? editMode.split('-')[2] : null;
    const row = isEdit ? schedule.find(r => r.id === rowId) : {};
    
    return UI.FormPanel({ action: "save-event-schedule-row", className: "event-info-editor" }, `
      ${renderEditHeader(isEdit ? "Muokkaa ohjelmaa" : "Lisää ohjelma", "aikataulu")}
      <input type="hidden" name="id" value="${escapeHtml(row.id || "")}" />
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: "Päivämäärä (esim. La 1.6.)", name: "date", value: row.date, placeholder: "La 1.6." })}
        ${UI.Input({ label: "Kellonaika (HH:MM)", name: "time", required: true, value: row.time, placeholder: "09:00" })}
      `)}
      ${UI.Input({ label: "Otsikko", name: "title", required: true, value: row.title, placeholder: "Pilottikokous" })}
      <label>Kuvaus (valinnainen)
        <textarea name="description" placeholder="Tarkempi kuvaus ohjelman sisällöstä..." rows="3">${escapeHtml(row.description || "")}</textarea>
      </label>
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: "Luokka (valinnainen)", name: "className", value: row.className, placeholder: "esim. WW2" })}
        ${UI.Input({ label: "Sijainti (valinnainen)", name: "location", value: row.location, placeholder: "esim. Kisatoimisto" })}
      `)}
      <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
        <input type="checkbox" name="isPublished" value="true" ${row.isPublished === false ? "" : "checked"} />
        <strong>Julkaise tämä ohjelma</strong>
        <span class="muted" style="margin-left: 8px; font-weight: normal;">(Poista valinta piilottaaksesi)</span>
      </label>
      <div class="ui-form-actions" style="margin-top: 20px;">
        ${UI.Button({ label: isEdit ? "Tallenna muutokset" : "Lisää ohjelma", type: "submit", variant: "primary" })}
      </div>
    `);
  }

  // Sort schedule by date string and time string
  const sortedRows = [...schedule].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.time || "";
    const timeB = b.time || "";
    return timeA.localeCompare(timeB);
  });

  const visibleRows = admin ? sortedRows : sortedRows.filter(r => r.isPublished !== false);

  let content = "";
  if (visibleRows.length === 0) {
    content = `<p class="muted">Aikataulua ei ole vielä lisätty tai julkaistu.</p>`;
  } else {
    content = `
      <div class="event-schedule-list" style="display: flex; flex-direction: column; gap: 12px;">
        ${visibleRows.map(row => {
          const publishedTag = row.isPublished === false ? `<span class="badge warning" style="font-size: 0.75rem; margin-left: 8px;">Piilotettu</span>` : "";
          const metaParts = [
            row.className ? `<strong>${escapeHtml(row.className)}</strong>` : "",
            row.location ? `📍 ${escapeHtml(row.location)}` : ""
          ].filter(Boolean);
          const metaLine = metaParts.length > 0 ? `<div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">${metaParts.join(" · ")}</div>` : "";
          const dateLabel = row.date ? `<div style="font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${escapeHtml(row.date)}</div>` : "";
          
          const adminActions = admin ? `
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <button type="button" class="button small" data-action="edit-event-section" data-section="muokkaa-aikataulu-${escapeHtml(row.id)}">Muokkaa</button>
              <button type="button" class="button small danger outline" data-action="delete-event-schedule-row" data-row-id="${escapeHtml(row.id)}">Poista</button>
            </div>
          ` : "";

          return `
            <div class="small-card" style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; border-left: 4px solid var(--primary); ${row.isPublished === false ? "opacity: 0.7; filter: grayscale(50%);" : ""}">
              <div style="flex: 0 0 70px; text-align: right;">
                ${dateLabel}
                <div style="font-size: 1.4rem; font-weight: bold; color: var(--text);">${escapeHtml(row.time || "–")}</div>
              </div>
              <div style="flex: 1 1 auto; min-width: 0;">
                <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; display: flex; align-items: center;">
                  ${escapeHtml(row.title)}
                  ${publishedTag}
                </h4>
                ${row.description ? `<p style="margin: 0; font-size: 0.95rem; color: var(--text-muted); line-height: 1.4;">${formatMultiline(row.description)}</p>` : ""}
                ${metaLine}
                ${adminActions}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  const headerActions = admin ? `<button type="button" class="button small primary" data-action="edit-event-section" data-section="lisaa-aikataulu">➕ Lisää ohjelma</button>` : "";
  return UI.Panel({ kicker: "Kilpailun ohjelma", title: "Aikataulu", headerActions }, content);
}
