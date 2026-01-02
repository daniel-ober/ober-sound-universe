// src/presets/orbits/orbitMasterPresets.js
export const ORBIT_MASTER_PRESETS = [
  {
    id: "twilight_chime",
    label: "Twilight Chime",
    description: "Warm chimes with staggered polyrhythm.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "6/4", arp: "upDown", rate: "8n", patternOn: true },
        mix: { gain: 0.70, pan: -0.20, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "down", rate: "16n", patternOn: false },
        mix: { gain: 0.60, pan: 0.15, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "violetAir",
        motion: { timeSig: "7/4", arp: "random", rate: "8n", patternOn: false },
        mix: { gain: 0.45, pan: 0.10, muted: true },
      },
    },
  },
];