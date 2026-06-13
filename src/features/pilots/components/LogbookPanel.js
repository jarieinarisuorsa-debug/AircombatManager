import { buildPilotLogbook } from "../../../logic/logbook.js";
import { UI } from "../../../ui/engine.js";
import { escapeHtml } from "../../../utils/html.js";
import { t } from "../../../utils/i18n.js";

export function renderLogbookPanel(state, pilot) {
  const logbook = buildPilotLogbook(state, pilot.id);
  if (!logbook || logbook.eventsHistory.length === 0) {
    return UI.Panel({ title: t(state, "my_pilot.tab_logbook"), kicker: t(state, "logbook.history_kicker") }, `<p class="muted">${t(state, "logbook.no_flights")}</p>`);
  }
  
  const logbookTab = window.LOGBOOK_TAB || t(state, "logbook.summary");
  const availableClasses = Array.from(new Set(logbook.eventsHistory.map(e => e.className))).sort();
  const tabs = [t(state, "logbook.summary"), ...availableClasses];
  
  const tabsHtml = `
    <div class="ui-tabs" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
      ${tabs.map(t => `<button type="button" class="button ${logbookTab === t ? 'primary' : 'dashed'} small" data-action="set-logbook-tab" data-tab="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
    </div>
  `;

  let filteredEvents = logbook.eventsHistory;
  if (logbookTab !== t(state, "logbook.summary")) {
    filteredEvents = logbook.eventsHistory.filter(ev => ev.className === logbookTab);
  }
  
  const stats = logbook.stats;
  
  let summaryStats;
  if (logbookTab === t(state, "logbook.summary")) {
    summaryStats = {
      events: stats.totalEvents,
      flights: stats.totalFlights,
      cuts: stats.totalCuts,
      flightSeconds: stats.totalFlightSeconds
    };
  } else {
    const classStats = stats.classes[logbookTab] || { flights: 0, cuts: 0, flightSeconds: 0 };
    summaryStats = {
      events: filteredEvents.length,
      flights: classStats.flights,
      cuts: classStats.cuts,
      flightSeconds: classStats.flightSeconds
    };
  }

  const classStatsHtml = logbookTab === t(state, "logbook.summary") ? Object.entries(stats.classes).map(([className, cls]) => `
    <article class="small-card" style="flex: 1; min-width: 160px; background: rgba(88, 183, 255, 0.04); border: 1px dashed rgba(88, 183, 255, 0.2);">
      <span style="color: var(--accent); font-weight: bold; font-size: 1.1rem; margin-bottom: 8px; display: block;">${escapeHtml(className)}</span>
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted);">
        <span>${t(state, "logbook.rounds_label")} <strong style="color: var(--text);">${cls.flights}</strong></span>
        <span>${t(state, "logbook.cuts_label")} <strong style="color: var(--text);">${cls.cuts}</strong></span>
      </div>
    </article>
  `).join('') : "";

  const summaryPanel = `
    <div style="margin-bottom: 32px;">
      <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px; font-size: 1.2rem;">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-color)"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
        ${logbookTab === t(state, "logbook.summary") ? t(state, "logbook.summary_all_classes") : t(state, "logbook.summary_class").replace("{class}", escapeHtml(logbookTab))}
      </h3>
      <style>
        .logbook-compact-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .logbook-compact-grid .small-card {
          min-height: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .logbook-compact-grid .small-card span {
          font-size: 0.75rem;
          margin-bottom: 4px;
        }
        .logbook-compact-grid .small-card strong {
          font-size: 1.5rem;
        }
        @media (max-width: 640px) {
          .logbook-compact-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .logbook-compact-grid .small-card {
            padding: 8px;
            border-radius: 12px;
          }
          .logbook-compact-grid .small-card strong {
            font-size: 1.4rem;
          }
        }
      </style>
      <div class="logbook-compact-grid">
        <article class="small-card"><span>${t(state, "logbook.events")}</span><strong>${summaryStats.events}</strong></article>
        <article class="small-card"><span>${t(state, "logbook.rounds")}</span><strong>${summaryStats.flights}</strong></article>
        <article class="small-card"><span>${t(state, "logbook.cuts")}</span><strong style="color: var(--accent);">${summaryStats.cuts}</strong></article>
        <article class="small-card"><span>${t(state, "logbook.flight_time")}</span><strong>${Math.floor(summaryStats.flightSeconds / 60)}<small style="font-size:0.6em; margin-left:4px; color: var(--muted);">min</small></strong></article>
      </div>
      ${classStatsHtml ? `<div style="display: flex; gap: 12px; flex-wrap: wrap;">${classStatsHtml}</div>` : ""}
    </div>
  `;

  const historyHtml = filteredEvents.length === 0 ? `<p class="muted">${t(state, "logbook.no_results_class")}</p>` : filteredEvents.map((ev, i) => {
    const flightsHtml = ev.flights.map(f => `
      <tr style="border-bottom: 1px solid var(--border); font-size: 0.95rem; transition: background 0.2s ease;">
        <td style="padding: 12px 20px; font-weight: 500;">${escapeHtml(f.roundLabel)}</td>
        <td style="padding: 12px 20px;">${f.score !== null ? `<strong style="color: var(--accent-strong);">${f.score}</strong>` : `<span class="muted">-</span>`}</td>
        <td style="padding: 12px 20px;">${f.cuts > 0 ? `<strong style="color: var(--accent);">${f.cuts}</strong>` : "0"}</td>
        <td style="padding: 12px 20px;">${Math.floor(f.flightSeconds / 60)}:${(f.flightSeconds % 60).toString().padStart(2, "0")}</td>
        <td style="padding: 12px 20px;">${f.streamerOk ? `<span style="color: #4ade80;">${t(state, "logbook.intact")}</span>` : `<span class="muted">-</span>`}</td>
      </tr>
    `).join('');

    const statusBadge = ev.resultsPublished 
      ? `<span class="badge badge-saved" style="font-size: 0.75rem;">${t(state, "logbook.status_official")}</span>` 
      : `<span class="badge badge-empty" style="font-size: 0.75rem;">${t(state, "logbook.status_draft")}</span>`;

    const isOpen = i === 0 ? "open" : "";
    return `
      <details class="panel" ${isOpen} style="margin-bottom: 24px; padding: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--panel); box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <summary style="list-style: none; cursor: pointer; outline: none; background: linear-gradient(135deg, rgba(88,183,255,0.08), transparent); padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <!-- Hide default webkit marker inline -->
          <style>details > summary::-webkit-details-marker { display: none; }</style>
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
              ${escapeHtml(ev.eventName)}
              ${statusBadge}
            </h4>
            <div class="muted" style="font-size: 0.9rem; display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
              <span style="display: flex; align-items: center; gap: 4px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${new Date(ev.eventDate).toLocaleDateString(state.settings.language === 'fi' ? "fi-FI" : "en-US")}</span>
              <span style="display: flex; align-items: center; gap: 4px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${escapeHtml(ev.eventLocation)}</span>
            </div>
            <div style="display: inline-flex; gap: 8px;">
              <span class="badge" style="background: var(--panel-strong); border: 1px solid var(--border); font-weight: 500;">${t(state, "logbook.class_label")} <span style="color: var(--accent); margin-left: 4px;">${escapeHtml(ev.className)}</span></span>
              ${ev.aircraftName ? `<span class="badge" style="background: var(--panel-strong); border: 1px solid var(--border); font-weight: 500;">${t(state, "logbook.aircraft_label")} <span style="color: var(--text); margin-left: 4px;">${escapeHtml(ev.aircraftName)}</span></span>` : ""}
            </div>
          </div>
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="text-align: right; background: var(--panel-strong); padding: 14px 20px; border-radius: 10px; border: 1px solid var(--border); min-width: 140px;">
              ${ev.resultsPublished && ev.ranking ? `<div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">${t(state, "logbook.ranking")}</div><div style="font-size: 1.6rem; font-weight: 800; color: var(--text); line-height: 1;">${ev.ranking}.</div>` : ""}
              ${ev.resultsPublished && ev.ranking ? `<div style="height: 1px; background: var(--border); margin: 10px 0;"></div>` : ""}
              ${ev.resultsPublished ? `<div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em;">${t(state, "logbook.points")}</div><div style="font-size: 1.2rem; font-weight: bold; color: var(--accent);">${ev.totalEventScore}</div>` : ""}
              ${!ev.resultsPublished ? `<div style="color: var(--muted); font-size: 0.9rem;">${t(state, "logbook.waiting_publication")}</div>` : ""}
            </div>
            <div style="color: var(--muted);">
               <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </summary>
        <div class="table-wrap" style="margin: 0; border: none; border-radius: 0;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin: 0;">
            <thead style="background: var(--panel-strong);">
              <tr style="font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">
                <th style="padding: 14px 20px; font-weight: 600;">${t(state, "logbook.round")}</th>
                <th style="padding: 14px 20px; font-weight: 600;">${t(state, "logbook.points")}</th>
                <th style="padding: 14px 20px; font-weight: 600;">${t(state, "logbook.cuts")}</th>
                <th style="padding: 14px 20px; font-weight: 600;">${t(state, "logbook.time")}</th>
                <th style="padding: 14px 20px; font-weight: 600;">${t(state, "logbook.streamer")}</th>
              </tr>
            </thead>
            <tbody>
              ${flightsHtml}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }).join('');

  return `
    <div class="stack">
      ${tabsHtml}
      ${summaryPanel}
      <h3 style="margin: 20px 0 10px 0;">${t(state, "logbook.history_title")}</h3>
      ${historyHtml}
    </div>
  `;
}
