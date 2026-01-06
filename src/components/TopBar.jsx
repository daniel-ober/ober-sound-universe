// src/components/TopBar.jsx
import { useMemo } from "react";
import "./TopBar.css";
import { TempoKnob } from "./TempoKnob";

import { MASTER_PRESETS, GALAXY0_MASTER_PRESET_ORDER } from "../presets/master/masterPresets";

const TIME_SIG_OPTIONS = [
  "2/4",
  "3/4",
  "4/4",
  "5/4",
  "6/4",
  "7/4",
  "6/8",
  "7/8",
  "9/8",
  "12/8",
];

export function TopBar({
  // Power
  isPowered,
  onTogglePower,
  audioReady,

  // Master clock
  masterBpm,
  onMasterTempoChange,
  masterTimeSig,
  onMasterTimeSigChange,
  masterSigLocked,
  onToggleMasterSigLocked,
  onResetMasterTimeSig,

  // Master preset (Galaxy0 only)
  activePreset,
  onSelectPreset,
}) {
  const controlsEnabled = Boolean(isPowered && audioReady);

  const galaxy0 = MASTER_PRESETS.galaxy0;

  const presetOrder = useMemo(() => {
    const list =
      GALAXY0_MASTER_PRESET_ORDER?.length
        ? GALAXY0_MASTER_PRESET_ORDER
        : Object.keys(galaxy0?.presets || {});
    return list.filter(Boolean);
  }, [galaxy0]);

  const resolvedPresetId = presetOrder.includes(activePreset)
    ? activePreset
    : presetOrder[0] || "presetA";

  const preset = galaxy0?.presets?.[resolvedPresetId] || null;

  const title = galaxy0?.displayName || galaxy0?.name || "GALAXY0 (DEV)";
  const presetLabel = preset?.label || resolvedPresetId;

  const line1 =
    preset?.meta?.tagsLine
      ? `${title} · ${preset.meta.tagsLine}`
      : title;

  const line2 = preset?.meta?.moodLine || preset?.description || galaxy0?.description || "";

  // Rack-style status
  const statusLabel = isPowered ? (audioReady ? "READY" : "BOOTING") : "OFFLINE";
  const statusClass = isPowered ? (audioReady ? "ok" : "warn") : "off";

  return (
    <section className="topbar-v2" aria-label="Master Control Strip">
      <div className="topbar-v2-rail">
        {/* LEFT: Brand */}
        <div className="tb2-cell tb2-brand">
          <div className="tb2-eyebrow">OBER INSTRUMENTS</div>
          <div className="tb2-title">{title}</div>
          <div className="tb2-subtitle">Master Control Strip</div>

          <div className="tb2-status">
            <span className={`tb2-led ${statusClass}`} aria-hidden="true" />
            <span className="tb2-status-text">{statusLabel}</span>
          </div>
        </div>

        {/* PRESET */}
        <div className="tb2-cell tb2-preset">
          <div className="tb2-head">
            <div className="tb2-label">MASTER PRESET</div>
            <div className="tb2-pill">{presetLabel.toUpperCase()}</div>
          </div>

          <select
            className="tb2-select"
            value={resolvedPresetId}
            onChange={(e) => onSelectPreset?.(e.target.value)}
            disabled={!isPowered}
            aria-label="Master preset"
          >
            {presetOrder.map((pid) => {
              const p = galaxy0?.presets?.[pid];
              const label = p?.label || pid;
              return (
                <option key={pid} value={pid}>
                  {title} — {label}
                </option>
              );
            })}
          </select>

          <div className="tb2-hint" title={line2}>
            <div className="tb2-hint-1">{line1}</div>
            <div className="tb2-hint-2">{line2}</div>
          </div>
        </div>

        {/* CLOCK / OUTPUT */}
        <div className="tb2-cell tb2-clock">
          <div className="tb2-head tb2-head-row">
            <div className="tb2-label">CLOCK / OUTPUT</div>
            <div className="tb2-meta">
              <span>BPM {masterBpm}</span>
              <span>SIG {masterTimeSig}</span>
            </div>
          </div>

          <div className="tb2-clock-body">
            <div className="tb2-knob">
              <TempoKnob
                value={masterBpm}
                min={20}
                max={300}
                step={1}
                disabled={!controlsEnabled}
                onChange={(v) => onMasterTempoChange?.(v)}
              />
            </div>

            <div className="tb2-controls">
              <div className="tb2-mini-label">MASTER TIME SIG</div>
              <div className="tb2-row">
                <button
                  type="button"
                  className={masterSigLocked ? "tb2-chip locked" : "tb2-chip"}
                  onClick={onToggleMasterSigLocked}
                  disabled={!controlsEnabled}
                  aria-pressed={masterSigLocked}
                  title="Lock / unlock time signature"
                >
                  {masterSigLocked ? "LOCKED" : "UNLOCKED"}
                </button>

                <select
                  className="tb2-mini-select"
                  value={masterTimeSig}
                  disabled={!controlsEnabled || masterSigLocked}
                  onChange={(e) => onMasterTimeSigChange?.(e.target.value)}
                  aria-label="Master time signature"
                >
                  {TIME_SIG_OPTIONS.map((sig) => (
                    <option key={sig} value={sig}>
                      {sig}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="tb2-chip"
                  onClick={onResetMasterTimeSig}
                  disabled={!controlsEnabled}
                  title="Reset to 4/4 and lock"
                >
                  RESET 4/4
                </button>
              </div>

              <div className="tb2-micro">
                <span className={`tb2-dot ${controlsEnabled ? "ok" : ""}`} aria-hidden="true" />
                <span className="tb2-micro-text">
                  {controlsEnabled ? "Clock live" : isPowered ? "Waiting for audio…" : "Instrument offline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* POWER */}
        <div className="tb2-cell tb2-power">
          <div className="tb2-label">POWER</div>

          <button
            type="button"
            className={isPowered ? "tb2-switch on" : "tb2-switch"}
            onClick={onTogglePower}
            aria-pressed={isPowered}
            title={isPowered ? "Power Off" : "Power On"}
          >
            <span className="tb2-switch-track" aria-hidden="true">
              <span className="tb2-switch-screw left" />
              <span className="tb2-switch-screw right" />
              <span className="tb2-switch-knob" />
            </span>

            <span className="tb2-switch-text">
              <span className="tb2-switch-state">{isPowered ? "ON" : "OFF"}</span>
              <span className="tb2-switch-sub">{isPowered ? "Powered" : "Bypass"}</span>
            </span>

            <span className="tb2-power-led-wrap" aria-hidden="true">
              <span className={controlsEnabled ? "tb2-power-led ok" : isPowered ? "tb2-power-led warn" : "tb2-power-led"} />
            </span>
          </button>

          <div className="tb2-power-hint">
            {isPowered ? (audioReady ? "Engine ready" : "Booting audio…") : "Instrument offline"}
          </div>
        </div>
      </div>

      <div className="tb2-engrave">
        Play Core with your keyboard: <strong>A–K</strong> (C4 → C5)
      </div>
    </section>
  );
}