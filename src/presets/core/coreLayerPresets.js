// src/presets/core/coreLayerPresets.js

import { GROUND_PRESETS } from "./groundPresets";
import { HARMONY_PRESETS } from "./harmonyPresets";
import { ATMOSPHERE_PRESETS } from "./atmospherePresets";

export const CORE_LAYER_PRESETS = {
  // -------------------------
  // ✅ CORE DAWN
  // -------------------------
  coreDawn: {
    id: "coreDawn",
    label: "Core Dawn",
    groundId: "coreDawn_ground_sampler",
    harmonyId: "coreDawn_harmony_sampler",
    atmosphereId: "coreDawn_atmosphere_loop",
  },

  // -------------------------
  // ✅ SOLAR DRIFT
  // -------------------------
  solarDrift: {
    id: "solarDrift",
    label: "Solar Drift",
    groundId: "solarDrift_ground_sampler",
    harmonyId: "solarDrift_harmony_sampler",
    atmosphereId: "solarDrift_atmosphere_loop",
  },

  // -------------------------
  // ✅ AURORA PULSE
  // -------------------------
  auroraPulse: {
    id: "auroraPulse",
    label: "Aurora Pulse",
    groundId: "auroraPulse_ground_sampler",
    harmonyId: "auroraPulse_harmony_sampler",
    atmosphereId: "auroraPulse_atmosphere_loop",
  },

  // -------------------------
  // ✅ NEBULA ECHO
  // -------------------------
  nebulaEcho: {
    id: "nebulaEcho",
    label: "Nebula Echo",
    groundId: "nebulaEcho_ground_sampler",
    harmonyId: "nebulaEcho_harmony_sampler",
    atmosphereId: "nebulaEcho_atmosphere_loop",
  },

  // -------------------------
  // ✅ MIDNIGHT BLOOM
  // -------------------------
  midnightBloom: {
    id: "midnightBloom",
    label: "Midnight Bloom",
    groundId: "midnightBloom_ground_sampler",
    harmonyId: "midnightBloom_harmony_sampler",
    atmosphereId: "midnightBloom_atmosphere_loop",
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