import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const BOOKS = ["beginner", "intermediate", "expert"];
const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";

async function buildAllPdfs() {
  const ebooksDir = join(process.cwd(), "public", "ebooks");
  mkdirSync(ebooksDir, { recursive: true });

  console.log(`Connecting to browser at: ${EDGE_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    for (const slug of BOOKS) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });

      const url = `${BASE_URL}/print/books/${slug}`;
      console.log(`Loading ${url}...`);

      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

      const pageCount = await page.$$eval(".print-page", (el) => el.length);
      console.log(`Book ${slug}: rendered ${pageCount} .print-page elements`);

      if (pageCount < 15 || pageCount > 25) {
        throw new Error(
          `Page count assertion failed for ${slug}: expected 15-25 pages, got ${pageCount}`,
        );
      }

      const pdfPath = join(ebooksDir, `${slug}.pdf`);
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      const sizeMb = (statSync(pdfPath).size / (1024 * 1024)).toFixed(2);
      console.log(`✓ ${slug}: ${pageCount} pages, ${sizeMb} MB generated at public/ebooks/${slug}.pdf`);

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log("All e-book PDFs generated successfully!");
}

buildAllPdfs().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
