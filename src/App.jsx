// src/App.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "./engine/omseEngine";

import { TopBar } from "./components/TopBar";
import { GalaxyPresetBar } from "./components/GalaxyPresetBar";
import { UniverseLayout } from "./components/UniverseLayout";

import { MASTER_PRESETS } from "./presets/masterPresets";
import "./App.css";

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

const galaxy0 = MASTER_PRESETS.galaxy0;
const DEFAULT_PRESET_ID = galaxy0.defaultPresetId;
const DEFAULT_PRESET = galaxy0.presets[DEFAULT_PRESET_ID];

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  // use canonical master presets
  const [activePresetId, setActivePresetId] = useState(DEFAULT_PRESET_ID);
  const [coreLayers, setCoreLayers] = useState(DEFAULT_PRESET.core);
  const [orbitLayers, setOrbitLayers] = useState(DEFAULT_PRESET.orbits);
  const [orbitPatterns, setOrbitPatterns] = useState(
    DEFAULT_PRESET.orbitPatterns
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
  // Sync UI state → engine
  // -------------------------------
  const syncToEngine = (coreState, orbitState, patternState) => {
    if (!audioReady) return;

    // Core layers
    Object.entries(coreState).forEach(([layerId, layer]) => {
      omseEngine.setCoreLayerGain(layerId, layer.gain / 100);
      omseEngine.setCoreLayerMute(layerId, !!layer.muted);
    });

    // Orbits
    Object.entries(orbitState).forEach(([orbitId, layer]) => {
      omseEngine.setOrbitGain(orbitId, layer.gain / 100);
      omseEngine.setOrbitMute(orbitId, !!layer.muted);
    });

    // Orbit patterns
    Object.entries(patternState).forEach(([orbitId, isOn]) => {
      if (isOn) {
        omseEngine.startOrbitPattern(orbitId);
      } else {
        omseEngine.stopOrbitPattern(orbitId);
      }
    });
  };

  // -------------------------------
  // Top-level controls
  // -------------------------------
  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    const preset = galaxy0.presets[activePresetId];
    if (preset) {
      syncToEngine(preset.core, preset.orbits, preset.orbitPatterns);
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

    setActivePresetId(presetId);
    setCoreLayers(preset.core);
    setOrbitLayers(preset.orbits);
    setOrbitPatterns(preset.orbitPatterns);
    syncToEngine(preset.core, preset.orbits, preset.orbitPatterns);
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

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <div className="app-root">
      <div className="instrument-frame skin-image">
        <div className="instrument-inner">
          <div className="instrument-grid">
            {/* TOP: brand / transport / preset bars */}
            <div className="instrument-row-top">
              <TopBar
                audioReady={audioReady}
                isPlayingDemo={isPlayingDemo}
                onInitAudio={handleInitAudio}
                onPlayTestScene={handlePlayTestScene}
              />

              <GalaxyPresetBar
                activePreset={activePresetId}
                onSelectPreset={handleApplyPreset}
              />
            </div>

            {/* GRAVITY SPECTRUM STRIP */}
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

            {/* MAIN: Core (left) + Orbits (right) */}
            <UniverseLayout
              audioReady={audioReady}
              coreLayers={coreLayers}
              orbitLayers={orbitLayers}
              orbitPatterns={orbitPatterns}
              onLayerGainChange={handleLayerGainChange}
              onLayerMuteToggle={handleLayerMuteToggle}
              onOrbitGainChange={handleOrbitGainChange}
              onOrbitMuteToggle={handleOrbitMuteToggle}
              onOrbitPatternToggle={handleOrbitPatternToggle}
              activePresetId={activePresetId}
            />

            {/* BOTTOM: future mixer / transport row */}
            <section className="instrument-row-bottom">
              {/* TODO: tempo, faders, macro knobs, etc. */}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;