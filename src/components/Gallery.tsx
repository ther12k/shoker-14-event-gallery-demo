import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ALBUMS,
  CATEGORIES,
  CATEGORY_TONE,
  EVENT,
  PHOTOS,
  SESSIONS,
  type AlbumId,
  type Category,
  type Photo,
} from "@/data/event";
import { Reveal, jumpTo, useToast } from "@/lib/store";
import { ambience } from "@/lib/audio";
import { Lightbox } from "./Lightbox";
import {
  IconArk,
  IconChevronDown,
  IconDownload,
  IconExpand,
  IconGrid,
  IconHeart,
  IconMosaic,
  IconSearch,
  IconClose,
} from "./Icons";

type Sort = "baru" | "lama" | "populer" | "az";
const SORTS: { id: Sort; label: string }[] = [
  { id: "baru", label: "Terbaru" },
  { id: "lama", label: "Terlama" },
  { id: "populer", label: "Paling disukai" },
  { id: "az", label: "Judul A–Z" },
];

const STEP = 6;
const ALBUM_COVER: Record<AlbumId, string> = {
  shoker14: "r05",
  shoker13: "p12",
  shoker12: "p15",
  grafis: "p01",
};
const ratioOf = (p: Photo) => (p.shape === "tall" ? 4.3 / 3 : p.shape === "wide" ? 10 / 16 : 3.1 / 4);

