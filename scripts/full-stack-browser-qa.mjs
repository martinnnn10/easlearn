/**
 * Full-stack browser QA — localhost:3000 dev server with tRPC.
 * Run: QA_BASE_URL=http://localhost:3000 node scripts/full-stack-browser-qa.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "fullstack");

const CRITICAL_CONSOLE = [
  /Unexpected token '<'/i,
  /TRPCClientError.*<!doctype/i,
  /is not valid JSON/i,
];

const IGNORE_CONSOLE = [
  /favicon/i,
  /analytics/i,
  /umami/i,
  /VITE_ANALYTICS/i,
  /Failed to load resource.*404/i,
  /baseline-browser-mapping/i,
];

function classifyConsole(text) {
  if (IGNORE_CONSOLE.some((r) => r.test(text))) return "ignored";
  if (CRITICAL_CONSOLE.some((r) => r.test(text))) return "critical";
  if (/error/i.test(text) || /\[API Query Error\]/i.test(text) || /\[API Mutation Error\]/i.test(text)) return "warning";
  return "info";
}

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function visit(page, label, url, consoleLog) {
  const errors = { critical: [], warning: [], ignored: [] };
  const handler = (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") return;
    const text = msg.text();
    const kind = classifyConsole(text);
    const entry = { page: label, text };
    errors[kind === "critical" ? "critical" : kind === "warning" ? "warning" : "ignored"].push(entry);
    consoleLog.push({ ...entry, type: msg.type(), kind });
  };
  page.on("console", handler);
  page.on("pageerror", (err) => {
    const entry = { page: label, text: err.message, type: "pageerror", kind: "critical" };
    errors.critical.push(entry);
    consoleLog.push(entry);
  });

  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 45000 });
  await dismissCookies(page);
  await page.waitForTimeout(2000);
  return errors;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const consoleLog = [];
  const results = [];
  const browser = await chromium.launch({ headless: true });

  // ── Desktop pass ──────────────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const keyPages = [
    { id: "00-home", name: "Home", url: "/" },
    { id: "01-simulator", name: "Simulator browse", url: "/simulator" },
    { id: "02-motor-starter", name: "Motor Starter", url: "/labs#motor-starter" },
    { id: "03-relay", name: "Relay (paywall)", url: "/labs#relay" },
    { id: "04-wiring", name: "Wiring Diagram", url: "/labs#wiring-diagram" },
    { id: "05-component-id", name: "Component ID", url: "/labs#component-id" },
    { id: "06-standards", name: "Standards Library", url: "/reference/electrical" },
    { id: "07-standards-coil", name: "Standards Coil", url: "/reference/electrical/coil" },
    { id: "08-standards-breaker", name: "Standards Breaker", url: "/reference/electrical/breaker" },
    { id: "09-login", name: "Login (auth route)", url: "/login" },
  ];

  for (const p of keyPages) {
    const errs = await visit(page, p.name, p.url, consoleLog);
    const shot = path.join(OUT, `desktop-${p.id}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    const notes = [];
    let failures = [...errs.critical.map((e) => e.text)];

    if (p.id === "00-home") {
      const title = await page.title();
      notes.push(`Title: ${title}`);
      if (!title) failures.push("Home page has no title");
    }

    if (p.id === "01-simulator") {
      const browse = await page.getByText(/FEATURED DIAGNOSTIC CHALLENGES/i).count();
      const plcCat = await page.getByText(/PLC & LADDER LOGIC/i).count();
      notes.push(`Featured section: ${browse > 0}, PLC category: ${plcCat > 0}`);
      if (browse === 0) failures.push("Simulator featured section missing");
      if (plcCat === 0) failures.push("Simulator category section missing");
    }

    if (p.id === "02-motor-starter") {
      const svg = await page.locator("svg").count();
      const ref = await page.getByRole("link", { name: /view standard/i }).count();
      notes.push(`SVG: ${svg}, View Standard: ${ref}`);
      if (svg < 5) failures.push("Motor Starter diagram thin");
      if (ref === 0) failures.push("View Standard missing on Motor Starter");
    }

    if (p.id === "03-relay") {
      const paywall = await page.getByText(/subscribe to unlock/i).count();
      const simulator = await page.locator(".electrical-diagram svg").count();
      notes.push(`Paywall: ${paywall > 0}, Relay SVG: ${simulator}`);
      // Paywall expected anonymous — only fail on critical console errors
      if (paywall === 0 && simulator === 0) failures.push("Relay: neither paywall nor simulator visible");
    }

    if (p.id === "04-wiring") {
      const svg = await page.locator("svg").count();
      const q = await page.getByText(/circuit breaker feeds/i).count();
      notes.push(`SVG: ${svg}, Question: ${q > 0}`);
      if (svg < 3) failures.push("Wiring diagram SVG missing");
    }

    if (p.id === "05-component-id") {
      const q = await page.getByText(/question \d+ of/i).count();
      notes.push(`Challenge active: ${q > 0}`);
    }

    if (p.id === "06-standards") {
      const links = await page.locator('a[href^="/reference/electrical/"]').count();
      notes.push(`Symbol links: ${links}`);
      if (links < 10) failures.push("Standards library sparse");
    }

    if (p.id.startsWith("07") || p.id.startsWith("08")) {
      const svgs = await page.locator("svg").count();
      const back = await page.getByRole("link", { name: /standards library/i }).count();
      notes.push(`Preview SVGs: ${svgs}, Back link: ${back}`);
      if (svgs === 0) failures.push("No preview on detail page");
    }

    results.push({
      viewport: "desktop",
      check: p.name,
      url: `${BASE}${p.url}`,
      screenshot: shot,
      pass: failures.length === 0,
      failures,
      warnings: errs.warning.length,
      notes,
    });
  }

  // Simulator card selection + launch
  {
    await visit(page, "Simulator cards", "/simulator", consoleLog);
    const vfdCard = page.getByRole("button", { name: /VFD Conveyor Multi-Fault/i }).first();
    if ((await vfdCard.count()) > 0) {
      await vfdCard.click();
      await page.waitForTimeout(1000);
      const startBtn = page.getByRole("button", { name: /start this scenario/i });
      const hasStart = (await startBtn.count()) > 0;
      await page.screenshot({ path: path.join(OUT, "desktop-10-simulator-card-selected.png"), fullPage: true });
      let launchOk = false;
      if (hasStart) {
        await startBtn.click();
        await page.waitForTimeout(800);
        const modal = await page.getByText(/play mode|fault configuration/i).count();
        launchOk = modal > 0;
        await page.screenshot({ path: path.join(OUT, "desktop-11-simulator-launch-modal.png"), fullPage: true });
      }
      results.push({
        viewport: "desktop",
        check: "Simulator card launch",
        url: `${BASE}/simulator`,
        pass: hasStart && launchOk,
        failures: !hasStart ? ["START THIS SCENARIO not visible after card click"] : !launchOk ? ["Launch modal did not open"] : [],
        notes: [`Card click OK, start button: ${hasStart}, modal: ${launchOk}`],
      });
    } else {
      results.push({
        viewport: "desktop",
        check: "Simulator card launch",
        pass: false,
        failures: ["VFD Conveyor Multi-Fault card not found"],
        notes: [],
      });
    }
  }

  // Category section — scroll to VFD & Drives
  {
    await visit(page, "Simulator categories", "/simulator", consoleLog);
    const vfdSection = page.getByText("VFD & Drives").first();
    if ((await vfdSection.count()) > 0) {
      await vfdSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, "desktop-12-simulator-category.png"), fullPage: false });
      results.push({
        viewport: "desktop",
        check: "Simulator category cards",
        pass: true,
        failures: [],
        notes: ["VFD & Drives category visible"],
      });
    } else {
      results.push({
        viewport: "desktop",
        check: "Simulator category cards",
        pass: false,
        failures: ["VFD & Drives category not found"],
        notes: [],
      });
    }
  }

  // Motor Starter → View Standard navigation
  {
    await visit(page, "Ref link", "/labs#motor-starter", consoleLog);
    const ref = page.getByRole("link", { name: /view standard/i }).first();
    if ((await ref.count()) > 0) {
      await ref.click();
      await page.waitForTimeout(1500);
      const ok = page.url().includes("/reference/electrical/coil");
      await page.screenshot({ path: path.join(OUT, "desktop-13-ref-navigation.png"), fullPage: true });
      results.push({
        viewport: "desktop",
        check: "View Standard navigation",
        pass: ok,
        failures: ok ? [] : [`Expected coil detail, got ${page.url()}`],
        notes: [],
      });
    }
  }

  await ctx.close();

  // ── Mobile pass ───────────────────────────────────────────────────────────
  const mctx = await browser.newContext({ ...devices["iPhone 13"] });
  const mpage = await mctx.newPage();
  const mobilePages = [
    { id: "m-home", url: "/", name: "Mobile Home" },
    { id: "m-simulator", url: "/simulator", name: "Mobile Simulator" },
    { id: "m-motor", url: "/labs#motor-starter", name: "Mobile Motor Starter" },
    { id: "m-relay", url: "/labs#relay", name: "Mobile Relay" },
    { id: "m-standards", url: "/reference/electrical", name: "Mobile Standards" },
  ];

  for (const p of mobilePages) {
    const errs = await visit(mpage, p.name, p.url, consoleLog);
    await mpage.screenshot({ path: path.join(OUT, `${p.id}.png`), fullPage: true });
    const failures = [...errs.critical.map((e) => e.text)];
    let notes = [];
    if (p.id === "m-motor") {
      const svg = await mpage.locator("svg").count();
      notes.push(`SVG count: ${svg}`);
      if (svg < 5) failures.push("Mobile motor starter diagram thin");
    }
    if (p.id === "m-relay") {
      const paywall = await mpage.getByText(/subscribe|unlock/i).count();
      notes.push(`Paywall/lock UI: ${paywall > 0}`);
    }
    results.push({
      viewport: "mobile",
      check: p.name,
      url: `${BASE}${p.url}`,
      pass: failures.length === 0,
      failures,
      warnings: errs.warning.length,
      notes,
    });
  }
  await mctx.close();
  await browser.close();

  const criticalAll = consoleLog.filter((e) => e.kind === "critical");
  const trpcHtml = criticalAll.filter((e) => /Unexpected token|not valid JSON/i.test(e.text));

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    gate: "FULL_STACK_BROWSER",
    summary: {
      checks: results.length,
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
      criticalConsoleErrors: criticalAll.length,
      trpcHtmlParseErrors: trpcHtml.length,
    },
    requirements: {
      appLoads: results.find((r) => r.check === "Home")?.pass ?? false,
      noTrpcHtmlErrors: trpcHtml.length === 0,
      simulatorLoads: results.find((r) => r.check === "Simulator browse")?.pass ?? false,
      simulatorCardsLaunch: results.find((r) => r.check === "Simulator card launch")?.pass ?? false,
      standardsLibrary: results.find((r) => r.check === "Standards Library")?.pass ?? false,
      motorStarter: results.find((r) => r.check === "Motor Starter")?.pass ?? false,
      relayNoCrash: results.find((r) => r.check === "Relay (paywall)")?.pass ?? false,
      mobileUsable: mobilePages.every((p) => results.find((r) => r.url === `${BASE}${p.url}` && r.pass)),
    },
    criticalConsole: criticalAll,
    trpcHtmlErrors: trpcHtml,
    results,
  };

  // Fix mobileUsable calc
  const mobileResults = results.filter((r) => r.viewport === "mobile");
  report.requirements.mobileUsable = mobileResults.length > 0 && mobileResults.every((r) => r.pass);

  const outFile = path.join(OUT, "fullstack-qa-report.json");
  await writeFile(outFile, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(JSON.stringify(report.requirements, null, 2));
  console.log(`Report: ${outFile}`);

  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log("\nCHECK FAILURES:");
    for (const f of failed) console.log(`- [${f.viewport}] ${f.check}: ${f.failures.join("; ")}`);
  }
  if (trpcHtml.length) {
    console.log("\nTRPC HTML PARSE ERRORS:");
    for (const e of trpcHtml) console.log(`- ${e.page}: ${e.text.slice(0, 120)}`);
  }

  const gatePass =
    report.requirements.appLoads &&
    report.requirements.noTrpcHtmlErrors &&
    report.requirements.simulatorLoads &&
    report.requirements.simulatorCardsLaunch &&
    report.requirements.standardsLibrary &&
    report.requirements.motorStarter &&
    report.requirements.relayNoCrash &&
    report.requirements.mobileUsable &&
    failed.length === 0;

  process.exit(gatePass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
