import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { calculateScoreCardTotals, SCORE_CARD_TEMPLATE_WWI } from "../../../logic/scoreCards.js";
import { formatDuration } from "./ScoreCardUtils.js";
import { t } from "../../../utils/i18n.js";
import { formatHeatTitle } from "../../../logic/competitionFormat.js";

export function renderScoreCardList(state, activeEvent, rows, targetClass = "") {
  // Sort rows alphabetically by pilot name
  const sortedRows = [...rows].sort((a, b) => {
    const nameA = String(a.pilotName || a.entry?.pilotName || "").toLowerCase();
    const nameB = String(b.pilotName || b.entry?.pilotName || "").toLowerCase();
    return nameA.localeCompare(nameB, 'fi');
  });

  return `
    <section class="score-card-list no-print">
      <div class="score-card-list-intro">
        <div>
          <p class="kicker">${t(state, "scorecards_list.kicker")}</p>
          <h3>${targetClass ? t(state, "scorecards_list.title_class").replace("{class}", escapeHtml(targetClass)) : t(state, "scorecards_list.title_all")}</h3>
        </div>
        <p class="muted">${t(state, "scorecards_list.subtitle")}</p>
      </div>
      
      <div class="score-card-list-rows" style="padding: 20px; border: 2px solid var(--border); background: var(--surface-1); border-radius: 12px; display: grid; gap: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        ${sortedRows.length > 0 
          ? sortedRows.map(row => renderScoreCardSummaryRow(state, row, activeEvent)).join("")
          : `<div class="muted" style="text-align: center; padding: 20px;">${t(state, "scorecards.empty_msg") || "Ei tuloskortteja"}</div>`
        }
      </div>
    </section>
  `;
}

export function renderScoreCardClassButtons(state, activeEvent, allRows, targetClass) {
  const eventClasses = activeEvent?.classes?.length ? activeEvent.classes : [];
  const rowClasses = [...new Set(allRows.map((row) => row.className).filter(Boolean))];
  const classNames = [...new Set([...eventClasses, ...rowClasses])];

  const allButton = `<a class="button small ${targetClass ? "" : "primary"}" href="#/scorecards">${t(state, "scorecards_list.btn_all").replace("{count}", allRows.length)}</a>`;
  const classButtons = classNames.map((className) => {
    const count = allRows.filter((row) => String(row.className).trim().toLowerCase() === String(className).trim().toLowerCase()).length;
    const activeClass = targetClass && String(targetClass).trim().toLowerCase() === String(className).trim().toLowerCase();
    return `<a class="button small ${activeClass ? "primary" : ""}" href="#/scorecards/${encodeURIComponent(className)}">${escapeHtml(className)} (${count})</a>`;
  }).join("");

  const options = `<option value="#/scorecards" ${targetClass ? "" : "selected"}>${t(state, "scorecards_list.btn_all").replace("{count}", allRows.length)}</option>` + 
    classNames.map((className) => {
      const count = allRows.filter((row) => String(row.className).trim().toLowerCase() === String(className).trim().toLowerCase()).length;
      const activeClass = targetClass && String(targetClass).trim().toLowerCase() === String(className).trim().toLowerCase();
      return `<option value="#/scorecards/${encodeURIComponent(className)}" ${activeClass ? "selected" : ""}>${escapeHtml(className)} (${count})</option>`;
    }).join("");

  return `
    <div class="score-card-class-buttons desktop-only">
      ${allButton}
      ${classButtons}
    </div>
    <div class="score-card-class-buttons-mobile mobile-only" style="margin-bottom: 20px;">
      <select class="tab-select" onchange="window.location.hash = this.value">
        ${options}
      </select>
    </div>
  `;
}

import { getScoreCardStructureStages } from "../../../logic/scoreCards.js";

function renderScoreCardSummaryRow(state, row, activeEvent) {
  const { entry, card, totals, aircraft } = row;
  const label = card.templateId === SCORE_CARD_TEMPLATE_WWI ? "WWI" : "Standard";
  
  let displayPoints = totals.totalPoints;
  let displayCuts = totals.totalCuts;
  let displayFlightSeconds = totals.totalFlightSeconds;
  let isSaved = Boolean(card.updatedAt);

  const currentPath = window.location.hash.replace("#/", "").split("?")[0];
  const backParam = currentPath && currentPath !== "scorecards" ? `?back=${currentPath}` : "";

  return `
    <article class="score-card-list-row">
      <div class="score-card-list-main">
        <p class="kicker">${escapeHtml(row.className)} · #${escapeHtml(entry.raceNumber || card.startNumber || "-")} · ${escapeHtml(label)}</p>
        <h4>${escapeHtml(row.pilotName)}</h4>
        <p class="muted"><strong style="color: var(--primary);">${t(state, "scorecards_list.heats_label")}${escapeHtml(row.calculatedFlyingRound || t(state, "scorecards_list.not_assigned"))}</strong> · ${escapeHtml(row.aircraftName)} · ${formatDuration(displayFlightSeconds)} · ${displayCuts} cuts</p>
      </div>
      <div class="score-card-list-status">
        <span class="status ${isSaved ? "approved" : "pending"}">${isSaved ? t(state, "scorecard_editor.saved") : t(state, "scorecard_editor.not_saved")}</span>
        <strong>${displayPoints} p</strong>
      </div>
      <div class="score-card-list-actions">
        <a class="button small primary" href="#/scorecard/${escapeHtml(entry.id)}${backParam}">${t(state, "scorecards_list.open_card")}</a>
      </div>
    </article>
  `;
}
