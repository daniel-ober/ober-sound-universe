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
    orbitA: { gain: 0, pan: 0, muted: false, timeSig: "4/4", arp: "off", rate: "8n", enabled: true },
    orbitB: { gain: 0, pan: 0, muted: false, timeSig: "4/4", arp: "off", rate: "8n", enabled: true },
    orbitC: { gain: 0, pan: 0, muted: false, timeSig: "4/4", arp: "off", rate: "8n", enabled: true },
  };

  if (!scene?.orbits) {
    return {
      orbitLayers: fallback,
      orbitPatterns: { orbitA: false, orbitB: false, orbitC: false },
    };
  }

  const orbitLayers = {};
  const orbitPatterns = {};

  (["orbitA", "orbitB", "orbitC"] || []).forEach((id) => {
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
  const [activePreset, setActivePreset] = useState(galaxy0.defaultPresetId ?? "presetA");
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
  const [orbitPatterns, setOrbitPatterns] = useState(initialOrbitState.orbitPatterns);

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
  // Sync UI state → engine
  // -------------------------------
  const syncToEngine = (coreState, orbitState, patternState) => {
    if (!audioReady) return;

    // Core layers
    Object.entries(coreState).forEach(([layerId, layer]) => {
      omseEngine.setCoreLayerGain(layerId, (layer.gain ?? 0) / 100);
      omseEngine.setCoreLayerMute(layerId, !!layer.muted);
    });

    // Orbits: mix + motion + enable
    Object.entries(orbitState).forEach(([orbitId, layer]) => {
      omseEngine.setOrbitEnabled(orbitId, layer.enabled !== false);
      omseEngine.setOrbitGain(orbitId, (layer.gain ?? 0) / 100);
      omseEngine.setOrbitMute(orbitId, !!layer.muted);
      omseEngine.setOrbitPan(orbitId, layer.pan ?? 0);

      omseEngine.setOrbitTimeSig(orbitId, layer.timeSig || "4/4");
      omseEngine.setOrbitArp(orbitId, layer.arp || "off");
      omseEngine.setOrbitRate(orbitId, layer.rate || "8n");
    });

    // Orbit patterns
    Object.entries(patternState).forEach(([orbitId, isOn]) => {
      if (isOn) omseEngine.startOrbitPattern(orbitId);
      else omseEngine.stopOrbitPattern(orbitId);
    });
  };

  // -------------------------------
  // Top-level controls
  // -------------------------------
  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    // Apply core
    const core = normalizeCore(activePresetConfig?.core);
    setCoreLayers(core);

    // Apply orbit scene
    const scene = getOrbitSceneById(orbitSceneId) || getOrbitSceneById(initialOrbitSceneId);
    if (scene) {
      // drive engine (voice presets + mix + motion + patternOn)
      omseEngine.applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS);

      // sync UI state too
      const nextOrbitState = sceneToOrbitState(scene);
      setOrbitLayers(nextOrbitState.orbitLayers);
      setOrbitPatterns(nextOrbitState.orbitPatterns);

      syncToEngine(core, nextOrbitState.orbitLayers, nextOrbitState.orbitPatterns);
    } else {
      // still sync core as a minimum
      syncToEngine(core, orbitLayers, orbitPatterns);
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
    const nextSceneId = preset.orbitSceneId || ORBIT_MASTER_PRESETS?.[0]?.id || "";
    setOrbitSceneId(nextSceneId);

    const scene = getOrbitSceneById(nextSceneId);
    const nextOrbitState = sceneToOrbitState(scene);

    setOrbitLayers(nextOrbitState.orbitLayers);
    setOrbitPatterns(nextOrbitState.orbitPatterns);

    if (audioReady) {
      if (scene) omseEngine.applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS);
      syncToEngine(nextCore, nextOrbitState.orbitLayers, nextOrbitState.orbitPatterns);
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
      omseEngine.applyOrbitScenePreset(scene, ORBIT_VOICE_PRESETS);
      syncToEngine(coreLayers, nextOrbitState.orbitLayers, nextOrbitState.orbitPatterns);
    }
  };

  // -------------------------------
  // Core mixer handlers
  // -------------------------------
  const handleLayerGainChange = (layerId, newPercent) => {
    setCoreLayers((prev) => {
      const next = {
        ...prev,
        [layerId]: { ...prev[layerId], gain: newPercent },
      };
      syncToEngine(next, orbitLayers, orbitPatterns);
      return next;
    });
  };

  const handleLayerMuteToggle = (layerId) => {
    setCoreLayers((prev) => {
      const current = prev[layerId];
      const next = {
        ...prev,
        [layerId]: { ...current, muted: !current.muted },
      };
      syncToEngine(next, orbitLayers, orbitPatterns);
      return next;
    });
  };

  // -------------------------------
  // Orbit mixer handlers
  // -------------------------------
  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => {
      const next = {
        ...prev,
        [orbitId]: { ...prev[orbitId], gain: newPercent },
      };
      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitMuteToggle = (orbitId) => {
    setOrbitLayers((prev) => {
      const current = prev[orbitId];
      const next = {
        ...prev,
        [orbitId]: { ...current, muted: !current.muted },
      };
      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitPatternToggle = (orbitId) => {
    if (!audioReady) return;

    setOrbitPatterns((prev) => {
      const next = { ...prev, [orbitId]: !prev[orbitId] };
      syncToEngine(coreLayers, orbitLayers, next);
      return next;
    });
  };

  const handleOrbitPanChange = (orbitId, newPan) => {
    setOrbitLayers((prev) => {
      const next = { ...prev, [orbitId]: { ...prev[orbitId], pan: newPan } };
      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitTimeSigChange = (orbitId, nextSig) => {
    setOrbitLayers((prev) => {
      const next = { ...prev, [orbitId]: { ...prev[orbitId], timeSig: nextSig } };
      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitArpChange = (orbitId, nextArp) => {
    setOrbitLayers((prev) => {
      const next = { ...prev, [orbitId]: { ...prev[orbitId], arp: nextArp } };
      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitEnabledChange = (orbitId, enabled) => {
    setOrbitLayers((prev) => {
      const next = { ...prev, [orbitId]: { ...prev[orbitId], enabled } };
      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
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