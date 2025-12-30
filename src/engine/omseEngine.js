// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * OMSE: Ober MotionSynth Engine
 *
 * Responsibilities:
 * - Core 3-layer voice (ground, harmony, atmos)
 * - Three Orbit voices (A/B/C)
 * - Master bus + meters + spectrum
 * - Orbit A simple pattern
 * - Helper getters for UI meters & spectrum
 */

class OmseEngine {
  constructor() {
    this.started = false;

    // ----- MASTER BUS -----
    this.masterGain = new Tone.Gain(0.8);

    // Level meter for master (0..1-ish, via Tone.Meter)
    this.masterMeter = new Tone.Meter({
      smoothing: 0.8,
    });

    // FFT analyser for spectrum (frequency domain)
    this.masterFFT = new Tone.Analyser("fft", 256);

    this.masterGain.connect(this.masterMeter);
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

    // Per-layer level meter
    const meter = new Tone.Meter({
      smoothing: 0.8,
    });
    gain.connect(meter);

    // Polyphonic synth for chords
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 8,
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
      meter,
      octaveOffset: options.octaveOffset ?? 0,
      muted: false,
      currentGain: 1,
    };
  }

  _makeOrbitVoice() {
    const gain = new Tone.Gain(0.7).connect(this.masterGain);

    const meter = new Tone.Meter({
      smoothing: 0.8,
    });
    gain.connect(meter);

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
      meter,
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
      // Trigger all three Core layers with octave offsets (poly)
      Object.values(this.core.layers).forEach((layer) => {
        const playedNote = Tone.Frequency(note)
          .transpose(layer.octaveOffset)
          .toNote();
        layer.synth.triggerAttack(playedNote, now);
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
      // Release only this note (per layer)
      Object.values(this.core.layers).forEach((layer) => {
        const playedNote = Tone.Frequency(note)
          .transpose(layer.octaveOffset)
          .toNote();
        layer.synth.triggerRelease(playedNote, now);
      });
      return;
    }

    const orbit = this.orbits[voiceId];
    if (orbit) {
      orbit.synth.triggerRelease(note, now);
    }
  }

  // ---------- TEST SCENE ----------

  async playTestScene() {
    if (!this.started) return;

    const now = Tone.now();
    const chord = ["C4", "G4", "A4", "E4"];

    chord.forEach((n, index) => {
      const t = now + index * 0.75;

      // Core chord swell (still poly)
      Object.values(this.core.layers).forEach((layer) => {
        const playedNote = Tone.Frequency(n)
          .transpose(layer.octaveOffset)
          .toNote();
        layer.synth.triggerAttackRelease(playedNote, "0.7", t);
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
    // Leave Transport running for future patterns.
  }

  // ---------- METER HELPERS (for Core, Orbits, Master) ----------

  _meterToLevel(meter) {
    if (!meter) return 0;
    const value = meter.getValue();

    if (!Number.isFinite(value)) return 0;

    // If this looks like dB (-100..0), map to 0..1
    if (value <= 0 && value >= -100) {
      const norm = (value + 60) / 60; // treat -60 dB as ~0
      const clamped = Math.max(0, Math.min(1, norm));
      return clamped ** 1.4;
    }

    // Otherwise assume 0..1 linear
    const clamped = Math.max(0, Math.min(1, value));
    return clamped ** 1.4;
  }

  getCoreLayerLevel(id) {
    const layer = this.core.layers[id];
    if (!layer) return 0;
    return this._meterToLevel(layer.meter);
  }

  getOrbitLevel(id) {
    const voice = this.orbits[id];
    if (!voice) return 0;
    return this._meterToLevel(voice.meter);
  }

  getMasterLevel() {
    return this._meterToLevel(this.masterMeter);
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