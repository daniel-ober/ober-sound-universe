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
  // ✅ Uses your NEW sampler wav sets:
  // Core Dawn:
  //  /public/assets/samples/Core Dawn/ground/Inst 1.wav ... Inst 1_8.wav
  //  /public/assets/samples/Core Dawn/harmonious/Inst 1.wav ... Inst 1_8.wav
  //  /public/assets/samples/Core Dawn/atmosphere/Inst 1.wav ... Inst 1_8.wav
  coreDawn: {
    id: "coreDawn",
    label: "Core Dawn",
    groundId: "coreDawn_ground_sampler",
    harmonyId: "coreDawn_harmony_sampler",
    atmosphereId: "coreDawn_atmosphere_sampler",
  },

  // ✅ Solar Drift:
  //  /public/assets/samples/Solar Drift/ground/Inst 1.wav ... Inst 1_8.wav
  //  /public/assets/samples/Solar Drift/harmonious/Inst 1.wav ... Inst 1_8.wav
  //  /public/assets/samples/Solar Drift/atmosphere/Inst 1.wav ... Inst 1_8.wav
  solarDrift: {
    id: "solarDrift",
    label: "Solar Drift",
    groundId: "solarDrift_ground_sampler",
    harmonyId: "solarDrift_harmony_sampler",
    atmosphereId: "solarDrift_atmosphere_sampler",
  },

  // Keeping your existing synth-based bundles as-is:
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