/**
 * Maps completed lessons → skill domains and competency tags for manager reporting.
 * Lesson quiz pass + deck metadata tags feed workforce capability views.
 */
import type { SkillDomain } from "./competencyMatrix";
import { skillDomainForModule } from "./competencyMatrix";

export interface LessonCompetencySignal {
  moduleSlug: string;
  lessonSlug: string;
  domain: SkillDomain;
  tags: string[];
  managerSummary: string;
}

const SIGNALS: Record<string, LessonCompetencySignal> = {
  "safety-systems/risk-assessment": {
    moduleSlug: "safety-systems",
    lessonSlug: "risk-assessment",
    domain: "safety",
    tags: ["risk_assessment", "stored_energy", "hazard_identification", "loto_verification", "stop_and_escalate"],
    managerSummary: "Demonstrated before-touch risk assessment and stored-energy awareness",
  },
  "safety-systems/estop-circuits": {
    moduleSlug: "safety-systems",
    lessonSlug: "estop-circuits",
    domain: "safety",
    tags: ["estop_circuits", "safety_chain", "fail_safe_wiring"],
    managerSummary: "Can trace E-stop/guard safety chains and identify open devices",
  },
  "safety-systems/guarding-lockout": {
    moduleSlug: "safety-systems",
    lessonSlug: "guarding-lockout",
    domain: "safety",
    tags: ["loto", "guarding", "zero_energy_verification"],
    managerSummary: "Understands LOTO vs E-stop and guard interlock requirements",
  },
  "plc-fundamentals/io-troubleshooting": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "io-troubleshooting",
    domain: "plc",
    tags: ["plc_io", "input_troubleshooting", "ladder_logic_reading"],
    managerSummary: "Can diagnose stuck PLC inputs and trace field vs logic faults",
  },
  "powerflex-vfd/vfd-fundamentals": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "vfd-fundamentals",
    domain: "vfd",
    tags: ["vfd_fundamentals", "dc_bus_safety", "drive_parameters"],
    managerSummary: "Understands VFD operation, DC bus hazards, and basic fault response",
  },
  "motors-controls/motor-control-circuits": {
    moduleSlug: "motors-controls",
    lessonSlug: "motor-control-circuits",
    domain: "motors",
    tags: ["motor_starters", "three_wire_control", "overload_protection"],
    managerSummary: "Can read and troubleshoot three-wire motor control circuits",
  },
};

export function lessonCompetencyKey(moduleSlug: string, lessonSlug: string): string {
  return `${moduleSlug}/${lessonSlug}`;
}

export function getLessonCompetencySignal(
  moduleSlug: string,
  lessonSlug: string,
): LessonCompetencySignal | undefined {
  return SIGNALS[lessonCompetencyKey(moduleSlug, lessonSlug)];
}

export function getDomainForLesson(moduleSlug: string, _lessonSlug: string): SkillDomain {
  return skillDomainForModule(moduleSlug);
}
