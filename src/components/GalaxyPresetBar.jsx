// src/components/GalaxyPresetBar.jsx
import "./GalaxyPresetBar.css";

const PRESET_LABELS = {
  presetA: "Preset A · Drift",
  presetB: "Preset B · Focus",
};

export function GalaxyPresetBar({ activePreset, onSelectPreset }) {
  return (
    <div className="galaxy-preset-shell">
      <div className="galaxy-preset-inner">
        <div className="galaxy-preset-left">
          <span className="galaxy-preset-label">Galaxy0 Core scene presets</span>
          <span className="galaxy-preset-name">
            {PRESET_LABELS[activePreset] ?? "Select a preset"}
          </span>
        </div>

        <div className="galaxy-preset-center">
          <div className="galaxy-preset-chip-row">
            {["presetA", "presetB"].map((id) => (
              <button
                key={id}
                type="button"
                className={
                  "galaxy-preset-chip" +
                  (activePreset === id ? " active" : "")
                }
                onClick={() => onSelectPreset(id)}
              >
                {PRESET_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        <div className="galaxy-preset-right">Output</div>
      </div>
    </div>
  );
}