// src/presets/core/atmospherePresets.js

/**
 * ATMOSPHERE PRESETS
 * ------------------
 * Mid/high stereo “air” layers: wind, water, birds, shimmer beds.
 * Goals:
 *  - wide and spatial
 *  - sits above harmony without harshness
 *  - subtle motion and texture
 */

export const ATMOSPHERE_PRESETS = {
  auroraAir: {
    id: "auroraAir",
    label: "Aurora Air",
    engine: "noisePad",
    params: {
      noise: { type: "pink", gain: 0.14 },
      noiseFilter: { type: "bandpass", frequency: 1800, Q: 0.7 },
      synth: {
        oscillator: { type: "sine" },
        envelope: { attack: 0.9, decay: 0.6, sustain: 0.35, release: 3.2 },
      },
      synthFilter: { type: "lowpass", frequency: 4200, Q: 0.55 },
      chorus: { frequency: 0.35, delayTime: 8.0, depth: 0.45, wet: 0.24 },
      width: { amount: 0.35 },
      reverbSend: 0.45,
      delaySend: 0.18,
    },
  },

  shorelineMist: {
    id: "shorelineMist",
    label: "Shoreline Mist",
    engine: "noisePad",
    params: {
      noise: { type: "white", gain: 0.08 },
      noiseFilter: { type: "lowpass", frequency: 2600, Q: 0.6 },
      synth: {
        oscillator: { type: "triangle" },
        envelope: { attack: 1.1, decay: 0.7, sustain: 0.25, release: 3.8 },
      },
      synthFilter: { type: "bandpass", frequency: 1400, Q: 0.8 },
      chorus: { frequency: 0.28, delayTime: 9.5, depth: 0.5, wet: 0.22 },
      width: { amount: 0.40 },
      reverbSend: 0.52,
      delaySend: 0.12,
    },
  },

  highCanopy: {
    id: "highCanopy",
    label: "High Canopy",
    engine: "synthPad",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.8, decay: 0.5, sustain: 0.45, release: 2.9 },
      },
      filter: { type: "highpass", frequency: 220, Q: 0.7 },
      chorus: { frequency: 0.4, delayTime: 7.2, depth: 0.35, wet: 0.18 },
      width: { amount: 0.28 },
      reverbSend: 0.38,
      delaySend: 0.20,
    },
  },

  shimmerWind: {
    id: "shimmerWind",
    label: "Shimmer Wind",
    engine: "noisePad",
    params: {
      noise: { type: "pink", gain: 0.10 },
      noiseFilter: { type: "highpass", frequency: 900, Q: 0.7 },
      synth: {
        oscillator: { type: "sine" },
        envelope: { attack: 1.4, decay: 0.8, sustain: 0.22, release: 4.2 },
      },
      synthFilter: { type: "lowpass", frequency: 3200, Q: 0.6 },
      chorus: { frequency: 0.22, delayTime: 10.0, depth: 0.55, wet: 0.26 },
      width: { amount: 0.42 },
      reverbSend: 0.58,
      delaySend: 0.14,
    },
  },
};