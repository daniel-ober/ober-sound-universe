// src/components/MasterSpectrum.jsx
import { useEffect, useMemo, useRef } from "react";
import { omseEngine } from "../engine/omseEngine";
import "./MasterSpectrum.css";

/**
 * Wide "Gravity Spectrum" rail renderer.
 *
 * This tries multiple engine methods so it works with whatever you already exposed:
 * - getMasterSpectrum()
 * - getSpectrum()
 * - getSpectrumData()
 * - getOutputSpectrum()
 *
 * Expected return:
 * - Float32Array in dB (e.g. -100..0), OR
 * - array/typed array in 0..1
 */
export function MasterSpectrum({ audioReady }) {
  const canvasRef = useRef(null);

  const getSpectrumFn = useMemo(() => {
    const candidates = [
      "getMasterSpectrum",
      "getSpectrum",
      "getSpectrumData",
      "getOutputSpectrum",
    ];

    for (const name of candidates) {
      if (typeof omseEngine?.[name] === "function") return omseEngine[name].bind(omseEngine);
    }
    return null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.floor(rect.width * dpr));
      const h = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const normalize = (arr) => {
      if (!arr || !arr.length) return null;

      // If it's dB-style values (usually negative), map -100..0 => 0..1
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < arr.length; i++) {
        const v = Number(arr[i]);
        if (!Number.isFinite(v)) continue;
        if (v < min) min = v;
        if (v > max) max = v;
      }

      // heuristic: dB arrays typically have max <= 0 and min < 0
      const looksDb = max <= 1 && min < 0;

      const out = new Float32Array(arr.length);
      if (looksDb) {
        const floor = -90;
        for (let i = 0; i < arr.length; i++) {
          const db = Number(arr[i]);
          const clamped = Math.max(floor, Math.min(0, Number.isFinite(db) ? db : floor));
          out[i] = (clamped - floor) / (0 - floor);
        }
      } else {
        for (let i = 0; i < arr.length; i++) {
          const v = Number(arr[i]);
          const n = Number.isFinite(v) ? v : 0;
          out[i] = Math.max(0, Math.min(1, n));
        }
      }
      return out;
    };

    const draw = () => {
      resize();

      const w = canvas.width;
      const h = canvas.height;

      // background fade (keeps it smooth)
      ctx.clearRect(0, 0, w, h);

      // idle if not ready / no method
      if (!audioReady || !getSpectrumFn) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const raw = getSpectrumFn();
      const bins = normalize(raw);

      if (!bins) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // bar styling
      const barCount = Math.min(120, Math.max(48, Math.floor(w / 18)));
      const step = Math.max(1, Math.floor(bins.length / barCount));

      const barGap = Math.max(2, Math.floor(w / (barCount * 9)));
      const barW = Math.max(2, Math.floor((w - barGap * (barCount - 1)) / barCount));

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0.0, "rgba(245, 190, 90, 0.95)");
      grad.addColorStop(0.35, "rgba(110, 220, 220, 0.95)");
      grad.addColorStop(0.7, "rgba(120, 160, 255, 0.95)");
      grad.addColorStop(1.0, "rgba(210, 120, 255, 0.95)");

      ctx.fillStyle = grad;

      let x = 0;
      for (let i = 0; i < barCount; i++) {
        // sample bins across spectrum
        const idx = i * step;
        let v = 0;
        // tiny local max for punch
        for (let j = 0; j < step; j++) {
          const vv = bins[idx + j] ?? 0;
          if (vv > v) v = vv;
        }

        // shaping curve
        const shaped = Math.pow(v, 0.75);

        const barH = Math.max(2, Math.floor(shaped * h));
        const y = Math.floor((h - barH) / 2);

        ctx.globalAlpha = 0.92;
        ctx.fillRect(x, y, barW, barH);

        x += barW + barGap;
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [audioReady, getSpectrumFn]);

  return <canvas ref={canvasRef} className="master-spectrum-canvas" />;
}