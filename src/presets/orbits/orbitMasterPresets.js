// src/presets/orbits/orbitMasterPresets.js

/**
 * ORBIT MASTER PRESETS (emotion-driven)
 *
 * IMPORTANT:
 * - These are NOT named after time signatures.
 * - Time sigs are *ingredients* that shape pulse-feel, but the preset identity
 *   is the emotional rhythmic result.
 *
 * UI shows label only.
 * Engine still uses motion.timeSig/arp/rate under the hood.
 */

export const ORBIT_MASTER_PRESETS = [
  {
    id: "staggered_sparkle",
    label: "Staggered Sparkle",
    description: "Bright, offset glints that feel playful but controlled.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "6/4", arp: "upDown", rate: "8n" },
        mix: { gain: 0.7, pan: -0.2, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "down", rate: "16n" },
        mix: { gain: 0.6, pan: 0.15, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "violetAir",
        motion: { timeSig: "7/4", arp: "random", rate: "8n" },
        mix: { gain: 0.45, pan: 0.1, muted: true },
      },
    },
  },

  {
    id: "crystal_pulse",
    label: "Crystal Pulse",
    description: "Tight bell ticks with a clean rhythmic spine.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "4/4", arp: "up", rate: "16n" },
        mix: { gain: 0.66, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "downUp", rate: "8n" },
        mix: { gain: 0.62, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.4, pan: 0.05, muted: true },
      },
    },
  },

  {
    id: "climbing_light",
    label: "Climbing Light",
    description: "Ascending steps that feel like rising energy.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "upDown", rate: "16n" },
        mix: { gain: 0.62, pan: -0.15, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "7/4", arp: "random", rate: "8n" },
        mix: { gain: 0.58, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "9/8", arp: "up", rate: "8n" },
        mix: { gain: 0.42, pan: 0.05, muted: false },
      },
    },
  },

  {
    id: "shimmer_drift",
    label: "Shimmer Drift",
    description: "Soft floating motion that never fully resolves.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "6/4", arp: "upDown", rate: "8n" },
        mix: { gain: 0.52, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "11/8", arp: "random", rate: "8n" },
        mix: { gain: 0.48, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "16n" },
        mix: { gain: 0.35, pan: 0, muted: true },
      },
    },
  },

  {
    id: "velvet_drift",
    label: "Velvet Drift",
    description: "Moody slow motion with a soft, intimate pull.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "down", rate: "2n" },
        mix: { gain: 0.55, pan: -0.08, muted: false },
      },
      orbitB: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "7/4", arp: "off", rate: "4n" },
        mix: { gain: 0.35, pan: 0.1, muted: true },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "9/8", arp: "random", rate: "4n" },
        mix: { gain: 0.45, pan: 0.15, muted: false },
      },
    },
  },

  // --- NEW: expanded set (emotion-driven) ---

  {
    id: "glinting_halo",
    label: "Glinting Halo",
    description: "A soft ring of sparkles orbiting the center—wide and elegant.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "6/8", arp: "upDown", rate: "8n" },
        mix: { gain: 0.58, pan: -0.22, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "hollowChime",
        motion: { timeSig: "9/8", arp: "random", rate: "8n" },
        mix: { gain: 0.5, pan: 0.22, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "12/8", arp: "up", rate: "4n" },
        mix: { gain: 0.4, pan: 0.0, muted: false },
      },
    },
  },

  {
    id: "clockwork_fireflies",
    label: "Clockwork Fireflies",
    description: "Tiny rhythmic flashes—precise, quick, and twinkly.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "7/8", arp: "up", rate: "16n" },
        mix: { gain: 0.6, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/8", arp: "down", rate: "16n" },
        mix: { gain: 0.52, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "mistPad",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.35, pan: 0, muted: true },
      },
    },
  },

  {
    id: "weightless_steps",
    label: "Weightless Steps",
    description: "A gentle stepping illusion—forward motion without urgency.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "upDown", rate: "8n" },
        mix: { gain: 0.55, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "hollowChime",
        motion: { timeSig: "7/4", arp: "downUp", rate: "8n" },
        mix: { gain: 0.52, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "down", rate: "2n" },
        mix: { gain: 0.38, pan: 0.0, muted: false },
      },
    },
  },

  {
    id: "tide_and_tension",
    label: "Tide & Tension",
    description: "A push-pull sway—like waves meeting resistance.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "6/4", arp: "down", rate: "2n" },
        mix: { gain: 0.5, pan: -0.1, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "11/8", arp: "random", rate: "8n" },
        mix: { gain: 0.46, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "9/8", arp: "up", rate: "8n" },
        mix: { gain: 0.42, pan: 0.08, muted: false },
      },
    },
  },

  {
    id: "lantern_cascade",
    label: "Lantern Cascade",
    description: "Falling lights—soft cascades that feel ceremonial.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "hollowChime",
        motion: { timeSig: "9/8", arp: "down", rate: "8n" },
        mix: { gain: 0.55, pan: -0.2, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "6/8", arp: "random", rate: "16n" },
        mix: { gain: 0.5, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "12/8", arp: "upDown", rate: "4n" },
        mix: { gain: 0.4, pan: 0.0, muted: false },
      },
    },
  },

  {
    id: "frosted_geometry",
    label: "Frosted Geometry",
    description: "Clean, icy, and angular—precision shapes in motion.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "digitalGlass",
        motion: { timeSig: "7/8", arp: "up", rate: "16n" },
        mix: { gain: 0.62, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "11/8", arp: "downUp", rate: "16n" },
        mix: { gain: 0.52, pan: 0.16, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "mistPad",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.35, pan: 0, muted: true },
      },
    },
  },

  {
    id: "embers_in_orbit",
    label: "Embers in Orbit",
    description: "Slow glowing sparks—warm, drifting, late-night energy.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "warmBell",
        motion: { timeSig: "4/4", arp: "down", rate: "2n" },
        mix: { gain: 0.5, pan: -0.08, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "6/4", arp: "upDown", rate: "4n" },
        mix: { gain: 0.46, pan: 0.1, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "9/8", arp: "random", rate: "8n" },
        mix: { gain: 0.38, pan: 0.12, muted: false },
      },
    },
  },

  {
    id: "neon_breath",
    label: "Neon Breath",
    description: "A pulsing inhale/exhale feel—soft glow, slow life.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "down", rate: "1n" },
        mix: { gain: 0.48, pan: -0.1, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "7/4", arp: "upDown", rate: "2n" },
        mix: { gain: 0.42, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.3, pan: 0, muted: true },
      },
    },
  },

  {
    id: "aurora_ladders",
    label: "Aurora Ladders",
    description: "Stacked ascent lines—luminous climbing motion.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/4", arp: "up", rate: "16n" },
        mix: { gain: 0.6, pan: -0.16, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "digitalGlass",
        motion: { timeSig: "7/4", arp: "random", rate: "8n" },
        mix: { gain: 0.54, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "9/8", arp: "upDown", rate: "4n" },
        mix: { gain: 0.4, pan: 0.06, muted: false },
      },
    },
  },

  {
    id: "cathedral_spark",
    label: "Cathedral Spark",
    description: "Wide, reverent space with occasional bell flickers.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "hollowChime",
        motion: { timeSig: "6/4", arp: "down", rate: "2n" },
        mix: { gain: 0.52, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.3, pan: 0.12, muted: true },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "12/8", arp: "upDown", rate: "1n" },
        mix: { gain: 0.42, pan: 0.06, muted: false },
      },
    },
  },

  {
    id: "glass_rain",
    label: "Glass Rain",
    description: "Randomized droplets—sparkly, shimmering, and unpredictable.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "11/8", arp: "random", rate: "16n" },
        mix: { gain: 0.62, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "digitalGlass",
        motion: { timeSig: "7/8", arp: "random", rate: "16n" },
        mix: { gain: 0.52, pan: 0.16, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "4/4", arp: "down", rate: "2n" },
        mix: { gain: 0.36, pan: 0.0, muted: false },
      },
    },
  },

  {
    id: "slow_gravity",
    label: "Slow Gravity",
    description: "Heavy slow pull—minimal notes, maximum weight.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "4/4", arp: "down", rate: "1n" },
        mix: { gain: 0.52, pan: -0.08, muted: false },
      },
      orbitB: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.25, pan: 0.1, muted: true },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "warmBell",
        motion: { timeSig: "9/8", arp: "random", rate: "2n" },
        mix: { gain: 0.4, pan: 0.12, muted: false },
      },
    },
  },

  {
    id: "spiral_dance",
    label: "Spiral Dance",
    description: "A swirling up/down illusion—alive and circular.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "6/8", arp: "upDown", rate: "16n" },
        mix: { gain: 0.6, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "5/8", arp: "downUp", rate: "16n" },
        mix: { gain: 0.5, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "hollowChime",
        motion: { timeSig: "9/8", arp: "random", rate: "8n" },
        mix: { gain: 0.42, pan: 0.08, muted: false },
      },
    },
  },

  {
    id: "distant_signal",
    label: "Distant Signal",
    description: "Sparse pulses—like a beacon calling from far away.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "digitalGlass",
        motion: { timeSig: "7/4", arp: "up", rate: "2n" },
        mix: { gain: 0.45, pan: -0.14, muted: false },
      },
      orbitB: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.22, pan: 0.12, muted: true },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "4/4", arp: "down", rate: "1n" },
        mix: { gain: 0.4, pan: 0.06, muted: false },
      },
    },
  },

  {
    id: "hushed_flicker",
    label: "Hushed Flicker",
    description: "Low-profile motion—small glimmers under the surface.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "hollowChime",
        motion: { timeSig: "5/4", arp: "down", rate: "4n" },
        mix: { gain: 0.42, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "6/4", arp: "upDown", rate: "1n" },
        mix: { gain: 0.4, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "softPluck",
        motion: { timeSig: "4/4", arp: "off", rate: "8n" },
        mix: { gain: 0.25, pan: 0, muted: true },
      },
    },
  },

  {
    id: "storm_of_glass",
    label: "Storm of Glass",
    description: "Chaotic glitter rain—high motion, high sparkle.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "digitalGlass",
        motion: { timeSig: "11/8", arp: "random", rate: "16n" },
        mix: { gain: 0.65, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassBell",
        motion: { timeSig: "13/8", arp: "random", rate: "16n" },
        mix: { gain: 0.56, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "softPluck",
        motion: { timeSig: "7/8", arp: "downUp", rate: "16n" },
        mix: { gain: 0.44, pan: 0.1, muted: false },
      },
    },
  },

  {
    id: "midnight_bloom",
    label: "Midnight Bloom",
    description: "Dark softness with slow shimmer—intimate and cinematic.",
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "violetAir",
        motion: { timeSig: "4/4", arp: "down", rate: "1n" },
        mix: { gain: 0.5, pan: -0.08, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "mistPad",
        motion: { timeSig: "7/4", arp: "upDown", rate: "2n" },
        mix: { gain: 0.42, pan: 0.1, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "warmBell",
        motion: { timeSig: "9/8", arp: "random", rate: "2n" },
        mix: { gain: 0.38, pan: 0.12, muted: false },
      },
    },
  },
];