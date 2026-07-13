# Lesson Card Diagram Standard

Reference for all future card-format lesson conversions. Diagrams live in `client/src/components/lessons/LessonCardVisual.tsx`; decks reference them via `visual: { type: "diagram", variant: "..." }` in `shared/lessonDecks/`.

---

## 1. When to add a diagram vs text card

| Legacy content signal | Required treatment |
|----------------------|-------------------|
| Says **"as shown"**, **"see diagram"**, or describes **spatial/flow** relationships | **Flow or schematic diagram** (SVG) |
| Gives a **table of values** (pressures, temps, fault codes, I/O addresses) | **SVG field reference table** |
| Describes a **process loop** (refrigeration, scan cycle, motor starter chain) | **Labeled flow diagram** with direction arrows |

If none of the above apply, a **text + callout** card is sufficient.

---

## 2. Diagram types in `LessonCardVisual`

| Variant | One-line use |
|---------|----------------|
| `io-terminal` | PLC input/output terminal mapping for conveyor or packaging line |
| `nc-chain` | NC safety device chain (E-stop, overload → PLC input) |
| `photoeye-loop` | Photoeye blocked / stuck-on field symptom |
| `refrigeration-cycle` | Four-component refrigeration loop with high/low side color |
| `refrigeration-pt-table` | R-410A pressure–saturation field reference (manifold gauges) |
| `vfd-stages` | Rectifier → DC bus → inverter power stages |
| `scan-cycle` | PLC scan phases (input → logic → output → housekeeping) |
| `motor-starter-chain` | Series control circuit (fuse, E-stop, OL, stop, start, coil) |
| `ladder-seal-in` | ControlLogix seal-in rung — XIC permissives, parallel aux, OTE coil |
| `timer-ton-block` | TON instruction block — EN, PRE, ACC, .DN relationship |
| `ethernet-ip-topology` | PLC → Stratix switch → remote I/O → PowerFlex IP chain |
| `npn-pnp-wiring` | PNP vs NPN 3-wire sensor to sinking/sourcing PLC inputs |
| `powerflex-fault-table` | PowerFlex F004/F006/F012 field reference — first checks before reset |

Add a new variant only when an existing type cannot represent the content; keep SVGs inline in `LessonCardVisual.tsx`.

---

## 3. SVG standards

### Typography
- **Minimum 13px** font size for all labels and table cells (mobile legibility).
- Use `system-ui, sans-serif` for prose labels; `monospace` for I/O addresses and numeric columns.

### Touch / tap targets
- Zoom +/- controls (when enabled): **44px minimum** (`min-h-11 min-w-11`).

### Color — use CSS variables (defined in `client/src/index.css`)

| Role | Variable |
|------|----------|
| High-side / warm (discharge, condenser) | `--color-diagram-high-side`, `--color-diagram-high-side-dim` |
| Low-side / cool (evaporator, suction) | `--color-diagram-low-side`, `--color-diagram-low-side-dim` |
| Safety / warning | `--color-diagram-safety` |
| Neutral / labels | `--color-diagram-neutral` |
| Platform accent (flow arrows) | `--color-eas-green` |

Do **not** hardcode hex in new diagrams. Reference `var(--color-...)`.

### Flow diagrams
- Arrow markers must indicate **correct process direction**.
- Return / suction paths may use **dashed** strokes on low-side color.
- Distinguish high-side vs low-side with **stroke/fill color**, not text alone.
- Each major component: **title + one-line function subtitle**.

---

## 4. Field reference tables

- Render as **SVG** (not HTML `<table>`) inside `lesson-diagram-block`.
- **Maximum 6 data rows** (+ header) for 375px readability.
- **3-column layout** typical: measured value | converted value | state/note.
- **Color-code rows** by operating region (e.g. blue = low-side, red = high-side).
- **Caption required** in `<figcaption>` — field-use instruction (e.g. *"Use this table with your manifold gauges"*).

---

## 5. Verification checklist (per new diagram)

- [ ] Renders at **375px** without horizontal overflow (`overflow-auto` wrapper OK for zoom)
- [ ] All text ≥ 13px
- [ ] Colors use CSS variables
- [ ] Screenshot captured in `qa-screenshots/cycleN/` for audit trail
- [ ] Deck card references correct `variant` string in `learningCardTypes.ts`

---

## Reference implementation

**Refrigeration Cycle** (`shared/lessonDecks/refrigeration-cycle.ts`):

- Card 2 → `refrigeration-cycle` (vertical loop, high/low side, subtitles)
- Card 8 → `refrigeration-pt-table` (R-410A P-T field table)

See Cycle 7 QA screenshots: `qa-screenshots/cycle7/refrig-card2.png`, `refrig-card8.png`.
