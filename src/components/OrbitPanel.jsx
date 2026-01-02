// src/components/OrbitPanel.jsx
import "./OrbitPanel.css";
import { OrbitMeter } from "./OrbitMeter";

const ORBIT_META = [
  {
    id: "orbitA",
    label: "ORBIT A",
    subtitle: "First orbiting voice.",
    themeClass: "orbit-card--a",
  },
  {
    id: "orbitB",
    label: "ORBIT B",
    subtitle: "Second orbiting voice.",
    themeClass: "orbit-card--b",
  },
  {
    id: "orbitC",
    label: "ORBIT C",
    subtitle: "Third orbiting voice.",
    themeClass: "orbit-card--c",
  },
];

export function OrbitPanel({
  audioReady,
  orbitLayers,
  orbitPatterns,
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,
}) {
  return (
    <section className="orbits-column">
      <header className="orbits-header">
        <div>
          <h2 className="section-title">ORBIT VOICES</h2>
          <p className="section-subtitle">
            Three complementary engines that dance around the Core scene with
            polyrhythmic motion.
          </p>
        </div>

        <p className="status-line">
          <span className="status-label">Orbit status:</span>{" "}
          <span className={audioReady ? "status-ok" : "status-bad"}>
            {audioReady ? "READY" : "NOT INITIALIZED"}
          </span>
        </p>
      </header>

      <div className="orbit-cards">
        {ORBIT_META.map(({ id, label, subtitle, themeClass }) => {
          const layerState = orbitLayers?.[id] || { gain: 0, muted: false };
          const percent = Math.round(layerState.gain ?? 0);
          const patternOn = !!orbitPatterns?.[id];

          return (
            <article key={id} className={`orbit-card ${themeClass}`}>
              {/* TOP: Orb avatar + text */}
              <div className="orbit-card-top">
                <div className="orbit-orb-shell">
                  <div className="orbit-orb-backdrop" />
                  <div className="orbit-orb-core">
                    <OrbitMeter orbitId={id} audioReady={audioReady} />
                  </div>
                </div>

                <div className="orbit-card-text">
                  <span className="orbit-card-label">{label}</span>
                  <span className="orbit-card-subtitle">{subtitle}</span>
                  <div className="orbit-card-status-line">
                    <span className="orbit-card-status-label">Status</span>
                    <span className="orbit-card-status-value">
                      {audioReady ? "Engine active" : "Placeholder engine"}
                    </span>
                  </div>
                </div>
              </div>

              {/* MIDDLE: Pattern toggle */}
              <div className="orbit-card-row">
                <div className="orbit-card-row-left">
                  <span className="orbit-row-label">Pattern</span>
                </div>
                <div className="orbit-card-row-right">
                  <button
                    type="button"
                    disabled={!audioReady}
                    className={
                      "orbit-pill-button" + (patternOn ? " orbit-pill--on" : "")
                    }
                    onClick={() => onOrbitPatternToggle(id)}
                  >
                    {patternOn ? "On" : "Off"}
                  </button>
                </div>
              </div>

              {/* BOTTOM: Fader + mute */}
              <div className="orbit-card-controls">
                <div className="orbit-fader-shell">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={percent}
                    disabled={!audioReady}
                    onChange={(e) =>
                      onOrbitGainChange(id, Number(e.target.value))
                    }
                    className="orbit-fader"
                    orient="vertical"
                  />
                  <span className="orbit-fader-percent">{percent}%</span>
                </div>

                <button
                  type="button"
                  disabled={!audioReady}
                  onClick={() => onOrbitMuteToggle(id)}
                  className={
                    layerState.muted
                      ? "orbit-mute orbit-mute--active"
                      : "orbit-mute"
                  }
                >
                  {layerState.muted ? "Muted" : "Mute"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}