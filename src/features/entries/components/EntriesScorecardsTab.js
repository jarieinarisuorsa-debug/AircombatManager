import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { isDemo } from "../../../state/store.js";
import { t } from "../../../utils/i18n.js";
import { buildScoreCardRows } from "../../../logic/scoreCards.js";
import { renderScoreCardList } from "../../scorecards/components/ScoreCardList.js";
import { renderClassHeatSection } from "../../heats/heatsView.js";

export function renderWorkspaceScorecardsTab(state, activeEvent, className) {
  const allRows = buildScoreCardRows(state, activeEvent);
  const rows = allRows.filter((row) => String(row.className).trim().toLowerCase() === className.toLowerCase());
  
  if (!rows.length) return UI.Panel({ title: t(state, "event_workspace.no_scorecards_title") }, `<p class='muted'>${t(state, "event_workspace.no_scorecards_msg")}</p>`);
  const scanBtn = UI.Button({
    label: "📷 Skannaa QR-tuloskortti",
    action: "open-qr-scanner",
    variant: "primary"
  });

  const randomizeBtn = isDemo ? `
    <button class="button dashed" data-action="randomize-demo-scores" data-class="${escapeHtml(className)}">🎲 Arvo pisteet (${escapeHtml(className)})</button>
  ` : "";

  const controls = `
    <div class="ui-form-actions" style="margin-bottom: 15px;">
      ${randomizeBtn}
      ${scanBtn}
    </div>
  `;

  const classHeats = state.heats.filter(h => h.eventId === activeEvent.id && h.className === className);
  
  const heatsHtml = classHeats.length 
    ? renderClassHeatSection(state, activeEvent, state.entries.filter(e => e.eventId === activeEvent.id), className, classHeats, true, "scorecards")
    : "";

  const heatsPanel = heatsHtml ? UI.Panel({ 
    kicker: "HEATEITTÄIN", 
    title: `${escapeHtml(className)} tuloskortit erittäin` 
  }, heatsHtml) : "";

  return UI.Panel({ kicker: t(state, "event_workspace.step5"), title: t(state, "event_workspace.scorecards_title").replace("{class}", escapeHtml(className)) }, controls + heatsPanel);
}
