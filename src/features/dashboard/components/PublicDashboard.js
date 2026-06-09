import { escapeHtml, formatDateRange } from "../../../utils/html.js";
import { isCompetitionResultsPublished } from "../../../logic/competitionResults.js";
import { groupParticipantsByClass } from "../../../logic/participants.js";
import { UI } from "../../../ui/engine.js";
import { getEventSummary } from "../dashboardHelpers.js";
import { t } from "../../../utils/i18n.js";

export function renderPublicDashboard(state) {
  const { activeEvent, competitionResults, publicParticipants } = getEventSummary(state);

  if (!activeEvent) {
    return `
      ${UI.PageHeader({
        kicker: t(state, "dashboard.public_hero_kicker"),
        title: t(state, "dashboard.public_hero_title"),
        subtitle: t(state, "dashboard.public_hero_subtitle"),
        headerActions: `<a class="button primary" href="#/calendar">${t(state, "dashboard.open_calendar")}</a>`
      })}
    `;
  }

  const published = isCompetitionResultsPublished(activeEvent);
  const publicRanking = published ? competitionResults.rows.slice(0, 5) : [];
  const classSummary = buildPublicClassSummary(activeEvent, publicParticipants);
  const notice = String(activeEvent.publicNotice || "").trim();

  const heroPanel = UI.PageHeader({
    kicker: t(state, "dashboard.public_hero_kicker"),
    title: activeEvent.name,
    subtitle: `${escapeHtml(activeEvent.location)} · ${formatDateRange(activeEvent.date, activeEvent.endDate)}`,
    headerActions: UI.Flex({ gap: "10px", wrap: "wrap" }, `
      <a class="button" href="#/calendar">${t(state, "dashboard.public_btn_calendar")}</a>
      <a class="button primary" href="#/heats">${t(state, "dashboard.public_btn_heats")}</a>
      <a class="button" href="#/results">${t(state, "dashboard.public_btn_results")}</a>
    `)
  });

  const noticePanel = UI.Panel({
    kicker: t(state, "dashboard.public_notice_kicker"),
    title: notice ? t(state, "dashboard.public_notice_title_active") : t(state, "dashboard.public_notice_title_none")
  }, notice
    ? `<p class="notice-text public-notice-text">${escapeHtml(notice)}</p>`
    : `<p class="muted">${t(state, "dashboard.public_notice_none")}</p>`);

  const eventInfoPanel = UI.Panel({
    kicker: t(state, "dashboard.public_info_kicker"),
    title: t(state, "dashboard.public_info_title")
  }, `
    <div class="public-event-info-grid">
      <article class="small-card">
        <span class="muted">${t(state, "dashboard.public_info_loc")}</span>
        <strong>${escapeHtml(activeEvent.location || "-")}</strong>
      </article>
      <article class="small-card">
        <span class="muted">${t(state, "dashboard.public_info_date")}</span>
        <strong>${formatDateRange(activeEvent.date, activeEvent.endDate)}</strong>
      </article>
      <article class="small-card">
        <span class="muted">${t(state, "dashboard.public_info_classes")}</span>
        <strong>${(activeEvent.classes || []).map(escapeHtml).join(", ") || "-"}</strong>
      </article>
      <article class="small-card">
        <span class="muted">${t(state, "dashboard.public_info_status")}</span>
        <strong>${escapeHtml(activeEvent.status || "-")}</strong>
      </article>
    </div>
  `);

  const classSummaryPanel = UI.Panel({
    kicker: t(state, "dashboard.public_classes_kicker"),
    title: t(state, "dashboard.public_classes_title")
  }, `
    <div class="public-class-summary-grid">
      ${classSummary.map((item) => `
        <article class="small-card">
          <p class="kicker">${escapeHtml(item.className)}</p>
          <strong>${item.count}</strong>
          <span class="muted">${t(state, "dashboard.public_classes_participants")}</span>
        </article>
      `).join("")}
    </div>
  `);

  const top5Panel = UI.Panel({
    kicker: t(state, "dashboard.public_results_kicker"),
    title: published ? t(state, "dashboard.public_results_title_active") : t(state, "dashboard.public_results_title_none")
  }, published ? renderPublicRankingTable(publicRanking, state) : `
    <p class="muted">${t(state, "dashboard.public_results_none")}</p>
    <div class="ui-form-actions"><a class="button small" href="#/results">${t(state, "dashboard.public_results_btn")}</a></div>
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

function renderPublicRankingTable(rows, state) {
  if (!rows.length) return `<p class="muted">${t(state, "dashboard.public_results_none")}</p>`;

  const headers = [
    t(state, "dashboard.col_hash"), 
    t(state, "dashboard.col_pilot"), 
    t(state, "dashboard.col_class"), 
    t(state, "dashboard.col_score")
  ];
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
