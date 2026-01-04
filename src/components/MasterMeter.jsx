// src/components/MasterMeter.jsx
import { useEffect, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./MasterMeter.css";

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function MasterMeter({ audioReady }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!audioReady) {
      setLevel(0);
      return;
    }

    let frameId = 0;
    let mounted = true;

    const loop = () => {
      if (!mounted) return;

      // 0–1 expected (clamped for safety)
      const v = clamp01(omseEngine.getMasterLevel());
      setLevel(v);

      frameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      mounted = false;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [audioReady]);

  return (
    <div className="master-meter" aria-label="Master output level">
      <div className="master-meter-track">
        <div
          className="master-meter-fill"
          style={{ transform: `scaleX(${level})` }}
        />
        <div className="master-meter-gloss" />
        <div className="master-meter-vignette" />
      </div>
    </div>
  );
}