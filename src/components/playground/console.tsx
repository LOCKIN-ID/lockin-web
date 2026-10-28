"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { recordRun, saveWorkspace } from "@/app/(marketing)/playground/actions";
import { Editor } from "@/components/playground/editor";
import { ExerciseList, type Exercise } from "@/components/playground/exercise-list";
import { ShareButton } from "@/components/playground/share-button";
import { SnippetDrawer, type SavedSnippet } from "@/components/playground/snippet-drawer";
import { Workspace } from "@/components/playground/workspace";
import { warmPython } from "@/lib/playground/engines";
import { classifyFailure, type RunResult } from "@/lib/playground/runtime-protocol";
import { readShareHash } from "@/lib/playground/share";
import {
  createShellStore,
  restoreStore,
  serializeStore,
  SHELL_HOME,
  type ShellStore,
} from "@/lib/playground/shell";
import { DEFAULT_SAMPLE, isPanelLang, sampleFor, type PanelLang } from "@/lib/playground/snippets";

/**
 * The playground screen itself: one workspace, one shell that outlives a single run, and
 *: when the reader is signed in: the two shelves that make the panel part of the
 * account rather than a scratchpad.
 *
 * It is one component so that `/playground` and `/app/playground` cannot drift: the
 * public route hands it `userId: null` and no shelves, the app route hands it the
 * reader's exercises and snippets. The pages keep their server work (metadata, the
 * owned-book query) and this keeps every piece of client state.
 *
 * Three things are deliberately lazy, because the plan's optimisation is a promise to the
 * reader's laptop: the Python worker boots on the first Python selection, `wasi-sh` is
 * imported on the first Shell run (inside the engine), and the shell's filesystem is
 * built only when the reader reaches for the Shell tab. A guest never pays for any of it.
 */

export interface PlaygroundConsoleProps {
  /** The signed-in reader's id, which keys the local shell store; null on the public route. */
  userId: string | null;
  exercises: Exercise[];
  snippets: SavedSnippet[];
  className?: string;
}

/** The name `saveWorkspace` upserts, so a second click keeps one row rather than two. */
const WORKSPACE_TITLE = "Shell workspace";

/**
 * The editor's skin. The recipe belongs in `globals.css`, which this slice may not write,
 * so it is expressed here as child variants on the wrapper the console owns: the gutter
 * and the textarea share one 1.5rem line box (the numbers stay beside their lines while
 * the textarea scrolls), and the textarea keeps the mono face because its content is code.
 */
const EDITOR_SKIN = [
  "[&_.editor]:grid [&_.editor]:grid-cols-[auto_minmax(0,1fr)] [&_.editor]:bg-paper-3",
  "[&_.editor]:border-b [&_.editor]:border-rule",
  "[&_.editor__gutter]:flex [&_.editor__gutter]:flex-col [&_.editor__gutter]:overflow-hidden",
  "[&_.editor__gutter]:border-r [&_.editor__gutter]:border-rule [&_.editor__gutter]:bg-paper-2",
  "[&_.editor__gutter]:px-3 [&_.editor__gutter]:py-3 [&_.editor__gutter]:text-right",
  "[&_.editor__gutter]:font-outlier [&_.editor__gutter]:text-xs [&_.editor__gutter]:leading-6 [&_.editor__gutter]:text-muted",
  "[&_.editor__input]:block [&_.editor__input]:w-full [&_.editor__input]:resize-y",
  "[&_.editor__input]:border-0 [&_.editor__input]:bg-transparent [&_.editor__input]:p-3",
  "[&_.editor__input]:font-outlier [&_.editor__input]:text-sm [&_.editor__input]:leading-6",
  "[&_.editor__input]:text-ink [&_.editor__input]:outline-none",
  "[&_.editor__input]:focus-visible:outline-2 [&_.editor__input]:focus-visible:outline-focus",
].join(" ");

/** The samples, one per language, so switching tabs never throws away what was typed. */
function initialDrafts(): Record<PanelLang, string> {
  return {
    html: sampleFor("html").code,
    js: sampleFor("js").code,
    python: sampleFor("python").code,
    shell: sampleFor("shell").code,
  };
}

/**
 * The shell store as `localStorage` keeps it: a flat `{ path: content }` map, exactly what
 * `serializeStore` writes and `restoreStore` reads back. Anything else in the key is
 * ignored rather than trusted, because the key is in the reader's own devtools.
 */
function readSavedStore(key: string): Record<string, string> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const files: Record<string, string> = {};
    for (const [path, content] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof content === "string") files[path] = content;
    }
    return Object.keys(files).length > 0 ? files : null;
  } catch {
    return null;
  }
}

/** False when the browser refuses to store (private mode, a full quota). The caller says so. */
function writeSavedStore(key: string, files: Record<string, string>): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(files));
    return true;
  } catch {
    return false;
  }
}

