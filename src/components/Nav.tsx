import { useState } from "react";
import { IconArk, IconClose, IconMenu, IconMute, IconSound, IconTicket } from "./Icons";
import { jumpTo, useScrollSpy } from "@/lib/store";
import { ambience } from "@/lib/audio";

const LINKS = [
  { id: "galeri", label: "Galeri" },
  { id: "wajah", label: "Cari Wajah" },
  { id: "acara", label: "Acara" },
  { id: "rundown", label: "Rundown" },
  { id: "daftar", label: "Pendaftaran" },
  { id: "lokasi", label: "Lokasi" },
];
const IDS = ["beranda", ...LINKS.map((l) => l.id)];

export function Nav({
  soundOn,
  onSound,
}: {
  soundOn: boolean;
  onSound: () => void;
}) {
  const { active, progress, scrolled } = useScrollSpy(IDS);
  const [open, setOpen] = useState(false);

  const jump = (id: string) => {
    setOpen(false);
    jumpTo(id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="h-[3px] w-full bg-abyss/50">
        <div
          className="h-full bg-gradient-to-r from-foam via-amber to-coral transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div
        className={`transition-all duration-500 ${
          scrolled
            ? "border-b border-foam/15 bg-abyss/90 backdrop-blur-xl shadow-[0_10px_30px_-20px_rgba(0,0,0,1)]"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <button
            onClick={() => jump("beranda")}
            className="group flex items-center gap-2.5 text-left"
            aria-label="Kembali ke atas"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-deep text-gold ring-1 ring-foam/30 transition-transform group-hover:-rotate-6">
              <IconArk width={22} height={22} />
            </span>
            <span className="leading-tight">
              <span className="font-display block text-[15px] font-semibold text-parchment">Shoker #14</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-foam">
                Bahtera Nuh
              </span>
            </span>
          </button>

          <ul className="ml-auto hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => jump(l.id)}
                  aria-current={active === l.id}
                  className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active === l.id ? "text-gold" : "text-mist hover:text-parchment"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-amber to-coral transition-transform duration-300 ${
                      active === l.id ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              onSound();
              if (!soundOn) ambience.blip(720, 0.16);
            }}
            aria-pressed={soundOn}
            title={soundOn ? "Matikan suara ombak & hujan" : "Nyalakan suara ombak & hujan"}
            className={`ml-auto flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition md:ml-0 ${
              soundOn
                ? "border-foam/45 bg-foam/12 text-foam"
                : "border-mist/25 text-mist hover:text-parchment"
            }`}
          >
            {soundOn ? <IconSound width={16} height={16} /> : <IconMute width={16} height={16} />}
            <span className="hidden sm:inline">{soundOn ? "Suara aktif" : "Suara mati"}</span>
            {soundOn && (
              <span className="flex h-3 items-end gap-[2px]" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-[2px] rounded-full bg-foam"
                    style={{ animation: `flap ${0.7 + i * 0.25}s ease-in-out ${i * 0.12}s infinite`, height: `${6 + i * 3}px` }}
                  />
                ))}
              </span>
            )}
          </button>

          <button
            onClick={() => jump("daftar")}
            className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-amber to-coral px-4 py-2.5 text-xs font-bold text-abyss shadow-[0_8px_24px_-10px_rgba(242,166,59,0.9)] transition hover:brightness-110 active:scale-95 sm:flex"
          >
            <IconTicket width={16} height={16} /> Daftar Sekarang
          </button>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            className="rounded-xl border border-foam/25 p-2 text-parchment md:hidden"
          >
            {open ? <IconClose width={20} height={20} /> : <IconMenu width={20} height={20} />}
          </button>
        </nav>

        {open && (
          <div className="border-t border-foam/15 bg-abyss/97 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
            <ul className="grid gap-1">
              {LINKS.map((l, i) => (
                <li key={l.id} style={{ animation: `slideInRight .3s ease ${i * 40}ms both` }}>
                  <button
                    onClick={() => jump(l.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      active === l.id ? "bg-foam/12 text-gold" : "text-mist hover:bg-foam/8"
                    }`}
                  >
                    {l.label}
                    <span className="font-numeric text-[11px] opacity-60">0{i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => jump("daftar")}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber to-coral py-3 text-sm font-bold text-abyss"
            >
              <IconTicket width={17} height={17} /> Daftar Sekarang
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
