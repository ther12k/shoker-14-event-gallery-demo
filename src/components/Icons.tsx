import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 20,
  height: 20,
  "aria-hidden": true,
  ...p,
});

export const IconArk = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 15.5h19l-2.6 4.2a2 2 0 0 1-1.7.9H6.8a2 2 0 0 1-1.7-.9z" />
    <path d="M5.5 15.5V9.8h13v5.7" />
    <path d="M8.4 9.8V6.6h7.2v3.2" />
    <path d="M12 3.2v3.4" />
    <path d="M9.6 12.4h1.2M13.2 12.4h1.2" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9.5 5 7 7-7 7" />
  </svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 9 7 7 7-7" />
  </svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20.3s-7.6-4.6-9.2-9.1C1.5 7.7 3.6 4.6 6.9 4.6c2 0 3.5 1.1 4.4 2.6l.7 1.2.7-1.2c.9-1.5 2.4-2.6 4.4-2.6 3.3 0 5.4 3.1 4.1 6.6-1.6 4.5-9.2 9.1-9.2 9.1z" />
  </svg>
);
export const IconExpand = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11" />
    <path d="m7.5 10 4.5 4.5L16.5 10" />
    <path d="M4.5 19.5h15" />
  </svg>
);
export const IconLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 13.8a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.3 1.3" />
    <path d="M14 10.2a4 4 0 0 0-5.7 0L5.5 13a4 4 0 1 0 5.7 5.7l1.3-1.3" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5V5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15h1" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);
export const IconPlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4.8 19 12 7 19.2z" />
  </svg>
);
export const IconPause = (p: P) => (
  <svg {...base(p)}>
    <path d="M8.5 4.5v15M15.5 4.5v15" />
  </svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);
export const IconMosaic = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="11" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="6" rx="1.6" />
    <rect x="3.5" y="17" width="7" height="3.5" rx="1.4" />
    <rect x="13.5" y="12" width="7" height="8.5" rx="1.6" />
  </svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2V12l3.2 2" />
  </svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.8 20c.5-3.4 3.1-5.4 6.2-5.4s5.7 2 6.2 5.4" />
    <path d="M16.2 5.2a3.4 3.4 0 0 1 0 6.5M17.6 14.9c2.1.6 3.4 2.4 3.7 5.1" />
  </svg>
);
export const IconWhatsapp = (p: P) => (
  <svg {...base(p)} strokeWidth={1.6}>
    <path d="M3.5 20.5l1.3-4.3A8.2 8.2 0 1 1 8 19.4z" />
    <path d="M9 9.2c.2 1.6 1.9 3.6 3.6 4.3.7.3 1.2.1 1.5-.3l.5-.7 2 1c-.2 1.1-1.1 1.7-2.2 1.5-2.7-.4-5.9-3.4-6.5-6.2-.2-1 .4-1.9 1.5-2.1l1 1.9-.7.5c-.4.3-.7.6-.7 1.1z" />
  </svg>
);
export const IconSparkle = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.2l1.9 4.6 4.6 1.9-4.6 1.9L12 16.2l-1.9-4.6L5.5 9.7l4.6-1.9z" />
    <path d="M18.6 15.4l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
  </svg>
);
export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4.5h5.2A2.8 2.8 0 0 1 12 7.3v12a2.4 2.4 0 0 0-2.4-2.4H4z" />
    <path d="M20 4.5h-5.2A2.8 2.8 0 0 0 12 7.3v12a2.4 2.4 0 0 1 2.4-2.4H20z" />
  </svg>
);
export const IconFilm = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.4" />
    <path d="M8 4.5v15M16 4.5v15M3 12h18M3 8.2h5M3 15.8h5M16 8.2h5M16 15.8h5" />
  </svg>
);
export const IconScissors = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6.5" cy="17.5" r="2.6" />
    <circle cx="6.5" cy="6.5" r="2.6" />
    <path d="M8.6 8.3 20 18M20 6 8.6 15.7" />
  </svg>
);
export const IconFlag = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 21V3.5" />
    <path d="M5.5 4.5h11l-2 3.6 2 3.6h-11" />
  </svg>
);
export const IconBowl = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 11.5h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9z" />
    <path d="M8.5 8.2c0-1.4 1.6-1.4 1.6-2.8M12.5 8.2c0-1.9 1.8-1.6 1.8-3.4" />
  </svg>
);
export const IconSandwich = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 8.6c0-2.3 3.8-4.1 8.5-4.1s8.5 1.8 8.5 4.1z" />
    <path d="M3.5 12.2h17M4.5 15.6h15" />
    <path d="M3.5 18.4c0 1.2 1 1.6 2.2 1.6h12.6c1.2 0 2.2-.4 2.2-1.6" />
  </svg>
);
export const IconGem = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 3.5h10l4 5.5-9 11.5L3 9z" />
    <path d="M3 9h18M9.5 9 12 20.5 14.5 9 12 3.5z" />
  </svg>
);
export const IconTicket = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 8.2V6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v1.7a2.6 2.6 0 0 0 0 5.2v4.1A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-4.1a2.6 2.6 0 0 0 0-5.2z" />
    <path d="M13.5 5v2M13.5 11v2M13.5 17v2" />
  </svg>
);
export const IconSound = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" />
    <path d="M15.4 9.4a3.6 3.6 0 0 1 0 5.2M18 6.8a7.2 7.2 0 0 1 0 10.4" />
  </svg>
);
export const IconMute = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" />
    <path d="m16 9.5 4.5 5M20.5 9.5 16 14.5" />
  </svg>
);
export const IconRain = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 15.5a4 4 0 0 1-.4-8A5.2 5.2 0 0 1 16.6 7a3.8 3.8 0 0 1 .6 7.5" />
    <path d="M8.5 18l-.8 2.2M12.3 18l-.8 2.2M16.1 18l-.8 2.2" />
  </svg>
);
export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
  </svg>
);
export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.6 8.6 0 1 0 10.4 10.4z" />
  </svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 5.5v5h-5" />
    <path d="M19.2 10.5a7.6 7.6 0 1 0-.6 6" />
  </svg>
);
export const IconDice = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
    <path d="M10.5 10v6.5M13.5 10v6.5" />
  </svg>
);
export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20V4.5M5.5 11 12 4.5 18.5 11" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconWave = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 8.5c2.2 0 2.2 2.4 4.4 2.4S8.6 8.5 10.8 8.5s2.2 2.4 4.4 2.4S17.4 8.5 19.6 8.5 21.8 10.9 22 10.9" />
    <path d="M2 14.5c2.2 0 2.2 2.4 4.4 2.4s2.2-2.4 4.4-2.4 2.2 2.4 4.4 2.4 2.2-2.4 4.4-2.4 2.2 2.4 2.4 2.4" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 11v5.4M12 7.9v.1" />
  </svg>
);
export const IconWarn = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.8 21 19.5H3z" />
    <path d="M12 9.6v4.2M12 16.6v.1" />
  </svg>
);
export const IconZoom = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M8.5 11h5M11 8.5v5M20 20l-3.6-3.6" />
  </svg>
);

export const ICON_MAP: Record<string, (p: P) => React.ReactElement> = {
  ticket: IconTicket,
  sparkle: IconSparkle,
  book: IconBook,
  scissors: IconScissors,
  film: IconFilm,
  flag: IconFlag,
  bowl: IconBowl,
  sandwich: IconSandwich,
  gem: IconGem,
};
