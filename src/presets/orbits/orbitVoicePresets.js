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

  // ---- NEW voices (gives the emotion presets more character) ----

  hollowChime: {
    id: "hollowChime",
    label: "Hollow Chime",
    engine: "synth",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.02, decay: 0.35, sustain: 0.25, release: 1.2 },
      filter: { type: "bandpass", frequency: 5200, Q: 1.2 },
    },
  },

  mistPad: {
    id: "mistPad",
    label: "Mist Pad",
    engine: "synth",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 1.2, decay: 0.6, sustain: 0.7, release: 2.4 },
      filter: { type: "lowpass", frequency: 3200, Q: 0.55 },
    },
  },

  warmBell: {
    id: "warmBell",
    label: "Warm Bell",
    engine: "synth",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.28, sustain: 0.3, release: 1.0 },
      filter: { type: "lowpass", frequency: 6500, Q: 0.65 },
    },
  },

  digitalGlass: {
    id: "digitalGlass",
    label: "Digital Glass",
    engine: "fm",
    params: {
      harmonicity: 3,
      modulationIndex: 10,
      envelope: { attack: 0.002, decay: 0.18, sustain: 0.18, release: 0.45 },
    },
  },
};