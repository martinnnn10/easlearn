/**
 * SimulatorEngine - Interactive Troubleshooting Experience
 * Typography: Oswald (headings), Inter (body), Share Tech Mono (labels/data)
 * 
 * Features:
 * - Step-by-step decision tree navigation
 * - Interactive tool panels (Multimeter, Prints, Flashlight)
 * - Real-time timer and scoring
 * - Hint system with penalty
 * - Consequence feedback with voltage/signal readings
 * - Completion summary with grade and breakdown
 */

import { useState, useEffect, useCallback, useRef } from "react";
import ContentProtection from "@/components/ContentProtection";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Target,
  RotateCcw,
  ChevronRight,
  Lightbulb,
  Shield,
  Activity,
  Award,
  TrendingUp,
  X,
  Gauge,
  FileText,
  Flashlight,
} from "lucide-react";
import type { ScenarioData, SimulatorStep, DecisionOption } from "@/data/scenarios";

interface SimulatorEngineProps {
  scenario: ScenarioData;
  onExit: () => void;
  onComplete: (results: SimulationResults) => void;
}

export interface SimulationResults {
  scenarioId: string;
  scenarioTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  totalTime: number;
  decisions: DecisionRecord[];
  hintsUsed: number;
  perfectPath: boolean;
}

interface DecisionRecord {
  stepTitle: string;
  chosenOption: string;
  wasCorrect: boolean;
  scoreImpact: number;
  timeSpent: number;
}

function getGrade(percentage: number): string {
  if (percentage >= 95) return "MASTER";
  if (percentage >= 85) return "SPECIALIST";
  if (percentage >= 70) return "JOURNEYMAN";
  if (percentage >= 50) return "APPRENTICE";
  return "TRAINEE";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "MASTER": return "oklch(0.62 0.17 145)";
    case "SPECIALIST": return "oklch(0.62 0.17 145)";
    case "JOURNEYMAN": return "oklch(0.75 0.12 75)";
    case "APPRENTICE": return "oklch(0.7 0.12 50)";
    default: return "oklch(0.65 0.18 25)";
  }
}

// Tool panel data based on scenario context
function getMultimeterReading(scenarioId: string, stepId: string): { label: string; value: string; unit: string }[] {
  const readings: Record<string, Record<string, { label: string; value: string; unit: string }[]>> = {
    "conveyor-estop": {
      "step-1": [
        { label: "Control Voltage (L1-N)", value: "120.3", unit: "VAC" },
        { label: "Safety Relay Input", value: "0.0", unit: "VDC" },
        { label: "E-Stop Chain Continuity", value: "OL", unit: "Ω" },
      ],
      "step-2": [
        { label: "E-Stop Station 3 (across contacts)", value: "120.1", unit: "VAC" },
        { label: "Mounting Bracket Ground", value: "0.2", unit: "Ω" },
      ],
      "step-3": [
        { label: "Safety Relay Output", value: "0.0", unit: "VAC" },
        { label: "After Reset - Safety Relay", value: "120.1", unit: "VAC" },
      ],
    },
    "24vdc-loss": {
      "step-1": [
        { label: "24VDC Supply Output", value: "23.8", unit: "VDC" },
        { label: "Load Current (clamp)", value: "8.7", unit: "A" },
        { label: "Supply Rating", value: "10.0", unit: "A max" },
      ],
      "step-2": [
        { label: "Voltage During Valve Cycle", value: "18.4", unit: "VDC" },
        { label: "Peak Inrush Current", value: "11.2", unit: "A" },
        { label: "PLC Min Voltage Spec", value: "19.2", unit: "VDC" },
      ],
    },
    "vfd-ramp": {
      "step-1": [
        { label: "Motor Insulation (Megger)", value: ">500", unit: "MΩ" },
        { label: "Drive Output Voltage", value: "387", unit: "VAC" },
        { label: "Current at Fault (42Hz)", value: "38.2", unit: "A" },
      ],
      "step-2": [
        { label: "Motor FLA (nameplate)", value: "32", unit: "A" },
        { label: "Accel Time (current)", value: "10", unit: "sec" },
        { label: "Accel Time (required)", value: "30", unit: "sec" },
      ],
    },
    "starter-chatter": {
      "step-1": [
        { label: "Panel Incoming (L1-N)", value: "118.2", unit: "VAC" },
        { label: "Coil Voltage (during chatter)", value: "97", unit: "VAC" },
        { label: "Coil Rated Voltage", value: "120", unit: "VAC" },
      ],
      "step-2": [
        { label: "CT Secondary (loaded)", value: "109", unit: "VAC" },
        { label: "CT Rating", value: "150", unit: "VA" },
        { label: "Actual Load (calculated)", value: "185", unit: "VA" },
      ],
    },
  };
  return readings[scenarioId]?.[stepId] || [
    { label: "Control Voltage", value: "120.1", unit: "VAC" },
    { label: "Signal Present", value: "24.0", unit: "VDC" },
  ];
}

