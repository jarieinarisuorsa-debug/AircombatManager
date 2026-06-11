import { escapeHtml } from "../../../utils/html.js";
import { getScoreCardRules, SCORE_CARD_TEMPLATE_WWI, SCORE_CARD_TEMPLATES, calculateModelPoints, roundHasData } from "../../../logic/scoreCards.js";
import { t } from "../../../utils/i18n.js";
import { isDemo } from "../../../state/store.js";

export function renderScoreCardPrintView(activeEvent, viewRow) {
  const { card, pilotName, aircraftName, className, totals } = viewRow;
  const stages = card.__displayStages || [];
  const flyingRound = card.__calculatedFlyingRound || "";
  const isWWI = card.templateId === SCORE_CARD_TEMPLATE_WWI;
  const rules = getScoreCardRules(activeEvent);

  const startNumber = card.startNumber || "";
  const frequency = card.frequency || "2.4 GHz";
  const pilot = pilotName || "";
  
  if (isWWI) {
    return renderWWIScoreCardPrintView(card, viewRow, activeEvent);
  }

  const demoWatermark = isDemo ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 150px; font-weight: 900; color: rgba(255, 0, 0, 0.15); pointer-events: none; z-index: 9999; letter-spacing: 20px; white-space: nowrap;">DEMO</div>` : '';

  return `
    <div class="scorecard-print-view matrix-layout" style="position: relative;">
      ${demoWatermark}
      <!-- HEADER -->
      <div class="matrix-header">
        <div class="header-field">
          <span class="label">${t(window.appState, "scorecard_print.number")}</span>
          <span class="value-line">${escapeHtml(startNumber)}</span>
        </div>
        <div class="header-field wide">
          <span class="label">${t(window.appState, "scorecard_print.name")}</span>
          <span class="value-line">${escapeHtml(pilot)}</span>
        </div>
        <div class="header-field">
          <span class="label">${t(window.appState, "scorecard_print.class")}</span>
          <span class="value-line">${escapeHtml(className || "")}</span>
        </div>
        <div class="header-field">
          <span class="label">${t(window.appState, "scorecard_print.frequency")}</span>
          <span class="value-line">${escapeHtml(frequency)}</span>
        </div>
        <div class="header-field wide">
          <span class="label">${t(window.appState, "scorecard_print.flying_rounds")}</span>
          <span class="value-line">${escapeHtml(flyingRound || "")}</span>
        </div>
      </div>

      <!-- MAIN MATRIX -->
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="col-label" style="font-size: 0.7rem; font-weight: normal; text-align: left; vertical-align: top;">
              ${t(window.appState, "scorecard_print.judge_start_place")}
            </th>
            ${stages.map(stage => {
              const heat = (viewRow.pilotHeats || []).find(h => h.phase === stage.heatPhase && h.round === stage.heatRound);
              const heatInfo = heat ? `<div style="font-size: 0.7rem; font-weight: bold; margin-top: 2px;">Heat ${escapeHtml(heat.groupName)}</div>` : '';
              return `
              <th class="col-round">
                <div class="round-header" style="line-height: 1.1;">
                  <span>${escapeHtml(stage.label)}</span>
                  ${heatInfo}
                  <div class="print-box grey-box" style="margin-top: 5px;"></div>
                </div>
              </th>
              `;
            }).join("")}
          </tr>
        </thead>
        <tbody>
          ${isWWI ? renderMatrixBooleanRow(t(window.appState, "scorecard_print.takeoff"), stages, card, totals, "takeoff", "takeoffPoints") : ""}
          ${renderMatrixFlightTimeRow(t(window.appState, "scorecard_print.flight_time"), stages, card, totals)}
          ${renderMatrixNumberRow(t(window.appState, "scorecard_print.cuts"), stages, card, totals, "cuts", "cutPoints")}
          ${isWWI ? renderMatrixNumberRow(t(window.appState, "scorecard_print.ground_targets"), stages, card, totals, "groundTargets", "groundTargetPoints") : ""}
          ${renderMatrixBooleanRow(t(window.appState, "scorecard_print.streamer_ok"), stages, card, totals, "streamerOk", "streamerOkPoints")}
          ${renderMatrixBooleanRow(t(window.appState, "scorecard_print.hasenfuss"), stages, card, totals, "hasenfuss", "hasenfussPenalty", true)}
          ${renderMatrixBooleanRow(t(window.appState, "scorecard_print.safety_line"), stages, card, totals, "safetylineOverflown", "safetylinePenalty", true)}
          ${isWWI ? renderMatrixBooleanRow(t(window.appState, "scorecard_print.landing_mark"), stages, card, totals, "landingAfterEndSignal", "landingAfterEndSignalPoints") : ""}
          
          <tr class="row-summe">
            <td><strong>${t(window.appState, "scorecard_print.sum")}</strong></td>
            ${stages.map(stage => {
              const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
              const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
              const val = round && roundHasData(round) && roundScore ? roundScore.total : "";
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
          ${isWWI ? renderMatrixTextLineRow(t(window.appState, "scorecard_print.model_points"), stages, card, "modelPoints", "kpl", viewRow) : renderMatrixBooleanRow(t(window.appState, "scorecard_print.dummy_class"), stages, card, totals, "dummy", "dummy")}
          ${renderMatrixTextLineRow(t(window.appState, "scorecard_print.model"), stages, card, "modelName", "", viewRow)}
          ${renderMatrixTextLineRow(t(window.appState, "scorecard_print.motor_battery"), stages, card, "motorOrBattery", "", viewRow)}
          ${renderMatrixTextLineRow(t(window.appState, "scorecard_print.propeller"), stages, card, "propeller", "", viewRow)}
          ${renderMatrixTextLineRow(t(window.appState, "scorecard_print.rpm"), stages, card, "rpm", "", viewRow)}
          ${renderMatrixSignatureRow(t(window.appState, "scorecard_print.pilot_signature"), stages, card, "pilotSignature")}
          ${renderMatrixSignatureRow(t(window.appState, "scorecard_print.judge_signature"), stages, card, "judgeSignature")}

        </tbody>
      </table>

      <!-- BOTTOM BAR: TOTALS & WARNINGS -->
      <div class="print-bottom-bar">
        <div class="warnings-box horizontal-warnings">
          <strong>${t(window.appState, "scorecard_print.warnings")}</strong><br>
          <span class="red-text">${t(window.appState, "scorecard_print.warning_start")}</span> &nbsp;|&nbsp;
          <span class="red-text">${t(window.appState, "scorecard_print.warning_judge")}</span> &nbsp;|&nbsp;
          <span class="red-text">${t(window.appState, "scorecard_print.warning_clear")}</span>
        </div>
        
        <div class="final-totals-box">
          <div class="total-field">
            <span class="label">${t(window.appState, "scorecard_print.total_points")}</span>
            <div class="print-box yellow-box huge-yellow">${totals?.totalPoints !== undefined && totals.totalPoints !== "" ? totals.totalPoints : ""}</div>
          </div>
          <div class="total-field">
            <span class="label">${t(window.appState, "scorecard_print.placement")}</span>
            <div class="print-box white-box huge-white"></div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function renderMatrixFlightTimeRow(label, stages, card, totals) {
  return `
    <tr class="matrix-data-row">
      <td class="sticky-col"><strong>${label}</strong></td>
      ${stages.map(stage => {
        const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
        const hasData = round && roundHasData(round);
        const min = hasData ? (round.flightMinutes || 0) : "";
        const sek = hasData ? (round.flightSeconds || 0) : "";
        
        return `
          <td>
            <div class="print-input-group">
              <div class="print-labels" style="width: 100px;">
                <span style="flex:1;">${t(window.appState, "scorecard_print.min")}</span>
                <span style="flex:1;">${t(window.appState, "scorecard_print.sec")}</span>
              </div>
              <div class="print-boxes" style="width: 100px;">
                <div class="print-box white-box" style="flex:1; display:flex; align-items:center; justify-content:center; font-weight:bold;">${min}</div>
                <div class="print-box white-box" style="flex:1; display:flex; align-items:center; justify-content:center; font-weight:bold;">${sek}</div>
              </div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderMatrixNumberRow(label, stages, card, totals, field) {
  return `
    <tr class="matrix-data-row">
      <td class="sticky-col"><strong>${label}</strong></td>
      ${stages.map(stage => {
        const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
        const hasData = round && roundHasData(round);
        const val = hasData ? (round[field] || 0) : "";
        
        return `
          <td>
            <div class="print-input-group">
              <div class="print-labels" style="width: 100%;">
                <span>${t(window.appState, "scorecard_print.pcs")}</span>
              </div>
              <div class="print-boxes" style="width: 100%;">
                <div class="print-box white-box wide-white" style="flex:1; display:flex; align-items:center; justify-content:center; font-weight:bold;">${val}</div>
              </div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderMatrixBooleanRow(label, stages, card, totals, field, pointsField, isPenalty = false, isGlobalAircraftField = false) {
  return `
    <tr class="matrix-data-row">
      <td class="sticky-col"><strong>${label}</strong></td>
      ${stages.map(stage => {
        let val;
        // Notice we ignore totals, pointsField and isPenalty since we are stripping out the yellow point boxes!
        if (isGlobalAircraftField) {
            val = card.aircraft?.[field];
        } else {
            const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
            if (round && roundHasData(round)) {
                val = round[field];
            }
        }
        
        const isYes = val === true;
        const isNo = val === false;
        
        return `
          <td>
            <div class="print-input-group boolean-group">
              <div class="print-boxes" style="width: 80px;">
                <div class="print-box white-box ${isYes ? 'checked-box' : ''}" style="flex:1; display:flex; align-items:center; justify-content:center; font-weight:bold;">${isYes ? 'X' : ''}</div>
                <div class="print-box white-box ${isNo ? 'checked-box' : ''}" style="flex:1; display:flex; align-items:center; justify-content:center; font-weight:bold;">${isNo ? 'X' : ''}</div>
              </div>
              <div class="print-labels" style="width: 80px;">
                <span style="flex:1;">${t(window.appState, "scorecard_print.yes")}</span>
                <span style="flex:1;">${t(window.appState, "scorecard_print.no")}</span>
              </div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderMatrixTextLineRow(label, stages, card, infoField, unit = "", viewRow = null) {
  return `
    <tr class="matrix-text-row">
      <td>${label}</td>
      ${stages.map(stage => {
        // Jos tuloskortille ei ole tallennettu omaa konetta, haetaan ensisijaisesti pilotin kisaan ilmoittama kone
        const sourceAircraft = card.aircraft || (viewRow && viewRow.aircraft) || {};
        let val = "";
        if (infoField === "modelName" && sourceAircraft.modelName) val = sourceAircraft.modelName;
        if (infoField === "motorOrBattery" && sourceAircraft.motorOrBattery) val = sourceAircraft.motorOrBattery;
        if (infoField === "propeller" && sourceAircraft.propeller) val = sourceAircraft.propeller;
        if (infoField === "rpm" && sourceAircraft.rpm) val = sourceAircraft.rpm;
        
        return `
          <td>
            <div class="write-line-cell">
              <div class="line-content">${val}</div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderMatrixSignatureRow(label, stages, card, infoField) {
  return `
    <tr class="matrix-text-row">
      <td>${label}</td>
      ${stages.map(stage => {
        const roundData = card.rounds?.find(r => r.roundNumber === stage.roundNumber);
        let val = roundData?.signatures?.[infoField] || card.signatures?.[infoField] || "";
        
        return `
          <td>
            <div class="write-line-cell" style="padding-top: 5px;">
              ${val && val.startsWith('data:image') 
                ? `<img src="${val}" style="max-height: 40px; max-width: 90%; display: block; margin: 0 auto;">` 
                : `<div class="line-content"></div>`}
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderWWIScoreCardPrintView(card, viewRow, activeEvent) {
  const { pilotName, aircraftName, className, totals } = viewRow;
  const stages = card.__displayStages || [];
  const flyingRound = card.__calculatedFlyingRound || "";
  
  const startNumber = card.startNumber || "";
  const frequency = card.frequency || "2.4 GHz";
  const pilot = pilotName || "";

  const demoWatermark = isDemo ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 150px; font-weight: 900; color: rgba(255, 0, 0, 0.15); pointer-events: none; z-index: 9999; letter-spacing: 20px; white-space: nowrap;">DEMO</div>` : '';

  return `
    <div class="scorecard-print-view wwi-matrix-layout" style="position: relative;">
      ${demoWatermark}
      <!-- HEADER -->
      <div class="matrix-header" style="margin-bottom: 10px;">
        <div class="header-field">
          <span class="label">${t(window.appState, "scorecard_print.number")}</span>
          <span class="value-line">${escapeHtml(startNumber)}</span>
        </div>
        <div class="header-field wide">
          <span class="label">${t(window.appState, "scorecard_print.name")}</span>
          <span class="value-line">${escapeHtml(pilot)}</span>
        </div>
        <div class="header-field">
          <span class="label">${t(window.appState, "scorecard_print.class")}</span>
          <span class="value-line">${escapeHtml(className || "")}</span>
        </div>
        <div class="header-field">
          <span class="label">${t(window.appState, "scorecard_print.frequency")}</span>
          <span class="value-line">${escapeHtml(frequency)}</span>
        </div>
        <div class="header-field wide">
          <span class="label">${t(window.appState, "scorecard_print.flying_rounds")}</span>
          <span class="value-line">${escapeHtml(flyingRound || "")}</span>
        </div>
      </div>

      <div class="wwi-main-layout">
        <!-- LEFT TABLE -->
        <table class="wwi-matrix-table" style="width: 100%;">
          <thead>
            <tr>
              <th style="width: 25%;"></th>
              ${stages.map(stage => {
                const heat = (viewRow.pilotHeats || []).find(h => h.phase === stage.heatPhase && h.round === stage.heatRound);
                const heatInfo = heat ? `<div style="font-size: 0.75rem; font-weight: bold; margin-top: 2px; color: #333;">Heat ${escapeHtml(heat.groupName)}</div>` : '';
                return `
                <th style="width: 18%; text-align: left; line-height: 1.1; vertical-align: bottom; padding-bottom: 5px;">
                  <strong>${escapeHtml(stage.label)}</strong>
                  ${heatInfo}
                </th>
                `;
              }).join("")}
            </tr>
          </thead>
          <tbody>
            
            <!-- MODELLPUNKTE -->
            <tr><td colspan="5" class="section-title"><strong>${t(window.appState, "scorecard_print.model_points")}</strong></td></tr>
            ${SCORE_CARD_TEMPLATES[SCORE_CARD_TEMPLATE_WWI].modelPointItems.map(item => `
              <tr>
                <td class="row-label">${item.label} (${item.points} P)</td>
                ${stages.map(stage => {
                   const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                   const isYes = round?.modelPoints?.[item.key] === true;
                   const isNo = round?.modelPoints?.[item.key] === false;
                   return `
                     <td class="check-col">
                        <div class="wwi-ja-nein">
                          <div class="jn-header"><span>kyllä</span><span>ei</span></div>
                          <div class="jn-boxes">
                            <div class="jn-box ${isYes ? 'checked' : ''}">${isYes ? 'X' : ''}</div>
                            <div class="jn-box ${isNo ? 'checked' : ''}">${isNo ? 'X' : ''}</div>
                          </div>
                        </div>
                     </td>
                   `;
                }).join("")}
              </tr>
            `).join("")}
            <tr>
              <td class="max-points-label"><span class="highlight-yellow">max. 100</span> Mallipisteet</td>
              ${stages.map(stage => {
                  const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                  const hasModelPoints = round && roundHasData(round);
                  const pts = hasModelPoints ? calculateModelPoints(round, getScoreCardRules(activeEvent)) : "";
                  return `<td class="check-col"><div class="wwi-points-box yellow-box ${hasModelPoints ? '' : 'empty'}">${pts}</div></td>`;
              }).join("")}
            </tr>

            <!-- FLUGPUNKTE -->
            <tr><td colspan="5" class="section-title" style="padding-top: 15px;"><strong>${t(window.appState, "scorecard_print.flight_points")}</strong></td></tr>
            <tr>
              <td class="row-label">${t(window.appState, "scorecard_print.flight_time")}</td>
              ${stages.map(stage => {
                 const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                 const hasData = round && roundHasData(round);
                 const min = hasData ? (round.flightMinutes || 0) : "";
                 const sek = hasData ? (round.flightSeconds || 0) : "";
                 return `
                   <td class="check-col">
                      <div class="wwi-min-sek">
                        <div class="ms-header"><span>${t(window.appState, "scorecard_print.min")}</span><span>${t(window.appState, "scorecard_print.sec")}</span></div>
                        <div class="ms-boxes">
                          <div class="ms-box">${min}</div>
                          <div class="ms-box">${sek}</div>
                        </div>
                      </div>
                   </td>
                 `;
              }).join("")}
            </tr>
            <tr>
              <td class="row-label">${t(window.appState, "scorecard_print.cuts")}</td>
              ${stages.map(stage => {
                 const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                 const hasData = round && roundHasData(round);
                 const cuts = hasData ? (round.cuts || 0) : "";
                 return `
                   <td class="check-col">
                      <div class="wwi-cuts">
                        <div class="cuts-header">nr 0,1,1,1,1</div>
                        <div class="cuts-boxes">
                          <div class="cuts-box">${cuts}</div>
                          <div class="cuts-box empty"></div>
                        </div>
                      </div>
                   </td>
                 `;
              }).join("")}
            </tr>
            <tr>
              <td class="row-label">${t(window.appState, "scorecard_print.ground_targets")}</td>
              ${stages.map(stage => {
                 const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                 const hasData = round && roundHasData(round);
                 const targets = hasData ? (round.groundTargets || 0) : "";
                 return `
                   <td class="check-col">
                      <div class="wwi-cuts">
                        <div class="cuts-header">${t(window.appState, "scorecard_print.pcs")}</div>
                        <div class="cuts-boxes">
                          <div class="cuts-box">${targets}</div>
                          <div class="cuts-box empty"></div>
                        </div>
                      </div>
                   </td>
                 `;
              }).join("")}
            </tr>

            <!-- SÄÄNNÖT / PENALTIES -->
            <tr><td colspan="5" style="height: 10px;"></td></tr>
            ${[
              { label: t(window.appState, "scorecard_print.takeoff"), key: "takeoff" },
              { label: t(window.appState, "scorecard_print.hasenfuss"), key: "hasenfuss" },
              { label: t(window.appState, "scorecard_print.safety_line"), key: "safetylineOverflown" },
              { label: t(window.appState, "scorecard_print.streamer_ok"), key: "streamerOk" },
              { label: t(window.appState, "scorecard_print.landing_mark"), key: "landingAfterEndSignal" }
            ].map(item => `
              <tr>
                <td class="row-label">${item.label}</td>
                ${stages.map(stage => {
                   const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                   const val = round && roundHasData(round) ? round[item.key] : undefined;
                   const isYes = val === true;
                   const isNo = val === false;
                   return `
                     <td class="check-col">
                        <div class="wwi-ja-nein">
                          <div class="jn-header"><span>kyllä</span><span>ei</span></div>
                          <div class="jn-boxes">
                            <div class="jn-box ${isYes ? 'checked' : ''}">${isYes ? 'X' : ''}</div>
                            <div class="jn-box ${isNo ? 'checked' : ''}">${isNo ? 'X' : ''}</div>
                          </div>
                        </div>
                     </td>
                   `;
                }).join("")}
              </tr>
            `).join("")}

            <!-- SUMMA -->
            <tr class="wwi-sum-row">
              <td class="sum-label" style="font-size: 1.1rem;"><strong>${t(window.appState, "scorecard_print.sum")}</strong></td>
              ${stages.map(stage => {
                const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
                const val = roundScore ? roundScore.total : "";
                return `<td class="check-col"><div class="wwi-points-box yellow-box sum" style="width: 100%;">${val}</div></td>`;
              }).join("")}
            </tr>

            <!-- FOOTER INFO -->
            <tr><td colspan="5" style="height: 15px;"></td></tr>
            ${[
              { label: t(window.appState, "scorecard_print.model"), key: "modelName" },
              { label: t(window.appState, "scorecard_print.motor_battery"), key: "motorOrBattery" },
              { label: t(window.appState, "scorecard_print.pilot_signature"), key: "pilotSignature", isImage: true },
              { label: t(window.appState, "scorecard_print.judge_signature"), key: "judgeSignature", isImage: true }
            ].map(item => `
              <tr class="wwi-footer-row">
                <td class="row-label">${item.label}</td>
                ${stages.map(stage => {
                  let val = "";
                  if (item.isImage) {
                    const roundData = card.rounds?.find(r => r.roundNumber === stage.roundNumber);
                    val = roundData?.signatures?.[item.key] || card.signatures?.[item.key] || "";
                    if (val && val.startsWith('data:image')) {
                      return `<td class="check-col"><img src="${val}" class="wwi-print-sig"></td>`;
                    }
                  } else {
                    if (item.key === "modelName") val = (card.aircraft || viewRow.aircraft || {}).modelName || "";
                    if (item.key === "motorOrBattery") {
                      const sourceAircraft = card.aircraft || viewRow.aircraft || {};
                      const m = sourceAircraft.motorOrBattery || "";
                      const p = sourceAircraft.propeller || "";
                      val = (m || p) ? `${m} - ${p}` : "";
                    }
                  }
                  return `<td class="check-col"><div class="wwi-line">${escapeHtml(val)}</div></td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>

      </div>
    </div>
  `;
}
