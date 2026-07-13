import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ViewStandardReferenceButton from "@/components/standards/ViewStandardReferenceButton";
import { CONVEYOR_RUNGS } from "@/lib/conveyorLab/conveyorProgram";
import { getElementPasses, getRungOutputActive } from "@/lib/conveyorLab/plcScanEngine";
import { getInstructionDescription } from "@/lib/conveyorLab/instructionDescriptions";
import type { PlcState } from "@/lib/conveyorLab/types";
import { ConveyorLadderSymbol } from "./ConveyorLadderSymbol";
import InstructionDescriptionPanel from "./InstructionDescriptionPanel";

interface ConveyorLadderPanelProps {
  plc: PlcState;
  highlightRung?: string | null;
}

function symbolIdForElement(address: string, type: "XIC" | "XIO"): string {
  if (address === "I:1/2") return "estop";
  if (address === "I:1/4") return "overload_heater";
  if (address === "I:1/5") return "photoeye";
  if (type === "XIC") return "contact_no";
  return "contact_nc";
}

/**
 * RSLogix 500/Studio 5000 color constants.
 */
const RSLOGIX_GREEN = "oklch(0.62 0.17 145)";
const RSLOGIX_GREEN_DIM = "oklch(0.35 0.08 145)";
const RSLOGIX_GRAY = "oklch(0.30 0.006 250)";
const RSLOGIX_GREEN_BG = "oklch(0.20 0.06 145)";
const RSLOGIX_RED_FAULT = "oklch(0.45 0.15 30)";

/**
 * PowerFlowWire — RSLogix-style wire segment.
 */
