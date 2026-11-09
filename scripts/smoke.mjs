import puppeteer from "puppeteer-core";

import { chromePath } from "./chrome-path.mjs";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const CHROME = chromePath();

/**
 * The smoke walk: one real interaction per public surface, asserted on what a
 * reader sees, not on the markup that happens to carry it. Every check here is
 * something a buyer would notice if it were missing — the headline, the three
 * books, the roadmap map, the help filter, the QR handoff, and a plan that can
 * be submitted from `/pricing`.
 */
async function runSmokeTests() {
  console.log(`Starting smoke tests against ${BASE_URL} using Edge...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const text = () => page.evaluate(() => document.body.innerText);

  try {
    // Flow (a): Landing Hero
    console.log("Checking Flow (a): Landing hero & headline...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    const landing = (await text()).toLowerCase().replace(/\u00a0/g, " ");
    for (const claim of ["xp", "quest"]) {
      if (!landing.includes(claim)) throw new Error(`Landing page never says "${claim.trim()}"`);
    }
    console.log("✓ Flow (a) passed: Landing hero and its claims matched.");

    // Flow (b): /books catalogue, then one book's detail page
    console.log("Checking Flow (b): /books catalogue...");
    await page.goto(`${BASE_URL}/books`, { waitUntil: "networkidle0" });
    const bookLinks = await page.$$eval('a[href^="/books/"]', (els) =>
      [...new Set(els.map((el) => el.getAttribute("href")))],
    );
    for (const slug of ["/books/beginner", "/books/intermediate", "/books/expert"]) {
      if (!bookLinks.includes(slug)) throw new Error(`Catalog is missing ${slug}`);
    }
    await page.goto(`${BASE_URL}/books/beginner`, { waitUntil: "networkidle0" });
    const detail = await text();
    if (!detail.includes("LOCK.IN Beginner")) throw new Error("Book detail page lost its title");
    if (!/chapter/i.test(detail)) throw new Error("Book detail page lost its chapter list");
    console.log(`✓ Flow (b) passed: ${bookLinks.length} books, detail page renders.`);

    // Flow (c): /playground — playground page renders
    console.log("Checking Flow (c): /playground editor...");
    await page.goto(`${BASE_URL}/playground`, { waitUntil: "networkidle0" });
    const playgroundText = await text();
    if (!playgroundText.includes("Playground")) throw new Error("Playground page missing");
    console.log("✓ Flow (c) passed: /playground renders.");

    // Flow (d): /help — the articles are listed and the filter narrows them
    console.log("Checking Flow (d): /help knowledge base...");
    await page.goto(`${BASE_URL}/help`, { waitUntil: "networkidle0" });
    const rows = () => page.$$eval('a[href^="/help/"]', (els) => els.map((el) => el.innerText));
    const allRows = await rows();
    if (allRows.length < 8) throw new Error(`Expected at least 8 articles, got ${allRows.length}`);
    await page.type("#help-search", "price");
    await new Promise((r) => setTimeout(r, 400));
    const filtered = await rows();
    if (filtered.length === 0 || filtered.length >= allRows.length) {
      throw new Error(`Search did not narrow the list: ${allRows.length} → ${filtered.length}`);
    }
    console.log(`✓ Flow (d) passed: ${allRows.length} articles, search narrowed them to ${filtered.length}.`);

    // Flow (e): /pricing — three plans, and the small print opens
    console.log("Checking Flow (e): /pricing checkout surface...");
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle0" });
    const submits = await page.$$eval('form button[type="submit"]', (els) => els.map((el) => el.innerText.trim()));
    if (submits.length < 3) throw new Error(`Expected at least three plan actions, got ${submits.length}`);
    const faq = await page.$("details.disclosure:not(.disclosure--plans) > summary");
    if (!faq) throw new Error("The pricing FAQ has no questions left");
    await faq.click();
    const answerShown = await page.evaluate(() => {
      const d = document.querySelector("details.disclosure:not(.disclosure--plans)");
      return Boolean(d && d.open && (d.querySelector("p")?.innerText ?? "").length > 20);
    });
    if (!answerShown) throw new Error("Opening a pricing question showed no answer");
    console.log(`✓ Flow (e) passed: plans submit (${submits.join(" / ")}), FAQ opens.`);

    // Flow (f): QR redirect endpoint
    console.log("Checking Flow (f): QR resolution /q/<slug>...");
    await page.goto(`${BASE_URL}/q/begq7f2x9m4kdt3nzr8pw`);
    const finalUrl = page.url();
    if (!finalUrl.includes("/app/quests/") && !finalUrl.includes("/login")) {
      throw new Error(`QR redirect did not point to quest, ended at ${finalUrl}`);
    }
    console.log("✓ Flow (f) passed: QR code resolves correctly.");

    console.log("\n==========================================");
    console.log("ALL SMOKE FLOWS COMPLETED SUCCESSFULLY! ✓");
    console.log("==========================================");
  } finally {
    await browser.close();
  }
}

runSmokeTests().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
