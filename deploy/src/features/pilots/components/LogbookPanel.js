import { buildPilotLogbook } from "../../../logic/logbook.js";
import { UI } from "../../../ui/engine.js";
import { escapeHtml } from "../../../utils/html.js";

export function renderLogbookPanel(state, pilot) {
  const logbook = buildPilotLogbook(state, pilot.id);
  if (!logbook || logbook.eventsHistory.length === 0) {
    return UI.Panel({ title: "Lentopäiväkirja", kicker: "Historia" }, `<p class="muted">Ei rekisteröityjä lentosuorituksia.</p>`);
  }
  
  const stats = logbook.stats;
  const classStatsHtml = Object.entries(stats.classes).map(([className, cls]) => `
    <div style="background: var(--surface-2); padding: 10px; border-radius: 6px; text-align: center;">
      <div style="font-weight: bold;">${escapeHtml(className)}</div>
      <div class="muted" style="font-size: 0.85rem;">Kierrokset: ${cls.flights} | Cutit: ${cls.cuts}</div>
    </div>
  `).join('');

  const summaryPanel = UI.Panel({ title: "Yhteenveto", className: "pilot-card-logbook-summary" }, `
    ${UI.Grid({ columns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", style: "margin-bottom: 20px;" }, `
      <div style="text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${stats.totalEvents}</div>
        <div class="muted" style="font-size: 0.85rem;">Kilpailut</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${stats.totalFlights}</div>
        <div class="muted" style="font-size: 0.85rem;">Kierrokset</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${stats.totalCuts}</div>
        <div class="muted" style="font-size: 0.85rem;">Cutit</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${Math.floor(stats.totalFlightSeconds / 60)} min</div>
        <div class="muted" style="font-size: 0.85rem;">Lentoaika</div>
      </div>
    `)}
    ${classStatsHtml ? `<div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">${classStatsHtml}</div>` : ""}
  `);

  const historyHtml = logbook.eventsHistory.map(ev => {
    const flightsHtml = ev.flights.map(f => `
      <tr style="border-bottom: 1px solid var(--border); font-size: 0.9rem;">
        <td style="padding: 8px;">${escapeHtml(f.roundLabel)}</td>
        <td style="padding: 8px;">${f.score !== null ? f.score : "-"}</td>
        <td style="padding: 8px;">${f.cuts}</td>
        <td style="padding: 8px;">${Math.floor(f.flightSeconds / 60)}:${(f.flightSeconds % 60).toString().padStart(2, "0")}</td>
        <td style="padding: 8px; color: var(--muted);">${f.streamerOk ? "Ehjä" : "-"}</td>
      </tr>
    `).join('');

    const statusBadge = ev.resultsPublished 
      ? `<span class="badge badge-saved">Virallinen</span>` 
      : `<span class="badge badge-empty">Luonnos</span>`;

    return `
      <div class="panel" style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="margin: 0;">${escapeHtml(ev.eventName)}</h4>
            <div class="muted" style="font-size: 0.9rem;">${new Date(ev.eventDate).toLocaleDateString("fi-FI")} · ${escapeHtml(ev.eventLocation)}</div>
            <div style="margin-top: 5px; font-size: 0.9rem;">
              <strong>Luokka:</strong> ${escapeHtml(ev.className)} 
              ${ev.aircraftName ? `| <strong>Kone:</strong> ${escapeHtml(ev.aircraftName)}` : ""}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="margin-bottom: 5px;">${statusBadge}</div>
            ${ev.resultsPublished && ev.ranking ? `<div style="font-weight: bold; color: var(--primary-color);">Sijoitus: ${ev.ranking}.</div>` : ""}
            ${ev.resultsPublished ? `<div style="font-size: 0.9rem;">Yhteispisteet: <strong>${ev.totalEventScore}</strong></div>` : ""}
          </div>
        </div>
        <div class="table-wrap">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); font-size: 0.85rem; color: var(--muted);">
                <th style="padding: 8px;">Kierros</th>
                <th style="padding: 8px;">Pisteet</th>
                <th style="padding: 8px;">Cutit</th>
                <th style="padding: 8px;">Aika</th>
                <th style="padding: 8px;">Streamer</th>
              </tr>
            </thead>
            <tbody>
              ${flightsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="stack" style="max-width: 800px;">
      ${summaryPanel}
      <h3 style="margin: 20px 0 10px 0;">Kilpailuhistoria</h3>
      ${historyHtml}
    </div>
  `;
}
