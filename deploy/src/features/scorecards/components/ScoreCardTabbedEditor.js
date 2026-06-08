import { escapeHtml } from "../../../utils/html.js";
import { getScoreCardRules, SCORE_CARD_TEMPLATE_WWI, SCORE_CARD_TEMPLATES } from "../../../logic/scoreCards.js";

export function renderScoreCardTabbedEditor(activeEvent, viewRow) {
  const { card, pilotName, aircraftName, className, totals, entry } = viewRow;
  const stages = card.__displayStages || [];
  const flyingRound = card.__calculatedFlyingRound || "";
  const isWWI = card.templateId === SCORE_CARD_TEMPLATE_WWI;
  
  const pilotId = entry.id;

  return `
    <div class="scorecard-tab-container">
      
      <div class="scorecard-tabs">
        ${stages.map((stage, i) => `
          <button type="button" class="tab-btn ${i === 0 ? 'active' : ''}" data-action="switch-scorecard-tab" data-tab-target="tab-${stage.roundNumber}-${pilotId}">
            ${escapeHtml(stage.label)}
          </button>
        `).join("")}
      </div>

      ${stages.map((stage, i) => renderSingleRoundTable(stage, i === 0, card, totals, pilotId, isWWI)).join("")}
      
    </div>
  `;
}

