// src/presets/masterPresets.js

// Master presets for Galaxy0 dev scene.
// Values are 0–100 (UI slider range). Engine receives value / 100.

export const MASTER_PRESETS = {
  presetA: {
    id: "presetA",
    label: "Preset A · Drift",
    core: {
      ground: { gain: 90, muted: false },
      harmony: { gain: 65, muted: false },
      atmos: { gain: 55, muted: false },
    },
    orbits: {
      orbitA: { gain: 70, muted: false },
      orbitB: { gain: 60, muted: false },
      orbitC: { gain: 45, muted: false },
    },
    // No orbit patterns running – more open, manual space
    patterns: {
      orbitA: false,
      orbitB: false,
      orbitC: false,
    },
  },

  presetB: {
    id: "presetB",
    label: "Preset B · Focus",
    core: {
      ground: { gain: 55, muted: false },
      harmony: { gain: 80, muted: false },
      atmos: { gain: 75, muted: false },
    },
    orbits: {
      orbitA: { gain: 50, muted: false },
      orbitB: { gain: 70, muted: false },
      orbitC: { gain: 65, muted: false },
    },
    // All three orbits animated with their own patterns
    patterns: {
      orbitA: true,
      orbitB: true,
      orbitC: true,
    },
  },
};