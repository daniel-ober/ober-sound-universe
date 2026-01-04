// src/engine/omseEngine.js
import * as Tone from "tone";
import { buildOrbitVoice } from "./orbitVoiceFactory";
import { buildCoreLayerFromPreset } from "./coreVoiceFactory";

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
 */
function parseTimeSig(sig) {
  if (typeof sig !== "string") return { steps: 4, denom: 4 };
  const [a, b] = sig.split("/");
  const steps = clamp(parseInt(a, 10) || 4, 1, 64);
  const denom = clamp(parseInt(b, 10) || 4, 1, 32);
  return { steps, denom };
}

function safeTimeSigString(sig) {
  const { steps, denom } = parseTimeSig(sig);
  return `${steps}/${denom}`;
}

/**
 * Ober MotionSynth Engine (OMSE)
 *
 * ✅ TRUE POLYRHYTHM MODEL
 * - Master defines "cycle" length in measures + master time signature (defines what 1 measure means)
 * - Each Orbit "timeSig" uses its NUMERATOR as pulses per master cycle
 *
 * ✅ CORE LAYERS (hi-res)
 * - ground / harmony / atmosphere are built via coreVoiceFactory
 * - core FX: reverb + delay sends (stable, never rebuilt on UI change)
 */
class OMSEEngine {
  constructor() {
    this.initialized = false;

    // Master buss
    this.masterGain = null;
    this.masterMeter = null;

    // Spectrum analyser (for MasterSpectrum.jsx)
    this.masterAnalyser = null;

    // Global FX sends (core “hi-res space”)
    this.coreReverb = null;
    this.coreDelay = null;

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
    this.orbitConfig = {
      orbitA: { enabled: true, voicePresetId: null },
      orbitB: { enabled: true, voicePresetId: null },
      orbitC: { enabled: true, voicePresetId: null },
    };

    // ✅ ARP “pattern” is assumed always running.
    // arp:"off" means “no arp output”, but the loop is still active.
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

    // -----------------------------
    // MASTER CLOCK CONFIG
    // -----------------------------
    this.master = {
      timeSig: "4/4", // affects what "1m" means
      cycleMeasures: 1, // user-defined cycle length in measures (1..64)
      bpm: 90,
    };
  }

  // ---------- PUBLIC API ----------

  async startAudioContext() {
    if (this.initialized) return;

    await Tone.start();
    this._buildGraph();

    // Apply master to transport BEFORE starting
    this._applyMasterToTransport();

    Tone.Transport.start();

    // Ensure per-orbit intervals match master cycle
    this._refreshAllOrbitIntervals();

    // ✅ Start orbit loops immediately (they only produce sound when allowed)
    this._ensureOrbitLoopsRunning();

    this.initialized = true;
  }

  // -----------------------------
  // MASTER CONTROLS
  // -----------------------------

  setMasterBpm(bpm) {
    const v = clamp(parseFloat(bpm) || 90, 20, 300);
    this.master.bpm = v;

    if (!this.initialized) return;

    if (Tone.Transport?.bpm?.rampTo) Tone.Transport.bpm.rampTo(v, 0.2);
    else Tone.Transport.bpm.value = v;

    this._refreshAllOrbitIntervals();
  }

  setMasterTimeSig(timeSig) {
    const next = safeTimeSigString(timeSig || "4/4");
    this.master.timeSig = next;

    if (!this.initialized) return;

    const { steps, denom } = parseTimeSig(next);
    Tone.Transport.timeSignature = [steps, denom];

    this._refreshAllOrbitIntervals();
  }

  setMasterCycleMeasures(n) {
    const v = clamp(parseInt(n, 10) || 1, 1, 64);
    this.master.cycleMeasures = v;

    if (!this.initialized) return;
    this._refreshAllOrbitIntervals();
  }

  resetMasterToFourFour() {
    this.setMasterTimeSig("4/4");
  }

