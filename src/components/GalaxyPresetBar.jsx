// src/components/GalaxyPresetBar.jsx
import "./GalaxyPresetBar.css";
import {
  MASTER_PRESETS,
  GALAXY0_MASTER_PRESET_ORDER,
} from "../presets/masterPresets";

const galaxy0 = MASTER_PRESETS.galaxy0;

export function GalaxyPresetBar({ activePreset, onSelectPreset }) {
  const activeConfig = galaxy0.presets[activePreset];

  return (
    <div className="galaxy-preset-shell">
      <div className="galaxy-preset-inner">
        <div className="galaxy-preset-left">
          <span className="galaxy-preset-label">
            {galaxy0.displayName} master presets
          </span>
          <span className="galaxy-preset-name">
            {activeConfig ? activeConfig.label : "Select a preset"}
          </span>
        </div>

        <div className="galaxy-preset-center">
          <div className="galaxy-preset-chip-row">
            {GALAXY0_MASTER_PRESET_ORDER.map((id) => {
              const preset = galaxy0.presets[id];
              if (!preset) return null;

              return (
                <button
                  key={id}
                  type="button"
                  className={
                    "galaxy-preset-chip" +
                    (activePreset === id ? " active" : "")
                  }
                  onClick={() => onSelectPreset(id)}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="galaxy-preset-right">Output</div>
      </div>
    </div>
  );
}