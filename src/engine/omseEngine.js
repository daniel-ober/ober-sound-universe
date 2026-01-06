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

/**
 * ✅ Accept either 0–1 or 0–100 inputs.
 * - If value > 1.001, assume it's a percent (0–100) and divide by 100.
 * This prevents “silent but loaded” sampler layers caused by 0.9 being treated as 0.9%.
 */
function normalizeGainLike(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const scaled = n > 1.001 ? n / 100 : n;
  return clamp01(scaled);
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

function toMidiSafe(note) {
  try {
    const m = Tone.Frequency(note).toMidi();
    return Number.isFinite(m) ? m : null;
  } catch {
    return null;
  }
}

/**
 * ✅ Prevent “freeze” caused by automation backlog while dragging sliders.
 * Cancel queued automation before applying the next change.
 *
 * Also: make sure value is finite and not wildly out of range.
 */
function smoothParam(param, value, rampSeconds = 0.03) {
  if (!param) return;

  const now = Tone.now();
  const v = Number(value);
  if (!Number.isFinite(v)) return;

  // Try to cancel queued automation first (prevents backlog)
  try {
    if (typeof param.cancelAndHoldAtTime === "function") {
      param.cancelAndHoldAtTime(now);
    } else if (typeof param.cancelScheduledValues === "function") {
      param.cancelScheduledValues(now);
    }
  } catch {
    // ignore
  }

  // Prefer rampTo if available (Tone.Param / Signal)
  try {
    if (typeof param.rampTo === "function") {
      param.rampTo(v, rampSeconds);
      return;
    }
  } catch {
    // fallthrough
  }

  // AudioParam style
  try {
    if (typeof param.setValueAtTime === "function") {
      param.setValueAtTime(v, now);
      return;
    }
  } catch {
    // ignore
  }

  // Last resort
  try {
    param.value = v;
  } catch {
    // ignore
  }
}

/**
 * Detect a "kind" for orbit synths so our arp + keyboard can drive them correctly.
 */
function detectOrbitVoiceKind(synth, voicePreset) {
  const presetType =
    (voicePreset?.type ||
      voicePreset?.engine ||
      voicePreset?.id ||
      voicePreset?.name ||
      "") + "";

  const t = presetType.toLowerCase();

  if (t.includes("sampler")) return "sampler";
  if (t.includes("noise")) return "noise";
  if (t.includes("metal")) return "metal";

  const ctor = synth?.constructor?.name?.toLowerCase?.() || "";
  if (ctor.includes("sampler")) return "sampler";
  if (ctor.includes("noisesynth")) return "noise";
  if (ctor.includes("metalsynth")) return "metal";
  if (ctor.includes("monosynth")) return "mono";
  if (ctor.includes("amsynth")) return "am";
  if (ctor.includes("fmsynth")) return "fm";
  if (ctor.includes("polysynth")) return "poly";

  return "poly";
}

/**
 * One place to play orbit notes, to ensure different voice types are driven correctly.
 * - poly/mono/sampler: note-based
 * - metal: pitch via frequency param + dur trigger
 * - noise: dur trigger (no pitch)
 */
function playOrbitNote(orbit, note, noteLen, time, velocity = 0.85) {
  const synth = orbit?.synth;
  if (!synth) return;

  const kind = orbit.voiceKind || "poly";

  if (kind === "noise") {
    try {
      // NoiseSynth: triggerAttackRelease(duration, time, vel)
      synth.triggerAttackRelease(noteLen, time, velocity);
    } catch {
      // ignore
    }
    return;
  }

  if (kind === "metal") {
    try {
      const hz = Tone.Frequency(note).toFrequency();
      if (synth.frequency && typeof synth.frequency.setValueAtTime === "function") {
        synth.frequency.setValueAtTime(hz, time);
      } else if (synth.frequency && typeof synth.frequency.value === "number") {
        synth.frequency.value = hz;
      }
      // MetalSynth: triggerAttackRelease(duration, time, vel)
      synth.triggerAttackRelease(noteLen, time, velocity);
      return;
    } catch {
      // fallthrough
    }
  }

  // Generic synths/sampler: triggerAttackRelease(note, dur, time, vel)
  try {
    synth.triggerAttackRelease(note, noteLen, time, velocity);
  } catch {
    try {
      synth.triggerAttack(note, time, velocity);
      const sec =
        typeof Tone.Time(noteLen).toSeconds === "function"
          ? Tone.Time(noteLen).toSeconds()
          : 0.25;
      synth.triggerRelease(note, time + Math.max(0.01, sec));
    } catch {
      // ignore
    }
  }
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
      orbitA: new Map(),
      orbitB: new Map(),
      orbitC: new Map(),
    };

    this._coreGroundHeld = new Set();
    this._coreGroundCurrent = null;

    this._coreLoopRunning = {
      atmosphere: false,
      ground: false,
      harmony: false,
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

    // ✅ NEW: orbit pattern gating (what your App toggle expects)
    this.orbitPatternEnabled = {
      orbitA: false,
      orbitB: false,
      orbitC: false,
    };

    this.orbitPatterns = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };

    // ✅ Master cycle loop (for "allResolve" flash)
    this.masterCycleLoop = null;

    this.master = {
      timeSig: "4/4",
      cycleMeasures: 1,
      bpm: 90,
    };

    this._pendingCorePresetByLayer = {
      ground: null,
      harmony: null,
      atmosphere: null,
    };

    // ✅ UI event bus (audio-time accurate scheduling via Tone.Draw)
    this._uiListeners = new Set();
    this.onUIEvent = (fn) => {
      if (typeof fn !== "function") return () => {};
      this._uiListeners.add(fn);
      return () => this._uiListeners.delete(fn);
    };
    this._emitUI = (type, payload) => {
      for (const fn of this._uiListeners) {
        try {
          fn({ type, payload });
        } catch {
          // ignore listener errors
        }
      }
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
    this._ensureMasterCycleLoopRunning();

    this.initialized = true;

    await this._applyPendingCorePresets();
  }

  // ---------------------------
  // CORE note helpers
  // ---------------------------
  _coreAttackLayer(layerId, layer, note, velocity = 0.9) {
    if (!layer?.synth) return;
    if (layer.muted) return;
    if ((layer.gain?.gain?.value ?? 1) <= 0.0001) return;

    const t = layer.synthType || "poly";

    if (t === "loop") {
      try {
        if (!this._coreLoopRunning[layerId]) {
          if (layer.synth.state !== "started") layer.synth.start();
          this._coreLoopRunning[layerId] = true;
        }
      } catch {
        // ignore
      }
      return;
    }

    try {
      layer.synth.triggerAttack(note, undefined, velocity);
    } catch {
      // ignore
    }
  }

  _coreReleaseLayer(layerId, layer, note) {
    if (!layer?.synth) return;

    const t = layer.synthType || "poly";
    if (t === "loop") return;

    if (t === "sampler") {
      try {
        layer.synth.triggerRelease(note);
      } catch {}
      return;
    }

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

  _coreStopLoopLayerIfRunning(layerId) {
    const layer = this.core?.layers?.[layerId];
    if (!layer?.synth) return;
    if (layer.synthType !== "loop") return;
    if (!this._coreLoopRunning[layerId]) return;

    try {
      layer.synth.stop();
    } catch {}

    this._coreLoopRunning[layerId] = false;
  }

  _coreReleaseAllHeldNotesOnLayer(layerId, layer) {
    if (!layer?.synth) return;

    if ((layer.synthType || "poly") === "loop") {
      this._coreStopLoopLayerIfRunning(layerId);
      return;
    }

    const held = Array.from(this.activeNotes.core || []);
    held.forEach((note) => this._coreReleaseLayer(layerId, layer, note));

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

  async setCoreLayerPreset(layerId, preset) {
    if (!this.core?.layers || !this.core.layers[layerId]) {
      this._pendingCorePresetByLayer[layerId] = preset || null;
      return;
    }

    const existing = this.core.layers[layerId];

    const preserved = {
      baseGain: normalizeGainLike(existing.baseGain ?? 0.8),
      muted: !!existing.muted,
      pan: existing.pan ?? 0,
    };

    try {
      this._coreReleaseAllHeldNotesOnLayer(layerId, existing);
      if (layerId === "ground" && this._coreGroundCurrent) {
        this._coreReleaseLayer(layerId, existing, this._coreGroundCurrent);
      }
    } catch {}

    try {
      this._coreStopLoopLayerIfRunning(layerId);
    } catch {}

    try {
      existing?._disposeBuilt?.();
    } catch {}

    try {
      existing?.outputPanner?.disconnect?.();
      existing?.outputPanner?.dispose?.();
    } catch {}

    try {
      existing?.gain?.disconnect?.();
      existing?.gain?.dispose?.();
    } catch {}

    try {
      existing?.meter?.dispose?.();
    } catch {}

    const next = this._buildCoreLayerFromPreset(
      preset,
      preserved.baseGain,
      preserved.pan
    );

    next.muted = preserved.muted;
    next.baseGain = preserved.baseGain;
    next.pan = preserved.pan;

    smoothParam(next.gain?.gain, next.muted ? 0 : next.baseGain, 0.01);

    this.core.layers[layerId] = next;
    this._coreLoopRunning[layerId] = false;

    if (next.ready && typeof next.ready.then === "function") {
      try {
        await next.ready;
      } catch (e) {
        console.warn(`[OMSE] asset load failed for core layer "${layerId}"`, e);
      }
    }

    try {
      await Tone.loaded();
    } catch {
      // ignore
    }
  }

  // ---------------------------
  // MIX CONTROLS (NO REBUILD)
  // ---------------------------
  setCoreLayerGain(layerId, normalizedOrPercent) {
    const layer = this.core.layers[layerId];
    if (!layer) return;

    const v = normalizeGainLike(normalizedOrPercent);
    layer.baseGain = v;

    const target = layer.muted ? 0 : v;
    smoothParam(layer.gain?.gain, target, 0.03);
  }

  setCoreLayerMute(layerId, muted) {
    const layer = this.core.layers[layerId];
    if (!layer) return;
    layer.muted = !!muted;

    const target = layer.muted ? 0 : normalizeGainLike(layer.baseGain);
    smoothParam(layer.gain?.gain, target, 0.03);
  }

  setCoreLayerPan(layerId, pan) {
    const layer = this.core.layers[layerId];
    if (!layer?.outputPanner?.pan) return;

    const v = clamp(pan, -1, 1);
    layer.pan = v;

    smoothParam(layer.outputPanner.pan, v, 0.03);
  }

  setOrbitGain(orbitId, normalizedOrPercent) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;

    const v = normalizeGainLike(normalizedOrPercent);
    orbit.baseGain = v;

    const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
    const target = !enabled ? 0 : orbit.muted ? 0 : v;

    smoothParam(orbit.gain?.gain, target, 0.03);
  }

  setOrbitMute(orbitId, muted) {
    const orbit = this.orbits[orbitId];
    if (!orbit) return;
    orbit.muted = !!muted;

    const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
    const base = normalizeGainLike(orbit.baseGain);
    const target = !enabled ? 0 : orbit.muted ? 0 : base;

    smoothParam(orbit.gain?.gain, target, 0.03);
  }

  setOrbitPan(orbitId, pan) {
    const orbit = this.orbits[orbitId];
    if (!orbit?.panner?.pan) return;

    const v = clamp(pan, -1, 1);
    orbit.pan = v;

    smoothParam(orbit.panner.pan, v, 0.03);
  }

  // ---------------------------
  // ORBIT PATTERN ON/OFF  ✅ (what App expects)
  // ---------------------------
  setOrbitPatternState(orbitId, isOn) {
    const id = orbitId;
    if (!this.orbitPatternEnabled?.hasOwnProperty?.(id)) return;

    const v = !!isOn;
    this.orbitPatternEnabled[id] = v;

    // optional: reset step when turning on
    if (v) {
      const prev = this.orbitMotion?.[id] || {};
      this.orbitMotion[id] = { ...prev, step: 0 };
    }

    this._ensureOrbitLoopsRunning();
  }

  // ---------------------------
  // TRANSPORT
  // ---------------------------
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

  // ---------------------------
  // CORE GROUND: LOWEST NOTE ONLY
  // ---------------------------
  _corePickLowestHeldNote() {
    const notes = Array.from(this._coreGroundHeld);
    if (!notes.length) return null;

    let best = notes[0];
    let bestM = toMidiSafe(best);

    for (let i = 1; i < notes.length; i++) {
      const n = notes[i];
      const m = toMidiSafe(n);
      if (m == null) continue;
      if (bestM == null || m < bestM) {
        best = n;
        bestM = m;
      }
    }
    return best;
  }

  _coreUpdateGroundMono(velocity = 0.9) {
    const ground = this.core.layers.ground;
    if (!ground?.synth) return;

    const next = this._corePickLowestHeldNote();
    const curr = this._coreGroundCurrent;

    if (next === curr) return;

    if (curr) this._coreReleaseLayer("ground", ground, curr);

    this._coreGroundCurrent = next;

    if (next) this._coreAttackLayer("ground", ground, next, velocity);
  }

  // ---------------------------
  // NOTE ON/OFF
  // ---------------------------
  noteOn(voiceId, note, velocity = 0.9) {
    if (!this.initialized) return;

    if (voiceId === "core") {
      this.activeNotes.core.add(note);

      this._coreGroundHeld.add(note);
      this._coreUpdateGroundMono(velocity);

      const harmony = this.core.layers.harmony;
      const atmos = this.core.layers.atmosphere;

      this._coreAttackLayer("harmony", harmony, note, velocity);
      this._coreAttackLayer("atmosphere", atmos, note, velocity);

      return;
    }

    const orbit = this.orbits[voiceId];
    if (!orbit) return;

    const enabled = !!this.orbitConfig?.[voiceId]?.enabled;
    if (!enabled) return;
    if (orbit.muted) return;
    if ((orbit.gain?.gain?.value ?? 0) <= 0.0001) return;

    const map = this.activeNotes[voiceId];
    if (!map) return;
    if (map.has(note)) return;

    // ✅ For noise/metal, there is no real sustain. Use short bursts and ignore noteOff.
    if (orbit.voiceKind === "noise" || orbit.voiceKind === "metal") {
      try {
        playOrbitNote(orbit, note, "8n", Tone.now(), velocity);
      } catch {}
      map.set(note, orbit.synth);
      return;
    }

    // ✅ Normal note-based synths/sampler
    try {
      orbit.synth.triggerAttack(note, undefined, velocity);
      map.set(note, orbit.synth);
    } catch {
      // ignore
    }
  }

  noteOff(voiceId, note) {
    if (!this.initialized) return;

    if (voiceId === "core") {
      if (!this.activeNotes.core.has(note)) return;

      this.activeNotes.core.delete(note);

      this._coreGroundHeld.delete(note);
      this._coreUpdateGroundMono();

      const harmony = this.core.layers.harmony;
      this._coreReleaseLayer("harmony", harmony, note);

      if (this.activeNotes.core.size === 0) {
        this._coreStopLoopLayerIfRunning("atmosphere");
      }

      return;
    }

    const orbit = this.orbits[voiceId];
    if (!orbit) return;

    const map = this.activeNotes[voiceId];
    if (!map || !map.has(note)) return;

    const ownerSynth = map.get(note);
    map.delete(note);

    // ✅ For noise/metal we used one-shots; nothing to release
    if (orbit.voiceKind === "noise" || orbit.voiceKind === "metal") return;

    try {
      ownerSynth?.triggerRelease?.(note);
    } catch {
      try {
        orbit.synth.triggerRelease(note);
      } catch {}
    }
  }

  // ---------------------------
  // ORBIT CONFIG + PRESET SWAP
  // ---------------------------
  setOrbitEnabled(orbitId, enabled) {
    this.orbitConfig[orbitId] = {
      ...(this.orbitConfig[orbitId] || {}),
      enabled: !!enabled,
    };

    const orbit = this.orbits[orbitId];
    if (!orbit) return;

    const base = normalizeGainLike(orbit.baseGain);
    const target = !enabled ? 0 : orbit.muted ? 0 : base;
    smoothParam(orbit.gain?.gain, target, 0.03);

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
      // stop any held notes mapped to old synth
      const map = this.activeNotes?.[orbitId];
      if (map && map.size) {
        for (const [note, ownerSynth] of map.entries()) {
          try {
            ownerSynth?.triggerRelease?.(note);
          } catch {}
        }
        map.clear();
      }

      // tear down old filter if present
      if (orbit._filter) {
        try {
          orbit._filter.disconnect();
          orbit._filter.dispose();
        } catch {}
        orbit._filter = null;
      }

      // dispose old synth
      try {
        orbit.synth?.disconnect?.();
        orbit.synth?.dispose?.();
      } catch {}

      // build new synth from preset (factory)
      const synth = buildOrbitVoice(voicePreset);

      // store kind so arp + keyboard can drive it correctly
      orbit.voiceKind = detectOrbitVoiceKind(synth, voicePreset);

      // optional filter insert
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
        synth.connect(orbit.panner);
      }

      orbit.synth = synth;
    } catch (e) {
      console.warn("setOrbitVoicePreset failed:", e);
    }
  }

  // ---------------------------
  // METERS / FFT
  // ---------------------------
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
    } catch {}

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

    if (this.masterCycleLoop) {
      this.masterCycleLoop.interval = this._getMasterCycleSeconds();
    }
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

    this._ensureMasterCycleLoopRunning();
  }

  // ✅ master-cycle loop builder + runner (allResolve flash)
  _makeMasterCycleLoop() {
    const loop = new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        this._emitUI("allResolve", {});
      }, time);
    }, this._getMasterCycleSeconds());

    return loop;
  }

  _ensureMasterCycleLoopRunning() {
    if (!this.masterCycleLoop) return;
    if (this.masterCycleLoop.state !== "started") this.masterCycleLoop.start(0);
  }

  // ---------------------------
  // GRAPH BUILD
  // ---------------------------
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

    this.core.layers.ground = this._buildCoreLayerFromPreset(null, 0.9, 0);
    this.core.layers.harmony = this._buildCoreLayerFromPreset(null, 0.8, 0);
    this.core.layers.atmosphere = this._buildCoreLayerFromPreset(null, 0.7, 0);

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

    this.masterCycleLoop = this._makeMasterCycleLoop();

    this._refreshAllOrbitIntervals();
  }

  _buildCoreLayerFromPreset(preset, baseGain, pan = 0) {
    const safePreset =
      preset ||
      ({
        id: "defaultCore",
        engine: "poly",
        params: {
          polyType: "synth",
          synth: {
            oscillator: { type: "sine" },
            envelope: { attack: 0.02, decay: 0.35, sustain: 0.6, release: 1.6 },
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

    const outputPanner = new Tone.Panner(clamp(pan, -1, 1));

    const g = normalizeGainLike(baseGain);
    const gain = new Tone.Gain(g).connect(this.coreBuss);
    const meter = makeMeter();
    gain.connect(meter);

    built.output.connect(outputPanner);
    outputPanner.connect(gain);

    if (built.reverbSendGain && this.coreReverb)
      built.reverbSendGain.connect(this.coreReverb);
    if (built.delaySendGain && this.coreDelay)
      built.delaySendGain.connect(this.coreDelay);

    return {
      synth: built.synth,
      synthType: built.synthType || "poly",
      outputPanner,
      pan: clamp(pan, -1, 1),
      gain,
      meter,
      muted: false,
      baseGain: g,
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

    const g = normalizeGainLike(baseGain);
    const gain = new Tone.Gain(g).connect(this.masterGain);

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
      baseGain: g,
      pan: typeof pan === "number" ? pan : 0,
      _filter: null,
      voiceKind: detectOrbitVoiceKind(synth, { engine: "synth" }),
    };
  }

  _makeOrbitArpLoop(orbitId) {
    const loop = new Tone.Loop((time) => {
      const orbit = this.orbits[orbitId];
      if (!orbit) return;

      const enabled = !!this.orbitConfig?.[orbitId]?.enabled;
      if (!enabled) return;

      // ✅ pattern gating (what your UI toggle is meant to do)
      if (!this.orbitPatternEnabled?.[orbitId]) return;

      if (orbit.muted) return;
      if ((orbit.gain?.gain?.value ?? 0) <= 0.0001) return;

      const motion = this.orbitMotion?.[orbitId] || {};
      const arp = motion.arp || "off";
      if (arp === "off") return;

      const chord = Array.from(this.activeNotes.core || []);
      if (!chord.length) return;

      const { steps } = parseTimeSig(motion.timeSig || "4/4");
      const totalSteps = Math.max(1, steps);
      const noteLen = motion.rate || "8n";

      const sorted = chord
        .map((n) => ({ n, m: Tone.Frequency(n).toMidi() }))
        .sort((a, b) => a.m - b.m)
        .map((x) => x.n);

      if (!sorted.length) return;

      const step = motion.step || 0;
      const idxBase = step % totalSteps;

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

      playOrbitNote(orbit, note, noteLen, time, 0.85);

      const nextStep = (step + 1) % totalSteps;

      if (nextStep === 0) {
        Tone.Draw.schedule(() => {
          this._emitUI("orbitRevolution", { orbitId });
        }, time);
      }

      this.orbitMotion[orbitId] = {
        ...motion,
        step: nextStep,
      };
    }, 0.25);

    return loop;
  }
}

export const omseEngine = new OMSEEngine();
window.omseEngine = omseEngine;