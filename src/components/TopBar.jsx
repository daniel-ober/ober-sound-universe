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
    <div className="topbar-shell">
      <header className="topbar-inner">
        <div className="topbar-left">
          <span className="topbar-product">Ober Instruments</span>
          <span className="topbar-galaxy">
            Ober Sound Universe · Galaxy0 (dev)
          </span>
        </div>

        <div className="topbar-center">
          Play Core with your keyboard: A–K (C4 → C5)
        </div>

        <div className="topbar-right">
          {!audioReady ? (
            <button
              type="button"
              className="topbar-btn primary"
              onClick={onInitAudio}
            >
              Initialize Audio
            </button>
          ) : (
            <button
              type="button"
              className={
                "topbar-btn" + (isPlayingDemo ? " disabled" : "")
              }
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