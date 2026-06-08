import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { buildCompetitionResults, isCompetitionResultsPublished } from "../../logic/competitionResults.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";

export function renderResultsView(state) {
  const model = getResultsModel(state);
  return isAdmin(state) ? renderAdminResultsView(state, model) : renderPublicResultsView(state, model);
}

function getResultsModel(state) {
  const activeEvent = getActiveEvent(state);
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
    return UI.Panel({ title: "Ei aktiivista kisaa" }, "<p>Avaa kilpailu kisakalenterista.</p>");
  }

  const published = isCompetitionResultsPublished(activeEvent);
  const hasResults = competitionResults.stats.resultRows > 0 || eventResults.length > 0;
  
  const headerActions = `
    <a class="button dashed" href="#/scorecards">Avaa tuloskortit</a>
    ${UI.Button({ label: "Vie CSV", action: "export-results-csv", variant: "dashed" })}
    ${hasResults && !published ? UI.Button({ label: "Julkaise kilpailutulokset", action: "publish-competition-results", variant: "primary" }) : ""}
    ${published ? UI.Button({ label: "Piilota julkaisu", action: "unpublish-competition-results", variant: "danger" }) : ""}
  `;

  const pageHeader = UI.PageHeader({
    kicker: "Kilpailutulokset",
    title: activeEvent.name,
    headerActions: UI.Flex({ gap: "10px", wrap: "wrap" }, headerActions)
  });

  return `
    ${pageHeader}
    <section class="results-clean-stack">
      ${renderCompactStats(competitionResults.stats, published)}
      ${!hasResults ? renderEmptyState() : renderResultsContent(state, model, true)}
    </section>
  `;
}

function renderPublicResultsView(state, model) {
  const { activeEvent, competitionResults, heats } = model;
  if (!activeEvent) {
    return UI.Panel({ title: "Ei aktiivista kisaa" }, "<p>Avaa kilpailu kisakalenterista.</p>");
  }

  const published = isCompetitionResultsPublished(activeEvent);
  
  const pageHeader = UI.PageHeader({
    kicker: "Julkiset kilpailutulokset",
    title: activeEvent.name,
    headerActions: UI.Badge({ label: published ? "Julkaistu" : "Ei julkaistu", variant: published ? "approved" : "pending" })
  });

  if (!published) {
    return `
      ${pageHeader}
      ${UI.Panel({
        className: "empty-state",
        kicker: "Odottaa kilpailunjohtoa",
        title: "Kilpailutuloksia ei ole vielä julkaistu"
      }, `<p class="muted">Tulokset tulevat näkyviin, kun admin hyväksyy ja julkaisee kilpailun lopullisen rankingin.</p>`)}
      ${renderHeatStatusPanel(heats)}
    `;
  }

  return `
    ${pageHeader}
    <section class="results-clean-stack">
      ${renderCompactStats(competitionResults.stats, published)}
      ${renderResultsContent(state, model, false)}
      ${renderHeatStatusPanel(heats)}
    </section>
  `;
}

function renderCompactStats(stats, published) {
  return `
    <div class="result-stat-grid" style="margin-bottom: 20px;">
      <article class="small-card"><span>Tila</span><strong>${published ? "Julkaistu" : "Luonnos"}</strong></article>
      <article class="small-card"><span>Tuloskortteja</span><strong>${stats.scoreCards || 0}</strong></article>
      <article class="small-card"><span>Tulosrivejä</span><strong>${stats.resultRows}</strong></article>
      <article class="small-card"><span>Cutteja</span><strong>${stats.totalCuts}</strong></article>
    </div>
  `;
}

function renderEmptyState() {
  return UI.Panel({
    className: "empty-state",
    kicker: "Ei tuloksia",
    title: "Kilpailutuloksia ei ole vielä tallennettu."
  }, `
    <p class="muted" style="margin-bottom: 15px;">Aloita syöttämällä tuloksia tuloskorttien kautta.</p>
    <a class="button primary" href="#/scorecards">Avaa tuloskortit</a>
  `);
}

