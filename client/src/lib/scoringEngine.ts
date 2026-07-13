/**
 * EAS Phase 1 — Rule-Based Troubleshooting Methodology Scoring Engine
 * 
 * Evaluates HOW the technician troubleshoots, not just whether they found the answer.
 * 
 * Eight scoring dimensions:
 * 1. Diagnostic Sequence — Did they follow logical isolation? (gather → prints → measure → analyze → act)
 * 2. Unnecessary Measurements — Penalize random probing without purpose
 * 3. Unsafe Actions — Bypassing safety, wrong meter settings on live circuits
 * 4. Excessive Guessing — Multiple wrong actions before correct
 * 5. Proper Tool Selection — Right tool for the job
 * 6. Logical Isolation — Half-split, upstream-to-downstream approach
 * 7. Hint Usage — Fewer hints = higher methodology score
 * 8. Time Efficiency — Par time per scenario
 */

import type { ScenarioV3, TechRole, ScoringRules } from "@/data/scenariosV3";

// === ACTION LOG ENTRY (matches SimulatorEngineV3) ===

export interface ActionLogEntry {
  timestamp: number;
  type: "measurement" | "action" | "communication" | "hint" | "meter_setting";
  tool?: string;
  meterSetting?: string;
  location?: string;
  terminal?: string;
  reading?: string;
  description: string;
  wasUseful: boolean;
  animation?: string;
}

// === METHODOLOGY SCORE BREAKDOWN ===

export interface MethodologyDimension {
  id: string;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: "excellent" | "good" | "fair" | "poor";
  feedback: string;
  details: string[];
}

export interface MethodologyScore {
  /** Overall methodology percentage (0-100) */
  overallPercentage: number;
  /** Overall letter grade */
  overallGrade: string;
  /** Raw total score */
  totalScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Individual dimension breakdowns */
  dimensions: MethodologyDimension[];
  /** Top-level summary feedback */
  summaryFeedback: string;
  /** Strengths identified */
  strengths: string[];
  /** Areas for improvement */
  improvements: string[];
  /** Methodology tier (replaces simple grade) */
  methodologyTier: "Master Diagnostician" | "Systematic Troubleshooter" | "Developing Technician" | "Needs Methodology Training";
  /** Coaching tips based on weakest areas */
  coachingTips: string[];
}

// === SCORING WEIGHTS (out of 100 total) ===

const DIMENSION_WEIGHTS: Record<string, number> = {
  diagnosticSequence: 20,
  unnecessaryMeasurements: 15,
  unsafeActions: 15,
  excessiveGuessing: 10,
  toolSelection: 10,
  logicalIsolation: 10,
  hintUsage: 10,
  timeEfficiency: 10,
};

// === DIAGNOSTIC SEQUENCE SCORING ===

/**
 * Evaluates whether the user followed a logical diagnostic sequence:
 * 1. Gather information (communications, fault log review)
 * 2. Review prints (electrical drawings)
 * 3. Take measurements (systematic, not random)
 * 4. Analyze findings (checkpoint questions)
 * 5. Take corrective action
 * 
 * Penalizes jumping straight to actions or random measurement without information gathering.
 */
