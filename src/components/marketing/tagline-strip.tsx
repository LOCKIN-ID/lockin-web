"use client";

import type { ReactNode } from "react";
import { TaglineImage, LockinLogoSvg } from "@/components/brand/logo";

interface Props {
  tone?: "forest" | "deep" | "mint" | "paper";
  items?: (string | ReactNode)[];
  direction?: "normal" | "reverse";
  speed?: "normal" | "fast" | "slow";
  className?: string;
}

/**
 * Ticker marquee ribbon with multiple color tones and directional variations.
 * Pause button removed per design request; automatically respects prefers-reduced-motion
 * and pauses on hover / focus-within.
 */
export function TaglineStrip({
  tone = "forest",
  items,
  direction = "normal",
  speed = "normal",
  className = "",
}: Props) {
  const toneClass =
    tone === "deep"
      ? "band-deep py-3.5"
      : tone === "mint"
        ? "band-mint py-3"
        : tone === "paper"
          ? "band-paper-ribbon py-2.5"
          : "band-forest py-3.5";

  const speedClass =
    speed === "fast"
      ? "marquee--fast"
      : speed === "slow"
        ? "marquee--slow"
        : "";

  const dirClass = direction === "reverse" ? "marquee--reverse" : "";

  return (
    <div className={`${toneClass} ${className} relative select-none`} aria-hidden="true">
      <div className={`marquee ${dirClass} ${speedClass}`}>
        <div className="marquee__track">
          {[false, true].map((clone) => (
            <div key={String(clone)} className="flex items-center" data-clone={clone ? "true" : "false"}>
              {items ? (
                items.map((item, idx) => (
                  <span key={idx} className="marquee__cell flex items-center gap-4">
                    <span className="font-display text-sm tracking-wider uppercase font-bold">
                      {item}
                    </span>
                    <span className="opacity-35 text-xs">·</span>
                  </span>
                ))
              ) : (
                [0, 1, 2, 3].map((cell) => (
                  <span key={cell} className="marquee__cell flex items-center gap-4">
                    <TaglineImage height={18} />
                    <span className="opacity-35 text-base">·</span>
                    <LockinLogoSvg height={18} />
                    <span className="opacity-35 text-base">·</span>
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
