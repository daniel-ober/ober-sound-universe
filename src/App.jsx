// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { omseEngine } from "./engine/omseEngine";

import { TopBar } from "./components/TopBar";
import { UniverseLayout } from "./components/UniverseLayout";
import { MasterSpectrum } from "./components/MasterSpectrum";

import { MASTER_PRESETS } from "./presets/masterPresets";
import { ORBIT_MASTER_PRESETS } from "./presets/orbits/orbitMasterPresets";
import { ORBIT_VOICE_PRESETS } from "./presets/orbits/orbitVoicePresets";

import "./App.css";

const galaxy0 = MASTER_PRESETS.galaxy0;

// ✅ Cycle stays supported by engine, but not exposed in TopBar UI
const MASTER_CYCLE_MEASURES = 1;

const KEY_TO_NOTE = {
  a: "C4",
  s: "D4",
  d: "E4",
  f: "F4",
  g: "G4",
  h: "A4",
  j: "B4",
  k: "C5",
};

function getOrbitSceneById(id) {
  return ORBIT_MASTER_PRESETS.find((p) => p.id === id) || null;
}

function clampBpm(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 90;
  return Math.max(20, Math.min(300, n));
}

/**
 * Convert an Orbit Master Preset scene -> UI state
 */
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

    orbitLayers[id] = {
      gain: Math.round((cfg.mix?.gain ?? 0.6) * 100),
      pan: cfg.mix?.pan ?? 0,
      muted: !!cfg.mix?.muted,
      timeSig: cfg.motion?.timeSig || "4/4",
      arp: cfg.motion?.arp || "off",
      rate: cfg.motion?.rate || "8n",
      enabled: typeof cfg.enabled === "boolean" ? cfg.enabled : true,
      voicePresetId: cfg.voicePresetId || null,
    };

    orbitPatterns[id] = !!cfg.motion?.patternOn;
  });

  return { orbitLayers, orbitPatterns };
}

/**
 * Normalize core layer ids:
 * - older: "atmos"
 * - current engine/UI: "atmosphere"
 */
function normalizeCore(core) {
  const src = core || {};
  const atmosVal = src.atmosphere ?? src.atmos ?? { gain: 0, muted: false };

  return {
    ground: src.ground ?? { gain: 0, muted: false },
    harmony: src.harmony ?? { gain: 0, muted: false },
    atmosphere: atmosVal,
  };
}

