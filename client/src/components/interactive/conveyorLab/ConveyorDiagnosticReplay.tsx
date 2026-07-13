import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGuidedStepsForFault } from "@/lib/conveyorLab/faultCatalog";
import type { FaultId, DiagnosticStep } from "@/lib/conveyorLab/types";

interface ConveyorDiagnosticReplayProps {
  activeFault: FaultId;
  stepTimestamps: number[];
  stepHints: boolean[];
  onHighlightRung?: (rungId: string | null) => void;
}

/**
 * Maps a DiagnosticStep to the rung it's most likely examining.
 * Used to highlight the relevant rung during replay.
 */
function stepToRungId(step: DiagnosticStep): string | null {
  switch (step) {
    case "check_estop":
    case "check_guard":
    case "check_start_stop":
      return "rung-1";
    case "check_ladder_rung_2":
      return "rung-2";
    case "check_overload":
    case "check_photoeye":
      return "rung-4";
    case "check_motor_output_vs_motion":
      return "rung-5";
    case "check_io_panel":
    case "review_prints":
    case "meter_measurement":
      return null;
    default:
      return null;
  }
}

function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function ConveyorDiagnosticReplay({
  activeFault,
  stepTimestamps,
  stepHints,
  onHighlightRung,
}: ConveyorDiagnosticReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentReplayStep, setCurrentReplayStep] = useState(-1);
  const guidedSteps = getGuidedStepsForFault(activeFault);
  const stepsCompleted = stepTimestamps.length - 1;

  const stepDurations: number[] = [];
  for (let i = 1; i < stepTimestamps.length; i++) {
    stepDurations.push(stepTimestamps[i] - stepTimestamps[i - 1]);
  }

  const startReplay = useCallback(() => {
    setIsPlaying(true);
    setCurrentReplayStep(0);
  }, []);

  const stopReplay = useCallback(() => {
    setIsPlaying(false);
    setCurrentReplayStep(-1);
    onHighlightRung?.(null);
  }, [onHighlightRung]);

  // Advance replay steps with timing
  useEffect(() => {
    if (!isPlaying || currentReplayStep < 0) return;

    if (currentReplayStep >= stepsCompleted) {
      // Replay finished
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentReplayStep(-1);
        onHighlightRung?.(null);
      }, 1500);
      return;
    }

    // Highlight the relevant rung for this step
    const step = guidedSteps[currentReplayStep];
    if (step) {
      const rungId = stepToRungId(step.check);
      onHighlightRung?.(rungId);
    }

    // Advance to next step after a proportional delay (compressed to 1.5s max per step)
    const realDuration = stepDurations[currentReplayStep] || 2000;
    const replayDelay = Math.min(realDuration * 0.3, 1500); // 30% of real time, max 1.5s

    const timer = setTimeout(() => {
      setCurrentReplayStep((s) => s + 1);
    }, replayDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentReplayStep, stepsCompleted, guidedSteps, stepDurations, onHighlightRung]);

  if (stepsCompleted < 1) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={isPlaying ? stopReplay : startReplay}
          className={`px-3 py-1.5 text-[10px] font-mono rounded-md border transition-colors ${
            isPlaying
              ? "border-[oklch(0.50_0.15_30/50%)] text-[oklch(0.70_0.15_30)] hover:border-[oklch(0.50_0.15_30)]"
              : "border-[oklch(0.55_0.12_250/50%)] text-[oklch(0.75_0.12_250)] hover:border-[oklch(0.55_0.12_250)]"
          }`}
        >
          {isPlaying ? "⏹ Stop" : "▶ Replay Path"}
        </button>
        {isPlaying && (
          <span className="text-[10px] font-mono text-[oklch(0.55_0.12_250)]">
            Step {Math.min(currentReplayStep + 1, stepsCompleted)} / {stepsCompleted}
          </span>
        )}
      </div>

      {/* Replay visualization */}
      <AnimatePresence mode="wait">
        {isPlaying && currentReplayStep >= 0 && currentReplayStep < stepsCompleted && (
          <motion.div
            key={currentReplayStep}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-2 rounded-md bg-[oklch(0.08_0.03_250)] border border-[oklch(0.55_0.12_250/30%)]"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[oklch(0.15_0.04_250)] border border-[oklch(0.55_0.12_250/50%)] flex items-center justify-center text-[9px] font-bold text-[oklch(0.75_0.12_250)]">
                {currentReplayStep + 1}
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-mono text-white">
                  {guidedSteps[currentReplayStep]?.title}
                </div>
                <div className="text-[9px] font-mono text-[oklch(0.45_0.006_250)] flex items-center gap-2 mt-0.5">
                  <span>{formatDuration(stepDurations[currentReplayStep])}</span>
                  {stepHints[currentReplayStep] && (
                    <span className="text-[oklch(0.55_0.12_250)]">used hint</span>
                  )}
                </div>
              </div>
              {/* Animated progress indicator */}
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.12_250)]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
        {isPlaying && currentReplayStep >= stepsCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-2 rounded-md bg-[oklch(0.08_0.03_155)] border border-[oklch(0.55_0.12_155/30%)] text-[11px] font-mono text-[oklch(0.75_0.12_155)]"
          >
            ✓ Replay complete — diagnosis submitted
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
