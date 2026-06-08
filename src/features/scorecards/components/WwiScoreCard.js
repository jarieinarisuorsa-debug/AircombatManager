import { escapeHtml } from "../../../utils/html.js";
import { calculateScoreCardRound, calculateScoreCardTotals } from "../../../logic/scoreCards.js";
import { getRounds, renderFlightTimeInputs, renderYesNoInputs, renderFooterTextRow } from "./ScoreCardUtils.js";

export function renderWwiScoreCardTable(activeEvent, card, template, entry) {
  const rounds = getRounds(card, template);
  const gridStyle = `grid-template-columns: 170px repeat(${rounds.length}, minmax(150px, 1fr)) 140px;`;

  return `
    <div class="score-sheet-layout-wwi">
      <div class="score-sheet-grid score-sheet-grid-wwi" style="${gridStyle}" aria-label="WWI pilot score card">
        <div class="score-label score-heading"></div>
        ${getRounds(card, template).map((round) => `<div class="score-round-title">${escapeHtml(round.stageLabel || `Kierros ${round.roundNumber}`)}</div>`).join("")}
        <div class="score-results-title">Pisteet</div>

        <div class="score-section-title" style="background: rgba(88, 183, 255, 0.15); color: var(--accent-strong); border-left: 4px solid var(--primary);">Mallipisteet</div>
        ${getRounds(card, template).map(() => `<div class="score-section-title small" style="background: rgba(88, 183, 255, 0.05);">kyllä &nbsp;&nbsp; ei</div>`).join("")}
        <div class="score-section-title small" style="background: rgba(88, 183, 255, 0.05);">max 100</div>
        ${template.modelPointItems.map((item) => renderWwiModelPointRow(card, template, item)).join("")}
        ${renderWwiModelPointsSumRow(activeEvent, card, template)}

        <div class="score-section-title" style="background: rgba(88, 183, 255, 0.15); color: var(--accent-strong); border-left: 4px solid var(--primary);">Lentopisteet</div>
        ${getRounds(card, template).map(() => `<div class="score-section-title small" style="background: rgba(88, 183, 255, 0.05);">kyllä &nbsp;&nbsp; ei</div>`).join("")}
        <div class="score-section-title small" style="background: rgba(88, 183, 255, 0.05);"></div>
        ${renderWwiBooleanRow(card, template, "Maasta nousu", "takeoff", "+50 p")}
        ${renderWwiFlightTimeRow(activeEvent, card, template)}
        ${renderWwiNumberRow(card, template, "Cuts", "cuts", "100 p", "nr 0,1,1,1,1")}
        ${renderWwiNumberRow(card, template, "Maamaalit", "groundTargets", "60 p")}
        ${renderWwiBooleanRow(card, template, "Pakoilu (Hasenfuss)", "hasenfuss", "-50 p")}
        ${renderWwiBooleanRow(card, template, "Turvaraja", "safetylineOverflown", "-200 p", "Ylitetty")}
        ${renderWwiBooleanRow(card, template, "Laskualueelle", "landingAfterEndSignal", "+50 p", "loppuäänen jälkeen")}
        ${renderWwiBooleanRow(card, template, "Streamer ehjä", "streamerOk", "+50 p")}
        ${renderWwiSumRow(activeEvent, card, template)}
      </div>
      ${renderWwiSideSummary(activeEvent, card, template, entry)}
    </div>
  `;
}

function renderWwiModelPointRow(card, template, item) {
  const rounds = getRounds(card, template);
  return `
    <div class="score-label"><span>${escapeHtml(item.label)}</span></div>
    ${rounds.map((round) => `<div class="score-cell">${renderYesNoInputs(round, `model_${item.key}`, Boolean(round.modelPoints?.[item.key]))}</div>`).join("")}
    <div class="score-result-cell point-box">${item.points} p</div>
  `;
}

function renderWwiBooleanRow(card, template, label, fieldName, pointsLabel, subLabel = "") {
  const rounds = getRounds(card, template);
  return `
    <div class="score-label"><strong>${escapeHtml(label)}</strong>${subLabel ? `<span class="score-sub-label">${escapeHtml(subLabel)}</span>` : ""}</div>
    ${rounds.map((round) => `<div class="score-cell">${renderYesNoInputs(round, fieldName)}</div>`).join("")}
    <div class="score-result-cell point-box">${escapeHtml(pointsLabel)}</div>
  `;
}

