/**
 * A real SQLite database for the tests that must touch rows.
 *
 * The money path cannot be proved with a mock: "settle twice, get one entitlement" is a
 * statement about unique constraints and a status check, and only a database can answer it.
 * So this harness builds the schema from the committed migrations into a throwaway file,
 * points `DATABASE_URL` at it, and hands back the PrismaClient instance connected via the
 * official adapter.
 */

import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

export interface TestDatabase {
  prisma: PrismaClient;
  close(): Promise<void>;
}

interface AdapterConnection {
  client: { exec(sql: string): void };
}

export async function useTestDatabase(): Promise<TestDatabase> {
  const dir = mkdtempSync(join(tmpdir(), "lockin-test-"));
  const file = join(dir, "test.db");
  const url = `file:${file}`;

  const adapter = new PrismaBetterSqlite3({ url });
  const rawConnection = await adapter.connect();
  const connected = rawConnection as unknown as AdapterConnection;
  const migrations = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join("prisma/migrations", entry.name, "migration.sql"))
    .sort();
  for (const migration of migrations) connected.client.exec(readFileSync(migration, "utf8"));

  process.env.DB_DRIVER = "sqlite";
  process.env.DATABASE_URL = url;
  process.env.PAYMENTS_PROVIDER = "mock";
  process.env.MOCK_PAYMENTS = "1";
  process.env.APP_URL = "http://localhost:3000";

  // Also bind to globalThis so any module importing `@/lib/prisma` uses this test client
  const prisma = new PrismaClient({ adapter });
  (globalThis as unknown as { lockinPrisma?: PrismaClient }).lockinPrisma = prisma;

  return {
    prisma,
    async close() {
      await prisma.$disconnect();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // file lock on windows
      }
    },
  };
}

/** A user with a profile and an e-mail preference: the three rows every flow assumes. */
export async function makeUser(
  prisma: PrismaClient,
  overrides: { id?: string; email?: string; name?: string } = {},
): Promise<string> {
  const id = overrides.id ?? randomUUID();
  const email = overrides.email ?? `reader-${Math.random().toString(36).slice(2, 10)}@lockin.test`;
  const user = await prisma.user.create({
    data: {
      id,
      email,
      name: overrides.name ?? "Test Reader",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    select: { id: true },
  });
  await prisma.profile.create({ data: { userId: user.id } });
  await prisma.emailPreference.create({ data: { userId: user.id } });
  return user.id;
}
