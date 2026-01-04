// src/components/TopBar.jsx
import { useMemo } from "react";
import "./TopBar.css";
import { TempoKnob } from "./TempoKnob";

import {
  MASTER_PRESETS,
  GALAXY0_MASTER_PRESET_ORDER,
} from "../presets/masterPresets";

const TIME_SIG_OPTIONS = ["2/4", "3/4", "4/4", "5/4", "6/4", "7/4", "6/8", "7/8", "9/8", "12/8"];

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
  const presetOrder = useMemo(
    () => (GALAXY0_MASTER_PRESET_ORDER?.length ? GALAXY0_MASTER_PRESET_ORDER : Object.keys(galaxy0?.presets || {})),
    [galaxy0]
  );

  const resolvedPresetId = presetOrder.includes(activePreset) ? activePreset : presetOrder[0];
  const preset = galaxy0?.presets?.[resolvedPresetId] || null;

  const line1 =
    preset?.meta?.tagsLine
      ? `${galaxy0?.displayName || galaxy0?.name || "GALAXY0"} · ${preset.meta.tagsLine}`
      : galaxy0?.displayName || galaxy0?.name || "GALAXY0";

  const line2 =
    preset?.meta?.moodLine ||
    preset?.description ||
    galaxy0?.description ||
    "";

  return (
    <section className="topbar-shell">
      <div className="topbar-rail">
        {/* LEFT: Brand */}
        <div className="topbar-brand">
          <div className="topbar-eyebrow">OBER INSTRUMENTS</div>
          <div className="topbar-title">
            {galaxy0?.displayName || "GALAXY0 (DEV)"}
          </div>
        </div>

        {/* PRESET */}
        <div className="topbar-preset">
          <div className="topbar-label">MASTER PRESET</div>

          <select
            className="topbar-select"
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
                  {galaxy0?.displayName || "GALAXY0 (DEV)"} — {label}
                </option>
              );
            })}
          </select>

          <div className="topbar-preset-hint">
            <div className="topbar-hint-1">{line1}</div>
            <div className="topbar-hint-2">{line2}</div>
          </div>
        </div>

        {/* OUTPUT / CLOCK */}
        <div className="topbar-output">
          <div className="topbar-output-head">
            <div className="topbar-output-label">OUTPUT</div>
            <span className={controlsEnabled ? "topbar-dot ok" : "topbar-dot"} />
            <div className="topbar-meta">
              <span>BPM {masterBpm}</span>
              <span>SIG {masterTimeSig}</span>
            </div>
          </div>

          <div className="topbar-output-body">
            <div className="topbar-knob">
              <TempoKnob
                value={masterBpm}
                min={20}
                max={300}
                step={1}
                disabled={!controlsEnabled}
                onChange={(v) => onMasterTempoChange?.(v)}
              />
            </div>

            <div className="topbar-controls">
              <div className="topbar-mini-label">MASTER TIME SIG</div>
              <div className="topbar-row">
                <button
                  type="button"
                  className={masterSigLocked ? "topbar-chip locked" : "topbar-chip"}
                  onClick={onToggleMasterSigLocked}
                  disabled={!controlsEnabled}
                  title="Lock / unlock time signature"
                >
                  {masterSigLocked ? "LOCKED" : "UNLOCKED"}
                </button>

                <select
                  className="topbar-mini-select"
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
                  className="topbar-chip"
                  onClick={onResetMasterTimeSig}
                  disabled={!controlsEnabled}
                  title="Reset to 4/4 and lock"
                >
                  RESET 4/4
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* POWER */}
        <div className="topbar-power">
          <button
            type="button"
            className={isPowered ? "topbar-power-btn on" : "topbar-power-btn"}
            onClick={onTogglePower}
            title={isPowered ? "Power Off" : "Power On"}
          >
            <span className="topbar-power-icon" aria-hidden="true">⏻</span>
            <span className="topbar-power-text">
              {isPowered ? "POWER ON" : "POWER OFF"}
            </span>
          </button>

          <div className="topbar-power-hint">
            {isPowered ? (audioReady ? "Engine ready" : "Booting audio…") : "Instrument offline"}
          </div>
        </div>
      </div>

      <div className="topbar-engrave">
        Play Core with your keyboard: <strong>A–K</strong> (C4 → C5)
      </div>
    </section>
  );
}