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
let allFrequencies = []; // Track all valid frequencies for percentile calculation
let lastValidFreq = null;
let smoothingBuffer = [];
const HISTORY_SIZE = 300; // Approx 5 seconds at 60fps
const SMOOTHING_SIZE = 5;

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
      .speedo-gauge-wrapper {
        position: relative;
        width: 280px;
        height: 280px;
        margin-bottom: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .speedo-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg); /* Start from top */
        filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.2));
      }
      .speedo-track {
        fill: none;
        stroke: rgba(255, 255, 255, 0.05);
        stroke-width: 18;
      }
      .speedo-progress {
        fill: none;
        stroke: url(#speedoGradient);
        stroke-width: 18;
        stroke-linecap: round;
        stroke-dasharray: 754; /* 2 * PI * 120 (radius) = ~754 */
        stroke-dashoffset: 754;
        transition: stroke-dashoffset 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .speedo-gauge-wrapper.active .speedo-svg {
        filter: drop-shadow(0 0 25px rgba(239, 68, 68, 0.6));
      }
      .speedo-content {
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
      .speedo-value {
        font-size: 3.5rem;
        font-weight: 900;
        color: #fff;
        font-family: 'Inter', monospace;
        line-height: 1;
        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
      }
      .speedo-value.recording {
        color: #ef4444;
        text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
        animation: pulseText 1.5s infinite alternate;
      }
      @keyframes pulseText {
        0% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      .speedo-unit {
        font-size: 1.1rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-top: 5px;
        font-weight: 600;
      }
      .speedo-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        width: 280px;
        padding-top: 20px;
        font-size: 0.9rem;
        color: #64748b;
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
      
      <div id="speedo-gauge-wrapper" class="speedo-gauge-wrapper">
        <svg class="speedo-svg" viewBox="0 0 280 280">
          <defs>
            <linearGradient id="speedoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="50%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#ef4444" />
            </linearGradient>
          </defs>
          <circle class="speedo-track" cx="140" cy="140" r="120"></circle>
          <circle id="speedo-progress" class="speedo-progress" cx="140" cy="140" r="120"></circle>
        </svg>
        <div class="speedo-content">
          <div id="speedo-value" class="speedo-value">---</div>
          <div class="speedo-unit">km/h</div>
        </div>
      </div>
      
      <div class="speedo-stats">
        <div class="speedo-stat-item">
          <span>MAX PITCH</span>
          <span id="speedo-max-pitch" class="speedo-stat-val" style="color:#e2e8f0; font-weight:bold;">--- Hz</span>
        </div>
        <div class="speedo-stat-item" style="text-align: right;">
          <span>MIN PITCH</span>
          <span id="speedo-min-pitch" class="speedo-stat-val" style="color:#e2e8f0; font-weight:bold;">--- Hz</span>
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
        valueDisplay.classList.remove("recording");
        const gaugeWrapper = document.getElementById("speedo-gauge-wrapper");
        if (gaugeWrapper) gaugeWrapper.classList.remove("active");
        
        const gaugeProgress = document.getElementById("speedo-progress");
        
        // Calculate final speed using percentiles
        if (allFrequencies.length > 20) {
          allFrequencies.sort((a, b) => a - b);
          // 95th percentile for max (approaching), 5th percentile for min (departing)
          maxFreq = allFrequencies[Math.floor(allFrequencies.length * 0.95)];
          minFreq = allFrequencies[Math.floor(allFrequencies.length * 0.05)];
          
          if (maxPitchDisplay) maxPitchDisplay.textContent = Math.round(maxFreq) + " Hz";
          if (minPitchDisplay) minPitchDisplay.textContent = Math.round(minFreq) + " Hz";
          
          // v = c * (f_high - f_low) / (f_high + f_low)
          const v_ms = SPEED_OF_SOUND * (maxFreq - minFreq) / (maxFreq + minFreq);
          const v_kmh = v_ms * 3.6;
          valueDisplay.textContent = Math.round(v_kmh);
          
          if (gaugeProgress) {
            const maxKmh = 350; // Assume max display is 350km/h
            const percentage = Math.min(Math.max(v_kmh / maxKmh, 0), 1);
            const offset = 754 - (percentage * 754);
            gaugeProgress.style.strokeDashoffset = offset;
          }
        } else {
          valueDisplay.textContent = "ERR";
          if (gaugeProgress) {
            gaugeProgress.style.strokeDashoffset = 754;
          }
        }
        
        return;
      }

      // Start recording
      try {
        isRecording = true;
        maxFreq = 0;
        minFreq = Infinity;
        freqHistory = new Array(HISTORY_SIZE).fill(null);
        allFrequencies = [];
        lastValidFreq = null;
        smoothingBuffer = [];
        
        valueDisplay.textContent = "REC";
        valueDisplay.classList.add("recording");
        const gaugeWrapper = document.getElementById("speedo-gauge-wrapper");
        if (gaugeWrapper) gaugeWrapper.classList.add("active");
        const gaugeProgress = document.getElementById("speedo-progress");
        if (gaugeProgress) gaugeProgress.style.strokeDashoffset = 754;
        
        maxPitchDisplay.textContent = "--- Hz";
        minPitchDisplay.textContent = "--- Hz";
        
        startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: text-bottom;"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg> ' + t(state, "speedometer.stop", "Stop Recording");
        startBtn.classList.remove("primary");
        startBtn.classList.add("danger");
        
        await pitchAnalyzer.start(
          (freq) => {
            let validFreq = null;
            
            if (freq && freq > 100 && freq < 1000) { // Reasonable engine harmonic range
              if (lastValidFreq !== null) {
                const diffRatio = Math.abs(freq - lastValidFreq) / lastValidFreq;
                if (diffRatio < 0.15) { // Reject sudden jumps > 15% (e.g. octave errors)
                  validFreq = freq;
                  lastValidFreq = freq;
                } else {
                  // Jump too large, likely noise
                }
              } else {
                validFreq = freq;
                lastValidFreq = freq;
              }
            } else {
              lastValidFreq = null; // Lost tracking
            }
            
            if (validFreq !== null) {
              // Moving average
              smoothingBuffer.push(validFreq);
              if (smoothingBuffer.length > SMOOTHING_SIZE) smoothingBuffer.shift();
              
              const smoothedFreq = smoothingBuffer.reduce((a, b) => a + b, 0) / smoothingBuffer.length;
              allFrequencies.push(smoothedFreq);
              
              if (smoothedFreq > maxFreq) {
                maxFreq = smoothedFreq;
                if (maxPitchDisplay) maxPitchDisplay.textContent = Math.round(maxFreq) + " Hz";
              }
              if (smoothedFreq < minFreq) {
                minFreq = smoothedFreq;
                if (minPitchDisplay) minPitchDisplay.textContent = Math.round(minFreq) + " Hz";
              }
              
              freqHistory.push(smoothedFreq);
              if (freqHistory.length > HISTORY_SIZE) freqHistory.shift();
            } else {
              smoothingBuffer = [];
              freqHistory.push(null);
              if (freqHistory.length > HISTORY_SIZE) freqHistory.shift();
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
