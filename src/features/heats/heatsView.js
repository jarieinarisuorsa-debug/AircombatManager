import { escapeHtml, getActiveEvent, getAircraftName, getPilotName } from "../../utils/html.js";
import { isAdmin } from "../../users/roles.js";
import { detectFrequencyConflicts } from "../../logic/heatBuilder.js";
import { getHeatPhase, getPhaseLabel } from "../../logic/competitionFormat.js";
import { UI } from "../../ui/engine.js";
import { getRouteParam } from "../../router.js";
import { formatHeatTitle } from "../../logic/competitionFormat.js";
import { calculateScoreCardRound, roundHasData, getScoreCardStructureStages } from "../../logic/scoreCards.js";
import { calculateResultScore } from "../../logic/scoring.js";
import { t } from "../../utils/i18n.js";
import { isDemo } from "../../state/store.js";

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

  const enterResultsButton = admin
    ? `<button type="button" class="button outline" data-action="set-workspace-tab" data-tab="tuloskortit" data-redirect="#/entries">${t(state, "heats.enter_results")}</button>`
    : `<a class="button" href="#/results">${t(state, "heats.competition_results")}</a>`;

  const headerActions = `
    ${generateButton}
    ${enterResultsButton}
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
    <style>
      .topbar, .sidebar { display: none !important; }
      .app-shell { display: block !important; }
      .content { padding: 20px !important; margin: 0 !important; max-width: 100% !important; }
      
      @media print {
        .heats-back-button { display: none !important; }
        .heat-card, .heat-round-details {
          border: 1px solid #4a5c70 !important;
          box-shadow: none !important;
        }
        .heat-card table {
          border: 1px solid #4a5c70 !important;
        }
        .heat-card tr {
          border-bottom: 1px solid #4a5c70 !important;
        }
        .heat-card th, .heat-card td {
          border-color: #4a5c70 !important;
        }
      }
    </style>
    <div class="heats-back-button" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <a href="javascript:history.back()" class="button outline">← Takaisin</a>
      <button type="button" class="button primary" onclick="window.print()">🖨️ ${t(state, "common.print") || "Tulosta"}</button>
    </div>
    <div style="margin-top: 18px;">
      ${heatsHtml}
    </div>
  `;
}

export function renderClassHeatSection(state, activeEvent, entries, className, classHeats, admin, mode = "heats") {
  const phases = ["qualifying", "semifinal", "final"];
  
  // Etsitään absoluuttisesti viimeisin arvottu vaihe ja kierros koko luokassa
  let globalLatestPhase = "";
  let globalLatestRound = 0;
  for (let i = phases.length - 1; i >= 0; i--) {
    const p = phases[i];
    const pHeats = classHeats.filter(h => getHeatPhase(h) === p);
    if (pHeats.length > 0) {
      globalLatestPhase = p;
      globalLatestRound = Math.max(...pHeats.map(h => h.round));
      break;
    }
  }

  return `
    ${phases.map((phase) => {
      const phaseHeats = classHeats.filter((heat) => getHeatPhase(heat) === phase);
      if (!phaseHeats.length) return "";

      const isOpen = (phase === globalLatestPhase) ? "open" : "";
      const label = escapeHtml(getPhaseLabel(phase, state));
      const sectionEntries = entries.filter(e => e.className === className);
      
      const latestRoundInPhase = Math.max(...phaseHeats.map(h => h.round));
      const latestRoundHeats = phaseHeats.filter(h => h.round === latestRoundInPhase);

      return `
        <details class="heat-round-details" ${isOpen} style="margin-bottom: 15px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--panel);">
          <summary style="padding: 14px 20px; background: rgba(0, 0, 0, 0.2); cursor: pointer; display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px;">
              ${activeEvent && activeEvent.name ? `<span style="font-weight: bold; color: var(--primary); font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(activeEvent.name)}</span>` : `<span style="font-weight: bold; color: var(--primary); font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;">${label}</span>`}
              ${activeEvent && activeEvent.location ? `<span style="color: var(--muted); font-size: 0.9rem;">${escapeHtml(activeEvent.location)}</span>` : ""}
            </div>
          </summary>
          <div style="padding: 15px;">
            <div class="heat-grid">
              ${latestRoundHeats.map(h => renderHeatCard(state, activeEvent, entries, h, admin, null, mode)).join("")}
            </div>
          </div>
        </details>
      `;
    }).join("")}
  `;
}

export function renderHeatCard(state, activeEvent, entries, heat, admin, highlightPilotId = null, mode = "heats") {
  const conflicts = detectFrequencyConflicts(state, heat.entryIds);

  const header = `
    <div class="panel-header compact" style="margin-bottom: 10px;">
      <div style="min-width: 0;">
        <p class="kicker" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(getPhaseLabel(getHeatPhase(heat), state))} · ${t(state, "heats.round")} ${heat.round}
        </p>
        <h3 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(formatHeatTitle(heat, state))}</h3>
      </div>
    </div>
  `;

  const list = `
    <div style="overflow-x: auto; margin-top: -10px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; border: 1px solid var(--border);">
        <thead>
          <tr style="border-bottom: 1px solid var(--border); color: var(--muted); font-size: 0.8rem; text-transform: uppercase;">
            <th style="padding: 8px 4px; width: 40px;">#</th>
            <th style="padding: 8px 4px; width: 32px;"></th>
            <th style="padding: 8px 4px; width: 120px;">${t(state, "heats.col_country_club")}</th>
            <th style="padding: 8px 4px;">${t(state, "heats.col_pilot")}</th>
            <th style="padding: 8px 4px;">${t(state, "heats.col_aircraft")}</th>
            <th style="padding: 8px 4px; width: 80px;">${t(state, "heats.col_frequency")}</th>
            <th style="padding: 8px 4px; text-align: right; width: 80px;"></th>
          </tr>
        </thead>
        <tbody>
          ${heat.entryIds.map((entryId) => renderHeatPilotRow(state, activeEvent, heat, entries.find((item) => item.id === entryId), conflicts.has(entryId), admin, highlightPilotId, mode)).join("")}
        </tbody>
      </table>
    </div>
  `;

  return `
    <article class="panel heat-card" style="flex: 1 1 300px; max-width: 100%; min-width: 0; padding: 14px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 12px; background: var(--panel);">
      ${header}
      <div style="flex: 1;">${list}</div>
    </article>
  `;
}