function App() {
  // Audio init happens once; Power toggles “instrument live”
  const [audioReady, setAudioReady] = useState(false);
  const [isPowered, setIsPowered] = useState(false);
  const engineLive = Boolean(isPowered && audioReady);

  // Track any currently-held core notes so we can "panic" on power-off.
  const activeCoreNotesRef = useRef(new Set());

  // -------------------------------
  // MASTER CLOCK UI STATE
  // -------------------------------
  const [masterBpm, setMasterBpm] = useState(90);

  // default locked to 4/4, user can unlock to change
  const [masterTimeSig, setMasterTimeSig] = useState("4/4");
  const [masterSigLocked, setMasterSigLocked] = useState(true);

  // active master preset id (presetA … presetE)
  const [activePreset, setActivePreset] = useState(
    galaxy0.defaultPresetId ?? "presetA"
  );

  const activePresetConfig = galaxy0.presets[activePreset];
  const bannerUrl = activePresetConfig?.banner ?? null;

  // Orbit scene id is stored in master preset
  const initialOrbitSceneId =
    activePresetConfig?.orbitSceneId || ORBIT_MASTER_PRESETS?.[0]?.id || "";

  const [orbitSceneId, setOrbitSceneId] = useState(initialOrbitSceneId);

  // options for OrbitPanel dropdown
  const orbitSceneOptions = useMemo(() => {
    return (ORBIT_MASTER_PRESETS || []).map((p) => ({
      id: p.id,
      label: p.label,
      sig: p?.orbits?.orbitA?.motion?.timeSig
        ? p.orbits.orbitA.motion.timeSig
        : "",
      subtitle: p.description || "",
    }));
  }, []);

  // core state (initialized from active preset)
  const [coreLayers, setCoreLayers] = useState(() =>
    normalizeCore(activePresetConfig?.core)
  );

  // orbit state derived from scene
  const initialScene = getOrbitSceneById(initialOrbitSceneId);
  const initialOrbitState = sceneToOrbitState(initialScene);

  const [orbitLayers, setOrbitLayers] = useState(initialOrbitState.orbitLayers);
  const [orbitPatterns, setOrbitPatterns] = useState(
    initialOrbitState.orbitPatterns
  );

  // -------------------------------
  // Engine application helpers
  // -------------------------------
  const applyCoreLayerToEngine = (layerId, layer) => {
    if (!engineLive) return;
    omseEngine.setCoreLayerGain(layerId, (layer.gain ?? 0) / 100);
    omseEngine.setCoreLayerMute(layerId, !!layer.muted);
  };

  const applyOrbitToEngine = (orbitId, layer) => {
    if (!engineLive) return;

    omseEngine.setOrbitEnabled(orbitId, layer.enabled !== false);
    omseEngine.setOrbitGain(orbitId, (layer.gain ?? 0) / 100);
    omseEngine.setOrbitMute(orbitId, !!layer.muted);
    omseEngine.setOrbitPan(orbitId, layer.pan ?? 0);

    // motion params update live; loop keeps running
    omseEngine.setOrbitTimeSig(orbitId, layer.timeSig || "4/4");
    omseEngine.setOrbitArp(orbitId, layer.arp || "off");
    omseEngine.setOrbitRate(orbitId, layer.rate || "8n");
  };

  /**
   * ✅ FIX: your engine doesn't currently expose `setOrbitPatternState`.
   * This wrapper prevents hard crashes and supports alternate method names
   * if your engine uses a different API.
   */
  const warnedPatternFnRef = useRef(false);
  const setOrbitPatternStateSafe = (orbitId, isOn) => {
    const v = !!isOn;

    if (typeof omseEngine.setOrbitPatternState === "function") {
      omseEngine.setOrbitPatternState(orbitId, v);
      return;
    }

    // common alternates (if your engine chose different naming)
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

    // no-op + warn once (prevents app crash)
    if (!warnedPatternFnRef.current) {
      warnedPatternFnRef.current = true;
      console.warn(
        "[OMSE] No orbit-pattern setter found on engine. Expected one of: setOrbitPatternState | setOrbitPattern | setOrbitPatternEnabled | setOrbitPatternOn"
      );
    }
  };

  const panicAllNotesOff = () => {
    if (!audioReady) return;

    // Force-release any latched core notes
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

    // IMPORTANT: clear any held notes first (prevents latch on re-power)
    panicAllNotesOff();

    // Stop all orbit patterns (SAFE)
    Object.keys(orbitPatterns || {}).forEach((orbitId) => {
      setOrbitPatternStateSafe(orbitId, false);
    });

    // Mute all orbits
    Object.keys(orbitLayers || {}).forEach((orbitId) => {
      omseEngine.setOrbitMute(orbitId, true);
    });

    // Mute all core layers
    Object.keys(coreLayers || {}).forEach((layerId) => {
      omseEngine.setCoreLayerMute(layerId, true);
    });
  };

  const reapplyStateToEngine = () => {
    if (!engineLive) return;

    // master
    omseEngine.setMasterBpm(masterBpm);
    omseEngine.setMasterCycleMeasures(MASTER_CYCLE_MEASURES);
    omseEngine.setMasterTimeSig(masterTimeSig);

    // core
    Object.entries(coreLayers || {}).forEach(([layerId, layer]) => {
      applyCoreLayerToEngine(layerId, layer);
    });

    // orbits mix/motion
    Object.entries(orbitLayers || {}).forEach(([orbitId, layer]) => {
      applyOrbitToEngine(orbitId, layer);
    });

    // patterns (SAFE)
    Object.entries(orbitPatterns || {}).forEach(([orbitId, isOn]) => {
      setOrbitPatternStateSafe(orbitId, !!isOn);
    });
  };

  // ✅ Sync engine with power state (no stale closures)
  useEffect(() => {
    if (!audioReady) return;

    if (isPowered) {
      reapplyStateToEngine();
    } else {
      silenceEngine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPowered, audioReady]);

  // ✅ patterns ONLY: apply start/stop ONLY when orbitPatterns changes
  useEffect(() => {
    if (!engineLive) return;
    Object.entries(orbitPatterns || {}).forEach(([orbitId, isOn]) => {
      setOrbitPatternStateSafe(orbitId, !!isOn);
    });
  }, [engineLive, orbitPatterns]);

  // -------------------------------
  // Keyboard → Core voice (only when powered)
  // -------------------------------
  useEffect(() => {
    const downKeys = new Set();

    const handleKeyDown = (e) => {
      if (!engineLive) return;
      const key = e.key.toLowerCase();
      const note = KEY_TO_NOTE[key];
      if (!note) return;
      if (downKeys.has(key)) return;

      downKeys.add(key);

      // Track held notes globally for power-off panic
      activeCoreNotesRef.current.add(note);

      omseEngine.noteOn("core", note);
    };

    const handleKeyUp = (e) => {
      if (!engineLive) return;
      const key = e.key.toLowerCase();
      const note = KEY_TO_NOTE[key];
      if (!note) return;

      downKeys.delete(key);

      // Release + untrack
      activeCoreNotesRef.current.delete(note);

      omseEngine.noteOff("core", note);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      downKeys.clear();
    };
  }, [engineLive]);

  // -------------------------------
  // MASTER CLOCK handlers
  // -------------------------------
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

  // -------------------------------
  // Power behavior
  // -------------------------------
  const handleInitIfNeeded = async () => {
    if (audioReady) return;

    await omseEngine.startAudioContext();
    setAudioReady(true);

    // Apply master immediately after init (safe even before powered)
    omseEngine.setMasterBpm(masterBpm);
    omseEngine.setMasterCycleMeasures(MASTER_CYCLE_MEASURES);
    omseEngine.setMasterTimeSig(masterTimeSig);

    // Apply core to engine from active preset (and UI)
    const core = normalizeCore(activePresetConfig?.core);
    setCoreLayers(core);
    Object.entries(core).forEach(([layerId, layer]) => {
      omseEngine.setCoreLayerGain(layerId, (layer.gain ?? 0) / 100);
      omseEngine.setCoreLayerMute(layerId, !!layer.muted);
    });

    // Apply orbit scene (engine + UI)
    const scene =
      getOrbitSceneById(orbitSceneId) || getOrbitSceneById(initialOrbitSceneId);

    if (scene) {
      const nextOrbitState = sceneToOrbitState(scene);

      // UI state
      setOrbitLayers(nextOrbitState.orbitLayers);
      setOrbitPatterns(nextOrbitState.orbitPatterns);

      // ✅ Engine: apply normalized layer state (no schema ambiguity)
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });

      // ✅ patterns (SAFE)
      Object.entries(nextOrbitState.orbitPatterns || {}).forEach(
        ([oid, isOn]) => {
          setOrbitPatternStateSafe(oid, !!isOn);
        }
      );

      // ✅ If your engine has a voice-preset setter, apply it per-orbit (optional)
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        const voicePreset =
          layer.voicePresetId && ORBIT_VOICE_PRESETS
            ? ORBIT_VOICE_PRESETS[layer.voicePresetId]
            : null;

        if (
          voicePreset &&
          typeof omseEngine.setOrbitVoicePreset === "function"
        ) {
          omseEngine.setOrbitVoicePreset(orbitId, voicePreset);
        }
      });
    }
  };

  const handleTogglePower = async () => {
    if (!isPowered) {
      await handleInitIfNeeded();
      setIsPowered(true);
      return;
    }

    // Powering off: hard stop any held notes immediately
    panicAllNotesOff();
    setIsPowered(false);
  };

  // -------------------------------
  // Preset apply (Galaxy0)
  // -------------------------------
  const handleApplyPreset = (presetId) => {
    const preset = galaxy0.presets[presetId];
    if (!preset) return;

    setActivePreset(presetId);

    // core
    const nextCore = normalizeCore(preset.core);
    setCoreLayers(nextCore);

    // orbit scene selection
    const nextSceneId =
      preset.orbitSceneId || ORBIT_MASTER_PRESETS?.[0]?.id || "";
    setOrbitSceneId(nextSceneId);

    const scene = getOrbitSceneById(nextSceneId);
    const nextOrbitState = sceneToOrbitState(scene);

    setOrbitLayers(nextOrbitState.orbitLayers);
    setOrbitPatterns(nextOrbitState.orbitPatterns);

    if (engineLive) {
      Object.entries(nextCore).forEach(([layerId, layer]) => {
        applyCoreLayerToEngine(layerId, layer);
      });

      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });

      Object.entries(nextOrbitState.orbitPatterns || {}).forEach(
        ([oid, isOn]) => {
          setOrbitPatternStateSafe(oid, !!isOn);
        }
      );
    }
  };

  // -------------------------------
  // Orbit scene handlers
  // -------------------------------
  const handleOrbitSceneChange = (nextId) => {
    setOrbitSceneId(nextId);
    const scene = getOrbitSceneById(nextId);

    const nextOrbitState = sceneToOrbitState(scene);
    setOrbitLayers(nextOrbitState.orbitLayers);
    setOrbitPatterns(nextOrbitState.orbitPatterns);

    if (engineLive && scene) {
      // ✅ Engine: apply normalized layer state
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });

      // ✅ patterns (SAFE)
      Object.entries(nextOrbitState.orbitPatterns || {}).forEach(
        ([oid, isOn]) => {
          setOrbitPatternStateSafe(oid, !!isOn);
        }
      );

      // ✅ optional: apply orbit voice preset if engine supports it
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        const voicePreset =
          layer.voicePresetId && ORBIT_VOICE_PRESETS
            ? ORBIT_VOICE_PRESETS[layer.voicePresetId]
            : null;

        if (
          voicePreset &&
          typeof omseEngine.setOrbitVoicePreset === "function"
        ) {
          omseEngine.setOrbitVoicePreset(orbitId, voicePreset);
        }
      });
    }
  };

  // -------------------------------
  // Core mixer handlers
  // -------------------------------
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

  // -------------------------------
  // Orbit mixer handlers
  // -------------------------------
  const baseOrbitFallback = {
    gain: 0,
    pan: 0,
    muted: false,
    timeSig: "4/4",
    arp: "off",
    rate: "8n",
    enabled: true,
  };

  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, gain: newPercent };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitMuteToggle = (orbitId) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, muted: !cur.muted };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitPanChange = (orbitId, newPan) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, pan: newPan };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitTimeSigChange = (orbitId, nextSig) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, timeSig: nextSig };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitArpChange = (orbitId, nextArp) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, arp: nextArp };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitEnabledChange = (orbitId, enabled) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || baseOrbitFallback;
      const nextLayer = { ...cur, enabled };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  // ✅ Pattern toggle ONLY changes state.
  const handleOrbitPatternToggle = (orbitId) => {
    if (!engineLive) return;
    setOrbitPatterns((prev) => ({ ...prev, [orbitId]: !prev?.[orbitId] }));
  };

  // -------------------------------
  // Render
  // -------------------------------
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
                orbitLayers={orbitLayers}
                orbitPatterns={orbitPatterns}
                orbitSceneId={orbitSceneId}
                orbitSceneOptions={orbitSceneOptions}
                onOrbitSceneChange={handleOrbitSceneChange}
                onLayerGainChange={handleLayerGainChange}
                onLayerMuteToggle={handleLayerMuteToggle}
                onOrbitGainChange={handleOrbitGainChange}
                onOrbitMuteToggle={handleOrbitMuteToggle}
                onOrbitPatternToggle={handleOrbitPatternToggle}
                onOrbitPanChange={handleOrbitPanChange}
                onOrbitTimeSigChange={handleOrbitTimeSigChange}
                onOrbitArpChange={handleOrbitArpChange}
                onOrbitEnabledChange={handleOrbitEnabledChange}
                bannerUrl={bannerUrl}
              />
            </div>

            <section className="instrument-row-bottom">
              {/* future row */}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
