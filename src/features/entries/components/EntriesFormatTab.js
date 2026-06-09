import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { getCompetitionFormatForClass } from "../../../logic/competitionFormat.js";
export function renderWorkspaceFormatTab(state, activeEvent, className) {
  const format = getCompetitionFormatForClass(activeEvent, className);
  
  const formContent = `
    <input type="hidden" name="formatClassName" value="${escapeHtml(className)}" />
    ${UI.Input({ label: t(state, "event_workspace.qualifying_rounds"), name: "qualifyingRounds", type: "number", min: "1", max: "20", step: "1", value: format.qualifyingRounds })}
    <label class="check-row"><input type="checkbox" name="semiFinalEnabled" ${format.semiFinalEnabled ? "checked" : ""} /> ${t(state, "event_workspace.semi_enabled")}</label>
    ${UI.Input({ label: t(state, "event_workspace.semi_count"), name: "semiFinalists", type: "number", min: "2", max: "200", step: "1", value: format.semiFinalists })}
    <label class="check-row"><input type="checkbox" name="finalEnabled" ${format.finalEnabled ? "checked" : ""} /> ${t(state, "event_workspace.final_enabled")}</label>
    ${UI.Input({ label: t(state, "event_workspace.final_count"), name: "finalists", type: "number", min: "2", max: "200", step: "1", value: format.finalists })}
    <p class="muted" style="margin: 15px 0;">${t(state, "event_workspace.format_desc")}</p>
    ${UI.Button({ label: t(state, "event_workspace.save_format"), type: "submit", variant: "primary" })}
  `;

  return UI.FormPanel({ kicker: t(state, "event_workspace.step2"), title: t(state, "event_workspace.format_title").replace("{class}", escapeHtml(className)), action: "save-competition-format" }, formContent);
}
