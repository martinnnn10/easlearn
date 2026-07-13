/**
 * P0 Electrical Standards — sync Print Reading lesson 90010 rail terminology in DB.
 * Run after deploy: node server/patch-p0-print-reading-rails.mjs
 *
 * Updates slug electrical-schematic-basics to match seed-new-tracks.mjs (Issue 4.1).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const OLD_RULES = `### The Rules

1. **Power flows left to right** — L1 (hot) on the left, L2 (neutral) on the right
2. **Read top to bottom** — Circuits are numbered by rung
3. **Contacts control coils** — Inputs (left side) control outputs (right side)
4. **Cross-references** — A coil on rung 5 may have contacts on rungs 12, 15, and 23
5. **Wire numbers** — Every wire has a unique number for identification

### Example: Basic Motor Start/Stop Circuit`;

const NEW_RULES = `### The Rules

1. **Power flows left to right** — Hot on the left rail, return on the right rail (see rail labels below)
2. **Read top to bottom** — Circuits are numbered by rung
3. **Contacts control coils** — Inputs (left side) control outputs (right side)
4. **Cross-references** — A coil on rung 5 may have contacts on rungs 12, 15, and 23
5. **Wire numbers** — Every wire has a unique number for identification

### Control circuit rails vs. three-phase power labels

On **120VAC motor control ladders** (most MCC buckets), prints typically use:

| Label on print | Meaning |
|--------------|---------|
| **L1**, **Line**, or **Wire 1** | Control hot (120VAC from the control transformer) |
| **N**, **Neutral**, or **Wire 2** | Control neutral / grounded leg (0V reference) |

On **480VAC three-phase power** single-line or power diagrams, **L1, L2, and L3 are phase conductors** — not neutral. A delta-connected 480V system has **no neutral**. Only wye systems (e.g., 480Y/277V) provide a grounded neutral conductor.

> **Field rule:** Read the drawing title and voltage note before assuming a rail label. **L2 on a control ladder is still wrong for neutral** — use **N** or **Wire 2** on 120V control prints. **L2 on a power diagram is a phase**, not the control return.

### Example: Basic Motor Start/Stop Circuit`;

const OLD_GLOSSARY_TAIL = `| **Wire number** | Unique identifier for each wire in the system |
\``;

const NEW_GLOSSARY_TAIL = `| **Wire number** | Unique identifier for each wire in the system |
| **Control hot (Wire 1)** | Left rail of a 120VAC control ladder — not the same as 480V line L1 unless the print says so |
| **Control neutral (Wire 2)** | Right rail return for 120VAC control — do not label this "L2" on control prints |
\``;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute(
    `SELECT id, content FROM course_lessons WHERE slug = 'electrical-schematic-basics' LIMIT 1`
  );
  if (!rows.length) {
    console.log("No lesson found for slug electrical-schematic-basics — skip");
    await conn.end();
    return;
  }
  let content = rows[0].content;
  if (!content.includes("L2 (neutral)")) {
    console.log("Lesson already patched or content differs — no L2 (neutral) rule found");
    await conn.end();
    return;
  }
  content = content.replace(OLD_RULES, NEW_RULES);
  content = content.replace(OLD_GLOSSARY_TAIL, NEW_GLOSSARY_TAIL);
  await conn.execute(
    `UPDATE course_lessons SET content = ?, updatedAt = NOW() WHERE id = ?`,
    [content, rows[0].id]
  );
  console.log(`Patched lesson id ${rows[0].id} (electrical-schematic-basics)`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
