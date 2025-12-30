// src/components/TopBar.jsx
import "./TopBar.css";
import { MasterMeter } from "./MasterMeter";
import { MasterSpectrum } from "./MasterSpectrum";

export function TopBar({
  audioReady,
  isPlayingDemo,
  onInitAudio,
  onPlayTestScene,
}) {
  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-main">Ober Instruments</span>
        <span className="brand-sub">
          Ober Sound Universe · Galaxy0 (dev)
        </span>
      </div>

      <div className="top-controls">
        <div className="top-controls-left">
          {!audioReady ? (
            <button className="primary-btn" onClick={onInitAudio}>
              Initialize Audio
            </button>
          ) : (
            <button
              className="secondary-btn"
              onClick={onPlayTestScene}
              disabled={isPlayingDemo}
            >
              {isPlayingDemo ? "Playing Scene…" : "Play Test Scene"}
            </button>
          )}

          <span className="hint">
            Play Core with your keyboard: A–K (C4 → C5)
          </span>
        </div>

        <div className="top-controls-right">
          <div className="top-output-label">Output</div>
          <MasterSpectrum audioReady={audioReady} />
          <MasterMeter audioReady={audioReady} />
        </div>
      </div>
    </header>
  );
}