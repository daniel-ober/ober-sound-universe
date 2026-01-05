// src/engine/omseEngine.js
import * as Tone from "tone";
import { buildOrbitVoice } from "./orbitVoiceFactory";
import { buildCoreLayerFromPreset } from "./coreVoiceFactory";

function makeMeter() {
  return new Tone.Meter({
    channels: 1,
    smoothing: 0.8,
    normalRange: true,
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

class OMSEEngine {
  constructor() {
    this.initialized = false;

    this.masterGain = null;
    this.masterMeter = null;
    this.masterAnalyser = null;

    this.coreReverb = null;
    this.coreDelay = null;

    this.coreBuss = null;
    this.coreMeter = null;

    this.core = {
      layers: {
        ground: null,
        harmony: null,
        atmosphere: null,
      },
    };

    this.orbits = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };

    this.activeNotes = {
      core: new Set(),
      orbitA: new Set(),
      orbitB: new Set(),
      orbitC: new Set(),
    };

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

    this.orbitPatterns = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };

    this.master = {
      timeSig: "4/4",
      cycleMeasures: 1,
      bpm: 90,
    };

    // ✅ if App calls setCoreLayerPreset before graph exists, we queue it.
    this._pendingCorePresetByLayer = {
      ground: null,
      harmony: null,
      atmosphere: null,
    };
  }

  async startAudioContext() {
    if (this.initialized) return;

    await Tone.start();
    this._buildGraph();

    this._applyMasterToTransport();
    Tone.Transport.start();

    this._refreshAllOrbitIntervals();
    this._ensureOrbitLoopsRunning();

    this.initialized = true;

    // ✅ Apply any queued core swaps (prevents silent return)
    await this._applyPendingCorePresets();
  }

  // ---------------------------
  // ✅ CORE note helpers
  // ---------------------------
_coreAttackLayer(layer, note, velocity = 0.9) {
  if (!layer?.synth) return;
  if (layer.muted) return;
  if ((layer.gain?.gain?.value ?? 1) <= 0.0001) return;

  try {
    if (layer.synthType === "sampler") {
      // Sampler MUST have a duration
      layer.synth.triggerAttackRelease(
        note,
        "1n",           // ← long enough to hear, released cleanly
        undefined,
        velocity
      );
    } else {
      layer.synth.triggerAttack(note, undefined, velocity);
    }
  } catch {
    // ignore
  }
}

_coreReleaseLayer(layer, note) {
  if (!layer?.synth) return;

  // Sampler releases itself via triggerAttackRelease
  if (layer.synthType === "sampler") return;

  const t = layer.synthType || "poly";

  if (t === "mono") {
    try {
      layer.synth.triggerRelease();
    } catch {}
    return;
  }

  try {
    layer.synth.triggerRelease(note);
  } catch {
    try {
      layer.synth.releaseAll?.();
    } catch {}
  }
}

  _coreReleaseAllHeldNotesOnLayer(layer) {
    if (!layer?.synth) return;

    const held = Array.from(this.activeNotes.core || []);
    held.forEach((note) => this._coreReleaseLayer(layer, note));

    try {
      layer.synth.releaseAll?.();
    } catch {
      // ignore
    }
  }

  async _applyPendingCorePresets() {
    const layers = ["ground", "harmony", "atmosphere"];
    for (const layerId of layers) {
      const p = this._pendingCorePresetByLayer?.[layerId];
      if (!p) continue;
      this._pendingCorePresetByLayer[layerId] = null;
      await this.setCoreLayerPreset(layerId, p);
    }
  }

  // ✅ swap a core layer instrument safely at runtime (supports sampler)
  async setCoreLayerPreset(layerId, preset) {
    // If graph not built yet, queue it and exit.
    if (!this.core?.layers || !this.core.layers[layerId]) {
      this._pendingCorePresetByLayer[layerId] = preset || null;
      return;
    }

    const existing = this.core.layers[layerId];

    const preserved = {
      baseGain: existing.baseGain ?? 0.8,
      muted: !!existing.muted,
    };

    try {
      this._coreReleaseAllHeldNotesOnLayer(existing);
    } catch {
      // ignore
    }

    try {
      existing?._disposeBuilt?.();
    } catch {
      // ignore
    }
    try {
      existing?.gain?.disconnect?.();
      existing?.gain?.dispose?.();
    } catch {
      // ignore
    }
    try {
      existing?.meter?.dispose?.();
    } catch {
      // ignore
    }

    const next = this._buildCoreLayerFromPreset(preset, preserved.baseGain);

    next.muted = preserved.muted;
    next.baseGain = preserved.baseGain;
    next.gain.gain.value = next.muted ? 0 : next.baseGain;

    this.core.layers[layerId] = next;

    // ✅ IMPORTANT:
    // Wait for sampler buffers to load AND also wait for Tone.loaded()
    if (next.ready && typeof next.ready.then === "function") {
      try {
        await next.ready;
      } catch (e) {
        console.warn(`[OMSE] sampler load failed for core layer "${layerId}"`, e);
      }
    }

    try {
      await Tone.loaded();
    } catch {
      // ignore
    }
  }

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

  noteOn(voiceId, note, velocity = 0.9) {
    if (!this.initialized) return;

    if (voiceId === "core") {
      Object.values(this.core.layers).forEach((layer) => {
        this._coreAttackLayer(layer, note, velocity);
      });
      this.activeNotes.core.add(note);
      return;
    }

    const orbit = this.orbits[voiceId];
    if (!orbit) return;

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
        this._coreReleaseLayer(layer, note);
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

    const target = !enabled ? 0 : orbit.muted ? 0 : orbit.baseGain;

    if (orbit.gain?.gain?.rampTo) orbit.gain.gain.rampTo(target, 0.03);
    else orbit.gain.gain.value = target;

    this._ensureOrbitLoopsRunning();
  }

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

  setOrbitRate(orbitId, rate) {
    const prev = this.orbitMotion?.[orbitId] || {};
    this.orbitMotion[orbitId] = {
      ...prev,
      rate: rate || "8n",
    };
  }

  setOrbitVoicePreset(orbitId, voicePreset) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;

    try {
      this.activeNotes[orbitId]?.forEach((n) => orbit.synth.triggerRelease(n));
      this.activeNotes[orbitId]?.clear?.();

      orbit.synth?.disconnect?.();
      orbit.synth?.dispose?.();

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
      console.warn("setOrbitVoicePreset failed:", e);
    }
  }

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

  getMasterSpectrum = () => {
    if (!this.masterAnalyser) return null;

    const values = this.masterAnalyser.getValue();
    if (!values || !values.length) return null;

    return Array.from(values, (v) => {
      const db = typeof v === "number" ? v : -100;
      return clamp01((db + 100) / 80);
    });
  };

  _applyMasterToTransport() {
    Tone.Transport.bpm.value = this.master.bpm;

    const { steps, denom } = parseTimeSig(this.master.timeSig);
    Tone.Transport.timeSignature = [steps, denom];
  }

  _getMeasureSeconds() {
    try {
      const s = Tone.Time("1m").toSeconds();
      if (Number.isFinite(s) && s > 0) return s;
    } catch {
      // ignore
    }

    const bpm = Tone.Transport?.bpm?.value || this.master.bpm || 90;
    const beat = 60 / Math.max(1, bpm);
    return beat * 4;
  }

  _getMasterCycleSeconds() {
    const measures = clamp(parseInt(this.master.cycleMeasures, 10) || 1, 1, 64);
    return this._getMeasureSeconds() * measures;
  }

  _refreshAllOrbitIntervals() {
    ["orbitA", "orbitB", "orbitC"].forEach((id) =>
      this._refreshOrbitInterval(id)
    );
  }

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
    this.masterGain = new Tone.Gain(0.9).toDestination();

    this.masterMeter = makeMeter();
    this.masterGain.connect(this.masterMeter);

    this.masterAnalyser = new Tone.Analyser("fft", 1024);
    this.masterGain.connect(this.masterAnalyser);

    this.coreReverb = new Tone.Reverb({
      decay: 7.0,
      preDelay: 0.02,
      wet: 0.22,
    }).connect(this.masterGain);

    this.coreDelay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.18,
      wet: 0.14,
    }).connect(this.masterGain);

    this.coreBuss = new Tone.Gain(1).connect(this.masterGain);

    this.coreMeter = makeMeter();
    this.coreBuss.connect(this.coreMeter);

    // Defaults until swapped by App
    this.core.layers.ground = this._buildCoreLayerFromPreset(null, 0.9);
    this.core.layers.harmony = this._buildCoreLayerFromPreset(null, 0.8);
    this.core.layers.atmosphere = this._buildCoreLayerFromPreset(null, 0.7);

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

    this.orbitPatterns.orbitA = this._makeOrbitArpLoop("orbitA");
    this.orbitPatterns.orbitB = this._makeOrbitArpLoop("orbitB");
    this.orbitPatterns.orbitC = this._makeOrbitArpLoop("orbitC");

    this._refreshAllOrbitIntervals();
  }

  _buildCoreLayerFromPreset(preset, baseGain) {
    const safePreset =
      preset ||
      ({
        id: "defaultCore",
        engine: "poly",
        params: {
          polyType: "synth",
          synth: {
            oscillator: { type: "sine" },
            envelope: {
              attack: 0.02,
              decay: 0.35,
              sustain: 0.6,
              release: 1.6,
            },
          },
          filter: { type: "lowpass", frequency: 6000, Q: 0.7 },
          drive: { amount: 0.0 },
          chorus: null,
          width: { amount: 0.0 },
          reverbSend: 0.08,
          delaySend: 0.0,
        },
      });

    const built = buildCoreLayerFromPreset(safePreset);

    const gain = new Tone.Gain(baseGain).connect(this.coreBuss);
    const meter = makeMeter();
    gain.connect(meter);

    built.output.connect(gain);

    if (built.reverbSendGain && this.coreReverb)
      built.reverbSendGain.connect(this.coreReverb);
    if (built.delaySendGain && this.coreDelay)
      built.delaySendGain.connect(this.coreDelay);

    return {
      synth: built.synth,
      synthType: built.synthType || "poly",
      gain,
      meter,
      muted: false,
      baseGain,
      ready: built.ready,
      _disposeBuilt: built.dispose,
    };
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
    }, 0.25);

    return loop;
  }
}

export const omseEngine = new OMSEEngine();

window.omseEngine = omseEngine;