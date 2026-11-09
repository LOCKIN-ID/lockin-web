# Design: LOCK.IN

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.
Built with [hallmark](https://github.com/nutlope/hallmark) (MIT) at commit `7ec868225c6caa040558c321ee0fefa0e73f83a8`.

## System
- Genre: playful
- Shape of the first page: Studio Cuts — headline and lead on the left cut against the live snippet panel on the right
- Theme: LOCK.IN brand (locked) — the brand is drawn from the deck `Lock.in.pdf`, not dealt from the catalogue
- Axes: paper/Archivo Black/mint · posture: workbench
- Job: buy (the e-books). Signature: the snippet in the hero really runs, in this page, on the reader's machine.
- Pages after the first rotate composition (macrostructures 1, 4, 5, 11, 13, 21) but never the system below.

## Tokens
`tokens.css` is the source of truth. Every value is OKLCH, converted from a pixel sampled out of `Lock.in.pdf`;
the sample each role comes from is named beside it. No colour or family is declared anywhere else.

```css
:root {
  --color-paper: oklch(96.02% 0.0121 96.4);   /* #F1F1EB, the deck's slide ground */
  --color-paper-2: oklch(92.68% 0.0176 96.1);  --color-paper-3: oklch(99.07% 0.0054 95.1);
  --color-ink: oklch(26.15% 0.0384 157.6);     /* #294A31, the deck's prevailing dark */
  --color-ink-2: oklch(37.59% 0.0579 150.6);   /* #275738, the second dark */
  --color-muted: oklch(48% 0.025 154);         --color-rule: oklch(86.31% 0.0236 93.4);
  --color-accent: oklch(83.27% 0.1901 157.9);  /* #1FEC97, the mark's mint */
  --color-accent-ink: oklch(31.1% 0.0626 159.5);  --color-focus: oklch(46.62% 0.1066 157.3);
  --color-taupe: oklch(70.21% 0.0378 51.8);    /* #B3998A, the deck's brand shape */
  --color-forest: oklch(37.59% 0.0579 150.6);  --color-forest-deep: oklch(31.02% 0.0462 150.6);
  --font-display: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;   /* Archivo Black, weight 900 */
  --font-body: var(--font-inter), ui-sans-serif, system-ui, sans-serif;        /* Inter */
  --font-outlier: var(--font-mono-code), ui-monospace, SFMono-Regular, monospace;  /* JetBrains Mono: code, terminals, keyword chips only */
  --radius-card: 12px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: 0 1px 2px oklch(26.15% 0.0384 157.6 / 0.06);
}
```

Face rules: display is Archivo Black at weight 900, uppercase only in the deck's display role (headlines, prices, page
numbers, the wordmark); body is Inter; mono is the outlier and never sets prose, navigation or labels. Labels are the
body face, one step down, sentence case, untracked — in `--text-xs` and `--color-ink-2`.
The spacing scale (`--space-3xs`…`--space-4xl`), the type scale (`--text-xs`…`--text-display`), the easings and the
durations are the scaffold's and live in `tokens.css` beside these roles.

## Controls
- Primary: mint fill (`--color-accent`) with `--color-accent-ink` text · `--radius-pill` · 44px marketing, 36px in the app
- Secondary: 1px `--color-rule` outline on paper, ink text · same radius and height; on a dark band the rule is
  `color-mix(in oklab, var(--color-paper) 35%, transparent)` and the label is paper
- One filled primary per view; a second action is the outline. Chips and tabs are `--radius-pill`, hairline rule,
  and mint only in their selected state.
- Hover is one move on every control: the fill wipes in from the left edge (`--dur-short`, `--ease-out`) and the
  label flips to the colour that reads on that fill (`--btn-label-hover`: accent on ink for a mint control, paper
  on ink for an outline or a quiet control, ink on mint for the pro control). Nothing lifts, glows, or nudges the
  arrow; the press scales the control to 0.985 over `--dur-press`.

## Motion
- Character: brisk. Durations `--dur-micro` 120ms, `--dur-short` 220ms, `--dur-long` 420ms; easings `--ease-out` in,
  `--ease-in` out; one reveal per page at most (`opacity` + `translateY(8px)`, staggered ≤ 80ms).
- The marquee's loop, the caret and the running spinner are the only continuous motion; nothing loops for decoration.
- Under `prefers-reduced-motion: reduce` the global rule in `base.css` collapses every animation and transition to
  0.01ms once, so everything ends at its finished state.

## Exports
`tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per `export-formats.md`.
