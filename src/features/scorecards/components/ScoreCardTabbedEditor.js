import { escapeHtml } from "../../../utils/html.js";
import { getScoreCardRules, SCORE_CARD_TEMPLATE_WWI, SCORE_CARD_TEMPLATES, roundHasData } from "../../../logic/scoreCards.js";
import { t } from "../../../utils/i18n.js";

export function renderScoreCardTabbedEditor(activeEvent, viewRow) {
  const { card, pilotName, aircraftName, className, totals, entry } = viewRow;
  const stages = card.__displayStages || [];
  const flyingRound = card.__calculatedFlyingRound || "";
  const isWWI = card.templateId === SCORE_CARD_TEMPLATE_WWI;
  
  const pilotId = entry.id;

  // Etsi viimeisin kierros, jolle on luotu Heat
  let activeTabIndex = 0;
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    const hasHeat = (viewRow.pilotHeats || []).some(h => h.phase === stage.heatPhase && h.round === stage.heatRound);
    if (hasHeat) {
      activeTabIndex = i;
      break;
    }
  }

  return `
    <div class="scorecard-tab-container">
      
      <div class="scorecard-tabs">
        ${stages.map((stage, i) => {
          const heat = (viewRow.pilotHeats || []).find(h => h.phase === stage.heatPhase && h.round === stage.heatRound);
          const heatInfo = heat ? `<div style="font-size: 0.8rem; color: var(--primary); font-weight: bold; margin-top: 2px; letter-spacing: 0.05em;">Heat ${escapeHtml(heat.groupName)}</div>` : '';
          return `
          <button type="button" class="tab-btn ${i === activeTabIndex ? 'active' : ''}" data-action="switch-scorecard-tab" data-tab-target="tab-${stage.roundNumber}-${pilotId}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; padding-top: 8px; padding-bottom: 8px;">
            <div>${escapeHtml(stage.label)}</div>
            ${heatInfo}
          </button>
          `;
        }).join("")}
      </div>

      ${stages.map((stage, i) => renderSingleRoundTable(stage, i === activeTabIndex, viewRow, isWWI)).join("")}
      
    </div>
  `;
}

