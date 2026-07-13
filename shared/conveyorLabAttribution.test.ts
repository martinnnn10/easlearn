import { describe, expect, it } from "vitest";
import {
  buildAttributionFingerprint,
  getHubBackHref,
  getLessonBackHref,
  getScopedFaultCatalog,
  isFaultInScope,
  isHomepageLabEntry,
  isValidLabMode,
  parseConveyorLabSearchParams,
  parseFaultScope,
  pickInitialFault,
  pickRandomFromScope,
} from "./conveyorLabAttribution";

describe("conveyorLabAttribution", () => {
  it("parses hub, lesson, mode, and faultScope from search params", () => {
    const attr = parseConveyorLabSearchParams(
      "?hub=plc&module=plc-fundamentals&lesson=io-troubleshooting&ilu=troubleshoot&mode=practice&faultScope=estop_open,photoeye_stuck_on"
    );
    expect(attr.hub).toBe("plc");
    expect(attr.module).toBe("plc-fundamentals");
    expect(attr.lesson).toBe("io-troubleshooting");
    expect(attr.ilu).toBe("troubleshoot");
    expect(attr.mode).toBe("practice");
    expect(attr.faultScope).toEqual(["estop_open", "photoeye_stuck_on"]);
  });

  it("ignores invalid mode and normal-only faultScope", () => {
    expect(isValidLabMode("challenge")).toBeUndefined();
    expect(parseFaultScope("normal")).toBeUndefined();
    expect(parseFaultScope("")).toBeUndefined();
  });

  it("builds stable attribution fingerprint", () => {
    const fp = buildAttributionFingerprint({
      hub: "plc",
      module: "plc-fundamentals",
      lesson: "program-troubleshooting",
      ilu: "troubleshoot",
    });
    expect(fp).toBe("plc|plc-fundamentals|program-troubleshooting|troubleshoot");
  });

  it("returns hub and lesson back hrefs", () => {
    expect(getHubBackHref("plc")).toBe("/hubs/plc");
    expect(getLessonBackHref("plc-fundamentals", "io-troubleshooting")).toBe(
      "/courses/plc-fundamentals/io-troubleshooting"
    );
    expect(getLessonBackHref("plc-fundamentals")).toBe("/courses/plc-fundamentals");
  });

  it("limits fault catalog and random picks to faultScope", () => {
    const scope = ["estop_open", "overload_tripped"] as const;
    expect(getScopedFaultCatalog([...scope])).toEqual(["estop_open", "overload_tripped"]);
    expect(isFaultInScope("photoeye_stuck_on", [...scope])).toBe(false);
    expect(isFaultInScope("normal", [...scope])).toBe(true);

    const random = pickRandomFromScope([...scope]);
    expect(scope).toContain(random);

    expect(pickInitialFault("learn", ["estop_open"])).toBe("estop_open");
    expect(pickInitialFault("learn", ["estop_open", "overload_tripped"])).toBe("normal");
    expect(pickInitialFault("practice", ["estop_open"])).toBe("estop_open");
  });

  it("parses homepage entry param for anonymous practice flow", () => {
    const attr = parseConveyorLabSearchParams("?entry=home&mode=practice");
    expect(attr.entry).toBe("home");
    expect(attr.mode).toBe("practice");
    expect(isHomepageLabEntry(attr)).toBe(true);
    expect(isHomepageLabEntry({ ...attr, hub: "plc" })).toBe(false);
  });
});
