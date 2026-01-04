// src/components/CoreMixer.jsx
import "./CoreMixer.css";
import { CoreLayerMeter } from "./CoreLayerMeter";

const CORE_LAYERS_META = [
  {
    id: "ground",
    label: "GROUND",
    subtitle: "Warm Human Core",
    themeClass: "core-strip--ground",
    meterVariant: "ground",
  },
  {
    id: "harmony",
    label: "HARMONY",
    subtitle: "Harmonious Horizon",
    themeClass: "core-strip--harmony",
    meterVariant: "harmony",
  },
  {
    id: "atmosphere",
    label: "ATMOSPHERE",
    subtitle: "Ascending Spirit",
    themeClass: "core-strip--atmosphere",
    meterVariant: "atmosphere",
  },
];

export function CoreMixer({
  audioReady,
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,

  bannerUrl,
  sceneName,
}) {
  const bannerTitle = (sceneName || "CORE DAWN").toUpperCase();

  return (
    <div className="core-rack">
      <div
        className={"core-rack-banner" + (bannerUrl ? " has-banner-image" : "")}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
      >
        <div className="core-rack-banner-overlay">
          <div className="core-rack-banner-left">
            <span className="core-rack-banner-kicker">CORE SCENE</span>
            <span className="core-rack-banner-name">{bannerTitle}</span>
          </div>

          <span className="core-rack-banner-status">
            {audioReady ? "READY" : "NOT INITIALIZED"}
          </span>
        </div>
      </div>

      <header className="core-rack-header">
        <span className="core-rack-title">Core Layers</span>
        <span className="core-rack-hint">Balance foundation, harmony, and air</span>
      </header>

      <div className="core-rack-strips">
        {CORE_LAYERS_META.map(({ id, label, subtitle, themeClass, meterVariant }) => {
          const layerState = coreLayers?.[id] || { gain: 0, muted: false };
          const percent = Math.round(layerState.gain ?? 0);

          return (
            <div key={id} className={`core-strip ${themeClass}`}>
              <div className="core-strip-bg" />

              <div className="core-strip-inner">
                <div className="core-strip-text">
                  <span className="core-strip-label">{label}</span>
                  <span className="core-strip-name">{subtitle}</span>
                </div>

                <div className="core-strip-meta">
                  <span className="core-strip-percent">{percent}%</span>
                </div>
              </div>

              {/* Polished per-layer output analyzer */}
              <div className="core-strip-meter">
                <CoreLayerMeter
                  layerId={id}
                  audioReady={audioReady}
                  variant={meterVariant}
                />
              </div>

              <div className="core-strip-controls">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={percent}
                  disabled={!audioReady}
                  onChange={(e) => onLayerGainChange(id, Number(e.target.value))}
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