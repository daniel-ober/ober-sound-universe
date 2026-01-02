// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * Helper to build a smoothed, 0–1 meter
 */
function makeMeter() {
  return new Tone.Meter({
    channels: 1,
    smoothing: 0.8,
    normalRange: true, // 0–1 range instead of dB
  });
}

/**
 * Ober MotionSynth Engine (OMSE)
 * - Core: 3 layered polysynth (ground, harmony, atmosphere)
 * - Orbits: 3 satellite voices (A/B/C)
 * - Meters for: master, core buss, core layers, orbits
 * - Master spectrum analyser for UI spectrum bar
 * - Per-orbit pattern loops
 */
class OMSEEngine {
  constructor() {
    this.initialized = false;

    // Master buss
    this.masterGain = null;
    this.masterMeter = null;

    // Spectrum analyser (for MasterSpectrum.jsx)
    this.masterAnalyser = null;

    // Core buss + layers
    this.coreBuss = null;
    this.coreMeter = null;
    this.core = {
      layers: {
        ground: null,
        harmony: null,
        // IMPORTANT: matches CoreMixer.jsx layer id "atmosphere"
        atmosphere: null,
      },
    };

    // Orbits
    this.orbits = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };

    // Simple per-voice active note maps
    this.activeNotes = {
      core: new Set(),
      orbitA: new Set(),
      orbitB: new Set(),
      orbitC: new Set(),
    };

