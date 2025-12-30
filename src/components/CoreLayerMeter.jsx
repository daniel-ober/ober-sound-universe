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

    const update = () => {
      const val = omseEngine.getCoreLayerLevel(layerId); // 0–1
      setLevel(val);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [layerId, audioReady]);

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