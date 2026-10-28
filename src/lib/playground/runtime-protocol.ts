/**
 * The shared vocabulary of every execution surface: one `RunResult` shape, one
 * output-line shape, one set of caps. The engines in `engines.ts` and the worker
 * files both import from here, so the panel, the worker and the tests agree on
 * one protocol instead of three copies of it.
 */

export type Lang = "html" | "js" | "python" | "shell";

export const RUN_TIMEOUT_MS = 5_000;
export const MAX_OUTPUT_BYTES = 200_000;

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  ms: number;
}

export interface OutputLine {
  level: "out" | "err" | "warn";
  text: string;
}

export type OnLine = (line: OutputLine) => void;

export type ErrorKind = "timeout" | "syntax" | "runtime" | null;

/** What a worker sends back. `done` always arrives, even after an error. */
export type RunnerMessage =
  | { kind: "out"; text: string }
  | { kind: "err"; text: string }
  | { kind: "done"; ms: number; exitCode: number };

export interface RunnerRequest {
  id: number;
  code: string;
}

/** The message a worker posts to its page, or `null` when it is not one. */
export function parseRunnerMessage(raw: unknown): RunnerMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const message = raw as Record<string, unknown>;
  switch (message.kind) {
    case "out":
    case "err":
      return typeof message.text === "string" ? { kind: message.kind, text: message.text } : null;
    case "done":
      return {
        kind: "done",
        ms: typeof message.ms === "number" && Number.isFinite(message.ms) ? message.ms : 0,
        exitCode: typeof message.exitCode === "number" ? message.exitCode : 1,
      };
    default:
      return null;
  }
}

/** How a console argument reads inside the panel. Mirrors the browser's own. */
export function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Map) return `Map(${value.size}) ${safeStringify(Array.from(value.entries()))}`;
  if (value instanceof Set) return `Set(${value.size}) ${safeStringify(Array.from(value.values()))}`;
  try {
    return safeStringify(value);
  } catch {
    return "[unserialisable value]";
  }
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, inner) => {
    if (typeof inner === "object" && inner !== null) {
      if (seen.has(inner)) return "[Circular]";
      seen.add(inner);
    }
    if (typeof inner === "bigint") return `${inner}n`;
    return inner;
  }) ?? String(value);
}

/** Trims a run's output at the cap, the way the panel reports it. */
export function truncateOutput(text: string, max: number = MAX_OUTPUT_BYTES): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, max)}\n...output truncated`, truncated: true };
}

/** Success is exit code 0 with nothing on stderr; the rest is a rendered state. */
export function classifyFailure(result: Pick<RunResult, "stderr" | "exitCode">): { ok: boolean; errorKind: ErrorKind } {
  if (result.exitCode === 0 && result.stderr.trim() === "") return { ok: true, errorKind: null };
  if (/TimeoutError/.test(result.stderr)) return { ok: false, errorKind: "timeout" };
  if (/(SyntaxError|Unexpected token|IndentationError)/.test(result.stderr)) return { ok: false, errorKind: "syntax" };
  return { ok: false, errorKind: "runtime" };
}

export function describeError(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return typeof cause === "string" ? cause : "unknown error";
}