function getCircuitDiagram(scenarioId: string): { title: string; lines: string[] } {
  const diagrams: Record<string, { title: string; lines: string[] }> = {
    "conveyor-estop": {
      title: "SAFETY CIRCUIT — SERIES E-STOP CHAIN",
      lines: [
        "L1 ─── [FUSE 3A] ─── E-STOP 1 (NC) ─── E-STOP 2 (NC) ───┐",
        "                                                             │",
        "┌── E-STOP 3 (NC) ─── E-STOP 4 (NC) ─── GATE SW (NC) ────┘",
        "│",
        "└─── [SAFETY RELAY COIL K1] ─── N",
        "",
        "K1-1 (NO) ──── PLC INPUT (Safety OK)",
        "K1-2 (NO) ──── CONTACTOR ENABLE",
      ],
    },
    "24vdc-loss": {
      title: "24VDC DISTRIBUTION — POWER SUPPLY CIRCUIT",
      lines: [
        "480VAC ─── [XFMR] ─── 24VDC SUPPLY (10A) ─── [FUSE] ───┐",
        "                                                           │",
        "┌─── DIST BLOCK ─────────────────────────────────────────┘",
        "├─── PLC CPU (2.1A)",
        "├─── HMI (0.8A)",
        "├─── I/O MODULES (2.3A)",
        "└─── SOLENOID BANK x12 (3.5A steady / 11.2A peak)",
        "",
        "TOTAL STEADY: 8.7A / 10A RATED (87%)",
        "TOTAL PEAK:  11.2A / 10A RATED (OVERLOAD)",
      ],
    },
    "vfd-ramp": {
      title: "VFD MOTOR CIRCUIT — 25HP EXHAUST FAN",
      lines: [
        "480VAC ─── [DISC] ─── [FUSE] ─── VFD INPUT (L1/L2/L3) ───┐",
        "                                                             │",
        "VFD OUTPUT (T1/T2/T3) ─── [COUPLING] ─── MOTOR 25HP ──────┘",
        "",
        "DRIVE PARAMS:",
        "  Accel Time: P001 = 10s (DEFAULT) ← SHOULD BE 30s",
        "  Decel Time: P002 = 10s (DEFAULT) ← SHOULD BE 45s",
        "  Motor FLA:  P003 = 32A ✓",
        "  Current Limit: P004 = 40A ✓",
      ],
    },
    "starter-chatter": {
      title: "MOTOR STARTER CONTROL CIRCUIT",
      lines: [
        "CT SEC (120VAC) ─── [FUSE 5A] ─── CR1 (NO) ───┐",
        "                                                  │",
        "┌─── OL (NC) ─── AUX (NC) ─── [COIL M1] ─── N ┘",
        "│",
        "├─── SEAL-IN: M1 AUX (NO) PARALLEL WITH CR1",
        "",
        "CT LOAD CALCULATION:",
        "  7 COILS × 26VA = 182VA",
        "  INDICATORS = 3VA",
        "  TOTAL = 185VA / 150VA RATED (OVERLOADED)",
      ],
    },
  };
  return diagrams[scenarioId] || { title: "CONTROL CIRCUIT", lines: ["No diagram available for this step."] };
}

