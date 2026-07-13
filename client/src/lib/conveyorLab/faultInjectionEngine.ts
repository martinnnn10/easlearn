import {
  createNormalFieldState,
  type FieldDeviceState,
} from "./fieldDeviceModel";
import type { FaultId } from "./types";

export interface FaultInjectionContext {
  faultId: FaultId;
  productAtPhotoeye: boolean;
  field: FieldDeviceState;
}

/** Apply active fault at the field-device layer */
export function injectFault(ctx: FaultInjectionContext): FieldDeviceState {
  const base = createNormalFieldState();

  switch (ctx.faultId) {
    case "estop_open":
      return { ...base, estopNcClosed: false };
    case "guard_open":
      return { ...base, guardClosed: false };
    case "stop_stuck":
      return { ...base, stopNcClosed: false };
    case "overload_tripped":
      return { ...base, overloadNcClosed: false };
    case "photoeye_stuck_on":
      return { ...base, photoeyeBlocked: true };
    case "photoeye_jam":
      return { ...base, photoeyeBlocked: true };
    case "output_on_motor_dead":
      return { ...base, motorMechanicalOk: false };
    case "normal":
    default:
      // Normal run: I:1/5 stays FALSE — product on belt is visual only, not a jam signal.
      return base;
  }
}

export function getFaultEvidenceIds(faultId: FaultId): string[] {
  switch (faultId) {
    case "estop_open":
      return ["io_estop_true", "rung2_blocked", "motor_off"];
    case "guard_open":
      return ["io_guard_open", "rung2_blocked", "motor_off"];
    case "stop_stuck":
      return ["io_stop_open", "rung2_blocked", "motor_off"];
    case "overload_tripped":
      return ["io_overload_true", "rung4_blocked", "red_light"];
    case "photoeye_stuck_on":
      return ["io_pe_true", "pe_blocked_no_product", "rung4_pe_blocked", "motor_off"];
    case "photoeye_jam":
      return ["io_pe_true", "pe_beam_blocked", "rung4_xio_open", "motor_off"];
    case "output_on_motor_dead":
      return ["motor_output_on", "belt_stopped", "contactor_pulled"];
    default:
      return [];
  }
}

export function describeEvidence(evidenceId: string): string {
  const map: Record<string, string> = {
    io_estop_true: "I:1/2 E-STOP NC reads TRUE (circuit open)",
    io_guard_open: "I:1/3 GUARD NC de-energized (guard door open or interlock switch failed)",
    io_stop_open: "I:1/0 STOP NC de-energized (STOP button stuck or conductor broken)",
    rung2_blocked: "Rung 2 safety interlock blocks SAFE_RUN",
    motor_off: "MOTOR output (O:2/0) remains OFF",
    io_overload_true: "I:1/4 Overload NC reads TRUE (tripped)",
    rung4_blocked: "Rung 4 blocks MOTOR — overload NC open",
    red_light: "RED stack light energized (O:2/2)",
    io_pe_true: "I:1/5 Photoeye reads TRUE with no product present",
    pe_blocked_no_product: "Photoeye beam blocked but belt is empty",
    rung4_pe_blocked: "Rung 4 NC PE CLEAR open — I:1/5 TRUE blocks MOTOR output",
    pe_beam_blocked: "Photoeye beam physically blocked — product or debris in beam path",
    rung4_xio_open: "Rung 4 XIO PE CLEAR open — I:1/5 TRUE (beam blocked) drops MOTOR output",
    motor_output_on: "O:2/0 MOTOR output is ON",
    belt_stopped: "Belt is stopped despite energized output",
    contactor_pulled: "Contactor coil energized but power poles may not transfer",
  };
  return map[evidenceId] ?? evidenceId;
}
