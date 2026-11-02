"use client";

import { useEffect, useState, useCallback } from "react";
import { LockinLogoSvg, Mark } from "@/components/brand/logo";
import { Topography } from "@/components/brand/topography";

interface SiteIntroProps {
  /** Optional callback when curtain finishes sliding up */
  onComplete?: () => void;
  /** Force show regardless of sessionStorage */
  force?: boolean;
}

export function SiteIntro({ onComplete, force = false }: SiteIntroProps) {
  const [phase, setPhase] = useState<"holding" | "sliding" | "done">("holding");
  const [mounted, setMounted] = useState(false);

  const dismiss = useCallback(() => {
    setPhase("sliding");
    const timer = setTimeout(() => {
      setPhase("done");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lockin_intro_seen", "true");
      }
      onComplete?.();
    }, 1350);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    setMounted(true);

    // Honor reduced motion: skip immediately
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setPhase("done");
      onComplete?.();
      return;
    }

    // Check if already seen in current session unless forced
    if (!force && typeof window !== "undefined" && sessionStorage.getItem("lockin_intro_seen") === "true") {
      setPhase("done");
      onComplete?.();
      return;
    }

    // Hold logo and topography for ~1.8s for smooth cinematic pacing
    const holdTimer = setTimeout(() => {
      dismiss();
    }, 1800);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearTimeout(holdTimer);
        setPhase("done");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lockin_intro_seen", "true");
        }
        onComplete?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(holdTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss, force, onComplete]);

  if (!mounted || phase === "done") return null;

  const isSliding = phase === "sliding";

  return (
    <div
      role="dialog"
      aria-label="LOCK.IN Intro"
      aria-modal="true"
      className="site-intro"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--color-forest-deep)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transform: isSliding ? "translateY(-100%)" : "translateY(0%)",
        transition: isSliding ? "transform 1.35s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
        willChange: isSliding ? "transform" : "auto",
        pointerEvents: isSliding ? "none" : "auto",
      }}
    >
      {/* Topographic Elevation Map Background (Dark Variant) */}
      <Topography variant="dark" />

      {/* Skip Button */}
      <button
        type="button"
        onClick={() => {
          setPhase("done");
          sessionStorage.setItem("lockin_intro_seen", "true");
          onComplete?.();
        }}
        className="site-intro__skip"
        style={{
          position: "absolute",
          top: "var(--space-md)",
          right: "var(--space-md)",
          background: "color-mix(in oklab, var(--color-ink) 70%, transparent)",
          border: "var(--rule-hair) solid color-mix(in oklab, var(--color-paper-3) 15%, transparent)",
          borderRadius: "var(--radius-pill)",
          color: "var(--color-paper-2)",
          padding: "var(--space-2xs) var(--space-sm)",
          fontSize: "var(--text-xs)",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        Lewati [Esc]
      </button>

      {/* Central Brand Lockup & Glowing Spark Mark */}
      <div
        className="site-intro__center"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-md)",
          textAlign: "center",
          transform: isSliding ? "translateY(-32px) scale(0.96)" : "none",
          opacity: isSliding ? 0 : 1,
          transition: isSliding
            ? "transform 1.1s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.75s ease-out"
            : "none",
        }}
      >
        {/* Glowing Compass/Lock Emblem */}
        <div
          style={{
            position: "relative",
            width: "68px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-pill)",
            background: "color-mix(in oklab, var(--color-accent) 12%, transparent)",
            border: "1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)",
            boxShadow: "0 0 32px color-mix(in oklab, var(--color-accent) 25%, transparent)",
          }}
        >
          <Mark size={44} onDark={true} />
        </div>

        {/* Wordmark Logo */}
        <div style={{ maxWidth: "320px", width: "85vw" }}>
          <LockinLogoSvg height={48} className="w-full h-auto" />
        </div>

        {/* Tactical Subtitle Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            padding: "var(--space-2xs) var(--space-md)",
            background: "color-mix(in oklab, var(--color-ink) 80%, black)",
            border: "var(--rule-hair) solid color-mix(in oklab, var(--color-accent) 25%, transparent)",
            borderRadius: "var(--radius-pill)",
            color: "var(--color-paper-2)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "var(--radius-pill)",
              background: "var(--color-accent)",
              display: "inline-block",
            }}
          />
          <span>Developer Benchmark • Curated Field Manuals</span>
        </div>
      </div>

      {/* Bottom Leading Horizon Line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(to right, transparent, var(--color-accent), transparent)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}
