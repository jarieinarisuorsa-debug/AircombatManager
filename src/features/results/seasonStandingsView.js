import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { buildSeasonStandings } from "../../logic/seasonStandings.js";
import { getRouteParam } from "../../router.js";

export function renderSeasonStandingsView(state) {
  const paramYear = getRouteParam();
  
  const allYears = Array.from(new Set(
    state.events
      .filter(e => e.date)
      .map(e => new Date(e.date).getFullYear())
      .filter(y => !isNaN(y) && y > 1900)
  )).sort((a, b) => b - a);
  
  const currentYear = new Date().getFullYear();
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear);

  let selectedYear = paramYear ? parseInt(paramYear, 10) : (window.STANDINGS_YEAR || currentYear);
  if (!allYears.includes(selectedYear)) selectedYear = allYears[0];
  window.STANDINGS_YEAR = selectedYear;

  const data = buildSeasonStandings(state, selectedYear);
  
  const yearTabs = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      ${allYears.map(year => `
        <button type="button" class="button ${selectedYear === year ? 'primary' : 'dashed'}" data-action="set-standings-year" data-year="${year}">${year}</button>
      `).join("")}
    </div>
  `;

  if (data.events.length === 0) {
    return `
      ${yearTabs}
      ${UI.Panel({ title: "Ei tuloksia", kicker: "Sarjataulukko " + selectedYear }, `<p>Vuodelle ${selectedYear} ei ole vielä julkaistuja kilpailutuloksia.</p>`)}
    `;
  }

  let selectedClass = window.STANDINGS_CLASS || data.classes[0];
  if (!data.classes.includes(selectedClass)) selectedClass = data.classes[0];
  window.STANDINGS_CLASS = selectedClass;

  const classTabs = `
    <nav class="sub-nav no-print" style="margin-bottom: 20px;">
      ${data.classes.map(className => `
        <button type="button" class="button ${selectedClass === className ? 'primary' : 'dashed'}" data-action="set-standings-class" data-class="${className}">${className}</button>
      `).join("")}
    </nav>
  `;

  const standings = data.standings[selectedClass] || [];

  const tableHeaders = `
    <tr>
      <th style="width: 50px; text-align: center;">Sija</th>
      <th>Pilotti</th>
      <th>Maa</th>
      <th style="width: 100px; text-align: right; font-weight: 800;">YHTEENSÄ</th>
      ${data.events.map(event => `<th style="text-align: right; font-size: 0.85em;">${escapeHtml(event.name)}</th>`).join("")}
    </tr>
  `;

  const tableRows = standings.map(row => `
    <tr>
      <td style="text-align: center;"><strong>${row.position}.</strong></td>
      <td><strong>${escapeHtml(row.pilotName)}</strong></td>
      <td>${row.country ? `<span style="background: rgba(255,255,255,0.1); padding: 3px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; border: 1px solid rgba(255,255,255,0.2);">${escapeHtml(row.country)}</span>` : '<span class="muted">-</span>'}</td>
      <td style="text-align: right; font-weight: 800; color: var(--primary);">${row.totalScore} p</td>
      ${data.events.map(event => `
        <td style="text-align: right; color: var(--muted);">${row.eventScores[event.id] !== undefined ? row.eventScores[event.id] + " p" : "-"}</td>
      `).join("")}
    </tr>
  `).join("");

  const content = `
    <div class="table-container">
      <table class="ui-table">
        <thead>${tableHeaders}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;

  const orgLogoHtml = state.settings?.organizationLogoData 
    ? `<div style="text-align: right; margin-bottom: -40px;"><img src="${escapeHtml(state.settings.organizationLogoData)}" alt="Logo" style="max-height: 60px;" class="no-print" /></div>`
    : "";

  return `
    ${yearTabs}
    ${UI.Panel({ title: selectedClass, kicker: "Sarjataulukko " + selectedYear, headerActions: UI.Button({ label: "Tulosta taulukko", action: "print-page", variant: "small dashed no-print" }) }, `
      ${orgLogoHtml}
      ${classTabs}
      ${content}
    `)}
  `;
}
