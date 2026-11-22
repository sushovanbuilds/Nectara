// One thin-line icon set (24px grid, 1.5 stroke), drawn inline so nothing loads from a CDN.
const PATHS = {
  dashboard: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="4" rx="1" /><rect x="13" y="10" width="7" height="10" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /></>,
  hive: <path d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8z" />,
  batch: <><path d="M8.5 3.5h7" /><path d="M9.5 3.5v2.6C7.5 7 6.5 8.6 6.5 11v7.5a2 2 0 002 2h7a2 2 0 002-2V11c0-2.4-1-4-3-4.9V3.5" /><path d="M6.5 12.5h11" /></>,
  lab: <><path d="M9 3.5h6" /><path d="M10 3.5v5.8l-5 8.6A2 2 0 006.7 21h10.6a2 2 0 001.7-3.1l-5-8.6V3.5" /><path d="M7.4 15h9.2" /></>,
  custody: <><path d="M4 8.5h14l-3.5-3.5" /><path d="M20 15.5H6l3.5 3.5" /></>,
  shipments: <><path d="M3 6.5h11v9.5H3z" /><path d="M14 10h4l3 3.2V16h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  risk: <><path d="M12 3.5l7.5 2.8v5.6c0 4.3-3.2 7.7-7.5 8.6-4.3-.9-7.5-4.3-7.5-8.6V6.3z" /><path d="M12 8.5v4.5" /><path d="M12 16h.01" /></>,
  admin: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3" /><path d="M15.5 4.6a3.2 3.2 0 010 7.8" /><path d="M18 15.2c1.9.6 3 2.3 3 4.8" /></>,
  verify: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2.5v2.5H14zM19 14h1M14 19.5h2.5M19 18v2" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.4-4.4" /></>,
  chevron: <path d="M6 9.5l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  ask:<><path d="M5 5.5h14a1.5 1.5 0 011.5 1.5v8.5A1.5 1.5 0 0119 17h-7.5L7 20.5V17H5a1.5 1.5 0 01-1.5-1.5V7A1.5 1.5 0 015 5.5z" /><path d="M8 10h8M8 13h5" /></>,
  logout: <><path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" /><path d="M10 16l-4-4 4-4" /><path d="M6 12h10" /></>,
  more: <><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></>,
} as const;

export type IconName = keyof typeof PATHS;

/** Decorative by default; pair it with visible or screen-reader text. */
export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name]}
    </svg>
  );
}
