// src/presets/core/atmospherePresets.js

/**
 * ATMOSPHERE PRESETS
 * ------------------
 * Air / texture / shimmer without harshness.
 * Goals:
 *  - adds "space" and motion
 *  - never fights the harmony layer
 *  - no brittle highs
 */

export const ATMOSPHERE_PRESETS = {
  airBloom: {
    id: "airBloom",
    label: "Air Bloom",
    engine: "noisePad",
    params: {
      // soft synth body
      synth: {
        oscillator: { type: "fatsine", count: 2, spread: 16 },
        envelope: { attack: 1.1, decay: 0.35, sustain: 0.55, release: 5.2 },
      },
      synthFilter: { type: "lowpass", frequency: 4200, Q: 0.55 },

      // noise texture
      noise: { type: "pink", gain: 0.06 },
      noiseFilter: { type: "bandpass", frequency: 2400, Q: 0.9 },

      drive: { amount: 0.0 },
      chorus: { wet: 0.16, depth: 0.28, frequency: 0.18, delayTime: 7.5 },
      width: { amount: 0.55 },
      postFilter: { type: "lowpass", frequency: 10500, Q: 0.5 },
      reverbSend: 0.38,
      delaySend: 0.08,
    },
  },

  dustHalo: {
    id: "dustHalo",
    label: "Dust Halo",
    engine: "noisePad",
    params: {
      synth: {
        oscillator: { type: "fattriangle", count: 2, spread: 18 },
        envelope: { attack: 0.9, decay: 0.35, sustain: 0.45, release: 4.8 },
      },
      synthFilter: { type: "lowpass", frequency: 5200, Q: 0.5 },

      noise: { type: "brown", gain: 0.05 },
      noiseFilter: { type: "bandpass", frequency: 1800, Q: 1.0 },

      drive: { amount: 0.0 },
      chorus: { wet: 0.12, depth: 0.22, frequency: 0.22, delayTime: 6.5 },
      width: { amount: 0.48 },
      postFilter: null,
      reverbSend: 0.32,
      delaySend: 0.06,
    },
  },

  highMist: {
    id: "highMist",
    label: "High Mist",
    engine: "noisePad",
    params: {
      synth: {
        oscillator: { type: "fatsine", count: 2, spread: 22 },
        envelope: { attack: 1.4, decay: 0.35, sustain: 0.35, release: 6.0 },
      },
      synthFilter: { type: "lowpass", frequency: 5600, Q: 0.5 },

      noise: { type: "pink", gain: 0.045 },
      noiseFilter: { type: "highpass", frequency: 1500, Q: 0.7 },

      drive: { amount: 0.0 },
      chorus: { wet: 0.14, depth: 0.26, frequency: 0.16, delayTime: 8.0 },
      width: { amount: 0.60 },
      postFilter: { type: "lowpass", frequency: 12000, Q: 0.45 },
      reverbSend: 0.42,
      delaySend: 0.10,
    },
  },
};