"use client";

/**
 * One execution API for every language the books teach, used by the landing
 * hero, `/playground`, `/app/playground` and the reader's "Run in playground".
 * There is exactly one code path per language, and every failure path is a
 * rendered panel state: no engine in here throws.
 *
 * Loading is on demand. The Python worker boots on the first Python run and
 * stays warm; a JavaScript run gets its own worker and loses it when it ends;
 * the shell imports `wasi-sh` on its first run (see `shell.ts`).
 */
import {
  describeError,
  MAX_OUTPUT_BYTES,
  parseRunnerMessage,
  RUN_TIMEOUT_MS,
  truncateOutput,
  type ErrorKind,
  type OnLine,
  type RunResult,
} from "./runtime-protocol";

export {
  classifyFailure,
  formatValue,
  MAX_OUTPUT_BYTES,
  RUN_TIMEOUT_MS,
  truncateOutput,
} from "./runtime-protocol";
export type { ErrorKind, Lang, OnLine, OutputLine, RunResult } from "./runtime-protocol";

export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/* ------------------------------------------------------------------ *
 * HTML: a sandboxed preview with a console bridge
 * ------------------------------------------------------------------ */

/**
 * The bridge is injected as the first element inside `<head>`: it patches the
 * console, `window.onerror` and `unhandledrejection`, and posts every line to
 * the parent with a `"*"` target. The frame itself stays an opaque origin (the
 * sandbox carries `allow-scripts` alone), so the parent validates the sender
 * rather than trusting the message.
 */
const CONSOLE_BRIDGE = `<script>
(function () {
  var send = function (level, text) {
    try { parent.postMessage({ __lockin: true, level: level, text: String(text).slice(0, 4000) }, "*"); } catch (e) {}
  };
  var format = function (value) {
    if (typeof value === "string") return value;
    if (value === undefined) return "undefined";
    if (value === null) return "null";
    if (typeof value === "function") return "[Function: " + (value.name || "anonymous") + "]";
    if (value instanceof Error) return value.name + ": " + value.message;
    try { return JSON.stringify(value, function (k, v) { return typeof v === "bigint" ? String(v) + "n" : v; }) || String(value); }
    catch (e) { return String(value); }
  };
  ["log", "info", "debug", "warn", "error"].forEach(function (level) {
    var original = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(format(arguments[i]));
      send(level === "warn" || level === "error" ? "warn" : "log", parts.join(" "));
      original.apply(null, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send("error", (event.message || "Error") + (event.lineno ? " (line " + event.lineno + ")" : ""));
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("error", "Unhandled rejection: " + format(event.reason));
  });
  send("ready", "preview ready");
})();
</` + `script>`;

const PREVIEW_BASE = `<style>
  html, body { margin: 0; }
  body { background: #FDFCF8; color: #132A1D; font: 16px/1.5 ui-sans-serif, system-ui, sans-serif; padding: 16px; }
  pre, code { font-family: ui-monospace, SFMono-Regular, monospace; }
</style>`;

/**
 * Wraps the student's markup in a document that can report back. Anything the
 * student wrote is preserved verbatim; the bridge only ever lands inside
 * `<head>`, ahead of their own head content.
 */
export function buildPreviewDocument(source: string): string {
  if (/<head[\s>]/i.test(source)) {
    return source.replace(/<head([^>]*)>/i, (_match, attrs: string) => `<head${attrs}>${CONSOLE_BRIDGE}${PREVIEW_BASE}`);
  }
  if (/<html[\s>]/i.test(source)) {
    return source.replace(
      /<html([^>]*)>/i,
      (_match, attrs: string) => `<html${attrs}><head>${CONSOLE_BRIDGE}${PREVIEW_BASE}</head>`,
    );
  }
  return `<!doctype html><html><head>${CONSOLE_BRIDGE}${PREVIEW_BASE}</head><body>${source}</body></html>`;
}

let previewRun = 0;

/**
 * Prepares a run and returns the React `key` for its `<iframe>` plus the
 * document to assign. Remounting on that key gives every run a clean frame.
 */
export function runHtml(source: string): { key: string; document: string } {
  return { key: `html-${++previewRun}-${source.length}`, document: buildPreviewDocument(source) };
}

/* ------------------------------------------------------------------ *
 * JavaScript: one worker per run
 * ------------------------------------------------------------------ */

export async function runJs(source: string, onLine?: OnLine): Promise<RunResult> {
  const started = performance.now();
  let worker: Worker;
  try {
    worker = new Worker(new URL("./workers/js.worker.ts", import.meta.url), {
      type: "module",
      name: "lockin-js",
    });
  } catch (cause) {
    return {
      stdout: "",
      stderr: `JavaScript runtime unavailable: ${describeError(cause)}`,
      exitCode: 1,
      ms: performance.now() - started,
    };
  }

  const done = Promise.withResolvers<RunResult>();
  let stdout = "";
  let stderr = "";
  let settled = false;

  const finish = (result: RunResult) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    worker.terminate();
    done.resolve(result);
  };

  const timeout = RUN_TIMEOUT_MS;
  const timer = setTimeout(() => {
    onLine?.({ level: "err", text: `TimeoutError: your code ran longer than ${timeout / 1000}s` });
    finish({
      stdout: truncateOutput(stdout).text,
      stderr: `${stderr}${stderr ? "\n" : ""}TimeoutError: your code ran longer than ${timeout / 1000}s`.trim(),
      exitCode: 124,
      ms: performance.now() - started,
    });
  }, timeout);

  worker.addEventListener("message", (event: MessageEvent<unknown>) => {
    const message = parseRunnerMessage(event.data);
    if (!message) return;
    if (message.kind === "out") {
      stdout += `${stdout ? "\n" : ""}${message.text}`;
      onLine?.({ level: "out", text: message.text });
      return;
    }
    if (message.kind === "err") {
      stderr += `${stderr ? "\n" : ""}${message.text}`;
      onLine?.({ level: "err", text: message.text });
      return;
    }
    finish({
      stdout: truncateOutput(stdout).text,
      stderr: stderr.trim(),
      exitCode: message.exitCode,
      ms: message.ms,
    });
  });

  worker.addEventListener("error", (event) => {
    finish({
      stdout: truncateOutput(stdout).text,
      stderr: `${stderr}${stderr ? "\n" : ""}${event.message || "the worker failed to start"}`.trim(),
      exitCode: 1,
      ms: performance.now() - started,
    });
  });

  worker.postMessage({ id: 1, code: source });
  return done.promise;
}

