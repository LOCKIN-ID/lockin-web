import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const EDGE_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const BASE_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT_DIR = join(process.cwd(), ".hallmark", "shots");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

const LEARNER = {
  email: "student@lockin.test",
  password: "lockin-student-2026",
};

const ADMIN = {
  email: "admin@lockin.test",
  password: process.env.SEED_ADMIN_PASSWORD ?? "lockin-admin-2026",
};

async function login(page, { email, password }) {
  console.log(`[auth] Logging in as ${email}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });

  await page.waitForSelector("#email");
  await page.evaluate(() => {
    const e = document.querySelector("#email");
    const p = document.querySelector("#password");
    if (e) e.value = "";
    if (p) p.value = "";
  });
  await page.type("#email", email);
  await page.type("#password", password);

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => {}),
  ]);

  await new Promise((r) => setTimeout(r, 1500));
  const current = page.url();
  console.log(`[auth] Current URL after login: ${current}`);
}

async function capture(page, name, viewports = [1440, 375]) {
  for (const width of viewports) {
    const height = width === 375 ? 812 : 900;
    await page.setViewport({ width, height });
    await new Promise((r) => setTimeout(r, 600));
    const path = join(OUT_DIR, `app-${name}-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`✓ Shot: app-${name}-${width}.png (${width}px)`);
  }
}

async function main() {
  console.log(`Starting authenticated shots run against ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // 1. Learner session
    await login(page, LEARNER);

    const learnerRoutes = [
      { name: "dashboard", path: "/app", viewports: [1440, 375] },
      { name: "library", path: "/app/library", viewports: [1440, 375] },
      { name: "reader-beginner", path: "/app/books/beginner", viewports: [1440, 375] },
      { name: "quests", path: "/app/quests", viewports: [1440, 375] },
      { name: "badges", path: "/app/badges", viewports: [1440, 375] },
      { name: "rewards", path: "/app/rewards", viewports: [1440] },
      { name: "leaderboard", path: "/app/leaderboard", viewports: [1440] },
      { name: "settings", path: "/app/settings", viewports: [1440] },
      { name: "tickets", path: "/app/tickets", viewports: [1440] },
      { name: "playground", path: "/app/playground", viewports: [1440, 375] },
    ];

    for (const r of learnerRoutes) {
      console.log(`Navigating to ${r.path}...`);
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle0" });
      await capture(page, r.name, r.viewports);
    }

    // 2. Exercise Reader Run button
    console.log("Testing snippet execution in reader...");
    await page.goto(`${BASE_URL}/app/books/beginner`, { waitUntil: "networkidle0" });
    const runBtnHandle = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "Run" || b.innerText.trim().startsWith("Run")
      );
    });
    const runBtn = runBtnHandle.asElement();
    if (runBtn) {
      await runBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
      await capture(page, "reader-snippet-executed", [1440]);
    }

    // 3. Purchase Pro via mock checkout
    console.log("Simulating Pro purchase flow...");
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle0" });
    // find pro form submit button
    const proBuy = await page.$('form input[value="pro"]');
    if (proBuy) {
      const form = await proBuy.evaluateHandle((el) => el.closest("form"));
      const btn = await form.$('button[type="submit"]');
      if (btn) {
        await Promise.all([
          btn.click(),
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => {}),
        ]);
        console.log(`Navigated to checkout URL: ${page.url()}`);
        await capture(page, "checkout-order", [1440]);

        // simulate payment
        const simBtnHandle = await page.evaluateHandle(() => {
          return Array.from(document.querySelectorAll("button")).find(
            (b) => b.innerText.includes("Simulate")
          );
        });
        const simulateBtn = simBtnHandle.asElement();
        if (simulateBtn) {
          await simulateBtn.click();
          await new Promise((r) => setTimeout(r, 2000));
          console.log(`After mock settle URL: ${page.url()}`);
          await capture(page, "checkout-settled", [1440]);
        }
      }
    }

    // 4. Admin Session
    const adminPage = await browser.newPage();
    await login(adminPage, ADMIN);

    const adminRoutes = [
      { name: "admin-dashboard", path: "/admin" },
      { name: "admin-users", path: "/admin/users" },
      { name: "admin-books", path: "/admin/books" },
      { name: "admin-orders", path: "/admin/orders" },
      { name: "admin-quests", path: "/admin/quests" },
      { name: "admin-tickets", path: "/admin/tickets" },
      { name: "admin-help", path: "/admin/help" },
      { name: "admin-email", path: "/admin/email" },
    ];

    for (const r of adminRoutes) {
      console.log(`[admin] Navigating to ${r.path}...`);
      await adminPage.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle0" });
      await capture(adminPage, r.name, [1440]);
    }

    console.log("\n==========================================");
    console.log("ALL AUTHENTICATED SHOTS CAPTURED! ✓");
    console.log("==========================================");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Authenticated shots failed:", err);
  process.exit(1);
});
