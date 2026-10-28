"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * The site's one reveal system.
 *
 * An element carries `data-reveal="up" | "left" | "right" | "plate"` and the
 * stylesheet holds its start state; this component only adds `.is-in` when the
 * element arrives, so the finished layout is what the CSS says and the page
 * reads with scripting off (Hallmark 62).
 *
 * Two behaviours, one observer: `IntersectionObserver` rather than a scroll
 * listener (craft.md § 5), and a `data-reveal-group` numbers its children so a
 * block settles in sequence. Reduced motion settles everything at once, and
 * `?reduce=1` forces that state for the smoke test.
 */
const MAX_STAGGER = 5;

export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forced = new URLSearchParams(window.location.search).get("reduce") === "1";
    if (forced || reduceQuery.matches) {
      for (const element of document.querySelectorAll("[data-reveal]")) {
        element.classList.add("is-in");
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "120px 0px 80px 0px", threshold: 0 },
    );

    const scan = () => {
      const vh = window.innerHeight || 800;
      for (const group of document.querySelectorAll("[data-reveal-group]")) {
        group.querySelectorAll<HTMLElement>("[data-reveal]").forEach((child, index) => {
          child.style.setProperty("--i", String(Math.min(index, MAX_STAGGER)));
        });
      }
      for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")) {
        const rect = element.getBoundingClientRect();
        if (rect.top < vh + 120) {
          element.classList.add("is-in");
        } else {
          observer.observe(element);
        }
      }
    };
    scan();
    // Brief timeout to ensure dynamic route nodes mount
    const timer = setTimeout(scan, 60);

    // Client navigation swaps the page's DOM under this layout, so the new
    // sections have to be picked up without a reload.
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}