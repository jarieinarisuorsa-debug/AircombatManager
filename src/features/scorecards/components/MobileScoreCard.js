import { escapeHtml } from "../../../utils/html.js";
import { calculateScoreCardRound, getRoundStatusInfo } from "../../../logic/scoreCards.js";
import { getRounds, splitName } from "./ScoreCardUtils.js";

export function renderMobileScoreCardEditor(activeEvent, row, template, SCORE_CARD_TEMPLATE_WWI) {
  const { entry, pilot, card } = row;
  const firstName = card.firstName || splitName(row.pilotName).firstName;
  const lastName = card.lastName || splitName(row.pilotName).lastName;
  const rounds = getRounds(card, template);
  const totals = row.totals;

  return `
    <div class="score-card-mobile-editor no-print">
      <div class="mobile-score-section">
        <p class="kicker">Perustiedot</p>
        <div class="mobile-score-grid">
          <label>Kilpailunumero<input name="startNumber" value="${escapeHtml(card.startNumber || entry.raceNumber || "")}" /></label>
          <label>Etunimi<input name="firstName" value="${escapeHtml(firstName)}" /></label>
          <label>${escapeHtml(template.headerLastNameLabel)}<input name="lastName" value="${escapeHtml(lastName)}" /></label>
          <label>Taajuus<input name="frequency" value="${escapeHtml(card.frequency || "2.4 GHz")}" /></label>
          <label>Lennät kierroksella:<input name="flyingRound" value="${escapeHtml(card.__calculatedFlyingRound || card.flyingRound || "")}" /></label>
        </div>
        <p class="muted mobile-score-subline">${escapeHtml(activeEvent.name)}${pilot?.country ? ` · ${escapeHtml(pilot.country)}` : ""}${pilot?.club ? ` · ${escapeHtml(pilot.club)}` : ""}</p>
      </div>

      ${rounds.map((round, index) => template.id === SCORE_CARD_TEMPLATE_WWI
        ? renderMobileWwiRound(activeEvent, round, template, index === 0)
        : renderMobileStandardRound(activeEvent, round, template, index === 0)).join("")}

      ${template.id === SCORE_CARD_TEMPLATE_WWI ? renderMobileWwiAircraftFields(card) : renderMobileStandardAircraftFields(card)}

      <div class="mobile-score-total">
        <span>Yhteensä</span>
        <strong>${totals.totalPoints} p</strong>
      </div>
    </div>
  `;
}

function renderMobileStandardRound(activeEvent, round, template, open = false) {
  const score = calculateScoreCardRound(round, activeEvent, template.id);
  const status = getRoundStatusInfo(round, activeEvent);

  return `
    <details class="mobile-round-card status-${status.class}" data-round="${round.roundNumber}" ${open ? "open" : ""}>
      <summary class="mobile-round-summary">
        <div class="round-status-header">
          <span class="round-name">${escapeHtml(round.stageLabel || `Kierros ${round.roundNumber}`)}</span>
          <span class="round-badge badge-${status.class}">
            <span class="status-icon">${status.icon}</span> <span class="status-label">${status.label}</span>
          </span>
        </div>
        <strong>${score.total} p</strong>
        <button type="submit" name="saveRound" value="${round.roundNumber}" class="button small primary mobile-round-save" onclick="event.stopPropagation()">Tallenna</button>
      </summary>
      <div class="mobile-round-fields">
        ${renderMobileFlightTimeFields(round)}
        ${renderMobileNumberField(round, "Cuts", "cuts", "kpl")}
        ${renderMobileYesNoField(round, "Streamer ehjä", "streamerOk")}
        ${renderMobileYesNoField(round, "Pakoilu (Hasenfuss)", "hasenfuss")}
        ${renderMobileYesNoField(round, "Turvarajan ylitys", "safetylineOverflown")}
      </div>
    </details>
  `;
}

