import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import {
  calculateScoreCardTotals,
  getScoreCardStructureStages,
  getScoreCardTemplate,
  buildScoreCardRows
} from "../../../logic/scoreCards.js";
import { getRouteParam } from "../../../router.js";
import { getActiveEvent } from "../../../utils/html.js";
import { isAdmin } from "../../../users/roles.js";
import { getCompetitionFormatForClass, formatCompetitionStructureLabel } from "../../../logic/competitionFormat.js";
import { formatDuration } from "./ScoreCardUtils.js";
import { renderScoreCardPrintView } from "./ScoreCardPrintView.js";
import { renderScoreCardTabbedEditor } from "./ScoreCardTabbedEditor.js";
import { t } from "../../../utils/i18n.js";
import { getState } from "../../../state/store.js";

export function renderScoreCardEditorView(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.Panel({ title: t(state, "scorecards.no_active_event") }, `<p>${t(state, "scorecards.open_event_from_calendar")}</p>`);
  }

  const entryIdParam = getRouteParam();
  const entryId = entryIdParam ? entryIdParam.split('?')[0] : null;
  const allRows = buildScoreCardRows(state, activeEvent);
  const row = allRows.find((r) => r.entry.id === entryId);

  if (!row) {
    return UI.Panel({ title: t(state, "scorecard_editor.not_found_title") }, `
      <p class="muted">${t(state, "scorecard_editor.not_found_msg")}</p>
      <a class="button primary" href="${isAdmin(state) ? '#/scorecards' : '#/myevent'}">${t(state, "scorecard_editor.go_back")}</a>
    `);
  }

  const backUrl = isAdmin(state) ? "#/scorecards" : "#/myevent";

  return `
    <div class="score-card-editor-standalone" style="width: 100%;">
      ${renderScoreCardForm(activeEvent, row, { forceOpen: true, mode: "standalone", backUrl })}
    </div>
  `;
}

export function renderScoreCardForm(activeEvent, row, options = {}) {
  const state = getState();
  const { entry, card } = row;
  const template = getScoreCardTemplate({ card, event: activeEvent, entry, aircraft: row.aircraft });
  const stages = getScoreCardStructureStages({ card, event: activeEvent, entry, aircraft: row.aircraft });
  const totals = calculateScoreCardTotals(card, activeEvent, entry, row.aircraft);
  const isSaved = Boolean(card.updatedAt);

  const printMode = window.PRINT_EMPTY_CARD_MODE;
  const isBlankPrint = printMode === 'blank';
  const isPilotPrint = printMode === 'pilot';

  const viewCard = { ...card, className: row.className, __displayStages: stages, __calculatedFlyingRound: row.calculatedFlyingRound };
  const viewRow = { ...row, card: viewCard, totals, isSaved, template };

  if (printMode) {
    if (!viewRow.card.rounds) viewRow.card.rounds = [];
    
    if (isBlankPrint || isPilotPrint) {
      viewCard.rounds = [];
      viewCard.totalPoints = "";
      viewCard.totalCuts = "";
      viewCard.totalFlightSeconds = 0;
      viewRow.totals = { totalPoints: "", totalCuts: "", totalFlightSeconds: 0 };
    }

    if (isBlankPrint) {
      viewRow.pilotName = "";
      viewRow.aircraftName = "";
      viewCard.startNumber = "";
      viewCard.frequency = "";
      viewCard.flyingRound = "";
      viewCard.aircraft = { twoPointFiveClass: false, modelName: "", motorOrBattery: "", propeller: "", rpm: "" };
    }
    
    return renderScoreCardPrintView(activeEvent, viewRow);
  }

  const cardId = `scorecard-${entry.id}`;

  const isPilotMode = options.mode === "pilot";

  const templateSelectHtml = `
    <input type="hidden" name="templateId" value="${escapeHtml(template.id)}" />
  `;

  let backUrl = options.backUrl || "#/scorecards";
  const currentHash = window.location.hash || "";
  if (currentHash.includes('?back=')) {
    const backParam = currentHash.split('?back=')[1];
    if (backParam) backUrl = `#/${backParam}`;
  }

  const rightActionsHtml = isPilotMode ? `
    <button type="button" class="button outline footer-action-btn" data-action="show-qr-code" data-entry-id="${escapeHtml(entry.id)}" title="Näytä QR-koodi tuomarille">QR-koodi</button>
    <button type="submit" class="button primary footer-action-btn" style="font-weight: bold;">${t(state, "scorecard_editor.save_submit")}</button>
    <a class="button outline footer-action-btn" style="display: flex; justify-content: center; align-items: center;" href="${backUrl}">${t(state, "common.close")}</a>
  ` : `
    <button type="button" class="button outline footer-action-btn" data-action="show-qr-code" data-entry-id="${escapeHtml(entry.id)}" title="Näytä QR-koodi tuomarille">QR-koodi</button>
    <button type="submit" class="button primary footer-action-btn" style="font-weight: bold;">${t(state, "common.save")}</button>
    <a class="button outline footer-action-btn" style="display: flex; justify-content: center; align-items: center;" href="${backUrl}">${t(state, "common.close")}</a>
  `;

  const format = getCompetitionFormatForClass(activeEvent, row.className);
  const structureText = formatCompetitionStructureLabel(format);
  const raceNumberStr = entry.raceNumber || card.startNumber ? ` · #${escapeHtml(entry.raceNumber || card.startNumber)}` : '';

  const summary = `
    <summary class="score-card-summary no-print">
      <div class="score-card-summary__main">
        <p class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">${t(state, "scorecard_editor.kicker")}</p>
        <h3 style="margin: 0 0 5px 0;">${escapeHtml(row.pilotName)}</h3>
        <p style="margin: 0 0 5px 0;"><strong>${escapeHtml(row.className)}</strong>${raceNumberStr}</p>
        <p class="muted" style="margin: 0; font-size: 0.85rem;">${escapeHtml(activeEvent.name)} · ${structureText}</p>
      </div>
      <div class="score-card-summary__stats">
        <span class="status ${isSaved ? "approved" : "pending"}">${isSaved ? t(state, "scorecard_editor.saved") : t(state, "scorecard_editor.not_saved")}</span>
      </div>
    </summary>
  `;

  const stickyFooter = `
    <div class="score-card-sticky-footer no-print" style="display: flex; flex-direction: column; gap: 12px; max-width: 600px; margin: 0 auto; width: 100%;">
      <div style="display: flex; justify-content: center; align-items: center; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div class="footer-totals" style="display: flex; align-items: center;">
          <strong style="font-size: 1.8rem; color: #ffd166; text-shadow: 0 0 10px rgba(255, 209, 102, 0.4);">${t(state, "scorecard_editor.total")} <span name="final_sum_display">${totals.totalPoints}</span> p</strong>
        </div>
        ${templateSelectHtml}
      </div>
      <div class="footer-actions" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%;">
        ${rightActionsHtml}
      </div>
    </div>
  `;

  const content = `
    <input type="hidden" name="entryId" value="${escapeHtml(entry.id)}" />

    <details class="score-card-details" ${options.forceOpen || !isSaved ? "open" : ""}>
      ${summary}

      <div class="score-card-editor">
        ${renderScoreCardTabbedEditor(activeEvent, viewRow)}
        
        ${stickyFooter}
      </div>
    </details>
  `;

  return UI.FormPanel({
    id: cardId,
    className: "score-card-form",
    action: "save-score-card"
  }, content);
}
