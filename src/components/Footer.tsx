import { EVENT } from "@/data/event";
import { useToast, type Tone } from "@/lib/store";
import { IconArk, IconCheck, IconClose, IconInfo, IconWarn, IconDownload, IconLink, IconPin, IconWhatsapp } from "./Icons";

const TONE: Record<Tone, { bar: string; icon: React.ReactNode }> = {
  ok: { bar: "#3E9E62", icon: <IconCheck width={17} height={17} /> },
  info: { bar: "#2E8FA8", icon: <IconInfo width={17} height={17} /> },
  warn: { bar: "#DFA22C", icon: <IconWarn width={17} height={17} /> },
  bad: { bar: "#D2452F", icon: <IconWarn width={17} height={17} /> },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[95] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-slide pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-foam/25 bg-hull/95 p-3.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,1)] backdrop-blur-xl"
        >
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
            style={{ background: `${TONE[t.tone].bar}22`, color: TONE[t.tone].bar }}
          >
            {TONE[t.tone].icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-parchment">{t.title}</p>
            {t.desc && <p className="mt-0.5 break-words text-xs leading-relaxed text-mist">{t.desc}</p>}
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
                className="mt-2 rounded-full border border-amber/50 px-3 py-1 text-[11px] font-bold text-gold transition hover:bg-amber hover:text-abyss"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Tutup notifikasi"
            className="shrink-0 rounded-full p-1 text-mist transition hover:bg-parchment/10 hover:text-parchment"
          >
            <IconClose width={15} height={15} />
          </button>
          <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: TONE[t.tone].bar }} />
        </div>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="grain relative overflow-hidden bg-abyss pt-14 pb-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_100%_at_50%_120%,#0d4356_0%,transparent_60%)]" />
      <div className="pattern-star pointer-events-none absolute inset-0 opacity-[0.05]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 border-b border-foam/15 pb-10 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal to-deep text-gold ring-1 ring-foam/30">
                <IconArk width={26} height={26} />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-parchment">{EVENT.edition}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foam">
                  {EVENT.tagline}
                </p>
              </div>
            </div>
            <p className="font-arabic mt-5 text-2xl text-gold" dir="rtl" lang="ar">
              جَزَاكُمُ اللّٰهُ خَيْرًا كَثِيْرًا
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist">
              Jazaakumullah khoiran katsiran atas dukungan Ayah, Bunda, dan seluruh Sahabat Shoker.
              Sampai jumpa di dermaga, Ahad 8 November 2026.
            </p>
            <p className="mt-3 text-[13px] italic text-mist/80">
              Wassalamu&apos;alaikum warahmatullahi wabarakatuh
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foam">Tautan</p>
            <ul className="mt-4 space-y-2.5">
              <FooterLink href={EVENT.register} icon={<IconLink width={16} height={16} />} label="Pendaftaran resmi" sub="bit.ly/CONTOH-PENDAFTARAN" />
              <FooterLink href={EVENT.drive} icon={<IconDownload width={16} height={16} />} label="Arsip foto lengkap" sub="Google Drive panitia" />
              <FooterLink href={EVENT.maps} icon={<IconPin width={16} height={16} />} label="Petunjuk arah" sub="Google Maps" />
              <FooterLink href={`https://wa.me/${EVENT.cpPhone}`} icon={<IconWhatsapp width={16} height={16} />} label={EVENT.cpName} sub={EVENT.cpPhonePretty} />
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foam">Ringkasan</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Tanggal", EVENT.dateLabel],
                ["Waktu", EVENT.timeLabel],
                ["Tempat", EVENT.venue],
                ["Usia", EVENT.age],
                ["HTM", "Early Bird 40K · Normal 55K"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wider text-mist/70">
                    {k}
                  </dt>
                  <dd className="text-parchment">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row">
          <p className="text-xs text-mist/70">
            Galeri & pendaftaran {EVENT.edition} · Diselenggarakan oleh keluarga besar Shoker
          </p>
          <p className="text-xs text-mist/70">
            Foto dokumentasi menampilkan kegiatan Shoker sebelumnya.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-3 text-sm text-mist transition hover:text-gold"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-foam/20 text-foam transition group-hover:border-amber group-hover:text-gold">
          {icon}
        </span>
        <span>
          <span className="block font-semibold text-parchment group-hover:text-gold">{label}</span>
          <span className="block text-[11px]">{sub}</span>
        </span>
      </a>
    </li>
  );
}
