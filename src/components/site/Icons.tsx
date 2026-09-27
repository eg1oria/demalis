import type { SVGProps } from "react";
import type { Amenity } from "@/lib/places/constants";

// Линейные иконки из макета (design/html), толщина 1.6–1.8.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, strokeWidth = 1.7, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Icon>
);
export const UsersIcon = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
    <path d="M16 4.8a3.3 3.3 0 010 6.4M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
  </Icon>
);
export const CalendarIcon = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);
export const MinusIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M6 12h12" />
  </Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M6 12h12M12 6v12" />
  </Icon>
);
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h16M4 16h16" />
  </Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const FiltersIcon = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Icon>
);
export const WhatsAppIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20l1.3-3.8A8 8 0 1112 20a8 8 0 01-3.9-1z" />
  </Icon>
);
export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 005.5 5.5l1.5-2 4 1.5V18a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />
  </Icon>
);
export const InstagramIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.8" cy="7.2" r="0.6" />
  </Icon>
);
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10.2 8.8l5 3.2-5 3.2z" />
  </Icon>
);
export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Icon>
);

// ── Удобства ──────────────────────────────────────────────────────────────
const AMENITY_PATHS: Record<Amenity, React.ReactNode> = {
  has_chan: (
    <>
      <path d="M4 12h16v3a5 5 0 01-5 5H9a5 5 0 01-5-5v-3z" />
      <path d="M9 4c-1 1.2 1 2.3 0 3.5M13 4c-1 1.2 1 2.3 0 3.5" />
    </>
  ),
  has_banya: (
    <>
      <path d="M4 20V10l8-6 8 6v10z" />
      <path d="M10 17c0-1.5 1.5-1.8 1.5-3.2M13.5 17c0-1.5 1.5-1.8 1.5-3.2" />
    </>
  ),
  pets_allowed: (
    <>
      <circle cx="6.5" cy="10.5" r="1.6" />
      <circle cx="10" cy="6.5" r="1.6" />
      <circle cx="14" cy="6.5" r="1.6" />
      <circle cx="17.5" cy="10.5" r="1.6" />
      <path d="M12 12c-3 0-5.5 3.2-5.5 5.3 0 1.7 1.5 2.2 3 1.7 1.2-.4 1.8-.6 2.5-.6s1.3.2 2.5.6c1.5.5 3-.1 3-1.7 0-2.1-2.5-5.3-5.5-5.3z" />
    </>
  ),
  has_bbq: (
    <>
      <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 01-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-7.5z" />
      <path d="M5 21h14" />
    </>
  ),
  has_kitchen: (
    <>
      <path d="M4 10h16v5a5 5 0 01-5 5H9a5 5 0 01-5-5z" />
      <path d="M2 10h2M20 10h2M9 6.5c0-1 1-1 1-2.5M14 6.5c0-1 1-1 1-2.5" />
    </>
  ),
  has_wifi: (
    <>
      <path d="M3 9a13 13 0 0118 0M6 12.5a8.5 8.5 0 0112 0M9 16a4 4 0 016 0" />
      <circle cx="12" cy="19" r="0.8" />
    </>
  ),
  has_pool: (
    <>
      <path d="M3 17c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
      <path d="M3 13.5c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
      <path d="M8 11V5.5a1.5 1.5 0 013 0M14 11V5.5a1.5 1.5 0 013 0M8 8h6" />
    </>
  ),
  winter_ok: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="M9.5 4.5L12 6.5l2.5-2M9.5 19.5l2.5-2 2.5 2" />
    </>
  ),
};

export function AmenityIcon({
  amenity,
  ...p
}: IconProps & { amenity: Amenity }) {
  return (
    <Icon strokeWidth={1.6} {...p}>
      {AMENITY_PATHS[amenity]}
    </Icon>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 23L10 9l4.5 7.6L17.5 12 26 23z" fill="var(--accent)" />
      <circle cx="20.5" cy="6.5" r="2.4" fill="var(--logo-sun)" />
    </svg>
  );
}
