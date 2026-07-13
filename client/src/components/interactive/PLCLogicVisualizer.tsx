/**
 * PLCLogicVisualizer — Interactive ladder logic display
 * Toggle inputs and watch rung evaluation animate in real-time
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface Rung {
  label: string;
  description?: string;
  elements: RungElement[];
  output: { address: string; label: string };
}

interface RungElement {
  type: "NO" | "NC" | "BRANCH_START" | "BRANCH_END";
  address: string;
  label: string;
}

interface PLCLogicVisualizerProps {
  title?: string;
  rungs?: Rung[];
}

const defaultRungs: Rung[] = [
  {
    label: "Rung 1 — Start/Stop Circuit",
    description: "Seal-in circuit with start pushbutton and stop safety",
    elements: [
      { type: "NC", address: "I:1/0", label: "STOP PB" },
      { type: "NO", address: "I:1/1", label: "START PB" },
    ],
    output: { address: "O:2/0", label: "MOTOR CR" },
  },
  {
    label: "Rung 2 — Safety Interlock",
    description: "Motor only runs if guard is closed AND pressure is OK",
    elements: [
      { type: "NC", address: "I:1/2", label: "E-STOP" },
      { type: "NC", address: "I:1/3", label: "GUARD SW" },
      { type: "NO", address: "I:1/4", label: "PRESS OK" },
    ],
    output: { address: "O:2/1", label: "RUN ENABLE" },
  },
  {
    label: "Rung 3 — Overload Monitoring",
    description: "Trips output if overload relay opens",
    elements: [
      { type: "NC", address: "I:1/5", label: "OL RELAY" },
      { type: "NO", address: "O:2/0", label: "MOTOR CR" },
    ],
    output: { address: "O:2/2", label: "CONTACTOR" },
  },
];

export default function PLCLogicVisualizer({
  title = "PLC Ladder Logic Visualizer",
  rungs = defaultRungs,
}: PLCLogicVisualizerProps) {
  // Track all input states
  const allAddresses = useMemo(() => {
    const addrs = new Set<string>();
    rungs.forEach((rung) => {
      rung.elements.forEach((el) => addrs.add(el.address));
    });
    return Array.from(addrs);
  }, [rungs]);

  const [inputStates, setInputStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allAddresses.forEach((addr) => {
      // NC contacts default to closed (true), NO contacts default to open (false)
      initial[addr] = false;
    });
    return initial;
  });

  const [scanCycle, setScanCycle] = useState(0);

  const toggleInput = (address: string) => {
    setInputStates((prev) => ({ ...prev, [address]: !prev[address] }));
    setScanCycle((prev) => prev + 1);
  };

  // Evaluate rung logic
  const evaluateRung = (rung: Rung): boolean => {
    return rung.elements.every((el) => {
      const state = inputStates[el.address] || false;
      if (el.type === "NO") return state; // NO: true when input is true
      if (el.type === "NC") return !state; // NC: true when input is false (normal state)
      return true;
    });
  };

  // Store output states for cross-referencing
  const outputStates = useMemo(() => {
    const states: Record<string, boolean> = {};
    rungs.forEach((rung) => {
      states[rung.output.address] = evaluateRung(rung);
    });
    return states;
  }, [inputStates, rungs]);

  // Override inputStates with output states for cross-referenced elements
  const getElementState = (el: RungElement): boolean => {
    if (outputStates[el.address] !== undefined) {
      const state = outputStates[el.address];
      return el.type === "NO" ? state : !state;
    }
    const state = inputStates[el.address] || false;
    return el.type === "NO" ? state : !state;
  };

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide">{title}</h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
            Toggle inputs to see real-time rung evaluation • Scan cycle: {scanCycle}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.12_155)] animate-pulse" />
          RUN MODE
        </div>
      </div>

      {/* Input Panel */}
      <div className="mb-6 p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-3 uppercase tracking-wider">
          Input Rack — Click to Toggle
        </div>
        <div className="flex flex-wrap gap-2">
          {allAddresses
            .filter((addr) => addr.startsWith("I:"))
            .map((addr) => {
              const el = rungs.flatMap((r) => r.elements).find((e) => e.address === addr);
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
                  <div className="mt-0.5">{el?.label || addr}</div>
                  <div className={`mt-1 text-[10px] ${isActive ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.40_0.006_250)]"}`}>
                    {isActive ? "● ON" : "○ OFF"}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Ladder Logic Display */}
      <div className="space-y-4">
        {rungs.map((rung, rungIndex) => {
          const rungResult = evaluateRung(rung);
          const isOutputActive = outputStates[rung.output.address];

          return (
            <div key={rungIndex} className="relative">
              {/* Rung label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
                  {rung.label}
                </span>
                {rung.description && (
                  <span className="text-[9px] text-[oklch(0.38_0.006_250)]">
                    — {rung.description}
                  </span>
                )}
              </div>

              {/* Rung visualization */}
              <div className={`relative p-4 rounded-lg border transition-all duration-300 ${
                isOutputActive
                  ? "bg-[oklch(0.08_0.02_155)] border-[oklch(0.55_0.12_155/30%)]"
                  : "bg-[oklch(0.06_0.003_250)] border-[oklch(0.14_0.004_250)]"
              }`}>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {/* Left power rail */}
                  <div className={`w-1 h-12 rounded-full transition-colors duration-300 ${
                    isOutputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />

                  {/* Power flow line */}
                  <div className={`w-4 h-0.5 transition-colors duration-300 ${
                    isOutputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />

                  {/* Elements */}
                  {rung.elements.map((el, elIndex) => {
                    const elementPasses = getElementState(el);
                    const pathEnergized = rung.elements.slice(0, elIndex + 1).every((e) => getElementState(e));

                    return (
                      <div key={elIndex} className="flex items-center gap-1">
                        {/* Contact element */}
                        <motion.div
                          animate={{
                            borderColor: elementPasses
                              ? "oklch(0.55 0.12 155)"
                              : "oklch(0.50 0.15 30 / 50%)",
                          }}
                          className={`relative px-3 py-1.5 rounded border-2 text-center min-w-[72px] transition-all duration-200 ${
                            elementPasses
                              ? "bg-[oklch(0.15_0.04_155)]"
                              : "bg-[oklch(0.10_0.02_30)]"
                          }`}
                        >
                          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
                            {el.address}
                          </div>
                          <div className={`text-[10px] font-mono font-bold ${
                            elementPasses ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.60_0.15_30)]"
                          }`}>
                            {el.type === "NO" ? "—| |—" : "—|/|—"}
                          </div>
                          <div className="text-[10px] font-mono text-[oklch(0.50_0.006_250)] mt-0.5">
                            {el.label}
                          </div>
                        </motion.div>

                        {/* Connecting wire */}
                        {elIndex < rung.elements.length - 1 && (
                          <div className={`w-4 h-0.5 transition-colors duration-300 ${
                            pathEnergized ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                          }`} />
                        )}
                      </div>
                    );
                  })}

                  {/* Wire to output */}
                  <div className={`w-4 h-0.5 transition-colors duration-300 ${
                    isOutputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />

                  {/* Output coil */}
                  <motion.div
                    animate={{
                      borderColor: isOutputActive
                        ? "oklch(0.55 0.12 155)"
                        : "oklch(0.25 0.006 250)",
                      boxShadow: isOutputActive
                        ? "0 0 12px oklch(0.55 0.12 155 / 40%)"
                        : "none",
                    }}
                    className={`relative px-3 py-1.5 rounded-full border-2 text-center min-w-[72px] transition-all duration-200 ${
                      isOutputActive
                        ? "bg-[oklch(0.18_0.06_155)]"
                        : "bg-[oklch(0.10_0.003_250)]"
                    }`}
                  >
                    <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
                      {rung.output.address}
                    </div>
                    <div className={`text-[10px] font-mono font-bold ${
                      isOutputActive ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.50_0.006_250)]"
                    }`}>
                      —( )—
                    </div>
                    <div className="text-[10px] font-mono text-[oklch(0.50_0.006_250)] mt-0.5">
                      {rung.output.label}
                    </div>
                  </motion.div>

                  {/* Right power rail */}
                  <div className={`w-4 h-0.5 transition-colors duration-300 ${
                    isOutputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />
                  <div className={`w-1 h-12 rounded-full transition-colors duration-300 ${
                    isOutputActive ? "bg-[oklch(0.55_0.12_155)]" : "bg-[oklch(0.25_0.006_250)]"
                  }`} />
                </div>

                {/* Current flow animation */}
                {isOutputActive && (
                  <motion.div
                    className="absolute top-0 left-0 h-full w-full pointer-events-none overflow-hidden rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute top-1/2 h-0.5 w-8 bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155)] to-transparent"
                      animate={{ left: ["-10%", "110%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Output Status Panel */}
      <div className="mt-6 p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-3 uppercase tracking-wider">
          Output Status
        </div>
        <div className="flex flex-wrap gap-3">
          {rungs.map((rung) => {
            const active = outputStates[rung.output.address];
            return (
              <div
                key={rung.output.address}
                className={`px-3 py-2 rounded-md border text-xs font-mono transition-all duration-300 ${
                  active
                    ? "bg-[oklch(0.18_0.06_155)] border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)] shadow-[0_0_8px_oklch(0.55_0.12_155/30%)]"
                    : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.45_0.006_250)]"
                }`}
              >
                <div className="text-[9px] opacity-60">{rung.output.address}</div>
                <div className="mt-0.5">{rung.output.label}</div>
                <div className="mt-1 text-[10px]">
                  {active ? "● ENERGIZED" : "○ OFF"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