function renderMobileWwiRound(activeEvent, round, template, open = false) {
  const score = calculateScoreCardRound(round, activeEvent, template.id);
  const status = getRoundStatusInfo(round, activeEvent);

  return `
    <details class="mobile-round-card status-${status.class}" data-round="${round.roundNumber}" ${open ? "open" : ""}>
      <summary class="mobile-round-summary">
        <div class="round-status-header">
          <span class="round-name">${escapeHtml(round.stageLabel || `Kierros ${round.roundNumber}`)}</span>
          <span class="round-badge badge-${status.class}">
            <span class="status-icon">${status.icon}</span> <span class="status-label">${status.label}</span>
          </span>
        </div>
        <strong>${score.total} p</strong>
        <button type="submit" name="saveRound" value="${round.roundNumber}" class="button small primary mobile-round-save" onclick="event.stopPropagation()">Tallenna</button>
      </summary>
      <div class="mobile-round-fields">
        <div class="mobile-field-group">
          <p class="mobile-field-heading">Konepisteet</p>
          ${template.modelPointItems.map((item) => renderMobileYesNoField(round, `${item.label} (${item.points} p)`, `model_${item.key}`, Boolean(round.modelPoints?.[item.key]))).join("")}
        </div>
        <div class="mobile-field-group">
          <p class="mobile-field-heading">Lentopisteet</p>
          ${renderMobileYesNoField(round, "Maasta nousu", "takeoff")}
          ${renderMobileFlightTimeFields(round)}
          ${renderMobileNumberField(round, "Cuts", "cuts", "kpl")}
          ${renderMobileNumberField(round, "Maamaalit", "groundTargets", "kpl")}
          ${renderMobileYesNoField(round, "Pakoilu (Hasenfuss)", "hasenfuss")}
          ${renderMobileYesNoField(round, "Turvaraja", "safetylineOverflown")}
          ${renderMobileYesNoField(round, "Laskualueelle", "landingAfterEndSignal")}
          ${renderMobileYesNoField(round, "Streamer ehjä", "streamerOk")}
        </div>
      </div>
    </details>
  `;
}

function renderMobileFlightTimeFields(round) {
  return `
    <div class="mobile-field-pair">
      <label>Lentoaika min<input name="r${round.roundNumber}_flightMinutes" type="number" min="0" max="99" value="${Number(round.flightMinutes || 0)}" /></label>
      <label>sek<input name="r${round.roundNumber}_flightSeconds" type="number" min="0" max="59" value="${Number(round.flightSeconds || 0)}" /></label>
    </div>
  `;
}

function renderMobileNumberField(round, label, fieldName, suffix = "") {
  return `
    <label>${escapeHtml(label)}${suffix ? ` <span class="muted">(${escapeHtml(suffix)})</span>` : ""}
      <input name="r${round.roundNumber}_${fieldName}" type="number" min="0" max="99" value="${Number(round[fieldName] || 0)}" />
    </label>
  `;
}

function renderMobileYesNoField(round, label, fieldName, checkedOverride = null) {
  const checked = checkedOverride === null ? Boolean(round[fieldName]) : Boolean(checkedOverride);
  return `
    <div class="mobile-yes-no">
      <span>${escapeHtml(label)}</span>
      <label><input type="radio" name="r${round.roundNumber}_${fieldName}" value="yes" ${checked ? "checked" : ""} /> Kyllä</label>
      <label><input type="radio" name="r${round.roundNumber}_${fieldName}" value="no" ${!checked ? "checked" : ""} /> Ei</label>
    </div>
  `;
}

function renderMobileHeaderField(card, pilot, label, field) {
  const value = String(card[field] || "");
  const baseValue = pilot ? String(pilot[field] || "") : "";
  const display = value || baseValue || "-";

  return `
    <div class="mobile-field-group header-field">
      <span class="muted">${escapeHtml(label)}</span>
      <strong>${escapeHtml(display)}</strong>
    </div>
  `;
}

// getRoundStatus moved to logic

function renderMobileStandardAircraftFields(card) {
  return `
    <div class="mobile-score-section">
      <p class="kicker">Kone ja allekirjoitukset</p>
      <label class="check-row"><input type="checkbox" name="twoPointFiveClass" ${card.aircraft?.twoPointFiveClass ? "checked" : ""} /> 2,5 luokka</label>
      ${renderMobileTextField("Lentokonemalli", "modelName", card.aircraft?.modelName)}
      ${renderMobileTextField("Polttomoottori / Akku", "motorOrBattery", card.aircraft?.motorOrBattery)}
      ${renderMobileTextField("Potkuri (esim. 9x4)", "propeller", card.aircraft?.propeller)}
      ${renderMobileTextField("Kierrosluku (RPM)", "rpm", card.aircraft?.rpm)}
      ${renderMobileTextField("Pilotin allekirjoitus", "pilotSignature", card.signatures?.pilot)}
      ${renderMobileTextField("Tuomarin allekirjoitus", "judgeSignature", card.signatures?.judge)}
    </div>
  `;
}

function renderMobileWwiAircraftFields(card) {
  return `
    <div class="mobile-score-section">
      <p class="kicker">Kone ja allekirjoitukset</p>
      ${renderMobileTextField("Lentokonemalli", "modelName", card.aircraft?.modelName)}
      ${renderMobileTextField("Moottori ja potkuri", "motorOrBattery", card.aircraft?.motorOrBattery)}
      ${renderMobileTextField("Pilotin allekirjoitus", "pilotSignature", card.signatures?.pilot)}
      ${renderMobileTextField("Tuomarin allekirjoitus", "judgeSignature", card.signatures?.judge)}
    </div>
  `;
}

function renderMobileTextField(label, name, value) {
  return `<label>${escapeHtml(label)}<input name="${name}" value="${escapeHtml(value || "")}" /></label>`;
}
