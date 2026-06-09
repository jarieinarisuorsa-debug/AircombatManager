import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { getClassStageStatus } from "../../../logic/competitionFormat.js";
export function renderWorkspaceClassTab(state, activeEvent, classNames, activeClassName, eventEntries) {
  if (!classNames.length) {
    return UI.Panel({ kicker: t(state, "event_workspace.step1"), title: t(state, "event_workspace.no_classes_title") }, `
      <p class="muted">${t(state, "entries_view.hint")}</p>
      <a class="button primary" href="#/calendar">Avaa kisakalenteri</a>
    `);
  }

  const classButtons = classNames.map(c => `
    <button class="button ${c === activeClassName ? 'primary' : 'dashed'}" data-action="switch-workspace-class" data-class-name="${escapeHtml(c)}">${escapeHtml(c)}</button>
  `).join("");

  const classEntries = eventEntries.filter((e) => e.className === activeClassName);
  const classHeats = state.heats.filter(h => h.eventId === activeEvent.id && h.className === activeClassName);
  const status = getClassStageStatus({ event: activeEvent, className: activeClassName, classEntries, classHeats, results: state.results, state });

  const summaryText = activeClassName ? `
    <div style="margin-top: 20px; padding: 15px; border-radius: 8px; background: rgba(0,0,0,0.2);">
      <h4 style="margin-bottom: 10px;">${t(state, "event_workspace.summary").replace("{class}", escapeHtml(activeClassName))}</h4>
      <p class="muted">${t(state, "event_workspace.participants")}: <strong>${classEntries.length}</strong> | ${t(state, "event_workspace.heats")}: <strong>${classHeats.length}</strong></p>
      <p class="muted" style="margin-top: 10px; font-weight: bold; color: var(--text);">${t(state, "event_workspace.status")}: ${status.nextPhase ? `${t(state, "event_workspace.next_phase")} ${escapeHtml(status.nextLabel)}` : t(state, "event_workspace.ready")}</p>
    </div>
  ` : "";

  return UI.Panel({ kicker: t(state, "event_workspace.step1"), title: t(state, "event_workspace.select_class_title") }, `
    <p class="muted" style="margin-bottom: 15px;">${t(state, "event_workspace.select_class_desc")}</p>
    <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
      ${classButtons}
    </div>
    ${summaryText}
  `);
}
