// src/engine/coreVoiceFactory.js
import * as Tone from "tone";

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function makeChorus(cfg) {
  if (!cfg) return null;
  const ch = new Tone.Chorus({
    frequency: cfg.frequency ?? 0.5,
    delayTime: cfg.delayTime ?? 6,
    depth: cfg.depth ?? 0.3,
    wet: clamp01(cfg.wet ?? 0.15),
  }).start();
  return ch;
}

function makeDrive(cfg) {
  const amt = clamp01(cfg?.amount ?? 0);
  if (amt <= 0.0001) return null;

  const d = new Tone.Distortion({
    distortion: Math.max(0.01, Math.min(0.35, amt * 0.6)),
    wet: Math.max(0.05, Math.min(0.35, amt)),
  });
  return d;
}

function makeWidth(cfg) {
  const amt = clamp01(cfg?.amount ?? 0);
  if (amt <= 0.0001) return null;
  return new Tone.StereoWidener(amt);
}

function makeFilter(cfg, fallbackType = "lowpass") {
  if (!cfg) return null;
  return new Tone.Filter({
    type: cfg.type ?? fallbackType,
    frequency: cfg.frequency ?? 5000,
    Q: cfg.Q ?? 0.7,
  });
}

function connectChain(source, nodes, destination) {
  let cur = source;
  nodes.forEach((n) => {
    if (!n) return;
    cur.connect(n);
    cur = n;
  });
  cur.connect(destination);
}

/**
 * Builds a core layer synth graph from a preset.
 * Returns:
 *  {
 *    output,
 *    reverbSendGain?,
 *    delaySendGain?,
 *    dispose(),
 *    synthType,
 *    synth,
 *    ready?        // Promise for async assets (sampler)
 *  }
 */
