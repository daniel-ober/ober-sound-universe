// src/presets/core/groundPresets.js

/**
 * GROUND PRESETS
 * --------------
 * Very low/centered foundation tones.
 * Goals:
 *  - deep, stable, non-harsh
 *  - controlled lows (no flub)
 *  - supports long-held chords without mud
 *
 * NOTE:
 * - We now support sampler-based ground presets.
 * - IDs MUST match what CORE_LAYER_PRESETS references (contrabassSampler, deepSampler).
 */

export const GROUND_PRESETS = {
  /**
   * ✅ Sampler Ground: Contrabass
   * Expects files at:
   *  public/assets/samples/contrabass/C2.wav ... C3.wav
   */
  contrabassSampler: {
    id: "contrabassSampler",
    label: "Contrabass (Sampler)",
    engine: "sampler",
    params: {
      // IMPORTANT: These must be PUBLIC paths (served from /public)
      baseUrl: "/assets/samples/contrabass/",
      // Tone.Sampler expects: { NOTE: "filename.wav" }
      urls: {
        C2: "C2.wav",
        D2: "D2.wav",
        E2: "E2.wav",
        F2: "F2.wav",
        G2: "G2.wav",
        A2: "A2.wav",
        B2: "B2.wav",
        C3: "C3.wav",
      },

      // Keep sampler clean + punchy
      attack: 0.005,
      release: 1.25,
      volume: -6,

      // Optional tone shaping (post-sampler filter + subtle drive)
      filter: { type: "lowpass", frequency: 650, Q: 0.9 },
      drive: { amount: 0.04 },
      chorus: null,
      width: { amount: 0.0 },
      reverbSend: 0.05,
      delaySend: 0.0,
    },
  },

  /**
   * ✅ Sampler Ground: Deep
   * Expects files at:
   *  public/assets/samples/deep/C2.wav ... C3.wav
   */
  deepSampler: {
    id: "deepSampler",
    label: "Deep (Sampler)",
    engine: "sampler",
    params: {
      baseUrl: "/assets/samples/deep/",
      urls: {
        C2: "C2.wav",
        D2: "D2.wav",
        E2: "E2.wav",
        F2: "F2.wav",
        G2: "G2.wav",
        A2: "A2.wav",
        B2: "B2.wav",
        C3: "C3.wav",
      },

      // Slightly smoother / longer tail than contrabass
      attack: 0.01,
      release: 1.6,
      volume: -7,

      filter: { type: "lowpass", frequency: 520, Q: 0.85 },
      drive: { amount: 0.03 },
      chorus: null,
      width: { amount: 0.0 },
      reverbSend: 0.06,
      delaySend: 0.0,
    },
  },

  // ----------------------------
  // Existing synth-based grounds
  // ----------------------------

  subAnchor: {
    id: "subAnchor",
    label: "Sub Anchor",
    engine: "mono",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.08, decay: 0.25, sustain: 0.9, release: 2.8 },
      filter: { type: "lowpass", frequency: 220, Q: 0.9 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.25,
        sustain: 0.4,
        release: 1.2,
        baseFrequency: 60,
        octaves: 2.2,
      },
      drive: { amount: 0.06 },
      chorus: null,
      width: { amount: 0.0 },
      reverbSend: 0.06,
      delaySend: 0.0,
    },
  },

  duskDrone: {
    id: "duskDrone",
    label: "Dusk Drone",
    engine: "mono",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.25, decay: 0.4, sustain: 0.85, release: 4.0 },
      filter: { type: "lowpass", frequency: 320, Q: 0.85 },
      filterEnvelope: {
        attack: 0.15,
        decay: 0.35,
        sustain: 0.3,
        release: 1.6,
        baseFrequency: 80,
        octaves: 1.9,
      },
      drive: { amount: 0.09 },
      chorus: null,
      width: { amount: 0.05 },
      reverbSend: 0.10,
      delaySend: 0.0,
    },
  },

  ironFloor: {
    id: "ironFloor",
    label: "Iron Floor",
    engine: "mono",
    params: {
      oscillator: { type: "square" },
      envelope: { attack: 0.03, decay: 0.22, sustain: 0.75, release: 2.6 },
      filter: { type: "lowpass", frequency: 280, Q: 0.95 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.25,
        sustain: 0.25,
        release: 0.9,
        baseFrequency: 55,
        octaves: 1.6,
      },
      drive: { amount: 0.14 },
      chorus: null,
      width: { amount: 0.02 },
      reverbSend: 0.06,
      delaySend: 0.0,
    },
  },

  velvetSub: {
    id: "velvetSub",
    label: "Velvet Sub",
    engine: "poly",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "sine" },
        envelope: { attack: 0.06, decay: 0.4, sustain: 0.85, release: 2.6 },
      },
      filter: { type: "lowpass", frequency: 300, Q: 0.7 },
      drive: { amount: 0.04 },
      chorus: null,
      width: { amount: 0.0 },
      reverbSend: 0.08,
      delaySend: 0.0,
    },
  },
};