import { useState } from "react";
import { GUIDED_STEPS, getGuidedStepsForFault } from "@/lib/conveyorLab/faultCatalog";
import { getExplainWhy } from "@/lib/conveyorLab/explainWhy";
import type { DiagnosticStep, FaultId } from "@/lib/conveyorLab/types";

interface ConveyorGuidedPanelProps {
  currentStep: number;
  onAdvance: () => void;
  onRecordStep: (step: DiagnosticStep) => void;
  showHint: boolean;
  onToggleHint: () => void;
  activeFault?: FaultId;
}

export default function ConveyorGuidedPanel({
  currentStep,
  onAdvance,
  onRecordStep,
  showHint,
  onToggleHint,
  activeFault,
}: ConveyorGuidedPanelProps) {
  const steps = activeFault ? getGuidedStepsForFault(activeFault) : GUIDED_STEPS;
  const stepData = steps.find((s) => s.step === currentStep) ?? steps[0];
  const isLast = currentStep >= steps.length;
  const [showExplainWhy, setShowExplainWhy] = useState(false);

  const explainWhy = stepData ? getExplainWhy(stepData.check) : null;

  return (
    <div className="p-4 rounded-lg border border-[oklch(0.55_0.12_250/30%)] bg-[oklch(0.08_0.02_250/40%)]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] uppercase">
          Guided — Step {Math.min(currentStep, steps.length)} / {steps.length}
        </div>
        <div className="flex items-center gap-2">
          {!isLast && explainWhy && (
            <button
              type="button"
              onClick={() => setShowExplainWhy(!showExplainWhy)}
              className={`text-[10px] font-mono transition-colors ${
                showExplainWhy
                  ? "text-[oklch(0.75_0.12_155)]"
                  : "text-[oklch(0.45_0.006_250)] hover:text-[oklch(0.55_0.12_250)]"
              }`}
              title="Why does this step matter?"
            >
              {showExplainWhy ? "Hide why" : "Why?"}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleHint}
            className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] hover:underline"
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        </div>
      </div>

      {!isLast ? (
        <>
          <h4 className="text-sm font-medium text-white mb-1">{stepData.title}</h4>
          <p className="text-xs text-[oklch(0.60_0.008_250)] leading-relaxed mb-2">{stepData.instruction}</p>

          {showHint && (
            <p className="text-[11px] text-[oklch(0.55_0.12_250)] mb-3 italic">{stepData.hint}</p>
          )}

          {/* Explain Why Panel */}
          {showExplainWhy && explainWhy && (
            <div className="mb-3 p-3 rounded-md bg-[oklch(0.06_0.02_155/30%)] border border-[oklch(0.55_0.12_155/20%)]">
              <div className="text-[9px] font-mono text-[oklch(0.55_0.12_155)] uppercase mb-1.5">
                Why This Matters
              </div>
              <p className="text-[11px] text-[oklch(0.65_0.008_250)] leading-relaxed mb-2">
                {explainWhy.explanation}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-mono">
                <span className="text-[oklch(0.50_0.006_250)]">
                  Principle:{" "}
                  <span className="text-[oklch(0.65_0.12_155)]">{explainWhy.principle}</span>
                </span>
                {explainWhy.standardRef && (
                  <span className="text-[oklch(0.45_0.006_250)]">
                    Ref: {explainWhy.standardRef}
                  </span>
                )}
              </div>
              <a
                href={explainWhy.lessonLink}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-[oklch(0.75_0.12_250)] hover:underline"
                title={`Go to: ${explainWhy.lessonTitle}`}
              >
                <span>📖</span>
                <span>{explainWhy.lessonTitle}</span>
                <span className="text-[oklch(0.45_0.006_250)]">→</span>
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!isLast) {
                onRecordStep(stepData.check);
              }
              onAdvance();
              setShowExplainWhy(false);
            }}
            className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.55_0.12_250/50%)] text-[oklch(0.75_0.12_250)] hover:border-[oklch(0.55_0.12_250)]"
          >
            Next step →
          </button>
        </>
      ) : (
        <p className="text-xs text-[oklch(0.60_0.008_250)]">
          Guided steps complete. Submit your root-cause diagnosis below.
        </p>
      )}
    </div>
  );
}
