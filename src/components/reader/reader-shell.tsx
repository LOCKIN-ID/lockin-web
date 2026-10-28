"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BookContent } from "@/content/types";
import { ChapterNav } from "./chapter-nav";
import { SectionBody } from "./section-body";
import { CheckpointView } from "./checkpoint";
import { ProgressRail } from "./progress-rail";
import { CheatsheetDrawer } from "./cheatsheet-drawer";
import { AiPanel } from "./ai-panel";
import { PdfTab } from "./pdf-tab";

interface Props {
  book: BookContent;
  initialCompletedSectionIds: string[];
  initialBookmarkedSectionIds: string[];
  hasPdf: boolean;
  tutorProvider?: string | null;
}

export function ReaderShell({
  book,
  initialCompletedSectionIds,
  initialBookmarkedSectionIds,
  hasPdf,
  tutorProvider,
}: Props) {
  const [activeChapterId, setActiveChapterId] = useState(() => book.chapters[0]?.id ?? "");
  const [activeSectionId, setActiveSectionId] = useState(() => book.chapters[0]?.sections[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"read" | "pdf">("read");

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(initialCompletedSectionIds));
  const [bookmarkedIds] = useState<Set<string>>(() => new Set(initialBookmarkedSectionIds));

  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const activeChapter = useMemo(
    () => book.chapters.find((ch) => ch.id === activeChapterId) ?? book.chapters[0],
    [book, activeChapterId],
  );

  const activeSection = useMemo(
    () => activeChapter?.sections.find((sec) => sec.id === activeSectionId),
    [activeChapter, activeSectionId],
  );

  const totalSections = useMemo(
    () => book.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
    [book],
  );

  const handleSelectNav = (chId: string, secId: string) => {
    setActiveChapterId(chId);
    setActiveSectionId(secId);
    setActiveTab("read");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextSection = () => {
    if (!activeChapter) return;
    const currentIdx = activeChapter.sections.findIndex((s) => s.id === activeSectionId);
    if (currentIdx >= 0 && currentIdx + 1 < activeChapter.sections.length) {
      setActiveSectionId(activeChapter.sections[currentIdx + 1]!.id);
    } else {
      // Go to chapter checkpoint
      setActiveSectionId("checkpoint");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenKeyword = (term: string) => {
    setSelectedKeyword(term);
    setIsCheatsheetOpen(true);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "var(--space-md) var(--space-lg)" }}>
      {/* Top Header & Actions Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
          paddingBottom: "var(--space-sm)",
          borderBottom: "1px solid var(--color-rule)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-sm)" }}>
          <Link href="/app/library" className="btn btn--quiet btn--sm">
            &larr; Library
          </Link>
          <h1 style={{ fontSize: "var(--text-lg)" }}>{book.title}</h1>
        </div>

        <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
          {/* Tab switches */}
          <div className="rail" role="tablist">
            <button
              type="button"
              className="chip"
              onClick={() => setActiveTab("read")}
              aria-current={activeTab === "read" ? "page" : undefined}
            >
              📖 Interactive Reader
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setActiveTab("pdf")}
              aria-current={activeTab === "pdf" ? "page" : undefined}
            >
              📄 PDF Edition
            </button>
          </div>

          <button
            type="button"
            className="chip"
            onClick={() => setIsCheatsheetOpen(true)}
            style={{ cursor: "pointer" }}
          >
            💡 Cheatsheet
          </button>

          <button
            type="button"
            className="chip"
            onClick={() => setIsAiOpen(true)}
            style={{
              background: "var(--color-accent)",
              color: "var(--color-accent-ink)",
              cursor: "pointer",
            }}
          >
            🤖 AI Coach
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <ProgressRail completedSections={completedIds.size} totalSections={totalSections} />
      </div>

      {activeTab === "pdf" ? (
        <PdfTab bookSlug={book.slug} hasPdf={hasPdf} page={activeChapter?.pdfPage ?? 1} />
      ) : (
        /* Two-Column Reader Layout */
        <div className="reader-grid">
          {/* Left Sticky Rail */}
          <aside className="reader-aside">
            <ChapterNav
              chapters={book.chapters}
              activeChapterId={activeChapterId}
              activeSectionId={activeSectionId}
              onSelect={handleSelectNav}
              completedSectionIds={completedIds}
            />
          </aside>

          {/* Right Section Content */}
          <main style={{ minWidth: 0 }}>
            {activeSectionId === "checkpoint" && activeChapter ? (
              <CheckpointView
                bookSlug={book.slug}
                chapterId={activeChapter.id}
                checkpoint={activeChapter.checkpoint}
                onFinish={(res) => {
                  if (res.passed) {
                    // find next chapter if any
                    const chIdx = book.chapters.findIndex((c) => c.id === activeChapter.id);
                    if (chIdx >= 0 && chIdx + 1 < book.chapters.length) {
                      const nextCh = book.chapters[chIdx + 1]!;
                      setActiveChapterId(nextCh.id);
                      setActiveSectionId(nextCh.sections[0]?.id ?? "");
                    }
                  }
                }}
              />
            ) : activeSection && activeChapter ? (
              <SectionBody
                bookSlug={book.slug}
                chapterId={activeChapter.id}
                chapterTitle={activeChapter.title}
                section={activeSection}
                isBookmarked={bookmarkedIds.has(activeSection.id)}
                isCompleted={completedIds.has(activeSection.id)}
                onCompleted={(res) => {
                  setCompletedIds((prev) => new Set([...prev, activeSection.id]));
                }}
                onOpenKeyword={handleOpenKeyword}
                onNext={handleNextSection}
              />
            ) : (
              <div>Please select a chapter from the navigation.</div>
            )}
          </main>
        </div>
      )}

      {/* Drawers */}
      <CheatsheetDrawer
        entries={book.cheatsheets}
        isOpen={isCheatsheetOpen}
        onClose={() => {
          setIsCheatsheetOpen(false);
          setSelectedKeyword(null);
        }}
        selectedTerm={selectedKeyword}
      />

      <AiPanel
        bookSlug={book.slug}
        chapterId={activeChapterId}
        sectionId={activeSectionId !== "checkpoint" ? activeSectionId : undefined}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        provider={tutorProvider}
      />
    </div>
  );
}
