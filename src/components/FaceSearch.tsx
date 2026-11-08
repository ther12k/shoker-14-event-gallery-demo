import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PHOTOS, SESSIONS } from "@/data/event";
import { Reveal, useToast } from "@/lib/store";
import { ambience } from "@/lib/audio";
import { euclideanDistance, type FaceBoundingBox } from "@/lib/faceSearchUtils";
import { browserDetectFaces, browserEmbedFace } from "@/lib/faceEngine";

/** Static GitHub Pages build runs the pipeline fully in the browser */
const BROWSER = import.meta.env.VITE_FACE_ENGINE === "browser";
const BASE = import.meta.env.BASE_URL;
const cropSrc = (url: string) => (url.startsWith("/") ? url : BASE + url);
import {
  IconClose,
  IconInfo,
  IconRefresh,
  IconSearch,
  IconSparkle,
  IconUsers,
} from "./Icons";

/* ── API types (mirrors backend payload; descriptors never leave the server) ── */

interface FaceRecord {
  descriptor?: number[];
  faceId: string;
  fileId: string;
  photoTitle: string;
  category: string;
  session: number;
  time: string;
  fileName: string;
  box: FaceBoundingBox;
  cropUrl: string;
  detectionScore: number;
  groupId: string;
}

interface FaceGroup {
  groupId: string;
  faces: FaceRecord[];
  representative: FaceRecord;
  photoIds: string[];
  photoCount: number;
}

interface FaceGroupsPayload {
  groups: FaceGroup[];
  faces: FaceRecord[];
  indexedPhotosCount: number;
  totalFaces: number;
  generatedAt: string;
}

interface ScanStatus {
  running: boolean;
  processed: number;
  total: number;
  failed: number;
  done: boolean;
  lastFile?: string;
}

interface DetectedFace {
  box: FaceBoundingBox;
  score: number;
  preview: string;
}

interface Match {
  fileId: string;
  similarity: number;
  faceId: string;
  cropUrl: string;
  photoTitle: string;
  category: string;
  time: string;
  groupId: string;
}

const openPhoto = (photoId: string) => {
  const photo = PHOTOS.find((p) => p.id === photoId);
  if (!photo) return;
  window.dispatchEvent(new CustomEvent("shoker:open-photo", { detail: { id: photo.id } }));
};

/** Shrinks an uploaded image client-side so payloads stay small and fast. */
async function shrinkImage(dataUrl: string, max = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      if (scale >= 1) return resolve(dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Berkas tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });

/* ── Section ─────────────────────────────────────────────────────────────── */

