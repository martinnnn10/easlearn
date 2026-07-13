import type { LessonCardDeck } from "./learningCardTypes";
import { PLC_IO_TROUBLESHOOTING_DECK } from "./lessonDecks/plc-io-troubleshooting";
import { REFRIGERATION_CYCLE_DECK } from "./lessonDecks/refrigeration-cycle";
import { VFD_FUNDAMENTALS_DECK } from "./lessonDecks/vfd-fundamentals";
import { ELECTRICAL_SAFETY_LOTO_DECK } from "./lessonDecks/electrical-safety-lockout";
import { MOTOR_CONTROL_CIRCUITS_DECK } from "./lessonDecks/motor-control-circuits";
import { PLC_ARCHITECTURE_DECK } from "./lessonDecks/plc-architecture";
import { LADDER_LOGIC_BASICS_DECK } from "./lessonDecks/ladder-logic-basics";
import { TIMERS_COUNTERS_DECK } from "./lessonDecks/timers-counters";
import { COMMUNICATION_FAULTS_DECK } from "./lessonDecks/communication-faults";
import { PROGRAM_TROUBLESHOOTING_DECK } from "./lessonDecks/program-troubleshooting";
import { POWERFLEX_PARAMETER_GROUPS_DECK } from "./lessonDecks/powerflex-parameter-groups";
import { BASIC_PROGRAMMING_DECK } from "./lessonDecks/basic-programming";
import { FAULT_CODES_DIAGNOSTICS_DECK } from "./lessonDecks/fault-codes-diagnostics";
import { COMMON_FAILURES_DECK } from "./lessonDecks/common-failures";
import { ADVANCED_FEATURES_DECK } from "./lessonDecks/advanced-features";
import { MOTOR_THEORY_DECK } from "./lessonDecks/motor-theory";
import { STARTER_TROUBLESHOOTING_DECK } from "./lessonDecks/starter-troubleshooting";
import { OVERLOAD_PROTECTION_DECK } from "./lessonDecks/overload-protection";
import { SINGLE_THREE_PHASE_DECK } from "./lessonDecks/single-three-phase";
import { MOTOR_TESTING_DECK } from "./lessonDecks/motor-testing";
import { SENSOR_TYPES_OVERVIEW_DECK } from "./lessonDecks/sensor-types-overview";
import { PROXIMITY_PHOTOELECTRIC_DECK } from "./lessonDecks/proximity-photoelectric";
import { TEMPERATURE_PRESSURE_DECK } from "./lessonDecks/temperature-pressure";
import { CALIBRATION_BASICS_DECK } from "./lessonDecks/calibration-basics";
import { LOOP_CHECKOUT_DECK } from "./lessonDecks/loop-checkout";
import { RISK_ASSESSMENT_DECK } from "./lessonDecks/risk-assessment";
import { ESTOP_CIRCUITS_DECK } from "./lessonDecks/estop-circuits";
import { GUARDING_LOCKOUT_DECK } from "./lessonDecks/guarding-lockout";
import { LADDER_DIAGRAM_CONVENTIONS_DECK } from "./lessonDecks/ladder-diagram-conventions";
import { WIRING_DIAGRAMS_DECK } from "./lessonDecks/wiring-diagrams";
import { PID_SYMBOLS_DECK } from "./lessonDecks/pid-symbols";
import { OHMS_LAW_POWER_DECK } from "./lessonDecks/ohms-law-power";
import { METERS_MEASUREMENTS_DECK } from "./lessonDecks/meters-measurements";
import { SERIES_PARALLEL_CIRCUITS_DECK } from "./lessonDecks/series-parallel-circuits";
import { AC_DC_THEORY_DECK } from "./lessonDecks/ac-dc-theory";
import { KIRCHHOFFS_LAWS_DECK } from "./lessonDecks/kirchhoffs-laws";
import { getLessonUnit } from "./lessonPracticeMap";
import { resolveCardDeckKey } from "./lessonSlugAliases";
import { PUBLISHED_DECKS } from "./lessonDecks/_published.generated";

export { resolveCardDeckKey, LESSON_CARD_DECK_ALIASES } from "./lessonSlugAliases";

