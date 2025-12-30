// src/components/GalaxyPresetBar.jsx
import "./GalaxyPresetBar.css";

const PRESET_LABELS = {
  presetA: "Preset A · Drift",
  presetB: "Preset B · Focus",
};

export function GalaxyPresetBar({ activePreset, onSelectPreset }) {
  return (
    <div className="galaxy-bar">
      <div className="galaxy-bar-left">
        <span className="galaxy-bar-title">Galaxy0</span>
        <span className="galaxy-bar-subtitle">Core scene presets</span>
      </div>

      <div className="galaxy-bar-presets">
        {["presetA", "presetB"].map((id) => (
          <button
            key={id}
            type="button"
            className={
              "galaxy-preset-pill" +
              (activePreset === id ? " galaxy-preset-pill--active" : "")
            }
            onClick={() => onSelectPreset(id)}
          >
            {PRESET_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}