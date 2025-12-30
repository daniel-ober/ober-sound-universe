// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * OMSE: Ober MotionSynth Engine
 *
 * Current responsibilities:
 * - Core 3-layer voice (ground, harmony, atmos)
 * - Three Orbit voices (A/B/C)
 * - Master bus + meters
 * - Orbit A simple pattern
 * - Helper getters for UI meters & spectrum
 */

class OmseEngine {
  constructor() {
    this.started = false;

    // ----- MASTER BUS -----
    this.masterGain = new Tone.Gain(0.8);

    // Waveform analyser for master meters (time-domain, 0..1-ish amplitude)
    this.masterAnalyser = new Tone.Analyser("waveform", 128);

    // FFT analyser for spectrum (frequency domain)
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
          octaveOffset: 12, // air
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

    this.orbitAPattern = null;
  }

  // ---------- INTERNAL BUILDERS ----------

  _makeCoreLayer(options) {
    const gain = new Tone.Gain(0.9).connect(this.masterGain);

    // Waveform analyser for per-layer meters
    const analyser = new Tone.Analyser("waveform", 64);
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

    // Waveform analyser for Orbit meters
    const analyser = new Tone.Analyser("waveform", 64);
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

  noteOff(voiceId) {
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

  // ---------- ORBIT A PATTERN ----------

  startOrbitAPattern() {
    if (!this.started) return;
    if (this.orbitAPattern) return;

    const notes = ["C5", "E5", "G5", "B4"];
    let step = 0;

    this.orbitAPattern = new Tone.Loop((time) => {
      const note = notes[step % notes.length];
      this.orbits.orbitA.synth.triggerAttackRelease(note, "0.22", time);
      step++;
    }, "8n").start(0);

    Tone.Transport.start();
  }

  stopOrbitAPattern() {
    if (this.orbitAPattern) {
      this.orbitAPattern.stop();
      this.orbitAPattern.dispose();
      this.orbitAPattern = null;
    }
    // We leave Transport running for future patterns.
  }

  // ---------- METER HELPERS (waveform → 0..1 visual level) ----------

  _avgWaveform(analyser) {
    const values = analyser.getValue();
    if (!values || !values.length) return 0;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += Math.abs(values[i]); // waveform is roughly -1..1
    }
    return sum / values.length; // ~0..1
  }

  _ampToLevel(val) {
    if (!Number.isFinite(val)) return 0;
    const clamped = Math.max(0, Math.min(1, val));
    // Make low levels visible but keep some headroom
    const curved = Math.pow(clamped, 0.6);
    const boosted = curved * 1.1;
    return boosted > 1 ? 1 : boosted;
  }

  getCoreLayerLevel(id) {
    const layer = this.core.layers[id];
    if (!layer) return 0;
    const avg = this._avgWaveform(layer.analyser);
    return this._ampToLevel(avg);
  }

  getOrbitLevel(id) {
    const voice = this.orbits[id];
    if (!voice) return 0;
    const avg = this._avgWaveform(voice.analyser);
    // Slight extra boost on orbits since patterns are sparser
    const base = this._ampToLevel(avg);
    const boosted = base * 1.2;
    return boosted > 1 ? 1 : boosted;
  }

  getMasterLevel() {
    const avg = this._avgWaveform(this.masterAnalyser);
    return this._ampToLevel(avg);
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
      // Clamp -90 dB (silent-ish) to 0 dB (loud)
      const clamped = Math.max(-90, Math.min(0, v));
      const norm = (clamped + 90) / 90; // 0 at -90, 1 at 0
      arr.push(norm);
    }
    return arr;
  }
}

export const omseEngine = new OmseEngine();