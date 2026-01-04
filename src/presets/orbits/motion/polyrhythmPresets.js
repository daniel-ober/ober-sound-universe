// src/presets/orbits/motion/polyrhythmPresets.js

/**
 * POLYRHYTHM PRESETS
 * ------------------
 * Central library of time signatures / cycle shapes for Orbit motion.
 *
 * Required by your scene resolver:
 * - ORBIT scenes store: motion.polyrhythmPresetId
 * - App resolves -> layer.timeSig (string)
 *
 * Notes:
 * - "steps" is often used by engines as the cycle length (numerator).
 * - You can extend these later with swing/accents/step masks per preset.
 */

function make(id, timeSig, label, tags = []) {
  const [stepsRaw, denomRaw] = String(timeSig).split("/");
  const steps = Number(stepsRaw);
  const denom = Number(denomRaw);

  return {
    id,
    timeSig,
    label: label || timeSig,
    steps: Number.isFinite(steps) ? steps : null,
    denom: Number.isFinite(denom) ? denom : null,
    tags,
  };
}

export const POLYRHYTHM_PRESETS = {
  // ---- quarters ----
  "2_4": make("2_4", "2/4", "2/4", ["straight"]),
  "3_4": make("3_4", "3/4", "3/4", ["waltz"]),
  "4_4": make("4_4", "4/4", "4/4", ["straight"]),
  "5_4": make("5_4", "5/4", "5/4", ["odd"]),
  "6_4": make("6_4", "6/4", "6/4", ["odd"]),
  "7_4": make("7_4", "7/4", "7/4", ["odd"]),
  "9_4": make("9_4", "9/4", "9/4", ["odd"]),

  // ---- eighths ----
  "3_8": make("3_8", "3/8", "3/8", ["fast"]),
  "5_8": make("5_8", "5/8", "5/8", ["odd"]),
  "6_8": make("6_8", "6/8", "6/8", ["compound"]),
  "7_8": make("7_8", "7/8", "7/8", ["odd"]),
  "9_8": make("9_8", "9/8", "9/8", ["compound", "odd"]),
  "11_8": make("11_8", "11/8", "11/8", ["odd"]),
  "12_8": make("12_8", "12/8", "12/8", ["compound"]),

  // ---- sixteenths ----
  "3_16": make("3_16", "3/16", "3/16", ["micro"]),
  "5_16": make("5_16", "5/16", "5/16", ["micro", "odd"]),
  "7_16": make("7_16", "7/16", "7/16", ["micro", "odd"]),
  "9_16": make("9_16", "9/16", "9/16", ["micro", "odd"]),
  "11_16": make("11_16", "11/16", "11/16", ["micro", "odd"]),
  "13_16": make("13_16", "13/16", "13/16", ["micro", "odd"]),
  "15_16": make("15_16", "15/16", "15/16", ["micro", "odd"]),
  "17_16": make("17_16", "17/16", "17/16", ["micro", "odd"]),
  "19_16": make("19_16", "19/16", "19/16", ["micro", "odd"]),
};

// Convenience list for dropdowns, etc.
export const POLYRHYTHM_PRESET_LIST = Object.values(POLYRHYTHM_PRESETS);