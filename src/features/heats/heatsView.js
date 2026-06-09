import { escapeHtml, getActiveEvent, getAircraftName, getPilotName } from "../../utils/html.js";
import { isAdmin } from "../../users/roles.js";
import { detectFrequencyConflicts } from "../../logic/heatBuilder.js";
import { getHeatPhase, getPhaseLabel } from "../../logic/competitionFormat.js";
import { UI } from "../../ui/engine.js";
import { getRouteParam } from "../../router.js";
import { calculateScoreCardRound, roundHasData } from "../../logic/scoreCards.js";
import { t } from "../../utils/i18n.js";

export function renderHeatsView(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.Panel({ title: t(state, "heats.no_active_event") }, `<p>${t(state, "heats.open_from_calendar")}</p>`);
  }

  const admin = isAdmin(state);
  const entries = state.entries.filter((entry) => entry.eventId === activeEvent.id);
  const heats = state.heats.filter((heat) => heat.eventId === activeEvent.id);

  // Group heats by class
  const heatsByClass = new Map();
  heats.forEach((heat) => {
    const className = heat.className || t(state, "heats.general_class");
    if (!heatsByClass.has(className)) heatsByClass.set(className, []);
    heatsByClass.get(className).push(heat);
  });

  // Check if we want to show only a specific class
  const targetClass = getRouteParam();

  if (targetClass && heatsByClass.has(targetClass)) {
    const onlyClassHeats = heatsByClass.get(targetClass);
    heatsByClass.clear();
    heatsByClass.set(targetClass, onlyClassHeats);
  }

  const heatsHtml = heats.length 
    ? Array.from(heatsByClass.entries()).map(([className, classHeats]) => renderClassHeatSection(state, activeEvent, entries, className, classHeats, admin)).join("")
    : UI.Panel({
        title: admin ? t(state, "heats.admin_no_heats") : t(state, "heats.public_no_heats"),
        style: "grid-column: 1 / -1;"
      }, `<p>${admin ? t(state, "heats.admin_no_heats_msg") : t(state, "heats.public_no_heats_msg")}</p>`);

  const hasTargetClassHeats = targetClass && state.heats.some(h => h.eventId === activeEvent.id && h.className === targetClass);

  const generateButton = admin
    ? (targetClass
      ? UI.Flex({ gap: "10px" }, `
          ${UI.Button({
            label: t(state, "heats.generate_next_phase").replace("{class}", targetClass),
            action: "generate-class-heats",
            class: targetClass,
            variant: "primary"
          })}
          ${hasTargetClassHeats ? UI.Button({
            label: t(state, "heats.cancel_draw"),
            action: "cancel-class-heats",
            class: targetClass,
            variant: "danger dashed"
          }) : ""}
        `)
      : `<a class="button primary" href="#/entries">${t(state, "heats.generate_in_workspace")}</a>`)
    : "";

  const scoreCardsHref = admin
    ? `#/scorecards${targetClass ? `/${encodeURIComponent(targetClass)}` : ""}`
    : "#/results";

  const headerActions = `
    ${generateButton}
    <a class="button" href="${scoreCardsHref}">${admin ? t(state, "heats.enter_results") : t(state, "heats.competition_results")}</a>
  `;

  const visibleEntries = targetClass
    ? entries.filter((entry) => entry.className === targetClass)
    : entries;
  const visibleHeatCount = Array.from(heatsByClass.values()).reduce((sum, classHeats) => sum + classHeats.length, 0);

  const pageHeader = UI.PageHeader({
    kicker: activeEvent.name,
    title: admin ? (targetClass ? `${targetClass} ${t(state, "heats.admin_title")}` : t(state, "heats.admin_title")) : t(state, "heats.public_title"),
    subtitle: admin
      ? `${t(state, "heats.group_size")} ${activeEvent.rules.maxAircraftPerHeat} ${t(state, "heats.aircraft_count")} · ${visibleEntries.length} ${t(state, "heats.participant_count")} · ${visibleHeatCount} ${t(state, "heats.heat_count")}`
      : `${visibleHeatCount} ${t(state, "heats.heat_count")}`,
    headerActions: UI.Flex({ gap: "10px" }, headerActions)
  });

  return `
    ${pageHeader}
    ${UI.Grid({ className: "heat-grid", style: "margin-top: 18px;" }, heatsHtml)}
  `;
}

