import { EVENT, RUNDOWN } from "@/data/event";
import { useEventClock, Reveal, jumpTo } from "@/lib/store";
import { ArkScene, type SceneState } from "./ArkScene";
import { IconCalendar, IconClock, IconPin, IconTicket, IconUsers, IconMosaic, IconSparkle } from "./Icons";

const MARQUEE = [
  "Snack Pagi",
  "Kajian Interaktif",
  "Menonton Film Bersama",
  "Kelas Kreatif Bahtera",
  "Games Kekompakan",
  "Makan Siang",
];

export function Hero({
  scene,
  setScene,
}: {
  scene: SceneState;
  setScene: (s: SceneState) => void;
}) {
  const jump = (id: string) => jumpTo(id);

  return (
    <section id="beranda" className="grain relative overflow-hidden pt-24 pb-10 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_18%_-10%,#0d4356_0%,#04202b_55%,#020d15_100%)]" />
      <div className="pattern-star pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-teal/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-52 h-[380px] w-[380px] rounded-full bg-coral/20 blur-[130px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-abyss" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-x-12 lg:gap-y-6">
        {/* ---------------- headline ---------------- */}
        <div className="lg:col-start-1 lg:row-start-1">
          <Reveal>
            <p className="font-arabic text-3xl leading-none text-gold sm:text-4xl" dir="rtl" lang="ar">
              ﷽
            </p>
            <p className="mt-3 text-[13px] italic text-mist">
              Assalamu&apos;alaikum warahmatullahi wabarakatuh — Hai Sahabat Shoker!
            </p>
          </Reveal>

          <Reveal delay={90}>
            <div className="mt-5 inline-flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber/40 bg-amber/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                {EVENT.edition}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-foam/30 bg-foam/10 px-3 py-1 text-[11px] font-semibold text-foam">
                <IconUsers width={13} height={13} /> Untuk anak usia {EVENT.age}
              </span>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h1 className="font-display mt-5 text-[13vw] leading-[0.92] font-semibold tracking-tight sm:text-6xl lg:text-[68px]">
              <span className="block text-parchment">Stories of</span>
              <span className="block text-parchment">
                the <span className="italic text-gold">Prophet</span>
              </span>
            </h1>
            <p className="font-display mt-3 text-2xl leading-tight font-semibold text-coral sm:text-3xl">
              Berlayar bersama Bahtera Nuh
            </p>
          </Reveal>

          <Reveal delay={210}>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mist text-pretty">
              Satu pagi penuh kisah: kesabaran Nabi Nuh a.s., bahtera yang dibangun dengan yakin,
              dan pelangi setelah badai. Dibawa dalam kajian interaktif, kelas kreatif, film, dan
              permainan bersama.
            </p>
          </Reveal>
        </div>

        {/* ---------------- live scene ---------------- */}
        <Reveal delay={120} className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ArkScene scene={scene} onScene={setScene} />
        </Reveal>

        {/* ---------------- facts, CTA, clock ---------------- */}
        <div className="lg:col-start-1 lg:row-start-2">
          <Reveal delay={260}>
            <dl className="grid gap-2.5 sm:grid-cols-2">
              <Fact icon={<IconCalendar width={16} height={16} />} label="Hari & tanggal" value={EVENT.dateLabel} />
              <Fact icon={<IconClock width={16} height={16} />} label="Waktu" value={EVENT.timeLabel} />
              <Fact
                icon={<IconPin width={16} height={16} />}
                label="Tempat"
                value={EVENT.venue}
                className="sm:col-span-2"
              />
            </dl>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => jump("daftar")}
                className="anim-pulse-ring group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber to-coral px-6 py-3.5 text-sm font-bold text-abyss transition hover:brightness-110 active:scale-95"
              >
                <IconTicket width={18} height={18} />
                Daftar Sekarang
                <span className="rounded-full bg-abyss/15 px-2 py-0.5 text-[11px]">Early Bird 40K</span>
              </button>
              <button
                onClick={() => jump("galeri")}
                className="flex items-center gap-2.5 rounded-full border border-foam/40 bg-hull/50 px-6 py-3.5 text-sm font-bold text-parchment backdrop-blur transition hover:border-foam hover:bg-foam/12 active:scale-95"
              >
                <IconMosaic width={18} height={18} /> Jelajahi Galeri
              </button>
            </div>
          </Reveal>

          <Reveal delay={380}>
            <EventClockPanel onGallery={() => jump("galeri")} />
          </Reveal>
        </div>
      </div>

      {/* marquee */}
      <div className="relative mt-12 overflow-hidden border-y border-foam/15 bg-hull/40 py-3">
        <div className="flex w-max" style={{ animation: "marquee 34s linear infinite" }}>
          {[0, 1].map((rep) => (
            <div key={rep} className="flex shrink-0 items-center">
              {MARQUEE.map((m) => (
                <span key={m} className="flex items-center gap-4 px-5 text-sm font-semibold text-mist">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12 4.5 7.5 0 6l4.5-1.5z" fill="#F2A63B" />
                  </svg>
                  {m}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventClockPanel({ onGallery }: { onGallery: () => void }) {
  const c = useEventClock(EVENT.startISO, EVENT.endISO, RUNDOWN);

  if (c.phase === "before") {
    return (
      <div className="mt-7 rounded-2xl border border-foam/20 bg-hull/50 p-3.5 backdrop-blur-sm">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-mist">
          Berangkat menuju hari-H
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: c.days, l: "Hari" },
            { v: c.hours, l: "Jam" },
            { v: c.minutes, l: "Menit" },
            { v: c.seconds, l: "Detik" },
          ].map((u, i) => (
            <div
              key={u.l}
              className={`rounded-xl border px-2 py-2.5 text-center ${
                i === 3 ? "border-coral/35 bg-coral/10" : "border-foam/15 bg-abyss/50"
              }`}
            >
              <div
                className={`font-display font-numeric text-2xl leading-none font-semibold sm:text-3xl ${
                  i === 3 ? "text-coral" : "text-gold"
                }`}
              >
                {String(u.v).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-mist">{u.l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const live = c.phase === "live";
  const now = RUNDOWN[c.session];

  return (
    <div
      className={`mt-7 rounded-2xl border p-4 backdrop-blur-sm ${
        live ? "border-ok/40 bg-ok/10" : "border-foam/20 bg-hull/50"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? "bg-ok" : "bg-mist"}`} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-parchment">
          {live ? "Sedang berlangsung" : "Alhamdulillah, acara telah selesai"}
        </p>
        <span className="font-numeric ml-auto text-xs text-mist">{c.wibLabel} WIB</span>
      </div>

      {live ? (
        <>
          <p className="font-display mt-2 text-xl font-semibold text-parchment">
            {now ? now.title : "Persiapan panitia"}
          </p>
          <p className="mt-0.5 text-sm text-mist">
            {now ? `${now.time} – ${now.end} WIB · ` : ""}
            {Math.floor(c.leftMin / 60)} jam {c.leftMin % 60} menit menuju penutup
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-abyss/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-foam via-amber to-coral transition-[width] duration-1000"
              style={{ width: `${c.pct * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-mist">
            <span>08.00</span>
            <span>Sesi {Math.max(1, c.session + 1)} / {RUNDOWN.length}</span>
            <span>13.00</span>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Terima kasih sudah berlayar bersama kami. Dokumentasi Shoker #14 akan menyusul di galeri —
            sementara itu, telusuri momen edisi sebelumnya.
          </p>
          <button
            onClick={onGallery}
            className="mt-3 flex items-center gap-2 rounded-full border border-amber/45 px-4 py-2 text-xs font-bold text-gold transition hover:bg-amber hover:text-abyss active:scale-95"
          >
            <IconSparkle width={15} height={15} /> Buka galeri kegiatan
          </button>
        </>
      )}
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-foam/15 bg-hull/40 px-3.5 py-2.5 transition hover:border-foam/40 ${className}`}
    >
      <span className="mt-0.5 text-foam">{icon}</span>
      <span>
        <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist">{label}</dt>
        <dd className="text-sm font-semibold text-parchment">{value}</dd>
      </span>
    </div>
  );
}
