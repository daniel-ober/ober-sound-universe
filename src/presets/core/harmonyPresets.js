// src/presets/core/harmonyPresets.js

/**
 * HARMONY PRESETS
 * ---------------
 * Low/mid stereo “musical” layers: keys, synths, soft harmonic beds.
 * Goals:
 *  - readable chord identity
 *  - wide but controlled
 *  - cinematic sheen (not brittle)
 */

export const HARMONY_PRESETS = {
  velvetKeys: {
    id: "velvetKeys",
    label: "Velvet Keys",
    engine: "poly",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.03, decay: 0.55, sustain: 0.7, release: 2.2 },
      },
      filter: { type: "lowpass", frequency: 4800, Q: 0.65 },
      drive: { amount: 0.03 },
      chorus: { frequency: 0.9, delayTime: 3.5, depth: 0.25, wet: 0.18 },
      width: { amount: 0.18 },
      reverbSend: 0.18,
      delaySend: 0.06,
    },
  },

  prismSynth: {
    id: "prismSynth",
    label: "Prism Synth",
    engine: "poly",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.02, decay: 0.22, sustain: 0.55, release: 1.2 },
      },
      filter: { type: "lowpass", frequency: 3200, Q: 0.85 },
      drive: { amount: 0.05 },
      chorus: { frequency: 1.2, delayTime: 4.2, depth: 0.3, wet: 0.16 },
      width: { amount: 0.22 },
      reverbSend: 0.14,
      delaySend: 0.10,
    },
  },

  softPianoBloom: {
    id: "softPianoBloom",
    label: "Soft Piano Bloom",
    engine: "poly",
    params: {
      polyType: "fm",
      fm: {
        harmonicity: 1.5,
        modulationIndex: 7,
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.35, release: 1.8 },
        modulationEnvelope: { attack: 0.01, decay: 0.25, sustain: 0.2, release: 0.9 },
      },
      filter: { type: "lowpass", frequency: 5200, Q: 0.55 },
      drive: { amount: 0.02 },
      chorus: { frequency: 0.7, delayTime: 4.8, depth: 0.2, wet: 0.14 },
      width: { amount: 0.14 },
      reverbSend: 0.22,
      delaySend: 0.06,
    },
  },

  warmChorusPad: {
    id: "warmChorusPad",
    label: "Warm Chorus Pad",
    engine: "poly",
    params: {
      polyType: "synth",
      synth: {
        oscillator: { type: "sine" },
        envelope: { attack: 0.35, decay: 0.8, sustain: 0.75, release: 3.2 },
      },
      filter: { type: "lowpass", frequency: 2800, Q: 0.75 },
      drive: { amount: 0.02 },
      chorus: { frequency: 0.45, delayTime: 6.5, depth: 0.35, wet: 0.22 },
      width: { amount: 0.25 },
      reverbSend: 0.26,
      delaySend: 0.02,
    },
  },
};