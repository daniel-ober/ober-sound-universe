// src/components/OrbitPanel.jsx
import React from "react";
import { VoiceCard } from "./VoiceCard";
import "./OrbitPanel.css";

export function OrbitPanel({
  audioReady,
  orbitLayers,
  orbitPatterns,
  onOrbitGainChange,
  onOrbitMuteToggle,
  onOrbitPatternToggle,
}) {
  return (
    <section className="orbits-column">
      <div className="orbits-header">
        <span className="eyebrow-label">Orbit Voices</span>
      </div>

      <div className="orbits-layout-row">
        {/* LEFT: Orbit Group Preset rack (visual for now) */}
        <section className="orbit-group-panel">
          <div className="orbit-group-title-bar">
            <span className="orbit-group-title">Orbit Group Preset</span>
            <div className="orbit-group-title-glow" />
          </div>

          <button className="orbit-group-main-preset" type="button">
            <span className="orbit-group-main-name">Prelude Spark</span>
            <span className="orbit-group-main-chevron">▾</span>
          </button>

          <div className="orbit-group-tool-row">
            <button className="orbit-tool-btn" type="button" />
            <button className="orbit-tool-btn" type="button" />
            <button className="orbit-tool-btn" type="button" />
            <button className="orbit-tool-btn" type="button" />
            <button className="orbit-tool-btn wide" type="button">
              UAS
            </button>
            <button className="orbit-tool-btn" type="button" />
          </div>

          <div className="orbit-group-pattern-list">
            <button className="orbit-pattern-strip" type="button">
              <span className="orbit-pattern-meter">6/4</span>
              <span className="orbit-pattern-name">Twilight Chime</span>
              <span className="orbit-pattern-chevron">▾</span>
            </button>
            <button className="orbit-pattern-strip" type="button">
              <span className="orbit-pattern-meter">5/4</span>
              <span className="orbit-pattern-name">Glass Pulse</span>
              <span className="orbit-pattern-chevron">▾</span>
            </button>
            <button className="orbit-pattern-strip" type="button">
              <span className="orbit-pattern-meter">7/4</span>
              <span className="orbit-pattern-name">Shimmer Drone</span>
              <span className="orbit-pattern-chevron">▾</span>
            </button>
          </div>

          <div className="orbit-mini-orbits-row">
            <div className="orbit-mini-orbit orbit-mini-a">
              <div className="orbit-mini-art" />
              <span className="orbit-mini-label">Orbit A</span>
            </div>
            <div className="orbit-mini-orbit orbit-mini-b">
              <div className="orbit-mini-art" />
              <span className="orbit-mini-label">Orbit B</span>
            </div>
            <div className="orbit-mini-orbit orbit-mini-c">
              <div className="orbit-mini-art" />
              <span className="orbit-mini-label">Orbit C</span>
            </div>
          </div>
        </section>

        {/* RIGHT: Orbit channel cards */}
        <section className="orbit-voices-rack">
          <VoiceCard
            id="orbitA"
            name="Orbit A"
            description="First orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitA}
            onGainChange={onOrbitGainChange}
            onToggleMute={onOrbitMuteToggle}
            supportsPattern
            patternActive={orbitPatterns.orbitA}
            onTogglePattern={onOrbitPatternToggle}
          />
          <VoiceCard
            id="orbitB"
            name="Orbit B"
            description="Second orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitB}
            onGainChange={onOrbitGainChange}
            onToggleMute={onOrbitMuteToggle}
            supportsPattern
            patternActive={orbitPatterns.orbitB}
            onTogglePattern={onOrbitPatternToggle}
          />
          <VoiceCard
            id="orbitC"
            name="Orbit C"
            description="Third orbiting voice."
            audioReady={audioReady}
            layerState={orbitLayers.orbitC}
            onGainChange={onOrbitGainChange}
            onToggleMute={onOrbitMuteToggle}
            supportsPattern
            patternActive={orbitPatterns.orbitC}
            onTogglePattern={onOrbitPatternToggle}
          />
        </section>
      </div>
    </section>
  );
}