import { escapeHtml } from "../../../utils/html.js";
import { calculateScoreCardRound } from "../../../logic/scoreCards.js";
import { getRounds, renderFlightTimeInputs, renderCutsInputs, renderYesNoInputs, renderFooterTextRow } from "./ScoreCardUtils.js";

export function renderStandardScoreCardTable(activeEvent, card, template) {
  const rounds = getRounds(card, template);
  const gridStyle = `grid-template-columns: 120px repeat(${rounds.length}, minmax(150px, 1fr)) 170px;`;

  return `
    <div class="score-sheet-grid score-sheet-grid-standard" style="${gridStyle}" aria-label="Standard pilot score card">
      <div class="score-label score-heading"></div>
      ${getRounds(card, template).map((round) => `<div class="score-round-title">${escapeHtml(round.stageLabel || `Kierros ${round.roundNumber}`)}</div>`).join("")}
      <div class="score-results-title">Tulokset</div>

      ${renderStandardRoundInputRow(activeEvent, card, template, "Lentoaika", "flight", renderFlightTimeInputs)}
      ${renderStandardRoundInputRow(activeEvent, card, template, "Cuts", "cuts", renderCutsInputs)}
      ${renderStandardRoundInputRow(activeEvent, card, template, "Streamer ehjä", "streamer", (round) => renderYesNoInputs(round, "streamerOk"))}
      ${renderStandardRoundInputRow(activeEvent, card, template, "Pakoilu (Hasenfuss)", "hasenfuss", (round) => renderYesNoInputs(round, "hasenfuss"))}
      ${renderStandardRoundInputRow(activeEvent, card, template, "Turvarajan ylitys", "safetyline", (round) => renderYesNoInputs(round, "safetylineOverflown"))}
      ${renderStandardSumRow(activeEvent, card, template)}
    </div>
  `;
}

function renderStandardRoundInputRow(activeEvent, card, template, label, className, renderer) {
  const rounds = getRounds(card, template);

  return `
    <div class="score-label ${className}-label"><strong>${escapeHtml(label)}</strong></div>
    ${rounds.map((round) => `<div class="score-cell ${className}-cell">${renderer(round)}</div>`).join("")}
    <div class="score-result-cell ${className}-result">${renderStandardResultColumn(activeEvent, className)}</div>
  `;
}

function renderStandardResultColumn(activeEvent, className) {
  if (className === "flight") return `<span class="small-formula">1p / ${activeEvent.rules.flightTimePointEverySeconds}s</span>`;
  if (className === "cuts") return `<span class="small-formula">${activeEvent.rules.cutPoints}p/kpl</span>`;
  if (className === "streamer") return `<span class="small-formula">+${activeEvent.rules.intactStreamerPoints}p</span>`;
  if (className === "hasenfuss") return `<span class="small-formula">-50p</span>`;
  if (className === "safetyline") return `<span class="small-formula">-200p</span>`;
  return "";
}

function renderStandardSumRow(activeEvent, card, template) {
  const rounds = getRounds(card, template);
  const roundScores = rounds.map((round) => calculateScoreCardRound(round, activeEvent, template.id));
  const total = roundScores.reduce((sum, score) => sum + score.total, 0);
  const empty = window.PRINT_EMPTY_CARD_MODE;

  return `
    <div class="score-label sum-label"><strong>Yhteensä</strong></div>
    ${rounds.map((round, index) => `<div class="score-cell sum-cell"><strong name="r${round.roundNumber}_total_display">${empty ? "" : roundScores[index].total}</strong><input type="hidden" name="r${round.roundNumber}_total" value="${empty ? "" : roundScores[index].total}" /></div>`).join("")}
    <div class="score-result-cell final-sum"><strong>Yhteensä</strong><strong name="final_sum_display">${empty ? "" : total}</strong></div>
  `;
}

export function renderStandardAircraftAndSignatureRows(card, template) {
  const roundsCount = getRounds(card, template).length;
  const gridStyle = `grid-template-columns: 120px repeat(${roundsCount}, minmax(150px, 1fr)) 170px;`;

  return `
    <div class="score-sheet-footer-grid score-sheet-footer-standard" style="${gridStyle}">
      <div class="footer-label">2,5 luokka</div>
      ${getRounds(card, template).map(() => `<label class="footer-check"><input type="checkbox" name="print_twoPointFiveClass" ${card.aircraft?.twoPointFiveClass ? "checked" : ""} /> kyllä</label>`).join("")}
      <div class="footer-reminder">
        <strong>Huomioitavaa:</strong><br />
        Käytä aina eri starttipaikkaa!<br />
        ja eri tuomaria!!<br />
        <span>Kirjoita selkeästi!!!!</span>
      </div>

      ${renderFooterTextRow("Lentokonemalli", "modelName", card.aircraft?.modelName, template, card)}
      ${renderFooterTextRow("Polttomoottori / Akku", "motorOrBattery", card.aircraft?.motorOrBattery, template, card)}
      ${renderFooterTextRow("Potkuri (esim. 9x4)", "propeller", card.aircraft?.propeller, template, card)}
      ${renderFooterTextRow("Kierrosluku (RPM)", "rpm", card.aircraft?.rpm, template, card)}
      ${renderFooterTextRow("Pilotin allekirjoitus", "pilotSignature", card.signatures?.pilot, template, card)}
      ${renderFooterTextRow("Tuomarin allekirjoitus", "judgeSignature", card.signatures?.judge, template, card)}
    </div>
  `;
}
