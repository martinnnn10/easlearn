/**
 * Phase 5/6 browser QA — labs, standards library, V3 simulator.
 * Run: node scripts/browser-qa-phase5.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
const OUT = path.join(__dirname, "..", "qa-screenshots");

const PAGES = [
  { id: "01-motor-starter", url: "/labs#motor-starter", name: "Motor Starter Lab" },
  { id: "02-relay", url: "/labs#relay", name: "Relay Simulator" },
  { id: "03-wiring-diagram", url: "/labs#wiring-diagram", name: "Wiring Diagram Lab" },
  { id: "04-component-id", url: "/labs#component-id", name: "Component ID Challenge" },
  { id: "05-v3-simulator", url: "/simulator?scenario=vfd-conveyor-multifault-v3", name: "V3 Simulator Diagram" },
  { id: "06-standards-library", url: "/reference/electrical", name: "Electrical Standards Library" },
  { id: "07-standards-coil", url: "/reference/electrical/coil", name: "Standards Detail — Coil" },
  { id: "08-standards-breaker", url: "/reference/electrical/breaker", name: "Standards Detail — Breaker" },
  { id: "09-troubleshooting", url: "/reference/troubleshooting/fuse", name: "Troubleshooting Reference" },
];

async function auditPage(page, pageInfo) {
  const notes = [];
  const failures = [];

  await page.waitForTimeout(1500);

  // Sub-9px text in SVG / DOM
  const smallText = await page.evaluate(() => {
    const hits = [];
    const walk = (el) => {
      const style = window.getComputedStyle(el);
      const fs = parseFloat(style.fontSize);
      if (!Number.isNaN(fs) && fs < 9) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className?.toString?.() || "";
        const text = (el.textContent || "").trim().slice(0, 40);
        if (text || tag === "text" || tag === "svg") {
          hits.push({ tag, class: cls.slice(0, 60), fontSize: fs, text });
        }
      }
      for (const child of el.children) walk(child);
    };
    walk(document.body);
    return hits.slice(0, 30);
  });

  if (smallText.length > 0) {
    failures.push(`Sub-9px text: ${smallText.length} element(s)`);
    notes.push(`Sub-9px samples: ${JSON.stringify(smallText.slice(0, 5))}`);
  }

  // SVG symbol presence on labs
  if (pageInfo.url.includes("/labs")) {
    const svgCount = await page.locator("svg").count();
    if (svgCount === 0) failures.push("No SVG diagrams found");
    else notes.push(`SVG count: ${svgCount}`);
  }

  // Reference link on motor-starter / relay
  if (pageInfo.id === "01-motor-starter" || pageInfo.id === "02-relay") {
    const refBtn = page.getByRole("link", { name: /view standard/i });
    if ((await refBtn.count()) === 0) failures.push("View Standard link missing");
    else {
      const href = await refBtn.first().getAttribute("href");
      notes.push(`View Standard href: ${href}`);
      if (!href?.includes("/reference/electrical/")) failures.push("View Standard href invalid");
    }
  }

  // Standards library search + cards
  if (pageInfo.id === "06-standards-library") {
    const cards = await page.locator('a[href^="/reference/electrical/"]').count();
    if (cards < 5) failures.push(`Expected symbol cards, found ${cards}`);
    else notes.push(`Symbol detail links: ${cards}`);
  }

  // Standards detail preview
  if (pageInfo.url.includes("/reference/electrical/") && !pageInfo.url.endsWith("/electrical")) {
    const preview = await page.locator("svg").count();
    if (preview === 0) {
      const pending = await page.getByText(/preview pending/i).count();
      if (pending > 0) notes.push("Preview pending (registry-only symbol)");
      else failures.push("No symbol preview SVG on detail page");
    } else notes.push(`Detail preview SVGs: ${preview}`);
  }

  // V3 diagram
  if (pageInfo.id === "05-v3-simulator") {
    const diagram = await page.locator(".electrical-diagram svg, svg.electrical-diagram").count();
    notes.push(`V3 diagram SVG blocks: ${diagram}`);
    if (diagram === 0) {
      const anySvg = await page.locator("svg").count();
      notes.push(`Total SVG on page: ${anySvg}`);
      if (anySvg === 0) failures.push("V3 simulator diagram not rendered");
    }
  }

  // Wiring: breaker vs contactor labels
  if (pageInfo.id === "03-wiring-diagram") {
    const body = await page.locator("body").innerText();
    const hasBreaker = /breaker|cb|mcb/i.test(body);
    const hasContactor = /contactor|km/i.test(body);
    notes.push(`Wiring labels — breaker refs: ${hasBreaker}, contactor refs: ${hasContactor}`);
  }

  return { notes, failures };
}

async function runViewport(browser, viewport, label, consoleErrors) {
  const context = await browser.newContext({
    ...viewport,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const results = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ page: label, text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push({ page: label, text: err.message });
  });

  for (const p of PAGES) {
    const url = `${BASE}${p.url}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const shot = path.join(OUT, `${label}-${p.id}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      const audit = await auditPage(page, p);
      results.push({
        viewport: label,
        page: p.name,
        url,
        screenshot: shot,
        pass: audit.failures.length === 0,
        failures: audit.failures,
        notes: audit.notes,
      });
    } catch (err) {
      results.push({
        viewport: label,
        page: p.name,
        url,
        pass: false,
        failures: [err.message],
        notes: [],
      });
    }
  }

  // Mobile layout: labs tab bar usability
  if (label === "mobile") {
    await page.goto(`${BASE}/labs#motor-starter`, { waitUntil: "networkidle" });
    const tabs = await page.locator("button, a").filter({ hasText: /motor starter|relay|wiring/i }).count();
    results.push({
      viewport: label,
      page: "Mobile Labs Navigation",
      url: `${BASE}/labs#motor-starter`,
      pass: tabs >= 2,
      failures: tabs < 2 ? ["Lab tab navigation not visible on mobile"] : [],
      notes: [`Visible lab nav items: ${tabs}`],
    });
    await page.screenshot({ path: path.join(OUT, "mobile-10-labs-nav.png"), fullPage: false });
  }

  // Reference link navigation test (desktop only)
  if (label === "desktop") {
    await page.goto(`${BASE}/labs#relay`, { waitUntil: "networkidle" });
    const ref = page.getByRole("link", { name: /view standard/i }).first();
    if ((await ref.count()) > 0) {
      await ref.click();
      await page.waitForTimeout(1000);
      const landed = page.url();
      const ok = landed.includes("/reference/electrical/coil");
      results.push({
        viewport: label,
        page: "Reference Link Navigation",
        url: landed,
        pass: ok,
        failures: ok ? [] : [`Expected /reference/electrical/coil, got ${landed}`],
        notes: [],
      });
      await page.screenshot({ path: path.join(OUT, "desktop-11-ref-link-coil.png"), fullPage: true });
    }
  }

  await context.close();
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const consoleErrors = [];
  const browser = await chromium.launch({ headless: true });

  const all = [];
  all.push(...(await runViewport(browser, { viewport: { width: 1440, height: 900 } }, "desktop", consoleErrors)));
  all.push(
    ...(await runViewport(
      browser,
      { ...devices["iPhone 13"], viewport: devices["iPhone 13"].viewport },
      "mobile",
      consoleErrors
    ))
  );

  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    summary: {
      totalChecks: all.length,
      passed: all.filter((r) => r.pass).length,
      failed: all.filter((r) => !r.pass).length,
      consoleErrors: consoleErrors.length,
    },
    consoleErrors: consoleErrors.slice(0, 50),
    results: all,
  };

  const reportPath = path.join(OUT, "qa-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${OUT}`);

  const criticalFails = all.filter((r) => !r.pass);
  if (criticalFails.length > 0) {
    console.log("\nFAILURES:");
    for (const f of criticalFails) {
      console.log(`- [${f.viewport}] ${f.page}: ${f.failures.join("; ")}`);
    }
  }

  process.exit(criticalFails.length > 0 || consoleErrors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
