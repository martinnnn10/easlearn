/**
 * BeginnerMeterExercise — Guided meter exercises for Basic Meter Usage module.
 * Reuses the VirtualMultimeterLab architecture: TestPoint, MeterSetting, tap-to-select.
 * Mobile-friendly: tap-to-select test points, no precision dragging required.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw, Zap, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ─── Shared Types (from VirtualMultimeterLab architecture) ──────────────────

type MeterSetting = "vac" | "vdc" | "ohms" | "continuity";

interface TestPoint {
  id: string;
  label: string;
  description?: string;
  color: string;
}

interface MeasurementResult {
  reading: string;
  unit: string;
  explanation: string;
  isCorrectSetting: boolean;
  isSafe: boolean;
}

// ─── Exercise Definition ────────────────────────────────────────────────────

export interface MeterExerciseConfig {
  id: string;
  title: string;
  objective: string;
  /** Circuit state: energized or de-energized */
  circuitState: "energized" | "de-energized";
  /** PLC software state (for exercise 3) */
  plcState?: { output: string; status: "ON" | "OFF" };
  /** Available test points */
  testPoints: TestPoint[];
  /** Correct meter function */
  correctFunction: MeterSetting;
  /** Correct probe placement */
  correctProbe1: string;
  correctProbe2: string;
  /** Expected reading when correct */
  expectedReading: MeasurementResult;
  /** What to show for wrong function on energized circuit */
  unsafeMessage?: string;
  /** Documentation fields the learner must fill */
  requiresDocumentation?: boolean;
  /** What the reading verifies */
  verifies: string;
  /** What remains unverified */
  remainsUnverified: string;
}

// ─── Meter Settings Display ─────────────────────────────────────────────────

const METER_SETTINGS: { id: MeterSetting; label: string; symbol: string }[] = [
  { id: "vac", label: "V AC", symbol: "V~" },
  { id: "vdc", label: "V DC", symbol: "V⎓" },
  { id: "ohms", label: "Resistance", symbol: "Ω" },
  { id: "continuity", label: "Continuity", symbol: "🔊" },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  exercise: MeterExerciseConfig;
  onComplete?: () => void;
}

type ExerciseStep = "setup" | "probe" | "result" | "document" | "complete";

