import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

import { getWorkspaceClasses } from "./components/EntriesShared.js";
import { renderWorkspaceRegistrationsTab } from "./components/EntriesRegistrationsTab.js";
import { renderWorkspaceClassTab } from "./components/EntriesClassTab.js";
import { renderWorkspaceFormatTab } from "./components/EntriesFormatTab.js";
import { renderWorkspaceParticipantsTab } from "./components/EntriesParticipantsTab.js";
import { renderWorkspaceCompetitorsTab } from "./components/EntriesCompetitorsTab.js";
import { renderWorkspaceHeatsTab } from "./components/EntriesHeatsTab.js";
import { renderWorkspaceScorecardsTab } from "./components/EntriesScorecardsTab.js";
import { renderWorkspaceResultsTab } from "./components/EntriesResultsTab.js";

export function renderEntriesView(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.PageHeader({
      kicker: t(state, "event_workspace.kicker_build"),
      title: t(state, "event_workspace.no_active_event"),
      subtitle: t(state, "event_workspace.open_from_calendar"),
      headerActions: UI.Button({ label: "Create new event", action: "open-calendar-and-event-form", variant: "primary" })
    });
  }

  const eventEntries = state.entries.filter((entry) => entry.eventId === activeEvent.id);
  const classNames = getWorkspaceClasses(activeEvent, eventEntries);
  let activeClassName = state.settings?.workspaceActiveClassName || classNames[0];

  const tab = state.settings?.workspaceActiveTab || "luokka";

  const workspaceHero = UI.PageHeader({
    kicker: t(state, "event_workspace.kicker_workspace"),
    title: activeEvent.name,
    subtitle: `${escapeHtml(activeEvent.location)} · ${t(state, "event_workspace.class_label")} ${activeClassName || t(state, "event_workspace.not_selected")}`
  });

  const isCombatMode = state.settings?.competitionMode;
  const tabNav = `
    <nav class="sub-nav no-print" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
      <button type="button" class="button ${tab === 'ilmoittautumiset' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="ilmoittautumiset">${t(state, "event_workspace.tab_registrations")}</button>
      <button type="button" class="button ${tab === 'luokka' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="luokka">${t(state, "event_workspace.tab_class")}</button>
      <button type="button" class="button ${tab === 'rakenne' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="rakenne">${t(state, "event_workspace.tab_format")}</button>
      <button type="button" class="button ${tab === 'osallistujat' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="osallistujat">${t(state, "event_workspace.tab_all_pilots")}</button>
      <button type="button" class="button ${tab === 'kilpailijat' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="kilpailijat">${t(state, "event_workspace.tab_competitors")}</button>
      <button type="button" class="button ${isCombatMode ? 'danger' : 'primary'}" data-action="toggle-combat-mode" style="box-shadow: 0 0 10px ${isCombatMode ? 'rgba(255,50,50,0.5)' : 'rgba(88, 183, 255, 0.5)'}; font-weight: bold;">
        ${isCombatMode ? t(state, "event_workspace.tab_combat_mode_off") : t(state, "event_workspace.tab_combat_mode_on")}
      </button>
      <button type="button" class="button ${tab === 'heatit' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="heatit">${t(state, "event_workspace.tab_heats")}</button>
      <button type="button" class="button ${tab === 'tuloskortit' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="tuloskortit">${t(state, "event_workspace.tab_scorecards")}</button>
      <button type="button" class="button ${tab === 'tulokset' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="tulokset">${t(state, "event_workspace.tab_results")}</button>
    </nav>
  `;

  let content = "";
  if (tab === "ilmoittautumiset") content = renderWorkspaceRegistrationsTab(state, activeEvent);
  else if (tab === "luokka") content = renderWorkspaceClassTab(state, activeEvent, classNames, activeClassName, eventEntries);
  else if (!activeClassName) content = UI.Panel({ title: t(state, "event_workspace.select_class_first_title") }, `<p class='muted'>${t(state, "event_workspace.select_class_first_msg")}</p>`);
  else if (tab === "rakenne") content = renderWorkspaceFormatTab(state, activeEvent, activeClassName);
  else if (tab === "osallistujat") content = renderWorkspaceParticipantsTab(state, activeEvent, activeClassName, eventEntries);
  else if (tab === "kilpailijat") content = renderWorkspaceCompetitorsTab(state, activeEvent, activeClassName, eventEntries);
  else if (tab === "heatit") content = renderWorkspaceHeatsTab(state, activeEvent, activeClassName);
  else if (tab === "tuloskortit") content = renderWorkspaceScorecardsTab(state, activeEvent, activeClassName);
  else if (tab === "tulokset") content = renderWorkspaceResultsTab(state, activeEvent, activeClassName);

  return [workspaceHero, tabNav, content].join("");
}
