import { describe, expect, it } from "vitest";
import {
  ELECTRICAL_SYMBOL_REGISTRY,
  getSymbolById,
  getSymbolsByCategory,
  searchSymbols,
  LEARNER_SYMBOL_GROUPS,
  getLearnerGroups,
} from "./electricalSymbolRegistry";

const PHOTOEYE_ALIASES = [
  "photoeye",
  "photoelectric sensor",
  "PE",
  "retroreflective",
  "diffuse",
  "through-beam",
  "sensor input",
];

describe("electricalSymbolRegistry — photoeye", () => {
  it("registers photoeye in instrumentation category", () => {
    const entry = getSymbolById("photoeye");
    expect(entry).toBeDefined();
    expect(entry?.category).toBe("instrumentation");
    expect(entry?.primitive).toBe("DiagramPhotoeye");
  });

  it("includes all required search aliases", () => {
    const entry = getSymbolById("photoeye");
    expect(entry?.aliases).toEqual(expect.arrayContaining(PHOTOEYE_ALIASES));
    for (const alias of PHOTOEYE_ALIASES) {
      const results = searchSymbols(alias);
      expect(results.some((r) => r.id === "photoeye")).toBe(true);
    }
  });

  it("documents industrial applications and wiring notes", () => {
    const entry = getSymbolById("photoeye");
    expect(entry?.industrialApplications?.length).toBeGreaterThanOrEqual(4);
    expect(entry?.wiringNotes).toMatch(/PNP/i);
    expect(entry?.wiringNotes).toMatch(/24\s*VDC/i);
    expect(entry?.wiringNotes).toMatch(/I:1\/5/);
    expect(entry?.wiringNotes).toMatch(/NC/i);
  });

  it("links to Conveyor lab and sensor lessons", () => {
    const entry = getSymbolById("photoeye");
    expect(entry?.relatedSimulatorIds).toContain("conveyor-plc-lab");
    expect(entry?.relatedLabIds).toContain("conveyor-plc-lab");
    expect(entry?.relatedLessonSlugs).toContain("proximity-photoelectric");
    expect(entry?.relatedLessonSlugs).toContain("io-troubleshooting");
  });

  it("declares DiagramPhotoeye primitive name", () => {
    const entry = getSymbolById("photoeye");
    expect(entry?.primitive).toBe("DiagramPhotoeye");
  });
});

describe("electricalSymbolRegistry — integrity", () => {
  it("has unique registry IDs", () => {
    const ids = ELECTRICAL_SYMBOL_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns a primitive name to every registry entry", () => {
    for (const entry of ELECTRICAL_SYMBOL_REGISTRY) {
      expect(entry.primitive).toMatch(/^Diagram[A-Z]/);
    }
  });

  it("lists photoeye under instrumentation", () => {
    const instrumentation = getSymbolsByCategory("instrumentation");
    expect(instrumentation.some((e) => e.id === "photoeye")).toBe(true);
  });
});

describe("electricalSymbolRegistry — learner groups", () => {
  it("exposes exactly 6 learner-facing groups", () => {
    expect(LEARNER_SYMBOL_GROUPS.length).toBe(6);
  });

  it("covers every symbol exactly once across the groups", () => {
    const grouped = LEARNER_SYMBOL_GROUPS.flatMap((g) => g.symbolIds);
    const registryIds = ELECTRICAL_SYMBOL_REGISTRY.map((e) => e.id);
    expect(new Set(grouped).size).toBe(grouped.length); // no symbol in two groups
    expect([...grouped].sort()).toEqual([...registryIds].sort()); // no omissions / extras
  });

  it("resolves each group id to its registry entries", () => {
    for (const g of getLearnerGroups()) {
      const src = LEARNER_SYMBOL_GROUPS.find((x) => x.id === g.id)!;
      expect(g.symbols.map((s) => s.id)).toEqual(src.symbolIds);
    }
  });
});
