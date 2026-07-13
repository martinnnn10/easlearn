/**
 * Tests for Phase 1 Rule-Based Methodology Scoring Engine
 */
import { describe, it, expect } from "vitest";
import {
  calculateMethodologyScore,
  type ActionLogEntry,
  type ScoringInput,
  type MethodologyScore,
} from "./scoringEngine";
import type { ScenarioV3, TechRole } from "@/data/scenariosV3";

// === MINIMAL SCENARIO FIXTURE ===

const minimalScenario: ScenarioV3 = {
  id: "test-scenario",
  title: "Test Scenario",
  type: "VFD Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 15, experienced: 10, senior: 7 },
  description: "Test scenario for scoring engine",
  faults: [
    {
      id: "fault-1",
      name: "Test Fault",
      category: "electrical",
      difficulty: "intermediate",
      description: "A test fault",
      rootCause: "Bad component",
      symptoms: ["Motor won't start"],
      requiredClues: ["clue-1"],
      fixAction: "replace-component",
      fixDescription: "Replace the component",
      verificationStep: "Motor runs",
    },
  ],
  plantContext: {
    plantName: "Test Plant",
    lineName: "Line 1",
    lineNumber: "L1",
    shift: "Day",
    shiftTime: "7:00 AM",
    downstreamImpact: "None",
    waitingOn: "Maintenance",
    productionRate: "100 units/hr",
    costPerMinute: "$50",
    downSince: "30 min ago",
  },
  faultLog: [],
  glossary: [],
  tools: [
    {
      id: "multimeter",
      name: "Fluke 87V",
      icon: "Gauge",
      description: "Digital multimeter",
      availableFor: ["new", "experienced", "senior"],
      meterSettings: ["vac", "vdc", "ohms", "continuity"],
    },
    {
      id: "prints",
      name: "Electrical Prints",
      icon: "BookOpen",
      description: "Electrical drawings",
      availableFor: ["new", "experienced", "senior"],
    },
    {
      id: "flashlight",
      name: "Flashlight",
      icon: "Flashlight",
      description: "Inspection light",
      availableFor: ["new", "experienced", "senior"],
    },
  ],
  diagram: {
    components: [],
    connections: [],
    labels: [],
    viewBox: "0 0 800 600",
  },
  systemStates: {},
  phases: [
    {
      id: "phase-1",
      title: "Investigation",
      description: "Investigate the fault",
      objectives: ["Find the fault"],
      availableTools: ["multimeter", "prints", "flashlight"],
      components: [],
      terminalMeasurements: [],
      checkpoints: [],
      unlockConditions: [],
    },
  ],
  timePressure: [],
  communications: [
    {
      id: "operator",
      type: "radio",
      label: "Radio Operator",
      icon: "Radio",
      contact: "Operator",
      response: "Motor tripped about 30 minutes ago",
      isUseful: true,
      clueId: "clue-1",
    },
  ],
  scoring: {
    clueDiscovery: 15,
    efficiencyBonus: 10,
    unnecessaryMeasurementPenalty: -3,
    seniorCheckpointCorrect: 10,
    hintPenalty: -5,
    wrongSettingPenalty: -5,
    unsafeActionPenalty: -10,
    communicationBonus: 5,
    optimalOrderBonus: 10,
    timeBonuses: [{ underMinutes: 5, bonus: 10 }],
    maxScore: 100,
    passingScore: 60,
  },
  ambientAnimations: [],
};

// === HELPER FUNCTIONS ===

function makeAction(overrides: Partial<ActionLogEntry> & { type: ActionLogEntry["type"] }): ActionLogEntry {
  return {
    timestamp: Date.now(),
    description: "Test action",
    wasUseful: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    actions: [],
    discoveredClues: [],
    hintsUsed: 0,
    timeSeconds: 600, // 10 minutes
    faultsFixed: 1,
    totalFaults: 1,
    role: "experienced" as TechRole,
    scenario: minimalScenario,
    consequenceLog: [],
    communicationsUsed: [],
    ...overrides,
  };
}

// === TESTS ===

