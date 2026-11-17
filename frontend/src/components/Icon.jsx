// Lightweight inline icon set (stroke icons, 24x24) – no icon library needed.
const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6" /></>,
  heart: <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.6 3.8 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.6 0 5.9 3.6 4.7 7.1-1.8 4.8-9.3 9.4-9.3 9.4Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  shield: <><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  compare: <><path d="M8 3v18M16 3v18" /><path d="M4 7h4M16 7h4M4 17h4M16 17h4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  filter: <path d="M3 5h18l-7 8.5V20l-4-2v-4.5L3 5Z" />,
  leaf: <><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19c3-4 6-6.5 10-8.5" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="8.5" r="1.3" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  recycle: <><path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.3L5.6 13M10 5.3l1-1.6a1.5 1.5 0 0 1 2.6 0L16 7.5M17 19h2.5a1.5 1.5 0 0 0 1.3-2.3l-1.3-2.2" /><path d="m8 16 3 3-3 3M17.5 4.5l-1.3 4.1-4.1-1.3M3.5 9.8l4-.9.9 4" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  audio: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></>,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2" /><path d="M22 10.5v3M7 10v4M10.5 10v4" /></>,
  watch: <><rect x="6" y="6.5" width="12" height="11" rx="3" /><path d="M9 6.5 9.5 3h5l.5 3.5M9 17.5l.5 3.5h5l.5-3.5M12 9.5V12l1.5 1" /></>,
  case: <><rect x="5.5" y="2.5" width="13" height="19" rx="3" /><rect x="8" y="5" width="4" height="4" rx="1" /></>,
  cable: <><path d="M7 3v5M11 3v5M5.5 8h7v3a3.5 3.5 0 0 1-7 0V8ZM9 14.5V17a4 4 0 0 0 8 0V7a3 3 0 0 1 3-3" /></>,
  charger: <><rect x="5" y="7" width="14" height="12" rx="3" /><path d="M9 3v4M15 3v4M12.5 10l-2 3h3l-2 3" /></>,
  mount: <><rect x="8" y="2.5" width="8" height="12" rx="1.5" /><path d="M12 14.5V19M7 21.5h10M9.5 19h5" /></>,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></>,
  headset: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /></>,
  play: <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />,
  volume: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  sparkle:<path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7Z" />,
}

export default function Icon({ name, size = 20, filled = false, className = '', strokeWidth = 1.8, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`icon ${className}`}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
