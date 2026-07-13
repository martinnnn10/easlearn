/**
 * CircuitFlowAnimator — Animated basic circuit with switch, load, and current flow
 * Shows voltage source, switch, resistive load, and animated electron flow
 */
import { useState } from "react";
import { motion } from "framer-motion";

interface CircuitFlowAnimatorProps {
  title?: string;
  sourceVoltage?: number;
  loadResistance?: number;
  loadLabel?: string;
}

export default function CircuitFlowAnimator({
  title = "Basic Circuit — Current Flow",
  sourceVoltage = 120,
  loadResistance = 60,
  loadLabel = "Heating Element",
}: CircuitFlowAnimatorProps) {
  const [switchClosed, setSwitchClosed] = useState(false);
  const [showValues, setShowValues] = useState(true);

  const current = switchClosed ? sourceVoltage / loadResistance : 0;
  const power = switchClosed ? sourceVoltage * current : 0;
  const voltageDrop = switchClosed ? sourceVoltage : 0;

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide">{title}</h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
            Click the switch to energize the circuit
          </p>
        </div>
        <button
          onClick={() => setShowValues(!showValues)}
          className="text-xs text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] transition-colors"
        >
          {showValues ? "Hide" : "Show"} Values
        </button>
      </div>

      {/* Circuit SVG */}
      <div className="relative bg-[oklch(0.06_0.003_250)] rounded-xl border border-[oklch(0.16_0.004_250)] p-6">
        <svg viewBox="0 0 400 250" className="w-full max-w-lg mx-auto" xmlns="http://www.w3.org/2000/svg">
          {/* Voltage Source (left side) */}
          <g>
            <rect x="20" y="80" width="40" height="90" rx="4"
              className={`transition-colors duration-300 ${
                switchClosed ? "fill-[oklch(0.15_0.04_155)] stroke-[oklch(0.55_0.12_155)]" : "fill-[oklch(0.10_0.003_250)] stroke-[oklch(0.25_0.006_250)]"
              }`}
              strokeWidth="2"
            />
            <text x="40" y="115" textAnchor="middle" className="text-[9px] font-mono fill-[oklch(0.55_0.12_155)]">+</text>
            <text x="40" y="160" textAnchor="middle" className="text-[9px] font-mono fill-[oklch(0.45_0.006_250)]">−</text>
            <text x="40" y="135" textAnchor="middle" className="text-[10px] font-mono fill-[oklch(0.50_0.006_250)]">
              {sourceVoltage}V
            </text>
          </g>

          {/* Top wire (positive) */}
          <line x1="60" y1="80" x2="140" y2="80"
            className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.55_0.12_155)]" : "stroke-[oklch(0.25_0.006_250)]"}`}
            strokeWidth="2"
          />

          {/* Switch — large hit area for better click interaction */}
          <g onClick={() => setSwitchClosed(!switchClosed)} className="cursor-pointer" role="button" aria-label={switchClosed ? "Open switch" : "Close switch"}>
            {/* Invisible hit area (much larger than visual elements) */}
            <rect x="125" y="45" width="80" height="50" fill="transparent" />
            {/* Hover highlight */}
            <rect x="130" y="50" width="70" height="40" rx="6"
              className="fill-transparent hover:fill-[oklch(0.55_0.12_155/8%)] transition-colors duration-200"
            />
            <circle cx="140" cy="80" r="5"
              className={`transition-colors duration-300 ${switchClosed ? "fill-[oklch(0.55_0.12_155)]" : "fill-[oklch(0.30_0.006_250)]"}`}
            />
            <motion.line
              x1="140" y1="80"
              x2="190"
              animate={{ y2: switchClosed ? 80 : 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.55_0.12_155)]" : "stroke-[oklch(0.50_0.006_250)]"}`}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="190" cy="80" r="5"
              className={`transition-colors duration-300 ${switchClosed ? "fill-[oklch(0.55_0.12_155)]" : "fill-[oklch(0.30_0.006_250)]"}`}
            />
            <text x="165" y="55" textAnchor="middle" className="text-[10px] font-mono fill-[oklch(0.55_0.12_155)] pointer-events-none">
              {switchClosed ? "▼ OPEN" : "▼ CLOSE"}
            </text>
          </g>

          {/* Top wire continued */}
          <line x1="190" y1="80" x2="300" y2="80"
            className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.55_0.12_155)]" : "stroke-[oklch(0.25_0.006_250)]"}`}
            strokeWidth="2"
          />

          {/* Load (right side) */}
          <g>
            <rect x="300" y="80" width="60" height="90" rx="4"
              className={`transition-colors duration-300 ${
                switchClosed ? "fill-[oklch(0.18_0.06_55)] stroke-[oklch(0.65_0.15_55)]" : "fill-[oklch(0.10_0.003_250)] stroke-[oklch(0.25_0.006_250)]"
              }`}
              strokeWidth="2"
            />
            {/* Heating element symbol (wavy line) inside load box */}
            <path d="M 312 110 C 316 105, 320 115, 324 110 C 328 105, 332 115, 336 110 C 340 105, 344 115, 348 110"
              fill="none"
              className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.65_0.15_55)]" : "stroke-[oklch(0.35_0.006_250)]"}`}
              strokeWidth="1.5"
            />
            <text x="330" y="135" textAnchor="middle" className="text-[10px] font-mono fill-[oklch(0.50_0.006_250)]">
              {loadLabel}
            </text>
            <text x="330" y="150" textAnchor="middle" className="text-[10px] font-mono fill-[oklch(0.45_0.006_250)]">
              {loadResistance}Ω
            </text>
            {/* Heat glow when energized */}
            {switchClosed && (
              <motion.rect
                x="300" y="80" width="60" height="90" rx="4"
                fill="oklch(0.65 0.15 55 / 10%)"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </g>

          {/* Bottom wire (return) */}
          <line x1="60" y1="170" x2="300" y2="170"
            className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.55_0.12_155)]" : "stroke-[oklch(0.25_0.006_250)]"}`}
            strokeWidth="2"
          />
          <line x1="300" y1="170" x2="360" y2="170"
            className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.55_0.12_155)]" : "stroke-[oklch(0.25_0.006_250)]"}`}
            strokeWidth="2"
          />
          {/* Right vertical */}
          <line x1="360" y1="80" x2="360" y2="170"
            className={`transition-colors duration-300 ${switchClosed ? "stroke-[oklch(0.55_0.12_155)]" : "stroke-[oklch(0.25_0.006_250)]"}`}
            strokeWidth="2"
          />

          {/* Current flow particles */}
          {switchClosed && (
            <>
              {[0, 0.25, 0.5, 0.75].map((delay) => (
                <motion.circle
                  key={delay}
                  r="3"
                  fill="oklch(0.55 0.12 155)"
                  animate={{
                    cx: [60, 140, 190, 300, 360, 360, 300, 60, 60],
                    cy: [80, 80, 80, 80, 80, 170, 170, 170, 80],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: delay * 3,
                  }}
                />
              ))}
            </>
          )}

          {/* Current direction arrow */}
          {switchClosed && (
            <g>
              <text x="200" y="72" textAnchor="middle" className="text-[10px] font-mono fill-[oklch(0.55_0.12_155)]">
                → I = {current.toFixed(2)}A →
              </text>
              <text x="200" y="188" textAnchor="middle" className="text-[10px] font-mono fill-[oklch(0.55_0.12_155)]">
                ← return path ←
              </text>
            </g>
          )}

          {/* Voltage labels */}
          {showValues && switchClosed && (
            <g>
              <text x="330" y="210" textAnchor="middle" className="text-[9px] font-mono fill-[oklch(0.65_0.15_55)]">
                V_drop = {voltageDrop}V
              </text>
              <text x="330" y="225" textAnchor="middle" className="text-[9px] font-mono fill-[oklch(0.60_0.15_30)]">
                P = {power.toFixed(1)}W
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Status Panel */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Voltage", value: `${sourceVoltage}V`, active: true },
          { label: "Current", value: switchClosed ? `${current.toFixed(2)}A` : "0A", active: switchClosed },
          { label: "Power", value: switchClosed ? `${power.toFixed(1)}W` : "0W", active: switchClosed },
          { label: "Circuit", value: switchClosed ? "CLOSED" : "OPEN", active: switchClosed },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-3 rounded-lg border text-center transition-all duration-300 ${
              stat.active
                ? "bg-[oklch(0.10_0.02_155)] border-[oklch(0.55_0.12_155/25%)]"
                : "bg-[oklch(0.06_0.003_250)] border-[oklch(0.14_0.004_250)]"
            }`}
          >
            <div className="text-[9px] font-mono text-[oklch(0.45_0.006_250)] uppercase">{stat.label}</div>
            <div className={`text-sm font-mono font-bold mt-1 ${
              stat.active ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.40_0.006_250)]"
            }`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