function renderResultsContent(state, model, admin) {
  const tab = window.RESULTS_TAB || "yhteenveto";
  const { activeEvent, competitionResults, eventResults } = model;

  const tabs = [
    { id: "yhteenveto", label: "Yhteenveto" },
    { id: "ranking", label: "Ranking" },
    { id: "luokat", label: "Luokkakohtaiset" }
  ];
  if (admin) tabs.push({ id: "julkaisu", label: "Julkaisu" });

  const tabNavigation = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      ${tabs.map(t => `<button type="button" class="button ${tab === t.id ? 'primary' : 'dashed'}" data-action="set-results-tab" data-tab="${t.id}">${t.label}</button>`).join("")}
    </div>
  `;

  let tabContent = "";
  if (tab === "yhteenveto") tabContent = renderCompetitionSummaryPanel(competitionResults, admin);
  else if (tab === "ranking") tabContent = renderRankingPanel(state, competitionResults, admin);
  else if (tab === "luokat") tabContent = renderClassResultsPanel(state, competitionResults);
  else if (tab === "julkaisu" && admin) tabContent = renderPublicationPanel(activeEvent, eventResults.length);

  return `
    ${tabNavigation}
    ${tabContent}
  `;
}

function renderCompetitionSummaryPanel(competitionResults, admin) {
  const { rows } = competitionResults;
  const podium = rows.slice(0, 3);
  
  const podiumGrid = podium.length ? `
    <div class="podium-grid">
      ${podium.map((row) => `
        <article class="podium-card place-${row.position}">
          <span class="podium-place">${row.position}</span>
          <h4>${escapeHtml(row.pilotName)}</h4>
          <p>${escapeHtml(row.className)} · ${escapeHtml(row.aircraftName)}</p>
          <strong>${row.totalScore} p</strong>
        </article>
      `).join("")}
    </div>
  ` : `<p class="muted">Podium muodostuu automaattisesti, kun heat-tuloksia on tallennettu.</p>`;

  return UI.Panel({
    className: "competition-summary-panel",
    kicker: "Yhteenveto",
    title: "Kilpailun Podium"
  }, podiumGrid);
}

function renderRankingPanel(state, competitionResults, showDetails) {
  const { rows } = competitionResults;
  const resultRows = rows.filter((row) => row.resultCount > 0 || row.status === "result");
  const waitingRows = rows.filter((row) => !(row.resultCount > 0 || row.status === "result"));

  const content = `
    <p class="muted results-section-help">Sarakkeet muodostuvat kilpailurakenteen mukaan. Alkuerät, semifinaali ja finaali näkyvät luokalle määritetyn rakenteen mukaisesti.</p>
    ${renderResultsTable(state, resultRows, showDetails)}
    ${waitingRows.length ? renderWaitingResultsPanel(waitingRows) : ""}
  `;

  return UI.Panel({
    kicker: "Ranking",
    title: "Kokonaisranking"
  }, content);
}

function renderClassResultsPanel(state, competitionResults) {
  const { rows } = competitionResults;
  const resultRows = rows.filter((row) => row.resultCount > 0 || row.status === "result");
  const classGroups = buildVisibleClassGroups(resultRows);

  if (classGroups.length <= 1) {
    return UI.Panel({ kicker: "Luokat", title: "Luokkakohtaiset tulokset" }, `<p class="muted">Kilpailussa on vain yksi luokka, katso sijoitukset Ranking-välilehdeltä.</p>`);
  }

  const content = `
    <div class="class-results">
      ${classGroups.map((group) => `
        <details class="result-group" open>
          <summary>${escapeHtml(group.className)} · ${group.rows.length} tuloksellista pilottia</summary>
          ${renderResultsTable(state, group.rows, false, true)}
        </details>
      `).join("")}
    </div>
  `;

  return UI.Panel({
    kicker: "Luokat",
    title: "Luokkakohtaiset tulokset"
  }, content);
}

function renderPublicationPanel(activeEvent, resultCount) {
  const published = isCompetitionResultsPublished(activeEvent);
  
  if (published) {
    return UI.Panel({ kicker: "Julkaisu", title: "Tulokset on julkaistu" }, `
      <div class="notice-text compact success-notice" style="margin-bottom: 15px;">
        Kilpailutulokset on julkaistu peruskäyttäjille.
        ${activeEvent.resultsPublishedAt ? `<br>Julkaistu: ${escapeHtml(new Date(activeEvent.resultsPublishedAt).toLocaleString("fi-FI"))}` : ""}
        ${activeEvent.resultsApprovedBy ? `<br>Hyväksyjä: ${escapeHtml(activeEvent.resultsApprovedBy)}` : ""}
      </div>
      ${UI.Button({ label: "Piilota julkaisu", action: "unpublish-competition-results", variant: "danger" })}
    `);
  }

  return UI.Panel({ kicker: "Julkaisu", title: "Tulokset ovat luonnostilassa" }, `
    <div class="notice-text compact warning-notice" style="margin-bottom: 15px;">
      Peruskäyttäjä ei näe lopullista rankingia ennen julkaisua.
      Tallennettuja tulosrivejä: ${resultCount}.
    </div>
    ${UI.Button({ label: "Julkaise kilpailutulokset", action: "publish-competition-results", variant: "primary" })}
  `);
}

function buildVisibleClassGroups(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const className = row.className || "Yleinen";
    if (!groups.has(className)) groups.set(className, []);
    groups.get(className).push(row);
  });

  return Array.from(groups.entries()).map(([className, groupRows]) => ({
    className,
    rows: groupRows.map((row, index) => ({ ...row, classPosition: index + 1 }))
  }));
}

function renderWaitingResultsPanel(rows) {
  return `
    <details class="result-group no-result-group">
      <summary>Ei tulosta vielä · ${rows.length} osallistujaa</summary>
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

export function renderResultsTable(state, rows, showDetails = false, classPositions = false) {
  const roundColumns = showDetails ? getVisibleRoundColumns(rows) : [];
  const headers = ["#", "Pilotti", "Luokka", "Pisteet", ...roundColumns, "Cutit"];
  if (showDetails) headers.push("Lentoaika", "Paras kierros", "Kierroksia");

  if (!rows.length) {
    return `<div class="empty-results-box">Kilpailutuloksia ei ole vielä tallennettu.</div>`;
  }

  const tableRows = rows.map((row, index) => {
    const pilot = state.pilots.find(p => p.id === row.pilotId);
    const avatarHtml = pilot && (pilot.avatarData || pilot.avatarUrl) ?
      `<div style="width: 28px; height: 28px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 1px solid var(--border); flex-shrink: 0;"></div>` : "";

    const roundMap = new Map((row.roundBreakdown || []).map((item) => [item.label, item]));
    const cells = [
      classPositions ? row.classPosition : index + 1,
      UI.Flex({ gap: "10px" }, `
        ${avatarHtml}
        <div>
          <strong>${escapeHtml(row.pilotName)}</strong><span class="muted block">${escapeHtml([row.country, row.club].filter(Boolean).join(" · "))}</span>
        </div>
      `),
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

    return UI.TableRow({ cells });
  });

  return UI.TableContainer({
    content: UI.Table({ headers, rows: tableRows })
  });
}

function getVisibleRoundColumns(rows) {
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
    if (/^(heat|alkuerä)\s+\d+/i.test(label)) {
      return { bucket: 1, number: Number(label.match(/\d+/)?.[0] || 0) };
    }
    if (/semifinaali/i.test(label)) return { bucket: 2, number: 0 };
    if (/finaali/i.test(label)) return { bucket: 3, number: 0 };
    return { bucket: 9, number: 0 };
  };

  const aInfo = parse(a);
  const bInfo = parse(b);
  if (aInfo.bucket !== bInfo.bucket) return aInfo.bucket - bInfo.bucket;
  if (aInfo.number !== bInfo.number) return aInfo.number - bInfo.number;
  return String(a).localeCompare(String(b), "fi", { numeric: true });
}

function renderHeatStatusPanel(heats) {
  const list = heats.length ? `
    <div class="card-list">
      ${heats.map((heat) => `<article class="small-card"><p class="kicker">Kierros ${heat.round}</p><h4>Heat ${escapeHtml(heat.groupName)}</h4><p class="muted">Status: ${escapeHtml(heat.status)}</p></article>`).join("")}
    </div>
  ` : `<p class="muted">Heat-ryhmiä ei ole vielä julkaistu.</p>`;

  return UI.Panel({
    kicker: "Heatit",
    title: "Tulosryhmien tila"
  }, list);
}
