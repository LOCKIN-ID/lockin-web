import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/prisma/client";

/** A Cloudflare D1 binding, exactly as `@prisma/adapter-d1` declares it. */
type D1Binding = ConstructorParameters<typeof PrismaD1>[0];

export type DbDriver = "sqlite" | "libsql" | "d1";

export function dbDriver(): DbDriver {
  const raw = (process.env.DB_DRIVER ?? "sqlite").trim().toLowerCase();
  if (raw === "libsql" || raw === "turso") return "libsql";
  if (raw === "d1") return "d1";
  return "sqlite";
}

export function driverIsD1(): boolean {
  return dbDriver() === "d1";
}

function makeClient(): PrismaClient {
  switch (dbDriver()) {
    case "libsql":
      return new PrismaClient({
        adapter: new PrismaLibSql({
          url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
          authToken: process.env.TURSO_AUTH_TOKEN,
        }),
      });
    case "d1": {
      const g = globalThis as Record<string, unknown>;
      let binding = g.DB;
      if (!binding) {
        try {
          const { getCloudflareContext } = require("@opennextjs/cloudflare");
          const cfContext = getCloudflareContext();
          binding = cfContext?.env?.DB;
        } catch {}
      }
      if (!binding) {
        throw new Error(
          "DB_DRIVER=d1 needs a Cloudflare D1 binding. Assign `globalThis.DB = getCloudflareContext().env.DB` or bind D1 named DB in wrangler.jsonc.",
        );
      }
      return new PrismaClient({ adapter: new PrismaD1(binding as D1Binding) });
    }
    default: {
      try {
        return new PrismaClient({
          adapter: new PrismaBetterSqlite3({
            url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
          }),
        });
      } catch {
        return new PrismaClient({
          adapter: new PrismaLibSql({
            url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
          }),
        });
      }
    }
  }
}

const globalForPrisma = globalThis as unknown as { lockinPrisma?: PrismaClient };

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.lockinPrisma) {
    globalForPrisma.lockinPrisma = makeClient();
  }
  return globalForPrisma.lockinPrisma;
}

/**
 * One client per process, resolved dynamically through a Proxy.
 *
 * This allows test harnesses to swap the underlying PrismaClient instance (e.g. for an
 * isolated in-memory or throwaway test database) without breaking static module imports.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = Reflect.get(client, prop);
    return typeof val === "function" ? val.bind(client) : val;
  },
});
