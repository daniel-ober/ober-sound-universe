// src/components/UniverseLayout.jsx
import "./UniverseLayout.css";
import { CoreMixer } from "./CoreMixer";
import { OrbitPanel } from "./OrbitPanel";
import { MASTER_PRESETS } from "../presets/masterPresets";

const galaxy0 = MASTER_PRESETS.galaxy0;

export function UniverseLayout({
  audioReady,
  coreLayers,
  orbitLayers,
  orbitPatterns,
  onLayerGainChange,
  onLayerMuteToggle,
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,
  activePresetId,
}) {
  const fallbackId = galaxy0.defaultPresetId;
  const active = galaxy0.presets[activePresetId] || galaxy0.presets[fallbackId];
  const bannerUrl = active?.banner;

  return (
    <section className="instrument-row-main">
      <main className="universe">
        <div className="universe-layout">
          {/* LEFT: Core */}
          <section className="core-panel">
            <h2 className="section-title">CORE</h2>
            <p className="section-subtitle">
              The emotional heart of the current Galaxy. Core is a three-layer
              instrument: Ground, Harmony, and Atmosphere.
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
                Shape the Core engine by balancing low foundation, harmonic
                body, and atmospheric air.
              </p>
            </div>

            <CoreMixer
              audioReady={audioReady}
              coreLayers={coreLayers}
              onLayerGainChange={onLayerGainChange}
              onLayerMuteToggle={onLayerMuteToggle}
              bannerUrl={bannerUrl}
            />
          </section>

          {/* RIGHT: Orbit voices */}
          <section className="orbits-column">
            <OrbitPanel
              audioReady={audioReady}
              orbitLayers={orbitLayers}
              orbitPatterns={orbitPatterns}
              onOrbitGainChange={onOrbitGainChange}
              onOrbitMuteToggle={onOrbitMuteToggle}
              onOrbitPatternToggle={onOrbitPatternToggle}
            />
          </section>
        </div>
      </main>
    </section>
  );
}