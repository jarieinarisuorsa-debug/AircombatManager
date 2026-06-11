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
    label: "📷 Scan QR Scorecard",
    action: "open-qr-scanner",
    variant: "primary"
  });

  const randomizeBtn = isDemo ? `
    <button class="button dashed" data-action="randomize-demo-scores" data-class="${escapeHtml(className)}">🎲 Generate Points (${escapeHtml(className)})</button>
  ` : "";

  const controls = `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
      <p class="muted" style="margin-bottom: 15px;">Syötä tulokset käsin tai lue ne QR-koodilla.</p>
      <div class="ui-form-actions" style="justify-content: flex-start; margin-top: 0;">
        ${scanBtn}
        ${randomizeBtn}
      </div>
    </div>
  `;

  const classHeats = state.heats.filter(h => h.eventId === activeEvent.id && h.className === className);
  
  const heatsHtml = classHeats.length 
    ? renderClassHeatSection(state, activeEvent, state.entries.filter(e => e.eventId === activeEvent.id), className, classHeats, true, "scorecards")
    : "";

  return UI.Panel({ kicker: t(state, "event_workspace.step5"), title: t(state, "event_workspace.scorecards_title").replace("{class}", escapeHtml(className)) }, `
    ${controls}
    ${heatsHtml || `<p class='muted'>Ei arvottuja eriä.</p>`}
  `);
}
