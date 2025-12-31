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

    const loop = () => {
      const v = omseEngine.getMasterLevel(); // 0–1
      setLevel(v);
      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [audioReady]);

  return (
    <div className="master-meter">
      <div
        className="master-meter-fill"
        style={{ transform: `scaleX(${level})` }}
      />
    </div>
  );
}