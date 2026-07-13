/**
 * Motor Starter Troubleshooting Simulator
 * Interactive 3-wire control circuit with fault injection.
 * Users use a virtual multimeter to trace faults through a standard
 * 120VAC Start/Stop motor control circuit (control transformer fed) with seal-in,
 * OL NC aux (95–96), and contactor coil — aligned with Motor Controls lesson 20.
 * Motor power (480VAC 3-phase) is not shown; only the control ladder.
 *
 * Faults: Open OL contact, failed start button, broken seal-in, blown fuse, open stop button
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, RotateCcw, Zap, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle } from "lucide-react";

import { MotorStarterLadderSvg } from "./MotorStarterLadderSvg";
import ViewStandardReferenceButton from "@/components/standards/ViewStandardReferenceButton";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TestPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  description: string;
}

interface Fault {
  id: string;
  name: string;
  description: string;
  symptom: string;
  /** Which test points show abnormal readings */
  affectedReadings: Record<string, { voltage: string; continuity: string }>;
  /** The correct diagnosis */
  correctAnswer: string;
  acceptableAnswers: string[];
  /** Repair action */
  repair: string;
}

type MeterMode = "voltage" | "continuity";
type ProbeState = { from: string | null; to: string | null };

// ─── Circuit Test Points ───────────────────────────────────────────────────────

const CONTROL_VOLTAGE = "120V";

const TEST_POINTS: TestPoint[] = [
  { id: "L1", label: "L1", x: 12, y: 4, description: "Control hot — Wire 1 / L1 (120VAC from control transformer)" },
  { id: "N", label: "N", x: 88, y: 4, description: "Control neutral — Wire 2 (0V reference)" },
  { id: "F1-top", label: "F1 Top", x: 12, y: 14, description: "Fuse F1 — line side" },
  { id: "F1-bot", label: "F1 Bot", x: 12, y: 18, description: "Fuse F1 — load side" },
  { id: "STOP-top", label: "Stop Top", x: 12, y: 26, description: "Stop button — line side (NC)" },
  { id: "STOP-bot", label: "Stop Bot", x: 12, y: 34, description: "Stop button — load side" },
  { id: "START-top", label: "Start Top", x: 12, y: 45, description: "Start button — line side (NO)" },
  { id: "START-bot", label: "Start Bot", x: 35, y: 59, description: "Start button — load side" },
  { id: "SEAL-top", label: "Seal Top", x: 12, y: 69, description: "Seal-in contact M — line side" },
  { id: "SEAL-bot", label: "Seal Bot", x: 35, y: 74, description: "Seal-in contact M — load side" },
  { id: "OL-top", label: "OL Top", x: 35, y: 76, description: "Overload contact — line side (NC)" },
  { id: "OL-bot", label: "OL Bot", x: 35, y: 81, description: "Overload contact — load side" },
  { id: "COIL-A1", label: "Coil A1", x: 35, y: 89, description: "Motor starter coil — A1 terminal" },
  { id: "COIL-A2", label: "Coil A2", x: 88, y: 89, description: "Motor starter coil — A2 terminal" },
];

// ─── Normal readings (no fault) ────────────────────────────────────────────────

