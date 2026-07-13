/**
 * LiveMachineIndicators — Real-time PLC values, runtime counters, and process state displays
 * Renders as a compact industrial-style data strip within the simulator panels
 */
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SystemState, ScenarioV3 } from "../data/scenariosV3";

interface LiveIndicatorProps {
  scenario: ScenarioV3;
  currentSystemState: SystemState | undefined;
  faultsFixed: number;
  timer: number;
  discoveredClues: Set<string>;
}

type PlcValueMap = Record<string, { value: string; unit: string; status: "normal" | "warning" | "fault" }>;

// Simulated PLC tag values that change over time based on system state.
function usePLCValues(currentSystemState: SystemState | undefined, faultsFixed: number, timer: number): PlcValueMap {
  // Keep the live timer in a ref so the refresh interval can read it WITHOUT the
  // effect (and its interval) tearing down every second — that constant rebuild
  // was causing the values to jump and the "0 TAGS" flicker.
  const timerRef = useRef(timer);
  timerRef.current = timer;

  const compute = useCallback((): PlcValueMap => {
    const isFaulted =
      currentSystemState?.description?.toLowerCase().includes("fault") ||
      currentSystemState?.description?.toLowerCase().includes("tripped");
    const isPartial = faultsFixed > 0;
    const jitter = (base: number, range: number) => (base + (Math.random() - 0.5) * range).toFixed(1);
    const t = timerRef.current;
    return {
      MOTOR_SPEED: { value: isFaulted ? "0" : isPartial ? jitter(1200, 50) : jitter(1780, 20), unit: "RPM", status: isFaulted ? "fault" : "normal" },
      VFD_FREQ: { value: isFaulted ? "0.0" : isPartial ? jitter(40, 2) : jitter(59.8, 0.4), unit: "Hz", status: isFaulted ? "fault" : "normal" },
      DC_BUS_V: { value: isFaulted ? jitter(50, 30) : jitter(650, 8), unit: "VDC", status: isFaulted ? "fault" : parseFloat(jitter(650, 8)) < 600 ? "warning" : "normal" },
      MOTOR_AMPS: { value: isFaulted ? "0.0" : isPartial ? jitter(8.5, 1.5) : jitter(12.3, 0.8), unit: "A", status: isFaulted ? "fault" : parseFloat(jitter(12.3, 0.8)) > 14 ? "warning" : "normal" },
      CONV_SPEED: { value: isFaulted ? "0" : isPartial ? jitter(45, 5) : jitter(72, 3), unit: "FPM", status: isFaulted ? "fault" : "normal" },
      RUNTIME: { value: formatRuntime(t), unit: "", status: t > 600 ? "warning" : "normal" },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSystemState, faultsFixed]);

  // Lazy initial value → the panel is NEVER empty (no "0 TAGS" flash).
  const [values, setValues] = useState<PlcValueMap>(() => compute());

  useEffect(() => {
    setValues(compute());
    const id = setInterval(() => setValues(compute()), 1500);
    return () => clearInterval(id);
  }, [compute]);

  return values;
}

function formatRuntime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const statusColors = {
  normal: { text: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/15", dot: "bg-emerald-500" },
  warning: { text: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/15", dot: "bg-amber-500" },
  fault: { text: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/15", dot: "bg-red-500" },
};

// Compact horizontal strip of live PLC values — fits in panel headers or footers
export function PLCValueStrip({ scenario, currentSystemState, faultsFixed, timer, discoveredClues }: LiveIndicatorProps) {
  const plcValues = usePLCValues(currentSystemState, faultsFixed, timer);
  const tags = Object.entries(plcValues);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none">
      {tags.map(([tag, data]) => {
        const colors = statusColors[data.status];
        return (
          <div
            key={tag}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${colors.bg} border ${colors.border} shrink-0`}
          >
            <motion.div
              className={`w-1 h-1 rounded-full ${colors.dot}`}
              animate={data.status === "fault" ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
              transition={data.status === "fault" ? { duration: 0.5, repeat: Infinity } : {}}
            />
            <span className="text-[10px] font-mono-industrial text-gray-500 uppercase">{tag.replace(/_/g, ".")}</span>
            <span className={`text-[10px] font-mono-industrial font-semibold ${colors.text} tabular-nums`}>
              {data.value}
            </span>
            {data.unit && (
              <span className="text-[10px] font-mono-industrial text-gray-600">{data.unit}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Vertical PLC tag list for diagnostics panel — shows more detail
export const PLCTagList = memo(function PLCTagList({ scenario, currentSystemState, faultsFixed, timer, discoveredClues }: LiveIndicatorProps) {
  const plcValues = usePLCValues(currentSystemState, faultsFixed, timer);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-mono-industrial text-gray-600 uppercase tracking-[0.15em]">PLC LIVE TAGS</span>
        <span className="text-[10px] font-mono-industrial text-gray-700">{Object.keys(plcValues).length} TAGS</span>
      </div>
      {Object.entries(plcValues).map(([tag, data]) => {
        const colors = statusColors[data.status];
        const isExpanded = expandedTag === tag;
        return (
          <button
            key={tag}
            onClick={() => setExpandedTag(isExpanded ? null : tag)}
            className={`w-full flex items-center justify-between px-2 py-1 rounded border transition-all ${colors.bg} ${colors.border} hover:brightness-125`}
          >
            <div className="flex items-center gap-1.5">
              <motion.div
                className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                animate={data.status === "fault" ? { opacity: [1, 0.2, 1] } : data.status === "warning" ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                transition={data.status !== "normal" ? { duration: data.status === "fault" ? 0.5 : 1.2, repeat: Infinity } : {}}
              />
              <span className="text-[10px] font-mono-industrial text-gray-400">{tag.replace(/_/g, ".")}</span>
            </div>
            <div className="flex items-center gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={data.value}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={`text-[10px] font-mono-industrial font-bold tabular-nums ${colors.text}`}
                >
                  {data.value}
                </motion.span>
              </AnimatePresence>
              {data.unit && (
                <span className="text-[10px] font-mono-industrial text-gray-600">{data.unit}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
});

// Process flow mini-diagram — shows conveyor/motor/VFD state visually
export function ProcessFlowMini({ currentSystemState, faultsFixed, totalFaults }: {
  currentSystemState: SystemState | undefined;
  faultsFixed: number;
  totalFaults: number;
}) {
  const isFaulted = currentSystemState?.description?.toLowerCase().includes("fault") || 
                    currentSystemState?.description?.toLowerCase().includes("tripped");
  const isRunning = !isFaulted && faultsFixed > 0;
  const isOk = faultsFixed === totalFaults;

  const stages = [
    { label: "POWER", active: true, fault: false },
    { label: "VFD", active: !isFaulted, fault: isFaulted },
    { label: "MOTOR", active: isRunning || isOk, fault: isFaulted },
    { label: "CONV", active: isOk, fault: isFaulted && !isRunning },
  ];

  return (
    <div className="flex items-center gap-0 px-1 py-1.5">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              className={`w-7 h-7 rounded border flex items-center justify-center ${
                stage.fault ? "border-red-500/40 bg-red-500/10" :
                stage.active ? "border-emerald-500/30 bg-emerald-500/8" :
                "border-gray-700/40 bg-gray-800/30"
              }`}
              animate={stage.fault ? { borderColor: ["rgba(239,68,68,0.4)", "rgba(239,68,68,0.1)", "rgba(239,68,68,0.4)"] } : {}}
              transition={stage.fault ? { duration: 0.8, repeat: Infinity } : {}}
            >
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  stage.fault ? "bg-red-500" : stage.active ? "bg-emerald-500" : "bg-gray-700"
                }`}
                animate={stage.fault ? { opacity: [1, 0.2, 1] } : stage.active ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={stage.fault ? { duration: 0.5, repeat: Infinity } : stage.active ? { duration: 2, repeat: Infinity } : {}}
              />
            </motion.div>
            <span className={`text-[10px] font-mono-industrial mt-0.5 ${
              stage.fault ? "text-red-400" : stage.active ? "text-emerald-500" : "text-gray-700"
            }`}>{stage.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className="relative w-4 h-px mx-0.5">
              <div className="absolute inset-0 bg-gray-800" />
              {stage.active && !stage.fault && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-emerald-500/60"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  style={{ height: "1px" }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
