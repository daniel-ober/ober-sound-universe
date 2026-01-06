// src/engine/coreVoiceFactory.js
import * as Tone from "tone";

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function ensureTrailingSlash(s) {
  if (typeof s !== "string") return "";
  if (!s) return "";
  return s.endsWith("/") ? s : `${s}/`;
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
 * Resolve core preset shapes.
 */
function resolveEngineAndParams(preset) {
  const safePreset = isObj(preset) ? preset : {};
  const topEngine = (safePreset.engine || "").toString();

  const topParams = isObj(safePreset.params) ? safePreset.params : {};

  const legacySampler = isObj(safePreset.sampler) ? safePreset.sampler : null;
  const legacyLoop = isObj(safePreset.loop) ? safePreset.loop : null;

  const nestedSampler = isObj(topParams.sampler) ? topParams.sampler : null;
  const nestedLoop = isObj(topParams.loop) ? topParams.loop : null;

  const hasSampler =
    (legacySampler && (legacySampler.urls || legacySampler.baseUrl)) ||
    (nestedSampler && (nestedSampler.urls || nestedSampler.baseUrl)) ||
    (!!topParams.urls && !!topParams.baseUrl);

  const hasLoop =
    (legacyLoop && (legacyLoop.url || legacyLoop.loop)) ||
    (nestedLoop && (nestedLoop.url || nestedLoop.loop)) ||
    typeof topParams.url === "string";

  let engine = topEngine || "";
  if (!engine) {
    if (hasSampler) engine = "sampler";
    else if (hasLoop) engine = "loop";
    else engine = "poly";
  }

  const params = { ...topParams };

  if (engine === "sampler") {
    const s = legacySampler || nestedSampler || {};
    if (!params.baseUrl && s.baseUrl) params.baseUrl = s.baseUrl;
    if (!params.urls && s.urls) params.urls = s.urls;

    if (params.attack == null && s.attack != null) params.attack = s.attack;
    if (params.release == null && s.release != null) params.release = s.release;
    if (params.volume == null && s.volume != null) params.volume = s.volume;
    if (!params.filter && s.filter) params.filter = s.filter;
  }

  if (engine === "loop") {
    const l = legacyLoop || nestedLoop || {};
    if (!params.url && l.url) params.url = l.url;
    if (params.loop == null && l.loop != null) params.loop = l.loop;
    if (!params.filter && l.filter) params.filter = l.filter;
  }

  return { engine, params, loopCfg: legacyLoop || nestedLoop || null };
}

export function buildCoreLayerFromPreset(preset) {
  const { engine, params: p, loopCfg } = resolveEngineAndParams(preset);

  const nodesToDispose = [];
  let ready = null;

  const chorus = makeChorus(p.chorus);
  if (chorus) nodesToDispose.push(chorus);

  const drive = makeDrive(p.drive);
  if (drive) nodesToDispose.push(drive);

  const widener = makeWidth(p.width);
  if (widener) nodesToDispose.push(widener);

  const reverbSend = new Tone.Gain(clamp01(p.reverbSend ?? 0));
  const delaySend = new Tone.Gain(clamp01(p.delaySend ?? 0));
  nodesToDispose.push(reverbSend, delaySend);

  // ✅ LOOP engine (Tone.Player)
  if (engine === "loop") {
    const lc = isObj(loopCfg) ? loopCfg : {};
    const url = lc.url || p.url || null;
    const shouldLoop =
      typeof lc.loop === "boolean"
        ? lc.loop
        : typeof p.loop === "boolean"
          ? p.loop
          : true;

    if (!url) {
      console.warn(
        "[coreVoiceFactory] LOOP engine requested but no url provided. Preset:",
        preset
      );
    }

    let resolveReady;
    let rejectReady;
    const onloadPromise = new Promise((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });

    const player = new Tone.Player({
      url: url || undefined,
      loop: shouldLoop,
      autostart: false,
      onload: () => resolveReady?.(),
      onerror: (e) => rejectReady?.(e),
    });

    nodesToDispose.push(player);

    const filter = makeFilter(p.filter || lc.filter, "lowpass");
    if (filter) nodesToDispose.push(filter);

    const fxChain = [filter, drive, chorus, widener].filter(Boolean);

    const out = new Tone.Gain(1);
    nodesToDispose.push(out);

    if (fxChain.length) connectChain(player, fxChain, out);
    else player.connect(out);

    out.connect(reverbSend);
    out.connect(delaySend);

    ready = Promise.race([
      onloadPromise,
      Tone.loaded().catch(() => undefined),
    ]);

    return {
      output: out,
      reverbSendGain: reverbSend,
      delaySendGain: delaySend,
      dispose: () => nodesToDispose.forEach((n) => n.dispose?.()),
      synthType: "loop",
      synth: player,
      ready,
    };
  }

  // ✅ Sampler engine
  if (engine === "sampler") {
    const baseUrl = ensureTrailingSlash(typeof p.baseUrl === "string" ? p.baseUrl : "");
    const urls = isObj(p.urls) ? p.urls : null;

    if (!urls || !Object.keys(urls).length) {
      console.warn(
        "[coreVoiceFactory] SAMPLER engine requested but params.urls is missing/empty. Preset:",
        preset
      );
    }
    if (!baseUrl) {
      console.warn(
        "[coreVoiceFactory] SAMPLER engine requested but params.baseUrl is missing. Preset:",
        preset
      );
    }

    let resolveReady;
    let rejectReady;

    const onloadPromise = new Promise((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });

    const sampler = new Tone.Sampler({
      urls: urls || {},
      baseUrl: baseUrl || "",
      attack: p.attack ?? 0.01,
      release: p.release ?? 1.6,
      volume: p.volume ?? -6,
      onload: () => resolveReady?.(),
      onerror: (e) => rejectReady?.(e),
    });

    nodesToDispose.push(sampler);

    const filter = makeFilter(p.filter, "lowpass");
    if (filter) nodesToDispose.push(filter);

    const fxChain = [filter, drive, chorus, widener].filter(Boolean);

    const out = new Tone.Gain(1);
    nodesToDispose.push(out);

    if (fxChain.length) connectChain(sampler, fxChain, out);
    else sampler.connect(out);

    out.connect(reverbSend);
    out.connect(delaySend);

    ready = Promise.race([
      onloadPromise,
      Tone.loaded().catch(() => undefined),
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