export function renderClassHeatSection(state, activeEvent, entries, className, classHeats, admin) {
  const phases = ["qualifying", "semifinal", "final"];
  return `
    <div class="heat-section-title">
      <h4>${escapeHtml(className)} ${t(state, "heats.heats_suffix")}</h4>
    </div>
    ${phases.map((phase) => {
      const phaseHeats = classHeats.filter((heat) => getHeatPhase(heat) === phase);
      if (!phaseHeats.length) return "";
      return `
        <div class="heat-phase-title">
          <span>${escapeHtml(getPhaseLabel(phase, state))}</span>
          <strong>${phaseHeats.length} ${t(state, "heats.heat_count")}</strong>
        </div>
        ${phaseHeats.map((heat) => renderHeatCard(state, activeEvent, entries, heat, admin)).join("")}
      `;
    }).join("")}
  `;
}

export function renderHeatCard(state, activeEvent, entries, heat, admin, highlightPilotId = null) {
  const conflicts = detectFrequencyConflicts(state, heat.entryIds);

  const header = `
    <div class="panel-header compact">
      <div>
        <p class="kicker">${escapeHtml(getPhaseLabel(getHeatPhase(heat), state))} · ${t(state, "heats.round")} ${heat.round}</p>
        <h3>${t(state, "heats.heat")} ${escapeHtml(heat.groupName)}</h3>
      </div>
      ${UI.Badge({ label: heat.status, variant: heat.status })}
    </div>
  `;

  const list = `
    <ol class="pilot-list">
      ${heat.entryIds.map((entryId) => renderHeatPilotRow(state, activeEvent, heat, entries.find((item) => item.id === entryId), conflicts.has(entryId), admin, highlightPilotId)).join("")}
    </ol>
  `;

  return `
    <article class="panel heat-card">
      ${header}
      ${list}
    </article>
  `;
}

function renderHeatPilotRow(state, activeEvent, heat, entry, hasConflict, admin, highlightPilotId = null) {
  if (!entry) return "";
  const raceNumber = entry.raceNumber ? `#${escapeHtml(entry.raceNumber)} · ` : "";
  const card = (state.scoreCards || []).find((c) => c.entryId === entry.id);
  const freq = card?.frequency || "2.4 GHz";
  const pilot = state.pilots.find(p => p.id === entry.pilotId);

  const conflictBadge = hasConflict
    ? ` ${UI.Badge({ label: `${t(state, "heats.conflict")} ${freq}`, variant: "rejected", style: "padding: 2px 6px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 2px; min-height: auto;" })}`
    : "";

  const avatarHtml = pilot && (pilot.avatarData || pilot.avatarUrl) ?
    `<div style="width: 24px; height: 24px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 1px solid var(--border); display: inline-block; vertical-align: middle; margin-right: 8px;"></div>` : "";

  const isHighlighted = highlightPilotId && pilot && pilot.id === highlightPilotId;
  const pilotNameHtml = isHighlighted 
    ? `<strong style="color: var(--text-color); background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px;">${escapeHtml(getPilotName(state, entry.pilotId))}</strong>`
    : `<strong>${escapeHtml(getPilotName(state, entry.pilotId))}</strong>`;

  let scoreHtml = "";
  if (card && card.rounds && activeEvent && heat) {
    const roundData = card.rounds.find(r => r.roundNumber === heat.round);
    if (roundData && roundHasData(roundData)) {
      const score = calculateScoreCardRound(roundData, activeEvent, card.templateId);
      scoreHtml = `
        <div style="text-align: right; margin-left: 15px; min-width: 60px;">
          <strong style="color: var(--primary); font-size: 1.1rem;">${score.total} p</strong>
          ${roundData.cuts > 0 ? `<div class="muted" style="font-size: 0.8rem;">${roundData.cuts} ${t(state, "heats.cuts_lower")}</div>` : ''}
        </div>
      `;
    }
  }

  return `
    <li style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
      <div style="display: flex; align-items: center; flex: 1;">
        ${avatarHtml}
        <div style="display: flex; flex-direction: column;">
          <div>${raceNumber}${pilotNameHtml}${conflictBadge}</div>
          <span class="muted" style="font-size: 0.85rem;">${admin ? `${escapeHtml(entry.className)} · ${escapeHtml(getAircraftName(state, entry.aircraftId))} (${escapeHtml(freq)})` : `${escapeHtml(entry.className)} (${escapeHtml(freq)})`}</span>
        </div>
      </div>
      ${scoreHtml}
    </li>
  `;
}
