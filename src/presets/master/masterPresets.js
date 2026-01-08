// src/presets/master/masterPresets.js

/**
 * MASTER_PRESETS + GALAXIES
 *
 * IMPORTANT:
 * - TopBar currently shows Galaxy0 presets only.
 * - We link a MASTER preset -> a CoreLayer triplet:
 *    preset.coreLayerPresetId -> CORE_LAYER_PRESETS[...]
 *
 * NEW (v1+):
 * - Each MASTER preset can define global musical intent via preset.master:
 *    { bpm, timeSig, cycleMeasures, sigLocked }
 */

const BANNER_BASE_PATH = "/assets/skins/banners";

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

        // ✅ NEW: global musical intent
        master: {
          bpm: 90,
          timeSig: "4/4",
          cycleMeasures: 1,
          sigLocked: true,
        },

        // ✅ Core Dawn triplet = your WAV assets
        coreLayerPresetId: "coreDawn",

        core: {
          ground: { gain: 90, muted: false },
          harmony: { gain: 65, muted: false },
          atmosphere: { gain: 55, muted: false },
        },

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

        // ✅ NEW: global musical intent
        master: {
          bpm: 72,
          timeSig: "4/4",
          cycleMeasures: 1,
          sigLocked: true,
        },

        // ✅ Solar Drift triplet = your WAV assets
        coreLayerPresetId: "solarDrift",

        core: {
          ground: { gain: 60, muted: false },
          harmony: { gain: 80, muted: false },
          atmosphere: { gain: 65, muted: false },
        },

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

        // ✅ NEW: global musical intent
        master: {
          bpm: 110,
          timeSig: "4/4",
          cycleMeasures: 1,
          sigLocked: true,
        },

        coreLayerPresetId: "auroraPulse",
        core: {
          ground: { gain: 70, muted: false },
          harmony: { gain: 70, muted: false },
          atmosphere: { gain: 80, muted: false },
        },
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

        // ✅ NEW: global musical intent
        master: {
          bpm: 84,
          timeSig: "6/8",
          cycleMeasures: 1,
          sigLocked: true,
        },

        coreLayerPresetId: "nebulaEcho",
        core: {
          ground: { gain: 50, muted: false },
          harmony: { gain: 85, muted: false },
          atmosphere: { gain: 85, muted: false },
        },
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

        // ✅ NEW: global musical intent
        master: {
          bpm: 78,
          timeSig: "4/4",
          cycleMeasures: 1,
          sigLocked: true,
        },

        coreLayerPresetId: "midnightBloom",
        core: {
          ground: { gain: 75, muted: false },
          harmony: { gain: 55, muted: false },
          atmosphere: { gain: 70, muted: false },
        },
        orbitSceneId: "midnight_embers",
      },
    },
  },

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

export const MASTER_PRESET_MENU = GALAXY0_MASTER_PRESET_ORDER.map(
  (presetId) => `galaxy0:${presetId}`
);

export function getMasterPreset(galaxyId, presetId) {
  return MASTER_PRESETS?.[galaxyId]?.presets?.[presetId] || null;
}

export function getGalaxy(galaxyId) {
  return MASTER_PRESETS?.[galaxyId] || null;
}

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