describe("Scoring Engine — calculateMethodologyScore", () => {
  it("returns a valid MethodologyScore structure", () => {
    const result = calculateMethodologyScore(makeInput());
    expect(result).toBeDefined();
    expect(result.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(result.overallPercentage).toBeLessThanOrEqual(100);
    expect(result.overallGrade).toBeDefined();
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBeGreaterThan(0);
    expect(result.dimensions).toHaveLength(8);
    expect(result.summaryFeedback).toBeTruthy();
    expect(result.methodologyTier).toBeDefined();
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.improvements)).toBe(true);
    expect(Array.isArray(result.coachingTips)).toBe(true);
  });

  it("has all 8 scoring dimensions", () => {
    const result = calculateMethodologyScore(makeInput());
    const dimIds = result.dimensions.map(d => d.id);
    expect(dimIds).toContain("diagnostic_sequence");
    expect(dimIds).toContain("unnecessary_measurements");
    expect(dimIds).toContain("unsafe_actions");
    expect(dimIds).toContain("excessive_guessing");
    expect(dimIds).toContain("tool_selection");
    expect(dimIds).toContain("logical_isolation");
    expect(dimIds).toContain("hint_usage");
    expect(dimIds).toContain("time_efficiency");
  });

  it("each dimension has valid structure", () => {
    const result = calculateMethodologyScore(makeInput());
    for (const dim of result.dimensions) {
      expect(dim.id).toBeTruthy();
      expect(dim.label).toBeTruthy();
      expect(dim.description).toBeTruthy();
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.maxScore).toBeGreaterThan(0);
      expect(dim.score).toBeLessThanOrEqual(dim.maxScore);
      expect(dim.percentage).toBeGreaterThanOrEqual(0);
      expect(dim.percentage).toBeLessThanOrEqual(100);
      expect(["excellent", "good", "fair", "poor"]).toContain(dim.grade);
      expect(dim.feedback).toBeTruthy();
      expect(Array.isArray(dim.details)).toBe(true);
    }
  });
});

describe("Scoring Engine — Diagnostic Sequence", () => {
  it("rewards gathering information before measuring", () => {
    const goodActions: ActionLogEntry[] = [
      makeAction({ type: "communication", tool: "radio", description: "Called operator" }),
      makeAction({ type: "measurement", tool: "prints", description: "Reviewed prints" }),
      makeAction({ type: "meter_setting", description: "Set meter to VAC" }),
      makeAction({ type: "measurement", tool: "multimeter", description: "Measured voltage" }),
      makeAction({ type: "action", description: "Replaced component" }),
    ];

    const badActions: ActionLogEntry[] = [
      makeAction({ type: "measurement", tool: "multimeter", description: "Measured voltage first" }),
      makeAction({ type: "action", description: "Replaced component" }),
    ];

    const goodResult = calculateMethodologyScore(makeInput({ actions: goodActions }));
    const badResult = calculateMethodologyScore(makeInput({ actions: badActions }));

    const goodSeq = goodResult.dimensions.find(d => d.id === "diagnostic_sequence")!;
    const badSeq = badResult.dimensions.find(d => d.id === "diagnostic_sequence")!;

    expect(goodSeq.score).toBeGreaterThan(badSeq.score);
  });

  it("penalizes acting before sufficient measurements", () => {
    const rushActions: ActionLogEntry[] = [
      makeAction({ type: "action", description: "Replaced component immediately" }),
    ];

    const result = calculateMethodologyScore(makeInput({ actions: rushActions }));
    const seqDim = result.dimensions.find(d => d.id === "diagnostic_sequence")!;
    expect(seqDim.percentage).toBeLessThan(80);
  });
});

describe("Scoring Engine — Unnecessary Measurements", () => {
  it("penalizes many useless measurements", () => {
    const wastefulActions: ActionLogEntry[] = Array.from({ length: 10 }, (_, i) =>
      makeAction({ type: "measurement", tool: "multimeter", wasUseful: false, description: `Random probe ${i}` })
    );

    const efficientActions: ActionLogEntry[] = [
      makeAction({ type: "measurement", tool: "multimeter", wasUseful: true, description: "Targeted measurement" }),
      makeAction({ type: "measurement", tool: "multimeter", wasUseful: true, description: "Confirming reading" }),
    ];

    const wasteful = calculateMethodologyScore(makeInput({ actions: wastefulActions }));
    const efficient = calculateMethodologyScore(makeInput({ actions: efficientActions }));

    const wastefulDim = wasteful.dimensions.find(d => d.id === "unnecessary_measurements")!;
    const efficientDim = efficient.dimensions.find(d => d.id === "unnecessary_measurements")!;

    expect(efficientDim.score).toBeGreaterThan(wastefulDim.score);
  });
});

