// src/components/OrbitMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";

/**
 * OrbitMeter
 *
 * Simple activity meter for an Orbit voice (A/B/C).
 * Uses the same FFT → dB mapping as the Core meters.
 *
 * Props:
 *  - orbitId: "orbitA" | "orbitB" | "orbitC"
 *  - audioReady: boolean
 */

export function OrbitMeter({ orbitId, audioReady }) {
  const [level, setLevel] = useState(0); // 0.0 – 1.0

  useEffect(() => {
    let frameId;

    if (!audioReady) {
      setLevel(0);
      return;
    }

    const update = () => {
      const fft = omseEngine.getOrbitFFT(orbitId);

      let nextLevel = 0;

      if (fft && fft.length) {
        // Tone FFT values are dB in roughly [-100, 0].
        // Strategy:
        //   • below -75 dB => treat as silence
        //   • map [-75, -30] to [0, 1]
        let maxDb = -Infinity;
        for (let i = 0; i < fft.length; i++) {
          if (fft[i] > maxDb) maxDb = fft[i];
        }
        if (!Number.isFinite(maxDb)) {
          maxDb = -100;
        }

        if (maxDb > -75) {
          const clamped = Math.min(-30, Math.max(-75, maxDb)); // -75 .. -30
          const normalized = (clamped + 75) / 45; // [-75, -30] => [0,1]
          nextLevel = normalized;
        } else {
          nextLevel = 0;
        }
      }

      // Smooth to avoid twitchiness (same smoothing as Core)
      setLevel((prev) => prev * 0.8 + nextLevel * 0.2);

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [orbitId, audioReady]);

  const widthPercent = Math.round(level * 100);

  return (
    <div className="core-layer-meter">
      <div
        className="core-layer-meter-inner"
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}