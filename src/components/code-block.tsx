"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Check, Copy } from "@/components/icons";
import type { Lang } from "@/lib/playground/runtime-protocol";

export interface CodeBlockProps {
  code: string;
  lang?: Lang;
  language?: Lang;
  /** The book's own label for the block, printed beside the language. */
  caption?: string;
  /** `false` renders the read-only marker the books use for fragments. */
  runnable?: boolean;
  /** Where "Run in playground" goes. Absent means the block has no run affordance. */
  runHref?: string;
  /** Extra controls beside Copy, e.g. the reader's own "Save" or "Bookmark". */
  actions?: ReactNode;
  /** Follows the block for the whole width, e.g. a "what this does" line. */
  footnote?: ReactNode;
  className?: string;
}

/**
 * One code block, rendered the same way everywhere: the book's body, the cheatsheet
 * drawer, an exercise card and the print route. Numbered with a gutter that is
 * `aria-hidden`, because a screen reader gains nothing from "twelve" before a line of
 * Python, and scrollable by keyboard.
 *
 * There is no syntax highlighter on purpose: a tokeniser would be a dependency heavier
 * than the product it decorates, and the mono face already separates code from prose.
 */
export function CodeBlock({
  code,
  lang,
  language,
  caption,
  runnable = true,
  runHref,
  actions,
  footnote,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const displayLang = lang ?? language ?? "text";
  const lines = code.replace(/\n+$/, "").split("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A blocked clipboard is the browser's call, not an error worth a dialog.
    }
  };

  const hasFooter = Boolean(caption || actions || runHref || runnable === false);

  return (
    <figure className={["codeblock", className].filter(Boolean).join(" ")}>
      <pre className="code" tabIndex={0} aria-label={caption ? `${displayLang} code: ${caption}` : `${displayLang} code`}>
        <code>
          {lines.map((line, index) => (
            // The line number is the only stable key a code block can have.
            <span className="code__line" key={index}>
              <span className="code__num" aria-hidden="true">
                {index + 1}
              </span>
              {line.length > 0 ? line : "\u00a0"}
            </span>
          ))}
        </code>
      </pre>

      {hasFooter ? (
        <figcaption className="codeblock__foot">
          <span className="codeblock__label">
            {caption ? <span>{caption}</span> : <span className="visually-hidden">{lang} code</span>}
            {runnable === false ? <span className="chip">Read only</span> : null}
          </span>
          <span className="codeblock__controls">
            {actions}
            {runnable && runHref ? (
              <a className="btn btn--quiet btn--sm" href={runHref}>
                Run in playground
              </a>
            ) : null}
            <button type="button" className="btn btn--quiet btn--sm" onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </span>
        </figcaption>
      ) : null}

      {footnote ? <div className="codeblock__note">{footnote}</div> : null}

      <span className="visually-hidden" role="status">
        {copied ? "Copied to the clipboard" : ""}
      </span>
    </figure>
  );
}
