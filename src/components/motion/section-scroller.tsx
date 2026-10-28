"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

interface WindowWithLenis extends Window {
  __lenis?: {
    scrollTo: (target: number | HTMLElement, options?: { duration?: number; offset?: number }) => void;
  };
}

/**
 * Performant 60fps Scroll Indicator & Navigation.
 * - Displays ONLY a transparent arrow icon without background.
 * - Only reveals when the user is idle for 6 seconds without moving or scrolling.
 * - Disappears immediately upon any user activity.
 * - Clicking the arrow glides smoothly to the next section.
 */
export function SectionScroller() {
  const pathname = usePathname();
  const [isIdle, setIsIdle] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const sectionsRef = useRef<number[]>([]);
  const idleTimerRef = useRef<number | undefined>(undefined);

  // Collect section offsets without layout thrashing
  const updateSections = useCallback(() => {
    if (typeof window === "undefined") return;

    const selector = "main > section, .hero, .scrolly, .section, header.pagehead, footer.mast, footer";
    const rawElements = Array.from(document.querySelectorAll<HTMLElement>(selector));

    const elements = rawElements.filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== "none" && rect.height > 100;
    });

    const tops = Array.from(new Set(elements.map((el) => el.offsetTop))).sort((a, b) => a - b);
    sectionsRef.current = tops;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    setAtBottom(window.scrollY >= maxScroll - 60);
  }, []);

  const scrollToNext = useCallback(() => {
    const currentY = window.scrollY;
    const nextOffset = sectionsRef.current.find((top) => top > currentY + 60);

    const win = window as unknown as WindowWithLenis;
    if (nextOffset !== undefined) {
      if (win.__lenis) {
        win.__lenis.scrollTo(nextOffset, { duration: 1.1 });
      } else {
        window.scrollTo({ top: nextOffset, behavior: "smooth" });
      }
    } else {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (win.__lenis) {
        win.__lenis.scrollTo(maxScroll, { duration: 1.1 });
      } else {
        window.scrollTo({ top: maxScroll, behavior: "smooth" });
      }
    }
  }, []);

  // Idle timer logic: 6 seconds of no user interaction
  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      window.clearTimeout(idleTimerRef.current);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const isEnd = window.scrollY >= maxScroll - 60;
      setAtBottom(isEnd);

      if (!isEnd) {
        idleTimerRef.current = window.setTimeout(() => {
          setIsIdle(true);
        }, 6000); // 6 seconds idle delay
      }
    };

    // Initial 6-second timer
    resetIdleTimer();

    // Listen for any user activity
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    return () => {
      window.clearTimeout(idleTimerRef.current);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [pathname]);

  // Update section layout on route change and resize
  useEffect(() => {
    updateSections();
    const timer = setTimeout(updateSections, 300);

    const handleResize = () => {
      updateSections();
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname, updateSections]);

  const isVisible = isIdle && !atBottom;

  return (
    <button
      type="button"
      onClick={scrollToNext}
      aria-label="Scroll to next section"
      style={{
        position: "fixed",
        bottom: "28px",
        left: "50%",
        transform: isVisible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(14px)",
        opacity: isVisible ? 0.75 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        zIndex: 90,
        background: "transparent",
        border: "none",
        padding: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-forest)",
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      <svg
        className="scroll-arrow-bounce"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <path d="M12 4v16" />
        <path d="m18 14-6 6-6-6" />
      </svg>
    </button>
  );
}
