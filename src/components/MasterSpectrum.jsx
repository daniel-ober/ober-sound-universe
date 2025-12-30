// src/components/MasterSpectrum.jsx
import { useEffect, useRef, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./MasterSpectrum.css";

/**
 * MasterSpectrum
 *
 * A small horizontal bar of ~24 frequency bins for the master output.
 * Uses requestAnimationFrame to query OMSE's getMasterSpectrum().
 */
export function MasterSpectrum({ audioReady }) {
  const [bars, setBars] = useState(() => new Array(24).fill(0));
  const rafRef = useRef(null);

  useEffect(() => {
    if (!audioReady) {
      setBars((prev) => prev.map(() => 0));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const update = () => {
      const spectrum = omseEngine.getMasterSpectrum();
      if (spectrum && spectrum.length) {
        const bucketSize = Math.floor(spectrum.length / bars.length) || 1;
        const next = new Array(bars.length).fill(0);

        for (let i = 0; i < bars.length; i++) {
          let sum = 0;
          let count = 0;
          const start = i * bucketSize;
          const end = Math.min(start + bucketSize, spectrum.length);

          for (let j = start; j < end; j++) {
            sum += spectrum[j];
            count++;
          }

          const avg = count ? sum / count : 0;
          next[i] = avg;
        }
        setBars(next);
      } else {
        setBars((prev) => prev.map(() => 0));
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady]);

  return (
    <div className="master-spectrum">
      {bars.map((v, idx) => (
        <div
          key={idx}
          className="master-spectrum-bar"
          style={{
            transform: `scaleY(${0.2 + v * 0.8})`,
            opacity: 0.3 + v * 0.7,
          }}
        />
      ))}
    </div>
  );
}