  getMasterSettings() {
    return {
      bpm: this.master.bpm,
      timeSig: this.master.timeSig,
      cycleMeasures: this.master.cycleMeasures,
    };
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

    // ✅ CRITICAL FIX:
    // If orbit is disabled OR muted OR effectively at 0 gain, do not sound on keydown.
    const enabled = !!this.orbitConfig?.[voiceId]?.enabled;
    if (!enabled) return;
    if (orbit.muted) return;
    if ((orbit.gain?.gain?.value ?? 0) <= 0.0001) return;

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

    // ✅ loops are always running; arp output depends on held core notes + arp setting
    this._ensureOrbitLoopsRunning();
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

  /**
   * Apply a Core Layer preset (ground/harmony/atmosphere).
   * - Disposes old layer synth graph cleanly
   * - Rebuilds ONLY that layer (core FX + buss remain stable)
   *
   * preset is expected to be an object understood by buildCoreLayerFromPreset()
   */
  setCoreLayerPreset(layerId, preset) {
    if (!this.initialized) return;
    if (!["ground", "harmony", "atmosphere"].includes(layerId)) return;

    const prev = this.core.layers[layerId];
    const prevGain = prev?.baseGain ?? 0.75;
    const prevMuted = !!prev?.muted;

    // Release any held notes for that layer
    try {
      this.activeNotes.core?.forEach((n) => {
        prev?.synth?.triggerRelease?.(n);
      });
    } catch {
      // ignore
    }

    // Dispose previous graph (layer-only)
    this._disposeCoreLayer(prev);

    // Build new layer graph from preset
    const next = this._buildCoreLayerFromPreset(layerId, preset, {
      baseGain: prevGain,
      muted: prevMuted,
    });

    this.core.layers[layerId] = next;

    // Respect mute/gain
    next.baseGain = clamp01(prevGain);
    next.muted = prevMuted;
    next.gain.gain.value = next.muted ? 0 : next.baseGain;
  }

  // ----- Orbit controls (continuous-safe) -----

  setOrbitGain(orbitId, normalized) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    const v = clamp01(normalized);
    orbit.baseGain = v;

    const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
    const target = !enabled ? 0 : orbit.muted ? 0 : v;

    if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(target, 0.03);
    else orbit.gain.gain.value = target;
  }

  setOrbitMute(orbitId, muted) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    orbit.muted = !!muted;

    const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
    const target = !enabled ? 0 : orbit.muted ? 0 : orbit.baseGain;

