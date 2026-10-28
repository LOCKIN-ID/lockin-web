"use client";

import { useEffect, useState } from "react";

import "./playground.css";
import { Editor } from "@/components/playground/editor";
import { ShareButton } from "@/components/playground/share-button";
import { Workspace } from "@/components/playground/workspace";
import { createShellStore, serializeStore, type ShellStore } from "@/lib/playground/shell";
import { readShareHash } from "@/lib/playground/share";
import { sampleFor, type PanelLang } from "@/lib/playground/snippets";

const SHELL_STORAGE_KEY = "lockin.shell.guest";

export default function PlaygroundPage() {
  const [lang, setLang] = useState<PanelLang>("python");
  const [code, setCode] = useState(() => sampleFor("python").code);
  const [cwd, setCwd] = useState("/home/student");
  const [shellStore, setShellStore] = useState<ShellStore | undefined>(undefined);

  useEffect(() => {
    let files: Record<string, string> | undefined = undefined;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SHELL_STORAGE_KEY);
        if (saved) files = JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    createShellStore(files).then(setShellStore);
  }, []);

  // Load from share hash if present
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

  return (
    <div className="pg" style={{ minHeight: "calc(100vh - 4.5rem)", padding: "var(--space-md) var(--space-lg)" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", paddingInline: "var(--gutter)" }}>
        <header className="pg-head" data-reveal="up">
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-3xs)" }}>
              Code <span className="highlight-mint">Playground</span>
            </h1>
            <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>
              Run HTML, JS, Python, and BusyBox Shell in-browser. Zero setup.
            </p>
          </div>
          <ShareButton lang={lang} code={code} />
        </header>

        <div data-reveal="plate">
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
                        SHELL_STORAGE_KEY,
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
      </div>
    </div>
  );
}
