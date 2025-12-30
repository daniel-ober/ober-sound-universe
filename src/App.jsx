// src/App.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "./engine/omseEngine";
import { CoreMixer } from "./components/CoreMixer";
import { VoiceCard } from "./components/VoiceCard";
import { TopBar } from "./components/TopBar";
import { GalaxyPresetBar } from "./components/GalaxyPresetBar";
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

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const [activePreset, setActivePreset] = useState("presetA");
  const [coreLayers, setCoreLayers] = useState(MASTER_PRESETS.presetA.core);
  const [orbitLayers, setOrbitLayers] = useState(MASTER_PRESETS.presetA.orbits);
  const [orbitPatterns, setOrbitPatterns] = useState(
    MASTER_PRESETS.presetA.patterns || {
      orbitA: false,
      orbitB: false,
      orbitC: false,
    }
  );

  // ----- Keyboard → Core voice -----
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

  // ----- Sync UI state → engine -----
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
    if (patternState) {
      Object.entries(patternState).forEach(([orbitId, enabled]) => {
        omseEngine.setOrbitPattern(orbitId, !!enabled);
      });
    }
  };

  // ----- Audio init -----
  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    const preset = MASTER_PRESETS[activePreset];
    if (!preset) return;

    syncToEngine(preset.core, preset.orbits, preset.patterns);
    setOrbitPatterns(
      preset.patterns || { orbitA: false, orbitB: false, orbitC: false }
    );
  };

  // ----- Test scene -----
  const handlePlayTestScene = async () => {
    if (!audioReady) return;
    setIsPlayingDemo(true);
    await omseEngine.playTestScene();
    setTimeout(() => setIsPlayingDemo(false), 9000);
  };

  // ----- Preset handling -----
  const handleApplyPreset = (presetId) => {
    const preset = MASTER_PRESETS[presetId];
    if (!preset) return;

    setActivePreset(presetId);
    setCoreLayers(preset.core);
    setOrbitLayers(preset.orbits);
    const nextPatterns =
      preset.patterns || { orbitA: false, orbitB: false, orbitC: false };
    setOrbitPatterns(nextPatterns);

    syncToEngine(preset.core, preset.orbits, nextPatterns);
  };

  // ----- Core mixer handlers -----
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

  // ----- Orbit mixer handlers -----
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
      const next = {
        ...prev,
        [orbitId]: !prev[orbitId],
      };
      syncToEngine(coreLayers, orbitLayers, next);
      return next;
    });
  };

  // ----- Render -----
  return (
    <div className="app-root">
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

      <main className="universe">
        <section className="core-panel">
          <h2>Core</h2>
          <p className="desc">
            The emotional heart of the current Galaxy. Core is a three-layer
            instrument: Ground, Harmony, and Atmosphere.
          </p>
          <p className="status">
            Audio status:{" "}
            <strong>{audioReady ? "Ready" : "Not initialized"}</strong>
          </p>

          <CoreMixer
            audioReady={audioReady}
            coreLayers={coreLayers}
            onLayerGainChange={handleLayerGainChange}
            onLayerMuteToggle={handleLayerMuteToggle}
          />
        </section>

        <section className="orbits-grid">
          <VoiceCard
            id="orbitA"
            name="Orbit A"
            description="First orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitA}
            onGainChange={handleOrbitGainChange}
            onToggleMute={handleOrbitMuteToggle}
            supportsPattern
            patternActive={orbitPatterns.orbitA}
            onTogglePattern={handleOrbitPatternToggle}
          />
          <VoiceCard
            id="orbitB"
            name="Orbit B"
            description="Second orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitB}
            onGainChange={handleOrbitGainChange}
            onToggleMute={handleOrbitMuteToggle}
            supportsPattern
            patternActive={orbitPatterns.orbitB}
            onTogglePattern={handleOrbitPatternToggle}
          />
          <VoiceCard
            id="orbitC"
            name="Orbit C"
            description="Third orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitC}
            onGainChange={handleOrbitGainChange}
            onToggleMute={handleOrbitMuteToggle}
            supportsPattern
            patternActive={orbitPatterns.orbitC}
            onTogglePattern={handleOrbitPatternToggle}
          />
        </section>
      </main>
    </div>
  );
}

export default App;