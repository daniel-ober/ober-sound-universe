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
      const v = omseEngine.getOrbitLevel(orbitId); // 0–1
      setLevel(v);
      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [audioReady, orbitId]);

  return (
    <div className="orbit-meter">
      <div
        className="orbit-meter-fill"
        style={{ transform: `scaleX(${level})` }}
      />
    </div>
  );
}