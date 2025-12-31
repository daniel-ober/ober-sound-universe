// src/components/CoreMixer.jsx
import "./CoreMixer.css";
import { CoreLayerMeter } from "./CoreLayerMeter";

const CORE_LAYERS_META = [
  {
    id: "ground",
    label: "GROUND",
    subtitle: "Warm Human Core",
    themeClass: "core-strip--ground",
  },
  {
    id: "harmony",
    label: "HARMONY",
    subtitle: "Harmonious Horizon",
    themeClass: "core-strip--harmony",
  },
  {
    id: "atmosphere",
    label: "ATMOSPHERE",
    subtitle: "Ascending Spirit",
    themeClass: "core-strip--atmosphere",
  },
];

export function CoreMixer({
  audioReady,
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,
  bannerUrl,          // 👈 new: master preset banner
}) {
  return (
    <div className="core-rack">
      {/* ✨ Master preset banner (uses PNG if provided) */}
      <div
        className={
          "core-rack-banner" + (bannerUrl ? " has-banner-image" : "")
        }
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
      >
        <div className="core-rack-banner-overlay">
          <span className="core-rack-banner-title">CORE SCENE</span>
          <span className="core-rack-banner-status">
            {audioReady ? "READY" : "NOT INITIALIZED"}
          </span>
        </div>
      </div>

      {/* thin sub-header like “MASTER PRESET” bar */}
      <header className="core-rack-header">
        <span className="core-rack-title">Core Layers</span>
      </header>

      <div className="core-rack-strips">
        {CORE_LAYERS_META.map(({ id, label, subtitle, themeClass }) => {
          const layerState = coreLayers?.[id] || { gain: 0, muted: false };
          const percent = Math.round(layerState.gain ?? 0);

          return (
            <div key={id} className={`core-strip ${themeClass}`}>
              {/* gradient spectrum underlay */}
              <div className="core-strip-bg" />

              {/* glass top bar with label + name + percent */}
              <div className="core-strip-inner">
                <div className="core-strip-text">
                  <span className="core-strip-label">{label}</span>
                  <span className="core-strip-name">{subtitle}</span>
                </div>

                <div className="core-strip-meta">
                  <span className="core-strip-percent">{percent}%</span>
                </div>
              </div>

              {/* animated level meter between title band + controls */}
              <CoreLayerMeter layerId={id} audioReady={audioReady} />

              {/* controls row – slider + mute */}
              <div className="core-strip-controls">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={percent}
                  disabled={!audioReady}
                  onChange={(e) =>
                    onLayerGainChange(id, Number(e.target.value))
                  }
                  className="core-strip-slider"
                />

                <button
                  type="button"
                  disabled={!audioReady}
                  onClick={() => onLayerMuteToggle(id)}
                  className={
                    layerState.muted
                      ? "core-strip-mute core-strip-mute--active"
                      : "core-strip-mute"
                  }
                >
                  {layerState.muted ? "Muted" : "Mute"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}