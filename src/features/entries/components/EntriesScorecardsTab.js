import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { buildScoreCardRows } from "../../../logic/scoreCards.js";
import { renderScoreCardList } from "../../scorecards/components/ScoreCardList.js";
export function renderWorkspaceScorecardsTab(state, activeEvent, className) {
  const allRows = buildScoreCardRows(state, activeEvent);
  const rows = allRows.filter((row) => String(row.className).trim().toLowerCase() === className.toLowerCase());
  
  if (!rows.length) return UI.Panel({ title: t(state, "event_workspace.no_scorecards_title") }, `<p class='muted'>${t(state, "event_workspace.no_scorecards_msg")}</p>`);
  const qrButton = `
    <div style="margin-bottom: 15px; display: flex; justify-content: flex-end;">
      <button type="button" class="button primary" data-action="open-qr-scanner" style="display: flex; align-items: center; gap: 8px;">📷 Skannaa QR-tuloskortti</button>
    </div>
  `;

  return UI.Panel({ kicker: t(state, "event_workspace.step5"), title: t(state, "event_workspace.scorecards_title").replace("{class}", escapeHtml(className)) }, qrButton + renderScoreCardList(state, activeEvent, rows, className));
}
