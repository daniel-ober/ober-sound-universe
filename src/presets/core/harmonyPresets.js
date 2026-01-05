// src/presets/core/harmonyPresets.js

/**
 * HARMONY PRESETS
 * ---------------
 * Chord body / midrange beauty layer.
 * Goals:
 *  - lush, expensive, non-buzzy
 *  - slow attack pads that feel cinematic
 */

export const HARMONY_PRESETS = {
  silkChoir: {
    id: "silkChoir",
    label: "Silk Choir",
    engine: "synthPad",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "fatsawtooth", count: 4, spread: 22 },
        envelope: { attack: 0.65, decay: 0.35, sustain: 0.78, release: 3.6 },
      },
      filter: { type: "lowpass", frequency: 2100, Q: 0.65 },
      drive: { amount: 0.03 },
      chorus: { wet: 0.16, depth: 0.28, frequency: 0.28, delayTime: 6.0 },
      width: { amount: 0.38 },
      postFilter: { type: "lowpass", frequency: 9200, Q: 0.5 },
      reverbSend: 0.22,
      delaySend: 0.03,
    },
  },

  goldenPad: {
    id: "goldenPad",
    label: "Golden Pad",
    engine: "synthPad",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "fattriangle", count: 3, spread: 18 },
        envelope: { attack: 0.45, decay: 0.3, sustain: 0.82, release: 3.2 },
      },
      filter: { type: "lowpass", frequency: 2600, Q: 0.6 },
      drive: { amount: 0.02 },
      chorus: { wet: 0.12, depth: 0.22, frequency: 0.35, delayTime: 5.0 },
      width: { amount: 0.30 },
      postFilter: { type: "lowpass", frequency: 9800, Q: 0.5 },
      reverbSend: 0.18,
      delaySend: 0.02,
    },
  },

  frostPad: {
    id: "frostPad",
    label: "Frost Pad",
    engine: "synthPad",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "fatsine", count: 3, spread: 24 },
        envelope: { attack: 0.8, decay: 0.35, sustain: 0.74, release: 4.4 },
      },
      filter: { type: "lowpass", frequency: 3200, Q: 0.55 },
      drive: { amount: 0.0 },
      chorus: { wet: 0.18, depth: 0.30, frequency: 0.22, delayTime: 7.0 },
      width: { amount: 0.45 },
      postFilter: null,
      reverbSend: 0.26,
      delaySend: 0.05,
    },
  },
};