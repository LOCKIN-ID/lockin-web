"use client";

import { useEffect, useState } from "react";

/**
 * Accessibly honor prefers-reduced-motion as tiered degradation.
 *
 * Checks OS-level settings (`prefers-reduced-motion: reduce`) and the
 * testing seek harness parameter `?reduce=1`.
 *
 * Gated with live `change` listener so toggling the OS accessibility setting
 * immediately takes effect without requiring a page reload.
 */
export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";

  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia(query);
    const update = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const forceReduce = urlParams.get("reduce") === "1";
      setReduced(forceReduce || mq.matches);
    };

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
