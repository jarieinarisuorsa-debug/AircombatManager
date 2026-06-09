import { escapeHtml, formatDate, formatDateRange } from "../../utils/html.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";

export function renderCalendarView(state) {
  const admin = isAdmin(state);
  
  const getYear = (dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/\d{4}/);
    if (match) {
      const yr = parseInt(match[0], 10);
      if (yr >= 2000 && yr <= 2100) return yr;
    }
    return null;
  };

  const allYearsSet = new Set();
  state.events.forEach(e => {
    const yr = getYear(e.date);
    if (yr) allYearsSet.add(yr);
  });
  
  const allYears = Array.from(allYearsSet).sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear);

  let selectedYear = window.CALENDAR_YEAR || currentYear;
  if (!allYears.includes(selectedYear)) selectedYear = allYears[0];

  const events = state.events.filter(e => getYear(e.date) === selectedYear)
    .sort((a, b) => {
      const orderA = a.eventInfo?.orderIndex !== undefined ? a.eventInfo.orderIndex : 99999;
      const orderB = b.eventInfo?.orderIndex !== undefined ? b.eventInfo.orderIndex : 99999;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.date).localeCompare(String(b.date));
    });

  const activeEvent = state.events.find((event) => event.id === state.activeEventId) || null;
  const nextEvent = events[0] || null;

  const headerActions = admin
    ? UI.Button({ label: "+ Lisää kilpailu", action: "open-event-form", variant: "small primary", title: "Avaa kilpailun lisäysmodaali" })
    : "";

  const yearTabs = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      ${allYears.map(year => `
        <button type="button" class="button ${selectedYear === year ? 'primary' : 'dashed'}" data-action="set-calendar-year" data-year="${year}">${year}</button>
      `).join("")}
    </div>
  `;

  const rightPanel = UI.Panel({
    kicker: `${admin ? "Admin" : "Julkinen"} kalenteri`,
    title: "Tulevat ja tallennetut kilpailut",
    headerActions
  }, `
    ${yearTabs}
    <div class="card-list">
      ${events.length ? events.map((event) => renderEventCard(state, event, state.activeEventId, admin)).join("") : `<p class="muted">Tälle vuodelle ei ole merkitty kilpailuja.</p>`}
    </div>
  `);

  if (admin && state.settings?.eventFormOpen) {
    return `
      <section class="view">
        ${renderEventForm()}
      </section>
    `;
  }

  return `
    <section class="view">
      ${rightPanel}
    </section>
  `;
}



function renderBannerMeta(events, activeEvent, nextEvent, admin) {
  return [
    UI.Badge({ label: `${events.length} kilpailua`, variant: "info" }),
    UI.Badge({ label: admin ? "Admin-tila" : "Julkinen näkymä", variant: admin ? "warning" : "ok" }),
    activeEvent
      ? UI.Badge({ label: `Aktiivinen: ${activeEvent.name}`, variant: "country" })
      : UI.Badge({ label: "Ei aktiivista kilpailua", variant: "info" }),
    nextEvent
      ? UI.Badge({ label: `Seuraava: ${formatDate(nextEvent.date)}`, variant: "info" })
      : ""
  ].join("");
}

function renderEventForm() {
  const formContent = `
    ${UI.Input({ label: "Nimi", name: "name", required: true, placeholder: "Jämi Aircombat 2026" })}
    ${UI.Input({ label: "Paikka", name: "location", required: true, placeholder: "Jämi, Suomi" })}
    ${UI.Grid({ columns: "1fr 1fr", gap: "10px", className: "form-grid-two" }, `
      ${UI.Input({ label: "Alkaa", name: "date", type: "date", required: true })}
      ${UI.Input({ label: "Päättyy", name: "endDate", type: "date" })}
    `)}
    <fieldset style="border: 1px solid var(--border); padding: 10px 15px; border-radius: 6px; margin-bottom: 15px;">
      <legend style="font-weight: 600; padding: 0 5px; color: var(--text-color);">Luokat</legend>
      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; margin: 0; cursor: pointer;">
          <input type="checkbox" name="classes" value="WWII" checked> WWII
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; margin: 0; cursor: pointer;">
          <input type="checkbox" name="classes" value="WWI"> WWI
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; margin: 0; cursor: pointer;">
          <input type="checkbox" name="classes" value="EPA"> EPA
        </label>
      </div>
    </fieldset>
    ${UI.Input({ label: "Julkinen tiedote", name: "publicNotice", placeholder: "Tervetuloa kisaan. Seuraa heat-aikataulua." })}
    <div class="ui-form-actions" style="margin-top: 20px;">
      ${UI.Button({ label: "Peruuta", action: "close-event-form", variant: "outline" })}
      ${UI.Button({ label: "Tallenna", type: "submit", variant: "primary" })}
    </div>
  `;

  return UI.FormPanel({
    kicker: "Kalenteri",
    title: "Lisää kilpailu",
    action: "add-event",
    id: "event-form-modal"
  }, formContent);
}


function renderEventCard(state, event, activeEventId, admin) {
  const isActive = event.id === activeEventId;

  const adminActions = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      ${isActive
        ? UI.Badge({ label: "★ Aktiivinen", variant: "success" })
        : UI.Button({ label: "Aseta aktiiviseksi", action: "set-active-event-stay", eventId: event.id, variant: "small dashed" })
      }
      ${UI.Button({ label: "Rakenna kilpailu ➡", action: "open-event-workspace", eventId: event.id, variant: "small primary" })}
      ${UI.Button({ label: "Kilpailun tiedot", action: "open-event-info", eventId: event.id, variant: "small outline" })}
      ${UI.Button({ label: "Tulokset", action: "open-public-event-results", eventId: event.id, variant: "small outline" })}
      <div style="display: flex; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-left: auto;">
        ${UI.Button({ label: "⬆", action: "move-event-up", eventId: event.id, variant: "small", style: "border: none; border-radius: 0; border-right: 1px solid var(--border);", title: "Siirrä ylemmäs" })}
        ${UI.Button({ label: "⬇", action: "move-event-down", eventId: event.id, variant: "small", style: "border: none; border-radius: 0;", title: "Siirrä alemmas" })}
      </div>
      ${UI.Button({ label: "Poista kilpailu", action: "delete-event", eventId: event.id, variant: "small danger" })}
    </div>
  `;

  let statusText = event.status;
  if (event.status === "results_published") statusText = "Päättynyt (Tulokset)";
  else if (event.status === "active") statusText = "Käynnissä";
  else if (event.status === "published") statusText = "Julkaistu";
  else if (event.status === "draft") statusText = "Luonnos";

  const publicActions = `
    <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
      ${UI.Button({ label: "Avaa kilpailun tiedot ➡", action: "open-event-info", eventId: event.id, variant: "small primary", style: "flex: 1; width: auto; justify-content: center; padding-left: 4px; padding-right: 4px;" })}
      ${event.status === "results_published" ? "" : `<a class="button small success" style="flex: 1; width: auto; justify-content: center; text-align: center; padding-left: 4px; padding-right: 4px;" href="#/mypilotcard">Ilmoittaudu</a>`}
    </div>
  `;

  const actions = admin ? adminActions : publicActions;

  const coatOfArmsHtml = event.eventInfo && event.eventInfo.coatOfArmsData
    ? `<div class="event-card-coat-of-arms"><img src="${escapeHtml(event.eventInfo.coatOfArmsData)}" alt="Vaakuna" /></div>`
    : "";

  const cardAction = admin && isActive 
    ? "" 
    : `data-action="${admin ? "set-active-event-stay" : "open-event-info"}" data-event-id="${escapeHtml(event.id)}" style="cursor: pointer; transition: transform 0.2s;"`;

  return `
    <article class="event-card event-card-hub ${isActive ? "selected" : ""}" ${cardAction}>
      ${coatOfArmsHtml}
      <div class="event-card-main" style="flex: 1;">
        <p class="kicker">${formatDateRange(event.date, event.endDate)} · ${escapeHtml(statusText)}</p>
        <h4>${escapeHtml(event.name)}</h4>
        <p>${escapeHtml(event.location)}</p>
        <p class="muted">Luokat: ${(event.classes || []).map(escapeHtml).join(", ") || "-"}</p>
        ${event.publicNotice
          ? `<p class="notice-text compact">${escapeHtml(event.publicNotice)}</p>`
          : `<p class="muted compact-empty-notice">Ei julkaistuja tiedotteita.</p>`}
        ${(() => {
          if (admin) {
            const eventRegs = state.registrations?.filter(r => r.eventId === event.id) || [];
            if (eventRegs.length === 0) return "";
            
            const pendingCount = eventRegs.filter(r => r.status === "pending").length;
            const approvedCount = eventRegs.filter(r => r.status === "approved").length;
            
            if (pendingCount === 0 && approvedCount === 0) return "";
            
            const badges = [];
            if (pendingCount > 0) {
               badges.push(`<button type="button" class="badge" style="background: var(--warning, #fbbf24); color: #000; font-weight: bold; cursor: pointer; border: none; padding: 4px 8px; border-radius: 4px;" data-action="open-event-workspace-tab" data-event-id="${escapeHtml(event.id)}" data-tab="ilmoittautumiset">${pendingCount} odottaa hyväksyntää</button>`);
            }
            if (approvedCount > 0) {
               badges.push(UI.Badge({ label: `${approvedCount} ilmoittautunutta`, variant: "success" }));
            }
            return `<div style="display: flex; gap: 8px; margin-top: 10px; margin-bottom: 5px;">${badges.join("")}</div>`;
          } else {
            const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
            if (!userEmail) return "";
            
            const myPilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
            if (!myPilot) return "";
            
            const myReg = state.registrations?.find(r => r.eventId === event.id && r.pilotId === myPilot.id);
            if (!myReg) return "";
            
            const statusLabel = myReg.status === "pending" ? "Oma tila: Odottaa hyväksyntää" : (myReg.status === "approved" ? "Oma tila: Hyväksytty" : "Oma tila: Hylätty");
            const variant = myReg.status === "pending" ? "warning" : (myReg.status === "approved" ? "success" : "danger");
            return `<div style="margin-top: 10px; margin-bottom: 5px;">${UI.Badge({ label: statusLabel, variant })}</div>`;
          }
        })()}
      </div>
      <div class="row-actions event-card-actions" style="flex-direction: column; align-items: flex-start; gap: 10px;">
        ${actions}
      </div>
    </article>
  `;
}
