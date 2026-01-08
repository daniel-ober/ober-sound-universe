// src/components/RackPowerSwitch.jsx
import "./RackPowerSwitch.css";

export function RackPowerSwitch({ isOn, onToggle, disabled = false, statusText = "" }) {
  const on = Boolean(isOn);

  return (
    <div className={on ? "rackpower-shell on" : "rackpower-shell"}>
      <button
        type="button"
        className={on ? "rackpower-switch on" : "rackpower-switch"}
        onClick={onToggle}
        disabled={disabled}
        role="switch"
        aria-checked={on}
        aria-label={on ? "Power on" : "Power off"}
        title={on ? "Power Off" : "Power On"}
      >
        <span className="rackpower-plate" aria-hidden="true" />

        <span className="rackpower-ledwrap" aria-hidden="true">
          <span className={on ? "rackpower-led on" : "rackpower-led"} />
          <span className="rackpower-ledlabel">{on ? "ON" : "OFF"}</span>
        </span>

        <span className="rackpower-toggle" aria-hidden="true">
          <span className="rackpower-thumb" />
        </span>

        <span className="rackpower-text">
          <span className="rackpower-text-top">POWER</span>
          <span className="rackpower-text-bottom">{on ? "ENGAGED" : "DISENGAGED"}</span>
        </span>
      </button>

      <div className="rackpower-hint" title={statusText}>
        {statusText}
      </div>
    </div>
  );
}