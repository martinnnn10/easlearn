/**
 * Cycle 7 QA — diagram pass + progress bar polish
 * Run: pnpm exec tsx scripts/verify-cycle7.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(__dirname, "..", "qa-screenshots", "cycle7");

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function advanceToCard(page, targetIndex) {
  const player = page.locator(".lesson-card-player");
  for (let i = 0; i < targetIndex; i++) {
    const next = player.getByRole("button", { name: /Next/i });
    if (!(await next.isEnabled())) {
      const choices = player.locator(".lesson-card-stage button[type='button']");
      const count = await choices.count();
      for (let c = 0; c < count; c++) {
        const btn = choices.nth(c);
        const text = (await btn.innerText()).trim();
        if (text && !/^(Previous|Next|Outline)$/i.test(text)) {
          await btn.click();
          await page.waitForTimeout(300);
          break;
        }
      }
    }
    if (!(await next.isEnabled())) break;
    await next.click();
    await page.waitForTimeout(350);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];
  const browser = await chromium.launch({ headless: true });

  // Card 2 — mobile
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  const mobile = await phone.newPage();
  try {
    await mobile.goto(`${BASE}/courses/hvac-fundamentals/refrigeration-cycle?qa=full`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await dismissCookies(mobile);
    await mobile.waitForSelector(".lesson-card-player", { timeout: 20000 });
    await advanceToCard(mobile, 1);
    const card2 = await mobile.evaluate(() => ({
      text: document.querySelector(".lesson-card-stage")?.textContent ?? "",
      svgs: document.querySelectorAll(".lesson-diagram-block svg").length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    results.push({
      id: "D2",
      check: "Card 2 SVG with 4 labeled components + subtitles",
      pass:
        card2.svgs >= 1 &&
        /Compressor/i.test(card2.text) &&
        /Condenser/i.test(card2.text) &&
        /Expansion Valve/i.test(card2.text) &&
        /Evaporator/i.test(card2.text) &&
        /raises pressure/i.test(card2.text),
    });
    await mobile.screenshot({ path: path.join(OUT, "refrig-card2.png"), fullPage: false });
  } catch (err) {
    results.push({ id: "D2-ERR", check: "Card 2", pass: false, detail: err.message });
  }

  // Card 8 — mobile
  try {
    await mobile.goto(`${BASE}/courses/hvac-fundamentals/refrigeration-cycle?qa=full`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await dismissCookies(mobile);
    await mobile.waitForSelector(".lesson-card-player", { timeout: 20000 });
    await advanceToCard(mobile, 7);
    const card8 = await mobile.evaluate(() => ({
      caption: document.querySelector(".lesson-diagram-block figcaption")?.textContent?.trim(),
      svgs: document.querySelectorAll(".lesson-diagram-block svg").length,
      has118: document.body.innerText.includes("118"),
      has400: document.body.innerText.includes("400"),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    results.push({
      id: "D8",
      check: "Card 8 P-T SVG table, no h-scroll at 375px",
      pass:
        card8.svgs >= 1 &&
        card8.has118 &&
        card8.has400 &&
        !card8.overflow &&
        card8.caption?.includes("manifold"),
    });
    await mobile.screenshot({ path: path.join(OUT, "refrig-card8.png"), fullPage: false });
  } catch (err) {
    results.push({ id: "D8-ERR", check: "Card 8", pass: false, detail: err.message });
  }
  await phone.close();

  // Progress bar — desktop polished
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await desktop.goto(`${BASE}/courses/motors-controls/motor-theory?qa=full`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await dismissCookies(desktop);
    await desktop.waitForSelector("h1", { timeout: 20000 });
    await desktop.evaluate(() => window.scrollTo(0, 40));
    await desktop.waitForTimeout(200);
    const early = await desktop.evaluate(() => {
      const bar = document.querySelector(".lesson-reading-progress");
      return {
        visible: Boolean(bar),
        opacity: bar ? parseFloat(getComputedStyle(bar).opacity) : 0,
        height: bar ? parseFloat(getComputedStyle(bar).height) : 0,
      };
    });
    results.push({
      id: "PB-1",
      check: "Progress bar fades in (opacity < 1 early scroll)",
      pass: early.visible && early.opacity > 0 && early.opacity < 1,
    });
    results.push({
      id: "PB-2",
      check: "Progress bar height 4px",
      pass: early.height >= 3.5 && early.height <= 5,
    });
    await desktop.evaluate(() => {
      const scrollToBottom = () => {
        const max =
          Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) -
          window.innerHeight;
        window.scrollTo(0, Math.max(0, max));
      };
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    await desktop.waitForTimeout(800);
    const end = await desktop.evaluate(() => ({
      progress: document.querySelector(".lesson-reading-progress")?.getAttribute("aria-valuenow"),
      visible: Boolean(document.querySelector(".lesson-reading-progress")),
      fill: document.querySelector(".lesson-reading-progress__fill")?.getBoundingClientRect().width,
    }));
    results.push({
      id: "PB-3",
      check: "Progress bar holds at 100% at bottom",
      pass: end.visible && Number(end.progress) >= 99,
    });
    await desktop.screenshot({ path: path.join(OUT, "progress-bar-polished.png"), fullPage: false });
  } catch (err) {
    results.push({ id: "PB-ERR", check: "Progress bar", pass: false, detail: err.message });
  }

  // Card lesson — no bar
  try {
    await desktop.goto(`${BASE}/courses/plc-fundamentals/io-troubleshooting?qa=full`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await desktop.waitForSelector(".lesson-card-player", { timeout: 20000 });
    await desktop.evaluate(() => window.scrollTo(0, 800));
    await desktop.waitForTimeout(300);
    results.push({
      id: "PB-4",
      check: "No progress bar on card lesson",
      pass: (await desktop.locator(".lesson-reading-progress").count()) === 0,
    });
  } catch (err) {
    results.push({ id: "PB4-ERR", check: "Card no bar", pass: false, detail: err.message });
  }
  await desktop.close();
  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "cycle7-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== CYCLE 7 VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