function renderHeatPilotRow(state, activeEvent, heat, entry, hasConflict, admin, highlightPilotId = null, mode = "heats") {
  if (!entry) return "";
  const raceNumber = entry.raceNumber ? `#${escapeHtml(entry.raceNumber)}` : "";
  const card = (state.scoreCards || []).find((c) => c.entryId === entry.id);
  const freq = card?.frequency || "2.4 GHz";
  const pilot = state.pilots.find(p => p.id === entry.pilotId);

  const conflictBadge = hasConflict
    ? ` ${UI.Badge({ label: `${t(state, "heats.conflict")} ${freq}`, variant: "rejected", style: "padding: 2px 6px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 2px; min-height: auto;" })}`
    : "";

  const avatarUrl = pilot && ((pilot.avatarData || "").trim() || (pilot.avatarUrl || "").trim());
  const avatarHtml = avatarUrl ?
    `<div style="width: 24px; height: 24px; border-radius: 50%; background-image: url('${escapeHtml(avatarUrl)}'); background-size: cover; background-position: center; border: 1px solid var(--border);"></div>` : "";

  const countryHtml = pilot && pilot.country ? UI.CountryFlag(pilot.country) : "";
  const clubHtml = pilot && pilot.club ? `<span style="font-size: 0.8rem; margin-left: 4px; color: var(--muted);">${escapeHtml(pilot.club)}</span>` : "";

  const isHighlighted = highlightPilotId && pilot && pilot.id === highlightPilotId;
  const pilotNameHtml = isHighlighted 
    ? `<strong style="color: var(--text-color); background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px;">${escapeHtml(getPilotName(state, entry.pilotId))}</strong>`
    : `<strong>${escapeHtml(getPilotName(state, entry.pilotId))}</strong>`;

  let scoreHtml = "";
  if (card && card.rounds && activeEvent && heat) {
    const stages = getScoreCardStructureStages({ card, event: activeEvent, entry });
    const stage = stages.find(s => s.heatPhase === getHeatPhase(heat) && Number(s.heatRound) === Number(heat.round));
    const roundData = stage ? card.rounds.find(r => Number(r.roundNumber) === Number(stage.roundNumber)) : null;

    if (roundData && roundHasData(roundData)) {
      const score = calculateScoreCardRound(roundData, activeEvent, card.templateId);
      scoreHtml = `
        <div style="text-align: right; min-width: 45px; flex-shrink: 0;">
          <strong style="color: var(--primary); font-size: 1.1rem;">${score.total} p</strong>
          ${roundData.cuts > 0 ? `<div class="muted" style="font-size: 0.8rem; white-space: nowrap;">${roundData.cuts} ${t(state, "heats.cuts_lower")}</div>` : ''}
        </div>
      `;
    }
  }
  
  if (!scoreHtml && state.results) {
    const result = state.results.find(r => r.heatId === heat.id && r.entryId === entry.id);
    if (result) {
      const totalScore = calculateResultScore(result, activeEvent.rules).total;
      scoreHtml = `
        <div style="text-align: right; min-width: 45px; flex-shrink: 0;">
          <strong style="color: var(--primary); font-size: 1.1rem;">${totalScore} p</strong>
          ${result.cuts > 0 ? `<div class="muted" style="font-size: 0.8rem; white-space: nowrap;">${result.cuts} ${t(state, "heats.cuts_lower")}</div>` : ''}
        </div>
      `;
    }
  }

  return `
    <tr style="border-bottom: 1px solid var(--border);">
      <td style="padding: 10px 4px; color: var(--muted); font-weight: 500;">${raceNumber.replace(" · ", "")}</td>
      <td style="padding: 10px 4px; width: 32px; text-align: center;">${avatarHtml}</td>
      <td style="padding: 10px 4px; width: 120px; text-align: left;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 1.2rem;">${countryHtml}</span>
          ${clubHtml}
        </div>
      </td>
      <td style="padding: 10px 4px;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>${pilotNameHtml} ${conflictBadge}</span>
        </div>
      </td>
      <td style="padding: 10px 4px; color: var(--muted);">${escapeHtml(getAircraftName(state, entry.aircraftId)) || "-"}</td>
      <td style="padding: 10px 4px; color: var(--muted);">${escapeHtml(freq)}</td>
      <td style="padding: 10px 4px; text-align: right;">
        ${scoreHtml}
        ${!scoreHtml && mode === 'scorecards' ? `
          <a class="button small primary" href="#/scorecard/${escapeHtml(entry.id)}?back=entries">${t(state, "scorecards_list.open_card")}</a>
        ` : ''}
        ${mode === 'scorecards' && scoreHtml ? `
          <div style="display: flex; flex-direction: column; align-items: flex-end; margin-top: 4px;">
            <a class="button small" href="#/scorecard/${escapeHtml(entry.id)}?back=entries">${t(state, "common.edit")}</a>
          </div>
        ` : ''}
      </td>
    </tr>
  `;
}
