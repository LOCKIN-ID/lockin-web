// Copies the busybox WebAssembly build shipped inside `wasi-sh` into `public/`,
// because the shell engine boots it from a URL (`/busybox.wasm`) rather than
// from the bundle. Runs on `predev` and `prebuild` so the copy can never go stale.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const ROOT = process.cwd();
const DEST = join(ROOT, "public", "busybox.wasm");
const SOURCE_ROOT = join(ROOT, "node_modules", "wasi-sh");

function findWasm(dir, depth = 0) {
  if (depth > 4 || !existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findWasm(full, depth + 1));
    else if (entry.name.endsWith(".wasm")) found.push(full);
  }
  return found;
}

if (!existsSync(SOURCE_ROOT)) {
  console.error("wasm:sync · node_modules/wasi-sh is missing; run `npm install` first.");
  process.exit(1);
}

const candidates = findWasm(SOURCE_ROOT).sort((a, b) => {
  const preferred = (p) => (p.includes("busybox") ? 0 : 1);
  return preferred(a) - preferred(b) || a.length - b.length;
});

if (candidates.length === 0) {
  console.error("wasm:sync · no .wasm file inside node_modules/wasi-sh; the package layout changed.");
  process.exit(1);
}

const source = candidates[0];
mkdirSync(dirname(DEST), { recursive: true });
copyFileSync(source, DEST);

const bytes = statSync(DEST).size;
console.log(
  `wasm:sync · ${relative(ROOT, source)} → public/busybox.wasm (${(bytes / 1024).toFixed(0)} KB)`,
);
