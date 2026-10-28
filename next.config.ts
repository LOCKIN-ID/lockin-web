import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's SQLite driver adapters load native modules (`better-sqlite3` above all);
  // they must stay outside the server bundle.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-libsql",
    "@prisma/adapter-d1",
    "better-sqlite3",
  ],
};

export default nextConfig;
