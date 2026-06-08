import { escapeHtml, getActiveEvent, formatDateRange } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { buildScoreCardRows } from "../../logic/scoreCards.js";
import { renderScoreCardList } from "../scorecards/components/ScoreCardList.js";
import { renderScoreCardEditorModal } from "../scorecards/components/ScoreCardEditor.js";
import { renderStopwatchPanel } from "../pilots/components/StopwatchPanel.js";
import { isUserAdmin } from "../../users/roles.js";
import { renderHeatCard } from "../heats/heatsView.js";

export function renderMyEventView(state) {
  const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
  if (!userEmail) {
    return UI.PageHeader({ kicker: "Oma kilpailu", title: "Kirjautuminen vaaditaan" }) + 
           UI.Panel({ title: "Ei kirjautumista" }, "<p>Kirjaudu sisään nähdäksesi oman kilpailusi tiedot.</p>");
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
  const headerHtml = UI.PageHeader({
    kicker: isPreview ? "Admin-esikatselu" : "Oma työtila",
    title: activeEvent.name,
    subtitle: `${escapeHtml(activeEvent.location)} · ${formatDateRange(activeEvent.date, activeEvent.endDate)}`
  }) + (isPreview ? `<div style="background: rgba(255,165,0,0.2); border: 1px solid orange; color: orange; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;">Katsot näkymää Admin-esikatselutilassa (näytetään pilotti: ${escapeHtml(myPilot.name)}).</div>` : '');

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
      heatsHtml = UI.Grid({ gap: "10px" }, myHeats.map(h => renderHeatCard(state, state.entries, h, false, myPilot.id)).join(''));
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
      scorecardsHtml = renderScoreCardList(myRows, "");
      
      const editorRow = state.settings?.scoreCardEditorOpen
        ? myRows.find((row) => row.entry.id === state.settings.scoreCardEditorEntryId)
        : null;
        
      if (editorRow) {
        editorModal = renderScoreCardEditorModal(activeEvent, editorRow, { mode: "pilot" });
      }
    }
  }
  const scorecardsPanel = UI.Panel({ title: "Omat tuloskortit", className: "full-width-panel" }, scorecardsHtml);

  // Results Link
  const resultsHtml = activeEvent.resultsPublished ? 
    `<a class="button primary" href="#/results">Näytä julkaistut tulokset</a>` : 
    `<p class="muted">Tuloksia ei ole vielä julkaistu.</p>`;
  const resultsPanel = UI.Panel({ title: "Kilpailutulokset" }, resultsHtml);

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
      ${noticePanel}
      <div style="max-width: 600px;">
        ${statusPanel}
      </div>
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
      <div style="max-width: 600px;">
        ${resultsPanel}
      </div>
    `;
  } else if (tab === 'sekuntikello') {
    tabContent = `
      <div style="max-width: 800px; margin: 0 auto;">
        ${renderStopwatchPanel(state, myPilot, activeEvent)}
      </div>
    `;
  }

  return `
    ${headerHtml}
    ${tabNavigation}
    ${tabContent}
    ${editorModal}
  `;
}
