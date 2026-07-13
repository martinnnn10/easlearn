/**
 * DiodeTestingLab — Interactive diode testing simulation
 * Users select a diode type, choose probe placement (forward/reverse bias),
 * and read the multimeter display to identify healthy, shorted, or open diodes.
 * Teaches proper diode testing procedure per industrial maintenance standards.
 */
import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, Zap, Trophy, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type DiodeType = "rectifier" | "zener" | "schottky" | "led" | "photodiode" | "tvs" | "fast_recovery" | "bridge" | "flyback";
type ProbePosition = "forward" | "reverse";
type DiodeCondition = "healthy" | "shorted" | "open";

interface DiodeInfo {
  id: DiodeType;
  name: string;
  partNumber: string;
  forwardVoltage: string;
  reverseReading: string;
  shortedForward: string;
  shortedReverse: string;
  openForward: string;
  openReverse: string;
  description: string;
  application: string;
}

const diodeData: DiodeInfo[] = [
  {
    id: "rectifier",
    name: "Standard Rectifier",
    partNumber: "1N4007",
    forwardVoltage: "0.62V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Silicon PN junction rectifier. Forward drop 0.6–0.7V. Blocks reverse voltage up to 1000V PIV.",
    application: "DC power supply rectification, reverse polarity protection in 24VDC control circuits.",
  },
  {
    id: "zener",
    name: "Zener Diode",
    partNumber: "1N4733A (5.1V)",
    forwardVoltage: "0.65V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Conducts in forward like standard diode. In reverse, conducts at precise breakdown voltage (5.1V). Meter diode-test cannot reach breakdown — reads OL in reverse.",
    application: "Voltage regulation on PLC analog input cards, reference voltage for sensor signal conditioning.",
  },
  {
    id: "schottky",
    name: "Schottky Barrier",
    partNumber: "1N5819",
    forwardVoltage: "0.28V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Metal-semiconductor junction. Lower forward voltage (0.15–0.45V) than silicon. Faster switching but lower reverse voltage rating.",
    application: "Switch-mode power supply output rectification, freewheeling diodes on high-frequency PWM circuits.",
  },
  {
    id: "led",
    name: "LED",
    partNumber: "Standard Red 5mm",
    forwardVoltage: "1.65V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Light-emitting diode. Higher forward voltage (1.5–3.3V depending on color). Red=1.6V, Green=2.1V, Blue/White=3.0V. May glow dimly during diode test.",
    application: "PLC module status indicators, panel indicator lamps, HMI backlighting, photoelectric sensor emitters.",
  },
  {
    id: "photodiode",
    name: "Photodiode",
    partNumber: "BPW34",
    forwardVoltage: "0.55V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Operates in reverse bias — generates current proportional to light intensity. Forward test reads like standard silicon diode. Cover from light during testing for consistent readings.",
    application: "Photoelectric sensor receivers, optocoupler output elements, light curtain safety systems.",
  },
  {
    id: "tvs",
    name: "TVS (Bidirectional)",
    partNumber: "SMBJ24CA",
    forwardVoltage: "0.65V",
    reverseReading: "0.65V",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Bidirectional TVS reads forward voltage in BOTH directions (two back-to-back diodes). This is normal — not a short. Unidirectional TVS reads like a Zener.",
    application: "Transient protection on 24VDC sensor inputs, RS-485 communication line protection, PLC I/O module input protection.",
  },
  {
    id: "fast_recovery",
    name: "Fast Recovery",
    partNumber: "UF4007",
    forwardVoltage: "0.68V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Same forward characteristics as standard rectifier on meter test. Cannot distinguish from 1N4007 with multimeter alone — must check part marking or circuit position.",
    application: "VFD DC bus rectifier stage, high-frequency switch-mode power supplies, snubber circuits on IGBTs.",
  },
  {
    id: "bridge",
    name: "Bridge Rectifier",
    partNumber: "KBPC3510",
    forwardVoltage: "0.65V (per leg)",
    reverseReading: "OL (per leg)",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Four diodes in diamond configuration. Test each leg individually: AC1→DC+, AC2→DC+, DC-→AC1, DC-→AC2. All four legs should read 0.5–0.7V forward, OL reverse.",
    application: "VFD input rectifier (converts 480VAC to ~680VDC bus), DC power supply front-end, battery charger input stage.",
  },
  {
    id: "flyback",
    name: "Flyback/Freewheeling",
    partNumber: "1N4148 (signal), 1N4007 (power)",
    forwardVoltage: "0.58V",
    reverseReading: "OL",
    shortedForward: "0.000V",
    shortedReverse: "0.000V",
    openForward: "OL",
    openReverse: "OL",
    description: "Standard diode installed across inductive load (relay coil, solenoid). Cathode stripe faces positive supply rail. Tests identical to standard rectifier — verify orientation on circuit.",
    application: "Across every 24VDC relay coil driven by PLC output, contactor coil snubbing, solenoid valve protection in pneumatic systems.",
  },
];