const STATIC_DECKS: Record<string, LessonCardDeck> = {
  "plc-fundamentals/io-troubleshooting": PLC_IO_TROUBLESHOOTING_DECK,
  "plc-fundamentals/plc-architecture": PLC_ARCHITECTURE_DECK,
  "plc-fundamentals/ladder-logic-basics": LADDER_LOGIC_BASICS_DECK,
  "plc-fundamentals/timers-counters": TIMERS_COUNTERS_DECK,
  "plc-fundamentals/communication-faults": COMMUNICATION_FAULTS_DECK,
  "plc-fundamentals/program-troubleshooting": PROGRAM_TROUBLESHOOTING_DECK,
  "powerflex-vfd/vfd-fundamentals": VFD_FUNDAMENTALS_DECK,
  "powerflex-vfd/powerflex-parameter-groups": POWERFLEX_PARAMETER_GROUPS_DECK,
  "powerflex-vfd/basic-programming": BASIC_PROGRAMMING_DECK,
  "powerflex-vfd/fault-codes-diagnostics": FAULT_CODES_DIAGNOSTICS_DECK,
  "powerflex-vfd/common-failures": COMMON_FAILURES_DECK,
  "powerflex-vfd/advanced-features": ADVANCED_FEATURES_DECK,
  "electrical-fundamentals/electrical-safety-lockout": ELECTRICAL_SAFETY_LOTO_DECK,
  "electrical-fundamentals/ohms-law-power": OHMS_LAW_POWER_DECK,
  "electrical-fundamentals/meters-measurements": METERS_MEASUREMENTS_DECK,
  "electrical-fundamentals/series-parallel-circuits": SERIES_PARALLEL_CIRCUITS_DECK,
  "electrical-fundamentals/ac-dc-theory": AC_DC_THEORY_DECK,
  "electrical-fundamentals/kirchhoffs-laws": KIRCHHOFFS_LAWS_DECK,
  "motors-controls/motor-theory": MOTOR_THEORY_DECK,
  "motors-controls/motor-control-circuits": MOTOR_CONTROL_CIRCUITS_DECK,
  "motors-controls/starter-troubleshooting": STARTER_TROUBLESHOOTING_DECK,
  "motors-controls/overload-protection": OVERLOAD_PROTECTION_DECK,
  "motors-controls/single-three-phase": SINGLE_THREE_PHASE_DECK,
  "motors-controls/motor-testing": MOTOR_TESTING_DECK,
  "sensors-instrumentation/sensor-types-overview": SENSOR_TYPES_OVERVIEW_DECK,
  "sensors-instrumentation/proximity-photoelectric": PROXIMITY_PHOTOELECTRIC_DECK,
  "sensors-instrumentation/temperature-pressure": TEMPERATURE_PRESSURE_DECK,
  "sensors-instrumentation/calibration-basics": CALIBRATION_BASICS_DECK,
  "sensors-instrumentation/loop-checkout": LOOP_CHECKOUT_DECK,
  "safety-systems/risk-assessment": RISK_ASSESSMENT_DECK,
  "safety-systems/estop-circuits": ESTOP_CIRCUITS_DECK,
  "safety-systems/guarding-lockout": GUARDING_LOCKOUT_DECK,
  "print-reading/ladder-diagram-conventions": LADDER_DIAGRAM_CONVENTIONS_DECK,
  "print-reading/wiring-diagrams": WIRING_DIAGRAMS_DECK,
  "print-reading/pid-symbols": PID_SYMBOLS_DECK,
  "hvac-fundamentals/refrigeration-cycle": REFRIGERATION_CYCLE_DECK,
};

/**
 * Effective deck registry: hand-authored static decks, overridden by any deck
 * published through the Authoring Studio (materialized into _published.generated.ts
 * by `pnpm db:export-decks`). Published drafts win on key collision.
 */
export const DECKS: Record<string, LessonCardDeck> = { ...STATIC_DECKS, ...PUBLISHED_DECKS };

export function lessonDeckKey(moduleSlug: string, lessonSlug: string): string {
  return `${moduleSlug}/${lessonSlug}`;
}

export function getLessonCardDeck(
  moduleSlug: string,
  lessonSlug: string
): LessonCardDeck | undefined {
  return DECKS[resolveCardDeckKey(moduleSlug, lessonSlug)];
}

export function isCardFormatLesson(moduleSlug: string, lessonSlug: string): boolean {
  const deckKey = resolveCardDeckKey(moduleSlug, lessonSlug);
  const deck = DECKS[deckKey];
  if (!deck) return false;
  const [mod, slug] = deckKey.split("/");
  const unit = getLessonUnit(mod, slug);
  return unit?.lessonFormat === "cards";
}

export function getPreviewCards(deck: LessonCardDeck): LessonCardDeck["cards"] {
  return deck.cards.slice(0, deck.previewCardCount);
}

export function getCardFormatLessonCount(): number {
  return Object.keys(DECKS).filter((key) => {
    const [moduleSlug, lessonSlug] = key.split("/");
    return isCardFormatLesson(moduleSlug, lessonSlug);
  }).length;
}
