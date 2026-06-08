import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import {
  SCORE_CARD_TEMPLATES,
  SCORE_CARD_TEMPLATE_WWI,
  calculateScoreCardTotals,
  getScoreCardStructureStages,
  getScoreCardTemplate
} from "../../../logic/scoreCards.js";
import { getCompetitionFormatForClass, formatCompetitionStructureLabel } from "../../../logic/competitionFormat.js";
import { formatDuration } from "./ScoreCardUtils.js";
import { renderScoreCardPrintView } from "./ScoreCardPrintView.js";
import { renderScoreCardTabbedEditor } from "./ScoreCardTabbedEditor.js";

export function renderScoreCardEditorModal(activeEvent, row, options = {}) {
  if (window.PRINT_EMPTY_CARD_MODE) {
    return `
      <div class="print-only-fullscreen-overlay">
        ${renderScoreCardForm(activeEvent, row)}
      </div>
    `;
  }

  const format = getCompetitionFormatForClass(activeEvent, row.className);
  const structureText = formatCompetitionStructureLabel(format);
  const raceNumberStr = row.entry?.raceNumber || row.card?.startNumber ? ` · #${escapeHtml(row.entry?.raceNumber || row.card?.startNumber)}` : '';

  return `
    <div class="app-modal-backdrop score-card-editor-backdrop" data-action="close-score-card-editor">
      <div class="app-modal-shell score-card-editor-modal" role="dialog" aria-modal="true" aria-labelledby="score-card-editor-title" data-action="none">
        <div class="app-modal-topbar no-print" style="align-items: flex-start; padding-bottom: 15px; border-bottom: 1px solid var(--border);">
          <div>
            <p class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">TULOSKORTTI</p>
            <h3 id="score-card-editor-title" style="margin: 0 0 5px 0; font-size: 1.5rem;">${escapeHtml(row.pilotName)}</h3>
            <p style="margin: 0 0 5px 0;"><strong>${escapeHtml(row.className)}</strong>${raceNumberStr}</p>
            <p class="muted" style="margin: 0; font-size: 0.85rem;">${escapeHtml(activeEvent.name)} · ${structureText}</p>
          </div>
          ${UI.Button({ label: "✕", action: "close-score-card-editor", variant: "small outline", title: "Sulje" })}
        </div>
        ${renderScoreCardForm(activeEvent, row, { forceOpen: true, ...options })}
      </div>
    </div>
  `;
}

export function renderScoreCardsView(state) {
  const { activeEvent, scoreCardRows } = state;
  if (!activeEvent || !scoreCardRows) return "";

  return `
    <div class="score-card-stack">
      ${scoreCardRows.map(row => renderScoreCardForm(activeEvent, row, { forceOpen: false })).join("")}
    </div>
  `;
}

export function renderScoreCardForm(activeEvent, row, options = {}) {
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

  const rightActionsHtml = isPilotMode ? `
    ${UI.Button({ label: "Tallenna / Lähetä", type: "submit", variant: "small primary" })}
    ${UI.Button({ label: "Sulje", type: "button", action: "close-score-card-editor", variant: "small outline" })}
  ` : `
    ${UI.Button({ label: "Tallenna tuloskortti", type: "submit", variant: "small primary" })}
    <div style="display: flex; gap: 4px;">
      ${UI.Button({ label: "Tulosta täytetty", type: "button", action: "print-page", variant: "small", title: "Tulosta täytetty kortti" })}
      ${UI.Button({ label: "Tulosta tyhjä", type: "button", action: "print-empty-pilot", variant: "small", title: "Tulosta tyhjä kortti tälle pilotille" })}
    </div>
    ${UI.Button({ label: "Sulje", type: "button", action: "close-score-card-editor", variant: "small outline" })}
  `;

  const format = getCompetitionFormatForClass(activeEvent, row.className);
  const structureText = formatCompetitionStructureLabel(format);
  const raceNumberStr = entry.raceNumber || card.startNumber ? ` · #${escapeHtml(entry.raceNumber || card.startNumber)}` : '';

  const summary = `
    <summary class="score-card-summary no-print">
      <div class="score-card-summary__main">
        <p class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">TULOSKORTTI</p>
        <h3 style="margin: 0 0 5px 0;">${escapeHtml(row.pilotName)}</h3>
        <p style="margin: 0 0 5px 0;"><strong>${escapeHtml(row.className)}</strong>${raceNumberStr}</p>
        <p class="muted" style="margin: 0; font-size: 0.85rem;">${escapeHtml(activeEvent.name)} · ${structureText}</p>
      </div>
      <div class="score-card-summary__stats">
        <span class="status ${isSaved ? "approved" : "pending"}">${isSaved ? "Tallennettu" : "Ei tallennettu"}</span>
      </div>
    </summary>
  `;

  const stickyFooter = `
    <div class="score-card-sticky-footer no-print" style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center;">
      <div class="footer-totals" style="display: flex; align-items: center;">
        <strong style="font-size: 1.2rem;">Yhteensä: ${totals.totalPoints} p</strong>
        <span class="muted" style="margin-left: 8px;">(${totals.totalCuts} cuts)</span>
      </div>
      <div class="footer-center" style="display: flex; justify-content: center; align-items: center;">
        ${templateSelectHtml}
      </div>
      <div class="footer-actions" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
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
