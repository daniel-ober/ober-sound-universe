// src/presets/core/harmonyPresets.js

const BASE = import.meta.env.BASE_URL || "/";

function makeHarmonySamplerPreset(
  id,
  title,
  folder,
  { attack = 0.01, release = 2.0, volume = 0 } = {}
) {
  const root = `${BASE}assets/samples/${folder}/harmonious/`;
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

export const HARMONY_PRESETS = {
  // ✅ CORE DAWN
  coreDawn_harmony_sampler: makeHarmonySamplerPreset(
    "coreDawn_harmony_sampler",
    "Core Dawn — Harmony (Sampler)",
    "core_dawn",
    { attack: 0.01, release: 2.0, volume: 0 }
  ),

  // ✅ SOLAR DRIFT
  solarDrift_harmony_sampler: makeHarmonySamplerPreset(
    "solarDrift_harmony_sampler",
    "Solar Drift — Harmony (Sampler)",
    "solar_drift",
    { attack: 0.01, release: 2.0, volume: 0 }
  ),

  // ✅ AURORA PULSE
  auroraPulse_harmony_sampler: makeHarmonySamplerPreset(
    "auroraPulse_harmony_sampler",
    "Aurora Pulse — Harmony (Sampler)",
    "aurora_pulse",
    { attack: 0.01, release: 2.05, volume: 0 }
  ),

  // ✅ NEBULA ECHO
  nebulaEcho_harmony_sampler: makeHarmonySamplerPreset(
    "nebulaEcho_harmony_sampler",
    "Nebula Echo — Harmony (Sampler)",
    "nebula_echo",
    { attack: 0.01, release: 2.1, volume: 0 }
  ),

  // ✅ MIDNIGHT BLOOM
  midnightBloom_harmony_sampler: makeHarmonySamplerPreset(
    "midnightBloom_harmony_sampler",
    "Midnight Bloom — Harmony (Sampler)",
    "midnight_bloom",
    { attack: 0.01, release: 2.2, volume: 0 }
  ),
};