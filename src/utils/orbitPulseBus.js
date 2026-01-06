// src/utils/orbitPulseBus.js

/**
 * orbitPulseBus
 * -------------
 * Tiny event bus for orbit timing visuals.
 *
 * Engine emits:
 *  - { type: "orbitRevolution", orbitId: "orbitA"|"orbitB"|"orbitC", t?: number }
 *  - { type: "allResolve", t?: number }
 *
 * UI subscribes and triggers CSS animation classes.
 */

const listeners = new Set();

export function emitOrbitPulse(evt) {
  for (const fn of listeners) {
    try {
      fn(evt);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[orbitPulseBus] listener error:", e);
    }
  }
}

export function onOrbitPulse(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}