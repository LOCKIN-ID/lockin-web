import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { chromePath } from "./chrome-path.mjs";

/**
 * The render tier of the Hallmark lint.
 *
 * `npm run design:lint` reads the source and the built HTML. This one drives a
 * real browser against a running site, which is the only way the word-per-screen
 * budget, the contrast of a callout against the pixels behind it, the focus rings
 * and the 375px overflow can be measured. It needs `npm run dev` (or a deployed
 * URL) already up, and it is slower: about a minute a route.
 *
 * Usage:
 *   npm run design:lint:render
 *   SMOKE_BASE_URL=https://lockin.example npm run design:lint:render
 */

const SLOPLINT = join(
  process.env.USERPROFILE ?? "C:\\Users\\lenovo",
  ".omp",
  "agent",
  "skills",
  "hallmark",
  "scripts",
  "sloplint.mjs",
);

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Every public page the shop owns. Add a route here when a page is added. */
const ROUTES = [
  "/",
  "/books",
  "/books/beginner",
  "/books/intermediate",
  "/books/expert",
  "/pricing",
  "/help",
  "/contact",
  "/playground",
  "/login",
  "/register",
];

const env = {
  ...process.env,
  CHROME_PATH: chromePath(),
};

let failures = 0;
let warnings = 0;
const dirty = [];

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  let out = "";
  try {
    out = execFileSync(
      process.execPath,
      [SLOPLINT, url, "--render", "--url", url, "--genre", "playful", "--scope", "page"],
      { env, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
  } catch (err) {
    out = `${err.stdout ?? ""}${err.stderr ?? ""}` || String(err.message ?? err);
  }
  const lines = out.split(/\r?\n/).filter((line) => /FAIL|sloplint:/.test(line));
  for (const line of lines) console.log(line);
  const summary = /sloplint: (\d+) FAIL(?:, (\d+) REFLEX)?, (\d+) WARN/.exec(out);
  const floor = summary ? Number(summary[1]) : 1;
  failures += floor;
  warnings += summary ? Number(summary[3]) : 0;
  if (floor > 0) dirty.push(route);
}

console.log(
  `\nrender tier: ${failures} FAIL, ${warnings} WARN across ${ROUTES.length} route(s)${
    dirty.length ? ` — ${dirty.join(", ")}` : " — clean"
  }`,
);
process.exit(failures > 0 ? 1 : 0);
