// src/presets/core/coreLayerPresets.js

import { GROUND_PRESETS } from "./groundPresets";
import { HARMONY_PRESETS } from "./harmonyPresets";
import { ATMOSPHERE_PRESETS } from "./atmospherePresets";

/**
 * CORE LAYER PRESETS
 * ------------------
 * A "core layer preset" is simply selecting:
 *  - one ground preset id
 *  - one harmony preset id
 *  - one atmosphere preset id
 *
 * This is the bridge between MASTER PRESETS and the per-layer libraries.
 */

export const CORE_LAYER_PRESETS = {
  // ✅ Use your new sampler ground tones here
  coreDawn: {
    id: "coreDawn",
    label: "Core Dawn",
    groundId: "contrabassSampler", // ✅ WAS subAnchor
    harmonyId: "velvetKeys",
    atmosphereId: "auroraAir",
  },

  solarDrift: {
    id: "solarDrift",
    label: "Solar Drift",
    groundId: "deepSampler", // ✅ WAS duskDrone
    harmonyId: "warmChorusPad",
    atmosphereId: "shorelineMist",
  },

  auroraPulse: {
    id: "auroraPulse",
    label: "Aurora Pulse",
    groundId: "ironFloor",
    harmonyId: "prismSynth",
    atmosphereId: "shimmerWind",
  },

  nebulaEcho: {
    id: "nebulaEcho",
    label: "Nebula Echo",
    groundId: "velvetSub",
    harmonyId: "softPianoBloom",
    atmosphereId: "highCanopy",
  },

  midnightBloom: {
    id: "midnightBloom",
    label: "Midnight Bloom",
    groundId: "duskDrone",
    harmonyId: "velvetKeys",
    atmosphereId: "shimmerWind",
  },
};

export function getCorePresetTriplet(coreLayerPresetId) {
  const bundle = CORE_LAYER_PRESETS?.[coreLayerPresetId] || null;
  if (!bundle) return null;

  const ground = GROUND_PRESETS?.[bundle.groundId] || null;
  const harmony = HARMONY_PRESETS?.[bundle.harmonyId] || null;
  const atmosphere = ATMOSPHERE_PRESETS?.[bundle.atmosphereId] || null;

  return { bundle, ground, harmony, atmosphere };
}