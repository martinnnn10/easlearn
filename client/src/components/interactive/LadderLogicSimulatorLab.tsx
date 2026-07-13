/**
 * LadderLogicSimulatorLab — Advanced ladder logic simulator
 * Toggle inputs, watch relay logic execute rung-by-rung with scan cycle animation.
 * Includes seal-in circuits, timers, and cross-referenced contacts.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TimerState {
  preset: number; // seconds
  accumulated: number;
  running: boolean;
  done: boolean;
}

interface Rung {
  id: string;
  label: string;
  description: string;
  elements: RungElement[];
  output: RungOutput;
}

interface RungElement {
  type: "NO" | "NC" | "BRANCH_START" | "BRANCH_END";
  address: string;
  label: string;
  /** If true, this contact is cross-referenced from an output coil */
  isCrossRef?: boolean;
}

interface RungOutput {
  type: "coil" | "timer_on" | "timer_off" | "latch" | "unlatch";
  address: string;
  label: string;
  timerPreset?: number; // seconds for timer outputs
}

// Program: Conveyor Start/Stop with Safety and Timer
const PROGRAM_RUNGS: Rung[] = [
  {
    id: "rung-1",
    label: "Rung 1 — Start/Stop Seal-In",
    description: "Classic start/stop circuit with seal-in contact. Press START to energize, STOP to de-energize.",
    elements: [
      { type: "NC", address: "I:1/0", label: "STOP" },
      { type: "NC", address: "I:1/2", label: "E-STOP" },
      { type: "NC", address: "I:1/3", label: "GUARD" },
      { type: "NO", address: "I:1/1", label: "START" },
    ],
    output: { type: "coil", address: "B3:0/0", label: "RUN_CMD" },
  },
  {
    id: "rung-1a",
    label: "Rung 1A — Seal-In Branch",
    description: "Parallel branch: RUN_CMD contact seals in the circuit after START is released.",
    elements: [
      { type: "NC", address: "I:1/0", label: "STOP" },
      { type: "NC", address: "I:1/2", label: "E-STOP" },
      { type: "NC", address: "I:1/3", label: "GUARD" },
      { type: "NO", address: "B3:0/0", label: "RUN_CMD", isCrossRef: true },
    ],
    output: { type: "coil", address: "B3:0/0", label: "RUN_CMD" },
  },
  {
    id: "rung-2",
    label: "Rung 2 — Safety Interlock",
    description: "Motor only runs if RUN_CMD is set AND E-Stop is not pressed AND guard is closed.",
    elements: [
      { type: "NO", address: "B3:0/0", label: "RUN_CMD", isCrossRef: true },
      { type: "NC", address: "I:1/2", label: "E-STOP" },
      { type: "NC", address: "I:1/3", label: "GUARD" },
    ],
    output: { type: "coil", address: "B3:0/1", label: "SAFE_RUN" },
  },
  {
    id: "rung-3",
    label: "Rung 3 — Start Delay Timer",
    description: "3-second timer-on-delay after safety conditions are met. Prevents instant motor start.",
    elements: [
      { type: "NO", address: "B3:0/1", label: "SAFE_RUN", isCrossRef: true },
    ],
    output: { type: "timer_on", address: "T4:0", label: "START_DLY", timerPreset: 3 },
  },
  {
    id: "rung-4",
    label: "Rung 4 — Motor Output",
    description: "Motor contactor energizes when start delay timer is done AND overload is not tripped.",
    elements: [
      { type: "NO", address: "T4:0/DN", label: "TMR DONE", isCrossRef: true },
      { type: "NC", address: "I:1/4", label: "OL TRIP" },
    ],
    output: { type: "coil", address: "O:2/0", label: "MOTOR" },
  },
  {
    id: "rung-5",
    label: "Rung 5 — Run Indicator",
    description: "Green stack light turns on when motor is running.",
    elements: [
      { type: "NO", address: "O:2/0", label: "MOTOR", isCrossRef: true },
    ],
    output: { type: "coil", address: "O:2/1", label: "GREEN LT" },
  },
  {
    id: "rung-6",
    label: "Rung 6 — Fault Indicator",
    description: "Red stack light turns on when overload trips OR E-Stop is pressed.",
    elements: [
      { type: "NO", address: "I:1/4", label: "OL TRIP" },
    ],
    output: { type: "coil", address: "O:2/2", label: "RED LT" },
  },
];

