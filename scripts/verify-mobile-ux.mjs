/**
 * Mobile UX audit — 375px iPhone technician viewport.
 * Run: node scripts/verify-mobile-ux.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "qa-screenshots", "mobile-ux-audit");
const VIEWPORT = { width: 375, height: 812 };

const ROUTES = [
  { area: "NAV", name: "Home", path: "/" },
  { area: "NAV", name: "Courses", path: "/courses" },
  { area: "HUB", name: "PLC Hub", path: "/hubs/plc" },
  { area: "HUB", name: "VFD Hub", path: "/hubs/vfd" },
  { area: "LESSON", name: "Card lesson (PLC)", path: "/courses/plc-fundamentals/io-troubleshooting?qa=full" },
  { area: "LESSON", name: "Legacy markdown lesson", path: "/courses/alignment/shaft-alignment-basics" },
  { area: "LABS", name: "Labs index", path: "/labs" },
  { area: "SIM", name: "Conveyor lab", path: "/labs#conveyor-troubleshoot" },
  { area: "SIM", name: "PowerFlex lab", path: "/labs#powerflex-diagnostic" },
  { area: "SIM", name: "Simulator", path: "/simulator" },
];

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 2000 }).catch(() => {});
}

async function auditPage(page, route) {
  const issues = [];
  await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissCookies(page);
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const horizScroll = doc.scrollWidth > doc.clientWidth + 2 || body.scrollWidth > body.clientWidth + 2;
    const overflowPx = Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - body.clientWidth);

    const smallFonts = [];
    const smallTargets = [];
    const walk = (el) => {
      if (!(el instanceof HTMLElement)) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent : "").trim();
      if (text.length > 8) {
        const fs = parseFloat(style.fontSize);
        if (fs > 0 && fs < 14) {
          smallFonts.push({ tag: el.tagName, fs, text: text.slice(0, 60) });
        }
      }
      const interactive =
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.getAttribute("role") === "button" ||
        style.cursor === "pointer";
      if (interactive && rect.width > 0 && rect.height > 0) {
        const tappable = Math.min(rect.width, rect.height);
        if (tappable < 44) {
          smallTargets.push({
            tag: el.tagName,
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40),
          });
        }
      }
      for (const child of el.children) walk(child);
    };
    walk(body);

    return {
      horizScroll,
      overflowPx,
      smallFonts: smallFonts.slice(0, 12),
      smallTargets: smallTargets.slice(0, 15),
      title: document.title,
    };
  });

  if (metrics.horizScroll) {
    issues.push({ severity: "high", check: "horizontal-scroll", detail: `+${metrics.overflowPx}px overflow` });
  }
  if (metrics.smallTargets.length > 0) {
    issues.push({
      severity: "medium",
      check: "tap-targets-under-44px",
      detail: `${metrics.smallTargets.length} elements`,
      samples: metrics.smallTargets.slice(0, 5),
    });
  }
  const bodySmall = metrics.smallFonts.filter((f) => !["SPAN", "LABEL"].includes(f.tag) || f.text.length > 20);
  if (bodySmall.length > 4) {
    issues.push({
      severity: "low",
      check: "body-font-under-14px",
      detail: `${bodySmall.length} text nodes`,
      samples: bodySmall.slice(0, 4),
    });
  }

  const slug = route.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
  await page.screenshot({ path: path.join(OUT, `${route.area}-${slug}.png`), fullPage: false });

  return { route, metrics, issues };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  const results = [];
  for (const route of ROUTES) {
    try {
      results.push(await auditPage(page, route));
    } catch (err) {
      results.push({ route, error: err.message, issues: [{ severity: "high", check: "page-load", detail: err.message }] });
    }
  }

  // Conveyor lab tabs + print wiring
  try {
    await page.goto(`${BASE}/labs#conveyor-troubleshoot`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await dismissCookies(page);
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /Prints/i }).click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /^Wiring$/i }).click({ timeout: 5000 });
    await page.waitForTimeout(600);
    const wiring = await page.evaluate(() => ({
      horizScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      svg: Boolean(document.querySelector(".wiring-diagram-svg, svg.wiring-diagram-svg")),
    }));
    if (wiring.horizScroll) {
      results.push({
        route: { area: "PRINT", name: "Conveyor wiring tab", path: "/labs#conveyor-troubleshoot" },
        issues: [{ severity: "high", check: "wiring-tab-horizontal-scroll", detail: "overflow on wiring tab" }],
        metrics: wiring,
      });
    }
    await page.screenshot({ path: path.join(OUT, "PRINT-wiring-tab.png"), fullPage: false });
  } catch (err) {
    results.push({
      route: { area: "PRINT", name: "Conveyor wiring tab", path: "/labs" },
      issues: [{ severity: "medium", check: "wiring-tab", detail: err.message }],
    });
  }

  await browser.close();

  const allIssues = results.flatMap((r) => (r.issues || []).map((i) => ({ ...i, page: r.route?.name, area: r.route?.area })));
  const report = {
    timestamp: new Date().toISOString(),
    viewport: VIEWPORT,
    base: BASE,
    pages: results.length,
    issueCount: allIssues.length,
    issues: allIssues,
    results,
  };
  await writeFile(path.join(OUT, "mobile-ux-audit.json"), JSON.stringify(report, null, 2));

  console.log("\n=== MOBILE UX AUDIT (375px) ===\n");
  for (const r of results) {
    const n = r.issues?.length ?? 0;
    console.log(`${n === 0 ? "PASS" : "ISSUES"} [${r.route?.area}] ${r.route?.name} — ${n} issue(s)${r.error ? ` (${r.error})` : ""}`);
    for (const i of r.issues || []) {
      console.log(`  - [${i.severity}] ${i.check}: ${i.detail}`);
    }
  }
  console.log(`\nSummary: ${allIssues.length} issues across ${results.length} pages\n`);
  process.exit(0);
}

main();
