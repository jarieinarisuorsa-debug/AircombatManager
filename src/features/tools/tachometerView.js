import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";
import { AudioPitchAnalyzer } from "../../utils/audioPitchAnalyzer.js";

// Global instance so we can manage its lifecycle safely
let pitchAnalyzer = null;
let canvasCtx = null;
let animationFrameId = null;

// Clean up function if the user navigates away
export function unmountTachometer() {
  if (pitchAnalyzer) {
    pitchAnalyzer.stop();
    pitchAnalyzer = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function renderTachometerView(state) {
  const styles = `
    <style>
      .tacho-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px 10px;
      }
      .tacho-gauge-wrapper {
        position: relative;
        width: 280px;
        height: 280px;
        margin-bottom: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .tacho-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg); /* Start from top */
        filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.2));
      }
      .tacho-track {
        fill: none;
        stroke: rgba(255, 255, 255, 0.05);
        stroke-width: 18;
      }
      .tacho-progress {
        fill: none;
        stroke: url(#gaugeGradient);
        stroke-width: 18;
        stroke-linecap: round;
        stroke-dasharray: 754; /* 2 * PI * 120 (radius) = ~754 */
        stroke-dashoffset: 754;
        transition: stroke-dashoffset 0.15s ease-out;
      }
      .tacho-gauge-wrapper.active .tacho-svg {
        filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.6));
      }
      .tacho-content {
        position: relative;
        z-index: 2;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%);
        box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.4);
        border: 2px solid rgba(255,255,255,0.05);
      }
      .tacho-value {
        font-size: 3.5rem;
        font-weight: 900;
        color: #fff;
        font-family: 'Inter', monospace;
        line-height: 1;
        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
      }
      .tacho-unit {
        font-size: 1.1rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-top: 5px;
        font-weight: 600;
      }
      .tacho-max {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 15px;
      }
      .tacho-controls {
        display: flex;
        gap: 15px;
        margin-bottom: 30px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .tacho-canvas {
        width: 100%;
        max-width: 600px;
        height: 120px;
        background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
        border: 1px solid rgba(59,130,246,0.3);
        border-radius: 12px;
        margin-top: 20px;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.3);
      }
      .multiplier-select {
        padding: 12px 16px;
        border-radius: 30px;
        background: rgba(30, 41, 59, 0.8);
        color: var(--text);
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 1rem;
        font-weight: 500;
        backdrop-filter: blur(10px);
        outline: none;
      }
    </style>
  `;

  const pageHeader = UI.PageHeader({
    kicker: t(state, "nav.tools", "Tools"),
    title: t(state, "tachometer.title", "Acoustic Tachometer")
  });

  const panelContent = `
    ${styles}
    <div class="tacho-container">
      <div id="tacho-gauge-wrapper" class="tacho-gauge-wrapper">
        <svg class="tacho-svg" viewBox="0 0 280 280">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="50%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#ef4444" />
            </linearGradient>
          </defs>
          <circle class="tacho-track" cx="140" cy="140" r="120"></circle>
          <circle id="tacho-progress" class="tacho-progress" cx="140" cy="140" r="120"></circle>
        </svg>
        <div class="tacho-content">
          <div id="tacho-value" class="tacho-value">---</div>
          <div class="tacho-unit">RPM</div>
          <div class="tacho-max">MAX 30K</div>
        </div>
      </div>

      <div class="tacho-controls">
        <select id="tacho-multiplier" class="multiplier-select">
          <option value="60">${t(state, "tachometer.opt_2_stroke", "2-Stroke Engine (Exhaust)")}</option>
          <option value="120">${t(state, "tachometer.opt_4_stroke", "4-Stroke Engine (Exhaust)")}</option>
          <option value="30">${t(state, "tachometer.opt_2_blade", "Electric/Prop Noise (2-Blade)")}</option>
          <option value="20">${t(state, "tachometer.opt_3_blade", "Electric/Prop Noise (3-Blade)")}</option>
        </select>
        
        <button id="tacho-start-btn" class="app-btn primary" style="border-radius: 30px; padding: 12px 24px; font-weight: 700; letter-spacing: 0.5px;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
          ${t(state, "tachometer.start", "Start Measuring")}
        </button>
      </div>
      
      <p style="color: #94a3b8; text-align: center; max-width: 450px; font-size: 0.95rem; line-height: 1.5;">
        ${t(state, "tachometer.help_text", "Point your device's microphone towards the aircraft. For best results, stay close but safe.")}
      </p>

      <canvas id="tacho-canvas" class="tacho-canvas"></canvas>
    </div>
  `;

  // Attach logic after render
    setTimeout(() => {
    const startBtn = document.getElementById("tacho-start-btn");
    const valueDisplay = document.getElementById("tacho-value");
    const gaugeWrapper = document.getElementById("tacho-gauge-wrapper");
    const gaugeProgress = document.getElementById("tacho-progress");
    const multiplierSelect = document.getElementById("tacho-multiplier");
    const canvas = document.getElementById("tacho-canvas");
    
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      canvasCtx = canvas.getContext("2d");
    }

    startBtn.addEventListener("click", async () => {
      if (!pitchAnalyzer) {
        pitchAnalyzer = new AudioPitchAnalyzer();
      }

      if (pitchAnalyzer.isRunning) {
        pitchAnalyzer.stop();
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> ' + t(state, "tachometer.start", "Start Measuring");
        startBtn.classList.remove("danger");
        startBtn.classList.add("primary");
        gaugeWrapper.classList.remove("active");
        valueDisplay.textContent = "---";
        if(gaugeProgress) gaugeProgress.style.strokeDashoffset = "754";
        return;
      }

      try {
        startBtn.textContent = t(state, "tachometer.starting", "Starting...");
        
        await pitchAnalyzer.start(
          (freq) => {
            // Pitch update callback
            if (freq) {
              const multiplier = parseInt(multiplierSelect.value, 10);
              const rpm = Math.round(freq * multiplier);
              
              // Only update if it's a reasonable RPM (e.g. 1000 - 40000)
              if (rpm > 500 && rpm < 50000) {
                valueDisplay.textContent = rpm;
                
                // Update SVG progress bar (Max 30,000 RPM = 754 offset)
                if (gaugeProgress) {
                  const maxRpm = 30000;
                  const percentage = Math.min(Math.max(rpm / maxRpm, 0), 1);
                  const offset = 754 - (percentage * 754);
                  gaugeProgress.style.strokeDashoffset = offset;
                }
              }
            } else {
               // Optional: slowly decay the gauge when no signal? For now keep it.
            }
          },
          (waveform) => {
            // Waveform update callback
            if (!canvasCtx) return;
            canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.3)'; // Dark slate with low opacity for fade effect
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#3b82f6'; // Primary blue
            canvasCtx.beginPath();
            
            const sliceWidth = canvas.width * 1.0 / waveform.length;
            let x = 0;
            
            for (let i = 0; i < waveform.length; i++) {
              const v = waveform[i] * 0.8; // Scale
              const y = (v * canvas.height / 2) + (canvas.height / 2);
              
              if (i === 0) {
                canvasCtx.moveTo(x, y);
              } else {
                canvasCtx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            canvasCtx.stroke();
          }
        );
        
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg> ' + t(state, "tachometer.stop", "Stop Measuring");
        startBtn.classList.remove("primary");
        startBtn.classList.add("danger");
        gaugeWrapper.classList.add("active");
        
      } catch (err) {
        alert(t(state, "tachometer.mic_error", "Microphone access denied or error occurred."));
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> ' + t(state, "tachometer.start", "Start Measuring");
      }
    });
    
  }, 50);

  return `
    ${pageHeader}
    <div style="max-width: 800px; margin: 0 auto; padding-bottom: 50px;">
      ${UI.Panel({ title: t(state, "tachometer.panel_title", "Measure RPM") }, panelContent)}
    </div>
  `;
}
