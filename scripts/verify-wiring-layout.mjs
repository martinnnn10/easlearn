/**
 * Verify wiring diagram specs.
 * Run: node scripts/verify-wiring-layout.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, "verify-wiring-layout-runner.ts");

const result = spawnSync("pnpm", ["exec", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
