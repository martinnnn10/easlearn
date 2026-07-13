/**
 * Platform-wide domain verification — static checks + delegated QA runners.
 * Run: pnpm exec tsx scripts/verify-platform-domain.mjs
 */
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "qa-screenshots", "platform-domain");

function run(cmd, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      shell: true,
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => { stdout += d; });
    child.stderr?.on("data", (d) => { stderr += d; });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function readText(rel) {
  return readFile(path.join(ROOT, rel), "utf8");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  async function check(id, area, check, fn) {
    try {
      const pass = await fn();
      results.push({ id, area, check, pass, fail: !pass });
    } catch (err) {
      results.push({ id, area, check, pass: false, fail: true, detail: err.message });
    }
  }

  await check(1, "Conveyor Lab", "Guard NC input inverted like E-stop/overload", async () => {
    const src = await readText("client/src/lib/conveyorLab/fieldDeviceModel.ts");
    return src.includes('"I:1/3": !field.guardClosed');
  });

  await check(2, "Slide Cards", "Pilot deck uses I:1/x addresses (not I:0/x)", async () => {
    const src = await readText("shared/lessonDecks/plc-io-troubleshooting.ts");
    return src.includes("I:1/2") && src.includes("I:1/5") && !src.match(/I:0\/\d/);
  });

  await check(3, "Slide Cards", "Pilot deck aligns O:2/0 motor output with conveyor lab", async () => {
    const deck = await readText("shared/lessonDecks/plc-io-troubleshooting.ts");
    const prog = await readText("client/src/lib/conveyorLab/conveyorProgram.ts");
    return deck.includes("O:2/0") && prog.includes('"O:2/0"');
  });

  await check(4, "Glossary", "Photoeye definition mentions NC interlock behavior", async () => {
    const src = await readText("shared/lessonGlossary.ts");
    return src.includes("NC interlock");
  });

  await check(5, "Electrical Symbols", "Symbol registry has audited entries", async () => {
    const src = await readText("shared/electricalSymbolRegistry.ts");
    return (src.match(/id:/g) ?? []).length >= 15;
  });

  await check(6, "Wiring Diagrams", "Conveyor wiring spec validates", async () => {
    const r = await run("pnpm", ["exec", "vitest", "run", "shared/wiringDiagramSpec.test.ts"], { CI: "1" });
    return r.code === 0;
  });

  await check(6.1, "Wiring Diagrams", "GS1 guard on wiring sheet and print summary", async () => {
    const wiring = await readText("shared/conveyorWiringDiagram.ts");
    const prints = await readText("shared/conveyorPrintPackage.ts");
    return (
      wiring.includes('label: "GS1"') &&
      wiring.includes("I:1/3") &&
      prints.includes("PLC-supervised 24 VDC") &&
      !prints.includes("120 VAC via E-stop")
    );
  });

  await check(6.2, "Slide Cards", "NPN/PNP and PowerFlex fault table diagram variants registered", async () => {
    const types = await readText("shared/learningCardTypes.ts");
    const visual = await readText("client/src/components/lessons/LessonCardVisual.tsx");
    return (
      types.includes('"npn-pnp-wiring"') &&
      types.includes('"powerflex-fault-table"') &&
      visual.includes("NpnPnpWiringDiagram") &&
      visual.includes("PowerFlexFaultTableDiagram")
    );
  });

  await check(7, "Conveyor Lab", "Field device NC mapping unit tests pass", async () => {
    const r = await run("pnpm", ["exec", "vitest", "run", "client/src/lib/conveyorLab/fieldDeviceModel.test.ts"], { CI: "1" });
    return r.code === 0;
  });

  await check(8, "Lesson Cards", "Card deck domain tests pass", async () => {
    const r = await run("pnpm", ["exec", "vitest", "run", "shared/lessonCardContent.test.ts"], { CI: "1" });
    return r.code === 0;
  });

  await check(9, "PowerFlex Lab", "Drive state unit tests pass", async () => {
    const r = await run("pnpm", ["exec", "vitest", "run", "client/src/lib/powerflexLab/driveState.test.ts"], { CI: "1" });
    return r.code === 0;
  });

  await check(10, "ILU / Hubs", "Hub ILU link tests pass", async () => {
    const r = await run("pnpm", ["exec", "vitest", "run", "shared/hubIlu.test.ts"], { CI: "1" });
    return r.code === 0;
  });

  const base = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
  await check(11, "Lesson Cards UI", "Pilot lesson browser QA", async () => {
    const r = await run("pnpm", ["exec", "tsx", "scripts/verify-lesson-cards-pilot.mjs"], { QA_BASE_URL: base });
    return r.code === 0;
  });

  await check(12, "Lesson Cards UI", "All card lessons browser QA", async () => {
    const r = await run("pnpm", ["exec", "tsx", "scripts/verify-all-card-lessons.mjs"], { QA_BASE_URL: base });
    return r.code === 0;
  });

  await check(13, "Slide Cards", "Cycle 8 diagram audit (top traffic lessons)", async () => {
    const r = await run("pnpm", ["exec", "tsx", "scripts/verify-cycle8.mjs"], { QA_BASE_URL: base });
    return r.code === 0;
  });

  const passed = results.filter((r) => r.pass).length;
  const report = {
    timestamp: new Date().toISOString(),
    base,
    summary: { passed, total: results.length },
    results,
  };
  await writeFile(path.join(OUT, "platform-domain.json"), JSON.stringify(report, null, 2));

  console.log("\n=== PLATFORM DOMAIN VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.area} — ${r.check}${r.detail ? ` (${r.detail})` : ""}`);
  }
  console.log(`\nSummary: ${passed}/${results.length} passed\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
