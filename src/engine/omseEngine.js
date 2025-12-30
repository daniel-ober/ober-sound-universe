// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * OMSE - Ober MotionSynth Engine (prototype)
 *
 * Core:
 *  - 3-layer Core voice:
 *      • ground  = deep low foundation (sine, one octave down)
 *      • harmony = mid-range musical body (sawtooth, original pitch)
 *      • atmos   = airy pad + pink noise wash (original pitch)
 *  - Core layers route into a Core buss, which feeds the master buss.
 *
 * Orbits:
 *  - orbitA / orbitB / orbitC are simple placeholder synth voices for now,
 *    each with their own gain + mute controls and FFT analyser.
 *
 * Controls:
 *  - Per-layer gain and mute control for Core layers.
 *  - Per-orbit gain and mute control.
 *  - Per-layer FFT analysers for Core meters.
 *  - Per-orbit FFT analysers for Orbit meters.
 *  - noteOn/noteOff for Core + Orbits.
 *  - playTestScene uses all three Core layers + Orbits.
 */

class OMSEEngine {
  constructor() {
    this.initialized = false;
    this.started = false;

    // Global routing
    this.masterGain = null;
    this.reverb = null;

    // Core layered voice
    this.core = {
      bussGain: null,
      layers: {
        ground: null,
        harmony: null,
        atmos: null,
      },
    };

    // Orbit voices
    this.voices = {
      orbitA: null,
      orbitB: null,
      orbitC: null,
    };
  }

