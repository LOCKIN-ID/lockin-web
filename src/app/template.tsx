"use client";

import type { ReactNode } from "react";

/**
 * App Router Page Transition Template.
 * Unlike layout.tsx which persists, template.tsx remounts on every navigation,
 * triggering smooth per-route entrance motion.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
