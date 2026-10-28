"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Global smooth momentum scrolling powered by Lenis.
 * Gracefully respects prefers-reduced-motion by falling back to native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    // If user prefers reduced motion or forced reduce, skip smooth scrolling
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const forced = new URLSearchParams(window.location.search).get("reduce") === "1";

    if (prefersReducedMotion || forced) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential out
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