  async init() {
    if (this.initialized) return;

    // ----- MASTER BUS -----
    this.masterGain = new Tone.Gain(0.9).toDestination();

    this.reverb = new Tone.Reverb({
      decay: 6,
      wet: 0.25,
    }).connect(this.masterGain);

    // ----- CORE BUSS -----
    this.core.bussGain = new Tone.Gain(1.0);
    this.core.bussGain.connect(this.reverb);

    // Helper: create a core layer synth (ground / harmony)
    const makeCoreLayer = ({
      oscType = "sine",
      attack = 0.3,
      decay = 0.5,
      release = 3,
      initialGain = 0.8,
    }) => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscType },
        envelope: {
          attack,
          decay,
          sustain: 0.9,
          release,
        },
      });

      const gain = new Tone.Gain(initialGain);
      synth.connect(gain);

      // FFT analyser for this layer
      const analyser = new Tone.Analyser("fft", 64);
      gain.connect(analyser);

      // Route to Core buss
      gain.connect(this.core.bussGain);

      return {
        synth,
        gain,
        analyser,
        baseGain: initialGain,
        muted: false,
      };
    };

    // ----- CORE LAYERS -----

    // Ground — deep, smooth low foundation (sine; we play it one octave down)
    this.core.layers.ground = makeCoreLayer({
      oscType: "sine",
      attack: 0.4,
      decay: 0.5,
      release: 4,
      initialGain: 0.9,
    });

    // Harmony — brighter mid-range body (sawtooth at played pitch)
    this.core.layers.harmony = makeCoreLayer({
      oscType: "sawtooth",
      attack: 0.2,
      decay: 0.4,
      release: 3.5,
      initialGain: 0.65,
    });

    // Atmos — airy pad + pink noise wash (original pitch)
    {
      const atmosInitialGain = 0.55;

      const atmosSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
          attack: 2.5,
          decay: 1.5,
          sustain: 0.9,
          release: 8,
        },
      });

      const atmosNoise = new Tone.Noise("pink");
      const atmosFilter = new Tone.Filter(800, "lowpass");

      // Low noise contribution so meters aren’t going crazy at idle
      const atmosNoiseGain = new Tone.Gain(0.04);

      // Shared gain node for both synth + noise so mixer/mute affect everything
      const atmosLayerGain = new Tone.Gain(atmosInitialGain);

      atmosSynth.connect(atmosLayerGain);

      atmosNoise.connect(atmosFilter);
      atmosFilter.connect(atmosNoiseGain);
      atmosNoiseGain.connect(atmosLayerGain);

      // FFT analyser for the Atmos layer (after synth+noise mix)
      const atmosAnalyser = new Tone.Analyser("fft", 64);
      atmosLayerGain.connect(atmosAnalyser);

      atmosLayerGain.connect(this.core.bussGain);

      atmosNoise.start();

      this.core.layers.atmos = {
        synth: atmosSynth,
        gain: atmosLayerGain,
        analyser: atmosAnalyser,
        baseGain: atmosInitialGain,
        muted: false,
      };
    }

    // ----- ORBIT VOICES (simple placeholders for now) -----
    const makeOrbitVoice = ({ initialGain = 0.7 } = {}) => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.7,
          release: 1.5,
        },
      });

      const gain = new Tone.Gain(initialGain);
      synth.connect(gain);
      gain.connect(this.reverb);

      // Orbit FFT analyser for meters
      const analyser = new Tone.Analyser("fft", 64);
      gain.connect(analyser);

      return {
        synth,
        gain,
        analyser,
        baseGain: initialGain,
        muted: false,
      };
    };

    this.voices.orbitA = makeOrbitVoice({ initialGain: 0.7 });
    this.voices.orbitB = makeOrbitVoice({ initialGain: 0.7 });
    this.voices.orbitC = makeOrbitVoice({ initialGain: 0.7 });

    // Simple tempo baseline
    Tone.Transport.bpm.value = 80;

    this.initialized = true;
  }

  async startAudioContext() {
    if (this.started) return;
    await Tone.start();
    await this.init();
    this.started = true;
    console.log("OMSE audio context started.");
  }

  /**
   * Play a note on a given voice.
   * voiceId: 'core' | 'orbitA' | 'orbitB' | 'orbitC'
   * note: 'C4', 'D4', etc.
   */
  noteOn(voiceId, note) {
    if (!this.started) return;

    if (voiceId === "core") {
      const { ground, harmony, atmos } = this.core.layers;

      // Ground = one octave lower
      if (ground) {
        const lowNote = Tone.Frequency(note).transpose(-12).toNote();
        ground.synth.triggerAttack(lowNote);
      }

      // Harmony = original pitch, brighter timbre (sawtooth)
      if (harmony) {
        harmony.synth.triggerAttack(note);
      }

      // Atmos = pad at original pitch
      if (atmos) {
        atmos.synth.triggerAttack(note);
      }

      return;
    }

    const voice = this.voices[voiceId];
    if (!voice) return;

    voice.synth.triggerAttack(note);
  }

  noteOff(voiceId, note) {
    if (!this.started) return;

    if (voiceId === "core") {
      const { ground, harmony, atmos } = this.core.layers;

      if (ground) {
        const lowNote = Tone.Frequency(note).transpose(-12).toNote();
        ground.synth.triggerRelease(lowNote);
      }

      if (harmony) {
        harmony.synth.triggerRelease(note);
      }

      if (atmos) {
        atmos.synth.triggerRelease(note);
      }

      return;
    }

    const voice = this.voices[voiceId];
    if (!voice) return;

    voice.synth.triggerRelease(note);
  }

  /**
   * Adjust Core layer gain.
   * layerId: 'ground' | 'harmony' | 'atmos'
   * gainValue: 0.0 - 1.0
   */
  setCoreLayerGain(layerId, gainValue) {
    if (!this.initialized) return;
    const layer = this.core.layers[layerId];
    if (!layer) return;

    layer.baseGain = gainValue;
    if (!layer.muted) {
      layer.gain.gain.value = gainValue;
    }
  }

  /**
   * Mute/unmute Core layer while remembering its base gain.
   */
  setCoreLayerMute(layerId, muted) {
    if (!this.initialized) return;
    const layer = this.core.layers[layerId];
    if (!layer) return;

    layer.muted = muted;
    layer.gain.gain.value = muted ? 0 : layer.baseGain;
  }

  /**
   * Get FFT data (Float32Array → plain array) for a Core layer.
   * Returns null if analyser not ready or layer effectively silent.
   */
  getCoreLayerFFT(layerId) {
    if (!this.initialized) return null;
    const layer = this.core.layers[layerId];
    if (!layer || !layer.analyser) return null;

    // If muted or very low gain, treat as silence for visuals
    const currentGain = layer.gain?.gain?.value ?? 0;
    if (layer.muted || currentGain < 0.05) {
      return null;
    }

    const values = layer.analyser.getValue();
    return Array.from(values);
  }

  /**
   * Orbit mixer controls
   */
  setOrbitGain(voiceId, gainValue) {
    if (!this.initialized) return;
    const voice = this.voices[voiceId];
    if (!voice || !voice.gain) return;

    voice.baseGain = gainValue;
    if (!voice.muted) {
      voice.gain.gain.value = gainValue;
    }
  }

  setOrbitMute(voiceId, muted) {
    if (!this.initialized) return;
    const voice = this.voices[voiceId];
    if (!voice || !voice.gain) return;

    voice.muted = muted;
    voice.gain.gain.value = muted ? 0 : voice.baseGain ?? 0.7;
  }

  /**
   * Get FFT data for an Orbit voice.
   * Returns null if analyser not ready or the orbit is effectively silent.
   */
  getOrbitFFT(voiceId) {
    if (!this.initialized) return null;
    const voice = this.voices[voiceId];
    if (!voice || !voice.analyser) return null;

    const currentGain = voice.gain?.gain?.value ?? 0;
    if (voice.muted || currentGain < 0.05) {
      return null;
    }

    const values = voice.analyser.getValue();
    return Array.from(values);
  }

  /**
   * Simple "this thing is alive" demo:
   * Plays a chord on Core layers and gentle responses on the Orbits.
   */
  async playTestScene() {
    if (!this.started) return;

    if (!Tone.Transport.state || Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }

    const now = Tone.now();

    const coreChord = ["C3", "G3", "D4"];

    const { ground, harmony, atmos } = this.core.layers;

    // Ground chord one octave lower
    if (ground) {
      const lowChord = coreChord.map((n) =>
        Tone.Frequency(n).transpose(-12).toNote()
      );
      ground.synth.triggerAttackRelease(lowChord, 8, now + 0.1);
    }

    // Harmony chord at original pitch, brighter timbre
    if (harmony) {
      const harmonyChord = ["E3", "B3", "F4"];
      harmony.synth.triggerAttackRelease(harmonyChord, 9, now + 0.2);
    }

    // Atmos stays at played octave, slower + airy
    if (atmos) {
      atmos.synth.triggerAttackRelease(["C4", "G4"], 10, now + 0.5);
    }

    // Orbits: staggered responses
    this.voices.orbitA.synth.triggerAttackRelease(
      ["E4", "G4"],
      6,
      now + 1.0
    );
    this.voices.orbitB.synth.triggerAttackRelease(
      ["C4", "B3"],
      5,
      now + 2.0
    );
    this.voices.orbitC.synth.triggerAttackRelease(["D5"], 4, now + 3.0);
  }
}

export const omseEngine = new OMSEEngine();