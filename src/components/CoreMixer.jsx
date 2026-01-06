// src/components/CoreMixer.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./CoreMixer.css";
import { CoreLayerMeter } from "./CoreLayerMeter";

const CORE_LAYERS_META = [
  {
    id: "ground",
    label: "GROUND",
    subtitle: "Warm Human Core",
    themeClass: "core-strip--ground",
    meterVariant: "ground",
  },
  {
    id: "harmony",
    label: "HARMONY",
    subtitle: "Harmonious Horizon",
    themeClass: "core-strip--harmony",
    meterVariant: "harmony",
  },
  {
    id: "atmosphere",
    label: "ATMOSPHERE",
    subtitle: "Ascending Spirit",
    themeClass: "core-strip--atmosphere",
    meterVariant: "atmosphere",
  },
];

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

/**
 * Your engine expects 0..1 normalized.
 * Your UI slider is 0..100 percent.
 *
 * This helper reads whatever coreLayers stores (some apps store 0..1, others store 0..100)
 * and converts it into a 0..100 UI percent.
 */
function toUiPercent(maybeGain) {
  const g = Number(maybeGain);
  if (!Number.isFinite(g)) return 0;

  // If state is already 0..100
  if (g > 1.01) return clamp(Math.round(g), 0, 100);

  // If state is 0..1
  return clamp(Math.round(g * 100), 0, 100);
}

function percentToNormalized(pct) {
  return clamp(pct, 0, 100) / 100;
}

export function CoreMixer({
  audioReady,
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,
  bannerUrl,
  sceneName,
}) {
  const bannerTitle = (sceneName || "CORE DAWN").toUpperCase();

  /**
   * Local slider state prevents parent re-render storms while dragging
   * AND prevents hammering the audio engine with every tiny movement.
   */
  const initialPercents = useMemo(() => {
    const out = {};
    for (const { id } of CORE_LAYERS_META) {
      out[id] = toUiPercent(coreLayers?.[id]?.gain);
    }
    return out;
  }, [coreLayers]);

  const [uiPercentByLayer, setUiPercentByLayer] = useState(initialPercents);

  // Keep UI in sync when coreLayers changes externally (preset swaps, etc.)
  useEffect(() => {
    setUiPercentByLayer((prev) => {
      const next = { ...prev };
      for (const { id } of CORE_LAYERS_META) {
        next[id] = toUiPercent(coreLayers?.[id]?.gain);
      }
      return next;
    });
  }, [coreLayers]);

  // Throttle engine calls to 1 per animation frame per layer
  const rafIdsRef = useRef({}); // layerId -> rafId
  const pendingRef = useRef({}); // layerId -> latestPercent

  const flushLayer = useCallback(
    (layerId) => {
      const pct = pendingRef.current[layerId];
      delete pendingRef.current[layerId];

      if (typeof onLayerGainChange === "function") {
        onLayerGainChange(layerId, percentToNormalized(pct));
      }
    },
    [onLayerGainChange]
  );

  const scheduleFlush = useCallback(
    (layerId, pct) => {
      pendingRef.current[layerId] = pct;

      if (rafIdsRef.current[layerId]) return;

      rafIdsRef.current[layerId] = requestAnimationFrame(() => {
        rafIdsRef.current[layerId] = null;
        flushLayer(layerId);
      });
    },
    [flushLayer]
  );

  // Cleanup any pending RAFs on unmount
  useEffect(() => {
    return () => {
      const ids = rafIdsRef.current || {};
      Object.keys(ids).forEach((k) => {
        const id = ids[k];
        if (id) cancelAnimationFrame(id);
      });
    };
  }, []);

  return (
    <div className="core-rack">
      <div
        className={"core-rack-banner" + (bannerUrl ? " has-banner-image" : "")}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
      >
        <div className="core-rack-banner-overlay">
          <div className="core-rack-banner-left">
            <span className="core-rack-banner-kicker">CORE SCENE</span>
            <span className="core-rack-banner-name">{bannerTitle}</span>
          </div>

          <span className="core-rack-banner-status">
            {audioReady ? "READY" : "NOT INITIALIZED"}
          </span>
        </div>
      </div>

      <header className="core-rack-header">
        <span className="core-rack-title">Core Layers</span>
        <span className="core-rack-hint">Balance foundation, harmony, and air</span>
      </header>

      <div className="core-rack-strips">
        {CORE_LAYERS_META.map(({ id, label, subtitle, themeClass, meterVariant }) => {
          const layerState = coreLayers?.[id] || { gain: 0, muted: false };
          const percent = uiPercentByLayer?.[id] ?? toUiPercent(layerState.gain);

          return (
            <div key={id} className={`core-strip ${themeClass}`}>
              <div className="core-strip-bg" />

              <div className="core-strip-inner">
                <div className="core-strip-text">
                  <span className="core-strip-label">{label}</span>
                  <span className="core-strip-name">{subtitle}</span>
                </div>

                <div className="core-strip-meta">
                  <span className="core-strip-percent">{percent}%</span>
                </div>
              </div>

              <div className="core-strip-meter">
                <CoreLayerMeter layerId={id} audioReady={audioReady} variant={meterVariant} />
              </div>

              <div className="core-strip-controls">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={percent}
                  disabled={!audioReady}
                  className="core-strip-slider"
                  onChange={(e) => {
                    const pct = clamp(Number(e.target.value), 0, 100);

                    // UI updates instantly
                    setUiPercentByLayer((prev) => ({ ...prev, [id]: pct }));

                    // Engine updates are throttled + normalized (0..1)
                    if (audioReady) scheduleFlush(id, pct);
                  }}
                  onMouseUp={() => {
                    // Commit final value on release (helps stability)
                    const pct = uiPercentByLayer?.[id] ?? percent;
                    if (audioReady) {
                      if (typeof onLayerGainChange === "function") {
                        onLayerGainChange(id, percentToNormalized(pct));
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    const pct = uiPercentByLayer?.[id] ?? percent;
                    if (audioReady) {
                      if (typeof onLayerGainChange === "function") {
                        onLayerGainChange(id, percentToNormalized(pct));
                      }
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={!audioReady}
                  onClick={() => onLayerMuteToggle(id)}
                  className={
                    layerState.muted
                      ? "core-strip-mute core-strip-mute--active"
                      : "core-strip-mute"
                  }
                >
                  {layerState.muted ? "Muted" : "Mute"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}