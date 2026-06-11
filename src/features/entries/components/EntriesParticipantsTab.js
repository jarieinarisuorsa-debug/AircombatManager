import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";
import { buildParticipantRows } from "../../../logic/participants.js";
export function renderWorkspaceParticipantsTab(state, activeEvent, className) {
  const participantRows = buildParticipantRows(state, activeEvent);
  const classRows = participantRows.filter(r => r.className === className);
  const enrolledPilotIds = new Set(classRows.map(r => r.pilotId));
  
  const pilots = [...state.pilots].sort((a, b) => a.name.localeCompare(b.name, "fi"));
  const uniqueCountries = [...new Set(pilots.map(p => String(p.country || "").trim().toUpperCase()).filter(Boolean))].sort();
  
  const searchQuery = (state.settings?.workspacePilotSearch || "").toLowerCase().trim();
  const countryFilter = (state.settings?.workspacePilotCountryFilter || "").toLowerCase();

  const searchContainer = UI.Flex({ justify: "flex-start", align: "center", wrap: "wrap", gap: "15px", className: "pilot-search-container", style: "margin-bottom: 20px;" }, `
    <div class="search-input-wrapper" style="width: 300px; max-width: 100%; display: flex;">
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
          <select class="ui-input quick-aircraft-select-class" style="padding: 2px 30px 2px 6px; max-width: 150px; font-size: 0.9em; height: 32px;">
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
