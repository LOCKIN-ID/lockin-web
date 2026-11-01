/**
 * The local stand-in for Vercel's cron: hits the retention route every two minutes.
 *
 * Nothing about the product changes because this exists — it calls the same endpoint the
 * platform calls, with the same secret, so a scheduled mail that works here works there.
 * Run it beside `npm run mail`, then register an account and watch MailDev at
 * http://localhost:1080.
 */
import "dotenv/config";

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const SECRET = process.env.CRON_SECRET ?? "";
const EVERY_MS = 2 * 60 * 1000;

async function tick(): Promise<void> {
  const at = new Date().toISOString().slice(11, 19);
  try {
    const response = await fetch(`${APP_URL}/api/cron/retention`, {
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const body = (await response.json()) as Record<string, unknown>;
    console.log(
      `cron ${at} ${response.status} queued=${body.queued ?? "?"} sent=${body.sent ?? "?"} failed=${body.failed ?? "?"} skipped=${body.skipped ?? "?"} remaining=${body.remaining ?? "?"}`,
    );
  } catch (cause) {
    console.error(`cron ${at} unreachable: ${(cause as Error).message}`);
  }
}

if (!SECRET) {
  console.error("cron: CRON_SECRET is not set, so the route will answer 401. Copy .env.example to .env.");
  process.exit(1);
}

console.log(`cron: every 2 minutes against ${APP_URL}/api/cron/retention (Ctrl-C to stop)`);
// No top-level await: `tsx` compiles this to CJS (package.json has no "type": "module"),
// and CJS cannot await at module scope.
void tick();
setInterval(() => void tick(), EVERY_MS);
