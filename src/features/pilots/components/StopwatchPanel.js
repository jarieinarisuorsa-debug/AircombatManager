import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { buildScoreCardRows, getScoreCardStructureStages } from "../../../logic/scoreCards.js";

export function renderStopwatchPanel(state, pilot, activeEvent) {
  if (!activeEvent) {
    return UI.Panel({ title: t(state, "stopwatch.no_active_event") }, `<p class='muted'>${t(state, "stopwatch.no_event_msg")}</p>`);
  }

  // Find pilot's registered classes
  const entries = state.entries.filter(e => e.eventId === activeEvent.id && e.pilotId === pilot.id);
  if (entries.length === 0) {
    return UI.Panel({ title: t(state, "stopwatch.no_entries") }, `<p class='muted'>${t(state, "stopwatch.no_entries_msg")}</p>`);
  }

  const activeClass = state.settings?.stopwatchActiveClassName || entries[0].className;
  const entry = entries.find(e => e.className === activeClass) || entries[0];
  
  // Find scorecard for the active class to get the correct stages
  const rows = buildScoreCardRows(state, activeEvent);
  const myRow = rows.find(r => r.entry.id === entry.id);
  const stages = myRow ? getScoreCardStructureStages({ card: myRow.card, event: activeEvent, entry: myRow.entry, aircraft: myRow.aircraft }) : [];

  if (stages.length === 0) {
    return UI.Panel({ title: t(state, "stopwatch.waiting_draw") }, `<p class='muted'>${t(state, "stopwatch.waiting_draw_msg")}</p>`);
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

  const classButtons = entries.map(e => `
    <button type="button" class="button ${e.className === activeClass ? 'primary' : ''}" style="flex: 1; padding: 8px 12px; font-size: 0.85rem; border-radius: 8px; border: none; background: ${e.className === activeClass ? 'var(--primary-color)' : 'transparent'}; color: ${e.className === activeClass ? '#fff' : 'var(--muted)'}; font-weight: bold;" data-action="set-stopwatch-class" data-class="${escapeHtml(e.className)}">${escapeHtml(e.className)}</button>
  `).join("");

  const stageButtons = stages.map(stage => `
    <button type="button" class="button ${stage.roundNumber === activeStageRoundNumber ? 'primary' : ''}" style="flex: 1; min-width: 60px; padding: 8px 12px; font-size: 0.85rem; border-radius: 8px; border: none; background: ${stage.roundNumber === activeStageRoundNumber ? 'var(--primary-color)' : 'transparent'}; color: ${stage.roundNumber === activeStageRoundNumber ? '#fff' : 'var(--muted)'}; font-weight: bold;" data-action="set-stopwatch-stage" data-round="${stage.roundNumber}">${escapeHtml(stage.label)}</button>
  `).join("");

  return `
    <div style="max-width: 420px; margin: 20px auto; background: linear-gradient(145deg, #111a24, #0a1016); border-radius: 24px; border: 1px solid rgba(88, 183, 255, 0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05); overflow: hidden;">
      <div style="padding: 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.03); background: rgba(0,0,0,0.2);">
        <h3 style="margin: 0; font-size: 1.05rem; color: var(--muted); display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase; letter-spacing: 2px;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary-color)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${t(state, "stopwatch.flight_time")}
        </h3>
      </div>
      
      <div style="padding: 24px;">
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            ${classButtons}
          </div>
          <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); overflow-x: auto;">
            ${stageButtons}
          </div>
        </div>

        <div style="background: #05080a; border-radius: 16px; padding: 25px 15px; text-align: center; border: 2px solid #1a242f; box-shadow: inset 0 0 30px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.2); position: relative; margin-bottom: 24px;">
          <div style="position: absolute; top: 12px; left: 16px; font-size: 0.65rem; color: rgba(74, 222, 128, 0.4); text-transform: uppercase; font-family: sans-serif; letter-spacing: 2px;">Timer</div>
          <div style="position: absolute; top: 12px; right: 16px; font-size: 0.65rem; color: rgba(74, 222, 128, 0.4); text-transform: uppercase; font-family: sans-serif; letter-spacing: 2px;">Min : Sec</div>
          
          <div id="stopwatch-display" style="font-family: 'Courier New', monospace; font-size: 5rem; font-weight: 900; letter-spacing: -3px; color: #4ade80; text-shadow: 0 0 15px rgba(74, 222, 128, 0.4), 0 0 30px rgba(74, 222, 128, 0.2); line-height: 1; margin-top: 10px;">${displayValue}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <button type="button" style="background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.25); border-radius: 12px; padding: 16px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.2s ease;" data-action="start-stopwatch" onmouseover="this.style.background='rgba(74, 222, 128, 0.2)'" onmouseout="this.style.background='rgba(74, 222, 128, 0.1)'">${t(state, "stopwatch.start")}</button>
          <button type="button" style="background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.25); border-radius: 12px; padding: 16px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.2s ease;" data-action="stop-stopwatch" onmouseover="this.style.background='rgba(248, 113, 113, 0.2)'" onmouseout="this.style.background='rgba(248, 113, 113, 0.1)'">${t(state, "stopwatch.stop")}</button>
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <button type="button" class="button" style="background: transparent; color: var(--muted); border: 1px dashed var(--border); border-radius: 20px; padding: 6px 16px; font-size: 0.8rem;" data-action="reset-stopwatch">${t(state, "stopwatch.reset")}</button>
        </div>

        <button type="button" class="button primary" style="width: 100%; border-radius: 12px; padding: 18px; font-size: 1.05rem; font-weight: bold; box-shadow: 0 4px 15px rgba(88, 183, 255, 0.3); border: none;" data-action="transfer-stopwatch-time" data-entry-id="${entry.id}" data-round="${activeStageRoundNumber}">${t(state, "stopwatch.save_to_card")}</button>
      </div>
    </div>
    <script>
      if (window.__stopwatchRunning && !window.__stopwatchInterval) {
        window.__stopwatchInterval = setInterval(() => {
          const ms = Date.now() - window.__stopwatchStart;
          window.__stopwatchAccumulated = ms;
          const display = document.getElementById("stopwatch-display");
          if (display) {
            const totalSecs = Math.floor(ms / 1000);
            const minsVal = Math.floor(totalSecs / 60);
            const secsVal = totalSecs % 60;
            const mins = minsVal.toString().padStart(2, "0");
            const secs = secsVal.toString().padStart(2, "0");
            display.textContent = \`\${mins}:\${secs}\`;
            
            if (minsVal > 0 && secsVal === 0 && window.__stopwatchLastSpokenMinute !== minsVal) {
              window.__stopwatchLastSpokenMinute = minsVal;
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(\`\${minsVal} minute\${minsVal > 1 ? 's' : ''}\`);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
              }
            }
          }
        }, 100);
      }
    </script>
  `;
}
