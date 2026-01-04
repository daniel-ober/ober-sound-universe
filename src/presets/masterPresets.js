// src/presets/masterPresets.js

/**
 * MASTER_PRESETS + GALAXIES
 *
 * IMPORTANT:
 * - MASTER_PRESET_MENU must be an array of GLOBAL IDs (strings),
 *   because TopBar expects IDs like: "galaxy0:presetA"
 * - Only Galaxy0 presets should show in the dropdown for now.
 */

const BANNER_BASE_PATH = "/assets/skins/banners";

/**
 * Galaxy display names (rename these to whatever you want).
 */
export const GALAXY_DISPLAY = {
  galaxy0: "GALAXY0 (DEV)",
  galaxy1: "GALAXY1 — NOVA ATLAS",
  galaxy2: "GALAXY2 — ECLIPSE VALE",
  galaxy3: "GALAXY3 — CELESTIAL FORGE",
  galaxy4: "GALAXY4 — LUMEN TIDE",
  galaxy5: "GALAXY5 — VOID GARDEN",
};

export const MASTER_PRESETS = {
  galaxy0: {
    id: "galaxy0",
    name: "Galaxy0",
    displayName: GALAXY_DISPLAY.galaxy0,
    description: "Dev galaxy for OMSE v1 testing.",
    defaultPresetId: "presetA",

    presets: {
      presetA: {
        id: "presetA",
        label: "Core Dawn",
        banner: `${BANNER_BASE_PATH}/core-dawn.png`,

        meta: {
          galaxyLine: "Galaxy 0 — Dev",
          tagsLine: "Dark · Cinematic · Controlled",
          moodLine:
            "A grounded cinematic foundation—solid core weight with restrained harmonic lift.",
        },

        core: {
          ground: { gain: 90, muted: false },
          harmony: { gain: 65, muted: false },
          atmos: { gain: 55, muted: false },
        },

        // ✅ Updated best-match Orbit Master Preset
        orbitSceneId: "anchor_bloom",
      },

      presetB: {
        id: "presetB",
        label: "Solar Drift",
        banner: `${BANNER_BASE_PATH}/solar-drift.png`,

        meta: {
          galaxyLine: "Galaxy 0 — Dev",
          tagsLine: "Warm · Floating · Expansive",
          moodLine:
            "Slow orbiting warmth—gentle motion with a wide halo and softened edges.",
        },

        core: {
          ground: { gain: 60, muted: false },
          harmony: { gain: 80, muted: false },
          atmos: { gain: 65, muted: false },
        },

        // ✅ Updated best-match Orbit Master Preset
        orbitSceneId: "warm_tides",
      },

      presetC: {
        id: "presetC",
        label: "Aurora Pulse",
        banner: `${BANNER_BASE_PATH}/aurora-pulse.png`,

        meta: {
          galaxyLine: "Galaxy 0 — Dev",
          tagsLine: "Luminous · Rhythmic · Energetic",
          moodLine:
            "Brighter motion-forward balance—core stays present while atmos shimmers and pushes.",
        },

        core: {
          ground: { gain: 70, muted: false },
          harmony: { gain: 70, muted: false },
          atmos: { gain: 80, muted: false },
        },

        // ✅ Updated best-match Orbit Master Preset
        orbitSceneId: "kinetic_prism",
      },

      presetD: {
        id: "presetD",
        label: "Nebula Echo",
        banner: `${BANNER_BASE_PATH}/nebula-echo.png`,

        meta: {
          galaxyLine: "Galaxy 0 — Dev",
          tagsLine: "Ethereal · Wide · Dreamlike",
          moodLine:
            "A drifting nebula haze—harmonics bloom outward while the core stays understated.",
        },

        core: {
          ground: { gain: 50, muted: false },
          harmony: { gain: 85, muted: false },
          atmos: { gain: 85, muted: false },
        },

        // ✅ Updated best-match Orbit Master Preset
        orbitSceneId: "nebula_haze",
      },

      presetE: {
        id: "presetE",
        label: "Midnight Bloom",
        banner: `${BANNER_BASE_PATH}/midnight-bloom.png`,

        meta: {
          galaxyLine: "Galaxy 0 — Dev",
          tagsLine: "Moody · Velvet · Late-Night",
          moodLine:
            "Deep and intimate—soft harmonies bloom in the dark with a calm, steady pull.",
        },

        core: {
          ground: { gain: 75, muted: false },
          harmony: { gain: 55, muted: false },
          atmos: { gain: 70, muted: false },
        },

        // ✅ Updated best-match Orbit Master Preset
        orbitSceneId: "midnight_embers",
      },
    },
  },

  // Placeholder galaxies
  galaxy1: {
    id: "galaxy1",
    name: "Galaxy1",
    displayName: GALAXY_DISPLAY.galaxy1,
    description: "Placeholder galaxy. Add presets when ready.",
    defaultPresetId: null,
    presets: {},
  },
  galaxy2: {
    id: "galaxy2",
    name: "Galaxy2",
    displayName: GALAXY_DISPLAY.galaxy2,
    description: "Placeholder galaxy. Add presets when ready.",
    defaultPresetId: null,
    presets: {},
  },
  galaxy3: {
    id: "galaxy3",
    name: "Galaxy3",
    displayName: GALAXY_DISPLAY.galaxy3,
    description: "Placeholder galaxy. Add presets when ready.",
    defaultPresetId: null,
    presets: {},
  },
  galaxy4: {
    id: "galaxy4",
    name: "Galaxy4",
    displayName: GALAXY_DISPLAY.galaxy4,
    description: "Placeholder galaxy. Add presets when ready.",
    defaultPresetId: null,
    presets: {},
  },
  galaxy5: {
    id: "galaxy5",
    name: "Galaxy5",
    displayName: GALAXY_DISPLAY.galaxy5,
    description: "Placeholder galaxy. Add presets when ready.",
    defaultPresetId: null,
    presets: {},
  },
};

export const GALAXY0_MASTER_PRESET_ORDER = [
  "presetA",
  "presetB",
  "presetC",
  "presetD",
  "presetE",
];

/**
 * ✅ Only show Galaxy0 presets for now
 * MUST be array of strings: ["galaxy0:presetA", ...]
 */
export const MASTER_PRESET_MENU = GALAXY0_MASTER_PRESET_ORDER.map(
  (presetId) => `galaxy0:${presetId}`
);

export function getMasterPreset(galaxyId, presetId) {
  return MASTER_PRESETS?.[galaxyId]?.presets?.[presetId] || null;
}

export function getGalaxy(galaxyId) {
  return MASTER_PRESETS?.[galaxyId] || null;
}

/**
 * Accepts:
 *  - "galaxy0:presetA"
 *  - "galaxy0/presetA"
 *
 * Returns: { globalId, galaxyId, presetId, galaxy, preset } or null
 */
export function getMasterPresetByGlobalId(globalId) {
  if (typeof globalId !== "string" || !globalId.trim()) return null;

  const raw = globalId.trim();
  const sep = raw.includes(":") ? ":" : raw.includes("/") ? "/" : null;
  if (!sep) return null;

  const [galaxyId, presetId] = raw.split(sep).map((s) => (s || "").trim());
  if (!galaxyId || !presetId) return null;

  const galaxy = MASTER_PRESETS?.[galaxyId] || null;
  const preset = galaxy?.presets?.[presetId] || null;

  if (!galaxy || !preset) return null;

  return {
    globalId: `${galaxyId}:${presetId}`,
    galaxyId,
    presetId,
    galaxy,
    preset,
  };
}