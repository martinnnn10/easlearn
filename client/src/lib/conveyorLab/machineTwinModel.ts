import type { FieldDeviceState } from "./fieldDeviceModel";
import type { FaultId, MachineState, PlcState } from "./types";

export function deriveMachineTwin(
  plc: PlcState,
  field: FieldDeviceState,
  faultId: FaultId,
  productAtPe = false
): MachineState {
  const motorOutput = plc.outputs["O:2/0"] ?? false;
  const greenLight = plc.outputs["O:2/1"] ?? false;
  const redLight = plc.outputs["O:2/2"] ?? false;

  const mechanicalFault = faultId === "output_on_motor_dead" && motorOutput;
  const contactorPulled = motorOutput && field.motorMechanicalOk;
  const beltRunning = contactorPulled;

  const productOnBelt =
    faultId !== "photoeye_stuck_on" && faultId === "normal" && productAtPe;

  return {
    beltRunning,
    motorCoilEnergized: motorOutput,
    contactorPulled,
    photoeyeBlocked: field.photoeyeBlocked,
    estopPressed: !field.estopNcClosed,
    guardOpen: !field.guardClosed,
    overloadTripped: !field.overloadNcClosed,
    productOnBelt,
    mechanicalFault,
    fpm: beltRunning ? 45 : 0,
    greenLight,
    redLight,
    safeRun: plc.internals["B3:0/1"] ?? false,
    runCmd: plc.internals["B3:0/0"] ?? false,
    timerDone: plc.timers["T4:0"]?.done ?? false,
  };
}
