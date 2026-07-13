import { describe, expect, it } from "vitest";
import { buildIluCtaHref, buildTrackAStripItems, getLessonIluStripData } from "./iluLinks";
import { getLessonIluLinks, getLessonUnit } from "./lessonPracticeMap";

describe("iluLinks", () => {
  it("builds Conveyor href with hub attribution and fault scope", () => {
    const links = getLessonIluLinks("plc-fundamentals", "io-troubleshooting", "A");
    const troubleshoot = links.find((l) => l.stage === "troubleshoot")!;
    const href = buildIluCtaHref({
      link: troubleshoot,
      moduleSlug: "plc-fundamentals",
      lessonSlug: "io-troubleshooting",
      hubId: "plc",
    });

    expect(href).toContain("/labs?");
    expect(href).toContain("#conveyor-troubleshoot");
    expect(href).toContain("hub=plc");
    expect(href).toContain("lesson=io-troubleshooting");
    expect(href).toContain("ilu=troubleshoot");
    expect(href).toContain("mode=practice");
    expect(href).toContain("faultScope=photoeye_stuck_on%2Cestop_open");
  });

  it("builds motor controls overload Conveyor link", () => {
    const data = getLessonIluStripData("motors-controls", "overload-protection", {
      isOnLessonPage: true,
    });
    const troubleshoot = data.items.find((i) => i.stage === "troubleshoot");
    expect(troubleshoot?.href).toContain("conveyor-troubleshoot");
    expect(troubleshoot?.href).toContain("faultScope=overload_tripped");
    expect(troubleshoot?.href).toContain("hub=motor_controls");
  });

  it("builds sensor photoelectric Conveyor link", () => {
    const data = getLessonIluStripData("sensors-instrumentation", "proximity-photoelectric", {
      isOnLessonPage: true,
    });
    const troubleshoot = data.items.find((i) => i.stage === "troubleshoot");
    expect(troubleshoot?.targetSlug).toBe("conveyor-plc-lab");
    expect(troubleshoot?.href).toContain("photoeye_stuck_on");
  });

  it("builds print reading ladder learn link", () => {
    const data = getLessonIluStripData("print-reading", "ladder-diagram-conventions", {
      isOnLessonPage: true,
    });
    const troubleshoot = data.items.find((i) => i.stage === "troubleshoot");
    expect(troubleshoot?.href).toContain("mode=learn");
  });

  it("marks VFD benchmark as available troubleshoot link", () => {
    const data = getLessonIluStripData("powerflex-vfd", "fault-codes-diagnostics", {
      isOnLessonPage: true,
    });
    const troubleshoot = data.items.find((i) => i.stage === "troubleshoot");
    expect(troubleshoot?.status).toBe("available");
    expect(troubleshoot?.href).toContain("powerflex-diagnostic");
    expect(troubleshoot?.href).toContain("hub=vfd");
    expect(troubleshoot?.href).toContain("faultScope=overcurrent");
  });

  it("builds VFD common-failures guided link with faultScope", () => {
    const links = getLessonIluLinks("powerflex-vfd", "common-failures", "A");
    const troubleshoot = links.find((l) => l.stage === "troubleshoot")!;
    const href = buildIluCtaHref({
      link: troubleshoot,
      moduleSlug: "powerflex-vfd",
      lessonSlug: "common-failures",
      hubId: "vfd",
    });
    expect(href).toContain("mode=guided");
    expect(href).toContain("faultScope=dc_bus_undervoltage%2Ccooling_fan_seized%2Covercurrent");
    expect(href).toContain("lesson=common-failures");
  });

  it("returns Track A chain with four stages for PLC lesson", () => {
    const items = buildTrackAStripItems(
      getLessonIluLinks("plc-fundamentals", "io-troubleshooting", "A"),
      { moduleSlug: "plc-fundamentals", lessonSlug: "io-troubleshooting", hubId: "plc" },
      { isOnLessonPage: true }
    );
    expect(items.map((i) => i.stage)).toEqual(["lesson", "practice", "troubleshoot", "assess"]);
    expect(items.find((i) => i.stage === "lesson")?.status).toBe("current");
    expect(items.find((i) => i.stage === "practice")?.href).toContain("#multimeter");
  });

  it("does not duplicate mode when route already includes labMode", () => {
    const unit = getLessonUnit("plc-fundamentals", "program-troubleshooting");
    const troubleshoot = unit?.iluLinks.find((l) => l.stage === "troubleshoot")!;
    const href = buildIluCtaHref({
      link: troubleshoot,
      moduleSlug: "plc-fundamentals",
      lessonSlug: "program-troubleshooting",
      hubId: "plc",
    });
    expect((href.match(/mode=/g) ?? []).length).toBe(1);
    expect(href).toContain("mode=guided");
  });

  it("returns mapped false for unknown lesson", () => {
    expect(getLessonIluStripData("unknown-module", "nope").mapped).toBe(false);
  });
});