const ALL_DIODE_TYPES: DiodeType[] = ["rectifier", "zener", "schottky", "led", "photodiode", "tvs", "fast_recovery", "bridge", "flyback"];

export function DiodeTestingLab() {
  const { isAuthenticated } = useAuth();
  const [selectedDiode, setSelectedDiode] = useState<DiodeType>("rectifier");
  const [probePosition, setProbePosition] = useState<ProbePosition>("forward");
  const [condition, setCondition] = useState<DiodeCondition>("healthy");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<DiodeCondition | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [randomCondition, setRandomCondition] = useState<DiodeCondition>("healthy");
  // Track which diode types have been answered correctly (per session)
  const [sessionMastered, setSessionMastered] = useState<Set<DiodeType>>(new Set());
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  // Server-side scoring
  const labScoresQuery = trpc.labs.getMyScores.useQuery(
    { labId: "diode-testing" },
    { enabled: isAuthenticated }
  );
  const saveScoreMutation = trpc.labs.saveScore.useMutation({
    onSuccess: (data) => {
      if (data.badgeEarned) setShowBadgeNotification(true);
      labScoresQuery.refetch();
    },
  });

  const currentDiode = useMemo(() => diodeData.find(d => d.id === selectedDiode)!, [selectedDiode]);

  const getReading = (diode: DiodeInfo, probe: ProbePosition, cond: DiodeCondition): string => {
    if (cond === "shorted") {
      return probe === "forward" ? diode.shortedForward : diode.shortedReverse;
    }
    if (cond === "open") {
      return probe === "forward" ? diode.openForward : diode.openReverse;
    }
    // healthy
    return probe === "forward" ? diode.forwardVoltage : diode.reverseReading;
  };

  const currentReading = useMemo(() => {
    const activeCond = quizMode ? randomCondition : condition;
    return getReading(currentDiode, probePosition, activeCond);
  }, [currentDiode, probePosition, condition, quizMode, randomCondition]);

  const startQuiz = () => {
    setQuizMode(true);
    setQuizAnswer(null);
    setQuizRevealed(false);
    const conditions: DiodeCondition[] = ["healthy", "shorted", "open"];
    setRandomCondition(conditions[Math.floor(Math.random() * conditions.length)]);
    // Randomize diode
    const randomDiode = diodeData[Math.floor(Math.random() * diodeData.length)];
    setSelectedDiode(randomDiode.id);
    setProbePosition("forward");
  };

  const submitQuizAnswer = (answer: DiodeCondition) => {
    setQuizAnswer(answer);
    setQuizRevealed(true);
    const isCorrect = answer === randomCondition;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    // Track mastered types
    if (isCorrect) {
      setSessionMastered(prev => { const next = new Set(Array.from(prev)); next.add(selectedDiode); return next; });
    }
  };

  // Save session score to server
  const saveSession = useCallback(() => {
    if (!isAuthenticated || score.total === 0) return;
    const allMastered = Array.from(sessionMastered);
    // Merge with previously mastered types from server
    if (labScoresQuery.data?.masteredTypes) {
      labScoresQuery.data.masteredTypes.forEach(t => {
        if (!allMastered.includes(t as DiodeType)) allMastered.push(t as DiodeType);
      });
    }
    saveScoreMutation.mutate({
      labId: "diode-testing",
      correctAnswers: score.correct,
      totalQuestions: score.total,
      masteredTypes: allMastered,
    });
  }, [isAuthenticated, score, sessionMastered, labScoresQuery.data]);

  const resetLab = () => {
    // Auto-save before reset if there's a score
    if (score.total > 0 && isAuthenticated) saveSession();
    setQuizMode(false);
    setQuizAnswer(null);
    setQuizRevealed(false);
    setScore({ correct: 0, total: 0 });
    setSessionMastered(new Set());
    setSelectedDiode("rectifier");
    setProbePosition("forward");
    setCondition("healthy");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Diode Testing Lab</h3>
          <p className="text-sm text-muted-foreground">Practice identifying healthy, shorted, and open diodes using multimeter diode-test mode</p>
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
          {/* Mastery progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Types Mastered: {sessionMastered.size}/{ALL_DIODE_TYPES.length}</span>
              {sessionMastered.size === ALL_DIODE_TYPES.length && (
                <span className="text-[oklch(0.80_0.15_90)] flex items-center gap-1"><Trophy className="w-3 h-3" /> Badge Earned!</span>
              )}
            </div>
            <div className="h-2 rounded-full bg-[oklch(0.10_0.01_200)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[oklch(0.55_0.15_155)] transition-all duration-500"
                style={{ width: `${(sessionMastered.size / ALL_DIODE_TYPES.length) * 100}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {ALL_DIODE_TYPES.map(t => (
                <span
                  key={t}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    sessionMastered.has(t)
                      ? "bg-[oklch(0.30_0.10_155)] text-[oklch(0.80_0.12_155)]"
                      : "bg-muted/20 text-muted-foreground/50"
                  }`}
                >
                  {t.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badge notification */}
      <AnimatePresence>
        {showBadgeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-3 rounded-lg bg-[oklch(0.20_0.10_90)] border border-[oklch(0.50_0.15_90)] flex items-center gap-3"
          >
            <Trophy className="w-6 h-6 text-[oklch(0.80_0.15_90)]" />
            <div>
              <p className="text-sm font-semibold text-[oklch(0.85_0.12_90)]">Diode Diagnostics Badge Earned!</p>
              <p className="text-xs text-muted-foreground">You correctly identified all 9 diode types. This badge is saved to your profile.</p>
            </div>
            <button onClick={() => setShowBadgeNotification(false)} className="ml-auto text-muted-foreground hover:text-foreground">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous best score (from server) */}
      {isAuthenticated && labScoresQuery.data && labScoresQuery.data.bestScore > 0 && !quizMode && (
        <div className="px-4 py-2 rounded-lg bg-muted/10 border border-border/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Personal Best: <span className="font-mono text-foreground">{labScoresQuery.data.bestScore}%</span>
            {labScoresQuery.data.badgeEarned && (
              <span className="ml-2 inline-flex items-center gap-1 text-[oklch(0.75_0.15_90)]"><Trophy className="w-3 h-3" /> Diode Diagnostics</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            Mastered: {labScoresQuery.data.masteredTypes.length}/{ALL_DIODE_TYPES.length} types
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel — Diode Selection & Controls */}
        <div className="space-y-4">
          {/* Diode Type Selector */}
          {!quizMode && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Select Diode Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {diodeData.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDiode(d.id); setShowResult(false); }}
                    className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
                      selectedDiode === d.id
                        ? "bg-[oklch(0.25_0.08_155)] border-[oklch(0.45_0.12_155)] text-[oklch(0.85_0.12_155)]"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Diode Info */}
          <div className="p-4 rounded-lg bg-[oklch(0.12_0.01_155)] border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-foreground">{currentDiode.name}</span>
              <span className="text-xs font-mono text-muted-foreground">({currentDiode.partNumber})</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{currentDiode.description}</p>
            <p className="text-xs text-[oklch(0.65_0.08_155)] mt-2 italic">{currentDiode.application}</p>
          </div>

          {/* Condition Selector (practice mode only) */}
          {!quizMode && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Diode Condition (simulate fault)</label>
              <div className="flex gap-2">
                {(["healthy", "shorted", "open"] as DiodeCondition[]).map(c => (
                  <button
                    key={c}
                    onClick={() => { setCondition(c); setShowResult(false); }}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all capitalize ${
                      condition === c
                        ? c === "healthy" ? "bg-[oklch(0.25_0.08_155)] border-[oklch(0.45_0.12_155)] text-[oklch(0.85_0.12_155)]"
                          : c === "shorted" ? "bg-[oklch(0.25_0.12_30)] border-[oklch(0.50_0.15_30)] text-[oklch(0.85_0.15_30)]"
                          : "bg-[oklch(0.25_0.08_60)] border-[oklch(0.50_0.12_60)] text-[oklch(0.85_0.12_60)]"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Probe Position */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Probe Placement</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setProbePosition("forward"); setShowResult(false); }}
                className={`flex-1 px-3 py-3 rounded-md border transition-all ${
                  probePosition === "forward"
                    ? "bg-[oklch(0.20_0.06_0)] border-[oklch(0.50_0.15_25)] text-[oklch(0.85_0.12_25)]"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="text-sm font-medium">Forward Bias</div>
                <div className="text-xs mt-1 opacity-70">Red (+) → Anode, Black (−) → Cathode</div>
              </button>
              <button
                onClick={() => { setProbePosition("reverse"); setShowResult(false); }}
                className={`flex-1 px-3 py-3 rounded-md border transition-all ${
                  probePosition === "reverse"
                    ? "bg-[oklch(0.20_0.04_250)] border-[oklch(0.50_0.12_250)] text-[oklch(0.85_0.10_250)]"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="text-sm font-medium">Reverse Bias</div>
                <div className="text-xs mt-1 opacity-70">Red (+) → Cathode, Black (−) → Anode</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Multimeter Display */}
        <div className="space-y-4">
          {/* Meter Display */}
          <div className="relative p-6 rounded-xl bg-[oklch(0.08_0.005_200)] border-2 border-[oklch(0.25_0.02_200)] shadow-inner">
            {/* Meter brand label */}
            <div className="text-center mb-1">
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">Digital Multimeter — Diode Test Mode</span>
            </div>
            {/* LCD Display */}
            <div className="bg-[oklch(0.06_0.01_155)] border border-[oklch(0.20_0.03_155)] rounded-lg p-6 text-center mb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedDiode}-${probePosition}-${condition}-${randomCondition}-${quizMode}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-[oklch(0.90_0.15_155)] tracking-wider">
                    {currentReading}
                  </div>
                  <div className="text-xs font-mono text-[oklch(0.60_0.08_155)] mt-2">
                    {currentReading === "OL" ? "OVER LIMIT (open circuit)" : "DIODE TEST"}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Probe indicators */}
            <div className="flex justify-center gap-8 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                <span className="text-muted-foreground">
                  {probePosition === "forward" ? "Anode (A)" : "Cathode (K)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600" />
                <span className="text-muted-foreground">
                  {probePosition === "forward" ? "Cathode (K)" : "Anode (A)"}
                </span>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          {!quizMode && (
            <div className="p-4 rounded-lg border border-border/30 bg-muted/10">
              <h4 className="text-sm font-semibold text-foreground mb-2">Reading Interpretation</h4>
              {condition === "healthy" && probePosition === "forward" && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-[oklch(0.75_0.12_155)] font-medium">Normal forward bias reading.</span> The meter supplies a small test current through the diode junction. The displayed voltage is the forward voltage drop (V<sub>f</sub>) of the semiconductor junction. Silicon PN junctions read 0.5–0.7V; Schottky reads 0.15–0.45V; LEDs read 1.5–3.3V depending on color.
                </p>
              )}
              {condition === "healthy" && probePosition === "reverse" && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-[oklch(0.75_0.12_155)] font-medium">Normal reverse bias reading.</span> {currentDiode.id === "tvs" ? "Bidirectional TVS reads forward voltage in both directions — this is NORMAL (two back-to-back junctions). Do not confuse with a short." : "OL (Over Limit) indicates the diode is blocking reverse current as expected. The junction is intact and the depletion region is preventing current flow."}
                </p>
              )}
              {condition === "shorted" && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-[oklch(0.85_0.15_30)] font-medium">SHORTED — Diode has failed short-circuit.</span> Reading 0.000V in both directions means the junction has been destroyed (typically by overcurrent or voltage spike). The diode now conducts in both directions like a wire. Replace immediately — a shorted diode provides no protection and may allow fault current to damage downstream components.
                </p>
              )}
              {condition === "open" && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-[oklch(0.85_0.12_60)] font-medium">OPEN — Diode has failed open-circuit.</span> Reading OL in both directions means the junction is completely broken. No current flows in either direction. The diode is effectively removed from the circuit. In a flyback application, this means the next time the coil de-energizes, the unprotected voltage spike will damage the driving transistor or PLC output.
                </p>
              )}
            </div>
          )}

          {/* Quiz Answer Section */}
          {quizMode && (
            <div className="p-4 rounded-lg border border-border/30 bg-muted/10">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {quizRevealed ? "Result" : "What is the condition of this diode?"}
              </h4>
              {!quizRevealed ? (
                <div className="flex gap-2">
                  {(["healthy", "shorted", "open"] as DiodeCondition[]).map(c => (
                    <button
                      key={c}
                      onClick={() => submitQuizAnswer(c)}
                      className="flex-1 px-3 py-2 text-sm rounded-md border border-border/50 bg-muted/30 hover:bg-muted/60 text-foreground capitalize transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 ${quizAnswer === randomCondition ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.75_0.15_30)]"}`}>
                    {quizAnswer === randomCondition ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <span className="font-medium">
                      {quizAnswer === randomCondition ? "Correct!" : `Incorrect — the diode is ${randomCondition}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {randomCondition === "healthy" && `Forward: ${currentDiode.forwardVoltage}, Reverse: ${currentDiode.reverseReading}. A healthy diode shows its characteristic forward voltage drop and blocks in reverse.`}
                    {randomCondition === "shorted" && "A shorted diode reads 0.000V in both directions — the junction is destroyed and conducts like a wire."}
                    {randomCondition === "open" && "An open diode reads OL in both directions — the junction is broken and no current flows either way."}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={startQuiz} className="px-3 py-1.5 text-sm bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white rounded-md transition-colors flex items-center gap-1.5">
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProbePosition(p => p === "forward" ? "reverse" : "forward")}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors"
                    >
                      Flip Probes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Reference */}
          <div className="p-3 rounded-lg bg-[oklch(0.10_0.01_200)] border border-border/20">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Reference — Diode Test Mode</h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="text-center p-2 rounded bg-[oklch(0.15_0.03_155)] border border-[oklch(0.25_0.06_155)]">
                <div className="text-[oklch(0.80_0.12_155)] font-bold">0.4–0.7V</div>
                <div className="text-muted-foreground mt-0.5">Healthy (fwd)</div>
              </div>
              <div className="text-center p-2 rounded bg-[oklch(0.15_0.03_30)] border border-[oklch(0.30_0.08_30)]">
                <div className="text-[oklch(0.80_0.15_30)] font-bold">0.000V</div>
                <div className="text-muted-foreground mt-0.5">Shorted</div>
              </div>
              <div className="text-center p-2 rounded bg-[oklch(0.15_0.03_60)] border border-[oklch(0.30_0.08_60)]">
                <div className="text-[oklch(0.80_0.12_60)] font-bold">OL</div>
                <div className="text-muted-foreground mt-0.5">Open (both)</div>
              </div>
            </div>
            <a href="/reference/semiconductor" target="_blank" className="mt-2 block text-center text-[11px] text-[oklch(0.65_0.10_155)] hover:text-[oklch(0.75_0.12_155)] transition-colors underline underline-offset-2">
              View Printable Quick Reference Card →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