function renderSingleRoundTable(stage, isActive, viewRow, isWWI) {
  const { card, totals, entry, pilotAircraft = [] } = viewRow;
  const pilotId = entry.id;
  const rn = stage.roundNumber;

  const wwiRows = isWWI ? `
    <tr><td colspan="2" style="padding: 12px 15px; background: rgba(88, 183, 255, 0.15); border-left: 4px solid var(--primary); color: var(--accent-strong); font-size: 1.1rem;"><strong>${t(window.state, "scorecard_editor.model_points")}</strong></td></tr>
  ` + SCORE_CARD_TEMPLATES[SCORE_CARD_TEMPLATE_WWI].modelPointItems.map(item => {
      const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
      const val = round?.modelPoints?.[item.key];
      const isYes = val === true;
      const isNo = val === false;
      return `
        <tr class="matrix-data-row">
          <td><strong>${item.label} (${item.points} P)</strong></td>
          <td>
            <div class="yes-no-row-two" style="width: 100%; max-width: 250px;">
              <label class="yes-no-btn">
                <input type="radio" name="r${rn}_model_${item.key}" value="yes" ${isYes ? "checked" : ""}>
                <span>${t(window.state, "scorecard_editor.yes")}</span>
              </label>
              <label class="yes-no-btn">
                <input type="radio" name="r${rn}_model_${item.key}" value="no" ${isNo ? "checked" : ""}>
                <span>${t(window.state, "scorecard_editor.no")}</span>
              </label>
            </div>
          </td>
        </tr>
      `;
  }).join("")
  + (() => {
      const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
      const val = roundScore?.modelPoints !== undefined ? roundScore.modelPoints : "";
      return `
        <tr class="row-summe" style="background: rgba(255, 209, 102, 0.08); box-shadow: inset 0 2px 0 0 rgba(255, 209, 102, 0.3);">
          <td style="padding-top: 15px; padding-bottom: 15px; color: #ffd166; font-size: 1.1rem; text-shadow: 0 0 8px rgba(255, 209, 102, 0.3);"><strong>${t(window.state, "scorecard_editor.model_points_total")}</strong></td>
          <td style="padding-top: 15px; padding-bottom: 15px;">
            <div class="sum-box-container" style="display: flex; width: 100%; padding-right: 5px;">
              <div class="print-box yellow-box" name="r${rn}_modelPoints_display" style="width: 100%; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; border-radius: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">${val}</div>
            </div>
          </td>
        </tr>
      `;
  })()
  + `<tr><td colspan="2" style="padding: 12px 15px; background: rgba(88, 183, 255, 0.15); border-left: 4px solid var(--primary); color: var(--accent-strong); font-size: 1.1rem;"><strong>${t(window.state, "scorecard_editor.flight_points")}</strong></td></tr>`
  + renderSingleFlightTimeRow(t(window.state, "scorecard_editor.flight_time"), stage, card, totals)
  + renderSingleNumberRow(t(window.state, "scorecard_editor.cuts"), stage, card, totals, "cuts", "cutPoints")
  + renderSingleNumberRow(t(window.state, "scorecard_editor.ground_targets"), stage, card, totals, "groundTargets", "groundTargetPoints")
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.takeoff"), stage, card, totals, "takeoff", "takeoffPoints", false)
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.hasenfuss"), stage, card, totals, "hasenfuss", "hasenfussPenalty", true)
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.safety_line"), stage, card, totals, "safetylineOverflown", "safetylinePenalty", true)
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.streamer_ok"), stage, card, totals, "streamerOk", "streamerOkPoints", false)
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.landing"), stage, card, totals, "landingAfterEndSignal", "landingAfterEndSignalPoints", false) : "";

  const standardRows = !isWWI ? renderSingleFlightTimeRow(t(window.state, "scorecard_editor.flight_time"), stage, card, totals)
  + renderSingleNumberRow(t(window.state, "scorecard_editor.cuts"), stage, card, totals, "cuts", "cutPoints")
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.streamer_ok"), stage, card, totals, "streamerOk", "streamerOkPoints", false)
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.hasenfuss"), stage, card, totals, "hasenfuss", "hasenfussPenalty", true)
  + renderSingleBooleanRow(t(window.state, "scorecard_editor.safety_line"), stage, card, totals, "safetylineOverflown", "safetylinePenalty", true) : "";

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
            
            <tr class="row-summe" style="background: rgba(255, 209, 102, 0.08); box-shadow: inset 0 2px 0 0 rgba(255, 209, 102, 0.3);">
              <td style="padding-top: 15px; padding-bottom: 15px; color: #ffd166; font-size: 1.1rem; text-shadow: 0 0 8px rgba(255, 209, 102, 0.3);"><strong>${t(window.state, "scorecard_editor.flight_points_total")}</strong></td>
              <td style="padding-top: 15px; padding-bottom: 15px;">
                ${(() => {
                  const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
                  const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
                  const val = round && roundHasData(round) && roundScore ? roundScore.flightTotal : "";
                  return `
                    <div class="sum-box-container" style="display: flex; width: 100%; padding-right: 5px;">
                      <div class="print-box yellow-box" name="r${rn}_flightTotal_display" style="width: 100%; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; border-radius: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">${val}</div>
                      <input type="hidden" name="r${rn}_total" value="${roundScore ? roundScore.total : ""}">
                    </div>
                  `;
                })()}
              </td>
            </tr>

            <!-- AIRCRAFT INFO -->
            ${!isWWI ? renderSingleBooleanRow(t(window.state, "scorecard_editor.25_class"), stage, card, totals, "twoPointFiveClass", "dummy", false, true) : ""}
            ${renderModelSelectRow(t(window.state, "scorecard_editor.model"), stage, card, "modelName", pilotAircraft)}
            ${renderSingleTextLineRow(t(window.state, "scorecard_editor.motor_battery"), stage, card, "motorOrBattery")}
            ${renderSingleTextLineRow(t(window.state, "scorecard_editor.propeller"), stage, card, "propeller")}
            ${renderSingleTextLineRow(t(window.state, "scorecard_editor.rpm"), stage, card, "rpm")}
            ${renderSignatureRow(t(window.state, "scorecard_editor.pilot_signature"), stage, card, "pilotSignature")}
            ${renderSignatureRow(t(window.state, "scorecard_editor.judge_signature"), stage, card, "judgeSignature")}
          </tbody>
        </table>
        
        <div style="text-align: center; padding: 25px 0 15px 0; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 10px;">
          <strong style="font-size: 1.8rem; color: #ffd166; text-shadow: 0 0 10px rgba(255, 209, 102, 0.4);">
            Erän pisteet: <span name="r${rn}_total_display">${(() => {
              const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
              return roundScore ? roundScore.total : 0;
            })()}</span> p
          </strong>
        </div>

        <div class="tab-save-footer" style="display: none;"></div>
      </div>
    </div>
  `;
}

function renderSingleFlightTimeRow(label, stage, card, totals) {
  const rn = stage.roundNumber;
  const round = card.rounds?.find(r => Number(r.roundNumber) === rn);
  const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === rn)?.score;
  const hasData = round && roundHasData(round);
  const min = hasData ? (round.flightMinutes || 0) : "";
  const sek = hasData ? (round.flightSeconds || 0) : "";
  const points = hasData && roundScore?.flightPoints !== undefined ? roundScore.flightPoints : "";
  
  return `
    <tr class="matrix-data-row">
      <td><strong>${label}</strong></td>
      <td>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px; max-width: 100%;">
          <div style="display: flex; width: 100%; max-width: 270px; font-size: 0.85rem; font-weight: bold; color: var(--muted);">
            <span style="flex: 1; text-align: center;">Min</span>
            <span style="width: 10px;"></span>
            <span style="flex: 1; text-align: center;">Sek</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center; max-width: 100%;">
            <div class="stepper-input" style="flex: 1; min-width: 0;">
              <button type="button" class="stepper-btn" data-action="step-input" data-target="r${rn}_flightMinutes" data-step="minus">-</button>
              <input type="number" name="r${rn}_flightMinutes" id="r${rn}_flightMinutes" class="editor-input no-spin" min="0" max="9" value="${min}">
              <button type="button" class="stepper-btn" data-action="step-input" data-target="r${rn}_flightMinutes" data-step="plus">+</button>
            </div>
            <span style="font-weight: bold; font-size: 1.2rem; color: var(--muted);">:</span>
            <div class="stepper-input" style="flex: 1; min-width: 0;">
              <button type="button" class="stepper-btn" data-action="step-input" data-target="r${rn}_flightSeconds" data-step="minus">-</button>
              <input type="number" name="r${rn}_flightSeconds" id="r${rn}_flightSeconds" class="editor-input no-spin" min="0" max="59" value="${sek}">
              <button type="button" class="stepper-btn" data-action="step-input" data-target="r${rn}_flightSeconds" data-step="plus">+</button>
            </div>
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
  const hasData = round && roundHasData(round);
  const val = hasData ? (round[field] || 0) : "";
  const points = hasData && roundScore?.[pointsField] !== undefined ? roundScore[pointsField] : "";
  
  return `
    <tr class="matrix-data-row">
      <td><strong>${label}</strong></td>
      <td>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display: flex; font-size: 0.85rem; padding-left: 2px; font-weight: bold; color: var(--muted);">
            <span style="width: 140px; text-align: center;">${t(window.state, "scorecard_editor.qty")}</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div class="stepper-input" style="width: 140px;">
              <button type="button" class="stepper-btn" data-action="step-input" data-target="r${rn}_${field}" data-step="minus">-</button>
              <input type="number" name="r${rn}_${field}" id="r${rn}_${field}" class="editor-input no-spin" min="0" value="${val}">
              <button type="button" class="stepper-btn" data-action="step-input" data-target="r${rn}_${field}" data-step="plus">+</button>
            </div>
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
      if (round && roundHasData(round)) {
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
        <div class="yes-no-row-two" style="width: 100%; max-width: 250px;">
          <label class="yes-no-btn">
            <input type="radio" name="${inputName}" value="yes" ${isYes ? "checked" : ""}>
            <span>${t(window.state, "scorecard_editor.yes")}</span>
          </label>
          <label class="yes-no-btn">
            <input type="radio" name="${inputName}" value="no" ${isNo ? "checked" : ""}>
            <span>${t(window.state, "scorecard_editor.no")}</span>
          </label>
        </div>
      </td>
    </tr>
  `;
}

function renderSingleTextLineRow(label, stage, card, infoField) {
  let val = card.aircraft?.[infoField] || card.signatures?.[infoField] || "";
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

function renderModelSelectRow(label, stage, card, infoField, pilotAircraft) {
  let val = card.aircraft?.[infoField] || card.signatures?.[infoField] || "";
  const listId = `aircraft-list-${stage.roundNumber}-${card.id}`;
  
  const datalist = `
    <datalist id="${listId}">
      ${pilotAircraft.map(a => `<option value="${escapeHtml(a.name)}"></option>`).join("")}
    </datalist>
  `;

  return `
    <tr class="matrix-text-row">
      <td>${label}</td>
      <td style="padding: 10px 4px;">
        <div style="width: 100%;">
          ${datalist}
          <input type="text" name="${infoField}" list="${listId}" class="editor-input-line" style="width: 95%; margin: 0 auto; display: block; font-weight: bold;" value="${escapeHtml(val)}" placeholder="Valitse listasta tai kirjoita...">
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
