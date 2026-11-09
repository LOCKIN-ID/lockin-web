"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { LockinLogoSvg, Mark } from "@/components/brand/logo";

export function Hero() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  // Direct DOM references for 0-lag 120fps GPU cursor tracking
  const circleRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isHoveringRef = useRef(false);
  const isExpandingRef = useRef(false);

  // Real-time GPU cursor tracking without React re-renders
  useEffect(() => {
    if (isUnlocked) return;

    const circle = circleRef.current;
    if (!circle) return;

    let rafId: number | null = null;
    let targetX = -100;
    let targetY = -100;
    let isVisible = false;

    const updateTransform = () => {
      if (!circle) return;
      if (isExpandingRef.current) return; // Keep expansion origin anchored

      if (!isVisible) {
        circle.style.opacity = "0";
        rafId = null;
        return;
      }

      circle.style.opacity = "1";

      if (isHoveringRef.current && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const factor = 0.32;
        const deltaX = (targetX - centerX) * factor;
        const deltaY = (targetY - centerY) * factor;
        circle.style.transform = `translate3d(${centerX + deltaX}px, ${centerY + deltaY}px, 0) translate(-50%, -50%)`;
      } else {
        circle.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }

      rafId = null;
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isExpandingRef.current) return;
      targetX = e.clientX;
      targetY = e.clientY;
      isVisible = true;

      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
    };

    const handleWindowMouseLeave = () => {
      if (isExpandingRef.current) return;
      isVisible = false;
      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleWindowMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      document.removeEventListener("mouseleave", handleWindowMouseLeave);
    };
  }, [isUnlocked]);

  // Lock scrolling on document before the logo is clicked
  useEffect(() => {
    if (!isUnlocked) {
      document.documentElement.classList.add("is-hero-locked");
      document.body.classList.add("is-hero-locked");

      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      const preventKeyScroll = (e: KeyboardEvent) => {
        if (
          ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(
            e.code
          )
        ) {
          if (
            e.code === "Space" &&
            document.activeElement?.classList.contains("hero-lock-trigger")
          ) {
            return;
          }
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeyScroll);

      return () => {
        document.documentElement.classList.remove("is-hero-locked");
        document.body.classList.remove("is-hero-locked");
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("keydown", preventKeyScroll);
      };
    } else {
      document.documentElement.classList.remove("is-hero-locked");
      document.body.classList.remove("is-hero-locked");
    }
  }, [isUnlocked]);

  const handleUnlock = useCallback(() => {
    if (isExpanding || isUnlocked) return;
    setIsExpanding(true);
    isExpandingRef.current = true;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lockin:hero-revealed"));
    }

    // Unlock document scroll at exactly 5.2s when paragraph and buttons appear
    const timer = setTimeout(() => {
      setIsUnlocked(true);
    }, 5200);
    return () => clearTimeout(timer);
  }, [isExpanding, isUnlocked]);

  const handleLogoMouseEnter = () => {
    if (isExpandingRef.current) return;
    isHoveringRef.current = true;
    circleRef.current?.classList.add("is-hovering");
  };

  const handleLogoMouseLeave = () => {
    if (isExpandingRef.current) return;
    isHoveringRef.current = false;
    circleRef.current?.classList.remove("is-hovering");
  };

  return (
    <section
      className={`hero-chamber ${isExpanding ? "is-expanding" : ""} ${isUnlocked ? "is-unlocked" : ""}`}
      aria-label="LOCK.IN Main Overview"
    >
      {/* =================================================================
          DARK INITIAL STAGE: Viewport-fixed Dead-Center Logo on Dark Green
          ================================================================= */}
      <div className="hero-dark-stage" aria-hidden={isUnlocked}>
        {/* ONE Single Continuous Solid Cream Follower / Expanding Circle */}
        {!isUnlocked && (
          <div
            ref={circleRef}
            className={`hero-cream-circle ${isExpanding ? "is-expanding-screen" : ""}`}
            aria-hidden="true"
          />
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={handleUnlock}
          onMouseEnter={handleLogoMouseEnter}
          onMouseLeave={handleLogoMouseLeave}
          className="hero-lock-trigger"
          aria-label="Klik untuk membuka LOCK.IN"
          tabIndex={isUnlocked ? -1 : 0}
        >
          {/* Pure Circular Logo Emblem ONLY (NO text, NO pulse, NO scaling) */}
          <div className="hero-lock-emblem-wrap">
            <Mark size={144} onDark={true} />
          </div>
        </button>
      </div>

      {/* =================================================================
          RADIAL REVEAL CANVAS: 100% Centered Sequential Layout
          ================================================================= */}
      <div
        className={`hero-radial-canvas ${isExpanding ? "is-expanded" : ""}`}
        aria-hidden={!isUnlocked && !isExpanding}
      >
        <div className="hero-unlocked-stage">
          {/* Typographic Sequence: SHHH . . . GONNA LOCK.IN */}
          <div className="hero-brand-display">
            <div className="hero-eyebrow-sequence" aria-label="SHH... GONNA">
              <span className="hero-seq-item hero-seq--shh">SHH</span>
              <span className="hero-seq-item hero-seq--dot-1">.</span>
              <span className="hero-seq-item hero-seq--dot-2">.</span>
              <span className="hero-seq-item hero-seq--dot-3">.</span>
              <span className="hero-seq-item hero-seq--gonna">GONNA</span>
            </div>

            <div className="hero-seq-item hero-seq--lockin">
              <LockinLogoSvg height={105} className="w-full h-auto drop-shadow-sm" />
            </div>
            <h1 className="visually-hidden">LOCK.IN — Buku Ringkas &amp; Eksekusi Kode Instan</h1>
          </div>

          {/* Sequential: Paragraph & Buttons */}
          <div className="hero-seq-item hero-seq--others">
            <p className="hero-monumental-lead">
              Tinggalkan video tutorial puluhan jam dan materi bertele-tele.
              <br className="hero-lead-br" />
              Kuasai berbagai keterampilan esensial lewat buku ringkas 10–15 halaman dan panduan interaktif.
            </p>

            <div className="hero-monumental-actions">
              <Link href="/books" className="btn hero-btn-primary">
                <span>Jelajahi E-Book</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href="/playground" className="btn btn--quiet hero-btn-secondary">
                <span>Coba Playground</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
