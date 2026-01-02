// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { omseEngine } from "./engine/omseEngine";

import { TopBar } from "./components/TopBar";
import { GalaxyPresetBar } from "./components/GalaxyPresetBar";
import { UniverseLayout } from "./components/UniverseLayout";

import { MASTER_PRESETS } from "./presets/masterPresets";
import "./App.css";

const galaxy0 = MASTER_PRESETS.galaxy0;

const KEY_TO_NOTE = {
  a: "C4",
  s: "D4",
  d: "E4",
  f: "F4",
  g: "G4",
  h: "A4",
  j: "B4",
  k: "C5",
};

// ✅ canonical defaults (match engine + CoreMixer ids)
const DEFAULT_CORE = {
  ground: { gain: 0, muted: false },
  harmony: { gain: 0, muted: false },
  atmosphere: { gain: 0, muted: false },
};

const DEFAULT_ORBITS = {
  orbitA: { gain: 0, muted: false },
  orbitB: { gain: 0, muted: false },
  orbitC: { gain: 0, muted: false },
};

const DEFAULT_PATTERNS = {
  orbitA: false,
  orbitB: false,
  orbitC: false,
};

/**
 * Ensure we always have the shape we expect
 * (prevents Object.entries(undefined) + handles older preset keys like "atmos")
 */
