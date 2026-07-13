import { describe, expect, it } from "vitest";
import {
  HUB_REGISTRY,
  ILU_LESSON_QUIZ_PASS_PERCENT,
  TRACK_A_ILU_STAGES,
  TRACK_B_ILU_STAGES,
  getHubById,
  getIluLinksForTrack,
  validateHubRegistry,
  validateLessonPracticeMap,
} from "./hubRegistry";
import {
  LESSON_PRACTICE_MAP,
  getLearningPathBySlug,
  getLessonIluLinks,
  getLessonUnit,
  getLessonsForHub,
  getHubDashboardPaths,
} from "./lessonPracticeMap";
import { buildIluCtaHref } from "./iluLinks";

describe("hubRegistry", () => {
  it("validates hub registry without errors", () => {
    const result = validateHubRegistry();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("defines PLC and VFD hubs with benchmark simulators", () => {
    const plc = getHubById("plc");
    const vfd = getHubById("vfd");
    expect(plc?.benchmarkSimulatorId).toBe("conveyor-plc-lab");
    expect(vfd?.benchmarkSimulatorId).toBe("powerflex-diagnostic-lab");
    expect(vfd?.benchmarkStatus).toBe("active");
  });

  it("exposes six hub definitions", () => {
    expect(HUB_REGISTRY).toHaveLength(6);
  });
});

describe("lessonPracticeMap", () => {
  it("validates full lesson practice map without errors", () => {
    const result = validateLessonPracticeMap(LESSON_PRACTICE_MAP);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("maps plc-fundamentals with six lessons", () => {
    const path = getLearningPathBySlug("plc-fundamentals");
    expect(path?.hubId).toBe("plc");
    expect(path?.units).toHaveLength(6);
  });

  it("maps io-troubleshooting to Conveyor benchmark with fault scope", () => {
    const unit = getLessonUnit("plc-fundamentals", "io-troubleshooting");
    expect(unit?.lessonFormat).toBe("cards");
    expect(unit?.trackB.lessonQuiz.passThreshold).toBe(ILU_LESSON_QUIZ_PASS_PERCENT);
    expect(unit?.trackB.knowledgeChecks.gatesProgress).toBe(false);

    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot");
    expect(troubleshoot?.targetSlug).toBe("conveyor-plc-lab");
    expect(troubleshoot?.isBenchmark).toBe(true);
    expect(troubleshoot?.faultScope).toEqual(["photoeye_stuck_on", "estop_open"]);
  });

  it("provides Track A legacy chain: lesson → practice → troubleshoot → assess", () => {
    const links = getLessonIluLinks("plc-fundamentals", "io-troubleshooting", "A");
    const stages = links.map((l) => l.stage);
    expect(stages).toEqual(TRACK_A_ILU_STAGES);
    expect(links[0].stage).toBe("lesson");
    expect(links[0].targetType).toBe("lesson");
  });

  it("provides Track B schema chain with gating quiz", () => {
    const links = getLessonIluLinks("plc-fundamentals", "io-troubleshooting", "B");
    const stages = links.map((l) => l.stage);
    expect(stages).toEqual(TRACK_B_ILU_STAGES);

    const quiz = links.find((l) => l.stage === "lesson_quiz");
    expect(quiz?.gatesProgress).toBe(true);
    expect(quiz?.passThreshold).toBe(80);

    const kc = links.find((l) => l.stage === "knowledge_check");
    expect(kc?.gatesProgress).toBe(false);
  });

  it("includes all hub-aligned and foundational card paths", () => {
    const slugs = LESSON_PRACTICE_MAP.map((p) => p.pathSlug);
    expect(slugs).toEqual([
      "plc-fundamentals",
      "powerflex-vfd",
      "motors-controls",
      "sensors-instrumentation",
      "safety-systems",
      "print-reading",
      "electrical-fundamentals",
      "hvac-fundamentals",
    ]);
  });

  it("links sensors photoelectric lesson to Conveyor photoeye fault", () => {
    const unit = getLessonUnit("sensors-instrumentation", "proximity-photoelectric");
    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot");
    expect(troubleshoot?.faultScope).toEqual(["photoeye_stuck_on"]);
  });

  it("links safety estop lesson to Conveyor estop fault", () => {
    const unit = getLessonUnit("safety-systems", "estop-circuits");
    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot");
    expect(troubleshoot?.faultScope).toEqual(["estop_open"]);
  });

  it("aggregates hub lessons for PLC hub", () => {
    const lessons = getLessonsForHub("plc");
    expect(lessons.length).toBe(6);
  });

  it("getHubDashboardPaths returns plc-fundamentals for PLC hub", () => {
    const paths = getHubDashboardPaths("plc");
    expect(paths).toHaveLength(1);
    expect(paths[0].pathSlug).toBe("plc-fundamentals");
    expect(paths[0].hubId).toBe("plc");
    expect(paths[0].units).toHaveLength(6);
  });

  it("PLC hub registry route is /hubs/plc", () => {
    const plc = getHubById("plc");
    expect(plc?.route).toBe("/hubs/plc");
    expect(plc?.primaryModuleSlugs).toContain("plc-fundamentals");
  });

  it("VFD hub registry route is /hubs/vfd", () => {
    const vfd = getHubById("vfd");
    expect(vfd?.route).toBe("/hubs/vfd");
    expect(vfd?.primaryModuleSlugs).toContain("powerflex-vfd");
    expect(vfd?.benchmarkStatus).toBe("active");
    expect(vfd?.hubLessonOrder?.[0]).toBe("fault-codes-diagnostics");
  });

  it("getHubDashboardPaths returns powerflex-vfd for VFD hub", () => {
    const paths = getHubDashboardPaths("vfd");
    expect(paths).toHaveLength(1);
    expect(paths[0].pathSlug).toBe("powerflex-vfd");
    expect(paths[0].hubId).toBe("vfd");
    expect(paths[0].units).toHaveLength(6);
  });

  it("io-troubleshooting uses card lesson format", () => {
    const unit = getLessonUnit("plc-fundamentals", "io-troubleshooting");
    expect(unit?.lessonFormat).toBe("cards");
    expect(unit?.trackB.cards.estimatedCount).toBe(12);
  });

  it("VFD benchmark troubleshoot ILU is active and clickable", () => {
    const unit = getLessonUnit("powerflex-vfd", "fault-codes-diagnostics");
    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot");
    expect(troubleshoot?.simulatorStatus).toBe("active");
    expect(troubleshoot?.targetSlug).toBe("powerflex-diagnostic-lab");
    const href = buildIluCtaHref({
      link: troubleshoot!,
      moduleSlug: "powerflex-vfd",
      lessonSlug: "fault-codes-diagnostics",
      hubId: "vfd",
    });
    expect(href).toContain("hub=vfd");
    expect(href).toContain("#powerflex-diagnostic");
    expect(href).toContain("mode=practice");
    expect(href).toContain("faultScope=overcurrent%2Cdc_bus_undervoltage%2Ccooling_fan_seized");
    expect(troubleshoot?.faultScope).toEqual([
      "overcurrent",
      "dc_bus_undervoltage",
      "cooling_fan_seized",
    ]);
  });

  it("VFD common-failures guided troubleshoot includes faultScope", () => {
    const unit = getLessonUnit("powerflex-vfd", "common-failures");
    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot");
    expect(troubleshoot?.targetSlug).toBe("powerflex-diagnostic-lab");
    expect(troubleshoot?.labMode).toBe("guided");
    const href = buildIluCtaHref({
      link: troubleshoot!,
      moduleSlug: "powerflex-vfd",
      lessonSlug: "common-failures",
      hubId: "vfd",
    });
    expect(href).toContain("hub=vfd");
    expect(href).toContain("lesson=common-failures");
    expect(href).toContain("mode=guided");
    expect(href).toContain("faultScope=dc_bus_undervoltage%2Ccooling_fan_seized%2Covercurrent");
  });

  it("VFD Parameter Lab CTA preserves hub attribution", () => {
    const unit = getLessonUnit("powerflex-vfd", "powerflex-parameter-groups");
    const practice = unit?.iluLinks.find((l) => l.stage === "practice");
    expect(practice?.targetSlug).toBe("vfd-parameter-lab");
    const href = buildIluCtaHref({
      link: practice!,
      moduleSlug: "powerflex-vfd",
      lessonSlug: "powerflex-parameter-groups",
      hubId: "vfd",
    });
    expect(href).toContain("hub=vfd");
    expect(href).toContain("module=powerflex-vfd");
    expect(href).toContain("lesson=powerflex-parameter-groups");
    expect(href).toContain("ilu=practice");
    expect(href).toContain("#vfd");
  });

  it("PLC benchmark CTA preserves hub, lesson, and ilu query params", () => {
    const unit = getLessonUnit("plc-fundamentals", "program-troubleshooting");
    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot");
    expect(troubleshoot).toBeDefined();
    const href = buildIluCtaHref({
      link: troubleshoot!,
      moduleSlug: "plc-fundamentals",
      lessonSlug: "program-troubleshooting",
      hubId: "plc",
    });
    expect(href).toContain("hub=plc");
    expect(href).toContain("lesson=program-troubleshooting");
    expect(href).toContain("ilu=troubleshoot");
    expect(href).toContain("#conveyor-troubleshoot");
    expect(href).toContain("mode=guided");
  });

  it("PLC I/O V3 scenario link preserves hub attribution from architecture lesson", () => {
    const unit = getLessonUnit("plc-fundamentals", "plc-architecture");
    const troubleshoot = unit?.iluLinks.find(
      (l) => l.stage === "troubleshoot" && l.targetSlug === "plc-io-fault-v3"
    );
    expect(troubleshoot).toBeDefined();
    const href = buildIluCtaHref({
      link: troubleshoot!,
      moduleSlug: "plc-fundamentals",
      lessonSlug: "plc-architecture",
      hubId: "plc",
    });
    expect(href).toContain("hub=plc");
    expect(href).toContain("lesson=plc-architecture");
    expect(href).toContain("ilu=troubleshoot");
  });

  it("every unit includes Track B card and quiz metadata", () => {
    for (const path of LESSON_PRACTICE_MAP) {
      for (const unit of path.units) {
        expect(unit.trackB.cards.estimatedCount).toBeGreaterThanOrEqual(5);
        expect(unit.trackB.lessonQuiz.feedbackRequired).toBe(true);
        expect(unit.trackB.knowledgeChecks.feedbackRequired).toBe(true);

        const trackBLinks = getIluLinksForTrack(unit.iluLinks, "B");
        expect(trackBLinks.some((l) => l.stage === "cards")).toBe(true);
        expect(trackBLinks.some((l) => l.stage === "lesson_quiz")).toBe(true);
      }
    }
  });
});
