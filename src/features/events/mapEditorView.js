import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { normalizeEventInfo } from "../../logic/eventInfo.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";

function getZoneCenter(points) {
  if (!points || points.length === 0) return {x: 50, y: 50};
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

export function renderMapEditorView(state) {
  const event = getActiveEvent(state);
  if (!event || !isAdmin(state)) {
    return `<p>Ei valittua kilpailua tai puuttuvat oikeudet.</p>`;
  }

  const info = normalizeEventInfo(event.eventInfo);
  const pois = info.mapPois || [];
  const zones = info.mapZones || [];
  const mode = window.MAP_EDITOR_MODE || "poi";
  const draftPoints = window.DRAFT_ZONE_POINTS || [];

  let svgZones = "";
  zones.forEach(zone => {
    const pointsStr = zone.points.map(p => `${p.x},${p.y}`).join(" ");
    const center = getZoneCenter(zone.points);
    svgZones += `
      <polygon points="${pointsStr}" fill="${zone.color?.fill || 'rgba(0,0,0,0.3)'}" stroke="${zone.color?.stroke || '#fff'}" stroke-width="0.5" stroke-linejoin="round" />
      <text x="${center.x}" y="${center.y}" fill="#fff" font-size="2.5" text-anchor="middle" dominant-baseline="middle" style="text-shadow: 0 1px 3px rgba(0,0,0,0.9); font-weight: bold; pointer-events: none;">${escapeHtml(zone.label)}</text>
    `;
  });
  if (draftPoints.length > 0) {
    const draftStr = draftPoints.map(p => `${p.x},${p.y}`).join(" ");
    svgZones += `
      <polyline points="${draftStr}" fill="rgba(231, 76, 60, 0.3)" stroke="#e74c3c" stroke-width="0.5" stroke-dasharray="1,1" />
      ${draftPoints.map(p => `<circle cx="${p.x}" cy="${p.y}" r="0.5" fill="#fff" stroke="#e74c3c" stroke-width="0.2"/>`).join("")}
    `;
  }
  const svgOverlay = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;">${svgZones}</svg>`;

  const mapContent = info.mapImageUrl
    ? `
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="map-container is-admin" data-action="map-click">
          <img class="event-map-image" src="${escapeHtml(info.mapImageUrl)}" alt="Kartta" />
          ${svgOverlay}
          ${pois.map(poi => {
            const emoji = poi.label.split(' ')[0] || '📍';
            const scale = poi.scale || 1;
            return `
            <div class="map-poi" style="left: ${poi.x}%; top: ${poi.y}%" draggable="true" data-poi-id="${poi.id}">
              <span class="poi-emoji" title="${escapeHtml(poi.label)}" style="font-size: ${scale * 1.5}rem;">${escapeHtml(emoji)}</span>
              <div class="poi-tooltip">${escapeHtml(poi.label)}</div>
              <button class="map-poi-delete" data-action="remove-map-poi" data-poi-id="${poi.id}" title="Poista">✕</button>
            </div>
          `}).join("")}
        </div>
        <p class="muted map-help-text" style="margin-top: 15px;">Klikkaa karttaa lisätäksesi uuden pisteen.</p>
      </div>
    `
    : `
      <label class="event-map-placeholder is-admin-dropzone" style="height: 400px;">
        <div class="dropzone-content">
          <span style="font-size: 3rem;">📥</span>
          <strong style="display: block; margin-top: 12px; font-size: 1.4rem;">Lisää karttapohja</strong>
          <span class="muted">Lataa kuva koneeltasi klikkaamalla tästä tai raahaamalla kuva tähän</span>
        </div>
        <input type="file" id="map-image-upload-inline" accept="image/png, image/jpeg, image/webp" style="display: none;" />
      </label>
    `;

  const poiList = pois.length 
    ? `
      <div class="stage-progress-list" style="margin-top: 20px; max-height: 200px; overflow-y: auto;">
        ${pois.map(poi => `
          <div class="stage-progress-row" style="align-items: center; justify-content: space-between;">
            <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${escapeHtml(poi.label)}</strong>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="range" min="0.5" max="3" step="0.1" value="${poi.scale || 1}" data-action="scale-map-poi" data-poi-id="${poi.id}" title="Skaalaa emojia" style="width: 80px;">
              <button class="button small" data-action="remove-map-poi" data-poi-id="${poi.id}" style="color: var(--danger);">Poista</button>
            </div>
          </div>
        `).join("")}
      </div>
    `
    : `<p class="muted" style="margin-top: 20px;">Ei lisättyjä merkkejä.</p>`;

  const zoneList = zones.length 
    ? `
      <div class="stage-progress-list" style="margin-top: 20px; max-height: 200px; overflow-y: auto;">
        ${zones.map(zone => `
          <div class="stage-progress-row" style="align-items: center;">
            <strong style="color: ${zone.color?.stroke || '#fff'};">${escapeHtml(zone.label)}</strong>
            <button class="button small" data-action="remove-map-zone" data-zone-id="${zone.id}" style="color: var(--danger);">Poista</button>
          </div>
        `).join("")}
      </div>
    `
    : `<p class="muted" style="margin-top: 20px;">Ei piirrettyjä alueita.</p>`;

  const controlPanel = UI.Panel({
    kicker: "Työkalut",
    title: "Kartan hallinta"
  }, `
    <div style="margin-bottom: 15px;">
      <details style="padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px;">
        <summary style="font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; user-select: none;">
          🖼️ Vaihda karttakuva
        </summary>
        <div style="display: grid; gap: 10px; margin-top: 15px;">
          <input type="file" id="map-image-upload-inline" accept="image/png, image/jpeg, image/webp" class="file-upload-input" />
          ${UI.Input({ name: "mapImageUrl", value: info.mapImageUrl, placeholder: "Tai aseta ulkoinen URL-osoite..." })}
          ${info.mapImageUrl ? `<button class="button small danger" onclick="document.querySelector('input[name=mapImageUrl]').value=''; document.querySelector('input[name=mapImageUrl]').dispatchEvent(new Event('change', {bubbles:true}))">Tyhjennä kartta</button>` : ""}
        </div>
      </details>
    </div>
    
    <div style="display: flex; gap: 5px; margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 8px;">
      <button class="button small ${mode === 'poi' ? 'primary' : ''}" data-action="set-map-mode" data-mode="poi" style="flex: 1; border: none; font-weight: 600;">📌 Merkit</button>
      <button class="button small ${mode === 'zone' ? 'primary' : ''}" data-action="set-map-mode" data-mode="zone" style="flex: 1; border: none; font-weight: 600;">🖍️ Alueet</button>
    </div>
    
    ${mode === "poi" ? `
      <div style="margin-bottom: 15px;">
        <h5 style="margin: 0 0 8px; color: var(--text-muted);">Emojipaletti</h5>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${[...["🚗 Pysäköinti", "⛺ Leirintä", "🛩️ Lentosuunta", "🏁 Kisatoimisto", "🍔 Ravintola", "🆘 Ensiapu", "🚾 WC", "📍 Merkki"], ...(state.settings?.customMapEmojis || [])].map(item => `
            <button class="button small ${window.ACTIVE_PALETTE_EMOJI === item ? 'primary' : 'outline'}" 
                    data-action="select-palette-emoji" 
                    data-emoji-item="${escapeHtml(item)}" 
                    style="padding: 4px 8px; font-size: 0.85rem;">
              <span style="font-size: 1.1rem;">${escapeHtml(item.split(' ')[0] || '📍')}</span> 
              ${escapeHtml(item.split(' ').slice(1).join(' '))}
            </button>
          `).join("")}
          <button class="button small dashed" data-action="add-custom-map-emoji" style="padding: 4px 8px;">➕ Uusi oma</button>
        </div>
        <p class="muted" style="font-size: 0.8rem; margin-top: 8px;">Valitse yltä merkki ja klikkaa karttaa lisätäksesi sen.</p>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 15px;">
        <h5 style="margin: 0 0 10px;">Lisätyt merkit</h5>
        ${poiList}
      </div>
    ` : `
      ${draftPoints.length > 0 ? `
        <div style="padding: 10px; background: rgba(52, 152, 219, 0.1); border: 1px solid #3498db; border-radius: 8px; margin-bottom: 15px;">
          <strong>Piirretään aluetta...</strong>
          <p class="muted" style="font-size: 0.8rem; margin: 4px 0;">Klikkaa karttaa lisätäksesi kulmia.</p>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="button primary small" data-action="finish-zone">Hyväksy alue</button>
            <button class="button small danger" data-action="cancel-zone">Peruuta</button>
          </div>
        </div>
      ` : `
        <p class="muted" style="font-size: 0.85rem; margin-bottom: 15px;">Aloita alueen piirtäminen klikkaamalla karttaa haluamasi alueen reunoista.</p>
      `}
      
      <div style="border-top: 1px solid var(--border); padding-top: 15px;">
        <h5 style="margin: 0 0 10px;">Piirretyt alueet</h5>
        ${zoneList}
      </div>
    `}

    <div style="margin-top: 20px;">
      <a class="button primary" style="width: 100%; justify-content: center;" href="#/eventinfo">✅ Valmis ja palaa</a>
    </div>
  `);

  return `
    ${UI.Grid({ columns: "minmax(300px, 1.8fr) minmax(280px, 1fr)", gap: "18px" }, `
      ${UI.Panel({ kicker: "Kartta", title: "Työalue", className: "map-editor-panel" }, mapContent)}
      ${controlPanel}
    `)}
  `;
}
