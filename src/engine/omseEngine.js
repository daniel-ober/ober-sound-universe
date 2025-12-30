// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * OMSE: Ober MotionSynth Engine
 *
 * Responsibilities:
 * - Core 3-layer voice (ground, harmony, atmos)
 * - Three Orbit voices (A/B/C)
 * - Master bus + meters + spectrum
 * - Orbit patterns for A, B, C
 * - Helper getters for UI meters & spectrum
 */

// Simple pattern configs per orbit
const ORBIT_PATTERN_CONFIG = {
  orbitA: {
    notes: ["C5", "E5", "G5", "B4"],
    interval: "8n",
    duration: "0.22",
  },
  orbitB: {
    notes: ["G4", "D5", "F4", "A4"],
    interval: "4n",
    duration: "0.3",
  },
  orbitC: {
    notes: ["C3", "G3", "D3", "A2"],
    interval: "2n",
    duration: "0.5",
  },
};

class OmseEngine {
  constructor() {
    this.started = false;

    // ----- MASTER BUS -----
    this.masterGain = new Tone.Gain(0.8);

    // Use FFT analysers; we'll derive RMS-like levels in code
    this.masterAnalyser = new Tone.Analyser("fft", 64);
    this.masterFFT = new Tone.Analyser("fft", 128);

    this.masterGain.connect(this.masterAnalyser);
    this.masterGain.connect(this.masterFFT);
    this.masterGain.toDestination();

    // ----- CORE LAYERS -----
    this.core = {
      layers: {
        ground: this._makeCoreLayer({
          octaveOffset: -12, // low foundation
          volume: -6,
          attack: 0.02,
          release: 0.6,
        }),
        harmony: this._makeCoreLayer({
          octaveOffset: 0, // mid body
          volume: -10,
          attack: 0.04,
          release: 0.8,
        }),
        atmos: this._makeCoreLayer({
          octaveOffset: 12, // air / shimmer
          volume: -16,
          attack: 0.4,
          release: 2.5,
        }),
      },
    };

    // ----- ORBITS -----
    this.orbits = {
      orbitA: this._makeOrbitVoice(),
      orbitB: this._makeOrbitVoice(),
      orbitC: this._makeOrbitVoice(),
    };

    // Pattern loops per orbit
    this.orbitLoops = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };
    this.orbitPatternStep = {
      orbitA: 0,
      orbitB: 0,
      orbitC: 0,
    };

