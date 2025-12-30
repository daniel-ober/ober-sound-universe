// src/components/VoiceCard.jsx
import { OrbitMeter } from "./OrbitMeter";
import "./VoiceCard.css";

export function VoiceCard({
  id,
  name,
  description,
  audioReady,
  layerState,
  onGainChange,
  onToggleMute,
  supportsPattern = false,
  patternActive = false,
  onTogglePattern,
}) {
  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    onGainChange(id, value);
  };

  const handleMuteClick = () => {
    onToggleMute(id);
  };

  const handlePatternClick = () => {
    if (!supportsPattern || !onTogglePattern) return;
    onTogglePattern(id);
  };

  return (
    <div className="voice-card">
      <h3>{name}</h3>
      <p className="desc">{description}</p>
      <p className="status">
        Status: <strong>Placeholder engine</strong>
      </p>

      <div className="orbit-meter-block">
        <div className="orbit-meter-label-row">
          <span className="orbit-meter-label">Activity</span>
        </div>
        <OrbitMeter orbitId={id} audioReady={audioReady} />
      </div>

      {supportsPattern && (
        <div className="orbit-pattern-row">
          <button
            type="button"
            className={
              "orbit-pattern-btn" +
              (patternActive ? " orbit-pattern-btn--active" : "")
            }
            onClick={handlePatternClick}
            disabled={!audioReady}
          >
            {patternActive ? "Pattern: On" : "Pattern: Off"}
          </button>
        </div>
      )}

      <div className="orbit-mixer">
        <div className="orbit-mixer-label-row">
          <span className="orbit-mixer-label">Level</span>
          <span className="orbit-mixer-percent">{layerState.gain}%</span>
        </div>
        <div className="orbit-mixer-controls">
          <input
            type="range"
            min={0}
            max={100}
            value={layerState.gain}
            onChange={handleSliderChange}
            disabled={!audioReady}
            className="orbit-layer-slider"
          />
          <button
            type="button"
            onClick={handleMuteClick}
            disabled={!audioReady}
            className={
              "orbit-layer-mute-btn" +
              (layerState.muted ? " orbit-layer-mute-btn--active" : "")
            }
          >
            {layerState.muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>
    </div>
  );
}