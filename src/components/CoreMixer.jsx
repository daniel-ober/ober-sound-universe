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

function toUiPercent(maybeGain) {
  const g = Number(maybeGain);
  if (!Number.isFinite(g)) return 0;

  // already 0..100
  if (g > 1.01) return clamp(Math.round(g), 0, 100);

  // 0..1
  return clamp(Math.round(g * 100), 0, 100);
}

export function CoreMixer({
  audioReady,
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,

  // ✅ NEW
  corePresetOptionsByLayer = { ground: [], harmony: [], atmosphere: [] },
  coreLayerSourceMasterId = { ground: "", harmony: "", atmosphere: "" },
  onLayerPresetChange,

  bannerUrl,
  sceneName,
}) {
  const bannerTitle = (sceneName || "").toUpperCase();

  const initialPercents = useMemo(() => {
    const out = {};
    for (const { id } of CORE_LAYERS_META) {
      out[id] = toUiPercent(coreLayers?.[id]?.gain);
    }
    return out;
  }, [coreLayers]);

  const [uiPercentByLayer, setUiPercentByLayer] = useState(initialPercents);

  useEffect(() => {
    setUiPercentByLayer((prev) => {
      const next = { ...prev };
      for (const { id } of CORE_LAYERS_META) {
        next[id] = toUiPercent(coreLayers?.[id]?.gain);
      }
      return next;
    });
  }, [coreLayers]);

  // Throttle calls to parent (keeps UI smooth + reduces engine spam)
  const rafIdsRef = useRef({});
  const pendingRef = useRef({});

  const flushLayer = useCallback(
    (layerId) => {
      const pct = pendingRef.current[layerId];
      delete pendingRef.current[layerId];

      if (typeof onLayerGainChange === "function") {
        // ✅ IMPORTANT: App stores 0..100; engine normalizes
        onLayerGainChange(layerId, pct);
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

  useEffect(() => {
    return () => {
      const ids = rafIdsRef.current || {};
      Object.keys(ids).forEach((k) => {
        const id = ids[k];
        if (id) cancelAnimationFrame(id);
      });
    };
  }, []);

  const getSelectedLabel = (layerId) => {
    const selectedId = coreLayerSourceMasterId?.[layerId] || "";
    const opts = corePresetOptionsByLayer?.[layerId] || [];
    const found = opts.find((o) => o.id === selectedId);
    return found?.label || (selectedId ? selectedId : "Default");
  };

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

          const presetLabel = getSelectedLabel(id);
          const presetOptions = corePresetOptionsByLayer?.[id] || [];
          const selectedMasterId = coreLayerSourceMasterId?.[id] || "";

          return (
            <div key={id} className={`core-strip ${themeClass}`}>
              <div className="core-strip-bg" />

              <div className="core-strip-inner">
                <div className="core-strip-text">
                  <span className="core-strip-label">{label}</span>
                  <span className="core-strip-name">{subtitle}</span>
                </div>

                <div className="core-strip-meta">
                  <div className="core-strip-preset">
                    <span className="core-strip-preset-label">Preset</span>
                    <select
                      className="core-strip-preset-select"
                      disabled={!audioReady}
                      value={selectedMasterId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        if (typeof onLayerPresetChange === "function") {
                          onLayerPresetChange(id, nextId);
                        }
                      }}
                      aria-label={`${label} preset`}
                    >
                      {/* always include current value label */}
                      {!selectedMasterId ? (
                        <option value="">{presetLabel}</option>
                      ) : null}

                      {/* options (master preset names) */}
                      {presetOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

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

                    setUiPercentByLayer((prev) => ({ ...prev, [id]: pct }));

                    if (audioReady) scheduleFlush(id, pct);
                  }}
                  onMouseUp={() => {
                    const pct = uiPercentByLayer?.[id] ?? percent;
                    if (audioReady && typeof onLayerGainChange === "function") {
                      onLayerGainChange(id, pct);
                    }
                  }}
                  onTouchEnd={() => {
                    const pct = uiPercentByLayer?.[id] ?? percent;
                    if (audioReady && typeof onLayerGainChange === "function") {
                      onLayerGainChange(id, pct);
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