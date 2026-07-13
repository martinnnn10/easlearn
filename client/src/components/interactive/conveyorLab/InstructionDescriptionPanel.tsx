/**
 * InstructionDescriptionPanel — RSLogix-style element detail panel.
 *
 * Opens when a user clicks any XIC/XIO element in the ladder display.
 * Shows: instruction name, address, field device description, wiring type,
 * why this instruction is used, and a link to the relevant course lesson.
 *
 * Matches the dark industrial glass aesthetic of the Conveyor PLC Lab.
 */

import { AnimatePresence, motion } from "framer-motion";
import { X, BookOpen, Zap, AlertTriangle, ArrowRight, Cable } from "lucide-react";
import { Link } from "wouter";
import type { InstructionDescription } from "@/lib/conveyorLab/instructionDescriptions";

interface InstructionDescriptionPanelProps {
  instruction: InstructionDescription | null;
  bitState: boolean;
  passes: boolean;
  onClose: () => void;
}

export default function InstructionDescriptionPanel({
  instruction,
  bitState,
  passes,
  onClose,
}: InstructionDescriptionPanelProps) {
  return (
    <AnimatePresence>
      {instruction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="border-t border-[oklch(0.20_0.006_250)] bg-[oklch(0.07_0.005_250)] shadow-2xl max-h-[50%] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[oklch(0.14_0.004_250)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: passes
                    ? "oklch(0.62 0.17 145)"
                    : "oklch(0.45 0.15 30)",
                }}
              />
              <span className="text-xs font-mono font-bold text-[oklch(0.75_0.006_250)] truncate">
                {instruction.instructionType} — {instruction.address}
              </span>
              {instruction.wiringType && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0"
                  style={{
                    backgroundColor: instruction.wiringType === "NC"
                      ? "oklch(0.15 0.04 250)"
                      : "oklch(0.15 0.04 145)",
                    color: instruction.wiringType === "NC"
                      ? "oklch(0.60 0.10 250)"
                      : "oklch(0.60 0.10 145)",
                    border: `1px solid ${instruction.wiringType === "NC" ? "oklch(0.25 0.06 250)" : "oklch(0.25 0.06 145)"}`,
                  }}
                >
                  {instruction.wiringType}
                </span>
              )}
              {(instruction.instructionType === "OTE" || instruction.instructionType === "TON") && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0"
                  style={{
                    backgroundColor: "oklch(0.15 0.04 145)",
                    color: "oklch(0.60 0.10 145)",
                    border: "1px solid oklch(0.25 0.06 145)",
                  }}
                >
                  OUTPUT
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[oklch(0.15_0.006_250)] text-[oklch(0.50_0.006_250)] hover:text-[oklch(0.75_0.006_250)] transition-colors shrink-0"
              aria-label="Close instruction panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Device Name */}
            <div>
              <h3 className="text-sm font-semibold text-[oklch(0.85_0.006_250)] mb-1">
                {instruction.deviceName}
              </h3>
              <p className="text-xs text-[oklch(0.55_0.006_250)] leading-relaxed">
                {instruction.deviceDescription}
              </p>
            </div>

            {/* Current State Indicator */}
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: passes
                  ? "oklch(0.12 0.04 145)"
                  : "oklch(0.10 0.03 30)",
                borderColor: passes
                  ? "oklch(0.30 0.08 145)"
                  : "oklch(0.25 0.06 30)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5" style={{ color: passes ? "oklch(0.62 0.17 145)" : "oklch(0.50 0.12 30)" }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: passes ? "oklch(0.62 0.17 145)" : "oklch(0.50 0.12 30)" }}>
                  Current State
                </span>
              </div>
              <div className="text-xs text-[oklch(0.70_0.006_250)] leading-relaxed">
                <span className="font-mono font-bold" style={{ color: passes ? "oklch(0.62 0.17 145)" : "oklch(0.50 0.12 30)" }}>
                  {instruction.instructionType === "OTE" || instruction.instructionType === "TON"
                    ? `Output = ${bitState ? "ON (1)" : "OFF (0)"}`
                    : `Bit = ${bitState ? "TRUE (1)" : "FALSE (0)"}`}
                </span>
                {" → "}
                <span className="font-bold" style={{ color: passes ? "oklch(0.62 0.17 145)" : "oklch(0.50 0.12 30)" }}>
                  {instruction.instructionType === "OTE" || instruction.instructionType === "TON"
                    ? (passes ? "ENERGIZED ✓" : "DE-ENERGIZED ✗")
                    : (passes ? "PASSING ✓" : "NOT PASSING ✗")}
                </span>
              </div>
            </div>

            {/* Why This Instruction */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Cable className="w-3.5 h-3.5 text-[oklch(0.55_0.10_250)]" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.55_0.10_250)]">
                  Why {instruction.instructionType === "OTE" ? "OTE (Output Energize)" : instruction.instructionType === "TON" ? "TON (Timer On-Delay)" : instruction.instructionType} is Used Here
                </span>
              </div>
              <p className="text-xs text-[oklch(0.65_0.006_250)] leading-relaxed">
                {instruction.whyUsed}
              </p>
            </div>

            {/* When Passes / When Fails */}
            <div className="space-y-3">
              <div className="p-2.5 rounded border border-[oklch(0.20_0.04_145)] bg-[oklch(0.09_0.02_145)]">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowRight className="w-3 h-3 text-[oklch(0.55_0.10_145)]" />
                  <span className="text-[9px] font-mono uppercase text-[oklch(0.55_0.10_145)]">
                    {instruction.instructionType === "OTE" || instruction.instructionType === "TON" ? "When Energized" : "When Passing"}
                  </span>
                </div>
                <p className="text-[11px] text-[oklch(0.60_0.006_250)] leading-relaxed">
                  {instruction.whenPasses}
                </p>
              </div>

              <div className="p-2.5 rounded border border-[oklch(0.20_0.04_30)] bg-[oklch(0.09_0.02_30)]">
                <div className="flex items-center gap-1.5 mb-1">
                  <X className="w-3 h-3 text-[oklch(0.50_0.10_30)]" />
                  <span className="text-[9px] font-mono uppercase text-[oklch(0.50_0.10_30)]">
                    {instruction.instructionType === "OTE" || instruction.instructionType === "TON" ? "When De-Energized" : "When Not Passing"}
                  </span>
                </div>
                <p className="text-[11px] text-[oklch(0.60_0.006_250)] leading-relaxed">
                  {instruction.whenFails}
                </p>
              </div>
            </div>

            {/* Common Failure */}
            <div className="p-3 rounded-lg border border-[oklch(0.20_0.04_60)] bg-[oklch(0.09_0.02_60)]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.60_0.12_60)]" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.60_0.12_60)]">
                  Common Plant-Floor Failure
                </span>
              </div>
              <p className="text-xs text-[oklch(0.60_0.006_250)] leading-relaxed">
                {instruction.commonFailure}
              </p>
            </div>

            {/* Learn More Link */}
            <Link
              href={`/courses/${instruction.lessonSlug}`}
              className="flex items-center gap-2 p-3 rounded-lg border border-[oklch(0.20_0.04_250)] bg-[oklch(0.09_0.02_250)] hover:bg-[oklch(0.12_0.03_250)] transition-colors group"
            >
              <BookOpen className="w-4 h-4 text-[oklch(0.55_0.10_250)] group-hover:text-[oklch(0.65_0.12_250)] transition-colors" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono uppercase text-[oklch(0.45_0.006_250)]">
                  Related Lesson
                </div>
                <div className="text-xs text-[oklch(0.65_0.006_250)] group-hover:text-[oklch(0.75_0.006_250)] transition-colors truncate">
                  {instruction.lessonTitle}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[oklch(0.40_0.006_250)] group-hover:text-[oklch(0.60_0.006_250)] ml-auto shrink-0 transition-colors" />
            </Link>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-[oklch(0.14_0.004_250)] shrink-0">
            <p className="text-[9px] font-mono text-[oklch(0.35_0.006_250)] text-center">
              Click another element or press Esc to close
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
