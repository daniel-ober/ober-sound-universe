// src/components/OrbitPanel.jsx
import { useEffect, useMemo, useState } from "react";
import "./OrbitPanel.css";
import { OrbitMeter } from "./OrbitMeter";

const TIME_SIG_OPTIONS = ["4/4", "5/4", "6/4", "7/4", "9/8", "11/8"];

const ARP_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "up", label: "Up" },
  { id: "down", label: "Down" },
  { id: "upDown", label: "Up / Down" },
  { id: "downUp", label: "Down / Up" },
  { id: "random", label: "Random" },

  // extra “motion” flavors (UI only for now)
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

// Helper: safe access + defaults (supports older docs without timeSig/arp)
function getOrbitState(orbitLayers, orbitId) {
  const base = orbitLayers?.[orbitId] || {};
  return {
    gain: typeof base.gain === "number" ? base.gain : 0,
    muted: !!base.muted,
    pan: typeof base.pan === "number" ? base.pan : 0,
    timeSig: base.timeSig || "4/4",
    arp: base.arp || "off",
    enabled: typeof base.enabled === "boolean" ? base.enabled : true,
  };
}

function clamp(n, min, max) {
  const v = Number(n);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function OrbitPanel({
  audioReady,

  // current orbit state (from App / Firestore)
  orbitLayers,
  orbitPatterns,

  // orbit-scene preset (single source of truth)
  orbitSceneId,
  orbitSceneOptions = [], // [{ id, label, sig?, subtitle? }]
  onOrbitSceneChange,

  // audio wired actions
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,
  onOrbitPanChange,

  // planning controls (wire later if you want; UI still works)
  onOrbitTimeSigChange,
  onOrbitArpChange,
  onOrbitEnabledChange,
}) {
  const orbitStatusText = audioReady ? "READY" : "PLANNING MODE";

  // Derived orbit state from props (safe defaults)
  const derived = useMemo(() => {
    const map = {};
    for (const o of ORBITS_META) map[o.id] = getOrbitState(orbitLayers, o.id);
    return map;
  }, [orbitLayers]);

  // Local planning state so dropdowns always work + don’t depend on wiring
  const [localTimeSig, setLocalTimeSig] = useState({
    orbitA: "4/4",
    orbitB: "4/4",
    orbitC: "4/4",
  });

  const [localArp, setLocalArp] = useState({
    orbitA: "off",
    orbitB: "off",
    orbitC: "off",
  });

  const [localEnabled, setLocalEnabled] = useState({
    orbitA: true,
    orbitB: true,
    orbitC: true,
  });

  // keep local planning state aligned with existing data (without blocking user changes)
  useEffect(() => {
    setLocalTimeSig((prev) => ({
      orbitA: prev.orbitA ?? derived.orbitA.timeSig,
      orbitB: prev.orbitB ?? derived.orbitB.timeSig,
      orbitC: prev.orbitC ?? derived.orbitC.timeSig,
      ...prev,
    }));

    setLocalArp((prev) => ({
      orbitA: prev.orbitA ?? derived.orbitA.arp,
      orbitB: prev.orbitB ?? derived.orbitB.arp,
      orbitC: prev.orbitC ?? derived.orbitC.arp,
      ...prev,
    }));

    setLocalEnabled((prev) => ({
      orbitA: typeof prev.orbitA === "boolean" ? prev.orbitA : derived.orbitA.enabled,
      orbitB: typeof prev.orbitB === "boolean" ? prev.orbitB : derived.orbitB.enabled,
      orbitC: typeof prev.orbitC === "boolean" ? prev.orbitC : derived.orbitC.enabled,
      ...prev,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbitLayers]);

  function handleOrbitSceneChange(nextId) {
    onOrbitSceneChange?.(nextId);
  }

  // Planning controls: ALWAYS enabled
  function handleTimeSigChange(orbitId, next) {
    setLocalTimeSig((p) => ({ ...p, [orbitId]: next }));
    onOrbitTimeSigChange?.(orbitId, next);
  }

  function handleArpChange(orbitId, next) {
    setLocalArp((p) => ({ ...p, [orbitId]: next }));
    onOrbitArpChange?.(orbitId, next);
  }

  function handleEnabledToggle(orbitId) {
    setLocalEnabled((p) => {
      const next = !p[orbitId];
      onOrbitEnabledChange?.(orbitId, next);
      return { ...p, [orbitId]: next };
    });
  }

  return (
    <section className="orbits-column">
      {/* Header */}
      <div className="orbits-header">
        <div className="orbits-header-left">
          <h3 className="orbits-title">ORBIT VOICES</h3>
          <p className="orbits-subtitle">
            Orbit presets define the combined motion: which orbits are enabled,
            their time signatures, arp patterns, and mix.
          </p>
        </div>

        <div className="orbits-status">
          <span className="orbits-status-label">ORBIT STATUS:</span>
          <span className={audioReady ? "orbits-status-ok" : "orbits-status-bad"}>
            {orbitStatusText}
          </span>
        </div>
      </div>

      <div className="orbits-top-rule" />

      {/* TOP RACK: single orbit preset */}
      <div className="orbits-rack">
        <div className="orbits-rack-bar">
          <span className="orbits-rack-title">ORBIT PRESET</span>
          <span className="orbits-rack-chip">SCENE</span>
        </div>

        <div className="orbits-rack-body">
          <div className="orbits-rack-row">
            <select
              className="orbits-select"
              value={orbitSceneId || (orbitSceneOptions[0]?.id ?? "")}
              onChange={(e) => handleOrbitSceneChange(e.target.value)}
              disabled={!orbitSceneOptions?.length}
              title={
                orbitSceneOptions?.length
                  ? "Select an orbit scene preset"
                  : "No orbit presets loaded yet"
              }
            >
              {orbitSceneOptions?.length ? (
                orbitSceneOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sig ? `${p.sig} — ` : ""}{p.label}
                  </option>
                ))
              ) : (
                <option value="">No orbit presets</option>
              )}
            </select>

            <div className="orbits-rack-hint">
              <span className="orbits-hint-dot" />
              <span>
                {onOrbitSceneChange
                  ? "Orbit preset wired"
                  : "UI ready (wire orbit preset selection in App)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MIXER COLUMNS */}
      <div className="orbits-mixer-grid">
        {ORBITS_META.map(({ id, label, subtitle, badgeClass }) => {
          const state = getOrbitState(orbitLayers, id);
          const gain = clamp(state.gain, 0, 100);
          const pan = clamp(state.pan, -1, 1);
          const patternOn = !!orbitPatterns?.[id];

          // planned (always selectable)
          const timeSigValue = localTimeSig?.[id] ?? derived?.[id]?.timeSig ?? "4/4";
          const arpValue = localArp?.[id] ?? derived?.[id]?.arp ?? "off";
          const enabledValue = typeof localEnabled?.[id] === "boolean" ? localEnabled[id] : true;

          return (
            <article
              key={id}
              className={"orbit-channel" + (enabledValue ? "" : " orbit-channel--disabled")}
            >
              <div className="orbit-channel-sheen" />

              {/* Top */}
              <div className="orbit-channel-top">
                <div className={`orbit-badge ${badgeClass}`} />

                <div className="orbit-channel-meta">
                  <div className="orbit-channel-nameRow">
                    <div className="orbit-channel-name">{label}</div>

                    <button
                      type="button"
                      className={"orbit-enable" + (enabledValue ? " on" : " off")}
                      onClick={() => handleEnabledToggle(id)}
                      title="Enable/disable this orbit in the preset"
                    >
                      {enabledValue ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>

                  <div className="orbit-channel-desc">{subtitle}</div>

                  <div className="orbit-channel-status">
                    <span>STATUS</span>
                    <b>{audioReady ? "ENGINE ACTIVE" : "PLACEHOLDER"}</b>
                  </div>
                </div>
              </div>

              {/* Pattern Toggle (audio action) */}
              <button
                type="button"
                className={
                  "orbit-pill" + (patternOn ? " orbit-pill--on" : " orbit-pill--off")
                }
                onClick={() => onOrbitPatternToggle?.(id)}
                disabled={!audioReady || !onOrbitPatternToggle}
                title={audioReady ? "Toggle pattern" : "Initialize audio first"}
              >
                {patternOn ? "PATTERN: ON" : "PATTERN: OFF"}
              </button>

              {/* Planning controls (always enabled) */}
              <div className="orbit-channel-fields">
                <label className="orbit-mini-field">
                  <span>TIME SIG</span>
                  <select
                    className="orbits-select orbits-select--micro"
                    value={timeSigValue}
                    onChange={(e) => handleTimeSigChange(id, e.target.value)}
                  >
                    {TIME_SIG_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="orbit-mini-field">
                  <span>ARP</span>
                  <select
                    className="orbits-select orbits-select--micro"
                    value={arpValue}
                    onChange={(e) => handleArpChange(id, e.target.value)}
                  >
                    {ARP_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Optional meter (only meaningful when engine is live) */}
              <div className="orbit-meter-wrap">
                <OrbitMeter orbitId={id} audioReady={audioReady} />
              </div>

              {/* Audio mix controls */}
              <div className="orbit-channel-fader">
                <div className="orbit-readouts">
                  <div className="orbit-readout">
                    <span>GAIN</span>
                    <b>{gain}%</b>
                  </div>
                  <div className="orbit-readout">
                    <span>PAN</span>
                    <b>{pan.toFixed(2)}</b>
                  </div>
                </div>

                <input
                  className="orbit-slider-vert"
                  type="range"
                  min={0}
                  max={100}
                  value={gain}
                  onChange={(e) => onOrbitGainChange?.(id, clamp(e.target.value, 0, 100))}
                  disabled={!audioReady || !onOrbitGainChange}
                />

                <div className="orbit-pan">
                  <span className="orbit-pan-label">PAN</span>
                  <input
                    className="orbit-pan-slider"
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={pan}
                    onChange={(e) =>
                      onOrbitPanChange?.(id, clamp(e.target.value, -1, 1))
                    }
                    disabled={!audioReady || !onOrbitPanChange}
                  />
                </div>

                <button
                  type="button"
                  className={"orbit-mute" + (state.muted ? " orbit-mute--active" : "")}
                  onClick={() => onOrbitMuteToggle?.(id)}
                  disabled={!audioReady || !onOrbitMuteToggle}
                >
                  {state.muted ? "MUTED" : "MUTE"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}