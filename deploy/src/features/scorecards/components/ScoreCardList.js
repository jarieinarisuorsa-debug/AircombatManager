import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { calculateScoreCardTotals, SCORE_CARD_TEMPLATE_WWI } from "../../../logic/scoreCards.js";
import { formatDuration } from "./ScoreCardUtils.js";

export function renderScoreCardList(rows, targetClass = "") {
  const grouped = groupScoreCardRows(rows);

  return `
    <section class="score-card-list no-print">
      <div class="score-card-list-intro">
        <div>
          <p class="kicker">Tuloskorttilista</p>
          <h3>${targetClass ? `${escapeHtml(targetClass)} kortit` : "Kaikki tuloskortit"}</h3>
        </div>
        <p class="muted">Avaa vain se kortti, jota haluat täyttää.</p>
      </div>
      ${grouped.map((group) => `
        <div class="score-card-list-group">
          <div class="score-card-list-heading">
            <h3>${escapeHtml(group.className)}</h3>
            <span class="muted">${group.rows.length} korttia · ${group.rows.filter((row) => row.card.updatedAt).length} tallennettu</span>
          </div>
          <div class="score-card-list-rows">
            ${group.rows.map(renderScoreCardSummaryRow).join("")}
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

export function renderScoreCardClassButtons(activeEvent, allRows, targetClass) {
  const eventClasses = activeEvent?.classes?.length ? activeEvent.classes : [];
  const rowClasses = [...new Set(allRows.map((row) => row.className).filter(Boolean))];
  const classNames = [...new Set([...eventClasses, ...rowClasses])];

  const allButton = `<a class="button small ${targetClass ? "" : "primary"}" href="#/scorecards">Kaikki (${allRows.length})</a>`;
  const classButtons = classNames.map((className) => {
    const count = allRows.filter((row) => String(row.className).trim().toLowerCase() === String(className).trim().toLowerCase()).length;
    const activeClass = targetClass && String(targetClass).trim().toLowerCase() === String(className).trim().toLowerCase();
    return `<a class="button small ${activeClass ? "primary" : ""}" href="#/scorecards/${encodeURIComponent(className)}">${escapeHtml(className)} (${count})</a>`;
  }).join("");

  return `
    <div class="score-card-class-buttons">
      ${allButton}
      ${classButtons}
    </div>
  `;
}

function groupScoreCardRows(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const className = row.className || "Yleinen";
    if (!groups.has(className)) groups.set(className, []);
    groups.get(className).push(row);
  });

  return Array.from(groups.entries()).map(([className, groupRows]) => ({
    className,
    rows: groupRows
  }));
}

function renderScoreCardSummaryRow(row) {
  const { entry, card, totals } = row;
  const saved = Boolean(card.updatedAt);
  const label = card.templateId === SCORE_CARD_TEMPLATE_WWI ? "WWI" : "Standard";

  return `
    <article class="score-card-list-row">
      <div class="score-card-list-main">
        <p class="kicker">${escapeHtml(row.className)} · #${escapeHtml(entry.raceNumber || card.startNumber || "-")} · ${escapeHtml(label)}</p>
        <h4>${escapeHtml(row.pilotName)}</h4>
        <p class="muted">${escapeHtml(row.aircraftName)} · ${formatDuration(totals.totalFlightSeconds)} · ${totals.totalCuts} cuts</p>
      </div>
      <div class="score-card-list-status">
        <span class="status ${saved ? "approved" : "pending"}">${saved ? "Tallennettu" : "Ei tallennettu"}</span>
        <strong>${totals.totalPoints} p</strong>
      </div>
      <div class="score-card-list-actions">
        ${UI.Button({ label: "Avaa kortti", action: "open-score-card-editor", entryId: entry.id, variant: "small primary" })}
      </div>
    </article>
  `;
}
