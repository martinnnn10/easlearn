/**
 * Browser QA — VFD Hub shell at /hubs/vfd
 * Run: node scripts/verify-vfd-hub.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "vfd-hub-verify");

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  const homeRes = await fetch(`${BASE}/hubs/vfd`);
  results.push({ id: 1, check: "/hubs/vfd returns 200", pass: homeRes.ok, detail: `HTTP ${homeRes.status}` });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE}/hubs/vfd`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForTimeout(1000);

    const title = await page.getByRole("heading", { name: /PowerFlex VFD Hub/i }).first().isVisible();
    results.push({ id: 2, check: "VFD Hub heading visible", pass: title });

    const benchmark = await page.getByRole("heading", { name: /PowerFlex Diagnostic Lab/i }).first().isVisible();
    results.push({ id: 3, check: "Benchmark card visible", pass: benchmark });

    const comingSoon = await page.getByText(/Coming Soon/i).first().isVisible().catch(() => false);
    const betaCta = page.getByRole("link", { name: /Open Beta Diagnostic Lab/i });
    const betaVisible = await betaCta.isVisible();
    const betaHref = await betaCta.getAttribute("href");
    const betaOk = betaHref?.includes("hub=vfd") && betaHref?.includes("powerflex-diagnostic");
    results.push({
      id: 4,
      check: "Benchmark shows beta CTA (not Coming Soon)",
      pass: betaVisible && !comingSoon && Boolean(betaOk),
      detail: betaHref ?? "no href",
    });

    await betaCta.click();
    await page.waitForTimeout(1500);
    const onLab = page.url().includes("powerflex-diagnostic");
    results.push({ id: "4a", check: "Benchmark CTA opens diagnostic lab", pass: onLab, detail: page.url() });

    await page.goto(`${BASE}/hubs/vfd`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const lessonCount = await page.getByText(/Lesson \d/).count();
    results.push({
      id: 5,
      check: "Six lesson cards listed",
      pass: lessonCount >= 6,
      detail: `${lessonCount} lesson labels`,
    });

    const iluChain = await page.getByText(/ILU chain: lesson → practice/i).first().isVisible();
    results.push({ id: 6, check: "ILU chain documented in header", pass: iluChain });

    const paramLab = page.getByRole("link", { name: /VFD Parameter Lab/i }).first();
    const paramHref = await paramLab.getAttribute("href");
    const paramOk = paramHref?.includes("hub=vfd") && paramHref?.includes("#vfd");
    results.push({
      id: 7,
      check: "VFD Parameter Lab link preserves hub=vfd",
      pass: Boolean(paramOk),
      detail: paramHref ?? "no href",
    });

    await paramLab.click();
    await page.waitForTimeout(1500);
    const onParamLab = page.url().includes("/labs") && page.url().includes("hub=vfd");
    results.push({ id: 8, check: "VFD Parameter Lab navigates with hub param", pass: onParamLab, detail: page.url() });

    await page.goto(`${BASE}/hubs/vfd`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const v3Link = page.getByRole("link", { name: /VFD DC Bus Undervoltage/i }).first();
    const v3Href = await v3Link.getAttribute("href");
    const v3Ok = v3Href?.includes("hub=vfd");
    results.push({
      id: 9,
      check: "V3 scenario link includes hub=vfd",
      pass: Boolean(v3Ok),
      detail: v3Href ?? "no href",
    });

    const scaffoldChip = await page.getByText(/· soon/i).count();
    results.push({
      id: 10,
      check: "No scaffold soon chips on benchmark lessons",
      pass: scaffoldChip === 0,
      detail: `${scaffoldChip} soon chips`,
    });

    await page.goto(`${BASE}/hubs/vfd`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, "vfd-hub-desktop.png"), fullPage: true });

    const mobileCtx = await browser.newContext({ ...devices["iPhone 13"] });
    const mobile = await mobileCtx.newPage();
    await mobile.goto(`${BASE}/hubs/vfd`, { waitUntil: "domcontentloaded" });
    await dismissCookies(mobile);
    await mobile.waitForTimeout(600);
    const mobileHeading = await mobile.getByRole("heading", { name: /PowerFlex VFD Hub/i }).first().isVisible();
    const mobileLessons = await mobile.getByText(/Lesson \d/).count();
    await mobile.screenshot({ path: path.join(OUT, "vfd-hub-mobile.png"), fullPage: true });
    await mobileCtx.close();
    results.push({
      id: 11,
      check: "Mobile layout renders",
      pass: mobileHeading && mobileLessons >= 6,
      detail: `${mobileLessons} lessons on mobile`,
    });
  } catch (err) {
    results.push({ id: "ERR", check: "Browser verification", pass: false, detail: err.message });
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "vfd-hub-verify.json"), JSON.stringify(report, null, 2));

  console.log("\n=== VFD HUB VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
