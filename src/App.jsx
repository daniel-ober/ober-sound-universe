// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { omseEngine } from "./engine/omseEngine";

import { TopBar } from "./components/TopBar";
import { UniverseLayout } from "./components/UniverseLayout";
import { MasterSpectrum } from "./components/MasterSpectrum";

import { MASTER_PRESETS } from "./presets/master/masterPresets";
import { ORBIT_MASTER_PRESETS } from "./presets/orbits/orbitMasterPresets";
import { ORBIT_VOICE_PRESETS } from "./presets/orbits/orbitVoicePresets";

import { ARP_PRESETS } from "./presets/orbits/motion/arpPresets";
import { POLYRHYTHM_PRESETS } from "./presets/orbits/motion/polyrhythmPresets";

import { getCorePresetTriplet } from "./presets/core/coreLayerPresets";

import "./App.css";

const galaxy0 = MASTER_PRESETS.galaxy0;
const MASTER_CYCLE_MEASURES = 1;

// ✅ Keyboard row support: AWSEDFTGYHUJKOL
// ✅ FIX: Start at C3 so it matches your sampler's C3–B3 sample set.
const KEY_TO_NOTE_BASE = {
  a: "C3",
  w: "C#3",
  s: "D3",
  e: "D#3",
  d: "E3",
  f: "F3",
  t: "F#3",
  g: "G3",
  y: "G#3",
  h: "A3",
  u: "A#3",
  j: "B3",
  k: "C4",
  o: "C#4",
  l: "D4",
};

function getOrbitSceneById(id) {
  return ORBIT_MASTER_PRESETS.find((p) => p.id === id) || null;
}

function clampBpm(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 90;
  return Math.max(20, Math.min(300, n));
}

function resolveOrbitMotion(motion = {}) {
  const timeSig =
    (motion.polyrhythmPresetId &&
      POLYRHYTHM_PRESETS?.[motion.polyrhythmPresetId]?.timeSig) ||
    motion.timeSig ||
    "4/4";

  const arpPreset = motion.arpPresetId ? ARP_PRESETS?.[motion.arpPresetId] : null;

  let arp = (arpPreset?.mode || motion.arp || "off")?.toString?.() || "off";

  const engineSafe = new Set(["off", "up", "down", "upDown", "downUp", "random"]);
  if (!engineSafe.has(arp)) {
    if (motion.arpPresetId === "drone") arp = "upDown";
    else if (motion.arpPresetId === "pulse") arp = "upDown";
    else if (motion.arpPresetId === "shimmer") arp = "random";
    else if (motion.arpPresetId === "steps") arp = "up";
    else arp = "upDown";
  }

  const rate = motion.rate || arpPreset?.defaults?.rate || "8n";
  const patternOn = typeof motion.patternOn === "boolean" ? motion.patternOn : false;

  return { timeSig, arp, rate, patternOn };
}

function sceneToOrbitState(scene) {
  const fallback = {
    orbitA: {
      gain: 0,
      pan: 0,
      muted: false,
      timeSig: "4/4",
      arp: "off",
      rate: "8n",
      enabled: true,
      voicePresetId: null,
    },
    orbitB: {
      gain: 0,
      pan: 0,
      muted: false,
      timeSig: "4/4",
      arp: "off",
      rate: "8n",
      enabled: true,
      voicePresetId: null,
    },
    orbitC: {
      gain: 0,
      pan: 0,
      muted: false,
      timeSig: "4/4",
      arp: "off",
      rate: "8n",
      enabled: true,
      voicePresetId: null,
    },
  };

  if (!scene?.orbits) {
    return {
      orbitLayers: fallback,
      orbitPatterns: { orbitA: false, orbitB: false, orbitC: false },
    };
  }

  const orbitLayers = {};
  const orbitPatterns = {};

  ["orbitA", "orbitB", "orbitC"].forEach((id) => {
    const cfg = scene.orbits?.[id];

    if (!cfg) {
      orbitLayers[id] = fallback[id];
      orbitPatterns[id] = false;
      return;
    }

    const resolved = resolveOrbitMotion(cfg.motion || {});

    orbitLayers[id] = {
      gain: Math.round((cfg.mix?.gain ?? 0.6) * 100),
      pan: cfg.mix?.pan ?? 0,
      muted: !!cfg.mix?.muted,
      timeSig: resolved.timeSig,
      arp: resolved.arp,
      rate: resolved.rate,
      enabled: typeof cfg.enabled === "boolean" ? cfg.enabled : true,
      voicePresetId: cfg.voicePresetId || null, // ✅ scene default
    };

    orbitPatterns[id] = !!resolved.patternOn;
  });

  return { orbitLayers, orbitPatterns };
}

