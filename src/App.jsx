// src/App.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "./engine/omseEngine";
import { CoreMixer } from "./components/CoreMixer";
import { VoiceCard } from "./components/VoiceCard";
import { TopBar } from "./components/TopBar";
import { GalaxyPresetBar } from "./components/GalaxyPresetBar";
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

// Simple dev presets for Galaxy0
const GALAXY0_PRESETS = {
  presetA: {
    core: {
      ground: { gain: 90, muted: false },
      harmony: { gain: 65, muted: false },
      atmos: { gain: 55, muted: false },
    },
    orbits: {
      orbitA: { gain: 70, muted: false },
      orbitB: { gain: 60, muted: false },
      orbitC: { gain: 45, muted: false },
    },
    orbitAPattern: false,
  },
  presetB: {
    core: {
      ground: { gain: 55, muted: false },
      harmony: { gain: 80, muted: false },
      atmos: { gain: 75, muted: false },
    },
    orbits: {
      orbitA: { gain: 50, muted: false },
      orbitB: { gain: 70, muted: false },
      orbitC: { gain: 65, muted: false },
    },
    orbitAPattern: true,
  },
};

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [orbitAPatternOn, setOrbitAPatternOn] = useState(false);

  // Start from Preset A values
  const [activePreset, setActivePreset] = useState("presetA");
  const [coreLayers, setCoreLayers] = useState(GALAXY0_PRESETS.presetA.core);
  const [orbitLayers, setOrbitLayers] = useState(GALAXY0_PRESETS.presetA.orbits);

  // Keyboard → Core voice
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

  const syncGainsToEngine = (coreState, orbitState, orbitAPattern) => {
    if (!audioReady) return;

    // Core
    Object.entries(coreState).forEach(([layerId, layer]) => {
      omseEngine.setCoreLayerGain(layerId, layer.gain / 100);
      omseEngine.setCoreLayerMute(layerId, !!layer.muted);
    });

    // Orbits
    Object.entries(orbitState).forEach(([orbitId, layer]) => {
      omseEngine.setOrbitGain(orbitId, layer.gain / 100);
      omseEngine.setOrbitMute(orbitId, !!layer.muted);
    });

    // Orbit A pattern
    if (orbitAPattern) {
      omseEngine.startOrbitAPattern();
    } else {
      omseEngine.stopOrbitAPattern();
    }
  };

  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    const preset = GALAXY0_PRESETS[activePreset];
    syncGainsToEngine(preset.core, preset.orbits, preset.orbitAPattern);
    setOrbitAPatternOn(!!preset.orbitAPattern);
  };

  const handlePlayTestScene = async () => {
    if (!audioReady) return;
    setIsPlayingDemo(true);
    await omseEngine.playTestScene();
    setTimeout(() => setIsPlayingDemo(false), 9000);
  };

  const handleApplyPreset = (presetId) => {
    const preset = GALAXY0_PRESETS[presetId];
    if (!preset) return;

    setActivePreset(presetId);
    setCoreLayers(preset.core);
    setOrbitLayers(preset.orbits);
    setOrbitAPatternOn(!!preset.orbitAPattern);

    syncGainsToEngine(preset.core, preset.orbits, preset.orbitAPattern);
  };

  const handleLayerGainChange = (layerId, newPercent) => {
    setCoreLayers((prev) => {
      const next = {
        ...prev,
        [layerId]: { ...prev[layerId], gain: newPercent },
      };
      syncGainsToEngine(next, orbitLayers, orbitAPatternOn);
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
      syncGainsToEngine(next, orbitLayers, orbitAPatternOn);
      return next;
    });
  };

  // Orbit mixer handlers
  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => {
      const next = {
        ...prev,
        [orbitId]: { ...prev[orbitId], gain: newPercent },
      };
      syncGainsToEngine(coreLayers, next, orbitAPatternOn);
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
      syncGainsToEngine(coreLayers, next, orbitAPatternOn);
      return next;
    });
  };

  const handleOrbitPatternToggle = (orbitId) => {
    if (!audioReady) return;
    if (orbitId !== "orbitA") return;

    setOrbitAPatternOn((prev) => {
      const next = !prev;
      syncGainsToEngine(coreLayers, orbitLayers, next);
      return next;
    });
  };

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
            patternActive={orbitAPatternOn}
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
          />
          <VoiceCard
            id="orbitC"
            name="Orbit C"
            description="Third orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitC}
            onGainChange={handleOrbitGainChange}
            onToggleMute={handleOrbitMuteToggle}
          />
        </section>
      </main>
    </div>
  );
}

export default App;