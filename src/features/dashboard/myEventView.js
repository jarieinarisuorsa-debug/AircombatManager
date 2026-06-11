import { escapeHtml, getActiveEvent, formatDateRange } from "../../utils/html.js";
import { t } from "../../utils/i18n.js";
import { UI } from "../../ui/engine.js";
import { buildScoreCardRows } from "../../logic/scoreCards.js";
import { renderScoreCardList } from "../scorecards/components/ScoreCardList.js";
import { renderStopwatchPanel } from "../pilots/components/StopwatchPanel.js?v=2";
import { isUserAdmin } from "../../users/roles.js";
import { renderHeatCard } from "../heats/heatsView.js";
import { buildCompetitionResults } from "../../logic/competitionResults.js";
import { renderResultsTable } from "../results/resultsView.js";
import { getCompetitionFormatForClass } from "../../logic/competitionFormat.js";

export function renderMyEventView(state) {
  const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
  if (!userEmail) {
    return UI.PageHeader({ kicker: "Aircombat Competition Manager", title: t(state, "my_event.login_req_title") }) + 
           UI.Panel({ title: t(state, "my_event.no_login_panel") }, `
             <p>${t(state, "my_event.login_req")}</p>
             <div style="margin-top: 20px;">
               <a href="#/landing/login" class="button primary">${t(state, "my_event.go_to_login")}</a>
             </div>
           `);
  }

  let myPilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
  
  let isPreview = false;
  if (!myPilot && isUserAdmin(state) && state.pilots.length > 0) {
    myPilot = state.pilots[0];
    isPreview = true;
  }

  if (!myPilot) {
    return UI.PageHeader({ kicker: "Aircombat Competition Manager", title: t(state, "my_event.no_profile_title") }) + 
           UI.Panel({ title: t(state, "my_event.no_profile_panel") }, `<p>${t(state, "my_event.no_profile_msg")}</p>`);
  }

  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.PageHeader({ kicker: isPreview ? t(state, "my_event.admin_preview") : "Aircombat Competition Manager", title: t(state, "my_event.no_active_event_title") }) + 
           UI.Panel({ title: t(state, "my_event.calendar_panel") }, `<p>${t(state, "my_event.no_event_msg")}</p>`);
  }

  // Gather info
  const myRegistration = state.registrations?.find(r => r.eventId === activeEvent.id && r.pilotId === myPilot.id);
  const myEntries = state.entries.filter(e => e.eventId === activeEvent.id && e.pilotId === myPilot.id);
  const isEnrolled = myEntries.length > 0;
  
  // Header
  const headerHtml = isPreview ? `<div style="background: rgba(255,165,0,0.2); border: 1px solid orange; color: orange; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;"><strong>${t(state, "my_event.admin_preview")}:</strong> ${t(state, "my_event.admin_preview_msg").replace("{name}", escapeHtml(myPilot.name))}</div>` : '';

  // Unread messages
  const unreadMessagesCount = (state.messages || []).filter(m => !m.readBy?.includes(myPilot.id)).length;
  const unreadMessagesAlert = unreadMessagesCount > 0 ? `
    <div style="margin-bottom: 20px; background: rgba(var(--primary-rgb), 0.15); border: 1px solid var(--primary); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="color: var(--primary); font-size: 1.1rem; display: block; margin-bottom: 5px;">${t(state, "my_event.new_messages")}</strong>
        <span style="color: var(--text-muted); font-size: 0.9rem;">${t(state, "my_event.unread_messages_msg").replace("{count}", unreadMessagesCount)}</span>
      </div>
      <div>
        <a href="#/messages" class="button primary" style="font-weight: bold;">${t(state, "my_event.open_messages")}</a>
      </div>
    </div>
  ` : "";

  // Notice panel (Tiedotteet)
  const noticePanel = activeEvent.notices ? UI.Panel({ kicker: t(state, "my_event.from_organizer"), title: t(state, "my_event.notices") }, `<div style="padding: 15px; background: rgba(88, 183, 255, 0.1); border-left: 4px solid var(--primary-color); border-radius: 4px;"><p style="margin:0;">${escapeHtml(activeEvent.notices)}</p></div>`) : "";

  // Registration Status
  let regStatusHtml = "";
  if (myRegistration) {
    const statusLabel = myRegistration.status === "pending" ? t(state, "my_event.status_pending") : (myRegistration.status === "approved" ? t(state, "my_event.status_approved") : t(state, "my_event.status_rejected"));
    const paymentLabel = myRegistration.paymentIntent === "paid_in_advance" ? t(state, "my_event.pay_advance") : t(state, "my_event.pay_onsite");
    regStatusHtml = `
      <div style="padding: 15px; border-left: 4px solid var(--primary-color); background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 15px;">
        <strong>${t(state, "my_event.reg_status")}</strong> ${statusLabel}<br>
        <strong>${t(state, "my_event.reg_classes")}</strong> ${myRegistration.classes.join(", ")}<br>
        <strong>${t(state, "my_event.reg_payment")}</strong> ${paymentLabel}
      </div>
    `;
  } else if (isEnrolled) {
    regStatusHtml = `
      <div style="padding: 15px; border-left: 4px solid var(--success); background: rgba(0,255,0,0.1); border-radius: 4px; margin-bottom: 15px;">
        <strong>${t(state, "my_event.reg_status")}</strong> ${t(state, "my_event.enrolled")}<br>
        <strong>${t(state, "my_event.reg_classes")}</strong> ${myEntries.map(e => escapeHtml(e.className)).join(", ")}
      </div>
    `;
  } else {
    regStatusHtml = `
      <div style="padding: 15px; border-left: 4px solid var(--text-muted); background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 15px;">
        <p class="muted">${t(state, "my_event.not_enrolled")}</p>
      </div>
    `;
  }
  const statusPanel = UI.Panel({ title: t(state, "my_event.registration_panel") }, regStatusHtml);

  // My Heats
  let heatsHtml = `<p class="muted">${t(state, "my_event.no_heats")}</p>`;
  let heatsPanel = null;
  if (state.heats.some(h => h.eventId === activeEvent.id)) {
    const entryIds = myEntries.map(e => e.id);
    // Support either h.pilotIds or h.entryIds depending on what heat builder uses. Heats use entryIds.
    const myHeats = state.heats.filter(h => h.eventId === activeEvent.id && (h.entryIds || []).some(id => entryIds.includes(id)));
    if (myHeats.length > 0) {
      heatsHtml = UI.Grid({ gap: "10px" }, myHeats.map(h => renderHeatCard(state, activeEvent, state.entries, h, false, myPilot.id)).join(''));
      heatsPanel = heatsHtml; // Just use the raw HTML since Heat Cards look like panels themselves
    } else {
      heatsPanel = UI.Panel({ title: t(state, "my_event.my_heats_panel") }, heatsHtml);
    }
  } else {
    heatsPanel = UI.Panel({ title: t(state, "my_event.my_heats_panel") }, heatsHtml);
  }

  // My Scorecards
  let scorecardsHtml = `<p class="muted">${t(state, "my_event.no_cards")}</p>`;
  let editorModal = "";
  if (isEnrolled) {
    const rows = buildScoreCardRows(state, activeEvent);
    const myRows = rows.filter(r => r.entry.pilotId === myPilot.id);
    if (myRows.length > 0) {
      scorecardsHtml = renderScoreCardList(state, activeEvent, myRows, "");
    }
  }
  const scorecardsPanel = UI.Panel({ title: t(state, "my_event.my_cards_panel"), className: "full-width-panel" }, scorecardsHtml);

  // Results Link & Breakdown
  let resultsHtml = "";
  const compResults = buildCompetitionResults(state, activeEvent);
  const myResults = compResults.rows.filter(r => r.pilotId === myPilot.id);

  if (myResults.length === 0) {
    resultsHtml = `<p class="muted">${t(state, "my_event.no_results")}</p>`;
  } else {
    resultsHtml = `<div style="display: flex; flex-direction: column; gap: 15px;">`;
    
    if (!activeEvent.resultsPublished) {
      resultsHtml += `<div style="background: rgba(255, 165, 0, 0.1); border-left: 4px solid var(--warning); padding: 10px; border-radius: 4px; font-size: 0.85rem; color: var(--text-color);">${t(state, "my_event.results_draft_msg")}</div>`;
    }

    resultsHtml += myResults.map(row => {
      const classGroup = compResults.classGroups.find(g => g.className === row.className);
      const classRow = classGroup?.rows.find(r => r.entryId === row.entryId);
      const position = classRow ? classRow.classPosition : "-";
      const tableRow = { ...row, classPosition: position };
      
      const format = getCompetitionFormatForClass(activeEvent, row.className);

      return `
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <div style="background: var(--surface-2); padding: 12px 15px; border-bottom: 1px solid var(--border);">
            <h3 style="margin: 0; font-size: 1.2rem; color: var(--primary);">${escapeHtml(row.className)}</h3>
          </div>
          ${renderResultsTable(state, [tableRow], true, true, format)}
        </div>
      `;
    }).join("");
    
    resultsHtml += `</div>`;
    
    if (activeEvent.resultsPublished) {
       resultsHtml += `<div style="margin-top: 20px;">
         <a class="button outline" style="width: 100%; justify-content: center;" href="#/results">${t(state, "my_event.show_all_results")}</a>
       </div>`;
    } else {
       resultsHtml += `<div style="margin-top: 20px;">
         <a class="button outline" style="width: 100%; justify-content: center;" href="#/results">${t(state, "my_event.show_all_situations")}</a>
       </div>`;
    }
  }

  const resultsPanel = UI.Panel({ title: t(state, "my_event.my_results_panel") }, resultsHtml);

  // Build Tabs
  const tab = window.MY_EVENT_TAB || 'yhteenveto';
  
  const tabNavigation = `
    <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'yhteenveto' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="yhteenveto">${t(state, "my_event.tab_summary")}</button>
      <button type="button" class="button ${tab === 'heatit' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="heatit">${t(state, "my_event.tab_heats")}</button>
      <button type="button" class="button ${tab === 'tuloskortit' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="tuloskortit">${t(state, "my_event.tab_cards")}</button>
      <button type="button" class="button ${tab === 'sekuntikello' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="sekuntikello">${t(state, "my_event.tab_stopwatch")}</button>
      <button type="button" class="button ${tab === 'tulokset' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="tulokset">${t(state, "my_event.tab_results")}</button>
    </div>
  `;

  let tabContent = "";
  if (tab === 'yhteenveto') {
    tabContent = `
      ${unreadMessagesAlert}
      ${noticePanel}
      ${statusPanel}
    `;
  } else if (tab === 'heatit') {
    tabContent = `
      ${heatsPanel}
    `;
  } else if (tab === 'tuloskortit') {
    tabContent = `
      ${scorecardsPanel}
    `;
  } else if (tab === 'tulokset') {
    tabContent = `
      ${resultsPanel}
    `;
  } else if (tab === 'sekuntikello') {
    tabContent = `
      ${renderStopwatchPanel(state, myPilot, activeEvent)}
    `;
  }

  return `
    ${headerHtml}
    ${tabNavigation}
    ${tabContent}
  `;
}
