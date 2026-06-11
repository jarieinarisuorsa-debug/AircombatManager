import { escapeHtml, byName, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

export function renderPilotsView(state) {
  const activeEvent = getActiveEvent(state);
  const eventEntries = activeEvent ? state.entries.filter(e => e.eventId === activeEvent.id) : [];
  const eventClasses = activeEvent ? (activeEvent.classes?.length ? activeEvent.classes : [t(state, "pilots.general_class")]) : [];

  const pilots = [...state.pilots].sort(byName);
  const uniqueCountries = [...new Set(pilots.map(p => String(p.country || "").trim().toUpperCase()).filter(Boolean))].sort();
  const searchQuery = (state.settings?.pilotSearchQuery || "").toLowerCase().trim();
  const countryFilter = (state.settings?.pilotCountryFilter || "").toLowerCase();

  const renderTableRow = (pilot, pilotPlanes) => {
    const name = String(pilot.name || "").toLowerCase();
    const club = String(pilot.club || "").toLowerCase();
    const countryStr = String(pilot.country || "").toLowerCase();

    const matchesSearch = !searchQuery || name.includes(searchQuery) || club.includes(searchQuery) || countryStr.includes(searchQuery);
    const matchesCountry = !countryFilter || countryStr === countryFilter;
    const isHidden = !(matchesSearch && matchesCountry);

    return UI.TableRow({
      className: "pilot-table-row clickable-row",
      dataAttrs: {
        action: "open-pilot-card",
        pilotId: pilot.id,
        name: pilot.name,
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
        `${pilotPlanes.length} ${t(state, "pilots.qty")}`,
        `${UI.Flex({ gap: "6px", align: "center" }, `
          <button class="button primary small" data-action="open-pilot-card" data-pilot-id="${pilot.id}" style="font-weight: 600;">${t(state, "pilots.pilot_card")}</button>
          <button class="button danger small" data-action="delete-pilot" data-pilot-id="${pilot.id}" style="padding: 0 10px; font-size: 1.1rem; background: transparent; border-color: transparent;" title="${t(state, "pilots.delete_pilot")}">🗑️</button>
        `)}`
      ]
    });
  };



  const searchContainer = UI.Flex({ justify: "flex-start", align: "center", wrap: "wrap", gap: "15px", className: "pilot-search-container", style: "margin-bottom: 20px;" }, `
    <div class="search-input-wrapper" style="width: 300px; max-width: 100%; display: flex;">
      <input type="search" id="pilot-search" value="${escapeHtml(state.settings?.pilotSearchQuery || "")}" placeholder="${t(state, "pilots.search_placeholder")}" autocomplete="off" style="flex: 1; width: 100%; min-height: 34px; padding: 6px 12px 6px 36px; border-radius: 8px;" />
    </div>
    ${UI.Select({ 
      id: "pilot-country-filter", 
      value: (state.settings?.pilotCountryFilter || "").toUpperCase(),
      options: [{value: "", label: t(state, "pilots.all_countries")}, ...uniqueCountries],
      style: "width: auto; min-height: 34px; padding: 6px 36px 6px 12px; border-radius: 8px;" 
    })}
  `);

  const pilotsList = `
    ${UI.TableContainer({
      content: UI.Table({
        headers: [t(state, "pilots.col_name"), t(state, "pilots.col_country_club"), t(state, "pilots.col_aircraft"), t(state, "pilots.col_actions")],
        rows: pilots.map(pilot => {
          const pilotPlanes = state.aircraft.filter((a) => a.pilotId === pilot.id);
          return renderTableRow(pilot, pilotPlanes);
        })
      })
    })}
    ${pilots.length === 0 ? `<p class="muted" style="margin-top: 15px;">${t(state, "pilots.no_pilots")}</p>` : ""}
  `;

  const actions = `
    <div style="display: flex; gap: 10px;" class="no-print">
      <a class="button primary" href="#/pilot/new">${t(state, "pilots.new_pilot")}</a>
    </div>
  `;

  return `
    ${UI.Panel({}, `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <div>
          <p class="kicker">${t(state, "pilots.register_kicker")}</p>
          <h4 style="margin: 0; display: flex; align-items: center; gap: 10px;">
            ${t(state, "pilots.all_pilots_title")}
            <span class="badge badge-info" style="font-size: 0.85rem; padding: 4px 10px; border-radius: 999px;">${pilots.length} ${t(state, "pilots.competitors_count")}</span>
          </h4>
        </div>
        ${actions}
      </div>
      ${searchContainer}
      ${pilotsList}
    `)}
  `;
}
