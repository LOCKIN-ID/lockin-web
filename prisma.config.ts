import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 keeps the datasource URL out of the schema so the runtime can pick an
// adapter per deployment (see src/lib/prisma.ts). The CLI reads it from here.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
