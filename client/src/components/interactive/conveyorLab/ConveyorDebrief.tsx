import { getGuidedStepsForFault } from "@/lib/conveyorLab/faultCatalog";
import type { ConveyorFault, FaultId, FlagshipLabScore, LabMode } from "@/lib/conveyorLab/types";
import ConveyorDiagnosticReplay from "./ConveyorDiagnosticReplay";

interface ConveyorDebriefProps {
  fault: ConveyorFault;
  score: FlagshipLabScore;
  mode: LabMode;
  stepTimestamps: number[];
  stepHints: boolean[];
  activeFault: FaultId;
  onRetry: () => void;
  onNextFault: () => void;
  onHighlightRung?: (rungId: string | null) => void;
}

function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function getEfficiencyRating(totalMs: number, stepCount: number): { label: string; color: string } {
  const avgSec = totalMs / 1000 / stepCount;
  if (avgSec < 15) return { label: "Expert", color: "oklch(0.75 0.12 155)" };
  if (avgSec < 30) return { label: "Proficient", color: "oklch(0.65 0.12 155)" };
  if (avgSec < 60) return { label: "Developing", color: "oklch(0.65 0.12 80)" };
  return { label: "Novice", color: "oklch(0.65 0.12 30)" };
}

export default function ConveyorDebrief({
  fault,
  score,
  mode,
  stepTimestamps,
  stepHints,
  activeFault,
  onRetry,
  onNextFault,
  onHighlightRung,
}: ConveyorDebriefProps) {
  const guidedSteps = getGuidedStepsForFault(activeFault);
  const hasStepData = mode === "guided" && stepTimestamps.length > 1;

  // Calculate per-step durations
  const stepDurations: number[] = [];
  for (let i = 1; i < stepTimestamps.length; i++) {
    stepDurations.push(stepTimestamps[i] - stepTimestamps[i - 1]);
  }
  const totalDiagMs = stepTimestamps.length > 1 ? stepTimestamps[stepTimestamps.length - 1] - stepTimestamps[0] : 0;
  const stepsCompleted = stepDurations.length;
  const stepsSkipped = guidedSteps.length - stepsCompleted;
  const hintsUsedCount = stepHints.filter(Boolean).length;
  const efficiency = getEfficiencyRating(totalDiagMs, Math.max(stepsCompleted, 1));

  return (
    <div className="conveyor-debrief p-5 rounded-lg border border-[oklch(0.55_0.12_155/30%)] bg-[oklch(0.08_0.02_155/30%)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="text-base font-heading text-white">Diagnosis Complete</h4>
          <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
            {score.totalPercent >= 80
              ? "Solid troubleshooting — systematic approach with correct root cause."
              : score.totalPercent >= 50
              ? "Partial credit. Review evidence collection and first-check sequence."
              : "Keep practicing — compare I/O, ladder interlocks, and meter readings."}
          </p>
          <p className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] mt-1">
            Methodology: {score.methodologyTier} ({score.methodologyOverall}%)
          </p>
        </div>
        <div className="text-2xl font-mono font-bold text-[oklch(0.75_0.12_155)] shrink-0">
          {score.totalPercent}%
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4 text-[11px] font-mono">
        <div className="px-3 py-2 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]">
          <span className="text-[oklch(0.45_0.006_250)]">First step: </span>
          <span className={score.firstStepCorrect ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.70_0.15_30)]"}>
            {score.firstStepCorrect ? "Correct" : "Missed"}
          </span>
        </div>
        <div className="px-3 py-2 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]">
          <span className="text-[oklch(0.45_0.006_250)]">Root cause: </span>
          <span className={score.rootCauseCorrect ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.70_0.15_30)]"}>
            {score.rootCauseCorrect ? "Correct" : "Incorrect"}
          </span>
        </div>
        <div className="px-3 py-2 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]">
          <span className="text-[oklch(0.45_0.006_250)]">Time: </span>
          <span className="text-white">{Math.floor(score.timeSeconds / 60)}:{String(score.timeSeconds % 60).padStart(2, "0")}</span>
        </div>
        {score.safetyViolations.length > 0 && (
          <div className="px-3 py-2 rounded bg-[oklch(0.12_0.04_30)] border border-[oklch(0.55_0.15_30/50%)] text-[oklch(0.75_0.15_30)]">
            Safety: {score.safetyViolations.join(", ")}
          </div>
        )}
      </div>

      {/* Step-by-step timing summary (guided mode only) */}
      {hasStepData && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">
              Diagnostic Path — Step Timing
            </div>
            <div className="text-[10px] font-mono" style={{ color: efficiency.color }}>
              {efficiency.label}
            </div>
          </div>

          <div className="space-y-1.5">
            {guidedSteps.map((step, i) => {
              const completed = i < stepsCompleted;
              const duration = completed ? stepDurations[i] : null;
              const usedHint = i < stepHints.length && stepHints[i];

              return (
                <div
                  key={step.step}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-[10px] font-mono ${
                    completed
                      ? "bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]"
                      : "bg-[oklch(0.04_0.002_250)] border border-[oklch(0.10_0.003_250)] opacity-50"
                  }`}
                >
                  {/* Step number */}
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                      completed
                        ? "bg-[oklch(0.15_0.04_155)] text-[oklch(0.75_0.12_155)] border border-[oklch(0.55_0.12_155/50%)]"
                        : "bg-[oklch(0.10_0.003_250)] text-[oklch(0.35_0.006_250)] border border-[oklch(0.14_0.004_250)]"
                    }`}
                  >
                    {completed ? "✓" : step.step}
                  </div>

                  {/* Step title */}
                  <span className={`flex-1 truncate ${completed ? "text-[oklch(0.60_0.008_250)]" : "text-[oklch(0.35_0.006_250)]"}`}>
                    {step.title}
                  </span>

                  {/* Hint indicator */}
                  {usedHint && (
                    <span className="text-[oklch(0.55_0.12_250)] shrink-0" title="Hint used">
                      💡
                    </span>
                  )}

                  {/* Duration */}
                  {duration !== null ? (
                    <span
                      className={`shrink-0 tabular-nums ${
                        duration < 15000
                          ? "text-[oklch(0.65_0.12_155)]"
                          : duration < 45000
                          ? "text-[oklch(0.60_0.008_250)]"
                          : "text-[oklch(0.65_0.12_30)]"
                      }`}
                    >
                      {formatDuration(duration)}
                    </span>
                  ) : (
                    <span className="text-[oklch(0.35_0.006_250)] shrink-0">skipped</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="px-2 py-1.5 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)] text-center">
              <div className="text-[9px] text-[oklch(0.40_0.006_250)] uppercase">Steps</div>
              <div className="text-[11px] font-mono text-white">
                {stepsCompleted}/{guidedSteps.length}
              </div>
            </div>
            <div className="px-2 py-1.5 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)] text-center">
              <div className="text-[9px] text-[oklch(0.40_0.006_250)] uppercase">Hints</div>
              <div className="text-[11px] font-mono text-white">{hintsUsedCount}</div>
            </div>
            <div className="px-2 py-1.5 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)] text-center">
              <div className="text-[9px] text-[oklch(0.40_0.006_250)] uppercase">Diag Time</div>
              <div className="text-[11px] font-mono text-white">{formatDuration(totalDiagMs)}</div>
            </div>
          </div>

          {stepsSkipped > 0 && (
            <p className="mt-2 text-[10px] text-[oklch(0.55_0.12_30)] font-mono">
              {stepsSkipped} step{stepsSkipped > 1 ? "s" : ""} skipped — completing all steps builds stronger diagnostic habits.
            </p>
          )}

          {/* Diagnostic Replay */}
          <ConveyorDiagnosticReplay
            activeFault={activeFault}
            stepTimestamps={stepTimestamps}
            stepHints={stepHints}
            onHighlightRung={onHighlightRung}
          />
        </div>
      )}

      {score.dimensionLabels.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-2">Process scoring</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {score.dimensionLabels.slice(0, 6).map((d) => (
              <div key={d.label} className="px-2 py-1.5 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)]">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[oklch(0.50_0.006_250)] truncate pr-2">{d.label}</span>
                  <span className="text-white shrink-0">{d.score}/{d.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {score.coachingTips.length > 0 && (
        <div className="p-3 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)] mb-4">
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-1">Coaching</div>
          <ul className="text-[11px] text-[oklch(0.55_0.008_250)] space-y-1 list-disc list-inside">
            {score.coachingTips.slice(0, 3).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-3 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)] mb-4">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-1">Actual fault</div>
        <div className="text-sm text-white font-medium">{fault.label}</div>
        <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1 leading-relaxed">{fault.rootCause}</p>
        {fault.incorrectPaths.length > 0 && (
          <p className="text-[10px] text-[oklch(0.50_0.15_30)] mt-2">
            Avoid: {fault.incorrectPaths.join("; ")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.25_0.006_250)] text-[oklch(0.60_0.008_250)] hover:border-[oklch(0.40_0.006_250)]"
        >
          Retry same fault
        </button>
        <button
          type="button"
          onClick={onNextFault}
          className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.12_0.04_155)] text-[oklch(0.75_0.12_155)] hover:border-[oklch(0.55_0.12_155)]"
        >
          Next fault →
        </button>
      </div>
    </div>
  );
}
