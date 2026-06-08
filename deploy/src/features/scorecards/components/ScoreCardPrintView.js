import { escapeHtml } from "../../../utils/html.js";
import { getScoreCardRules, SCORE_CARD_TEMPLATE_WWI, SCORE_CARD_TEMPLATES, calculateModelPoints } from "../../../logic/scoreCards.js";

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

  return `
    <div class="scorecard-print-view matrix-layout">
      
      <!-- HEADER -->
      <div class="matrix-header">
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

      <!-- MAIN MATRIX -->
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="col-label" style="font-size: 0.7rem; font-weight: normal; text-align: left; vertical-align: top;">
              Kirjaa starttipaikka /<br>tuomari
            </th>
            ${stages.map(stage => `
              <th class="col-round">
                <div class="round-header">
                  <span>${escapeHtml(stage.label)}</span>
                  <div class="print-box grey-box"></div>
                </div>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${isWWI ? renderMatrixBooleanRow("Nosto (Takeoff)", stages, card, totals, "takeoff", "takeoffPoints") : ""}
          ${renderMatrixFlightTimeRow("Lentoaika", stages, card, totals)}
          ${renderMatrixNumberRow("Leikkaukset (Cuts)", stages, card, totals, "cuts", "cutPoints")}
          ${isWWI ? renderMatrixNumberRow("Maamaalit (Ground)", stages, card, totals, "groundTargets", "groundTargetPoints") : ""}
          ${renderMatrixBooleanRow("Streamer ehjä", stages, card, totals, "streamerOk", "streamerOkPoints")}
          ${renderMatrixBooleanRow("Pakoilu (Hasenfuss)", stages, card, totals, "hasenfuss", "hasenfussPenalty", true)}
          ${renderMatrixBooleanRow("Turvaraja (Safetyline)", stages, card, totals, "safetylineOverflown", "safetylinePenalty", true)}
          ${isWWI ? renderMatrixBooleanRow("Laskeutuminen merkistä", stages, card, totals, "landingAfterEndSignal", "landingAfterEndSignalPoints") : ""}
          
          <tr class="row-summe">
            <td><strong>Summa</strong></td>
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
          ${isWWI ? renderMatrixTextLineRow("Mallipisteet", stages, card, "modelPoints", "kpl") : renderMatrixBooleanRow("2,5-luokka", stages, card, totals, "dummy", "dummy")}
          ${renderMatrixTextLineRow("Malli", stages, card, "modelName")}
          ${renderMatrixTextLineRow("Moottori / Akku", stages, card, "motorOrBattery")}
          ${renderMatrixTextLineRow("Potkuri", stages, card, "propeller")}
          ${renderMatrixTextLineRow("Kierrosluku / RPM", stages, card, "rpm")}
          ${renderMatrixSignatureRow("Pilotin allekirjoitus", stages, card, "pilotSignature")}
          ${renderMatrixSignatureRow("Tuomarin allekirjoitus", stages, card, "judgeSignature")}

        </tbody>
      </table>

      <!-- BOTTOM BAR: TOTALS & WARNINGS -->
      <div class="print-bottom-bar">
        <div class="warnings-box horizontal-warnings">
          <strong>Huomioitavaa:</strong><br>
          <span class="red-text">Ota aina eri starttipaikka!</span> &nbsp;|&nbsp;
          <span class="red-text">Ota aina eri tuomari!</span> &nbsp;|&nbsp;
          <span class="red-text">Kirjoita selkeästi!</span>
        </div>
        
        <div class="final-totals-box">
          <div class="total-field">
            <span class="label">Kokonaispisteet:</span>
            <div class="print-box yellow-box huge-yellow">${totals?.totalPoints !== undefined && totals.totalPoints !== "" ? totals.totalPoints : ""}</div>
          </div>
          <div class="total-field">
            <span class="label">Sijoitus:</span>
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
        const hasData = round && (round.flightMinutes > 0 || round.flightSeconds > 0 || round.cuts > 0 || round.takeoff);
        const min = hasData ? (round.flightMinutes || 0) : "";
        const sek = hasData ? (round.flightSeconds || 0) : "";
        
        return `
          <td>
            <div class="print-input-group">
              <div class="print-labels" style="width: 100px;">
                <span style="flex:1;">Min</span>
                <span style="flex:1;">sek</span>
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
        const hasData = round && (round[field] > 0 || round.flightSeconds > 0 || round.takeoff);
        const val = hasData ? (round[field] || 0) : "";
        
        return `
          <td>
            <div class="print-input-group">
              <div class="print-labels" style="width: 100%;">
                <span>Kpl</span>
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
            if (round && (round.flightSeconds > 0 || round.cuts > 0 || round[field] !== undefined || round.takeoff)) {
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
                <span style="flex:1;">kyllä</span>
                <span style="flex:1;">ei</span>
              </div>
            </div>
          </td>
        `;
      }).join("")}
    </tr>
  `;
}

