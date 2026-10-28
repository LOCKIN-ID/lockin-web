"use client";

import { useState } from "react";

import { buildShareHash } from "@/lib/playground/share";
import type { PanelLang } from "@/lib/playground/snippets";

/**
 * Copies a link that carries the code in its hash. The confirmation is the button's own
 * label changing for a moment: a toast for "copied" is noise, and the label is read by a
 * screen reader without a live region.
 */
export function ShareButton({ lang, code }: { lang: PanelLang; code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <button
      type="button"
      className="btn btn--quiet"
      onClick={async () => {
        try {
          const hash = await buildShareHash({ lang, code });
          const url = `${window.location.origin}/playground${hash}`;
          await navigator.clipboard.writeText(url);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 2400);
      }}
    >
      {state === "copied" ? "Link copied" : state === "failed" ? "Copy failed" : "Share this code"}
    </button>
  );
}
