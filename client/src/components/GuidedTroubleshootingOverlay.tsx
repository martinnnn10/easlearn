/**
 * GuidedTroubleshootingOverlay — Step-by-Step Coaching for Fault Diagnosis
 *
 * An optional overlay that coaches new users through their first troubleshooting
 * scenario with progressive hints, contextual guidance, and "what to do next" cards.
 *
 * It reads the current simulator state (phase, discovered clues, selected tool,
 * available actions, etc.) and generates dynamic coaching steps:
 *
 *   1. Gather Information  — talk to operator, check logs
 *   2. Review Prints       — understand the circuit
 *   3. Take Measurements   — use the right tool + setting
 *   4. Analyze Evidence    — interpret what you found
 *   5. Take Action         — fix the fault
 *
 * The overlay never reveals the answer directly; it nudges the learner toward
 * the next productive step.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, ChevronRight, ChevronDown, ChevronUp,
  MessageSquare, FileText, Gauge, Brain, Wrench,
  CheckCircle2, Circle, Lightbulb, X, HelpCircle,
  Eye, EyeOff, Sparkles
} from "lucide-react";
import type {
  ScenarioV3, ScenarioPhase, TechRole, ToolId,
  SystemState, MeasurementLocation
} from "@/data/scenariosV3";

// === TYPES ===

interface GuidedTroubleshootingOverlayProps {
  scenario: ScenarioV3;
  currentPhase: ScenarioPhase;
  role: TechRole;
  discoveredClues: Set<string>;
  revealedMeasurements: Map<string, string>;
  communicationsUsed: Set<string>;
  selectedTool: ToolId | null;
  faultsFixed: number;
  currentSystemState: SystemState | null;
  consequenceLog: string[];
  onClose: () => void;
}

type GuidanceStepId = "gather" | "prints" | "measure" | "analyze" | "action";

interface GuidanceStep {
  id: GuidanceStepId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  /** Dynamic coaching text based on current state */
  coaching: string;
  /** Whether this step is considered complete */
  isComplete: boolean;
  /** Whether this is the currently recommended step */
  isCurrent: boolean;
  /** Specific sub-hints that progressively reveal */
  subHints: string[];
}

// === HELPER: Compute guidance steps from scenario state ===

