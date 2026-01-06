// src/components/OrbitPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./OrbitPanel.css";
import { OrbitMeter } from "./OrbitMeter";
import { onOrbitPulse } from "../utils/orbitPulseBus";
import { Knob } from "./Knob";

/* -----------------------------
 * TIME SIGNATURE METADATA
 * ----------------------------- */

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
  return {
    steps: parseInt(a, 10) || 4,
    denom: parseInt(b, 10) || 4,
  };
}

function formatTimeSigLabel(sig) {
  const { denom } = parseTimeSig(sig);
  return `${sig} — ${SUBDIVISION_LABEL[denom] || denom}`;
}

function isInCuratedList(sig) {
  return TIME_SIG_GROUPS.some((g) => g.options.includes(sig));
}

/* -----------------------------
 * ARP OPTIONS
 * ----------------------------- */

const ARP_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "up", label: "Up" },
  { id: "down", label: "Down" },
  { id: "upDown", label: "Up / Down" },
  { id: "downUp", label: "Down / Up" },
  { id: "random", label: "Random" },
];

/* -----------------------------
 * ORBIT METADATA
 * ----------------------------- */

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

/* -----------------------------
 * HELPERS
 * ----------------------------- */

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function toNumOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getOrbitState(layers, id) {
  const o = layers?.[id] || {};
  return {
    // ✅ accept numbers OR numeric strings so UI always reflects reality
    gain: clamp(toNumOr(o.gain, 0), 0, 100),
    pan: clamp(toNumOr(o.pan, 0), -1, 1),
    muted: !!o.muted,
    enabled: o.enabled !== false,
    timeSig: o.timeSig || "4/4",
    arp: o.arp || "off",
    voicePresetId: o.voicePresetId || "",
  };
}

function formatGain(v) {
  return `${Math.round(v)}%`;
}

function formatPan(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "C";
  if (Math.abs(n) < 0.01) return "C";
  return n < 0 ? `L ${Math.round(Math.abs(n) * 100)}%` : `R ${Math.round(n * 100)}%`;
}

/* =============================
 * COMPONENT
 * ============================= */

