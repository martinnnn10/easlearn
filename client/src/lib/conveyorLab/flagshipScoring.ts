import type { ScenarioV3 } from "@/data/scenariosV3";
import {
  calculateMethodologyScore,
  type ActionLogEntry,
} from "@/lib/scoringEngine";
import type {
  ConveyorFault,
  DiagnosticEvent,
  DiagnosticStep,
  FlagshipLabScore,
  LabMode,
  MeterMode,
  MeterProbeId,
} from "./types";
import { scoreDiagnosticAttempt } from "./scoring";

const CONVEYOR_SCENARIO_STUB = {
  estimatedMinutes: { new: 15, experienced: 10, senior: 7 },
} as ScenarioV3;

function diagnosticStepLabel(step: DiagnosticStep): string {
  const labels: Record<DiagnosticStep, string> = {
    check_estop: "Checked E-stop circuit",
    check_guard: "Checked guard interlock switch",
    check_io_panel: "Reviewed PLC I/O panel",
    check_ladder_rung_2: "Traced safety interlock (Rung 2)",
    check_overload: "Checked overload contact",
    check_photoeye: "Checked photoeye sensor",
    check_motor_output_vs_motion: "Compared motor output vs belt motion",
    check_start_stop: "Checked start/stop pushbuttons",
    review_prints: "Reviewed print package",
    meter_measurement: "Took meter measurement",
  };
  return labels[step] ?? step;
}

export function getDiagnosticStepLabel(step: DiagnosticStep): string {
  return diagnosticStepLabel(step);
}

function eventToDiagnosticStep(event: DiagnosticEvent): DiagnosticStep | null {
  const d = event.description.toLowerCase();

  if (d.includes("print package")) return "review_prints";
  if (d.includes("reviewed plc i/o") || d.includes("i/o panel")) return "check_io_panel";
  if (d.includes("safety interlock") || d.includes("rung 2")) return "check_ladder_rung_2";
  if (d.includes("reset e-stop") || d.includes("at estop_nc")) return "check_estop";
  if (d.includes("guard") || d.includes("at guard_nc")) return "check_guard";
  if (d.includes("reset overload") || d.includes("at overload_nc")) return "check_overload";
  if (d.includes("at stop_nc") || d.includes("stop button")) return "check_start_stop";
  if (d.includes("at photoeye_signal")) return "check_photoeye";
  if (d.includes("at motor_coil") || d.includes("at contactor_aux")) return "check_motor_output_vs_motion";
  if (event.type === "measurement" && d.includes("meter")) return "meter_measurement";

  return null;
}

/** First meaningful diagnostic action from chronological event log */
export function deriveFirstStepFromEvents(events: DiagnosticEvent[]): DiagnosticStep | null {
  for (const event of events) {
    if (event.type === "action" && event.description === "Pressed START") continue;
    if (event.type === "action" && event.description === "Released STOP") continue;
    const step = eventToDiagnosticStep(event);
    if (step) return step;
  }
  return null;
}

export function eventsToActionLog(events: DiagnosticEvent[]): ActionLogEntry[] {
  return events.map((e) => {
    if (e.type === "measurement") {
      return {
        timestamp: e.timestamp,
        type: "measurement",
        tool: "multimeter",
        description: e.description,
        wasUseful: true,
      };
    }
    if (e.type === "action") {
      return {
        timestamp: e.timestamp,
        type: "action",
        description: e.description,
        wasUseful: true,
      };
    }
    if (e.type === "observation" && e.description.includes("print")) {
      return {
        timestamp: e.timestamp,
        type: "measurement",
        tool: "prints",
        description: e.description,
        wasUseful: true,
      };
    }
    return {
      timestamp: e.timestamp,
      type: "communication",
      description: e.description,
      wasUseful: true,
    };
  });
}

export function scoreConveyorAttempt(params: {
  fault: ConveyorFault;
  firstStep: DiagnosticStep | null;
  rootCauseId: string | null;
  timeSeconds: number;
  safetyViolations: string[];
  events: DiagnosticEvent[];
  hintsUsed: number;
  mode: LabMode;
  discoveredEvidence: string[];
}): FlagshipLabScore {
  const base = scoreDiagnosticAttempt({
    fault: params.fault,
    firstStep: params.firstStep,
    rootCauseId: params.rootCauseId,
    timeSeconds: params.timeSeconds,
    safetyViolations: params.safetyViolations,
  });

  const actions = eventsToActionLog(params.events);
  const methodology = calculateMethodologyScore({
    actions,
    discoveredClues: params.discoveredEvidence,
    hintsUsed: params.hintsUsed,
    timeSeconds: params.timeSeconds,
    faultsFixed: params.rootCauseId === params.fault.id ? 1 : 0,
    totalFaults: 1,
    role: "experienced",
    scenario: CONVEYOR_SCENARIO_STUB,
    consequenceLog: params.safetyViolations,
    communicationsUsed: [],
    playMode: params.mode === "guided" ? "guided" : params.mode === "practice" ? "minimal_hints" : "standard",
  });

  const correctnessWeight = 0.55;
  const processWeight = 0.45;
  const blended = Math.round(
    base.totalPercent * correctnessWeight +
      methodology.overallPercentage * processWeight
  );

  return {
    ...base,
    totalPercent: Math.min(100, blended),
    methodologyOverall: methodology.overallPercentage,
    methodologyTier: methodology.methodologyTier,
    dimensionLabels: methodology.dimensions.map((d) => ({
      label: d.label,
      score: d.score,
      max: d.maxScore,
    })),
    coachingTips: methodology.coachingTips,
  };
}

export function logDiagnosticStep(
  events: DiagnosticEvent[],
  step: DiagnosticStep
): DiagnosticEvent[] {
  return [
    ...events,
    {
      id: `step-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: diagnosticStepLabel(step),
    },
  ];
}

export function logMeterReading(
  events: DiagnosticEvent[],
  probe: MeterProbeId,
  mode: MeterMode,
  reading: string
): DiagnosticEvent[] {
  return [
    ...events,
    {
      id: `meter-${Date.now()}`,
      timestamp: Date.now(),
      type: "measurement",
      description: `Meter (${mode}) at ${probe}: ${reading}`,
    },
  ];
}

export function logPrintReview(events: DiagnosticEvent[]): DiagnosticEvent[] {
  if (events.some((e) => e.description.includes("print package"))) return events;
  return [
    ...events,
    {
      id: `prints-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: "Reviewed print package (ladder, wiring, device list)",
    },
  ];
}

export function logIoPanelReview(events: DiagnosticEvent[]): DiagnosticEvent[] {
  if (events.some((e) => e.description.includes("Reviewed PLC I/O"))) return events;
  return [
    ...events,
    {
      id: `io-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: "Reviewed PLC I/O panel",
    },
  ];
}