const NORMAL_READINGS: Record<string, Record<string, { voltage: string; continuity: string }>> = (() => {
  const readings: Record<string, Record<string, { voltage: string; continuity: string }>> = {};
  // Build default readings between all pairs
  for (const tp1 of TEST_POINTS) {
    readings[tp1.id] = {};
    for (const tp2 of TEST_POINTS) {
      if (tp1.id === tp2.id) {
        readings[tp1.id][tp2.id] = { voltage: "0V", continuity: "0.0Ω (short)" };
      } else {
        readings[tp1.id][tp2.id] = { voltage: "---", continuity: "OL" };
      }
    }
  }
  // Set specific normal readings for the 120VAC control circuit path
  // L1 (hot) to N (neutral) = 120V
  readings["L1"]["N"] = { voltage: CONTROL_VOLTAGE, continuity: "OL" };
  readings["N"]["L1"] = { voltage: CONTROL_VOLTAGE, continuity: "OL" };
  // Fuse (closed)
  readings["F1-top"]["F1-bot"] = { voltage: "0V", continuity: "0.1Ω" };
  readings["F1-bot"]["F1-top"] = { voltage: "0V", continuity: "0.1Ω" };
  // Stop button (NC - closed normally)
  readings["STOP-top"]["STOP-bot"] = { voltage: "0V", continuity: "0.2Ω" };
  readings["STOP-bot"]["STOP-top"] = { voltage: "0V", continuity: "0.2Ω" };
  // Start button (NO - open normally)
  readings["START-top"]["START-bot"] = { voltage: CONTROL_VOLTAGE, continuity: "OL" };
  readings["START-bot"]["START-top"] = { voltage: CONTROL_VOLTAGE, continuity: "OL" };
  // Seal-in contact (open when de-energized)
  readings["SEAL-top"]["SEAL-bot"] = { voltage: CONTROL_VOLTAGE, continuity: "OL" };
  readings["SEAL-bot"]["SEAL-top"] = { voltage: CONTROL_VOLTAGE, continuity: "OL" };
  // OL contact (NC - closed normally)
  readings["OL-top"]["OL-bot"] = { voltage: "0V", continuity: "0.1Ω" };
  readings["OL-bot"]["OL-top"] = { voltage: "0V", continuity: "0.1Ω" };
  // Coil (has resistance)
  readings["COIL-A1"]["COIL-A2"] = { voltage: "0V", continuity: "45Ω" };
  readings["COIL-A2"]["COIL-A1"] = { voltage: "0V", continuity: "45Ω" };
  // L1 to F1-top (same node)
  readings["L1"]["F1-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["F1-top"]["L1"] = { voltage: "0V", continuity: "0.0Ω" };
  // F1-bot to STOP-top (same node)
  readings["F1-bot"]["STOP-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["STOP-top"]["F1-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  // STOP-bot to START-top and SEAL-top (same node)
  readings["STOP-bot"]["START-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["START-top"]["STOP-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["STOP-bot"]["SEAL-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["SEAL-top"]["STOP-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["START-top"]["SEAL-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["SEAL-top"]["START-top"] = { voltage: "0V", continuity: "0.0Ω" };
  // START-bot to SEAL-bot to OL-top (same node)
  readings["START-bot"]["SEAL-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["SEAL-bot"]["START-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["START-bot"]["OL-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["OL-top"]["START-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["SEAL-bot"]["OL-top"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["OL-top"]["SEAL-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  // OL-bot to COIL-A1 (same node)
  readings["OL-bot"]["COIL-A1"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["COIL-A1"]["OL-bot"] = { voltage: "0V", continuity: "0.0Ω" };
  // COIL-A2 to neutral (same node)
  readings["COIL-A2"]["N"] = { voltage: "0V", continuity: "0.0Ω" };
  readings["N"]["COIL-A2"] = { voltage: "0V", continuity: "0.0Ω" };

  return readings;
})();

// ─── Faults ────────────────────────────────────────────────────────────────────

const FAULTS: Fault[] = [
  {
    id: "blown-fuse",
    name: "Blown Control Fuse",
    description: "Fuse F1 has opened due to a downstream short that has since been cleared.",
    symptom: "Pressing START does nothing. No hum from the contactor. Indicator light is off.",
    affectedReadings: {
      "F1-top|F1-bot": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
      "F1-bot|F1-top": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
    },
    correctAnswer: "Blown fuse F1",
    acceptableAnswers: ["blown fuse", "fuse", "open fuse", "f1", "fuse f1", "blown f1"],
    repair: "Replace fuse F1 with same class/rating. Investigate root cause of original short before re-energizing.",
  },
  {
    id: "open-ol",
    name: "Tripped Overload Relay",
    description: "The thermal overload relay has tripped due to sustained overcurrent.",
    symptom: "Motor was running, then stopped. Pressing START does nothing. OL trip flag is showing.",
    affectedReadings: {
      "OL-top|OL-bot": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
      "OL-bot|OL-top": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
    },
    correctAnswer: "Tripped overload relay",
    acceptableAnswers: ["overload", "ol", "tripped overload", "overload relay", "thermal overload", "ol tripped", "open ol"],
    repair: "Allow motor to cool. Investigate cause of overcurrent (mechanical binding, phase loss, bearing failure). Reset OL relay.",
  },
  {
    id: "broken-seal",
    name: "Failed Seal-In Contact",
    description:
      "The seal-in auxiliary contact (NO) failed to close when the coil energized, or the wire to the aux contact is open.",
    symptom: "Motor starts when holding START button but drops out immediately when released.",
    affectedReadings: {
      "SEAL-top|SEAL-bot": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
      "SEAL-bot|SEAL-top": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
    },
    correctAnswer: "Failed seal-in contact",
    acceptableAnswers: ["seal-in", "seal", "auxiliary contact", "seal in contact", "broken seal", "failed seal", "holding contact"],
    repair: "Replace auxiliary contact block on motor starter. Check for correct NO/NC configuration. Verify wire terminations.",
  },
  {
    id: "open-stop",
    name: "Open Stop Button Wiring",
    description: "The wire from the stop button load side has broken or come loose from the terminal.",
    symptom: "Pressing START does nothing. Stop button feels normal mechanically.",
    affectedReadings: {
      "STOP-top|STOP-bot": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
      "STOP-bot|STOP-top": { voltage: CONTROL_VOLTAGE, continuity: "OL" },
    },
    correctAnswer: "Open stop button circuit",
    acceptableAnswers: ["stop button", "open stop", "stop wire", "stop", "broken stop", "stop button wiring"],
    repair: "Check wire terminations at stop button. Re-terminate loose wire. Verify NC contact operation with meter.",
  },
  {
    id: "open-coil",
    name: "Open Motor Starter Coil",
    description: "The motor starter coil has burned open internally.",
    symptom: "Pressing START does nothing. No hum or click from contactor. All upstream wiring tests good.",
    affectedReadings: {
      "COIL-A1|COIL-A2": { voltage: "0V", continuity: "OL" },
      "COIL-A2|COIL-A1": { voltage: "0V", continuity: "OL" },
    },
    correctAnswer: "Open motor starter coil",
    acceptableAnswers: ["open coil", "coil", "burned coil", "starter coil", "contactor coil", "coil open"],
    repair:
      "Replace motor starter or coil assembly. Match control circuit voltage (typically 120VAC from control transformer). Verify transformer output before re-energizing.",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function MotorStarterSimulator() {
  const [currentFaultIndex, setCurrentFaultIndex] = useState(0);
  const [meterMode, setMeterMode] = useState<MeterMode>("voltage");
  const [probes, setProbes] = useState<ProbeState>({ from: null, to: null });
  const [reading, setReading] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<string[]>([]);
  const [userDiagnosis, setUserDiagnosis] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameOver, setGameOver] = useState(false);

  // Shuffle faults for variety
  const shuffledFaults = useMemo(() => {
    const arr = [...FAULTS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [gameOver]);

  const currentFault = shuffledFaults[currentFaultIndex];

  const getReading = useCallback((from: string, to: string): string => {
    const key = `${from}|${to}`;
    const reverseKey = `${to}|${from}`;
    // Check if this pair is affected by the current fault
    if (currentFault.affectedReadings[key]) {
      return meterMode === "voltage"
        ? currentFault.affectedReadings[key].voltage
        : currentFault.affectedReadings[key].continuity;
    }
    if (currentFault.affectedReadings[reverseKey]) {
      return meterMode === "voltage"
        ? currentFault.affectedReadings[reverseKey].voltage
        : currentFault.affectedReadings[reverseKey].continuity;
    }
    // Use normal readings
    const normal = NORMAL_READINGS[from]?.[to];
    if (normal) {
      return meterMode === "voltage" ? normal.voltage : normal.continuity;
    }
    return meterMode === "voltage" ? "---" : "OL";
  }, [currentFault, meterMode]);

  const handleProbeClick = (pointId: string) => {
    if (showResult) return;
    if (!probes.from) {
      setProbes({ from: pointId, to: null });
      setReading(null);
    } else if (!probes.to && pointId !== probes.from) {
      const newReading = getReading(probes.from, pointId);
      setProbes({ from: probes.from, to: pointId });
      setReading(newReading);
      const measurementLog = `${meterMode === "voltage" ? "V" : "Ω"}: ${probes.from} → ${pointId} = ${newReading}`;
      setMeasurements(prev => [...prev.slice(-7), measurementLog]);
    } else {
      // Reset probes
      setProbes({ from: pointId, to: null });
      setReading(null);
    }
  };

  const submitDiagnosis = () => {
    if (!userDiagnosis.trim()) return;
    const normalized = userDiagnosis.trim().toLowerCase();
    const correct = currentFault.acceptableAnswers.some(
      a => normalized.includes(a) || a.includes(normalized)
    );
    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextFault = () => {
    if (currentFaultIndex >= shuffledFaults.length - 1) {
      setGameOver(true);
    } else {
      setCurrentFaultIndex(prev => prev + 1);
      setProbes({ from: null, to: null });
      setReading(null);
      setMeasurements([]);
      setUserDiagnosis("");
      setShowResult(false);
    }
  };

  const resetGame = () => {
    setCurrentFaultIndex(0);
    setProbes({ from: null, to: null });
    setReading(null);
    setMeasurements([]);
    setUserDiagnosis("");
    setShowResult(false);
    setIsCorrect(false);
    setScore({ correct: 0, total: 0 });
    setGameOver(false);
  };

  const scorePercent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // ─── Game Over ─────────────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-xl bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)]"
        >
          <Wrench className={`w-16 h-16 mx-auto mb-4 ${scorePercent >= 80 ? 'text-[oklch(0.70_0.15_85)]' : scorePercent >= 60 ? 'text-[oklch(0.55_0.12_155)]' : 'text-[oklch(0.50_0.008_250)]'}`} />
          <h3 className="text-2xl font-bold text-white mb-2">Troubleshooting Complete!</h3>
          <p className="text-lg text-[oklch(0.65_0.008_250)] mb-4">
            Faults diagnosed: <span className="text-white font-semibold">{score.correct}/{score.total}</span> ({scorePercent}%)
          </p>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mb-6">
            {scorePercent >= 80 ? "Excellent troubleshooting skills! You'd clear these faults fast on the floor." :
             scorePercent >= 60 ? "Good diagnostic approach. Practice the systematic method to improve." :
             "Review the 3-wire control circuit fundamentals and try again."}
          </p>
          <button
            onClick={resetGame}
            className="px-5 py-2.5 rounded-lg bg-[oklch(0.35_0.10_155)] hover:bg-[oklch(0.40_0.12_155)] text-white font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" /> New Scenario Set
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[oklch(0.60_0.15_30)]" />
            Motor Starter Troubleshooter
          </h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">
            120VAC 3-wire control ladder (Wire 1 hot / Wire 2 neutral) — motor power at 480VAC is separate
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewStandardReferenceButton symbolId="coil" />
          <div className="text-sm text-[oklch(0.65_0.008_250)]">
            Fault {currentFaultIndex + 1}/{shuffledFaults.length} | Score: {score.correct}/{score.total}
          </div>
        </div>
      </div>

      {/* Symptom Card */}
      <div className="bg-[oklch(0.12_0.04_30/20%)] border border-[oklch(0.25_0.08_30/40%)] rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[oklch(0.70_0.15_60)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-[oklch(0.80_0.08_60)]">Reported Symptom</p>
            <p className="text-sm text-[oklch(0.70_0.04_60)] mt-1">{currentFault.symptom}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Circuit Diagram */}
        <div className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-xl p-4">
          <p className="text-xs text-[oklch(0.45_0.008_250)] mb-3 uppercase tracking-wider">
            120VAC 3-Wire Control — L1 (hot) to N (neutral) — click test points to probe
          </p>
          
          <div className="relative w-full" style={{ paddingBottom: "100%" }}>
            <MotorStarterLadderSvg />

            {/* Clickable test points */}
            {TEST_POINTS.map(tp => (
              <button
                key={tp.id}
                onClick={() => handleProbeClick(tp.id)}
                className={`absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-150 diag-touch-target ${
                  probes.from === tp.id
                    ? "bg-red-500 border-red-300 scale-125 z-10"
                    : probes.to === tp.id
                    ? "bg-black border-white scale-125 z-10"
                    : "bg-[oklch(0.20_0.06_155)] border-[oklch(0.40_0.10_155)] hover:bg-[oklch(0.30_0.08_155)] hover:scale-110"
                }`}
                style={{ left: `${tp.x}%`, top: `${tp.y}%` }}
                title={`${tp.label}: ${tp.description}`}
              />
            ))}
          </div>

          {/* Test point legend */}
          <div className="mt-2 flex items-center gap-3 text-[10px] text-[oklch(0.50_0.008_250)]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Red probe
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-black border border-white inline-block" /> Black probe
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.20_0.06_155)] border border-[oklch(0.40_0.10_155)] inline-block" /> Test point
            </span>
          </div>
        </div>

        {/* Meter & Controls */}
        <div className="space-y-3">
          {/* Meter Display */}
          <div className="bg-[oklch(0.06_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[oklch(0.45_0.008_250)] uppercase tracking-wider">Digital Multimeter</span>
              <div className="flex rounded-md overflow-hidden border border-[oklch(0.20_0.004_250)]">
                <button
                  onClick={() => { setMeterMode("voltage"); setProbes({ from: null, to: null }); setReading(null); }}
                  className={`px-3 py-1 text-xs font-medium ${meterMode === "voltage" ? "bg-[oklch(0.25_0.08_30)] text-white" : "text-[oklch(0.50_0.008_250)]"}`}
                >
                  V (Voltage)
                </button>
                <button
                  onClick={() => { setMeterMode("continuity"); setProbes({ from: null, to: null }); setReading(null); }}
                  className={`px-3 py-1 text-xs font-medium ${meterMode === "continuity" ? "bg-[oklch(0.25_0.08_155)] text-white" : "text-[oklch(0.50_0.008_250)]"}`}
                >
                  Ω (Continuity)
                </button>
              </div>
            </div>

            {/* Reading display */}
            <div className="bg-[oklch(0.03_0.003_250)] rounded-lg p-4 text-center border border-[oklch(0.12_0.004_250)]">
              <p className="text-3xl font-mono font-bold text-[oklch(0.85_0.15_155)]">
                {reading || (probes.from ? "Select 2nd point..." : "Select test points")}
              </p>
              <p className="text-xs text-[oklch(0.45_0.008_250)] mt-1">
                {probes.from && probes.to
                  ? `${TEST_POINTS.find(t => t.id === probes.from)?.label} → ${TEST_POINTS.find(t => t.id === probes.to)?.label}`
                  : probes.from
                  ? `Red: ${TEST_POINTS.find(t => t.id === probes.from)?.label}`
                  : "Click two test points on the circuit"
                }
              </p>
            </div>
          </div>

          {/* Measurement Log */}
          <div className="bg-[oklch(0.06_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-lg p-3">
            <p className="text-xs text-[oklch(0.45_0.008_250)] mb-2 uppercase tracking-wider">Measurement Log</p>
            <div className="space-y-1 min-h-[80px] max-h-[120px] overflow-y-auto">
              {measurements.length === 0 ? (
                <p className="text-xs text-[oklch(0.35_0.006_250)] italic">No measurements yet. Click test points to take readings.</p>
              ) : (
                measurements.map((m, i) => (
                  <p key={i} className="text-xs font-mono text-[oklch(0.65_0.008_250)]">{m}</p>
                ))
              )}
            </div>
          </div>

          {/* Diagnosis Input */}
          {!showResult ? (
            <div className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-lg p-4">
              <p className="text-xs text-[oklch(0.45_0.008_250)] mb-2 uppercase tracking-wider">Your Diagnosis</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userDiagnosis}
                  onChange={(e) => setUserDiagnosis(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitDiagnosis(); }}
                  placeholder="What's the fault?"
                  className="flex-1 px-3 py-2 rounded-lg bg-[oklch(0.05_0.003_250)] border border-[oklch(0.20_0.004_250)] text-white placeholder:text-[oklch(0.35_0.006_250)] focus:outline-none focus:border-[oklch(0.40_0.10_155)] text-sm"
                />
                <button
                  onClick={submitDiagnosis}
                  disabled={!userDiagnosis.trim()}
                  className="px-4 py-2 rounded-lg bg-[oklch(0.35_0.10_155)] hover:bg-[oklch(0.40_0.12_155)] disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
              <button
                onClick={() => {
                  setUserDiagnosis("");
                  setShowResult(true);
                  setIsCorrect(false);
                  setScore(prev => ({ ...prev, total: prev.total + 1 }));
                }}
                className="mt-2 text-xs text-[oklch(0.45_0.008_250)] hover:text-[oklch(0.60_0.008_250)] flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" /> Give up — show answer
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-lg p-4 space-y-3"
              >
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isCorrect ? 'bg-[oklch(0.15_0.06_155/30%)]' : 'bg-[oklch(0.15_0.06_25/30%)]'}`}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-[oklch(0.65_0.15_155)]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[oklch(0.65_0.15_25)]" />
                  )}
                  <span className="text-sm text-white font-medium">
                    {isCorrect ? "Correct diagnosis!" : `The fault was: ${currentFault.correctAnswer}`}
                  </span>
                </div>
                <div className="text-xs text-[oklch(0.60_0.008_250)] space-y-1">
                  <p><span className="text-[oklch(0.45_0.008_250)]">Explanation:</span> {currentFault.description}</p>
                  <p><span className="text-[oklch(0.45_0.008_250)]">Repair:</span> {currentFault.repair}</p>
                </div>
                <button
                  onClick={nextFault}
                  className="w-full px-4 py-2 rounded-lg bg-[oklch(0.18_0.004_250)] hover:bg-[oklch(0.22_0.004_250)] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {currentFaultIndex >= shuffledFaults.length - 1 ? "See Final Score" : "Next Fault"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