export function PlaygroundConsole({ userId, exercises, snippets, className }: PlaygroundConsoleProps) {
  const [lang, setLang] = useState<PanelLang>(DEFAULT_SAMPLE);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [cwd, setCwd] = useState(SHELL_HOME);
  const [store, setStore] = useState<ShellStore | null>(null);
  const [stored, setStored] = useState<string | null>(null);
  const [workspaceNote, setWorkspaceNote] = useState<string | null>(null);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [workspaceSaved, setWorkspaceSaved] = useState(false);

  const storeRef = useRef<ShellStore | null>(null);
  const storageKey = `lockin.shell.${userId ?? "guest"}`;
  const code = drafts[lang];
  const sample = sampleFor(lang);
  const signedIn = userId !== null;
  const hasShelf = signedIn || exercises.length > 0;

  const setCode = useCallback(
    (next: string) => {
      setDrafts((previous) => ({ ...previous, [lang]: next }));
    },
    [lang],
  );

  const selectLang = useCallback((next: PanelLang) => {
    setLang(next);
    // The plan's bargain: the Python runtime starts downloading when the tab is picked,
    // not when the page loads, so a reader who never touches Python never pays for it.
    if (next === "python") warmPython();
  }, []);

  /** What a share link or a saved row carries: the code, in its own language. */
  const load = useCallback((next: { lang: PanelLang; code: string }) => {
    setDrafts((previous) => ({ ...previous, [next.lang]: next.code }));
    setLang(next.lang);
    if (next.lang === "python") warmPython();
  }, []);

  // A shared link rides in the hash, which only the browser can see, and a reader who
  // pastes a second one into the same tab expects it to load: hence the listener as well
  // as the first read.
  useEffect(() => {
    let cancelled = false;
    const read = async () => {
      const shared = await readShareHash(window.location.hash);
      if (cancelled || !shared || !isPanelLang(shared.lang)) return;
      load({ lang: shared.lang, code: shared.code });
    };
    const onHashChange = () => {
      void read();
    };
    void read();
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [load]);

  // The shell's filesystem is built on the first Shell selection: the saved one when this
  // browser has one, the seed otherwise.
  useEffect(() => {
    if (lang !== "shell" || storeRef.current) return;
    let cancelled = false;
    void (async () => {
      try {
        const saved = readSavedStore(storageKey);
        const next = saved ? await restoreStore(saved) : await createShellStore();
        if (cancelled) return;
        storeRef.current = next;
        setStore(next);
      } catch {
        if (!cancelled) setStored("The shell's filesystem could not start in this browser.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, storageKey]);

  const shell = useMemo(
    () => (store ? { store, cwd, onCwd: setCwd } : undefined),
    [store, cwd],
  );

  const handleResult = useCallback(
    (result: RunResult, ran: PanelLang) => {
      const { ok, errorKind } = classifyFailure(result);
      // Optional by design: signed out, the action answers "no session" and returns.
      void recordRun({ language: ran, ok, errorKind, durationMs: result.ms });
      if (ran !== "shell" || !storeRef.current) return;
      if (!writeSavedStore(storageKey, serializeStore(storeRef.current))) {
        setStored("This browser refused to keep the shell's filesystem, so it lives in this tab only.");
      }
    },
    [storageKey],
  );

  async function saveShellWorkspace() {
    setSavingWorkspace(true);
    setWorkspaceNote(null);
    setWorkspaceSaved(false);
    const result = await saveWorkspace({ title: WORKSPACE_TITLE, language: "shell", code });
    setSavingWorkspace(false);
    if (result.ok) {
      setWorkspaceSaved(true);
      return;
    }
    setWorkspaceNote(result.reason ?? "That workspace could not be saved.");
  }

  return (
    <div
      className={`grid gap-6 ${
        hasShelf ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]" : ""
      } ${className ?? ""}`}
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <Workspace
          lang={lang}
          code={code}
          onLangChange={selectLang}
          shell={shell}
          className="min-h-[30rem] flex-1"
          onResult={handleResult}
          editor={
            <div className={EDITOR_SKIN}>
              <Editor value={code} onChange={setCode} lang={lang} label={`${sample.label} editor`} />
            </div>
          }
          actions={
            <>
              <ShareButton lang={lang} code={code} />
              {signedIn && lang === "shell" ? (
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  aria-busy={savingWorkspace}
                  disabled={savingWorkspace || code.trim() === ""}
                  onClick={() => void saveShellWorkspace()}
                >
                  {savingWorkspace ? "Saving..." : workspaceSaved ? "Workspace saved" : "Save workspace"}
                </button>
              ) : null}
            </>
          }
        />

        <div className="grid gap-1">
          <p className="text-xs text-ink-2">
            {signedIn ? (
              <>
                The shell&apos;s filesystem is kept in this browser; snippets and the workspace follow your
                account.
              </>
            ) : (
              <>
                Everything here is kept in this browser only.{" "}
                <Link href="/login?next=%2Fapp%2Fplayground" className="underline">
                  Sign in
                </Link>{" "}
                to keep it with your books.
              </>
            )}
          </p>
          {stored ? (
            <p role="status" className="text-xs text-error">
              {stored}
            </p>
          ) : null}
          {workspaceNote ? (
            <p role="status" className="text-xs text-error">
              {workspaceNote}
            </p>
          ) : null}
        </div>
      </div>

      {hasShelf ? (
        <aside className="grid min-w-0 content-start gap-6">
          {exercises.length > 0 ? <ExerciseList exercises={exercises} onLoad={load} /> : null}
          {signedIn ? (
            <SnippetDrawer snippets={snippets} draft={{ lang, code }} onLoad={load} />
          ) : null}
        </aside>
      ) : null}

      {/* The terminal the reader is about to use is GPL-2.0 software, so its licence and
          the shim's sit on the page that runs them, not only in the site footer. */}
      <footer className="hair grid gap-1 pt-4 lg:col-span-2">
        <p className="text-xs text-muted">
          Shell commands run <code className="font-outlier">busybox.wasm</code>, GPL-2.0, through the
          wasi-sh project&apos;s shim (ISC).{" "}
          <Link href="/licenses/busybox-GPL-2.0.txt" className="underline">
            busybox licence
          </Link>
          ,{" "}
          <Link href="/licenses/wasi-sh-ISC.txt" className="underline">
            wasi-sh licence
          </Link>
          , source at{" "}
          <a href="https://github.com/alganet/wasi-sh" rel="noreferrer" target="_blank" className="underline">
            github.com/alganet/wasi-sh
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
