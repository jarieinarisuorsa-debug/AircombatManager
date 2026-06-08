import { escapeHtml } from "../../../utils/html.js";
import { getScoreCardRoundNumbers } from "../../../logic/scoreCards.js";

export function getRounds(card, template) {
  const stages = Array.isArray(card?.__displayStages) && card.__displayStages.length
    ? card.__displayStages
    : (getScoreCardRoundNumbers(card).length
      ? getScoreCardRoundNumbers(card).map((roundNumber) => ({ roundNumber, label: `Kierros ${roundNumber}` }))
      : template.rounds.map((roundNumber) => ({ roundNumber, label: `Kierros ${roundNumber}` })));

  return stages.map((stage) => {
    const roundNumber = Number(stage.roundNumber);
    const existing = (card?.rounds || []).find((round) => Number(round.roundNumber) === roundNumber);
    return {
      ...(existing || { roundNumber, modelPoints: {} }),
      roundNumber,
      stageLabel: stage.label || `Kierros ${roundNumber}`
    };
  });
}

export function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "" };
}

export function formatDuration(totalSeconds) {
  const minutes = Math.floor(Number(totalSeconds || 0) / 60);
  const seconds = Number(totalSeconds || 0) % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function renderFlightTimeInputs(round) {
  const empty = window.PRINT_EMPTY_CARD_MODE;
  return `
    <div class="mini-label-row"><span>Min</span><span>sek</span><span>pisteet</span></div>
    <div class="score-input-row three">
      <div class="stepper-input">
        <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_flightMinutes" data-step="minus">-</button>
        <input name="print_r${round.roundNumber}_flightMinutes" type="number" min="0" max="99" value="${empty ? "" : Number(round.flightMinutes || 0)}" />
        <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_flightMinutes" data-step="plus">+</button>
      </div>
      <div class="stepper-input">
        <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_flightSeconds" data-step="minus">-</button>
        <input name="print_r${round.roundNumber}_flightSeconds" type="number" min="0" max="59" value="${empty ? "" : Number(round.flightSeconds || 0)}" />
        <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_flightSeconds" data-step="plus">+</button>
      </div>
      <output name="r${round.roundNumber}_flight_points">${empty ? "" : (Number(round.flightMinutes || 0) || Number(round.flightSeconds || 0) ? "auto" : "")}</output>
    </div>
  `;
}

export function renderCutsInputs(round) {
  const empty = window.PRINT_EMPTY_CARD_MODE;
  return `
    <div class="mini-label-row two-labels"><span>Kpl</span><span>pisteet</span></div>
    <div class="score-input-row two">
      <div class="stepper-input">
        <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_cuts" data-step="minus">-</button>
        <input name="print_r${round.roundNumber}_cuts" type="number" min="0" max="99" value="${empty ? "" : Number(round.cuts || 0)}" />
        <button type="button" class="stepper-btn" data-action="step-input" data-target="print_r${round.roundNumber}_cuts" data-step="plus">+</button>
      </div>
      <output name="r${round.roundNumber}_cuts_points">${empty ? "" : "auto"}</output>
    </div>
  `;
}

export function renderYesNoInputs(round, fieldName, checkedOverride = null) {
  const empty = window.PRINT_EMPTY_CARD_MODE;
  const checked = checkedOverride === null ? Boolean(round[fieldName]) : Boolean(checkedOverride);
  return `
    <div class="mini-label-row"><span>kyllä</span><span>ei</span><span>pisteet</span></div>
    <div class="score-input-row three yes-no-row">
      <label class="yes-no-btn">
        <input type="radio" name="print_r${round.roundNumber}_${fieldName}" value="yes" ${checked && !empty ? "checked" : ""} />
        <span>kyllä</span>
      </label>
      <label class="yes-no-btn">
        <input type="radio" name="print_r${round.roundNumber}_${fieldName}" value="no" ${!checked && !empty ? "checked" : ""} />
        <span>ei</span>
      </label>
      <output name="r${round.roundNumber}_${fieldName}_points">${empty ? "" : "auto"}</output>
    </div>
  `;
}

export function renderFooterTextRow(label, name, value, template, card = null) {
  const empty = window.PRINT_EMPTY_CARD_MODE;
  return `
    <div class="footer-label">${escapeHtml(label)}</div>
    ${getRounds(card || { rounds: [] }, template).map((round) => `<input class="footer-line-input" name="${name}_${round.roundNumber}" value="${empty ? "" : escapeHtml(value || "")}" />`).join("")}
  `;
}

export function renderScoreCardHeader(activeEvent, row, template, SCORE_CARD_TEMPLATE_WWI) {
  const { entry, pilot, card } = row;
  const firstName = card.firstName || splitName(row.pilotName).firstName;
  const lastName = card.lastName || splitName(row.pilotName).lastName;

  return `
    <div class="score-sheet-header ${template.id === SCORE_CARD_TEMPLATE_WWI ? "score-sheet-header-wwi" : ""}">
      <label><strong>Kilpailunumero:</strong><input name="print_startNumber" value="${escapeHtml(card.startNumber || entry.raceNumber || "")}" /></label>
      <label><strong>Etunimi:</strong><input name="print_firstName" value="${escapeHtml(firstName)}" /></label>
      <label><strong>${escapeHtml(template.headerLastNameLabel)}:</strong><input name="print_lastName" value="${escapeHtml(lastName)}" /></label>
      <label><strong>Taajuus:</strong><input name="print_frequency" value="${escapeHtml(card.frequency || "2.4 GHz")}" /></label>
      <label class="flying-round"><strong>Pilotti lentää kierroksella:</strong><input name="print_flyingRound" value="${escapeHtml(card.__calculatedFlyingRound || card.flyingRound || "")}" /></label>
    </div>
    <div class="score-sheet-subheader">
      <span>${escapeHtml(activeEvent.name)}</span>
      <span>${escapeHtml(pilot?.country || "")}${pilot?.club ? ` · ${escapeHtml(pilot.club)}` : ""}</span>
    </div>
  `;
}
