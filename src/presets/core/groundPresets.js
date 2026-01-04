// src/presets/core/groundPresets.js

/**
 * GROUND PRESETS
 * --------------
 * Very low/centered foundation tones.
 * Goals:
 *  - deep, stable, non-harsh
 *  - controlled lows (no flub)
 *  - supports long-held chords without mud
 */

export const GROUND_PRESETS = {
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