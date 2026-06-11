import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { buildCompetitionResults, isCompetitionResultsPublished } from "../../logic/competitionResults.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";
import { getCompetitionFormatForClass, formatCompetitionStructureLabel } from "../../logic/competitionFormat.js";
import { getRouteParam } from "../../router.js";
import { t } from "../../utils/i18n.js";

export function renderResultsView(state) {
  const eventId = getRouteParam();
  
  if (!eventId) {
    return renderEventList(state);
  }

  const model = getResultsModel(state, eventId);
  return isAdmin(state) ? renderAdminResultsView(state, model) : renderPublicResultsView(state, model);
}

function renderEventList(state) {
  const allYears = Array.from(new Set(
    state.events
      .filter(e => e.date)
      .map(e => new Date(e.date).getFullYear())
      .filter(y => !isNaN(y) && y > 1900)
  )).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear);

  let selectedYear = window.RESULTS_YEAR || currentYear;
  if (!allYears.includes(selectedYear)) selectedYear = allYears[0];

  const events = state.events.filter(e => e.date && new Date(e.date).getFullYear() === selectedYear)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const yearTabs = `
    <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
      <div class="ui-tabs no-print" style="display: flex; gap: 10px; overflow-x: auto;">
        ${allYears.map(year => `
          <button type="button" class="button ${selectedYear === year ? 'primary' : 'dashed'}" data-action="set-results-year" data-year="${year}">${year}</button>
        `).join("")}
      </div>
    </div>
  `;

  const orgLogoHtml = state.settings?.organizationLogoData 
    ? `<div class="event-card-coat-of-arms" style="display: flex; align-items: center; justify-content: center; background: transparent;"><img src="${escapeHtml(state.settings.organizationLogoData)}" alt="Logo" style="max-width: 90%; max-height: 90%; object-fit: contain;" /></div>`
    : `<div class="event-card-coat-of-arms" style="display: flex; align-items: center; justify-content: center; font-size: 4rem; background: rgba(0,0,0,0.2);">🏆</div>`;

  const standingsCard = `
    <a href="#/standings/${selectedYear}" class="event-card event-card-hub" style="text-decoration: none; color: inherit; transition: transform 0.2s; cursor: pointer; display: flex; overflow: hidden; border: 2px solid var(--primary);">
      ${orgLogoHtml}
      <div class="event-card-main" style="flex: 1; padding: 20px;">
        <p class="kicker" style="margin-top: 0; font-weight: 800; color: var(--primary);">${t(state, "results.standings_kicker")}</p>
        <h4 style="margin: 0 0 5px 0; color: var(--text); font-size: 1.2rem;">${selectedYear} ${t(state, "results.total_points")}</h4>
        <p class="muted" style="margin: 0 0 10px 0;">${t(state, "results.all_season_events")}</p>
        <p class="muted" style="margin: 0; font-size: 0.9rem;">${t(state, "results.show_standings")}</p>
      </div>
    </a>
  `;

  const eventCards = events.map(event => {
    const location = event.location || t(state, "results.unknown_location");
    const dateStr = event.date ? new Date(event.date).toLocaleDateString("fi-FI") : "";
    
    const coatOfArmsHtml = event.eventInfo && event.eventInfo.coatOfArmsData
      ? `<div class="event-card-coat-of-arms"><img src="${escapeHtml(event.eventInfo.coatOfArmsData)}" alt="Vaakuna" /></div>`
      : "";

    return `
      <a href="#/results/${event.id}" class="event-card event-card-hub" style="text-decoration: none; color: inherit; transition: transform 0.2s; cursor: pointer; display: flex; overflow: hidden;">
        ${coatOfArmsHtml}
        <div class="event-card-main" style="flex: 1; padding: 20px;">
          <p class="kicker" style="margin-top: 0;">${dateStr}</p>
          <h4 style="margin: 0 0 5px 0; color: var(--primary); font-size: 1.2rem;">${escapeHtml(event.name)}</h4>
          <p style="margin: 0 0 10px 0;">${escapeHtml(location)}</p>
          <p class="muted" style="margin: 0; font-size: 0.9rem;">${t(state, "results.click_to_view")}</p>
        </div>
      </a>
    `;
  }).join("");

  return `
    ${yearTabs}
    <div style="margin-top: 20px;">
      <p class="muted">${t(state, "results.select_event_or_standings")}</p>
      <div style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); margin-bottom: 30px;">
        ${standingsCard}
        ${eventCards}
      </div>
    </div>
  `;
}

