// src/components/UniverseLayout.jsx
import { CoreMixer } from "./CoreMixer";
import { OrbitPanel } from "./OrbitPanel";

export function UniverseLayout({
  audioReady,
  coreLayers,
  orbitLayers,
  orbitPatterns,

  orbitSceneId,
  orbitSceneOptions,
  onOrbitSceneChange,

  onLayerGainChange,
  onLayerMuteToggle,

  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,
  onOrbitPanChange,

  onOrbitTimeSigChange,
  onOrbitArpChange,
  onOrbitEnabledChange,

  bannerUrl,
}) {
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

          {/* RIGHT: Orbits */}
          <OrbitPanel
            audioReady={audioReady}
            orbitLayers={orbitLayers}
            orbitPatterns={orbitPatterns}
            orbitSceneId={orbitSceneId}
            orbitSceneOptions={orbitSceneOptions}
            onOrbitSceneChange={onOrbitSceneChange}
            onOrbitGainChange={onOrbitGainChange}
            onOrbitMuteToggle={onOrbitMuteToggle}
            onOrbitPatternToggle={onOrbitPatternToggle}
            onOrbitPanChange={onOrbitPanChange}
            onOrbitTimeSigChange={onOrbitTimeSigChange}
            onOrbitArpChange={onOrbitArpChange}
            onOrbitEnabledChange={onOrbitEnabledChange}
          />
        </div>
      </main>
    </section>
  );
}