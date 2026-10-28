/**
 * The code the product ships as samples. The hero runs these three, one per
 * browser-shipped language, and every sample prints `6` so a curious visitor
 * can tell within one click that the panel is not a screenshot.
 *
 * Step 5 adds the exercise source: the runnable code blocks of the books a
 * signed-in reader owns, loaded into the same panel.
 */

import type { Lang } from "./runtime-protocol";

/** The languages the panel can run in this process, without a fetch. */
export type PanelLang = "html" | "js" | "python" | "shell";

export interface Sample {
  lang: PanelLang;
  label: string;
  /** What the output area says before the first run. */
  idle: string;
  /** The line the panel reports while the runtime is still coming up. */
  preparing?: string;
  code: string;
  /** Height of the sandboxed frame, in px. */
  previewHeight?: number;
}

export const SAMPLES: readonly Sample[] = [
  {
    lang: "html",
    label: "HTML",
    idle: "Rendered in a sandboxed frame.",
    code: '<h1 id="head">LOCK.IN</h1>\n<p id="out">2 x 3 = ?</p>\n<script>document.querySelector("#out").textContent = "2 x 3 = " + (2 * 3);</script>',
    previewHeight: 132,
  },
  {
    lang: "js",
    label: "JavaScript",
    idle: "A fresh worker per run.",
    code: "const price = 2;\nconst qty = 3;\nconsole.log(price * qty);",
  },
  {
    lang: "python",
    label: "Python",
    idle: "Boots once, then stays warm.",
    preparing: "Preparing the Python runtime. The first run reads about 10 MB from the CDN.",
    code: "price = 2\nqty = 3\nprint(price * qty)",
  },
  {
    lang: "shell",
    label: "Shell",
    idle: "One command per line, in a filesystem that lives in this tab.",
    code: "ls /home/student\ncat /home/student/notes.txt",
  },
];

export const DEFAULT_SAMPLE: PanelLang = "python";

export function sampleFor(lang: PanelLang): Sample {
  const found = SAMPLES.find((sample) => sample.lang === lang);
  if (!found) throw new Error(`no sample for ${lang}`);
  return found;
}

/** The engine's own language id, so the panel and the runtime agree. */
export function engineLang(lang: PanelLang): Lang {
  return lang;
}

export function isPanelLang(val: unknown): val is PanelLang {
  return typeof val === "string" && ["html", "js", "python", "shell"].includes(val);
}
