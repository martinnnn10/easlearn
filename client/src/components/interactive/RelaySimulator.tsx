/**
 * RelaySimulator — Interactive relay/contactor simulation
 * Registry-governed NEMA / JIC ladder symbols (NFPA 79).
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DiagramCoil,
  DiagramNCContact,
  DiagramNOContact,
} from "@/lib/electricalDiagramPrimitives";
import ViewStandardReferenceButton from "@/components/standards/ViewStandardReferenceButton";

interface RelayConfig {
  label?: string;
  coilVoltage?: string;
  contactType?: "NO" | "NC" | "BOTH";
  showCurrentFlow?: boolean;
}

const STROKE_ON = "oklch(0.55 0.12 155)";
const STROKE_OFF = "oklch(0.45 0.006 250)";
const STROKE_DIM = "oklch(0.30 0.006 250)";

export default function RelaySimulator({
  label = "Control Relay CR1",
  coilVoltage = "24V DC",
  contactType = "BOTH",
  showCurrentFlow = true,
}: RelayConfig) {
  const [energized, setEnergized] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const toggleRelay = useCallback(() => {
    setEnergized((prev) => !prev);
  }, []);

  const coilColor = energized ? STROKE_ON : STROKE_OFF;

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide">{label}</h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
            Click the coil to energize/de-energize — JIC ladder symbols
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewStandardReferenceButton symbolId="coil" />
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-xs text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] transition-colors"
          >
            {showDetail ? "Hide" : "Show"} Details
          </button>
        </div>
      </div>

      <div className="relative bg-[oklch(0.06_0.003_250)] rounded-xl border border-[oklch(0.16_0.004_250)] p-6 sm:p-8 electrical-diagram">
        <svg viewBox="0 0 400 240" className="w-full max-w-lg mx-auto" xmlns="http://www.w3.org/2000/svg">
          {/* Left rail */}
          <line x1="40" y1="20" x2="40" y2="220" stroke={STROKE_DIM} strokeWidth="2" />
          <line x1="360" y1="20" x2="360" y2="220" stroke={STROKE_DIM} strokeWidth="2" />

          {/* Coil rung */}
          <g
            onClick={toggleRelay}
            className="cursor-pointer"
            role="button"
            aria-label="Toggle relay coil"
          >
            <line x1="40" y1="60" x2="155" y2="60" stroke={coilColor} strokeWidth="2" />
            <DiagramCoil cx={200} cy={60} color={coilColor} scale={1.2} />
            <line x1="245" y1="60" x2="360" y2="60" stroke={coilColor} strokeWidth="2" />
            <text
              x={200}
              y={88}
              textAnchor="middle"
              className="diag-text-secondary"
              fill={coilColor}
              style={{ fontFamily: "var(--diag-font-mono)" }}
            >
              COIL ({coilVoltage})
            </text>
            {energized && (
              <circle cx={200} cy={60} r={42} fill="oklch(0.55 0.12 155 / 12%)" className="animate-pulse" />
            )}
          </g>

          {/* NO contact rung */}
          {(contactType === "NO" || contactType === "BOTH") && (
            <g>
              <text x={100} y={128} textAnchor="middle" className="diag-text-secondary" fill={STROKE_OFF}>
                N.O.
              </text>
              <line x1="40" y1="150" x2="130" y2="150" stroke={energized ? STROKE_ON : STROKE_OFF} strokeWidth="2" />
              <DiagramNOContact cx={200} cy={150} color={energized ? STROKE_ON : STROKE_OFF} scale={1.1} />
              <line x1="270" y1="150" x2="360" y2="150" stroke={energized ? STROKE_ON : STROKE_OFF} strokeWidth="2" />
              <text
                x={100}
                y={178}
                textAnchor="middle"
                className="diag-text-xs"
                fill={energized ? STROKE_ON : "oklch(0.50 0.15 30)"}
                style={{ fontFamily: "var(--diag-font-mono)" }}
              >
                {energized ? "CLOSED" : "OPEN"}
              </text>
              {energized && showCurrentFlow && (
                <motion.circle
                  cx={40}
                  cy={150}
                  r={3}
                  fill={STROKE_ON}
                  animate={{ cx: [40, 360] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
            </g>
          )}

          {/* NC contact rung */}
          {(contactType === "NC" || contactType === "BOTH") && (
            <g>
              <text x={300} y={128} textAnchor="middle" className="diag-text-secondary" fill={STROKE_OFF}>
                N.C.
              </text>
              <line x1="40" y1="200" x2="130" y2="200" stroke={!energized ? STROKE_ON : STROKE_OFF} strokeWidth="2" />
              <DiagramNCContact cx={200} cy={200} color={!energized ? STROKE_ON : STROKE_OFF} scale={1.1} />
              <line x1="270" y1="200" x2="360" y2="200" stroke={!energized ? STROKE_ON : STROKE_OFF} strokeWidth="2" />
              <text
                x={300}
                y={228}
                textAnchor="middle"
                className="diag-text-xs"
                fill={!energized ? STROKE_ON : "oklch(0.50 0.15 30)"}
                style={{ fontFamily: "var(--diag-font-mono)" }}
              >
                {!energized ? "CLOSED" : "OPEN"}
              </text>
              {!energized && showCurrentFlow && (
                <motion.circle
                  cx={40}
                  cy={200}
                  r={3}
                  fill={STROKE_ON}
                  animate={{ cx: [40, 360] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
            </g>
          )}

          <text
            x={200}
            y={236}
            textAnchor="middle"
            className="diag-text-secondary"
            fill={energized ? STROKE_ON : STROKE_DIM}
            style={{ fontFamily: "var(--diag-font-mono)" }}
          >
            {energized ? "ENERGIZED" : "DE-ENERGIZED"}
          </text>
        </svg>
      </div>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 p-5 bg-[oklch(0.08_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
              <h4 className="text-sm font-heading text-white mb-3">How It Works</h4>
              <div className="space-y-2 text-xs text-[oklch(0.58_0.008_250)]">
                <p>
                  <strong className="text-[oklch(0.55_0.12_155)]">Coil:</strong> When voltage ({coilVoltage}) is applied,
                  the coil creates a magnetic field that changes contact states.
                </p>
                <p>
                  <strong className="text-[oklch(0.55_0.12_155)]">N.O.:</strong> Open when de-energized; closes when coil energizes.
                </p>
                <p>
                  <strong className="text-[oklch(0.55_0.12_155)]">N.C.:</strong> Closed when de-energized; opens when coil energizes.
                </p>
                <p className="text-[oklch(0.65_0.15_55)] mt-3 pt-3 border-t border-[oklch(0.14_0.004_250)]">
                  Always verify contact state with a meter — welded contacts are a common failure mode.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
