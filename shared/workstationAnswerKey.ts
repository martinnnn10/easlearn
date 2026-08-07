/**
 * Motor Control Workstation — server-side answer key + event vocabulary.
 *
 * The server derives diagnosis/corrective-action correctness from PERSISTED
 * diagnostic events plus this key — never from client-supplied booleans.
 * Keep in sync with client/src/lib/workstationScenarios.ts (ids are stable).
 */

export const WORKSTATION_VERSION = "1.1";

/** Every diagnostic event type the workstation may persist (append-only timeline). */
export const WORKSTATION_EVENT_TYPES = [
  "scenario_observed",
  "component_selected",
  "schematic_item_selected",
  "hypothesis_created",
  "hypothesis_status_changed",
  "meter_function_selected",
  "test_points_selected",
  "measurement_predicted",
  "measurement_performed",
  "measurement_interpreted",
  "unsafe_action_attempted",
  "unsafe_action_blocked",
  "corrective_action_selected",
  "repair_verification_performed",
  "diagnosis_submitted",
  "closeout_submitted",
  "workstation_completed",
] as const;
export type WorkstationEventType = (typeof WORKSTATION_EVENT_TYPES)[number];

/** Event types that MUST be persisted before an attempt may complete (fail-closed gate). */
export const REQUIRED_COMPLETION_EVENTS: WorkstationEventType[] = [
  "measurement_performed",
  "diagnosis_submitted",
  "corrective_action_selected",
  "repair_verification_performed",
  "closeout_submitted",
];

export interface WorkstationScenarioKey {
  scenarioId: string;
  scenarioVersion: string;
  /** Stable id of the hypothesis that is the true root cause (scoped to this scenario). */
  correctHypothesisId: string;
  /** Human label of the correct root cause — for reports/replay, not for matching. */
  correctHypothesisText: string;
  /** The corrective action this scenario's fix represents. */
  correctiveActionLabel: string;
}

export const WORKSTATION_ANSWER_KEYS: Record<string, WorkstationScenarioKey> = {
  overload_tripped: {
    scenarioId: "overload_tripped",
    scenarioVersion: "1.0",
    correctHypothesisId: "h1",
    correctHypothesisText: "Overload relay tripped due to excessive current draw",
    correctiveActionLabel: "Reset Overload Relay",
  },
  output_on_motor_dead: {
    scenarioId: "output_on_motor_dead",
    scenarioVersion: "1.0",
    correctHypothesisId: "h7",
    correctHypothesisText:
      "Contactor coil energizes but power contacts fail to close (mechanical)",
    correctiveActionLabel: "Replace Contactor / Repair Mechanical Fault",
  },
};

export function getAnswerKey(scenarioId: string): WorkstationScenarioKey | undefined {
  return WORKSTATION_ANSWER_KEYS[scenarioId];
}

/** Map a validated competency to its Assessment Spine domain (fixes blanket "motors"). */
export const COMPETENCY_TO_DOMAIN: Record<string, string> = {
  motor_control_troubleshooting: "motors",
  electrical_diagnostic_method: "electrical",
  meter_usage: "electrical",
  plc_output_verification: "plc",
  safety_judgment: "safety",
  root_cause_explanation: "troubleshooting",
  repair_verification: "motors",
  work_order_documentation: "integration",
};

/** Shape persisted in workstation_attempts.machineState for resume. */
export interface WorkstationSavedState {
  savedAtVersion: string;
  scenarioId: string;
  tests: Array<{
    id: string;
    probe: string;
    probeLabel: string;
    mode: string;
    reading: string;
    timestamp: number;
    interpretation: string;
  }>;
  hypotheses: Array<{ id: string; text: string; status: string; zone: string }>;
  unsafeAttempts: string[];
  safetyOk: boolean;
  selectedProbe: string;
  meterMode: string;
  lastReading: string | null;
  measuredOutputVoltage: string | null;
  correctiveActionApplied: boolean;
  diagnosisSubmitted: boolean;
  closeoutSubmitted: boolean;
}
