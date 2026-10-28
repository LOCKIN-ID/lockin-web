"use client";

interface Props {
  completedSections: number;
  totalSections: number;
}

export function ProgressRail({ completedSections, totalSections }: Props) {
  const fraction = totalSections > 0 ? Math.min(1, Math.max(0, completedSections / totalSections)) : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-2xs)",
        padding: "var(--space-sm) var(--space-md)",
        background: "var(--color-paper-2)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
        <span style={{ fontWeight: 600 }}>Reading Progress</span>
        <span style={{ fontFamily: "var(--font-outlier)", color: "var(--color-forest)" }}>
          {completedSections} / {totalSections} ({percent}%)
        </span>
      </div>

      <div
        style={{
          height: "6px",
          background: "var(--color-paper-3)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--color-forest)",
            transformOrigin: "left",
            transform: `scaleX(${fraction})`,
            transition: "transform var(--dur-short) var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}
