import type { ComponentType, ReactNode, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * All icons share one chassis: 24×24 viewBox, line art in currentColor at
 * 1.5px stroke, round caps/joins. Children are static elements, safe to reuse.
 */
function makeIcon(name: string, children: ReactNode): IconComponent {
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const IconRifle = makeIcon(
  "IconRifle",
  <>
    <path d="M2.5 10h20v1.5h-9v3h-2.75l.5-3H8l-1.75 2.25H3.5L5 11.5H2.5z" />
    <path d="M19.75 10V8.5" />
    <path d="M14.5 11.5c0 1.25 1 2 2.25 2" />
  </>,
);

export const IconPistol = makeIcon(
  "IconPistol",
  <>
    <path d="M3 8.5h18.5V12H11l-1.25 5.5H4.25L5.75 12H3z" />
    <path d="M11 12c.15 1.85 1.35 2.9 3.1 2.9 1 0 1.4-.55 1.4-1.5V12" />
    <path d="M20.25 8.5V7.25" />
    <path d="M4.5 8.5V7.5" />
  </>,
);

export const IconBow = makeIcon(
  "IconBow",
  <>
    <path d="M6.5 3c5.75 4 5.75 14 0 18" />
    <path d="M6.5 3 4.5 12l2 9" />
    <path d="M4.5 12h15.25" />
    <path d="M19.75 12l-3.5-2.5M19.75 12l-3.5 2.5" />
    <path d="M4.5 12 2.25 10.5M4.5 12l-2.25 1.5" />
  </>,
);

export const IconCrossbow = makeIcon(
  "IconCrossbow",
  <>
    <path d="M4 7.5c4.5-3.75 11.5-3.75 16 0" />
    <path d="M4 7.5l8 3.75 8-3.75" />
    <path d="M12 2.5v14.75" />
    <path d="M12 2.5 10.25 4.6M12 2.5l1.75 2.1" />
    <path d="M9.75 17.25h4.5l-.9 4.25h-2.7z" />
  </>,
);

export const IconGrenade = makeIcon(
  "IconGrenade",
  <>
    <circle cx="11" cy="14.75" r="5.75" />
    <path d="M9 9.4V6.75h4V9.4" />
    <path d="M13 7.4c1.1.35 1.75 1.6 2 3.2" />
    <circle cx="16.9" cy="5.4" r="1.8" />
    <path d="M15.15 5.7 13 6.6" />
    <path d="M5.5 12.5h11M5.9 17h10.2" />
    <path d="M8.75 12.5v4.5M13.25 12.5v4.5" />
  </>,
);

export const IconBlade = makeIcon(
  "IconBlade",
  <>
    <path d="M20.5 3.5c-4.9.3-8.9 2.55-10.85 6.7l3.9 3.9C17.7 12.1 20.2 8.4 20.5 3.5z" />
    <path d="M8.5 10.5l4.25 4.25" />
    <path d="M10 13.05 5.4 17.65" />
    <path d="M4.4 16.4l3.2 3.2" />
  </>,
);

export const IconArmory = makeIcon(
  "IconArmory",
  <>
    <path d="M12 2.75 19.25 5.5v5.9c0 4.55-2.85 7.65-7.25 9.85-4.4-2.2-7.25-5.3-7.25-9.85V5.5z" />
    <path d="M8.5 11 12 14.25 15.5 11" />
    <path d="M12 7.5v.01" />
  </>,
);

export const IconRules = makeIcon(
  "IconRules",
  <>
    <path d="M4 7h3.1M10.9 7H20" />
    <circle cx="9" cy="7" r="1.9" />
    <path d="M4 12h9.1M16.9 12H20" />
    <circle cx="15" cy="12" r="1.9" />
    <path d="M4 17h1.1M8.9 17H20" />
    <circle cx="7" cy="17" r="1.9" />
  </>,
);

export const IconShare = makeIcon(
  "IconShare",
  <>
    <circle cx="6" cy="12" r="2.4" />
    <circle cx="17.5" cy="5.5" r="2.4" />
    <circle cx="17.5" cy="18.5" r="2.4" />
    <path d="M8.1 10.8l7.3-4.1M8.1 13.2l7.3 4.1" />
  </>,
);

export const IconExport = makeIcon(
  "IconExport",
  <>
    <path d="M4.5 15v3.25a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
    <path d="M12 15.25V3.75" />
    <path d="M7.75 8 12 3.75 16.25 8" />
  </>,
);

export const IconTrash = makeIcon(
  "IconTrash",
  <>
    <path d="M4.25 6.5h15.5" />
    <path d="M9.25 6.5V4.9a1.15 1.15 0 0 1 1.15-1.15h3.2a1.15 1.15 0 0 1 1.15 1.15V6.5" />
    <path d="M6.5 6.5l.8 13.1a1.1 1.1 0 0 0 1.1 1.03h7.2a1.1 1.1 0 0 0 1.1-1.03l.8-13.1" />
    <path d="M10.25 10.5v6.25M13.75 10.5v6.25" />
  </>,
);

export const IconEdit = makeIcon(
  "IconEdit",
  <>
    <path d="M17 3.75 20.25 7 7.5 19.75 3 21l1.25-4.5z" />
    <path d="M14.75 6 18 9.25" />
  </>,
);

export const IconCopy = makeIcon(
  "IconCopy",
  <>
    <rect x="9" y="9" width="10.5" height="10.5" rx="1.25" />
    <path d="M5.75 15h-1A1.25 1.25 0 0 1 3.5 13.75v-9A1.25 1.25 0 0 1 4.75 3.5h9A1.25 1.25 0 0 1 15 4.75v1" />
  </>,
);

export const IconPlus = makeIcon(
  "IconPlus",
  <path d="M12 4.75v14.5M4.75 12h14.5" />,
);

export const IconSun = makeIcon(
  "IconSun",
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </>,
);

export const IconMoon = makeIcon(
  "IconMoon",
  <path d="M20.5 13.25A8.6 8.6 0 1 1 10.75 3.5a6.9 6.9 0 0 0 9.75 9.75z" />,
);

export const IconWrench = makeIcon(
  "IconWrench",
  <path d="M15.1 6.4a1 1 0 0 0 .05 1.35l1.1 1.1a1 1 0 0 0 1.35.05l3.15-3.15a5.6 5.6 0 0 1-7.4 7.4l-6.75 6.75a2 2 0 0 1-2.85-2.85l6.75-6.75a5.6 5.6 0 0 1 7.4-7.4z" />,
);

export const IconChevronDown = makeIcon(
  "IconChevronDown",
  <path d="M5.75 9l6.25 6 6.25-6" />,
);

export const IconWarning = makeIcon(
  "IconWarning",
  <>
    <path d="M12 4l9.25 16H2.75z" />
    <path d="M12 9.75v4.75" />
    <path d="M12 17.4v.01" />
  </>,
);

/** Extra (not in the contract, additive): close mark for dismiss buttons. */
export const IconX = makeIcon(
  "IconX",
  <path d="M6.25 6.25l11.5 11.5M17.75 6.25 6.25 17.75" />,
);
