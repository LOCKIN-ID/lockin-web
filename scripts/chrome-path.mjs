import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * The Chromium binary Puppeteer drives.
 *
 * `CHROME_PATH` always wins, because a deploy or a CI box knows best. The rest is the
 * per-platform default that used to be a Windows literal repeated in every script.
 */
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

  // Last resort: a Chrome Puppeteer or the agent tooling already downloaded.
  for (const root of ["$HOME/.cache/puppeteer", "$HOME/.omp/puppeteer"]) {
    const expanded = root.replace("$HOME", process.env.HOME ?? "");
    if (!existsSync(expanded)) continue;
    try {
      // `find` keeps this to one line instead of a recursive walk.
      const found = execFileSync("find", [expanded, "-name", "chrome", "-type", "f"], {
        encoding: "utf8",
      })
        .split("\n")
        .filter(Boolean)
        .sort()
        .pop();
      if (found) return found;
    } catch {
      // no find, no cache: fall through to the error below
    }
  }

  throw new Error(
    "No Chromium found. Set CHROME_PATH to a Chrome/Chromium/Edge binary and re-run.",
  );
}