function getResultsModel(state, eventId) {
  const activeEvent = state.events.find(e => e.id === eventId);
  if (!activeEvent) return { activeEvent: null, entries: [], heats: [], eventResults: [], competitionResults: buildCompetitionResults(state, null) };

  const entries = state.entries.filter((entry) => entry.eventId === activeEvent.id);
  const heats = state.heats.filter((heat) => heat.eventId === activeEvent.id);
  const eventResults = state.results.filter((result) => heats.some((heat) => heat.id === result.heatId));
  const competitionResults = buildCompetitionResults(state, activeEvent);
  return { activeEvent, entries, heats, eventResults, competitionResults };
}

function renderAdminResultsView(state, model) {
  const { activeEvent, eventResults, competitionResults } = model;
  if (!activeEvent) {
    return UI.Panel({ title: t(state, "results.event_not_found") }, `<p>${t(state, "results.check_address_or_return")}</p>`);
  }

  const published = isCompetitionResultsPublished(activeEvent);

  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <h3 style="margin: 0;">${escapeHtml(activeEvent.name)}</h3>
    </div>
    <section class="results-clean-stack">
      ${renderResultsContent(state, model, true, published)}
    </section>
  `;
}

function renderPublicResultsView(state, model) {
  const { activeEvent, competitionResults, heats } = model;
  if (!activeEvent) {
    return UI.Panel({ title: t(state, "results.event_not_found") }, `<p>${t(state, "results.check_address_or_return")}</p>`);
  }

  const published = isCompetitionResultsPublished(activeEvent);

  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <h3 style="margin: 0;">${escapeHtml(activeEvent.name)}</h3>
    </div>
    <section class="results-clean-stack">
      ${renderResultsContent(state, model, false, published)}
    </section>
  `;
}





