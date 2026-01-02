// src/presets/masterPresets.js

/**
 * MASTER_PRESETS + GALAXIES
 *
 * - MASTER_PRESETS is the canonical source of instrument state.
 * - GALAXIES is a light descriptor array used by UI components.
 *
 * Galaxy0: five master presets
 *   - Each master preset defines:
 *       - core mix (ground / harmony / atmos)
 *       - orbitSceneId (single source of truth for Orbits)
 *       - banner image for the master preset
 *
 * IMPORTANT:
 * - Orbit "Group Preset" has been removed.
 * - Orbit behavior is now driven by Orbit Master Presets:
 *     src/presets/orbits/orbitMasterPresets.js
 */

const BANNER_BASE_PATH = "/assets/skins/banners";

export const MASTER_PRESETS = {
  galaxy0: {
    id: "galaxy0",
    name: "Galaxy0",
    displayName: "GALAXY0",
    description: "Dev galaxy for OMSE v1 testing.",
    defaultPresetId: "presetA",

    presets: {
      // === PRESET A — CORE DAWN ============================================
      presetA: {
        id: "presetA",
        label: "Core Dawn",
        banner: `${BANNER_BASE_PATH}/core-dawn.png`,

        // Core mix
        core: {
          ground: { gain: 90, muted: false },
          harmony: { gain: 65, muted: false },
          atmos: { gain: 55, muted: false },
        },

        // Orbits: select a full orbit-scene preset
        orbitSceneId: "twilight_chime",
      },

      // === PRESET B — SOLAR DRIFT =========================================
      presetB: {
        id: "presetB",
        label: "Solar Drift",
        banner: `${BANNER_BASE_PATH}/solar-drift.png`,
        core: {
          ground: { gain: 60, muted: false },
          harmony: { gain: 80, muted: false },
          atmos: { gain: 65, muted: false },
        },
        orbitSceneId: "glass_pulse",
      },

      // === PRESET C — AURORA PULSE ========================================
      presetC: {
        id: "presetC",
        label: "Aurora Pulse",
        banner: `${BANNER_BASE_PATH}/aurora-pulse.png`,
        core: {
          ground: { gain: 70, muted: false },
          harmony: { gain: 70, muted: false },
          atmos: { gain: 80, muted: false },
        },
        orbitSceneId: "aurora_steps",
      },

      // === PRESET D — NEBULA ECHO =========================================
      presetD: {
        id: "presetD",
        label: "Nebula Echo",
        banner: `${BANNER_BASE_PATH}/nebula-echo.png`,
        core: {
          ground: { gain: 50, muted: false },
          harmony: { gain: 85, muted: false },
          atmos: { gain: 85, muted: false },
        },
        orbitSceneId: "nebula_shimmer",
      },

      // === PRESET E — MIDNIGHT BLOOM ======================================
      presetE: {
        id: "presetE",
        label: "Midnight Bloom",
        banner: `${BANNER_BASE_PATH}/midnight-bloom.png`,
        core: {
          ground: { gain: 75, muted: false },
          harmony: { gain: 55, muted: false },
          atmos: { gain: 70, muted: false },
        },
        orbitSceneId: "midnight_drone",
      },
    },
  },
};

/**
 * Ordered list so the UI can render chips in a consistent order.
 */
export const GALAXY0_MASTER_PRESET_ORDER = [
  "presetA",
  "presetB",
  "presetC",
  "presetD",
  "presetE",
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