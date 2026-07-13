/**
 * SimulatorEngineV2 — Immersive Tool-Driven Troubleshooting
 * 
 * Core interaction model:
 * 1. Select role (New/Experienced/Senior)
 * 2. See plant context + fault log
 * 3. Pick a tool from your belt
 * 4. Pick WHERE to use it (measurement locations)
 * 5. Get reading/observation back
 * 6. Repeat until you've found enough clues to advance
 * 7. Senior techs get reasoning checkpoints
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, FileText, Flashlight, Monitor, Zap, Activity,
  Clock, Target, Award, TrendingUp, X, ChevronRight,
  Lightbulb, AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, RotateCcw, Info, HardHat, Wrench,
  Radio, Thermometer, Eye
} from "lucide-react";
import type {
  ScenarioV2, TechRole, ToolId, Tool, MeasurementLocation,
  ToolReading, ScenarioPhase, SeniorCheckpoint, FaultLogEntry,
  GlossaryTerm, CircuitDiagram
} from "@/data/scenariosV2";
import InteractiveCircuitDiagram from "./InteractiveCircuitDiagram";
import GlossaryTooltip from "./GlossaryTooltip";

// === PROPS ===

interface SimulatorEngineV2Props {
  scenario: ScenarioV2;
  onExit: () => void;
  onComplete: (results: SimV2Results) => void;
}

export interface SimV2Results {
  scenarioId: string;
  scenarioTitle: string;
  role: TechRole;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  totalTime: number;
  actionsLog: ActionLogEntry[];
  cluesFound: string[];
  hintsUsed: number;
  efficiency: number; // percentage of actions that were useful
}

interface ActionLogEntry {
  timestamp: number;
  tool: ToolId;
  location: string;
  reading: string;
  wasUseful: boolean;
}

// === HELPERS ===

function getGrade(pct: number): string {
  if (pct >= 95) return "MASTER";
  if (pct >= 85) return "SPECIALIST";
  if (pct >= 70) return "JOURNEYMAN";
  if (pct >= 50) return "APPRENTICE";
  return "TRAINEE";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "MASTER": return "#22c55e";
    case "SPECIALIST": return "#10b981";
    case "JOURNEYMAN": return "#eab308";
    case "APPRENTICE": return "#f97316";
    default: return "#ef4444";
  }
}

const TOOL_ICONS: Record<ToolId, any> = {
  multimeter: Gauge,
  prints: FileText,
  flashlight: Eye,
  plc_terminal: Monitor,
  megger: Zap,
  thermal_camera: Thermometer,
  vibration_pen: Radio,
};

// === COMPONENT ===

export default function SimulatorEngineV2({ scenario, onExit, onComplete }: SimulatorEngineV2Props) {
  // State machine: role_select → briefing → active → debrief
  const [phase, setPhase] = useState<"role_select" | "briefing" | "active" | "debrief">("role_select");
  const [role, setRole] = useState<TechRole | null>(null);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [actionsLog, setActionsLog] = useState<ActionLogEntry[]>([]);
  const [discoveredClues, setDiscoveredClues] = useState<Set<string>>(new Set());
  const [revealedLocations, setRevealedLocations] = useState<Map<string, ToolReading>>(new Map());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showPrints, setShowPrints] = useState(false);
  const [showFaultLog, setShowFaultLog] = useState(false);
  const [timer, setTimer] = useState(0);
  const [seniorAnswer, setSeniorAnswer] = useState<string | null>(null);
  const [seniorFeedback, setSeniorFeedback] = useState<string | null>(null);
  const [checkpointScore, setCheckpointScore] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScenarioPhase = scenario.phases[currentPhaseIdx];

  // Timer
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Lock body scroll when simulator is mounted, unlock on unmount
  useEffect(() => {
    document.body.classList.add('sim-body-locked');
    return () => {
      document.body.classList.remove('sim-body-locked');
    };
  }, []);

  // Available tools based on role
  const availableTools = useMemo(() => {
    if (!role) return [];
    return scenario.tools.filter(t => t.availableFor.includes(role));
  }, [role, scenario.tools]);

  // Check if phase advance conditions are met
  const canAdvance = useMemo(() => {
    if (!currentScenarioPhase) return false;
    return currentScenarioPhase.advanceConditions.some(cond =>
      cond.requiredClues.every(clue => discoveredClues.has(clue))
    );
  }, [currentScenarioPhase, discoveredClues]);

  // Calculate score
  const calculateScore = useCallback(() => {
    const scoring = scenario.scoring;
    let score = 0;
    
    // Clue discovery points
    score += discoveredClues.size * scoring.clueDiscovery;
    
    // Efficiency bonus
    const usefulActions = actionsLog.filter(a => a.wasUseful).length;
    const totalActions = actionsLog.length;
    const efficiency = totalActions > 0 ? usefulActions / totalActions : 0;
    if (efficiency >= 0.7) score += scoring.efficiencyBonus;
    
    // Unnecessary measurement penalty
    const unnecessaryCount = totalActions - usefulActions;
    score -= unnecessaryCount * scoring.unnecessaryMeasurementPenalty;
    
    // Senior checkpoint score
    score += checkpointScore;
    
    // Hint penalty
    score -= hintsUsed * scoring.hintPenalty;
    
    // Time bonuses
    const minutes = timer / 60;
    for (const tb of scoring.timeBonuses) {
      if (minutes <= tb.underMinutes) {
        score += tb.bonus;
        break;
      }
    }
    
    return Math.max(0, Math.min(score, scoring.maxScore));
  }, [discoveredClues, actionsLog, checkpointScore, hintsUsed, timer, scenario.scoring]);

  // Handle tool selection
  const handleToolSelect = (toolId: ToolId) => {
    if (toolId === "prints") {
      setShowPrints(true);
      setSelectedTool(null);
    } else {
      setSelectedTool(toolId);
      setShowPrints(false);
    }
  };

  // Handle measurement at a location
  const handleMeasure = (location: MeasurementLocation) => {
    if (!selectedTool) return;
    
    const reading = location.readings[selectedTool];
    if (!reading) return;
    
    const locationKey = `${location.id}:${selectedTool}`;
    
    // Record the action
    const action: ActionLogEntry = {
      timestamp: timer,
      tool: selectedTool,
      location: location.label,
      reading: `${reading.value} ${reading.unit}`,
      wasUseful: reading.isKeyClue,
    };
    setActionsLog(prev => [...prev, action]);
    
    // Reveal the reading
    setRevealedLocations(prev => new Map(prev).set(locationKey, reading));
    
    // If it's a key clue, add to discovered clues
    if (reading.isKeyClue) {
      setDiscoveredClues(prev => new Set(prev).add(location.id));
    }
    
    // Clear tool selection after measurement
    setSelectedTool(null);
  };

  // Handle phase advance
  const handleAdvancePhase = () => {
    const condition = currentScenarioPhase.advanceConditions.find(cond =>
      cond.requiredClues.every(clue => discoveredClues.has(clue))
    );
    
    if (!condition) return;
    
    setPhaseTransition(condition.transitionText);
    
    setTimeout(() => {
      const nextIdx = scenario.phases.findIndex(p => p.id === condition.nextPhaseId);
      if (nextIdx >= 0) {
        setCurrentPhaseIdx(nextIdx);
        setSelectedTool(null);
        setShowPrints(false);
        setPhaseTransition(null);
      } else {
        // No more phases — scenario complete
        handleComplete();
      }
    }, 3000);
  };

  // Handle scenario completion
  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("debrief");
    
    const score = calculateScore();
    const pct = Math.round((score / scenario.scoring.maxScore) * 100);
    const usefulActions = actionsLog.filter(a => a.wasUseful).length;
    
    onComplete({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      role: role!,
      totalScore: score,
      maxScore: scenario.scoring.maxScore,
      percentage: pct,
      grade: getGrade(pct),
      totalTime: timer,
      actionsLog,
      cluesFound: Array.from(discoveredClues),
      hintsUsed,
      efficiency: actionsLog.length > 0 ? Math.round((usefulActions / actionsLog.length) * 100) : 100,
    });
  };

  // Handle senior checkpoint answer
  const handleSeniorAnswer = (optionId: string) => {
    if (!currentScenarioPhase.seniorCheckpoint) return;
    const option = currentScenarioPhase.seniorCheckpoint.options.find(o => o.id === optionId);
    if (!option) return;
    
    setSeniorAnswer(optionId);
    setSeniorFeedback(option.feedback);
    setCheckpointScore(prev => prev + option.scoreImpact);
  };

  // === RENDER: ROLE SELECT ===
  if (phase === "role_select") {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-8">
            <HardHat className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="font-['Oswald'] text-3xl text-white uppercase tracking-wide mb-2">
              Select Your Experience Level
            </h1>
            <p className="text-gray-400 text-sm">
              This adapts the scenario complexity, available tools, and guidance level.
            </p>
          </div>
          
          <div className="grid gap-4">
            {[
              {
                role: "new" as TechRole,
                title: "New Tech",
                subtitle: "0–2 years experience",
                description: "Full guidance, terminology explanations, visual state diagrams, step-by-step hints available. Fewer tools, more support.",
                color: "border-blue-500/50 hover:border-blue-400",
                badge: "bg-blue-500/20 text-blue-300",
              },
              {
                role: "experienced" as TechRole,
                title: "Experienced Tech",
                subtitle: "3–7 years experience",
                description: "Moderate guidance. All standard tools available. Hints available but cost points. Expected to work methodically without hand-holding.",
                color: "border-amber-500/50 hover:border-amber-400",
                badge: "bg-amber-500/20 text-amber-300",
              },
              {
                role: "senior" as TechRole,
                title: "Senior Tech",
                subtitle: "8+ years experience",
                description: "Minimal guidance. All tools including advanced diagnostics. Reasoning checkpoints test your diagnostic logic. Efficiency heavily weighted.",
                color: "border-emerald-500/50 hover:border-emerald-400",
                badge: "bg-emerald-500/20 text-emerald-300",
              },
            ].map(opt => (
              <button
                key={opt.role}
                onClick={() => { setRole(opt.role); setPhase("briefing"); }}
                className={`text-left p-5 rounded-lg border ${opt.color} bg-[#111] transition-all hover:bg-[#1a1a1a]`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${opt.badge}`}>
                    {opt.subtitle}
                  </span>
                  <h3 className="font-['Oswald'] text-xl text-white uppercase">{opt.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{opt.description}</p>
              </button>
            ))}
          </div>
          
          <button
            onClick={onExit}
            className="mt-6 text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 mx-auto"
          >
            <X className="w-4 h-4" /> Exit Simulator
          </button>
        </motion.div>
      </div>
    );
  }

  // === RENDER: BRIEFING (Plant Context + Fault Log) ===
  if (phase === "briefing") {
    const ctx = scenario.plantContext;
    return (
      <div className="min-h-screen bg-[#0a0f0a] p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Dispatch header */}
          <div className="bg-red-950/30 border border-red-500/40 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="font-['Share_Tech_Mono'] text-red-300 text-sm uppercase">
                Maintenance Dispatch — Priority Call
              </span>
            </div>
            <h1 className="font-['Oswald'] text-2xl md:text-3xl text-white uppercase mb-1">
              {scenario.title}
            </h1>
            <p className="text-gray-300 text-sm">{scenario.description}</p>
          </div>

          {/* Plant context */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#111] border border-gray-800 rounded-lg p-4">
              <h3 className="font-['Share_Tech_Mono'] text-xs text-gray-500 uppercase mb-3">Plant Context</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Line:</span>
                  <span className="text-white font-mono">{ctx.lineName} ({ctx.lineNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shift:</span>
                  <span className="text-white font-mono">{ctx.shift} — {ctx.shiftTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Down Since:</span>
                  <span className="text-red-400 font-mono">{ctx.downSince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Production Rate:</span>
                  <span className="text-white font-mono">{ctx.productionRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost/Minute:</span>
                  <span className="text-red-400 font-mono">{ctx.costPerMinute}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#111] border border-gray-800 rounded-lg p-4">
              <h3 className="font-['Share_Tech_Mono'] text-xs text-gray-500 uppercase mb-3">Impact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs mb-1">Downstream:</span>
                  <span className="text-amber-300">{ctx.downstreamImpact}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-1">Waiting On You:</span>
                  <span className="text-white">{ctx.waitingOn}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PLC Fault Log */}
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-['Share_Tech_Mono'] text-xs text-gray-500 uppercase mb-3">
              PLC Fault Log — Last 5 Entries
            </h3>
            <div className="font-['Share_Tech_Mono'] text-xs space-y-1 overflow-x-auto">
              <div className="grid grid-cols-[140px_80px_80px_1fr] gap-2 text-gray-500 border-b border-gray-800 pb-1 mb-1">
                <span>TIMESTAMP</span>
                <span>SOURCE</span>
                <span>CODE</span>
                <span>DESCRIPTION</span>
              </div>
              {scenario.faultLog.map((entry, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[140px_80px_80px_1fr] gap-2 ${
                    entry.severity === "critical" ? "text-red-400" :
                    entry.severity === "warning" ? "text-amber-400" : "text-gray-400"
                  }`}
                >
                  <span>{entry.timestamp}</span>
                  <span>{entry.source}</span>
                  <span>{entry.code}</span>
                  <span>{entry.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role badge + Start */}
          <div className="flex items-center justify-between">
            <span className="font-['Share_Tech_Mono'] text-xs text-gray-500">
              Role: <span className="text-emerald-400 uppercase">{role}</span> •
              Est. Time: {scenario.estimatedMinutes[role!]} min
            </span>
            <button
              onClick={() => setPhase("active")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-['Oswald'] uppercase tracking-wide flex items-center gap-2 transition-colors"
            >
              Begin Troubleshooting <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // === RENDER: ACTIVE SIMULATION ===
  if (phase === "active" && currentScenarioPhase) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex flex-col">
        {/* Top bar */}
        <div className="bg-[#111] border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="font-['Oswald'] text-white text-sm uppercase hidden md:block">
              {scenario.title}
            </span>
          </div>
          <div className="flex items-center gap-4 font-['Share_Tech_Mono'] text-xs">
            <span className="text-gray-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-emerald-400">
              Clues: {discoveredClues.size}
            </span>
            <span className="text-gray-400">
              Actions: {actionsLog.length}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left panel: Narrative + Locations */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {/* Phase narrative */}
            <div className="mb-6">
              <h2 className="font-['Oswald'] text-xl text-white uppercase mb-2">
                {currentScenarioPhase.title}
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                <GlossaryTooltip text={currentScenarioPhase.narrative} glossary={scenario.glossary} role={role!} />
              </p>
            </div>

            {/* Phase transition overlay */}
            <AnimatePresence>
              {phaseTransition && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-4 mb-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                  <p className="text-emerald-200 text-sm">{phaseTransition}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Measurement locations */}
            {selectedTool && selectedTool !== "prints" && (
              <div className="mb-6">
                <h3 className="font-['Share_Tech_Mono'] text-xs text-gray-500 uppercase mb-3">
                  Where do you want to use your {availableTools.find(t => t.id === selectedTool)?.name}?
                </h3>
                <div className="grid gap-2">
                  {currentScenarioPhase.locations
                    .filter(loc => loc.compatibleTools.includes(selectedTool))
                    .map(loc => {
                      const locationKey = `${loc.id}:${selectedTool}`;
                      const revealed = revealedLocations.get(locationKey);
                      
                      return (
                        <button
                          key={loc.id}
                          onClick={() => !revealed && handleMeasure(loc)}
                          disabled={!!revealed}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            revealed
                              ? revealed.visualEffect === "critical"
                                ? "border-red-500/40 bg-red-950/20"
                                : revealed.visualEffect === "warning"
                                ? "border-amber-500/40 bg-amber-950/20"
                                : revealed.isKeyClue
                                ? "border-emerald-500/40 bg-emerald-950/20"
                                : "border-gray-700 bg-[#111] opacity-60"
                              : "border-gray-700 bg-[#111] hover:border-gray-500 hover:bg-[#1a1a1a] cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-white text-sm font-medium">{loc.label}</span>
                              <span className="text-gray-500 text-xs block">{loc.description}</span>
                            </div>
                            {revealed ? (
                              <div className="text-right">
                                <span className={`font-['Share_Tech_Mono'] text-sm ${
                                  revealed.isKeyClue ? "text-emerald-400" :
                                  revealed.visualEffect === "critical" ? "text-red-400" :
                                  revealed.visualEffect === "warning" ? "text-amber-400" : "text-gray-300"
                                }`}>
                                  {revealed.value} {revealed.unit}
                                </span>
                                {role === "new" && revealed.newTechExplanation && (
                                  <span className="text-blue-300 text-xs block mt-1">
                                    ℹ️ {revealed.newTechExplanation}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Target className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Revealed readings log */}
            {revealedLocations.size > 0 && !selectedTool && (
              <div className="mb-6">
                <h3 className="font-['Share_Tech_Mono'] text-xs text-gray-500 uppercase mb-3">
                  Your Findings
                </h3>
                <div className="space-y-1">
                  {Array.from(revealedLocations.entries()).map(([key, reading]) => {
                    const [locId, toolId] = key.split(":");
                    const loc = currentScenarioPhase.locations.find(l => l.id === locId);
                    const toolName = availableTools.find(t => t.id === toolId)?.name || toolId;
                    return (
                      <div key={key} className={`font-['Share_Tech_Mono'] text-xs p-2 rounded ${
                        reading.isKeyClue ? "bg-emerald-950/30 text-emerald-300" : "bg-[#111] text-gray-400"
                      }`}>
                        <span className="text-gray-500">{loc?.label || locId} ({toolName}):</span>{" "}
                        <span className={reading.visualEffect === "critical" ? "text-red-400" : reading.visualEffect === "warning" ? "text-amber-400" : ""}>
                          {reading.value} {reading.unit}
                        </span>
                        {reading.isKeyClue && " ★"}
                        {reading.interpretation && (
                          <span className="block text-gray-500 mt-0.5 italic">{reading.interpretation}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Senior checkpoint */}
            {role === "senior" && currentScenarioPhase.seniorCheckpoint && (
              <SeniorCheckpointPanel
                checkpoint={currentScenarioPhase.seniorCheckpoint}
                answer={seniorAnswer}
                feedback={seniorFeedback}
                onAnswer={handleSeniorAnswer}
              />
            )}

            {/* Advance button */}
            {canAdvance && !phaseTransition && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <button
                  onClick={handleAdvancePhase}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-['Oswald'] uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
                >
                  Continue Investigation <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Right panel: Tool Belt + Prints */}
          <div className="w-full md:w-80 bg-[#0d0d0d] border-t md:border-t-0 md:border-l border-gray-800 p-4 overflow-y-auto">
            {/* Tool Belt */}
            <h3 className="font-['Share_Tech_Mono'] text-xs text-gray-500 uppercase mb-3">
              Tool Belt
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {availableTools.map(tool => {
                const Icon = TOOL_ICONS[tool.id] || Wrench;
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-950/30"
                        : "border-gray-800 bg-[#111] hover:border-gray-600"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? "text-emerald-400" : "text-gray-400"}`} />
                    <span className={`text-xs block ${isSelected ? "text-emerald-300" : "text-gray-300"}`}>
                      {tool.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Hint button */}
            <button
              onClick={() => { setShowHint(!showHint); if (!showHint) setHintsUsed(h => h + 1); }}
              className="w-full p-2 rounded border border-amber-800/40 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-2 mb-4 hover:bg-amber-950/40 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? "Hide Hint" : `Request Hint (−${scenario.scoring.hintPenalty} pts)`}
            </button>
            
            {showHint && currentScenarioPhase.hints[role!] && (
              <div className="bg-amber-950/20 border border-amber-800/30 rounded p-3 mb-4 text-amber-200 text-xs">
                {currentScenarioPhase.hints[role!]}
              </div>
            )}

            {/* Fault Log quick view */}
            <button
              onClick={() => setShowFaultLog(!showFaultLog)}
              className="w-full p-2 rounded border border-gray-800 bg-[#111] text-gray-300 text-xs flex items-center gap-2 mb-2 hover:bg-[#1a1a1a] transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              {showFaultLog ? "Hide Fault Log" : "View PLC Fault Log"}
            </button>
            
            {showFaultLog && (
              <div className="bg-[#0a0a0a] border border-gray-800 rounded p-2 mb-4 font-['Share_Tech_Mono'] text-[10px] space-y-0.5 overflow-x-auto">
                {scenario.faultLog.map((entry, i) => (
                  <div key={i} className={
                    entry.severity === "critical" ? "text-red-400" :
                    entry.severity === "warning" ? "text-amber-400" : "text-gray-500"
                  }>
                    {entry.timestamp} | {entry.code} | {entry.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prints overlay */}
        <AnimatePresence>
          {showPrints && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            >
              <div className="max-w-4xl w-full max-h-[90vh] overflow-auto bg-[#0d0d0d] border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-['Oswald'] text-white uppercase">Electrical Prints</h3>
                  <button onClick={() => setShowPrints(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <InteractiveCircuitDiagram
                  diagram={scenario.diagram}
                  role={role!}
                  phaseUpdates={currentScenarioPhase.diagramUpdates}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // === RENDER: DEBRIEF ===
  if (phase === "debrief") {
    const score = calculateScore();
    const pct = Math.round((score / scenario.scoring.maxScore) * 100);
    const grade = getGrade(pct);
    const usefulActions = actionsLog.filter(a => a.wasUseful).length;
    const efficiency = actionsLog.length > 0 ? Math.round((usefulActions / actionsLog.length) * 100) : 100;

    return (
      <div className="min-h-screen bg-[#0a0f0a] p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Grade header */}
          <div className="text-center mb-8">
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: getGradeColor(grade) }} />
            <h1 className="font-['Oswald'] text-4xl text-white uppercase mb-1">{grade}</h1>
            <p className="text-gray-400 font-['Share_Tech_Mono'] text-sm">{pct}% — {score}/{scenario.scoring.maxScore} pts</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Time", value: `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`, icon: Clock },
              { label: "Actions", value: actionsLog.length.toString(), icon: Target },
              { label: "Efficiency", value: `${efficiency}%`, icon: TrendingUp },
              { label: "Clues Found", value: discoveredClues.size.toString(), icon: CheckCircle2 },
            ].map(stat => (
              <div key={stat.label} className="bg-[#111] border border-gray-800 rounded-lg p-3 text-center">
                <stat.icon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                <div className="font-['Share_Tech_Mono'] text-white text-lg">{stat.value}</div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Root cause */}
          <div className="bg-[#111] border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="font-['Oswald'] text-white uppercase text-lg mb-3">Root Cause</h3>
            <p className="text-emerald-300 text-sm mb-3">{scenario.rootCause.summary}</p>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">{scenario.rootCause.technicalDetail}</p>
            <h4 className="text-gray-500 text-xs uppercase mb-2">Prevention Steps:</h4>
            <ul className="text-gray-300 text-xs space-y-1">
              {scenario.rootCause.preventionSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Action log */}
          <div className="bg-[#111] border border-gray-800 rounded-lg p-5 mb-6">
            <h3 className="font-['Oswald'] text-white uppercase text-lg mb-3">Your Action Log</h3>
            <div className="space-y-1 font-['Share_Tech_Mono'] text-xs max-h-48 overflow-y-auto">
              {actionsLog.map((action, i) => (
                <div key={i} className={`flex items-center gap-2 p-1 rounded ${
                  action.wasUseful ? "text-emerald-300" : "text-gray-500"
                }`}>
                  <span className="text-gray-600 w-12">
                    {Math.floor(action.timestamp / 60)}:{(action.timestamp % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="w-20">{action.tool}</span>
                  <span className="flex-1">{action.location}: {action.reading}</span>
                  {action.wasUseful && <span className="text-emerald-400">★</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onExit}
              className="flex-1 bg-[#111] border border-gray-700 text-white py-3 rounded-lg font-['Oswald'] uppercase hover:bg-[#1a1a1a] transition-colors"
            >
              Back to Scenarios
            </button>
            <button
              onClick={() => {
                setPhase("role_select");
                setRole(null);
                setCurrentPhaseIdx(0);
                setSelectedTool(null);
                setActionsLog([]);
                setDiscoveredClues(new Set());
                setRevealedLocations(new Map());
                setHintsUsed(0);
                setShowHint(false);
                setShowPrints(false);
                setShowFaultLog(false);
                setTimer(0);
                setSeniorAnswer(null);
                setSeniorFeedback(null);
                setCheckpointScore(0);
                setPhaseTransition(null);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-['Oswald'] uppercase transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

// === SUB-COMPONENTS ===

function SeniorCheckpointPanel({
  checkpoint,
  answer,
  feedback,
  onAnswer,
}: {
  checkpoint: SeniorCheckpoint;
  answer: string | null;
  feedback: string | null;
  onAnswer: (id: string) => void;
}) {
  return (
    <div className="bg-[#111] border border-amber-800/40 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-amber-400" />
        <span className="font-['Share_Tech_Mono'] text-xs text-amber-300 uppercase">
          Reasoning Checkpoint
        </span>
      </div>
      <p className="text-white text-sm mb-3">{checkpoint.question}</p>
      <div className="space-y-2">
        {checkpoint.options.map(opt => {
          const isSelected = answer === opt.id;
          const isCorrect = opt.isCorrect;
          return (
            <button
              key={opt.id}
              onClick={() => !answer && onAnswer(opt.id)}
              disabled={!!answer}
              className={`w-full text-left p-3 rounded border text-sm transition-all ${
                answer
                  ? isSelected
                    ? isCorrect
                      ? "border-emerald-500 bg-emerald-950/30 text-emerald-200"
                      : "border-red-500 bg-red-950/30 text-red-200"
                    : isCorrect
                    ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-300/60"
                    : "border-gray-800 bg-[#0a0a0a] text-gray-600"
                  : "border-gray-700 bg-[#0d0d0d] text-gray-300 hover:border-gray-500 cursor-pointer"
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className="mt-3 p-3 rounded bg-[#0a0a0a] border border-gray-800 text-gray-300 text-xs">
          {feedback}
        </div>
      )}
    </div>
  );
}
