import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";
import { AudioPitchAnalyzer } from "../../utils/audioPitchAnalyzer.js";

// Global instances
let pitchAnalyzer = null;
let canvasCtx = null;
let isRecording = false;
let maxFreq = 0;
let minFreq = Infinity;
let freqHistory = []; // Track recent frequencies to plot
const HISTORY_SIZE = 300; // Approx 5 seconds at 60fps

// Speed of sound at ~20°C in m/s
const SPEED_OF_SOUND = 343;

export function unmountSpeedometer() {
  if (pitchAnalyzer) {
    pitchAnalyzer.stop();
    pitchAnalyzer = null;
  }
  isRecording = false;
}

export function renderSpeedometerView(state) {
  const styles = `
    <style>
      .speedo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px 10px;
      }
      .speedo-display {
        text-align: center;
        margin-bottom: 30px;
        padding: 30px;
        background: radial-gradient(circle, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%);
        border: 2px solid rgba(59, 130, 246, 0.4);
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(59, 130, 246, 0.2);
        width: 100%;
        max-width: 400px;
      }
      .speedo-value {
        font-size: 4rem;
        font-weight: 900;
        color: #fff;
        font-family: 'Inter', monospace;
        line-height: 1;
        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        transition: color 0.3s;
      }
      .speedo-value.active {
        color: #3b82f6;
        text-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
      }
      .speedo-unit {
        font-size: 1.2rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 10px;
        font-weight: 600;
      }
      .speedo-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
        font-size: 0.9rem;
        color: #64748b;
      }
      .speedo-stat-item {
        display: flex;
        flex-direction: column;
      }
      .speedo-stat-val {
        font-weight: 700;
        color: #e2e8f0;
      }
      .speedo-controls {
        display: flex;
        gap: 15px;
        margin-bottom: 30px;
        justify-content: center;
      }
      .speedo-canvas-wrapper {
        width: 100%;
        max-width: 600px;
        height: 150px;
        background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
        border: 1px solid rgba(59,130,246,0.3);
        border-radius: 12px;
        margin-top: 20px;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.3);
        position: relative;
        overflow: hidden;
      }
      .speedo-canvas {
        width: 100%;
        height: 100%;
      }
    </style>
  `;

  const panelContent = `
    ${styles}
    <div class="speedo-container">
      
      <div class="speedo-display">
        <div id="speedo-value" class="speedo-value">---</div>
        <div class="speedo-unit">km/h</div>
        <div class="speedo-stats">
          <div class="speedo-stat-item">
            <span>MAX PITCH</span>
            <span id="speedo-max-pitch" class="speedo-stat-val">--- Hz</span>
          </div>
          <div class="speedo-stat-item" style="text-align: right;">
            <span>MIN PITCH</span>
            <span id="speedo-min-pitch" class="speedo-stat-val">--- Hz</span>
          </div>
        </div>
      </div>

      <div class="speedo-controls">
        <button id="speedo-start-btn" class="app-btn primary" style="border-radius: 30px; padding: 12px 30px; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
          ${t(state, "speedometer.start", "Start Recording")}
        </button>
      </div>
      
      <p style="color: #94a3b8; text-align: center; max-width: 450px; font-size: 0.95rem; line-height: 1.5;">
        ${t(state, "speedometer.help_text", "Stand safely aside. Press Start as the plane approaches, and press Stop after it has passed by.")}
      </p>

      <div class="speedo-canvas-wrapper">
        <canvas id="speedo-canvas" class="speedo-canvas"></canvas>
        <div style="position: absolute; top: 5px; left: 10px; font-size: 0.7rem; color: #64748b; font-weight: bold;">PITCH HISTORY</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const startBtn = document.getElementById("speedo-start-btn");
    const valueDisplay = document.getElementById("speedo-value");
    const maxPitchDisplay = document.getElementById("speedo-max-pitch");
    const minPitchDisplay = document.getElementById("speedo-min-pitch");
    const canvas = document.getElementById("speedo-canvas");
    
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      canvasCtx = canvas.getContext("2d");
    }

    startBtn.addEventListener("click", async () => {
      if (!pitchAnalyzer) {
        pitchAnalyzer = new AudioPitchAnalyzer();
      }

      if (isRecording) {
        // Stop recording
        pitchAnalyzer.stop();
        isRecording = false;
        
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> ' + t(state, "speedometer.start", "Start Recording");
        startBtn.classList.remove("danger");
        startBtn.classList.add("primary");
        valueDisplay.classList.remove("active");
        
        // Calculate final speed
        if (maxFreq > 0 && minFreq < Infinity && maxFreq > minFreq) {
          // v = c * (f_high - f_low) / (f_high + f_low)
          const v_ms = SPEED_OF_SOUND * (maxFreq - minFreq) / (maxFreq + minFreq);
          const v_kmh = v_ms * 3.6;
          valueDisplay.textContent = Math.round(v_kmh);
        } else {
          valueDisplay.textContent = "ERR";
        }
        
        return;
      }

      // Start recording
      try {
        isRecording = true;
        maxFreq = 0;
        minFreq = Infinity;
        freqHistory = new Array(HISTORY_SIZE).fill(null);
        
        valueDisplay.textContent = "---";
        valueDisplay.classList.add("active");
        maxPitchDisplay.textContent = "--- Hz";
        minPitchDisplay.textContent = "--- Hz";
        
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg> ' + t(state, "speedometer.stop", "Stop Recording");
        startBtn.classList.remove("primary");
        startBtn.classList.add("danger");
        
        await pitchAnalyzer.start(
          (freq) => {
            // Push to history array
            freqHistory.push(freq);
            if (freqHistory.length > HISTORY_SIZE) {
              freqHistory.shift();
            }
            
            if (freq && freq > 100 && freq < 1000) { // Reasonable engine harmonic range
              if (freq > maxFreq) {
                maxFreq = freq;
                maxPitchDisplay.textContent = Math.round(maxFreq) + " Hz";
              }
              if (freq < minFreq) {
                minFreq = freq;
                minPitchDisplay.textContent = Math.round(minFreq) + " Hz";
              }
            }
            
            // Draw history
            if (!canvasCtx || !canvas) return;
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            canvasCtx.lineWidth = 1;
            canvasCtx.beginPath();
            for(let i=1; i<4; i++) {
              canvasCtx.moveTo(0, canvas.height * (i/4));
              canvasCtx.lineTo(canvas.width, canvas.height * (i/4));
            }
            canvasCtx.stroke();
            
            // Draw line
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = '#ef4444'; // Red for recording
            canvasCtx.lineWidth = 3;
            canvasCtx.lineJoin = 'round';
            
            const sliceWidth = canvas.width / HISTORY_SIZE;
            let x = 0;
            
            // Fixed scale for visual consistency: 100Hz to 600Hz usually
            const MIN_Y_FREQ = 100;
            const MAX_Y_FREQ = 800;
            const RANGE = MAX_Y_FREQ - MIN_Y_FREQ;
            
            let firstValid = true;
            for (let i = 0; i < HISTORY_SIZE; i++) {
              const f = freqHistory[i];
              if (f && f > MIN_Y_FREQ && f < MAX_Y_FREQ) {
                const normalizedF = (f - MIN_Y_FREQ) / RANGE;
                const y = canvas.height - (normalizedF * canvas.height);
                
                if (firstValid) {
                  canvasCtx.moveTo(x, y);
                  firstValid = false;
                } else {
                  canvasCtx.lineTo(x, y);
                }
              } else {
                firstValid = true; // Break line
              }
              x += sliceWidth;
            }
            canvasCtx.stroke();
          },
          (waveform) => {
            // We ignore waveform for speedometer to save performance
          }
        );
      } catch (err) {
        alert(t(state, "speedometer.mic_error", "Microphone access denied or error occurred."));
        isRecording = false;
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> ' + t(state, "speedometer.start", "Start Recording");
      }
    });
    
  }, 50);

  return `
    <div style="max-width: 800px; margin: 0 auto; padding-bottom: 50px; padding-top: 20px;">
      ${UI.Panel({ title: t(state, "speedometer.panel_title", "Measure Speed") }, panelContent)}
    </div>
  `;
}
