import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import {
  SCORE_CARD_TEMPLATE_WWI,
  buildScoreCardRows
} from "../../logic/scoreCards.js";
import { UI } from "../../ui/engine.js";
import { getRouteParam } from "../../router.js";
import { renderScoreCardClassButtons, renderScoreCardList } from "./components/ScoreCardList.js";
import { t } from "../../utils/i18n.js";

export function renderScoreCardsView(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.Panel({ title: t(state, "scorecards.no_active_event") }, `<p>${t(state, "scorecards.open_event_from_calendar")}</p>`);
  }

  const targetClass = decodeURIComponent(getRouteParam() || "").trim();
  const allRows = buildScoreCardRows(state, activeEvent);
  const rows = targetClass 
    ? allRows.filter((row) => String(row.className).trim().toLowerCase() === targetClass.toLowerCase()) 
    : allRows;
  const savedCount = rows.filter((row) => row.card.updatedAt).length;
  const wwiCount = rows.filter((row) => row.card.templateId === SCORE_CARD_TEMPLATE_WWI).length;
  const classStatLabel = targetClass ? `${targetClass}-${t(state, "scorecards.stats_cards")}` : `WWI-${t(state, "scorecards.stats_cards")}`;
  const classStatCount = targetClass ? rows.length : wwiCount;

  const classFilterButtons = renderScoreCardClassButtons(state, activeEvent, allRows, targetClass);

  const headerActions = `
    <a class="button" href="#/entries">${t(state, "scorecards.participants")}</a>
    ${classFilterButtons}
  `;

  const pageHeader = UI.PageHeader({
    kicker: "Admin · pilot score cards",
    title: targetClass ? `${targetClass} ${t(state, "scorecards.title_class")}` : t(state, "scorecards.title"),
    subtitle: `${rows.length} ${t(state, "scorecards.subtitle")} · ${savedCount} ${t(state, "scorecards.saved_cards_text")} · ${activeEvent.name}`,
    headerActions: UI.Flex({ gap: "10px", wrap: "wrap" }, headerActions),
    className: "no-print"
  });

  const statsPanel = UI.Panel({
    className: "no-print"
  }, `
    <div class="result-stat-grid participant-stat-grid">
      <article class="small-card"><span>${t(state, "scorecards.stats_participants")}</span><strong>${rows.length}</strong></article>
      <article class="small-card"><span>${t(state, "scorecards.stats_saved_cards")}</span><strong>${savedCount}</strong></article>
      <article class="small-card"><span>${escapeHtml(classStatLabel)}</span><strong>${classStatCount}</strong></article>
      <article class="small-card"><span>${t(state, "scorecards.stats_active_event")}</span><strong>${escapeHtml(activeEvent.name)}</strong></article>
    </div>
  `);

  if (!rows.length) {
    return `
      ${pageHeader}
      ${statsPanel}
      ${UI.Panel({
        className: "empty-state",
        kicker: "Ei osallistujia", // Needs translation if wanted, but kicker could just be empty or "No participants"
        title: t(state, "scorecards.empty_title")
      }, `
        <p class="muted">${t(state, "scorecards.empty_msg")}</p>
        <a class="button primary" href="#/entries">${t(state, "scorecards.open_participants")}</a>
      `)}
    `;
  }

  return `
    ${pageHeader}
    ${statsPanel}
    ${renderScoreCardList(state, activeEvent, rows, targetClass)}
  `;
}
