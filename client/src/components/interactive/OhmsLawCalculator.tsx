/**
 * OhmsLawCalculator — Interactive Ohm's Law triangle with animated circuit response
 * Enter any two values to calculate the third
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function OhmsLawCalculator() {
  const [voltage, setVoltage] = useState<string>("120");
  const [current, setCurrent] = useState<string>("");
  const [resistance, setResistance] = useState<string>("60");
  const [solveFor, setSolveFor] = useState<"V" | "I" | "R">("I");

  const calculated = useMemo(() => {
    const v = parseFloat(voltage) || 0;
    const i = parseFloat(current) || 0;
    const r = parseFloat(resistance) || 0;

    switch (solveFor) {
      case "V":
        return { value: i * r, unit: "V", label: "Voltage" };
      case "I":
        return { value: r > 0 ? v / r : 0, unit: "A", label: "Current" };
      case "R":
        return { value: i > 0 ? v / i : 0, unit: "Ω", label: "Resistance" };
    }
  }, [voltage, current, resistance, solveFor]);

  // Calculate power
  const power = useMemo(() => {
    const v = solveFor === "V" ? calculated.value : parseFloat(voltage) || 0;
    const i = solveFor === "I" ? calculated.value : parseFloat(current) || 0;
    return v * i;
  }, [voltage, current, calculated, solveFor]);

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-base font-heading text-white tracking-wide">Ohm's Law Calculator</h3>
        <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
          Enter two values to calculate the third • V = I × R
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triangle Visualization */}
        <div className="relative bg-[oklch(0.06_0.003_250)] rounded-xl border border-[oklch(0.16_0.004_250)] p-6 flex items-center justify-center">
          <svg viewBox="0 0 200 180" className="w-full max-w-[200px]" xmlns="http://www.w3.org/2000/svg">
            {/* Triangle */}
            <polygon
              points="100,15 20,165 180,165"
              fill="none"
              stroke="oklch(0.25 0.006 250)"
              strokeWidth="2"
            />
            {/* Horizontal divider */}
            <line x1="40" y1="90" x2="160" y2="90" stroke="oklch(0.25 0.006 250)" strokeWidth="1.5" />
            {/* Vertical divider */}
            <line x1="100" y1="90" x2="100" y2="165" stroke="oklch(0.25 0.006 250)" strokeWidth="1.5" />

            {/* V label (top) */}
            <text
              x="100" y="65" textAnchor="middle"
              className={`text-lg font-bold font-mono ${
                solveFor === "V" ? "fill-[oklch(0.55_0.12_155)]" : "fill-[oklch(0.60_0.008_250)]"
              }`}
            >
              V
            </text>

            {/* I label (bottom left) */}
            <text
              x="65" y="140" textAnchor="middle"
              className={`text-lg font-bold font-mono ${
                solveFor === "I" ? "fill-[oklch(0.55_0.12_155)]" : "fill-[oklch(0.60_0.008_250)]"
              }`}
            >
              I
            </text>

            {/* R label (bottom right) */}
            <text
              x="135" y="140" textAnchor="middle"
              className={`text-lg font-bold font-mono ${
                solveFor === "R" ? "fill-[oklch(0.55_0.12_155)]" : "fill-[oklch(0.60_0.008_250)]"
              }`}
            >
              R
            </text>

            {/* Multiplication symbol */}
            <text x="100" y="140" textAnchor="middle" className="text-sm fill-[oklch(0.40_0.006_250)]">×</text>
          </svg>
        </div>

        {/* Input Controls */}
        <div className="space-y-4">
          {/* Solve for selector */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-[oklch(0.50_0.008_250)]">Solve for:</span>
            {(["V", "I", "R"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSolveFor(s)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                  solveFor === s
                    ? "bg-[oklch(0.20_0.06_155)] border border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)]"
                    : "bg-[oklch(0.10_0.003_250)] border border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)] hover:border-[oklch(0.30_0.006_250)]"
                }`}
              >
                {s === "V" ? "Voltage" : s === "I" ? "Current" : "Resistance"}
              </button>
            ))}
          </div>

          {/* Voltage input */}
          <div className={`${solveFor === "V" ? "opacity-50 pointer-events-none" : ""}`}>
            <label className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
              Voltage (V)
            </label>
            <input
              type="number"
              value={solveFor === "V" ? calculated.value.toFixed(2) : voltage}
              onChange={(e) => setVoltage(e.target.value)}
              disabled={solveFor === "V"}
              className="w-full mt-1 px-3 py-2 bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] rounded text-sm font-mono text-white focus:border-[oklch(0.55_0.12_155)] focus:outline-none"
            />
          </div>

          {/* Current input */}
          <div className={`${solveFor === "I" ? "opacity-50 pointer-events-none" : ""}`}>
            <label className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
              Current (A)
            </label>
            <input
              type="number"
              value={solveFor === "I" ? calculated.value.toFixed(3) : current}
              onChange={(e) => setCurrent(e.target.value)}
              disabled={solveFor === "I"}
              className="w-full mt-1 px-3 py-2 bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] rounded text-sm font-mono text-white focus:border-[oklch(0.55_0.12_155)] focus:outline-none"
            />
          </div>

          {/* Resistance input */}
          <div className={`${solveFor === "R" ? "opacity-50 pointer-events-none" : ""}`}>
            <label className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
              Resistance (Ω)
            </label>
            <input
              type="number"
              value={solveFor === "R" ? calculated.value.toFixed(2) : resistance}
              onChange={(e) => setResistance(e.target.value)}
              disabled={solveFor === "R"}
              className="w-full mt-1 px-3 py-2 bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] rounded text-sm font-mono text-white focus:border-[oklch(0.55_0.12_155)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Result Display */}
      <motion.div
        key={`${calculated.value}-${solveFor}`}
        initial={{ scale: 0.95, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-6 p-5 bg-[oklch(0.08_0.02_155)] rounded-lg border border-[oklch(0.55_0.12_155/25%)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider">
              {calculated.label}
            </div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {calculated.value.toFixed(calculated.unit === "A" ? 3 : 2)} {calculated.unit}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
              Power
            </div>
            <div className="text-lg font-mono text-[oklch(0.65_0.15_55)] mt-1">
              {power.toFixed(2)} W
            </div>
          </div>
        </div>

        {/* Formula display */}
        <div className="mt-3 pt-3 border-t border-[oklch(0.55_0.12_155/15%)] text-xs font-mono text-[oklch(0.50_0.008_250)]">
          {solveFor === "V" && `V = I × R = ${current || "0"} × ${resistance || "0"} = ${calculated.value.toFixed(2)}V`}
          {solveFor === "I" && `I = V ÷ R = ${voltage || "0"} ÷ ${resistance || "0"} = ${calculated.value.toFixed(3)}A`}
          {solveFor === "R" && `R = V ÷ I = ${voltage || "0"} ÷ ${current || "0"} = ${calculated.value.toFixed(2)}Ω`}
        </div>
      </motion.div>
    </div>
  );
}
