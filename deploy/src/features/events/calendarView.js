import { escapeHtml, formatDate, formatDateRange } from "../../utils/html.js";
import { isAdmin } from "../../users/roles.js";
import { UI } from "../../ui/engine.js";

export function renderCalendarView(state) {
  const events = [...state.events].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const admin = isAdmin(state);
  const activeEvent = state.events.find((event) => event.id === state.activeEventId) || null;
  const nextEvent = events[0] || null;

  const topBanner = UI.HeroBanner({
    kicker: "Kisakalenteri",
    title: admin ? "Kilpailujen hallinta" : "Tulevat kilpailut",
    subtitle: admin
      ? "Luo uusi kilpailu, avaa aktiivinen tapahtuma hallintaan ja pidä koko kilpailukalenteri yhdellä silmäyksellä hallussa."
      : "Valitse kilpailu ja avaa siitä tiedotteet, heat-aikataulu tai julkaistut tulokset.",
    meta: renderBannerMeta(events, activeEvent, nextEvent, admin),
    actions: activeEvent
      ? `<div class="active-pill">${escapeHtml(activeEvent.name)} · ${formatDateRange(activeEvent.date, activeEvent.endDate)}</div>`
      : ""
  });

  const headerActions = admin
    ? UI.Button({ label: "+ Lisää kilpailu", action: "open-event-form", variant: "small primary", title: "Avaa kilpailun lisäysmodaali" })
    : "";

  const pageHeader = UI.PageHeader({
    kicker: "Kilpailuluettelo",
    title: "Kilpailut",
    subtitle: `${events.length} kilpailua tallennettuna`,
    headerActions
  });

  const rightPanel = UI.Panel({
    kicker: `${admin ? "Admin" : "Julkinen"} kalenteri`,
    title: "Tulevat ja tallennetut kilpailut"
  }, `
    <div class="card-list">
      ${events.map((event) => renderEventCard(state, event, state.activeEventId, admin)).join("")}
    </div>
  `);

  const modalHtml = admin && state.settings?.eventFormOpen ? renderEventModal() : "";

  return `
    ${topBanner}
    ${pageHeader}
    <section class="view">
      ${rightPanel}
    </section>
    ${modalHtml}
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
    ${UI.Input({ label: "Luokat", name: "classes", placeholder: "WW2, EPA" })}
    ${UI.Input({ label: "Julkinen tiedote", name: "publicNotice", placeholder: "Tervetuloa kisaan. Seuraa heat-aikataulua." })}
    ${UI.Button({ label: "Lisää kilpailu", type: "submit", variant: "primary" })}
  `;

  return UI.FormPanel({
    kicker: "Uusi kilpailu",
    title: "Lisää kisakalenteriin",
    action: "add-event"
  }, formContent);
}

function renderEventModal() {
  const formPanel = UI.FormPanel({
    action: "add-event",
    id: "event-form-modal",
    className: "event-modal-panel"
  }, `
    ${UI.Input({ label: "Nimi", name: "name", required: true, placeholder: "Jämi Aircombat 2026" })}
    ${UI.Input({ label: "Paikka", name: "location", required: true, placeholder: "Jämi, Suomi" })}
    ${UI.Grid({ columns: "1fr 1fr", gap: "10px", className: "form-grid-two" }, `
      ${UI.Input({ label: "Alkaa", name: "date", type: "date", required: true })}
      ${UI.Input({ label: "Päättyy", name: "endDate", type: "date" })}
    `)}
    ${UI.Input({ label: "Luokat", name: "classes", placeholder: "WW2, WWI, EPA" })}
    ${UI.Input({ label: "Julkinen tiedote", name: "publicNotice", placeholder: "Tervetuloa kisaan. Seuraa heat-aikataulua." })}
    <div class="ui-form-actions">
      ${UI.Button({ label: "Sulje", action: "close-event-form", variant: "small" })}
      ${UI.Button({ label: "Lisää kilpailu", type: "submit", variant: "primary" })}
    </div>
  `);

  return `
    <div class="app-modal-backdrop" data-action="close-event-form">
      <div class="app-modal-shell" role="dialog" aria-modal="true" aria-labelledby="event-modal-title" data-action="none">
        <div class="app-modal-topbar">
          <div>
            <p class="kicker">Kalenteri</p>
            <h3 id="event-modal-title">Lisää kilpailu</h3>
          </div>
          ${UI.Button({ label: "✕", action: "close-event-form", variant: "small", title: "Sulje" })}
        </div>
        ${formPanel}
      </div>
    </div>
  `;
}

function renderEventCard(state, event, activeEventId, admin) {
  const isActive = event.id === activeEventId;

  const adminActions = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      ${isActive
        ? UI.Badge({ label: "★ Aktiivinen", variant: "success" })
        : UI.Button({ label: "Aseta aktiiviseksi", action: "set-active-event-stay", eventId: event.id, variant: "small dashed" })
      }
      ${UI.Button({ label: "Työympäristö ➡", action: "open-event-workspace", eventId: event.id, variant: "small primary" })}
      ${UI.Button({ label: "Kilpailun tiedot", action: "open-event-info", eventId: event.id, variant: "small outline" })}
      ${UI.Button({ label: "Tulokset", action: "open-public-event-results", eventId: event.id, variant: "small outline" })}
      ${UI.Button({ label: "Poista kilpailu", action: "delete-event", eventId: event.id, variant: "small danger" })}
    </div>
  `;

  const publicActions = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      ${UI.Button({ label: "Avaa kilpailun tiedot ➡", action: "open-event-info", eventId: event.id, variant: "small primary" })}
    </div>
  `;

  const actions = admin ? adminActions : publicActions;

  const coatOfArmsHtml = event.eventInfo && event.eventInfo.coatOfArmsData
    ? `<div class="event-card-coat-of-arms"><img src="${escapeHtml(event.eventInfo.coatOfArmsData)}" alt="Vaakuna" /></div>`
    : "";

  return `
    <article class="event-card event-card-hub ${isActive ? "selected" : ""}">
      ${coatOfArmsHtml}
      <div class="event-card-main" style="flex: 1;">
        <p class="kicker">${formatDateRange(event.date, event.endDate)} · ${escapeHtml(event.status)}</p>
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
