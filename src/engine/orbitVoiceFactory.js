// src/engine/orbitVoiceFactory.js
import * as Tone from "tone";

/**
 * Orbit Voice Factory
 * -------------------
 * Builds a Tone instrument from an ORBIT_VOICE_PRESETS entry.
 *
 * Supported preset.engine:
 *  - "synth"  -> Tone.Synth inside Tone.PolySynth
 *  - "fm"     -> Tone.FMSynth inside Tone.PolySynth
 *  - "am"     -> Tone.AMSynth inside Tone.PolySynth
 *  - "mono"   -> Tone.MonoSynth inside Tone.PolySynth
 *  - "metal"  -> Tone.MetalSynth inside Tone.PolySynth (works fine for our use; “metal” is per-note)
 *
 * Notes:
 * - This returns the instrument ONLY (not connected to destination).
 * - Caller is responsible for connecting to orbit chain (filter -> panner -> gain etc).
 * - We keep defaults conservative and stable for live UI updates.
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

/**
 * Normalize common param blocks so Tone doesn’t get weird values.
 * Keep it light-touch: only clamp obviously unsafe stuff.
 */
function normalizeParams(engine, params = {}) {
  const p = isObj(params) ? params : {};

  // Envelope clamps (shared-ish)
  if (isObj(p.envelope)) {
    p.envelope = {
      ...p.envelope,
      attack: clamp(p.envelope.attack, 0, 10),
      decay: clamp(p.envelope.decay, 0, 10),
      sustain: clamp(p.envelope.sustain, 0, 1),
      release: clamp(p.envelope.release, 0, 20),
    };
  }

  // Filter block (used by your engine, not by Tone instruments directly)
  // We leave this here for compatibility if you ever pass it through.
  if (isObj(p.filter)) {
    p.filter = {
      ...p.filter,
      frequency: clamp(p.filter.frequency, 20, 20000),
      Q: clamp(p.filter.Q, 0.0001, 20),
    };
  }

  // MonoSynth extras
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
    if (isObj(p.filter)) {
      p.filter = {
        ...p.filter,
        frequency: clamp(p.filter.frequency, 20, 20000),
        Q: clamp(p.filter.Q, 0.0001, 20),
      };
    }
  }

  // FM/AM numeric clamps
  if (engine === "fm" || engine === "am") {
    if ("harmonicity" in p) p.harmonicity = clamp(p.harmonicity, 0.1, 32);
  }
  if (engine === "fm") {
    if ("modulationIndex" in p) p.modulationIndex = clamp(p.modulationIndex, 0, 50);
  }

  // MetalSynth clamps
  if (engine === "metal") {
    if ("frequency" in p) p.frequency = clamp(p.frequency, 20, 20000);
    if ("harmonicity" in p) p.harmonicity = clamp(p.harmonicity, 0.1, 32);
    if ("modulationIndex" in p) p.modulationIndex = clamp(p.modulationIndex, 0, 80);
    if ("resonance" in p) p.resonance = clamp(p.resonance, 20, 20000);
    if ("octaves" in p) p.octaves = clamp(p.octaves, 0, 8);
    if (isObj(p.envelope)) {
      // MetalSynth uses envelope.attack/decay/release (no sustain)
      p.envelope = {
        ...p.envelope,
        attack: clamp(p.envelope.attack, 0, 10),
        decay: clamp(p.envelope.decay, 0, 20),
        release: clamp(p.envelope.release, 0, 20),
      };
    }
  }

  return p;
}

function makePoly(VoiceCtor, voiceParams) {
  // PolySynth voice: new VoiceCtor(params) per note
  // Tone.PolySynth signature supports passing the voice constructor and voice options.
  return new Tone.PolySynth(VoiceCtor, voiceParams);
}

/**
 * Primary export used by omseEngine.js
 */
export function buildOrbitVoice(voicePreset) {
  const engine = (voicePreset?.engine || "synth").toString();
  const params = normalizeParams(engine, deepMerge({}, voicePreset?.params || {}));

  // Defaults per engine (kept conservative)
  const DEFAULTS = {
    synth: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.6 },
    },
    fm: {
      harmonicity: 2,
      modulationIndex: 8,
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.8 },
    },
    am: {
      harmonicity: 1.5,
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
    },
    metal: {
      frequency: 240,
      envelope: { attack: 0.001, decay: 0.7, release: 0.3 },
      harmonicity: 5,
      modulationIndex: 18,
      resonance: 3800,
      octaves: 2,
    },
  };

  try {
    switch (engine) {
      case "fm": {
        const voiceParams = deepMerge(DEFAULTS.fm, params);
        return makePoly(Tone.FMSynth, voiceParams);
      }
      case "am": {
        const voiceParams = deepMerge(DEFAULTS.am, params);
        return makePoly(Tone.AMSynth, voiceParams);
      }
      case "mono": {
        const voiceParams = deepMerge(DEFAULTS.mono, params);
        return makePoly(Tone.MonoSynth, voiceParams);
      }
      case "metal": {
        const voiceParams = deepMerge(DEFAULTS.metal, params);
        return makePoly(Tone.MetalSynth, voiceParams);
      }
      case "synth":
      default: {
        const voiceParams = deepMerge(DEFAULTS.synth, params);
        return makePoly(Tone.Synth, voiceParams);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[orbitVoiceFactory] buildOrbitVoice failed, falling back to synth:", err);
    return makePoly(Tone.Synth, DEFAULTS.synth);
  }
}