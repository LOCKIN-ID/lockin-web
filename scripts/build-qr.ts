import { mkdirSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { books } from "../src/content/books";

async function buildAllQrs() {
  const qrDir = join(process.cwd(), "public", "qr");
  mkdirSync(qrDir, { recursive: true });

  const host = process.env.APP_URL ?? "http://localhost:3000";
  let count = 0;

  for (const book of books) {
    for (const quest of book.quests) {
      const targetUrl = `${host}/q/${quest.slug}`;

      // 1. SVG: public/qr/<slug>.svg
      const svgPath = join(qrDir, `${quest.slug}.svg`);
      const svg = await QRCode.toString(targetUrl, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 2,
        color: {
          dark: "#0F281E", // forest
          light: "#FFFFFF",
        },
      });
      const fs = await import("node:fs/promises");
      await fs.writeFile(svgPath, svg, "utf8");

      // 2. PNG: public/qr/<code>.png
      const pngPath = join(qrDir, `${quest.code}.png`);
      await QRCode.toFile(pngPath, targetUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0F281E",
          light: "#FFFFFF",
        },
      });

      count++;
    }
  }

  console.log(`Generated ${count} QR codes (SVG + PNG) into public/qr/`);
}

buildAllQrs().catch((err) => {
  console.error("Failed to build QR codes:", err);
  process.exit(1);
});
