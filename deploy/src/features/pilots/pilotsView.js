import { escapeHtml, byName, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";

export function renderPilotsView(state) {
  const activeEvent = getActiveEvent(state);
  const eventEntries = activeEvent ? state.entries.filter(e => e.eventId === activeEvent.id) : [];
  const eventClasses = activeEvent ? (activeEvent.classes?.length ? activeEvent.classes : ["Yleinen"]) : [];

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
      dataAttrs: {
        pilotId: pilot.id,
        name: pilot.name,
        club: pilot.club || "",
        country: pilot.country || ""
      },
      style: `border-bottom: 1px solid var(--border); ${isHidden ? "display: none;" : ""}`,
      cells: [
        UI.Flex({ gap: "10px" }, `
          ${pilot.avatarData || pilot.avatarUrl ? 
            `<div style="width: 32px; height: 32px; border-radius: 50%; background-image: url('${escapeHtml(pilot.avatarData || pilot.avatarUrl)}'); background-size: cover; background-position: center; border: 1px solid var(--border); flex-shrink: 0;"></div>` : 
            `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface-2); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; border: 1px dashed var(--border); flex-shrink: 0;">${escapeHtml(pilot.name.charAt(0))}</div>`
          }
          <strong>${escapeHtml(pilot.name)}</strong>
        `),
        `${pilot.country ? UI.Badge({ label: pilot.country, variant: "country" }) : ""}
         ${pilot.club ? `<span class="muted" style="margin-left: 6px;">${escapeHtml(pilot.club)}</span>` : ""}`,
        `${pilotPlanes.length} kpl`,
        `${UI.Flex({ gap: "6px", align: "center" }, `
          ${activeEvent ? (
            eventClasses.every(c => eventEntries.some(e => e.pilotId === pilot.id && e.className === c))
              ? `<span style="font-size: 0.8em; color: var(--success); margin-right: 4px; font-weight: bold;">✓ Ilmoitettu</span>`
              : UI.Button({ label: "Ilmoita kisaan", action: "enroll-pilot-all-classes", pilotId: pilot.id, variant: "success small" })
          ) : ""}
          ${UI.Button({ label: "Pilottikortti", action: "open-pilot-card", pilotId: pilot.id, variant: "dashed small" })}
          ${UI.Button({ label: "Poista", action: "delete-pilot", pilotId: pilot.id, variant: "danger small" })}
        `)}`
      ]
    });
  };



  const searchContainer = UI.Flex({ justify: "space-between", align: "center", wrap: "wrap", gap: "10px", className: "pilot-search-container", style: "margin-bottom: 20px;" }, `
    ${UI.Flex({ gap: "10px", style: "flex: 1; min-width: 300px;", className: "search-input-wrapper" }, `
      <input type="search" id="pilot-search" value="${escapeHtml(state.settings?.pilotSearchQuery || "")}" placeholder="Etsi nimellä tai seuralla..." autocomplete="off" style="flex: 1; max-width: 300px; min-height: 34px; padding: 6px 12px; border-radius: 8px;" />
      ${UI.Select({ 
        id: "pilot-country-filter", 
        value: (state.settings?.pilotCountryFilter || "").toUpperCase(),
        options: [{value: "", label: "Kaikki maat"}, ...uniqueCountries],
        style: "width: auto; min-height: 34px; padding: 6px 36px 6px 12px; border-radius: 8px;" 
      })}
    `)}
  `);

  const pilotsList = `
    ${UI.TableContainer({
      content: UI.Table({
        headers: ["Nimi", "Maa / Seura", "Koneet", "Toiminnot"],
        rows: pilots.map(pilot => {
          const pilotPlanes = state.aircraft.filter((a) => a.pilotId === pilot.id);
          return renderTableRow(pilot, pilotPlanes);
        })
      })
    })}
    ${pilots.length === 0 ? `<p class="muted" style="margin-top: 15px;">Ei rekisteröityjä pilotteja.</p>` : ""}
  `;

  const pageHeader = UI.PageHeader({
    kicker: "Pilottirekisteri",
    title: `${pilots.length} kilpailijaa`
  });

  const actions = `
    <div style="display: flex; gap: 10px;" class="no-print">
      ${activeEvent ? `<a class="button small" href="#/entries" style="display: flex; align-items: center;">⬅ Työympäristöön</a>` : ""}
      <a class="button primary" href="#/pilot/new">+ Uusi pilotti</a>
    </div>
  `;

  return `
    ${pageHeader}
    ${UI.Panel({}, `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <div>
          <p class="kicker">Luettelo</p>
          <h4 style="margin: 0;">Kaikki pilotit</h4>
        </div>
        ${actions}
      </div>
      ${searchContainer}
      ${pilotsList}
    `)}
  `;
}
