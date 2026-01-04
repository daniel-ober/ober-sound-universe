// src/presets/orbits/motion/arpPresets.js

/**
 * ARP PRESETS
 * -----------
 * Central library of arp "behaviors" that Orbit scenes reference by ID.
 *
 * The engine/UI can still ultimately use a string mode (e.g. "upDown"),
 * but scenes should reference *these IDs* so you can evolve behavior
 * without rewriting every scene.
 *
 * Required by your scene resolver:
 * - ORBIT scenes store: motion.arpPresetId
 * - App resolves -> layer.arp (string) + optional defaults
 */

export const ARP_PRESETS = {
  off: {
    id: "off",
    label: "Off",
    mode: "off",
    description: "No arp movement.",
  },

  up: {
    id: "up",
    label: "Up",
    mode: "up",
    description: "Ascending arp pattern.",
  },

  down: {
    id: "down",
    label: "Down",
    mode: "down",
    description: "Descending arp pattern.",
  },

  upDown: {
    id: "upDown",
    label: "Up / Down",
    mode: "upDown",
    description: "Up then down (bounce).",
  },

  downUp: {
    id: "downUp",
    label: "Down / Up",
    mode: "downUp",
    description: "Down then up (bounce).",
  },

  random: {
    id: "random",
    label: "Random",
    mode: "random",
    description: "Randomized step order.",
  },

  // ---- "feel" arps (still map to string modes for engine simplicity) ----

  drone: {
    id: "drone",
    label: "Drone",
    mode: "drone",
    description: "Sustained / minimal movement feel (engine interprets).",
    defaults: { rate: "1n" },
  },

  pulse: {
    id: "pulse",
    label: "Pulse",
    mode: "pulse",
    description: "Rhythmic pulsing movement (engine interprets).",
    defaults: { rate: "16n" },
  },

  shimmer: {
    id: "shimmer",
    label: "Shimmer",
    mode: "shimmer",
    description: "Soft sparkling motion (engine interprets).",
    defaults: { rate: "2n" },
  },

  steps: {
    id: "steps",
    label: "Steps",
    mode: "steps",
    description: "Tight stepped motion (engine interprets).",
    defaults: { rate: "16n" },
  },
};

// Convenience list for dropdowns, etc.
export const ARP_PRESET_LIST = Object.values(ARP_PRESETS);