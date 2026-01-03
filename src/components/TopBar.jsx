// src/components/TopBar.jsx
import "./TopBar.css";
import { MasterMeter } from "./MasterMeter";
import { MasterSpectrum } from "./MasterSpectrum";

const TIME_SIG_OPTIONS = ["4/4", "3/4", "5/4", "6/8", "7/8", "9/8", "12/8"];

export function TopBar({
  audioReady,
  isPlayingDemo,
  onInitAudio,
  onPlayTestScene,

  masterBpm,
  onMasterTempoChange,

  masterTimeSig,
  onMasterTimeSigChange,
  masterSigLocked,
  onToggleMasterSigLocked,
  onResetMasterTimeSig,

  masterCycleMeasures,
  onMasterCycleMeasuresChange,
}) {
  return (
    <div className="topbar-shell">
      <header className="topbar-inner">
        <div className="topbar-left">
          <span className="topbar-product">Ober Instruments</span>
          <span className="topbar-galaxy">Ober Sound Universe · Galaxy0 (dev)</span>
        </div>

        <div className="topbar-center">
          <div className="topbar-helper">Play Core with your keyboard: A–K (C4 → C5)</div>

          <div className="topbar-master">
            <div className="topbar-master-block">
              <div className="topbar-master-label">Master BPM</div>
              <div className="topbar-bpm-row">
                <input
                  className="topbar-bpm-range"
                  type="range"
                  min="20"
                  max="300"
                  step="1"
                  value={masterBpm}
                  onChange={(e) => onMasterTempoChange?.(e.target.value)}
                  disabled={!audioReady}
                />
                <input
                  className="topbar-bpm-input"
                  type="number"
                  min="20"
                  max="300"
                  step="1"
                  value={masterBpm}
                  onChange={(e) => onMasterTempoChange?.(e.target.value)}
                  disabled={!audioReady}
                />
              </div>
            </div>

            <div className="topbar-master-block compact">
              <div className="topbar-master-label">Master Time Sig</div>
              <div className="topbar-sig-row">
                <button
                  type="button"
                  className={"topbar-pill" + (masterSigLocked ? " locked" : " unlocked")}
                  onClick={onToggleMasterSigLocked}
                  title={masterSigLocked ? "Locked to 4/4 (click to unlock)" : "Unlocked (click to lock)"}
                >
                  {masterSigLocked ? "Locked" : "Unlocked"}
                </button>

                <select
                  className="topbar-sig-select"
                  value={masterTimeSig}
                  onChange={(e) => onMasterTimeSigChange?.(e.target.value)}
                  disabled={!audioReady || masterSigLocked}
                  title={masterSigLocked ? "Unlock to change time signature" : "Set master time signature"}
                >
                  {TIME_SIG_OPTIONS.map((sig) => (
                    <option key={sig} value={sig}>
                      {sig}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="topbar-pill reset"
                  onClick={onResetMasterTimeSig}
                  disabled={!audioReady}
                  title="Reset master time signature to 4/4 and lock"
                >
                  Reset 4/4
                </button>
              </div>
            </div>

            <div className="topbar-master-block compact">
              <div className="topbar-master-label">Cycle</div>
              <div className="topbar-cycle-row">
                <span className="topbar-cycle-hint">Measures</span>
                <input
                  className="topbar-cycle-input"
                  type="number"
                  min="1"
                  max="64"
                  step="1"
                  value={masterCycleMeasures}
                  onChange={(e) => onMasterCycleMeasuresChange?.(e.target.value)}
                  disabled={!audioReady}
                />
              </div>
              <div className="topbar-cycle-sub">Orbits divide this cycle into pulses</div>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          {!audioReady ? (
            <button type="button" className="topbar-btn primary" onClick={onInitAudio}>
              Initialize Audio
            </button>
          ) : (
            <button
              type="button"
              className={"topbar-btn" + (isPlayingDemo ? " disabled" : "")}
              onClick={onPlayTestScene}
              disabled={isPlayingDemo}
            >
              {isPlayingDemo ? "Playing Scene…" : "Play Test Scene"}
            </button>
          )}

          <div className="topbar-output">
            <span className="topbar-output-label">Output</span>
            <div className="topbar-output-spectrum">
              <MasterSpectrum audioReady={audioReady} />
            </div>
            <div className="topbar-output-meter">
              <MasterMeter audioReady={audioReady} />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}