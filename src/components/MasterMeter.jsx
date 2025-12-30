// src/components/MasterMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";

/**
 * MasterMeter
 *
 * Global output meter for the whole engine (Core + Orbits).
 * Uses the same FFT→dB mapping as other meters, but with slightly
 * stronger smoothing so it feels like a single "breathing" bar.
 */

export function MasterMeter({ audioReady }) {
  const [level, setLevel] = useState(0); // 0–1

  useEffect(() => {
    let frameId;

    if (!audioReady) {
      setLevel(0);
      return;
    }

    const update = () => {
      const fft = omseEngine.getMasterFFT();
      let nextLevel = 0;

      if (fft && fft.length) {
        let maxDb = -Infinity;
        for (let i = 0; i < fft.length; i++) {
          if (fft[i] > maxDb) maxDb = fft[i];
        }
        if (!Number.isFinite(maxDb)) {
          maxDb = -100;
        }

        if (maxDb > -75) {
          const clamped = Math.min(-30, Math.max(-75, maxDb)); // -75..-30
          const normalized = (clamped + 75) / 45; // => 0..1
          nextLevel = normalized;
        } else {
          nextLevel = 0;
        }
      }

      // Slightly gentler smoothing than per-layer meters
      setLevel((prev) => prev * 0.85 + nextLevel * 0.15);

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [audioReady]);

  const widthPercent = Math.round(level * 100);

  return (
    <div className="master-meter">
      <div className="master-meter-label">Output</div>
      <div className="master-meter-bar">
        <div
          className="master-meter-bar-inner"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}