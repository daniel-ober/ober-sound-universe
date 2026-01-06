// src/engine/orbitVoiceFactory.js
import * as Tone from "tone";

/**
 * Orbit Voice Factory
 * -------------------
 * Builds a Tone instrument from an ORBIT_VOICE_PRESETS entry.
 *
 * Supported preset.engine:
 *  - "synth"      -> Tone.Synth inside Tone.PolySynth
 *  - "fm"         -> Tone.FMSynth inside Tone.PolySynth
 *  - "am"         -> Tone.AMSynth inside Tone.PolySynth
 *  - "mono"       -> Tone.MonoSynth inside Tone.PolySynth
 *  - "duo"        -> Tone.DuoSynth inside Tone.PolySynth
 *  - "membrane"   -> Tone.MembraneSynth inside Tone.PolySynth
 *  - "pluck"      -> Tone.PluckSynth inside Tone.PolySynth
 *
 * IMPORTANT FIX:
 *  - "metal"      -> Tone.MetalSynth (NOT PolySynth)
 *  - "noise"      -> Tone.NoiseSynth (NOT PolySynth)
 * These synths are not note-addressable in a PolySynth-safe way.
 *
 *  - "sampler"    -> Tone.Sampler (polyphonic by nature, NOT wrapped in PolySynth)
 */

function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base, extra) {
  if (!isObj(base)) return isObj(extra) ? { ...extra } : extra;
  const out = { ...base };
  if (!isObj(extra)) return out;
  Object.keys(extra).forEach((k) => {
    const bv = out[k];
    const ev = extra[k];
    out[k] = isObj(bv) && isObj(ev) ? deepMerge(bv, ev) : ev;
  });
  return out;
}

function safeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  const v = safeNumber(n, min);
  return Math.max(min, Math.min(max, v));
}

function clamp01(v) {
  return clamp(v, 0, 1);
}

function normalizeOscillator(o) {
  if (!isObj(o)) return o;
  const out = { ...o };
  if (typeof out.type === "string") out.type = out.type.toLowerCase();
  return out;
}