    this.transportStarted = false;
  }

  // ---------- INTERNAL BUILDERS ----------

  _makeCoreLayer(options) {
    const gain = new Tone.Gain(0.9).connect(this.masterGain);
    const analyser = new Tone.Analyser("fft", 32);
    gain.connect(analyser);

    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: {
        attack: options.attack ?? 0.05,
        decay: 0.1,
        sustain: 0.7,
        release: options.release ?? 0.8,
      },
    }).connect(gain);

    synth.volume.value = options.volume ?? -12;

    return {
      synth,
      gain,
      analyser,
      octaveOffset: options.octaveOffset ?? 0,
      muted: false,
      currentGain: 1,
    };
  }

  _makeOrbitVoice() {
    const gain = new Tone.Gain(0.7).connect(this.masterGain);
    const analyser = new Tone.Analyser("fft", 32);
    gain.connect(analyser);

    const synth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.5,
        release: 0.4,
      },
    }).connect(gain);

    synth.volume.value = -14;

    return {
      synth,
      gain,
      analyser,
      muted: false,
      currentGain: 1,
    };
  }

  _ensureTransport() {
    if (!this.transportStarted) {
      Tone.Transport.start();
      this.transportStarted = true;
    }
  }

  // ---------- LIFECYCLE ----------

  async startAudioContext() {
    if (this.started) return;
    await Tone.start();
    console.log("Tone.js", Tone.version);
    this.started = true;
    console.log("OMSE audio context started.");
  }

  // ---------- GAIN / MUTE HELPERS ----------

  _applyLayerGain(layer, value) {
    layer.currentGain = value;
    layer.gain.gain.rampTo(layer.muted ? 0 : value, 0.05);
  }

  setCoreLayerGain(id, value) {
    const layer = this.core.layers[id];
    if (!layer) return;
    this._applyLayerGain(layer, value);
  }

  setCoreLayerMute(id, muted) {
    const layer = this.core.layers[id];
    if (!layer) return;
    layer.muted = muted;
    this._applyLayerGain(layer, layer.currentGain);
  }

  setOrbitGain(id, value) {
    const voice = this.orbits[id];
    if (!voice) return;
    voice.currentGain = value;
    voice.gain.gain.rampTo(voice.muted ? 0 : value, 0.05);
  }

  setOrbitMute(id, muted) {
    const voice = this.orbits[id];
    if (!voice) return;
    voice.muted = muted;
    voice.gain.gain.rampTo(muted ? 0 : voice.currentGain, 0.05);
  }

  // ---------- NOTE HANDLING ----------

  noteOn(voiceId, note) {
    if (!this.started) return;

    const now = Tone.now();

    if (voiceId === "core") {
      // Trigger all three Core layers with octave offsets
      Object.values(this.core.layers).forEach((layer) => {
        const freq = Tone.Frequency(note).transpose(layer.octaveOffset);
        layer.synth.triggerAttack(freq, now);
      });
      return;
    }

    const orbit = this.orbits[voiceId];
    if (orbit) {
      orbit.synth.triggerAttack(note, now);
    }
  }

  noteOff(voiceId, note) {
    if (!this.started) return;

    const now = Tone.now();

    if (voiceId === "core") {
      Object.values(this.core.layers).forEach((layer) => {
        layer.synth.triggerRelease(now);
      });
      return;
    }

    const orbit = this.orbits[voiceId];
    if (orbit) {
      orbit.synth.triggerRelease(now);
    }
  }

  // ---------- TEST SCENE ----------

  async playTestScene() {
    if (!this.started) return;

    const now = Tone.now();
    const chord = ["C4", "G4", "A4", "E4"];

    chord.forEach((n, index) => {
      const t = now + index * 0.75;

      // Core chord swell
      Object.values(this.core.layers).forEach((layer) => {
        const freq = Tone.Frequency(n).transpose(layer.octaveOffset);
        layer.synth.triggerAttackRelease(freq, "0.7", t);
      });

      // Orbit A accent
      this.orbits.orbitA.synth.triggerAttackRelease(n, "0.3", t + 0.1);
    });

    return new Promise((resolve) => setTimeout(resolve, 4000));
  }

  // ---------- ORBIT PATTERNS (A, B, C) ----------

  setOrbitPattern(orbitId, enabled) {
    if (!this.started) return;
    if (!this.orbits[orbitId]) return;

    const currentLoop = this.orbitLoops[orbitId];

    if (enabled) {
      if (currentLoop) return; // already running

      const config = ORBIT_PATTERN_CONFIG[orbitId];
      if (!config) return;

      const { notes, interval, duration } = config;
      let step = this.orbitPatternStep[orbitId] ?? 0;

      const loop = new Tone.Loop((time) => {
        const note = notes[step % notes.length];
        this.orbits[orbitId].synth.triggerAttackRelease(note, duration, time);
        step += 1;
        this.orbitPatternStep[orbitId] = step;
      }, interval).start(0);

      this.orbitLoops[orbitId] = loop;
      this._ensureTransport();
    } else {
      if (!currentLoop) return;
      currentLoop.stop();
      currentLoop.dispose();
      this.orbitLoops[orbitId] = null;
    }
  }

  // ---------- METER HELPERS ----------

  _rmsishFromAnalyser(analyser) {
    // FFT data in dB; convert to 0–1 "energy" for meters
    const values = analyser.getValue();
    if (!values.length) return 0;

    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (!Number.isFinite(v)) continue;
      // Clamp -90 dB to 0 dB, normalize to 0..1
      const clamped = Math.max(-90, Math.min(0, v));
      const norm = (clamped + 90) / 90; // 0 at -90, 1 at 0
      sum += norm * norm; // square for energy
    }
    const mean = sum / values.length;
    return Math.sqrt(mean); // back to linear-ish 0..1
  }

  getCoreLayerLevel(id) {
    const layer = this.core.layers[id];
    if (!layer) return 0;
    return this._rmsishFromAnalyser(layer.analyser);
  }

  getOrbitLevel(id) {
    const voice = this.orbits[id];
    if (!voice) return 0;
    return this._rmsishFromAnalyser(voice.analyser);
  }

  getMasterLevel() {
    return this._rmsishFromAnalyser(this.masterAnalyser);
  }

  // ---------- SPECTRUM FOR MASTER OUTPUT ----------

  getMasterSpectrum() {
    if (!this.masterFFT) return [];
    const values = this.masterFFT.getValue(); // Float32Array of dB

    const arr = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (!Number.isFinite(v)) {
        arr.push(0);
        continue;
      }
      const clamped = Math.max(-90, Math.min(0, v));
      const norm = (clamped + 90) / 90; // 0 at -90, 1 at 0
      arr.push(norm);
    }
    return arr;
  }
}

export const omseEngine = new OmseEngine();