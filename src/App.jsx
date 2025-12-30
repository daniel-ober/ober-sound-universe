// src/App.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "./engine/omseEngine";
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

  // UI-side state for Core layers (0–100 for sliders)
  const [coreLayers, setCoreLayers] = useState({
    ground: { gain: 90, muted: false },
    harmony: { gain: 70, muted: false },
    atmos: { gain: 55, muted: false },
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

  return (
    <div className="app-root">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-main">Ober Instruments</span>
          <span className="brand-sub">
            Ober Sound Universe · Galaxy0 (dev)
          </span>
        </div>

        <div className="top-controls">
          {!audioReady ? (
            <button className="primary-btn" onClick={handleInitAudio}>
              Initialize Audio
            </button>
          ) : (
            <>
              <button
                className="secondary-btn"
                onClick={handlePlayTestScene}
                disabled={isPlayingDemo}
              >
                {isPlayingDemo ? "Playing Scene…" : "Play Test Scene"}
              </button>
              <span className="hint">
                Play Core with your keyboard: A–K (C4 → C5)
              </span>
            </>
          )}
        </div>
      </header>

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

          <div className="core-mixer">
            <h3>Core Layers</h3>
            <p className="core-mixer-hint">
              Adjust each layer&apos;s level, or mute layers to focus on
              specific aspects of the Core sound.
            </p>

            <CoreLayerRow
              id="ground"
              label="Ground"
              layerState={coreLayers.ground}
              audioReady={audioReady}
              onGainChange={handleLayerGainChange}
              onToggleMute={handleLayerMuteToggle}
            />
            <CoreLayerRow
              id="harmony"
              label="Harmony"
              layerState={coreLayers.harmony}
              audioReady={audioReady}
              onGainChange={handleLayerGainChange}
              onToggleMute={handleLayerMuteToggle}
            />
            <CoreLayerRow
              id="atmos"
              label="Atmosphere"
              layerState={coreLayers.atmos}
              audioReady={audioReady}
              onGainChange={handleLayerGainChange}
              onToggleMute={handleLayerMuteToggle}
            />
          </div>
        </section>

        <section className="orbits-grid">
          <VoiceCard name="Orbit A" description="First orbiting voice." />
          <VoiceCard name="Orbit B" description="Second orbiting voice." />
          <VoiceCard name="Orbit C" description="Third orbiting voice." />
        </section>
      </main>
    </div>
  );
}

function CoreLayerRow({
  id,
  label,
  layerState,
  audioReady,
  onGainChange,
  onToggleMute,
}) {
  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    onGainChange(id, value);
  };

  const handleMuteClick = () => {
    onToggleMute(id);
  };

  return (
    <div className="core-layer-row">
      <div className="core-layer-label">
        <span className="core-layer-name">{label}</span>
        <span className="core-layer-percent">{layerState.gain}%</span>
      </div>
      <div className="core-layer-controls">
        <input
          type="range"
          min={0}
          max={100}
          value={layerState.gain}
          onChange={handleSliderChange}
          disabled={!audioReady}
          className="core-layer-slider"
        />
        <button
          type="button"
          onClick={handleMuteClick}
          disabled={!audioReady}
          className={
            "core-layer-mute-btn" +
            (layerState.muted ? " core-layer-mute-btn--active" : "")
          }
        >
          {layerState.muted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
}

function VoiceCard({ name, description }) {
  return (
    <div className="voice-card">
      <h3>{name}</h3>
      <p className="desc">{description}</p>
      <p className="status">
        Status: <strong>Placeholder engine</strong>
      </p>
    </div>
  );
}

export default App;