function scoreDiagnosticSequence(actions: ActionLogEntry[], faultsFixed: number, totalFaults: number): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.diagnosticSequence;
  let score = maxScore;
  const details: string[] = [];

  // Categorize actions into phases
  const phases: { type: string; index: number }[] = actions.map((a, i) => {
    if (a.type === "communication") return { type: "gather", index: i };
    if (a.type === "measurement" && a.tool === "prints") return { type: "prints", index: i };
    if (a.type === "meter_setting") return { type: "prepare", index: i };
    if (a.type === "measurement") return { type: "measure", index: i };
    if (a.type === "action") return { type: "act", index: i };
    if (a.type === "hint") return { type: "hint", index: i };
    return { type: "other", index: i };
  });

  // Check if user gathered information before measuring
  const firstMeasurement = phases.find(p => p.type === "measure");
  const firstGather = phases.find(p => p.type === "gather" || p.type === "prints");
  
  if (firstMeasurement && (!firstGather || firstGather.index > firstMeasurement.index)) {
    score -= 6;
    details.push("Started measuring before gathering information or reviewing prints");
  } else if (firstGather) {
    details.push("Good: Gathered information before taking measurements");
  }

  // Check if user took action before sufficient evidence
  const firstAction = phases.find(p => p.type === "act");
  const measurementsBefore = firstAction 
    ? phases.filter(p => p.type === "measure" && p.index < firstAction.index).length 
    : 0;
  
  if (firstAction && measurementsBefore < 2) {
    score -= 8;
    details.push("Took corrective action with insufficient diagnostic evidence");
  } else if (firstAction && measurementsBefore >= 2) {
    details.push("Good: Collected evidence before attempting repairs");
  }

  // Check for systematic progression (not jumping back and forth)
  let phaseJumps = 0;
  const phaseOrder = ["gather", "prints", "prepare", "measure", "act"];
  let lastPhaseIdx = -1;
  for (const p of phases) {
    const idx = phaseOrder.indexOf(p.type);
    if (idx >= 0) {
      if (idx < lastPhaseIdx - 1) phaseJumps++;
      lastPhaseIdx = Math.max(lastPhaseIdx, idx);
    }
  }
  if (phaseJumps > 3) {
    score -= 4;
    details.push("Diagnostic approach was disorganized — jumped between phases frequently");
  } else if (phaseJumps <= 1) {
    details.push("Good: Followed a systematic diagnostic progression");
  }

  // Bonus for completing all faults
  if (faultsFixed === totalFaults && totalFaults > 0) {
    score = Math.min(maxScore, score + 2);
    details.push("All faults identified and resolved");
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "diagnostic_sequence",
    label: "Diagnostic Sequence",
    description: "Did you follow a logical troubleshooting sequence?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85 
      ? "Excellent systematic approach — gathered information, reviewed prints, then measured."
      : pct >= 65 
      ? "Good sequence overall, but some steps were out of order."
      : pct >= 40 
      ? "Diagnostic sequence needs work. Remember: Gather → Review → Measure → Analyze → Act."
      : "Jumped straight to action without proper diagnosis. Always start with information gathering.",
    details,
  };
}

// === UNNECESSARY MEASUREMENTS SCORING ===

function scoreUnnecessaryMeasurements(actions: ActionLogEntry[]): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.unnecessaryMeasurements;
  const measurements = actions.filter(a => a.type === "measurement");
  const useful = measurements.filter(a => a.wasUseful);
  const unnecessary = measurements.length - useful.length;
  const total = measurements.length;

  let score = maxScore;
  const details: string[] = [];

  if (total === 0) {
    details.push("No measurements taken");
    score = 0;
  } else {
    const efficiencyRatio = useful.length / total;
    
    if (efficiencyRatio >= 0.8) {
      details.push(`${useful.length}/${total} measurements were relevant — highly efficient`);
    } else if (efficiencyRatio >= 0.5) {
      score -= Math.round((1 - efficiencyRatio) * maxScore * 0.6);
      details.push(`${unnecessary} unnecessary measurements out of ${total} total`);
    } else {
      score -= Math.round((1 - efficiencyRatio) * maxScore * 0.9);
      details.push(`Only ${useful.length}/${total} measurements were relevant — too much random probing`);
    }

    // Penalize repeated measurements at the same location
    const locationCounts = new Map<string, number>();
    for (const m of measurements) {
      const key = `${m.location}:${m.terminal || ""}`;
      locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
    }
    const repeats = Array.from(locationCounts.values()).filter(c => c > 2).length;
    if (repeats > 0) {
      score -= repeats * 2;
      details.push(`Repeated the same measurement ${repeats} time(s) — indicates uncertainty`);
    }
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "unnecessary_measurements",
    label: "Measurement Efficiency",
    description: "Were your measurements targeted and purposeful?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Highly efficient — every measurement had a purpose."
      : pct >= 65
      ? "Mostly efficient, but some measurements were unnecessary."
      : pct >= 40
      ? "Too many random measurements. Think about what you expect to find before probing."
      : "Excessive random probing. A systematic approach would reduce wasted time significantly.",
    details,
  };
}

