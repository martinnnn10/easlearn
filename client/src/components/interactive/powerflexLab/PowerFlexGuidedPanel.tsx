import { GUIDED_STEPS } from "@/lib/powerflexLab/faultCatalog";
import type { DiagnosticStep } from "@/lib/powerflexLab/types";

interface PowerFlexGuidedPanelProps {
  currentStep: number;
  onAdvance: () => void;
  onRecordStep: (step: DiagnosticStep) => void;
  showHint: boolean;
  onToggleHint: () => void;
}

export default function PowerFlexGuidedPanel({
  currentStep,
  onAdvance,
  onRecordStep,
  showHint,
  onToggleHint,
}: PowerFlexGuidedPanelProps) {
  const stepData = GUIDED_STEPS.find((s) => s.step === currentStep) ?? GUIDED_STEPS[0];
  const isLast = currentStep >= GUIDED_STEPS.length;

  return (
    <div className="p-4 rounded-lg border border-[oklch(0.55_0.12_250/30%)] bg-[oklch(0.08_0.02_250/40%)]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] uppercase">
          Guided — Step {Math.min(currentStep, GUIDED_STEPS.length)} / {GUIDED_STEPS.length}
        </div>
        <button type="button" onClick={onToggleHint} className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] hover:underline">
          {showHint ? "Hide hint" : "Show hint"}
        </button>
      </div>
      {!isLast ? (
        <>
          <h4 className="text-sm font-medium text-white mb-1">{stepData.title}</h4>
          <p className="text-xs text-[oklch(0.60_0.008_250)] leading-relaxed mb-2">{stepData.instruction}</p>
          {showHint && <p className="text-[11px] text-[oklch(0.55_0.12_250)] mb-3 italic">{stepData.hint}</p>}
          <button
            type="button"
            onClick={() => {
              onRecordStep(stepData.check);
              onAdvance();
            }}
            className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.55_0.12_250/50%)] text-[oklch(0.75_0.12_250)]"
          >
            Next step →
          </button>
        </>
      ) : (
        <p className="text-xs text-[oklch(0.60_0.008_250)]">Guided steps complete. Submit root-cause diagnosis below.</p>
      )}
    </div>
  );
}
