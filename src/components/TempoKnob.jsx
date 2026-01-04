// src/components/TempoKnob.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./TempoKnob.css";

function clamp(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function TempoKnob({
  value,
  min = 20,
  max = 300,
  step = 1,
  onChange,
  disabled,
}) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ y: 0, v: value });

  const pct = useMemo(() => {
    const p = (clamp(value, min, max) - min) / (max - min);
    return Math.max(0, Math.min(1, p));
  }, [value, min, max]);

  const angle = useMemo(() => {
    // map 0..1 -> -135..135
    return -135 + pct * 270;
  }, [pct]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const dy = startRef.current.y - e.clientY; // drag up increases
      const delta = dy * 0.35; // sensitivity
      const next = clamp(startRef.current.v + delta, min, max);
      const snapped = Math.round(next / step) * step;
      onChange?.(snapped);
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, min, max, step, onChange]);

  const onMouseDown = (e) => {
    if (disabled) return;
    setDragging(true);
    startRef.current = { y: e.clientY, v: value };
  };

  // ✅ Removed preventDefault to avoid passive wheel warning
  const onWheel = (e) => {
    if (disabled) return;
    const dir = e.deltaY > 0 ? -1 : 1;
    const next = clamp(value + dir * step, min, max);
    onChange?.(next);
  };

  return (
    <div
      ref={ref}
      className={
        disabled
          ? "tempo-knob disabled"
          : dragging
          ? "tempo-knob dragging"
          : "tempo-knob"
      }
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={disabled ? -1 : 0}
    >
      <div className="tempo-knob-face">
        <div className="tempo-knob-ring" />
        <div className="tempo-knob-ticks" />
        <div
          className="tempo-knob-indicator"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span />
        </div>
        <div className="tempo-knob-readout">{value}</div>
      </div>

      <div className="tempo-knob-minmax">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}