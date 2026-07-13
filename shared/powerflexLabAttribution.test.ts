import { describe, expect, it } from "vitest";
import {
  getScopedPowerFlexFaultCatalog,
  parsePowerFlexLabSearchParams,
  pickInitialPowerFlexFault,
} from "./powerflexLabAttribution";

describe("powerflexLabAttribution", () => {
  it("parses VFD hub attribution params", () => {
    const attr = parsePowerFlexLabSearchParams(
      "?hub=vfd&module=powerflex-vfd&lesson=fault-codes-diagnostics&ilu=troubleshoot&mode=practice&faultScope=overcurrent,dc_bus_undervoltage"
    );
    expect(attr.hub).toBe("vfd");
    expect(attr.mode).toBe("practice");
    expect(attr.faultScope).toEqual(["overcurrent", "dc_bus_undervoltage"]);
  });

  it("scopes faults for v1 benchmark", () => {
    expect(getScopedPowerFlexFaultCatalog()).toHaveLength(3);
    expect(pickInitialPowerFlexFault("practice", ["overcurrent"])).toBe("overcurrent");
    expect(pickInitialPowerFlexFault("learn", ["dc_bus_undervoltage"])).toBe("dc_bus_undervoltage");
  });
});