function renderResultsContent(state, model, admin, published = true) {
  const { activeEvent, competitionResults, eventResults } = model;
  const { rows } = competitionResults;
  
  const classNames = activeEvent?.classes?.length 
    ? [...activeEvent.classes] 
    : Array.from(new Set(rows.map((row) => row.className || t(state, "results.general_class")))).sort();
  
  let tab = window.RESULTS_TAB || classNames[0] || (admin ? "julkaisu" : "");
  
  if (tab !== "julkaisu" && !classNames.includes(tab)) {
    tab = classNames[0] || (admin ? "julkaisu" : "");
  }

  const tabs = [];
  classNames.forEach(className => {
    tabs.push({ id: className, label: className });
  });
  if (admin) tabs.push({ id: "julkaisu", label: t(state, "results.publication") });

  let extraActions = "";
  if (admin) {
    const hasResults = competitionResults.stats.resultRows > 0 || eventResults.length > 0;
    extraActions = `
      <div style="display: flex; gap: 8px; align-items: center; margin-left: 10px;" class="no-print">
        ${UI.Button({ label: t(state, "results.export_csv"), action: "export-results-csv", eventId: activeEvent.id, variant: "dashed" })}
        ${hasResults && !published ? UI.Button({ label: t(state, "results.publish"), action: "publish-competition-results", eventId: activeEvent.id, variant: "primary" }) : ""}
        ${published ? UI.Button({ label: t(state, "results.hide"), action: "unpublish-competition-results", eventId: activeEvent.id, variant: "danger" }) : ""}
      </div>
    `;
  }

  const tabNavigation = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto; align-items: center; justify-content: flex-start;">
      ${tabs.map(t => UI.Button({ label: t.label, action: "set-results-tab", tab: t.id, variant: tab === t.id ? 'primary' : 'dashed' })).join("")}
      ${extraActions}
    </div>
  `;

  let tabContent = "";
  if (tab === "julkaisu" && admin) {
    tabContent = renderPublicationPanel(state, activeEvent, eventResults.length);
  } else if (tab) {
    tabContent = renderSingleClassResultsPanel(state, activeEvent, competitionResults, tab, admin, published);
  } else {
    tabContent = `<p class="muted">${t(state, "results.no_classes_or_results")}</p>`;
  }

  return `
    ${tabNavigation}
    ${tabContent}
  `;
}


function renderSingleClassResultsPanel(state, activeEvent, competitionResults, className, admin, published = true) {
  if (!admin && !published) {
    return UI.Panel({
      className: "empty-state",
      kicker: t(state, "results.waiting_for_admin_kicker"),
      title: t(state, "results.not_published_title")
    }, `<p class="muted">${t(state, "results.not_published_msg")}</p>`);
  }

  const { rows } = competitionResults;
  const classRows = rows.filter(r => (r.className || t(state, "results.general_class")) === className);
  const resultRows = classRows.filter((row) => row.resultCount > 0 || row.status === "result");
  const resultPilotIds = new Set(resultRows.map(r => r.pilotId));
  
  // Exclude pilots who already have a result from the waiting list (e.g. duplicate ghost entries)
  let waitingRows = classRows.filter((row) => !(row.resultCount > 0 || row.status === "result") && !resultPilotIds.has(row.pilotId));

  // If published, we probably don't need to show the 'Not yet resulting' block, 
  // as the competition is over and they are simply DNS (Did Not Start).
  if (published) {
    waitingRows = [];
  }

  const rankedRows = resultRows.map((r, index) => ({ ...r, classPosition: index + 1 }));

  const format = getCompetitionFormatForClass(activeEvent, className);
  const structureLabel = formatCompetitionStructureLabel(format);

  const content = `
    <p class="muted results-section-help">${t(state, "results.class_stats_msg").replace("{count}", rankedRows.length).replace("{structure}", structureLabel)}</p>
    ${renderResultsTable(state, rankedRows, admin, true, format)}
    ${waitingRows.length ? renderWaitingResultsPanel(state, waitingRows) : ""}
  `;

  const badge = UI.Badge({ label: published ? t(state, "results.published") : t(state, "results.unpublished"), variant: published ? "approved" : "pending" });

  return UI.Panel({
    kicker: t(state, "results.class_results_kicker"),
    title: className,
    headerActions: badge
  }, content);
}

function renderPublicationPanel(state, activeEvent, resultCount) {
  const published = isCompetitionResultsPublished(activeEvent);
  
  if (published) {
    return UI.Panel({ kicker: t(state, "results.publication"), title: t(state, "results.results_published_title") }, `
      <div class="notice-text compact success-notice" style="margin-bottom: 15px;">
        ${t(state, "results.results_published_msg")}
        ${activeEvent.resultsPublishedAt ? `<br>${t(state, "results.published_at")} ${escapeHtml(new Date(activeEvent.resultsPublishedAt).toLocaleString("fi-FI"))}` : ""}
        ${activeEvent.resultsApprovedBy ? `<br>${t(state, "results.approved_by")} ${escapeHtml(activeEvent.resultsApprovedBy)}` : ""}
      </div>
      ${UI.Button({ label: t(state, "results.hide_publication"), action: "unpublish-competition-results", variant: "danger" })}
    `);
  }

  return UI.Panel({ kicker: t(state, "results.publication"), title: t(state, "results.results_draft_title") }, `
    <div class="notice-text compact warning-notice" style="margin-bottom: 15px;">
      ${t(state, "results.results_draft_msg")} ${resultCount}.
    </div>
    ${UI.Button({ label: t(state, "results.publish_competition_results"), action: "publish-competition-results", variant: "primary" })}
  `);
}



function renderWaitingResultsPanel(state, rows) {
  return `
    <details class="result-group no-result-group">
      <summary>${t(state, "results.no_result_yet")} · ${rows.length} ${t(state, "results.participants")}</summary>
      <div class="waiting-result-list">
        ${rows.map((row) => `
          <div class="waiting-result-row">
            <strong>${escapeHtml(row.pilotName)}</strong>
            <span>${escapeHtml(row.className)} · ${escapeHtml(row.aircraftName)}</span>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

export function renderResultsTable(state, rows, showDetails = false, classPositions = false, format = null) {
  const roundColumns = (showDetails || format) ? getVisibleRoundColumns(state, rows, format) : [];
  const headers = ["#", "", t(state, "results.pilot"), t(state, "results.country"), t(state, "results.class"), t(state, "results.points"), ...roundColumns, t(state, "results.cuts")];
  if (showDetails) headers.push(t(state, "results.flight_time"), t(state, "results.best_round"), t(state, "results.rounds"));
  headers.push(""); // Tyhjä otsikko painikkeelle

  if (!rows.length) {
    return `<div class="empty-results-box">${t(state, "results.no_results_saved")}</div>`;
  }

  const tableRows = rows.map((row, index) => {
    const pilot = state.pilots.find(p => p.id === row.pilotId);
    const avatarHtml = pilot && (pilot.avatarData || pilot.avatarUrl) ?
      `<div style="width: 28px; height: 28px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 1px solid var(--border); flex-shrink: 0;"></div>` : "";

    const roundMap = new Map((row.roundBreakdown || []).map((item) => [item.label, item]));
    const cells = [
      classPositions ? row.classPosition : index + 1,
      `<div style="display: flex; justify-content: center; align-items: center; width: 32px;">${avatarHtml}</div>`,
      `<div>
        <strong>${escapeHtml(row.pilotName)}</strong>
        ${row.club ? `<div class="muted" style="font-size: 0.85em; margin-top: 2px;">${escapeHtml(row.club)}</div>` : ""}
      </div>`,
      row.country ? UI.CountryFlag(row.country) : '<span class="muted">-</span>',
      escapeHtml(row.className),
      `<strong>${row.totalScore}</strong>`,
      ...roundColumns.map((label) => {
        const item = roundMap.get(label);
        if (!item || !item.completed) return '<span class="muted">–</span>';
        return `<span class="heat-score-cell">${item.score} p</span>`;
      }),
      row.totalCuts
    ];

    if (showDetails) {
      cells.push(`${row.totalFlightSeconds}s`, `${row.bestHeatScore} p`, row.resultCount);
    }
    
    // Tulostuspainike (Pöytäkirja) rivin loppuun
    cells.push(`
      <div style="display: flex; gap: 4px; justify-content: flex-end;">
        ${UI.Button({ label: "Scorecard", action: "print-pilot-scorecard", entryId: escapeHtml(row.entryId), variant: "small dashed" })}
      </div>
    `);

    return UI.TableRow({ cells, headers });
  });

  return UI.TableContainer({
    content: UI.Table({ headers, rows: tableRows })
  });
}

function getVisibleRoundColumns(state, rows, format = null) {
  if (format) {
    const columns = [];
    for (let i = 1; i <= format.qualifyingRounds; i++) {
      columns.push(`${t(state, "results.qualifying")} ${i}`);
    }
    if (format.semiFinalEnabled) columns.push(t(state, "results.semifinal"));
    if (format.finalEnabled) columns.push(t(state, "results.final"));
    return columns;
  }

  const labels = new Set();

  rows.forEach((row) => {
    (row.roundBreakdown || []).forEach((item) => {
      if (item?.label) labels.add(item.label);
    });
  });

  return Array.from(labels).sort(compareRoundLabels);
}

function compareRoundLabels(a, b) {
  const parse = (label) => {
    if (/^(heat|alkuerä|qualifying)\s+\d+/i.test(label)) {
      return { bucket: 1, number: Number(label.match(/\d+/)?.[0] || 0) };
    }
    if (/semifinaali|semifinal/i.test(label)) return { bucket: 2, number: 0 };
    if (/finaali|final/i.test(label)) return { bucket: 3, number: 0 };
    return { bucket: 9, number: 0 };
  };

  const aInfo = parse(a);
  const bInfo = parse(b);
  if (aInfo.bucket !== bInfo.bucket) return aInfo.bucket - bInfo.bucket;
  if (aInfo.number !== bInfo.number) return aInfo.number - bInfo.number;
  return String(a).localeCompare(String(b), "fi", { numeric: true });
}

function renderHeatStatusPanel(state, heats) {
  const list = heats.length ? `
    <div class="card-list">
      ${heats.map((heat) => `<article class="small-card"><p class="kicker">${t(state, "heats.round")} ${heat.round}</p><h4>${t(state, "heats.heat")} ${escapeHtml(heat.groupName)}</h4><p class="muted">Status: ${escapeHtml(heat.status)}</p></article>`).join("")}
    </div>
  ` : `<p class="muted">${t(state, "results.heats_not_published")}</p>`;

  return UI.Panel({
    kicker: t(state, "heats.heats_suffix"),
    title: t(state, "results.heat_status")
  }, list);
}
