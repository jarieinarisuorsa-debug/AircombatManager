import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { renderEditHeader, renderEditButton, formatMultiline } from "./EventShared.js";
import { getZoneCenter } from "./EventShared.js";
export function renderMapOnlyPanel(event, info, admin, isEdit, state) {
  if (isEdit) {
    return UI.FormPanel({ action: "save-event-info", className: "event-info-editor" }, `
      ${renderEditHeader(t(state, "event_info.edit_map"), "kartta", state)}
      ${UI.Grid({ columns: "1fr 1fr", gap: "12px", className: "form-grid-two" }, `
        ${UI.Input({ label: t(state, "event_info.address"), name: "address", value: info.address, placeholder: t(state, "event_info.address_placeholder") })}
        ${UI.Input({ label: t(state, "event_info.maps_url"), name: "mapsUrl", value: info.mapsUrl, placeholder: "https://maps.google.com/..." })}
      `)}
      <div class="ui-form-actions" style="margin-top: 20px;">
        ${UI.Button({ label: t(state, "event_info.save_address"), type: "submit", variant: "primary" })}
      </div>
    `);
  }

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

  let windAnim = "";
  if (window.WIND_ANIM_ENABLED && window.WIND_ANIM_DATA && window.WIND_ANIM_DATA.wind_direction_10m !== undefined) {
    const windDir = window.WIND_ANIM_DATA.wind_direction_10m;
    const speed = window.WIND_ANIM_DATA.wind_speed_10m || 5;
    const intensity = Math.max(0.5, Math.min(2.5, speed / 4));
    
    windAnim = `
      <svg class="wind-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; pointer-events: none; z-index: 4; transform: rotate(${windDir}deg); opacity: 1;">
        ${Array.from({length: 40}).map((_, i) => {
          const rand1 = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
          const rand2 = Math.abs((Math.cos(i * 78.233) * 43758.5453) % 1);
          const x = rand1 * 100;
          const duration = (0.8 + rand2 * 1.5) / intensity;
          const delay = rand1 * 3;
          return `<line x1="${x}" y1="-50" x2="${x}" y2="150" stroke="rgba(255,255,255,0.6)" stroke-width="0.4" stroke-linecap="round" stroke-dasharray="10 200" style="animation: wind-move ${duration}s linear infinite; animation-delay: -${delay}s; transform-origin: 0 0;" />`;
        }).join("")}
      </svg>
    `;
  }

  const mapContent = mapImageUrl
    ? `
      <div class="map-container">
        <img class="event-map-image" src="${escapeHtml(mapImageUrl)}" alt="${t(state, "event_info.map_alt")}" />
        ${windAnim}
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
    : `<div class="event-map-placeholder">${t(state, "event_info.no_map")}</div>`;

  const editButton = admin ? renderEditButton('kartta', state) : "";
  const windButton = (info.latitude && info.longitude) ? `<button class="button small ${window.WIND_ANIM_ENABLED ? 'primary' : ''}" data-action="toggle-wind-animation" data-lat="${info.latitude}" data-lon="${info.longitude}" data-event-id="${event.id}">${window.WIND_ANIM_ENABLED ? t(state, "event_info.hide_wind") : t(state, "event_info.show_wind")}</button>` : "";
  
  const headerActions = `
    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
      ${windButton}
      ${mapsUrl ? `<a class="button small" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">${t(state, "event_info.open_maps")}</a>` : ""}
      ${admin ? `<a class="button small" href="#/mapeditor">${t(state, "event_info.map_editor")}</a>` : ""}
      ${editButton}
    </div>
  `;

  return UI.Panel({ kicker: t(state, "event_info.map_kicker"), title: t(state, "event_info.map_title"), headerActions }, `
    ${address ? `<p style="margin-bottom: 12px;"><strong>${t(state, "event_info.address_bold")}</strong><br />${escapeHtml(address)}</p>` : `<p class="muted" style="margin-bottom: 12px;">${t(state, "event_info.no_address")}</p>`}
    ${mapContent}
  `);
}
