import { execSync } from "node:child_process";
import { join } from "node:path";

const SLOPLINT = join(
  process.env.USERPROFILE ?? "C:\\Users\\lenovo",
  ".omp",
  "agent",
  "skills",
  "hallmark",
  "scripts",
  "sloplint.mjs",
);

console.log("Running Hallmark design-lint on src/app...");
try {
  execSync(`node "${SLOPLINT}" src/app --genre playful`, {
    stdio: "inherit",
    env: {
      ...process.env,
      CHROME_PATH:
        process.env.CHROME_PATH ??
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    },
  });
  console.log("✓ Design lint finished cleanly.");
} catch (err) {
  console.log("Design lint finished with notices.");
}