// === UNSAFE ACTIONS SCORING ===

function scoreUnsafeActions(actions: ActionLogEntry[], consequenceLog: string[]): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.unsafeActions;
  let score = maxScore;
  const details: string[] = [];

  // Count wrong meter settings (measuring with wrong setting = potential safety issue)
  const wrongSettings = actions.filter(a => 
    a.type === "measurement" && a.reading === "INVALID"
  );
  if (wrongSettings.length > 0) {
    score -= wrongSettings.length * 3;
    details.push(`${wrongSettings.length} wrong meter setting(s) — could damage equipment or cause injury`);
  }

  // Count bypass actions (unsafe category)
  const bypassActions = actions.filter(a => 
    a.type === "action" && a.description.toLowerCase().includes("bypass")
  );
  if (bypassActions.length > 0) {
    score -= bypassActions.length * 5;
    details.push(`${bypassActions.length} safety bypass(es) attempted — never bypass safety systems`);
  }

  // Count incorrect actions that had negative consequences
  const incorrectActions = actions.filter(a => 
    a.type === "action" && !a.wasUseful
  );
  if (incorrectActions.length > 0) {
    score -= incorrectActions.length * 2;
    details.push(`${incorrectActions.length} incorrect action(s) with negative consequences`);
  }

  if (wrongSettings.length === 0 && bypassActions.length === 0 && incorrectActions.length === 0) {
    details.push("No unsafe actions taken — excellent safety awareness");
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "unsafe_actions",
    label: "Safety Awareness",
    description: "Did you avoid unsafe actions and use proper procedures?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Excellent safety record — proper procedures followed throughout."
      : pct >= 65
      ? "Mostly safe, but some meter setting errors or risky actions noted."
      : pct >= 40
      ? "Several safety concerns. Always verify meter settings and never bypass safety systems."
      : "Significant safety violations. In a real plant, this could result in injury or equipment damage.",
    details,
  };
}

// === EXCESSIVE GUESSING SCORING ===

function scoreExcessiveGuessing(actions: ActionLogEntry[], faultsFixed: number): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.excessiveGuessing;
  let score = maxScore;
  const details: string[] = [];

  // Count incorrect corrective actions (guesses)
  const correctiveActions = actions.filter(a => a.type === "action");
  const incorrectGuesses = correctiveActions.filter(a => !a.wasUseful);
  const correctActions = correctiveActions.filter(a => a.wasUseful);

  if (correctiveActions.length === 0) {
    details.push("No corrective actions attempted");
    score = faultsFixed > 0 ? maxScore : 0;
  } else {
    const guessRatio = incorrectGuesses.length / correctiveActions.length;
    
    if (incorrectGuesses.length === 0) {
      details.push("Every corrective action was correct — no guessing");
    } else if (incorrectGuesses.length <= 1) {
      score -= 2;
      details.push("One incorrect attempt before finding the right fix — minor");
    } else if (incorrectGuesses.length <= 3) {
      score -= 5;
      details.push(`${incorrectGuesses.length} incorrect attempts — shows some trial-and-error`);
    } else {
      score -= 8;
      details.push(`${incorrectGuesses.length} incorrect attempts — excessive guessing instead of diagnosis`);
    }

    // Bonus for first-try correct on all faults
    if (incorrectGuesses.length === 0 && correctActions.length >= faultsFixed && faultsFixed > 0) {
      score = Math.min(maxScore, score + 2);
      details.push("Bonus: Fixed all faults on first attempt");
    }
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "excessive_guessing",
    label: "Diagnostic Confidence",
    description: "Did you diagnose before acting, or guess-and-check?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Confident diagnosis — corrective actions were well-informed."
      : pct >= 65
      ? "Mostly confident, but some trial-and-error noted."
      : pct >= 40
      ? "Too much guessing. Gather more evidence before attempting repairs."
      : "Excessive guess-and-check approach. This wastes time and can cause additional damage.",
    details,
  };
}

