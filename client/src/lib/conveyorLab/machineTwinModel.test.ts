import { describe, expect, it } from "vitest";
import { createNormalFieldState } from "./fieldDeviceModel";
import { createInitialPlcState } from "./conveyorProgram";
import { deriveMachineTwin } from "./machineTwinModel";

describe("machineTwinModel", () => {
  it("reflects guard open on machine twin", () => {
    const field = createNormalFieldState();
    field.guardClosed = false;
    const plc = createInitialPlcState();
    const machine = deriveMachineTwin(plc, field, "normal");
    expect(machine.guardOpen).toBe(true);
  });

  it("reflects closed guard when field is healthy", () => {
    const field = createNormalFieldState();
    const plc = createInitialPlcState();
    const machine = deriveMachineTwin(plc, field, "normal");
    expect(machine.guardOpen).toBe(false);
  });
});
