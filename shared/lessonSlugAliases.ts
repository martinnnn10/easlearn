/**
 * Production DB lesson slugs → canonical card deck key (module/lesson).
 * Keeps card UI working when course_lessons.slug differs from ILU deck slugs.
 */
export const LESSON_CARD_DECK_ALIASES: Record<string, string> = {
  "sensors-instrumentation/proximity-sensors-photoeyes": "sensors-instrumentation/proximity-photoelectric",
  "sensors-instrumentation/analog-signals-4-20ma": "sensors-instrumentation/sensor-types-overview",
  "sensors-instrumentation/temperature-rtd-thermocouple": "sensors-instrumentation/temperature-pressure",
  "sensors-instrumentation/temperature-pressure-measurement": "sensors-instrumentation/temperature-pressure",
  "sensors-instrumentation/level-flow-measurement": "sensors-instrumentation/calibration-basics",
  "sensors-instrumentation/signal-conditioning-isolation": "sensors-instrumentation/loop-checkout",
  "safety-systems/machine-safety-fundamentals": "safety-systems/risk-assessment",
  "safety-systems/machine-risk-assessment-methodology": "safety-systems/risk-assessment",
  "safety-systems/safety-devices-wiring": "safety-systems/estop-circuits",
  "safety-systems/safety-plc-programming": "safety-systems/guarding-lockout",
  "print-reading/electrical-schematic-basics": "print-reading/ladder-diagram-conventions",
  "print-reading/panel-layout-wire-tracing": "print-reading/wiring-diagrams",
  "print-reading/control-panel-wiring-terminal-strips": "print-reading/wiring-diagrams",
  "print-reading/plc-io-wiring-address-mapping": "print-reading/wiring-diagrams",
  "print-reading/three-phase-power-prints": "print-reading/pid-symbols",
};

export function lessonDeckKey(moduleSlug: string, lessonSlug: string): string {
  return `${moduleSlug}/${lessonSlug}`;
}

export function resolveCardDeckKey(moduleSlug: string, lessonSlug: string): string {
  const direct = lessonDeckKey(moduleSlug, lessonSlug);
  return LESSON_CARD_DECK_ALIASES[direct] ?? direct;
}

/** DB slugs that should receive the same card stub as a canonical deck lesson */
export function dbSlugsForCanonicalDeck(moduleSlug: string, canonicalLessonSlug: string): string[] {
  const canonical = lessonDeckKey(moduleSlug, canonicalLessonSlug);
  const slugs = [canonicalLessonSlug];
  for (const [dbKey, deckKey] of Object.entries(LESSON_CARD_DECK_ALIASES)) {
    if (deckKey === canonical && dbKey.startsWith(`${moduleSlug}/`)) {
      slugs.push(dbKey.split("/")[1]!);
    }
  }
  return Array.from(new Set(slugs));
}