function normalizeCore(core) {
  const src = core || {};
  const atmosVal = src.atmosphere ?? src.atmos ?? { gain: 0, muted: false };

  return {
    ground: src.ground ?? { gain: 0, muted: false },
    harmony: src.harmony ?? { gain: 0, muted: false },
    atmosphere: atmosVal,
  };
}

function clampInt(n, min, max) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function transposeNoteByOctaves(note, octaves) {
  const m = String(note).match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!m) return note;

  const letter = m[1].toUpperCase();
  const accidental = m[2] || "";
  const octave = parseInt(m[3], 10);

  const nextOct = octave + octaves;
  return `${letter}${accidental}${nextOct}`;
}

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [isPowered, setIsPowered] = useState(false);
  const engineLive = Boolean(isPowered && audioReady);

  const activeCoreNotesRef = useRef(new Set());

  const [masterBpm, setMasterBpm] = useState(90);
  const [masterTimeSig, setMasterTimeSig] = useState("4/4");
  const [masterSigLocked, setMasterSigLocked] = useState(true);

  const [activePreset, setActivePreset] = useState(
    galaxy0.defaultPresetId ?? "presetA"
  );

  const activePresetConfig = galaxy0.presets[activePreset];
  const bannerUrl = activePresetConfig?.banner ?? null;

  const initialOrbitSceneId =
    activePresetConfig?.orbitSceneId || ORBIT_MASTER_PRESETS?.[0]?.id || "";
  const [orbitSceneId, setOrbitSceneId] = useState(initialOrbitSceneId);

  const orbitSceneOptions = useMemo(() => {
    return (ORBIT_MASTER_PRESETS || []).map((p) => {
      const aMotion = p?.orbits?.orbitA?.motion || {};
      const resolved = resolveOrbitMotion(aMotion);
      return {
        id: p.id,
        label: p.label,
        sig: resolved.timeSig || "",
        subtitle: p.description || "",
      };
    });
  }, []);

  // ✅ build orbit voice preset dropdown options
  const orbitVoiceOptions = useMemo(() => {
    const src = ORBIT_VOICE_PRESETS || {};
    return Object.keys(src).map((id) => {
      const p = src[id] || {};
      return { id, label: p.label || id };
    });
  }, []);

  const [coreLayers, setCoreLayers] = useState(() =>
    normalizeCore(activePresetConfig?.core)
  );

  const initialScene = getOrbitSceneById(initialOrbitSceneId);
  const initialOrbitState = sceneToOrbitState(initialScene);

  const [orbitLayers, setOrbitLayers] = useState(initialOrbitState.orbitLayers);
  const [orbitPatterns, setOrbitPatterns] = useState(
    initialOrbitState.orbitPatterns
  );

  const [octaveShift, setOctaveShift] = useState(0);
  const octaveShiftRef = useRef(0);
  useEffect(() => {
    octaveShiftRef.current = octaveShift;
  }, [octaveShift]);

  // ==========================
  // ✅ CORE PRESET OPTIONS (per-layer)
  // ==========================
  const corePresetOptionsByLayer = useMemo(() => {
    const options = { ground: [], harmony: [], atmosphere: [] };

    const all = galaxy0?.presets || {};
    const ids = Object.keys(all);

    for (const masterId of ids) {
      const cfg = all[masterId];
      const label = cfg?.label || cfg?.name || cfg?.title || masterId;

      const tripletId = cfg?.coreLayerPresetId || null;
      const triplet = tripletId ? getCorePresetTriplet(tripletId) : null;
      if (!triplet) continue;

      if (triplet.ground) {
        options.ground.push({ id: masterId, label, preset: triplet.ground });
      }
      if (triplet.harmony) {
        options.harmony.push({ id: masterId, label, preset: triplet.harmony });
      }
      if (triplet.atmosphere) {
        options.atmosphere.push({
          id: masterId,
          label,
          preset: triplet.atmosphere,
        });
      }
    }

    // keep stable sort by label
    Object.keys(options).forEach((k) => {
      options[k].sort((a, b) => String(a.label).localeCompare(String(b.label)));
    });

    return options;
  }, []);

  // Which MASTER preset is currently “feeding” each core layer (for the dropdown selection)
  const [coreLayerSourceMasterId, setCoreLayerSourceMasterId] = useState(() => {
    // default: current active master preset drives all 3 layers (matches your triplet logic)
    return {
      ground: activePreset,
      harmony: activePreset,
      atmosphere: activePreset,
    };
  });

  // Keep defaults in sync when you apply a new master preset
  useEffect(() => {
    setCoreLayerSourceMasterId({
      ground: activePreset,
      harmony: activePreset,
      atmosphere: activePreset,
    });
  }, [activePreset]);

  // ==========================
  // APPLY TO ENGINE (NO REBUILD)
  // ==========================
  const applyCoreLayerToEngine = (layerId, layer) => {
    if (!engineLive) return;

    // 🔥 IMPORTANT: pass raw (0..1 or 0..100) and let the engine normalize
    omseEngine.setCoreLayerGain(layerId, layer.gain ?? 0);
    omseEngine.setCoreLayerMute(layerId, !!layer.muted);
  };

  const applyOrbitMixToEngine = (orbitId, layer) => {
    if (!engineLive) return;
    omseEngine.setOrbitEnabled(orbitId, layer.enabled !== false);

    // pass raw; engine handles 0..1 or 0..100
    omseEngine.setOrbitGain(orbitId, layer.gain ?? 0);

    omseEngine.setOrbitMute(orbitId, !!layer.muted);
    omseEngine.setOrbitPan(orbitId, layer.pan ?? 0);
  };

  const applyOrbitMotionToEngine = (orbitId, layer) => {
    if (!engineLive) return;
    omseEngine.setOrbitTimeSig(orbitId, layer.timeSig || "4/4");
    omseEngine.setOrbitArp(orbitId, layer.arp || "off");
    omseEngine.setOrbitRate(orbitId, layer.rate || "8n");
  };

  const applyOrbitVoiceToEngine = (orbitId, layer) => {
    if (!engineLive) return;
    const presetId = layer?.voicePresetId || null;

    if (!presetId) return; // "Default" => leave whatever is currently loaded
    const preset = ORBIT_VOICE_PRESETS?.[presetId] || null;
    if (!preset) {
      console.warn(`[App] Unknown orbit voicePresetId "${presetId}" for ${orbitId}`);
      return;
    }

    if (typeof omseEngine.setOrbitVoicePreset === "function") {
      omseEngine.setOrbitVoicePreset(orbitId, preset);
    }
  };

  const warnedPatternFnRef = useRef(false);
  const setOrbitPatternStateSafe = (orbitId, isOn) => {
    const v = !!isOn;

    if (typeof omseEngine.setOrbitPatternState === "function") {
      omseEngine.setOrbitPatternState(orbitId, v);
      return;
    }
    if (typeof omseEngine.setOrbitPattern === "function") {
      omseEngine.setOrbitPattern(orbitId, v);
      return;
    }
    if (typeof omseEngine.setOrbitPatternEnabled === "function") {
      omseEngine.setOrbitPatternEnabled(orbitId, v);
      return;
    }
    if (typeof omseEngine.setOrbitPatternOn === "function") {
      omseEngine.setOrbitPatternOn(orbitId, v);
      return;
    }

    if (!warnedPatternFnRef.current) {
      warnedPatternFnRef.current = true;
      console.warn(
        "[OMSE] No orbit-pattern setter found on engine. Expected one of: setOrbitPatternState | setOrbitPattern | setOrbitPatternEnabled | setOrbitPatternOn"
      );
    }
  };

  const panicAllNotesOff = () => {
    if (!audioReady) return;

    try {
      const notes = Array.from(activeCoreNotesRef.current || []);
      notes.forEach((note) => {
        try {
          omseEngine.noteOff("core", note);
        } catch {
          // ignore
        }
      });
    } finally {
      activeCoreNotesRef.current.clear();
    }
  };

  const silenceEngine = () => {
    if (!audioReady) return;

    panicAllNotesOff();

    Object.keys(orbitPatterns || {}).forEach((orbitId) => {
      setOrbitPatternStateSafe(orbitId, false);
    });

    Object.keys(orbitLayers || {}).forEach((orbitId) => {
      omseEngine.setOrbitMute(orbitId, true);
    });

    Object.keys(coreLayers || {}).forEach((layerId) => {
      omseEngine.setCoreLayerMute(layerId, true);
    });
  };

  const reapplyStateToEngine = () => {
    if (!engineLive) return;

    omseEngine.setMasterBpm(masterBpm);
    omseEngine.setMasterCycleMeasures(MASTER_CYCLE_MEASURES);
    omseEngine.setMasterTimeSig(masterTimeSig);

    Object.entries(coreLayers || {}).forEach(([layerId, layer]) => {
      applyCoreLayerToEngine(layerId, layer);
    });

    Object.entries(orbitLayers || {}).forEach(([orbitId, layer]) => {
      applyOrbitMixToEngine(orbitId, layer);
      applyOrbitMotionToEngine(orbitId, layer);
      applyOrbitVoiceToEngine(orbitId, layer);
    });

    Object.entries(orbitPatterns || {}).forEach(([orbitId, isOn]) => {
      setOrbitPatternStateSafe(orbitId, !!isOn);
    });
  };

  useEffect(() => {
    if (!audioReady) return;

    if (isPowered) reapplyStateToEngine();
    else silenceEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPowered, audioReady]);

  useEffect(() => {
    if (!engineLive) return;
    Object.entries(orbitPatterns || {}).forEach(([orbitId, isOn]) => {
      setOrbitPatternStateSafe(orbitId, !!isOn);
    });
  }, [engineLive, orbitPatterns]);

  useEffect(() => {
    const downKeys = new Set();

    const handleKeyDown = (e) => {
      if (!engineLive) return;

      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable)
        return;

      const key = e.key.toLowerCase();

      if (key === "z") {
        if (downKeys.has("z")) return;
        downKeys.add("z");
        setOctaveShift((prev) => clampInt(prev - 1, -3, 3));
        return;
      }
      if (key === "x") {
        if (downKeys.has("x")) return;
        downKeys.add("x");
        setOctaveShift((prev) => clampInt(prev + 1, -3, 3));
        return;
      }

      const base = KEY_TO_NOTE_BASE[key];
      if (!base) return;
      if (downKeys.has(key)) return;

      downKeys.add(key);

      const shifted = transposeNoteByOctaves(base, octaveShiftRef.current);
      activeCoreNotesRef.current.add(shifted);

      omseEngine.noteOn("core", shifted);
    };

    const handleKeyUp = (e) => {
      if (!engineLive) return;

      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable)
        return;

      const key = e.key.toLowerCase();

      if (key === "z" || key === "x") {
        downKeys.delete(key);
        return;
      }

      const base = KEY_TO_NOTE_BASE[key];
      if (!base) return;

      downKeys.delete(key);

      const tryNotes = [
        transposeNoteByOctaves(base, octaveShiftRef.current),
        transposeNoteByOctaves(base, octaveShiftRef.current - 1),
        transposeNoteByOctaves(base, octaveShiftRef.current + 1),
        transposeNoteByOctaves(base, octaveShiftRef.current - 2),
        transposeNoteByOctaves(base, octaveShiftRef.current + 2),
        transposeNoteByOctaves(base, octaveShiftRef.current - 3),
        transposeNoteByOctaves(base, octaveShiftRef.current + 3),
      ];

      const set = activeCoreNotesRef.current;
      let found = null;
      for (const n of tryNotes) {
        if (set.has(n)) {
          found = n;
          break;
        }
      }

      const noteToRelease = found || tryNotes[0];

      set.delete(noteToRelease);
      omseEngine.noteOff("core", noteToRelease);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      downKeys.clear();
    };
  }, [engineLive]);

  const handleMasterTempoChange = (nextBpm) => {
    const v = clampBpm(nextBpm);
    setMasterBpm(v);
    if (engineLive) omseEngine.setMasterBpm(v);
  };

  const handleMasterTimeSigChange = (nextSig) => {
    setMasterTimeSig(nextSig);
    if (engineLive) omseEngine.setMasterTimeSig(nextSig);
  };

  const handleResetMasterTimeSig = () => {
    setMasterSigLocked(true);
    setMasterTimeSig("4/4");
    if (engineLive) omseEngine.resetMasterToFourFour();
  };

  const applyCoreTripletForPreset = async (presetConfig) => {
    const tripletId = presetConfig?.coreLayerPresetId || null;
    const resolved = tripletId ? getCorePresetTriplet(tripletId) : null;
    if (!resolved) return;

    if (resolved.ground)
      await omseEngine.setCoreLayerPreset("ground", resolved.ground);
    else console.warn("[OMSE] Missing ground preset for triplet:", tripletId);

    if (resolved.harmony)
      await omseEngine.setCoreLayerPreset("harmony", resolved.harmony);
    else console.warn("[OMSE] Missing harmony preset for triplet:", tripletId);

    if (resolved.atmosphere)
      await omseEngine.setCoreLayerPreset("atmosphere", resolved.atmosphere);
    else console.warn("[OMSE] Missing atmosphere preset for triplet:", tripletId);
  };

  const handleInitIfNeeded = async () => {
    if (audioReady) return;

    await omseEngine.startAudioContext();
    setAudioReady(true);

    omseEngine.setMasterBpm(masterBpm);
    omseEngine.setMasterCycleMeasures(MASTER_CYCLE_MEASURES);
    omseEngine.setMasterTimeSig(masterTimeSig);

    await applyCoreTripletForPreset(activePresetConfig);

    const core = normalizeCore(activePresetConfig?.core);
    setCoreLayers(core);
    Object.entries(core).forEach(([layerId, layer]) => {
      omseEngine.setCoreLayerGain(layerId, layer.gain ?? 0);
      omseEngine.setCoreLayerMute(layerId, !!layer.muted);
    });

    const scene =
      getOrbitSceneById(orbitSceneId) || getOrbitSceneById(initialOrbitSceneId);

    if (scene) {
      const nextOrbitState = sceneToOrbitState(scene);

      setOrbitLayers(nextOrbitState.orbitLayers);
      setOrbitPatterns(nextOrbitState.orbitPatterns);

      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitMixToEngine(orbitId, layer);
        applyOrbitMotionToEngine(orbitId, layer);
        applyOrbitVoiceToEngine(orbitId, layer);
      });

      Object.entries(nextOrbitState.orbitPatterns || {}).forEach(([oid, isOn]) =>
        setOrbitPatternStateSafe(oid, !!isOn)
      );
    }
  };

  const handleTogglePower = async () => {
    if (!isPowered) {
      await handleInitIfNeeded();
      setIsPowered(true);
      return;
    }

    panicAllNotesOff();
    setIsPowered(false);
  };

  const handleApplyPreset = async (presetId) => {
    const preset = galaxy0.presets[presetId];
    if (!preset) return;

    setActivePreset(presetId);

    const nextCore = normalizeCore(preset.core);
    setCoreLayers(nextCore);

    // default: new master preset becomes the “source” for all core layers
    setCoreLayerSourceMasterId({
      ground: presetId,
      harmony: presetId,
      atmosphere: presetId,
    });

    const nextSceneId = preset.orbitSceneId || ORBIT_MASTER_PRESETS?.[0]?.id || "";
    setOrbitSceneId(nextSceneId);

    const scene = getOrbitSceneById(nextSceneId);
    const nextOrbitState = sceneToOrbitState(scene);

    setOrbitLayers(nextOrbitState.orbitLayers);
    setOrbitPatterns(nextOrbitState.orbitPatterns);

    if (audioReady) {
      await applyCoreTripletForPreset(preset);
    }

    if (engineLive) {
      Object.entries(nextCore).forEach(([layerId, layer]) => {
        applyCoreLayerToEngine(layerId, layer);
      });

      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitMixToEngine(orbitId, layer);
        applyOrbitMotionToEngine(orbitId, layer);
        applyOrbitVoiceToEngine(orbitId, layer);
      });

      Object.entries(nextOrbitState.orbitPatterns || {}).forEach(([oid, isOn]) =>
        setOrbitPatternStateSafe(oid, !!isOn)
      );
    }
  };

  const handleOrbitSceneChange = (nextId) => {
    setOrbitSceneId(nextId);
    const scene = getOrbitSceneById(nextId);

    const nextOrbitState = sceneToOrbitState(scene);
    setOrbitLayers(nextOrbitState.orbitLayers);
    setOrbitPatterns(nextOrbitState.orbitPatterns);

    if (engineLive && scene) {
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitMixToEngine(orbitId, layer);
        applyOrbitMotionToEngine(orbitId, layer);
        applyOrbitVoiceToEngine(orbitId, layer);
      });

      Object.entries(nextOrbitState.orbitPatterns || {}).forEach(([oid, isOn]) =>
        setOrbitPatternStateSafe(oid, !!isOn)
      );
    }
  };

  // ✅ Core mix handlers (values remain 0..100 in state)
  const handleLayerGainChange = (layerId, newPercent) => {
    setCoreLayers((prev) => {
      const nextLayer = { ...(prev[layerId] || {}), gain: newPercent };
      const next = { ...prev, [layerId]: nextLayer };
      applyCoreLayerToEngine(layerId, nextLayer);
      return next;
    });
  };

  const handleLayerMuteToggle = (layerId) => {
    setCoreLayers((prev) => {
      const cur = prev[layerId] || { gain: 0, muted: false };
      const nextLayer = { ...cur, muted: !cur.muted };
      const next = { ...prev, [layerId]: nextLayer };
      applyCoreLayerToEngine(layerId, nextLayer);
      return next;
    });
  };

  // ✅ NEW: per-layer core preset swap from dropdown (master preset = label source)
  const handleCoreLayerPresetChange = async (layerId, masterPresetId) => {
    const options = corePresetOptionsByLayer?.[layerId] || [];
    const picked = options.find((o) => o.id === masterPresetId) || null;
    if (!picked?.preset) return;

    setCoreLayerSourceMasterId((prev) => ({ ...prev, [layerId]: masterPresetId }));

    if (!audioReady) return;
    await omseEngine.setCoreLayerPreset(layerId, picked.preset);
  };

  const baseOrbitFallback = {
    gain: 0,
    pan: 0,
    muted: false,
    timeSig: "4/4",
    arp: "off",
    rate: "8n",
    enabled: true,
    voicePresetId: null,
  };

  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, gain: newPercent };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitMixToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitMuteToggle = (orbitId) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, muted: !cur.muted };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitMixToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitPanChange = (orbitId, newPan) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, pan: newPan };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitMixToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitTimeSigChange = (orbitId, nextSig) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, timeSig: nextSig };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitMotionToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitArpChange = (orbitId, nextArp) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, arp: nextArp };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitMotionToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitEnabledChange = (orbitId, enabled) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, enabled };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitMixToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitVoicePresetChange = (orbitId, voicePresetId) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, voicePresetId: voicePresetId || null };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitVoiceToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitPatternToggle = (orbitId) => {
    if (!engineLive) return;
    setOrbitPatterns((prev) => ({ ...prev, [orbitId]: !prev?.[orbitId] }));
  };

  return (
    <div className="app-root">
      <div className="instrument-frame skin-image">
        <div className="instrument-inner">
          <div className="instrument-grid">
            <div className="instrument-row-top">
              <div className="console-stack">
                <TopBar
                  isPowered={isPowered}
                  onTogglePower={handleTogglePower}
                  audioReady={audioReady}
                  activePreset={activePreset}
                  onSelectPreset={handleApplyPreset}
                  masterBpm={masterBpm}
                  onMasterTempoChange={handleMasterTempoChange}
                  masterTimeSig={masterTimeSig}
                  onMasterTimeSigChange={handleMasterTimeSigChange}
                  masterSigLocked={masterSigLocked}
                  onToggleMasterSigLocked={() => setMasterSigLocked((v) => !v)}
                  onResetMasterTimeSig={handleResetMasterTimeSig}
                />
              </div>
            </div>

            <section className="instrument-row-spectrum">
              <section className="gravity-spectrum-shell">
                <div className="gravity-spectrum-inner">
                  <div className="gravity-spectrum-header">
                    <span>Galaxy 0 · Output</span>
                    <span style={{ opacity: 0.75, fontSize: 12 }}>
                      Octave: {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}{" "}
                      (Z / X)
                    </span>
                  </div>

                  <div className="gravity-spectrum-rail">
                    <MasterSpectrum audioReady={engineLive} />
                  </div>

                  <div className="gravity-spectrum-tag">Gravity Spectrum</div>
                </div>
              </section>
            </section>

            <div className="instrument-row-main">
              <UniverseLayout
                audioReady={engineLive}
                coreLayers={coreLayers}
                onLayerGainChange={handleLayerGainChange}
                onLayerMuteToggle={handleLayerMuteToggle}
                // ✅ NEW: core preset dropdowns
                corePresetOptionsByLayer={corePresetOptionsByLayer}
                coreLayerSourceMasterId={coreLayerSourceMasterId}
                onCoreLayerPresetChange={handleCoreLayerPresetChange}
                // Orbits
                orbitLayers={orbitLayers}
                orbitPatterns={orbitPatterns}
                orbitSceneId={orbitSceneId}
                orbitSceneOptions={orbitSceneOptions}
                onOrbitSceneChange={handleOrbitSceneChange}
                onOrbitGainChange={handleOrbitGainChange}
                onOrbitMuteToggle={handleOrbitMuteToggle}
                onOrbitPatternToggle={handleOrbitPatternToggle}
                onOrbitPanChange={handleOrbitPanChange}
                onOrbitTimeSigChange={handleOrbitTimeSigChange}
                onOrbitArpChange={handleOrbitArpChange}
                onOrbitEnabledChange={handleOrbitEnabledChange}
                orbitVoiceOptions={orbitVoiceOptions}
                onOrbitVoicePresetChange={handleOrbitVoicePresetChange}
                bannerUrl={bannerUrl}
              />
            </div>

            <section className="instrument-row-bottom">{/* future row */}</section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;