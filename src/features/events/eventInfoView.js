import { escapeHtml, formatDateRange, getActiveEvent } from "../../utils/html.js";
import { normalizeEventInfo } from "../../logic/eventInfo.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

import { renderSummaryPanel } from "./components/EventSummaryPanel.js";
import { renderArrivalOnlyPanel } from "./components/EventArrivalPanel.js";
import { renderMapOnlyPanel } from "./components/EventMapPanel.js";
import { renderWeatherOnlyPanel } from "./components/EventWeatherPanel.js";
import { renderLocationPanel } from "./components/EventLocationPanel.js";
import { renderSchedulePanel } from "./components/EventSchedulePanel.js";
import { renderDocumentsPanel } from "./components/EventDocumentsPanel.js";
import { renderNoticePanel } from "./components/EventNoticePanel.js";
import { renderContactPanel } from "./components/EventContactPanel.js";
import { renderSponsorsPanel } from "./components/EventSponsorsPanel.js";
export function renderEventInfoView(state) {
  const event = getActiveEvent(state);
  const admin = isAdmin(state);

  if (!event) {
    return UI.Panel({
      kicker: t(state, "event_info.kicker"),
      title: t(state, "event_info.no_active")
    }, `
      <p class="muted">${t(state, "event_info.no_active_desc")}</p>
      <a class="button primary" href="#/calendar">${t(state, "event_info.open_calendar")}</a>
    `);
  }

  const info = normalizeEventInfo(event.eventInfo);
  const headerActions = "";

  const pageHeader = UI.PageHeader({
    kicker: t(state, "event_info.kicker"),
    title: event.name,
    subtitle: `${escapeHtml(event.location)} · ${formatDateRange(event.date, event.endDate)}`,
    headerActions
  });

  const tab = window.EVENT_INFO_TAB || 'yleista';
  const editMode = state.settings?.eventInfoEditMode;

  const tabNavigation = UI.ScrollableNav({
    id: "event-info-sub-nav",
    className: "no-print",
    style: "margin-bottom: 20px; border-bottom: 1px solid var(--border);",
    navStyle: "padding-bottom: 10px;"
  }, `
    <button type="button" class="button ${tab === 'yleista' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="yleista">${t(state, "event_info.tab_general")}</button>
    <button type="button" class="button ${tab === 'saapuminen' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="saapuminen">${t(state, "event_info.tab_arrival")}</button>
    <button type="button" class="button ${tab === 'kartta' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="kartta">${t(state, "event_info.tab_map")}</button>
    <button type="button" class="button ${tab === 'saatila' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="saatila">${t(state, "event_info.tab_weather")}</button>
    <button type="button" class="button ${tab === 'aikataulu' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="aikataulu">${t(state, "event_info.tab_schedule")}</button>
    <button type="button" class="button ${tab === 'dokumentit' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="dokumentit">${t(state, "event_info.tab_docs")}</button>
    <button type="button" class="button ${tab === 'tiedotteet' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="tiedotteet">${t(state, "event_info.tab_notices")}</button>
    <button type="button" class="button ${tab === 'yhteystiedot' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="yhteystiedot">${t(state, "event_info.tab_contacts")}</button>
    <button type="button" class="button ${tab === 'sponsorit' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-event-info-tab" data-tab="sponsorit">${t(state, "event_info.tab_sponsors")}</button>
  `);

  let tabContent = "";
  if (tab === 'yleista') {
    tabContent = renderSummaryPanel(event, info, admin, editMode === 'yleista');
  } else if (tab === 'saapuminen') {
    tabContent = renderArrivalOnlyPanel(event, info, admin, editMode === 'saapuminen');
  } else if (tab === 'kartta') {
    tabContent = renderMapOnlyPanel(event, info, admin, editMode === 'kartta');
  } else if (tab === 'saatila') {
    tabContent = renderWeatherOnlyPanel(event, info, admin, editMode === 'saatila');
  } else if (tab === 'sijainti') {
    tabContent = renderLocationPanel(event, info, admin, editMode === 'sijainti');
  } else if (tab === 'aikataulu') {
    tabContent = renderSchedulePanel(info, admin, editMode);
  } else if (tab === 'dokumentit') {
    tabContent = renderDocumentsPanel(info, admin, editMode === 'dokumentit');
  } else if (tab === 'tiedotteet') {
    tabContent = renderNoticePanel(event, admin, editMode === 'tiedotteet');
  } else if (tab === 'yhteystiedot') {
    tabContent = renderContactPanel(info, admin, editMode === 'yhteystiedot');
  } else if (tab === 'sponsorit') {
    tabContent = renderSponsorsPanel(info, admin, editMode === 'sponsorit');
  }

  return `
    ${pageHeader}
    ${tabNavigation}
    ${tabContent}
  `;
}
