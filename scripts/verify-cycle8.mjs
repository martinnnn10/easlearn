/**
 * Cycle 8 QA — diagram audit on highest-traffic card lessons (375px + 1280px)
 * Run: pnpm exec tsx scripts/verify-cycle8.mjs
 * Requires dev server: QA_BASE_URL (default http://127.0.0.1:3002)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLessonCardDeck } from "../shared/lessonCardContent.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "qa-screenshots", "cycle8");

/** module/lesson, diagram card indices (0-based), expected body patterns */
const AUDITS = [
  {
    id: "refrig",
    route: "/courses/hvac-fundamentals/refrigeration-cycle?qa=full",
    checks: [
      { card: 1, patterns: [/Compressor/i, /Condenser/i, /Evaporator/i], minSvgs: 1, label: "refrigeration-cycle loop" },
      { card: 7, patterns: [/118/i, /400/i], caption: /manifold/i, minSvgs: 1, label: "P-T table" },
    ],
  },
  {
    id: "io",
    route: "/courses/plc-fundamentals/io-troubleshooting?qa=full",
    checks: [
      { card: 1, patterns: [/I:1/i, /O:2/i], minSvgs: 1, label: "io-terminal I:1/x" },
      { card: 3, patterns: [/E-stop|NC/i], minSvgs: 1, label: "nc-chain" },
      { card: 6, patterns: [/photoeye|Beam|I:1/i], minSvgs: 1, label: "photoeye-loop" },
    ],
  },
  {
    id: "vfd",
    route: "/courses/powerflex-vfd/vfd-fundamentals?qa=full",
    checks: [
      { card: 1, patterns: [/Rectifier/i, /DC Bus/i, /Inverter/i], minSvgs: 1, label: "vfd-stages" },
    ],
  },
];

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

async function auditDiagramCard(page, audit, check, viewportLabel) {
  await page.goto(`${BASE}${audit.route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForSelector(".lesson-card-player", { timeout: 45000 });
  await advanceToCard(page, check.card);

  const info = await page.evaluate(() => {
    const stage = document.querySelector(".lesson-card-stage");
    const svgTexts = Array.from(document.querySelectorAll(".lesson-diagram-block svg text, .lesson-diagram-block svg tspan"))
      .map((el) => parseFloat(getComputedStyle(el).fontSize))
      .filter((n) => !Number.isNaN(n));
    return {
      text: stage?.textContent ?? "",
      bodyText: document.body.innerText,
      caption: document.querySelector(".lesson-diagram-block figcaption")?.textContent?.trim() ?? "",
      svgs: document.querySelectorAll(".lesson-diagram-block svg").length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      minFont: svgTexts.length ? Math.min(...svgTexts) : 99,
    };
  });

  const haystack = `${info.text} ${info.bodyText}`;
  const patternsOk = check.patterns.every((re) => re.test(haystack));
  const captionOk = check.caption ? check.caption.test(info.caption) : true;

  return {
    check: `${audit.id} ${check.label} ${viewportLabel}`,
    pass:
      info.svgs >= (check.minSvgs ?? 1) &&
      patternsOk &&
      captionOk &&
      !info.overflow &&
      info.minFont >= 8,
    detail: !patternsOk ? "missing expected labels" : info.overflow ? "horizontal overflow" : undefined,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  // Static: deck declares diagram variants matching audit cards
  for (const audit of AUDITS) {
    const parts = audit.route.match(/\/courses\/([^/]+)\/([^?]+)/);
    const deck = getLessonCardDeck(parts[1], parts[2]);
    for (const check of audit.checks) {
      const card = deck.cards[check.card];
      const hasDiagram = card?.visual?.type === "diagram";
      results.push({
        id: `S-${audit.id}-${check.card}`,
        check: `${audit.id} deck card ${check.card + 1} has diagram visual`,
        pass: hasDiagram,
      });
    }
  }

  const browser = await chromium.launch({ headless: true });

  for (const audit of AUDITS) {
    const phone = await browser.newContext({ ...devices["iPhone 13"] });
    const mobile = await phone.newPage();
    try {
      for (const check of audit.checks) {
        const r = await auditDiagramCard(mobile, audit, check, "375px");
        results.push({ id: `M-${audit.id}-${check.card}`, ...r });
      }
      await mobile.goto(`${BASE}${audit.route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await dismissCookies(mobile);
      await mobile.waitForSelector(".lesson-card-player", { timeout: 20000 });
      await mobile.screenshot({ path: path.join(OUT, `${audit.id}-mobile.png`), fullPage: false });
    } catch (err) {
      results.push({ id: `M-${audit.id}-ERR`, check: `${audit.id} mobile audit`, pass: false, detail: err.message });
    }
    await phone.close();

    const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      for (const check of audit.checks) {
        const r = await auditDiagramCard(desktop, audit, check, "1280px");
        results.push({ id: `D-${audit.id}-${check.card}`, ...r });
      }
    } catch (err) {
      results.push({ id: `D-${audit.id}-ERR`, check: `${audit.id} desktop audit`, pass: false, detail: err.message });
    }
    await desktop.close();
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "cycle8-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== CYCLE 8 DIAGRAM AUDIT ===\n");
  for (const r of results.filter((x) => !x.pass)) {
    console.log(`FAIL [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
