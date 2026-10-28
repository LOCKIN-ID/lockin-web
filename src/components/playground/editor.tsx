"use client";

import { useEffect, useRef } from "react";

import type { PanelLang } from "@/lib/playground/snippets";

/**
 * The code editor. One `<textarea>`, deliberately: a code-editor dependency costs more
 * than this panel earns, and every feature the books need: Tab indentation, a line-number
 * gutter, honest keyboard behaviour: is a few lines here.
 *
 * The gutter is `aria-hidden`, and the textarea carries the accessible name, so a screen
 * reader reads the code rather than the numbers beside it.
 */
export function Editor({
  value,
  onChange,
  lang,
  label,
  readOnly,
  minRows = 14,
}: {
  value: string;
  onChange: (value: string) => void;
  lang: PanelLang;
  label: string;
  readOnly?: boolean;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const lines = value.split("\n").length;

  // Keep the gutter in step with the textarea's own scrolling.
  const gutterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const textarea = ref.current;
    const gutter = gutterRef.current;
    if (!textarea || !gutter) return;
    const sync = () => {
      gutter.scrollTop = textarea.scrollTop;
    };
    textarea.addEventListener("scroll", sync);
    return () => textarea.removeEventListener("scroll", sync);
  }, []);

  return (
    <div className="editor">
      <div className="editor__gutter" aria-hidden="true" ref={gutterRef}>
        {Array.from({ length: lines }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <textarea
        ref={ref}
        className="editor__input"
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={Math.max(minRows, Math.min(lines, 28))}
        aria-label={label}
        data-lang={lang}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          const textarea = event.currentTarget;
          if (event.key !== "Tab") return;
          event.preventDefault();
          const { selectionStart, selectionEnd } = textarea;
          const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
          onChange(next);
          // Put the caret after the two spaces we just inserted.
          requestAnimationFrame(() => {
            textarea.selectionStart = selectionStart + 2;
            textarea.selectionEnd = selectionStart + 2;
          });
        }}
      />
    </div>
  );
}
