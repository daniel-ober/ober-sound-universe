// src/components/CorePanel.jsx
import "./CorePanel.css";
import { CoreMixer } from "./CoreMixer";

export function CorePanel({
  audioReady,

  // core mixer state
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,

  // ✅ NEW: per-layer preset options + handler
  corePresetOptions = [], // [{ id, label }]
  onLayerPresetChange,

  // optional UI bits
  bannerUrl,
  sceneName,
}) {
  return (
    <section className="core-panel">
      <header className="core-panel-header">
        <div className="core-panel-titleblock">
          <h2 className="section-title">CORE</h2>
          <p className="section-subtitle">
            The emotional heart of the current Galaxy. Core is a three-layer instrument: Ground,
            Harmony, and Atmosphere.
          </p>

          <div className="status-line">
            <span className="status-label">Audio Status:&nbsp;</span>
            <span className={audioReady ? "status-ok" : "status-bad"}>
              {audioReady ? "READY" : "NOT INITIALIZED"}
            </span>
          </div>

          <h3 className="core-panel-subhead">CORE LAYERS</h3>
          <p className="core-panel-subcopy">
            Shape the Core engine by balancing low foundation, harmonic body, and atmospheric air.
          </p>
        </div>
      </header>

      <CoreMixer
        audioReady={audioReady}
        coreLayers={coreLayers}
        onLayerGainChange={onLayerGainChange}
        onLayerMuteToggle={onLayerMuteToggle}
        // ✅ NEW
        corePresetOptions={corePresetOptions}
        onLayerPresetChange={onLayerPresetChange}
        bannerUrl={bannerUrl}
        sceneName={sceneName}
      />
    </section>
  );
}