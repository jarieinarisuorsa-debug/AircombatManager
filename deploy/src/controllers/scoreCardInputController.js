// ==============================
// Aircombat Competition Manager
// src/controllers/scoreCardInputController.js
// Päivitetty: 2026-06-04
// ==============================
// Tuloskortin live-laskennan DOM-päivitys.
// ==============================

import { calculateScoreCardRound, getScoreCardTemplate, isRoundDirty, getRoundStatusInfo } from "../logic/scoreCards.js";
import { getState } from "../state/store.js";
import { updateOutput } from "../ui/domHelpers.js";
import { formatDuration, readNumber, readYesNo } from "../utils/formValues.js";
import { getActiveEvent } from "../utils/html.js";

export function handleScoreCardInput(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const activeEvent = getActiveEvent(getState());
  if (!activeEvent) return;

  const templateId = String(data.templateId || "standard");
  const template = getScoreCardTemplate(templateId);

  let totalPoints = 0;
  let totalCuts = 0;
  let totalFlightSeconds = 0;

  template.rounds.forEach((roundNumber) => {
    const round = {
      roundNumber,
      templateId,
      takeoff: readYesNo(data[`r${roundNumber}_takeoff`]),
      flightMinutes: readNumber(data[`r${roundNumber}_flightMinutes`], 0, 99),
      flightSeconds: readNumber(data[`r${roundNumber}_flightSeconds`], 0, 59),
      cuts: readNumber(data[`r${roundNumber}_cuts`], 0, 99),
      groundTargets: readNumber(data[`r${roundNumber}_groundTargets`], 0, 99),
      streamerOk: readYesNo(data[`r${roundNumber}_streamerOk`]),
      hasenfuss: readYesNo(data[`r${roundNumber}_hasenfuss`]),
      safetylineOverflown: readYesNo(data[`r${roundNumber}_safetylineOverflown`]),
      landingAfterEndSignal: readYesNo(data[`r${roundNumber}_landingAfterEndSignal`])
    };

    if (template.modelPointItems) {
      round.modelPoints = Object.fromEntries(template.modelPointItems.map((item) => [
        item.key,
        readYesNo(data[`r${roundNumber}_model_${item.key}`])
      ]));
    }

    const score = calculateScoreCardRound(round, activeEvent, templateId);
    totalPoints += score.total;
    totalCuts += round.cuts;
    totalFlightSeconds += score.flightSeconds;

    const totalDisplay = form.querySelector(`[name="r${roundNumber}_total_display"]`);
    if (totalDisplay) totalDisplay.textContent = score.total;

    const totalInput = form.querySelector(`input[name="r${roundNumber}_total"]`);
    if (totalInput) totalInput.value = score.total;

    updateOutput(form, `r${roundNumber}_flight_points`, score.flightPoints);
    updateOutput(form, `r${roundNumber}_cuts_points`, score.cutPoints);
    updateOutput(form, `r${roundNumber}_streamerOk_points`, score.streamerOkPoints ? `+${score.streamerOkPoints}` : "0");
    updateOutput(form, `r${roundNumber}_hasenfuss_points`, score.hasenfussPenalty ? `-${score.hasenfussPenalty}` : "0");
    updateOutput(form, `r${roundNumber}_safetylineOverflown_points`, score.safetylinePenalty ? `-${score.safetylinePenalty}` : "0");

    if (templateId === "wwi") {
      updateOutput(form, `r${roundNumber}_takeoff_points`, score.takeoffPoints ? `+${score.takeoffPoints}` : "0");
      updateOutput(form, `r${roundNumber}_groundTargets_points`, score.groundTargetPoints);
      updateOutput(form, `r${roundNumber}_landingAfterEndSignal_points`, score.landingAfterEndSignalPoints ? `+${score.landingAfterEndSignalPoints}` : "0");

      template.modelPointItems.forEach((item) => {
        const value = round.modelPoints[item.key] ? `+${item.points}` : "0";
        updateOutput(form, `r${roundNumber}_model_${item.key}_points`, value);
      });
    }

    const sideRoundDisplay = form.querySelector(`[name="wwi_side_r${roundNumber}_display"]`);
    if (sideRoundDisplay) sideRoundDisplay.textContent = score.total;

    const entryIdInput = form.querySelector('input[name="entryId"]');
    const entryId = entryIdInput ? entryIdInput.value : null;
    const existingCard = getState().scoreCards?.find(c => c.eventId === activeEvent.id && c.entryId === entryId);
    const existingRound = existingCard?.rounds?.find(r => r.roundNumber === roundNumber);
    const dirty = isRoundDirty(round, existingRound);
    
    const details = form.querySelector(`details[data-round="${roundNumber}"]`);
    if (details) {
      const statusInfo = getRoundStatusInfo(round, activeEvent, dirty);
      details.className = `mobile-round-card status-${statusInfo.class}`;
      const badge = details.querySelector(".round-badge");
      if (badge) {
        badge.className = `round-badge badge-${statusInfo.class}`;
        const iconSpan = badge.querySelector(".status-icon");
        const labelSpan = badge.querySelector(".status-label");
        if (iconSpan) iconSpan.textContent = statusInfo.icon;
        if (labelSpan) labelSpan.textContent = statusInfo.label;
      }
    }
  });

  const finalSumDisplay = form.querySelector(`[name="final_sum_display"]`);
  if (finalSumDisplay) finalSumDisplay.textContent = totalPoints;

  const sideTotalDisplay = form.querySelector(`[name="wwi_side_total_display"]`);
  if (sideTotalDisplay) sideTotalDisplay.textContent = totalPoints;

  const headerStatsDesc = form.querySelector(".score-card-toolbar .muted");
  if (headerStatsDesc) {
    const formattedTime = formatDuration(totalFlightSeconds);
    const parts = headerStatsDesc.textContent.split(" · ");
    const aircraftName = parts[0];
    headerStatsDesc.textContent = `${aircraftName} · ${totalPoints} p · ${totalCuts} cuts · ${formattedTime}`;
  }
}
