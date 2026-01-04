// src/components/CoreLayerMeter.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./CoreLayerMeter.css";

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/**
 * Polished per-layer output analyzer:
 *  - Smooth RMS-style bar (0..1)
 *  - Peak marker w/ short hold + gentle decay
 *  - Theme-aware gradient (ground/harmony/atmosphere)
 */
export function CoreLayerMeter({ layerId, audioReady, variant = "neutral" }) {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);

  const rafRef = useRef(null);
  const lastTRef = useRef(0);

  const cls = useMemo(() => {
    const v = String(variant || "neutral").toLowerCase();
    return `core-layer-meter core-layer-meter--${v}`;
  }, [variant]);

  useEffect(() => {
    if (!audioReady) {
      setLevel(0);
      setPeak(0);
      lastTRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let mounted = true;

    const loop = (t) => {
      if (!mounted) return;

      const dt = lastTRef.current ? (t - lastTRef.current) / 1000 : 0;
      lastTRef.current = t;

      const fn = omseEngine?.getCoreLayerLevel;
      const raw = typeof fn === "function" ? fn(layerId) : 0;
      const v = clamp01(raw);

      // Smooth the displayed bar a bit (feels more "pro" than raw jitter)
      setLevel((prev) => {
        // quick attack, slower release
        const attack = 0.55;
        const release = 0.12;
        const k = v > prev ? attack : release;
        return clamp01(prev + (v - prev) * k);
      });

      // Peak marker: hold briefly then decay
      setPeak((prevPeak) => {
        const nextPeak = Math.max(prevPeak, v);
        if (v >= prevPeak) return nextPeak;

        // decay ~0.9/sec (tunable)
        const decayPerSec = 0.9;
        const decayed = prevPeak - decayPerSec * Math.max(0, dt);
        return clamp01(Math.max(v, decayed));
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioReady, layerId]);

  return (
    <div className={cls} aria-label={`Core layer meter: ${layerId}`}>
      <div className="core-layer-meter-rail">
        <div
          className="core-layer-meter-fill"
          style={{ transform: `scaleX(${level})` }}
        />
        <div
          className="core-layer-meter-peak"
          style={{ left: `${peak * 100}%` }}
        />
        <div className="core-layer-meter-gloss" />
      </div>
    </div>
  );
}