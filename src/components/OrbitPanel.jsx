// src/components/OrbitPanel.jsx
import "./OrbitPanel.css";

const TIME_SIG_OPTIONS = ["4/4", "5/4", "6/4", "7/4", "9/8", "11/8"];

const ARP_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "pulse", label: "Pulse" },
  { id: "steps", label: "Steps" },
  { id: "glass", label: "Glass" },
  { id: "shimmer", label: "Shimmer" },
  { id: "drone", label: "Drone" },
];

const ORBITS_META = [
  {
    id: "orbitA",
    label: "ORBIT A",
    subtitle: "First orbiting voice.",
    badgeClass: "orbit-badge--a",
  },
  {
    id: "orbitB",
    label: "ORBIT B",
    subtitle: "Second orbiting voice.",
    badgeClass: "orbit-badge--b",
  },
  {
    id: "orbitC",
    label: "ORBIT C",
    subtitle: "Third orbiting voice.",
    badgeClass: "orbit-badge--c",
  },
];

// Helper: safe access + defaults (so your current data shape won’t break)
function getOrbitState(orbitLayers, orbitId) {
  const base = orbitLayers?.[orbitId] || {};
  return {
    gain: typeof base.gain === "number" ? base.gain : 0,
    muted: !!base.muted,
    timeSig: base.timeSig || "4/4",
    arp: base.arp || "off",
  };
}

