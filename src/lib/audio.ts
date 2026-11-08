/**
 * Ambience: a slow ocean swell + rainfall bed synthesised with WebAudio.
 * No files, no autoplay violations — the context is resumed on the first
 * user gesture and everything is tied to the visible scene controls.
 */

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  seaGain: GainNode;
  rainGain: GainNode;
  lfo: OscillatorNode;
};

let nodes: Nodes | null = null;
let muted = false;
let rainLevel = 0.35;
let seaLevel = 0.55;

function makeNoise(ctx: AudioContext, seconds: number, brown: boolean) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    } else {
      data[i] = white;
    }
  }
  return buf;
}

function build(): Nodes | null {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // --- ocean swell: brown noise, low-passed, breathing via LFO ---
  const seaSrc = ctx.createBufferSource();
  seaSrc.buffer = makeNoise(ctx, 6, true);
  seaSrc.loop = true;
  const seaFilter = ctx.createBiquadFilter();
  seaFilter.type = "lowpass";
  seaFilter.frequency.value = 520;
  seaFilter.Q.value = 0.8;
  const seaGain = ctx.createGain();
  seaGain.gain.value = 0.55;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.11;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.34;
  lfo.connect(lfoGain).connect(seaGain.gain);
  const lfoFilter = ctx.createGain();
  lfoFilter.gain.value = 220;
  lfo.connect(lfoFilter).connect(seaFilter.frequency);

  seaSrc.connect(seaFilter).connect(seaGain).connect(master);

  // --- rain: white noise, band-limited high ---
  const rainSrc = ctx.createBufferSource();
  rainSrc.buffer = makeNoise(ctx, 4, false);
  rainSrc.loop = true;
  const rainHp = ctx.createBiquadFilter();
  rainHp.type = "highpass";
  rainHp.frequency.value = 1400;
  const rainLp = ctx.createBiquadFilter();
  rainLp.type = "lowpass";
  rainLp.frequency.value = 7200;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  rainSrc.connect(rainHp).connect(rainLp).connect(rainGain).connect(master);

  seaSrc.start();
  rainSrc.start();
  lfo.start();

  return { ctx, master, seaGain, rainGain, lfo };
}

function apply() {
  if (!nodes) return;
  const t = nodes.ctx.currentTime;
  nodes.master.gain.setTargetAtTime(muted ? 0 : 0.16, t, 0.5);
  nodes.seaGain.gain.setTargetAtTime(0.25 + seaLevel * 0.7, t, 0.6);
  nodes.rainGain.gain.setTargetAtTime(rainLevel * 0.11, t, 0.6);
}

export const ambience = {
  /** Called from a user gesture; safe to call repeatedly. */
  async unlock() {
    if (!nodes) nodes = build();
    if (!nodes) return false;
    if (nodes.ctx.state === "suspended") {
      try {
        await nodes.ctx.resume();
      } catch {
        return false;
      }
    }
    apply();
    return nodes.ctx.state === "running";
  },
  setMuted(v: boolean) {
    muted = v;
    apply();
  },
  setRain(v: number) {
    rainLevel = Math.max(0, Math.min(1, v));
    apply();
  },
  setSea(v: number) {
    seaLevel = Math.max(0, Math.min(1, v));
    apply();
  },
  /** Short wooden/marimba blip for UI actions. */
  blip(freq = 660, dur = 0.16, type: OscillatorType = "triangle", vol = 0.075) {
    if (!nodes || muted || nodes.ctx.state !== "running") return;
    const { ctx, master } = nodes;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.72), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  },
  chime() {
    this.blip(880, 0.22, "sine", 0.06);
    window.setTimeout(() => this.blip(1320, 0.3, "sine", 0.045), 90);
  },
  shutter() {
    this.blip(240, 0.07, "square", 0.035);
  },
};
