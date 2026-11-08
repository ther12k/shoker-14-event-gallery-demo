import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconDice,
  IconDownload,
  IconMoon,
  IconRain,
  IconRefresh,
  IconSun,
  IconWave,
} from "./Icons";
import { ambience } from "@/lib/audio";
import { useToast } from "@/lib/store";

export type SkyId = "fajar" | "siang" | "senja" | "malam";
export type SceneState = {
  sky: SkyId;
  rain: number;
  waves: number;
  wind: number;
  stars: number;
  rainbow: boolean;
  animals: boolean;
};

export const DEFAULT_SCENE: SceneState = {
  sky: "senja",
  rain: 26,
  waves: 52,
  wind: 40,
  stars: 55,
  rainbow: true,
  animals: true,
};

const SKY: Record<
  SkyId,
  { label: string; stops: [string, string, string]; sea: [string, string, string]; orb: string; orbY: number; glow: string; starOp: number; window: number }
> = {
  fajar: {
    label: "Fajar",
    stops: ["#123a54", "#5b7f92", "#f4b58e"],
    sea: ["#0d4356", "#12798c", "#1b9fa8"],
    orb: "#F7CE68",
    orbY: 372,
    glow: "#F2A63B",
    starOp: 0.3,
    window: 0.75,
  },
  siang: {
    label: "Siang",
    stops: ["#0f6f9c", "#48aed0", "#c9e9e6"],
    sea: ["#0b5f74", "#159fa8", "#5fd3c2"],
    orb: "#FFF3C4",
    orbY: 108,
    glow: "#FFF0B8",
    starOp: 0,
    window: 0.25,
  },
  senja: {
    label: "Senja",
    stops: ["#092a40", "#8a4257", "#f0894a"],
    sea: ["#04202b", "#0d4356", "#12798c"],
    orb: "#F7CE68",
    orbY: 366,
    glow: "#E8663C",
    starOp: 0.45,
    window: 0.9,
  },
  malam: {
    label: "Malam",
    stops: ["#02090f", "#062031", "#0d4356"],
    sea: ["#020d15", "#07293a", "#0d5566"],
    orb: "#EAF3FF",
    orbY: 104,
    glow: "#9DBCC4",
    starOp: 1,
    window: 1,
  },
};

