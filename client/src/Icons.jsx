const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Svg = ({ children, size = 20, filled, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    {...base}
    {...(filled ? { fill: "currentColor", stroke: "none" } : {})}
    {...rest}
  >
    {children}
  </svg>
);

export const HomeIcon = (p) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Svg>
);

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const CompassIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </Svg>
);

export const ReelsIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M3 8.5h18" />
    <path d="m8 3 2.5 5.5" />
    <path d="m13.5 3 2.5 5.5" />
    <path d="m10.5 12.5 4 2.5-4 2.5z" />
  </Svg>
);

export const SendIcon = (p) => (
  <Svg {...p}>
    <path d="M21 3 10 14" />
    <path d="m21 3-7 18-4-7-7-4z" />
  </Svg>
);

export const VetIcon = (p) => (
  <Svg {...p}>
    <path d="M9 3v4a3 3 0 0 0 6 0V3" />
    <path d="M12 10v4a4 4 0 0 0 8 0v-1" />
    <circle cx="20" cy="11" r="2" />
  </Svg>
);

export const StoreIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7 5.5 3h13L20 7" />
    <path d="M4 7h16v3a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 13a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 10z" />
    <path d="M5.5 13v8h13v-8" />
    <path d="M9.5 21v-5h5v5" />
  </Svg>
);

export const BagIcon = (p) => (
  <Svg {...p}>
    <path d="M6 8h12l-1 13H7z" />
    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
  </Svg>
);

export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2 0 3.6 1.1 4.4 2.6h2C13.8 6.1 15.4 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" />
  </Svg>
);

export const CommentIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z" />
  </Svg>
);

export const SettingsIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);

export const PawIcon = (p) => (
  <Svg {...p} filled>
    <ellipse cx="7" cy="8.5" rx="2" ry="2.6" />
    <ellipse cx="17" cy="8.5" rx="2" ry="2.6" />
    <ellipse cx="3.8" cy="13" rx="1.8" ry="2.2" />
    <ellipse cx="20.2" cy="13" rx="1.8" ry="2.2" />
    <path d="M12 11c2.8 0 5.5 2.4 5.5 5.2 0 1.9-1.5 3.3-3.4 3.3-.8 0-1.5-.3-2.1-.6-.6.3-1.3.6-2.1.6-1.9 0-3.4-1.4-3.4-3.3C6.5 13.4 9.2 11 12 11z" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const StarIcon = (p) => (
  <Svg {...p} filled>
    <path d="m12 2 3 6.5 7 .8-5.2 4.7 1.4 6.9L12 17.3 5.8 20.9l1.4-6.9L2 9.3l7-.8z" />
  </Svg>
);

export const PinIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const ComposeIcon = (p) => (
  <Svg {...p}>
    <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    <path d="M18.4 3.6a2 2 0 0 1 2.8 2.8L13 14.6 9 16l1.4-4z" />
  </Svg>
);

export const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

export const AtIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </Svg>
);

export const CartIcon = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="17" cy="20" r="1.6" />
    <path d="M3 4h2.5l2.2 11h10.6l2-8H7" />
  </Svg>
);

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9.5h18M8 3v4M16 3v4" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const BackIcon = (p) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);

export const LogoutIcon = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Svg>
);

export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);