function getFlashlightClue(scenarioId: string, stepId: string): string {
  const clues: Record<string, Record<string, string>> = {
    "conveyor-estop": {
      "step-1": "Shining flashlight along the E-stop chain: Station 1 button flush (OK). Station 2 button flush (OK). Station 3 — button is EXTENDED approximately 1/4 inch. Mounting bracket shows one bolt missing, slight wobble when touched. Adjacent stamping press vibration is noticeable.",
      "step-2": "Close inspection of Station 3 mount: Bracket is single-bolt mounted (should be two). Remaining bolt shows wear marks from vibration. E-stop button housing has scuff marks consistent with repeated contact/release cycling.",
      "step-3": "Safety relay panel: K1 indicator is RED (fault). After reset: K1 indicator turns GREEN. All wiring connections appear tight. No signs of overheating.",
    },
    "24vdc-loss": {
      "step-1": "Inside panel: 24VDC supply LED shows GREEN (normal). The supply housing feels warm to the touch — warmer than typical. The load indicator bar on the supply front shows approximately 85% (near the amber zone). Terminal connections appear tight.",
      "step-2": "Solenoid valve bank: 12 solenoids visible, all with indicator LEDs. During machine cycle, you can see 6-8 LEDs energize simultaneously during the clamp sequence. Wire routing is clean. No signs of damage or overheating at terminals.",
    },
    "vfd-ramp": {
      "step-1": "Drive display shows F012 fault code. The coupling guard is reinstalled after PM. Looking through the guard inspection window: coupling alignment appears acceptable — no visible offset. Motor shaft rotates freely by hand (drive de-energized). No unusual sounds from bearings.",
      "step-2": "Drive keypad parameter display: Scrolling through parameters, several show DEFAULT values (indicated by asterisk). The PM crew's lockout tag is still on the disconnect — they powered down the drive completely during the coupling job.",
    },
    "starter-chatter": {
      "step-1": "Panel interior: The chattering contactor (M7) is visibly vibrating. The armature is rapidly cycling — you can see the gap opening and closing. The panel is noticeably warm. Looking at the control transformer: it's a small 150VA unit mounted in the corner. The nameplate is partially obscured by wire routing.",
      "step-2": "Control transformer nameplate: '150VA, 480V/120V'. Counting connected loads: 7 starter coils visible on this section, plus 3 pilot lights. The transformer case feels hot — hotter than normal operating temperature. No burnt smell, but it's working hard.",
    },
  };
  return clues[scenarioId]?.[stepId] || "Visual inspection reveals no obvious abnormalities. Check electrical measurements for further diagnosis.";
}

