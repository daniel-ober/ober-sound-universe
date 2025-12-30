// src/engine/omseEngine.js
import * as Tone from "tone";

/**
 * OMSE - Ober MotionSynth Engine (prototype)
 */

class OMSEEngine {
  constructor() {
    this.initialized = false;
    this.started = false;

    this.masterGain = null;
    this.reverb = null;

    this.voices = {
      core: null,
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

    // ----- VOICES (placeholder synths for now) -----
    const makeVoice = () => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.5,
          decay: 0.5,
          sustain: 0.9,
          release: 2.5,
        },
      });

      const gain = new Tone.Gain(0.8);
      synth.connect(gain);
      gain.connect(this.reverb);

      return { synth, gain };
    };

    this.voices.core = makeVoice();
    this.voices.orbitA = makeVoice();
    this.voices.orbitB = makeVoice();
    this.voices.orbitC = makeVoice();

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

  noteOn(voiceId, note) {
    if (!this.started) return;
    const voice = this.voices[voiceId];
    if (!voice) return;
    voice.synth.triggerAttack(note);
  }

  noteOff(voiceId, note) {
    if (!this.started) return;
    const voice = this.voices[voiceId];
    if (!voice) return;
    voice.synth.triggerRelease(note);
  }

  async playTestScene() {
    if (!this.started) return;

    if (!Tone.Transport.state || Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }

    const now = Tone.now();

    this.voices.core.synth.triggerAttackRelease(
      ["C3", "G3", "D4"],
      8,
      now + 0.1
    );
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
    this.voices.orbitC.synth.triggerAttackRelease(
      ["D5"],
      4,
      now + 3.0
    );
  }
}

export const omseEngine = new OMSEEngine();