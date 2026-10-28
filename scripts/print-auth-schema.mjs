// Prints the identity models better-auth 1.7.12 expects, straight from the library
// (`getAuthTables()` — the same call the CLI makes). Run it after changing the auth
// plugins, then port any difference into `prisma/schema.prisma` by hand.
//
//   node scripts/print-auth-schema.mjs
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { getAuthTables } from "better-auth/db";

const auth = betterAuth({
  secret: "schema-inspection-only",
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  database: { id: "stub" },
});

const tables = getAuthTables(auth.options);
for (const [key, table] of Object.entries(tables)) {
  console.log(`### ${key} -> model "${table.modelName}"`);
  for (const [name, field] of Object.entries(table.fields ?? {})) {
    const ref = field.references
      ? ` -> ${field.references.model}.${field.references.field}${field.references.onDelete ? ` (onDelete: ${field.references.onDelete})` : ""}`
      : "";
    const dflt = field.defaultValue ? ` default=${String(field.defaultValue)}` : "";
    console.log(
      `  ${name}: ${field.type}${field.required ? " required" : ""}${field.unique ? " unique" : ""}${dflt}${ref}`,
    );
  }
}

process.exit(0);