export default function BeginnerMeterExercise({ exercise, onComplete }: Props) {
  const [step, setStep] = useState<ExerciseStep>("setup");
  const [selectedFunction, setSelectedFunction] = useState<MeterSetting | null>(null);
  const [probe1, setProbe1] = useState<string | null>(null);
  const [probe2, setProbe2] = useState<string | null>(null);
  const [unsafeBlocked, setUnsafeBlocked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [docAnswers, setDocAnswers] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setStep("setup");
    setSelectedFunction(null);
    setProbe1(null);
    setProbe2(null);
    setUnsafeBlocked(false);
    setDocAnswers({});
  }, []);

  // ─── Step 1: Meter Setup ────────────────────────────────────────────────

  const handleFunctionSelect = (fn: MeterSetting) => {
    // Check if selecting resistance/continuity on an energized circuit
    if (exercise.circuitState === "energized" && (fn === "ohms" || fn === "continuity")) {
      setUnsafeBlocked(true);
      setSelectedFunction(fn);
      setAttempts(a => a + 1);
      return;
    }
    setUnsafeBlocked(false);
    setSelectedFunction(fn);
  };

  const confirmFunction = () => {
    if (selectedFunction === exercise.correctFunction) {
      setStep("probe");
    } else {
      // Wrong function but not unsafe — show feedback
      setAttempts(a => a + 1);
    }
  };

  // ─── Step 2: Probe Placement ────────────────────────────────────────────

  const handleTestPointTap = (pointId: string) => {
    if (!probe1) {
      setProbe1(pointId);
    } else if (!probe2 && pointId !== probe1) {
      setProbe2(pointId);
    } else {
      // Reset probes
      setProbe1(pointId);
      setProbe2(null);
    }
  };

  const confirmProbes = () => {
    if (!probe1 || !probe2) return;
    const correct =
      (probe1 === exercise.correctProbe1 && probe2 === exercise.correctProbe2) ||
      (probe1 === exercise.correctProbe2 && probe2 === exercise.correctProbe1);
    if (correct) {
      setStep("result");
    } else {
      setAttempts(a => a + 1);
    }
  };

  // ─── Step 3: Result ─────────────────────────────────────────────────────

  const proceedFromResult = () => {
    if (exercise.requiresDocumentation) {
      setStep("document");
    } else {
      setStep("complete");
      onComplete?.();
    }
  };

  // ─── Step 4: Documentation ──────────────────────────────────────────────

  const submitDocumentation = () => {
    setStep("complete");
    onComplete?.();
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Card className="border-[oklch(0.25_0.02_155)] bg-[oklch(0.10_0.005_250)]">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-[oklch(0.55_0.12_155)] uppercase tracking-wider">
              Meter Exercise
            </h4>
            <p className="text-white font-medium mt-1">{exercise.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="text-[oklch(0.50_0.008_250)]">
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>

        <p className="text-sm text-[oklch(0.65_0.008_250)] mb-4">{exercise.objective}</p>

        {/* Circuit State Indicator */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 ${
          exercise.circuitState === "energized"
            ? "bg-red-500/15 text-red-300 border border-red-500/30"
            : "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.65_0.12_155)] border border-[oklch(0.55_0.12_155/30%)]"
        }`}>
          <Zap className="w-3 h-3" />
          Circuit: {exercise.circuitState === "energized" ? "ENERGIZED" : "DE-ENERGIZED (LOTO applied)"}
        </div>

        {/* PLC State (if applicable) */}
        {exercise.plcState && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">
            <CircleDot className="w-3 h-3" />
            PLC {exercise.plcState.output}: {exercise.plcState.status} (software state)
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ─── STEP: Setup ─────────────────────────────────────────── */}
          {step === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-white mb-3 font-medium">Step 1: Select the correct meter function</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {METER_SETTINGS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleFunctionSelect(s.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedFunction === s.id
                        ? unsafeBlocked
                          ? "border-red-500 bg-red-500/10"
                          : "border-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/10%)]"
                        : "border-[oklch(0.20_0.005_250)] bg-[oklch(0.12_0.003_250)] hover:border-[oklch(0.30_0.01_250)]"
                    }`}
                  >
                    <span className="text-lg block">{s.symbol}</span>
                    <span className="text-xs text-[oklch(0.60_0.008_250)]">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Unsafe action blocked */}
              {unsafeBlocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg border border-red-500/40 bg-red-500/10"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 font-medium text-sm">UNSAFE — Action Blocked</p>
                      <p className="text-red-200/80 text-sm mt-1">
                        {exercise.unsafeMessage || "Resistance and continuity measurements must NOT be performed on an energized circuit. This can destroy the meter, cause an arc flash, and injure or kill you. De-energize and verify zero energy first."}
                      </p>
                      <p className="text-red-200/60 text-xs mt-2">Select the correct function for this circuit state.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Wrong function (but safe) feedback */}
              {selectedFunction && !unsafeBlocked && selectedFunction !== exercise.correctFunction && attempts > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10"
                >
                  <p className="text-amber-300 text-sm">
                    <strong>Not quite.</strong> Consider: what type of voltage or measurement does this circuit require? Is it AC or DC? Is the circuit energized or de-energized?
                  </p>
                </motion.div>
              )}

              {selectedFunction && !unsafeBlocked && (
                <Button
                  onClick={confirmFunction}
                  className="mt-4 bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white"
                >
                  Confirm Function Selection
                </Button>
              )}
            </motion.div>
          )}

          {/* ─── STEP: Probe Placement ───────────────────────────────── */}
          {step === "probe" && (
            <motion.div key="probe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-white mb-1 font-medium">Step 2: Place your test leads</p>
              <p className="text-xs text-[oklch(0.55_0.008_250)] mb-3">Tap two test points to place your red and black leads.</p>

              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className={`px-2 py-1 rounded ${probe1 ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-[oklch(0.15_0.003_250)] text-[oklch(0.45_0.008_250)] border border-[oklch(0.20_0.005_250)]"}`}>
                  Red: {probe1 ? exercise.testPoints.find(t => t.id === probe1)?.label : "—"}
                </span>
                <span className={`px-2 py-1 rounded ${probe2 ? "bg-[oklch(0.30_0.005_250)] text-white border border-[oklch(0.40_0.008_250)]" : "bg-[oklch(0.15_0.003_250)] text-[oklch(0.45_0.008_250)] border border-[oklch(0.20_0.005_250)]"}`}>
                  Black: {probe2 ? exercise.testPoints.find(t => t.id === probe2)?.label : "—"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {exercise.testPoints.map(tp => {
                  const isProbe1 = probe1 === tp.id;
                  const isProbe2 = probe2 === tp.id;
                  return (
                    <button
                      key={tp.id}
                      onClick={() => handleTestPointTap(tp.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isProbe1
                          ? "border-red-500 bg-red-500/10"
                          : isProbe2
                          ? "border-[oklch(0.50_0.008_250)] bg-[oklch(0.20_0.005_250)]"
                          : "border-[oklch(0.20_0.005_250)] bg-[oklch(0.12_0.003_250)] hover:border-[oklch(0.30_0.01_250)]"
                      }`}
                    >
                      <span className="text-sm font-medium text-white block">{tp.label}</span>
                      {tp.description && (
                        <span className="text-xs text-[oklch(0.50_0.008_250)]">{tp.description}</span>
                      )}
                      <span className="w-2 h-2 rounded-full inline-block ml-1" style={{ background: tp.color }} />
                    </button>
                  );
                })}
              </div>

              {/* Wrong placement feedback */}
              {probe1 && probe2 && attempts > 0 && !(
                (probe1 === exercise.correctProbe1 && probe2 === exercise.correctProbe2) ||
                (probe1 === exercise.correctProbe2 && probe2 === exercise.correctProbe1)
              ) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10"
                >
                  <p className="text-amber-300 text-sm">
                    <strong>Check your placement.</strong> Remember: voltage is measured between two points. Where should your reference (common) be? What point are you investigating?
                  </p>
                </motion.div>
              )}

              {probe1 && probe2 && (
                <Button
                  onClick={confirmProbes}
                  className="mt-4 bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white"
                >
                  Take Reading
                </Button>
              )}
            </motion.div>
          )}

          {/* ─── STEP: Result ────────────────────────────────────────── */}
          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-white mb-3 font-medium">Step 3: Reading</p>

              {/* Meter display */}
              <div className="bg-[oklch(0.05_0.002_250)] border border-[oklch(0.25_0.005_250)] rounded-lg p-4 mb-4 text-center">
                <p className="text-xs text-[oklch(0.45_0.008_250)] mb-1">
                  {METER_SETTINGS.find(s => s.id === selectedFunction)?.label}
                </p>
                <p className="text-3xl font-mono text-[oklch(0.55_0.12_155)] font-bold">
                  {exercise.expectedReading.reading} <span className="text-lg">{exercise.expectedReading.unit}</span>
                </p>
                <p className="text-xs text-[oklch(0.45_0.008_250)] mt-2">
                  Red: {exercise.testPoints.find(t => t.id === exercise.correctProbe1)?.label} → Black: {exercise.testPoints.find(t => t.id === exercise.correctProbe2)?.label}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-[oklch(0.50_0.008_250)] shrink-0 w-24">Verifies:</span>
                  <span className="text-[oklch(0.65_0.12_155)]">{exercise.verifies}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[oklch(0.50_0.008_250)] shrink-0 w-24">Unverified:</span>
                  <span className="text-amber-300/80">{exercise.remainsUnverified}</span>
                </div>
              </div>

              <p className="text-sm text-[oklch(0.60_0.008_250)] mt-3">{exercise.expectedReading.explanation}</p>

              <Button
                onClick={proceedFromResult}
                className="mt-4 bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white"
              >
                {exercise.requiresDocumentation ? "Document This Reading" : "Exercise Complete"}
              </Button>
            </motion.div>
          )}

          {/* ─── STEP: Documentation ─────────────────────────────────── */}
          {step === "document" && (
            <motion.div key="document" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-white mb-3 font-medium">Step 4: Document the measurement</p>
              <p className="text-xs text-[oklch(0.55_0.008_250)] mb-4">Record what you tested, what you found, and what it means.</p>

              <div className="space-y-3">
                {[
                  { key: "testPoints", label: "Test points used", placeholder: "e.g., Red: terminal A1, Black: terminal A2" },
                  { key: "actualReading", label: "Actual reading", placeholder: "e.g., 0.0V AC" },
                  { key: "expectedReading", label: "Expected reading", placeholder: "e.g., 120V AC" },
                  { key: "supports", label: "What does this result support?", placeholder: "e.g., Open circuit between output and coil" },
                  { key: "eliminates", label: "What does it weaken or eliminate?", placeholder: "e.g., Eliminates 'coil is shorted'" },
                  { key: "unverified", label: "What remains unverified?", placeholder: "e.g., Output card voltage, fuse status" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-[oklch(0.55_0.008_250)] block mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={docAnswers[field.key] || ""}
                      onChange={e => setDocAnswers(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.005_250)] text-white text-sm placeholder:text-[oklch(0.35_0.005_250)] focus:border-[oklch(0.55_0.12_155)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={submitDocumentation}
                disabled={Object.values(docAnswers).filter(v => v.trim()).length < 4}
                className="mt-4 bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white disabled:opacity-40"
              >
                Submit Documentation
              </Button>
            </motion.div>
          )}

          {/* ─── STEP: Complete ───────────────────────────────────────── */}
          {step === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-[oklch(0.55_0.12_155)] mx-auto mb-3" />
                <p className="text-white font-medium">Exercise Complete</p>
                <p className="text-sm text-[oklch(0.55_0.008_250)] mt-1">
                  You correctly selected {METER_SETTINGS.find(s => s.id === exercise.correctFunction)?.label}, placed leads on the correct test points, and interpreted the reading.
                </p>
                <Button variant="ghost" onClick={reset} className="mt-3 text-[oklch(0.55_0.12_155)]">
                  <RotateCcw className="w-4 h-4 mr-1" /> Practice Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
