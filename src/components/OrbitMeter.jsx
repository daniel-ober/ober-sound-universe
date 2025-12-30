// src/components/OrbitMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./OrbitMeter.css";

export function OrbitMeter({ orbitId, audioReady }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let frameId;
    let running = true;

    const update = () => {
      if (!running) return;

      // If audio isn't ready, force level to 0
      const rawLevel = audioReady
        ? omseEngine.getOrbitLevel(orbitId)
        : 0;

      // Clamp to [0, 1] just in case
      const clamped = Math.max(0, Math.min(1, rawLevel));
      setLevel(clamped);

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [orbitId, audioReady]);

  const widthPercent = level * 100;

  return (
    <div className="orbit-meter">
      <div
        className="orbit-meter-inner"
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}