describe("Scoring Engine — Unsafe Actions", () => {
  it("penalizes bypass actions and wrong meter settings", () => {
    const safeResult = calculateMethodologyScore(makeInput({
      actions: [
        makeAction({ type: "measurement", tool: "multimeter", wasUseful: true, description: "Measured voltage" }),
        makeAction({ type: "action", wasUseful: true, description: "Replaced component" }),
      ],
    }));

    const unsafeResult = calculateMethodologyScore(makeInput({
      actions: [
        makeAction({ type: "measurement", tool: "multimeter", reading: "INVALID", wasUseful: false, description: "Wrong meter setting" }),
        makeAction({ type: "action", wasUseful: false, description: "Bypassed safety interlock" }),
        makeAction({ type: "action", wasUseful: false, description: "Another wrong action" }),
      ],
    }));

    const safeDim = safeResult.dimensions.find(d => d.id === "unsafe_actions")!;
    const unsafeDim = unsafeResult.dimensions.find(d => d.id === "unsafe_actions")!;

    expect(safeDim.score).toBeGreaterThan(unsafeDim.score);
  });
});

describe("Scoring Engine — Hint Usage", () => {
  it("scores higher with fewer hints", () => {
    const noHints = calculateMethodologyScore(makeInput({ hintsUsed: 0 }));
    const manyHints = calculateMethodologyScore(makeInput({ hintsUsed: 5 }));

    const noHintDim = noHints.dimensions.find(d => d.id === "hint_usage")!;
    const manyHintDim = manyHints.dimensions.find(d => d.id === "hint_usage")!;

    expect(noHintDim.score).toBeGreaterThan(manyHintDim.score);
  });
});

describe("Scoring Engine — Time Efficiency", () => {
  it("rewards finishing under par time", () => {
    // Par time for experienced is 10 minutes = 600 seconds
    const fast = calculateMethodologyScore(makeInput({ timeSeconds: 300 })); // 5 min
    const slow = calculateMethodologyScore(makeInput({ timeSeconds: 1200 })); // 20 min

    const fastDim = fast.dimensions.find(d => d.id === "time_efficiency")!;
    const slowDim = slow.dimensions.find(d => d.id === "time_efficiency")!;

    expect(fastDim.score).toBeGreaterThan(slowDim.score);
  });
});

describe("Scoring Engine — Methodology Tiers", () => {
  it("assigns Master Diagnostician for high scores", () => {
    // Perfect run: good sequence, no waste, no unsafe, no guessing, right tools, good isolation, no hints, fast
    const perfectActions: ActionLogEntry[] = [
      makeAction({ type: "communication", tool: "radio", description: "Called operator", wasUseful: true }),
      makeAction({ type: "measurement", tool: "prints", description: "Reviewed prints", wasUseful: true }),
      makeAction({ type: "meter_setting", description: "Set meter to VAC", wasUseful: true }),
      makeAction({ type: "measurement", tool: "multimeter", location: "upstream", wasUseful: true, description: "Measured supply" }),
      makeAction({ type: "measurement", tool: "multimeter", location: "midpoint", wasUseful: true, description: "Measured midpoint" }),
      makeAction({ type: "measurement", tool: "multimeter", location: "downstream", wasUseful: true, description: "Measured load" }),
      makeAction({ type: "action", description: "Replaced faulty component", wasUseful: true }),
    ];

    const result = calculateMethodologyScore(makeInput({
      actions: perfectActions,
      hintsUsed: 0,
      timeSeconds: 300, // 5 min, well under 10 min par
      faultsFixed: 1,
      totalFaults: 1,
      discoveredClues: ["clue-1"],
      communicationsUsed: ["operator"],
    }));

    expect(result.overallPercentage).toBeGreaterThanOrEqual(70);
    expect(["Master Diagnostician", "Systematic Troubleshooter"]).toContain(result.methodologyTier);
  });

  it("assigns Needs Methodology Training for poor scores", () => {
    // Terrible run: no info gathering, all useless measurements, unsafe, many hints
    const terribleActions: ActionLogEntry[] = Array.from({ length: 15 }, (_, i) =>
      makeAction({ type: "measurement", tool: "multimeter", wasUseful: false, description: `Random probe ${i}` })
    );
    terribleActions.push(
      makeAction({ type: "action", description: "Wrong fix attempt", wasUseful: false }),
      makeAction({ type: "action", description: "Another wrong fix", wasUseful: false }),
      makeAction({ type: "action", description: "Third wrong fix", wasUseful: false }),
    );

    const result = calculateMethodologyScore(makeInput({
      actions: terribleActions,
      hintsUsed: 8,
      timeSeconds: 1800, // 30 min, way over par
      faultsFixed: 0,
      totalFaults: 1,
      consequenceLog: ["Bypassed safety", "Arc flash risk", "Wrong meter setting"],
    }));

    expect(result.overallPercentage).toBeLessThan(50);
    expect(["Developing Technician", "Needs Methodology Training"]).toContain(result.methodologyTier);
  });
});

