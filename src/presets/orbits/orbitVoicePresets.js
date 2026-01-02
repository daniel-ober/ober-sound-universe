// src/presets/orbits/orbitVoicePresets.js
export const ORBIT_VOICE_PRESETS = {
  glassBell: {
    id: "glassBell",
    label: "Glass Bell",
    engine: "synth",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.7 },
      filter: { type: "lowpass", frequency: 9000, Q: 0.7 },
    },
  },

  softPluck: {
    id: "softPluck",
    label: "Soft Pluck",
    engine: "fm",
    params: {
      harmonicity: 2,
      modulationIndex: 7,
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.35 },
    },
  },

  violetAir: {
    id: "violetAir",
    label: "Violet Air Pad",
    engine: "synth",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.8, decay: 0.4, sustain: 0.75, release: 1.8 },
      filter: { type: "lowpass", frequency: 4200, Q: 0.6 },
    },
  },
};