function renderMatrixTextLineRow(label, stages, card, infoField, unit = "") {
  return `
    <tr class="matrix-text-row">
      <td>${label}</td>
      ${stages.map(stage => {
        // If we want to populate filled cards with the info across rounds, we can just take the first round info for now, 
        // or leave them blank for paper print.
        let val = "";
        if (infoField === "modelName" && card.aircraft?.modelName) val = card.aircraft.modelName;
        if (infoField === "motorOrBattery" && card.aircraft?.motorOrBattery) val = card.aircraft.motorOrBattery;
        if (infoField === "propeller" && card.aircraft?.propeller) val = card.aircraft.propeller;
        if (infoField === "rpm" && card.aircraft?.rpm) val = card.aircraft.rpm;
        
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

  return `
    <div class="scorecard-print-view wwi-matrix-layout">
      
      <!-- HEADER -->
      <div class="matrix-header" style="margin-bottom: 10px;">
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

      <div class="wwi-main-layout">
        <!-- LEFT TABLE -->
        <table class="wwi-matrix-table" style="width: 100%;">
          <thead>
            <tr>
              <th style="width: 25%;"></th>
              ${stages.map(stage => `
                <th style="width: 18%; text-align: left;"><strong>${escapeHtml(stage.label)}</strong></th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            
            <!-- MODELLPUNKTE -->
            <tr><td colspan="5" class="section-title"><strong>Mallipisteet</strong></td></tr>
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
                  const hasModelPoints = round && Object.keys(round.modelPoints || {}).length > 0;
                  const pts = hasModelPoints ? calculateModelPoints(round, getScoreCardRules(activeEvent)) : "";
                  return `<td class="check-col"><div class="wwi-points-box yellow-box ${hasModelPoints ? '' : 'empty'}">${pts}</div></td>`;
              }).join("")}
            </tr>

            <!-- FLUGPUNKTE -->
            <tr><td colspan="5" class="section-title" style="padding-top: 15px;"><strong>Lentopisteet</strong></td></tr>
            <tr>
              <td class="row-label">Lentoaika (3 sek = 1P, max 138 P)</td>
              ${stages.map(stage => {
                 const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                 const hasData = round && (round.flightMinutes > 0 || round.flightSeconds > 0 || round.cuts > 0);
                 const min = hasData ? (round.flightMinutes || 0) : "";
                 const sek = hasData ? (round.flightSeconds || 0) : "";
                 return `
                   <td class="check-col">
                      <div class="wwi-min-sek">
                        <div class="ms-header"><span>Min</span><span>sek</span></div>
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
              <td class="row-label">Cuts (100 P)</td>
              ${stages.map(stage => {
                 const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                 const hasData = round && (round.cuts > 0 || round.flightSeconds > 0);
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
              <td class="row-label">Maamaalit (50 P)</td>
              ${stages.map(stage => {
                 const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                 const hasData = round && round.groundTargets > 0;
                 const targets = hasData ? (round.groundTargets || 0) : "";
                 return `
                   <td class="check-col">
                      <div class="wwi-cuts">
                        <div class="cuts-header">kpl</div>
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
              { label: "Nosto (50 P)", key: "takeoff" },
              { label: "Pakoilu (-50 P)", key: "hasenfuss" },
              { label: "Turvaraja (-200 P)", key: "safetylineOverflown" },
              { label: "Streamer ehjä (50 P)", key: "streamerOk" },
              { label: "Laskeutuminen merkistä (50 P)", key: "landingAfterEndSignal" }
            ].map(item => `
              <tr>
                <td class="row-label">${item.label}</td>
                ${stages.map(stage => {
                   const round = card.rounds?.find(r => Number(r.roundNumber) === stage.roundNumber);
                   const val = round?.[item.key];
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
              <td class="sum-label" style="font-size: 1.1rem;"><strong>Summa</strong></td>
              ${stages.map(stage => {
                const roundScore = totals?.roundScores?.find(rs => rs.roundNumber === stage.roundNumber)?.score;
                const val = roundScore ? roundScore.total : "";
                return `<td class="check-col"><div class="wwi-points-box yellow-box sum" style="width: 100%;">${val}</div></td>`;
              }).join("")}
            </tr>

            <!-- FOOTER INFO -->
            <tr><td colspan="5" style="height: 15px;"></td></tr>
            ${[
              { label: "Mallin nimi", key: "modelName" },
              { label: "Moottori - Potkuri", key: "motorOrBattery" },
              { label: "Pilotin allekirjoitus", key: "pilotSignature", isImage: true },
              { label: "Tuomarin allekirjoitus", key: "judgeSignature", isImage: true }
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
                    if (item.key === "modelName") val = card.aircraft?.modelName || "";
                    if (item.key === "motorOrBattery") {
                      const m = card.aircraft?.motorOrBattery || "";
                      const p = card.aircraft?.propeller || "";
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
