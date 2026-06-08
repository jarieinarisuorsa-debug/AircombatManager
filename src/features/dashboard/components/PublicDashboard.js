import { escapeHtml, formatDateRange } from "../../../utils/html.js";
import { isCompetitionResultsPublished } from "../../../logic/competitionResults.js";
import { groupParticipantsByClass } from "../../../logic/participants.js";
import { UI } from "../../../ui/engine.js";
import { getEventSummary } from "../dashboardHelpers.js";

export function renderPublicDashboard(state) {
  const { activeEvent, competitionResults, publicParticipants } = getEventSummary(state);

  if (!activeEvent) {
    return `
      ${UI.PageHeader({
        kicker: "Kilpailu / tiedotteet",
        title: "Valitse kilpailu kisakalenterista",
        subtitle: "Kisakalenteri on julkisen puolen pääsisäänkäynti kilpailuihin.",
        headerActions: `<a class="button primary" href="#/calendar">Avaa kisakalenteri</a>`
      })}
    `;
  }

  const published = isCompetitionResultsPublished(activeEvent);
  const publicRanking = published ? competitionResults.rows.slice(0, 5) : [];
  const classSummary = buildPublicClassSummary(activeEvent, publicParticipants);
  const notice = String(activeEvent.publicNotice || "").trim();

  const heroPanel = UI.PageHeader({
    kicker: "Kilpailu / tiedotteet",
    title: activeEvent.name,
    subtitle: `${escapeHtml(activeEvent.location)} · ${formatDateRange(activeEvent.date, activeEvent.endDate)}`,
    headerActions: UI.Flex({ gap: "10px", wrap: "wrap" }, `
      <a class="button" href="#/calendar">← Kisakalenteri</a>
      <a class="button primary" href="#/heats">Heat-aikataulu</a>
      <a class="button" href="#/results">Kilpailutulokset</a>
    `)
  });

  const noticePanel = UI.Panel({
    kicker: "Kilpailunjohdon tiedote",
    title: notice ? "Ajankohtaista" : "Ei julkaistuja tiedotteita"
  }, notice
    ? `<p class="notice-text public-notice-text">${escapeHtml(notice)}</p>`
    : `<p class="muted">Kilpailunjohto ei ole vielä julkaissut tiedotteita tähän kilpailuun.</p>`);

  const eventInfoPanel = UI.Panel({
    kicker: "Kilpailu",
    title: "Perustiedot"
  }, `
    <div class="public-event-info-grid">
      <article class="small-card">
        <span class="muted">Paikka</span>
        <strong>${escapeHtml(activeEvent.location || "-")}</strong>
      </article>
      <article class="small-card">
        <span class="muted">Ajankohta</span>
        <strong>${formatDateRange(activeEvent.date, activeEvent.endDate)}</strong>
      </article>
      <article class="small-card">
        <span class="muted">Luokat</span>
        <strong>${(activeEvent.classes || []).map(escapeHtml).join(", ") || "-"}</strong>
      </article>
      <article class="small-card">
        <span class="muted">Status</span>
        <strong>${escapeHtml(activeEvent.status || "-")}</strong>
      </article>
    </div>
  `);

  const classSummaryPanel = UI.Panel({
    kicker: "Osallistujat",
    title: "Luokat"
  }, `
    <div class="public-class-summary-grid">
      ${classSummary.map((item) => `
        <article class="small-card">
          <p class="kicker">${escapeHtml(item.className)}</p>
          <strong>${item.count}</strong>
          <span class="muted">osallistujaa</span>
        </article>
      `).join("")}
    </div>
  `);

  const top5Panel = UI.Panel({
    kicker: "Kilpailutulokset",
    title: published ? "Top 5" : "Tuloksia ei ole vielä julkaistu"
  }, published ? renderPublicRankingTable(publicRanking) : `
    <p class="muted">Kilpailutulokset julkaistaan, kun kilpailunjohto hyväksyy lopputulokset.</p>
    <div class="ui-form-actions"><a class="button small" href="#/results">Avaa tulosnäkymä</a></div>
  `);

  return [
    heroPanel,
    UI.Grid({ columns: "minmax(280px, 1.1fr) minmax(280px, 0.9fr)", gap: "18px", className: "public-start-grid" }, noticePanel + eventInfoPanel),
    classSummaryPanel,
    top5Panel
  ].join("");
}

function buildPublicClassSummary(activeEvent, publicParticipants) {
  const classes = activeEvent?.classes?.length ? activeEvent.classes : [...new Set(publicParticipants.map((row) => row.className))];
  return classes.map((className) => ({
    className,
    count: publicParticipants.filter((row) => row.className === className).length
  }));
}

function renderPublicRankingTable(rows) {
  if (!rows.length) return `<p class="muted">Kilpailutuloksia ei ole vielä julkaistu.</p>`;

  const headers = ["#", "Pilotti", "Luokka", "Pisteet"];
  const tableRows = rows.map((row) => {
    return UI.TableRow({ cells: [
      row.position,
      escapeHtml(row.pilotName),
      escapeHtml(row.className),
      `<strong>${row.totalScore}</strong>`
    ]});
  });

  return UI.TableContainer({
    content: UI.Table({ headers, rows: tableRows })
  });
}
