/**
 * ThyristorTestingLab — Interactive thyristor/SCR/TRIAC testing simulation
 * Users select a thyristor type, choose probe placement (A-K, A-G, MT1-MT2),
 * and read the multimeter display to identify healthy, shorted, or open devices.
 * Includes gate triggering test procedure unique to thyristors.
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, CheckCircle2, XCircle, Zap, Trophy, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type ThyristorType = "scr" | "triac" | "diac" | "gto" | "scr_module";
type ProbePosition = "ak_forward" | "ak_reverse" | "ag" | "kg" | "mt1_mt2_forward" | "mt1_mt2_reverse" | "mt2_g" | "gate_trigger";
type ThyristorCondition = "healthy" | "shorted" | "open" | "gate_shorted";

interface ThyristorInfo {
  id: ThyristorType;
  name: string;
  partNumber: string;
  terminals: string[];
  readings: Record<string, string>;
  shortedReadings: Record<string, string>;
  openReadings: Record<string, string>;
  gateShortedReadings?: Record<string, string>;
  description: string;
  testProcedure: string;
  gateTriggerNote: string;
}

const thyristorData: ThyristorInfo[] = [
  {
    id: "scr",
    name: "SCR (Silicon Controlled Rectifier)",
    partNumber: "2N6507 (25A, 400V)",
    terminals: ["Anode (A)", "Cathode (K)", "Gate (G)"],
    readings: {
      ak_forward: "OL",     // Anode to Cathode - blocked without gate
      ak_reverse: "OL",     // Reverse biased - always blocked
      ag: "OL",             // Anode to Gate - high impedance
      kg: "0.58V",          // Cathode to Gate (like a diode junction)
      gate_trigger: "0.65V → LATCH", // Special: gate trigger test
    },
    shortedReadings: {
      ak_forward: "0.000V",
      ak_reverse: "0.000V",
      ag: "0.000V",
      kg: "0.000V",
      gate_trigger: "0.000V",
    },
    openReadings: {
      ak_forward: "OL",
      ak_reverse: "OL",
      ag: "OL",
      kg: "OL",
      gate_trigger: "OL (No Trigger)",
    },
    gateShortedReadings: {
      ak_forward: "0.000V",
      ak_reverse: "OL",
      ag: "0.000V",
      kg: "0.000V",
      gate_trigger: "0.000V",
    },
    description: "SCR blocks in both directions until gate is triggered. Once triggered, it latches ON and only turns off when anode current drops below holding current. Gate-Cathode junction tests like a diode (~0.5-0.7V forward).",
    testProcedure: "1. Set meter to Diode Test.\n2. A-K forward and reverse → both OL (SCR is blocking).\n3. Red on Gate, Black on Cathode → 0.5-0.7V (G-K junction).\n4. Gate Trigger Test: Red on Anode, Black on Cathode. While measuring, briefly short Gate to Anode with a jumper wire. SCR should latch ON (reading drops to ~0.7-1.0V and stays).\n5. If A-K reads low without gate trigger → shorted.",
    gateTriggerNote: "The Gate Trigger test is unique to SCRs. A healthy SCR will latch ON when gate current is applied and remain conducting even after gate drive is removed. The meter's test current (~1mA) is usually enough to maintain latching in small SCRs.",
  },
  {
    id: "triac",
    name: "TRIAC",
    partNumber: "BTA16-600B (16A, 600V)",
    terminals: ["MT1", "MT2", "Gate (G)"],
    readings: {
      mt1_mt2_forward: "OL",   // MT2 positive - blocked
      mt1_mt2_reverse: "OL",   // MT1 positive - blocked
      mt2_g: "0.62V",          // Gate to MT1 junction
      gate_trigger: "0.68V → LATCH (both directions)",
    },
    shortedReadings: {
      mt1_mt2_forward: "0.000V",
      mt1_mt2_reverse: "0.000V",
      mt2_g: "0.000V",
      gate_trigger: "0.000V",
    },
    openReadings: {
      mt1_mt2_forward: "OL",
      mt1_mt2_reverse: "OL",
      mt2_g: "OL",
      gate_trigger: "OL (No Trigger)",
    },
    gateShortedReadings: {
      mt1_mt2_forward: "0.000V",
      mt1_mt2_reverse: "0.000V",
      mt2_g: "0.000V",
      gate_trigger: "0.000V",
    },
    description: "TRIAC is a bidirectional thyristor — blocks in both directions until triggered. Can conduct in either direction (AC switching). Gate-MT1 junction tests like a diode. Used in light dimmers, motor speed controls, and heating element controllers.",
    testProcedure: "1. MT1-MT2 both directions → OL (blocking).\n2. Red on Gate, Black on MT1 → 0.5-0.7V (gate junction).\n3. Gate Trigger: Apply gate signal while measuring MT1-MT2.\n4. If MT1-MT2 reads low without trigger → shorted (common failure in TRIACs).",
    gateTriggerNote: "TRIACs can be triggered in all four quadrants (positive/negative gate, positive/negative MT2). In industrial heater circuits, a shorted TRIAC causes the heater to run at full power continuously — a common failure mode that can damage product or cause fires.",
  },
  {
    id: "diac",
    name: "DIAC (Trigger Diode)",
    partNumber: "DB3 (32V breakover)",
    terminals: ["Terminal 1", "Terminal 2"],
    readings: {
      mt1_mt2_forward: "OL",   // Below breakover voltage
      mt1_mt2_reverse: "OL",   // Below breakover voltage
    },
    shortedReadings: {
      mt1_mt2_forward: "0.000V",
      mt1_mt2_reverse: "0.000V",
    },
    openReadings: {
      mt1_mt2_forward: "OL",
      mt1_mt2_reverse: "OL",
    },
    description: "DIAC is a bidirectional trigger device — it remains open circuit until voltage exceeds breakover threshold (~28-36V for DB3). A standard multimeter diode test cannot reach breakover voltage, so a healthy DIAC reads OL in both directions. Used to trigger TRIACs in phase-control circuits.",
    testProcedure: "1. Both directions → OL (meter voltage too low to trigger).\n2. If either direction reads low → DIAC is shorted.\n3. To fully test, use a variable DC supply and measure breakover voltage.\n4. A shorted DIAC causes erratic TRIAC triggering (flickering lights, inconsistent heating).",
    gateTriggerNote: "DIACs cannot be gate-triggered — they switch based on voltage across their terminals. The multimeter test can only confirm the device is not shorted; full characterization requires a curve tracer or variable supply.",
  },
  {
    id: "gto",
    name: "GTO (Gate Turn-Off Thyristor)",
    partNumber: "GTO Module (high power)",
    terminals: ["Anode (A)", "Cathode (K)", "Gate (G)"],
    readings: {
      ak_forward: "OL",
      ak_reverse: "OL",
      ag: "OL",
      kg: "0.55V",
      gate_trigger: "0.60V → LATCH",
    },
    shortedReadings: {
      ak_forward: "0.000V",
      ak_reverse: "0.000V",
      ag: "0.000V",
      kg: "0.000V",
      gate_trigger: "0.000V",
    },
    openReadings: {
      ak_forward: "OL",
      ak_reverse: "OL",
      ag: "OL",
      kg: "OL",
      gate_trigger: "OL (No Trigger)",
    },
    gateShortedReadings: {
      ak_forward: "0.000V",
      ak_reverse: "OL",
      ag: "0.000V",
      kg: "0.000V",
      gate_trigger: "0.000V",
    },
    description: "GTO is similar to SCR but can be turned OFF by negative gate current (unlike standard SCR which requires anode current interruption). Used in high-power inverters and motor drives. Gate-Cathode junction is similar to SCR.",
    testProcedure: "1. Same as SCR: A-K both directions → OL.\n2. G-K forward → 0.5-0.7V.\n3. Gate trigger test same as SCR.\n4. GTOs are typically in high-power modules — always verify zero energy before testing.",
    gateTriggerNote: "GTO thyristors are found in high-power industrial drives (100kW+). Unlike standard SCRs, they can be commutated off by applying negative gate current, eliminating the need for commutation circuits.",
  },
  {
    id: "scr_module",
    name: "SCR Power Module (3-Phase Bridge)",
    partNumber: "Semikron SKKT 57 (dual SCR)",
    terminals: ["Anode 1", "Cathode 1", "Gate 1", "Anode 2", "Cathode 2", "Gate 2"],
    readings: {
      ak_forward: "OL",
      ak_reverse: "OL",
      kg: "0.52V",
      gate_trigger: "0.58V → LATCH",
    },
    shortedReadings: {
      ak_forward: "0.000V",
      ak_reverse: "0.000V",
      kg: "0.000V",
      gate_trigger: "0.000V",
    },
    openReadings: {
      ak_forward: "OL",
      ak_reverse: "OL",
      kg: "OL",
      gate_trigger: "OL (No Trigger)",
    },
    gateShortedReadings: {
      ak_forward: "0.000V",
      ak_reverse: "OL",
      kg: "0.000V",
      gate_trigger: "0.000V",
    },
    description: "Power SCR modules contain multiple SCR dies in a single package, typically configured as a dual SCR (for single-phase) or 3-phase bridge. Each SCR in the module must be tested individually. Common in DC drive armature circuits and electroplating rectifiers.",
    testProcedure: "1. Test each SCR in the module separately.\n2. A-K forward/reverse → OL for each SCR.\n3. G-K for each SCR → 0.5-0.7V.\n4. Gate trigger test for each SCR.\n5. Compare readings between SCRs — significant differences indicate degradation.\n6. IMPORTANT: Disconnect all external wiring before testing to avoid reading through parallel paths.",
    gateTriggerNote: "When testing SCR modules in DC drives, always disconnect the field supply and armature connections. Residual magnetism in the motor can generate voltage that gives false readings.",
  },
];

const ALL_THYRISTOR_TYPES: ThyristorType[] = ["scr", "triac", "diac", "gto", "scr_module"];

const probeLabels: Record<string, { label: string; red: string; black: string }> = {
  ak_forward: { label: "A-K Forward", red: "Anode", black: "Cathode" },
  ak_reverse: { label: "A-K Reverse", red: "Cathode", black: "Anode" },
  ag: { label: "A-G", red: "Anode", black: "Gate" },
  kg: { label: "G-K (Gate Junction)", red: "Gate", black: "Cathode" },
  mt1_mt2_forward: { label: "MT2→MT1", red: "MT2", black: "MT1" },
  mt1_mt2_reverse: { label: "MT1→MT2", red: "MT1", black: "MT2" },
  mt2_g: { label: "G-MT1 (Gate Junction)", red: "Gate", black: "MT1" },
  gate_trigger: { label: "Gate Trigger Test", red: "Anode/MT2", black: "Cathode/MT1" },
};

export function ThyristorTestingLab() {
  const { isAuthenticated } = useAuth();
  const [selectedThyristor, setSelectedThyristor] = useState<ThyristorType>("scr");
  const [probePosition, setProbePosition] = useState<ProbePosition>("ak_forward");
  const [condition, setCondition] = useState<ThyristorCondition>("healthy");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<ThyristorCondition | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [randomCondition, setRandomCondition] = useState<ThyristorCondition>("healthy");
  const [sessionMastered, setSessionMastered] = useState<Set<ThyristorType>>(new Set());
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  const labScoresQuery = trpc.labs.getMyScores.useQuery(
    { labId: "thyristor-testing" },
    { enabled: isAuthenticated }
  );
  const saveScoreMutation = trpc.labs.saveScore.useMutation({
    onSuccess: (data) => {
      if (data.badgeEarned) setShowBadgeNotification(true);
      labScoresQuery.refetch();
    },
  });

  const currentThyristor = useMemo(() => thyristorData.find(t => t.id === selectedThyristor)!, [selectedThyristor]);

  const getAvailableProbes = (type: ThyristorType): ProbePosition[] => {
    if (type === "triac") return ["mt1_mt2_forward", "mt1_mt2_reverse", "mt2_g", "gate_trigger"];
    if (type === "diac") return ["mt1_mt2_forward", "mt1_mt2_reverse"];
    return ["ak_forward", "ak_reverse", "ag", "kg", "gate_trigger"];
  };

  const getConditions = (): ThyristorCondition[] => {
    // SCR/TRIAC can have gate-shorted as a distinct failure mode
    if (selectedThyristor === "scr" || selectedThyristor === "triac" || selectedThyristor === "gto" || selectedThyristor === "scr_module") {
      return ["healthy", "shorted", "open", "gate_shorted"];
    }
    return ["healthy", "shorted", "open"];
  };

  const getReading = (thyristor: ThyristorInfo, probe: ProbePosition, cond: ThyristorCondition): string => {
    if (cond === "shorted") return thyristor.shortedReadings[probe] || "0.000V";
    if (cond === "open") return thyristor.openReadings[probe] || "OL";
    if (cond === "gate_shorted" && thyristor.gateShortedReadings) return thyristor.gateShortedReadings[probe] || "0.000V";
    return thyristor.readings[probe] || "OL";
  };

  const currentReading = useMemo(() => {
    const activeCond = quizMode ? randomCondition : condition;
    return getReading(currentThyristor, probePosition, activeCond);
  }, [currentThyristor, probePosition, condition, quizMode, randomCondition]);

  const startQuiz = () => {
    setQuizMode(true);
    setQuizAnswer(null);
    setQuizRevealed(false);
    const conditions = getConditions();
    setRandomCondition(conditions[Math.floor(Math.random() * conditions.length)]);
    const randomType = thyristorData[Math.floor(Math.random() * thyristorData.length)];
    setSelectedThyristor(randomType.id);
    const probes = getAvailableProbes(randomType.id);
    setProbePosition(probes[0]);
  };

  const submitQuizAnswer = (answer: ThyristorCondition) => {
    setQuizAnswer(answer);
    setQuizRevealed(true);
    const isCorrect = answer === randomCondition;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (isCorrect) {
      setSessionMastered(prev => { const next = new Set(Array.from(prev)); next.add(selectedThyristor); return next; });
    }
  };

  const saveSession = useCallback(() => {
    if (!isAuthenticated || score.total === 0) return;
    const allMastered = Array.from(sessionMastered);
    if (labScoresQuery.data?.masteredTypes) {
      labScoresQuery.data.masteredTypes.forEach(t => {
        if (!allMastered.includes(t as ThyristorType)) allMastered.push(t as ThyristorType);
      });
    }
    saveScoreMutation.mutate({
      labId: "thyristor-testing",
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
    setSelectedThyristor("scr");
    setProbePosition("ak_forward");
    setCondition("healthy");
  };

  const availableProbes = getAvailableProbes(selectedThyristor);
  const availableConditions = getConditions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Thyristor Testing Lab</h3>
          <p className="text-sm text-muted-foreground">Practice identifying healthy, shorted, open, and gate-shorted thyristors using multimeter diode-test mode</p>
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
              <span>Types Mastered: {sessionMastered.size}/{ALL_THYRISTOR_TYPES.length}</span>
              {sessionMastered.size === ALL_THYRISTOR_TYPES.length && (
                <span className="text-[oklch(0.80_0.15_90)] flex items-center gap-1"><Trophy className="w-3 h-3" /> Badge Earned!</span>
              )}
            </div>
            <div className="w-full h-2 bg-[oklch(0.12_0.003_250)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[oklch(0.55_0.12_155)] rounded-full transition-all"
                style={{ width: `${(sessionMastered.size / ALL_THYRISTOR_TYPES.length) * 100}%` }}
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
              <p className="text-sm font-semibold text-[oklch(0.85_0.10_90)]">Thyristor Diagnostics Badge Earned!</p>
              <p className="text-xs text-[oklch(0.65_0.05_90)]">You've mastered all 5 thyristor types.</p>
            </div>
            <button onClick={() => setShowBadgeNotification(false)} className="ml-auto text-[oklch(0.5_0.05_90)] hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Thyristor Selection & Controls */}
        <div className="space-y-4">
          {/* Thyristor Type Selector */}
          <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              {quizMode ? "Current Device" : "Select Thyristor Type"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {thyristorData.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (!quizMode) {
                      setSelectedThyristor(t.id);
                      const probes = getAvailableProbes(t.id);
                      setProbePosition(probes[0]);
                    }
                  }}
                  disabled={quizMode}
                  className={`px-3 py-2 text-xs rounded-md border transition-all text-left ${
                    selectedThyristor === t.id
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
                const info = probeLabels[probe] || { label: probe, red: "?", black: "?" };
                const isGateTrigger = probe === "gate_trigger";
                return (
                  <button
                    key={probe}
                    onClick={() => setProbePosition(probe)}
                    className={`px-3 py-2.5 text-xs rounded-md border transition-all text-left ${
                      probePosition === probe
                        ? "bg-[oklch(0.55_0.12_155/12%)] border-[oklch(0.55_0.12_155/40%)] text-[oklch(0.80_0.10_155)]"
                        : "border-[oklch(0.18_0.004_250)] text-muted-foreground hover:border-[oklch(0.30_0.004_250)]"
                    } ${isGateTrigger ? "border-l-2 border-l-amber-500/50" : ""}`}
                  >
                    <span className="font-medium">{info.label}</span>
                    {isGateTrigger && <span className="ml-2 text-[10px] text-amber-400">(Special Test)</span>}
                    {!isGateTrigger && (
                      <span className="ml-2 text-[10px] opacity-70">
                        (<span className="text-red-400">Red</span>→{info.red}, <span className="text-gray-400">Blk</span>→{info.black})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Selector (practice mode only) */}
          {!quizMode && (
            <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Device Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {availableConditions.map(c => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={`px-3 py-2 text-xs rounded-md border capitalize transition-all ${
                      condition === c
                        ? c === "healthy" ? "bg-green-500/10 border-green-500/40 text-green-400"
                          : c === "shorted" ? "bg-red-500/10 border-red-500/40 text-red-400"
                          : c === "open" ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                          : "bg-orange-500/10 border-orange-500/40 text-orange-400"
                        : "border-[oklch(0.18_0.004_250)] text-muted-foreground hover:border-[oklch(0.30_0.004_250)]"
                    }`}
                  >
                    {c === "gate_shorted" ? "Gate Shorted" : c}
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
            {probePosition === "gate_trigger" && (
              <div className="absolute top-2 left-3 text-[10px] font-mono text-amber-400">⚡ GATE TRIGGER TEST</div>
            )}
            <div className="bg-[oklch(0.06_0.005_155)] border border-[oklch(0.18_0.008_155)] rounded-lg p-6 text-center mb-4">
              <motion.div
                key={currentReading}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="font-mono text-3xl sm:text-4xl tracking-wider text-[oklch(0.85_0.15_155)]"
              >
                {currentReading}
              </motion.div>
              <div className="mt-2 text-xs text-[oklch(0.50_0.05_155)] font-mono">
                {currentReading === "OL" ? "OVER LIMIT (Blocking)" : 
                 currentReading.includes("LATCH") ? "Device Triggered & Latched" :
                 "Forward Voltage / Conduction"}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{(probeLabels[probePosition] || { red: "+" }).red}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600" />
                <span className="text-muted-foreground">{(probeLabels[probePosition] || { black: "-" }).black}</span>
              </div>
            </div>
          </div>

          {/* Quiz Answer Buttons */}
          {quizMode && !quizRevealed && (
            <div className="p-4 rounded-lg bg-[oklch(0.12_0.003_250)] border border-[oklch(0.22_0.006_250)]">
              <p className="text-sm text-foreground mb-3 font-medium">What is the condition of this {currentThyristor.name}?</p>
              <p className="text-xs text-muted-foreground mb-3">Tip: Check multiple probe positions, especially the Gate Trigger test.</p>
              <div className="grid grid-cols-2 gap-2">
                {availableConditions.map(c => (
                  <button
                    key={c}
                    onClick={() => submitQuizAnswer(c)}
                    className="px-3 py-2.5 text-sm rounded-md border border-[oklch(0.25_0.006_250)] hover:bg-[oklch(0.15_0.003_250)] text-foreground capitalize transition-colors"
                  >
                    {c === "gate_shorted" ? "Gate Shorted" : c}
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
                  <><XCircle className="w-5 h-5 text-red-400" /><span className="text-sm font-semibold text-red-400">Incorrect — Answer: {randomCondition === "gate_shorted" ? "Gate Shorted" : randomCondition}</span></>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{currentThyristor.description}</p>
              <button
                onClick={startQuiz}
                className="mt-3 px-3 py-1.5 text-xs bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white rounded-md transition-colors"
              >
                Next Question →
              </button>
            </motion.div>
          )}

          {/* Info Panel (practice mode) */}
          {!quizMode && (
            <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)]">
              <h4 className="text-sm font-semibold text-foreground mb-2">{currentThyristor.name} — {currentThyristor.partNumber}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{currentThyristor.description}</p>
              <div className="text-xs text-muted-foreground mb-3">
                <p className="font-medium text-foreground mb-1">Test Procedure:</p>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed opacity-80">{currentThyristor.testProcedure}</pre>
              </div>
              <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20">
                <p className="text-[11px] text-amber-300 leading-relaxed">
                  <strong>Gate Trigger Note:</strong> {currentThyristor.gateTriggerNote}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expected Readings Reference Table (practice mode) */}
      {!quizMode && (
        <div className="p-4 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)] overflow-x-auto">
          <h4 className="text-sm font-semibold text-foreground mb-3">Expected Readings — {currentThyristor.name}</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[oklch(0.18_0.004_250)]">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Probe Position</th>
                <th className="text-center py-2 px-2 text-green-400 font-medium">Healthy</th>
                <th className="text-center py-2 px-2 text-red-400 font-medium">Shorted</th>
                <th className="text-center py-2 px-2 text-yellow-400 font-medium">Open</th>
                {currentThyristor.gateShortedReadings && (
                  <th className="text-center py-2 px-2 text-orange-400 font-medium">Gate Shorted</th>
                )}
              </tr>
            </thead>
            <tbody>
              {availableProbes.map(probe => {
                const info = probeLabels[probe] || { label: probe };
                return (
                  <tr key={probe} className="border-b border-[oklch(0.14_0.003_250)]">
                    <td className="py-2 px-2 text-foreground">{info.label}</td>
                    <td className="py-2 px-2 text-center font-mono text-green-400">{currentThyristor.readings[probe] || "—"}</td>
                    <td className="py-2 px-2 text-center font-mono text-red-400">{currentThyristor.shortedReadings[probe] || "—"}</td>
                    <td className="py-2 px-2 text-center font-mono text-yellow-400">{currentThyristor.openReadings[probe] || "—"}</td>
                    {currentThyristor.gateShortedReadings && (
                      <td className="py-2 px-2 text-center font-mono text-orange-400">{currentThyristor.gateShortedReadings[probe] || "—"}</td>
                    )}
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
