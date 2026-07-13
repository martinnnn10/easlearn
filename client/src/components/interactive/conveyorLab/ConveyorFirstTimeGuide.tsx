import { useEffect, useLayoutEffect, useState } from "react";
import {
  CONVEYOR_GUIDE_STEPS,
  type ConveyorGuideStepId,
} from "@/lib/conveyorLab/conveyorOrientation";

interface ConveyorFirstTimeGuideProps {
  stepIndex: number;
  onStepChange: (index: number) => void;
  onPanelChange?: (panel: "machine" | "ladder" | "diagnostics" | "actions") => void;
  onSkip: () => void;
  onComplete: () => void;
}

function findTarget(id: ConveyorGuideStepId): HTMLElement | null {
  return document.querySelector(`[data-conveyor-guide="${id}"]`);
}

export default function ConveyorFirstTimeGuide({
  stepIndex,
  onStepChange,
  onPanelChange,
  onSkip,
  onComplete,
}: ConveyorFirstTimeGuideProps) {
  const step = CONVEYOR_GUIDE_STEPS[stepIndex];
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!step) return;
    if (step.mobilePanel && onPanelChange) {
      onPanelChange(step.mobilePanel);
    }
    const update = () => {
      const el = findTarget(step.id);
      setRect(el?.getBoundingClientRect() ?? null);
    };
    const t = window.setTimeout(update, 120);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step, stepIndex, onPanelChange]);

  useEffect(() => {
    if (!step) onComplete();
  }, [step, onComplete]);

  if (!step) return null;

  const isLast = stepIndex >= CONVEYOR_GUIDE_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none" aria-live="polite">
      <div className="absolute inset-0 bg-[oklch(0.04_0.003_250/75%)] pointer-events-auto" />

      {rect && (
        <div
          className="absolute rounded-lg border-2 border-[oklch(0.65_0.12_155)] shadow-[0_0_0_9999px_oklch(0.04_0.003_250/75%)] pointer-events-none transition-all duration-200"
          style={{
            top: Math.max(8, rect.top - 4),
            left: Math.max(8, rect.left - 4),
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      <div
        className="absolute left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm pointer-events-auto"
        style={{
          top: rect ? Math.min(rect.bottom + 12, window.innerHeight - 220) : "50%",
          transform: rect ? undefined : "translateY(-50%)",
        }}
      >
        <div className="rounded-lg border border-[oklch(0.22_0.006_250)] bg-[oklch(0.10_0.003_250)] p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.50_0.008_250)]">
              Step {stepIndex + 1} of {CONVEYOR_GUIDE_STEPS.length}
            </span>
            <button
              type="button"
              onClick={onSkip}
              className="text-[10px] font-mono text-[oklch(0.50_0.008_250)] hover:text-white underline"
            >
              Skip tour
            </button>
          </div>
          <h3 className="text-sm font-heading text-white mb-1">{step.title}</h3>
          <p className="text-xs text-[oklch(0.62_0.008_250)] leading-relaxed mb-4">{step.body}</p>
          <button
            type="button"
            onClick={() => (isLast ? onComplete() : onStepChange(stepIndex + 1))}
            className="w-full px-3 py-2.5 min-h-[2.75rem] text-xs font-mono rounded border border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.14_0.05_155)] text-[oklch(0.82_0.12_155)]"
          >
            {isLast ? "Got it — start diagnosing" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
