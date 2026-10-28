"use client";

import { useRef } from "react";

import { SAMPLES, type PanelLang } from "@/lib/playground/snippets";

/**
 * A real tablist: one tab stop for the whole group, arrow keys move the
 * selection, and the panel that follows is labelled by the selected tab.
 */
export function LanguageTabs({
  lang,
  onSelect,
  panelId,
  idPrefix,
}: {
  lang: PanelLang;
  onSelect: (lang: PanelLang) => void;
  panelId: string;
  idPrefix: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (delta: number) => {
    const index = SAMPLES.findIndex((sample) => sample.lang === lang);
    const next = SAMPLES[(index + delta + SAMPLES.length) % SAMPLES.length];
    onSelect(next.lang);
    refs.current[SAMPLES.findIndex((sample) => sample.lang === next.lang)]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Language"
      className="rail"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {SAMPLES.map((sample, index) => {
        const selected = sample.lang === lang;
        return (
          <button
            key={sample.lang}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${sample.lang}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            className="chip font-outlier text-xs"
            data-state={selected ? "on" : "off"}
            onClick={() => onSelect(sample.lang)}
          >
            {sample.label}
          </button>
        );
      })}
    </div>
  );
}