    if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(target, 0.03);
    else orbit.gain.gain.value = target;
  }

  setOrbitPan(orbitId, pan) {
    const orbit = this.orbits[orbitId];
    if (!orbit?.panner?.pan) return;

    const v = clamp(pan, -1, 1);

    if (orbit.panner.pan.rampTo) orbit.panner.pan.rampTo(v, 0.03);
    else orbit.panner.pan.value = v;
  }

  setOrbitEnabled(orbitId, enabled) {
    this.orbitConfig[orbitId] = {
      ...(this.orbitConfig[orbitId] || {}),
      enabled: !!enabled,
    };

    const orbit = this.orbits[orbitId];
    if (!orbit) return;

    // ✅ Always-running loops:
    // enabled=false: silence gain to 0 (and loop output gates anyway)
    // enabled=true: restore gain (or keep at 0 if muted)
    const target = !enabled ? 0 : orbit.muted ? 0 : orbit.baseGain;

    if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(target, 0.03);
    else orbit.gain.gain.value = target;

    // ✅ Ensure loops are running when enabled (no pattern toggle in UI)
    this._ensureOrbitLoopsRunning();
  }

  /**
   * ✅ Orbit timeSig (true polyrhythm model):
   * - numerator = pulses per MASTER CYCLE
   * - denominator is treated as UI label (not timing)
   */
  setOrbitTimeSig(orbitId, timeSig) {
    const nextSig = safeTimeSigString(timeSig || "4/4");
    const prev = this.orbitMotion?.[orbitId] || {};
    const changed = prev.timeSig !== nextSig;

    this.orbitMotion[orbitId] = {
      ...prev,
      timeSig: nextSig,
      ...(changed ? { step: 0 } : {}),
    };

    this._refreshOrbitInterval(orbitId);
  }

  setOrbitArp(orbitId, arp) {
    const nextArp = arp || "off";
    const prev = this.orbitMotion?.[orbitId] || {};
    const changed = prev.arp !== nextArp;

    this.orbitMotion[orbitId] = {
      ...prev,
      arp: nextArp,
      ...(changed ? { step: 0 } : {}),
    };
  }

  /**
   * rate controls note length / articulation only
   */
  setOrbitRate(orbitId, rate) {
    const prev = this.orbitMotion?.[orbitId] || {};
    this.orbitMotion[orbitId] = {
      ...prev,
      rate: rate || "8n",
    };
  }

  /**
   * ✅ Swap orbit synth based on ORBIT_VOICE_PRESETS
   * Preserves orbit panner/gain/meter chain.
   */
  setOrbitVoicePreset(orbitId, voicePreset) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;

    try {
      this.activeNotes[orbitId]?.forEach((n) => {
        orbit.synth.triggerRelease(n);
      });
      this.activeNotes[orbitId]?.clear?.();

      orbit.synth?.disconnect?.();
      orbit.synth?.dispose?.();

      // ✅ FIX: build from orbitVoiceFactory (stable + centralized).
      const synth = buildOrbitVoice(voicePreset);

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
   *
   * IMPORTANT:
   * - "Pattern" is assumed ALWAYS ON while an orbit is enabled.
   * - We do not use cfg.motion.patternOn anymore.
   */
  applyOrbitScenePreset(scene, voicePresetMap) {
    if (!this.initialized || !scene?.orbits) return;

    ["orbitA", "orbitB", "orbitC"].forEach((orbitId) => {
      const cfg = scene.orbits?.[orbitId];
      if (!cfg) return;

      // enabled controls sound gate + UI "ON/OFF"
      this.setOrbitEnabled(orbitId, !!cfg.enabled);

      const voiceId = cfg.voicePresetId || null;
      this.orbitConfig[orbitId] = {
        ...(this.orbitConfig[orbitId] || {}),
        voicePresetId: voiceId,
      };

      const voicePreset = voiceId ? voicePresetMap?.[voiceId] : null;
      if (voicePreset) this.setOrbitVoicePreset(orbitId, voicePreset);

      const mix = cfg.mix || {};
      this.setOrbitGain(orbitId, clamp01(mix.gain ?? 0.6));
      this.setOrbitPan(orbitId, clamp(mix.pan ?? 0, -1, 1));
      this.setOrbitMute(orbitId, !!mix.muted);

      const motion = cfg.motion || {};
      this.setOrbitTimeSig(orbitId, motion.timeSig || "4/4");
      this.setOrbitArp(orbitId, motion.arp || "off");
      this.setOrbitRate(orbitId, motion.rate || "8n");
    });

    // Ensure intervals match master cycle after applying scene
    this._refreshAllOrbitIntervals();

    // ✅ Always keep loops running; output is gated by enabled/muted/arp/core-held-notes
    this._ensureOrbitLoopsRunning();
  }

  /**
   * ✅ Apply core layers from a Core Layer preset bundle:
   * {
   *   ground: <presetObj>,
   *   harmony: <presetObj>,
   *   atmosphere: <presetObj>
   * }
   */
  applyCoreLayerPresetBundle(bundle) {
    if (!this.initialized || !bundle) return;

    if (bundle.ground) this.setCoreLayerPreset("ground", bundle.ground);
    if (bundle.harmony) this.setCoreLayerPreset("harmony", bundle.harmony);
    if (bundle.atmosphere) this.setCoreLayerPreset("atmosphere", bundle.atmosphere);
  }

  // ---------- INTERNAL ----------

  _applyMasterToTransport() {
    Tone.Transport.bpm.value = this.master.bpm;

    const { steps, denom } = parseTimeSig(this.master.timeSig);
    Tone.Transport.timeSignature = [steps, denom];
  }

  /**
   * Compute seconds for ONE measure based on current Transport settings.
   * Tone.Time("1m") uses Transport timeSignature internally.
   */
  _getMeasureSeconds() {
    try {
      const s = Tone.Time("1m").toSeconds();
      if (Number.isFinite(s) && s > 0) return s;
    } catch {
      // ignore
    }

    // fallback
    const bpm = Tone.Transport?.bpm?.value || this.master.bpm || 90;
    const beat = 60 / Math.max(1, bpm);
    return beat * 4;
  }

  _getMasterCycleSeconds() {
    const measures = clamp(parseInt(this.master.cycleMeasures, 10) || 1, 1, 64);
    return this._getMeasureSeconds() * measures;
  }

  _refreshAllOrbitIntervals() {
    ["orbitA", "orbitB", "orbitC"].forEach((id) => this._refreshOrbitInterval(id));
  }

  /**
   * ✅ True polyrhythm:
   * Orbit interval = masterCycleSeconds / orbitNumerator(steps)
   */
  _refreshOrbitInterval(orbitId) {
    const loop = this.orbitPatterns?.[orbitId];
    if (!loop) return;

    const motion = this.orbitMotion?.[orbitId] || {};
    const { steps } = parseTimeSig(motion.timeSig || "4/4");

    const cycleSeconds = this._getMasterCycleSeconds();
    const pulses = Math.max(1, steps);

    loop.interval = cycleSeconds / pulses;
  }

  _ensureOrbitLoopsRunning() {
    if (!this.initialized) return;

    ["orbitA", "orbitB", "orbitC"].forEach((orbitId) => {
      const loop = this.orbitPatterns?.[orbitId];
      if (!loop) return;
      if (loop.state !== "started") loop.start(0);
    });
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

    // CORE FX (hi-res space)
    this.coreReverb = new Tone.Reverb({
      decay: 6.5,
      wet: 0.28,
    });

    this.coreDelay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.25,
      wet: 0.18,
    });

    // CORE BUSS
    this.coreBuss = new Tone.Gain(1).connect(this.masterGain);
    this.coreMeter = makeMeter();
    this.coreBuss.connect(this.coreMeter);

    // Route FX returns to master
    this.coreReverb.connect(this.masterGain);
    this.coreDelay.connect(this.masterGain);

    // CORE LAYERS (built via presets factory defaults)
    this.core.layers.ground = this._buildCoreLayerFromPreset("ground", null, {
      baseGain: 0.9,
      muted: false,
    });

    this.core.layers.harmony = this._buildCoreLayerFromPreset("harmony", null, {
      baseGain: 0.8,
      muted: false,
    });

    this.core.layers.atmosphere = this._buildCoreLayerFromPreset("atmosphere", null, {
      baseGain: 0.7,
      muted: false,
    });

    // ORBITS (fallback voices; scene presets can swap these)
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

    // Orbit pattern loops
    this.orbitPatterns.orbitA = this._makeOrbitArpLoop("orbitA");
    this.orbitPatterns.orbitB = this._makeOrbitArpLoop("orbitB");
    this.orbitPatterns.orbitC = this._makeOrbitArpLoop("orbitC");

    // Set initial intervals (master-cycle based)
    this._refreshAllOrbitIntervals();
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

    return {
      synth,
      panner,
      gain,
      meter,
      muted: false,
      baseGain,
      _filter: null,
    };
  }

  _disposeCoreLayer(layer) {
    if (!layer) return;

    try {
      layer.synth?.disconnect?.();
      layer.synth?.dispose?.();
    } catch {
      // ignore
    }

    try {
      layer.preGain?.disconnect?.();
      layer.preGain?.dispose?.();
    } catch {
      // ignore
    }

    try {
      layer.gain?.disconnect?.();
      layer.gain?.dispose?.();
    } catch {
      // ignore
    }

    try {
      layer.meter?.disconnect?.();
      layer.meter?.dispose?.();
    } catch {
      // ignore
    }

    try {
      layer.sendReverb?.disconnect?.();
      layer.sendReverb?.dispose?.();
    } catch {
      // ignore
    }

    try {
      layer.sendDelay?.disconnect?.();
      layer.sendDelay?.dispose?.();
    } catch {
      // ignore
    }
  }

  /**
   * Build a core layer from a preset using coreVoiceFactory.
   * We keep the buss + FX stable, and connect:
   *   synth -> preGain -> (dry gain -> coreBuss)
   *                -> (reverb send -> coreReverb)
   *                -> (delay send -> coreDelay)
   */
  _buildCoreLayerFromPreset(layerId, preset, { baseGain = 0.75, muted = false } = {}) {
    // buildCoreLayerFromPreset is responsible for returning a playable synth graph
    // It may return:
    //  - Tone.PolySynth / Tone.Synth / Tone.Sampler / Tone.Instrument-ish object with triggerAttack/Release
    //  - OR { synth, output } where output is an AudioNode to connect
    const built = buildCoreLayerFromPreset(layerId, preset);

    let synth = built;
    let outputNode = built;

    if (built && typeof built === "object" && built.synth && built.output) {
      synth = built.synth;
      outputNode = built.output;
    }

    // Pre-gain (lets us control FX sends without changing dry level math)
    const preGain = new Tone.Gain(1);

    // Dry path
    const gain = new Tone.Gain(clamp01(baseGain)).connect(this.coreBuss);

    // Meter (post-dry)
    const meter = makeMeter();
    gain.connect(meter);

    // FX sends
    const sendReverb = new Tone.Gain(0.18).connect(this.coreReverb);
    const sendDelay = new Tone.Gain(0.12).connect(this.coreDelay);

    // Connect graph
    outputNode.connect(preGain);
    preGain.connect(gain);
    preGain.connect(sendReverb);
    preGain.connect(sendDelay);

    // Apply mute
    gain.gain.value = muted ? 0 : clamp01(baseGain);

    return {
      synth,
      output: outputNode,
      preGain,
      gain,
      meter,
      sendReverb,
      sendDelay,
      muted: !!muted,
      baseGain: clamp01(baseGain),
      presetId: preset?.id ?? null,
    };
  }

  /**
   * Orbit ARP loop (true polyrhythm model):
   * - Loop interval is masterCycleSeconds / numerator
   * - step wraps at numerator
   * - rate controls note duration
   *
   * ✅ Always running.
   * ✅ Only outputs when:
   *   - orbit enabled
   *   - orbit not muted
   *   - orbit gain > 0
   *   - arp != "off"
   *   - there are HELD core notes (no autoplay)
   */
  _makeOrbitArpLoop(orbitId) {
    const loop = new Tone.Loop((time) => {
      const orbit = this.orbits[orbitId];
      if (!orbit) return;

      const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
      if (!enabled) return;

      if (orbit.muted) return;
      if ((orbit.gain?.gain?.value ?? 0) <= 0.0001) return;

      const motion = this.orbitMotion?.[orbitId] || {};
      const arp = motion.arp || "off";
      if (arp === "off") return;

      const chord = Array.from(this.activeNotes.core || []);
      if (!chord.length) return;

      const { steps } = parseTimeSig(motion.timeSig || "4/4");
      const noteLen = motion.rate || "8n";

      const sorted = chord
        .map((n) => ({ n, m: Tone.Frequency(n).toMidi() }))
        .sort((a, b) => a.m - b.m)
        .map((x) => x.n);

      if (!sorted.length) return;

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
          const cycle = sorted.length * 2 - 2;
          const i = cycle > 0 ? idxBase % cycle : 0;
          pick = i < sorted.length ? i : cycle - i;
          break;
        }
      }

      const note = sorted[pick] || sorted[0];
      orbit.synth.triggerAttackRelease(note, noteLen, time);

      this.orbitMotion[orbitId] = {
        ...motion,
        step: (step + 1) % Math.max(1, steps),
      };
    }, 0.25); // placeholder; overwritten by _refreshOrbitInterval()

    return loop;
  }
}

export const omseEngine = new OMSEEngine();