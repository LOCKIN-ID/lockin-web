import type { SVGProps } from "react";

/**
 * The three decorative marks traced from the deck's own artwork: the four-point
 * spark that sits inside the logo, the olive sprig printed at the cover's
 * bottom-right, and the soft stepped blob. They are drawn in `currentColor` so
 * the caller picks the token, and they are always decorative: `aria-hidden`,
 * absolutely positioned, never over text.
 */

export function Spark({ size = 96, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" {...props}>
      <path
        fill="currentColor"
        d="M50 0c4.4 30.2 15.4 41.2 45.6 45.6v8.8C65.4 58.8 54.4 69.8 50 100h-8.8C36.8 69.8 25.8 58.8 4 54.4v-8.8C25.8 41.2 36.8 30.2 41.2 0H50Z"
      />
    </svg>
  );
}

export function LeafSprig({ size = 120, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" focusable="false" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M8 112C34 92 62 62 80 20" />
        <path d="M40 84c-14-2-22-10-24-24 14 0 22 6 24 24Z" fill="currentColor" stroke="none" />
        <path d="M54 62c14 0 24-6 28-20-14-2-24 4-28 20Z" fill="currentColor" stroke="none" />
        <path d="M66 40c-12-4-18-13-17-27 13 3 19 12 17 27Z" fill="currentColor" stroke="none" />
        <path d="M32 100c12-6 27-8 42-6-6 12-16 18-30 16" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function BlobMark({ size = 200, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" focusable="false" {...props}>
      <path
        fill="currentColor"
        d="M26 78c0-22 18-40 40-40h42c9 0 17 4 23 10l40 40c15 15 15 40 0 55l-6 6c-15 15-40 15-55 0l-14-14-26 26c-15 15-40 15-55 0s-15-40 0-55l11-11V78Z"
      />
    </svg>
  );
}