function normalizePreset(preset) {
  const safe = preset ?? {};

  // allow legacy "atmos" key
  const coreIn = safe.core ?? {};
  const atmosphereFromLegacy =
    coreIn.atmosphere ??
    coreIn.atmos ??
    DEFAULT_CORE.atmosphere;

  const core = {
    ground: coreIn.ground ?? DEFAULT_CORE.ground,
    harmony: coreIn.harmony ?? DEFAULT_CORE.harmony,
    atmosphere: atmosphereFromLegacy,
  };

  const orbitsIn = safe.orbits ?? {};
  const orbits = {
    orbitA: orbitsIn.orbitA ?? DEFAULT_ORBITS.orbitA,
    orbitB: orbitsIn.orbitB ?? DEFAULT_ORBITS.orbitB,
    orbitC: orbitsIn.orbitC ?? DEFAULT_ORBITS.orbitC,
  };

  const patternsIn = safe.orbitPatterns ?? {};
  const orbitPatterns = {
    orbitA: patternsIn.orbitA ?? DEFAULT_PATTERNS.orbitA,
    orbitB: patternsIn.orbitB ?? DEFAULT_PATTERNS.orbitB,
    orbitC: patternsIn.orbitC ?? DEFAULT_PATTERNS.orbitC,
  };

  return {
    ...safe,
    core,
    orbits,
    orbitPatterns,
  };
}

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  // active master preset id (presetA … presetE)
  const [activePreset, setActivePreset] = useState(
    galaxy0.defaultPresetId ?? "presetA"
  );

  // grab raw preset config
  const rawActivePresetConfig = galaxy0.presets?.[activePreset];

  // ✅ normalized active preset (always safe)
  const activePresetConfig = useMemo(
    () => normalizePreset(rawActivePresetConfig),
    [rawActivePresetConfig]
  );

  const bannerUrl = activePresetConfig?.banner ?? null;

  // core / orbit / pattern state (initialized from active preset)
  const [coreLayers, setCoreLayers] = useState(activePresetConfig.core);
  const [orbitLayers, setOrbitLayers] = useState(activePresetConfig.orbits);
  const [orbitPatterns, setOrbitPatterns] = useState(
    activePresetConfig.orbitPatterns
  );

  // If active preset changes (via bar), update local state shape safely
  useEffect(() => {
    setCoreLayers(activePresetConfig.core);
    setOrbitLayers(activePresetConfig.orbits);
    setOrbitPatterns(activePresetConfig.orbitPatterns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreset]);

  // -------------------------------
  // Keyboard → Core voice
  // -------------------------------
  useEffect(() => {
    const downKeys = new Set();

    const handleKeyDown = (e) => {
      if (!audioReady) return;
      const key = e.key.toLowerCase();
      if (!KEY_TO_NOTE[key]) return;
      if (downKeys.has(key)) return;

      downKeys.add(key);
      omseEngine.noteOn("core", KEY_TO_NOTE[key]);
    };

    const handleKeyUp = (e) => {
      if (!audioReady) return;
      const key = e.key.toLowerCase();
      if (!KEY_TO_NOTE[key]) return;

      downKeys.delete(key);
      omseEngine.noteOff("core", KEY_TO_NOTE[key]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      downKeys.clear();
    };
  }, [audioReady]);

  // -------------------------------
  // Sync UI state → engine
  // -------------------------------
  const syncToEngine = (coreState, orbitState, patternState) => {
    if (!audioReady) return;

    const coreSafe = coreState ?? DEFAULT_CORE;
    const orbitSafe = orbitState ?? DEFAULT_ORBITS;
    const patternSafe = patternState ?? DEFAULT_PATTERNS;

    // Core layers
    Object.entries(coreSafe).forEach(([layerId, layer]) => {
      const gain = typeof layer?.gain === "number" ? layer.gain : 0;
      omseEngine.setCoreLayerGain(layerId, gain / 100);
      omseEngine.setCoreLayerMute(layerId, !!layer?.muted);
    });

    // Orbits
    Object.entries(orbitSafe).forEach(([orbitId, layer]) => {
      const gain = typeof layer?.gain === "number" ? layer.gain : 0;
      omseEngine.setOrbitGain(orbitId, gain / 100);
      omseEngine.setOrbitMute(orbitId, !!layer?.muted);
    });

    // Orbit patterns
    Object.entries(patternSafe).forEach(([orbitId, isOn]) => {
      if (isOn) omseEngine.startOrbitPattern(orbitId);
      else omseEngine.stopOrbitPattern(orbitId);
    });
  };

  // -------------------------------
  // Top-level controls
  // -------------------------------
  const handleInitAudio = async () => {
    await omseEngine.startAudioContext();
    setAudioReady(true);

    // Sync whatever the UI currently holds (safe shapes)
    const normalizedNow = normalizePreset({
      core: coreLayers,
      orbits: orbitLayers,
      orbitPatterns,
    });

    syncToEngine(
      normalizedNow.core,
      normalizedNow.orbits,
      normalizedNow.orbitPatterns
    );
  };

  const handlePlayTestScene = async () => {
    if (!audioReady) return;
    setIsPlayingDemo(true);
    await omseEngine.playTestScene();
    setTimeout(() => setIsPlayingDemo(false), 9000);
  };

  const handleApplyPreset = (presetId) => {
    const raw = galaxy0.presets?.[presetId];
    if (!raw) return;

    const preset = normalizePreset(raw);

    setActivePreset(presetId);
    setCoreLayers(preset.core);
    setOrbitLayers(preset.orbits);
    setOrbitPatterns(preset.orbitPatterns);

    syncToEngine(preset.core, preset.orbits, preset.orbitPatterns);
  };

  // -------------------------------
  // Core mixer handlers
  // -------------------------------
  const handleLayerGainChange = (layerId, newPercent) => {
    setCoreLayers((prev) => {
      const safePrev = prev ?? DEFAULT_CORE;
      const current = safePrev[layerId] ?? { gain: 0, muted: false };

      const next = {
        ...safePrev,
        [layerId]: { ...current, gain: newPercent },
      };

      syncToEngine(next, orbitLayers, orbitPatterns);
      return next;
    });
  };

  const handleLayerMuteToggle = (layerId) => {
    setCoreLayers((prev) => {
      const safePrev = prev ?? DEFAULT_CORE;
      const current = safePrev[layerId] ?? { gain: 0, muted: false };

      const next = {
        ...safePrev,
        [layerId]: { ...current, muted: !current.muted },
      };

      syncToEngine(next, orbitLayers, orbitPatterns);
      return next;
    });
  };

  // -------------------------------
  // Orbit mixer handlers
  // -------------------------------
  const handleOrbitGainChange = (orbitId, newPercent) => {
    setOrbitLayers((prev) => {
      const safePrev = prev ?? DEFAULT_ORBITS;
      const current = safePrev[orbitId] ?? { gain: 0, muted: false };

      const next = {
        ...safePrev,
        [orbitId]: { ...current, gain: newPercent },
      };

      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitMuteToggle = (orbitId) => {
    setOrbitLayers((prev) => {
      const safePrev = prev ?? DEFAULT_ORBITS;
      const current = safePrev[orbitId] ?? { gain: 0, muted: false };

      const next = {
        ...safePrev,
        [orbitId]: { ...current, muted: !current.muted },
      };

      syncToEngine(coreLayers, next, orbitPatterns);
      return next;
    });
  };

  const handleOrbitPatternToggle = (orbitId) => {
    if (!audioReady) return;

    setOrbitPatterns((prev) => {
      const safePrev = prev ?? DEFAULT_PATTERNS;
      const next = { ...safePrev, [orbitId]: !safePrev[orbitId] };
      syncToEngine(coreLayers, orbitLayers, next);
      return next;
    });
  };

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <div className="app-root">
      <div className="instrument-frame skin-image">
        <div className="instrument-inner">
          <div className="instrument-grid">
            {/* TOP: brand / transport / preset bars */}
            <div className="instrument-row-top">
              <TopBar
                audioReady={audioReady}
                isPlayingDemo={isPlayingDemo}
                onInitAudio={handleInitAudio}
                onPlayTestScene={handlePlayTestScene}
              />

              <GalaxyPresetBar
                activePreset={activePreset}
                onSelectPreset={handleApplyPreset}
              />
            </div>

            {/* GRAVITY SPECTRUM STRIP */}
            <section className="instrument-row-spectrum">
              <section className="gravity-spectrum-shell">
                <div className="gravity-spectrum-inner">
                  <div className="gravity-spectrum-header">
                    <span>Galaxy 0 · Output</span>
                  </div>
                  <div className="gravity-spectrum-rail" />
                  <div className="gravity-spectrum-tag">Gravity Spectrum</div>
                </div>
              </section>
            </section>

            {/* MAIN: Core (left) + Orbits (right) */}
            <UniverseLayout
              audioReady={audioReady}
              coreLayers={coreLayers}
              orbitLayers={orbitLayers}
              orbitPatterns={orbitPatterns}
              onLayerGainChange={handleLayerGainChange}
              onLayerMuteToggle={handleLayerMuteToggle}
              onOrbitGainChange={handleOrbitGainChange}
              onOrbitMuteToggle={handleOrbitMuteToggle}
              onOrbitPatternToggle={handleOrbitPatternToggle}
              bannerUrl={bannerUrl}
            />

            {/* BOTTOM: future mixer / transport row */}
            <section className="instrument-row-bottom">{/* TODO */}</section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;