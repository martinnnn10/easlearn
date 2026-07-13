import { describe, expect, it } from "vitest";
import { CONVEYOR_RUNGS, createInitialPlcState } from "./conveyorProgram";
import { createNormalFieldState, fieldStateToPlcInputs } from "./fieldDeviceModel";
import { runScanCycle } from "./plcScanEngine";

describe("fieldDeviceModel — fail-safe (energize-to-run) input mapping", () => {
  it("maps healthy NC safety devices to TRUE (energized) so their XIC contacts pass", () => {
    const field = createNormalFieldState();
    const inputs = fieldStateToPlcInputs(field, { "I:1/1": true });
    expect(inputs["I:1/2"]).toBe(true); // E-STOP healthy
    expect(inputs["I:1/3"]).toBe(true); // GUARD closed
    expect(inputs["I:1/4"]).toBe(true); // OVERLOAD not tripped
    expect(inputs["I:1/0"]).toBe(true); // STOP NC not pressed
  });

  it("de-energizes NC safety inputs to FALSE when the device opens (fail-safe)", () => {
    const field = {
      ...createNormalFieldState(),
      estopNcClosed: false,
      guardClosed: false,
      overloadNcClosed: false,
    };
    const inputs = fieldStateToPlcInputs(field, {});
    expect(inputs["I:1/2"]).toBe(false);
    expect(inputs["I:1/3"]).toBe(false);
    expect(inputs["I:1/4"]).toBe(false);
  });

  it("maps guard open to I:1/3 FALSE (de-energized)", () => {
    const field = createNormalFieldState();
    field.guardClosed = false;
    const inputs = fieldStateToPlcInputs(field, {});
    expect(inputs["I:1/3"]).toBe(false);
  });

  it("energizes STOP input until the operator presses it (NC pushbutton)", () => {
    const field = createNormalFieldState();
    expect(fieldStateToPlcInputs(field, {})["I:1/0"]).toBe(true);
    expect(fieldStateToPlcInputs(field, { "I:1/0": true })["I:1/0"]).toBe(false);
  });

  it("models the photoeye as a dark-operate jam interlock (TRUE when blocked)", () => {
    const clear = fieldStateToPlcInputs(createNormalFieldState(), {});
    expect(clear["I:1/5"]).toBe(false);
    const blocked = fieldStateToPlcInputs({ ...createNormalFieldState(), photoeyeBlocked: true }, {});
    expect(blocked["I:1/5"]).toBe(true);
  });

  it("examines E-STOP and GUARD with XIC instruction on the safety-interlock rung", () => {
    const safeRung = CONVEYOR_RUNGS.find((r) => r.id === "rung-2");
    expect(safeRung?.elements.find((e) => e.address === "I:1/2")?.type).toBe("XIC");
    expect(safeRung?.elements.find((e) => e.address === "I:1/3")?.type).toBe("XIC");
  });

  it("starts, seals in, and reaches SAFE_RUN with a healthy field", () => {
    const field = createNormalFieldState();
    let plc = createInitialPlcState();
    plc.inputs = fieldStateToPlcInputs(field, { "I:1/1": true });
    for (let i = 0; i < 5; i++) plc = runScanCycle(plc);
    expect(plc.internals["B3:0/0"]).toBe(true);
    expect(plc.internals["B3:0/1"]).toBe(true);
  });

  it("drops RUN_CMD, SAFE_RUN and the motor when E-stop is actuated (seal-in breaks)", () => {
    const field = createNormalFieldState();
    let plc = createInitialPlcState();
    plc.inputs = fieldStateToPlcInputs(field, { "I:1/1": true });
    for (let i = 0; i < 5; i++) plc = runScanCycle(plc);
    expect(plc.internals["B3:0/0"]).toBe(true);

    field.estopNcClosed = false;
    plc.inputs = fieldStateToPlcInputs(field, { "I:1/1": false });
    plc = runScanCycle(plc);
    expect(plc.internals["B3:0/0"]).toBe(false);
    expect(plc.internals["B3:0/1"]).toBe(false);
    expect(plc.outputs["O:2/0"]).toBeFalsy();
  });

  it("FAIL-SAFE: a lost E-stop conductor (input 0) also drops the motor", () => {
    // A broken/loose wire de-energizes I:1/2 exactly like a pressed E-stop.
    // Run past the 3 s TON start delay (0.2 s/scan → ~15 scans) so the motor is on.
    const field = createNormalFieldState();
    let plc = createInitialPlcState();
    plc.inputs = fieldStateToPlcInputs(field, { "I:1/1": true });
    for (let i = 0; i < 20; i++) plc = runScanCycle(plc);
    expect(plc.outputs["O:2/0"]).toBe(true);

    plc.inputs = { ...plc.inputs, "I:1/2": false, "I:1/1": false }; // conductor lost
    for (let i = 0; i < 3; i++) plc = runScanCycle(plc);
    expect(plc.outputs["O:2/0"]).toBeFalsy();
  });
});