function renderWwiNumberRow(card, template, label, fieldName, pointsLabel, helpText = "") {
  const rounds = getRounds(card, template);
  const empty = window.PRINT_EMPTY_CARD_MODE;
  return `
    <div class="score-label"><strong>${escapeHtml(label)}</strong>${helpText ? `<span class="score-sub-label">${escapeHtml(helpText)}</span>` : ""}</div>
    ${rounds.map((round) => `
      <div class="score-cell">
        <div class="mini-label-row two-labels"><span>Kpl</span><span>pisteet</span></div>
        <div class="score-input-row two">
          <div class="stepper-input">
            <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_${fieldName}" data-step="minus">-</button>
            <input name="print_r${round.roundNumber}_${fieldName}" type="number" min="0" max="99" value="${empty ? "" : Number(round[fieldName] || 0)}" />
            <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_${fieldName}" data-step="plus">+</button>
          </div>
          <output name="r${round.roundNumber}_${fieldName}_points">${empty ? "" : "auto"}</output>
        </div>
      </div>
    `).join("")}
    <div class="score-result-cell point-box">${escapeHtml(pointsLabel)}</div>
  `;
}

function renderWwiFlightTimeRow(activeEvent, card, template) {
  const rounds = getRounds(card, template);
  return `
    <div class="score-label"><strong>Lentoaika</strong></div>
    ${rounds.map((round) => `<div class="score-cell">${renderFlightTimeInputs(round)}</div>`).join("")}
    <div class="score-result-cell point-box">3 sek=1p<br />max 138 p</div>
  `;
}

function renderWwiSumRow(activeEvent, card, template) {
  const rounds = getRounds(card, template);
  const roundScores = rounds.map((round) => calculateScoreCardRound(round, activeEvent, template.id));
  const empty = window.PRINT_EMPTY_CARD_MODE;

  return `
    <div class="score-label sum-label" style="color: #ffd166; font-size: 1.1rem; text-shadow: 0 0 8px rgba(255, 209, 102, 0.3);"><strong>Lentopisteet yhteensä</strong></div>
    ${rounds.map((round, index) => `<div class="score-cell sum-cell"><strong name="r${round.roundNumber}_flightTotal_display">${empty ? "" : roundScores[index].flightTotal}</strong><input type="hidden" name="r${round.roundNumber}_total" value="${empty ? "" : roundScores[index].total}" /></div>`).join("")}
    <div class="score-result-cell point-box">Yht</div>
  `;
}

function renderWwiModelPointsSumRow(activeEvent, card, template) {
  const rounds = getRounds(card, template);
  const roundScores = rounds.map((round) => calculateScoreCardRound(round, activeEvent, template.id));
  const empty = window.PRINT_EMPTY_CARD_MODE;

  return `
    <div class="score-label sum-label" style="background: rgba(255, 209, 102, 0.08); color: #ffd166; font-size: 1.1rem; text-shadow: 0 0 8px rgba(255, 209, 102, 0.3);"><strong>Mallipisteet yhteensä</strong></div>
    ${rounds.map((round, index) => `<div class="score-cell sum-cell" style="background: rgba(255, 255, 255, 0.02);"><strong>${empty ? "" : roundScores[index].modelPoints}</strong></div>`).join("")}
    <div class="score-result-cell point-box" style="background: rgba(255, 255, 255, 0.02);">Yht</div>
  `;
}

function renderWwiSideSummary(activeEvent, card, template, entry) {
  const totals = calculateScoreCardTotals(card, activeEvent, entry, card.aircraft);
  const scoresByRound = new Map(totals.roundScores.map((round) => [Number(round.roundNumber), round.score.total]));
  const rounds = getRounds(card, template);
  const empty = window.PRINT_EMPTY_CARD_MODE;

  return `
    <aside class="wwi-side-summary">
      <div class="wwi-reminder">
        Käytä aina<br />
        eri<br />
        <strong>tuomaria!!</strong><br />
        <span>Kirjoita selkeästi!!!!</span>
      </div>
      <div class="wwi-results-box">
        <h4>Pisteet</h4>
        ${rounds.map((round) => {
          const label = round.stageLabel || `Kierros ${round.roundNumber}`;
          const roundNumber = round.roundNumber;
          return `<div><span>${escapeHtml(label)}</span><strong name="wwi_side_r${roundNumber}_display">${empty ? "" : (scoresByRound.get(roundNumber) || 0)}</strong></div>`;
        }).join("")}
        <div class="wwi-total"><span>Yhteispisteet</span><strong name="wwi_side_total_display">${empty ? "" : totals.totalPoints}</strong></div>
      </div>
    </aside>
  `;
}

export function renderWwiAircraftAndSignatureRows(card, template) {
  const roundsCount = getRounds(card, template).length;
  const gridStyle = `grid-template-columns: 170px repeat(${roundsCount}, minmax(150px, 1fr));`;

  return `
    <div class="score-sheet-footer-grid score-sheet-footer-wwi" style="${gridStyle}">
      ${renderFooterTextRow("Lentokonemalli", "modelName", card.aircraft?.modelName, template, card)}
      ${renderFooterTextRow("Moottori ja potkuri", "motorOrBattery", card.aircraft?.motorOrBattery, template, card)}
      ${renderFooterTextRow("Pilotin allekirjoitus", "pilotSignature", card.signatures?.pilot, template, card)}
      ${renderFooterTextRow("Tuomarin allekirjoitus", "judgeSignature", card.signatures?.judge, template, card)}
    </div>
  `;
}
