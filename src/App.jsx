// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { omseEngine } from "./engine/omseEngine";

import { TopBar } from "./components/TopBar";
import { GalaxyPresetBar } from "./components/GalaxyPresetBar";
import { UniverseLayout } from "./components/UniverseLayout";

import { MASTER_PRESETS } from "./presets/masterPresets";
import { ORBIT_MASTER_PRESETS } from "./presets/orbits/orbitMasterPresets";
import { ORBIT_VOICE_PRESETS } from "./presets/orbits/orbitVoicePresets";

import "./App.css";

const galaxy0 = MASTER_PRESETS.galaxy0;

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
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

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
      sig: p?.orbits?.orbitA?.motion?.timeSig ? p.orbits.orbitA.motion.timeSig : "",
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
  // Keyboard → Core voice
  // -------------------------------
  useEffect(() => {
    const downKeys = new Set();

    const handleKeyDown = (e) => {
      if (!audioReady) return;
      const key = e.key.toLowerCase();
      if (!KEY_TO_NOTE[key]) return;
      if (downKeys.has(key)) return;

      downKeys.add(key);
      omseEngine.noteOn("core", KEY_TO_NOTE[key]);
    };

    const handleKeyUp = (e) => {
      if (!audioReady) return;
      const key = e.key.toLowerCase();
      if (!KEY_TO_NOTE[key]) return;

      downKeys.delete(key);
      omseEngine.noteOff("core", KEY_TO_NOTE[key]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      downKeys.clear();
    };
  }, [audioReady]);

  // -------------------------------
  // Continuous-safe engine application helpers
  // (DO NOT touch pattern scheduling here)
  // -------------------------------
  const applyCoreLayerToEngine = (layerId, layer) => {
    if (!audioReady) return;
    omseEngine.setCoreLayerGain(layerId, (layer.gain ?? 0) / 100);
    omseEngine.setCoreLayerMute(layerId, !!layer.muted);
  };

  const applyOrbitToEngine = (orbitId, layer) => {
    if (!audioReady) return;

    omseEngine.setOrbitEnabled(orbitId, layer.enabled !== false);
    omseEngine.setOrbitGain(orbitId, (layer.gain ?? 0) / 100);
    omseEngine.setOrbitMute(orbitId, !!layer.muted);
    omseEngine.setOrbitPan(orbitId, layer.pan ?? 0);

    // motion params update live; loop keeps running
    omseEngine.setOrbitTimeSig(orbitId, layer.timeSig || "4/4");
    omseEngine.setOrbitArp(orbitId, layer.arp || "off");
    omseEngine.setOrbitRate(orbitId, layer.rate || "8n");
  };

  // ✅ patterns ONLY: apply start/stop ONLY when orbitPatterns changes
  useEffect(() => {
    if (!audioReady) return;
    Object.entries(orbitPatterns || {}).forEach(([orbitId, isOn]) => {
      omseEngine.setOrbitPatternState(orbitId, !!isOn);
    });
  }, [audioReady, orbitPatterns]);

  // -------------------------------
  // Top-level controls
  // -------------------------------
  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    // Apply core
    const core = normalizeCore(activePresetConfig?.core);
    setCoreLayers(core);
    Object.entries(core).forEach(([layerId, layer]) => {
      applyCoreLayerToEngine(layerId, layer);
    });

    // Apply orbit scene (engine + UI)
    const scene =
      getOrbitSceneById(orbitSceneId) || getOrbitSceneById(initialOrbitSceneId);

    if (scene) {
      // engine: set voice presets + mix + motion + patternOn
      omseEngine.applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS);

      // UI: reflect scene
      const nextOrbitState = sceneToOrbitState(scene);
      setOrbitLayers(nextOrbitState.orbitLayers);
      setOrbitPatterns(nextOrbitState.orbitPatterns);

      // engine: ensure mix/motion reflects UI state immediately
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });
    } else {
      // fallback: apply current UI orbit state
      Object.entries(orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });
    }
  };

  const handlePlayTestScene = async () => {
    if (!audioReady) return;
    setIsPlayingDemo(true);
    await omseEngine.playTestScene();
    setTimeout(() => setIsPlayingDemo(false), 9000);
  };

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

    if (audioReady) {
      // apply core
      Object.entries(nextCore).forEach(([layerId, layer]) => {
        applyCoreLayerToEngine(layerId, layer);
      });

      // apply orbit scene (voice swap + baseline)
      if (scene) omseEngine.applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS);

      // apply orbit mix/motion live (patterns handled by effect)
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });
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

    if (audioReady && scene) {
      // voice swap + baseline + patternOn (safe)
      omseEngine.applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS);

      // then apply mix/motion live (patterns handled by effect too)
      Object.entries(nextOrbitState.orbitLayers).forEach(([orbitId, layer]) => {
        applyOrbitToEngine(orbitId, layer);
      });
    }
  };

  // -------------------------------
  // Core mixer handlers (NO pattern touching)
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
  // Orbit mixer handlers (NO pattern touching)
  // -------------------------------
  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || {
        gain: 0,
        pan: 0,
        muted: false,
        timeSig: "4/4",
        arp: "off",
        rate: "8n",
        enabled: true,
      };
      const nextLayer = { ...cur, gain: newPercent };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitMuteToggle = (orbitId) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || {
        gain: 0,
        pan: 0,
        muted: false,
        timeSig: "4/4",
        arp: "off",
        rate: "8n",
        enabled: true,
      };
      const nextLayer = { ...cur, muted: !cur.muted };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitPanChange = (orbitId, newPan) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || {
        gain: 0,
        pan: 0,
        muted: false,
        timeSig: "4/4",
        arp: "off",
        rate: "8n",
        enabled: true,
      };
      const nextLayer = { ...cur, pan: newPan };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitTimeSigChange = (orbitId, nextSig) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || {
        gain: 0,
        pan: 0,
        muted: false,
        timeSig: "4/4",
        arp: "off",
        rate: "8n",
        enabled: true,
      };
      const nextLayer = { ...cur, timeSig: nextSig };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitArpChange = (orbitId, nextArp) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || {
        gain: 0,
        pan: 0,
        muted: false,
        timeSig: "4/4",
        arp: "off",
        rate: "8n",
        enabled: true,
      };
      const nextLayer = { ...cur, arp: nextArp };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  const handleOrbitEnabledChange = (orbitId, enabled) => {
    setOrbitLayers((prev) => {
      const cur = prev[orbitId] || {
        gain: 0,
        pan: 0,
        muted: false,
        timeSig: "4/4",
        arp: "off",
        rate: "8n",
        enabled: true,
      };
      const nextLayer = { ...cur, enabled };
      const next = { ...prev, [orbitId]: nextLayer };
      applyOrbitToEngine(orbitId, nextLayer);
      return next;
    });
  };

  // ✅ Pattern toggle ONLY changes state.
  // The effect above starts/stops loops without re-syncing everything else.
  const handleOrbitPatternToggle = (orbitId) => {
    if (!audioReady) return;
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
              <TopBar
                audioReady={audioReady}
                isPlayingDemo={isPlayingDemo}
                onInitAudio={handleInitAudio}
                onPlayTestScene={handlePlayTestScene}
              />

              <GalaxyPresetBar
                activePreset={activePreset}
                onSelectPreset={handleApplyPreset}
              />
            </div>

            <section className="instrument-row-spectrum">
              <section className="gravity-spectrum-shell">
                <div className="gravity-spectrum-inner">
                  <div className="gravity-spectrum-header">
                    <span>Galaxy 0 · Output</span>
                  </div>
                  <div className="gravity-spectrum-rail" />
                  <div className="gravity-spectrum-tag">Gravity Spectrum</div>
                </div>
              </section>
            </section>

            <UniverseLayout
              audioReady={audioReady}
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

            <section className="instrument-row-bottom">{/* future row */}</section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;