function rng(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function wavePath(amp: number, y: number, wl: number) {
  let d = `M0 ${y}`;
  for (let x = 0; x < 1600; x += wl) {
    d += ` q ${wl / 4} ${-amp} ${wl / 2} 0 q ${wl / 4} ${amp} ${wl / 2} 0`;
  }
  return d + ` L1600 620 L0 620 Z`;
}

const RAINBOW = ["#D94A3D", "#E8863B", "#F2C94C", "#4FA860", "#2E9AA8", "#3E5FA8", "#7A5AA8"];

export function ArkScene({
  scene,
  onScene,
}: {
  scene: SceneState;
  onScene: (s: SceneState) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [awake, setAwake] = useState(true);
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const pal = SKY[scene.sky];

  const stars = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 110 }, () => ({
      x: r() * 800,
      y: r() * 340,
      s: 0.7 + r() * 1.7,
      d: r() * 4,
      dur: 2.4 + r() * 3.6,
    }));
  }, []);

  const drops = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: 150 }, () => ({
      x: r() * 880 - 40,
      len: 12 + r() * 26,
      delay: r() * 1.6,
      dur: 0.7 + r() * 0.7,
      o: 0.2 + r() * 0.5,
    }));
  }, []);

  const motes = useMemo(() => {
    const r = rng(97);
    return Array.from({ length: 16 }, () => ({
      x: 40 + r() * 720,
      y: 300 + r() * 220,
      delay: r() * 7,
      dur: 7 + r() * 7,
      s: 1 + r() * 2,
    }));
  }, []);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((e) => setAwake(e[0].isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    ambience.setRain(scene.rain / 100);
    ambience.setSea(scene.waves / 100);
  }, [scene.rain, scene.waves]);

  const amp = 8 + (scene.waves / 100) * 46;
  const windDur = 26 - (scene.wind / 100) * 20;
  const starCount = Math.round((scene.stars / 100) * stars.length);
  const dropCount = Math.round((scene.rain / 100) * drops.length);
  const bobDur = 8.4 - (scene.waves / 100) * 4.2;

  const set = <K extends keyof SceneState>(k: K, v: SceneState[K]) =>
    onScene({ ...scene, [k]: v });

  const randomize = () => {
    const skies: SkyId[] = ["fajar", "siang", "senja", "malam"];
    const next: SceneState = {
      sky: skies[Math.floor(Math.random() * 4)],
      rain: Math.round(Math.random() * 100),
      waves: 18 + Math.round(Math.random() * 82),
      wind: Math.round(Math.random() * 100),
      stars: Math.round(Math.random() * 100),
      rainbow: Math.random() > 0.3,
      animals: Math.random() > 0.15,
    };
    onScene(next);
    ambience.blip(520, 0.14);
    push({ title: "Cuaca baru untuk bahtera", desc: `${SKY[next.sky].label} · ombak ${next.waves}%`, tone: "info" });
  };

  const reset = () => {
    onScene(DEFAULT_SCENE);
    ambience.blip(380, 0.12);
    push({ title: "Adegan dikembalikan", desc: "Senja tenang seperti semula.", tone: "ok" });
  };

  const download = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    setBusy(true);
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1600");
      clone.setAttribute("height", "1200");
      const data = new XMLSerializer().serializeToString(clone);
      const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = 1600;
          c.height = 1200;
          const ctx = c.getContext("2d");
          if (!ctx) return reject(new Error("no ctx"));
          ctx.drawImage(img, 0, 0, 1600, 1200);
          c.toBlob((blob) => {
            if (!blob) return reject(new Error("no blob"));
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `bahtera-nuh-${scene.sky}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            resolve();
          }, "image/png");
        };
        img.onerror = () => reject(new Error("render"));
        img.src = url;
      });
      URL.revokeObjectURL(url);
      ambience.chime();
      push({ title: "Adegan tersimpan", desc: `bahtera-nuh-${scene.sky}.png · 1600×1200`, tone: "ok" });
    } catch {
      push({ title: "Gagal menyimpan gambar", desc: "Coba lagi atau ambil tangkapan layar.", tone: "bad" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={holderRef}>
      <div
        className={`relative overflow-hidden rounded-[28px] border border-foam/25 bg-abyss shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ${
          awake ? "" : "scene-paused"
        }`}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className="block h-auto w-full"
          role="img"
          aria-label={`Ilustrasi bahtera Nuh berlayar pada waktu ${pal.label.toLowerCase()}`}
        >
          <defs>
            <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pal.stops[0]} />
              <stop offset="58%" stopColor={pal.stops[1]} />
              <stop offset="100%" stopColor={pal.stops[2]} />
            </linearGradient>
            <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pal.sea[2]} />
              <stop offset="55%" stopColor={pal.sea[1]} />
              <stop offset="100%" stopColor={pal.sea[0]} />
            </linearGradient>
            <radialGradient id="orbG">
              <stop offset="0%" stopColor={pal.orb} stopOpacity="0.95" />
              <stop offset="45%" stopColor={pal.glow} stopOpacity="0.35" />
              <stop offset="100%" stopColor={pal.glow} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hullG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A9713C" />
              <stop offset="55%" stopColor="#7A4A26" />
              <stop offset="100%" stopColor="#4A2B16" />
            </linearGradient>
            <linearGradient id="cabinG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C98A4B" />
              <stop offset="100%" stopColor="#8A5730" />
            </linearGradient>
            <pattern id="starTile" width="64" height="64" patternUnits="userSpaceOnUse">
              <path
                d="M32 4l8.3 11.7L54 11.4l-3.8 13.8L64 32l-13.8 6.8L54 52.6l-13.7-4.3L32 60l-8.3-11.7L10 52.6l3.8-13.8L0 32l13.8-6.8L10 11.4l13.7 4.3z"
                fill="none"
                stroke="#F7CE68"
                strokeWidth="0.9"
                opacity="0.5"
              />
            </pattern>
            <radialGradient id="cloudLight">
              <stop offset="0%" stopColor="#FBF2E0" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#FBF2E0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FBF2E0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cloudDark">
              <stop offset="0%" stopColor="#16303F" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#1D3B4C" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#1D3B4C" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="shadowG">
              <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <filter id="lamp" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <clipPath id="frameClip">
              <rect x="0" y="0" width="800" height="600" rx="0" />
            </clipPath>
          </defs>

          <g clipPath="url(#frameClip)">
            {/* sky */}
            <rect width="800" height="600" fill="url(#skyG)" />
            <rect width="800" height="380" fill="url(#starTile)" opacity={scene.sky === "siang" ? 0.06 : 0.16} />

            {/* stars */}
            <g opacity={pal.starOp}>
              {stars.slice(0, starCount).map((s, i) => (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={s.s}
                  fill="#FBF2E0"
                  style={{
                    animation: `twinkle ${s.dur}s ease-in-out ${s.d}s infinite`,
                    transformOrigin: `${s.x}px ${s.y}px`,
                  }}
                />
              ))}
            </g>

            {/* sun / moon */}
            <circle cx="628" cy={pal.orbY} r="150" fill="url(#orbG)" />
            <circle cx="628" cy={pal.orbY} r={scene.sky === "malam" ? 24 : 30} fill={pal.orb} opacity="0.95" />
            {scene.sky === "malam" && <circle cx="617" cy={pal.orbY - 8} r="21" fill={pal.stops[0]} opacity="0.92" />}

            {/* rainbow */}
            <g
              opacity={scene.rainbow ? (scene.sky === "malam" ? 0.3 : 0.72) : 0}
              style={{ transition: "opacity .6s ease" }}
            >
              {RAINBOW.map((c, i) => (
                <path
                  key={c}
                  d={`M ${96 + i * 11} 430 A ${304 - i * 11} ${304 - i * 11} 0 0 1 ${704 - i * 11} 430`}
                  fill="none"
                  stroke={c}
                  strokeWidth="11"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              ))}
            </g>

            {/* clouds — two drifting layers */}
            <g opacity={scene.sky === "siang" ? 0.85 : 0.6}>
              <g style={{ animation: `cloudShift ${windDur * 3.4}s linear infinite` }}>
                {[0, 900].map((off) => (
                  <g key={off} transform={`translate(${off} 0)`}>
                    <ellipse cx="120" cy="120" rx="122" ry="52" fill="url(#cloudLight)" />
                    <ellipse cx="330" cy="78" rx="100" ry="44" fill="url(#cloudLight)" />
                    <ellipse cx="640" cy="140" rx="134" ry="50" fill="url(#cloudLight)" />
                  </g>
                ))}
              </g>
            </g>
            <g opacity={0.35 + (scene.rain / 100) * 0.5}>
              <g style={{ animation: `cloudShift ${windDur * 2.1}s linear infinite` }}>
                {[0, 900].map((off) => (
                  <g key={off} transform={`translate(${off} 0)`}>
                    <ellipse cx="220" cy="96" rx="175" ry="64" fill="url(#cloudDark)" />
                    <ellipse cx="560" cy="70" rx="152" ry="56" fill="url(#cloudDark)" />
                  </g>
                ))}
              </g>
            </g>

            {/* distant hills */}
            <path d="M470 402 L556 344 L618 392 L676 350 L800 404 L800 430 L470 430 Z" fill="#04202B" opacity="0.45" />

            {/* rain */}
            <g opacity={dropCount ? 0.85 : 0}>
              {drops.slice(0, dropCount).map((d, i) => (
                <line
                  key={i}
                  x1={d.x}
                  y1={0}
                  x2={d.x - 6}
                  y2={d.len}
                  stroke="#CFE9EE"
                  strokeWidth="1.3"
                  opacity={d.o}
                  strokeLinecap="round"
                  style={{ animation: `rainShift ${d.dur / (0.6 + scene.wind / 160)}s linear ${d.delay}s infinite` }}
                />
              ))}
            </g>

            {/* ---- ark ---- */}
            <g transform="translate(400 434) scale(1.17) translate(-400 -434)">
            <g
              className="anim-bob"
              style={{ animationDuration: `${bobDur}s`, transformOrigin: "400px 420px" }}
            >
              {/* reflection */}
              <ellipse cx="400" cy="470" rx="196" ry="26" fill="url(#shadowG)" />

              {/* hull */}
              <path
                d="M212 372 L588 372 Q604 372 596 392 L566 452 Q558 470 536 470 L264 470 Q242 470 234 452 L204 392 Q196 372 212 372 Z"
                fill="url(#hullG)"
              />
              {[386, 402, 418, 434, 450].map((y, i) => (
                <path
                  key={y}
                  d={`M${208 + i * 5} ${y} L${592 - i * 5} ${y}`}
                  stroke="#3A2110"
                  strokeWidth="2"
                  opacity="0.45"
                />
              ))}
              <path d="M212 372 L588 372 L590 382 L210 382 Z" fill="#C98A4B" opacity="0.85" />

              {/* cabin */}
              <path d="M326 372 L326 300 L474 300 L474 372 Z" fill="url(#cabinG)" />
              <path d="M310 302 L400 246 L490 302 Z" fill="#8A5730" />
              <path d="M400 246 L490 302 L400 302 Z" fill="#000" opacity="0.14" />
              <path d="M400 246 L400 232" stroke="#5C3A1E" strokeWidth="5" strokeLinecap="round" />
              <path
                d="M400 208 l4.6 9.6 10.4 1.5-7.5 7.3 1.8 10.4-9.3-4.9-9.3 4.9 1.8-10.4-7.5-7.3 10.4-1.5z"
                fill="#F7CE68"
              />
              {/* windows */}
              {[344, 386, 428].map((x) => (
                <g key={x}>
                  <rect x={x} y={320} width="28" height="30" rx="5" fill="#2A1608" />
                  <rect x={x + 3} y={323} width="22" height="24" rx="4" fill="#F7CE68" opacity={pal.window} />
                  <rect
                    x={x + 3}
                    y={323}
                    width="22"
                    height="24"
                    rx="4"
                    fill="#F2A63B"
                    opacity={pal.window * 0.8}
                    filter="url(#lamp)"
                  />
                </g>
              ))}

              {/* bow lamp post */}
              <g>
                <path d="M216 372 V304 h18" stroke="#3A2110" strokeWidth="4" strokeLinecap="round" fill="none" />
                <rect x="224" y="308" width="20" height="26" rx="6" fill="#3A2110" />
                <rect x="228" y="312" width="12" height="18" rx="4" fill="#F7CE68" opacity={0.55 + pal.window * 0.45} />
                <circle cx="234" cy="321" r="22" fill="#F2A63B" opacity={0.38 * pal.window} filter="url(#lamp)" />
              </g>

              {/* animals standing on the deck, either side of the cabin */}
              <g opacity={scene.animals ? 1 : 0} style={{ transition: "opacity .45s ease" }}>
                {/* giraffe pair — port side */}
                <g fill="#E8B45C">
                  <path d="M262 372 q-6-46 4-72 q4-11 13-11 q8 0 9 8 l-3 10 q7 30 5 65 z" />
                  <circle cx="282" cy="283" r="8" />
                  <path d="M278 275 l-2-8 M286 275 l3-8" stroke="#E8B45C" strokeWidth="3" strokeLinecap="round" />
                  <path d="M296 372 q-5-38 3-59 q4-9 11-9 q7 0 7 7 l-2 8 q6 25 4 53 z" />
                  <circle cx="312" cy="299" r="7" />
                  <path d="M309 292 l-2-7 M316 292 l2-7" stroke="#E8B45C" strokeWidth="2.6" strokeLinecap="round" />
                </g>
                <g fill="#B87A34" opacity="0.5">
                  <circle cx="268" cy="322" r="3.4" />
                  <circle cx="277" cy="342" r="3" />
                  <circle cx="305" cy="332" r="2.8" />
                  <circle cx="272" cy="356" r="2.6" />
                </g>
                {/* lion pair — port bow */}
                <g>
                  <circle cx="238" cy="356" r="15" fill="#C98A4B" />
                  <circle cx="238" cy="356" r="10" fill="#E8B45C" />
                  <circle cx="234.5" cy="354" r="1.7" fill="#3A2110" />
                  <circle cx="241.5" cy="354" r="1.7" fill="#3A2110" />
                  <path d="M235 360 q3 3 6 0" stroke="#3A2110" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                  <circle cx="262" cy="363" r="10.5" fill="#C98A4B" />
                  <circle cx="262" cy="363" r="7" fill="#E8B45C" />
                </g>
                {/* elephant pair — starboard */}
                <g fill="#8FA6B4">
                  <ellipse cx="530" cy="346" rx="32" ry="26" />
                  <circle cx="504" cy="332" r="18" />
                  <path d="M492 340 q-11 16 -3 30 q4 6 9 2 q-7-12 2-24 z" />
                  <ellipse cx="510" cy="326" rx="11" ry="14" fill="#7C93A2" />
                  <ellipse cx="575" cy="352" rx="22" ry="20" />
                  <circle cx="556" cy="344" r="13" />
                  <path d="M547 350 q-8 12 -2 22 q3 4 7 1 q-5-9 1-17 z" />
                  <ellipse cx="560" cy="339" rx="8" ry="10" fill="#7C93A2" />
                </g>
                <g fill="#2A1608">
                  <circle cx="499" cy="328" r="1.9" />
                  <circle cx="552" cy="341" r="1.6" />
                </g>
              </g>

              {/* birds perched on the roof slope */}
              <g fill="#5D7C8A">
                <ellipse cx="340" cy="284" rx="7" ry="5" />
                <circle cx="334" cy="278" r="4" />
                <ellipse cx="358" cy="273" rx="6" ry="4.4" />
                <circle cx="353" cy="268" r="3.4" />
              </g>
            </g>
            </g>

            {/* dove */}
            <g style={{ animation: `flyby ${Math.max(10, windDur * 1.1)}s linear infinite` }}>
              <g transform="translate(60 150)">
                <g style={{ animation: "flap 0.5s ease-in-out infinite", transformOrigin: "14px 6px" }}>
                  <path d="M14 6 q-14-14-24-6 q10 2 16 10z" fill="#FBF2E0" />
                  <path d="M16 6 q14-14 24-6 q-10 2-16 10z" fill="#F1E6D2" />
                </g>
                <ellipse cx="15" cy="9" rx="12" ry="6" fill="#FBF2E0" />
                <circle cx="26" cy="5" r="4.6" fill="#FBF2E0" />
                <path d="M30 5 l6 1.6-6 1.8z" fill="#F2A63B" />
                <path d="M3 10 l-10 4 10 1z" fill="#F1E6D2" />
                <path d="M31 8 q10 3 16-1" stroke="#4FA860" strokeWidth="2" fill="none" strokeLinecap="round" />
                <ellipse cx="41" cy="5" rx="4" ry="2.2" fill="#4FA860" transform="rotate(-20 41 5)" />
                <ellipse cx="46" cy="9" rx="4" ry="2.2" fill="#3E9E62" transform="rotate(15 46 9)" />
              </g>
            </g>

            {/* ---- sea ---- */}
            <rect x="0" y="418" width="800" height="200" fill="url(#seaG)" />
            <g style={{ animation: `waveShift ${windDur * 0.9}s linear infinite` }}>
              <path d={wavePath(amp * 0.5, 428, 200)} fill={pal.sea[2]} opacity="0.55" />
            </g>
            <g style={{ animation: `waveShift ${windDur * 0.62}s linear infinite` }}>
              <path d={wavePath(amp * 0.8, 464, 160)} fill={pal.sea[1]} opacity="0.85" />
              <path
                d={wavePath(amp * 0.8, 464, 160)}
                fill="none"
                stroke="#CFE9EE"
                strokeWidth="2"
                opacity="0.28"
              />
            </g>
            <g style={{ animation: `waveShift ${windDur * 0.4}s linear infinite` }}>
              <path d={wavePath(amp * 1.15, 516, 400)} fill={pal.sea[0]} />
              <path
                d={wavePath(amp * 1.15, 516, 400)}
                fill="none"
                stroke="#46C3B2"
                strokeWidth="2.4"
                opacity="0.35"
              />
            </g>

            {/* shimmer */}
            <g opacity={scene.sky === "siang" ? 0.5 : 0.75}>
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={i}
                  x={560 - i * 12}
                  y={438 + i * 16}
                  width={110 + i * 26}
                  height="3"
                  rx="1.5"
                  fill={pal.orb}
                  style={{ animation: `shimmer ${2.4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite` }}
                />
              ))}
            </g>

            {/* fireflies / spray motes */}
            <g>
              {motes.slice(0, Math.round((scene.stars / 100) * motes.length)).map((m, i) => (
                <circle
                  key={i}
                  cx={m.x}
                  cy={m.y}
                  r={m.s}
                  fill={scene.sky === "malam" ? "#F7CE68" : "#CFE9EE"}
                  opacity="0.7"
                  style={{ animation: `floatUp ${m.dur}s linear ${m.delay}s infinite` }}
                />
              ))}
            </g>

            <rect width="800" height="600" fill="none" stroke="#04202B" strokeWidth="2" opacity="0.4" />
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-parchment/10" />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-parchment/20 bg-abyss/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold backdrop-blur">
          {pal.label} · Bahtera Nuh
        </div>
      </div>

      {/* ---------------- permanently visible control rail ---------------- */}
      <div className="mt-3 rounded-[22px] border border-foam/20 bg-hull/80 p-3 backdrop-blur-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-mist">
            <IconWave width={15} height={15} className="text-foam" />
            Atur adegan
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={randomize}
              className="flex items-center gap-1.5 rounded-full border border-foam/25 px-2.5 py-1.5 text-[11px] font-semibold text-parchment transition hover:border-amber hover:bg-amber/15 hover:text-gold active:scale-95"
              title="Acak cuaca"
            >
              <IconDice width={14} height={14} /> Acak
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full border border-foam/25 px-2.5 py-1.5 text-[11px] font-semibold text-parchment transition hover:border-amber hover:bg-amber/15 hover:text-gold active:scale-95"
              title="Kembalikan pengaturan awal"
            >
              <IconRefresh width={14} height={14} /> Reset
            </button>
            <button
              onClick={download}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full bg-amber px-3 py-1.5 text-[11px] font-bold text-abyss transition hover:bg-gold active:scale-95 disabled:opacity-60"
              title="Unduh adegan sebagai PNG"
            >
              <IconDownload width={14} height={14} /> {busy ? "..." : "PNG"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* sky */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-mist">
              Waktu langit
            </span>
            <div className="flex gap-1 rounded-xl border border-foam/15 bg-abyss/60 p-1">
              {(Object.keys(SKY) as SkyId[]).map((k) => {
                const on = scene.sky === k;
                const Ico = k === "malam" ? IconMoon : k === "siang" ? IconSun : k === "fajar" ? IconRain : IconWave;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      set("sky", k);
                      ambience.blip(on ? 440 : 620, 0.1);
                    }}
                    aria-pressed={on}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                      on
                        ? "bg-gradient-to-b from-amber to-coral text-abyss shadow-[0_6px_18px_-6px_rgba(242,166,59,0.8)]"
                        : "text-mist hover:bg-foam/10 hover:text-parchment"
                    }`}
                  >
                    <Ico width={14} height={14} />
                    {SKY[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          <Slider label="Hujan" value={scene.rain} onChange={(v) => set("rain", v)} />
          <Slider label="Tinggi ombak" value={scene.waves} onChange={(v) => set("waves", v)} />
          <Slider label="Angin" value={scene.wind} onChange={(v) => set("wind", v)} />
          <Slider label="Bintang" value={scene.stars} onChange={(v) => set("stars", v)} />

          <Toggle label="Pelangi" on={scene.rainbow} onChange={(v) => set("rainbow", v)} />
          <Toggle label="Penumpang hewan" on={scene.animals} onChange={(v) => set("animals", v)} />
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block select-none">
      <span className="mb-1 flex items-baseline justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-mist">
        {label}
        <span className="font-numeric text-[11px] tracking-normal text-gold">{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ ["--pct" as string]: `${value}%` }}
        aria-label={label}
      />
    </label>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => {
        onChange(!on);
        ambience.blip(on ? 380 : 700, 0.1);
      }}
      aria-pressed={on}
      className="flex items-center justify-between gap-2 rounded-xl border border-foam/15 bg-abyss/50 px-3 py-2 text-left transition hover:border-foam/40"
    >
      <span className="text-[11px] font-semibold text-parchment">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-foam" : "bg-mist/25"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-parchment shadow transition-all ${on ? "left-4.5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
