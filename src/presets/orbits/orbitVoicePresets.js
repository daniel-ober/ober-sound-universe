// src/presets/orbits/orbitVoicePresets.js

/**
 * ORBIT VOICE PRESETS
 * -------------------
 * Curated, stable Tone.js-friendly synth engines for orbit layers.
 *
 * engine:
 *  - "synth"   -> Tone.Synth style params (oscillator, envelope)
 *  - "fm"      -> Tone.FMSynth style params (harmonicity, modulationIndex, envelope)
 *  - "am"      -> Tone.AMSynth style params (harmonicity, envelope)
 *  - "mono"    -> Tone.MonoSynth style params (oscillator, envelope, filterEnvelope, filter)
 *  - "metal"   -> Tone.MetalSynth style params (frequency, envelope, harmonicity, modulationIndex, resonance, octaves)
 *
 * NOTE:
 * Your engine's `applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS)` must map these
 * to Tone instruments. These params are conservative and generally “safe”.
 *
 * GOAL:
 * - Each voice has a distinct spectral role + transient profile
 * - Built for polyrhythmic motion (clear attacks, controlled tails)
 * - Pads are “wide” but not overwhelming; pulses are “readable”
 */

export const ORBIT_VOICE_PRESETS = {
  // ============================================================
  // LEGACY IDS (KEEP FOR COMPATIBILITY)
  // ============================================================
  glassBell: {
    id: "glassBell",
    label: "Glass Bell (Legacy)",
    engine: "synth",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.7 },
      filter: { type: "lowpass", frequency: 9000, Q: 0.7 },
    },
  },

  softPluck: {
    id: "softPluck",
    label: "Soft Pluck (Legacy)",
    engine: "fm",
    params: {
      harmonicity: 2,
      modulationIndex: 7,
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.35 },
    },
  },

  violetAir: {
    id: "violetAir",
    label: "Violet Air Pad (Legacy)",
    engine: "synth",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.8, decay: 0.4, sustain: 0.75, release: 1.8 },
      filter: { type: "lowpass", frequency: 4200, Q: 0.6 },
    },
  },

  // ============================================================
  // FAMILY 1: PULSE / TRANSIENT (rhythmic clarity)
  // ============================================================
  carbonPluck: {
    id: "carbonPluck",
    label: "Carbon Pluck",
    engine: "mono",
    params: {
      oscillator: { type: "square" },
      envelope: { attack: 0.005, decay: 0.16, sustain: 0.12, release: 0.55 },
      filter: { type: "lowpass", frequency: 4800, Q: 0.9 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0.0,
        release: 0.12,
        baseFrequency: 300,
        octaves: 3.2,
      },
    },
  },

  orbitTick: {
    id: "orbitTick",
    label: "Orbit Tick",
    engine: "mono",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.08 },
      filter: { type: "highpass", frequency: 650, Q: 0.7 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.03,
        sustain: 0.0,
        release: 0.03,
        baseFrequency: 650,
        octaves: 1.5,
      },
    },
  },

  emberClick: {
    id: "emberClick",
    label: "Ember Click",
    engine: "mono",
    params: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.1 },
      filter: { type: "bandpass", frequency: 1200, Q: 1.6 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.06,
        sustain: 0.0,
        release: 0.06,
        baseFrequency: 500,
        octaves: 2.2,
      },
    },
  },

  snapBass: {
    id: "snapBass",
    label: "Snap Bass",
    engine: "mono",
    params: {
      oscillator: { type: "square" },
      envelope: { attack: 0.004, decay: 0.18, sustain: 0.0, release: 0.22 },
      filter: { type: "lowpass", frequency: 900, Q: 0.9 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.16,
        sustain: 0.0,
        release: 0.12,
        baseFrequency: 90,
        octaves: 2.4,
      },
    },
  },

  // ============================================================
  // FAMILY 2: HARMONIC MOTION (identity + melody)
  // ============================================================
  prismBell: {
    id: "prismBell",
    label: "Prism Bell",
    engine: "fm",
    params: {
      harmonicity: 3,
      modulationIndex: 10,
      envelope: { attack: 0.003, decay: 0.22, sustain: 0.18, release: 1.05 },
    },
  },

  velvetBell: {
    id: "velvetBell",
    label: "Velvet Bell",
    engine: "fm",
    params: {
      harmonicity: 1.5,
      modulationIndex: 6.5,
      envelope: { attack: 0.01, decay: 0.35, sustain: 0.22, release: 1.6 },
    },
  },

  glassPulse: {
    id: "glassPulse",
    label: "Glass Pulse",
    engine: "fm",
    params: {
      harmonicity: 2.25,
      modulationIndex: 8.5,
      envelope: { attack: 0.004, decay: 0.18, sustain: 0.12, release: 0.55 },
    },
  },

  ionChime: {
    id: "ionChime",
    label: "Ion Chime",
    engine: "fm",
    params: {
      harmonicity: 4.25,
      modulationIndex: 13,
      envelope: { attack: 0.002, decay: 0.12, sustain: 0.08, release: 0.85 },
    },
  },

  cedarPluck: {
    id: "cedarPluck",
    label: "Cedar Pluck",
    engine: "am",
    params: {
      harmonicity: 1.0,
      envelope: { attack: 0.01, decay: 0.22, sustain: 0.15, release: 0.7 },
    },
  },

  lacquerLead: {
    id: "lacquerLead",
    label: "Lacquer Lead",
    engine: "synth",
    params: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.02, decay: 0.18, sustain: 0.25, release: 0.65 },
      filter: { type: "lowpass", frequency: 3400, Q: 0.85 },
    },
  },

  // ============================================================
  // FAMILY 3: TEXTURE / NOISE-LIKE AIR (movement + shimmer)
  // ============================================================
  whisperAir: {
    id: "whisperAir",
    label: "Whisper Air",
    engine: "synth",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.9, decay: 0.5, sustain: 0.35, release: 2.2 },
      filter: { type: "lowpass", frequency: 1800, Q: 0.6 },
    },
  },

  hazeFlute: {
    id: "hazeFlute",
    label: "Haze Flute",
    engine: "synth",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.35, decay: 0.4, sustain: 0.45, release: 1.9 },
      filter: { type: "bandpass", frequency: 1400, Q: 0.9 },
    },
  },

  shimmerVeil: {
    id: "shimmerVeil",
    label: "Shimmer Veil",
    engine: "am",
    params: {
      harmonicity: 2.0,
      envelope: { attack: 0.18, decay: 0.5, sustain: 0.35, release: 1.8 },
    },
  },

  starlightMetal: {
    id: "starlightMetal",
    label: "Starlight Metal",
    engine: "metal",
    params: {
      frequency: 240,
      envelope: { attack: 0.001, decay: 0.7, release: 0.3 },
      harmonicity: 5.2,
      modulationIndex: 18,
      resonance: 3800,
      octaves: 2.1,
    },
  },

  cometSpray: {
    id: "cometSpray",
    label: "Comet Spray",
    engine: "metal",
    params: {
      frequency: 320,
      envelope: { attack: 0.001, decay: 0.45, release: 0.25 },
      harmonicity: 7.1,
      modulationIndex: 22,
      resonance: 4200,
      octaves: 1.8,
    },
  },

  // ============================================================
  // FAMILY 4: GRAVITY / LOW ENERGY (weight + tension)
  // ============================================================
  umbraDrone: {
    id: "umbraDrone",
    label: "Umbra Drone",
    engine: "mono",
    params: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.35, decay: 0.4, sustain: 0.7, release: 2.8 },
      filter: { type: "lowpass", frequency: 520, Q: 0.85 },
      filterEnvelope: {
        attack: 0.15,
        decay: 0.4,
        sustain: 0.4,
        release: 1.2,
        baseFrequency: 70,
        octaves: 1.6,
      },
    },
  },

  ironSub: {
    id: "ironSub",
    label: "Iron Sub",
    engine: "mono",
    params: {
      oscillator: { type: "square" },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0.55, release: 1.9 },
      filter: { type: "lowpass", frequency: 420, Q: 0.95 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.22,
        sustain: 0.25,
        release: 0.7,
        baseFrequency: 55,
        octaves: 1.2,
      },
    },
  },

  // ============================================================
  // FAMILY 5: EVOLVING / CINEMATIC (alive + wide)
  // ============================================================
  haloPad: {
    id: "haloPad",
    label: "Halo Pad",
    engine: "synth",
    params: {
      oscillator: { type: "sine" },
      envelope: { attack: 1.2, decay: 0.6, sustain: 0.82, release: 2.6 },
      filter: { type: "lowpass", frequency: 5200, Q: 0.55 },
    },
  },

  duskPad: {
    id: "duskPad",
    label: "Dusk Pad",
    engine: "synth",
    params: {
      oscillator: { type: "triangle" },
      envelope: { attack: 1.6, decay: 0.8, sustain: 0.75, release: 3.4 },
      filter: { type: "lowpass", frequency: 2600, Q: 0.75 },
    },
  },

  auroraSweep: {
    id: "auroraSweep",
    label: "Aurora Sweep",
    engine: "synth",
    params: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.7, decay: 0.8, sustain: 0.6, release: 2.9 },
      filter: { type: "lowpass", frequency: 2200, Q: 0.65 },
    },
  },

  lunarChoir: {
    id: "lunarChoir",
    label: "Lunar Choir",
    engine: "am",
    params: {
      harmonicity: 1.25,
      envelope: { attack: 0.55, decay: 0.7, sustain: 0.55, release: 2.6 },
    },
  },
};