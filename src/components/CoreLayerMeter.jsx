// src/components/CoreLayerMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./CoreLayerMeter.css";

export function CoreLayerMeter({ layerId, audioReady }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!audioReady) {
      setLevel(0);
      return;
    }

    let frameId;

    const loop = () => {
      const v = omseEngine.getCoreLayerLevel(layerId); // 0–1
      setLevel(v);
      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [audioReady, layerId]);

  return (
    <div className="core-layer-meter">
      <div
        className="core-layer-meter-fill"
        style={{ transform: `scaleX(${level})` }}
      />
    </div>
  );
}