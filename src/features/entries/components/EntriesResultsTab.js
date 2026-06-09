import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { buildCompetitionResults, isCompetitionResultsPublished } from "../../../logic/competitionResults.js";
import { renderResultsTable } from "../../results/resultsView.js";
export function renderWorkspaceResultsTab(state, activeEvent, className) {
  const compResults = buildCompetitionResults(state, activeEvent);
  
  const group = compResults.classGroups.find(g => g.className === className);
  if (!group || group.rows.length === 0) {
    return UI.Panel({ title: t(state, "event_workspace.no_results_title") }, `<p class='muted'>${t(state, "event_workspace.no_results_msg")}</p>`);
  }

  const rows = group.rows.map((row, index) => ({ ...row, classPosition: index + 1 }));
  const tableHtml = renderResultsTable(state, rows, false, true);

  const published = isCompetitionResultsPublished(activeEvent);
  const publishBtn = !published 
    ? UI.Button({ label: t(state, "event_workspace.publish_results"), action: "publish-competition-results", variant: "primary" })
    : UI.Button({ label: t(state, "event_workspace.hide_results"), action: "unpublish-competition-results", variant: "danger" });

  const statusText = published ? t(state, "event_workspace.status_published") : t(state, "event_workspace.status_draft");

  return UI.Panel({ kicker: t(state, "event_workspace.step6"), title: t(state, "event_workspace.results_title").replace("{class}", escapeHtml(className)) }, `
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <strong>${statusText}</strong>
      ${publishBtn}
    </div>
    ${tableHtml}
  `);
}
