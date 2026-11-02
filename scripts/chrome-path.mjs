import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * The Chromium binary Puppeteer drives.
 *
 * `CHROME_PATH` always wins, because a deploy or a CI box knows best. The rest is the
 * per-platform default that used to be a Windows literal repeated in every script.
 */

/** Chrome binaries below `dir`, depth-limited: the Puppeteer cache is `<product>/<version>/...`. */
function findChrome(dir, depth = 0) {
  if (depth > 4 || !existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findChrome(full, depth + 1));
    else if (entry.name === "chrome" || entry.name === "chrome.exe") found.push(full);
  }
  return found;
}

export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          ]
        : [
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/google-chrome",
            "/opt/google/chrome/chrome",
          ];

  for (const candidate of candidates) if (existsSync(candidate)) return candidate;

  // Last resort: a Chrome Puppeteer or the agent tooling already downloaded. `homedir()`
  // is the only spelling that resolves on Windows, where HOME is not set.
  const cacheRoots = [
    process.env.PUPPETEER_CACHE_DIR,
    join(homedir(), ".cache", "puppeteer"),
    join(homedir(), ".omp", "puppeteer"),
  ].filter(Boolean);

  for (const root of cacheRoots) {
    const found = findChrome(root).sort().pop();
    if (found) return found;
  }

  throw new Error(
    "No Chromium found. Set CHROME_PATH to a Chrome/Chromium/Edge binary, or run `npx puppeteer browsers install chrome`, then re-run.",
  );
}
