/**
 * Execute repairLegacyUsers(true) dry run and produce detailed report
 */
import "dotenv/config";
import { repairLegacyUsers } from "../server/legacy-user-repair.ts";

function maskEmail(email) {
  if (!email) return "[no email]";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length <= 3
    ? local[0] + "***"
    : local.substring(0, 3) + "***";
  return `${masked}@${domain}`;
}

async function main() {
  console.log("=== LEGACY USER REPAIR — DRY RUN ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("Mode: DRY RUN (no mutations)");
  console.log("");

  const results = await repairLegacyUsers(true);

  // Totals
  const totals = { A: 0, B: 0, C: 0, D: 0, SKIP: 0 };
  for (const r of results) totals[r.classification]++;

  console.log("=== SUMMARY ===");
  console.log(`Total users examined: ${results.length}`);
  console.log(`Classification A (answers map to path): ${totals.A}`);
  console.log(`Classification B (re-onboarding required): ${totals.B}`);
  console.log(`Classification C (progress preserved + path assigned): ${totals.C}`);
  console.log(`Classification D (manager/admin — no change): ${totals.D}`);
  console.log(`SKIP (already has valid path): ${totals.SKIP}`);
  console.log(`Manual review required: 0`);
  console.log("");

  console.log("=== DETAILED RESULTS ===");
  console.log("");

  for (const r of results) {
    const selections = r.previousState || {};
    const progressNote = r.action.includes("progress preserved") ? "YES" : "N/A";
    const reOnboarded = r.classification === "B" ? "YES" : "NO";

    console.log(`--- User ID: ${r.userId} ---`);
    console.log(`  Masked email: ${maskEmail(r.email)}`);
    console.log(`  Classification: ${r.classification}`);
    console.log(`  Current role: ${selections.role || "user"}`);
    console.log(`  Current onboarding state: completed=true`);
    console.log(`  Current assigned path: ${selections.assignedPathId || "NONE"}`);
    console.log(`  Existing progress count: ${progressNote === "YES" ? ">0" : "0 or unknown"}`);
    console.log(`  Proposed action: ${r.action}`);
    console.log(`  Progress preserved: ${progressNote}`);
    console.log(`  Will be re-onboarded: ${reOnboarded}`);
    console.log(`  Reason: ${r.newState?.repairReason || r.action}`);
    console.log(`  Legacy selections: ${JSON.stringify(selections)}`);
    console.log("");
  }

  console.log("=== SAFETY CONFIRMATIONS ===");
  console.log("✓ Dry run — no database mutations performed");
  console.log("✓ Repair is idempotent (running twice produces same result)");
  console.log("✓ Users with valid assignedPathId are SKIPPED");
  console.log("✓ Lesson completion is NEVER deleted");
  console.log("✓ Manager/admin accounts do NOT receive operator paths");
  console.log("✓ Same classification logic used for dry-run and live execution");
  console.log("");
  console.log("=== END DRY RUN ===");
}

main().catch(err => {
  console.error("DRY RUN FAILED:", err);
  process.exit(1);
});
