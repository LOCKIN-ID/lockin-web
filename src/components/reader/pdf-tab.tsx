"use client";

interface Props {
  bookSlug: string;
  hasPdf: boolean;
  page?: number;
}

export function PdfTab({ bookSlug, hasPdf, page = 1 }: Props) {
  if (!hasPdf) {
    return (
      <div
        className="panel"
        style={{
          padding: "var(--space-2xl)",
          textAlign: "center",
          background: "var(--color-paper-2)",
          display: "grid",
          gap: "var(--space-sm)",
          placeItems: "center",
        }}
      >
        <span className="chip">E-Book PDF Edition</span>
        <h3>PDF not generated yet</h3>
        <p style={{ color: "var(--color-ink-2)", maxWidth: "50ch", fontSize: "var(--text-sm)" }}>
          The printable A4 PDF has not been built in this environment. Run <code>npm run ebook:pdf</code> to compile the print-ready edition.
        </p>
      </div>
    );
  }

  const pdfUrl = `/api/ebooks/${bookSlug}/pdf#page=${page}`;

  return (
    <div style={{ display: "grid", gap: "var(--space-md)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
          Printable A4 Edition (with scannable QRs)
        </span>
        <a href={`/api/ebooks/${bookSlug}/pdf`} download={`${bookSlug}-lockin.pdf`} className="btn btn--quiet btn--sm">
          Download PDF ⬇
        </a>
      </div>

      <div
        style={{
          width: "100%",
          height: "80vh",
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
          border: "1px solid var(--color-rule)",
          background: "var(--color-paper-3)",
        }}
      >
        <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
          <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
            <p>Your browser does not support inline PDF viewing.</p>
            <a href={`/api/ebooks/${bookSlug}/pdf`} className="btn btn--sm" style={{ marginTop: "var(--space-sm)" }}>
              Download PDF directly
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}
