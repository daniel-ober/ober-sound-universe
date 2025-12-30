// src/components/MasterMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./MasterMeter.css";

export function MasterMeter({ audioReady }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!audioReady) {
      setLevel(0);
      return;
    }

    let frameId;

    const update = () => {
      const val = omseEngine.getMasterLevel(); // 0–1
      setLevel(val);
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
      <span className="master-meter-label">Output</span>
      <div className="master-meter-bar">
        <div
          className="master-meter-bar-inner"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}