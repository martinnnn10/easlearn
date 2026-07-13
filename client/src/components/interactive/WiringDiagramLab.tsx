/**
 * WiringDiagramLab — Interactive Wiring Diagram Reading Challenges
 *
 * Presents one-line and three-line diagrams where users must:
 * 1. Trace circuit paths from source to load
 * 2. Identify wire numbers at specific junctions
 * 3. Determine which breaker feeds a given load
 *
 * Uses SVG-based interactive diagrams with clickable wire segments and components.
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, RotateCcw, ChevronRight, CheckCircle, XCircle,
  Target, Award, ArrowRight, Cable, CircuitBoard
} from "lucide-react";
import {
  WiringBreaker,
  WiringContactor,
  WiringDisconnect,
  WiringFuse,
  WiringMotor,
  WiringOverload,
  WiringDeviceLabel,
} from "@/lib/wiringDiagramSymbols";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface WireSegment {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  wireNumber?: string;
  isPartOfPath?: string[]; // which challenge paths include this segment
}

interface DiagramComponent {
  id: string;
  type: "breaker" | "contactor" | "overload" | "motor" | "transformer" | "disconnect" | "fuse" | "junction" | "bus";
  label: string;
  x: number; y: number;
  feedsFrom?: string; // breaker/source that feeds this
}

interface Challenge {
  id: string;
  type: "trace_path" | "identify_wire" | "find_breaker";
  question: string;
  diagramId: string;
  correctAnswer: string | string[]; // wire IDs for trace, wire number for identify, breaker ID for find
  hint?: string;
  explanation: string;
}

interface Diagram {
  id: string;
  title: string;
  description: string;
  viewBox: string;
  wires: WireSegment[];
  components: DiagramComponent[];
}

// ─── DIAGRAM DATA ───────────────────────────────────────────────────────────

const DIAGRAMS: Diagram[] = [
  {
    id: "one-line-mcc",
    title: "MCC One-Line Diagram",
    description: "Motor Control Center — 480V distribution",
    viewBox: "0 0 600 400",
    wires: [
      // Main bus
      { id: "w1", x1: 300, y1: 20, x2: 300, y2: 60, wireNumber: "L1-480V", isPartOfPath: ["path-motor1", "path-motor2", "path-motor3"] },
      // Breaker 1 branch
      { id: "w2", x1: 300, y1: 60, x2: 100, y2: 60, wireNumber: "BUS-A", isPartOfPath: ["path-motor1"] },
      { id: "w3", x1: 100, y1: 60, x2: 100, y2: 110, wireNumber: "1", isPartOfPath: ["path-motor1"] },
      { id: "w4", x1: 100, y1: 140, x2: 100, y2: 190, wireNumber: "2", isPartOfPath: ["path-motor1"] },
      { id: "w5", x1: 100, y1: 220, x2: 100, y2: 270, wireNumber: "3", isPartOfPath: ["path-motor1"] },
      { id: "w6", x1: 100, y1: 300, x2: 100, y2: 350, wireNumber: "T1", isPartOfPath: ["path-motor1"] },
      // Breaker 2 branch
      { id: "w7", x1: 300, y1: 60, x2: 300, y2: 110, wireNumber: "BUS-A", isPartOfPath: ["path-motor2"] },
      { id: "w8", x1: 300, y1: 140, x2: 300, y2: 190, wireNumber: "4", isPartOfPath: ["path-motor2"] },
      { id: "w9", x1: 300, y1: 220, x2: 300, y2: 270, wireNumber: "5", isPartOfPath: ["path-motor2"] },
      { id: "w10", x1: 300, y1: 300, x2: 300, y2: 350, wireNumber: "T2", isPartOfPath: ["path-motor2"] },
      // Breaker 3 branch
      { id: "w11", x1: 300, y1: 60, x2: 500, y2: 60, wireNumber: "BUS-A", isPartOfPath: ["path-motor3"] },
      { id: "w12", x1: 500, y1: 60, x2: 500, y2: 110, wireNumber: "6", isPartOfPath: ["path-motor3"] },
      { id: "w13", x1: 500, y1: 140, x2: 500, y2: 190, wireNumber: "7", isPartOfPath: ["path-motor3"] },
      { id: "w14", x1: 500, y1: 220, x2: 500, y2: 270, wireNumber: "8", isPartOfPath: ["path-motor3"] },
      { id: "w15", x1: 500, y1: 300, x2: 500, y2: 350, wireNumber: "T3", isPartOfPath: ["path-motor3"] },
    ],
    components: [
      { id: "main-bus", type: "bus", label: "480V BUS", x: 300, y: 20 },
      { id: "cb1", type: "breaker", label: "CB1\n30A", x: 100, y: 110, feedsFrom: "main-bus" },
      { id: "cb2", type: "breaker", label: "CB2\n50A", x: 300, y: 110, feedsFrom: "main-bus" },
      { id: "cb3", type: "breaker", label: "CB3\n100A", x: 500, y: 110, feedsFrom: "main-bus" },
      { id: "k1", type: "contactor", label: "K1", x: 100, y: 190, feedsFrom: "cb1" },
      { id: "k2", type: "contactor", label: "K2", x: 300, y: 190, feedsFrom: "cb2" },
      { id: "k3", type: "contactor", label: "K3", x: 500, y: 190, feedsFrom: "cb3" },
      { id: "ol1", type: "overload", label: "OL1\n7.6A", x: 100, y: 270, feedsFrom: "cb1" },
      { id: "ol2", type: "overload", label: "OL2\n12A", x: 300, y: 270, feedsFrom: "cb2" },
      { id: "ol3", type: "overload", label: "OL3\n25A", x: 500, y: 270, feedsFrom: "cb3" },
      { id: "m1", type: "motor", label: "M1\n5HP", x: 100, y: 350, feedsFrom: "cb1" },
      { id: "m2", type: "motor", label: "M2\n10HP", x: 300, y: 350, feedsFrom: "cb2" },
      { id: "m3", type: "motor", label: "M3\n25HP", x: 500, y: 350, feedsFrom: "cb3" },
    ],
  },
  {
    id: "three-line-starter",
    title: "Three-Line Motor Starter",
    description: "Full voltage non-reversing starter — 3-phase detail",
    viewBox: "0 0 500 450",
    wires: [
      // Phase L1
      { id: "t1", x1: 100, y1: 20, x2: 100, y2: 70, wireNumber: "L1", isPartOfPath: ["path-l1"] },
      { id: "t2", x1: 100, y1: 100, x2: 100, y2: 150, wireNumber: "1", isPartOfPath: ["path-l1"] },
      { id: "t3", x1: 100, y1: 180, x2: 100, y2: 230, wireNumber: "T1", isPartOfPath: ["path-l1"] },
      { id: "t4", x1: 100, y1: 260, x2: 100, y2: 310, wireNumber: "T1", isPartOfPath: ["path-l1"] },
      { id: "t5", x1: 100, y1: 340, x2: 100, y2: 400, wireNumber: "T1", isPartOfPath: ["path-l1"] },
      // Phase L2
      { id: "t6", x1: 250, y1: 20, x2: 250, y2: 70, wireNumber: "L2", isPartOfPath: ["path-l2"] },
      { id: "t7", x1: 250, y1: 100, x2: 250, y2: 150, wireNumber: "2", isPartOfPath: ["path-l2"] },
      { id: "t8", x1: 250, y1: 180, x2: 250, y2: 230, wireNumber: "T2", isPartOfPath: ["path-l2"] },
      { id: "t9", x1: 250, y1: 260, x2: 250, y2: 310, wireNumber: "T2", isPartOfPath: ["path-l2"] },
      { id: "t10", x1: 250, y1: 340, x2: 250, y2: 400, wireNumber: "T2", isPartOfPath: ["path-l2"] },
      // Phase L3
      { id: "t11", x1: 400, y1: 20, x2: 400, y2: 70, wireNumber: "L3", isPartOfPath: ["path-l3"] },
      { id: "t12", x1: 400, y1: 100, x2: 400, y2: 150, wireNumber: "3", isPartOfPath: ["path-l3"] },
      { id: "t13", x1: 400, y1: 180, x2: 400, y2: 230, wireNumber: "T3", isPartOfPath: ["path-l3"] },
      { id: "t14", x1: 400, y1: 260, x2: 400, y2: 310, wireNumber: "T3", isPartOfPath: ["path-l3"] },
      { id: "t15", x1: 400, y1: 340, x2: 400, y2: 400, wireNumber: "T3", isPartOfPath: ["path-l3"] },
      // Dashed mechanical link lines
      { id: "link1", x1: 100, y1: 165, x2: 400, y2: 165, wireNumber: "MECH" },
      { id: "link2", x1: 100, y1: 245, x2: 400, y2: 245, wireNumber: "MECH" },
    ],
    components: [
      { id: "fuse-l1", type: "fuse", label: "FU1", x: 100, y: 70 },
      { id: "fuse-l2", type: "fuse", label: "FU2", x: 250, y: 70 },
      { id: "fuse-l3", type: "fuse", label: "FU3", x: 400, y: 70 },
      { id: "cont-l1", type: "contactor", label: "M", x: 100, y: 150 },
      { id: "cont-l2", type: "contactor", label: "M", x: 250, y: 150 },
      { id: "cont-l3", type: "contactor", label: "M", x: 400, y: 150 },
      { id: "ol-l1", type: "overload", label: "OL", x: 100, y: 230 },
      { id: "ol-l2", type: "overload", label: "OL", x: 250, y: 230 },
      { id: "ol-l3", type: "overload", label: "OL", x: 400, y: 230 },
      { id: "disc-l1", type: "disconnect", label: "DS", x: 100, y: 310 },
      { id: "disc-l2", type: "disconnect", label: "DS", x: 250, y: 310 },
      { id: "disc-l3", type: "disconnect", label: "DS", x: 400, y: 310 },
      { id: "motor", type: "motor", label: "M\n15HP", x: 250, y: 400 },
    ],
  },
];

// ─── CHALLENGES ─────────────────────────────────────────────────────────────

const CHALLENGES: Challenge[] = [
  // One-line MCC challenges
  {
    id: "c1",
    type: "find_breaker",
    question: "Which circuit breaker feeds Motor M1 (5HP)?",
    diagramId: "one-line-mcc",
    correctAnswer: "cb1",
    hint: "Follow the path from the motor up through the overload and contactor.",
    explanation: "Motor M1 is fed through OL1 → K1 → CB1 (30A). The 30A breaker is sized for the 5HP motor's full-load current of 7.6A.",
  },
  {
    id: "c2",
    type: "trace_path",
    question: "Trace the complete power path from the 480V bus to Motor M2 (10HP). Click each wire segment in order.",
    diagramId: "one-line-mcc",
    correctAnswer: ["w1", "w7", "w8", "w9", "w10"],
    hint: "Start at the main bus, go through CB2, then K2, OL2, and finally to M2.",
    explanation: "The path is: 480V Bus → CB2 (50A) → K2 (contactor) → OL2 (12A overload) → M2. Wire numbers: BUS-A → 4 → 5 → T2.",
  },
  {
    id: "c3",
    type: "identify_wire",
    question: "What is the wire number between CB3 and contactor K3?",
    diagramId: "one-line-mcc",
    correctAnswer: "7",
    hint: "Look at the wire segment between the breaker output and the contactor input on the right branch.",
    explanation: "Wire #7 connects CB3's load side to contactor K3's line side. This is the feeder wire for the 25HP motor branch.",
  },
  {
    id: "c4",
    type: "find_breaker",
    question: "Motor M3 (25HP) has tripped its overload. Which breaker must you lock out before resetting OL3?",
    diagramId: "one-line-mcc",
    correctAnswer: "cb3",
    hint: "Trace upstream from OL3 to find the protective device.",
    explanation: "CB3 (100A) is the upstream protective device for the M3 branch. LOTO requires locking out the breaker before working on any downstream component.",
  },
  {
    id: "c5",
    type: "identify_wire",
    question: "What is the wire number between contactor K1 and overload OL1?",
    diagramId: "one-line-mcc",
    correctAnswer: "3",
    hint: "Look at the wire segment between the contactor output and the overload input on the left branch.",
    explanation: "Wire #3 connects K1's load side to OL1's line side. This carries motor current when the contactor is energized.",
  },
  // Three-line starter challenges
  {
    id: "c6",
    type: "trace_path",
    question: "Trace the L1 phase path from line to motor. Click each wire segment in order.",
    diagramId: "three-line-starter",
    correctAnswer: ["t1", "t2", "t3", "t4", "t5"],
    hint: "Follow L1 through fuse FU1, contactor M, overload OL, disconnect DS, to the motor.",
    explanation: "L1 path: Line → FU1 (fuse) → M (contactor contact) → OL (overload heater) → DS (disconnect) → Motor terminal T1.",
  },
  {
    id: "c7",
    type: "identify_wire",
    question: "What is the wire number between the L2 fuse (FU2) and the contactor?",
    diagramId: "three-line-starter",
    correctAnswer: "2",
    hint: "Look at the middle phase, between the fuse output and contactor input.",
    explanation: "Wire #2 connects FU2's load side to the L2 contactor pole. Each phase has a unique wire number between the fuse and contactor.",
  },
  {
    id: "c8",
    type: "find_breaker",
    question: "Which protective device would blow first if L3 phase has a short circuit downstream of the contactor?",
    diagramId: "three-line-starter",
    correctAnswer: "fuse-l3",
    hint: "Fuses are the first line of protection in this starter design.",
    explanation: "FU3 (L3 fuse) would blow first since it's the upstream protective device. The overload relay protects against sustained overcurrent, not short circuits.",
  },
  {
    id: "c9",
    type: "identify_wire",
    question: "What wire number connects the L3 overload to the disconnect switch?",
    diagramId: "three-line-starter",
    correctAnswer: "T3",
    hint: "Look at the wire between the overload output and disconnect input on the right phase.",
    explanation: "Wire T3 connects the overload relay to the disconnect switch on the L3 phase. 'T' designators indicate motor terminal wiring.",
  },
  {
    id: "c10",
    type: "trace_path",
    question: "Trace the L2 phase path from line to motor. Click each wire segment in order.",
    diagramId: "three-line-starter",
    correctAnswer: ["t6", "t7", "t8", "t9", "t10"],
    hint: "Follow L2 through fuse FU2, contactor M, overload OL, disconnect DS, to the motor.",
    explanation: "L2 path: Line → FU2 → M (contactor) → OL (overload) → DS (disconnect) → Motor terminal T2.",
  },
];

// ─── SVG RENDERING HELPERS ──────────────────────────────────────────────────

function renderComponent(comp: DiagramComponent, isHighlighted: boolean, isAnswer: boolean, onClick: () => void) {
  const baseClass = "cursor-pointer transition-all duration-200";
  const strokeColor = isAnswer ? "#34d399" : isHighlighted ? "#fbbf24" : "#9ca3af";

  switch (comp.type) {
    case "breaker":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <WiringBreaker x={comp.x} y={comp.y} color={strokeColor} />
          <WiringDeviceLabel x={comp.x + 28} y={comp.y - 8} lines={comp.label.split("\n")} color={strokeColor} />
        </g>
      );
    case "contactor":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <WiringContactor x={comp.x} y={comp.y} color={strokeColor} />
          <WiringDeviceLabel x={comp.x + 28} y={comp.y - 6} lines={comp.label.split("\n")} color={strokeColor} />
        </g>
      );
    case "overload":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <WiringOverload x={comp.x} y={comp.y} color={strokeColor} />
          <WiringDeviceLabel x={comp.x + 28} y={comp.y - 6} lines={comp.label.split("\n")} color={strokeColor} />
        </g>
      );
    case "motor":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <WiringMotor
            x={comp.x}
            y={comp.y}
            color={strokeColor}
            hpLabel={comp.label.includes("\n") ? comp.label.split("\n")[1] : undefined}
          />
        </g>
      );
    case "fuse":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <WiringFuse x={comp.x} y={comp.y} color={strokeColor} />
          <WiringDeviceLabel x={comp.x + 22} y={comp.y - 4} lines={[comp.label]} color={strokeColor} />
        </g>
      );
    case "disconnect":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <WiringDisconnect x={comp.x} y={comp.y} color={strokeColor} />
          <WiringDeviceLabel x={comp.x + 22} y={comp.y - 4} lines={[comp.label]} color={strokeColor} />
        </g>
      );
    case "bus":
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <rect
            x={comp.x - 200}
            y={comp.y - 8}
            width={400}
            height={16}
            rx={2}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          <text
            x={comp.x}
            y={comp.y + 4}
            textAnchor="middle"
            className="diag-text-primary"
            fill={strokeColor}
            style={{ fontFamily: "var(--diag-font-mono)" }}
          >
            {comp.label}
          </text>
        </g>
      );
    default:
      return (
        <g key={comp.id} onClick={onClick} className={baseClass}>
          <circle cx={comp.x} cy={comp.y} r={6} fill="transparent" stroke={strokeColor} strokeWidth={1.5} />
          <WiringDeviceLabel x={comp.x + 10} y={comp.y - 4} lines={[comp.label]} color={strokeColor} />
        </g>
      );
  }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function WiringDiagramLab() {
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [selectedWires, setSelectedWires] = useState<string[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [wireAnswer, setWireAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  const challenge = CHALLENGES[currentChallengeIdx];
  const diagram = useMemo(() => DIAGRAMS.find(d => d.id === challenge.diagramId)!, [challenge.diagramId]);

  const handleWireClick = useCallback((wireId: string) => {
    if (isSubmitted) return;
    if (challenge.type === "trace_path") {
      setSelectedWires(prev => {
        if (prev.includes(wireId)) {
          return prev.filter(w => w !== wireId);
        }
        return [...prev, wireId];
      });
    }
  }, [challenge.type, isSubmitted]);

  const handleComponentClick = useCallback((compId: string) => {
    if (isSubmitted) return;
    if (challenge.type === "find_breaker") {
      setSelectedComponent(prev => prev === compId ? null : compId);
    }
  }, [challenge.type, isSubmitted]);

  const handleSubmit = () => {
    let correct = false;

    if (challenge.type === "trace_path") {
      const correctPath = challenge.correctAnswer as string[];
      correct = selectedWires.length === correctPath.length &&
        selectedWires.every((w, i) => w === correctPath[i]);
    } else if (challenge.type === "identify_wire") {
      correct = wireAnswer.trim().toLowerCase() === (challenge.correctAnswer as string).toLowerCase();
    } else if (challenge.type === "find_breaker") {
      correct = selectedComponent === challenge.correctAnswer;
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentChallengeIdx < CHALLENGES.length - 1) {
      setCurrentChallengeIdx(prev => prev + 1);
      resetChallenge();
    } else {
      setCompleted(true);
    }
  };

  const resetChallenge = () => {
    setSelectedWires([]);
    setSelectedComponent(null);
    setWireAnswer("");
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  const resetLab = () => {
    setCurrentChallengeIdx(0);
    setScore({ correct: 0, total: 0 });
    setCompleted(false);
    resetChallenge();
  };

  const canSubmit = () => {
    if (challenge.type === "trace_path") return selectedWires.length > 0;
    if (challenge.type === "identify_wire") return wireAnswer.trim().length > 0;
    if (challenge.type === "find_breaker") return selectedComponent !== null;
    return false;
  };

  // ─── COMPLETION SCREEN ──────────────────────────────────────────────────────

  if (completed) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="card-panel p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            pct >= 80 ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-amber-500/15 border border-amber-500/30"
          }`}>
            {pct >= 80 ? <Award className="w-8 h-8 text-emerald-400" /> : <Target className="w-8 h-8 text-amber-400" />}
          </div>
          <h3 className="text-xl font-heading text-white tracking-wide mb-2">
            {pct === 100 ? "Perfect Score!" : pct >= 80 ? "Well Done!" : "Keep Practicing"}
          </h3>
          <p className="text-sm text-[oklch(0.55_0.008_250)] mb-4">
            You scored {score.correct}/{score.total} ({pct}%) on wiring diagram reading
          </p>
          <div className={`inline-block px-4 py-2 rounded-lg text-2xl font-mono font-bold mb-6 ${
            pct >= 80 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          }`}>
            {pct}%
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={resetLab} className="px-5 py-2.5 bg-[oklch(0.55_0.12_155)] text-white text-sm font-semibold rounded-lg hover:bg-[oklch(0.50_0.12_155)] transition-colors">
              <RotateCcw className="w-4 h-4 inline mr-2" />Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────

  return (
    <div className="card-panel p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
            Wiring Diagram Reading
          </h3>
          <p className="text-[10px] text-[oklch(0.50_0.008_250)] mt-0.5">
            {diagram.title} — {diagram.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[oklch(0.55_0.008_250)]">
            {currentChallengeIdx + 1}/{CHALLENGES.length}
          </span>
          <div className="w-20 h-1.5 bg-[oklch(0.12_0.003_250)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[oklch(0.55_0.12_155)] rounded-full transition-all"
              style={{ width: `${((currentChallengeIdx + 1) / CHALLENGES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Challenge Question */}
      <div className="mb-4 p-3 bg-[oklch(0.06_0.02_250)] rounded-lg border border-[oklch(0.20_0.04_250)]">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white leading-relaxed">{challenge.question}</p>
            {challenge.type === "trace_path" && !isSubmitted && (
              <p className="text-[10px] text-[oklch(0.45_0.006_250)] mt-1">Click wire segments in order from source to load</p>
            )}
            {challenge.type === "find_breaker" && !isSubmitted && (
              <p className="text-[10px] text-[oklch(0.45_0.006_250)] mt-1">Click the correct component in the diagram</p>
            )}
          </div>
          {!isSubmitted && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-[10px] text-amber-400/70 hover:text-amber-400 font-mono shrink-0"
            >
              {showHint ? "Hide Hint" : "Hint"}
            </button>
          )}
        </div>
        <AnimatePresence>
          {showHint && challenge.hint && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] text-amber-400/60 mt-2 pl-6 italic"
            >
              💡 {challenge.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* SVG Diagram */}
      <div className="mb-4 rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.04_0.003_250)] overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <svg viewBox={diagram.viewBox} className="electrical-diagram w-full min-w-0" style={{ minHeight: "280px" }}>
          {/* Wires */}
          {diagram.wires.map(wire => {
            const isSelected = selectedWires.includes(wire.id);
            const isMechLink = wire.wireNumber === "MECH";
            const isCorrectWire = isSubmitted && isCorrect && challenge.type === "trace_path" &&
              (challenge.correctAnswer as string[]).includes(wire.id);
            const isWrongWire = isSubmitted && !isCorrect && selectedWires.includes(wire.id) &&
              !(challenge.correctAnswer as string[]).includes(wire.id);
            const isCorrectButMissed = isSubmitted && !isCorrect && challenge.type === "trace_path" &&
              (challenge.correctAnswer as string[]).includes(wire.id) && !selectedWires.includes(wire.id);

            let strokeColor = "stroke-gray-600";
            if (isCorrectWire || (isSubmitted && isCorrect && isSelected)) strokeColor = "stroke-emerald-400";
            else if (isWrongWire) strokeColor = "stroke-red-400";
            else if (isCorrectButMissed) strokeColor = "stroke-emerald-400/40";
            else if (isSelected) strokeColor = "stroke-amber-400";

            return (
              <g key={wire.id}>
                <line
                  x1={wire.x1} y1={wire.y1} x2={wire.x2} y2={wire.y2}
                  className={`${strokeColor} ${!isSubmitted && !isMechLink ? "cursor-pointer hover:stroke-amber-300" : ""} transition-colors`}
                  strokeWidth={isSelected || isCorrectWire ? 3 : 2}
                  strokeDasharray={isMechLink ? "4 3" : undefined}
                  onClick={() => !isMechLink && handleWireClick(wire.id)}
                />
                {/* Wire number label */}
                {wire.wireNumber && wire.wireNumber !== "MECH" && (
                  <text
                    x={(wire.x1 + wire.x2) / 2 + (wire.x1 === wire.x2 ? 12 : 0)}
                    y={(wire.y1 + wire.y2) / 2 + (wire.y1 === wire.y2 ? -8 : 0)}
                    fontSize={10}
                    className="fill-gray-500 font-mono pointer-events-none"
                    textAnchor="middle"
                  >
                    {wire.wireNumber}
                  </text>
                )}
                {/* Selection indicator */}
                {isSelected && !isSubmitted && (
                  <text
                    x={(wire.x1 + wire.x2) / 2}
                    y={(wire.y1 + wire.y2) / 2}
                    fontSize={10}
                    className="fill-amber-400 font-mono font-bold pointer-events-none"
                    textAnchor="middle"
                    dy={wire.x1 === wire.x2 ? 0 : 14}
                    dx={wire.x1 === wire.x2 ? -14 : 0}
                  >
                    {selectedWires.indexOf(wire.id) + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Components */}
          {diagram.components.map(comp => {
            const isHighlighted = selectedComponent === comp.id;
            const isAnswer = isSubmitted && comp.id === challenge.correctAnswer;
            return renderComponent(comp, isHighlighted, isAnswer, () => handleComponentClick(comp.id));
          })}
        </svg>
      </div>

      {/* Wire Number Input (for identify_wire challenges) */}
      {challenge.type === "identify_wire" && !isSubmitted && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs text-[oklch(0.55_0.008_250)] font-mono">Wire Number:</label>
          <input
            type="text"
            value={wireAnswer}
            onChange={(e) => setWireAnswer(e.target.value)}
            placeholder="Enter wire number..."
            className="px-3 py-2 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.20_0.004_250)] rounded text-sm font-mono text-white focus:border-[oklch(0.55_0.12_155)] focus:outline-none w-40"
            onKeyDown={(e) => { if (e.key === "Enter" && canSubmit()) handleSubmit(); }}
          />
        </div>
      )}

      {/* Selected wires display for trace_path */}
      {challenge.type === "trace_path" && selectedWires.length > 0 && !isSubmitted && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[oklch(0.45_0.006_250)] font-mono">Path:</span>
          {selectedWires.map((wId, i) => (
            <span key={wId} className="flex items-center gap-1">
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] font-mono text-amber-400">
                {diagram.wires.find(w => w.id === wId)?.wireNumber || wId}
              </span>
              {i < selectedWires.length - 1 && <ArrowRight className="w-3 h-3 text-gray-600" />}
            </span>
          ))}
          <button
            onClick={() => setSelectedWires([])}
            className="text-[10px] text-gray-500 hover:text-gray-300 ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Result Feedback */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-lg border ${
              isCorrect
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-red-500/5 border-red-500/30"
            }`}
          >
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </p>
                <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1 leading-relaxed">
                  {challenge.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-[oklch(0.45_0.006_250)]">
          Score: {score.correct}/{score.total}
        </div>
        <div className="flex items-center gap-2">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="px-5 py-2.5 bg-[oklch(0.55_0.12_155)] text-white text-sm font-semibold rounded-lg hover:bg-[oklch(0.50_0.12_155)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[oklch(0.55_0.12_155/20%)]"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-[oklch(0.55_0.12_155)] text-white text-sm font-semibold rounded-lg hover:bg-[oklch(0.50_0.12_155)] transition-colors flex items-center gap-2"
            >
              {currentChallengeIdx < CHALLENGES.length - 1 ? "Next Challenge" : "See Results"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