export function buildCoreLayerFromPreset(preset) {
  const engine = preset?.engine || "poly";
  const p = preset?.params || {};

  const nodesToDispose = [];
  let ready = null;

  // ----- Shared optional FX -----
  const chorus = makeChorus(p.chorus);
  if (chorus) nodesToDispose.push(chorus);

  const drive = makeDrive(p.drive);
  if (drive) nodesToDispose.push(drive);

  const widener = makeWidth(p.width);
  if (widener) nodesToDispose.push(widener);

  const reverbSend = new Tone.Gain(clamp01(p.reverbSend ?? 0));
  const delaySend = new Tone.Gain(clamp01(p.delaySend ?? 0));
  nodesToDispose.push(reverbSend, delaySend);

  // ✅ Sampler engine
  if (engine === "sampler") {
    const baseUrl = p.baseUrl || "/assets/samples/contrabass/";
    const urls = p.urls || {};

    let resolveReady;
    let rejectReady;

    // Primary ready = Sampler onload
    const onloadPromise = new Promise((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });

    const sampler = new Tone.Sampler({
      urls,
      baseUrl,
      attack: p.attack ?? 0.01,
      release: p.release ?? 1.6,
      volume: p.volume ?? -6,
      onload: () => resolveReady?.(),
      // Tone.Sampler supports onerror in recent Tone versions; if not, Tone.loaded() still catches.
      onerror: (e) => rejectReady?.(e),
    });

    nodesToDispose.push(sampler);

    const filter = makeFilter(p.filter, "lowpass");
    if (filter) nodesToDispose.push(filter);

    const fxChain = [filter, drive, chorus, widener].filter(Boolean);

    const out = new Tone.Gain(1);
    nodesToDispose.push(out);

    // Build chain
    if (fxChain.length) connectChain(sampler, fxChain, out);
    else sampler.connect(out);

    out.connect(reverbSend);
    out.connect(delaySend);

    // ✅ Backstop: Tone.loaded() resolves when all ToneAudioBuffers are loaded.
    // We race onloadPromise with Tone.loaded() so we don't hang if onload doesn't fire in some builds.
    ready = Promise.race([
      onloadPromise,
      Tone.loaded().catch(() => {
        // ignore
      }),
    ]);

    return {
      output: out,
      reverbSendGain: reverbSend,
      delaySendGain: delaySend,
      dispose: () => nodesToDispose.forEach((n) => n.dispose?.()),
      synthType: "sampler",
      synth: sampler,
      ready,
    };
  }

  // ----- MonoSynth
  if (engine === "mono") {
    const synth = new Tone.MonoSynth({
      oscillator: p.oscillator ?? { type: "sine" },
      envelope: p.envelope ?? {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.8,
        release: 2.5,
      },
      filter: p.filter ?? { type: "lowpass", frequency: 400, Q: 0.8 },
      filterEnvelope:
        p.filterEnvelope ?? {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.2,
          release: 1.0,
          baseFrequency: 80,
          octaves: 2,
        },
    });

    nodesToDispose.push(synth);

    const filter = makeFilter(p.filter, "lowpass");
    if (filter) nodesToDispose.push(filter);

    const fxChain = [filter, drive, chorus, widener].filter(Boolean);

    const out = new Tone.Gain(1);
    nodesToDispose.push(out);

    connectChain(synth, fxChain, out);

    out.connect(reverbSend);
    out.connect(delaySend);

    return {
      output: out,
      reverbSendGain: reverbSend,
      delaySendGain: delaySend,
      dispose: () => nodesToDispose.forEach((n) => n.dispose?.()),
      synthType: "mono",
      synth,
      ready,
    };
  }

  // ----- synthPad
  if (engine === "synthPad") {
    const polyType = p.polyType || "synth";
    const baseSynth = polyType === "fm" ? Tone.FMSynth : Tone.Synth;

    const initParams = polyType === "fm" ? p.fm ?? {} : p.synth ?? {};
    const poly = new Tone.PolySynth(baseSynth, initParams);
    nodesToDispose.push(poly);

    const filter = makeFilter(p.filter, "lowpass");
    if (filter) nodesToDispose.push(filter);

    const fxChain = [filter, drive, chorus, widener].filter(Boolean);

    const out = new Tone.Gain(1);
    nodesToDispose.push(out);

    connectChain(poly, fxChain, out);

    out.connect(reverbSend);
    out.connect(delaySend);

    return {
      output: out,
      reverbSendGain: reverbSend,
      delaySendGain: delaySend,
      dispose: () => nodesToDispose.forEach((n) => n.dispose?.()),
      synthType: "poly",
      synth: poly,
      ready,
    };
  }

  // ----- noisePad
  if (engine === "noisePad") {
    const synth = new Tone.PolySynth(Tone.Synth, p.synth ?? {});
    nodesToDispose.push(synth);

    const synthFilter = makeFilter(p.synthFilter, "lowpass");
    if (synthFilter) nodesToDispose.push(synthFilter);

    const noise = new Tone.Noise(p.noise?.type ?? "pink").start();
    nodesToDispose.push(noise);

    const noiseFilter = makeFilter(p.noiseFilter, "bandpass");
    if (noiseFilter) nodesToDispose.push(noiseFilter);

    const noiseGain = new Tone.Gain(clamp01(p.noise?.gain ?? 0.1));
    nodesToDispose.push(noiseGain);

    const merge = new Tone.Gain(1);
    nodesToDispose.push(merge);

    if (synthFilter) {
      synth.connect(synthFilter);
      synthFilter.connect(merge);
    } else {
      synth.connect(merge);
    }

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(merge);

    const fxOut = new Tone.Gain(1);
    nodesToDispose.push(fxOut);

    const fxChain = [drive, chorus, widener].filter(Boolean);
    connectChain(merge, fxChain, fxOut);

    fxOut.connect(reverbSend);
    fxOut.connect(delaySend);

    return {
      output: fxOut,
      reverbSendGain: reverbSend,
      delaySendGain: delaySend,
      dispose: () => nodesToDispose.forEach((n) => n.dispose?.()),
      synthType: "hybrid",
      synth,
      ready,
    };
  }

  // ----- default: poly synth/fm
  const polyType = p.polyType || "synth";
  const baseSynth = polyType === "fm" ? Tone.FMSynth : Tone.Synth;

  const initParams = polyType === "fm" ? p.fm ?? {} : p.synth ?? {};
  const poly = new Tone.PolySynth(baseSynth, initParams);
  nodesToDispose.push(poly);

  const filter = makeFilter(p.filter, "lowpass");
  if (filter) nodesToDispose.push(filter);

  const fxChain = [filter, drive, chorus, widener].filter(Boolean);

  const out = new Tone.Gain(1);
  nodesToDispose.push(out);

  connectChain(poly, fxChain, out);

  out.connect(reverbSend);
  out.connect(delaySend);

  return {
    output: out,
    reverbSendGain: reverbSend,
    delaySendGain: delaySend,
    dispose: () => nodesToDispose.forEach((n) => n.dispose?.()),
    synthType: "poly",
    synth: poly,
    ready,
  };
}