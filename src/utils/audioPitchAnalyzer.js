export class AudioPitchAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.processor = null;
    this.isRunning = false;
    this.onPitch = null;
    this.onWaveform = null;
    
    // For smoothing
    this.history = [];
    this.historySize = 10;
  }

  async start(onPitchCallback, onWaveformCallback) {
    if (this.isRunning) return;
    this.onPitch = onPitchCallback;
    this.onWaveform = onWaveformCallback;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Microphone source
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      // Low pass filter to remove high frequency noise (above 1000 Hz / 60,000 RPM)
      const lowPassFilter = this.audioContext.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = 1000;
      
      // High pass filter to remove rumble below 30 Hz (1,800 RPM)
      const highPassFilter = this.audioContext.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = 30;

      // Analyser node for getting time domain data
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.microphone.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(this.analyser);

      this.isRunning = true;
      this.history = [];
      this.updatePitch();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      throw new Error("Microphone access denied or not available.");
    }
  }

  stop() {
    this.isRunning = false;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.microphone && this.microphone.mediaStream) {
      this.microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
  }

  updatePitch() {
    if (!this.isRunning) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    
    // Pass raw buffer to waveform callback
    if (this.onWaveform) {
      this.onWaveform(buffer);
    }

    const freq = this.autoCorrelate(buffer, this.audioContext.sampleRate);
    
    if (freq !== -1) {
      this.history.push(freq);
      if (this.history.length > this.historySize) {
        this.history.shift();
      }
      
      // Calculate median for stability
      const sorted = [...this.history].sort((a, b) => a - b);
      const medianFreq = sorted[Math.floor(sorted.length / 2)];
      
      if (this.onPitch) {
        this.onPitch(medianFreq);
      }
    } else {
      // Not enough signal
      if (this.onPitch) {
        this.onPitch(null);
      }
    }

    requestAnimationFrame(this.updatePitch.bind(this));
  }

  autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
    
    for (let i = 0; i < SIZE; i++) {
      let val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Not enough signal

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    // Interpolation
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}