function computeGuidanceSteps(
  scenario: ScenarioV3,
  phase: ScenarioPhase,
  role: TechRole,
  discoveredClues: Set<string>,
  revealedMeasurements: Map<string, string>,
  communicationsUsed: Set<string>,
  selectedTool: ToolId | null,
  faultsFixed: number,
  currentSystemState: SystemState | null,
  consequenceLog: string[],
): GuidanceStep[] {
  // Scenario-specific hints (if available)
  const sh = scenario.guidedHints;
  const overrides = sh?.coachingOverrides;

  // --- Gather Information ---
  const totalComms = (phase.communications || scenario.communications).length;
  const usefulComms = (phase.communications || scenario.communications).filter(c => c.isUseful);
  const usefulCommsUsed = usefulComms.filter(c => communicationsUsed.has(c.id)).length;
  const gatherComplete = usefulCommsUsed >= Math.min(usefulComms.length, 1); // at least 1 useful comm
  
  const defaultGatherCoaching = communicationsUsed.size === 0
    ? "Before grabbing your tools, talk to the people who were here when it happened. The operator's description often points you in the right direction."
    : usefulCommsUsed < usefulComms.length
      ? `Good start — you've gathered some info. There ${usefulComms.length - usefulCommsUsed === 1 ? "is" : "are"} ${usefulComms.length - usefulCommsUsed} more useful source${usefulComms.length - usefulCommsUsed === 1 ? "" : "s"} to check.`
      : "You've gathered all available information. Time to use what you learned.";
  const gatherCoaching = (communicationsUsed.size === 0 && overrides?.gather) ? overrides.gather : defaultGatherCoaching;

  const gatherSubHints: string[] = [];
  // Use scenario-specific hints first, then fall back to generic
  if (sh?.gather && sh.gather.length > 0) {
    gatherSubHints.push(...sh.gather);
  } else {
    if (communicationsUsed.size === 0) {
      gatherSubHints.push("Look at the Communications panel on the right side.");
      gatherSubHints.push("Start by talking to the operator — they saw what happened.");
    } else if (usefulCommsUsed < usefulComms.length) {
      const unused = usefulComms.filter(c => !communicationsUsed.has(c.id));
      if (unused.length > 0) {
        gatherSubHints.push(`Try checking: ${unused.map(c => c.label).join(", ")}`);
      }
    }
  }

  // --- Review Prints ---
  const hasPrintsClue = Array.from(discoveredClues).some(c => c.includes("prints") || c.includes("print"));
  const hasPrintsReading = Array.from(revealedMeasurements.keys()).some(k => k.includes("prints") || k.includes(":simple"));
  const printsComplete = hasPrintsClue || hasPrintsReading || revealedMeasurements.size >= 2;
  
  const defaultPrintsCoaching = !hasPrintsReading && !hasPrintsClue
    ? "Electrical prints show you the circuit layout — where power comes from, what protects it, and where it goes. Select the Prints tool and check the control panel."
    : "Good — you've reviewed the prints. Use what you learned about the circuit to decide where to measure.";
  const printsCoaching = (!hasPrintsReading && !hasPrintsClue && overrides?.prints) ? overrides.prints : defaultPrintsCoaching;

  const printsSubHints: string[] = [];
  if (sh?.prints && sh.prints.length > 0) {
    printsSubHints.push(...sh.prints);
  } else {
    if (!hasPrintsReading && !hasPrintsClue) {
      printsSubHints.push("Select 'Prints' from the Tool Belt on the right.");
      printsSubHints.push("Then click on the main control panel location.");
    }
  }

  // --- Take Measurements ---
  const keyClueLocations = phase.locations.filter(loc => {
    const hasKeyTerminal = loc.terminalMeasurements?.some(tm => tm.isKeyClue) ?? false;
    const hasKeySimple = Object.values(loc.simpleReadings || {}).some(r => r.isKeyClue);
    return hasKeyTerminal || hasKeySimple;
  });
  const keyCluesFound = Array.from(discoveredClues).filter(c => {
    // Check if this clue corresponds to a key measurement
    return phase.advanceConditions.some(ac => ac.requiredClues.includes(c));
  });
  const measurementsNeeded = phase.advanceConditions[0]?.requiredClues.length ?? 2;
  const measureComplete = keyCluesFound.length >= measurementsNeeded;

  let measureCoaching: string;
  if (revealedMeasurements.size === 0 && overrides?.measure) {
    measureCoaching = overrides.measure;
  } else if (revealedMeasurements.size === 0) {
    measureCoaching = "Time to take some readings. Select the multimeter from the Tool Belt, choose the right setting, and pick a location to measure.";
  } else if (!measureComplete) {
    const remaining = measurementsNeeded - keyCluesFound.length;
    measureCoaching = `You've taken ${revealedMeasurements.size} reading${revealedMeasurements.size !== 1 ? "s" : ""}. You need ${remaining} more key finding${remaining !== 1 ? "s" : ""} to confirm the fault.`;
  } else {
    measureCoaching = "You've found the key evidence. Review your findings and decide what action to take.";
  }

  const measureSubHints: string[] = [];
  if (sh?.measure && sh.measure.length > 0) {
    measureSubHints.push(...sh.measure);
  } else {
    if (revealedMeasurements.size === 0) {
      measureSubHints.push("Select the Multimeter from the Tool Belt.");
      if (role === "new") {
        measureSubHints.push("Choose the right meter setting (V DC for voltage, Ohms for resistance, Continuity for quick checks).");
        measureSubHints.push("Think about where the problem might be based on what you learned from the operator and prints.");
      }
    } else if (!measureComplete) {
      const unvisitedKeyLocations = keyClueLocations.filter(loc => {
        const locClues = phase.advanceConditions.flatMap(ac => ac.requiredClues).filter(c => c.startsWith(loc.id + ":") || c === loc.id);
        return locClues.some(c => !discoveredClues.has(c));
      });
      if (unvisitedKeyLocations.length > 0 && role === "new") {
        measureSubHints.push(`Try measuring at: ${unvisitedKeyLocations.map(l => l.label).join(", ")}`);
      }
      measureSubHints.push("Compare your readings to what you'd expect in a normal circuit.");
    }
  }

  // --- Analyze Evidence ---
  const analyzeComplete = measureComplete;
  
  let analyzeCoaching: string;
  if (revealedMeasurements.size === 0) {
    analyzeCoaching = "You need measurements before you can analyze anything. Take some readings first.";
  } else if (!measureComplete && overrides?.analyze) {
    analyzeCoaching = overrides.analyze;
  } else if (!measureComplete) {
    analyzeCoaching = "Review the readings you've collected so far. What do they tell you? Is there a pattern pointing to a specific component?";
  } else {
    analyzeCoaching = "You have enough evidence. Look at your readings together — they should point to one component or connection as the fault source.";
  }

  const analyzeSubHints: string[] = [];
  if (sh?.analyze && sh.analyze.length > 0) {
    analyzeSubHints.push(...sh.analyze);
  } else {
    if (revealedMeasurements.size > 0 && !measureComplete) {
      analyzeSubHints.push("Check the Evidence Collected panel to review all your readings.");
      if (role === "new") {
        analyzeSubHints.push("Ask yourself: Where is power present? Where is it missing? The fault is between those two points.");
      }
    }
  }

  // --- Take Action ---
  const correctAction = currentSystemState?.availableActions.find(a => a.isCorrect);
  const hasRequiredAction = phase.advanceConditions.some(ac => ac.requiredAction);
  const actionTaken = hasRequiredAction && phase.advanceConditions.some(ac => 
    ac.requiredAction && consequenceLog.includes(ac.requiredAction)
  );
  const actionComplete = actionTaken || faultsFixed > 0;

  let actionCoaching: string;
  if (!measureComplete) {
    actionCoaching = "Don't take action yet — you haven't confirmed the fault. Measure first, then fix.";
  } else if (!actionTaken && overrides?.action) {
    actionCoaching = overrides.action;
  } else if (!actionTaken) {
    actionCoaching = "You've identified the problem. Now take the correct action to fix it. Look at the available actions in the interaction area.";
  } else {
    actionCoaching = "Action taken. Check if the system is restored.";
  }

  const actionSubHints: string[] = [];
  if (sh?.action && sh.action.length > 0) {
    actionSubHints.push(...sh.action);
  } else {
    if (measureComplete && !actionTaken) {
      actionSubHints.push("Scroll down in the main area to find the available actions.");
      if (role === "new" && correctAction) {
        actionSubHints.push("Think about what would fix the specific component you identified as faulty.");
        actionSubHints.push("Read any safety warnings carefully before acting.");
      }
    }
  }

  // --- Determine current step ---
  const steps: GuidanceStep[] = [
    { id: "gather", title: "Gather Information", icon: MessageSquare, description: "Talk to operators, check logs", coaching: gatherCoaching, isComplete: gatherComplete, isCurrent: false, subHints: gatherSubHints },
    { id: "prints", title: "Review Prints", icon: FileText, description: "Understand the circuit layout", coaching: printsCoaching, isComplete: printsComplete, isCurrent: false, subHints: printsSubHints },
    { id: "measure", title: "Take Measurements", icon: Gauge, description: "Use your meter to find the fault", coaching: measureCoaching, isComplete: measureComplete, isCurrent: false, subHints: measureSubHints },
    { id: "analyze", title: "Analyze Evidence", icon: Brain, description: "Interpret your findings", coaching: analyzeCoaching, isComplete: analyzeComplete, isCurrent: false, subHints: analyzeSubHints },
    { id: "action", title: "Take Action", icon: Wrench, description: "Fix the fault", coaching: actionCoaching, isComplete: actionComplete, isCurrent: false, subHints: actionSubHints },
  ];

  // Mark the first incomplete step as current
  const firstIncomplete = steps.findIndex(s => !s.isComplete);
  if (firstIncomplete >= 0) {
    steps[firstIncomplete].isCurrent = true;
  }

  return steps;
}

