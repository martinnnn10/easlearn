/**
 * Package for Manus deploy (no node_modules, no secrets).
 * Includes production `dist/` when PACKAGE_INCLUDE_DIST=1 (default for full deploy).
 * Run: pnpm run package:deploy
 * Output: easlearn-deploy-final.zip at repo root + copy target in Downloads
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const STAGE = path.join(ROOT, ".deploy-stage");
const FULL_DEPLOY = process.argv.includes("--full") || process.env.PACKAGE_FULL === "1";
const OUT = path.join(ROOT, FULL_DEPLOY ? "easlearn-deploy-final.zip" : "easlearn-deploy.zip");
const INCLUDE_DIST = FULL_DEPLOY;

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".cursor",
  ".deploy-stage",
  ...(INCLUDE_DIST ? [] : ["dist"]),
  "qa-screenshots",
  "coverage",
  "dist-manus",
]);

const EXCLUDE_FILES = new Set([
  ".env",
  ".env.local",
  "easlearn-deploy.zip",
  "easlearn-deploy-final.zip",
  "easlearn-deploy-final.tar.gz",
]);

function copyRecursive(src, dest) {
  execSync(
    `powershell -NoProfile -Command "Copy-Item -Path '${src.replace(/'/g, "''")}' -Destination '${dest.replace(/'/g, "''")}' -Recurse -Force"`,
    { cwd: ROOT, stdio: "inherit" }
  );
}

function stageTree() {
  if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
  mkdirSync(STAGE, { recursive: true });

  const entries = execSync("powershell -NoProfile -Command \"Get-ChildItem -Name\"", {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean);

  for (const name of entries) {
    if (EXCLUDE_DIRS.has(name) || EXCLUDE_FILES.has(name)) continue;
    const src = path.join(ROOT, name);
    const dest = path.join(STAGE, name);
    copyRecursive(src, dest);
  }

  const deployNotes = path.join(STAGE, "DEPLOYMENT_NOTES.md");
  if (existsSync(deployNotes)) {
    execSync(
      `powershell -NoProfile -Command "Add-Content -Path '${deployNotes.replace(/'/g, "''")}' -Value '\\n## Card migration (June 2026)\\n- 31/31 ILU lessons are card-format decks in shared/lessonDecks\\n- Run verify:platform after deploy with dev server for browser QA\\n'"`
    );
  }
}

function zipStage() {
  if (existsSync(OUT)) rmSync(OUT, { force: true });
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${STAGE.replace(/'/g, "''")}\\*' -DestinationPath '${OUT.replace(/'/g, "''")}' -Force"`,
    { cwd: ROOT, stdio: "inherit" }
  );
}

console.log("Staging deploy package...");
stageTree();
console.log("Creating zip...");
zipStage();
rmSync(STAGE, { recursive: true, force: true });
const sizeMb = (execSync(`powershell -NoProfile -Command "(Get-Item '${OUT.replace(/'/g, "''")}').Length / 1MB"`, {
  encoding: "utf8",
}).trim());
console.log(`Done: ${OUT} (${sizeMb} MB)`);
