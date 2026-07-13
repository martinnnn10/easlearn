/**
 * Verify InteractiveCircuitDiagramV3 has no text below 10px after launch.
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/simulator?scenario=vfd-conveyor-multifault-v3`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /accept all/i }).click().catch(() => {});
  await page.getByRole("button", { name: /start this scenario/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /start scenario/i }).click();
  await page.waitForTimeout(600);
  await page.getByText(/experienced tech/i).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /begin|start|continue|enter/i }).click().catch(() => {});
  await page.waitForTimeout(4000);

  const sub10 = await page.evaluate(() => {
    const root = document.querySelector(".electrical-diagram")?.closest("div") ?? document.body;
    const hits = [];
    root.querySelectorAll("text, [class*='diag-text'], [class*='text-']").forEach((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (!Number.isNaN(fs) && fs < 10) {
        hits.push({ tag: el.tagName, fs, text: (el.textContent || "").trim().slice(0, 30), class: el.className?.toString?.().slice(0, 40) });
      }
    });
    document.querySelectorAll("svg text").forEach((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (!Number.isNaN(fs) && fs < 10) {
        hits.push({ tag: "svg:text", fs, text: (el.textContent || "").trim().slice(0, 30) });
      }
    });
    return hits;
  });

  console.log(JSON.stringify({ sub10Count: sub10.length, samples: sub10.slice(0, 10) }, null, 2));
  await browser.close();
  process.exit(sub10.length > 0 ? 1 : 0);
}

main();
