import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconCopy,
  IconDownload,
  IconHeart,
  IconPause,
  IconPlay,
  IconZoom,
} from "./Icons";
import { ALBUMS, CATEGORY_TONE, type Photo } from "@/data/event";
import { copyText, fmtDate, useToast } from "@/lib/store";
import { ambience } from "@/lib/audio";

export function Lightbox({
  photos,
  index,
  setIndex,
  onClose,
  favorites,
  toggleFavorite,
}: {
  photos: Photo[];
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const photo = photos[index];
  const { push } = useToast();
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (dir: number) => {
      if (!photos.length) return;
      setIndex((index + dir + photos.length) % photos.length);
      setZoom(false);
      setLoaded(false);
      ambience.shutter();
    },
    [index, photos.length, setIndex],
  );

  /* keyboard + focus trap */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key.toLowerCase() === "f" && photo) {
        toggleFavorite(photo.id);
        ambience.blip(760, 0.12);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "Tab" && shellRef.current) {
        const f = shellRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shellRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose, photo, toggleFavorite]);

  /* slideshow */
  useEffect(() => {
    if (!playing) return;
    const h = window.setTimeout(() => go(1), 3600);
    return () => window.clearTimeout(h);
  }, [playing, index, go]);

  /* keep active thumb in view */
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  /* deep link */
  useEffect(() => {
    if (photo) history.replaceState(null, "", `#foto-${photo.id}`);
  }, [photo]);

  if (!photo) return null;

  const fav = favorites.includes(photo.id);
  const album = ALBUMS.find((a) => a.id === photo.album);

  const download = () => {
    const a = document.createElement("a");
    a.href = photo.src;
    a.download = `shoker-${photo.id}-${photo.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    ambience.chime();
    push({ title: "Foto diunduh", desc: photo.title, tone: "ok" });
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#foto-${photo.id}`;
    const ok = await copyText(url);
    push({
      title: ok ? "Tautan foto disalin" : "Tidak bisa menyalin",
      desc: ok ? url : "Salin manual dari bilah alamat.",
      tone: ok ? "ok" : "warn",
    });
  };

  return (
    <div
      ref={shellRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${photo.title}`}
      className="fixed inset-0 z-[90] flex flex-col bg-abyss/96 outline-none backdrop-blur-xl"
      style={{ animation: "popIn .28s cubic-bezier(.22,1,.36,1) both" }}
    >
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-foam/15 px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-numeric rounded-lg bg-foam/15 px-2.5 py-1 text-xs font-bold text-foam">
            {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </span>
          <span className="hidden truncate text-sm font-semibold text-parchment sm:block">
            {album?.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ToolBtn onClick={() => setPlaying((p) => !p)} active={playing} label={playing ? "Jeda slideshow" : "Putar slideshow"}>
            {playing ? <IconPause width={17} height={17} /> : <IconPlay width={17} height={17} />}
          </ToolBtn>
          <ToolBtn onClick={() => setZoom((z) => !z)} active={zoom} label="Perbesar">
            <IconZoom width={17} height={17} />
          </ToolBtn>
          <ToolBtn
            onClick={() => {
              toggleFavorite(photo.id);
              ambience.blip(fav ? 400 : 820, 0.13);
            }}
            active={fav}
            label="Simpan ke favorit"
          >
            <IconHeart width={17} height={17} fill={fav ? "currentColor" : "none"} />
          </ToolBtn>
          <ToolBtn onClick={share} label="Salin tautan">
            <IconCopy width={17} height={17} />
          </ToolBtn>
          <ToolBtn onClick={download} label="Unduh foto">
            <IconDownload width={17} height={17} />
          </ToolBtn>
          <button
            onClick={onClose}
            aria-label="Tutup galeri"
            className="ml-1 rounded-full bg-coral p-2 text-abyss transition hover:bg-amber active:scale-90"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>
      </div>

      {/* stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 py-3 sm:px-16"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x;
          const dy = e.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <button
          onClick={() => go(-1)}
          aria-label="Foto sebelumnya"
          className="absolute left-1 z-10 hidden rounded-full border border-foam/25 bg-hull/80 p-2.5 text-parchment transition hover:border-amber hover:text-gold active:scale-90 sm:block"
        >
          <IconChevronLeft width={22} height={22} />
        </button>

        <figure className="flex h-full max-h-full min-h-0 w-full max-w-5xl flex-col items-center justify-center">
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: photo.tone }}
            onMouseMove={(e) => {
              if (!zoom) return;
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            }}
            onClick={() => setZoom((z) => !z)}
          >
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="h-8 w-8 rounded-full border-2 border-parchment/25 border-t-amber anim-spin-slow" style={{ animationDuration: "0.9s" }} />
              </div>
            )}
            <img
              key={photo.id}
              src={photo.src}
              alt={photo.caption}
              onLoad={() => setLoaded(true)}
              draggable={false}
              className={`max-h-full max-w-full select-none object-contain transition-[transform,opacity] duration-500 ${
                zoom ? "cursor-zoom-out scale-[2.1]" : "cursor-zoom-in scale-100"
              } ${loaded ? "opacity-100" : "opacity-0"}`}
              style={{ transformOrigin: origin }}
            />
          </div>

          <figcaption className="mt-3 w-full shrink-0 rounded-2xl border border-foam/15 bg-hull/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-abyss"
                style={{ background: CATEGORY_TONE[photo.category] }}
              >
                {photo.category}
              </span>
              <h3 className="font-display text-lg font-semibold text-parchment">{photo.title}</h3>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-mist">{photo.caption}</p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-mist/70">
              {photo.session
                ? `Sesi ${photo.session} · ${photo.time} WIB · ${fmtDate(photo.date)} · ${photo.credit}`
                : `${fmtDate(photo.date)} · Dokumentasi ${photo.credit}`}
            </p>
          </figcaption>
        </figure>

        <button
          onClick={() => go(1)}
          aria-label="Foto berikutnya"
          className="absolute right-1 z-10 hidden rounded-full border border-foam/25 bg-hull/80 p-2.5 text-parchment transition hover:border-amber hover:text-gold active:scale-90 sm:block"
        >
          <IconChevronRight width={22} height={22} />
        </button>

        {playing && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-foam/20">
            <div
              key={index}
              className="h-full bg-gradient-to-r from-amber to-coral"
              style={{ animation: "slideProgress 3.6s linear forwards" }}
            />
          </div>
        )}
      </div>

      {/* filmstrip */}
      <div className="shrink-0 border-t border-foam/15 bg-hull/50 px-2 py-2">
        <div ref={stripRef} className="rail-thin flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              data-i={i}
              onClick={() => {
                setIndex(i);
                setZoom(false);
                setLoaded(false);
              }}
              aria-label={`Buka ${p.title}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? "border-amber opacity-100"
                  : "border-transparent opacity-45 hover:opacity-90"
              }`}
              style={{ background: p.tone }}
            >
              <img src={p.src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        <p className="mt-1 hidden text-center text-[10px] uppercase tracking-[0.2em] text-mist/60 sm:block">
          ← → pindah · F favorit · Spasi slideshow · Esc tutup
        </p>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-full border p-2 transition active:scale-90 ${
        active
          ? "border-amber bg-amber/20 text-gold"
          : "border-foam/20 text-mist hover:border-foam/50 hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}