// === MAIN COMPONENT ===

export default function GuidedTroubleshootingOverlay({
  scenario,
  currentPhase,
  role,
  discoveredClues,
  revealedMeasurements,
  communicationsUsed,
  selectedTool,
  faultsFixed,
  currentSystemState,
  consequenceLog,
  onClose,
}: GuidedTroubleshootingOverlayProps) {
  const [expandedStep, setExpandedStep] = useState<GuidanceStepId | null>(null);
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});
  const [isMinimized, setIsMinimized] = useState(false);

  const steps = useMemo(
    () => computeGuidanceSteps(
      scenario, currentPhase, role, discoveredClues,
      revealedMeasurements, communicationsUsed, selectedTool,
      faultsFixed, currentSystemState, consequenceLog
    ),
    [scenario, currentPhase, role, discoveredClues, revealedMeasurements, communicationsUsed, selectedTool, faultsFixed, currentSystemState, consequenceLog]
  );

  const currentStep = steps.find(s => s.isCurrent);
  const completedCount = steps.filter(s => s.isComplete).length;
  const progressPct = (completedCount / steps.length) * 100;

  // Auto-expand current step
  useEffect(() => {
    if (currentStep && expandedStep !== currentStep.id) {
      setExpandedStep(currentStep.id);
    }
  }, [currentStep?.id]);

  const revealNextHint = useCallback((stepId: string, totalHints: number) => {
    setRevealedHints(prev => {
      const current = prev[stepId] ?? 0;
      if (current >= totalHints) return prev;
      return { ...prev, [stepId]: current + 1 };
    });
  }, []);

  const toggleStep = useCallback((stepId: GuidanceStepId) => {
    setExpandedStep(prev => prev === stepId ? null : stepId);
  }, []);

  if (isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-xl border border-blue-400/30 text-white text-xs font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
      >
        <Compass className="w-4 h-4" />
        <span>Guide Me</span>
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
          {completedCount}/{steps.length}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-3 right-3 z-50 w-[280px] max-w-[calc(100vw-1.5rem)] max-h-[50vh] flex flex-col rounded-xl overflow-hidden border border-blue-500/20 bg-[#0c1220]/95 backdrop-blur-xl shadow-2xl shadow-blue-900/30"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border-b border-blue-500/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Guided Troubleshooting</h3>
              <p className="text-[10px] text-blue-300/60">Step-by-step coaching</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Minimize"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Close guide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] text-blue-300/70 font-mono shrink-0">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
        {steps.map((step) => {
          const Icon = step.icon;
          const isExpanded = expandedStep === step.id;
          const hintsRevealed = revealedHints[step.id] ?? 0;
          const hasMoreHints = hintsRevealed < step.subHints.length;

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-all duration-200 ${
                step.isCurrent
                  ? "border-blue-500/30 bg-blue-500/5"
                  : step.isComplete
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-gray-800/50 bg-white/[1%]"
              }`}
            >
              {/* Step header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  step.isComplete
                    ? "bg-emerald-500/15 border border-emerald-500/30"
                    : step.isCurrent
                      ? "bg-blue-500/15 border border-blue-500/30"
                      : "bg-gray-800/50 border border-gray-700/30"
                }`}>
                  {step.isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${step.isCurrent ? "text-blue-400" : "text-gray-500"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${
                      step.isComplete ? "text-emerald-300" : step.isCurrent ? "text-white" : "text-gray-400"
                    }`}>
                      {step.title}
                    </span>
                    {step.isCurrent && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-[9px] text-blue-300 font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{step.description}</p>
                </div>
                <div className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {/* Main coaching text */}
                      <div className="p-2.5 rounded-lg bg-black/20 border border-gray-800/30">
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          {step.coaching}
                        </p>
                      </div>

                      {/* Progressive sub-hints */}
                      {step.subHints.length > 0 && (
                        <div className="space-y-1.5">
                          {step.subHints.slice(0, hintsRevealed).map((hint, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
                            >
                              <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-[10px] text-amber-200/80 leading-relaxed">{hint}</span>
                            </motion.div>
                          ))}

                          {hasMoreHints && !step.isComplete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                revealNextHint(step.id, step.subHints.length);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-amber-300/70 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 transition-all w-full justify-center"
                            >
                              <HelpCircle className="w-3 h-3" />
                              Need more help? Reveal next hint
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Completion message */}
        {completedCount === steps.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-center"
          >
            <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-emerald-300 font-semibold mb-1">Diagnosis Complete!</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              You've worked through all the diagnostic steps. Click "Continue Investigation" or "Complete Scenario" to finish.
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer tip */}
      <div className="px-4 py-2.5 border-t border-gray-800/30 bg-black/20 shrink-0">
        <p className="text-[9px] text-gray-600 text-center">
          Guided mode does not affect your score. Hints within each step cost no points.
        </p>
      </div>
    </motion.div>
  );
}
