// src/App.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "./engine/omseEngine";
import { CoreMixer } from "./components/CoreMixer";
import { VoiceCard } from "./components/VoiceCard";
import { TopBar } from "./components/TopBar";
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
  const [orbitAPatternOn, setOrbitAPatternOn] = useState(false);

  // UI-side state for Core layers (0–100 for sliders)
  const [coreLayers, setCoreLayers] = useState({
    ground: { gain: 90, muted: false },
    harmony: { gain: 65, muted: false },
    atmos: { gain: 55, muted: false },
  });

  // UI-side state for Orbits (0–100 for sliders)
  const [orbitLayers, setOrbitLayers] = useState({
    orbitA: { gain: 70, muted: false },
    orbitB: { gain: 70, muted: false },
    orbitC: { gain: 70, muted: false },
  });

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

  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    // Initialize engine-side gains to match UI state
    omseEngine.setCoreLayerGain("ground", coreLayers.ground.gain / 100);
    omseEngine.setCoreLayerGain("harmony", coreLayers.harmony.gain / 100);
    omseEngine.setCoreLayerGain("atmos", coreLayers.atmos.gain / 100);

    omseEngine.setOrbitGain("orbitA", orbitLayers.orbitA.gain / 100);
    omseEngine.setOrbitGain("orbitB", orbitLayers.orbitB.gain / 100);
    omseEngine.setOrbitGain("orbitC", orbitLayers.orbitC.gain / 100);
  };

  const handlePlayTestScene = async () => {
    if (!audioReady) return;
    setIsPlayingDemo(true);
    await omseEngine.playTestScene();
    setTimeout(() => setIsPlayingDemo(false), 9000);
  };

  const handleLayerGainChange = (layerId, newPercent) => {
    setCoreLayers((prev) => ({
      ...prev,
      [layerId]: { ...prev[layerId], gain: newPercent },
    }));

    if (audioReady) {
      const normalized = newPercent / 100;
      omseEngine.setCoreLayerGain(layerId, normalized);
    }
  };

  const handleLayerMuteToggle = (layerId) => {
    setCoreLayers((prev) => {
      const current = prev[layerId];
      const nextMuted = !current.muted;

      if (audioReady) {
        omseEngine.setCoreLayerMute(layerId, nextMuted);
      }

      return {
        ...prev,
        [layerId]: { ...current, muted: nextMuted },
      };
    });
  };

  // Orbit mixer handlers
  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => ({
      ...prev,
      [orbitId]: { ...prev[orbitId], gain: newPercent },
    }));

    if (audioReady) {
      const normalized = newPercent / 100;
      omseEngine.setOrbitGain(orbitId, normalized);
    }
  };

  const handleOrbitMuteToggle = (orbitId) => {
    setOrbitLayers((prev) => {
      const current = prev[orbitId];
      const nextMuted = !current.muted;

      if (audioReady) {
        omseEngine.setOrbitMute(orbitId, nextMuted);
      }

      return {
        ...prev,
        [orbitId]: { ...current, muted: nextMuted },
      };
    });
  };

  const handleOrbitPatternToggle = (orbitId) => {
    if (!audioReady) return;
    if (orbitId !== "orbitA") return;

    setOrbitAPatternOn((prev) => {
      const next = !prev;
      if (next) {
        omseEngine.startOrbitAPattern();
      } else {
        omseEngine.stopOrbitAPattern();
      }
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