export function Gallery({
  favorites,
  toggleFavorite,
}: {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [album, setAlbum] = useState<AlbumId | "all">("shoker14");
  const [cat, setCat] = useState<Category | "all">("all");
  const [session, setSession] = useState<number | "all">("all");
  const [sort, setSort] = useState<Sort>("baru");
  const [layout, setLayout] = useState<"mosaic" | "grid">("mosaic");
  const [cols, setCols] = useState(3);
  const [favOnly, setFavOnly] = useState(false);
  const [visible, setVisible] = useState(12);
  const [open, setOpen] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const deepLinked = useRef(false);
  const [colW, setColW] = useState(0);
  const [narrow, setNarrow] = useState(false);

  const gap = narrow ? 10 : 14;
  const spanFor = (p: Photo) => {
    if (!colW) return 34;
    return Math.max(6, Math.ceil((colW * ratioOf(p) + gap) / (8 + gap)));
  };

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 700px)");
    const measure = () => {
      const isNarrow = mq.matches;
      const c = isNarrow ? 2 : cols;
      const g = isNarrow ? 10 : 14;
      setNarrow(isNarrow);
      setColW(Math.max(0, (el.clientWidth - g * (c - 1)) / c));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mq.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", measure);
    };
  }, [cols, layout]);

  const likesOf = (p: Photo) => p.likes + (favorites.includes(p.id) ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = PHOTOS.filter((p) => {
      if (album !== "all" && p.album !== album) return false;
      if (cat !== "all" && p.category !== cat) return false;
      if (session !== "all" && p.session !== session) return false;
      if (favOnly && !favorites.includes(p.id)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.credit.toLowerCase().includes(q)
      );
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "baru") return b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
      if (sort === "lama") return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      if (sort === "populer") return likesOf(b) - likesOf(a);
      return a.title.localeCompare(b.title, "id");
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, album, cat, session, sort, favOnly, favorites]);

  useEffect(() => setVisible(12), [query, album, cat, session, sort, favOnly]);

  /* deep link: #foto-p12 */
  useEffect(() => {
    if (deepLinked.current) return;
    deepLinked.current = true;
    const m = location.hash.match(/^#foto-(\w+)$/);
    if (!m) return;
    const i = PHOTOS.findIndex((p) => p.id === m[1]);
    if (i >= 0) {
      setAlbum("all");
      setCat("all");
      setSession("all");
      setFavOnly(false);
      setQuery("");
      setSort("baru");
      setVisible(PHOTOS.length);
      window.setTimeout(() => {
        const idx = [...PHOTOS]
          .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
          .findIndex((p) => p.id === m[1]);
        setOpen(idx >= 0 ? idx : i);
        jumpTo("galeri");
      }, 320);
    }
  }, []);


  /* face search panel (and other sections) can jump straight into a photo */
  useEffect(() => {
    const openById = (id: string) => {
      const target = PHOTOS.find((p) => p.id === id);
      if (!target) return;
      setAlbum("all");
      setCat("all");
      setSession("all");
      setFavOnly(false);
      setQuery("");
      setSort("baru");
      setVisible(PHOTOS.length);
      window.setTimeout(() => {
        const idx = [...PHOTOS]
          .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
          .findIndex((p) => p.id === id);
        if (idx >= 0) {
          setOpen(idx);
          ambience.shutter();
        }
      }, 60);
    };
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (id) openById(id);
    };
    window.addEventListener("shoker:open-photo", handler);
    return () => window.removeEventListener("shoker:open-photo", handler);
  }, []);

  const closeLightbox = () => {
    setOpen(null);
    history.replaceState(null, "", location.pathname + location.search + "#galeri");
  };

  const resetAll = () => {
    setQuery("");
    setAlbum("all");
    setCat("all");
    setSession("all");
    setFavOnly(false);
    setSort("baru");
    push({ title: "Filter dibersihkan", desc: `${PHOTOS.length} foto ditampilkan kembali.`, tone: "info" });
  };

  const shown = filtered.slice(0, visible);
  const albumCounts = useMemo(() => {
    const m = new Map<string, number>();
    PHOTOS.forEach((p) => m.set(p.album, (m.get(p.album) ?? 0) + 1));
    return m;
  }, []);
  const activeFilters =
    (album !== "all" && album !== "shoker14" ? 1 : 0) +
    (cat !== "all" ? 1 : 0) +
    (session !== "all" ? 1 : 0) +
    (favOnly ? 1 : 0) +
    (query ? 1 : 0);
  const result14 = PHOTOS.filter((x) => x.album === "shoker14");
  const sessionCount = (n: number) => result14.filter((x) => x.session === n).length;
  const pristine = activeFilters === 0;
  const highlights = ["r05", "r07", "r14"].map((id) => PHOTOS.find((x) => x.id === id)!);
  const openPhoto = (id: string) => {
    const i = filtered.findIndex((x) => x.id === id);
    if (i >= 0) {
      setOpen(i);
      ambience.shutter();
    }
  };

  return (
    <section id="galeri" className="rail-light relative overflow-hidden bg-parchment py-16 text-cocoa sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 8%, #12798C 0, transparent 42%), radial-gradient(circle at 88% 30%, #E8663C 0, transparent 40%), radial-gradient(circle at 50% 96%, #F2A63B 0, transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* heading */}
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-coral/35 bg-coral/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
              <IconArk width={14} height={14} /> Hasil Kegiatan · 8 Nov 2026
            </span>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold text-cocoa sm:text-6xl">
              Beginilah bahtera itu{" "}
              <span className="italic text-coral">berlayar</span>
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-clay">
              Dokumentasi lengkap Shoker #14 di {EVENT.venue} — {EVENT.participants} anak, tujuh sesi,
              satu pagi. Tersusun berurutan dari registrasi pukul 08.00 sampai doa penutup pukul 12.47.
              Klik foto mana pun untuk membukanya besar.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Stat n={result14.length} label="Foto #14" />
            <Stat n={SESSIONS.length} label="Sesi" />
            <Stat n={EVENT.participants} label="Peserta" />
            <Stat n={favorites.length} label="Favorit" accent />
          </div>
        </Reveal>

        {/* cover story — three frames that carry the day */}
        {pristine && (
          <Reveal delay={60} className="mt-9">
            <div className="grid gap-3 sm:grid-cols-12 sm:grid-rows-2">
              {highlights.map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => openPhoto(h.id)}
                  className={`group relative overflow-hidden rounded-3xl border border-cocoa/10 text-left shadow-lift transition-transform duration-500 hover:-translate-y-1 ${
                    i === 0 ? "sm:col-span-7 sm:row-span-2 h-64 sm:h-[420px]" : "sm:col-span-5 h-44 sm:h-[203px]"
                  }`}
                  style={{ background: h.tone }}
                >
                  <img
                    src={h.src}
                    alt={h.caption}
                    className="ph-img absolute inset-0 h-full w-full object-cover"
                    style={{ ["--z" as string]: h.zoom ?? 1.02, objectPosition: h.pos ?? "50% 45%" }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/45 to-transparent" />
                  <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-parchment">
                    {i === 0 ? "Sorotan utama" : "Sorotan"}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <span className="font-numeric block text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                      Sesi {h.session} · {h.time} WIB
                    </span>
                    <span className={`font-display mt-1 block font-semibold leading-tight text-parchment ${i === 0 ? "text-2xl sm:text-3xl" : "text-lg"}`}>
                      {h.title}
                    </span>
                    {i === 0 && (
                      <span className="mt-1.5 block max-w-md text-[13px] leading-relaxed text-mist">{h.caption}</span>
                    )}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full border border-parchment/40 bg-abyss/50 p-2 text-parchment opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <IconExpand width={16} height={16} />
                  </span>
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {/* session chapters */}
        {(album === "all" || album === "shoker14") && (
          <Reveal delay={90} className="mt-7">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay">
                Telusuri per sesi rundown
              </p>
              {session !== "all" && (
                <button
                  onClick={() => setSession("all")}
                  className="text-xs font-semibold text-coral underline underline-offset-4"
                >
                  tampilkan semua sesi
                </button>
              )}
            </div>
            <div className="rail-thin -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {SESSIONS.map((sx) => {
                const on = session === sx.n;
                return (
                  <button
                    key={sx.n}
                    onClick={() => {
                      setSession(on ? "all" : sx.n);
                      setAlbum("shoker14");
                      ambience.blip(on ? 460 : 640, 0.1);
                    }}
                    aria-pressed={on}
                    className={`group relative w-[132px] shrink-0 snap-start overflow-hidden rounded-2xl border-2 px-3 py-2.5 text-left transition-all duration-300 ${
                      on ? "border-transparent text-parchment" : "border-cocoa/12 bg-parchment hover:border-cocoa/35"
                    }`}
                    style={on ? { background: sx.tone } : undefined}
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: sx.tone, opacity: on ? 0 : 1 }}
                    />
                    <span className={`font-numeric block text-[10px] font-bold tracking-[0.14em] ${on ? "text-parchment/80" : "text-clay"}`}>
                      {sx.time} WIB
                    </span>
                    <span className={`mt-0.5 block text-sm font-bold leading-tight ${on ? "text-parchment" : "text-cocoa"}`}>
                      {sx.label}
                    </span>
                    <span className={`font-numeric mt-1 block text-[10px] font-semibold ${on ? "text-parchment/85" : "text-clay/80"}`}>
                      {sessionCount(sx.n)} foto
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* album rail */}
        <Reveal delay={80} className="mt-9">
          <div className="rail-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            <AlbumCard
              active={album === "all"}
              onClick={() => {
                setAlbum("all");
                ambience.blip(560, 0.1);
              }}
              cover={PHOTOS[0].src}
              label="Semua Foto"
              note="Seluruh arsip Shoker"
              count={PHOTOS.length}
            />
            {ALBUMS.map((a) => (
              <AlbumCard
                key={a.id}
                active={album === a.id}
                onClick={() => {
                  setAlbum(a.id);
                  ambience.blip(620, 0.1);
                }}
                cover={PHOTOS.find((p) => p.id === ALBUM_COVER[a.id])!.src}
                label={a.short}
                note={a.note}
                count={albumCounts.get(a.id) ?? 0}
              />
            ))}
          </div>
        </Reveal>

        {/* toolbar */}
        <Reveal delay={120}>
          <div className="sticky top-[76px] z-30 mt-4 rounded-2xl border border-cocoa/10 bg-paper/95 p-3 shadow-[0_10px_30px_-20px_rgba(42,29,20,0.7)] backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[190px] flex-1">
                <IconSearch
                  width={17}
                  height={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-clay"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari foto, kategori, atau fotografer…"
                  aria-label="Cari foto"
                  className="w-full rounded-xl border border-cocoa/12 bg-parchment py-2.5 pl-9 pr-9 text-sm text-cocoa placeholder:text-clay/60 focus:border-teal focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-clay hover:bg-cocoa/10"
                  >
                    <IconClose width={14} height={14} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  aria-label="Urutkan foto"
                  className="appearance-none rounded-xl border border-cocoa/12 bg-parchment py-2.5 pl-3 pr-9 text-sm font-semibold text-cocoa focus:border-teal focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <IconChevronDown
                  width={15}
                  height={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-clay"
                />
              </div>

              <div className="flex rounded-xl border border-cocoa/12 bg-parchment p-1">
                <IconTab
                  on={layout === "mosaic"}
                  onClick={() => setLayout("mosaic")}
                  label="Tata letak mozaik"
                >
                  <IconMosaic width={16} height={16} />
                </IconTab>
                <IconTab on={layout === "grid"} onClick={() => setLayout("grid")} label="Tata letak kisi">
                  <IconGrid width={16} height={16} />
                </IconTab>
              </div>

              <label className="hidden items-center gap-2 rounded-xl border border-cocoa/12 bg-parchment px-3 py-2 lg:flex">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-clay">Kolom</span>
                <input
                  type="range"
                  min={2}
                  max={5}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-20"
                  style={{ ["--pct" as string]: `${((cols - 2) / 3) * 100}%` }}
                  aria-label="Jumlah kolom"
                />
                <span className="font-numeric w-3 text-xs font-bold text-teal">{cols}</span>
              </label>

              <button
                onClick={() => {
                  setFavOnly((v) => !v);
                  ambience.blip(favOnly ? 420 : 780, 0.12);
                }}
                aria-pressed={favOnly}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-95 ${
                  favOnly
                    ? "border-coral bg-coral text-parchment"
                    : "border-cocoa/12 bg-parchment text-cocoa hover:border-coral/60"
                }`}
              >
                <IconHeart width={16} height={16} fill={favOnly ? "currentColor" : "none"} />
                Favorit
                <span className="font-numeric text-xs opacity-70">{favorites.length}</span>
              </button>
            </div>

            {/* category chips */}
            <div className="rail-thin mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              <Chip on={cat === "all"} onClick={() => setCat("all")}>
                Semua kategori
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c} on={cat === c} onClick={() => setCat(c)} dot={CATEGORY_TONE[c]}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        </Reveal>

        {/* result meta */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-sm text-clay">
            Menampilkan <strong className="font-numeric text-cocoa">{shown.length}</strong> dari{" "}
            <strong className="font-numeric text-cocoa">{filtered.length}</strong> foto
            {activeFilters > 0 && (
              <button onClick={resetAll} className="ml-2 font-semibold text-coral underline underline-offset-4 hover:text-ember">
                bersihkan {activeFilters} filter
              </button>
            )}
          </p>
          <a
            href={EVENT.drive}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-teal transition hover:text-coral"
          >
            <IconDownload width={16} height={16} /> Arsip resolusi penuh di Google Drive
          </a>
        </div>

        {/* grid */}
        <div ref={gridRef} className="mt-4">
          <div ref={measureRef} aria-hidden className="h-0 w-full" />
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-cocoa/20 bg-paper/60 px-6 py-20 text-center">
              <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
                <path d="M14 52h92l-12 20H26z" fill="#E2CFAB" />
                <path d="M34 52V30h52v22z" fill="#E8663C" opacity=".8" />
                <path d="M60 12v18" stroke="#12798C" strokeWidth="3" />
                <path d="M60 14l22 10-22 6z" fill="#F2A63B" />
                <path d="M0 62q15-8 30 0t30 0 30 0 30 0" stroke="#12798C" strokeWidth="3" fill="none" opacity=".5" />
              </svg>
              <div>
                <h3 className="font-display text-2xl font-semibold">Belum ada foto yang cocok</h3>
                <p className="mt-1 text-sm text-clay">
                  Coba kata kunci lain, atau longgarkan filter album dan kategorinya.
                </p>
              </div>
              <button
                onClick={resetAll}
                className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-bold text-parchment transition hover:bg-teal active:scale-95"
              >
                Tampilkan semua foto
              </button>
            </div>
          ) : (
            <div
              className={layout === "mosaic" ? "mgrid" : "ugrid"}
              style={{ ["--cols" as string]: cols }}
            >
              {shown.map((p, i) => (
                <Card
                  key={p.id}
                  photo={p}
                  n={i}
                  uniform={layout === "grid"}
                  span={spanFor(p)}
                  fav={favorites.includes(p.id)}
                  onFav={() => {
                    toggleFavorite(p.id);
                    ambience.blip(favorites.includes(p.id) ? 420 : 820, 0.13);
                  }}
                  onOpen={() => {
                    setOpen(i);
                    ambience.shutter();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {visible < filtered.length && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={() => {
                setVisible((v) => v + STEP);
                ambience.blip(600, 0.12);
              }}
              className="group flex items-center gap-3 rounded-full bg-cocoa px-7 py-3.5 text-sm font-bold text-parchment shadow-lift transition hover:bg-teal active:scale-95"
            >
              Muat {Math.min(STEP, filtered.length - visible)} foto lagi
              <IconChevronDown width={17} height={17} className="transition-transform group-hover:translate-y-0.5" />
            </button>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-cocoa/12">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-[width] duration-500"
                style={{ width: `${(shown.length / filtered.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {open !== null && filtered[open] && (
        <Lightbox
          photos={filtered}
          index={open}
          setIndex={setOpen}
          onClose={closeLightbox}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
    </section>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div
      className={`min-w-[76px] rounded-2xl border px-4 py-3 text-center ${
        accent ? "border-coral/30 bg-coral/10" : "border-cocoa/12 bg-paper/70"
      }`}
    >
      <div className={`font-display font-numeric text-3xl font-semibold ${accent ? "text-coral" : "text-teal"}`}>
        {n}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay">{label}</div>
    </div>
  );
}

function AlbumCard({
  active,
  onClick,
  cover,
  label,
  note,
  count,
}: {
  active: boolean;
  onClick: () => void;
  cover: string;
  label: string;
  note: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group relative h-28 w-56 shrink-0 snap-start overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${
        active
          ? "border-coral shadow-[0_12px_30px_-14px_rgba(232,102,60,0.9)]"
          : "border-transparent opacity-85 hover:opacity-100"
      }`}
    >
      <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <span className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/55 to-abyss/10" />
      <span className="absolute inset-x-0 bottom-0 p-3">
        <span className="block text-sm font-bold text-parchment">{label}</span>
        <span className="block truncate text-[11px] text-mist">{note}</span>
      </span>
      <span className="font-numeric absolute right-2.5 top-2.5 rounded-full bg-parchment/90 px-2 py-0.5 text-[11px] font-bold text-cocoa">
        {count}
      </span>
    </button>
  );
}

function Chip({
  children,
  on,
  onClick,
  dot,
}: {
  children: React.ReactNode;
  on: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
        on
          ? "border-cocoa bg-cocoa text-parchment"
          : "border-cocoa/15 bg-parchment text-clay hover:border-cocoa/40 hover:text-cocoa"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}

function IconTab({
  children,
  on,
  onClick,
  label,
}: {
  children: React.ReactNode;
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={`rounded-lg p-2 transition ${on ? "bg-cocoa text-parchment" : "text-clay hover:bg-cocoa/10"}`}
    >
      {children}
    </button>
  );
}

function Card({
  photo,
  n,
  fav,
  uniform,
  span,
  onFav,
  onOpen,
}: {
  photo: Photo;
  n: number;
  fav: boolean;
  uniform: boolean;
  span: number;
  onFav: () => void;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const ratio = uniform
    ? "1 / 1"
    : photo.shape === "tall"
      ? "3 / 4.3"
      : photo.shape === "wide"
        ? "16 / 10"
        : "4 / 3.1";

  return (
    <figure
      className="group relative block h-full overflow-hidden rounded-2xl border border-cocoa/10 shadow-[0_10px_26px_-18px_rgba(42,29,20,0.9)]"
      style={{
        background: photo.tone,
        gridRowEnd: uniform ? undefined : `span ${span}`,
        animation: `popIn .5s cubic-bezier(.22,1,.36,1) ${Math.min(n, 8) * 45}ms both`,
      }}
    >
      <button
        onClick={onOpen}
        className="block h-full w-full cursor-zoom-in overflow-hidden"
        style={uniform ? { aspectRatio: ratio } : undefined}
        aria-label={`Buka foto ${photo.title}`}
      >
        <img
          src={photo.src}
          alt={photo.caption}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`ph-img h-full w-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{
            ["--z" as string]: photo.zoom ?? 1,
            objectPosition: photo.pos ?? "50% 50%",
            transition: "transform .85s cubic-bezier(.22,1,.36,1), opacity .6s ease",
          }}
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss/90 via-abyss/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-95" />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full border border-parchment/40 bg-abyss/60 p-3 text-parchment backdrop-blur-sm">
            <IconExpand width={20} height={20} />
          </span>
        </span>
      </button>

      <span className="font-numeric pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-abyss/70 px-1.5 py-0.5 text-[10px] font-bold text-parchment/90 backdrop-blur-sm">
        {String(n + 1).padStart(2, "0")}
      </span>

      <button
        onClick={onFav}
        aria-label={fav ? `Hapus ${photo.title} dari favorit` : `Simpan ${photo.title} ke favorit`}
        aria-pressed={fav}
        className={`absolute right-2.5 top-2.5 rounded-full border p-2 backdrop-blur-sm transition active:scale-90 ${
          fav
            ? "anim-heart border-coral bg-coral text-parchment"
            : "border-parchment/30 bg-abyss/55 text-parchment opacity-0 hover:bg-coral hover:text-parchment group-hover:opacity-100 focus-visible:opacity-100"
        }`}
      >
        <IconHeart width={15} height={15} fill={fav ? "currentColor" : "none"} />
      </button>

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-3 transition-transform duration-500 group-hover:translate-y-0">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-abyss"
          style={{ background: CATEGORY_TONE[photo.category] }}
        >
          {photo.category}
        </span>
        <h3 className="font-display mt-1.5 text-[15px] leading-tight font-semibold text-parchment">
          {photo.title}
        </h3>
        <p className="mt-0.5 max-h-0 overflow-hidden text-[12px] leading-snug text-mist opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">
          {photo.caption}
        </p>
      </figcaption>
    </figure>
  );
}