// === TOOL SELECTION SCORING ===

function scoreToolSelection(actions: ActionLogEntry[], role: TechRole): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.toolSelection;
  let score = maxScore;
  const details: string[] = [];

  const toolUsage = new Map<string, number>();
  for (const a of actions) {
    if (a.tool) {
      toolUsage.set(a.tool, (toolUsage.get(a.tool) || 0) + 1);
    }
  }

  const uniqueTools = toolUsage.size;

  // Reward using multiple tools (shows breadth of approach)
  if (uniqueTools >= 4) {
    details.push("Excellent tool variety — used multiple diagnostic approaches");
  } else if (uniqueTools >= 2) {
    details.push("Good tool selection — used appropriate tools");
  } else if (uniqueTools === 1) {
    score -= 4;
    details.push("Only used one tool — consider using prints, communications, and other tools");
  } else {
    score -= 8;
    details.push("No tools used effectively");
  }

  // Check if multimeter was used (essential for electrical troubleshooting)
  if (!toolUsage.has("multimeter") && actions.some(a => a.type === "measurement")) {
    score -= 3;
    details.push("Did not use multimeter — essential for electrical diagnosis");
  }

  // Check if prints were reviewed (essential for understanding the circuit)
  const usedPrints = actions.some(a => a.tool === "prints" || (a.type === "measurement" && a.tool === "prints"));
  if (!usedPrints) {
    score -= 3;
    details.push("Did not review electrical prints — always check the drawings first");
  } else {
    details.push("Good: Reviewed electrical prints");
  }

  // Role-appropriate tool usage
  if (role === "senior" && !toolUsage.has("plc_terminal")) {
    // Senior techs should check PLC
    score -= 1;
    details.push("Senior tech: Consider using PLC terminal for deeper diagnostics");
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "tool_selection",
    label: "Tool Selection",
    description: "Did you use the right tools for the job?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Excellent tool selection — used the right tools for each diagnostic step."
      : pct >= 65
      ? "Good tool usage, but could expand your diagnostic toolkit."
      : pct >= 40
      ? "Limited tool usage. Use prints, multimeter, and communications together."
      : "Poor tool selection. A systematic approach requires multiple diagnostic tools.",
    details,
  };
}

// === LOGICAL ISOLATION SCORING ===

function scoreLogicalIsolation(actions: ActionLogEntry[], discoveredClues: string[], totalFaults: number): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.logicalIsolation;
  let score = maxScore;
  const details: string[] = [];

  const measurements = actions.filter(a => a.type === "measurement" && a.tool !== "prints");
  const usefulMeasurements = measurements.filter(a => a.wasUseful);

  // Check if measurements were progressive (not random)
  // A good isolation approach shows measurements getting closer to the fault
  const usefulIndices = measurements.map((m, i) => m.wasUseful ? i : -1).filter(i => i >= 0);
  
  if (usefulMeasurements.length === 0 && measurements.length > 0) {
    score -= 8;
    details.push("No useful measurements found — isolation approach was ineffective");
  } else if (measurements.length > 0) {
    // Check if useful measurements came progressively (not all at the end after random probing)
    const avgUsefulPosition = usefulIndices.reduce((a, b) => a + b, 0) / usefulIndices.length;
    const midpoint = measurements.length / 2;
    
    if (avgUsefulPosition <= midpoint * 0.7) {
      details.push("Good: Found key evidence early — efficient isolation");
    } else if (avgUsefulPosition <= midpoint * 1.3) {
      score -= 2;
      details.push("Moderate isolation — key evidence found mid-process");
    } else {
      score -= 5;
      details.push("Key evidence found late — consider a more systematic isolation approach");
    }
  }

  // Check clue discovery rate
  if (discoveredClues.length >= totalFaults) {
    details.push("All fault indicators identified");
  } else if (discoveredClues.length > 0) {
    score -= 2;
    details.push(`Found ${discoveredClues.length} of ${totalFaults} fault indicators`);
  }

  // Check for communication usage (gathering information aids isolation)
  const comms = actions.filter(a => a.type === "communication");
  if (comms.length > 0) {
    details.push("Good: Used communication channels to gather context");
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "logical_isolation",
    label: "Logical Isolation",
    description: "Did you systematically narrow down the fault location?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Excellent isolation technique — systematically narrowed down the fault."
      : pct >= 65
      ? "Decent isolation, but could be more systematic."
      : pct >= 40
      ? "Isolation needs improvement. Try half-split: test the midpoint first, then narrow."
      : "Random approach to fault finding. Learn the half-split method for faster diagnosis.",
    details,
  };
}