function PowerFlowWire({ energized, width = "w-3" }: { energized: boolean; width?: string }) {
  return (
    <div className={`${width} h-[2px] relative overflow-hidden`}>
      <div
        className="absolute inset-0 transition-colors duration-200"
        style={{ backgroundColor: energized ? RSLOGIX_GREEN : RSLOGIX_GRAY }}
      />
      {energized && (
        <motion.div
          className="absolute inset-y-0 w-2 rounded-full opacity-60"
          style={{ backgroundColor: RSLOGIX_GREEN }}
          animate={{ left: ["-8px", "100%"] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </div>
  );
}

/**
 * PowerRail — vertical bar representing L1 (left) or L2/N (right).
 */
function PowerRail({ rungActive }: { rungActive: boolean }) {
  return (
    <div
      className="w-[3px] h-10 rounded-sm transition-colors duration-200 relative overflow-hidden"
      style={{
        backgroundColor: rungActive ? RSLOGIX_GREEN : RSLOGIX_GREEN_DIM,
        boxShadow: rungActive ? `0 0 6px ${RSLOGIX_GREEN}` : "none",
      }}
    >
      {rungActive && (
        <motion.div
          className="absolute inset-x-0 h-2 rounded-full opacity-50"
          style={{ backgroundColor: RSLOGIX_GREEN }}
          animate={{ top: ["100%", "-8px"] }}
          transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

/** Selected element state for the instruction panel */
interface SelectedElement {
  address: string;
  type: "XIC" | "XIO" | "OTE" | "TON";
  rungId: string;
  elementIndex: number;
}

export default function ConveyorLadderPanel({ plc, highlightRung }: ConveyorLadderPanelProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  // Close panel on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedElement(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleElementClick = useCallback((address: string, type: "XIC" | "XIO" | "OTE" | "TON", rungId: string, elementIndex: number) => {
    setSelectedElement((prev) => {
      // Toggle off if clicking the exact same instance
      if (prev && prev.rungId === rungId && prev.elementIndex === elementIndex) return null;
      return { address, type, rungId, elementIndex };
    });
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedElement(null);
  }, []);

  // Get instruction description for selected element
  const selectedInstruction = selectedElement
    ? getInstructionDescription(selectedElement.address, selectedElement.type)
    : null;

  // Get current bit state and pass state for selected element
  const selectedBitState = selectedElement
    ? getElementBitState(selectedElement, plc)
    : false;
  const selectedPasses = selectedElement
    ? (selectedElement.type === "XIC" || selectedElement.type === "OTE" || selectedElement.type === "TON"
        ? selectedBitState
        : !selectedBitState)
    : false;

  return (
    <div className="conveyor-lab-panel h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[oklch(0.14_0.004_250)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
            PLC Logic — Ladder
          </h4>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.12_0.02_145)] text-[oklch(0.55_0.10_145)] border border-[oklch(0.25_0.06_145)]">
            RSLogix Online
          </span>
          <ViewStandardReferenceButton symbolId="plc_output" />
        </div>
        <span className="text-[10px] font-mono text-[oklch(0.40_0.006_250)]">
          Scan: {plc.scanCount}
        </span>
      </div>

      {/* Legend — RSLogix color key */}
      <div className="px-4 py-2 border-b border-[oklch(0.12_0.003_250)] flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: RSLOGIX_GREEN }} />
          <span className="text-[9px] font-mono text-[oklch(0.50_0.006_250)]">Passing / Energized</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: RSLOGIX_GRAY }} />
          <span className="text-[9px] font-mono text-[oklch(0.50_0.006_250)]">Not Passing / De-energized</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[2px] rounded-sm" style={{ backgroundColor: RSLOGIX_GREEN }} />
          <span className="text-[9px] font-mono text-[oklch(0.50_0.006_250)]">Power Flow</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {CONVEYOR_RUNGS.map((rung) => {
          const outputActive = getRungOutputActive(rung, plc);
          const emphasized = highlightRung === rung.id;

          return (
            <div key={rung.id}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{rung.label}</span>
              </div>
              <div
                className={`relative p-3 rounded-lg border transition-colors ${
                  emphasized ? "ring-1 ring-[oklch(0.55_0.12_250)]" : ""
                }`}
                style={{
                  backgroundColor: outputActive ? RSLOGIX_GREEN_BG : "oklch(0.06 0.003 250)",
                  borderColor: outputActive
                    ? "oklch(0.40 0.10 145 / 40%)"
                    : "oklch(0.14 0.004 250)",
                }}
              >
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {/* Left power rail (L1) */}
                  <PowerRail rungActive={outputActive} />

                  {/* Wire from left rail to first element */}
                  <PowerFlowWire energized={true} />

                  {rung.elements.map((el, i) => {
                    const passes = getElementPasses(el, plc);
                    const powerReaches = i === 0 || rung.elements.slice(0, i).every((e) => getElementPasses(e, plc));
                    const pathOk = rung.elements.slice(0, i + 1).every((e) => getElementPasses(e, plc));
                    const symId = symbolIdForElement(el.address, el.type);
                    // Exact instance match (the one that was clicked)
                    const isSelected = selectedElement?.rungId === rung.id && selectedElement?.elementIndex === i;
                    // Highlight ALL other instances of the same address when panel is open
                    const isHighlighted = !isSelected && selectedElement?.address === el.address;

                    return (
                      <div key={i} className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleElementClick(el.address, el.type, rung.id, i)}
                          className={`relative px-1.5 py-1 rounded border text-center min-w-[72px] transition-all duration-200 cursor-pointer hover:brightness-125 ${
                            isSelected
                              ? "ring-2 ring-[oklch(0.60_0.14_250)] ring-offset-1 ring-offset-[oklch(0.06_0.003_250)]"
                              : isHighlighted
                                ? "ring-2 ring-[oklch(0.70_0.15_85)] ring-offset-1 ring-offset-[oklch(0.06_0.003_250)] animate-pulse"
                                : ""
                          }`}
                          style={{
                            backgroundColor: passes
                              ? "oklch(0.14 0.04 145)"
                              : "oklch(0.08 0.01 250)",
                            borderColor: passes
                              ? RSLOGIX_GREEN
                              : powerReaches && !passes
                                ? RSLOGIX_RED_FAULT
                                : RSLOGIX_GRAY,
                            boxShadow: isSelected
                              ? "0 0 12px oklch(0.50 0.14 250)"
                              : isHighlighted
                                ? "0 0 10px oklch(0.60 0.15 85), inset 0 0 4px oklch(0.25 0.08 85)"
                                : powerReaches && !passes
                                  ? `0 0 6px ${RSLOGIX_RED_FAULT}, inset 0 0 4px oklch(0.20 0.06 30)`
                                  : passes
                                    ? `0 0 4px oklch(0.30 0.08 145)`
                                    : "none",
                          }}
                          title="Click to view instruction details"
                          aria-label={`View details for ${el.type} ${el.address} ${el.label}`}
                        >
                          {el.isCrossRef && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[oklch(0.55_0.12_250)]" title="Cross-referenced" />
                          )}
                          {/* Instruction type label */}
                          <div
                            className="text-[8px] font-mono font-bold text-center leading-none mb-0.5"
                            style={{
                              color: passes ? RSLOGIX_GREEN : RSLOGIX_GRAY,
                            }}
                          >
                            {el.type}
                          </div>
                          {/* Symbol */}
                          <div className="flex justify-center">
                            <ConveyorLadderSymbol kind={el.type} active={passes} />
                          </div>
                          {/* Address */}
                          <div className="diag-text-xs font-mono" style={{ color: "oklch(0.45 0.006 250)" }}>
                            {el.address}
                          </div>
                          {/* Nickname/label */}
                          <div className="diag-text-xs font-mono" style={{ color: passes ? "oklch(0.60 0.10 145)" : "oklch(0.45 0.006 250)" }}>
                            {el.label}
                          </div>
                          {/* Bit state indicator */}
                          <div
                            className="text-[7px] font-mono mt-0.5 text-center"
                            style={{ color: passes ? RSLOGIX_GREEN : "oklch(0.40 0.006 250)" }}
                          >
                            {passes ? "TRUE ✓" : "FALSE"}
                          </div>
                          <div className="mt-0.5">
                            <ViewStandardReferenceButton symbolId={symId} className="!text-[8px] !px-1 !py-0" />
                          </div>
                        </button>
                        {/* Wire segment after this element */}
                        {i < rung.elements.length - 1 && (
                          <PowerFlowWire energized={pathOk} />
                        )}
                      </div>
                    );
                  })}

                  {/* Wire from last element to output */}
                  <PowerFlowWire energized={outputActive} />

                  {/* Output coil/timer */}
                  {(() => {
                    const outputType = rung.output.type === "timer_on" ? "TON" as const : "OTE" as const;
                    const isOutputSelected = selectedElement?.rungId === rung.id && selectedElement?.elementIndex === -1;
                    const outputHighlighted = !isOutputSelected && selectedElement?.address === rung.output.address;
                    return (
                  <button
                    onClick={() => handleElementClick(rung.output.address, outputType, rung.id, -1)}
                    className={`px-1.5 py-1 rounded-full border text-center min-w-[72px] shrink-0 transition-all duration-200 cursor-pointer hover:brightness-125 ${
                      isOutputSelected
                        ? "ring-2 ring-[oklch(0.60_0.14_250)] ring-offset-1 ring-offset-[oklch(0.06_0.003_250)]"
                        : outputHighlighted
                          ? "ring-2 ring-[oklch(0.70_0.15_85)] ring-offset-1 ring-offset-[oklch(0.06_0.003_250)] animate-pulse"
                          : ""
                    }`}
                    style={{
                      backgroundColor: outputActive
                        ? "oklch(0.16 0.05 145)"
                        : "oklch(0.08 0.003 250)",
                      borderColor: outputActive ? RSLOGIX_GREEN : RSLOGIX_GRAY,
                      boxShadow: isOutputSelected
                        ? "0 0 12px oklch(0.50 0.14 250), inset 0 0 4px oklch(0.20 0.06 250)"
                        : outputHighlighted
                          ? "0 0 10px oklch(0.60 0.15 85), inset 0 0 4px oklch(0.25 0.08 85)"
                          : outputActive
                            ? `0 0 8px oklch(0.40 0.12 145 / 40%)`
                            : "none",
                    }}
                  >
                    <div className="flex justify-center">
                      <ConveyorLadderSymbol
                        kind={rung.output.type === "timer_on" ? "timer" : "coil"}
                        active={outputActive}
                      />
                    </div>
                    <div className="diag-text-xs font-mono" style={{ color: "oklch(0.45 0.006 250)" }}>
                      {rung.output.address}
                    </div>
                    <div
                      className="diag-text-xs font-mono"
                      style={{ color: outputActive ? RSLOGIX_GREEN : "oklch(0.45 0.006 250)" }}
                    >
                      {rung.output.label}
                    </div>
                    <div
                      className="text-[7px] font-mono mt-0.5 text-center"
                      style={{ color: outputActive ? RSLOGIX_GREEN : "oklch(0.40 0.006 250)" }}
                    >
                      {outputActive ? "ENERGIZED ✓" : "DE-ENERGIZED"}
                    </div>
                    <div className="mt-0.5">
                      {rung.output.type !== "timer_on" && (
                        <ViewStandardReferenceButton symbolId="coil" className="!text-[8px] !px-1 !py-0" />
                      )}
                    </div>
                  </button>
                    );
                  })()}

                  {/* Wire from output to right rail */}
                  <PowerFlowWire energized={outputActive} />

                  {/* Right power rail (L2/N) */}
                  <PowerRail rungActive={outputActive} />
                </div>

                {/* Timer progress bar */}
                {rung.output.type === "timer_on" && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[oklch(0.10_0.003_250)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: RSLOGIX_GREEN }}
                        animate={{
                          width: `${((plc.timers[rung.output.address]?.accumulated || 0) / (plc.timers[rung.output.address]?.preset || 3)) * 100}%`,
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className="diag-text-xs font-mono text-[oklch(0.45_0.006_250)]">
                      {(plc.timers[rung.output.address]?.accumulated || 0).toFixed(1)}s / {plc.timers[rung.output.address]?.preset || 3}s
                      {plc.timers[rung.output.address]?.done && " ✓ DN"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instruction Description Panel — bottom drawer */}
      <InstructionDescriptionPanel
        instruction={selectedInstruction}
        bitState={selectedBitState}
        passes={selectedPasses}
        onClose={handleClosePanel}
      />
    </div>
  );
}

/**
 * Helper: get the raw bit state for an element's address.
 */
function getElementBitState(
  el: { type: "XIC" | "XIO" | "OTE" | "TON"; address: string },
  plc: PlcState
): boolean {
  const { inputs, internals, outputs, timers } = plc;
  const addr = el.address;
  if (addr.startsWith("I:")) return inputs[addr] ?? false;
  if (addr.startsWith("B3:")) return internals[addr] ?? false;
  if (addr.startsWith("O:")) return outputs[addr] ?? false;
  if (addr === "T4:0/DN") return timers["T4:0"]?.done ?? false;
  if (addr === "T4:0") return timers["T4:0"]?.running ?? false;
  return false;
}
