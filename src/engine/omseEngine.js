// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * Helper to build a smoothed, 0–1 meter
 */
function makeMeter() {
  return new Tone.Meter({
    channels: 1,
    smoothing: 0.8,
    normalRange: true, // 0–1 instead of dB
  });
}

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clamp(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Parse "6/4" => { steps: 6, denom: 4 }
 * We use numerator as a "cycle length" for orbit polyrhythm stepping.
 */
function parseTimeSig(sig) {
  if (typeof sig !== "string") return { steps: 4, denom: 4 };
  const [a, b] = sig.split("/");
  const steps = clamp(parseInt(a, 10) || 4, 1, 32);
  const denom = clamp(parseInt(b, 10) || 4, 1, 32);
  return { steps, denom };
}

/**
 * Build a synth instance from a "voice preset"
 * Supports:
 * - engine: "synth" => Tone.Synth wrapped in PolySynth
 * - engine: "fm"    => Tone.FMSynth wrapped in PolySynth
 */
function buildOrbitSynthFromPreset(voicePreset) {
  const engine = voicePreset?.engine || "synth";
  const params = voicePreset?.params || {};

  if (engine === "fm") {
    return new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: params.harmonicity ?? 2,
      modulationIndex: params.modulationIndex ?? 5,
      envelope: {
        attack: params.envelope?.attack ?? 0.01,
        decay: params.envelope?.decay ?? 0.2,
        sustain: params.envelope?.sustain ?? 0.3,
        release: params.envelope?.release ?? 0.6,
      },
    });
  }

  // default "synth"
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: params.oscillator?.type ?? "sine",
    },
    envelope: {
      attack: params.envelope?.attack ?? 0.01,
      decay: params.envelope?.decay ?? 0.25,
      sustain: params.envelope?.sustain ?? 0.5,
      release: params.envelope?.release ?? 0.6,
    },
  });
}