// === HINT USAGE SCORING ===

function scoreHintUsage(hintsUsed: number, role: TechRole): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.hintUsage;
  let score = maxScore;
  const details: string[] = [];

  // Adjust expectations by role
  const hintThresholds = {
    new: { free: 3, mild: 5, heavy: 8 },
    experienced: { free: 1, mild: 3, heavy: 5 },
    senior: { free: 0, mild: 1, heavy: 3 },
  };

  const thresholds = hintThresholds[role];

  if (hintsUsed <= thresholds.free) {
    details.push(hintsUsed === 0 ? "No hints used — fully independent diagnosis" : `Only ${hintsUsed} hint(s) — within expectations for ${role} level`);
  } else if (hintsUsed <= thresholds.mild) {
    score -= 3;
    details.push(`${hintsUsed} hints used — slightly above expectations for ${role} level`);
  } else if (hintsUsed <= thresholds.heavy) {
    score -= 6;
    details.push(`${hintsUsed} hints used — heavy reliance on guidance`);
  } else {
    score -= 9;
    details.push(`${hintsUsed} hints used — excessive reliance on hints`);
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "hint_usage",
    label: "Independence",
    description: "How independently did you troubleshoot?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Highly independent — minimal or no hint reliance."
      : pct >= 65
      ? "Good independence, but used more hints than expected for your level."
      : pct >= 40
      ? "Moderate hint dependency. Try to develop your own diagnostic reasoning."
      : "Heavy reliance on hints. Practice building your own troubleshooting logic.",
    details,
  };
}

// === TIME EFFICIENCY SCORING ===

function scoreTimeEfficiency(timeSeconds: number, scenario: ScenarioV3, role: TechRole): MethodologyDimension {
  const maxScore = DIMENSION_WEIGHTS.timeEfficiency;
  let score = maxScore;
  const details: string[] = [];

  const parMinutes = scenario.estimatedMinutes[role];
  const actualMinutes = timeSeconds / 60;
  const ratio = actualMinutes / parMinutes;

  if (ratio <= 0.7) {
    details.push(`Completed in ${actualMinutes.toFixed(1)} min — well under par (${parMinutes} min)`);
    // Bonus for speed (but cap at maxScore)
  } else if (ratio <= 1.0) {
    details.push(`Completed in ${actualMinutes.toFixed(1)} min — within par time (${parMinutes} min)`);
  } else if (ratio <= 1.5) {
    score -= 3;
    details.push(`Completed in ${actualMinutes.toFixed(1)} min — over par (${parMinutes} min)`);
  } else if (ratio <= 2.0) {
    score -= 6;
    details.push(`Completed in ${actualMinutes.toFixed(1)} min — significantly over par (${parMinutes} min)`);
  } else {
    score -= 9;
    details.push(`Completed in ${actualMinutes.toFixed(1)} min — well over par (${parMinutes} min)`);
  }

  score = Math.max(0, Math.min(maxScore, score));
  const pct = Math.round((score / maxScore) * 100);

  return {
    id: "time_efficiency",
    label: "Time Efficiency",
    description: "Did you resolve the issue within a reasonable timeframe?",
    score,
    maxScore,
    percentage: pct,
    grade: pct >= 85 ? "excellent" : pct >= 65 ? "good" : pct >= 40 ? "fair" : "poor",
    feedback: pct >= 85
      ? "Excellent time management — efficient and focused."
      : pct >= 65
      ? "Reasonable time, but could be faster with a more targeted approach."
      : pct >= 40
      ? "Took longer than expected. A systematic approach reduces time."
      : "Significantly over time. Practice the diagnostic sequence to build speed.",
    details,
  };
}

