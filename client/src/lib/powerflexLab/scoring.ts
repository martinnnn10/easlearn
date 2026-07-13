import type { DiagnosticEvent, DiagnosticStep, FaultId, LabMode, LabScore, PowerFlexFault } from "./types";
import { getFaultById } from "./faultCatalog";

function stepLabel(step: DiagnosticStep): string {
  const labels: Record<DiagnosticStep, string> = {
    check_fault_display: "Read fault display / HIM",
    check_fault_history: "Reviewed fault history",
    check_status_monitor: "Checked status monitor",
    check_parameters: "Browsed drive parameters",
    review_reference: "Reviewed VFD reference",
    clear_fault: "Cleared fault",
  };
  return labels[step] ?? step;
}

export function getDiagnosticStepLabel(step: DiagnosticStep): string {
  return stepLabel(step);
}

function eventToStep(event: DiagnosticEvent): DiagnosticStep | null {
  const d = event.description.toLowerCase();
  if (d.includes("fault history")) return "check_fault_history";
  if (d.includes("status monitor") || d.includes("status values")) return "check_status_monitor";
  if (d.includes("parameter")) return "check_parameters";
  if (d.includes("reference") || d.includes("standard")) return "review_reference";
  if (d.includes("fault display") || d.includes("him")) return "check_fault_display";
  return null;
}

export function deriveFirstStepFromEvents(events: DiagnosticEvent[]): DiagnosticStep | null {
  for (const event of events) {
    const step = eventToStep(event);
    if (step) return step;
  }
  return null;
}

export function scoreAttempt(args: {
  fault: PowerFlexFault;
  firstStep: DiagnosticStep | null;
  rootCauseId: FaultId | null;
  timeSeconds: number;
  events: DiagnosticEvent[];
  hintsUsed: number;
  mode: LabMode;
  discoveredEvidence: string[];
}): LabScore {
  const { fault, firstStep, rootCauseId, timeSeconds, hintsUsed, discoveredEvidence } = args;
  const rootCauseCorrect = rootCauseId === fault.id;
  const firstStepCorrect = firstStep === fault.correctFirstStep;
  const evidenceRatio =
    fault.evidence.length > 0
      ? discoveredEvidence.filter((e) => fault.evidence.includes(e)).length / fault.evidence.length
      : 0;

  let total = 0;
  if (rootCauseCorrect) total += 45;
  if (firstStepCorrect) total += 25;
  total += Math.round(evidenceRatio * 20);
  if (timeSeconds < 300) total += 10;
  total -= hintsUsed * 5;
  total = Math.max(0, Math.min(100, total));

  const coachingTips: string[] = [];
  if (!firstStepCorrect) {
    coachingTips.push(`Start with ${stepLabel(fault.correctFirstStep)} before changing components.`);
  }
  if (!rootCauseCorrect) {
    coachingTips.push(`Fault ${fault.faultCode}: ${fault.rootCause.slice(0, 120)}…`);
  }
  if (evidenceRatio < 0.5) {
    coachingTips.push("Collect more evidence from status monitor, parameters, and fault history.");
  }

  return {
    totalPercent: total,
    rootCauseCorrect,
    firstStepCorrect,
    timeSeconds,
    coachingTips,
    dimensionLabels: [
      { label: "Root cause", score: rootCauseCorrect ? 45 : 0, max: 45 },
      { label: "First check", score: firstStepCorrect ? 25 : 0, max: 25 },
      { label: "Evidence", score: Math.round(evidenceRatio * 20), max: 20 },
      { label: "Time bonus", score: timeSeconds < 300 ? 10 : 0, max: 10 },
    ],
  };
}

export function logFaultHistoryReview(events: DiagnosticEvent[]): DiagnosticEvent[] {
  if (events.some((e) => e.description.includes("fault history"))) return events;
  return [
    ...events,
    {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: "Reviewed fault history log",
    },
  ];
}

export function logStatusReview(events: DiagnosticEvent[]): DiagnosticEvent[] {
  if (events.some((e) => e.description.includes("status monitor"))) return events;
  return [
    ...events,
    {
      id: `stat-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: "Checked status monitor values",
    },
  ];
}

export function logParameterBrowse(events: DiagnosticEvent[]): DiagnosticEvent[] {
  if (events.some((e) => e.description.includes("Browsed parameters"))) return events;
  return [
    ...events,
    {
      id: `param-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: "Browsed drive parameters",
    },
  ];
}

export function logReferenceReview(events: DiagnosticEvent[]): DiagnosticEvent[] {
  if (events.some((e) => e.description.includes("VFD reference"))) return events;
  return [
    ...events,
    {
      id: `ref-${Date.now()}`,
      timestamp: Date.now(),
      type: "observation",
      description: "Reviewed VFD reference standard",
    },
  ];
}

export function getFaultForScoring(id: FaultId): PowerFlexFault | undefined {
  return getFaultById(id);
}