/**
 * Ober MotionSynth Engine (OMSE)
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
        atmosphere: null,
      },
    };

    // Orbits
    this.orbits = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };

    // Per-voice active note maps
    this.activeNotes = {
      core: new Set(),
      orbitA: new Set(),
      orbitB: new Set(),
      orbitC: new Set(),
    };

    // Orbit config + motion state
    // (kept separate so loops can read latest values without rebuild)
    this.orbitConfig = {
      orbitA: { enabled: true, voicePresetId: null },
      orbitB: { enabled: true, voicePresetId: null },
      orbitC: { enabled: true, voicePresetId: null },
    };

    this.orbitMotion = {
      orbitA: { timeSig: "4/4", arp: "off", rate: "8n", step: 0 },
      orbitB: { timeSig: "4/4", arp: "off", rate: "8n", step: 0 },
      orbitC: { timeSig: "4/4", arp: "off", rate: "8n", step: 0 },
    };

    // Per-orbit pattern loops (Tone.Loop)
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

    this.startOrbitPattern("orbitA");
    this.startOrbitPattern("orbitB");
    this.startOrbitPattern("orbitC");
  }

  // ----- Core layer controls -----

  setCoreLayerGain(layerId, normalized) {
    const layer = this.core.layers[layerId];
    if (!layer) return;
    const v = clamp01(normalized);
    layer.baseGain = v;
    layer.gain.gain.value = layer.muted ? 0 : v;
  }

  setCoreLayerMute(layerId, muted) {
    const layer = this.core.layers[layerId];
    if (!layer) return;
    layer.muted = !!muted;
    layer.gain.gain.value = layer.muted ? 0 : layer.baseGain;
  }

  // ----- Orbit controls (continuous-safe) -----

  setOrbitGain(orbitId, normalized) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    const v = clamp01(normalized);
    orbit.baseGain = v;

    // smooth to avoid clicks + avoid perceived "reset"
    if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(orbit.muted ? 0 : v, 0.03);
    else orbit.gain.gain.value = orbit.muted ? 0 : v;
  }

  setOrbitMute(orbitId, muted) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    orbit.muted = !!muted;

    const target = orbit.muted ? 0 : orbit.baseGain;
    if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(target, 0.03);
    else orbit.gain.gain.value = target;
  }

  setOrbitPan(orbitId, pan) {
    const orbit = this.orbits[orbitId];
    if (!orbit?.panner?.pan) return;

    const v = clamp(pan, -1, 1);

    // smooth pan to avoid stepping
    if (orbit.panner.pan.rampTo) orbit.panner.pan.rampTo(v, 0.03);
    else orbit.panner.pan.value = v;
  }

  setOrbitEnabled(orbitId, enabled) {
    this.orbitConfig[orbitId] = {
      ...(this.orbitConfig[orbitId] || {}),
      enabled: !!enabled,
    };

    // If disabling, stop pattern and silence orbit
    if (!enabled) {
      this.setOrbitPatternState(orbitId, false);
      const orbit = this.orbits[orbitId];
      if (orbit) {
        if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(0, 0.03);
        else orbit.gain.gain.value = 0;
      }
      return;
    }

    // If enabling, restore gain according to mute/baseGain
    const orbit = this.orbits[orbitId];
    if (orbit) {
      const target = orbit.muted ? 0 : orbit.baseGain;
      if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(target, 0.03);
      else orbit.gain.gain.value = target;
    }
  }

  setOrbitTimeSig(orbitId, timeSig) {
    this.orbitMotion[orbitId] = {
      ...(this.orbitMotion[orbitId] || {}),
      timeSig: timeSig || "4/4",
      step: 0, // reset step is OK and should NOT restart loop
    };
  }

  setOrbitArp(orbitId, arp) {
    this.orbitMotion[orbitId] = {
      ...(this.orbitMotion[orbitId] || {}),
      arp: arp || "off",
      step: 0, // reset step is OK and should NOT restart loop
    };
  }

  setOrbitRate(orbitId, rate) {
    this.orbitMotion[orbitId] = {
      ...(this.orbitMotion[orbitId] || {}),
      rate: rate || "8n",
    };

    // update loop interval live (no rebuild)
    const loop = this.orbitPatterns[orbitId];
    if (loop) loop.interval = rate || "8n";
  }

  /**
   * ✅ Only start/stop patterns through this.
   * This prevents re-phasing when you tweak mix params.
   */
  setOrbitPatternState(orbitId, isOn) {
    if (!this.initialized) return;

    const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
    const loop = this.orbitPatterns[orbitId];
    if (!loop) return;

    const shouldStart = !!isOn && enabled;

    if (shouldStart) {
      if (loop.state !== "started") loop.start(0);
    } else {
      if (loop.state === "started") loop.stop();
    }
  }

  /**
   * Swap orbit synth based on ORBIT_VOICE_PRESETS
   * This DOES rebuild the synth node, but preserves the orbit panner/gain/meter chain.
   * Called only on orbit scene/preset changes, not on slider changes.
   */
  setOrbitVoicePreset(orbitId, voicePreset) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;

    try {
      // release any held notes
      this.activeNotes[orbitId]?.forEach((n) => {
        orbit.synth.triggerRelease(n);
      });
      this.activeNotes[orbitId]?.clear?.();

      // dispose old synth
      orbit.synth?.disconnect?.();
      orbit.synth?.dispose?.();

      // build new synth
      const synth = buildOrbitSynthFromPreset(voicePreset);

      // optional filter if provided
      const filterCfg = voicePreset?.params?.filter;
      if (filterCfg) {
        const f = new Tone.Filter({
          type: filterCfg.type ?? "lowpass",
          frequency: filterCfg.frequency ?? 8000,
          Q: filterCfg.Q ?? 0.7,
        });
        synth.connect(f);
        f.connect(orbit.panner);
        orbit._filter = f;
      } else {
        // remove old filter if existed
        if (orbit._filter) {
          orbit._filter.disconnect();
          orbit._filter.dispose();
          orbit._filter = null;
        }
        synth.connect(orbit.panner);
      }

      orbit.synth = synth;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("setOrbitVoicePreset failed:", e);
    }
  }

  // Back-compat wrappers (no longer used by App for toggling)
  startOrbitPattern(orbitId) {
    this.setOrbitPatternState(orbitId, true);
  }
  stopOrbitPattern(orbitId) {
    this.setOrbitPatternState(orbitId, false);
  }

  // ----- Meter getters (0–1) -----

  getMasterLevel() {
    if (!this.masterMeter) return 0;
    return clamp01(this.masterMeter.getValue());
  }

  getCoreLayerLevel = (layerId) => {
    const layer = this.core?.layers?.[layerId];
    if (!layer?.meter) return 0;
    return clamp01(layer.meter.getValue());
  };

  getOrbitLevel(orbitId) {
    const orbit = this.orbits?.[orbitId];
    if (!orbit?.meter) return 0;
    return clamp01(orbit.meter.getValue());
  }

  /**
   * Master spectrum for MasterSpectrum.jsx
   * Returns 0..1 floats
   */
  getMasterSpectrum = () => {
    if (!this.masterAnalyser) return null;

    const values = this.masterAnalyser.getValue();
    if (!values || !values.length) return null;

    // fft returns negative dB values. Map roughly -100..-20 => 0..1
    return Array.from(values, (v) => {
      const db = typeof v === "number" ? v : -100;
      return clamp01((db + 100) / 80);
    });
  };

  /**
   * ✅ Apply a full Orbit Master Preset
   * scene shape:
   * {
   *   orbits: {
   *     orbitA: { enabled, voicePresetId, motion:{timeSig, arp, rate, patternOn}, mix:{gain, pan, muted} },
   *     ...
   *   }
   * }
   */
  applyOrbitScenePreset(scene, voicePresetMap) {
    if (!this.initialized || !scene?.orbits) return;

    ["orbitA", "orbitB", "orbitC"].forEach((orbitId) => {
      const cfg = scene.orbits?.[orbitId];
      if (!cfg) return;

      // enabled
      this.setOrbitEnabled(orbitId, !!cfg.enabled);

      // voice preset id
      const voiceId = cfg.voicePresetId || null;
      this.orbitConfig[orbitId] = {
        ...(this.orbitConfig[orbitId] || {}),
        voicePresetId: voiceId,
      };

      // swap synth if preset exists
      const voicePreset = voiceId ? voicePresetMap?.[voiceId] : null;
      if (voicePreset) this.setOrbitVoicePreset(orbitId, voicePreset);

      // mix
      const mix = cfg.mix || {};
      this.setOrbitGain(orbitId, clamp01(mix.gain ?? 0.6));
      this.setOrbitPan(orbitId, clamp(mix.pan ?? 0, -1, 1));
      this.setOrbitMute(orbitId, !!mix.muted);

      // motion
      const motion = cfg.motion || {};
      this.setOrbitTimeSig(orbitId, motion.timeSig || "4/4");
      this.setOrbitArp(orbitId, motion.arp || "off");
      this.setOrbitRate(orbitId, motion.rate || "8n");

      // pattern on/off (ONLY here or via UI toggle)
      this.setOrbitPatternState(orbitId, !!motion.patternOn);
    });
  }

  // ---------- INTERNAL ----------

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
      detune: -1200,
      baseGain: 0.9,
    });

    this.core.layers.harmony = this._buildCoreLayer({
      type: "sawtooth",
      spread: 10,
      detune: 0,
      baseGain: 0.8,
    });

    this.core.layers.atmosphere = this._buildCoreLayer({
      type: "triangle",
      spread: 20,
      detune: 12,
      baseGain: 0.7,
      airy: true,
    });

    // ORBITS (voice synth will be swapped by applyOrbitScenePreset)
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

    // Orbit pattern loops: ARP + polyrhythm aware
    this.orbitPatterns.orbitA = this._makeOrbitArpLoop("orbitA");
    this.orbitPatterns.orbitB = this._makeOrbitArpLoop("orbitB");
    this.orbitPatterns.orbitC = this._makeOrbitArpLoop("orbitC");
  }

  _buildCoreLayer({ type, spread, detune, baseGain, airy = false }) {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type, spread, detune },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.7, release: 1.8 },
    });

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

    return { synth, gain, meter, muted: false, baseGain };
  }

  _buildOrbitVoice({ type, pan, baseGain }) {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.6 },
    });

    const panner = new Tone.Panner(typeof pan === "number" ? pan : 0);
    const gain = new Tone.Gain(baseGain).connect(this.masterGain);

    const meter = makeMeter();
    gain.connect(meter);

    synth.connect(panner);
    panner.connect(gain);

    return { synth, panner, gain, meter, muted: false, baseGain, _filter: null };
  }

  /**
   * Orbit ARP loop:
   * - Uses currently held core notes (activeNotes.core) as the "chord"
   * - Falls back to a safe chord if none held
   * - Polyrhythm cycle length comes from timeSig numerator (e.g. 5/4 => 5 steps)
   */
  _makeOrbitArpLoop(orbitId) {
    const loop = new Tone.Loop((time) => {
      const orbit = this.orbits[orbitId];
      if (!orbit) return;

      const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
      if (!enabled) return;

      if (orbit.muted || orbit.gain.gain.value <= 0.0001) return;

      const motion = this.orbitMotion?.[orbitId] || {};
      const arp = motion.arp || "off";

      // if arp "off", do nothing (pattern running but silent by design)
      if (arp === "off") return;

      const { steps } = parseTimeSig(motion.timeSig || "4/4");

      // chord source: held core notes, sorted low->high
      const chord = Array.from(this.activeNotes.core || []);
      const notes = chord.length > 0 ? chord : ["C4", "E4", "G4", "B4"];

      // stable ordering
      const sorted = notes
        .map((n) => ({ n, m: Tone.Frequency(n).toMidi() }))
        .sort((a, b) => a.m - b.m)
        .map((x) => x.n);

      // polyrhythm stepping
      const step = motion.step || 0;
      const idxBase = step % Math.max(1, steps);

      let pick = 0;

      switch (arp) {
        case "up":
          pick = idxBase % sorted.length;
          break;
        case "down":
          pick = sorted.length - 1 - (idxBase % sorted.length);
          break;
        case "upDown": {
          const cycle = sorted.length * 2 - 2;
          const i = cycle > 0 ? idxBase % cycle : 0;
          pick = i < sorted.length ? i : cycle - i;
          break;
        }
        case "downUp": {
          const cycle = sorted.length * 2 - 2;
          const i = cycle > 0 ? idxBase % cycle : 0;
          const upDown = i < sorted.length ? i : cycle - i;
          pick = sorted.length - 1 - upDown;
          break;
        }
        case "random":
          pick = Math.floor(Math.random() * sorted.length);
          break;
        default: {
          // Treat custom UI flavors as upDown until we implement them
          const cycle = sorted.length * 2 - 2;
          const i = cycle > 0 ? idxBase % cycle : 0;
          pick = i < sorted.length ? i : cycle - i;
          break;
        }
      }

      const note = sorted[pick] || sorted[0];
      orbit.synth.triggerAttackRelease(note, "16n", time);

      // advance step (no loop restart; just changes which note is chosen)
      this.orbitMotion[orbitId] = {
        ...motion,
        step: (step + 1) % Math.max(1, steps),
      };
    }, "8n"); // interval will be overridden by setOrbitRate()

    return loop;
  }
}

export const omseEngine = new OMSEEngine();