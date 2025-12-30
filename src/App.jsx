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
  };

  const handlePlayTestScene = async () => {
    if (!audioReady) return;
    setIsPlayingDemo(true);
    await omseEngine.playTestScene();
    setTimeout(() => setIsPlayingDemo(false), 9000);
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
            The emotional heart of the current Galaxy. For now this uses a
            simple placeholder synth.
          </p>
          <p className="status">
            Audio status:{" "}
            <strong>{audioReady ? "Ready" : "Not initialized"}</strong>
          </p>
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