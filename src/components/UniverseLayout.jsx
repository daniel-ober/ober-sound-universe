// src/components/UniverseLayout.jsx
import "./UniverseLayout.css";
import { CorePanel } from "./CorePanel";
import { OrbitPanel } from "./OrbitPanel";

export function UniverseLayout({
  audioReady,

  // Core
  coreLayers,
  onLayerGainChange,
  onLayerMuteToggle,

  // Orbits
  orbitLayers,
  orbitPatterns,
  orbitSceneId,
  orbitSceneOptions,
  onOrbitSceneChange,
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,
  onOrbitPanChange,
  onOrbitTimeSigChange,
  onOrbitArpChange,
  onOrbitEnabledChange,

  // ✅ NEW: voice preset wiring
  orbitVoiceOptions,
  onOrbitVoicePresetChange,

  // visuals
  bannerUrl,
}) {
  return (
    <main className="universe">
      <div className="universe-layout">
        <CorePanel
          audioReady={audioReady}
          coreLayers={coreLayers}
          onLayerGainChange={onLayerGainChange}
          onLayerMuteToggle={onLayerMuteToggle}
          bannerUrl={bannerUrl}
        />

        <OrbitPanel
          audioReady={audioReady}
          orbitLayers={orbitLayers}
          orbitPatterns={orbitPatterns}
          orbitSceneId={orbitSceneId}
          orbitSceneOptions={orbitSceneOptions}
          onOrbitSceneChange={onOrbitSceneChange}
          onOrbitGainChange={onOrbitGainChange}
          onOrbitMuteToggle={onOrbitMuteToggle}
          onOrbitPatternToggle={onOrbitPatternToggle}
          onOrbitPanChange={onOrbitPanChange}
          onOrbitTimeSigChange={onOrbitTimeSigChange}
          onOrbitArpChange={onOrbitArpChange}
          onOrbitEnabledChange={onOrbitEnabledChange}
          // ✅ NEW
          orbitVoiceOptions={orbitVoiceOptions}
          onOrbitVoicePresetChange={onOrbitVoicePresetChange}
        />
      </div>
    </main>
  );
}