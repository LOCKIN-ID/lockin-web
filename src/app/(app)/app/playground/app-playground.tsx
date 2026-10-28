"use client";

import { useEffect, useState } from "react";

import { Editor } from "@/components/playground/editor";
import { ShareButton } from "@/components/playground/share-button";
import { Workspace } from "@/components/playground/workspace";
import { ExerciseList, type Exercise } from "@/components/playground/exercise-list";
import { createShellStore, serializeStore, type ShellStore } from "@/lib/playground/shell";
import { readShareHash } from "@/lib/playground/share";
import { sampleFor, type PanelLang } from "@/lib/playground/snippets";

interface Props {
  userId: string;
  exercises: Exercise[];
}

export function AppPlayground({ userId, exercises }: Props) {
  const [lang, setLang] = useState<PanelLang>("python");
  const [code, setCode] = useState(() => sampleFor("python").code);
  const [cwd, setCwd] = useState("/home/student");
  const [showExercises, setShowExercises] = useState(false);
  const [shellStore, setShellStore] = useState<ShellStore | undefined>(undefined);

  const storageKey = `lockin.shell.${userId}`;

  useEffect(() => {
    let files: Record<string, string> | undefined = undefined;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) files = JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    createShellStore(files).then(setShellStore);
  }, [storageKey]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#s=")) {
      readShareHash(hash).then((snippet) => {
        if (snippet) {
          setLang(snippet.lang as PanelLang);
          setCode(snippet.code);
        }
      });
    }
  }, []);

  const handleLangChange = (nextLang: PanelLang) => {
    setLang(nextLang);
    setCode(sampleFor(nextLang).code);
  };

  const handleLoadExercise = (ex: Exercise) => {
    setLang(ex.lang);
    setCode(ex.code);
    setShowExercises(false);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "var(--space-md) var(--space-lg)" }}>
      <header
        style={{
          marginBottom: "var(--space-md)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-3xs)" }}>
            Developer Playground
          </h1>
          <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>
            Persistent Wasm Linux, Pyodide Python, sandboxed Node.js, and live HTML.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
          {exercises.length > 0 ? (
            <button
              type="button"
              className="chip"
              onClick={() => setShowExercises(!showExercises)}
              style={{ cursor: "pointer", background: showExercises ? "var(--color-paper-2)" : undefined }}
            >
              Exercises ({exercises.length})
            </button>
          ) : null}
          <ShareButton lang={lang} code={code} />
        </div>
      </header>

      {showExercises && exercises.length > 0 ? (
        <div style={{ marginBottom: "var(--space-xl)", padding: "var(--space-md)", background: "var(--color-paper-3)", borderRadius: "var(--radius-card)", border: "1px solid var(--color-rule)" }}>
          <ExerciseList exercises={exercises} onLoad={handleLoadExercise} />
        </div>
      ) : null}

      <Workspace
        lang={lang}
        code={code}
        onLangChange={handleLangChange}
        editor={
          <Editor
            value={code}
            onChange={setCode}
            lang={lang}
            label={`${lang} code editor`}
            minRows={18}
          />
        }
        shell={
          shellStore
            ? {
                store: shellStore,
                cwd,
                onCwd: (nextCwd) => {
                  setCwd(nextCwd);
                  try {
                    localStorage.setItem(
                      storageKey,
                      JSON.stringify(serializeStore(shellStore)),
                    );
                  } catch {
                    // ignore
                  }
                },
              }
            : undefined
        }
      />
    </div>
  );
}