/* ------------------------------------------------------------------ *
 * Python: one long-lived Pyodide worker
 * ------------------------------------------------------------------ */

export interface PythonRuntime {
  readonly version: string;
  run(code: string, onLine?: OnLine): Promise<RunResult>;
}

type PythonWorkerMessage =
  | { type: "ready" }
  | { type: "line"; id: number; level: "out" | "err"; text: string }
  | { type: "boot-error"; message: string }
  | { type: "result"; id: number; value: string | null; ms: number }
  | { type: "error"; id: number; message: string; kind: ErrorKind; ms: number };

interface PendingRun {
  resolve: (result: RunResult) => void;
  stdout: string[];
  stderr: string[];
  onLine?: OnLine;
}

function readPythonMessage(raw: unknown): PythonWorkerMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  if (!("type" in raw) || typeof raw.type !== "string") return null;
  return raw as PythonWorkerMessage;
}

class PyodideRuntime implements PythonRuntime {
  readonly version = PYODIDE_VERSION;
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingRun>();
  private readonly boot: Promise<void>;
  private readonly bootResolve: () => void;
  private readonly bootReject: (cause: unknown) => void;
  private nextId = 1;

  constructor() {
    const boot = Promise.withResolvers<void>();
    this.boot = boot.promise;
    this.bootResolve = boot.resolve;
    this.bootReject = boot.reject;
    this.worker = new Worker("/pyodide.worker.mjs", { type: "module", name: "lockin-python" });
    this.worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      const message = readPythonMessage(event.data);
      if (message) this.receive(message);
    });
    this.worker.addEventListener("error", (event) => {
      const message = event.message || "the Python runtime could not start";
      this.bootReject(new Error(message));
      for (const [, run] of this.pending) run.resolve({ stdout: "", stderr: message, exitCode: 1, ms: 0 });
      this.pending.clear();
    });
  }

  private receive(message: PythonWorkerMessage) {
    if (message.type === "ready") {
      this.bootResolve();
      return;
    }
    if (message.type === "boot-error") {
      this.bootReject(new Error(message.message));
      return;
    }
    const run = this.pending.get(message.id);
    if (!run) return;
    if (message.type === "line") {
      (message.level === "out" ? run.stdout : run.stderr).push(message.text);
      run.onLine?.({ level: message.level, text: message.text });
      return;
    }
    this.pending.delete(message.id);
    if (message.type === "result") {
      const stdout = run.stdout.join("\n");
      run.resolve({
        stdout: message.value ? `${stdout}${stdout ? "\n" : ""}${message.value}` : stdout,
        stderr: run.stderr.join("\n"),
        exitCode: 0,
        ms: message.ms,
      });
      return;
    }
    run.stderr.push(message.message);
    run.onLine?.({ level: "err", text: message.message });
    run.resolve({
      stdout: run.stdout.join("\n"),
      stderr: run.stderr.join("\n"),
      exitCode: 1,
      ms: message.ms,
    });
  }

  async run(code: string, onLine?: OnLine): Promise<RunResult> {
    await this.boot;
    const id = this.nextId++;
    const settled = Promise.withResolvers<RunResult>();
    this.pending.set(id, { resolve: settled.resolve, stdout: [], stderr: [], onLine });
    this.worker.postMessage({ type: "run", id, code });
    return settled.promise;
  }

  terminate() {
    this.worker.terminate();
    this.pending.clear();
  }
}

let pythonRuntime: PyodideRuntime | null = null;

/** The lazy singleton: boots on the first call and stays warm after that. */
export function getPython(): PythonRuntime {
  pythonRuntime ??= new PyodideRuntime();
  return pythonRuntime;
}

/** Boots the runtime ahead of a click, so the panel is warm when it is needed. */
export function warmPython(): void {
  const runtime = getPython();
  void runtime.run("pass").catch(() => undefined);
}

export async function runPython(code: string, onLine?: OnLine): Promise<RunResult> {
  try {
    return await getPython().run(code, onLine);
  } catch (cause) {
    const message = `Python runtime unavailable offline. The shell and JavaScript still work. (${describeError(cause)})`;
    onLine?.({ level: "err", text: message });
    return { stdout: "", stderr: message, exitCode: 1, ms: 0 };
  }
}

/** Drops the runtime so the next run boots a fresh worker. */
export function resetRuntimes(): void {
  pythonRuntime?.terminate();
  pythonRuntime = null;
}
