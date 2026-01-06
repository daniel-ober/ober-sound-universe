// src/presets/core/groundPresets.js

const BASE = import.meta.env.BASE_URL || "/";

function makeGroundSamplerPreset(id, title, folder, { attack = 0.01, release = 2.6, volume = 0 } = {}) {
  const root = `${BASE}assets/samples/${folder}/ground/`;
  return {
    id,
    title,
    engine: "sampler",
    params: {
      urls: {
        C3: `${root}C.wav`,
        "C#3": `${root}C_sharp.wav`,
        D3: `${root}D.wav`,
        "D#3": `${root}D_sharp.wav`,
        E3: `${root}E.wav`,
        F3: `${root}F.wav`,
        "F#3": `${root}F_sharp.wav`,
        G3: `${root}G.wav`,
        "G#3": `${root}G_sharp.wav`,
        A3: `${root}A.wav`,
        "A#3": `${root}A_sharp.wav`,
        B3: `${root}B.wav`,
      },
      attack,
      release,
      volume,
    },
    gain: 0.9,
    pan: 0,
  };
}

export const GROUND_PRESETS = {
  // ✅ CORE DAWN
  coreDawn_ground_sampler: makeGroundSamplerPreset(
    "coreDawn_ground_sampler",
    "Core Dawn — Ground (Sampler)",
    "core_dawn",
    { attack: 0.01, release: 2.5, volume: 0 }
  ),

  // ✅ SOLAR DRIFT
  solarDrift_ground_sampler: makeGroundSamplerPreset(
    "solarDrift_ground_sampler",
    "Solar Drift — Ground (Sampler)",
    "solar_drift",
    { attack: 0.01, release: 2.7, volume: 0 }
  ),

  // ✅ AURORA PULSE
  auroraPulse_ground_sampler: makeGroundSamplerPreset(
    "auroraPulse_ground_sampler",
    "Aurora Pulse — Ground (Sampler)",
    "aurora_pulse",
    { attack: 0.01, release: 2.6, volume: 0 }
  ),

  // ✅ NEBULA ECHO
  nebulaEcho_ground_sampler: makeGroundSamplerPreset(
    "nebulaEcho_ground_sampler",
    "Nebula Echo — Ground (Sampler)",
    "nebula_echo",
    { attack: 0.01, release: 2.8, volume: 0 }
  ),

  // ✅ MIDNIGHT BLOOM
  midnightBloom_ground_sampler: makeGroundSamplerPreset(
    "midnightBloom_ground_sampler",
    "Midnight Bloom — Ground (Sampler)",
    "midnight_bloom",
    { attack: 0.01, release: 2.9, volume: 0 }
  ),
};