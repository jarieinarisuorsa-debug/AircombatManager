import { escapeHtml, formatDateRange } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { getEventSummary } from "../dashboardHelpers.js";

export function renderAdminDashboard(state) {
  const { activeEvent, eventEntries, eventHeats, eventResults, ranking } = getEventSummary(state);

  const now = new Date().toISOString().split("T")[0];
  const upcomingEvents = state.events
    .filter(e => e.date >= now && e.id !== activeEvent?.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = upcomingEvents[0];

  const nextEventCard = nextEvent ? `
    <div style="margin-bottom: 20px;">
      ${UI.Panel({ kicker: "Seuraava kilpailu tulossa", title: escapeHtml(nextEvent.name), style: "border-left: 4px solid var(--primary);" }, `
        <p style="margin-bottom: 15px;">${escapeHtml(nextEvent.location)} · ${formatDateRange(nextEvent.date, nextEvent.endDate)}</p>
        ${UI.Button({ label: "Siirry tähän kilpailuun", action: "set-active-event", eventId: nextEvent.id, variant: "primary" })}
      `)}
    </div>
  ` : "";

  if (!activeEvent) {
    const noEventHeader = UI.PageHeader({
      kicker: "Etusivu",
      title: "Ei aktiivista kilpailua",
      subtitle: "Avaa kilpailu kisakalenterista tai luo uusi.",
      headerActions: `<a class="button primary" href="#/calendar">Kisakalenteri</a>`
    });
    return `
      ${nextEventCard}
      ${noEventHeader}
    `;
  }

  // 1. KISAPAIKKAKOHTAINEN TYÖYMPÄRISTÖ (Header Panel)
  const headerPanel = `
    <div style="background: var(--surface-2); border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; border: 1px solid var(--border);">
      <div>
        <div class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">KISAPAIKKAKOHTAINEN TYÖYMPÄRISTÖ</div>
        <h2 style="margin: 0 0 5px 0; font-size: 1.8rem;">${escapeHtml(activeEvent.name)}</h2>
        <div class="muted" style="font-size: 0.85rem;">${escapeHtml(activeEvent.location)} - ${formatDateRange(activeEvent.date, activeEvent.endDate)} - Hallitse tämän kilpailupaikan osallistujat, heatit, jatkovaiheet ja tulokset tästä näkymästä.</div>
      </div>
      <div style="display: flex; gap: 15px; font-size: 0.85rem; font-weight: 600;">
        <a href="#/calendar" style="color: var(--text-muted); text-decoration: none;">- Kalenteri</a>
        <a href="#/pilots" style="color: white; text-decoration: none;">Pilotit</a>
        <a href="#/heats" style="color: white; text-decoration: none;">Heatit</a>
        <a href="#/scorecards" style="color: white; text-decoration: none;">Tuloskortit</a>
        <a href="#/results" style="color: white; text-decoration: none;">Tulokset</a>
      </div>
    </div>
  `;

  // 2. TYÖPÖYTÄ (Workflow Steps)
  const totalScorecards = state.scoreCards?.filter(sc => eventEntries.some(e => e.id === sc.entryId)).length || 0;
  const resultsStatus = activeEvent.resultsPublished ? "Julkaistu" : "Luonnos";

  const workflowPanel = `
    <div style="margin-bottom: 30px;">
      <div class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">TYÖPÖYTÄ</div>
      <h3 style="margin: 0 0 15px 0; font-size: 1.1rem;">Kilpailun työvaiheet</h3>
      
      <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 15px;">
        <div style="background: var(--surface-2); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="color: var(--primary); font-size: 0.7rem; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.05em;">1 - OSALLISTUJAT</div>
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 10px;">${eventEntries.length}</div>
          <div class="muted" style="font-size: 0.8rem; line-height: 1.4;">Lisää pilotit ja ilmoita heidät luokkiin.</div>
        </div>
        
        <div style="background: var(--surface-2); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="color: var(--primary); font-size: 0.7rem; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.05em;">2 - HEATIT</div>
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 10px;">${eventHeats.length}</div>
          <div class="muted" style="font-size: 0.8rem; line-height: 1.4;">Tarkista arvotut heatit ja lähtölistat.</div>
        </div>
        
        <div style="background: var(--surface-2); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="color: var(--primary); font-size: 0.7rem; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.05em;">3 - TULOSKORTIT</div>
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 10px;">${totalScorecards}</div>
          <div class="muted" style="font-size: 0.8rem; line-height: 1.4;">Tuloskortit syntyvät osallistujista automaattisesti.</div>
        </div>
        
        <div style="background: var(--surface-2); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="color: var(--primary); font-size: 0.7rem; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.05em;">4 - TULOKSET</div>
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 10px;">${resultsStatus}</div>
          <div class="muted" style="font-size: 0.8rem; line-height: 1.4;">Tarkista ja julkaise kilpailutulokset.</div>
        </div>
      </div>
    </div>
  `;

  // 3. LUOKAT (Class Builder)
  const activeClasses = [...new Set(eventEntries.map(e => e.className))];
  let classesPanel = "";

  if (activeClasses.length === 0) {
    classesPanel = UI.Panel({
      title: "Ei osallistujia",
      style: "margin-bottom: 30px;"
    }, `<p class="muted">Lisää osallistujia kilpailuun Osallistujat-välilehden tai Pilottirekisterin kautta, jotta voit aloittaa heat-ryhmien arvonnan.</p>`);
  } else {
    const activeTab = state.settings?.adminDashboardClassTab && activeClasses.includes(state.settings.adminDashboardClassTab) 
      ? state.settings.adminDashboardClassTab 
      : activeClasses[0];

    const tabNavigation = `
      <div class="ui-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
        ${activeClasses.map(className => `
          <button type="button" class="button ${activeTab === className ? 'primary' : 'dashed'}" data-action="set-admin-dashboard-tab" data-tab="${escapeHtml(className)}">${escapeHtml(className)}</button>
        `).join('')}
      </div>
    `;

    const className = activeTab;
    const classEntries = eventEntries.filter(e => e.className === className);
    const classHeats = eventHeats.filter(h => h.className === className);
    const latestRound = classHeats.length > 0 ? Math.max(...classHeats.map(h => Number(h.round) || 1)) : 0;
    const heatsInLatestRound = classHeats.filter(h => Number(h.round) === latestRound);
    
    // Calculate total expected rounds (e.g., from format)
    // For mockup, let's assume format has qualifyingRounds
    const format = activeEvent.classFormats?.[className] || { qualifyingRounds: 3 };
    const totalRounds = format.qualifyingRounds || 3;

    const classScorecardsCount = state.scoreCards?.filter(sc => classEntries.some(e => e.id === sc.entryId)).length || 0;
    const completedScorecards = state.scoreCards?.filter(sc => classEntries.some(e => e.id === sc.entryId) && sc.updatedAt).length || 0;

    const hasEnoughPilots = classEntries.length >= 2;

    classesPanel = `
      <div style="margin-bottom: 30px;">
        <div class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">LUOKAT</div>
        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem;">Luokat, rakenne ja heat-arvonta</h3>
        
        ${tabNavigation}
        
        <div style="background: var(--surface-2); padding: 25px; border-radius: 8px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <div class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">LUOKKA</div>
              <h2 style="margin: 0; font-size: 1.8rem;">${escapeHtml(className)}</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
              <span style="font-size: 0.75rem; padding: 4px 10px; border: 1px solid var(--success); color: var(--success); border-radius: 20px; font-weight: 600;">Seuraava vaihe valmis</span>
              <button class="button small outline" style="font-size: 0.75rem;">Muokkaa rakennetta</button>
            </div>
          </div>
          
          <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 15px; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 20px;">
            <div>
              <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">${classEntries.length}</div>
              <div class="muted" style="font-size: 0.8rem;">pilottia</div>
            </div>
            <div>
              <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">${latestRound}/${totalRounds}</div>
              <div class="muted" style="font-size: 0.8rem;">alkuerää</div>
            </div>
            <div>
              <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">${classHeats.length}</div>
              <div class="muted" style="font-size: 0.8rem;">heatiä</div>
            </div>
            <div>
              <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">${classScorecardsCount}</div>
              <div class="muted" style="font-size: 0.8rem;">tuloskorttia</div>
            </div>
          </div>

          <div style="background: rgba(0,0,0,0.2); border-radius: 4px; padding: 12px 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.85rem;">Alkuerät</span>
            <span style="font-size: 0.85rem; font-weight: 600;">${completedScorecards}/${classScorecardsCount} tulosta</span>
          </div>

          <div style="font-size: 0.85rem; margin-bottom: 10px;">
            Seuraava vaihe: Arvo alkuerä ${latestRound + 1}
          </div>

          <div style="display: flex; gap: 10px;">
            ${hasEnoughPilots ? 
              UI.Button({ label: `Arvo alkuerä ${latestRound + 1}`, action: "generate-class-heats", class: className, variant: "primary", style: "flex: 1; justify-content: center;" })
              : `<button class="button primary disabled" style="flex: 1; justify-content: center;" disabled>Tarvitaan vähintään 2 pilottia</button>`
            }
            <a href="#/heats" class="button outline" style="flex: 1; justify-content: center;">Näytä heatit</a>
            <a href="#/scorecards" class="button outline" style="flex: 1; justify-content: center;">Tuloskortit (${classScorecardsCount})</a>
            <a href="#/results" class="button outline" style="flex: 1; justify-content: center;">Tulosta</a>
          </div>
        </div>
      </div>
    `;
  }

  return [nextEventCard, headerPanel, workflowPanel, classesPanel].join("");
}
