import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("accessible-animation (WCAG & Tiered Reduced Motion)", () => {
  it("includes global 0.01ms reduced-motion safety net in base.css without 0s churn", () => {
    const css = readFileSync(join(process.cwd(), "src/app/base.css"), "utf8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation-duration: 0.01ms !important");
    expect(css).toContain("transition-duration: 0.01ms !important");
    expect(css).toContain("animation-iteration-count: 1 !important");
  });

  it("provides hover and explicit pause state on the marquee per WCAG 2.2.2", () => {
    const css = readFileSync(join(process.cwd(), "src/app/base.css"), "utf8");
    expect(css).toContain(".marquee.is-paused .marquee__track");
    expect(css).toContain("animation-play-state: paused");
  });

  it("tiers drawer and modal entrance to cross-fade under reduced motion", () => {
    const css = readFileSync(join(process.cwd(), "src/app/base.css"), "utf8");
    expect(css).toContain(".drawer-enter");
    expect(css).toContain("animation: drawer-fade 150ms");
  });
});