export function OrbitPanel({
  audioReady,
  orbitLayers,
  orbitSceneId,
  orbitSceneOptions = [],
  onOrbitSceneChange,

  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPanChange,
  onOrbitTimeSigChange,
  onOrbitArpChange,
  onOrbitEnabledChange,

  orbitVoiceOptions = [], // [{ id, label }]
  onOrbitVoicePresetChange,
}) {
  const derived = useMemo(() => {
    const out = {};
    ORBITS_META.forEach((o) => {
      out[o.id] = getOrbitState(orbitLayers, o.id);
    });
    return out;
  }, [orbitLayers]);

  /* -----------------------------
   * VISUAL PULSE HANDLING
   * ----------------------------- */

  const [panelFlash, setPanelFlash] = useState(false);
  const [badgePulse, setBadgePulse] = useState({});
  const flashTimer = useRef(null);
  const badgeTimers = useRef({});

  useEffect(() => {
    const off = onOrbitPulse((evt) => {
      if (!evt) return;

      if (evt.type === "allResolve") {
        setPanelFlash(true);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setPanelFlash(false), 500);
      }

      if (evt.type === "orbitRevolution" && evt.orbitId) {
        setBadgePulse((p) => ({ ...p, [evt.orbitId]: true }));
        clearTimeout(badgeTimers.current[evt.orbitId]);
        badgeTimers.current[evt.orbitId] = setTimeout(() => {
          setBadgePulse((p) => ({ ...p, [evt.orbitId]: false }));
        }, 500);
      }
    });

    return () => off?.();
  }, []);

  return (
    <section className={`orbits-column ${panelFlash ? "orbits-column--flash" : ""}`}>
      {/* ORBIT PRESET */}
      <div className="orbits-rack">
        <div className="orbits-rack-bar">
          <span className="orbits-rack-title">ORBIT PRESET</span>
          <span className="orbits-rack-chip">SCENE</span>
        </div>

        <div className="orbits-rack-body">
          <select
            className="orbits-select"
            value={orbitSceneId}
            onChange={(e) => onOrbitSceneChange?.(e.target.value)}
          >
            {orbitSceneOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ORBIT CHANNELS */}
      <div className="orbits-mixer-grid">
        {ORBITS_META.map(({ id, label, subtitle, badgeClass }) => {
          const s = derived[id];
          const curatedHas = isInCuratedList(s.timeSig);
          const disabled = !audioReady || !s.enabled;

          return (
            <article
              key={id}
              className={`orbit-channel ${!s.enabled ? "orbit-channel--disabled" : ""}`}
            >
              <div className="orbit-channel-top">
                <div
                  className={`orbit-badge ${badgeClass} ${
                    badgePulse[id] ? "orbit-badge--pulse" : ""
                  }`}
                />
                <div className="orbit-channel-meta">
                  <div className="orbit-channel-nameRow">
                    <div className="orbit-channel-name">{label}</div>
                    <button
                      className={`orbit-enable ${s.enabled ? "on" : "off"}`}
                      onClick={() => onOrbitEnabledChange?.(id, !s.enabled)}
                    >
                      {s.enabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="orbit-channel-desc">{subtitle}</div>
                </div>
              </div>

              {/* FIELDS */}
              <div className="orbit-channel-fields">
                {/* VOICE */}
                <label className="orbit-mini-field">
                  <span>VOICE</span>
                  <select
                    className="orbits-select orbits-select--micro"
                    value={s.voicePresetId || ""}
                    onChange={(e) => onOrbitVoicePresetChange?.(id, e.target.value || null)}
                    title="Changes the actual Tone instrument used for this orbit"
                    disabled={disabled}
                  >
                    <option value="">Default</option>
                    {orbitVoiceOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label || v.id}
                      </option>
                    ))}
                  </select>
                </label>

                {/* TIME SIG */}
                <label className="orbit-mini-field">
                  <span>TIME SIG</span>
                  <select
                    className="orbits-select orbits-select--micro"
                    value={s.timeSig}
                    onChange={(e) => onOrbitTimeSigChange?.(id, e.target.value)}
                    disabled={disabled}
                  >
                    {!curatedHas && (
                      <option value={s.timeSig}>Custom: {formatTimeSigLabel(s.timeSig)}</option>
                    )}
                    {TIME_SIG_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map((sig) => (
                          <option key={sig} value={sig}>
                            {formatTimeSigLabel(sig)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                {/* ARP */}
                <label className="orbit-mini-field">
                  <span>ARP</span>
                  <select
                    className="orbits-select orbits-select--micro"
                    value={s.arp}
                    onChange={(e) => onOrbitArpChange?.(id, e.target.value)}
                    disabled={disabled}
                  >
                    {ARP_OPTIONS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="orbit-meter-wrap">
                <OrbitMeter orbitId={id} audioReady={audioReady} />
              </div>

              {/* MIX (KNOBS) */}
              <div className="orbit-channel-fader">
                <div className="orbit-knob-row">
                  <Knob
                    label="GAIN"
                    min={0}
                    max={100}
                    step={1}
                    value={s.gain}
                    disabled={disabled}
                    onChange={(v) => onOrbitGainChange?.(id, v)} // ✅ number
                    formatValue={formatGain}
                  />

                  <Knob
                    label="PAN"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={s.pan}
                    disabled={disabled}
                    onChange={(v) => onOrbitPanChange?.(id, v)} // ✅ number
                    formatValue={formatPan}
                  />
                </div>

                <button
                  className={`orbit-mute ${s.muted ? "orbit-mute--active" : ""}`}
                  onClick={() => onOrbitMuteToggle?.(id)}
                  disabled={!audioReady}
                >
                  {s.muted ? "UNMUTE" : "MUTE"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}