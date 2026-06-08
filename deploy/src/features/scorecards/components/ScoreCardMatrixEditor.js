import { escapeHtml } from "../../../utils/html.js";
import { getScoreCardRules, SCORE_CARD_TEMPLATE_WWI } from "../../../logic/scoreCards.js";

export function renderScoreCardMatrixEditor(activeEvent, viewRow) {
  const { card, pilotName, aircraftName, className, totals, entry } = viewRow;
  const stages = card.__displayStages || [];
  const flyingRound = card.__calculatedFlyingRound || "";
  const isWWI = card.templateId === SCORE_CARD_TEMPLATE_WWI;
  const rules = getScoreCardRules(activeEvent);

  const startNumber = card.startNumber || "";
  const frequency = card.frequency || "2.4 GHz";
  const pilot = pilotName || "";
  
  return `
    <div class="scorecard-matrix-editor">
      <!-- HEADER -->
      <div class="matrix-header no-print">
        <div class="header-field">
          <span class="label">Nro:</span>
          <span class="value-line">${escapeHtml(startNumber)}</span>
        </div>
        <div class="header-field wide">
          <span class="label">Nimi:</span>
          <span class="value-line">${escapeHtml(pilot)}</span>
        </div>
        <div class="header-field">
          <span class="label">Luokka:</span>
          <span class="value-line">${escapeHtml(className || "")}</span>
        </div>
        <div class="header-field">
          <span class="label">Taajuus:</span>
          <span class="value-line">${escapeHtml(frequency)}</span>
        </div>
        <div class="header-field wide">
          <span class="label">Lentovuorot:</span>
          <span class="value-line">${escapeHtml(flyingRound || "")}</span>
        </div>
      </div>

      <div class="ui-table-container">
        <!-- MAIN MATRIX -->
        <table class="matrix-table editor-matrix-table">
          <thead>
            <tr>
              <th class="col-label sticky-col">
                Kirjaa starttipaikka /<br>tuomari
              </th>
              ${stages.map(stage => `
                <th class="col-round">
                  <div class="round-header">
                    <span>${escapeHtml(stage.label)}</span>
                    <input type="text" class="print-box grey-box editor-input" style="width:40px;height:20px;padding:0;text-align:center;" value="">
                  </div>
                </th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${isWWI ? renderInteractiveBooleanRow("Nosto (Takeoff)", stages, card, totals, "takeoff", "takeoffPoints", entry.id, false) : ""}
            ${renderInteractiveFlightTimeRow("Lentoaika", stages, card, totals, entry.id)}
            ${renderInteractiveNumberRow("Leikkaukset (Cuts)", stages, card, totals, "cuts", "cutPoints", entry.id)}
            ${isWWI ? renderInteractiveNumberRow("Maamaalit (Ground)", stages, card, totals, "groundTargets", "groundTargetPoints", entry.id) : ""}
            ${renderInteractiveBooleanRow("Streamer ehjä", stages, card, totals, "streamerOk", "streamerOkPoints", entry.id, false)}
            ${renderInteractiveBooleanRow("Pakoilu (Hasenfuss)", stages, card, totals, "hasenfuss", "hasenfussPenalty", entry.id, true)}
            ${renderInteractiveBooleanRow("Turvaraja (Safetyline)", stages, card, totals, "safetylineOverflown", "safetylinePenalty", entry.id, true)}
            ${isWWI ? renderInteractiveBooleanRow("Laskeutuminen merkistä", stages, card, totals, "landingAfterEndSignal", "landingAfterEndSignalPoints", entry.id, false) : ""}
            
            <tr class="row-summe">
              <td class="sticky-col"><strong>Summa</strong></td>
              ${stages.map(stage => {
                const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
                const val = round && (round.flightSeconds > 0 || round.cuts > 0 || round.takeoff) && roundScore ? roundScore.total : "";
                return `
                  <td>
                    <div class="sum-box-container">
                      <div class="print-box yellow-box wide-yellow">${val}</div>
                    </div>
                  </td>
                `;
              }).join("")}
            </tr>

            <!-- AIRCRAFT & SIGNATURES -->
            ${isWWI ? renderInteractiveBooleanRow("Mallipisteet", stages, card, totals, "dummy", "dummy", entry.id, false, true) : renderInteractiveBooleanRow("2,5-luokka", stages, card, totals, "twoPointFiveClass", "dummy", entry.id, false, true)}
            ${renderInteractiveTextLineRow("Malli", stages, card, "modelName", entry.id)}
            ${renderInteractiveTextLineRow("Moottori / Akku", stages, card, "motorOrBattery", entry.id)}
            ${renderInteractiveTextLineRow("Potkuri", stages, card, "propeller", entry.id)}
            ${renderInteractiveTextLineRow("Kierrosluku / RPM", stages, card, "rpm", entry.id)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInteractiveFlightTimeRow(label, stages, card, totals, pilotId) {
  return `
    <tr class="matrix-data-row">
      <td class="sticky-col"><strong>${label}</strong></td>
      ${stages.map(stage => {
        const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
        const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
        const hasData = round && (round.flightMinutes > 0 || round.flightSeconds > 0 || round.cuts > 0 || round.takeoff);
        const min = hasData ? (round.flightMinutes || 0) : "";
        const sek = hasData ? (round.flightSeconds || 0) : "";
        const points = hasData && roundScore?.flightPoints !== undefined ? roundScore.flightPoints : "";
        
        return `
          <td>
            <div class="print-input-group">
              <div class="print-labels"><span>Min</span><span>sek</span><span class="yellow-label"></span></div>
              <div class="print-boxes">
                <input type="number" class="print-box white-box editor-input" min="0" max="9" 
                  data-action="update-score" data-pilot-id="${escapeHtml(pilotId)}" 
                  data-round-number="${stage.roundNumber}" data-field="flightMinutes" value="${min}">
                <input type="number" class="print-box white-box editor-input" min="0" max="59" 
                  data-action="update-score" data-pilot-id="${escapeHtml(pilotId)}" 
                  data-round-number="${stage.roundNumber}" data-field="flightSeconds" value="${sek}">
                <div class="print-box yellow-box">${points}</div>
              </div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderInteractiveNumberRow(label, stages, card, totals, field, pointsField, pilotId) {
  return `
    <tr class="matrix-data-row">
      <td class="sticky-col"><strong>${label}</strong></td>
      ${stages.map(stage => {
        const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
        const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
        const hasData = round && (round[field] > 0 || round.flightSeconds > 0 || round.takeoff);
        const val = hasData ? (round[field] || 0) : "";
        const points = hasData && roundScore?.[pointsField] !== undefined ? roundScore[pointsField] : "";
        
        return `
          <td>
            <div class="print-input-group">
              <div class="print-labels"><span>Kpl</span><span class="yellow-label"></span></div>
              <div class="print-boxes">
                <input type="number" class="print-box white-box wide editor-input" min="0" 
                  data-action="update-score" data-pilot-id="${escapeHtml(pilotId)}" 
                  data-round-number="${stage.roundNumber}" data-field="${field}" value="${val}">
                <div class="print-box yellow-box">${points}</div>
              </div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderInteractiveBooleanRow(label, stages, card, totals, field, pointsField, pilotId, isPenalty = false, isGlobalAircraftField = false) {
  return `
    <tr class="matrix-data-row">
      <td class="sticky-col"><strong>${label}</strong></td>
      ${stages.map(stage => {
        let val, roundScore, points = "";
        if (isGlobalAircraftField) {
            val = card.aircraft?.[field];
        } else {
            const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
            roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
            if (round && (round.flightSeconds > 0 || round.cuts > 0 || round[field] !== undefined || round.takeoff)) {
                val = round[field];
                if (roundScore?.[pointsField] !== undefined) {
                    points = isPenalty && roundScore[pointsField] > 0 ? `-${roundScore[pointsField]}` : roundScore[pointsField];
                }
            }
        }
        
        const isYes = val === true;
        const isNo = val === false;
        
        return `
          <td>
            <div class="print-input-group boolean-group">
              <div class="print-boxes">
                <button type="button" class="print-box white-box editor-boolean-btn ${isYes ? 'btn-yes' : ''}"
                  data-action="${isGlobalAircraftField ? 'update-aircraft' : 'update-score'}" data-pilot-id="${escapeHtml(pilotId)}" 
                  data-round-number="${stage.roundNumber}" data-field="${field}" data-value="true">
                  ${isYes ? 'X' : ''}
                </button>
                <button type="button" class="print-box white-box editor-boolean-btn ${isNo ? 'btn-no' : ''}"
                  data-action="${isGlobalAircraftField ? 'update-aircraft' : 'update-score'}" data-pilot-id="${escapeHtml(pilotId)}" 
                  data-round-number="${stage.roundNumber}" data-field="${field}" data-value="false">
                  ${isNo ? 'X' : ''}
                </button>
                ${isGlobalAircraftField ? '' : `<div class="print-box yellow-box">${points}</div>`}
              </div>
              <div class="print-labels"><span>kyllä</span><span>ei</span><span class="yellow-label"></span></div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderInteractiveTextLineRow(label, stages, card, infoField, pilotId) {
  return `
    <tr class="matrix-text-row">
      <td class="sticky-col">${label}</td>
      ${stages.map(stage => {
        let val = "";
        // In the traditional matrix, they can write per-round. For now we just use a global aircraft field but show it in round 1.
        if (stage.roundNumber === 1 && card.aircraft?.[infoField]) {
            val = card.aircraft[infoField];
        }
        
        return `
          <td>
            <div class="write-line-cell">
              ${stage.roundNumber === 1 ? `<input type="text" class="line-content editor-input-line" 
                  data-action="update-aircraft" data-pilot-id="${escapeHtml(pilotId)}" 
                  data-field="${infoField}" value="${escapeHtml(val)}">` : '<div class="line-content"></div>'}
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}
