import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/* persistence                                                         */
/* ------------------------------------------------------------------ */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep in-memory */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

/* ------------------------------------------------------------------ */
/* toasts                                                              */
/* ------------------------------------------------------------------ */
export type Tone = "ok" | "info" | "warn" | "bad";
export type Toast = {
  id: number;
  title: string;
  desc?: string;
  tone: Tone;
  action?: { label: string; run: () => void };
};

type ToastCtx = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};
const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const h = timers.current.get(id);
    if (h) window.clearTimeout(h);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      const h = window.setTimeout(() => dismiss(id), t.action ? 7000 : 4200);
      timers.current.set(id, h);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((h) => window.clearTimeout(h));
  }, []);

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside ToastProvider");
  return c;
}

/* ------------------------------------------------------------------ */
/* scrolling — rAF tween so anchor jumps are exact and cancellable      */
/* ------------------------------------------------------------------ */
let scrollRaf = 0;
export function smoothScrollTo(targetY: number, duration = 620) {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  const startY = window.scrollY;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const end = Math.max(0, Math.min(max, targetY));
  const delta = end - startY;
  if (Math.abs(delta) < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, end);
    return;
  }
  const t0 = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, startY + delta * ease(p));
    if (p < 1) scrollRaf = requestAnimationFrame(step);
    else scrollRaf = 0;
  };
  scrollRaf = requestAnimationFrame(step);
}

export function jumpTo(id: string, offset = 76) {
  const el = document.getElementById(id);
  if (!el) return;
  smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - offset);
}

/* ------------------------------------------------------------------ */
/* clipboard                                                           */
/* ------------------------------------------------------------------ */
export async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* countdown                                                           */
/* ------------------------------------------------------------------ */
export function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const calc = useCallback(() => {
    const diff = Math.max(0, target - Date.now());
    return {
      done: diff <= 0,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [target]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    const h = window.setInterval(() => setT(calc()), 1000);
    return () => window.clearInterval(h);
  }, [calc]);
  return t;
}

/** Clock in WIB regardless of the visitor's timezone. */
export function useEventClock(startISO: string, endISO: string, sessions: { time: string; end: string }[]) {
  const start = useMemo(() => new Date(startISO).getTime(), [startISO]);
  const end = useMemo(() => new Date(endISO).getTime(), [endISO]);
  const calc = useCallback(() => {
    const now = Date.now();
    const diff = Math.max(0, start - now);
    const wib = new Date(now + (420 + new Date().getTimezoneOffset()) * 60000);
    const mins = wib.getHours() * 60 + wib.getMinutes();
    const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    let session = -1;
    if (now >= start && now <= end) {
      session = sessions.findIndex((s) => mins >= toMin(s.time) && mins < toMin(s.end));
    }
    return {
      phase: now < start ? ("before" as const) : now <= end ? ("live" as const) : ("after" as const),
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      session,
      pct: Math.max(0, Math.min(1, (now - start) / (end - start))),
      leftMin: Math.max(0, Math.round((end - now) / 60000)),
      wibLabel: `${String(wib.getHours()).padStart(2, "0")}.${String(wib.getMinutes()).padStart(2, "0")}`,
    };
  }, [start, end, sessions]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    const h = window.setInterval(() => setT(calc()), 1000);
    return () => window.clearInterval(h);
  }, [calc]);
  return t;
}

/* ------------------------------------------------------------------ */
/* scroll reveal                                                       */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref as never}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ ["--d" as string]: `${delay}ms` }}
    >
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/* scroll spy + progress                                               */
/* ------------------------------------------------------------------ */
export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(h > 0 ? Math.min(1, y / h) : 0);
        setScrolled(y > 24);
        let current = ids[0];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 140) current = id;
        }
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids]);

  return { active, progress, scrolled };
}

export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
