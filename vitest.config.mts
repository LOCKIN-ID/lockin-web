import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest reads neither `tsconfig.json` `paths` nor Next's bundler alias, so the `@/*`
 * imports used throughout `src` would not resolve in tests. This mirrors the tsconfig
 * mapping exactly; nothing else belongs in this file.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
