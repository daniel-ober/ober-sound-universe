// src/presets/masterPresets.js

/**
 * MASTER_PRESETS + GALAXIES
 *
 * - MASTER_PRESETS is the canonical source of instrument state.
 * - GALAXIES is a light descriptor array used by UI components.
 *
 * Galaxy0: two master presets (A/B) + an Orbit Group system:
 *   - orbitGroups: "tight" and "breathing"
 *   - Each master preset picks:
 *       - core mix
 *       - orbit mix
 *       - per-orbit pattern on/off
 *       - orbitGroupMode ("tight" | "breathing")
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

export const MASTER_PRESETS = {
  galaxy0: {
    id: "galaxy0",
    name: "Galaxy0",
    displayName: "GALAXY0",
    description: "Dev galaxy for OMSE v1 testing.",
    defaultPresetId: "presetA",
    orbitGroups: GALAXY0_ORBIT_GROUPS,

    presets: {
      // Preset A — Drift
      presetA: {
        id: "presetA",
        label: "Preset A · Drift",
        core: {
          ground: { gain: 90, muted: false },
          harmony: { gain: 65, muted: false },
          atmos: { gain: 55, muted: false },
        },
        orbits: {
          orbitA: { gain: 70, muted: false },
          orbitB: { gain: 60, muted: false },
          orbitC: { gain: 45, muted: false },
        },
        // Per-orbit pattern on/off
        orbitPatterns: {
          orbitA: true,
          orbitB: false,
          orbitC: true,
        },
        // Wide, breathing Orbit Group
        orbitGroupMode: "breathing",
      },

      // Preset B — Focus
      presetB: {
        id: "presetB",
        label: "Preset B · Focus",
        core: {
          ground: { gain: 55, muted: false },
          harmony: { gain: 80, muted: false },
          atmos: { gain: 75, muted: false },
        },
        orbits: {
          orbitA: { gain: 50, muted: false },
          orbitB: { gain: 70, muted: false },
          orbitC: { gain: 65, muted: false },
        },
        // More focused orbit motion
        orbitPatterns: {
          orbitA: false,
          orbitB: true,
          orbitC: true,
        },
        // Tight Orbit Group alignment
        orbitGroupMode: "tight",
      },
    },
  },
};

// Simple descriptor list if any UI needs it
export const GALAXIES = [
  {
    id: "galaxy0",
    name: "Galaxy0",
    displayName: "GALAXY0",
    presets: MASTER_PRESETS.galaxy0.presets,
  },
];