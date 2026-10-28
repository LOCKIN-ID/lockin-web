"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Midtrans Snap, embedded rather than redirected to.
 *
 * `snap.js` is loaded after the page is interactive, because a payment script on the
 * critical path is a payment script that can hold the page hostage. Two honest fallbacks:
 * if the script never loads, or if no client key is configured, the page offers the
 * provider's own redirect URL instead of an empty box where a form should be.
 */

declare global {
  interface Window {
    snap?: {
      embed: (
        token: string,
        options: { embedId: string; onSuccess?: () => void; onPending?: () => void; onError?: () => void },
      ) => void;
    };
  }
}

export function SnapEmbed({
  token,
  clientKey,
  redirectUrl,
}: {
  token: string;
  clientKey: string;
  redirectUrl: string | null;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!clientKey || !window.snap) return;
    window.snap.embed(token, {
      embedId: "snap-container",
      onSuccess: () => router.refresh(),
      onPending: () => router.refresh(),
    });
    setReady(true);
  }, [clientKey, token, router]);

  if (!clientKey) {
    return (
      <div className="well" style={{ padding: "var(--space-md)", marginTop: "var(--space-md)" }}>
        <p style={{ color: "var(--color-ink-2)" }}>
          This deployment has no Snap client key, so the payment form cannot be embedded here.
          {redirectUrl ? " The provider's own page still works:" : " Add NEXT_PUBLIC_MIDTRANS_CLIENT_KEY to embed it."}
        </p>
        {redirectUrl ? (
          <p style={{ marginTop: "var(--space-sm)" }}>
            <a className="btn btn--sm" href={redirectUrl} rel="noreferrer">
              Open the payment page
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://app${process.env.NODE_ENV === "production" ? "" : ".sandbox"}.midtrans.com/snap/snap.js`}
        data-client-key={clientKey}
        strategy="afterInteractive"
        onLoad={() => {
          if (!window.snap) return;
          window.snap.embed(token, { embedId: "snap-container", onSuccess: () => router.refresh() });
          setReady(true);
        }}
      />
      <div id="snap-container" style={{ marginTop: "var(--space-md)" }} />
      {!ready ? (
        <p className="field__help" aria-live="polite">
          Loading the payment form…
        </p>
      ) : null}
    </>
  );
}
