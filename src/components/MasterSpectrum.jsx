// src/components/MasterSpectrum.jsx
import { useEffect, useRef, useState } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./MasterSpectrum.css";

/**
 * MasterSpectrum
 *
 * A small horizontal bar of ~24 frequency bins for the master output.
 * Uses requestAnimationFrame to query OMSE's getMasterSpectrum().
 *
 * ✅ Defensive:
 *  - Never hard-crashes if getMasterSpectrum is missing / engine not ready
 *  - Sanitizes values to finite numbers
 *  - Clamps values to 0..1
 */
export function MasterSpectrum({ audioReady }) {
  const BAR_COUNT = 24;

  const [bars, setBars] = useState(() => new Array(BAR_COUNT).fill(0));
  const rafRef = useRef(null);

  useEffect(() => {
    // always cancel any prior loop
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // if not ready, show zeros and stop
    if (!audioReady) {
      setBars(new Array(BAR_COUNT).fill(0));
      rafRef.current = null;
      return;
    }

    const update = () => {
      // ✅ SAFE: method might not exist yet
      const fn = omseEngine?.getMasterSpectrum;
      const raw = typeof fn === "function" ? fn() : [];

      // ✅ SAFE: spectrum may be non-array
      const spectrum = Array.isArray(raw) ? raw : [];

      if (spectrum.length) {
        const next = new Array(BAR_COUNT).fill(0);

        // bucket spectrum bins down to BAR_COUNT bars
        const bucketSize = Math.max(1, Math.floor(spectrum.length / BAR_COUNT));

        for (let i = 0; i < BAR_COUNT; i++) {
          const start = i * bucketSize;
          const end = Math.min(start + bucketSize, spectrum.length);

          let sum = 0;
          let count = 0;

          for (let j = start; j < end; j++) {
            const v = spectrum[j];
            if (typeof v === "number" && Number.isFinite(v)) {
              sum += v;
              count++;
            }
          }

          let avg = count ? sum / count : 0;

          // ✅ clamp to 0..1 (prevents NaN / huge values blowing up CSS)
          if (!Number.isFinite(avg)) avg = 0;
          avg = Math.max(0, Math.min(1, avg));

          next[i] = avg;
        }

        setBars(next);
      } else {
        setBars(new Array(BAR_COUNT).fill(0));
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [audioReady]);

  return (
    <div className="master-spectrum">
      {bars.map((v, idx) => {
        // ✅ safe visuals (v is already clamped 0..1)
        const scale = 0.2 + v * 0.8;
        const opacity = 0.25 + v * 0.75;

        return (
          <div
            key={idx}
            className="master-spectrum-bar"
            style={{
              transform: `scaleY(${scale})`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}