export function FaceSearch() {
  const { push } = useToast();
  const [payload, setPayload] = useState<FaceGroupsPayload | null>(null);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [activeGroup, setActiveGroup] = useState<FaceGroup | null>(null);
  const [showAllGroups, setShowAllGroups] = useState(false);

  const loadFaces = useCallback(async () => {
    try {
      if (BROWSER) {
        const res = await fetch(BASE + "demo/faces.json");
        if (!res.ok) return;
        const raw = await res.json();
        const byId = new Map<string, FaceRecord>(raw.faces.map((f: FaceRecord) => [f.faceId, f]));
        setPayload({
          groups: raw.groups.map((g: any) => ({
            groupId: g.groupId,
            faces: g.faces.map((id: string) => byId.get(id)).filter(Boolean),
            representative: byId.get(g.representative),
            photoIds: g.photoIds,
            photoCount: g.photoCount,
          })),
          faces: raw.faces,
          indexedPhotosCount: raw.indexedPhotosCount,
          totalFaces: raw.totalFaces,
          generatedAt: raw.generatedAt,
        });
      } else {
        const res = await fetch("/api/faces");
        if (res.ok) setPayload(await res.json());
      }
    } catch {
      /* backend offline — panel shows its idle hint */
    }
  }, []);

  useEffect(() => {
    loadFaces();
  }, [loadFaces]);


  useEffect(() => {
    try {
      const raw = localStorage.getItem("shoker14.faces.hintDismissed");
      if (raw) setHintDismissed(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  /* poll scan progress while a worker run is active */
  useEffect(() => {
    if (!status?.running) return;
    const t = window.setInterval(async () => {
      try {
        const res = await fetch("/api/faces/scan/status");
        if (!res.ok) return;
        const next: ScanStatus = await res.json();
        setStatus(next);
        if (!next.running) {
          window.clearInterval(t);
          await loadFaces();
          push({
            title: next.failed > 0 ? "Pemindaian selesai (sebagian)" : "Pemindaian selesai",
            desc: "Data wajah siap — grup & pencarian wajah telah diperbarui.",
            tone: next.failed > 0 ? "warn" : "ok",
          });
        }
      } catch { /* keep polling */ }
    }, 1500);
    return () => window.clearInterval(t);
  }, [status?.running, loadFaces, push]);

  const startScan = async () => {
    ambience.blip(660, 0.12);
    try {
      const res = await fetch("/api/faces/scan", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error);
      setStatus({ running: true, processed: 0, total: PHOTOS.length, failed: 0, done: false });
      push({ title: "Pemindaian dimulai", desc: body?.reason, tone: "info" });
    } catch (err: any) {
      push({ title: "Gagal memulai pemindaian", desc: err?.message, tone: "bad" });
    }
  };

  const [hintDismissed, setHintDismissed] = useState(false);
  const dismissHint = () => {
    setHintDismissed(true);
    try {
      localStorage.setItem("shoker14.faces.hintDismissed", "true");
    } catch { /* ignore */ }
  };

  const ready = (payload?.totalFaces ?? 0) > 0;
  const multiGroups = useMemo(
    () => (payload?.groups ?? []).filter((g) => g.photoCount >= 2),
    [payload]
  );
  const visibleGroups = showAllGroups ? payload?.groups ?? [] : multiGroups;

  const groupPhotos = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.photoIds
      .map((fileId) => PHOTOS.find((p) => p.id === fileId))
      .filter((p): p is (typeof PHOTOS)[number] => Boolean(p));
  }, [activeGroup]);

  const pct = status && status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;

  return (
    <section id="wajah" className="relative overflow-hidden bg-abyss py-16 text-parchment sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 12%, #F2A63B 0, transparent 40%), radial-gradient(circle at 85% 80%, #46C3B2 0, transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* heading */}
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
              <IconUsers width={14} height={14} /> Cari Wajah · Pengenalan Lokal
            </span>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold sm:text-6xl">
              Temukan foto lewat <span className="italic text-gold">satu potret wajah</span>
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mist">
              Unggah atau tempel potongan wajah dari galeri — mesin pencari wajah mencocokkannya dengan{" "}
              <strong className="text-parchment">{payload?.totalFaces ?? 0} wajah</strong> dari{" "}
              <strong className="text-parchment">{payload?.indexedPhotosCount ?? 23} berkas</strong>{" "}
              ilustrasi galeri. Seluruh proses berjalan di server, tanpa mengirim foto ke layanan
              luar.
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex sm:shrink-0 sm:flex-wrap">
            <DarkStat n={payload?.totalFaces ?? 0} label="Wajah terindeks" />
            <DarkStat n={multiGroups.length} label="Grup orang" accent />
            <DarkStat n={payload?.indexedPhotosCount ?? 0} label="Berkas dipindai" />
          </div>
        </Reveal>

        {!hintDismissed && (
          <Reveal delay={40} className="mt-6">
            <div className="flex items-start gap-3 rounded-2xl border border-parchment/15 bg-parchment/5 px-4 py-3 text-[13px] leading-relaxed text-mist">
              <IconInfo width={16} height={16} className="mt-0.5 shrink-0 text-gold" />
              <p>
                Foto yang Anda unggah hanya dipakai sejenak untuk membuat pola wajah (encoding) di
                memori server dan tidak disimpan. Hasil pencarian menampilkan foto dokumentasi
                Shoker #14 yang paling mirip.
              </p>
              <button
                onClick={dismissHint}
                aria-label="Tutup keterangan"
                className="ml-auto rounded-full p-1 text-mist hover:bg-parchment/10 hover:text-parchment"
              >
                <IconClose width={14} height={14} />
              </button>
            </div>
          </Reveal>
        )}

        {/* upload search */}
        <Reveal delay={80} className="mt-8">
          <UploadSearch ready={ready} faces={payload?.faces ?? []} />
        </Reveal>

        {/* scan progress / idle control */}
        {!ready && !BROWSER && (
          <Reveal delay={100} className="mt-6">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-parchment/25 bg-parchment/5 px-6 py-12 text-center">
              <IconSparkle width={34} height={34} className="text-gold" />
              <div>
                <h3 className="font-display text-2xl font-semibold">Data wajah belum tersedia</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-mist">
                  Jalankan pemindaian sekali untuk membangun indeks wajah dari seluruh ilustrasi galeri
                  ({status?.running ? "sedang berjalan…" : "± 1–2 menit"}).
                </p>
              </div>
              {status?.running ? (
                <div className="w-full max-w-sm">
                  <div className="h-2 overflow-hidden rounded-full bg-parchment/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-teal transition-[width] duration-700"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                  <p className="font-numeric mt-2 text-xs text-mist">
                    {status.processed}/{status.total} berkas · {status.lastFile || "memulai…"}
                  </p>
                </div>
              ) : (
                <button
                  onClick={startScan}
                  className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-abyss shadow-lift transition hover:bg-amber active:scale-95"
                >
                  <IconRefresh width={16} height={16} /> Pindai galeri sekarang
                </button>
              )}
            </div>
          </Reveal>
        )}

        {/* person groups */}
        {ready && (
          <Reveal delay={120} className="mt-10">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl font-semibold">
                Wajah yang sering muncul{" "}
                <span className="font-numeric text-sm font-normal text-mist">
                  ({multiGroups.length} orang di ≥ 2 foto)
                </span>
              </h3>
              {payload!.groups.length > multiGroups.length && (
                <button
                  onClick={() => {
                    setShowAllGroups((v) => !v);
                    ambience.blip(showAllGroups ? 480 : 700, 0.1);
                  }}
                  className="text-xs font-semibold text-gold underline underline-offset-4"
                >
                  {showAllGroups ? "hanya tampilkan yang sering muncul" : "tampilkan semua grup"}
                </button>
              )}
            </div>
            <div className="rail-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {visibleGroups.map((g) => {
                const on = activeGroup?.groupId === g.groupId;
                return (
                  <button
                    key={g.groupId}
                    onClick={() => {
                      setActiveGroup(on ? null : g);
                      ambience.blip(on ? 460 : 680, 0.1);
                    }}
                    aria-pressed={on}
                    className={`group relative h-32 w-32 shrink-0 snap-start overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                      on
                        ? "border-gold shadow-[0_12px_30px_-12px_rgba(242,166,59,0.8)]"
                        : "border-parchment/15 opacity-90 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={cropSrc(g.representative.cropUrl)}
                      alt={`Wajah grup ${g.groupId}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-abyss/95 via-abyss/20 to-transparent" />
                    <span className="font-numeric absolute bottom-2 left-2 rounded-full bg-abyss/80 px-2 py-0.5 text-[11px] font-bold text-parchment backdrop-blur-sm">
                      {g.photoCount} foto
                    </span>
                    <span className="absolute bottom-2 right-2 flex -space-x-1.5">
                      {g.faces.slice(0, 3).map((f) => (
                        <img
                          key={f.faceId}
                          src={cropSrc(f.cropUrl)}
                          alt=""
                          loading="lazy"
                          className="h-6 w-6 rounded-full border border-parchment/60 object-cover"
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeGroup && (
              <div className="mt-4 rounded-3xl border border-parchment/12 bg-parchment/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mist">
                    {groupPhotos.length} foto memuat wajah ini — klik untuk membuka
                  </p>
                  <button
                    onClick={() => setActiveGroup(null)}
                    aria-label="Tutup grup"
                    className="rounded-full p-1.5 text-mist hover:bg-parchment/10 hover:text-parchment"
                  >
                    <IconClose width={15} height={15} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
                  {groupPhotos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openPhoto(p.id)}
                      className="group relative overflow-hidden rounded-xl border border-parchment/10"
                      aria-label={`Buka foto ${p.title}`}
                    >
                      <img
                        src={p.src}
                        alt={p.title}
                        loading="lazy"
                        className="ph-img aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abyss/95 to-transparent px-2 pb-1.5 pt-5 text-left">
                        <span className="font-numeric block text-[9px] font-bold text-gold">
                          {p.time} WIB
                        </span>
                        <span className="block truncate text-[10px] font-semibold text-parchment">
                          {p.title}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ── Upload & search card ────────────────────────────────────────────────── */

function UploadSearch({ ready, faces }: { ready: boolean; faces: FaceRecord[] }) {
  const facesRef = useRef<FaceRecord[]>(faces);
  useEffect(() => {
    facesRef.current = faces;
  }, [faces]);
  const { push } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedFace[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [drawnBox, setDrawnBox] = useState<FaceBoundingBox | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [queryPreview, setQueryPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<FaceBoundingBox | null>(null);

  const reset = () => {
    setImage(null);
    setDetected([]);
    setSelected(null);
    setDrawnBox(null);
    setMatches(null);
    setQueryPreview(null);
    setDragRect(null);
  };

  const runDetect = useCallback(
    async (img: string) => {
      setIsDetecting(true);
      setMatches(null);
      try {
        const faces: DetectedFace[] = BROWSER
          ? await browserDetectFaces(img)
          : await (async () => {
              const res = await fetch("/api/faces/detect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: img }),
              });
              const body = await res.json();
              if (!res.ok) throw new Error(body?.error || "Deteksi wajah gagal.");
              return (body.faces ?? []) as DetectedFace[];
            })();
        setDetected(faces);
        setSelected(faces.length ? 0 : null);
      } catch (err: any) {
        push({ title: "Deteksi gagal", desc: err?.message, tone: "bad" });
        setDetected([]);
      } finally {
        setIsDetecting(false);
      }
    },
    [push]
  );

  const acceptFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        push({ title: "Berkas bukan gambar", desc: "Gunakan foto JPG atau PNG.", tone: "warn" });
        return;
      }
      const raw = await readFileAsDataUrl(file);
      const shrunk = await shrinkImage(raw);
      setImage(shrunk);
      setDrawnBox(null);
      ambience.blip(740, 0.1);
      runDetect(shrunk);
    },
    [push, runDetect]
  );

  /* paste support while the card is on screen */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? [])[0];
      if (file) acceptFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile]);

  const search = async () => {
    if (!image) return;
    setIsSearching(true);
    ambience.blip(820, 0.12);
    try {
      const box = drawnBox ?? (selected !== null ? detected[selected]?.box : undefined);
      let matches: Match[] | undefined;
      let preview: string | null = null;
      if (BROWSER) {
        const { descriptor, preview: pv } = await browserEmbedFace(image, box ?? undefined);
        preview = pv;
        const bestByPhoto = new Map<string, Match>();
        for (const face of facesRef.current) {
          if (!face.descriptor) continue;
          const distance = euclideanDistance(descriptor, face.descriptor);
          if (distance > 1.0) continue;
          const similarity = Math.round(Math.max(0, (1 - distance / 1.414)) * 100);
          const existing = bestByPhoto.get(face.fileId);
          if (!existing || similarity > existing.similarity) {
            bestByPhoto.set(face.fileId, {
              fileId: face.fileId,
              similarity,
              faceId: face.faceId,
              cropUrl: cropSrc(face.cropUrl),
              photoTitle: face.photoTitle,
              category: face.category,
              time: face.time,
              groupId: face.groupId,
            });
          }
        }
        matches = Array.from(bestByPhoto.values())
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 40);
      } else {
        const res = await fetch("/api/faces/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image, box }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Pencarian wajah gagal.");
        matches = body.matches;
        preview = body.preview ?? null;
      }
      setMatches(matches ?? []);
      setQueryPreview(preview);
      if (!matches?.length) {
        push({
          title: "Tidak ada kecocokan",
          desc: "Coba foto lain yang lebih jelas, wajah menghadap kamera.",
          tone: "warn",
        });
      }
    } catch (err: any) {
      push({ title: "Pencarian gagal", desc: err?.message, tone: "bad" });
    } finally {
      setIsSearching(false);
    }
  };

  /* pointer drag → normalized box on the preview */
  const boxFromEvent = (e: React.PointerEvent<HTMLDivElement>): { x: number; y: number } => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const pctStyle = (b: FaceBoundingBox): React.CSSProperties => ({
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.w * 100}%`,
    height: `${b.h * 100}%`,
  });

  const busy = isDetecting || isSearching;

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* left: dropzone / preview */}
      <div
        className="lg:col-span-5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          acceptFile(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-parchment/15 bg-parchment/5 p-4">
          {!image ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-parchment/25 px-6 py-10 text-center transition hover:border-gold/60 hover:bg-parchment/5"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                <IconSearch width={26} height={26} />
              </span>
              <span>
                <span className="font-display block text-xl font-semibold text-parchment">
                  Unggah atau tempel foto wajah
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-mist">
                  Klik untuk memilih berkas, tarik-lepas ke sini, atau tempel (Ctrl/⌘+V) dari
                  papan klip. Potong satu wajah dari foto galeri mana pun, unggah, dan lihat hasilnya.
                </span>
              </span>
              <span className="font-numeric rounded-full bg-parchment/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-mist">
                JPG / PNG · otomatis diperkecil · tidak disimpan
              </span>
            </button>
          ) : (
            <div>
              <div
                className="relative touch-none select-none overflow-hidden rounded-2xl"
                onPointerDown={(e) => {
                  if (busy) return;
                  if ((e.target as HTMLElement).dataset.box) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const p = boxFromEvent(e);
                  dragRef.current = p;
                  setDragRect({ x: p.x, y: p.y, w: 0, h: 0 });
                }}
                onPointerMove={(e) => {
                  if (!dragRef.current) return;
                  const p = boxFromEvent(e);
                  const s = dragRef.current;
                  setDragRect({
                    x: Math.min(s.x, p.x),
                    y: Math.min(s.y, p.y),
                    w: Math.abs(p.x - s.x),
                    h: Math.abs(p.y - s.y),
                  });
                }}
                onPointerUp={() => {
                  const wasDragging = dragRef.current !== null;
                  dragRef.current = null;
                  if (wasDragging && dragRect && dragRect.w > 0.04 && dragRect.h > 0.04) {
                    setDrawnBox(dragRect);
                    setSelected(null);
                    ambience.blip(600, 0.08);
                  }
                  setDragRect(null);
                }}
              >
                <img src={image} alt="Foto yang diunggah" className="block max-h-[420px] w-full object-contain" />
                {/* detected face boxes */}
                {detected.map((f, i) => (
                  <button
                    key={i}
                    data-box="1"
                    onClick={() => {
                      setSelected(i);
                      setDrawnBox(null);
                      ambience.blip(700, 0.08);
                    }}
                    aria-label={`Pilih wajah ${i + 1} (skor ${Math.round(f.score * 100)}%)`}
                    className={`absolute rounded-lg border-2 transition-all duration-200 ${
                      selected === i && !drawnBox
                        ? "border-gold bg-gold/15 shadow-[0_0_0_3px_rgba(242,166,59,0.35)]"
                        : "border-teal/80 bg-teal/10 hover:border-gold"
                    }`}
                    style={pctStyle(f.box)}
                  >
                    <span className="font-numeric absolute -top-5 left-0 rounded bg-abyss/85 px-1 text-[9px] font-bold text-parchment">
                      {Math.round(f.score * 100)}%
                    </span>
                  </button>
                ))}
                {/* drawn box in progress */}
                {dragRect && (
                  <span
                    className="pointer-events-none absolute rounded-lg border-2 border-dashed border-gold bg-gold/10"
                    style={pctStyle(dragRect)}
                  />
                )}
                {/* committed drawn box */}
                {drawnBox && !dragRect && (
                  <span
                    className="pointer-events-none absolute rounded-lg border-2 border-gold bg-gold/15 shadow-[0_0_0_3px_rgba(242,166,59,0.35)]"
                    style={pctStyle(drawnBox)}
                  />
                )}
                {isDetecting && (
                  <span className="absolute inset-0 grid place-items-center bg-abyss/60 backdrop-blur-[2px]">
                    <span className="font-numeric flex items-center gap-2 rounded-full bg-abyss/85 px-4 py-2 text-xs font-bold text-gold">
                      <IconRefresh width={14} height={14} className="animate-spin" /> Mencari wajah…
                    </span>
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={search}
                  disabled={busy || !ready}
                  className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-abyss shadow-lift transition hover:bg-amber active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconSearch width={16} height={16} />
                  {isSearching ? "Mencari…" : "Cari wajah ini"}
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="rounded-full border border-parchment/25 px-4 py-2.5 text-sm font-semibold text-parchment transition hover:border-gold/60 disabled:opacity-40"
                >
                  Ganti foto
                </button>
                <button
                  onClick={() => {
                    reset();
                    ambience.blip(420, 0.1);
                  }}
                  disabled={busy}
                  className="ml-auto rounded-full p-2 text-mist transition hover:bg-parchment/10 hover:text-parchment disabled:opacity-40"
                  aria-label="Hapus foto & hasil"
                >
                  <IconClose width={16} height={16} />
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-mist">
                {detected.length > 0
                  ? `Ketuk kotak wajah yang dicari, atau seret di atas foto untuk memilih area sendiri. ${detected.length} wajah terdeteksi.`
                  : "Belum ada wajah terdeteksi — seret di atas foto untuk memilih area wajah secara manual."}
                {!ready && " Indeks wajah sedang disiapkan; tombol cari aktif setelah pemindaian selesai."}
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              acceptFile(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      {/* right: results */}
      <div className="lg:col-span-7">
        <div className="min-h-[300px] rounded-3xl border border-parchment/15 bg-parchment/5 p-4">
          {!matches ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <IconSparkle width={30} height={30} className="text-gold/70" />
              <p className="max-w-sm text-[13px] leading-relaxed text-mist">
                Hasil pencarian akan muncul di sini — foto dokumentasi diurutkan dari kemiripan
                tertinggi dengan wajah yang Anda pilih.
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <p className="font-display text-xl font-semibold">Tidak ditemukan kecocokan</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-mist">
                Tidak ada wajah dokumentasi yang cukup mirip. Coba foto lain — biasanya potret
                dekat dengan wajah jelas paling akurat.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center gap-3">
                {queryPreview && (
                  <img
                    src={queryPreview}
                    alt="Wajah yang dicari"
                    className="h-12 w-12 rounded-xl border-2 border-gold object-cover"
                  />
                )}
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mist">
                  {matches.length} foto cocok — klik untuk membuka
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {matches.map((m) => {
                  const photo = PHOTOS.find((p) => p.id === m.fileId);
                  const session = SESSIONS.find((sx) => photo?.session === sx.n);
                  return (
                    <button
                      key={m.fileId}
                      onClick={() => openPhoto(m.fileId)}
                      className="group relative overflow-hidden rounded-2xl border border-parchment/10 text-left"
                      aria-label={`Buka ${m.photoTitle} (${m.similarity}% mirip)`}
                    >
                      <img
                        src={photo?.src ?? m.cropUrl}
                        alt={m.photoTitle}
                        loading="lazy"
                        className="ph-img aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-abyss/95 via-abyss/25 to-transparent" />
                      <span className="font-numeric absolute right-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-abyss shadow">
                        {m.similarity}%
                      </span>
                      <span className="absolute inset-x-0 bottom-0 p-2.5">
                        <span className="font-numeric block text-[9px] font-bold text-gold">
                          {m.time} WIB{session ? ` · ${session.label}` : ""}
                        </span>
                        <span className="block truncate text-[12px] font-semibold leading-tight text-parchment">
                          {m.photoTitle}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function DarkStat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-2 py-3 text-center sm:min-w-[76px] sm:px-4 ${
        accent ? "border-gold/40 bg-gold/10" : "border-parchment/15 bg-parchment/5"
      }`}
    >
      <div className={`font-display font-numeric text-3xl font-semibold ${accent ? "text-gold" : "text-teal"}`}>
        {n}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist">{label}</div>
    </div>
  );
}
