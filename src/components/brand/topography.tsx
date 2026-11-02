import React from "react";

interface TopographyProps {
  variant?: "dark" | "paper";
  showCrosshair?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Topographic contour elevation map paths reflecting LOCK.IN's field manual theme.
 * Pure vector SVG with compositor-safe opacity and no external dependencies.
 */
export function Topography({
  variant = "paper",
  showCrosshair = false,
  className = "",
  style,
}: TopographyProps) {
  const isDark = variant === "dark";

  const majorColor = isDark
    ? "color-mix(in oklab, var(--color-accent) 24%, transparent)"
    : "color-mix(in oklab, var(--color-forest) 24%, transparent)";

  const minorColor = isDark
    ? "color-mix(in oklab, var(--color-paper-3) 8%, transparent)"
    : "color-mix(in oklab, var(--color-forest) 7%, transparent)";

  const highlightColor = isDark
    ? "color-mix(in oklab, var(--color-accent) 45%, transparent)"
    : "color-mix(in oklab, var(--color-forest) 48%, transparent)";

  const crosshairColor = isDark
    ? "var(--color-accent)"
    : "var(--color-mint-vivid)";

  const guideLineColor = isDark
    ? "color-mix(in oklab, var(--color-paper-3) 10%, transparent)"
    : "color-mix(in oklab, var(--color-forest) 9%, transparent)";

  return (
    <div
      className={`topography-wrap pointer-events-none select-none absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0, ...style }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Minor intermediate contours */}
        <path
          d="M-50,180 C220,120 400,280 620,240 C840,200 1020,310 1240,260 C1360,230 1450,290 1520,320"
          stroke={minorColor}
          strokeWidth="1"
        />
        <path
          d="M-40,240 C200,190 380,340 640,300 C860,260 1060,370 1280,320 C1390,290 1470,350 1520,380"
          stroke={minorColor}
          strokeWidth="1"
        />
        <path
          d="M-60,310 C180,260 360,400 660,360 C880,320 1100,430 1310,380 C1410,350 1480,410 1530,440"
          stroke={minorColor}
          strokeWidth="1"
        />
        <path
          d="M-30,380 C220,330 420,470 680,420 C900,380 1120,490 1340,440 C1430,410 1490,460 1540,490"
          stroke={minorColor}
          strokeWidth="1"
        />
        <path
          d="M-50,450 C240,400 440,540 700,490 C920,450 1140,560 1360,510 C1450,480 1500,530 1550,560"
          stroke={minorColor}
          strokeWidth="1"
        />
        <path
          d="M-40,530 C250,480 460,610 720,560 C940,520 1160,630 1380,580 C1460,550 1510,600 1560,630"
          stroke={minorColor}
          strokeWidth="1"
        />

        {/* Primary elevation ridge lines (High definition) */}
        <path
          d="M-60,110 C160,50 350,190 580,150 C800,110 980,220 1200,170 C1320,140 1420,200 1500,230"
          stroke={majorColor}
          strokeWidth="1.6"
        />
        <path
          d="M-50,590 C220,540 430,680 720,630 C960,590 1180,710 1400,660 C1480,630 1520,680 1570,710"
          stroke={majorColor}
          strokeWidth="1.6"
        />

        {/* Hero contour feature ribbon (Thickest landmark curve) */}
        <path
          d="M-40,160 C150,220 280,390 420,350 C580,300 700,460 850,420 C1010,370 1120,500 1270,450 C1380,410 1450,510 1520,550"
          stroke={highlightColor}
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Loop elevation peaks */}
        <path
          d="M780,210 C830,170 920,190 950,250 C980,310 910,370 850,350 C790,330 740,250 780,210 Z"
          stroke={minorColor}
          strokeWidth="1"
        />
        <path
          d="M800,230 C835,200 895,215 915,255 C935,295 890,335 850,320 C810,305 775,255 800,230 Z"
          stroke={majorColor}
          strokeWidth="1.4"
        />
        <path
          d="M820,250 C840,230 875,238 888,262 C900,285 872,310 850,300 C828,290 808,265 820,250 Z"
          stroke={minorColor}
          strokeWidth="1"
        />

        {/* Optional Coordinate Crosshair Reticle & Guide Lines */}
        {showCrosshair && (
          <g className="crosshair-reticle">
            {/* Horizontal coordinate hairline */}
            <line
              x1="0"
              y1="490"
              x2="1440"
              y2="490"
              stroke={guideLineColor}
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            {/* Vertical coordinate hairline */}
            <line
              x1="980"
              y1="0"
              x2="980"
              y2="900"
              stroke={guideLineColor}
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            {/* Central crosshair '+' */}
            <g transform="translate(980, 490)">
              <line x1="-12" y1="0" x2="12" y2="0" stroke={crosshairColor} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke={crosshairColor} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="0" cy="0" r="18" stroke={crosshairColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
              <circle cx="0" cy="0" r="3" fill={crosshairColor} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