function renderSingleRoundTable(stage, isActive, card, totals, pilotId, isWWI) {
  const rn = stage.roundNumber;

  const wwiRows = isWWI ? `
    <tr><td colspan="2" style="padding-top: 20px; padding-bottom: 5px; border-bottom: 1px solid var(--border); color: var(--primary); font-size: 1.1rem;"><strong>Mallipisteet</strong></td></tr>
  ` + SCORE_CARD_TEMPLATES[SCORE_CARD_TEMPLATE_WWI].modelPointItems.map(item => {
      const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
      const val = round?.modelPoints?.[item.key];
      const isYes = val === true;
      const isNo = val === false;
      return `
        <tr class="matrix-data-row">
          <td><strong>${item.label} (${item.points} P)</strong></td>
          <td>
            <div class="boolean-group" style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <label class="radio-boolean-label">
                  <input type="radio" name="r${rn}_model_${item.key}" value="yes" ${isYes ? "checked" : ""}>
                  <div class="radio-boolean-btn">X</div>
                </label>
                <label class="radio-boolean-label">
                  <input type="radio" name="r${rn}_model_${item.key}" value="no" ${isNo ? "checked" : ""}>
                  <div class="radio-boolean-btn">X</div>
                </label>
              </div>
              <div style="display: flex; gap: 10px; font-size: 0.8rem; padding-left: 5px; text-align: center;">
                <span style="width: 45px;">kyllä</span>
                <span style="width: 45px;">ei</span>
              </div>
            </div>
          </td>
        </tr>
      `;
  }).join("")
  + `<tr><td colspan="2" style="padding-top: 20px; padding-bottom: 5px; border-bottom: 1px solid var(--border); color: var(--primary); font-size: 1.1rem;"><strong>Lentopisteet</strong></td></tr>`
  + renderSingleFlightTimeRow("Lentoaika", stage, card, totals)
  + renderSingleNumberRow("Leikkaukset (Cuts)", stage, card, totals, "cuts", "cutPoints")
  + renderSingleNumberRow("Maamaalit (Ground)", stage, card, totals, "groundTargets", "groundTargetPoints")
  + renderSingleBooleanRow("Nosto (Takeoff)", stage, card, totals, "takeoff", "takeoffPoints", false)
  + renderSingleBooleanRow("Pakoilu (Hasenfuss)", stage, card, totals, "hasenfuss", "hasenfussPenalty", true)
  + renderSingleBooleanRow("Turvaraja (Safetyline)", stage, card, totals, "safetylineOverflown", "safetylinePenalty", true)
  + renderSingleBooleanRow("Streamer ehjä", stage, card, totals, "streamerOk", "streamerOkPoints", false)
  + renderSingleBooleanRow("Laskeutuminen merkistä", stage, card, totals, "landingAfterEndSignal", "landingAfterEndSignalPoints", false) : "";

  const standardRows = !isWWI ? renderSingleFlightTimeRow("Lentoaika", stage, card, totals)
  + renderSingleNumberRow("Leikkaukset (Cuts)", stage, card, totals, "cuts", "cutPoints")
  + renderSingleBooleanRow("Streamer ehjä", stage, card, totals, "streamerOk", "streamerOkPoints", false)
  + renderSingleBooleanRow("Pakoilu (Hasenfuss)", stage, card, totals, "hasenfuss", "hasenfussPenalty", true)
  + renderSingleBooleanRow("Turvaraja (Safetyline)", stage, card, totals, "safetylineOverflown", "safetylinePenalty", true) : "";

  return `
    <div class="tab-content ${isActive ? 'active' : ''}" id="tab-${rn}-${pilotId}">
      <div class="ui-table-container">
        <table class="matrix-table single-round-table">
          <colgroup>
            <col style="width: 60%;">
            <col style="width: 40%;">
          </colgroup>
          <tbody>
            ${isWWI ? wwiRows : standardRows}
            
            <tr class="row-summe">
              <td><strong>Summa</strong></td>
              <td>
                ${(() => {
                  const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
                  const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
                  const val = round && (round.flightSeconds > 0 || round.cuts > 0 || round.takeoff) && roundScore ? roundScore.total : "";
                  return `
                    <div class="sum-box-container" style="justify-content: flex-end; padding-right: 5px;">
                      <div class="print-box yellow-box" name="r${rn}_total_display" style="width: 70px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold;">${val}</div>
                      <input type="hidden" name="r${rn}_total" value="${val}">
                    </div>
                  `;
                })()}
              </td>
            </tr>

            <!-- AIRCRAFT INFO -->
            ${!isWWI ? renderSingleBooleanRow("2,5-luokka", stage, card, totals, "twoPointFiveClass", "dummy", false, true) : ""}
            ${renderSingleTextLineRow("Malli", stage, card, "modelName")}
            ${renderSingleTextLineRow("Moottori / Akku", stage, card, "motorOrBattery")}
            ${renderSingleTextLineRow("Potkuri", stage, card, "propeller")}
            ${renderSingleTextLineRow("Kierrosluku / RPM", stage, card, "rpm")}
            ${renderSignatureRow("Pilotin allekirjoitus", stage, card, "pilotSignature")}
            ${renderSignatureRow("Tuomarin allekirjoitus", stage, card, "judgeSignature")}
          </tbody>
        </table>
        
        <div class="tab-save-footer" style="text-align: right; padding: 10px;">
          ${card.updatedAt ? `<span style="color: var(--text-muted); font-size: 0.85rem;">Viimeksi tallennettu klo ${new Date(card.updatedAt).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderSingleFlightTimeRow(label, stage, card, totals) {
  const rn = stage.roundNumber;
  const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
  const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
  const hasData = round && (round.flightMinutes > 0 || round.flightSeconds > 0 || round.cuts > 0 || round.takeoff);
  const min = hasData ? (round.flightMinutes || 0) : "";
  const sek = hasData ? (round.flightSeconds || 0) : "";
  const points = hasData && roundScore?.flightPoints !== undefined ? roundScore.flightPoints : "";
  
  return `
    <tr class="matrix-data-row">
      <td><strong>${label}</strong></td>
      <td>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display: flex; gap: 15px; font-size: 0.85rem; padding-left: 2px; font-weight: bold; color: var(--muted);">
            <span style="width: 55px; text-align: center;">Min</span>
            <span style="width: 55px; text-align: center;">Sek</span>
          </div>
          <div style="display: flex; gap: 15px; align-items: center;">
            <input type="number" name="r${rn}_flightMinutes" class="editor-input no-spin" style="width:55px;height:45px;font-size:1.2rem;font-weight:bold;text-align:center; border-radius:6px;" min="0" max="9" value="${min}">
            <span style="font-weight: bold; font-size: 1.2rem; color: var(--muted);">:</span>
            <input type="number" name="r${rn}_flightSeconds" class="editor-input no-spin" style="width:55px;height:45px;font-size:1.2rem;font-weight:bold;text-align:center; border-radius:6px;" min="0" max="59" value="${sek}">
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderSingleNumberRow(label, stage, card, totals, field, pointsField) {
  const rn = stage.roundNumber;
  const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
  const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
  const hasData = round && (round[field] > 0 || round.flightSeconds > 0 || round.takeoff);
  const val = hasData ? (round[field] || 0) : "";
  const points = hasData && roundScore?.[pointsField] !== undefined ? roundScore[pointsField] : "";
  
  return `
    <tr class="matrix-data-row">
      <td><strong>${label}</strong></td>
      <td>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display: flex; gap: 15px; font-size: 0.85rem; padding-left: 2px; font-weight: bold; color: var(--muted);">
            <span style="width: 60px; text-align: center;">Kpl</span>
          </div>
          <div style="display: flex; gap: 15px; align-items: center;">
            <input type="number" name="r${rn}_${field}" class="editor-input no-spin" style="width:60px;height:45px;font-size:1.2rem;font-weight:bold;text-align:center; border-radius:6px;" min="0" value="${val}">
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderSingleBooleanRow(label, stage, card, totals, field, pointsField, isPenalty = false, isGlobalAircraftField = false) {
  const rn = stage.roundNumber;
  let val, roundScore, points = "";
  
  const inputName = isGlobalAircraftField 
      ? (field === 'dummy' ? `r${rn}_model_dummy` : field) 
      : `r${rn}_${field}`;

  if (isGlobalAircraftField) {
      val = field === 'dummy' ? card.rounds?.find(r => r.roundNumber === rn)?.modelPoints?.dummy : card.aircraft?.[field];
  } else {
      const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
      roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
      if (round && (round.flightSeconds > 0 || round.cuts > 0 || round[field] !== undefined || round.takeoff)) {
          val = round[field];
          if (roundScore?.[pointsField] !== undefined) {
              points = isPenalty && roundScore[pointsField] > 0 ? `-${roundScore[pointsField]}` : roundScore[pointsField];
              if (!isPenalty && roundScore[pointsField] > 0) points = `+${points}`;
          }
      }
  }
  
  const isYes = val === true;
  const isNo = val === false;
  
  return `
    <tr class="matrix-data-row">
      <td><strong>${label}</strong></td>
      <td>
        <div class="boolean-group" style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px;">
          <div style="display: flex; gap: 10px; align-items: center;">
            <label class="radio-boolean-label">
              <input type="radio" name="${inputName}" value="yes" ${isYes ? "checked" : ""}>
              <div class="radio-boolean-btn">X</div>
            </label>
            <label class="radio-boolean-label">
              <input type="radio" name="${inputName}" value="no" ${isNo ? "checked" : ""}>
              <div class="radio-boolean-btn">X</div>
            </label>
          </div>
          <div style="display: flex; gap: 10px; font-size: 0.8rem; padding-left: 5px; text-align: center;">
            <span style="width: 45px;">kyllä</span>
            <span style="width: 45px;">ei</span>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderSingleTextLineRow(label, stage, card, infoField) {
  let val = card.aircraft?.[infoField] || card.signatures?.[infoField] || "";
  // The global signature names match the backend keys pilotSignature/judgeSignature
  // Aircraft fields are modelName, motorOrBattery, propeller, rpm
  return `
    <tr class="matrix-text-row">
      <td>${label}</td>
      <td style="padding: 10px 4px;">
        <div style="width: 100%;">
          <input type="text" name="${infoField}" class="editor-input-line" style="width: 95%; margin: 0 auto; display: block; font-weight: bold;" value="${escapeHtml(val)}">
        </div>
      </td>
    </tr>
  `;
}

function renderSignatureRow(label, stage, card, infoField) {
  const rn = stage.roundNumber;
  const fieldName = `r${rn}_${infoField}`;
  const roundData = card.rounds?.find(r => r.roundNumber === rn);
  
  let val = roundData?.signatures?.[infoField] || card.signatures?.[infoField] || "";
  const imageId = `sig-preview-${rn}-${infoField}`;
  
  return `
    <tr class="matrix-text-row">
      <td>${label}</td>
      <td style="padding: 10px 4px;">
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <!-- Hidden input stores the dataURL -->
          <input type="hidden" name="${fieldName}" value="${escapeHtml(val)}">
          
          <!-- Image preview -->
          <img id="${imageId}" class="signature-preview" src="${escapeHtml(val)}" style="display: ${val ? 'block' : 'none'};">
          
          <!-- Sign button -->
          <button type="button" class="app-btn" data-action="open-signature" data-target-input="${fieldName}" data-target-image="${imageId}" style="width: 95%; max-width: 200px; justify-content: center; font-size: 0.9rem;">
            ✍️ Allekirjoita
          </button>
        </div>
      </td>
    </tr>
  `;
}
