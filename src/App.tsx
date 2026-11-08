import { useCallback, useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Gallery } from "@/components/Gallery";
import { FaceSearch } from "@/components/FaceSearch";
import { Acara, Rundown } from "@/components/Info";
import { Register } from "@/components/Register";
import { Location } from "@/components/Location";
import { Footer, Toaster } from "@/components/Footer";
import { DEFAULT_SCENE, type SceneState } from "@/components/ArkScene";
import { ToastProvider, usePersistentState, useToast, smoothScrollTo, jumpTo } from "@/lib/store";
import { ambience } from "@/lib/audio";
import { IconArrowUp } from "@/components/Icons";

export default function App() {
  return (
    <ToastProvider>
      <Shoker />
    </ToastProvider>
  );
}

function Shoker() {
  const { push } = useToast();
  const [favorites, setFavorites] = usePersistentState<string[]>("shoker14.favorites", ["p01", "p15"]);
  const [scene, setScene] = usePersistentState<SceneState>("shoker14.scene", DEFAULT_SCENE);
  const [soundOn, setSoundOn] = useState(true);
  const [showTop, setShowTop] = useState(false);

  /* browsers require a gesture before audio may start */
  useEffect(() => {
    let done = false;
    const unlock = async () => {
      if (done) return;
      done = true;
      await ambience.unlock();
      ambience.setMuted(!soundOn);
      ambience.setRain(scene.rain / 100);
      ambience.setSea(scene.waves / 100);
    };
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ambience.setMuted(!soundOn);
  }, [soundOn]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const has = prev.includes(id);
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [setFavorites],
  );

  const toggleSound = () => {
    setSoundOn((s) => {
      const next = !s;
      push({
        title: next ? "Suara ombak dinyalakan" : "Suara dimatikan",
        desc: next ? "Ombak & hujan mengikuti adegan bahtera." : "Semua audio dibisukan.",
        tone: next ? "ok" : "info",
      });
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-abyss">
      <a
        href="#galeri"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-amber focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-abyss"
      >
        Lompat ke galeri
      </a>

      <Nav soundOn={soundOn} onSound={toggleSound} />

      <main>
        <Hero scene={scene} setScene={setScene} />
        <Gallery favorites={favorites} toggleFavorite={toggleFavorite} />
        <FaceSearch />
        <Acara />
        <Rundown />
        <Register />
        <Location />
      </main>

      <Footer />
      <Toaster />

      <button
        onClick={() => smoothScrollTo(0, 760)}
        aria-label="Kembali ke atas"
        className={`fixed bottom-4 left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-foam/30 bg-hull/90 text-foam shadow-lift backdrop-blur transition-all duration-300 hover:border-amber hover:text-gold active:scale-90 ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <IconArrowUp width={19} height={19} />
      </button>
      <FloatingFaceButton />
    </div>
  );
}

/* Quick access to the face-search section on phones (desktop uses the navbar) */
function FloatingFaceButton() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = document.getElementById("wajah");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      onClick={() => {
        jumpTo("wajah");
        ambience.blip(720, 0.1);
      }}
      aria-label="Lompat ke pencarian wajah"
      className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-coral px-4 py-3 text-xs font-bold text-abyss shadow-[0_10px_28px_-10px_rgba(242,166,59,0.95)] transition-all duration-300 hover:brightness-110 active:scale-95 md:hidden ${
        hidden ? "pointer-events-none translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="10.5" cy="10" r="6" />
        <path d="M4 10c1.8-1.2 4.2-1.2 6 0M6.2 13c1.4-.9 3-.9 4.4 0" />
        <path d="M12.6 15.6 11 17.2a3.4 3.4 0 0 1-4.8-4.8" />
        <path d="m15 15 5.5 5.5" />
      </svg>
      Cari Wajah
    </button>
  );
}
