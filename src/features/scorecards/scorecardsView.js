import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import {
  SCORE_CARD_TEMPLATE_WWI,
  buildScoreCardRows
} from "../../logic/scoreCards.js";
import { UI } from "../../ui/engine.js";
import { getRouteParam } from "../../router.js";
import { renderScoreCardClassButtons, renderScoreCardList } from "./components/ScoreCardList.js";

export function renderScoreCardsView(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.Panel({ title: "Ei aktiivista kisaa" }, "<p>Avaa kilpailu kisakalenterista.</p>");
  }

  const targetClass = decodeURIComponent(getRouteParam() || "").trim();
  const allRows = buildScoreCardRows(state, activeEvent);
  const rows = targetClass 
    ? allRows.filter((row) => String(row.className).trim().toLowerCase() === targetClass.toLowerCase()) 
    : allRows;
  const savedCount = rows.filter((row) => row.card.updatedAt).length;
  const wwiCount = rows.filter((row) => row.card.templateId === SCORE_CARD_TEMPLATE_WWI).length;
  const classStatLabel = targetClass ? `${targetClass}-kortteja` : "WWI-kortteja";
  const classStatCount = targetClass ? rows.length : wwiCount;

  const classFilterButtons = renderScoreCardClassButtons(activeEvent, allRows, targetClass);

  const headerActions = `
    <a class="button" href="#/entries">Osallistujat</a>
    ${classFilterButtons}
  `;

  const pageHeader = UI.PageHeader({
    kicker: "Admin · pilot score cards",
    title: targetClass ? `${targetClass} tuloskortit` : "Digitaaliset tuloskortit",
    subtitle: `${rows.length} automaattista tuloskorttia · ${savedCount} tallennettua korttia · ${activeEvent.name}`,
    headerActions: UI.Flex({ gap: "10px", wrap: "wrap" }, headerActions),
    className: "no-print"
  });

  const statsPanel = UI.Panel({
    className: "no-print"
  }, `
    <div class="result-stat-grid participant-stat-grid">
      <article class="small-card"><span>Osallistujia</span><strong>${rows.length}</strong></article>
      <article class="small-card"><span>Tallennettuja kortteja</span><strong>${savedCount}</strong></article>
      <article class="small-card"><span>${escapeHtml(classStatLabel)}</span><strong>${classStatCount}</strong></article>
      <article class="small-card"><span>Aktiivinen kisa</span><strong>${escapeHtml(activeEvent.name)}</strong></article>
    </div>
  `);

  if (!rows.length) {
    return `
      ${pageHeader}
      ${statsPanel}
      ${UI.Panel({
        className: "empty-state",
        kicker: "Ei osallistujia",
        title: "Lisää ensin osallistujat tähän kilpailuun"
      }, `
        <p class="muted">Tuloskortit syntyvät automaattisesti, kun pilotti ilmoitetaan kilpailuun.</p>
        <a class="button primary" href="#/entries">Avaa osallistujat</a>
      `)}
    `;
  }

  return `
    ${pageHeader}
    ${statsPanel}
    ${renderScoreCardList(state, activeEvent, rows, targetClass)}
  `;
}
