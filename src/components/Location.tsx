import { useState } from "react";
import { EVENT, FAQ } from "@/data/event";
import { Reveal } from "@/lib/store";
import { IconChevronDown, IconPin, IconWhatsapp, IconInfo, IconClock, IconUsers } from "./Icons";

export function Location() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="lokasi" className="rail-light relative overflow-hidden bg-parchment py-16 text-cocoa sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #12798C 0, transparent 40%), radial-gradient(circle at 90% 75%, #F2A63B 0, transparent 42%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-teal">
            <IconPin width={14} height={14} /> Lokasi & Kontak
          </span>
          <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold sm:text-5xl">
            Merapat ke <span className="italic text-coral">dermaga</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-clay">
            {EVENT.venue} berada di kawasan Greenville, Cikarageman — mudah dijangkau dari Setu,
            Cibubur, dan Cikarang. Area parkir tersedia di halaman masjid.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border-2 border-cocoa/12 bg-paper shadow-lift">
              <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#e6dcc4,#f4e6cd)]">
                <div className="pattern-star absolute inset-0 opacity-20" />
                <p className="relative text-sm font-semibold text-clay">Memuat peta…</p>
              </div>
              <iframe
                title="Peta lokasi Masjid Alam Al-Barakah"
                src={EVENT.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="relative block h-[340px] w-full sm:h-[440px]"
                style={{ border: 0 }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={EVENT.maps}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-cocoa px-5 py-3 text-sm font-bold text-parchment transition hover:bg-teal active:scale-95"
              >
                <IconPin width={17} height={17} /> Buka di Google Maps
              </a>
              <a
                href={`https://wa.me/${EVENT.cpPhone}?text=${encodeURIComponent(
                  `Assalamu'alaikum ${EVENT.cpName}, saya ingin bertanya tentang ${EVENT.edition}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border-2 border-ok px-5 py-3 text-sm font-bold text-ok transition hover:bg-ok hover:text-parchment active:scale-95"
              >
                <IconWhatsapp width={17} height={17} /> Tanya panitia
              </a>
            </div>
          </Reveal>

          <div className="space-y-4">
            <Reveal delay={70}>
              <div className="rounded-3xl border border-cocoa/12 bg-paper/80 p-5">
                <h3 className="font-display text-lg font-semibold">{EVENT.venue}</h3>
                <p className="mt-2 text-sm leading-relaxed text-clay">{EVENT.address}</p>
                <div className="mt-4 grid gap-2">
                  <Line icon={<IconClock width={15} height={15} />} k="Ahad, 8 November 2026" v="08.00 – 13.00 WIB" />
                  <Line icon={<IconUsers width={15} height={15} />} k="Peserta" v={`Anak usia ${EVENT.age}`} />
                </div>
              </div>
            </Reveal>

            <Reveal delay={130}>
              <a
                href={`https://wa.me/${EVENT.cpPhone}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-3xl border-2 border-ok/35 bg-ok/8 p-5 transition hover:border-ok hover:bg-ok/15"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ok text-parchment transition-transform group-hover:-rotate-6">
                  <IconWhatsapp width={26} height={26} />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-clay">
                    CP Pendaftaran
                  </span>
                  <span className="font-display block text-xl font-semibold">{EVENT.cpName}</span>
                  <span className="font-numeric block text-sm text-clay">{EVENT.cpPhonePretty}</span>
                </span>
              </a>
            </Reveal>

            <Reveal delay={180}>
              <div className="flex gap-3 rounded-3xl border border-teal/25 bg-teal/8 p-4">
                <IconInfo width={20} height={20} className="mt-0.5 shrink-0 text-teal" />
                <p className="text-sm leading-relaxed text-clay">
                  Datang 15 menit lebih awal ya. Peserta memakai pakaian muslim yang nyaman untuk
                  bergerak, dan membawa botol minum sendiri.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.6fr_1.4fr]">
          <Reveal>
            <h3 className="font-display text-3xl leading-tight font-semibold">
              Pertanyaan
              <br />
              <span className="italic text-teal">yang sering muncul</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-clay">
              Belum terjawab? Sapa {EVENT.cpName} di WhatsApp, insyaAllah dibalas secepatnya.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <ul className="divide-y divide-cocoa/12 overflow-hidden rounded-3xl border border-cocoa/12 bg-paper/70">
              {FAQ.map((f, i) => {
                const on = open === i;
                return (
                  <li key={f.q}>
                    <button
                      onClick={() => setOpen(on ? null : i)}
                      aria-expanded={on}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-parchment/70"
                    >
                      <span className={`font-numeric text-xs font-bold ${on ? "text-coral" : "text-clay"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-[15px] font-semibold">{f.q}</span>
                      <IconChevronDown
                        width={18}
                        height={18}
                        className={`shrink-0 transition-transform duration-300 ${on ? "rotate-180 text-coral" : "text-clay"}`}
                      />
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-400 ease-out"
                      style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 pl-[52px] text-sm leading-relaxed text-clay">{f.a}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Line({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-parchment px-3 py-2">
      <span className="text-teal">{icon}</span>
      <span className="text-sm font-semibold">{k}</span>
      <span className="ml-auto text-sm text-clay">{v}</span>
    </div>
  );
}
