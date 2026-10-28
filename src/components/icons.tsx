import type { SVGProps } from "react";

/**
 * The page's whole icon set, hand-drawn here so no emoji and no second icon
 * library ever appears (Hallmark 30a, 30b). Every icon is decorative by
 * default: it is `aria-hidden` unless the caller gives it a label, and it is
 * drawn in `currentColor` so the caller picks the token.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number; label?: string };

function Icon({ size = 20, label, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Play(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5 18 12 8 18.5Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Icon>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <path d="M13.5 13.5h3v3h-3zM20.5 13.5v7h-7" />
    </Icon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5a9.6 9.6 0 0 1-2.6-.35L4.5 20.5l1.3-3.4A6.4 6.4 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
    </Icon>
  );
}

export function Trophy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 5.5H5.5a2.5 2.5 0 0 0 2.5 5M16 5.5h2.5a2.5 2.5 0 0 1-2.5 5M12 13v3.5M9 20h6M10.5 16.5h3" />
    </Icon>
  );
}

export function Clock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function Menu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function Close(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function Pause(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5v14M15 5v14" />
    </Icon>
  );
}

export function Terminal(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="m7 10 2.5 2.5L7 15M12.5 15H17" />
    </Icon>
  );
}

export function Spark4(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M12 3c.7 4.6 2.4 6.3 7 7-4.6.7-6.3 2.4-7 7-.7-4.6-2.4-6.3-7-7 4.6-.7 6.3-2.4 7-7Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export function Plus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function Download(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </Icon>
  );
}

export function Copy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </Icon>
  );
}

export function Search(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function Mail(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function Shield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 19 6v6c0 4.2-3 7-7 8.5C8 19 5 16.2 5 12V6Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function Users(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="9" r="3" />
      <path d="M3.5 19a6 6 0 0 1 12 0M16 6.2a3 3 0 0 1 0 5.6M17.5 19a6 6 0 0 0-2-4.5" />
    </Icon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19v14H6.5a2 2 0 0 0-2 2Z" />
      <path d="M4.5 5.5V19.5" />
    </Icon>
  );
}

export function Flame(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5c3 3.4 6 5.6 6 9.5a6 6 0 0 1-12 0c0-2.2 1-3.6 2.4-4.8.5 1.2 1.3 1.9 2.3 2.2-.6-2.4-.6-4.6 1.3-6.9Z" />
    </Icon>
  );
}

export function Info(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </Icon>
  );
}

export function Warn(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.5 21 19.5H3Z" />
      <path d="M12 10v4M12 16.8h.01" />
    </Icon>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

export function Arrow(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14m0 0-5-5m5 5-5 5" />
    </Icon>
  );
}

export function Refresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12a7 7 0 1 1-2.1-5M19 4.5V10h-5.5" />
    </Icon>
  );
}

export function Star(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 2.4 5.1 5.6.7-4.1 3.9 1 5.6-4.9-2.7-4.9 2.7 1-5.6L4 9.8l5.6-.7Z" />
    </Icon>
  );
}

export function Trash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7h14M9.5 7V5h5v2M7.5 7l.8 12h7.4l.8-12M10.5 10.5v5M13.5 10.5v5" />
    </Icon>
  );
}

export function Send(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12 20 5l-6.5 15-2.2-6.3Z" />
    </Icon>
  );
}
