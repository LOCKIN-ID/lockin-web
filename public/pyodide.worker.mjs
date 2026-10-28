// Pyodide inside a module worker. This file lives in `public/` on purpose: it is
// served as-is and imports Pyodide from its CDN, so nothing here can end up in
// the Next bundle, and Pyodide needs no cross-origin isolation to run.
//
// Protocol (see src/lib/playground/engines.ts):
//   in   · { type: "run", id, code }
//   out  · { type: "ready" } | { type: "line", id, level, text }
//        | { type: "result", id, value, ms } | { type: "error", id, message, kind, ms }
//        | { type: "boot-error", message }
const PYODIDE_VERSION = "314.0.7";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;
let activeId = 0;

function send(message) {
  self.postMessage(message);
}

function boot() {
  pyodidePromise ??= (async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`);
    const pyodide = await loadPyodide({ indexURL: INDEX_URL });
    pyodide.setStdout({ batched: (text) => send({ type: "line", id: activeId, level: "out", text }) });
    pyodide.setStderr({ batched: (text) => send({ type: "line", id: activeId, level: "err", text }) });
    return pyodide;
  })();
  return pyodidePromise;
}

function kindOf(message) {
  if (/TimeoutError/.test(message)) return "timeout";
  if (/SyntaxError|IndentationError|TabError/.test(message)) return "syntax";
  return "runtime";
}

boot()
  .then(() => send({ type: "ready" }))
  .catch((error) => send({ type: "boot-error", message: String(error && error.message ? error.message : error) }));

self.addEventListener("message", async (event) => {
  const data = event.data;
  if (!data || data.type !== "run") return;
  const id = data.id;
  const code = typeof data.code === "string" ? data.code : "";
  const started = performance.now();
  activeId = id;
  try {
    const pyodide = await boot();
    try {
      await pyodide.loadPackagesFromImports(code);
    } catch {
      // A package that is not on the CDN fails at the import line below with a
      // readable ModuleNotFoundError, which is the better message.
    }
    const value = await pyodide.runPythonAsync(code);
    let repr = null;
    if (value !== undefined && value !== null) {
      try {
        repr = String(value);
      } finally {
        if (typeof value.destroy === "function") value.destroy();
      }
    }
    send({ type: "result", id, value: repr, ms: performance.now() - started });
  } catch (error) {
    const message = String(error && error.message ? error.message : error).trim();
    send({ type: "error", id, message, kind: kindOf(message), ms: performance.now() - started });
  }
});