// === MAIN SCORING FUNCTION ===

export interface ScoringInput {
  actions: ActionLogEntry[];
  discoveredClues: string[];
  hintsUsed: number;
  timeSeconds: number;
  faultsFixed: number;
  totalFaults: number;
  role: TechRole;
  scenario: ScenarioV3;
  consequenceLog: string[];
  communicationsUsed: string[];
  /** Play mode affects scoring expectations */
  playMode?: "standard" | "timed" | "guided" | "minimal_hints";
}

export function calculateMethodologyScore(input: ScoringInput): MethodologyScore {
  const {
    actions, discoveredClues, hintsUsed, timeSeconds,
    faultsFixed, totalFaults, role, scenario, consequenceLog,
    playMode = "standard",
  } = input;

  // Calculate each dimension
  const dimensions: MethodologyDimension[] = [
    scoreDiagnosticSequence(actions, faultsFixed, totalFaults),
    scoreUnnecessaryMeasurements(actions),
    scoreUnsafeActions(actions, consequenceLog),
    scoreExcessiveGuessing(actions, faultsFixed),
    scoreToolSelection(actions, role),
    scoreLogicalIsolation(actions, discoveredClues, totalFaults),
    scoreHintUsage(hintsUsed, role),
    scoreTimeEfficiency(timeSeconds, scenario, role),
  ];

  // Apply play mode adjustments
  if (playMode === "guided") {
    // In guided mode, hint usage penalty is reduced (hints are expected)
    const hintDim = dimensions.find(d => d.id === "hint_usage");
    if (hintDim) {
      hintDim.score = Math.min(hintDim.maxScore, hintDim.score + 5);
      hintDim.percentage = Math.round((hintDim.score / hintDim.maxScore) * 100);
      hintDim.feedback = "Guided mode — hints are part of the learning process.";
    }
  } else if (playMode === "minimal_hints") {
    // In minimal hints mode, hint penalty is doubled
    const hintDim = dimensions.find(d => d.id === "hint_usage");
    if (hintDim && hintsUsed > 0) {
      hintDim.score = Math.max(0, hintDim.score - hintsUsed * 2);
      hintDim.percentage = Math.round((hintDim.score / hintDim.maxScore) * 100);
    }
  } else if (playMode === "timed") {
    // In timed mode, time efficiency weight is doubled
    const timeDim = dimensions.find(d => d.id === "time_efficiency");
    if (timeDim) {
      timeDim.maxScore = DIMENSION_WEIGHTS.timeEfficiency * 2;
      // Re-score with higher stakes
      const parMinutes = scenario.estimatedMinutes[role];
      const actualMinutes = timeSeconds / 60;
      const ratio = actualMinutes / parMinutes;
      if (ratio <= 0.7) timeDim.score = timeDim.maxScore;
      else if (ratio <= 1.0) timeDim.score = Math.round(timeDim.maxScore * 0.85);
      else if (ratio <= 1.5) timeDim.score = Math.round(timeDim.maxScore * 0.5);
      else timeDim.score = Math.round(timeDim.maxScore * 0.2);
      timeDim.percentage = Math.round((timeDim.score / timeDim.maxScore) * 100);
    }
  }

  // Calculate totals
  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const maxScore = dimensions.reduce((sum, d) => sum + d.maxScore, 0);
  const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Determine methodology tier
  let methodologyTier: MethodologyScore["methodologyTier"];
  if (overallPercentage >= 85) methodologyTier = "Master Diagnostician";
  else if (overallPercentage >= 65) methodologyTier = "Systematic Troubleshooter";
  else if (overallPercentage >= 40) methodologyTier = "Developing Technician";
  else methodologyTier = "Needs Methodology Training";

  // Determine overall grade
  let overallGrade: string;
  if (overallPercentage >= 95) overallGrade = "A+";
  else if (overallPercentage >= 90) overallGrade = "A";
  else if (overallPercentage >= 85) overallGrade = "A-";
  else if (overallPercentage >= 80) overallGrade = "B+";
  else if (overallPercentage >= 75) overallGrade = "B";
  else if (overallPercentage >= 70) overallGrade = "B-";
  else if (overallPercentage >= 65) overallGrade = "C+";
  else if (overallPercentage >= 60) overallGrade = "C";
  else if (overallPercentage >= 55) overallGrade = "C-";
  else if (overallPercentage >= 50) overallGrade = "D";
  else overallGrade = "F";

  // Identify strengths and improvements
  const sorted = [...dimensions].sort((a, b) => b.percentage - a.percentage);
  const strengths = sorted
    .filter(d => d.percentage >= 75)
    .slice(0, 3)
    .map(d => d.label);
  const improvements = sorted
    .filter(d => d.percentage < 65)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3)
    .map(d => `${d.label}: ${d.feedback}`);

  // Generate summary feedback
  let summaryFeedback: string;
  if (overallPercentage >= 85) {
    summaryFeedback = "Outstanding troubleshooting methodology. You followed a systematic approach, used appropriate tools, and maintained safety awareness throughout.";
  } else if (overallPercentage >= 65) {
    summaryFeedback = "Solid troubleshooting approach with room for improvement. Focus on the areas identified below to elevate your methodology.";
  } else if (overallPercentage >= 40) {
    summaryFeedback = "Your troubleshooting approach needs development. Review the diagnostic sequence: Gather information → Review prints → Take targeted measurements → Analyze → Act.";
  } else {
    summaryFeedback = "Significant methodology gaps identified. Consider reviewing the fundamentals of systematic troubleshooting before attempting advanced scenarios.";
  }

  // Generate coaching tips based on weakest dimensions
  const coachingTips: string[] = [];
  const weakDimensions = [...dimensions].sort((a, b) => a.percentage - b.percentage).slice(0, 3);
  for (const dim of weakDimensions) {
    if (dim.percentage < 60) {
      switch (dim.id) {
        case "diagnostic_sequence":
          coachingTips.push("Practice the 5-step diagnostic sequence: Gather info → Review prints → Measure → Analyze → Act. Resist the urge to jump straight to measurements.");
          break;
        case "unnecessary_measurements":
          coachingTips.push("Before taking any measurement, ask yourself: 'What will this reading tell me?' If you can't answer, skip it and think about what you actually need to know.");
          break;
        case "unsafe_actions":
          coachingTips.push("Always verify lockout/tagout before working on equipment. Never bypass safety circuits, even temporarily. Check your meter setting before probing live circuits.");
          break;
        case "excessive_guessing":
          coachingTips.push("Avoid trial-and-error. Each action should be based on evidence from your measurements. If you're unsure, gather more data before acting.");
          break;
        case "tool_selection":
          coachingTips.push("Match the tool to the task: use a multimeter for voltage/resistance, prints for understanding the circuit, flashlight for physical inspection. Don't default to one tool for everything.");
          break;
        case "logical_isolation":
          coachingTips.push("Use half-split isolation: divide the circuit in half, measure at the midpoint, then focus on the faulty half. This eliminates possibilities faster than checking every component.");
          break;
        case "hint_usage":
          coachingTips.push("Try to work through the problem before requesting hints. Each hint you don't need demonstrates stronger independent diagnostic ability.");
          break;
        case "time_efficiency":
          coachingTips.push("Speed comes from methodology, not rushing. A systematic approach with fewer wasted steps is faster than random probing, even if individual actions take longer.");
          break;
      }
    }
  }

  return {
    overallPercentage,
    overallGrade,
    totalScore,
    maxScore,
    dimensions,
    summaryFeedback,
    strengths,
    improvements,
    methodologyTier,
    coachingTips,
  };
}
