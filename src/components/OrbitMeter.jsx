// src/components/OrbitMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./OrbitMeter.css";

export function OrbitMeter({ orbitId, audioReady }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!audioReady) {
      setLevel(0);
      return;
    }

    let frameId;

    const loop = () => {
      // defensive: if engine isn't ready yet, avoid NaN
      const vRaw = omseEngine?.getOrbitLevel?.(orbitId);
      const v = typeof vRaw === "number" && Number.isFinite(vRaw) ? vRaw : 0;
      setLevel(Math.max(0, Math.min(1, v)));
      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [audioReady, orbitId]);

  return (
    <div className="orbit-meter" aria-label={`Orbit meter ${orbitId}`}>
      <div className="orbit-meter-fill" style={{ transform: `scaleX(${level})` }} />
    </div>
  );
}