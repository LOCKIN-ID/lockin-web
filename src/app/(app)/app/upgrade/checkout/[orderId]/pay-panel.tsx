"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The waiting half of checkout.
 *
 * The server rendered the amount, the QR and the account number; this component's only job
 * is to notice that the money arrived. It polls the order every three seconds and stops
 * after ten minutes: past that the order has expired anyway and a page left open in a tab
 * must not keep asking.
 *
 * The mock gateway gets a real control here rather than a hidden hack: a visibly labelled
 * `Simulate payment` button that posts to the same endpoint a bank would drive, which is
 * the only honest way to demo a purchase end to end.
 */
export function PayPanel({
  orderId,
  kind,
  value,
  qrSvg,
  minutesLeft,
  mockEnabled,
  provider,
}: {
  orderId: string;
  kind: "qr" | "va";
  value: string | null;
  qrSvg: string | null;
  minutesLeft: number;
  mockEnabled: boolean;
  provider: string;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(minutesLeft * 60);
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((left) => Math.max(0, left - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const poll = setInterval(async () => {
      if (stopped.current) return;
      try {
        const response = await fetch(`/api/payments/orders/${orderId}`, { cache: "no-store" });
        if (!response.ok) return;
        const order = (await response.json()) as { status: string };
        if (order.status !== "pending") {
          stopped.current = true;
          clearInterval(poll);
          router.refresh();
        }
      } catch {
        // A dropped poll is not a failure: the bank has not answered and the next tick
        // will ask again. Nothing is reported to the reader for a network blip.
      }
    }, 3000);

    const giveUp = setTimeout(() => {
      stopped.current = true;
      clearInterval(poll);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(poll);
      clearTimeout(giveUp);
    };
  }, [orderId, router]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  async function simulate() {
    setWorking(true);
    setNote(null);
    try {
      const response = await fetch(`/api/payments/mock/${orderId}/settle`, { method: "POST" });
      const body = (await response.json()) as { settled?: boolean; reason?: string; error?: string };
      if (body.settled) {
        stopped.current = true;
        router.refresh();
        return;
      }
      setNote(body.reason ?? body.error ?? "The settlement did not go through.");
    } catch (cause) {
      setNote((cause as Error).message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-md)" }}>
      {kind === "qr" && qrSvg ? (
        <div
          className="well"
          style={{ padding: "var(--space-md)", justifySelf: "start", background: "var(--color-paper-3)" }}
          // The SVG comes from `qrcode` in the server component, never from a reader.
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      ) : null}

      {value ? (
        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", flexWrap: "wrap" }}>
          <code
            className="code"
            style={{ padding: "var(--space-sm) var(--space-md)", borderRadius: "var(--radius-card)" }}
          >
            {value}
          </code>
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : kind === "va" ? "Copy the account number" : "Copy the code"}
          </button>
        </div>
      ) : null}

      <p aria-live="polite" style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>
        {secondsLeft > 0 ? (
          <>
            Waiting for the payment. This page checks by itself.
            <span className="num">
              {" "}
              Expires in {minutes}:{String(seconds).padStart(2, "0")}.
            </span>
          </>
        ) : (
          "The thirty minutes are up. Reload to see the order's final state."
        )}
      </p>

      {mockEnabled ? (
        <div className="well" style={{ padding: "var(--space-md)", display: "grid", gap: "var(--space-xs)" }}>
          <p className="eyebrow">Demo control · {provider} gateway</p>
          <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>
            No bank is involved in this deployment. This button is what the bank’s webhook does:
            it settles the order through the same code path, so the rest of the purchase (the
            entitlement, the receipt, and the XP) is the real thing.
          </p>
          <div>
            <button className="btn" type="button" onClick={simulate} aria-busy={working} disabled={working}>
              {working ? "Settling…" : "Simulate payment"}
            </button>
          </div>
          {note ? (
            <p className="field__help" data-tone="error" role="status">
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
