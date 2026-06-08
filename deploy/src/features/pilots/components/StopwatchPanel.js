import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { buildScoreCardRows, getScoreCardStructureStages } from "../../../logic/scoreCards.js";

export function renderStopwatchPanel(state, pilot, activeEvent) {
  if (!activeEvent) {
    return UI.Panel({ title: "Ei aktiivista kilpailua" }, "<p class='muted'>Sekuntikello vaatii aktiivisen kilpailun.</p>");
  }

  // Find pilot's registered classes
  const entries = state.entries.filter(e => e.eventId === activeEvent.id && e.pilotId === pilot.id);
  if (entries.length === 0) {
    return UI.Panel({ title: "Ei ilmoittautumisia" }, "<p class='muted'>Et ole ilmoittautunut mihinkään luokkaan tässä kilpailussa.</p>");
  }

  const activeClass = state.settings?.stopwatchActiveClassName || entries[0].className;
  const entry = entries.find(e => e.className === activeClass) || entries[0];
  
  // Find scorecard for the active class to get the correct stages
  const rows = buildScoreCardRows(state, activeEvent);
  const myRow = rows.find(r => r.entry.id === entry.id);
  const stages = myRow ? getScoreCardStructureStages({ card: myRow.card, event: activeEvent, entry: myRow.entry, aircraft: myRow.aircraft }) : [];

  if (stages.length === 0) {
    return UI.Panel({ title: "Odottaa arvontaa" }, "<p class='muted'>Kilpailun eriä ei ole vielä arvottu.</p>");
  }

  const activeStageRoundNumber = state.settings?.stopwatchActiveRoundNumber || stages[0].roundNumber;

  // Initial display value based on window.__stopwatchAccumulated
  let displayValue = "00:00";
  if (window.__stopwatchAccumulated) {
    const totalSecs = Math.floor(window.__stopwatchAccumulated / 1000);
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    displayValue = `${mins}:${secs}`;
  }

  // Render Class Selector
  const classButtons = entries.map(e => `
    <button type="button" class="button ${e.className === activeClass ? 'primary' : 'dashed'}" data-action="set-stopwatch-class" data-class="${escapeHtml(e.className)}">${escapeHtml(e.className)}</button>
  `).join("");

  // Render Stage Selector
  const stageButtons = stages.map(stage => `
    <button type="button" class="button ${stage.roundNumber === activeStageRoundNumber ? 'primary' : 'dashed'}" data-action="set-stopwatch-stage" data-round="${stage.roundNumber}">${escapeHtml(stage.label)}</button>
  `).join("");

  return UI.Panel({ kicker: "Mittaa lentoaika", title: "Sekuntikello", className: "stopwatch-panel" }, `
    <div style="margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px; font-size: 0.9rem; color: var(--muted);">1. Valitse luokka</h4>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">${classButtons}</div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px; font-size: 0.9rem; color: var(--muted);">2. Valitse erä/finaali</h4>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">${stageButtons}</div>
    </div>

    <div style="background: rgba(0,0,0,0.2); padding: 40px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 2px solid var(--border);">
      <div id="stopwatch-display" style="font-size: 5rem; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: var(--primary); margin-bottom: 30px; line-height: 1; text-shadow: 0 0 20px rgba(88, 183, 255, 0.4);">${displayValue}</div>
      
      <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="button success" style="font-size: 1.2rem; padding: 12px 25px; min-width: 140px;" data-action="start-stopwatch">Käynnistä</button>
        <button type="button" class="button danger" style="font-size: 1.2rem; padding: 12px 25px; min-width: 140px;" data-action="stop-stopwatch">Pysäytä</button>
        <button type="button" class="button dashed" style="font-size: 1.1rem; padding: 12px 20px;" data-action="reset-stopwatch">Nollaa</button>
      </div>
    </div>

    <div style="text-align: center; max-width: 500px; margin: 0 auto;">
      <button type="button" class="button primary" style="font-size: 1.2rem; padding: 15px 30px; width: 100%; box-shadow: 0 4px 15px rgba(88, 183, 255, 0.3);" data-action="transfer-stopwatch-time" data-entry-id="${entry.id}" data-round="${activeStageRoundNumber}">Siirrä tuloskortille</button>
      <p class="muted" style="margin-top: 15px; font-size: 0.9rem;">Aika siirtyy valitun luokan ja erän tuloskorttiin. Järjestelmä laskee lentopisteet automaattisesti.</p>
    </div>

    <script>
      // Restart interval if it was running and the UI was re-rendered
      if (window.__stopwatchRunning && !window.__stopwatchInterval) {
        window.__stopwatchInterval = setInterval(() => {
          const ms = Date.now() - window.__stopwatchStart;
          window.__stopwatchAccumulated = ms;
          const display = document.getElementById("stopwatch-display");
          if (display) {
            const totalSecs = Math.floor(ms / 1000);
            const mins = Math.floor(totalSecs / 60).toString().padStart(2, "0");
            const secs = (totalSecs % 60).toString().padStart(2, "0");
            display.textContent = \`\${mins}:\${secs}\`;
          }
        }, 100);
      }
    </script>
  `);
}
