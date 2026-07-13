/**
 * Component ID Challenge Lab
 * Shows unlabeled NEMA / JIC SVG symbols — user must identify the component type,
 * common part numbers, and terminal names. Supports beginner (with hints) and
 * advanced (no hints) difficulty levels.
 *
 * DRAFTING STANDARDS:
 * - All symbols use outline-only line art (no filled polygons)
 * - Consistent stroke-width: 2px wires, 2px symbol bodies, 2px arrowheads
 * - NEMA / JIC / IEEE 315 compliant geometry
 * - No labels on challenge symbols (user must identify without text cues)
 */
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RotateCcw, Zap, Brain, CheckCircle2, XCircle, ArrowRight, Star } from "lucide-react";

// ─── Symbol Database ───────────────────────────────────────────────────────────

interface SymbolChallenge {
  id: string;
  category: string;
  correctName: string;
  acceptableAnswers: string[];
  terminals: string[];
  partNumbers: string[];
  hint: string;
  svg: React.ReactNode;
}

const SYMBOLS: SymbolChallenge[] = [
  // Diodes
  {
    id: "rectifier-diode",
    category: "Diode",
    correctName: "Standard Rectifier Diode",
    acceptableAnswers: ["rectifier", "diode", "rectifier diode", "standard diode", "1n4007"],
    terminals: ["Anode (A)", "Cathode (K)"],
    partNumbers: ["1N4007", "1N5408", "RL207"],
    hint: "Triangle pointing in direction of conventional current flow with a bar at the cathode",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full">
        <line x1="15" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M55,18 L55,62 L97,40 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        <line x1="97" y1="18" x2="97" y2="62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="97" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "zener-diode",
    category: "Diode",
    correctName: "Zener Diode",
    acceptableAnswers: ["zener", "zener diode", "voltage regulator diode", "zd"],
    terminals: ["Anode (A)", "Cathode (K)"],
    partNumbers: ["1N4742A", "1N4733A", "BZX85C"],
    hint: "Like a standard diode but the cathode bar has bent ends forming a Z-shape",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full">
        <line x1="15" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M55,18 L55,62 L97,40 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        <path d="M90,14 L97,18 L97,62 L104,66" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="97" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "schottky-diode",
    category: "Diode",
    correctName: "Schottky Diode",
    acceptableAnswers: ["schottky", "schottky diode", "schottky barrier", "hot carrier diode"],
    terminals: ["Anode (A)", "Cathode (K)"],
    partNumbers: ["1N5819", "MBR2045", "SB560"],
    hint: "Like a standard diode but the cathode bar has S-shaped curls at the ends",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full">
        <line x1="15" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M55,18 L55,62 L97,40 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        <path d="M90,14 L90,20 L97,20 L97,60 L104,60 L104,66" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="97" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "led",
    category: "Diode",
    correctName: "LED (Light Emitting Diode)",
    acceptableAnswers: ["led", "light emitting diode", "indicator diode"],
    terminals: ["Anode (A)", "Cathode (K)"],
    partNumbers: ["Panel LED", "Status indicator"],
    hint: "Standard diode with arrows pointing away indicating light emission",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full">
        <line x1="15" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M55,18 L55,62 L97,40 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        <line x1="97" y1="18" x2="97" y2="62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="97" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Emission arrows */}
        <line x1="80" y1="16" x2="72" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M72,5 L76,7 M72,5 L74,2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="88" y1="13" x2="80" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M80,2 L84,4 M80,2 L82,0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  // Transistors
  {
    id: "npn-bjt",
    category: "Transistor",
    correctName: "NPN BJT",
    acceptableAnswers: ["npn", "npn bjt", "npn transistor", "bipolar npn"],
    terminals: ["Base (B)", "Collector (C)", "Emitter (E)"],
    partNumbers: ["2N2222", "TIP31", "BD139"],
    hint: "Emitter arrow points AWAY from the base (Not Pointing iN)",
    svg: (
      <svg viewBox="0 0 140 100" className="w-full h-full">
        <line x1="15" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="32" x2="100" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="68" x2="100" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Emitter arrow (outline, pointing away) */}
        <path d="M86,80 L100,88 L90,76" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "pnp-bjt",
    category: "Transistor",
    correctName: "PNP BJT",
    acceptableAnswers: ["pnp", "pnp bjt", "pnp transistor", "bipolar pnp"],
    terminals: ["Base (B)", "Collector (C)", "Emitter (E)"],
    partNumbers: ["2N2907", "TIP32", "BD140"],
    hint: "Emitter arrow points TOWARD the base (Points iN Please)",
    svg: (
      <svg viewBox="0 0 140 100" className="w-full h-full">
        <line x1="15" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="32" x2="100" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="68" x2="100" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Emitter arrow (outline, pointing toward base) */}
        <path d="M64,62 L50,68 L60,74" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "n-mosfet",
    category: "Transistor",
    correctName: "N-Channel MOSFET",
    acceptableAnswers: ["n-channel mosfet", "nmos", "n mosfet", "n-channel", "n channel mosfet"],
    terminals: ["Gate (G)", "Drain (D)", "Source (S)"],
    partNumbers: ["IRF540N", "IRFZ44N", "2N7000"],
    hint: "Insulated gate (gap between gate and channel), body arrow points inward toward channel",
    svg: (
      <svg viewBox="0 0 140 100" className="w-full h-full">
        {/* Gate lead */}
        <line x1="15" y1="50" x2="45" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Gate plate */}
        <line x1="45" y1="22" x2="45" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Channel segments (enhancement mode) */}
        <line x1="53" y1="22" x2="53" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="42" x2="53" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="64" x2="53" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Drain */}
        <line x1="53" y1="29" x2="90" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="10" x2="90" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Source */}
        <line x1="53" y1="71" x2="90" y2="71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="71" x2="90" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Body connection */}
        <line x1="53" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="72" y1="29" x2="72" y2="71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Body arrow (inward — N-channel) */}
        <path d="M64,46 L72,50 L64,54" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter"/>
      </svg>
    ),
  },
  {
    id: "p-mosfet",
    category: "Transistor",
    correctName: "P-Channel MOSFET",
    acceptableAnswers: ["p-channel mosfet", "pmos", "p mosfet", "p-channel", "p channel mosfet"],
    terminals: ["Gate (G)", "Drain (D)", "Source (S)"],
    partNumbers: ["IRF9540", "IRF4905", "BS250"],
    hint: "Insulated gate (gap between gate and channel), body arrow points outward away from channel",
    svg: (
      <svg viewBox="0 0 140 100" className="w-full h-full">
        <line x1="15" y1="50" x2="45" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="45" y1="22" x2="45" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="22" x2="53" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="42" x2="53" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="64" x2="53" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="29" x2="90" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="10" x2="90" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="71" x2="90" y2="71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="71" x2="90" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="53" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="72" y1="29" x2="72" y2="71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Body arrow (outward — P-channel) */}
        <path d="M61,46 L53,50 L61,54" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter"/>
      </svg>
    ),
  },
  // Thyristors
  {
    id: "scr",
    category: "Thyristor",
    correctName: "SCR (Silicon Controlled Rectifier)",
    acceptableAnswers: ["scr", "silicon controlled rectifier", "thyristor"],
    terminals: ["Anode (A)", "Cathode (K)", "Gate (G)"],
    partNumbers: ["2N6507", "BT151", "C106D"],
    hint: "Like a diode but with a gate terminal connected near the cathode",
    svg: (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <line x1="15" y1="45" x2="55" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M55,23 L55,67 L97,45 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        <line x1="97" y1="23" x2="97" y2="67" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="97" y1="45" x2="145" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Gate lead */}
        <line x1="76" y1="56" x2="76" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="76" y1="85" x2="50" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "triac",
    category: "Thyristor",
    correctName: "TRIAC",
    acceptableAnswers: ["triac", "bidirectional thyristor", "triode ac switch"],
    terminals: ["MT1", "MT2", "Gate (G)"],
    partNumbers: ["BT136", "BTA16", "MAC228"],
    hint: "Two anti-parallel thyristors in one package — bidirectional current flow with gate control",
    svg: (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <line x1="15" y1="50" x2="48" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Upper triangle (outline) */}
        <path d="M48,30 L48,50 L72,40 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        {/* Lower triangle (outline, reversed) */}
        <path d="M72,50 L72,70 L48,60 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
        {/* Center bar */}
        <line x1="60" y1="25" x2="60" y2="75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="72" y1="50" x2="145" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Gate lead */}
        <line x1="72" y1="70" x2="72" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="72" y1="90" x2="48" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  // Industrial Control
  {
    id: "relay-coil",
    category: "Industrial Control",
    correctName: "Relay Coil",
    acceptableAnswers: ["relay coil", "coil", "relay", "contactor coil", "cr", "control relay"],
    terminals: ["A1 (+)", "A2 (-)"],
    partNumbers: ["CR (Control Relay)", "K (Contactor)", "M (Motor Starter)"],
    hint: "Rectangle or circle with coil designation — energizes to change contact states",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full electrical-diagram">
        <line x1="15" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="80" cy="40" r="18" fill="none" stroke="currentColor" strokeWidth="2"/>
        <line x1="98" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "no-contact",
    category: "Industrial Control",
    correctName: "Normally Open (NO) Contact",
    acceptableAnswers: ["no contact", "normally open", "no", "normally open contact", "xic"],
    terminals: ["Line side", "Load side"],
    partNumbers: ["Auxiliary contact", "OL contact (NO)"],
    hint: "Two lines with a gap — closes when the associated coil is energized",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full electrical-diagram">
        <line x1="15" y1="40" x2="48" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="48" y1="22" x2="48" y2="58" stroke="currentColor" strokeWidth="2"/>
        <line x1="112" y1="22" x2="112" y2="58" stroke="currentColor" strokeWidth="2"/>
        <line x1="112" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "nc-contact",
    category: "Industrial Control",
    correctName: "Normally Closed (NC) Contact",
    acceptableAnswers: ["nc contact", "normally closed", "nc", "normally closed contact", "xio"],
    terminals: ["Line side", "Load side"],
    partNumbers: ["OL contact (NC)", "Stop button", "Safety contact"],
    hint: "Two lines connected with a diagonal bar — opens when the associated coil is energized",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full electrical-diagram">
        <line x1="15" y1="40" x2="48" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="48" y1="22" x2="48" y2="58" stroke="currentColor" strokeWidth="2"/>
        <line x1="52" y1="22" x2="108" y2="58" stroke="currentColor" strokeWidth="2"/>
        <line x1="112" y1="22" x2="112" y2="58" stroke="currentColor" strokeWidth="2"/>
        <line x1="112" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "limit-switch-roller",
    category: "Industrial Control",
    correctName: "Limit Switch (Roller Lever)",
    acceptableAnswers: ["limit switch", "ls", "roller limit switch", "mechanical limit switch", "roller lever"],
    terminals: ["COM", "NO or NC"],
    partNumbers: ["Allen-Bradley 802T", "Omron D4MC", "Honeywell GLAA"],
    hint: "Contact symbol with a roller actuator mechanism — activated by physical contact with machinery",
    svg: (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <line x1="15" y1="60" x2="55" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="60" x2="55" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="105" y1="60" x2="105" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="105" y1="60" x2="145" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Open contact gap */}
        <line x1="55" y1="54" x2="67" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="93" y1="54" x2="105" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Actuator arm */}
        <line x1="80" y1="54" x2="80" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="80" y1="30" x2="102" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Roller */}
        <circle cx="107" cy="22" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: "motor-symbol",
    category: "Industrial Control",
    correctName: "Three-Phase Motor",
    acceptableAnswers: ["motor", "3 phase motor", "three phase motor", "induction motor", "ac motor"],
    terminals: ["T1/U", "T2/V", "T3/W"],
    partNumbers: ["NEMA Frame 56-449", "NEMA Frame 143T-449T"],
    hint: "Circle with 'M' designation — represents any rotating machine (motor or generator)",
    svg: (
      <svg viewBox="0 0 140 100" className="w-full h-full">
        <circle cx="70" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2"/>
        <text x="70" y="57" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor" fontFamily="monospace">M</text>
        <line x1="70" y1="85" x2="70" y2="98" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <text x="70" y="18" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="monospace">3~</text>
      </svg>
    ),
  },
  {
    id: "fuse",
    category: "Industrial Control",
    correctName: "Fuse",
    acceptableAnswers: ["fuse", "overcurrent protection", "fuse element"],
    terminals: ["Line", "Load"],
    partNumbers: ["Class CC", "Class J", "Class RK5"],
    hint: "Rectangle with a thin element inside — melts to break the circuit on overcurrent",
    svg: (
      <svg viewBox="0 0 160 80" className="w-full h-full">
        <line x1="15" y1="40" x2="50" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="50" y="27" width="60" height="26" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
        <line x1="55" y1="40" x2="105" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="110" y1="40" x2="145" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

type Difficulty = "beginner" | "advanced";

export function ComponentIDChallenge() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Shuffle symbols for each game
  const shuffledSymbols = useMemo(() => {
    const arr = [...SYMBOLS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 10); // 10 questions per round
  }, [gameOver]); // Re-shuffle on new game

  const currentSymbol = shuffledSymbols[currentIndex];

  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;
    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const correct = currentSymbol.acceptableAnswers.some(
      a => normalizedAnswer.includes(a.toLowerCase()) || a.toLowerCase().includes(normalizedAnswer)
    );
    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [userAnswer, currentSymbol]);

  const nextQuestion = () => {
    if (currentIndex >= shuffledSymbols.length - 1) {
      setGameOver(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer("");
      setShowResult(false);
      setShowHint(false);
    }
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setScore({ correct: 0, total: 0 });
    setGameOver(false);
    setShowHint(false);
  };

  const scorePercent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // ─── Game Over Screen ──────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-xl bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)]"
        >
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${scorePercent >= 80 ? 'text-[oklch(0.70_0.15_85)]' : scorePercent >= 60 ? 'text-[oklch(0.55_0.12_155)]' : 'text-[oklch(0.50_0.008_250)]'}`} />
          <h3 className="text-2xl font-bold text-white mb-2">Challenge Complete!</h3>
          <p className="text-lg text-[oklch(0.65_0.008_250)] mb-1">
            Score: <span className="text-white font-semibold">{score.correct}/{score.total}</span> ({scorePercent}%)
          </p>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mb-1">
            Difficulty: <span className="capitalize text-white">{difficulty}</span>
          </p>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mb-6">
            {scorePercent >= 90 ? "Outstanding! You know your symbols cold." :
             scorePercent >= 70 ? "Good work! A few more rounds and you'll master them all." :
             scorePercent >= 50 ? "Getting there — keep practicing the ones you missed." :
             "Keep studying the reference page and try again!"}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetGame}
              className="px-5 py-2.5 rounded-lg bg-[oklch(0.35_0.10_155)] hover:bg-[oklch(0.40_0.12_155)] text-white font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Challenge UI ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-[oklch(0.60_0.15_280)]" />
            Component ID Challenge
          </h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">
            Identify the electrical symbol — type the component name
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Difficulty toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[oklch(0.18_0.004_250)]">
            <button
              onClick={() => { setDifficulty("beginner"); resetGame(); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${difficulty === "beginner" ? "bg-[oklch(0.25_0.08_155)] text-white" : "bg-transparent text-[oklch(0.50_0.008_250)] hover:text-white"}`}
            >
              Beginner
            </button>
            <button
              onClick={() => { setDifficulty("advanced"); resetGame(); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${difficulty === "advanced" ? "bg-[oklch(0.25_0.08_280)] text-white" : "bg-transparent text-[oklch(0.50_0.008_250)] hover:text-white"}`}
            >
              Advanced
            </button>
          </div>
          {/* Score */}
          <div className="text-sm text-[oklch(0.65_0.008_250)]">
            <Star className="w-3.5 h-3.5 inline mr-1 text-[oklch(0.70_0.15_85)]" />
            {score.correct}/{score.total}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[oklch(0.12_0.004_250)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[oklch(0.45_0.12_155)] transition-all duration-300"
          style={{ width: `${((currentIndex) / shuffledSymbols.length) * 100}%` }}
        />
      </div>

      {/* Symbol Display */}
      <motion.div
        key={currentSymbol.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[oklch(0.45_0.008_250)] uppercase tracking-wider">
            Question {currentIndex + 1} of {shuffledSymbols.length}
          </span>
          {difficulty === "beginner" && (
            <span className="text-xs px-2 py-0.5 rounded bg-[oklch(0.15_0.04_250)] text-[oklch(0.60_0.08_250)]">
              {currentSymbol.category}
            </span>
          )}
        </div>

        {/* SVG Symbol — large and clear */}
        <div className="w-full max-w-xs mx-auto h-28 flex items-center justify-center text-white mb-5">
          {currentSymbol.svg}
        </div>

        {/* Hint (beginner only) */}
        {difficulty === "beginner" && (
          <div className="mb-4">
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-[oklch(0.50_0.10_200)] hover:text-[oklch(0.60_0.12_200)] transition-colors"
              >
                Need a hint?
              </button>
            ) : (
              <p className="text-xs text-[oklch(0.55_0.06_200)] italic bg-[oklch(0.08_0.02_200/20%)] px-3 py-2 rounded">
                {currentSymbol.hint}
              </p>
            )}
          </div>
        )}

        {/* Answer Input */}
        {!showResult ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") checkAnswer(); }}
              placeholder="Type component name..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-[oklch(0.06_0.003_250)] border border-[oklch(0.20_0.004_250)] text-white placeholder:text-[oklch(0.35_0.006_250)] focus:outline-none focus:border-[oklch(0.40_0.10_155)] text-sm"
              autoFocus
            />
            <button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="px-5 py-2.5 rounded-lg bg-[oklch(0.35_0.10_155)] hover:bg-[oklch(0.40_0.12_155)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              Check
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Result */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${isCorrect ? 'bg-[oklch(0.15_0.06_155/30%)] border border-[oklch(0.35_0.12_155/40%)]' : 'bg-[oklch(0.15_0.06_25/30%)] border border-[oklch(0.35_0.12_25/40%)]'}`}>
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-[oklch(0.65_0.15_155)]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[oklch(0.65_0.15_25)]" />
                )}
                <span className="text-sm text-white font-medium">
                  {isCorrect ? "Correct!" : `Incorrect — it's a ${currentSymbol.correctName}`}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[oklch(0.08_0.003_250)] rounded-lg p-3">
                  <p className="text-[oklch(0.45_0.008_250)] mb-1">Terminals</p>
                  <p className="text-white">{currentSymbol.terminals.join(", ")}</p>
                </div>
                <div className="bg-[oklch(0.08_0.003_250)] rounded-lg p-3">
                  <p className="text-[oklch(0.45_0.008_250)] mb-1">Part Numbers</p>
                  <p className="text-white">{currentSymbol.partNumbers.join(", ")}</p>
                </div>
                <div className="bg-[oklch(0.08_0.003_250)] rounded-lg p-3">
                  <p className="text-[oklch(0.45_0.008_250)] mb-1">Category</p>
                  <p className="text-white">{currentSymbol.category}</p>
                </div>
              </div>

              {/* Next button */}
              <button
                onClick={nextQuestion}
                className="w-full px-4 py-2.5 rounded-lg bg-[oklch(0.18_0.004_250)] hover:bg-[oklch(0.22_0.004_250)] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {currentIndex >= shuffledSymbols.length - 1 ? "See Results" : "Next Symbol"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
