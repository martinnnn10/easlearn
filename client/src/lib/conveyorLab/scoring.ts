import type { ConveyorFault, DiagnosticStep, LabScore } from "./types";

export function scoreDiagnosticAttempt(params: {
  fault: ConveyorFault;
  firstStep: DiagnosticStep | null;
  rootCauseId: string | null;
  timeSeconds: number;
  safetyViolations: string[];
}): LabScore {
  const { fault, firstStep, rootCauseId, timeSeconds, safetyViolations } = params;

  const firstStepCorrect = firstStep === fault.correctFirstStep;
  const rootCauseCorrect = rootCauseId === fault.id;

  let total = 0;
  if (firstStepCorrect) total += 35;
  if (rootCauseCorrect) total += 45;
  if (timeSeconds <= 120) total += 10;
  else if (timeSeconds <= 300) total += 5;
  if (safetyViolations.length === 0) total += 10;
  else total = Math.max(0, total - safetyViolations.length * 15);

  return {
    firstStepCorrect,
    toolUsed: firstStep,
    timeSeconds,
    rootCauseCorrect,
    safetyViolations,
    totalPercent: Math.min(100, total),
  };
}

export function normalizeRootCauseAnswer(answer: string): string {
  return answer.toLowerCase().trim().replace(/\s+/g, " ");
}

export function isRootCauseAcceptable(fault: ConveyorFault, answer: string): boolean {
  const normalized = normalizeRootCauseAnswer(answer);
  return fault.acceptableRootCauses.some((a) => normalized.includes(a));
}