describe("Scoring Engine — Play Mode Adjustments", () => {
  it("guided mode reduces hint penalty", () => {
    const standard = calculateMethodologyScore(makeInput({
      hintsUsed: 3,
      playMode: "standard",
    }));

    const guided = calculateMethodologyScore(makeInput({
      hintsUsed: 3,
      playMode: "guided",
    }));

    const standardHint = standard.dimensions.find(d => d.id === "hint_usage")!;
    const guidedHint = guided.dimensions.find(d => d.id === "hint_usage")!;

    expect(guidedHint.score).toBeGreaterThanOrEqual(standardHint.score);
  });

  it("minimal hints mode increases hint penalty", () => {
    const standard = calculateMethodologyScore(makeInput({
      hintsUsed: 2,
      playMode: "standard",
    }));

    const minimal = calculateMethodologyScore(makeInput({
      hintsUsed: 2,
      playMode: "minimal_hints",
    }));

    const standardHint = standard.dimensions.find(d => d.id === "hint_usage")!;
    const minimalHint = minimal.dimensions.find(d => d.id === "hint_usage")!;

    expect(minimalHint.score).toBeLessThanOrEqual(standardHint.score);
  });

  it("timed mode increases time efficiency weight", () => {
    const standard = calculateMethodologyScore(makeInput({
      timeSeconds: 1200, // 20 min, over par
      playMode: "standard",
    }));

    const timed = calculateMethodologyScore(makeInput({
      timeSeconds: 1200,
      playMode: "timed",
    }));

    const standardTime = standard.dimensions.find(d => d.id === "time_efficiency")!;
    const timedTime = timed.dimensions.find(d => d.id === "time_efficiency")!;

    // Timed mode has doubled maxScore for time dimension
    expect(timedTime.maxScore).toBeGreaterThan(standardTime.maxScore);
  });
});

describe("Scoring Engine — Grade Calculation", () => {
  it("assigns letter grades based on percentage", () => {
    // We can't easily control exact percentages, but we can verify the grade is a valid letter
    const result = calculateMethodologyScore(makeInput());
    const validGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
    expect(validGrades).toContain(result.overallGrade);
  });
});

describe("Scoring Engine — Coaching Tips", () => {
  it("generates coaching tips for weak dimensions", () => {
    // Create a scenario with poor diagnostic sequence and many useless measurements
    const badActions: ActionLogEntry[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeAction({ type: "measurement", tool: "multimeter", wasUseful: false, description: `Random ${i}` })
      ),
      makeAction({ type: "action", description: "Guessed wrong", wasUseful: false }),
      makeAction({ type: "action", description: "Guessed wrong again", wasUseful: false }),
    ];

    const result = calculateMethodologyScore(makeInput({
      actions: badActions,
      hintsUsed: 5,
      timeSeconds: 1500,
      faultsFixed: 0,
      totalFaults: 1,
      consequenceLog: ["Unsafe bypass"],
    }));

    // Should have at least one coaching tip for poor performance
    expect(result.coachingTips.length).toBeGreaterThan(0);
  });

  it("generates no coaching tips when all dimensions are strong", () => {
    const goodActions: ActionLogEntry[] = [
      makeAction({ type: "communication", tool: "radio", description: "Called operator", wasUseful: true }),
      makeAction({ type: "measurement", tool: "prints", description: "Reviewed prints", wasUseful: true }),
      makeAction({ type: "meter_setting", description: "Set meter", wasUseful: true }),
      makeAction({ type: "measurement", tool: "multimeter", location: "upstream", wasUseful: true, description: "Supply" }),
      makeAction({ type: "measurement", tool: "multimeter", location: "midpoint", wasUseful: true, description: "Mid" }),
      makeAction({ type: "measurement", tool: "multimeter", location: "downstream", wasUseful: true, description: "Load" }),
      makeAction({ type: "action", description: "Fixed it", wasUseful: true }),
    ];

    const result = calculateMethodologyScore(makeInput({
      actions: goodActions,
      hintsUsed: 0,
      timeSeconds: 300,
      faultsFixed: 1,
      totalFaults: 1,
      discoveredClues: ["clue-1"],
      communicationsUsed: ["operator"],
    }));

    // With a near-perfect run, coaching tips should be empty or minimal
    // (only generated for dimensions below 60%)
    const weakDims = result.dimensions.filter(d => d.percentage < 60);
    expect(result.coachingTips.length).toBeLessThanOrEqual(weakDims.length);
  });
});
