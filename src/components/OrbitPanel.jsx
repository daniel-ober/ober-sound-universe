// src/components/OrbitPanel.jsx
import { useMemo } from "react";
import "./OrbitPanel.css";
import { OrbitMeter } from "./OrbitMeter";

/**
 * MUSICAL TIME SIG OPTIONS (Curated)
 * ---------------------------------
 * We treat numerator as "pulses per MASTER cycle" (engine timing),
 * and denominator as a musical subdivision label (UI clarity).
 *
 * If presets load a value not listed, we still support it as a "Custom" option.
 */

const SUBDIVISION_LABEL = {
  2: "HALF NOTES",
  4: "QUARTER NOTES",
  8: "EIGHTH NOTES",
  16: "SIXTEENTH NOTES",
  32: "THIRTY-SECOND NOTES",
};

const TIME_SIG_GROUPS = [
  {
    label: "Simple (Quarter-note feel)",
    options: ["2/4", "3/4", "4/4", "5/4", "6/4", "7/4"],
  },
  {
    label: "Compound / Triplet feel (Eighth-note meters)",
    options: ["6/8", "9/8", "12/8"],
  },
  {
    label: "Odd / Asymmetric (Eighth-note meters)",
    options: ["5/8", "7/8", "11/8", "13/8"],
  },
];

function parseTimeSig(sig) {
  if (typeof sig !== "string") return { steps: 4, denom: 4 };
  const [a, b] = sig.split("/");
  const steps = Number.parseInt(a, 10);
  const denom = Number.parseInt(b, 10);
  return {
    steps: Number.isFinite(steps) ? steps : 4,
    denom: Number.isFinite(denom) ? denom : 4,
  };
}

function formatTimeSigLabel(sig) {
  const { denom } = parseTimeSig(sig);
  const denomLabel = SUBDIVISION_LABEL[denom] || `/${denom}`;
  return `${sig} — ${denomLabel}`;
}

function isInCuratedList(sig) {
  for (const g of TIME_SIG_GROUPS) {
    if (g.options.includes(sig)) return true;
  }
  return false;
}

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

// Helper: safe access + defaults
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
  orbitSceneOptions = [], // [{ id, label, description?, vibeTags? }]
  onOrbitSceneChange,

  // audio wired actions
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPanChange,

  // planning controls (wired in App)
  onOrbitTimeSigChange,
  onOrbitArpChange,
  onOrbitEnabledChange,
}) {
  const orbitStatusText = audioReady ? "READY" : "PLANNING MODE";

  const derived = useMemo(() => {
    const map = {};
    for (const o of ORBITS_META) map[o.id] = getOrbitState(orbitLayers, o.id);
    return map;
  }, [orbitLayers]);

  function handleOrbitSceneChange(nextId) {
    onOrbitSceneChange?.(nextId);
  }

  function handleTimeSigChange(orbitId, next) {
    onOrbitTimeSigChange?.(orbitId, next);
  }

  function handleArpChange(orbitId, next) {
    onOrbitArpChange?.(orbitId, next);
  }

  function handleEnabledToggle(orbitId, currentEnabled) {
    const next = !currentEnabled;
    onOrbitEnabledChange?.(orbitId, next);
  }

  // Build select options per-orbit, including a “Custom” value if needed
  function getTimeSigSelectOptions(currentValue) {
    const curatedHas = isInCuratedList(currentValue);
    return { curatedHas, currentValue };
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

          <p className="orbits-subtitle" style={{ marginTop: 6, opacity: 0.9 }}>
            <b>Musical note:</b> Denominator labels the subdivision (quarters/eighths/etc).{" "}
            <b>In OMSE, the numerator sets pulses per master cycle.</b>
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
                  <option key={p.id} value={p.id} title={p.description || ""}>
                    {p.label}
                  </option>
                ))
              ) : (
                <option value="">No orbit presets</option>
              )}
            </select>

            <div className="orbits-rack-hint">
              <span className="orbits-hint-dot" />
              <span>
                {onOrbitSceneChange ? "Orbit preset wired" : "UI ready (wire orbit preset selection in App)"}
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

          const timeSigValue = derived?.[id]?.timeSig ?? "4/4";
          const arpValue = derived?.[id]?.arp ?? "off";
          const enabledValue =
            typeof derived?.[id]?.enabled === "boolean" ? derived[id].enabled : true;

          const { curatedHas } = getTimeSigSelectOptions(timeSigValue);

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
                      onClick={() => handleEnabledToggle(id, enabledValue)}
                      title="Enable/disable this orbit"
                    >
                      {enabledValue ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="orbit-channel-desc">{subtitle}</div>

                  <div className="orbit-channel-status">
                    <span>STATUS</span>
                    <b>{audioReady ? "ENGINE ACTIVE" : "PLACEHOLDER"}</b>
                  </div>
                </div>
              </div>

              {/* Planning controls (reflect App state) */}
              <div className="orbit-channel-fields">
                <label className="orbit-mini-field">
                  <span>TIME SIG</span>
                  <select
                    className="orbits-select orbits-select--micro"
                    value={timeSigValue}
                    onChange={(e) => handleTimeSigChange(id, e.target.value)}
                    title="Denominator labels subdivision; numerator sets pulses per master cycle (OMSE)"
                  >
                    {!curatedHas && (
                      <option key={`custom-${timeSigValue}`} value={timeSigValue}>
                        {`Custom: ${formatTimeSigLabel(timeSigValue)}`}
                      </option>
                    )}

                    {TIME_SIG_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((sig) => (
                          <option key={sig} value={sig}>
                            {formatTimeSigLabel(sig)}
                          </option>
                        ))}
                      </optgroup>
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

              {/* Optional meter */}
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
                    onChange={(e) => onOrbitPanChange?.(id, clamp(e.target.value, -1, 1))}
                    disabled={!audioReady || !onOrbitPanChange}
                  />
                </div>

                <button
                  type="button"
                  className={"orbit-mute" + (state.muted ? " orbit-mute--active" : "")}
                  onClick={() => onOrbitMuteToggle?.(id)}
                  disabled={!audioReady || !onOrbitMuteToggle}
                >
                  {state.muted ? "UNMUTE" : "MUTE"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}