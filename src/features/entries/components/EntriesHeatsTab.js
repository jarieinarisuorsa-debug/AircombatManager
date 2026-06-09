import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { getClassStageStatus } from "../../../logic/competitionFormat.js";
import { renderClassHeatSection } from "../../heats/heatsView.js";
import { isAdmin } from "../../../users/roles.js";
export function renderWorkspaceHeatsTab(state, activeEvent, className) {
  const entries = state.entries.filter((entry) => entry.eventId === activeEvent.id);
  const heats = state.heats.filter((heat) => heat.eventId === activeEvent.id && heat.className === className);
  
  const classEntries = entries.filter((entry) => entry.className === className);
  const status = getClassStageStatus({ event: activeEvent, className, classEntries, classHeats: heats, results: state.results, state });

  const admin = isAdmin(state);
  const generateBtn = UI.Button({
    label: status.nextLabel || t(state, "event_workspace.draw_next_phase"),
    action: "generate-class-heats",
    class: className,
    variant: "primary",
    disabled: !status.canGenerate || !status.nextPhase
  });

  const printBtn = heats.length > 0 ? UI.Button({ label: t(state, "event_workspace.print_heats"), action: "print-class-heats", class: className, variant: "dashed", style: "margin-left: 10px;" }) : "";
  const cancelBtn = heats.length > 0 && admin ? UI.Button({ label: t(state, "event_workspace.cancel_draw"), action: "cancel-class-heats", class: className, variant: "danger dashed", style: "margin-left: 10px;" }) : "";

  let nextPhaseStatusStr = t(state, "event_workspace.all_phases_done");
  if (status.nextPhase) {
    if (status.advancingCount) {
      nextPhaseStatusStr = t(state, "event_workspace.next_phase_count").replace("{label}", escapeHtml(status.nextLabel)).replace("{count}", status.advancingCount);
    } else {
      nextPhaseStatusStr = t(state, "event_workspace.next_phase_all").replace("{label}", escapeHtml(status.nextLabel));
    }
  }

  const controls = `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
      <p class="muted" style="margin-bottom: 10px;">${status.disabledReason || nextPhaseStatusStr}</p>
      ${generateBtn}
      ${printBtn}
      ${cancelBtn}
    </div>
  `;

  return UI.Panel({ kicker: t(state, "event_workspace.step4"), title: t(state, "event_workspace.heats_title").replace("{class}", escapeHtml(className)) }, `
    ${controls}
    ${heats.length ? renderClassHeatSection(state, activeEvent, entries, className, heats, admin) : `<p class='muted'>${t(state, "event_workspace.no_heats")}</p>`}
  `);
}
