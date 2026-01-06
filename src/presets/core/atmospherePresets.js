// src/presets/core/atmospherePresets.js

const BASE = import.meta.env.BASE_URL || "/";

export const ATMOSPHERE_PRESETS = {
  // -------------------------
  // ✅ CORE DAWN (Loop)
  // -------------------------
  coreDawn_atmosphere_loop: {
    id: "coreDawn_atmosphere_loop",
    title: "Core Dawn — Atmosphere (Loop)",
    engine: "loop",
    loop: {
      url: `${BASE}assets/samples/core_dawn/atmosphere/loop.wav`,
      loop: true,
    },
    gain: 0.65,
    pan: 0,
  },

  // -------------------------
  // ✅ SOLAR DRIFT (Loop)
  // -------------------------
  solarDrift_atmosphere_loop: {
    id: "solarDrift_atmosphere_loop",
    title: "Solar Drift — Atmosphere (Loop)",
    engine: "loop",
    loop: {
      url: `${BASE}assets/samples/solar_drift/atmosphere/loop.wav`,
      loop: true,
    },
    gain: 0.6,
    pan: 0,
  },

  // -------------------------
  // ✅ AURORA PULSE (Loop)
  // -------------------------
  auroraPulse_atmosphere_loop: {
    id: "auroraPulse_atmosphere_loop",
    title: "Aurora Pulse — Atmosphere (Loop)",
    engine: "loop",
    loop: {
      url: `${BASE}assets/samples/aurora_pulse/atmosphere/loop.wav`,
      loop: true,
    },
    gain: 0.62,
    pan: 0,
  },

  // -------------------------
  // ✅ NEBULA ECHO (Loop)
  // -------------------------
  nebulaEcho_atmosphere_loop: {
    id: "nebulaEcho_atmosphere_loop",
    title: "Nebula Echo — Atmosphere (Loop)",
    engine: "loop",
    loop: {
      url: `${BASE}assets/samples/nebula_echo/atmosphere/loop.wav`,
      loop: true,
    },
    gain: 0.6,
    pan: 0,
  },

  // -------------------------
  // ✅ MIDNIGHT BLOOM (Loop)
  // -------------------------
  midnightBloom_atmosphere_loop: {
    id: "midnightBloom_atmosphere_loop",
    title: "Midnight Bloom — Atmosphere (Loop)",
    engine: "loop",
    loop: {
      url: `${BASE}assets/samples/midnight_bloom/atmosphere/loop.wav`,
      loop: true,
    },
    gain: 0.58,
    pan: 0,
  },
};