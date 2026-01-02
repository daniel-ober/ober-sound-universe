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
        mix: { gain: 0.7, pan: -0.2, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "down", rate: "16n", patternOn: false },
        mix: { gain: 0.6, pan: 0.15, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "violetAir",
        motion: { timeSig: "7/4", arp: "random", rate: "8n", patternOn: false },
        mix: { gain: 0.45, pan: 0.1, muted: true },
      },
    },
  },

  // referenced by masterPresets.js presetB
  {
    id: "glass_pulse",
    label: "Glass Pulse",
    description: "Bright bell pulses + FM plucks, tight rhythmic feel.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "4/4", arp: "up", rate: "16n", patternOn: true },
        mix: { gain: 0.68, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "downUp", rate: "8n", patternOn: true },
        mix: { gain: 0.62, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "off", rate: "8n", patternOn: false },
        mix: { gain: 0.4, pan: 0.05, muted: true },
      },
    },
  },

  // referenced by masterPresets.js presetC
  {
    id: "aurora_steps",
    label: "Aurora Steps",
    description: "Staggered step patterns that feel like climbing lights.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "upDown", rate: "16n", patternOn: true },
        mix: { gain: 0.62, pan: -0.15, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "7/4", arp: "random", rate: "8n", patternOn: true },
        mix: { gain: 0.58, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "9/8", arp: "up", rate: "8n", patternOn: false },
        mix: { gain: 0.42, pan: 0.05, muted: false },
      },
    },
  },

  // referenced by masterPresets.js presetD
  {
    id: "nebula_shimmer",
    label: "Nebula Shimmer",
    description: "Air pad shimmer with gentle bell accents and drift.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "6/4", arp: "upDown", rate: "8n", patternOn: true },
        mix: { gain: 0.5, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "11/8", arp: "random", rate: "8n", patternOn: false },
        mix: { gain: 0.52, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "16n", patternOn: false },
        mix: { gain: 0.35, pan: 0, muted: true },
      },
    },
  },

  // referenced by masterPresets.js presetE
  {
    id: "midnight_drone",
    label: "Midnight Drone",
    description: "Slow, moody motion — long releases, sparse pulses.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "down", rate: "2n", patternOn: true },
        mix: { gain: 0.55, pan: -0.08, muted: false },
      },
      orbitB: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "7/4", arp: "off", rate: "4n", patternOn: false },
        mix: { gain: 0.35, pan: 0.1, muted: true },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "9/8", arp: "random", rate: "4n", patternOn: true },
        mix: { gain: 0.45, pan: 0.15, muted: false },
      },
    },
  },
];