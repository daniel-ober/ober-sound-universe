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
    orbitPatterns: {
      orbitA: true,
      orbitB: false,
      orbitC: true,
    },
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
    orbitPatterns: {
      orbitA: true,
      orbitB: true,
      orbitC: false,
    },
  },
};

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const [activePreset, setActivePreset] = useState("presetA");
  const [coreLayers, setCoreLayers] = useState(GALAXY0_PRESETS.presetA.core);
  const [orbitLayers, setOrbitLayers] = useState(
    GALAXY0_PRESETS.presetA.orbits
  );
  const [orbitPatterns, setOrbitPatterns] = useState(
    GALAXY0_PRESETS.presetA.orbitPatterns
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

    const preset = GALAXY0_PRESETS[activePreset];
    syncToEngine(preset.core, preset.orbits, preset.orbitPatterns);
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
                activePreset={activePreset}
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
            <section className="instrument-row-main">
              <main className="universe">
                <div className="universe-layout">
                  {/* LEFT: Core / Gravity */}
                  <section className="core-panel">
                    <h2 className="section-title">CORE</h2>
                    <p className="section-subtitle">
                      The emotional heart of the current Galaxy. Core is a
                      three-layer instrument: Ground, Harmony, and Atmosphere.
                    </p>

                    <p className="status-line">
                      <span className="status-label">Audio status:</span>{" "}
                      <span className={audioReady ? "status-ok" : "status-bad"}>
                        {audioReady ? "READY" : "NOT INITIALIZED"}
                      </span>
                    </p>

                    <div className="core-layers-header">
                      <span className="eyebrow-label">Core Layers</span>
                      <p className="core-layers-copy">
                        Shape the Core engine by balancing low foundation,
                        harmonic body, and atmospheric air.
                      </p>
                    </div>

                    <CoreMixer
                      audioReady={audioReady}
                      coreLayers={coreLayers}
                      onLayerGainChange={handleLayerGainChange}
                      onLayerMuteToggle={handleLayerMuteToggle}
                    />
                  </section>

                  {/* RIGHT: Orbit voices */}
                  <section className="orbits-column">
                    <div className="orbits-header">
                      <span className="eyebrow-label">Orbit Voices</span>
                    </div>

                    <div className="orbits-stack">
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
                    </div>
                  </section>
                </div>
              </main>
            </section>

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