export default function LadderLogicSimulatorLab() {
  const allInputAddresses = useMemo(() => {
    const addrs = new Set<string>();
    PROGRAM_RUNGS.forEach((rung) => {
      rung.elements.forEach((el) => {
        if (el.address.startsWith("I:")) addrs.add(el.address);
      });
    });
    return Array.from(addrs);
  }, []);

  const [inputStates, setInputStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allInputAddresses.forEach((addr) => { initial[addr] = false; });
    return initial;
  });

  const [internalBits, setInternalBits] = useState<Record<string, boolean>>({});
  const [outputBits, setOutputBits] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, TimerState>>({
    "T4:0": { preset: 3, accumulated: 0, running: false, done: false },
  });
  const [scanCount, setScanCount] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [scanHighlight, setScanHighlight] = useState<string | null>(null);

  // Get the state of any address (input, internal bit, output, timer)
  const getState = useCallback((address: string): boolean => {
    if (address.startsWith("I:")) return inputStates[address] || false;
    if (address.startsWith("B3:")) return internalBits[address] || false;
    if (address.startsWith("O:")) return outputBits[address] || false;
    if (address === "T4:0/DN") return timers["T4:0"]?.done || false;
    return false;
  }, [inputStates, internalBits, outputBits, timers]);

  // Evaluate a single rung
  const evaluateRung = useCallback((rung: Rung): boolean => {
    return rung.elements.every((el) => {
      const state = getState(el.address);
      return el.type === "NO" ? state : !state;
    });
  }, [getState]);

  // PLC scan cycle
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newInternal: Record<string, boolean> = { ...internalBits };
      const newOutputs: Record<string, boolean> = { ...outputBits };
      const newTimers: Record<string, TimerState> = { ...timers };

      // Scan each rung in order
      for (const rung of PROGRAM_RUNGS) {
        const getAddr = (address: string): boolean => {
          if (address.startsWith("I:")) return inputStates[address] || false;
          if (address.startsWith("B3:")) return newInternal[address] || false;
          if (address.startsWith("O:")) return newOutputs[address] || false;
          if (address === "T4:0/DN") return newTimers["T4:0"]?.done || false;
          return false;
        };

        const rungResult = rung.elements.every((el) => {
          const state = getAddr(el.address);
          return el.type === "NO" ? state : !state;
        });

        if (rung.output.type === "coil") {
          if (rung.output.address.startsWith("B3:")) {
            // OR logic: if any rung driving this bit is true, bit is true
            if (rungResult) newInternal[rung.output.address] = true;
            // Only clear if ALL rungs driving this bit are false
            // (handled by processing all rungs for same output)
          } else if (rung.output.address.startsWith("O:")) {
            if (rungResult) newOutputs[rung.output.address] = true;
          }
        } else if (rung.output.type === "timer_on") {
          const timerAddr = rung.output.address;
          const timer = newTimers[timerAddr] || { preset: rung.output.timerPreset || 3, accumulated: 0, running: false, done: false };
          if (rungResult) {
            timer.running = true;
            timer.accumulated = Math.min(timer.accumulated + 0.2, timer.preset);
            timer.done = timer.accumulated >= timer.preset;
          } else {
            timer.running = false;
            timer.accumulated = 0;
            timer.done = false;
          }
          newTimers[timerAddr] = timer;
        }
      }

      // Clear bits that no rung is driving true
      // For B3:0/0 (RUN_CMD) — check both rung-1 and rung-1a
      const runCmdRungs = PROGRAM_RUNGS.filter(r => r.output.address === "B3:0/0");
      const anyRunCmdTrue = runCmdRungs.some(rung => {
        return rung.elements.every(el => {
          const state = (() => {
            if (el.address.startsWith("I:")) return inputStates[el.address] || false;
            if (el.address.startsWith("B3:")) return newInternal[el.address] || false;
            return false;
          })();
          return el.type === "NO" ? state : !state;
        });
      });
      if (!anyRunCmdTrue) newInternal["B3:0/0"] = false;

      // Clear other internal bits not driven this scan
      const internalAddresses = Array.from(
        new Set(
          PROGRAM_RUNGS.filter((r) => r.output.type === "coil" && r.output.address.startsWith("B3:"))
            .map((r) => r.output.address)
        )
      );
      for (const addr of internalAddresses) {
        if (addr === "B3:0/0") continue;
        const driven = PROGRAM_RUNGS.filter((r) => r.output.address === addr).some((rung) => {
          return rung.elements.every((el) => {
            const state = (() => {
              if (el.address.startsWith("I:")) return inputStates[el.address] || false;
              if (el.address.startsWith("B3:")) return newInternal[el.address] || false;
              if (el.address.startsWith("O:")) return newOutputs[el.address] || false;
              if (el.address === "T4:0/DN") return newTimers["T4:0"]?.done || false;
              return false;
            })();
            return el.type === "NO" ? state : !state;
          });
        });
        if (!driven) newInternal[addr] = false;
      }

      // Clear outputs not driven
      for (const rung of PROGRAM_RUNGS) {
        if (rung.output.type === "coil" && rung.output.address.startsWith("O:")) {
          const driven = PROGRAM_RUNGS.filter(r => r.output.address === rung.output.address).some(r => {
            return r.elements.every(el => {
              const state = (() => {
                if (el.address.startsWith("I:")) return inputStates[el.address] || false;
                if (el.address.startsWith("B3:")) return newInternal[el.address] || false;
                if (el.address.startsWith("O:")) return newOutputs[el.address] || false;
                if (el.address === "T4:0/DN") return newTimers["T4:0"]?.done || false;
                return false;
              })();
              return el.type === "NO" ? state : !state;
            });
          });
          if (!driven) newOutputs[rung.output.address] = false;
        }
      }

      setInternalBits(newInternal);
      setOutputBits(newOutputs);
      setTimers(newTimers);
      setScanCount((prev) => prev + 1);
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, inputStates, internalBits, outputBits, timers]);

  const toggleInput = (address: string) => {
    setInputStates((prev) => ({ ...prev, [address]: !prev[address] }));
  };

  const inputLabels: Record<string, string> = {
    "I:1/0": "STOP PB",
    "I:1/1": "START PB",
    "I:1/2": "E-STOP",
    "I:1/3": "GUARD SW",
    "I:1/4": "OL TRIP",
  };

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide">Ladder Logic Simulator</h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
            Toggle inputs to watch rung-by-rung evaluation with seal-in circuits and timers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              isRunning
                ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.55_0.12_155)]"
                : "border-[oklch(0.50_0.15_30)] text-[oklch(0.50_0.15_30)]"
            }`}
          >
            {isRunning ? "● RUN" : "■ STOP"}
          </button>
          <div className="text-[10px] font-mono text-[oklch(0.40_0.006_250)]">
            Scan: {scanCount}
          </div>
        </div>
      </div>

      {/* Input Panel */}
      <div className="mb-6 p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-3 uppercase tracking-wider">
          Field Inputs — Click to Toggle
        </div>
        <div className="flex flex-wrap gap-2">
          {allInputAddresses.map((addr) => {
            const isActive = inputStates[addr];
            return (
              <button
                key={addr}
                onClick={() => toggleInput(addr)}
                className={`px-3 py-2 rounded-md border text-xs font-mono transition-all duration-200 ${
                  isActive
                    ? "bg-[oklch(0.20_0.06_155)] border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)] shadow-[0_0_8px_oklch(0.55_0.12_155/30%)]"
                    : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)] hover:border-[oklch(0.30_0.006_250)]"
                }`}
              >
                <div className="text-[9px] opacity-60">{addr}</div>
                <div className="mt-0.5">{inputLabels[addr] || addr}</div>
                <div className={`mt-1 text-[10px] ${isActive ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.40_0.006_250)]"}`}>
                  {isActive ? "● ON" : "○ OFF"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ladder Rungs */}
      <div className="space-y-3 mb-6">
        {PROGRAM_RUNGS.map((rung) => {
          const rungResult = evaluateRung(rung);
          const outputActive = rung.output.type === "timer_on"
            ? timers[rung.output.address]?.running || false
            : rung.output.address.startsWith("B3:")
            ? internalBits[rung.output.address] || false
            : outputBits[rung.output.address] || false;

          return (
            <div key={rung.id}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{rung.label}</span>
              </div>
              <div className={`relative p-3 rounded-lg border transition-all duration-200 ${
                outputActive
                  ? "bg-[oklch(0.08_0.02_155)] border-[oklch(0.55_0.12_155/30%)]"
                  : "bg-[oklch(0.06_0.003_250)] border-[oklch(0.14_0.004_250)]"
              }`}>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {/* Left rail */}
                  <div className={`w-0.5 h-10 rounded-full transition-colors ${
                    outputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />
                  <div className={`w-3 h-px transition-colors ${
                    outputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />

                  {/* Elements */}
                  {rung.elements.map((el, i) => {
                    const state = getState(el.address);
                    const passes = el.type === "NO" ? state : !state;
                    const pathOk = rung.elements.slice(0, i + 1).every(e => {
                      const s = getState(e.address);
                      return e.type === "NO" ? s : !s;
                    });

                    return (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`relative px-2 py-1 rounded border text-center min-w-[72px] transition-all duration-200 ${
                          passes
                            ? "bg-[oklch(0.15_0.04_155)] border-[oklch(0.55_0.12_155)]"
                            : "bg-[oklch(0.10_0.02_30)] border-[oklch(0.50_0.15_30/50%)]"
                        }`}>
                          {el.isCrossRef && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[oklch(0.55_0.12_250)]" title="Cross-referenced" />
                          )}
                          <div className="text-[10px] font-mono text-[oklch(0.40_0.006_250)]">{el.address}</div>
                          <div className={`text-[10px] font-mono font-bold ${
                            passes ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.55_0.15_30)]"
                          }`}>
                            {el.type === "NO" ? "—| |—" : "—|/|—"}
                          </div>
                          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{el.label}</div>
                        </div>
                        {i < rung.elements.length - 1 && (
                          <div className={`w-3 h-px transition-colors ${
                            pathOk ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                          }`} />
                        )}
                      </div>
                    );
                  })}

                  {/* Wire to output */}
                  <div className={`w-3 h-px transition-colors ${
                    outputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />

                  {/* Output */}
                  <div className={`px-2 py-1 rounded-full border text-center min-w-[72px] transition-all duration-200 ${
                    outputActive
                      ? "bg-[oklch(0.18_0.06_155)] border-[oklch(0.55_0.12_155)] shadow-[0_0_8px_oklch(0.55_0.12_155/30%)]"
                      : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)]"
                  }`}>
                    <div className="text-[10px] font-mono text-[oklch(0.40_0.006_250)]">{rung.output.address}</div>
                    <div className={`text-[9px] font-mono font-bold ${
                      outputActive ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.45_0.006_250)]"
                    }`}>
                      {rung.output.type === "timer_on" ? "—[TON]—" : "—( )—"}
                    </div>
                    <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{rung.output.label}</div>
                  </div>

                  {/* Right rail */}
                  <div className={`w-3 h-px transition-colors ${
                    outputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />
                  <div className={`w-0.5 h-10 rounded-full transition-colors ${
                    outputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />
                </div>

                {/* Timer bar */}
                {rung.output.type === "timer_on" && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[oklch(0.10_0.003_250)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[oklch(0.55_0.12_155)]"
                        animate={{ width: `${((timers[rung.output.address]?.accumulated || 0) / (timers[rung.output.address]?.preset || 3)) * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
                      {(timers[rung.output.address]?.accumulated || 0).toFixed(1)}s / {timers[rung.output.address]?.preset || 3}s
                      {timers[rung.output.address]?.done && " ✓ DONE"}
                    </span>
                  </div>
                )}

                {/* Current flow animation */}
                {outputActive && (
                  <motion.div className="absolute top-0 left-0 h-full w-full pointer-events-none overflow-hidden rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.div
                      className="absolute top-1/2 h-px w-6 bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155)] to-transparent"
                      animate={{ left: ["-5%", "105%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Output Status */}
      <div className="p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-3 uppercase tracking-wider">
          Output & Internal Bit Status
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { addr: "B3:0/0", label: "RUN_CMD", state: internalBits["B3:0/0"] },
            { addr: "B3:0/1", label: "SAFE_RUN", state: internalBits["B3:0/1"] },
            { addr: "T4:0/DN", label: "TMR DONE", state: timers["T4:0"]?.done },
            { addr: "O:2/0", label: "MOTOR", state: outputBits["O:2/0"] },
            { addr: "O:2/1", label: "GREEN LT", state: outputBits["O:2/1"] },
            { addr: "O:2/2", label: "RED LT", state: outputBits["O:2/2"] },
          ].map((item) => (
            <div
              key={item.addr}
              data-safety-coil={item.label}
              data-coil-on={item.state ? "true" : "false"}
              className={`px-3 py-2 rounded-md border text-xs font-mono transition-all duration-200 ${
                item.state
                  ? item.addr === "O:2/2"
                    ? "bg-[oklch(0.20_0.06_30)] border-[oklch(0.55_0.15_30)] text-[oklch(0.70_0.15_30)] shadow-[0_0_8px_oklch(0.55_0.15_30/30%)]"
                    : "bg-[oklch(0.18_0.06_155)] border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)] shadow-[0_0_8px_oklch(0.55_0.12_155/30%)]"
                  : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.45_0.006_250)]"
              }`}
            >
              <div className="text-[10px] opacity-60">{item.addr}</div>
              <div className="mt-0.5">{item.label}</div>
              <div className="mt-1 text-[10px]">{item.state ? "● ON" : "○ OFF"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase tracking-wider">
          Try These Sequences
        </div>
        <div className="space-y-2 text-[10px] text-[oklch(0.50_0.008_250)]">
          <div>1. <strong className="text-white">Normal Start:</strong> Click START → watch seal-in → 3s timer → MOTOR energizes → GREEN LT on</div>
          <div>2. <strong className="text-white">Normal Stop:</strong> Click STOP → RUN_CMD drops → timer resets → MOTOR de-energizes</div>
          <div>3. <strong className="text-white">E-Stop:</strong> While running, click E-STOP → safety interlock breaks → motor stops immediately</div>
          <div>4. <strong className="text-white">Overload:</strong> While running, click OL TRIP → motor stops → RED LT turns on</div>
          <div>5. <strong className="text-white">Guard Open:</strong> While running, click GUARD SW → safety breaks → motor stops</div>
          <div className="text-[oklch(0.55_0.12_250)] mt-2">Blue dots (●) on contacts indicate cross-referenced bits from other rungs</div>
        </div>
      </div>
    </div>
  );
}
