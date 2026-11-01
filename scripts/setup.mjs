// One-command onboarding: a fresh clone becomes a running demo without a manual step list.
//
// Deliberately plain node with no dependencies, like `sync-wasm.mjs`: this script has to work
// before `npm install` has ever run, so it cannot import anything the project installs.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

/** 22.12 is `vitest@5`'s floor, the strictest engine among the direct dependencies. */
const MIN_NODE = [22, 12, 0];

function nodeIsTooOld() {
  const [major, minor, patch] = process.versions.node.split(".").map(Number);
  const [minMajor, minMinor, minPatch] = MIN_NODE;
  if (major !== minMajor) return major < minMajor;
  if (minor !== minMinor) return minor < minMinor;
  return patch < minPatch;
}

function run(args) {
  const result = spawnSync(NPM, args, { stdio: "inherit", shell: false });
  if (result.error) {
    console.error(`setup: could not run ${NPM} ${args.join(" ")}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/** The database file the app will use, resolved from `.env` the same way Prisma does. */
function databaseFile() {
  const env = readFileSync(join(ROOT, ".env"), "utf8");
  const match = /^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?/m.exec(env);
  const url = match?.[1]?.trim() ?? "file:./prisma/dev.db";
  return join(ROOT, url.replace(/^file:/, ""));
}

if (nodeIsTooOld()) {
  console.error(
    `setup: Node ${process.versions.node} is too old. This project needs 22.12 or newer; ` +
      ".nvmrc pins 24. Run `nvm use` (or install Node 24) and try again.",
  );
  process.exit(1);
}

if (!existsSync(join(ROOT, "package.json"))) {
  console.error("setup: run this from the repository root (package.json not found).");
  process.exit(1);
}

if (existsSync(join(ROOT, ".env"))) {
  console.log("setup: .env already exists, leaving it alone.");
} else {
  copyFileSync(join(ROOT, ".env.example"), join(ROOT, ".env"));
  console.log("setup: created .env from .env.example (offline demo defaults, no keys needed).");
}

console.log("setup: installing dependencies");
run(["install"]);

console.log("setup: staging the shell runtime");
run(["run", "wasm:sync"]);

// Asked before the migration: after it runs, the file exists either way and the answer is lost.
const databaseExisted = existsSync(databaseFile());

console.log("setup: applying migrations");
run(["run", "db:deploy"]);

if (databaseExisted) {
  console.log('setup: database already seeded. Run "npm run db:seed" to reset the demo data.');
} else {
  console.log("setup: seeding the demo catalogue and accounts");
  run(["run", "db:seed"]);
}

console.log("setup: running the test suite to prove the install works");
run(["run", "test"]);

console.log(`
setup: done.

  App       http://localhost:3000   (npm run dev)
  Admin     admin@lockin.test / lockin-admin-2026
  Learner   student@lockin.test / lockin-student-2026
  Email     http://localhost:1080/index.html   (npm run mail)
`);
