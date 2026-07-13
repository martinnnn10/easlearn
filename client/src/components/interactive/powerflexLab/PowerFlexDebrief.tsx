import type { LabScore, PowerFlexFault } from "@/lib/powerflexLab/types";

interface PowerFlexDebriefProps {
  fault: PowerFlexFault;
  score: LabScore;
  onRetry: () => void;
  onNextFault: () => void;
}

export default function PowerFlexDebrief({ fault, score, onRetry, onNextFault }: PowerFlexDebriefProps) {
  return (
    <div className="powerflex-debrief p-5 rounded-lg border border-[oklch(0.55_0.12_250/30%)] bg-[oklch(0.08_0.02_250/30%)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="text-base font-heading text-white">Diagnosis Complete</h4>
          <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
            {score.totalPercent >= 80
              ? "Solid VFD troubleshooting — systematic evidence collection."
              : score.totalPercent >= 50
                ? "Partial credit. Cross-check fault code, status monitor, and parameters."
                : "Keep practicing — match F-code to status values and parameter clues."}
          </p>
        </div>
        <div className="text-2xl font-mono font-bold text-[oklch(0.75_0.12_250)] shrink-0">{score.totalPercent}%</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-4 text-[11px] font-mono">
        <div className="px-3 py-2 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]">
          <span className="text-[oklch(0.45_0.006_250)]">First step: </span>
          <span className={score.firstStepCorrect ? "text-[oklch(0.75_0.12_250)]" : "text-[oklch(0.70_0.15_30)]"}>
            {score.firstStepCorrect ? "Correct" : "Missed"}
          </span>
        </div>
        <div className="px-3 py-2 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]">
          <span className="text-[oklch(0.45_0.006_250)]">Root cause: </span>
          <span className={score.rootCauseCorrect ? "text-[oklch(0.75_0.12_250)]" : "text-[oklch(0.70_0.15_30)]"}>
            {score.rootCauseCorrect ? "Correct" : "Incorrect"}
          </span>
        </div>
      </div>
      {score.coachingTips.length > 0 && (
        <ul className="text-[11px] text-[oklch(0.55_0.008_250)] space-y-1 list-disc list-inside mb-4">
          {score.coachingTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      <div className="p-3 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)] mb-4">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-1">Actual fault</div>
        <div className="text-sm text-white font-medium">
          {fault.faultCode} — {fault.label}
        </div>
        <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">{fault.rootCause}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRetry} className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.25_0.006_250)] text-[oklch(0.60_0.008_250)]">
          Retry same fault
        </button>
        <button type="button" onClick={onNextFault} className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.55_0.12_250/50%)] bg-[oklch(0.12_0.04_250)] text-[oklch(0.75_0.12_250)]">
          Next fault →
        </button>
      </div>
    </div>
  );
}
