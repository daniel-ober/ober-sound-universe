export const ATMOSPHERE_PRESETS = {
  coreDawn_atmosphere_sampler: {
    id: "coreDawn_atmosphere_sampler",
    label: "Core Dawn — Atmosphere",
    engine: "sampler",
    params: {
      baseUrl: "/assets/samples/Core Dawn/atmosphere/",
      urls: {
        C2: "Inst 1.wav",
        D2: "Inst 1_2.wav",
        E2: "Inst 1_3.wav",
        F2: "Inst 1_4.wav",
        G2: "Inst 1_5.wav",
        A2: "Inst 1_6.wav",
        B2: "Inst 1_7.wav",
        C3: "Inst 1_8.wav",
      },
      attack: 1.4,
      release: 6.0,
      volume: -14,
      reverbSend: 0.45,
      delaySend: 0.1,
    },
  },

  solarDrift_atmosphere_sampler: {
    id: "solarDrift_atmosphere_sampler",
    label: "Solar Drift — Atmosphere",
    engine: "sampler",
    params: {
      baseUrl: "/assets/samples/Solar Drift/atmosphere/",
      urls: {
        C2: "Inst 1.wav",
        D2: "Inst 1_2.wav",
        E2: "Inst 1_3.wav",
        F2: "Inst 1_4.wav",
        G2: "Inst 1_5.wav",
        A2: "Inst 1_6.wav",
        B2: "Inst 1_7.wav",
        C3: "Inst 1_8.wav",
      },
      attack: 1.8,
      release: 7.5,
      volume: -15,
      reverbSend: 0.48,
      delaySend: 0.12,
    },
  },
};