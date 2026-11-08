import { BENEFITS, EVENT, RUNDOWN, rupiah } from "@/data/event";
import { Reveal, useEventClock } from "@/lib/store";
import { ICON_MAP, IconCalendar, IconClock, IconInfo, IconPin, IconSparkle, IconUsers } from "./Icons";

export function Acara() {
  return (
    <section id="acara" className="relative overflow-hidden bg-deep py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_70%_at_85%_0%,#12798c_0%,transparent_55%),radial-gradient(80%_60%_at_0%_100%,#04202b_0%,transparent_60%)]" />
      <div className="pattern-star pointer-events-none absolute inset-0 opacity-[0.06]" />
      <WaveDivider className="top-0 text-parchment" flip />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
              <IconSparkle width={14} height={14} /> Tentang Acara
            </span>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold text-parchment sm:text-5xl">
              Lima jam berlayar,
              <br />
              <span className="italic text-foam">seumur hidup</span> mengingatnya
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-mist text-pretty">
              Shoker adalah ruang belajar akhir pekan untuk anak: mengenal sirah nabawiyah lewat
              cerita, gambar, karya tangan, dan permainan. Edisi ke-14 ini mengajak peserta naik ke
              Bahtera Nuh — belajar sabar, taat, dan percaya pada pertolongan Allah.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <MiniFact icon={<IconUsers width={15} height={15} />} k="Usia peserta" v={EVENT.age} />
              <MiniFact icon={<IconCalendar width={15} height={15} />} k="Tanggal" v="8 Nov 2026" />
              <MiniFact icon={<IconClock width={15} height={15} />} k="Durasi" v="5 jam" />
              <MiniFact icon={<IconPin width={15} height={15} />} k="Lokasi" v="Bekasi" />
            </div>
          </Reveal>

          <Reveal delay={160}>
            <figure className="relative mt-6 overflow-hidden rounded-2xl border border-gold/25 bg-abyss/50 p-5">
              <span className="font-display absolute -right-2 -top-6 text-[110px] leading-none text-gold/10">
                ”
              </span>
              <blockquote className="relative text-[15px] leading-relaxed text-parchment italic">
                “Siapa yang menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan
                menuju surga.”
              </blockquote>
              <figcaption className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                HR. Muslim no. 2699
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* benefits */}
        <div>
          <Reveal>
            <h3 className="font-display text-2xl font-semibold text-parchment">
              Apa saja yang teman-teman dapatkan?
            </h3>
            <p className="mt-1.5 text-sm text-mist">
              Semua sudah termasuk dalam infaq HTM — tidak ada biaya tambahan di lokasi.
            </p>
          </Reveal>

          <ol className="mt-6 space-y-3">
            {BENEFITS.map((b, i) => {
              const Ico = ICON_MAP[b.icon] ?? IconSparkle;
              return (
                <Reveal as="li" key={b.title} delay={i * 70}>
                  <div className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-parchment/12 bg-abyss/40 p-4 transition-all duration-300 hover:border-parchment/30 hover:bg-abyss/60 sm:p-5">
                    <span
                      className="absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover:w-1.5"
                      style={{ background: b.tone }}
                    />
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                      style={{ background: `${b.tone}22`, color: b.tone, boxShadow: `inset 0 0 0 1px ${b.tone}55` }}
                    >
                      <Ico width={24} height={24} />
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-display text-lg font-semibold text-parchment">{b.title}</h4>
                      <p className="mt-0.5 text-sm leading-relaxed text-mist">{b.desc}</p>
                    </div>
                    <span className="font-display font-numeric ml-auto hidden self-center text-3xl font-semibold text-parchment/12 sm:block">
                      0{i + 1}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </ol>

          <Reveal delay={120}>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 sm:flex-row sm:items-center">
              <IconInfo width={22} height={22} className="shrink-0 text-gold" />
              <p className="text-sm leading-relaxed text-parchment">
                <strong className="font-bold text-gold">Wajib daftar online.</strong> Kuota Early Bird{" "}
                {rupiah(EVENT.earlyPrice)} hanya untuk {EVENT.earlyQuota} pendaftar pertama, setelah itu
                berlaku HTM normal {rupiah(EVENT.normalPrice)}.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Rundown() {
  const clock = useEventClock(EVENT.startISO, EVENT.endISO, RUNDOWN);
  return (
    <section id="rundown" className="rail-light relative overflow-hidden bg-paper py-16 text-cocoa sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 10%, #12798C 0, transparent 45%), radial-gradient(circle at 10% 80%, #E8663C 0, transparent 45%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-teal">
              <IconClock width={14} height={14} /> Rundown
            </span>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold sm:text-5xl">
              Peta perjalanan
              <br />
              <span className="italic text-coral">08.00 – 13.00</span> WIB
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-clay">
              Tujuh pelabuhan dalam satu pagi. Peserta dianjurkan tiba pukul 07.45 WIB agar tidak
              tertinggal sesi pembuka dan snack pagi.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
              "7 sesi",
              "5 jam",
              "Ahad pagi",
              clock.phase === "live" ? `Sekarang ${clock.wibLabel} WIB` : "Ramah anak",
            ].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-cocoa/15 bg-parchment px-3 py-1.5 text-xs font-semibold text-clay"
                >
                  {c}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <ol className="relative">
          <span className="absolute left-[27px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-teal via-amber to-coral opacity-35 sm:left-[35px]" />
          {RUNDOWN.map((r, i) => {
            const Ico = ICON_MAP[r.icon] ?? IconSparkle;
            const live = clock.phase === "live" && clock.session === i;
            const done = clock.phase === "after" || (clock.phase === "live" && clock.session > i);
            return (
              <Reveal as="li" key={r.time} delay={i * 60} className="relative">
                <div className="group flex gap-4 pb-4 sm:gap-5">
                  <span
                    className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 shadow-[0_8px_20px_-14px_rgba(42,29,20,0.9)] transition-all duration-300 group-hover:-translate-y-0.5 sm:h-[72px] sm:w-[72px] ${
                      live
                        ? "border-coral bg-coral text-parchment"
                        : done
                          ? "border-ok/40 bg-parchment text-ok"
                          : "border-cocoa/10 bg-parchment text-teal group-hover:border-coral group-hover:text-coral"
                    }`}
                  >
                    <Ico width={24} height={24} />
                  </span>
                  <div
                    className={`min-w-0 flex-1 rounded-2xl border p-4 transition-all duration-300 group-hover:border-cocoa/25 group-hover:bg-parchment group-hover:shadow-[0_14px_34px_-22px_rgba(42,29,20,1)] ${
                      live ? "border-coral/60 bg-parchment shadow-[0_14px_34px_-22px_rgba(232,102,60,1)]" : "border-cocoa/10 bg-parchment/85"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-numeric font-display text-lg font-semibold text-coral">
                        {r.time}
                      </span>
                      <span className="font-numeric text-xs text-clay">– {r.end} WIB</span>
                      {live ? (
                        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-parchment">
                          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-parchment" />
                          Berlangsung
                        </span>
                      ) : (
                        <span className="ml-auto rounded-full bg-cocoa/6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-clay">
                          {done ? "Selesai" : `Sesi ${i + 1}`}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display mt-1 text-lg leading-snug font-semibold">{r.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-clay">{r.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function MiniFact({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-xl border border-parchment/12 bg-abyss/35 px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist">
        <span className="text-foam">{icon}</span>
        {k}
      </span>
      <span className="mt-0.5 block text-sm font-bold text-parchment">{v}</span>
    </div>
  );
}

export function WaveDivider({ className = "", flip }: { className?: string; flip?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 ${className}`} aria-hidden>
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className={`h-8 w-full sm:h-12 ${flip ? "rotate-180" : ""}`}
      >
        <path
          d="M0 30 Q 90 0 180 30 T 360 30 T 540 30 T 720 30 T 900 30 T 1080 30 T 1260 30 T 1440 30 V60 H0 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
