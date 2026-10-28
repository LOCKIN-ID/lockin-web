"use client";

import { useState } from "react";
import { redeemReward } from "./actions";

interface Props {
  rewardSlug: string;
  costXp: number;
  currentXp: number;
}

export function RedeemButton({ rewardSlug, costXp, currentXp }: Props) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAfford = currentXp >= costXp;

  const handleRedeem = async () => {
    if (!canAfford || loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await redeemReward(rewardSlug);
      if (res.ok) {
        if (res.code) setCode(res.code);
        setMessage(res.message);
      } else {
        setMessage(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (code) {
    return (
      <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-forest)", fontWeight: 700 }}>
          Redeemed Code:
        </span>
        <code
          style={{
            fontFamily: "var(--font-outlier)",
            fontSize: "var(--text-sm)",
            padding: "var(--space-2xs) var(--space-xs)",
            background: "var(--color-paper-2)",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--color-rule)",
            display: "inline-block",
          }}
        >
          {code}
        </code>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
      <button
        type="button"
        className="btn btn--sm"
        disabled={!canAfford || loading}
        aria-busy={loading}
        onClick={handleRedeem}
      >
        {loading ? "Redeeming..." : canAfford ? "Redeem Reward" : `Short ${costXp - currentXp} XP`}
      </button>

      {message ? (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", margin: 0 }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