function normalizeParams(engine, params = {}) {
  const p = isObj(params) ? { ...params } : {};

  if (isObj(p.envelope)) {
    p.envelope = {
      ...p.envelope,
      attack: clamp(p.envelope.attack, 0, 10),
      decay: clamp(p.envelope.decay, 0, 20),
      sustain: clamp(p.envelope.sustain, 0, 1),
      release: clamp(p.envelope.release, 0, 20),
    };
  }

  if (isObj(p.oscillator)) {
    p.oscillator = normalizeOscillator(p.oscillator);
  }

  if (isObj(p.filter)) {
    p.filter = {
      ...p.filter,
      frequency: clamp(p.filter.frequency, 20, 20000),
      Q: clamp(p.filter.Q, 0.0001, 20),
    };
  }

  if (isObj(p.poly)) {
    p.poly = {
      ...p.poly,
      maxPolyphony: clamp(p.poly.maxPolyphony, 1, 64),
      voiceCount: clamp(p.poly.voiceCount, 1, 64),
    };
  }

  if (engine === "mono") {
    if (isObj(p.filterEnvelope)) {
      p.filterEnvelope = {
        ...p.filterEnvelope,
        attack: clamp(p.filterEnvelope.attack, 0, 10),
        decay: clamp(p.filterEnvelope.decay, 0, 10),
        sustain: clamp(p.filterEnvelope.sustain, 0, 1),
        release: clamp(p.filterEnvelope.release, 0, 20),
        baseFrequency: clamp(p.filterEnvelope.baseFrequency, 20, 20000),
        octaves: clamp(p.filterEnvelope.octaves, 0, 8),
      };
    }
    if ("portamento" in p) p.portamento = clamp(p.portamento, 0, 1.5);
  }

  if (engine === "fm" || engine === "am") {
    if ("harmonicity" in p) p.harmonicity = clamp(p.harmonicity, 0.1, 32);
  }
  if (engine === "fm") {
    if ("modulationIndex" in p)
      p.modulationIndex = clamp(p.modulationIndex, 0, 50);
  }

  if (engine === "duo") {
    if ("harmonicity" in p) p.harmonicity = clamp(p.harmonicity, 0.1, 32);
    if ("vibratoAmount" in p) p.vibratoAmount = clamp(p.vibratoAmount, 0, 1);
    if ("vibratoRate" in p) p.vibratoRate = clamp(p.vibratoRate, 0.01, 20);
    if ("portamento" in p) p.portamento = clamp(p.portamento, 0, 1.5);

    if (isObj(p.voice0)) {
      if (isObj(p.voice0.oscillator))
        p.voice0.oscillator = normalizeOscillator(p.voice0.oscillator);
      if (isObj(p.voice0.envelope)) {
        p.voice0.envelope = {
          ...p.voice0.envelope,
          attack: clamp(p.voice0.envelope.attack, 0, 10),
          decay: clamp(p.voice0.envelope.decay, 0, 10),
          sustain: clamp(p.voice0.envelope.sustain, 0, 1),
          release: clamp(p.voice0.envelope.release, 0, 20),
        };
      }
    }
    if (isObj(p.voice1)) {
      if (isObj(p.voice1.oscillator))
        p.voice1.oscillator = normalizeOscillator(p.voice1.oscillator);
      if (isObj(p.voice1.envelope)) {
        p.voice1.envelope = {
          ...p.voice1.envelope,
          attack: clamp(p.voice1.envelope.attack, 0, 10),
          decay: clamp(p.voice1.envelope.decay, 0, 10),
          sustain: clamp(p.voice1.envelope.sustain, 0, 1),
          release: clamp(p.voice1.envelope.release, 0, 20),
        };
      }
    }
  }

  if (engine === "membrane") {
    if ("pitchDecay" in p) p.pitchDecay = clamp(p.pitchDecay, 0, 2);
    if ("octaves" in p) p.octaves = clamp(p.octaves, 0, 8);
  }

  if (engine === "pluck") {
    if ("attackNoise" in p) p.attackNoise = clamp(p.attackNoise, 0, 10);
    if ("dampening" in p) p.dampening = clamp(p.dampening, 20, 20000);
    if ("resonance" in p) p.resonance = clamp(p.resonance, 0.0001, 1);
    if ("release" in p) p.release = clamp(p.release, 0, 20);
  }

  // MetalSynth clamps
  if (engine === "metal") {
    if ("frequency" in p) p.frequency = clamp(p.frequency, 20, 20000);
    if ("harmonicity" in p) p.harmonicity = clamp(p.harmonicity, 0.1, 32);
    if ("modulationIndex" in p)
      p.modulationIndex = clamp(p.modulationIndex, 0, 80);
    if ("resonance" in p) p.resonance = clamp(p.resonance, 20, 20000);
    if ("octaves" in p) p.octaves = clamp(p.octaves, 0, 8);
    if (isObj(p.envelope)) {
      p.envelope = {
        ...p.envelope,
        attack: clamp(p.envelope.attack, 0, 10),
        decay: clamp(p.envelope.decay, 0, 20),
        release: clamp(p.envelope.release, 0, 20),
      };
    }
  }

  // NoiseSynth clamps
  if (engine === "noise") {
    if (isObj(p.noise)) {
      const type =
        typeof p.noise.type === "string" ? p.noise.type.toLowerCase() : p.noise.type;
      p.noise = { ...p.noise, type };
    }
  }

  if (engine === "sampler") {
    const sp = isObj(p.sampler) ? p.sampler : p;
    const urls = isObj(sp.urls) ? sp.urls : {};
    const baseUrl = typeof sp.baseUrl === "string" ? sp.baseUrl : undefined;

    p.baseUrl = baseUrl;
    p.urls = urls;

    if ("attack" in sp) p.attack = clamp(sp.attack, 0, 10);
    if ("release" in sp) p.release = clamp(sp.release, 0, 20);
    if ("volume" in sp) p.volume = clamp(sp.volume, -60, 12);
  }

  if ("volume" in p) p.volume = clamp(p.volume, -60, 12);

  if (isObj(p.velocity)) {
    p.velocity = {
      ...p.velocity,
      amount: clamp01(p.velocity.amount ?? 0),
      curve: clamp(p.velocity.curve ?? 1, 0.1, 4),
    };
  }

  return p;
}

function makePoly(VoiceCtor, voiceParams, polyOpts) {
  const inst = new Tone.PolySynth(VoiceCtor, voiceParams);

  const maxPoly = polyOpts?.maxPolyphony ?? polyOpts?.voiceCount ?? null;
  if (Number.isFinite(maxPoly) && maxPoly > 0) {
    try {
      inst.maxPolyphony = Math.round(maxPoly);
    } catch {
      // ignore
    }
  }

  return inst;
}

