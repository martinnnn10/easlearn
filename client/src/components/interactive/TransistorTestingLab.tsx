/**
 * TransistorTestingLab — Interactive transistor testing simulation
 * Users select a transistor type, choose probe placement (B-E, B-C, C-E),
 * and read the multimeter display to identify healthy, shorted, or open transistors.
 * Teaches proper BJT and MOSFET testing procedure per industrial maintenance standards.
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, CheckCircle2, XCircle, Zap, Trophy, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type TransistorType = "npn" | "pnp" | "nmos" | "pmos" | "darlington" | "igbt";
type ProbePosition = "be_forward" | "be_reverse" | "bc_forward" | "bc_reverse" | "ce" | "gs" | "gd" | "ds";
type TransistorCondition = "healthy" | "shorted" | "open";

interface TransistorInfo {
  id: TransistorType;
  name: string;
  partNumber: string;
  terminals: string[];
  readings: Record<string, string>; // probe position -> reading for healthy
  shortedReadings: Record<string, string>;
  openReadings: Record<string, string>;
  description: string;
  testProcedure: string;
}

const transistorData: TransistorInfo[] = [
  {
    id: "npn",
    name: "NPN BJT",
    partNumber: "2N2222A",
    terminals: ["Base (B)", "Collector (C)", "Emitter (E)"],
    readings: {
      be_forward: "0.65V",   // Red on Base, Black on Emitter
      be_reverse: "OL",      // Red on Emitter, Black on Base
      bc_forward: "0.62V",   // Red on Base, Black on Collector
      bc_reverse: "OL",      // Red on Collector, Black on Base
      ce: "OL",              // Collector to Emitter (no base drive)
    },
    shortedReadings: {
      be_forward: "0.000V",
      be_reverse: "0.000V",
      bc_forward: "0.000V",
      bc_reverse: "0.000V",
      ce: "0.000V",
    },
    openReadings: {
      be_forward: "OL",
      be_reverse: "OL",
      bc_forward: "OL",
      bc_reverse: "OL",
      ce: "OL",
    },
    description: "Two PN junctions: B-E and B-C. Each junction tests like a diode in forward bias (0.6-0.7V). C-E should read OL without base drive. If C-E reads low, transistor is shorted.",
    testProcedure: "1. Set meter to Diode Test mode.\n2. Red probe on Base, Black on Emitter → should read 0.6-0.7V (forward B-E junction).\n3. Red on Base, Black on Collector → should read 0.6-0.7V (forward B-C junction).\n4. Reverse both tests → should read OL.\n5. Test C-E both ways → should read OL (no base drive = no conduction).",
  },
  {
    id: "pnp",
    name: "PNP BJT",
    partNumber: "2N2907A",
    terminals: ["Base (B)", "Collector (C)", "Emitter (E)"],
    readings: {
      be_forward: "0.67V",   // Red on Emitter, Black on Base (reversed vs NPN!)
      be_reverse: "OL",      // Red on Base, Black on Emitter
      bc_forward: "0.64V",   // Red on Collector, Black on Base
      bc_reverse: "OL",      // Red on Base, Black on Collector
      ce: "OL",
    },
    shortedReadings: {
      be_forward: "0.000V",
      be_reverse: "0.000V",
      bc_forward: "0.000V",
      bc_reverse: "0.000V",
      ce: "0.000V",
    },
    openReadings: {
      be_forward: "OL",
      be_reverse: "OL",
      bc_forward: "OL",
      bc_reverse: "OL",
      ce: "OL",
    },
    description: "PNP is the complement of NPN — junctions are reversed. Red probe on Emitter (P-type), Black on Base (N-type) reads forward voltage. Common in legacy industrial circuits and complementary output stages.",
    testProcedure: "1. Set meter to Diode Test mode.\n2. Red probe on Emitter, Black on Base → should read 0.6-0.7V.\n3. Red on Collector, Black on Base → should read 0.6-0.7V.\n4. Reverse both tests → should read OL.\n5. Test C-E both ways → should read OL.",
  },
  {
    id: "nmos",
    name: "N-Channel MOSFET",
    partNumber: "IRF540N",
    terminals: ["Gate (G)", "Drain (D)", "Source (S)"],
    readings: {
      gs: "OL",        // Gate-Source (insulated gate)
      gd: "OL",        // Gate-Drain (insulated gate)
      ds: "0.45V",     // Drain-Source body diode (forward: Red on Source, Black on Drain)
    },
    shortedReadings: {
      gs: "0.000V",
      gd: "0.000V",
      ds: "0.000V",
    },
    openReadings: {
      gs: "OL",
      gd: "OL",
      ds: "OL",
    },
    description: "Gate is insulated (SiO₂) — all gate measurements should read OL. The body diode from Source to Drain reads like a standard diode (~0.4-0.5V forward). If G-S reads low, gate oxide is punctured (ESD damage).",
    testProcedure: "1. Short all three pins together briefly to discharge gate capacitance.\n2. Set meter to Diode Test.\n3. Test G-S and G-D → both should read OL (insulated gate).\n4. Red on Source, Black on Drain → should read 0.4-0.5V (body diode).\n5. Red on Drain, Black on Source → should read OL.",
  },
  {
    id: "pmos",
    name: "P-Channel MOSFET",
    partNumber: "IRF9540N",
    terminals: ["Gate (G)", "Drain (D)", "Source (S)"],
    readings: {
      gs: "OL",
      gd: "OL",
      ds: "0.48V",     // Body diode: Red on Drain, Black on Source
    },
    shortedReadings: {
      gs: "0.000V",
      gd: "0.000V",
      ds: "0.000V",
    },
    openReadings: {
      gs: "OL",
      gd: "OL",
      ds: "OL",
    },
    description: "P-Channel complement of N-Channel. Gate still insulated (OL). Body diode is reversed compared to N-Channel: forward bias is Red on Drain, Black on Source. Used in high-side switching applications.",
    testProcedure: "1. Discharge gate capacitance by shorting pins.\n2. Test G-S and G-D → both OL.\n3. Red on Drain, Black on Source → 0.4-0.5V (body diode forward).\n4. Red on Source, Black on Drain → OL.",
  },
  {
    id: "darlington",
    name: "Darlington Pair",
    partNumber: "TIP120",
    terminals: ["Base (B)", "Collector (C)", "Emitter (E)"],
    readings: {
      be_forward: "1.25V",   // Double junction drop
      be_reverse: "OL",
      bc_forward: "0.63V",
      bc_reverse: "OL",
      ce: "OL",
    },
    shortedReadings: {
      be_forward: "0.000V",
      be_reverse: "0.000V",
      bc_forward: "0.000V",
      bc_reverse: "0.000V",
      ce: "0.000V",
    },
    openReadings: {
      be_forward: "OL",
      be_reverse: "OL",
      bc_forward: "OL",
      bc_reverse: "OL",
      ce: "OL",
    },
    description: "Two BJTs in cascade — B-E forward drop is approximately double (~1.2-1.4V) because current passes through two B-E junctions. Very high gain (hFE > 1000). Common in relay driver circuits and PLC output modules.",
    testProcedure: "1. Test B-E forward → expect 1.2-1.4V (double junction).\n2. Test B-C forward → expect 0.6-0.7V (single junction).\n3. All reverse tests → OL.\n4. C-E → OL (no base drive).\n5. Key diagnostic: if B-E reads only 0.6V, one transistor in the pair is shorted.",
  },
  {
    id: "igbt",
    name: "IGBT",
    partNumber: "IRGP4063D",
    terminals: ["Gate (G)", "Collector (C)", "Emitter (E)"],
    readings: {
      gs: "OL",        // Insulated gate
      gd: "OL",        // Gate to Collector (insulated)
      ce: "0.42V",     // Antiparallel diode: Red on Emitter, Black on Collector
    },
    shortedReadings: {
      gs: "0.000V",
      gd: "0.000V",
      ce: "0.000V",
    },
    openReadings: {
      gs: "OL",
      gd: "OL",
      ce: "OL",
    },
    description: "IGBT combines MOSFET gate (insulated, OL) with BJT output. The antiparallel (freewheeling) diode reads ~0.4-0.5V from Emitter to Collector. Critical component in VFDs, servo drives, and inverters.",
    testProcedure: "1. Discharge gate by shorting G-E.\n2. Test G-E and G-C → both OL (insulated gate).\n3. Red on Emitter, Black on Collector → 0.4-0.5V (freewheeling diode).\n4. Red on Collector, Black on Emitter → OL.\n5. If G-E reads low → gate oxide failure (replace module).",
  },
];

const ALL_TRANSISTOR_TYPES: TransistorType[] = ["npn", "pnp", "nmos", "pmos", "darlington", "igbt"];

const probeLabels: Record<string, { label: string; red: string; black: string }> = {
  be_forward: { label: "B-E Forward", red: "Base", black: "Emitter" },
  be_reverse: { label: "B-E Reverse", red: "Emitter", black: "Base" },
  bc_forward: { label: "B-C Forward", red: "Base", black: "Collector" },
  bc_reverse: { label: "B-C Reverse", red: "Collector", black: "Base" },
  ce: { label: "C-E", red: "Collector", black: "Emitter" },
  gs: { label: "G-S", red: "Gate", black: "Source" },
  gd: { label: "G-D", red: "Gate", black: "Drain" },
  ds: { label: "D-S (Body Diode)", red: "Source/Drain", black: "Drain/Source" },
};

// PNP-specific probe labels (reversed polarity)
const pnpProbeLabels: Record<string, { label: string; red: string; black: string }> = {
  be_forward: { label: "E-B Forward", red: "Emitter", black: "Base" },
  be_reverse: { label: "E-B Reverse", red: "Base", black: "Emitter" },
  bc_forward: { label: "C-B Forward", red: "Collector", black: "Base" },
  bc_reverse: { label: "C-B Reverse", red: "Base", black: "Collector" },
  ce: { label: "C-E", red: "Collector", black: "Emitter" },
};

export function TransistorTestingLab() {
  const { isAuthenticated } = useAuth();
  const [selectedTransistor, setSelectedTransistor] = useState<TransistorType>("npn");
  const [probePosition, setProbePosition] = useState<ProbePosition>("be_forward");
  const [condition, setCondition] = useState<TransistorCondition>("healthy");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<TransistorCondition | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [randomCondition, setRandomCondition] = useState<TransistorCondition>("healthy");
  const [sessionMastered, setSessionMastered] = useState<Set<TransistorType>>(new Set());
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  // Server-side scoring
  const labScoresQuery = trpc.labs.getMyScores.useQuery(
    { labId: "transistor-testing" },
    { enabled: isAuthenticated }
  );
  const saveScoreMutation = trpc.labs.saveScore.useMutation({
    onSuccess: (data) => {
      if (data.badgeEarned) setShowBadgeNotification(true);
      labScoresQuery.refetch();
    },
  });

  const currentTransistor = useMemo(() => transistorData.find(t => t.id === selectedTransistor)!, [selectedTransistor]);

  const getAvailableProbes = (type: TransistorType): ProbePosition[] => {
    if (type === "nmos" || type === "pmos") return ["gs", "gd", "ds"];
    if (type === "igbt") return ["gs", "gd", "ce"];
    return ["be_forward", "be_reverse", "bc_forward", "bc_reverse", "ce"];
  };

  const getReading = (transistor: TransistorInfo, probe: ProbePosition, cond: TransistorCondition): string => {
    if (cond === "shorted") return transistor.shortedReadings[probe] || "0.000V";
    if (cond === "open") return transistor.openReadings[probe] || "OL";
    return transistor.readings[probe] || "OL";
  };

  const currentReading = useMemo(() => {
    const activeCond = quizMode ? randomCondition : condition;
    return getReading(currentTransistor, probePosition, activeCond);
  }, [currentTransistor, probePosition, condition, quizMode, randomCondition]);

  const getProbeLabel = (type: TransistorType, probe: ProbePosition) => {
    if (type === "pnp" && pnpProbeLabels[probe]) return pnpProbeLabels[probe];
    return probeLabels[probe] || { label: probe, red: "?", black: "?" };
  };

  const startQuiz = () => {
    setQuizMode(true);
    setQuizAnswer(null);
    setQuizRevealed(false);
    const conditions: TransistorCondition[] = ["healthy", "shorted", "open"];
    setRandomCondition(conditions[Math.floor(Math.random() * conditions.length)]);
    const randomType = transistorData[Math.floor(Math.random() * transistorData.length)];
    setSelectedTransistor(randomType.id);
    const probes = getAvailableProbes(randomType.id);
    setProbePosition(probes[0]);
  };

  const submitQuizAnswer = (answer: TransistorCondition) => {
    setQuizAnswer(answer);
    setQuizRevealed(true);
    const isCorrect = answer === randomCondition;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (isCorrect) {
      setSessionMastered(prev => { const next = new Set(Array.from(prev)); next.add(selectedTransistor); return next; });
    }
  };

  const saveSession = useCallback(() => {
    if (!isAuthenticated || score.total === 0) return;
    const allMastered = Array.from(sessionMastered);
    if (labScoresQuery.data?.masteredTypes) {
      labScoresQuery.data.masteredTypes.forEach(t => {
        if (!allMastered.includes(t as TransistorType)) allMastered.push(t as TransistorType);
      });
    }
    saveScoreMutation.mutate({
      labId: "transistor-testing",
      correctAnswers: score.correct,
      totalQuestions: score.total,
      masteredTypes: allMastered,
    });
  }, [isAuthenticated, score, sessionMastered, labScoresQuery.data]);

  const resetLab = () => {
    if (score.total > 0 && isAuthenticated) saveSession();
    setQuizMode(false);
    setQuizAnswer(null);
    setQuizRevealed(false);
    setScore({ correct: 0, total: 0 });
    setSessionMastered(new Set());
    setSelectedTransistor("npn");
    setProbePosition("be_forward");
    setCondition("healthy");
  };

  const availableProbes = getAvailableProbes(selectedTransistor);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transistor Testing Lab</h3>
          <p className="text-sm text-muted-foreground">Practice identifying healthy, shorted, and open transistors using multimeter diode-test mode</p>
        </div>
        <div className="flex gap-2">
          {!quizMode ? (
            <button onClick={startQuiz} className="px-3 py-1.5 text-sm bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white rounded-md transition-colors flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Quiz Mode
            </button>
          ) : (
            <button onClick={resetLab} className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Exit Quiz
            </button>
          )}
        </div>
      </div>

      {/* Progress & Badge Panel */}
      {quizMode && score.total > 0 && (
        <div className="px-4 py-3 rounded-lg bg-[oklch(0.15_0.02_155)] border border-[oklch(0.30_0.08_155)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-[oklch(0.75_0.12_155)]">
              Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
            </span>
            {isAuthenticated && (
              <button
                onClick={saveSession}
                disabled={saveScoreMutation.isPending}
                className="px-2 py-1 text-xs bg-[oklch(0.35_0.08_155)] hover:bg-[oklch(0.40_0.08_155)] text-white rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> {saveScoreMutation.isPending ? "Saving..." : "Save Progress"}
              </button>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Types Mastered: {sessionMastered.size}/{ALL_TRANSISTOR_TYPES.length}</span>
              {sessionMastered.size === ALL_TRANSISTOR_TYPES.length && (
                <span className="text-[oklch(0.80_0.15_90)] flex items-center gap-1"><Trophy className="w-3 h-3" /> Badge Earned!</span>
              )}
            </div>
            <div className="w-full h-2 bg-[oklch(0.12_0.003_250)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[oklch(0.55_0.12_155)] rounded-full transition-all"
                style={{ width: `${(sessionMastered.size / ALL_TRANSISTOR_TYPES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Badge notification */}
      <AnimatePresence>
        {showBadgeNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="px-4 py-3 rounded-lg bg-[oklch(0.20_0.05_90)] border border-[oklch(0.45_0.12_90)] flex items-center gap-3"
          >
            <Trophy className="w-5 h-5 text-[oklch(0.80_0.15_90)]" />
            <div>
              <p className="text-sm font-semibold text-[oklch(0.85_0.10_90)]">Transistor Diagnostics Badge Earned!</p>
              <p className="text-xs text-[oklch(0.65_0.05_90)]">You've mastered all 6 transistor types.</p>
            </div>
            <button onClick={() => setShowBadgeNotification(false)} className="ml-auto text-[oklch(0.5_0.05_90)] hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Transistor Selection & Controls */}
        <div className="space-y-4">
          {/* Transistor Type Selector */}
          <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              {quizMode ? "Current Transistor" : "Select Transistor Type"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {transistorData.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (!quizMode) {
                      setSelectedTransistor(t.id);
                      const probes = getAvailableProbes(t.id);
                      setProbePosition(probes[0]);
                    }
                  }}
                  disabled={quizMode}
                  className={`px-3 py-2 text-xs rounded-md border transition-all text-left ${
                    selectedTransistor === t.id
                      ? "bg-[oklch(0.55_0.12_155/12%)] border-[oklch(0.55_0.12_155/40%)] text-[oklch(0.80_0.10_155)]"
                      : "border-[oklch(0.18_0.004_250)] text-muted-foreground hover:border-[oklch(0.30_0.004_250)]"
                  } ${quizMode ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className="font-medium block">{t.name}</span>
                  <span className="text-[10px] opacity-70">{t.partNumber}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Probe Position Selector */}
          <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Probe Position</label>
            <div className="grid grid-cols-1 gap-2">
              {availableProbes.map(probe => {
                const info = getProbeLabel(selectedTransistor, probe);
                return (
                  <button
                    key={probe}
                    onClick={() => setProbePosition(probe)}
                    className={`px-3 py-2.5 text-xs rounded-md border transition-all text-left ${
                      probePosition === probe
                        ? "bg-[oklch(0.55_0.12_155/12%)] border-[oklch(0.55_0.12_155/40%)] text-[oklch(0.80_0.10_155)]"
                        : "border-[oklch(0.18_0.004_250)] text-muted-foreground hover:border-[oklch(0.30_0.004_250)]"
                    }`}
                  >
                    <span className="font-medium">{info.label}</span>
                    <span className="ml-2 text-[10px] opacity-70">
                      (<span className="text-red-400">Red</span>→{info.red}, <span className="text-gray-400">Blk</span>→{info.black})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Selector (practice mode only) */}
          {!quizMode && (
            <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Transistor Condition</label>
              <div className="flex gap-2">
                {(["healthy", "shorted", "open"] as TransistorCondition[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={`flex-1 px-3 py-2 text-xs rounded-md border capitalize transition-all ${
                      condition === c
                        ? c === "healthy" ? "bg-green-500/10 border-green-500/40 text-green-400"
                          : c === "shorted" ? "bg-red-500/10 border-red-500/40 text-red-400"
                          : "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                        : "border-[oklch(0.18_0.004_250)] text-muted-foreground hover:border-[oklch(0.30_0.004_250)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Multimeter Display & Info */}
        <div className="space-y-4">
          {/* Multimeter Display */}
          <div className="p-6 rounded-xl bg-[oklch(0.08_0.003_250)] border-2 border-[oklch(0.22_0.006_250)] relative overflow-hidden">
            <div className="absolute top-2 right-3 text-[10px] font-mono text-muted-foreground">DIODE TEST MODE</div>
            {/* LCD Display */}
            <div className="bg-[oklch(0.06_0.005_155)] border border-[oklch(0.18_0.008_155)] rounded-lg p-6 text-center mb-4">
              <motion.div
                key={currentReading}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="font-mono text-4xl sm:text-5xl tracking-wider text-[oklch(0.85_0.15_155)]"
              >
                {currentReading}
              </motion.div>
              <div className="mt-2 text-xs text-[oklch(0.50_0.05_155)] font-mono">
                {currentReading === "OL" ? "OVER LIMIT (Open Circuit)" : "Forward Voltage Drop"}
              </div>
            </div>

            {/* Probe indicator */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{getProbeLabel(selectedTransistor, probePosition).red}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600" />
                <span className="text-muted-foreground">{getProbeLabel(selectedTransistor, probePosition).black}</span>
              </div>
            </div>
          </div>

          {/* Quiz Answer Buttons */}
          {quizMode && !quizRevealed && (
            <div className="p-4 rounded-lg bg-[oklch(0.12_0.003_250)] border border-[oklch(0.22_0.006_250)]">
              <p className="text-sm text-foreground mb-3 font-medium">What is the condition of this {currentTransistor.name}?</p>
              <p className="text-xs text-muted-foreground mb-3">Tip: Switch between probe positions to gather more data before answering.</p>
              <div className="grid grid-cols-3 gap-2">
                {(["healthy", "shorted", "open"] as TransistorCondition[]).map(c => (
                  <button
                    key={c}
                    onClick={() => submitQuizAnswer(c)}
                    className="px-3 py-2.5 text-sm rounded-md border border-[oklch(0.25_0.006_250)] hover:bg-[oklch(0.15_0.003_250)] text-foreground capitalize transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Result */}
          {quizMode && quizRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                quizAnswer === randomCondition
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {quizAnswer === randomCondition ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-400" /><span className="text-sm font-semibold text-green-400">Correct!</span></>
                ) : (
                  <><XCircle className="w-5 h-5 text-red-400" /><span className="text-sm font-semibold text-red-400">Incorrect — Answer: {randomCondition}</span></>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{currentTransistor.description}</p>
              <button
                onClick={startQuiz}
                className="mt-3 px-3 py-1.5 text-xs bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white rounded-md transition-colors"
              >
                Next Question →
              </button>
            </motion.div>
          )}

          {/* Transistor Info Panel (practice mode) */}
          {!quizMode && (
            <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
              <h4 className="text-sm font-semibold text-foreground mb-2">{currentTransistor.name} — {currentTransistor.partNumber}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{currentTransistor.description}</p>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Test Procedure:</p>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed opacity-80">{currentTransistor.testProcedure}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expected Readings Reference Table (practice mode) */}
      {!quizMode && (
        <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)] overflow-x-auto">
          <h4 className="text-sm font-semibold text-foreground mb-3">Expected Readings — {currentTransistor.name} ({currentTransistor.partNumber})</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[oklch(0.18_0.004_250)]">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Probe Position</th>
                <th className="text-center py-2 px-2 text-green-400 font-medium">Healthy</th>
                <th className="text-center py-2 px-2 text-red-400 font-medium">Shorted</th>
                <th className="text-center py-2 px-2 text-yellow-400 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {availableProbes.map(probe => {
                const info = getProbeLabel(selectedTransistor, probe);
                return (
                  <tr key={probe} className="border-b border-[oklch(0.14_0.003_250)]">
                    <td className="py-2 px-2 text-foreground">{info.label}</td>
                    <td className="py-2 px-2 text-center font-mono text-green-400">{currentTransistor.readings[probe] || "—"}</td>
                    <td className="py-2 px-2 text-center font-mono text-red-400">{currentTransistor.shortedReadings[probe] || "—"}</td>
                    <td className="py-2 px-2 text-center font-mono text-yellow-400">{currentTransistor.openReadings[probe] || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
