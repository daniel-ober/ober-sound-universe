// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * OMSE - Ober MotionSynth Engine (prototype)
 *
 * This version implements a 3-layer Core voice:
 *  - coreGround
 *  - coreHarmony
 *  - coreAtmos
 *
 * All Core layers route into a Core buss, which then feeds the master buss.
 * Orbits remain simple placeholder synth voices for now.
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

    // Orbit voices (simple for now)
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

    // Helper: create a core layer synth
    const makeCoreLayer = ({ oscType = "sine", attack = 0.3, release = 3 }) => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscType },
        envelope: {
          attack,
          decay: 0.5,
          sustain: 0.9,
          release,
        },
      });

      const gain = new Tone.Gain(0.8);
      synth.connect(gain);
      gain.connect(this.core.bussGain);

      return { synth, gain };
    };

    // Core layers
    this.core.layers.ground = makeCoreLayer({
      oscType: "sine",
      attack: 0.4,
      release: 4,
    });

    this.core.layers.harmony = makeCoreLayer({
      oscType: "triangle",
      attack: 0.6,
      release: 5,
    });

    this.core.layers.atmos = makeCoreLayer({
      oscType: "sine",
      attack: 1.2,
      release: 7,
    });

    // ----- ORBIT VOICES (simple placeholders for now) -----
    const makeOrbitVoice = () => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.7,
          release: 1.5,
        },
      });

      const gain = new Tone.Gain(0.7);
      synth.connect(gain);
      gain.connect(this.reverb);

      return { synth, gain };
    };

    this.voices.orbitA = makeOrbitVoice();
    this.voices.orbitB = makeOrbitVoice();
    this.voices.orbitC = makeOrbitVoice();

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
      // Trigger all core layers for now
      const { ground, harmony, atmos } = this.core.layers;
      if (ground) ground.synth.triggerAttack(note);
      if (harmony) harmony.synth.triggerAttack(note);
      if (atmos) atmos.synth.triggerAttack(note);
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
      if (ground) ground.synth.triggerRelease(note);
      if (harmony) harmony.synth.triggerRelease(note);
      if (atmos) atmos.synth.triggerRelease(note);
      return;
    }

    const voice = this.voices[voiceId];
    if (!voice) return;

    voice.synth.triggerRelease(note);
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

    // Core: chord across all three layers with slightly different feels
    const { ground, harmony, atmos } = this.core.layers;

    if (ground) {
      ground.synth.triggerAttackRelease(coreChord, 8, now + 0.1);
    }

    if (harmony) {
      // Slightly higher, more open voicing
      harmony.synth.triggerAttackRelease(["E3", "B3", "F4"], 9, now + 0.2);
    }

    if (atmos) {
      // Higher, slower, more pad-like
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