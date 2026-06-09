import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { buildParticipantRows } from "../../logic/participants.js";
import { getClassStageStatus, getCompetitionFormatForClass } from "../../logic/competitionFormat.js";
import { renderClassHeatSection } from "../heats/heatsView.js";
import { buildScoreCardRows } from "../../logic/scoreCards.js";
import { renderScoreCardList } from "../scorecards/components/ScoreCardList.js";
import { buildCompetitionResults, isCompetitionResultsPublished } from "../../logic/competitionResults.js";
import { renderResultsTable } from "../results/resultsView.js";
import { isAdmin } from "../../users/roles.js";
import { t } from "../../utils/i18n.js";

export function renderEntriesView(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) {
    return UI.PageHeader({
      kicker: t(state, "event_workspace.kicker_build"),
      title: t(state, "event_workspace.no_active_event"),
      subtitle: t(state, "event_workspace.open_from_calendar")
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

  const tabNav = `
    <nav class="sub-nav no-print" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px;">
      <button type="button" class="button ${tab === 'ilmoittautumiset' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="ilmoittautumiset">${t(state, "event_workspace.tab_registrations")}</button>
      <button type="button" class="button ${tab === 'luokka' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="luokka">${t(state, "event_workspace.tab_class")}</button>
      <button type="button" class="button ${tab === 'rakenne' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="rakenne">${t(state, "event_workspace.tab_format")}</button>
      <button type="button" class="button ${tab === 'osallistujat' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="osallistujat">${t(state, "event_workspace.tab_all_pilots")}</button>
      <button type="button" class="button ${tab === 'kilpailijat' ? 'primary' : 'dashed'}" data-action="set-workspace-tab" data-tab="kilpailijat">${t(state, "event_workspace.tab_competitors")}</button>
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

function getWorkspaceClasses(activeEvent, eventEntries) {
  const classes = new Set(activeEvent.classes || []);
  eventEntries.forEach((entry) => {
    if (entry.className) classes.add(entry.className);
  });
  return [...classes].filter(Boolean);
}

function renderWorkspaceRegistrationsTab(state, activeEvent) {
  const registrations = state.registrations?.filter(r => r.eventId === activeEvent.id) || [];
  
  if (registrations.length === 0) {
    return UI.Panel({ title: t(state, "event_workspace.tab_registrations") }, `<p class='muted'>${t(state, "event_workspace.no_registrations")}</p>`);
  }

  // Sort: pending first, then newest first
  registrations.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  const listHtml = registrations.map(reg => {
    const pilot = state.pilots.find(p => p.id === reg.pilotId);
    if (!pilot) return "";

    const statusLabel = reg.status === "pending" ? t(state, "event_workspace.pending_approval") : (reg.status === "approved" ? t(state, "event_workspace.approved") : t(state, "event_workspace.rejected"));
    const statusColor = reg.status === "pending" ? "var(--warning, #fbbf24)" : (reg.status === "approved" ? "var(--success, #22c55e)" : "var(--danger, #ef4444)");
    const textColor = reg.status === "pending" ? "#000" : "#fff";
    
    // Convert to local time string if createdAt exists
    const timeStr = reg.createdAt ? new Date(reg.createdAt).toLocaleString(state.settings.language === 'fi' ? "fi-FI" : "en-US") : "";

    return `
      <div style="border: 1px solid var(--border); border-radius: 6px; padding: 15px; margin-bottom: 10px; background: rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="margin: 0 0 5px 0;">${escapeHtml(pilot.name)} <span class="badge" style="background: ${statusColor}; color: ${textColor}; font-size: 0.8rem; margin-left: 10px; padding: 3px 6px;">${statusLabel}</span></h4>
            <div class="muted" style="font-size: 0.9rem; margin-bottom: 8px;">
              ${escapeHtml(pilot.email || "-")} · ${escapeHtml(pilot.club || "-")} ${pilot.country ? UI.CountryFlag(pilot.country) : ""}
            </div>
            <div style="font-size: 0.95rem;">
              <strong>${t(state, "event_workspace.classes_label")}:</strong> ${reg.classes.map(escapeHtml).join(", ")}<br>
              <strong>${t(state, "event_workspace.payment_label")}:</strong> ${reg.paymentIntent === 'paid_in_advance' ? t(state, "event_workspace.paid_in_advance") : t(state, "event_workspace.paid_on_site")}<br>
              ${timeStr ? `<span class="muted" style="font-size: 0.85rem;">${t(state, "event_workspace.enrolled_at")}: ${timeStr}</span>` : ""}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-direction: column; min-width: 150px;">
            ${reg.status === 'pending' ? `
              <button type="button" class="button success small" data-action="approve-registration" data-reg-id="${escapeHtml(reg.id)}">${t(state, "event_workspace.approve")}</button>
              <button type="button" class="button danger small" data-action="reject-registration" data-reg-id="${escapeHtml(reg.id)}">${t(state, "event_workspace.reject")}</button>
            ` : ""}
            <button type="button" class="button dashed small" data-action="open-pilot-card" data-pilot-id="${escapeHtml(pilot.id)}">${t(state, "event_workspace.open_pilot_card")}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return UI.Panel({ kicker: t(state, "event_workspace.entire_event"), title: t(state, "event_workspace.queue_title").replace("{count}", pendingCount) }, listHtml);
}

function renderWorkspaceClassTab(state, activeEvent, classNames, activeClassName, eventEntries) {
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

function renderWorkspaceFormatTab(state, activeEvent, className) {
  const format = getCompetitionFormatForClass(activeEvent, className);
  
  const formContent = `
    <input type="hidden" name="formatClassName" value="${escapeHtml(className)}" />
    ${UI.Input({ label: t(state, "event_workspace.qualifying_rounds"), name: "qualifyingRounds", type: "number", min: "1", max: "20", step: "1", value: format.qualifyingRounds })}
    <label class="check-row"><input type="checkbox" name="semiFinalEnabled" ${format.semiFinalEnabled ? "checked" : ""} /> ${t(state, "event_workspace.semi_enabled")}</label>
    ${UI.Input({ label: t(state, "event_workspace.semi_count"), name: "semiFinalists", type: "number", min: "2", max: "200", step: "1", value: format.semiFinalists })}
    <label class="check-row"><input type="checkbox" name="finalEnabled" ${format.finalEnabled ? "checked" : ""} /> ${t(state, "event_workspace.final_enabled")}</label>
    ${UI.Input({ label: t(state, "event_workspace.final_count"), name: "finalists", type: "number", min: "2", max: "200", step: "1", value: format.finalists })}
    <p class="muted" style="margin: 15px 0;">${t(state, "event_workspace.format_desc")}</p>
    ${UI.Button({ label: t(state, "event_workspace.save_format"), type: "submit", variant: "primary" })}
  `;

  return UI.FormPanel({ kicker: t(state, "event_workspace.step2"), title: t(state, "event_workspace.format_title").replace("{class}", escapeHtml(className)), action: "save-competition-format" }, formContent);
}

function renderWorkspaceParticipantsTab(state, activeEvent, className) {
  const participantRows = buildParticipantRows(state, activeEvent);
  const classRows = participantRows.filter(r => r.className === className);
  const enrolledPilotIds = new Set(classRows.map(r => r.pilotId));
  
  const pilots = [...state.pilots].sort((a, b) => a.name.localeCompare(b.name, "fi"));
  const uniqueCountries = [...new Set(pilots.map(p => String(p.country || "").trim().toUpperCase()).filter(Boolean))].sort();
  
  const searchQuery = (state.settings?.workspacePilotSearch || "").toLowerCase().trim();
  const countryFilter = (state.settings?.workspacePilotCountryFilter || "").toLowerCase();

  const searchContainer = UI.Flex({ justify: "space-between", align: "center", wrap: "wrap", gap: "10px", className: "pilot-search-container", style: "margin-bottom: 20px;" }, `
    <div class="search-input-wrapper" style="flex: 1; min-width: 200px; max-width: 300px; display: flex;">
      <input type="search" id="workspace-pilot-search" value="${escapeHtml(state.settings?.workspacePilotSearch || "")}" placeholder="${t(state, "event_workspace.search_pilot_placeholder")}" autocomplete="off" style="flex: 1; width: 100%; min-height: 34px; padding: 6px 12px 6px 36px; border-radius: 8px;" />
    </div>
    ${UI.Select({ 
      id: "workspace-pilot-country-filter", 
      value: (state.settings?.workspacePilotCountryFilter || "").toUpperCase(),
      options: [{value: "", label: t(state, "event_workspace.all_countries")}, ...uniqueCountries.map(c => ({value: c, label: c}))],
      style: "width: auto; min-height: 34px; padding: 6px 36px 6px 12px; border-radius: 8px;"
    })}
  `);

  const rowsHtml = pilots.map(pilot => {
    const name = String(pilot.name || "").toLowerCase();
    const club = String(pilot.club || "").toLowerCase();
    const countryStr = String(pilot.country || "").toLowerCase();

    const matchesSearch = !searchQuery || name.includes(searchQuery) || club.includes(searchQuery) || countryStr.includes(searchQuery);
    const matchesCountry = !countryFilter || countryStr === countryFilter;
    const isHidden = !(matchesSearch && matchesCountry);

    const isEnrolled = enrolledPilotIds.has(pilot.id);
    const enrolledRow = isEnrolled ? classRows.find(r => r.pilotId === pilot.id) : null;

    let aircraftCell = "";
    let statusCell = "";
    let actionsCell = "";

    if (isEnrolled) {
      aircraftCell = escapeHtml(enrolledRow.aircraftName || t(state, "event_workspace.no_aircraft"));
      statusCell = `<span style="color: var(--success); font-weight: bold;">✓ ${t(state, "event_workspace.approved")}</span>`;
      actionsCell = UI.Flex({ gap: "6px", align: "center" }, `
        ${UI.Button({ label: t(state, "event_workspace.open_pilot_card"), action: "open-pilot-card", pilotId: pilot.id, variant: "dashed small" })}
        ${UI.Button({ label: t(state, "entries_view.remove_class"), action: "delete-entry", entryId: enrolledRow.id, variant: "danger small" })}
      `);
    } else {
      const matchingPlanes = state.aircraft.filter(a => a.pilotId === pilot.id && a.className === className);
      let actionBtn = "";
      if (matchingPlanes.length === 0) {
        aircraftCell = `<span class="muted" style="font-size: 0.85em; color: var(--warning);">⚠ ${t(state, "event_workspace.no_aircraft")} (${escapeHtml(className)})</span>`;
        actionBtn = `<button class="button small primary" data-action="quick-add-class-entry" data-pilot-id="${pilot.id}" data-class-name="${escapeHtml(className)}" data-aircraft-id="">${t(state, "event_workspace.enroll_create_aircraft")}</button>`;
      } else if (matchingPlanes.length === 1) {
        aircraftCell = escapeHtml(matchingPlanes[0].name);
        actionBtn = `<button class="button small primary" data-action="quick-add-class-entry" data-pilot-id="${pilot.id}" data-class-name="${escapeHtml(className)}" data-aircraft-id="${matchingPlanes[0].id}">${t(state, "event_workspace.enroll")}</button>`;
      } else {
        aircraftCell = `
          <select class="ui-input quick-aircraft-select-class" style="padding: 2px; max-width: 150px; font-size: 0.9em; height: 32px;">
            ${matchingPlanes.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}
          </select>
        `;
        actionBtn = `<button class="button small primary" data-action="quick-add-class-select-entry" data-pilot-id="${pilot.id}" data-class-name="${escapeHtml(className)}">${t(state, "event_workspace.enroll")}</button>`;
      }
      
      statusCell = `<span class="muted">-</span>`;
      actionsCell = UI.Flex({ gap: "6px", align: "center" }, `
        ${UI.Button({ label: t(state, "event_workspace.open_pilot_card"), action: "open-pilot-card", pilotId: pilot.id, variant: "dashed small" })}
        ${actionBtn}
      `);
    }

    return UI.TableRow({
      className: "pilot-table-row clickable-row",
      dataAttrs: {
        action: "open-pilot-card",
        pilotId: pilot.id,
        name: pilot.name || "",
        club: pilot.club || "",
        country: pilot.country || ""
      },
      style: `border-bottom: 1px solid var(--border); cursor: pointer; transition: background-color 0.2s; ${isHidden ? "display: none;" : ""}`,
      cells: [
        UI.Flex({ gap: "10px" }, `
          ${pilot.avatarData || pilot.avatarUrl ? 
            `<div style="width: 32px; height: 32px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 1px solid var(--border); flex-shrink: 0;"></div>` : 
            `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface-2); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; border: 1px dashed var(--border); flex-shrink: 0;">${escapeHtml(pilot.name.charAt(0))}</div>`
          }
          <strong>${escapeHtml(pilot.name)}</strong>
        `),
        `${pilot.country ? UI.CountryFlag(pilot.country) : ""}
         ${pilot.club ? `<span class="muted" style="margin-left: 6px;">${escapeHtml(pilot.club)}</span>` : ""}`,
        aircraftCell,
        statusCell,
        actionsCell
      ]
    });
  });

  const listHtml = UI.TableContainer({
    content: UI.Table({
      headers: [t(state, "event_workspace.table_name"), t(state, "event_workspace.table_country_club"), t(state, "event_workspace.table_aircraft"), t(state, "event_workspace.table_status"), t(state, "event_workspace.table_actions")],
      rows: rowsHtml
    })
  });

  return UI.Panel({ kicker: t(state, "event_workspace.step3"), title: t(state, "event_workspace.participants_title").replace("{class}", escapeHtml(className)) }, `
    ${searchContainer}
    ${listHtml}
  `);
}

function renderWorkspaceHeatsTab(state, activeEvent, className) {
  const entries = state.entries.filter((entry) => entry.eventId === activeEvent.id);
  const heats = state.heats.filter((heat) => heat.eventId === activeEvent.id && heat.className === className);
  
  const classEntries = entries.filter((entry) => entry.className === className);
  const status = getClassStageStatus({ event: activeEvent, className, classEntries, classHeats: heats, results: state.results, state });

  const admin = isAdmin(state);
  const generateBtn = UI.Button({
    label: status.nextLabel || t(state, "event_workspace.draw_next_phase"),
    action: "generate-class-heats",
    class: className,
    variant: "primary",
    disabled: !status.canGenerate || !status.nextPhase
  });

  const printBtn = heats.length > 0 ? UI.Button({ label: t(state, "event_workspace.print_heats"), action: "print-class-heats", class: className, variant: "dashed", style: "margin-left: 10px;" }) : "";
  const cancelBtn = heats.length > 0 && admin ? UI.Button({ label: t(state, "event_workspace.cancel_draw"), action: "cancel-class-heats", class: className, variant: "danger dashed", style: "margin-left: 10px;" }) : "";

  let nextPhaseStatusStr = t(state, "event_workspace.all_phases_done");
  if (status.nextPhase) {
    if (status.advancingCount) {
      nextPhaseStatusStr = t(state, "event_workspace.next_phase_count").replace("{label}", escapeHtml(status.nextLabel)).replace("{count}", status.advancingCount);
    } else {
      nextPhaseStatusStr = t(state, "event_workspace.next_phase_all").replace("{label}", escapeHtml(status.nextLabel));
    }
  }

  const controls = `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
      <p class="muted" style="margin-bottom: 10px;">${status.disabledReason || nextPhaseStatusStr}</p>
      ${generateBtn}
      ${printBtn}
      ${cancelBtn}
    </div>
  `;

  return UI.Panel({ kicker: t(state, "event_workspace.step4"), title: t(state, "event_workspace.heats_title").replace("{class}", escapeHtml(className)) }, `
    ${controls}
    ${heats.length ? renderClassHeatSection(state, activeEvent, entries, className, heats, admin) : `<p class='muted'>${t(state, "event_workspace.no_heats")}</p>`}
  `);
}

function renderWorkspaceScorecardsTab(state, activeEvent, className) {
  const allRows = buildScoreCardRows(state, activeEvent);
  const rows = allRows.filter((row) => String(row.className).trim().toLowerCase() === className.toLowerCase());
  
  if (!rows.length) return UI.Panel({ title: t(state, "event_workspace.no_scorecards_title") }, `<p class='muted'>${t(state, "event_workspace.no_scorecards_msg")}</p>`);

  return UI.Panel({ kicker: t(state, "event_workspace.step5"), title: t(state, "event_workspace.scorecards_title").replace("{class}", escapeHtml(className)) }, renderScoreCardList(state, activeEvent, rows, className));
}

function renderWorkspaceResultsTab(state, activeEvent, className) {
  const compResults = buildCompetitionResults(state, activeEvent);
  
  const group = compResults.classGroups.find(g => g.className === className);
  if (!group || group.rows.length === 0) {
    return UI.Panel({ title: t(state, "event_workspace.no_results_title") }, `<p class='muted'>${t(state, "event_workspace.no_results_msg")}</p>`);
  }

  const rows = group.rows.map((row, index) => ({ ...row, classPosition: index + 1 }));
  const tableHtml = renderResultsTable(state, rows, false, true);

  const published = isCompetitionResultsPublished(activeEvent);
  const publishBtn = !published 
    ? UI.Button({ label: t(state, "event_workspace.publish_results"), action: "publish-competition-results", variant: "primary" })
    : UI.Button({ label: t(state, "event_workspace.hide_results"), action: "unpublish-competition-results", variant: "danger" });

  const statusText = published ? t(state, "event_workspace.status_published") : t(state, "event_workspace.status_draft");

  return UI.Panel({ kicker: t(state, "event_workspace.step6"), title: t(state, "event_workspace.results_title").replace("{class}", escapeHtml(className)) }, `
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <strong>${statusText}</strong>
      ${publishBtn}
    </div>
    ${tableHtml}
  `);
}

function renderWorkspaceCompetitorsTab(state, activeEvent, className, eventEntries) {
  const classEntries = eventEntries.filter(e => e.className === className);
  
  const classRows = classEntries.map(entry => {
    const pilot = state.pilots.find(p => p.id === entry.pilotId) || {};
    const aircraft = state.aircraft.find(a => a.id === entry.aircraftId) || {};
    return {
      pilotId: pilot.id,
      pilotName: pilot.name || "",
      pilotCountry: pilot.country || "",
      pilotClub: pilot.club || "",
      pilotImage: pilot.image || "",
      aircraftName: aircraft.name || "Ei konekorttia",
      raceNumber: entry.raceNumber || ""
    };
  }).sort((a, b) => {
    const numA = parseInt(a.raceNumber, 10);
    const numB = parseInt(b.raceNumber, 10);
    const validA = !isNaN(numA) && a.raceNumber !== "";
    const validB = !isNaN(numB) && b.raceNumber !== "";
    if (validA && validB) return numA - numB;
    if (validA) return -1;
    if (validB) return 1;
    return a.pilotName.localeCompare(b.pilotName, "fi");
  });

  // Calculate automatic numbers "top to bottom" for the form inputs
  let nextAvailableNumber = 1;
  const usedNumbers = new Set(eventEntries.map(e => parseInt(e.raceNumber, 10)).filter(n => !isNaN(n)));

  classRows.forEach(row => {
    const pilotEntries = eventEntries.filter(e => e.pilotId === row.pilotId);
    const existingNumber = pilotEntries.find(e => e.raceNumber)?.raceNumber;
    
    if (existingNumber) {
      row.displayRaceNumber = existingNumber;
    } else {
      while (usedNumbers.has(nextAvailableNumber)) {
        nextAvailableNumber++;
      }
      row.displayRaceNumber = String(nextAvailableNumber);
      usedNumbers.add(nextAvailableNumber);
    }
  });

  const formContent = `
    <input type="hidden" name="eventId" value="${escapeHtml(activeEvent.id)}" />
    
    ${UI.Table({
      headers: [t(state, "event_workspace.table_name"), t(state, "event_workspace.table_country_club"), t(state, "event_workspace.table_aircraft"), t(state, "event_workspace.table_racenumber")],
      rows: classRows.map(row => {
        return UI.TableRow({
          className: "pilot-table-row",
          cells: [
            UI.Flex({ gap: "10px", align: "center" }, `
              <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: var(--text-secondary);">
                ${row.pilotImage ? `<img src="${row.pilotImage}" style="width: 100%; height: 100%; object-fit: cover;">` : (row.pilotName || "?").charAt(0).toUpperCase()}
              </div>
              <span style="font-weight: 500;">${escapeHtml(row.pilotName)}</span>
            `),
            UI.Flex({ gap: "6px", align: "center" }, `
              ${row.pilotCountry ? UI.CountryFlag(row.pilotCountry) : ''}
              <span>${escapeHtml(row.pilotClub)}</span>
            `),
            escapeHtml(row.aircraftName),
            `<input type="text" class="ui-input" name="raceNumber_${row.pilotId}" value="${escapeHtml(row.displayRaceNumber)}" style="max-width: 80px; text-align: center; font-weight: bold;" placeholder="#" />`
          ]
        });
      })
    })}
    
    ${classRows.length === 0 ? `<p class="muted" style="padding: 20px; text-align: center;">${t(state, "event_workspace.no_competitors")}</p>` : ''}
    
    ${classRows.length > 0 ? `
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <button type="submit" class="button primary">${t(state, "event_workspace.save_racenumbers")}</button>
      </div>
    ` : ''}
  `;

  return UI.FormPanel({ kicker: t(state, "event_workspace.step35"), title: t(state, "event_workspace.competitors_title").replace("{class}", escapeHtml(className)), action: "save-race-numbers" }, formContent);
}
