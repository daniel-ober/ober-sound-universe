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
      const fn = omseEngine?.getCoreLayerLevel;
      const vRaw = typeof fn === "function" ? fn(layerId) : 0;

      const v =
        typeof vRaw === "number" && Number.isFinite(vRaw) ? vRaw : 0;

      // clamp 0..1 so CSS never gets NaN / weird transforms
      setLevel(Math.max(0, Math.min(1, v)));

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