"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Mark } from "@/components/brand/logo";
import { LanguageTabs } from "@/components/playground/language-tabs";
import { Output, type PanelPhase } from "@/components/playground/output";
import { runHtml, runJs, runPython } from "@/lib/playground/engines";
import { createShellStore, runShell, type ShellStore } from "@/lib/playground/shell";
import { type OutputLine, type RunResult } from "@/lib/playground/runtime-protocol";
import { sampleFor, type PanelLang } from "@/lib/playground/snippets";

/** The console cap the plan fixes: past 200 lines the panel says so. */
const MAX_LINES = 200;
/** How long the sandboxed frame may take to report ready before the panel says so. */
const FRAME_TIMEOUT_MS = 5_000;

export interface WorkspaceProps {
  lang: PanelLang;
  code: string;
  onLangChange: (lang: PanelLang) => void;
  /**
   * The shell's filesystem and where the reader is standing. The page owns both so a
   * workspace survives a tab switch; without them the panel makes a fresh in-memory
   * store on the first shell run and forgets it when the run ends.
   */
  shell?: { store: ShellStore; cwd: string; onCwd: (cwd: string) => void };
  /** Under the code, beside Run: the hero's hint control, the playground's share. */
  actions?: ReactNode;
  /** Replaces the read-only code view when the surface needs an editor. */
  editor?: ReactNode;
  /** Rendered under the controls, full width: the hero's inline hint panel. */
  extra?: ReactNode;
  onResult?: (result: RunResult, lang: PanelLang) => void;
  className?: string;
}

/**
 * One runnable panel: tabs, the code, one Run control, and the output. The
 * panel owns the whole execution state machine, so the hero, `/playground`,
 * `/app/playground` and the reader's "Run in playground" behave identically.
 *
 * Nothing here throws. A missing runtime, a timeout and a syntax error are all
 * lines in the output area.
 */
export function Workspace({ lang, code, onLangChange, shell, actions, editor, extra, onResult, className }: WorkspaceProps) {
  const uid = useId();
  const sample = sampleFor(lang);
  const panelId = `${uid}-panel`;
  const tabId = `${uid}-tab-${lang}`;

  const [lines, setLines] = useState<OutputLine[]>([]);
  const [phase, setPhase] = useState<PanelPhase>("idle");
  const [result, setResult] = useState<RunResult | null>(null);
  const [frame, setFrame] = useState<{ key: string; document: string } | null>(null);
  const [frameMs, setFrameMs] = useState<number | null>(null);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const startedAt = useRef(0);
  const pythonWarm = useRef(false);
  const runId = useRef(0);

  const push = useCallback((line: OutputLine) => {
    setLines((previous) => (previous.length >= MAX_LINES ? previous : [...previous, line]));
  }, []);

  // The frame's bridge posts to `*` with an opaque origin, so the sender window
  // is the only identity worth trusting.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      const data = event.data as { __lockin?: boolean; level?: string; text?: string } | null;
      if (!data || data.__lockin !== true) return;
      if (data.level === "ready") {
        setPhase("done");
        setFrameMs(performance.now() - startedAt.current);
        return;
      }
      if (typeof data.text !== "string") return;
      push({ level: data.level === "error" || data.level === "warn" ? "err" : "out", text: data.text });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [push]);

  useEffect(() => {
    if (!frame || phase !== "running") return;
    const timer = setTimeout(() => {
      setPhase("failed");
      push({ level: "err", text: `The preview frame did not report ready within ${FRAME_TIMEOUT_MS / 1000}s.` });
    }, FRAME_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [frame, phase, push]);

  const run = useCallback(async () => {
    const id = ++runId.current;
    setLines([]);
    setResult(null);
    setFrameMs(null);
    startedAt.current = performance.now();

    if (lang === "html") {
      setFrame(runHtml(code));
      setPhase("running");
      return;
    }

    if (lang === "shell") {
      setPhase("running");
      const store = shell?.store ?? (await createShellStore());
      const outcome = await runShell(code, {
        store,
        cwd: shell?.cwd,
        onLine: (line) => {
          if (id === runId.current) push(line);
        },
      });
      if (id !== runId.current) return;
      shell?.onCwd(outcome.cwdAfter);
      setResult(outcome);
      setPhase(outcome.exitCode === 0 && outcome.stderr.trim() === "" ? "done" : "failed");
      onResult?.(outcome, lang);
      return;
    }

    const booting = lang === "python" && !pythonWarm.current;
    setPhase(booting ? "booting" : "running");
    const outcome = lang === "python" ? await runPython(code, push) : await runJs(code, push);
    if (id !== runId.current) return;
    if (lang === "python") pythonWarm.current = true;
    setResult(outcome);
    setPhase(outcome.exitCode === 0 && outcome.stderr.trim() === "" ? "done" : "failed");
    onResult?.(outcome, lang);
  }, [code, lang, onResult, push, shell]);

  const busy = phase === "booting" || phase === "running";
  const derived: OutputLine[] =
    lines.length > 0
      ? lines
      : result
        ? [
            ...result.stdout.split("\n").filter(Boolean).map((text) => ({ level: "out" as const, text })),
            ...result.stderr.split("\n").filter(Boolean).map((text) => ({ level: "err" as const, text })),
          ]
        : [];

  return (
    <section
      className={`panel panel--raised flex flex-col overflow-hidden ${className ?? ""}`}
      aria-label="Runnable code panel"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          void run();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <LanguageTabs lang={lang} onSelect={onLangChange} panelId={panelId} idPrefix={uid} />
        <span className="hidden font-outlier text-xs text-muted sm:inline">
          <kbd className="kbd">⌘</kbd> or <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">Enter</kbd>
        </span>
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={-1} className="flex flex-1 flex-col focus-visible:outline-none">
        {frame ? (
          <div className="border-b border-rule bg-paper-2 p-3">
            <iframe
              key={frame.key}
              ref={frameRef}
              srcDoc={frame.document}
              sandbox="allow-scripts"
              title="Preview output"
              className="w-full rounded-card border border-rule bg-paper-3"
              style={{ height: sample.previewHeight ?? 132 }}
            />
          </div>
        ) : null}

        {editor ?? (
          <pre className="code" aria-label={`${sample.label} code`}>
            <code>
              {code.split("\n").map((text, index) => (
                <span key={index} className="code__line">
                  <span className="code__num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{text}</span>
                </span>
              ))}
            </code>
          </pre>
        )}

        <div className="flex flex-wrap items-center gap-2 px-3 py-3">
          <button type="button" className="btn" onClick={() => void run()} disabled={busy} aria-busy={busy}>
            <Mark size={16} />
            {phase === "booting" ? "Preparing…" : phase === "running" && lang !== "html" ? "Running…" : "Run"}
          </button>
          {actions}
        </div>

        {extra}

        <div className="flex-1 px-3 pb-3">
          <Output
            lines={derived}
            phase={phase}
            idle={sample.idle}
            truncated={lines.length >= MAX_LINES}
            label={`${sample.label} output`}
            meta={
              phase === "booting"
                ? "Preparing the Python runtime…"
                : phase === "running"
                  ? "Running…"
                  : phase === "failed"
                    ? "Finished with a failure, see the lines above."
                    : frameMs !== null
                      ? `Preview ready in ${Math.round(frameMs)} ms.`
                      : result
                        ? `Exit ${result.exitCode} in ${Math.round(result.ms)} ms.`
                        : ""
            }
          />
        </div>
      </div>
    </section>
  );
}