// Tool Panel Modal Component
function ToolPanel({ 
  tool, 
  scenarioId, 
  stepId, 
  onClose 
}: { 
  tool: "multimeter" | "prints" | "flashlight"; 
  scenarioId: string; 
  stepId: string; 
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[oklch(0_0_0/70%)] backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-[oklch(0.1_0.003_250)] border border-[oklch(0.25_0.004_250)] rounded overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[oklch(0.2_0.004_250)] bg-[oklch(0.08_0.003_250)]">
          <div className="flex items-center gap-2.5">
            {tool === "multimeter" && <Gauge className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />}
            {tool === "prints" && <FileText className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />}
            {tool === "flashlight" && <Flashlight className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />}
            <span className="font-mono-industrial text-[11px] text-[oklch(0.55_0.12_155)] tracking-wider">
              {tool === "multimeter" && "DIGITAL MULTIMETER — FLUKE 87V"}
              {tool === "prints" && "ELECTRICAL PRINTS"}
              {tool === "flashlight" && "VISUAL INSPECTION"}
            </span>
          </div>
          <button onClick={onClose} className="text-[oklch(0.5_0.008_250)] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {tool === "multimeter" && (
            <div className="space-y-3">
              <div className="bg-[oklch(0.06_0.002_250)] border border-[oklch(0.2_0.004_250)] rounded p-4">
                <div className="text-center mb-4">
                  <div className="inline-block bg-[oklch(0.05_0.002_200)] border border-[oklch(0.25_0.004_250)] rounded px-6 py-3">
                    <span className="font-mono-industrial text-2xl text-[oklch(0.55_0.12_155)]">
                      {getMultimeterReading(scenarioId, stepId)[0]?.value || "---"}
                    </span>
                    <span className="font-mono-industrial text-sm text-[oklch(0.5_0.008_250)] ml-2">
                      {getMultimeterReading(scenarioId, stepId)[0]?.unit || ""}
                    </span>
                  </div>
                </div>
                {getMultimeterReading(scenarioId, stepId).map((reading, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[oklch(0.15_0.003_250)] last:border-0">
                    <span className="text-[12px] text-[oklch(0.55_0.008_250)]">{reading.label}</span>
                    <span className="font-mono-industrial text-[13px] text-white">
                      {reading.value} <span className="text-[oklch(0.5_0.008_250)]">{reading.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[oklch(0.4_0.006_250)] font-mono-industrial">
                Readings taken at current test points. Rotate selector for different measurements.
              </p>
            </div>
          )}

          {tool === "prints" && (
            <div className="space-y-3">
              {(() => {
                const diagram = getCircuitDiagram(scenarioId);
                return (
                  <>
                    <div className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider mb-2">
                      {diagram.title}
                    </div>
                    <div className="bg-[oklch(0.06_0.002_250)] border border-[oklch(0.2_0.004_250)] rounded p-4 overflow-x-auto">
                      <pre className="font-mono-industrial text-[11px] text-[oklch(0.65_0.008_250)] leading-relaxed whitespace-pre">
                        {diagram.lines.join("\n")}
                      </pre>
                    </div>
                    <p className="text-[11px] text-[oklch(0.4_0.006_250)] font-mono-industrial">
                      DWG REV: C | LAST UPDATED: 2024-03-15 | SHEET 1 OF 1
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          {tool === "flashlight" && (
            <div className="space-y-3">
              <div className="bg-[oklch(0.06_0.002_250)] border border-[oklch(0.2_0.004_250)] rounded p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flashlight className="w-3.5 h-3.5 text-[oklch(0.75_0.12_75)]" />
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.75_0.12_75)] tracking-wider">VISUAL OBSERVATIONS</span>
                </div>
                <p className="text-[13px] text-[oklch(0.65_0.008_250)] leading-relaxed">
                  {getFlashlightClue(scenarioId, stepId)}
                </p>
              </div>
              <p className="text-[11px] text-[oklch(0.4_0.006_250)] font-mono-industrial">
                Inspect equipment closely. Look for physical damage, loose connections, and environmental factors.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SimulatorEngine({ scenario, onExit, onComplete }: SimulatorEngineProps) {
  const [currentStepId, setCurrentStepId] = useState(scenario.steps[0].id);
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [activeTool, setActiveTool] = useState<"multimeter" | "prints" | "flashlight" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartTime = useRef(Date.now());

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Lock body scroll when simulator is mounted, unlock on unmount
  useEffect(() => {
    document.body.classList.add('sim-body-locked');
    return () => {
      document.body.classList.remove('sim-body-locked');
    };
  }, []);

  const currentStep = scenario.steps.find((s) => s.id === currentStepId) as SimulatorStep;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = useCallback((option: DecisionOption) => {
    setSelectedOption(option);
    setShowConsequence(true);
    setShowHint(false);

    const timeSpent = Math.floor((Date.now() - stepStartTime.current) / 1000);

    const record: DecisionRecord = {
      stepTitle: currentStep.title,
      chosenOption: option.text,
      wasCorrect: option.isCorrect,
      scoreImpact: option.scoreImpact,
      timeSpent,
    };

    setDecisions((prev) => [...prev, record]);
    setScore((prev) => prev + option.scoreImpact);
  }, [currentStep]);

  const handleContinue = useCallback(() => {
    if (!selectedOption) return;

    if (selectedOption.nextStepId === null) {
      if (timerRef.current) clearInterval(timerRef.current);

      const finalScore = score;
      const percentage = Math.max(0, Math.round((finalScore / scenario.perfectScore) * 100));
      const grade = getGrade(percentage);
      const perfectPath = decisions.every((d) => d.wasCorrect) && (selectedOption.isCorrect);

      const simulationResults: SimulationResults = {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        totalScore: finalScore,
        maxScore: scenario.perfectScore,
        percentage,
        grade,
        totalTime: elapsedTime,
        decisions: [...decisions],
        hintsUsed,
        perfectPath,
      };

      setResults(simulationResults);
      setIsComplete(true);
      onComplete(simulationResults);
    } else {
      setCurrentStepId(selectedOption.nextStepId);
      setSelectedOption(null);
      setShowConsequence(false);
      stepStartTime.current = Date.now();
    }
  }, [selectedOption, score, scenario, decisions, elapsedTime, hintsUsed, onComplete]);

  const handleUseHint = () => {
    if (!showHint && currentStep.hint) {
      setShowHint(true);
      setHintsUsed((prev) => prev + 1);
      setScore((prev) => prev - 3);
    }
  };

  // Completion Screen
  if (isComplete && results) {
    return <CompletionScreen results={results} scenario={scenario} onExit={onExit} />;
  }

  return (
    <ContentProtection className="fixed inset-0 z-[100] bg-[oklch(0.06_0.003_250)] overflow-y-auto">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[oklch(0.08_0.003_250/97%)] backdrop-blur-md border-b border-[oklch(0.2_0.004_250)]">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-[11px] font-mono-industrial text-[oklch(0.5_0.008_250)] hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              EXIT
            </button>
            <div className="h-4 w-px bg-[oklch(0.2_0.004_250)]" />
            <span className="text-[11px] font-mono-industrial text-[oklch(0.55_0.12_155)]">
              {scenario.difficulty.toUpperCase()}
            </span>
            <span className="text-[13px] font-semibold text-white hidden sm:inline">
              {scenario.title}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
              <span className="text-[12px] font-mono-industrial text-white">
                {score}<span className="text-[oklch(0.45_0.006_250)]">/{scenario.perfectScore}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[oklch(0.75_0.12_75)]" />
              <span className="text-[12px] font-mono-industrial text-white">{formatTime(elapsedTime)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[oklch(0.7_0.12_50)]" />
              <span className="text-[12px] font-mono-industrial text-[oklch(0.45_0.006_250)]">{hintsUsed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 lg:py-8 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
            <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider">
              STEP {decisions.length + 1} — {currentStep.title.toUpperCase()}
            </span>
          </div>
          <div className="w-full h-[3px] bg-[oklch(0.14_0.003_250)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[oklch(0.55_0.12_155)]"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(100, ((decisions.length + 1) / scenario.steps.length) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {/* Situation Panel */}
            <div className="p-5 rounded border border-[oklch(0.2_0.004_250)] bg-[oklch(0.08_0.003_250)] mb-5">
              <h2 className="text-xl sm:text-2xl font-heading text-white tracking-wide mb-3">
                {currentStep.title}
              </h2>
              <p className="text-[14px] text-[oklch(0.65_0.008_250)] leading-relaxed mb-4">
                {currentStep.description}
              </p>
              <div className="p-3.5 bg-[oklch(0.06_0.002_250)] rounded border border-[oklch(0.18_0.004_250)]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider">FIELD OBSERVATIONS</span>
                </div>
                <p className="text-[13px] text-[oklch(0.55_0.008_250)] font-mono-industrial leading-relaxed">
                  {currentStep.context}
                </p>
              </div>
            </div>

            {/* Tool Buttons */}
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTool("multimeter")}
                className="tool-btn flex items-center gap-2 text-[12px] font-mono-industrial text-[oklch(0.55_0.12_155)]"
              >
                <Gauge className="w-3.5 h-3.5" />
                Multimeter
              </button>
              <button
                onClick={() => setActiveTool("prints")}
                className="tool-btn flex items-center gap-2 text-[12px] font-mono-industrial text-[oklch(0.55_0.12_155)]"
              >
                <FileText className="w-3.5 h-3.5" />
                Prints
              </button>
              <button
                onClick={() => setActiveTool("flashlight")}
                className="tool-btn flex items-center gap-2 text-[12px] font-mono-industrial text-[oklch(0.55_0.12_155)]"
              >
                <Flashlight className="w-3.5 h-3.5" />
                Flashlight
              </button>
            </div>

            {/* Hint Button */}
            {currentStep.hint && !showHint && !showConsequence && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleUseHint}
                className="mb-4 flex items-center gap-2 px-3.5 py-2 text-[11px] font-mono-industrial text-[oklch(0.7_0.12_50)] border border-[oklch(0.7_0.12_50/25%)] rounded hover:bg-[oklch(0.7_0.12_50/6%)] hover:border-[oklch(0.7_0.12_50/40%)] transition-all"
              >
                <Lightbulb className="w-3 h-3" />
                USE HINT (-3 pts)
              </motion.button>
            )}

            {/* Hint Display */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3.5 rounded border border-[oklch(0.7_0.12_50/25%)] bg-[oklch(0.7_0.12_50/4%)]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[oklch(0.7_0.12_50)]" />
                    <span className="font-mono-industrial text-[10px] text-[oklch(0.7_0.12_50)] tracking-wider">HINT</span>
                  </div>
                  <p className="text-[13px] text-[oklch(0.7_0.12_50)]">
                    {currentStep.hint}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Decision Options */}
            {!showConsequence && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider">
                    WHAT DO YOU DO?
                  </span>
                </div>
                {currentStep.options.map((option, i) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    onClick={() => handleOptionSelect(option)}
                    className="w-full text-left p-4 rounded border border-[oklch(0.2_0.004_250)] bg-[oklch(0.09_0.003_250)] hover:border-[oklch(0.55_0.12_155/30%)] hover:bg-[oklch(0.55_0.12_155/3%)] transition-all duration-150 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded bg-[oklch(0.13_0.003_250)] border border-[oklch(0.25_0.004_250)] flex items-center justify-center shrink-0 group-hover:border-[oklch(0.55_0.12_155/30%)] transition-colors">
                        <span className="text-[11px] font-mono-industrial text-[oklch(0.45_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)]">
                          {String.fromCharCode(65 + i)}
                        </span>
                      </div>
                      <p className="text-[13px] text-[oklch(0.65_0.008_250)] group-hover:text-white transition-colors leading-relaxed pt-0.5">
                        {option.text}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Consequence Feedback */}
            <AnimatePresence>
              {showConsequence && selectedOption && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Result Banner */}
                  <div
                    className={`p-4 rounded border ${
                      selectedOption.isCorrect
                        ? "border-[oklch(0.55_0.12_155/30%)] bg-[oklch(0.55_0.12_155/5%)]"
                        : "border-[oklch(0.65_0.18_25/30%)] bg-[oklch(0.65_0.18_25/5%)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      {selectedOption.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[oklch(0.65_0.18_25)]" />
                      )}
                      <span
                        className={`font-mono-industrial text-[11px] tracking-wider ${
                          selectedOption.isCorrect ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.65_0.18_25)]"
                        }`}
                      >
                        {selectedOption.isCorrect ? "CORRECT APPROACH" : "SUBOPTIMAL DECISION"}
                      </span>
                      <span
                        className={`ml-auto font-mono-industrial text-[12px] ${
                          selectedOption.scoreImpact >= 0 ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.65_0.18_25)]"
                        }`}
                      >
                        {selectedOption.scoreImpact >= 0 ? "+" : ""}{selectedOption.scoreImpact} pts
                      </span>
                    </div>
                    <p className="text-[13px] text-[oklch(0.65_0.008_250)] leading-relaxed mb-2">
                      {selectedOption.consequence}
                    </p>
                    {/* Reading display */}
                    {selectedOption.reading && (
                      <div className="mt-3 p-2.5 bg-[oklch(0.06_0.002_250)] rounded border border-[oklch(0.18_0.004_250)]">
                        <span className="font-mono-industrial text-[10px] text-[oklch(0.5_0.008_250)] tracking-wider block mb-1">READING</span>
                        <span className="font-mono-industrial text-[12px] text-[oklch(0.72_0.1_145)]">
                          {selectedOption.reading}
                        </span>
                      </div>
                    )}
                    {selectedOption.timeImpact > 60 && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono-industrial text-[oklch(0.45_0.006_250)]">
                        <Clock className="w-3 h-3" />
                        +{Math.floor(selectedOption.timeImpact / 60)}m {selectedOption.timeImpact % 60}s added to resolution time
                      </div>
                    )}
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleContinue}
                    className="w-full btn-primary flex items-center justify-center gap-3 px-6 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded"
                  >
                    {selectedOption.nextStepId === null ? (
                      <>
                        <Award className="w-4 h-4" />
                        View Results
                      </>
                    ) : (
                      <>
                        Continue to Next Step
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tool Panel Modal */}
      <AnimatePresence>
        {activeTool && (
          <ToolPanel
            tool={activeTool}
            scenarioId={scenario.id}
            stepId={currentStepId}
            onClose={() => setActiveTool(null)}
          />
        )}
      </AnimatePresence>
    </ContentProtection>
  );
}

// Completion Screen Component
function CompletionScreen({
  results,
  scenario,
  onExit,
}: {
  results: SimulationResults;
  scenario: ScenarioData;
  onExit: () => void;
}) {
  const gradeColor = getGradeColor(results.grade);

  return (
    <div className="fixed inset-0 z-[100] bg-[oklch(0.06_0.003_250)] overflow-y-auto">
      <div className="container py-10 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            
            <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider">
              SCENARIO COMPLETE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-2">
            {scenario.title}
          </h1>
          <p className="text-[oklch(0.45_0.006_250)] font-mono-industrial text-[12px]">
            {scenario.difficulty} — {scenario.type}
          </p>
        </motion.div>

        {/* Grade Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="p-6 rounded border border-[oklch(0.2_0.004_250)] bg-[oklch(0.08_0.003_250)] text-center mb-6"
        >
          <div className="text-5xl font-heading tracking-wider mb-1" style={{ color: gradeColor }}>
            {results.grade}
          </div>
          <div className="text-2xl font-mono-industrial text-white mb-1">
            {results.percentage}%
          </div>
          <div className="text-[12px] font-mono-industrial text-[oklch(0.45_0.006_250)]">
            {results.totalScore} / {results.maxScore} points
          </div>
          {results.perfectPath && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/25%)] rounded">
              <Award className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
              <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)]">PERFECT PATH — NO MISTAKES</span>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: "Resolution Time", value: formatTimeShort(results.totalTime), icon: Clock },
            { label: "Decisions Made", value: results.decisions.length.toString(), icon: Target },
            { label: "Hints Used", value: results.hintsUsed.toString(), icon: Lightbulb },
            { label: "Correct Calls", value: `${results.decisions.filter((d) => d.wasCorrect).length}/${results.decisions.length}`, icon: CheckCircle2 },
          ].map((stat, i) => (
            <div key={i} className="p-3.5 rounded border border-[oklch(0.2_0.004_250)] bg-[oklch(0.09_0.003_250)] text-center">
              <stat.icon className="w-4 h-4 text-[oklch(0.55_0.12_155)] mx-auto mb-1.5" />
              <div className="text-base font-mono-industrial text-white">{stat.value}</div>
              <div className="font-mono-industrial text-[9px] text-[oklch(0.45_0.006_250)] tracking-wider">{stat.label.toUpperCase()}</div>
            </div>
          ))}
        </motion.div>

        {/* Decision Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="p-5 rounded border border-[oklch(0.2_0.004_250)] bg-[oklch(0.08_0.003_250)] mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
            <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider">DECISION TIMELINE</span>
          </div>
          <div className="space-y-2.5">
            {results.decisions.map((decision, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-3 rounded border ${
                  decision.wasCorrect
                    ? "border-[oklch(0.55_0.12_155/15%)] bg-[oklch(0.55_0.12_155/2%)]"
                    : "border-[oklch(0.65_0.18_25/15%)] bg-[oklch(0.65_0.18_25/2%)]"
                }`}
              >
                {decision.wasCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[oklch(0.65_0.18_25)] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] mb-0.5">{decision.stepTitle}</div>
                  <div className="text-[13px] text-[oklch(0.65_0.008_250)] truncate">
                    {decision.chosenOption}
                  </div>
                </div>
                <span
                  className={`font-mono-industrial text-[11px] shrink-0 ${
                    decision.scoreImpact >= 0 ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.65_0.18_25)]"
                  }`}
                >
                  {decision.scoreImpact >= 0 ? "+" : ""}{decision.scoreImpact}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={onExit}
            className="flex-1 btn-primary flex items-center justify-center gap-2.5 px-5 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded"
          >
            <RotateCcw className="w-4 h-4" />
            Back to Scenarios
          </button>
          <button
            onClick={onExit}
            className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.55_0.12_155)] font-semibold text-[13px] tracking-wider uppercase rounded hover:bg-[oklch(0.55_0.12_155/5%)] hover:border-[oklch(0.55_0.12_155/40%)] transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            Next Scenario
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function formatTimeShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
