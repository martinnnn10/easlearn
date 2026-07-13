/**
 * Move first interaction card to index 2 (card 3) in each deck file.
 * Preserves original card source text (curatedChoiceMcq refs, etc.).
 * Run: pnpm exec tsx scripts/fix-kc-card-index.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSON_PRACTICE_MAP } from "../shared/lessonPracticeMap.ts";
import { isCardFormatLesson } from "../shared/lessonCardContent.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DECKS_DIR = path.join(__dirname, "..", "shared", "lessonDecks");

function parseCardBlocks(src) {
  const marker = "cards: [";
  const cardsStart = src.indexOf(marker);
  const cardsEnd = src.indexOf("\n  ],", cardsStart);
  if (cardsStart < 0 || cardsEnd < 0) return null;
  const inner = src.slice(cardsStart + marker.length, cardsEnd);
  const blocks = [];
  let i = 0;
  while (i < inner.length) {
    const start = inner.indexOf("\n    {", i);
    if (start === -1) break;
    const nextStart = inner.indexOf("\n    {", start + 1);
    const end = nextStart === -1 ? inner.length : nextStart;
    blocks.push(inner.slice(start, end));
    i = end;
  }
  return {
    before: src.slice(0, cardsStart),
    after: src.slice(cardsEnd),
    blocks,
  };
}

let fixed = 0;
for (const p of LESSON_PRACTICE_MAP) {
  for (const u of p.units) {
    if (!isCardFormatLesson(p.pathSlug, u.lessonSlug)) continue;
    const key = `${p.pathSlug}/${u.lessonSlug}`;
    const fileCandidates = [
      path.join(DECKS_DIR, `${u.lessonSlug}.ts`),
      path.join(DECKS_DIR, `plc-${u.lessonSlug}.ts`),
    ];
    const file = fileCandidates.find((f) => existsSync(f));
    if (!file) {
      console.warn(`No deck file for ${key}`);
      continue;
    }
  const src = readFileSync(file, "utf8");
  const parsed = parseCardBlocks(src);
  if (!parsed) {
    console.warn(`Skip parse ${key}`);
    continue;
  }
  const kcIdx = parsed.blocks.findIndex((b) => b.includes("kind: \"interaction\""));
  if (kcIdx === -1 || kcIdx === 2) continue;

  const blocks = [...parsed.blocks];
  const [kcBlock] = blocks.splice(kcIdx, 1);
  blocks.splice(2, 0, kcBlock);
  const newSrc = parsed.before + "cards: [" + blocks.join("") + parsed.after;
  writeFileSync(file, newSrc);
  console.log(`Fixed ${key}: KC card ${kcIdx + 1} → card 3`);
  fixed++;
  }
}
console.log(`Done. Fixed ${fixed} decks.`);
