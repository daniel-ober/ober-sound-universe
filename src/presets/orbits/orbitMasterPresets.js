// src/presets/orbits/orbitMasterPresets.js

/**
 * ORBIT MASTER PRESETS (Scenes)
 * -----------------------------
 * Emotion-driven orbit scenes.
 * Each scene defines:
 *  - which orbit voices are enabled
 *  - which voicePresetId each uses
 *  - motion (polyrhythmPresetId, arpPresetId, rate, patternOn)
 *  - mix (gain 0..1, pan -1..1, muted bool)
 *
 * Naming rule:
 *  - Name the "combined rhythmic emotion"
 *  - NOT the time signature
 *
 * NOTE:
 * These scenes reference motion presets by ID so you can expand:
 * - arp library (ARP_PRESETS)
 * - polyrhythm library (POLYRHYTHM_PRESETS)
 * without rewriting scenes.
 */

export const ORBIT_MASTER_PRESETS = [
  // =========================================================
  // CORE-DAWN BEST MATCH: grounded shimmer + controlled motion
  // =========================================================
  {
    id: "anchor_bloom",
    label: "Anchor Bloom",
    description: "Grounded shimmer with a gentle, confident pulse.",
    vibeTags: ["grounded", "cinematic", "controlled"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "cedarPluck",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "upDown",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.52, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "5_4",
          arpPresetId: "downUp",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.46, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "off",
          rate: "2n",
          patternOn: false,
        },
        mix: { gain: 0.22, pan: 0.05, muted: false },
      },
    },
  },

  // =========================================================
  // SOLAR-DRIFT BEST MATCH: warm floating drift, wide halo
  // =========================================================
  {
    id: "warm_tides",
    label: "Warm Tides",
    description: "Slow warm drift with soft interlocking steps.",
    vibeTags: ["warm", "floating", "expansive"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "haloPad",
        motion: {
          polyrhythmPresetId: "6_4",
          arpPresetId: "drone",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.34, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "9_8",
          arpPresetId: "random",
          rate: "4n",
          patternOn: true,
        },
        mix: { gain: 0.40, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.18, pan: -0.02, muted: false },
      },
    },
  },

  // =========================================================
  // AURORA-PULSE BEST MATCH: energetic luminous stepping
  // =========================================================
  {
    id: "kinetic_prism",
    label: "Kinetic Prism",
    description: "Bright interlocking motion that feels like climbing light.",
    vibeTags: ["luminous", "rhythmic", "energetic"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "carbonPluck",
        motion: {
          polyrhythmPresetId: "5_4",
          arpPresetId: "up",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.56, pan: -0.16, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "prismBell",
        motion: {
          polyrhythmPresetId: "7_8",
          arpPresetId: "upDown",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.46, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "glassPulse",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "pulse",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.22, pan: 0.04, muted: false },
      },
    },
  },

  // =========================================================
  // NEBULA-ECHO BEST MATCH: ethereal, wide, dream haze
  // =========================================================
  {
    id: "nebula_haze",
    label: "Nebula Haze",
    description: "A drifting haze—harmonics bloom outward, motion stays soft.",
    vibeTags: ["ethereal", "wide", "dreamlike"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "duskPad",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "shimmer",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.36, pan: -0.10, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "11_8",
          arpPresetId: "random",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.30, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.16, pan: 0.02, muted: false },
      },
    },
  },

  // =========================================================
  // MIDNIGHT-BLOOM BEST MATCH: moody, velvet, late-night
  // =========================================================
  {
    id: "midnight_embers",
    label: "Midnight Embers",
    description: "Sparse, moody pulses with a slow-burning shimmer.",
    vibeTags: ["moody", "velvet", "late-night"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "duskPad",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "down",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.38, pan: -0.08, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "9_8",
          arpPresetId: "random",
          rate: "4n",
          patternOn: true,
        },
        mix: { gain: 0.24, pan: 0.10, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "orbitTick",
        motion: {
          polyrhythmPresetId: "7_8",
          arpPresetId: "steps",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.10, pan: 0.16, muted: false },
      },
    },
  },

  // =========================================================
  // Additional emotion-driven scenes (10 more)
  // =========================================================
  {
    id: "twilight_lattice",
    label: "Twilight Lattice",
    description: "Interlocking steps that feel elegant and inevitable.",
    vibeTags: ["balanced", "mechanical", "hypnotic"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "carbonPluck",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "downUp",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.50, pan: -0.20, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassPulse",
        motion: {
          polyrhythmPresetId: "5_8",
          arpPresetId: "upDown",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.30, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.16, pan: 0.03, muted: false },
      },
    },
  },

  {
    id: "sunlit_springs",
    label: "Sunlit Springs",
    description: "Playful bouncing motion—sparkly but not harsh.",
    vibeTags: ["playful", "bright", "bouncy"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "cedarPluck",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "up",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.52, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "prismBell",
        motion: {
          polyrhythmPresetId: "3_4",
          arpPresetId: "upDown",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.44, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "starlightMetal",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "random",
          rate: "8n",
          patternOn: false,
        },
        mix: { gain: 0.12, pan: 0.10, muted: true },
      },
    },
  },

  {
    id: "cathedral_spark",
    label: "Cathedral Spark",
    description: "Big, slow bell gestures with a sacred drifting undertone.",
    vibeTags: ["sacred", "wide", "slow-bloom"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "haloPad",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "drone",
          rate: "1n",
          patternOn: true,
        },
        mix: { gain: 0.32, pan: -0.10, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "12_8",
          arpPresetId: "up",
          rate: "4n",
          patternOn: true,
        },
        mix: { gain: 0.38, pan: 0.10, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.14, pan: 0.02, muted: false },
      },
    },
  },

  {
    id: "clockwork_gleam",
    label: "Clockwork Gleam",
    description: "Precise mechanical motion—tight, clean, satisfying.",
    vibeTags: ["tight", "precise", "forward"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "orbitTick",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "steps",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.14, pan: -0.22, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "carbonPluck",
        motion: {
          polyrhythmPresetId: "7_8",
          arpPresetId: "downUp",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.46, pan: 0.10, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "glassPulse",
        motion: {
          polyrhythmPresetId: "5_4",
          arpPresetId: "pulse",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.22, pan: 0.22, muted: false },
      },
    },
  },

  {
    id: "violet_mirage",
    label: "Violet Mirage",
    description: "Soft surreal motion—feels like light bending in fog.",
    vibeTags: ["surreal", "soft", "drifting"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "duskPad",
        motion: {
          polyrhythmPresetId: "9_8",
          arpPresetId: "shimmer",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.34, pan: -0.10, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "7_4",
          arpPresetId: "random",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.28, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "starlightMetal",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "random",
          rate: "16n",
          patternOn: false,
        },
        mix: { gain: 0.10, pan: 0.18, muted: true },
      },
    },
  },

  {
    id: "silver_current",
    label: "Silver Current",
    description: "Smooth flowing motion—steady, glossy, and continuous.",
    vibeTags: ["flowing", "steady", "glossy"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "cedarPluck",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "upDown",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.44, pan: -0.16, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "glassPulse",
        motion: {
          polyrhythmPresetId: "9_8",
          arpPresetId: "pulse",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.24, pan: 0.16, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.12, pan: 0.02, muted: false },
      },
    },
  },

  {
    id: "ember_waltz",
    label: "Ember Waltz",
    description: "A warm 3-feel sway with a slow glowing undertone.",
    vibeTags: ["warm", "sway", "romantic"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "cedarPluck",
        motion: {
          polyrhythmPresetId: "3_4",
          arpPresetId: "down",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.46, pan: -0.14, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "up",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.30, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "haloPad",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "drone",
          rate: "1n",
          patternOn: true,
        },
        mix: { gain: 0.18, pan: 0.00, muted: false },
      },
    },
  },

  {
    id: "aurora_glass",
    label: "Aurora Glass",
    description: "Bright glassy motion—sparkles with forward energy.",
    vibeTags: ["bright", "glassy", "driving"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassPulse",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "pulse",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.30, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "prismBell",
        motion: {
          polyrhythmPresetId: "5_4",
          arpPresetId: "upDown",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.44, pan: 0.16, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "orbitTick",
        motion: {
          polyrhythmPresetId: "7_8",
          arpPresetId: "steps",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.10, pan: 0.22, muted: false },
      },
    },
  },

  {
    id: "deep_orbit",
    label: "Deep Orbit",
    description: "Slow gravitational pull—dark pad + sparse accents.",
    vibeTags: ["deep", "slow", "weighty"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "duskPad",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "drone",
          rate: "1n",
          patternOn: true,
        },
        mix: { gain: 0.34, pan: -0.10, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "7_4",
          arpPresetId: "random",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.20, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "orbitTick",
        motion: {
          polyrhythmPresetId: "5_8",
          arpPresetId: "steps",
          rate: "16n",
          patternOn: false,
        },
        mix: { gain: 0.08, pan: 0.20, muted: true },
      },
    },
  },

  {
    id: "shimmerfield",
    label: "Shimmerfield",
    description: "A soft shimmering plane with gentle bell flickers.",
    vibeTags: ["shimmer", "soft", "wide"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "haloPad",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "shimmer",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.30, pan: -0.12, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "11_8",
          arpPresetId: "random",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.22, pan: 0.12, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.14, pan: 0.02, muted: false },
      },
    },
  },

  {
    id: "starlit_edges",
    label: "Starlit Edges",
    description: "Tiny metallic glints around a steady rhythmic frame.",
    vibeTags: ["sparkle", "edges", "detail"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "carbonPluck",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "downUp",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.40, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "starlightMetal",
        motion: {
          polyrhythmPresetId: "9_8",
          arpPresetId: "random",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.12, pan: 0.18, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "6_8",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.10, pan: 0.02, muted: false },
      },
    },
  },

  {
    id: "restless_moons",
    label: "Restless Moons",
    description: "Uneasy interlock—odd meters that feel alive and tense.",
    vibeTags: ["tense", "alive", "odd-meter"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "glassPulse",
        motion: {
          polyrhythmPresetId: "7_8",
          arpPresetId: "upDown",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.26, pan: -0.18, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "carbonPluck",
        motion: {
          polyrhythmPresetId: "5_8",
          arpPresetId: "downUp",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.42, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "orbitTick",
        motion: {
          polyrhythmPresetId: "11_8",
          arpPresetId: "steps",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.10, pan: 0.22, muted: false },
      },
    },
  },

  {
    id: "gentle_gears",
    label: "Gentle Gears",
    description: "Mechanical but kind—tight steps with softened tone.",
    vibeTags: ["mechanical", "gentle", "steady"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "cedarPluck",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "steps",
          rate: "16n",
          patternOn: true,
        },
        mix: { gain: 0.44, pan: -0.16, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "6_4",
          arpPresetId: "up",
          rate: "8n",
          patternOn: true,
        },
        mix: { gain: 0.26, pan: 0.14, muted: false },
      },
      orbitC: {
        enabled: false,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.12, pan: 0.00, muted: true },
      },
    },
  },

  {
    id: "quiet_horizon",
    label: "Quiet Horizon",
    description: "Minimal motion—just enough to feel alive, never busy.",
    vibeTags: ["minimal", "calm", "spacious"],
    orbits: {
      orbitA: {
        enabled: true,
        voicePresetId: "haloPad",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "drone",
          rate: "1n",
          patternOn: true,
        },
        mix: { gain: 0.26, pan: -0.10, muted: false },
      },
      orbitB: {
        enabled: true,
        voicePresetId: "velvetBell",
        motion: {
          polyrhythmPresetId: "12_8",
          arpPresetId: "random",
          rate: "2n",
          patternOn: true,
        },
        mix: { gain: 0.16, pan: 0.10, muted: false },
      },
      orbitC: {
        enabled: true,
        voicePresetId: "whisperAir",
        motion: {
          polyrhythmPresetId: "4_4",
          arpPresetId: "off",
          rate: "1n",
          patternOn: false,
        },
        mix: { gain: 0.10, pan: 0.02, muted: false },
      },
    },
  },
];