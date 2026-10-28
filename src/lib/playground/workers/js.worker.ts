/**
 * Runs one JavaScript snippet in its own module worker, so a crash takes the
 * worker with it and top-level `await` still works. The page owns the timeout;
 * the worker owns the console.
 */
/// <reference lib="webworker" />
import { formatValue, type RunnerMessage, truncateOutput } from "../runtime-protocol";

declare const self: DedicatedWorkerGlobalScope;

function post(message: RunnerMessage) {
  self.postMessage(message);
}

const CONSOLE_LEVELS = ["log", "info", "debug", "warn", "error"] as const;

let outBytes = 0;
let errBytes = 0;

function write(level: "out" | "err", text: string) {
  if (level === "out") {
    const { text: clipped } = truncateOutput(text, 200_000 - outBytes);
    outBytes += clipped.length;
    post({ kind: "out", text: clipped });
  } else {
    const { text: clipped } = truncateOutput(text, 200_000 - errBytes);
    errBytes += clipped.length;
    post({ kind: "err", text: clipped });
  }
}

for (const level of CONSOLE_LEVELS) {
  const target = level === "warn" || level === "error" ? "err" : "out";
  (console as unknown as Record<string, unknown>)[level] = (...args: unknown[]) => {
    write(target, args.map(formatValue).join(" "));
  };
}

self.addEventListener("error", (event) => {
  event.preventDefault();
  write("err", `${event.message} (line ${event.lineno})`);
});

self.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  write("err", `Unhandled rejection: ${formatValue((event as PromiseRejectionEvent).reason)}`);
});

self.addEventListener("message", async (event: MessageEvent<{ code?: string }>) => {
  const started = performance.now();
  const code = typeof event.data?.code === "string" ? event.data.code : "";
  let exitCode = 0;
  try {
    // A blob module keeps the snippet out of this worker's own scope and lets it
    // use top-level `await`, which `new Function` cannot.
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    try {
      await import(/* webpackIgnore: true */ url);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    exitCode = 1;
    write("err", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  }
  post({ kind: "done", ms: performance.now() - started, exitCode });
});
