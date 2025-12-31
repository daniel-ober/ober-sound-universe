/**
 * MASTER_PRESETS + GALAXIES
 *
 * - MASTER_PRESETS is the canonical source of instrument state.
 * - GALAXIES is a light descriptor array used by UI components.
 *
 * Galaxy0: five master presets + an Orbit Group system:
 *   - orbitGroups: "tight" and "breathing"
 *   - Each master preset picks:
 *       - core mix (ground / harmony / atmos)
 *       - orbit mix (A / B / C)
 *       - per-orbit pattern on/off
 *       - orbitGroupMode ("tight" | "breathing")
 *       - banner image for the master preset
 */

const GALAXY0_ORBIT_GROUPS = {
  tight: {
    mode: "tight",
    orbits: {
      // Focused, centered, rhythmically aligned
      orbitA: { enabled: true, pan: -0.05, subdivision: "8n" },
      orbitB: { enabled: true, pan: 0.05, subdivision: "8n" },
      orbitC: { enabled: false, pan: 0.0, subdivision: "4n" },
    },
  },
  breathing: {
    mode: "breathing",
    orbits: {
      // Wider stereo + varied subdivisions for subtle polyrhythm
      orbitA: { enabled: true, pan: -0.25, subdivision: "8n" },
      orbitB: { enabled: true, pan: 0.25, subdivision: "4n" },
      orbitC: { enabled: true, pan: 0.0, subdivision: "2n" },
    },
  },
};

// where the 4800x641 banners live
const BANNER_BASE_PATH = "/assets/skins/banners";

export const MASTER_PRESETS = {
  galaxy0: {
    id: "galaxy0",
    name: "Galaxy0",
    displayName: "GALAXY0",
    description: "Dev galaxy for OMSE v1 testing.",
    defaultPresetId: "presetA",
    orbitGroups: GALAXY0_ORBIT_GROUPS,

    /**
     * Five master presets for Galaxy0.
     *
     * IMPORTANT: each preset has the same shape so the audio
     * engine + UI can apply them generically.
     *
     * Use:
     *   const preset = MASTER_PRESETS.galaxy0.presets[activePresetId];
     *   preset.banner   -> banner image url
     *   preset.core     -> { ground / harmony / atmos }
     *   preset.orbits   -> { orbitA / orbitB / orbitC }
     *   preset.patterns -> per-orbit pattern on/off
     */
    presets: {
      // === PRESET A — CORE DAWN ============================================
      presetA: {
        id: "presetA",
        label: "Core Dawn",
        banner: `${BANNER_BASE_PATH}/core-dawn.png`,
        core: {
          // strong, warm foundation
          ground: { gain: 90, muted: false },
          harmony: { gain: 65, muted: false },
          atmos: { gain: 55, muted: false },
        },
        orbits: {
          // fairly active, but still supportive
          orbitA: { gain: 70, muted: false },
          orbitB: { gain: 60, muted: false },
          orbitC: { gain: 45, muted: false },
        },
        orbitPatterns: {
          orbitA: true,
          orbitB: false,
          orbitC: true,
        },
        orbitGroupMode: "breathing",
      },

      // === PRESET B — SOLAR DRIFT =========================================
      presetB: {
        id: "presetB",
        label: "Solar Drift",
        banner: `${BANNER_BASE_PATH}/solar-drift.png`,
        core: {
          // more mid-forward, lighter ground
          ground: { gain: 60, muted: false },
          harmony: { gain: 80, muted: false },
          atmos: { gain: 65, muted: false },
        },
        orbits: {
          // drifting motion, calmer C
          orbitA: { gain: 55, muted: false },
          orbitB: { gain: 75, muted: false },
          orbitC: { gain: 35, muted: false },
        },
        orbitPatterns: {
          orbitA: false,
          orbitB: true,
          orbitC: true,
        },
        orbitGroupMode: "tight",
      },

      // === PRESET C — AURORA PULSE ========================================
      presetC: {
        id: "presetC",
        label: "Aurora Pulse",
        banner: `${BANNER_BASE_PATH}/aurora-pulse.png`,
        core: {
          // brighter, more airy but still grounded
          ground: { gain: 70, muted: false },
          harmony: { gain: 70, muted: false },
          atmos: { gain: 80, muted: false },
        },
        orbits: {
          // rhythmic pulses in A/B, soft shimmer C
          orbitA: { gain: 65, muted: false },
          orbitB: { gain: 65, muted: false },
          orbitC: { gain: 50, muted: false },
        },
        orbitPatterns: {
          orbitA: true,
          orbitB: true,
          orbitC: false,
        },
        orbitGroupMode: "breathing",
      },

      // === PRESET D — NEBULA ECHO =========================================
      presetD: {
        id: "presetD",
        label: "Nebula Echo",
        banner: `${BANNER_BASE_PATH}/nebula-echo.png`,
        core: {
          // softer ground, very lush harmony/atmos
          ground: { gain: 50, muted: false },
          harmony: { gain: 85, muted: false },
          atmos: { gain: 85, muted: false },
        },
        orbits: {
          // wider pads & echo-like motion
          orbitA: { gain: 45, muted: false },
          orbitB: { gain: 65, muted: false },
          orbitC: { gain: 70, muted: false },
        },
        orbitPatterns: {
          orbitA: true,
          orbitB: true,
          orbitC: true,
        },
        orbitGroupMode: "breathing",
      },

      // === PRESET E — MIDNIGHT BLOOM ======================================
      presetE: {
        id: "presetE",
        label: "Midnight Bloom",
        banner: `${BANNER_BASE_PATH}/midnight-bloom.png`,
        core: {
          // deep, intimate; darker ground + glowing atmos
          ground: { gain: 75, muted: false },
          harmony: { gain: 55, muted: false },
          atmos: { gain: 70, muted: false },
        },
        orbits: {
          // more minimal orbit motion, focus on A
          orbitA: { gain: 60, muted: false },
          orbitB: { gain: 40, muted: false },
          orbitC: { gain: 30, muted: false },
        },
        orbitPatterns: {
          orbitA: true,
          orbitB: false,
          orbitC: false,
        },
        orbitGroupMode: "tight",
      },
    },
  },
};

/**
 * Ordered list so the UI can render chips in a consistent order.
 */
export const GALAXY0_MASTER_PRESET_ORDER = [
  "presetA", // Core Dawn
  "presetB", // Solar Drift
  "presetC", // Aurora Pulse
  "presetD", // Nebula Echo
  "presetE", // Midnight Bloom
];

// Simple descriptor list if any UI needs it
export const GALAXIES = [
  {
    id: "galaxy0",
    name: "Galaxy0",
    displayName: "GALAXY0",
    presets: MASTER_PRESETS.galaxy0.presets,
  },
];