    // Per-orbit pattern loops
    this.orbitPatterns = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };
  }

  // ---------- PUBLIC API ----------

  async startAudioContext() {
    if (this.initialized) return;

    await Tone.start();
    this._buildGraph();

    Tone.Transport.bpm.value = 90;
    Tone.Transport.start();

    this.initialized = true;
  }

  /**
   * Core / Orbit note control
   */
  noteOn(voiceId, note, velocity = 0.9) {
    if (!this.initialized) return;

    if (voiceId === "core") {
      // fan out to all three layers
      Object.values(this.core.layers).forEach((layer) => {
        if (!layer) return;
        layer.synth.triggerAttack(note, undefined, velocity);
      });
      this.activeNotes.core.add(note);
      return;
    }

    const orbit = this.orbits[voiceId];
    if (!orbit) return;

    if (!this.activeNotes[voiceId].has(note)) {
      orbit.synth.triggerAttack(note, undefined, velocity);
      this.activeNotes[voiceId].add(note);
    }
  }

  noteOff(voiceId, note) {
    if (!this.initialized) return;

    if (voiceId === "core") {
      if (!this.activeNotes.core.has(note)) return;
      Object.values(this.core.layers).forEach((layer) => {
        if (!layer) return;
        layer.synth.triggerRelease(note);
      });
      this.activeNotes.core.delete(note);
      return;
    }

    const orbit = this.orbits[voiceId];
    if (!orbit) return;
    if (!this.activeNotes[voiceId].has(note)) return;

    orbit.synth.triggerRelease(note);
    this.activeNotes[voiceId].delete(note);
  }

  /**
   * Test scene: simple chord swell + enabling orbit patterns
   */
  async playTestScene() {
    if (!this.initialized) return;

    const now = Tone.now();
    const chord = ["C4", "E4", "G4", "B4", "C5"];

    chord.forEach((note, i) => {
      const t = now + i * 0.35;
      Object.values(this.core.layers).forEach((layer) => {
        if (!layer) return;
        layer.synth.triggerAttackRelease(note, "2n", t);
      });
    });

    // Let all orbits run their current patterns for the demo
    this.startOrbitPattern("orbitA");
    this.startOrbitPattern("orbitB");
    this.startOrbitPattern("orbitC");
  }

  // ----- Core layer controls -----

  setCoreLayerGain(layerId, normalized) {
    const layer = this.core.layers[layerId];
    if (!layer) return;
    const v = Math.max(0, Math.min(1, normalized));
    layer.baseGain = v;
    layer.gain.gain.value = layer.muted ? 0 : v;
  }

  setCoreLayerMute(layerId, muted) {
    const layer = this.core.layers[layerId];
    if (!layer) return;
    layer.muted = !!muted;
    layer.gain.gain.value = layer.muted ? 0 : layer.baseGain;
  }

  // ----- Orbit controls -----

  setOrbitGain(orbitId, normalized) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    const v = Math.max(0, Math.min(1, normalized));
    orbit.baseGain = v;
    orbit.gain.gain.value = orbit.muted ? 0 : v;
  }

  setOrbitMute(orbitId, muted) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    orbit.muted = !!muted;
    orbit.gain.gain.value = orbit.muted ? 0 : orbit.baseGain;
  }

  startOrbitPattern(orbitId) {
    if (!this.initialized) return;
    const loop = this.orbitPatterns[orbitId];
    if (!loop) return;
    if (!loop.state || loop.state === "stopped") {
      loop.start(0);
    }
  }

  stopOrbitPattern(orbitId) {
    const loop = this.orbitPatterns[orbitId];
    if (!loop) return;
    if (loop.state === "started") {
      loop.stop();
    }
  }

  /**
   * Toggle an orbit's pattern on/off (used by UI + preset sync)
   */
  setOrbitPatternState(orbitId, isOn) {
    if (!this.initialized) return;

    const loop = this.orbitPatterns[orbitId];
    if (!loop) return;

    const shouldStart = !!isOn;

    if (shouldStart) {
      if (loop.state !== "started") loop.start(0);
    } else {
      if (loop.state === "started") loop.stop();
    }
  }

  // ----- Meter getters (0–1) -----

  getMasterLevel() {
    if (!this.masterMeter) return 0;
    const v = this.masterMeter.getValue();
    return this._clamp01(v);
  }

  // Arrow fn so it’s always bound (safe for RAF usage)
  getCoreLayerLevel = (layerId) => {
    const layer = this.core?.layers?.[layerId];
    if (!layer || !layer.meter) return 0;
    const v = layer.meter.getValue();
    return this._clamp01(v);
  };

  getOrbitLevel = (orbitId) => {
    const orbit = this.orbits?.[orbitId];
    if (!orbit || !orbit.meter) return 0;
    const v = orbit.meter.getValue();
    return this._clamp01(v);
  };

  /**
   * Master spectrum for MasterSpectrum.jsx
   * Returns an array of floats ~0..1
   */
  getMasterSpectrum = () => {
    if (!this.masterAnalyser) return null;

    const values = this.masterAnalyser.getValue(); // fft array (dB-ish)
    if (!values || !values.length) return null;

    // Tone FFT values are typically negative dB numbers.
    // Normalize roughly: -100dB -> 0, -20dB -> 1
    return Array.from(values, (v) => {
      const db = typeof v === "number" && Number.isFinite(v) ? v : -100;
      return this._clamp01((db + 100) / 80);
    });
  };

  // ---------- INTERNAL ----------

  _clamp01(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  _buildGraph() {
    // MASTER BUS
    this.masterGain = new Tone.Gain(0.9).toDestination();

    // Level meter
    this.masterMeter = makeMeter();
    this.masterGain.connect(this.masterMeter);

    // Spectrum analyser (FFT)
    this.masterAnalyser = new Tone.Analyser("fft", 1024);
    this.masterGain.connect(this.masterAnalyser);

    // CORE BUSS
    this.coreBuss = new Tone.Gain(1).connect(this.masterGain);
    this.coreMeter = makeMeter();
    this.coreBuss.connect(this.coreMeter);

    // CORE LAYERS
    this.core.layers.ground = this._buildCoreLayer({
      type: "sine",
      spread: 0,
      detune: -1200, // -12 semitones
      baseGain: 0.9,
    });

    this.core.layers.harmony = this._buildCoreLayer({
      type: "sawtooth",
      spread: 10,
      detune: 0,
      baseGain: 0.8,
    });

    // IMPORTANT: key is "atmosphere" to match CoreMixer.jsx
    this.core.layers.atmosphere = this._buildCoreLayer({
      type: "triangle",
      spread: 20,
      detune: 12, // gentle shimmer
      baseGain: 0.7,
      airy: true,
    });

    // ORBITS
    this.orbits.orbitA = this._buildOrbitVoice({
      type: "square",
      pan: -0.25,
      baseGain: 0.7,
    });

    this.orbits.orbitB = this._buildOrbitVoice({
      type: "sawtooth",
      pan: 0.25,
      baseGain: 0.7,
    });

    this.orbits.orbitC = this._buildOrbitVoice({
      type: "triangle",
      pan: 0,
      baseGain: 0.65,
    });

    // ORBIT PATTERNS (placeholder musical behavior)
    this.orbitPatterns.orbitA = this._makeOrbitPattern("orbitA", "8n", [
      "C4",
      "E4",
      "G4",
      "B4",
    ]);

    this.orbitPatterns.orbitB = this._makeOrbitPattern("orbitB", "4n", [
      "C3",
      "G3",
      "D4",
    ]);

    this.orbitPatterns.orbitC = this._makeOrbitPattern("orbitC", "2n", [
      "C4",
      "G3",
    ]);
  }

  _buildCoreLayer({ type, spread, detune, baseGain, airy = false }) {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type, spread, detune },
      envelope: {
        attack: 0.02,
        decay: 0.4,
        sustain: 0.7,
        release: 1.8,
      },
    });

    // optional airy noise for atmosphere
    let outputNode = synth;
    if (airy) {
      const noise = new Tone.Noise("pink").start();
      const noiseFilter = new Tone.Filter(6000, "lowpass");
      const noiseGain = new Tone.Gain(0.15);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);

      const merge = new Tone.Gain(1);
      synth.connect(merge);
      noiseGain.connect(merge);

      outputNode = merge;
    }

    const gain = new Tone.Gain(baseGain).connect(this.coreBuss);

    const meter = makeMeter();
    gain.connect(meter);

    outputNode.connect(gain);

    return {
      synth,
      gain,
      meter,
      muted: false,
      baseGain,
    };
  }

  _buildOrbitVoice({ type, pan, baseGain }) {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type },
      envelope: {
        attack: 0.01,
        decay: 0.25,
        sustain: 0.5,
        release: 0.6,
      },
    });

    const panner = new Tone.Panner(typeof pan === "number" ? pan : 0);
    const gain = new Tone.Gain(baseGain).connect(this.masterGain);

    const meter = makeMeter();
    gain.connect(meter);

    synth.connect(panner);
    panner.connect(gain);

    return {
      synth,
      panner,
      gain,
      meter,
      muted: false,
      baseGain,
    };
  }

  _makeOrbitPattern(orbitId, interval, notes) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return null;

    const loop = new Tone.Loop((time) => {
      if (orbit.muted || orbit.gain.gain.value <= 0.0001) return;
      const idx = Math.floor(Math.random() * notes.length);
      const note = notes[idx];
      orbit.synth.triggerAttackRelease(note, "8n", time);
    }, interval);

    // We don't start it here; UI controls do that.
    return loop;
  }
}

export const omseEngine = new OMSEEngine();