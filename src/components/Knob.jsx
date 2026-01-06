// src/components/Knob.jsx
import "./Knob.css";

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  formatValue,
}) {
  const v = clamp(value, min, max);
  const pct = max === min ? 0 : (v - min) / (max - min);
  const angle = -135 + pct * 270; // -135° to +135° sweep

  return (
    <div className={`knob ${disabled ? "knob--disabled" : ""}`}>
      {label ? <div className="knob-label">{label}</div> : null}

      <div className="knob-body" aria-hidden="true">
        <div className="knob-face">
          <div className="knob-indicator" style={{ transform: `rotate(${angle}deg)` }} />
          <div className="knob-center" />
        </div>
      </div>

      <input
        className="knob-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        aria-label={label || "Knob"}
      />

      <div className="knob-readout">{formatValue ? formatValue(v) : v}</div>
    </div>
  );
}