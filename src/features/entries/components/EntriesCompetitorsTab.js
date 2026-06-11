import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";

export function renderWorkspaceCompetitorsTab(state, activeEvent, className, eventEntries) {
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
      aircraftName: aircraft.name || "No aircraft",
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
      <div class="ui-form-actions">
        ${UI.Button({ type: "button", action: "auto-number-inputs", label: "Numeroi aakkosjärjestyksessä", variant: "primary", saveLabel: t(state, "event_workspace.save_racenumbers") })}
      </div>
    ` : ''}
  `;

  return UI.FormPanel({ kicker: t(state, "event_workspace.step35"), title: t(state, "event_workspace.competitors_title").replace("{class}", escapeHtml(className)), action: "save-race-numbers" }, formContent);
}