export function OrbitPanel({
  audioReady,
  orbitLayers,
  orbitPatterns,
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,

  // Optional (wire later)
  onOrbitTimeSigChange,
  onOrbitArpChange,

  // Optional (wire later)
  orbitGroupMode,
  onOrbitGroupModeChange,
}) {
  const orbitStatusText = audioReady ? "READY" : "NOT INITIALIZED";

  return (
    <section className="orbits-column">
      {/* Header band (matches Core panel vibe) */}
      <div className="orbits-header">
        <div className="orbits-header-left">
          <h3 className="orbits-title">ORBIT VOICES</h3>
          <p className="orbits-subtitle">
            Three complementary engines that dance around the Core scene with
            polyrhythmic motion.
          </p>
        </div>

        <div className="orbits-header-right">
          <div className="orbits-status">
            <span className="orbits-status-label">ORBIT STATUS:</span>
            <span className={audioReady ? "orbits-status-ok" : "orbits-status-bad"}>
              {orbitStatusText}
            </span>
          </div>
        </div>
      </div>

      {/* 2-column layout: LEFT rack, RIGHT mixer */}
      <div className="orbits-body">
        {/* LEFT: Orbit group preset / pattern list module */}
        <aside className="orbits-left">
          <div className="orbits-rack">
            <div className="orbits-rack-bar">
              <span className="orbits-rack-title">ORBIT GROUP PRESET</span>
              <span className="orbits-rack-chip">UAS</span>
            </div>

            <div className="orbits-rack-row">
              <select
                className="orbits-select"
                value={orbitGroupMode || "tight"}
                onChange={(e) => onOrbitGroupModeChange?.(e.target.value)}
                disabled={!audioReady || !onOrbitGroupModeChange}
                title={
                  onOrbitGroupModeChange
                    ? "Select orbit group preset"
                    : "UI ready (wire group mode later)"
                }
              >
                <option value="tight">Tight</option>
                <option value="breathing">Breathing</option>
              </select>

              <div className="orbits-rack-hint">
                <span className="orbits-rack-hint-dot" />
                <span>
                  {onOrbitGroupModeChange
                    ? "Group preset wired"
                    : "UI ready (wire group mode later)"}
                </span>
              </div>
            </div>

            <div className="orbits-rack-divider" />

            {/* Pattern list rows (static for now — we’ll wire later) */}
            <div className="orbits-pattern-list">
              <button className="orbits-pattern-row" type="button" disabled={!audioReady}>
                <span className="orbits-pattern-sig">6/4</span>
                <span className="orbits-pattern-name">Twilight Chime</span>
                <span className="orbits-pattern-btn">›</span>
              </button>

              <button className="orbits-pattern-row" type="button" disabled={!audioReady}>
                <span className="orbits-pattern-sig">5/4</span>
                <span className="orbits-pattern-name">Glass Pulse</span>
                <span className="orbits-pattern-btn">›</span>
              </button>

              <button className="orbits-pattern-row" type="button" disabled={!audioReady}>
                <span className="orbits-pattern-sig">7/4</span>
                <span className="orbits-pattern-name">Shimmer Drone</span>
                <span className="orbits-pattern-btn">›</span>
              </button>
            </div>

            {/* Little “orbs” row (visual only for now) */}
            <div className="orbits-orb-row">
              <div className="orbits-orb" aria-hidden="true" />
              <div className="orbits-orb" aria-hidden="true" />
              <div className="orbits-orb" aria-hidden="true" />
            </div>
          </div>
        </aside>

        {/* RIGHT: Orbit A/B/C mixer stack */}
        <div className="orbits-right">
          <div className="orbits-mixer-head">
            <span className="orbits-mixer-title">ORBIT MIXER</span>
            <span className="orbits-mixer-sub">A / B / C</span>
          </div>

          <div className="orbits-mixer-stack">
            {ORBITS_META.map(({ id, label, subtitle, badgeClass }) => {
              const state = getOrbitState(orbitLayers, id);
              const percent = Math.round(state.gain ?? 0);
              const patternOn = !!orbitPatterns?.[id];

              return (
                <article key={id} className="orbit-strip">
                  <div className="orbit-strip-sheen" />

                  <div className="orbit-strip-top">
                    <div className={`orbit-badge ${badgeClass}`} />

                    <div className="orbit-strip-meta">
                      <div className="orbit-strip-name">{label}</div>
                      <div className="orbit-strip-desc">{subtitle}</div>
                      <div className="orbit-strip-status">
                        <span>STATUS</span>{" "}
                        <b>{audioReady ? "ENGINE ACTIVE" : "PLACEHOLDER ENGINE"}</b>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={"orbit-pill" + (patternOn ? " orbit-pill--on" : " orbit-pill--off")}
                      disabled={!audioReady}
                      onClick={() => onOrbitPatternToggle?.(id)}
                      title={audioReady ? "Toggle pattern" : "Initialize audio first"}
                    >
                      {patternOn ? "PATTERN: ON" : "PATTERN: OFF"}
                    </button>
                  </div>

                  <div className="orbit-strip-mid">
                    <div className="orbit-mini-field">
                      <span>TIME SIG</span>
                      <select
                        className="orbits-select orbits-select--micro"
                        value={state.timeSig}
                        disabled={!audioReady || !onOrbitTimeSigChange}
                        onChange={(e) => onOrbitTimeSigChange?.(id, e.target.value)}
                        title={
                          onOrbitTimeSigChange
                            ? "Set time signature"
                            : "UI ready (wire time signature later)"
                        }
                      >
                        {TIME_SIG_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="orbit-mini-field">
                      <span>ARP / PATTERN</span>
                      <select
                        className="orbits-select orbits-select--micro"
                        value={state.arp}
                        disabled={!audioReady || !onOrbitArpChange}
                        onChange={(e) => onOrbitArpChange?.(id, e.target.value)}
                        title={onOrbitArpChange ? "Set arp/pattern" : "UI ready (wire arp later)"}
                      >
                        {ARP_OPTIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="orbit-mini-meter" title="Signal (visual placeholder)">
                      <div
                        className="orbit-mini-meter-fill"
                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                      />
                    </div>

                    <div className="orbit-gain-readout">{percent}%</div>
                  </div>

                  <div className="orbit-strip-bottom">
                    <input
                      className="orbit-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={percent}
                      disabled={!audioReady}
                      onChange={(e) => onOrbitGainChange?.(id, Number(e.target.value))}
                    />

                    <button
                      type="button"
                      className={"orbit-mute" + (state.muted ? " orbit-mute--active" : "")}
                      disabled={!audioReady}
                      onClick={() => onOrbitMuteToggle?.(id)}
                    >
                      {state.muted ? "Muted" : "Mute"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}