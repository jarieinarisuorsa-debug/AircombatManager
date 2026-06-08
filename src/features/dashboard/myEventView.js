import { escapeHtml, getActiveEvent, formatDateRange } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { buildScoreCardRows } from "../../logic/scoreCards.js";
import { renderScoreCardList } from "../scorecards/components/ScoreCardList.js";
import { renderStopwatchPanel } from "../pilots/components/StopwatchPanel.js";
import { isUserAdmin } from "../../users/roles.js";
import { renderHeatCard } from "../heats/heatsView.js";
import { buildCompetitionResults } from "../../logic/competitionResults.js";
import { renderResultsTable } from "../results/resultsView.js";
import { getCompetitionFormatForClass } from "../../logic/competitionFormat.js";

export function renderMyEventView(state) {
  const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
  if (!userEmail) {
    return UI.PageHeader({ kicker: "Oma kilpailu", title: "Kirjautuminen vaaditaan" }) + 
           UI.Panel({ title: "Ei kirjautumista" }, `
             <p>Kirjaudu sisään nähdäksesi oman kilpailusi tiedot.</p>
             <div style="margin-top: 20px;">
               <a href="#/login" class="button primary">Siirry kirjautumiseen tästä</a>
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
    return UI.PageHeader({ kicker: "Oma kilpailu", title: "Pilottiprofiili puuttuu" }) + 
           UI.Panel({ title: "Tietoja ei löytynyt" }, "<p>Sähköpostiisi ei ole liitetty pilottiprofiilia.</p>");
  }

  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.PageHeader({ kicker: isPreview ? "Admin-esikatselu" : "Oma kilpailu", title: "Ei aktiivista kilpailua" }) + 
           UI.Panel({ title: "Kisakalenteri" }, `<p>Ei valittua kilpailua. Mene <a href="#/calendar">Kisakalenteriin</a> ja avaa kilpailu.</p>`);
  }

  // Gather info
  const myRegistration = state.registrations?.find(r => r.eventId === activeEvent.id && r.pilotId === myPilot.id);
  const myEntries = state.entries.filter(e => e.eventId === activeEvent.id && e.pilotId === myPilot.id);
  const isEnrolled = myEntries.length > 0;
  
  // Header
  const headerHtml = isPreview ? `<div style="background: rgba(255,165,0,0.2); border: 1px solid orange; color: orange; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;"><strong>Admin-esikatselu:</strong> Katsot näkymää toisena pilottina (${escapeHtml(myPilot.name)}).</div>` : '';

  // Unread messages
  const unreadMessagesCount = (state.messages || []).filter(m => m.receiverId === myPilot.id && !m.read).length;
  const unreadMessagesAlert = unreadMessagesCount > 0 ? `
    <div style="margin-bottom: 20px; background: rgba(var(--primary-rgb), 0.15); border: 1px solid var(--primary); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="color: var(--primary); font-size: 1.1rem; display: block; margin-bottom: 5px;">💬 Uusia viestejä!</strong>
        <span style="color: var(--text-muted); font-size: 0.9rem;">Sinulla on ${unreadMessagesCount} lukematonta viestiä järjestäjältä.</span>
      </div>
      <div>
        <a href="#/messages" class="button primary" style="font-weight: bold;">Avaa viestit</a>
      </div>
    </div>
  ` : "";

  // Notice panel (Tiedotteet)
  const noticePanel = activeEvent.notices ? UI.Panel({ kicker: "Järjestäjältä", title: "Tiedotteet" }, `<div style="padding: 15px; background: rgba(88, 183, 255, 0.1); border-left: 4px solid var(--primary-color); border-radius: 4px;"><p style="margin:0;">${escapeHtml(activeEvent.notices)}</p></div>`) : "";

  // Registration Status
  let regStatusHtml = "";
  if (myRegistration) {
    const statusLabel = myRegistration.status === "pending" ? "Odottaa hyväksyntää" : (myRegistration.status === "approved" ? "Hyväksytty" : "Hylätty");
    const paymentLabel = myRegistration.paymentIntent === "paid_in_advance" ? "Maksettu etukäteen" : "Maksetaan paikan päällä";
    regStatusHtml = `
      <div style="padding: 15px; border-left: 4px solid var(--primary-color); background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 15px;">
        <strong>Tila:</strong> ${statusLabel}<br>
        <strong>Luokat:</strong> ${myRegistration.classes.join(", ")}<br>
        <strong>Maksutapa:</strong> ${paymentLabel}
      </div>
    `;
  } else if (isEnrolled) {
    regStatusHtml = `
      <div style="padding: 15px; border-left: 4px solid var(--success); background: rgba(0,255,0,0.1); border-radius: 4px; margin-bottom: 15px;">
        <strong>Tila:</strong> Mukana kilpailussa<br>
        <strong>Luokat:</strong> ${myEntries.map(e => escapeHtml(e.className)).join(", ")}
      </div>
    `;
  } else {
    regStatusHtml = `
      <div style="padding: 15px; border-left: 4px solid var(--text-muted); background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 15px;">
        <p class="muted">Et ole vielä ilmoittautunut tähän kilpailuun. Voit ilmoittautua <a href="#/mypilotcard">Omasta pilottikortistasi</a>.</p>
      </div>
    `;
  }
  const statusPanel = UI.Panel({ title: "Ilmoittautuminen" }, regStatusHtml);

  // My Heats
  let heatsHtml = `<p class="muted">Ei arvottuja eriä.</p>`;
  let heatsPanel = null;
  if (state.heats.some(h => h.eventId === activeEvent.id)) {
    const entryIds = myEntries.map(e => e.id);
    // Support either h.pilotIds or h.entryIds depending on what heat builder uses. Heats use entryIds.
    const myHeats = state.heats.filter(h => h.eventId === activeEvent.id && (h.entryIds || []).some(id => entryIds.includes(id)));
    if (myHeats.length > 0) {
      heatsHtml = UI.Grid({ gap: "10px" }, myHeats.map(h => renderHeatCard(state, activeEvent, state.entries, h, false, myPilot.id)).join(''));
      heatsPanel = heatsHtml; // Just use the raw HTML since Heat Cards look like panels themselves
    } else {
      heatsPanel = UI.Panel({ title: "Omat heatit" }, heatsHtml);
    }
  } else {
    heatsPanel = UI.Panel({ title: "Omat heatit" }, heatsHtml);
  }

  // My Scorecards
  let scorecardsHtml = `<p class="muted">Ei tuloskortteja.</p>`;
  let editorModal = "";
  if (isEnrolled) {
    const rows = buildScoreCardRows(state, activeEvent);
    const myRows = rows.filter(r => r.entry.pilotId === myPilot.id);
    if (myRows.length > 0) {
      scorecardsHtml = renderScoreCardList(state, activeEvent, myRows, "");
    }
  }
  const scorecardsPanel = UI.Panel({ title: "Omat tuloskortit", className: "full-width-panel" }, scorecardsHtml);

  // Results Link & Breakdown
  let resultsHtml = "";
  const compResults = buildCompetitionResults(state, activeEvent);
  const myResults = compResults.rows.filter(r => r.pilotId === myPilot.id);

  if (myResults.length === 0) {
    resultsHtml = `<p class="muted">Ei tuloksia tässä kilpailussa.</p>`;
  } else {
    resultsHtml = `<div style="display: flex; flex-direction: column; gap: 15px;">`;
    
    if (!activeEvent.resultsPublished) {
      resultsHtml += `<div style="background: rgba(255, 165, 0, 0.1); border-left: 4px solid var(--warning); padding: 10px; border-radius: 4px; font-size: 0.85rem; color: var(--text-color);">Tuloksia ei ole vielä virallisesti julkaistu. Nämä ovat väliaikatietoja.</div>`;
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
         <a class="button outline" style="width: 100%; justify-content: center;" href="#/results">Näytä kaikkien kilpailijoiden tulokset</a>
       </div>`;
    } else {
       resultsHtml += `<div style="margin-top: 20px;">
         <a class="button outline" style="width: 100%; justify-content: center;" href="#/results">Kaikkien kilpailijoiden tilanne</a>
       </div>`;
    }
  }

  const resultsPanel = UI.Panel({ title: "Omat kilpailutulokset" }, resultsHtml);

  // Build Tabs
  const tab = window.MY_EVENT_TAB || 'yhteenveto';
  
  const tabNavigation = `
    <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'yhteenveto' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="yhteenveto">Yhteenveto</button>
      <button type="button" class="button ${tab === 'heatit' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="heatit">Omat heatit</button>
      <button type="button" class="button ${tab === 'tuloskortit' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="tuloskortit">Tuloskortit</button>
      <button type="button" class="button ${tab === 'sekuntikello' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="sekuntikello">Sekuntikello</button>
      <button type="button" class="button ${tab === 'tulokset' ? 'primary' : 'dashed'}" data-action="set-my-event-tab" data-tab="tulokset">Tulokset</button>
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
