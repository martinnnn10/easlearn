import type { FaultId } from "./types";

/** Field-layer device state — faults inject here before PLC scan sees inputs */
export interface FieldDeviceState {
  estopNcClosed: boolean;
  stopNcClosed: boolean;
  overloadNcClosed: boolean;
  photoeyeBlocked: boolean;
  contactorPulled: boolean;
  motorMechanicalOk: boolean;
  guardClosed: boolean;
}

export function createNormalFieldState(): FieldDeviceState {
  return {
    estopNcClosed: true,
    stopNcClosed: true,
    overloadNcClosed: true,
    photoeyeBlocked: false,
    contactorPulled: false,
    motorMechanicalOk: true,
    guardClosed: true,
  };
}

/**
 * Map field devices to PLC digital input addresses.
 *
 * FAIL-SAFE (energize-to-run) convention — matches real NFPA 79 / Allen-Bradley
 * motor control: healthy NC safety contacts (STOP, E-STOP, GUARD, OVERLOAD) keep
 * their PLC input ENERGIZED (TRUE) and are examined XIC in the ladder. A pressed
 * device or a broken/loose conductor de-energizes the input (FALSE) and drops the
 * motor — the safe failure mode. On the real line the I/O monitor shows these
 * inputs = 1 when healthy, 0 when actuated.
 *
 * STOP is an NC pushbutton: input TRUE until pressed. START is an NO pushbutton:
 * input TRUE only while pressed. The photoeye is a dark-operate JAM interlock
 * (process interlock, not a safety contact): input TRUE when the beam is blocked.
 */
export function fieldStateToPlcInputs(
  field: FieldDeviceState,
  operatorInputs: Record<string, boolean>
): Record<string, boolean> {
  return {
    "I:1/0": field.stopNcClosed && !(operatorInputs["I:1/0"] ?? false), // STOP NC — energized when healthy AND not pressed
    "I:1/1": operatorInputs["I:1/1"] ?? false, // START NO — energized while pressed
    "I:1/2": field.estopNcClosed, // E-STOP NC — energized when healthy
    "I:1/3": field.guardClosed, // GUARD NC — energized when closed
    "I:1/4": field.overloadNcClosed, // OVERLOAD NC — energized when not tripped
    "I:1/5": field.photoeyeBlocked, // PHOTOEYE — dark-operate jam interlock
  };
}

export function applyOperatorReset(
  field: FieldDeviceState,
  faultId: FaultId,
  reset: "estop" | "overload"
): { field: FieldDeviceState; faultCleared: boolean } {
  const next = { ...field };
  let faultCleared = false;

  if (reset === "estop") {
    next.estopNcClosed = true;
    if (faultId === "estop_open") faultCleared = true;
  }
  if (reset === "overload") {
    next.overloadNcClosed = true;
    if (faultId === "overload_tripped") faultCleared = true;
  }

  return { field: next, faultCleared };
}
