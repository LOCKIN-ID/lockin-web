"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * One `POST /api/pageviews` per page the reader opens, client-side moves included.
 *
 * It writes nothing to the browser: no cookie, no storage key, nothing a second site could
 * read. It does not run at all for a browser that asks not to be measured (Do Not Track,
 * Global Privacy Control) or under automation, where the "visitor" is a test runner.
 */
export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl;
    if (navigator.doNotTrack === "1" || gpc === true || navigator.webdriver) return;

    void fetch("/api/pageviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
