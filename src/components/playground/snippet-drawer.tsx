"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteSnippet, saveSnippet } from "@/app/(marketing)/playground/actions";
import { dateShort } from "@/lib/format";
import type { PanelLang } from "@/lib/playground/snippets";

/**
 * The reader's own shelf of saved code. It does three things and nothing else: save what
 * is in the editor under a name, load a row back into the editor, and delete a row.
 *
 * Delete asks once, in place, rather than opening a dialog: the second click is the same
 * button, so a reader who meant it loses one click and a reader who did not loses nothing.
 * The list is server data, so every write ends in `router.refresh()` and the row that
 * changed is the visible confirmation: no toast, and no local copy to drift from the
 * database.
 */

export interface SavedSnippet {
  id: string;
  title: string;
  lang: PanelLang;
  code: string;
  /** ISO, because a client component can only be handed serialisable values. */
  updatedAt: string;
}

export interface SnippetDrawerProps {
  snippets: SavedSnippet[];
  /** What is in the editor right now: the code a save copies, the target a load fills. */
  draft: { lang: PanelLang; code: string };
  onLoad: (snippet: SavedSnippet) => void;
}

export function SnippetDrawer({ snippets, draft, onLoad }: SnippetDrawerProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setNote(null);
    setFieldError(null);
    const result = await saveSnippet({ title, language: draft.lang, code: draft.code });
    setBusy(false);
    if (result.ok) {
      setTitle("");
      setNote({ tone: "ok", text: `"${result.snippet?.title ?? title}" is saved.` });
      router.refresh();
      return;
    }
    // A missing or over-long name is the reader's to fix in the field; anything else is
    // not field-specific, so it belongs above the list.
    if (/name/i.test(result.reason ?? "")) setFieldError(result.reason ?? null);
    else setNote({ tone: "error", text: result.reason ?? "That snippet could not be saved." });
  }

  async function remove(id: string) {
    setBusy(true);
    setNote(null);
    setConfirmId(null);
    const result = await deleteSnippet({ id });
    setBusy(false);
    if (result.ok) {
      if (loadedId === id) setLoadedId(null);
      setNote({ tone: "ok", text: "Snippet deleted." });
      router.refresh();
      return;
    }
    setNote({ tone: "error", text: result.reason ?? "That snippet could not be deleted." });
  }

  return (
    <section className="panel grid gap-4 p-4" aria-labelledby="snippet-drawer-head">
      <div className="grid gap-1">
        <h2 id="snippet-drawer-head" className="text-title">
          Saved snippets
        </h2>
        <p className="text-xs text-muted">
          {snippets.length === 0
            ? "Nothing saved yet. Name what is in the editor and it lands here."
            : `${snippets.length} kept. Loading one replaces the editor's code.`}
        </p>
      </div>

      <form
        className="field"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label htmlFor="snippet-title">Name this snippet</label>
        <input
          id="snippet-title"
          className="input"
          value={title}
          maxLength={80}
          autoComplete="off"
          aria-invalid={fieldError ? true : undefined}
          aria-describedby="snippet-title-help"
          onChange={(event) => {
            setTitle(event.target.value);
            setFieldError(null);
          }}
        />
        <p className="field__help" id="snippet-title-help" data-tone={fieldError ? "error" : undefined}>
          {fieldError ?? `Saved as ${draft.lang}. The editor's code is what gets saved.`}
        </p>
        <button
          type="submit"
          className="btn btn--quiet btn--sm justify-self-start"
          aria-busy={busy}
          disabled={busy || draft.code.trim() === ""}
        >
          {busy ? "Saving..." : "Save the editor"}
        </button>
      </form>

      {note ? (
        <p role="status" className={note.tone === "error" ? "text-xs text-error" : "text-xs text-ink-2"}>
          {note.text}
        </p>
      ) : null}

      {snippets.length > 0 ? (
        <ul className="grid">
          {snippets.map((snippet) => (
            <li key={snippet.id} className="grid gap-2 border-t border-rule py-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm">{snippet.title}</span>
                <span className="chip font-outlier text-xs">{snippet.lang}</span>
              </div>
              <p className="line-clamp-2 font-outlier text-xs text-ink-2">{snippet.code.split("\n")[0]}</p>
              <p className="text-xs text-muted">{dateShort(new Date(snippet.updatedAt))}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  onClick={() => {
                    onLoad(snippet);
                    setLoadedId(snippet.id);
                    setNote(null);
                  }}
                >
                  {loadedId === snippet.id ? "Loaded" : "Load"}
                </button>
                {confirmId === snippet.id ? (
                  <>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      disabled={busy}
                      onClick={() => void remove(snippet.id)}
                    >
                      Delete for good
                    </button>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn--quiet btn--sm"
                    onClick={() => setConfirmId(snippet.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