function inferPolyOptions(params) {
  const poly = isObj(params?.poly) ? params.poly : null;
  if (!poly) return null;

  return {
    maxPolyphony:
      Number.isFinite(poly.maxPolyphony) ? poly.maxPolyphony : poly.voiceCount,
    voiceCount: Number.isFinite(poly.voiceCount) ? poly.voiceCount : undefined,
  };
}

export function buildOrbitVoice(voicePreset) {
  // normalize engine
  let engineRaw = voicePreset?.engine ?? voicePreset?.type ?? "synth";
  let engine = String(engineRaw || "synth").toLowerCase().trim();
  if (engine === "default") engine = "synth";

  const params = normalizeParams(engine, deepMerge({}, voicePreset?.params || {}));
  const polyOpts = inferPolyOptions(params);

  const DEFAULTS = {
    synth: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.6 },
    },
    fm: {
      harmonicity: 2,
      modulationIndex: 8,
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.8 },
    },
    am: {
      harmonicity: 1.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.25, release: 1.0 },
    },
    mono: {
      oscillator: { type: "square" },
      envelope: { attack: 0.005, decay: 0.16, sustain: 0.12, release: 0.55 },
      filter: { type: "lowpass", frequency: 4800, Q: 0.9 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0.0,
        release: 0.12,
        baseFrequency: 300,
        octaves: 3.2,
      },
      portamento: 0.0,
    },
    duo: {
      harmonicity: 1.5,
      vibratoAmount: 0.02,
      vibratoRate: 4.5,
      portamento: 0.0,
      voice0: {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.7 },
      },
      voice1: {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.7 },
      },
    },
    membrane: {
      pitchDecay: 0.03,
      octaves: 2,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.8 },
    },
    pluck: {
      attackNoise: 0.6,
      dampening: 4500,
      resonance: 0.9,
      release: 1.2,
    },
    metal: {
      frequency: 240,
      envelope: { attack: 0.001, decay: 0.7, release: 0.3 },
      harmonicity: 5,
      modulationIndex: 18,
      resonance: 3800,
      octaves: 2,
    },
    noise: {
      noise: { type: "pink" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.0, release: 0.35 },
    },
    sampler: {
      urls: {},
      baseUrl: undefined,
      attack: 0.005,
      release: 1.2,
      volume: -6,
    },
  };

  try {
    switch (engine) {
      case "sampler": {
        const cfg = deepMerge(DEFAULTS.sampler, params);
        const urls = cfg.urls || {};
        const baseUrl = cfg.baseUrl;

        return new Tone.Sampler({
          urls,
          baseUrl,
          attack: cfg.attack,
          release: cfg.release,
          volume: cfg.volume,
        });
      }

      case "metal": {
        // ✅ IMPORTANT: do NOT wrap MetalSynth in PolySynth
        const voiceParams = deepMerge(DEFAULTS.metal, params);
        return new Tone.MetalSynth(voiceParams);
      }

      case "noise": {
        // ✅ IMPORTANT: do NOT wrap NoiseSynth in PolySynth
        const voiceParams = deepMerge(DEFAULTS.noise, params);
        return new Tone.NoiseSynth(voiceParams);
      }

      case "fm": {
        const voiceParams = deepMerge(DEFAULTS.fm, params);
        return makePoly(Tone.FMSynth, voiceParams, polyOpts);
      }

      case "am": {
        const voiceParams = deepMerge(DEFAULTS.am, params);
        return makePoly(Tone.AMSynth, voiceParams, polyOpts);
      }

      case "mono": {
        const voiceParams = deepMerge(DEFAULTS.mono, params);
        return makePoly(Tone.MonoSynth, voiceParams, polyOpts);
      }

      case "duo": {
        const voiceParams = deepMerge(DEFAULTS.duo, params);
        return makePoly(Tone.DuoSynth, voiceParams, polyOpts);
      }

      case "membrane": {
        const voiceParams = deepMerge(DEFAULTS.membrane, params);
        return makePoly(Tone.MembraneSynth, voiceParams, polyOpts);
      }

      case "pluck": {
        const voiceParams = deepMerge(DEFAULTS.pluck, params);
        return makePoly(Tone.PluckSynth, voiceParams, polyOpts);
      }

      case "synth":
      default: {
        const voiceParams = deepMerge(DEFAULTS.synth, params);
        return makePoly(Tone.Synth, voiceParams, polyOpts);
      }
    }
  } catch (err) {
    console.warn(
      "[orbitVoiceFactory] buildOrbitVoice failed, falling back to synth:",
      err
    );
    return makePoly(Tone.Synth, DEFAULTS.synth, polyOpts);
  }
}