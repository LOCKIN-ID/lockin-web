"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, LockIcon, QrIcon, ChatIcon, Trophy } from "@/components/icons";

type ShowcaseTab = "reader" | "coach" | "quest";

export function LockinShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("reader");
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate showcase tabs smoothly every 5.5s unless hovered/focused
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === "reader" ? "coach" : prev === "coach" ? "quest" : "reader"));
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      style={{
        background: "var(--color-paper-3)",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raised)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minHeight: "412px",
      }}
    >
      {/* Studio Header Bar */}
      <div
        style={{
          padding: "var(--space-sm) var(--space-md)",
          background: "var(--color-paper-2)",
          borderBottom: "1px solid var(--color-rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-mint-vivid)", display: "inline-block" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-outlier)", letterSpacing: "0.06em", color: "var(--color-forest)" }}>
            LOCK.IN SHOWCASE · ECOSYSTEM
          </span>
        </div>

        {/* Feature Tab Switchers */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { id: "reader", label: "Reader", icon: <LockIcon size={12} /> },
            { id: "coach", label: "Socratic AI", icon: <ChatIcon size={12} /> },
            { id: "quest", label: "QR Quest", icon: <QrIcon size={12} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ShowcaseTab)}
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "var(--color-forest)" : "transparent",
                  color: isActive ? "var(--color-paper)" : "var(--color-ink-2)",
                  border: "none",
                  transition: "background-color 200ms ease, color 200ms ease",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Showcase Viewports (Stacked with locked height) */}
      <div style={{ display: "grid", gridTemplateAreas: "'stage'", flex: 1, padding: "var(--space-md) var(--space-lg)" }}>
        {/* View 1: Interactive Reader & Live Checkpoint */}
        <div
          style={{
            gridArea: "stage",
            display: "grid",
            gap: "var(--space-md)",
            alignContent: "space-between",
            opacity: activeTab === "reader" ? 1 : 0,
            transform: activeTab === "reader" ? "translateY(0)" : "translateY(8px)",
            pointerEvents: activeTab === "reader" ? "auto" : "none",
            visibility: activeTab === "reader" ? "visible" : "hidden",
            transition: "opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2xs)" }}>
              <span className="chip" style={{ fontSize: "10px", fontWeight: 700, background: "var(--color-paper-2)" }}>
                MODUL 01 · BAB 02: STRUKTUR DATA
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-outlier)", color: "var(--color-forest)", fontWeight: 700 }}>
                Halaman 8 dari 20
              </span>
            </div>
            <h4 style={{ fontSize: "var(--text-md)", margin: 0 }}>
              Checkpoint Praktik: Algoritma Pencarian Linear
            </h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", marginTop: "4px", lineHeight: 1.45 }}>
              Tulis fungsi pencarian elemen dalam array dan kembalikan indeks posisi elemen ditemukan.
            </p>
          </div>

          {/* Code Execution Box */}
          <div
            style={{
              background: "var(--color-forest-deep)",
              borderRadius: "8px",
              padding: "var(--space-sm) var(--space-md)",
              fontFamily: "var(--font-outlier)",
              fontSize: "12px",
              color: "var(--color-paper)",
              display: "grid",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.65, fontSize: "10px" }}>
              <span>linear_search.py</span>
              <span>WASM Python 3.12</span>
            </div>
            <pre style={{ margin: 0, overflowX: "auto" }}>
              <code>{`def linear_search(items, target):
    for i, val in enumerate(items):
        if val == target:
            return i
    return -1

assert linear_search([10, 20, 30], 20) == 1`}</code>
            </pre>
          </div>

          {/* Live Checkpoint Result Badge */}
          <div
            style={{
              padding: "var(--space-xs) var(--space-md)",
              background: "color-mix(in oklab, var(--color-accent) 15%, var(--color-paper-2))",
              border: "1px solid color-mix(in oklab, var(--color-accent) 40%, var(--color-rule))",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Check />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-forest)" }}>
                3/3 Unit Test Lolos
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-outlier)", fontSize: "11px", fontWeight: 800, color: "var(--color-forest)" }}>
              +25 XP Diterima
            </span>
          </div>
        </div>

        {/* View 2: Socratic AI Coach Dialogue */}
        <div
          style={{
            gridArea: "stage",
            display: "grid",
            gap: "var(--space-md)",
            alignContent: "space-between",
            opacity: activeTab === "coach" ? 1 : 0,
            transform: activeTab === "coach" ? "translateY(0)" : "translateY(8px)",
            pointerEvents: activeTab === "coach" ? "auto" : "none",
            visibility: activeTab === "coach" ? "visible" : "hidden",
            transition: "opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2xs)" }}>
              <span className="chip" style={{ fontSize: "10px", fontWeight: 700, background: "var(--color-paper-2)" }}>
                SOCRATIC COACH · BIMBINGAN LOGIKA
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-outlier)", color: "var(--color-forest)", fontWeight: 700 }}>
                Level 2 Hint Aktif
              </span>
            </div>
            <h4 style={{ fontSize: "var(--text-md)", margin: 0 }}>
              Tanya Mentor Saat Terjebak Bug
            </h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", marginTop: "4px", lineHeight: 1.45 }}>
              AI tidak memberikan jawaban instan. Logika Anda dibimbing bertahap sampai paham mandiri.
            </p>
          </div>

          {/* Dialogue Balloons */}
          <div style={{ display: "grid", gap: "var(--space-xs)" }}>
            {/* Student Message */}
            <div
              style={{
                alignSelf: "start",
                background: "var(--color-paper-2)",
                padding: "var(--space-xs) var(--space-md)",
                borderRadius: "8px",
                border: "1px solid var(--color-rule)",
                fontSize: "12px",
                maxWidth: "85%",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-muted)", display: "block" }}>
                Pelajar:
              </span>
              &ldquo;Kenapa kodenya menghasilkan IndexError pada baris 4?&rdquo;
            </div>

            {/* AI Coach Reply */}
            <div
              style={{
                alignSelf: "end",
                background: "color-mix(in oklab, var(--color-accent) 14%, var(--color-paper-3))",
                border: "1px solid var(--color-mint-vivid)",
                padding: "var(--space-xs) var(--space-md)",
                borderRadius: "8px",
                fontSize: "12px",
                maxWidth: "90%",
                color: "var(--color-ink)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--color-forest)" }}>
                  Socratic Coach (Hint L2):
                </span>
                <span style={{ fontSize: "9px", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
                  Anti-Bocoran
                </span>
              </div>
              &ldquo;Periksa kembali kondisi batas akhir perulangan. Apakah rentang array Anda melebihi jumlah elemen yang tersedia?&rdquo;
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            <span>Tersedia di setiap bab e-book</span>
            <span style={{ fontWeight: 700, color: "var(--color-forest)" }}>4 Level Bantuan Bertahap</span>
          </div>
        </div>

        {/* View 3: QR Code & Physical Quest Verification */}
        <div
          style={{
            gridArea: "stage",
            display: "grid",
            gap: "var(--space-md)",
            alignContent: "space-between",
            opacity: activeTab === "quest" ? 1 : 0,
            transform: activeTab === "quest" ? "translateY(0)" : "translateY(8px)",
            pointerEvents: activeTab === "quest" ? "auto" : "none",
            visibility: activeTab === "quest" ? "visible" : "hidden",
            transition: "opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2xs)" }}>
              <span className="chip" style={{ fontSize: "10px", fontWeight: 700, background: "var(--color-paper-2)" }}>
                KODE QR CETAK · VERIFIKASI FISIK
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-outlier)", color: "var(--color-forest)", fontWeight: 700 }}>
                9 Quest Tersedia
              </span>
            </div>
            <h4 style={{ fontSize: "var(--text-md)", margin: 0 }}>
              Jembatan Antara Buku Fisik &amp; Platform Web
            </h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", marginTop: "4px", lineHeight: 1.45 }}>
              Scan kode QR di buku cetak Anda untuk langsung membuka kuis validasi dan starter repo GitHub.
            </p>
          </div>

          {/* Ticket Verification Card */}
          <div
            style={{
              padding: "var(--space-md)",
              background: "var(--color-paper-2)",
              border: "1px dashed var(--color-rule)",
              borderRadius: "8px",
              display: "grid",
              gridTemplateColumns: "70px 1fr",
              gap: "var(--space-md)",
              alignItems: "center",
            }}
          >
            <div style={{ width: "70px", height: "70px", background: "#fff", borderRadius: "6px", padding: "4px", border: "1px solid var(--color-rule)" }}>
              <img src="/qr/begq7f2x9m4kdt3nzr8pw.svg" alt="QR Demo" style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ display: "grid", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Trophy size={14} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-forest)" }}>
                  Quest: GitHub Automation
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-outlier)", fontSize: "11px", color: "var(--color-muted)" }}>
                Kode: <strong>LCKBEG</strong> · +35 XP
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-ink-2)" }}>
                Otomatis menguji pull-request di repo pembelajaran Anda.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            <span>Buku cetak terintegrasi penuh</span>
            <Link href="/books" style={{ fontWeight: 700, color: "var(--color-forest)" }}>
              Lihat Daftar E-Book &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
