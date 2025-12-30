// src/components/CoreMixer.jsx

/**
 * CoreMixer
 *
 * UI-only mixer for the Core 3-layer engine:
 *  - Ground
 *  - Harmony
 *  - Atmosphere
 *
 * All audio logic is handled in omseEngine; this component just:
 *  - displays sliders + mute buttons
 *  - calls onLayerGainChange(id, newPercent)
 *  - calls onLayerMuteToggle(id)
 */

export function CoreMixer({
  audioReady,
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,
}) {
  return (
    <div className="core-mixer">
      <h3>Core Layers</h3>
      <p className="core-mixer-hint">
        Shape the Core engine by balancing low foundation, harmonic body, and
        atmospheric air.
      </p>

      <CoreLayerRow
        id="ground"
        label="Ground"
        layerState={coreLayers.ground}
        audioReady={audioReady}
        onGainChange={onLayerGainChange}
        onToggleMute={onLayerMuteToggle}
      />
      <CoreLayerRow
        id="harmony"
        label="Harmony"
        layerState={coreLayers.harmony}
        audioReady={audioReady}
        onGainChange={onLayerGainChange}
        onToggleMute={onLayerMuteToggle}
      />
      <CoreLayerRow
        id="atmos"
        label="Atmosphere"
        layerState={coreLayers.atmos}
        audioReady={audioReady}
        onGainChange={onLayerGainChange}
        onToggleMute={onLayerMuteToggle}
      />
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